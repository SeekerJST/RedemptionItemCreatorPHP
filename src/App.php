<?php
declare(strict_types=1);

namespace SilentSpirits\ItemCreator;

use PDO;
use PDOException;
use SilentSpirits\ItemCreator\Controller\ItemCreatorController;
use SilentSpirits\ItemCreator\Http\HttpException;
use SilentSpirits\ItemCreator\Http\Request;
use SilentSpirits\ItemCreator\Http\Response;
use SilentSpirits\ItemCreator\Repository\ItemRepository;
use SilentSpirits\ItemCreator\Repository\LookupRepository;
use Throwable;

/** Front controller: load config, route /itemcreator/{action}/..., send the response. */
final class App
{
    private const CONTROLLER_SEGMENT = 'itemcreator';

    /** @param array<string, mixed> $config */
    private function __construct(private array $config)
    {
    }

    public static function run(string $root): void
    {
        $debug = false;
        try {
            $config = self::loadConfig($root);
            $debug = (bool) ($config['debug'] ?? false);
            $response = (new self($config))->handle(Request::fromGlobals());
        } catch (HttpException $e) {
            $response = Response::problem($e->getStatus(), $e->getTitle(), $e->getMessage())
                ->withHeaders($e->getHeaders());
        } catch (Throwable $e) {
            error_log('[itemcreator] ' . $e);
            // Never leak SQL or credentials to the public; show details only in debug.
            $detail = $debug ? get_class($e) . ': ' . $e->getMessage() : 'An error occurred while processing the request.';
            $title = $e instanceof PDOException ? 'Database Error' : 'Internal Server Error';
            $response = Response::problem(500, $title, $detail);
        }

        $response->send();
    }

    private function handle(Request $request): Response
    {
        // Find ".../itemcreator/{action}/..." anywhere in the path, so the app
        // works from a subfolder (e.g. silentspiritsgames.com/tools/itemcreator/...).
        $segments = $request->segments;
        $start = null;
        foreach ($segments as $i => $segment) {
            if (strcasecmp($segment, self::CONTROLLER_SEGMENT) === 0) {
                $start = $i;
            }
        }
        if ($start === null || !isset($segments[$start + 1])) {
            throw HttpException::notFound('Unknown API route.');
        }

        $action = strtolower($segments[$start + 1]);
        $rest = array_slice($segments, $start + 2);

        $route = ItemCreatorController::ROUTES[$action] ?? null;
        if ($route === null) {
            throw HttpException::notFound("Unknown action '{$segments[$start + 1]}'.");
        }

        [$methods, $handler] = $route;
        $methods = (array) $methods;
        $method = $request->method === 'HEAD' ? 'GET' : $request->method; // web server drops HEAD bodies
        if (!in_array($method, $methods, true)) {
            throw HttpException::methodNotAllowed($methods);
        }

        return $this->controller()->$handler($request, ...$rest);
    }

    private function controller(): ItemCreatorController
    {
        // Connect lazily: routing errors (404/405) shouldn't need a database.
        $pdo = null;
        $db = function () use (&$pdo): PDO {
            return $pdo ??= Database::connect($this->config['db']);
        };
        $lookups = static fn (): LookupRepository => new LookupRepository($db());

        return new ItemCreatorController(
            $lookups,
            static fn (): ItemRepository => new ItemRepository($db(), $lookups()),
            (bool) ($this->config['allow_writes'] ?? false)
        );
    }

    /** @return array<string, mixed> */
    private static function loadConfig(string $root): array
    {
        $file = $root . '/config/config.php';
        if (!is_file($file)) {
            throw new \RuntimeException("Missing $file. Copy config/config.example.php to config/config.php and fill it in.");
        }

        $config = require $file;
        if (!is_array($config) || !isset($config['db']) || !is_array($config['db'])) {
            throw new \RuntimeException('config/config.php must return an array with a "db" section.');
        }
        return $config;
    }
}
