-- 005: item category and description, and documents how IsPublic is used.
--
--   Category     groups items in the Inventory tree (Panel 1): "Group: Subgroup", e.g.
--                "Weapons: Firearms", or one level, e.g. "Armor". NULL = Uncategorized.
--   Description  free text shown in the Build Summary (Panel 3); catalog items carry the book's text.
--   IsPublic     (already exists, default 0) 1 = a public item: anyone can load it, read-only,
--                and the API refuses to update or delete it. Players copy it to change it.
--                0 = private: editable. Items the API creates are always private; publishing
--                is done outside the API (the catalog import now, an admin panel later).
--
-- Safe to run twice: each column is added only if it's missing (MySQL 8 has no
-- ADD COLUMN IF NOT EXISTS, hence the prepared statements).
--
-- Undo: ALTER TABLE item DROP COLUMN Category, DROP COLUMN Description;

SET @has_category = (SELECT COUNT(*) FROM information_schema.COLUMNS
                      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'item' AND COLUMN_NAME = 'Category');
SET @sql = IF(@has_category, 'DO 0',
    'ALTER TABLE item ADD COLUMN Category VARCHAR(100) NULL DEFAULT NULL AFTER ItemName');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_description = (SELECT COUNT(*) FROM information_schema.COLUMNS
                         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'item' AND COLUMN_NAME = 'Description');
SET @sql = IF(@has_description, 'DO 0',
    'ALTER TABLE item ADD COLUMN Description TEXT NULL DEFAULT NULL AFTER Category');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
