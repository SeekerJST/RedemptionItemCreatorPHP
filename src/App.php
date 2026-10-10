<?php
declare(strict_types=1);

namespace SilentSpirits\ItemCreator;

use PDO;
use PDOException;
use SilentSpirits\ItemCreator\Auth\GoogleSignIn;
use SilentSpirits\ItemCreator\Auth\Mailer;
use SilentSpirits\ItemCreator\Auth\Session;
use SilentSpirits\ItemCreator\Auth\UserRepository;
use SilentSpirits\ItemCreator\Controller\AuthController;
use SilentSpirits\ItemCreator\Controller\ItemCreatorController;
use SilentSpirits\ItemCreator\Export\ItemPdfExporter;
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

    /**
     * @param array<string, mixed> $config
     * @param string $root the project root (src/, lib/, config/, and Fonts/ live here)
     */
    private function __construct(private array $config, private string $root)
    {
    }

    public static function run(string $root): void
    {
        $debug = false;
        try {
            $config = self::loadConfig($root);
            $debug = (bool) ($config['debug'] ?? false);
            $response = (new self($config, $root))->handle(Request::fromGlobals());
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

        // Accounts live under .../itemcreator/auth/{action}; everything else is the item API.
        if ($action === 'auth') {
            $sub = strtolower($rest[0] ?? '');
            $route = AuthController::ROUTES[$sub] ?? null;
            $rest = array_slice($rest, 1);
            $target = fn (): object => $this->auth();
            $label = "auth/$sub";
        } else {
            $route = ItemCreatorController::ROUTES[$action] ?? null;
            $target = fn (): object => $this->controller();
            $label = $segments[$start + 1];
        }
        if ($route === null) {
            throw HttpException::notFound("Unknown action '$label'.");
        }

        [$methods, $handler] = $route;
        $methods = (array) $methods;
        $method = $request->method === 'HEAD' ? 'GET' : $request->method; // web server drops HEAD bodies
        if (!in_array($method, $methods, true)) {
            throw HttpException::methodNotAllowed($methods);
        }

        // Cross-site request forgery: a request that changes something must carry the
        // X-SSGS-Request header. Another site can make the browser send a form here (with the
        // session cookie), but it can't add a custom header without a CORS preflight, which
        // this API never allows.
        if ($method !== 'GET' && $request->header('X-SSGS-Request') === null) {
            throw HttpException::forbidden('Missing the X-SSGS-Request header (required on requests that change something).');
        }

        return $target()->$handler($request, ...$rest);
    }

    private ?PDO $pdo = null;
    private ?Session $session = null;
    private ?AuthController $auth = null;

    private function db(): PDO
    {
        // Connect lazily: routing errors (404/405) shouldn't need a database.
        return $this->pdo ??= Database::connect($this->config['db']);
    }

    private function auth(): AuthController
    {
        $root = $this->root;
        $mail = (array) ($this->config['mail'] ?? []);
        $appUrl = (string) ($this->config['app_url'] ?? '/');
        return $this->auth ??= new AuthController(
            fn (): UserRepository => new UserRepository($this->db()),
            $this->session ??= new Session((array) ($this->config['session'] ?? [])),
            static fn (): Mailer => new Mailer($mail, $root),
            $appUrl,
            // The redirect URI registered with Google: the client's address plus the API path.
            new GoogleSignIn((array) ($this->config['google'] ?? []), rtrim($appUrl, '/') . '/itemcreator/auth/google/callback')
        );
    }

    private function controller(): ItemCreatorController
    {
        $lookups = fn (): LookupRepository => new LookupRepository($this->db());

        $root = $this->root;
        return new ItemCreatorController(
            $lookups,
            fn (): ItemRepository => new ItemRepository($this->db(), $lookups()),
            // allow_writes: the site-wide switch for saving items (false = read-only, e.g. during
            // maintenance). With it on, saving still takes a signed-in, verified account.
            (bool) ($this->config['allow_writes'] ?? false),
            static fn (): ItemPdfExporter => new ItemPdfExporter($root),
            $this->auth()
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
