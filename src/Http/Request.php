<?php
declare(strict_types=1);

namespace SilentSpirits\ItemCreator\Http;

use JsonException;

final class Request
{
    /**
     * @param string[] $segments decoded, non-empty path segments
     * @param array<string, mixed> $query
     */
    public function __construct(
        public string $method,
        public array $segments,
        public array $query,
        private string $rawBody
    ) {
    }

    public static function fromGlobals(): self
    {
        $path = (string) parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
        $segments = array_values(array_filter(
            array_map('rawurldecode', explode('/', $path)),
            static fn (string $s): bool => $s !== ''
        ));

        return new self(
            strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET'),
            $segments,
            $_GET,
            (string) file_get_contents('php://input')
        );
    }

    /** Case-insensitive query lookup, since ASP.NET model binding ignored case. */
    public function queryParam(string $name): ?string
    {
        foreach ($this->query as $key => $value) {
            if (strcasecmp((string) $key, $name) === 0 && is_string($value)) {
                return $value;
            }
        }
        return null;
    }

    /**
     * The item JSON for write/export endpoints. The C# API took it as a query
     * string parameter; a JSON request body is preferred here, with the query
     * parameter still accepted so existing callers keep working.
     *
     * @return array<mixed>
     */
    public function jsonPayload(string $queryName): array
    {
        $json = trim($this->rawBody) !== '' ? $this->rawBody : $this->queryParam($queryName);
        if ($json === null || trim($json) === '') {
            throw HttpException::badRequest("Missing item JSON (send it as the request body or the '$queryName' parameter).");
        }

        try {
            $data = json_decode($json, true, 64, JSON_THROW_ON_ERROR);
        } catch (JsonException $e) {
            throw HttpException::badRequest('Invalid JSON: ' . $e->getMessage());
        }

        if (!is_array($data)) {
            throw HttpException::badRequest('Item JSON must be an object.');
        }
        return $data;
    }
}
