<?php
declare(strict_types=1);

namespace SilentSpirits\ItemCreator\Auth;

use PDO;

/**
 * Accounts (users), their one-time email tokens (user_tokens), and failed sign-ins
 * (login_attempts). Migration 007.
 *
 * A user row, as returned here: { id, email, displayName, role, verified, passwordHash }.
 */
final class UserRepository
{
    public const TOKEN_VERIFY = 'verify';
    public const TOKEN_RESET = 'reset';

    public function __construct(private PDO $db)
    {
    }

    /** @return ?array{id: int, email: string, displayName: string, role: string, verified: bool, passwordHash: ?string} */
    public function findById(int $userId): ?array
    {
        return $this->one('SELECT * FROM users WHERE UserID = ?', [$userId]);
    }

    /** @return ?array{id: int, email: string, displayName: string, role: string, verified: bool, passwordHash: ?string} */
    public function findByEmail(string $email): ?array
    {
        return $this->one('SELECT * FROM users WHERE Email = ?', [self::normalEmail($email)]);
    }

    /** The user an external account (provider + its account ID) is linked to, if any. */
    public function findByIdentity(string $provider, string $subject): ?array
    {
        return $this->one('SELECT u.* FROM users u JOIN user_identities i ON i.UserID = u.UserID
             WHERE i.Provider = ? AND i.Subject = ?', [$provider, $subject]);
    }

    /** Links an external account to a user (a no-op if it's already linked). */
    public function linkIdentity(int $userId, string $provider, string $subject, string $email): void
    {
        $this->db->prepare('INSERT IGNORE INTO user_identities (Provider, Subject, UserID, Email) VALUES (?, ?, ?, ?)')
            ->execute([$provider, $subject, $userId, self::normalEmail($email)]);
    }

    /** @return int the new UserID. $passwordHash null: an account made through Google, with no password yet. */
    public function create(string $email, string $displayName, ?string $passwordHash): int
    {
        $this->db->prepare('INSERT INTO users (Email, DisplayName, PasswordHash) VALUES (?, ?, ?)')
            ->execute([self::normalEmail($email), $displayName, $passwordHash]);
        return (int) $this->db->lastInsertId();
    }

    public function markVerified(int $userId): void
    {
        $this->db->prepare('UPDATE users SET EmailVerifiedAt = COALESCE(EmailVerifiedAt, UTC_TIMESTAMP()) WHERE UserID = ?')
            ->execute([$userId]);
    }

    public function setPasswordHash(int $userId, string $passwordHash): void
    {
        $this->db->prepare('UPDATE users SET PasswordHash = ? WHERE UserID = ?')->execute([$passwordHash, $userId]);
    }

    public function setDisplayName(int $userId, string $displayName): void
    {
        $this->db->prepare('UPDATE users SET DisplayName = ? WHERE UserID = ?')->execute([$displayName, $userId]);
    }

    public function touchSignIn(int $userId): void
    {
        $this->db->prepare('UPDATE users SET LastLoginAt = UTC_TIMESTAMP() WHERE UserID = ?')->execute([$userId]);
    }

    // ---- one-time tokens ---------------------------------------------------------

    /**
     * Issues a token for an emailed link and returns it. Only its SHA-256 is stored. Earlier unused
     * tokens of the same purpose stop working, so only the newest link does.
     */
    public function issueToken(int $userId, string $purpose, int $ttlSeconds): string
    {
        $token = bin2hex(random_bytes(32));
        $this->db->prepare('UPDATE user_tokens SET UsedAt = UTC_TIMESTAMP() WHERE UserID = ? AND Purpose = ? AND UsedAt IS NULL')
            ->execute([$userId, $purpose]);
        $this->db->prepare('INSERT INTO user_tokens (TokenHash, UserID, Purpose, ExpiresAt) VALUES (?, ?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? SECOND))')
            ->execute([hash('sha256', $token), $userId, $purpose, $ttlSeconds]);
        return $token;
    }

    /** Spends a token: the user it belongs to, or null if it's unknown, expired, used, or for something else. */
    public function consumeToken(string $token, string $purpose): ?int
    {
        if (!preg_match('/^[0-9a-f]{64}$/', $token)) {
            return null;
        }
        $hash = hash('sha256', $token);
        $stmt = $this->db->prepare('UPDATE user_tokens SET UsedAt = UTC_TIMESTAMP()
             WHERE TokenHash = ? AND Purpose = ? AND UsedAt IS NULL AND ExpiresAt > UTC_TIMESTAMP()');
        $stmt->execute([$hash, $purpose]);
        if ($stmt->rowCount() !== 1) {
            return null;
        }
        $row = $this->db->prepare('SELECT UserID FROM user_tokens WHERE TokenHash = ?');
        $row->execute([$hash]);
        return (int) $row->fetchColumn();
    }

    // ---- sign-in rate limiting -------------------------------------------------------

    public function recordFailedSignIn(string $email, string $ip): void
    {
        // UTC, like the window it's counted against (recentFailures), whatever MySQL's time zone is.
        $this->db->prepare('INSERT INTO login_attempts (Email, Ip, AttemptedAt) VALUES (?, ?, UTC_TIMESTAMP())')->execute([self::normalEmail($email), $ip]);
    }

    /** @return array{email: int, ip: int} failed sign-ins in the last $windowSeconds, for this email and this IP */
    public function recentFailures(string $email, string $ip, int $windowSeconds): array
    {
        $count = function (string $column, string $value) use ($windowSeconds): int {
            $stmt = $this->db->prepare("SELECT COUNT(*) FROM login_attempts WHERE $column = ? AND AttemptedAt > DATE_SUB(UTC_TIMESTAMP(), INTERVAL ? SECOND)");
            $stmt->execute([$value, $windowSeconds]);
            return (int) $stmt->fetchColumn();
        };
        return ['email' => $count('Email', self::normalEmail($email)), 'ip' => $count('Ip', $ip)];
    }

    public function clearFailedSignIns(string $email): void
    {
        $this->db->prepare('DELETE FROM login_attempts WHERE Email = ?')->execute([self::normalEmail($email)]);
    }

    // ---- internals --------------------------------------------------------------

    public static function normalEmail(string $email): string
    {
        return strtolower(trim($email));
    }

    /**
     * @param list<mixed> $params
     * @return ?array{id: int, email: string, displayName: string, role: string, verified: bool, passwordHash: ?string}
     */
    private function one(string $sql, array $params): ?array
    {
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $row = $stmt->fetch();
        if ($row === false) {
            return null;
        }
        return [
            'id' => (int) $row['UserID'],
            'email' => (string) $row['Email'],
            'displayName' => (string) $row['DisplayName'],
            'role' => (string) $row['Role'],
            'verified' => $row['EmailVerifiedAt'] !== null,
            'passwordHash' => $row['PasswordHash'] !== null ? (string) $row['PasswordHash'] : null,
        ];
    }
}
