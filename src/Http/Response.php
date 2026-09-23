<?php
declare(strict_types=1);

namespace SilentSpirits\ItemCreator\Http;

final class Response
{
    private const JSON_FLAGS = JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR;

    /** @param array<string, string> $headers */
    private function __construct(
        private int $status,
        private string $body,
        private array $headers
    ) {
    }

    /** @param mixed $data */
    public static function json($data, int $status = 200): self
    {
        return new self($status, json_encode($data, self::JSON_FLAGS), [
            'Content-Type' => 'application/json; charset=utf-8',
        ]);
    }

    /** RFC 7807 body, the same shape ASP.NET's Problem() returns. */
    public static function problem(int $status, string $title, string $detail = ''): self
    {
        $body = ['type' => 'about:blank', 'title' => $title, 'status' => $status];
        if ($detail !== '') {
            $body['detail'] = $detail;
        }

        return new self($status, json_encode($body, self::JSON_FLAGS), [
            'Content-Type' => 'application/problem+json; charset=utf-8',
        ]);
    }

    public static function noContent(): self
    {
        return new self(204, '', []);
    }

    public static function download(string $content, string $contentType, string $filename): self
    {
        // ASCII fallback plus RFC 5987 filename* so non-ASCII item names survive.
        $ascii = preg_replace('/[^A-Za-z0-9 ._()-]/', '_', $filename) ?: 'download';

        return new self(200, $content, [
            'Content-Type' => $contentType,
            'Content-Disposition' => sprintf('attachment; filename="%s"; filename*=UTF-8\'\'%s', $ascii, rawurlencode($filename)),
        ]);
    }

    public function withHeaders(array $headers): self
    {
        $copy = clone $this;
        $copy->headers = $headers + $copy->headers;
        return $copy;
    }

    public function send(): void
    {
        http_response_code($this->status);
        header('X-Content-Type-Options: nosniff');
        foreach ($this->headers as $name => $value) {
            header("$name: $value");
        }
        if ($this->status !== 204) {
            echo $this->body;
        }
    }
}
