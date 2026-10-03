-- 007: user accounts (email + password sign-in), one-time email tokens, login rate limiting,
-- and item ownership. Docs: docs/project_guide.md ("Accounts and sign-in").
--
--   users           One row per account. PasswordHash is PHP password_hash() output (NULL is left
--                   for sign-in providers to come, e.g. Google). Role: 'player' or 'admin'.
--                   EmailVerifiedAt is NULL until the emailed link is used; only verified accounts
--                   can save items. Emails are stored lowercased (unique).
--   user_tokens     One-time links mailed to a user: Purpose 'verify' (confirm the email) or 'reset'
--                   (choose a new password). Only the SHA-256 of the token is stored, so the table
--                   can't be used to forge a link. Each expires, and is marked used once spent.
--   login_attempts  Failed sign-ins, by email and by IP, to slow down password guessing.
--   item.OwnerUserID  The account that saved the item; NULL for the catalog and other system items.
--
-- Safe to run twice: tables are created if missing, the column added if missing.
--
-- Undo: DROP TABLE login_attempts, user_tokens, users; ALTER TABLE item DROP COLUMN OwnerUserID;

CREATE TABLE IF NOT EXISTS users (
    UserID INT NOT NULL AUTO_INCREMENT,
    Email VARCHAR(254) NOT NULL,
    DisplayName VARCHAR(100) NOT NULL,
    PasswordHash VARCHAR(255) NULL,
    Role VARCHAR(20) NOT NULL DEFAULT 'player',
    EmailVerifiedAt DATETIME NULL,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    LastLoginAt DATETIME NULL,
    PRIMARY KEY (UserID),
    UNIQUE KEY uq_users_email (Email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS user_tokens (
    TokenHash CHAR(64) NOT NULL,
    UserID INT NOT NULL,
    Purpose VARCHAR(20) NOT NULL,
    ExpiresAt DATETIME NOT NULL,
    UsedAt DATETIME NULL,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (TokenHash),
    KEY ix_user_tokens_user (UserID, Purpose),
    CONSTRAINT fk_user_tokens_user FOREIGN KEY (UserID) REFERENCES users (UserID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS login_attempts (
    AttemptID INT NOT NULL AUTO_INCREMENT,
    Email VARCHAR(254) NOT NULL,
    Ip VARCHAR(45) NOT NULL,
    AttemptedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (AttemptID),
    KEY ix_login_attempts_email (Email, AttemptedAt),
    KEY ix_login_attempts_ip (Ip, AttemptedAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SET @has_owner = (SELECT COUNT(*) FROM information_schema.COLUMNS
                   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'item' AND COLUMN_NAME = 'OwnerUserID');
SET @sql = IF(@has_owner, 'DO 0',
    'ALTER TABLE item ADD COLUMN OwnerUserID INT NULL DEFAULT NULL AFTER IsPublic, ADD KEY ix_item_owner (OwnerUserID)');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
