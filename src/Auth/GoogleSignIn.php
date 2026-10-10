<?php
declare(strict_types=1);

namespace SilentSpirits\ItemCreator\Auth;

/**
 * Sign in with Google: the OAuth 2.0 authorization-code flow with OpenID Connect, done on the
 * server. authorizationUrl() sends the browser to Google; Google sends it back to the callback
 * with a code, which identity() exchanges for the account's ID token.
 *
 * The flow is protected three ways: `state` (the callback belongs to a sign-in this browser
 * started), PKCE (a stolen code is useless without the verifier kept in this session), and the
 * token's `nonce` (the ID token was issued for this sign-in). The ID token comes straight from
 * Google's token endpoint over TLS, so its claims are trusted without checking its signature
 * (OpenID Connect Core §3.1.3.7); its issuer, audience, expiry and nonce are still checked.
 */
final class GoogleSignIn
{
    private const AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
    private const TOKEN_URL = 'https://oauth2.googleapis.com/token';
    private const ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];

    /** @param array{client_id?: string, client_secret?: string} $config */
    public function __construct(private array $config, private string $redirectUri)
    {
    }

    /** False when config.php has no Google client: the sign-in button is hidden. */
    public function enabled(): bool
    {
        return ($this->config['client_id'] ?? '') !== '' && ($this->config['client_secret'] ?? '') !== '';
    }

    /**
     * Where to send the browser, and the one-time values to keep in the session until it returns.
     *
     * @return array{url: string, pending: array{state: string, nonce: string, verifier: string, at: int}}
     */
    public function authorizationUrl(): array
    {
        $pending = [
            'state' => bin2hex(random_bytes(16)),
            'nonce' => bin2hex(random_bytes(16)),
            'verifier' => self::base64Url(random_bytes(32)),
            'at' => time(),
        ];
        $query = http_build_query([
            'client_id' => $this->config['client_id'],
            'redirect_uri' => $this->redirectUri,
            'response_type' => 'code',
            'scope' => 'openid email profile',
            'state' => $pending['state'],
            'nonce' => $pending['nonce'],
            'code_challenge' => self::base64Url(hash('sha256', $pending['verifier'], true)),
            'code_challenge_method' => 'S256',
            'prompt' => 'select_account',
        ], '', '&', PHP_QUERY_RFC3986);
        return ['url' => self::AUTHORIZE_URL . '?' . $query, 'pending' => $pending];
    }

    /**
     * Exchanges the callback's code for the account's identity.
     *
     * @param array{nonce: string, verifier: string} $pending what authorizationUrl() returned
     * @return array{subject: string, email: string, emailVerified: bool, name: string}
     * @throws \RuntimeException if Google refuses the code or the ID token doesn't check out
     */
    public function identity(string $code, array $pending): array
    {
        $response = $this->post(self::TOKEN_URL, [
            'code' => $code,
            'client_id' => $this->config['client_id'],
            'client_secret' => $this->config['client_secret'],
            'redirect_uri' => $this->redirectUri,
            'grant_type' => 'authorization_code',
            'code_verifier' => $pending['verifier'],
        ]);
        $idToken = (string) ($response['id_token'] ?? '');
        $parts = explode('.', $idToken);
        if (count($parts) !== 3) {
            throw new \RuntimeException('Google sent no ID token.');
        }
        $claims = json_decode(self::base64UrlDecode($parts[1]), true);
        if (!is_array($claims)) {
            throw new \RuntimeException('Google sent an unreadable ID token.');
        }
        if (!in_array($claims['iss'] ?? '', self::ISSUERS, true)) {
            throw new \RuntimeException('The ID token is from the wrong issuer.');
        }
        if (($claims['aud'] ?? '') !== $this->config['client_id']) {
            throw new \RuntimeException('The ID token is for another app.');
        }
        if ((int) ($claims['exp'] ?? 0) < time() - 60) {
            throw new \RuntimeException('The ID token has expired.');
        }
        if (!hash_equals($pending['nonce'], (string) ($claims['nonce'] ?? ''))) {
            throw new \RuntimeException("The ID token wasn't issued for this sign-in.");
        }
        $subject = (string) ($claims['sub'] ?? '');
        $email = (string) ($claims['email'] ?? '');
        if ($subject === '' || $email === '') {
            throw new \RuntimeException('Google sent no account ID or email address.');
        }
        return [
            'subject' => $subject,
            'email' => $email,
            'emailVerified' => ($claims['email_verified'] ?? false) === true || ($claims['email_verified'] ?? '') === 'true',
            'name' => trim((string) ($claims['name'] ?? '')),
        ];
    }

    /**
     * @param array<string, string> $fields
     * @return array<string, mixed>
     */
    private function post(string $url, array $fields): array
    {
        $curl = curl_init($url);
        curl_setopt_array($curl, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => http_build_query($fields),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 15,
            CURLOPT_HTTPHEADER => ['Accept: application/json'],
        ]);
        $body = curl_exec($curl);
        $status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
        $error = curl_error($curl);
        curl_close($curl);
        if ($body === false) {
            throw new \RuntimeException("Couldn't reach Google: $error");
        }
        $json = json_decode((string) $body, true);
        if ($status !== 200 || !is_array($json)) {
            $reason = is_array($json) ? (string) ($json['error_description'] ?? $json['error'] ?? '') : '';
            throw new \RuntimeException("Google refused the sign-in (HTTP $status" . ($reason !== '' ? ": $reason" : '') . ').');
        }
        return $json;
    }

    private static function base64Url(string $bytes): string
    {
        return rtrim(strtr(base64_encode($bytes), '+/', '-_'), '=');
    }

    private static function base64UrlDecode(string $text): string
    {
        return (string) base64_decode(strtr($text, '-_', '+/') . str_repeat('=', (4 - strlen($text) % 4) % 4), true);
    }
}
