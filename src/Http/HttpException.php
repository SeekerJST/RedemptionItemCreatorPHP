<?php
declare(strict_types=1);

namespace SilentSpirits\ItemCreator\Http;

use RuntimeException;

/**
 * Thrown anywhere in the request pipeline to short-circuit with an HTTP error.
 * App turns it into an RFC 7807 problem response, matching what ASP.NET's
 * Problem()/BadRequest() produced in the original C# API.
 */
final class HttpException extends RuntimeException
{
    /** @param array<string, string> $headers */
    public function __construct(
        private int $status,
        private string $title,
        string $detail = '',
        private array $headers = []
    ) {
        parent::__construct($detail);
    }

    public static function badRequest(string $detail): self
    {
        return new self(400, 'Bad Request', $detail);
    }

    public static function forbidden(string $detail): self
    {
        return new self(403, 'Forbidden', $detail);
    }

    public static function notFound(string $detail): self
    {
        return new self(404, 'Not Found', $detail);
    }

    /** @param string[] $allowed */
    public static function methodNotAllowed(array $allowed): self
    {
        return new self(405, 'Method Not Allowed', 'Allowed: ' . implode(', ', $allowed), ['Allow' => implode(', ', $allowed)]);
    }

    public function getStatus(): int
    {
        return $this->status;
    }

    public function getTitle(): string
    {
        return $this->title;
    }

    /** @return array<string, string> */
    public function getHeaders(): array
    {
        return $this->headers;
    }
}
