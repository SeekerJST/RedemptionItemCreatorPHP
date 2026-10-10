<?php
declare(strict_types=1);

namespace SilentSpirits\ItemCreator\Auth;

/**
 * The signed-in user, kept in a PHP session. The cookie is HttpOnly (no script can read it),
 * SameSite=Lax (other sites can't send it with their own POSTs), and Secure on HTTPS. Its name
 * is shared site-wide (SSGS_SESSION) so SystemGeneratorLive and the rest of the SilentSpirits site
 * can use the same sign-in.
 *
 * Started lazily: requests that never ask about the user don't create a session.
 */
final class Session
{
    private bool $started = false;

    /** @param array{name?: string, secure?: ?bool, lifetime_days?: int} $config */
    public function __construct(private array $config = [])
    {
    }

    public function userId(): ?int
    {
        $this->start();
        $id = $_SESSION['user_id'] ?? null;
        return is_int($id) ? $id : null;
    }

    /** Signs a user in. A fresh session ID, so one planted before sign-in is worthless after it. */
    public function signIn(int $userId): void
    {
        $this->start();
        session_regenerate_id(true);
        $_SESSION['user_id'] = $userId;
    }

    /** Keeps a value in the session until take() (e.g. a sign-in's state while the user is at Google). */
    public function put(string $key, mixed $value): void
    {
        $this->start();
        $_SESSION['pending'][$key] = $value;
    }

    /** Returns and forgets a value put() kept, so it can only be used once. */
    public function take(string $key): mixed
    {
        $this->start();
        $value = $_SESSION['pending'][$key] ?? null;
        unset($_SESSION['pending'][$key]);
        return $value;
    }

    public function signOut(): void
    {
        $this->start();
        $_SESSION = [];
        $params = session_get_cookie_params();
        setcookie(session_name(), '', [
            'expires' => time() - 3600,
            'path' => $params['path'],
            'domain' => $params['domain'],
            'secure' => $params['secure'],
            'httponly' => true,
            'samesite' => $params['samesite'] ?? 'Lax',
        ]);
        session_destroy();
        $this->started = false;
    }

    private function start(): void
    {
        if ($this->started || session_status() === PHP_SESSION_ACTIVE) {
            $this->started = true;
            return;
        }
        $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (int) ($_SERVER['SERVER_PORT'] ?? 0) === 443;
        $lifetime = (int) ($this->config['lifetime_days'] ?? 30) * 86400;
        session_name($this->config['name'] ?? 'SSGS_SESSION');
        session_set_cookie_params([
            'lifetime' => $lifetime,
            'path' => '/',
            'secure' => $this->config['secure'] ?? $https,
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
        ini_set('session.use_strict_mode', '1');
        ini_set('session.gc_maxlifetime', (string) $lifetime);
        session_start();
        $this->started = true;
    }
}
