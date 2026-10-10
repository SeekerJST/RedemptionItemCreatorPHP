-- 009: sign-in through other providers (Google now; Microsoft later).
--
--   user_identities  one row per external account linked to a user: Provider ('google'),
--                    Subject (the provider's stable account ID, the ID token's `sub`), and the
--                    email it had when linked. A user can have several; an external account
--                    belongs to one user.
--   users.PasswordHash was already nullable: an account made through Google has no password
--                    until its owner sets one (Profile).
--
-- Safe to run twice. Undo: DROP TABLE user_identities;

CREATE TABLE IF NOT EXISTS user_identities (
    Provider   VARCHAR(20)  NOT NULL,
    Subject    VARCHAR(255) NOT NULL,
    UserID     INT          NOT NULL,
    Email      VARCHAR(254) NOT NULL,
    CreatedAt  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (Provider, Subject),
    KEY ix_user_identities_user (UserID),
    CONSTRAINT fk_user_identities_user FOREIGN KEY (UserID) REFERENCES users (UserID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
