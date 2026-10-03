<?php
declare(strict_types=1);

namespace SilentSpirits\ItemCreator\Controller;

use SilentSpirits\ItemCreator\Auth\Mailer;
use SilentSpirits\ItemCreator\Auth\Session;
use SilentSpirits\ItemCreator\Auth\UserRepository;
use SilentSpirits\ItemCreator\Http\HttpException;
use SilentSpirits\ItemCreator\Http\Request;
use SilentSpirits\ItemCreator\Http\Response;

/**
 * Accounts: sign up, verify the email, sign in and out, forgotten passwords, and the profile.
 * Routes: /itemcreator/auth/{action}. Email + password for now; sign-in providers (Google,
 * Microsoft) can be added beside it later, matched to accounts by verified email.
 *
 * Emailed links point at the client (config 'app_url') with ?verify=<token> or ?reset=<token>;
 * the client posts the token back to verifyemail or resetpassword.
 */
final class AuthController
{
    /** action => [HTTP method, method name] */
    public const ROUTES = [
        'me' => ['GET', 'me'],
        'register' => ['POST', 'register'],
        'verifyemail' => ['POST', 'verifyEmail'],
        'resendverification' => ['POST', 'resendVerification'],
        'login' => ['POST', 'login'],
        'logout' => ['POST', 'logout'],
        'forgotpassword' => ['POST', 'forgotPassword'],
        'resetpassword' => ['POST', 'resetPassword'],
        'updateprofile' => ['POST', 'updateProfile'],
        'changepassword' => ['POST', 'changePassword'],
    ];

    public const MIN_PASSWORD = 10;
    private const DUMMY_HASH = '$2y$10$ZCPPPyOOo8gGcEnsqJQR0OAusqx0TG5zNRERboi2.G6wtEXi2qtz2';
    private const MAX_PASSWORD = 200;
    private const VERIFY_TTL = 48 * 3600;
    private const RESET_TTL = 3600;
    private const FAILURE_WINDOW = 15 * 60;
    private const MAX_FAILURES_PER_EMAIL = 5;
    private const MAX_FAILURES_PER_IP = 20;

    /**
     * @param \Closure(): UserRepository $users
     * @param \Closure(): Mailer $mailer
     */
    public function __construct(
        private \Closure $users,
        private Session $session,
        private \Closure $mailer,
        private string $appUrl
    ) {
    }

    /** The signed-in user, or null. */
    public function me(Request $request): Response
    {
        return Response::json(['user' => self::public($this->currentUser())]);
    }

    public function register(Request $request): Response
    {
        $body = $request->jsonPayload('register');
        $email = self::email($body);
        $password = self::password($body, 'password');
        $name = self::displayName($body);
        $users = ($this->users)();

        // Same answer whether or not the email is taken, so the form can't be used to find accounts.
        // The mailbox's owner learns which it was.
        $existing = $users->findByEmail($email);
        if ($existing === null) {
            $id = $users->create($email, $name, password_hash($password, PASSWORD_DEFAULT));
            $this->sendVerification($id, $email, $name);
        } elseif (!$existing['verified']) {
            $this->sendVerification($existing['id'], $existing['email'], $existing['displayName']);
        } else {
            $this->mail($existing['email'], 'Your SilentSpirits account',
                "Someone tried to create a SilentSpirits account with this email address, but you already have one.\n\n"
                . "If it was you, sign in, or reset your password here:\n" . $this->link('') . "\n\nIf it wasn't, you can ignore this email.");
        }
        return Response::json(['ok' => true, 'message' => 'Check your email for a link to confirm your account.'], 202);
    }

    /** Spends a verification token, confirms the email, and signs the user in. */
    public function verifyEmail(Request $request): Response
    {
        $token = (string) ($request->jsonPayload('verify')['token'] ?? '');
        $users = ($this->users)();
        $userId = $users->consumeToken($token, UserRepository::TOKEN_VERIFY);
        if ($userId === null) {
            throw HttpException::badRequest('That confirmation link has expired or was already used. Sign in to get a new one.');
        }
        $users->markVerified($userId);
        $this->session->signIn($userId);
        $users->touchSignIn($userId);
        return Response::json(['user' => self::public($users->findById($userId))]);
    }

    public function resendVerification(Request $request): Response
    {
        $user = $this->requireUser();
        if (!$user['verified']) {
            $this->sendVerification($user['id'], $user['email'], $user['displayName']);
        }
        return Response::json(['ok' => true, 'message' => 'Check your email for a new confirmation link.'], 202);
    }

    public function login(Request $request): Response
    {
        $body = $request->jsonPayload('login');
        $email = UserRepository::normalEmail((string) ($body['email'] ?? ''));
        $password = (string) ($body['password'] ?? '');
        $users = ($this->users)();

        $failures = $users->recentFailures($email, $request->clientIp, self::FAILURE_WINDOW);
        if ($failures['email'] >= self::MAX_FAILURES_PER_EMAIL || $failures['ip'] >= self::MAX_FAILURES_PER_IP) {
            throw HttpException::tooManyRequests('Too many sign-in attempts. Try again in 15 minutes, or reset your password.', self::FAILURE_WINDOW);
        }

        $user = $users->findByEmail($email);
        // password_verify runs even for an unknown email (against a hash of a random string nobody
        // knows), so the reply takes as long either way and can't reveal which emails have accounts.
        $hash = $user['passwordHash'] ?? self::DUMMY_HASH;
        if (!password_verify($password, $hash) || $user === null) {
            $users->recordFailedSignIn($email, $request->clientIp);
            throw HttpException::unauthorized('That email and password don\'t match an account.');
        }

        if (password_needs_rehash($hash, PASSWORD_DEFAULT)) {
            $users->setPasswordHash($user['id'], password_hash($password, PASSWORD_DEFAULT));
        }
        $users->clearFailedSignIns($email);
        $this->session->signIn($user['id']);
        $users->touchSignIn($user['id']);
        return Response::json(['user' => self::public($user)]);
    }

    public function logout(Request $request): Response
    {
        $this->session->signOut();
        return Response::json(['user' => null]);
    }

    public function forgotPassword(Request $request): Response
    {
        $email = self::email($request->jsonPayload('forgotPassword'));
        $users = ($this->users)();
        $user = $users->findByEmail($email);
        if ($user !== null) {
            $token = $users->issueToken($user['id'], UserRepository::TOKEN_RESET, self::RESET_TTL);
            $this->mail($user['email'], 'Reset your SilentSpirits password',
                "Hello {$user['displayName']},\n\nTo choose a new password, open this link within an hour:\n"
                . $this->link('reset=' . $token) . "\n\nIf you didn't ask to reset your password, you can ignore this email.");
        }
        // Same answer either way, so this can't be used to find accounts.
        return Response::json(['ok' => true, 'message' => 'If there\'s an account for that email, a reset link is on its way.'], 202);
    }

    /** Spends a reset token, sets the new password, and signs the user in (the link proves the mailbox). */
    public function resetPassword(Request $request): Response
    {
        $body = $request->jsonPayload('resetPassword');
        $password = self::password($body, 'password');
        $users = ($this->users)();
        $userId = $users->consumeToken((string) ($body['token'] ?? ''), UserRepository::TOKEN_RESET);
        if ($userId === null) {
            throw HttpException::badRequest('That reset link has expired or was already used. Ask for a new one.');
        }
        $users->setPasswordHash($userId, password_hash($password, PASSWORD_DEFAULT));
        $users->markVerified($userId);
        $user = $users->findById($userId);
        $users->clearFailedSignIns((string) $user['email']);
        $this->session->signIn($userId);
        $users->touchSignIn($userId);
        return Response::json(['user' => self::public($user)]);
    }

    public function updateProfile(Request $request): Response
    {
        $user = $this->requireUser();
        $name = self::displayName($request->jsonPayload('profile'));
        $users = ($this->users)();
        $users->setDisplayName($user['id'], $name);
        return Response::json(['user' => self::public($users->findById($user['id']))]);
    }

    public function changePassword(Request $request): Response
    {
        $user = $this->requireUser();
        $body = $request->jsonPayload('changePassword');
        if (!password_verify((string) ($body['currentPassword'] ?? ''), (string) $user['passwordHash'])) {
            throw HttpException::badRequest('Your current password isn\'t right.');
        }
        $password = self::password($body, 'newPassword');
        ($this->users)()->setPasswordHash($user['id'], password_hash($password, PASSWORD_DEFAULT));
        $this->session->signIn($user['id']); // a fresh session ID after a credential change
        return Response::json(['ok' => true, 'message' => 'Your password is changed.']);
    }

    // ---- shared with the item API ------------------------------------------------

    /** @return ?array{id: int, email: string, displayName: string, role: string, verified: bool, passwordHash: ?string} */
    public function currentUser(): ?array
    {
        $id = $this->session->userId();
        return $id === null ? null : ($this->users)()->findById($id);
    }

    /** @return array{id: int, email: string, displayName: string, role: string, verified: bool, passwordHash: ?string} */
    public function requireUser(): array
    {
        $user = $this->currentUser();
        if ($user === null) {
            throw HttpException::unauthorized('Sign in to do that.');
        }
        return $user;
    }

    /**
     * A signed-in user whose email is confirmed: what saving items takes.
     *
     * @return array{id: int, email: string, displayName: string, role: string, verified: bool, passwordHash: ?string}
     */
    public function requireVerifiedUser(): array
    {
        $user = $this->requireUser();
        if (!$user['verified']) {
            throw HttpException::forbidden('Confirm your email address to save items: use the link we emailed you.');
        }
        return $user;
    }

    /**
     * The user as the client sees it: no password hash.
     *
     * @param ?array{id: int, email: string, displayName: string, role: string, verified: bool, passwordHash: ?string} $user
     * @return ?array{id: int, email: string, displayName: string, role: string, verified: bool}
     */
    public static function public(?array $user): ?array
    {
        if ($user === null) {
            return null;
        }
        unset($user['passwordHash']);
        return $user;
    }

    // ---- internals --------------------------------------------------------------

    private function sendVerification(int $userId, string $email, string $name): void
    {
        $token = ($this->users)()->issueToken($userId, UserRepository::TOKEN_VERIFY, self::VERIFY_TTL);
        $this->mail($email, 'Confirm your SilentSpirits account',
            "Hello $name,\n\nWelcome to SilentSpirits Games. To confirm your email address, open this link within 48 hours:\n"
            . $this->link('verify=' . $token) . "\n\nIf you didn't create an account, you can ignore this email.");
    }

    private function mail(string $to, string $subject, string $text): void
    {
        $html = '<p>' . nl2br(htmlspecialchars($text, ENT_QUOTES, 'UTF-8'), false) . '</p>';
        $html = preg_replace('~(https?://[^\s<]+)~', '<a href="$1">$1</a>', $html) ?? $html;
        ($this->mailer)()->send($to, $subject, $text, $html);
    }

    /** A link into the client: app_url plus "?verify=..." / "?reset=...". */
    private function link(string $query): string
    {
        $base = rtrim($this->appUrl, '/') . '/';
        return $query === '' ? $base : $base . '?' . $query;
    }

    /** @param array<mixed> $body */
    private static function email(array $body): string
    {
        $email = UserRepository::normalEmail((string) ($body['email'] ?? ''));
        if (strlen($email) > 254 || filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
            throw HttpException::badRequest('Enter a valid email address.');
        }
        return $email;
    }

    /** @param array<mixed> $body */
    private static function password(array $body, string $key): string
    {
        $password = (string) ($body[$key] ?? '');
        if (mb_strlen($password) < self::MIN_PASSWORD) {
            throw HttpException::badRequest('Use a password of at least ' . self::MIN_PASSWORD . ' characters.');
        }
        if (strlen($password) > self::MAX_PASSWORD) {
            throw HttpException::badRequest('That password is too long.');
        }
        return $password;
    }

    /** @param array<mixed> $body */
    private static function displayName(array $body): string
    {
        $name = trim(preg_replace('/\s+/u', ' ', (string) ($body['displayName'] ?? '')) ?? '');
        if ($name === '' || mb_strlen($name) > 100) {
            throw HttpException::badRequest('Enter a display name of 1 to 100 characters.');
        }
        return $name;
    }
}
