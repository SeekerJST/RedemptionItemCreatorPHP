-- 004: save attribute sub-rows, implementations, and row order (docs/implementation_plan.md, Phase 4).
--
--   ParentAttributeID  the ItemAttributeID of the row this one sits under; NULL = top level.
--                      Sub-rows are one level deep, so a parent always has a NULL parent.
--   Implementation     the rule key the client picked, e.g. 'kinetic' on an Attack Multiplier
--                      or 'fuel' on a Resource; NULL = the rule's default.
--   SortOrder          the row's position in the editor. Row ids stop matching the display
--                      order once rows are dragged, so ordering by ItemAttributeID isn't enough.
--
-- Safe to run twice: each column is added only if it's missing (MySQL 8 has no
-- ADD COLUMN IF NOT EXISTS, hence the prepared statements).
--
-- Undo: ALTER TABLE itemattribute DROP COLUMN ParentAttributeID, DROP COLUMN Implementation, DROP COLUMN SortOrder;

SET @has_parent = (SELECT COUNT(*) FROM information_schema.COLUMNS
                    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'itemattribute' AND COLUMN_NAME = 'ParentAttributeID');
SET @sql = IF(@has_parent, 'DO 0',
    'ALTER TABLE itemattribute ADD COLUMN ParentAttributeID INT NULL DEFAULT NULL AFTER ItemID');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_implementation = (SELECT COUNT(*) FROM information_schema.COLUMNS
                            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'itemattribute' AND COLUMN_NAME = 'Implementation');
SET @sql = IF(@has_implementation, 'DO 0',
    'ALTER TABLE itemattribute ADD COLUMN Implementation VARCHAR(50) NULL DEFAULT NULL AFTER `Rank`');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_sort = (SELECT COUNT(*) FROM information_schema.COLUMNS
                  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'itemattribute' AND COLUMN_NAME = 'SortOrder');
SET @sql = IF(@has_sort, 'DO 0',
    'ALTER TABLE itemattribute ADD COLUMN SortOrder INT NULL DEFAULT NULL AFTER `System`');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
