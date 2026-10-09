-- 008: Decisive Action content (docs/item_creation_rules.md §5.3, §5.27; rulings 2026-10-04 to 10-08).
--
--   attribute rows   'Attack (1x)'            no damage, delivers an effect; half the Attack base
--                    'Grav Blades'            Major only, 75 BP; replace a Gravitic Drive (Decisive Action)
--                    'Psi-Resonant Materials' 75 / 150 / 300 BP (Decisive Action)
--   item.Source      the book a catalog item comes from: NULL for the core book and for players'
--                    own items, else 'Deployment Companion', 'New Detroit' or 'Decisive Action'.
--                    The app hides Decisive Action items unless its optional-content switch is on.
--   item.GroupSize   sold in groups: 10 for rounds, grenades, charges and missiles (a group costs
--                    +1 CR, and each one is its own charge); NULL = sold singly.
--
-- Safe to run twice: each attribute is added only if missing, each column only if missing.
--
-- Undo: ALTER TABLE item DROP COLUMN Source, DROP COLUMN GroupSize;
--       DELETE FROM attribute WHERE AttributeName IN ('Attack (1x)', 'Grav Blades', 'Psi-Resonant Materials');

INSERT INTO attribute (AttributeName)
SELECT n.name
  FROM (SELECT 'Attack (1x)' AS name UNION ALL SELECT 'Grav Blades' UNION ALL SELECT 'Psi-Resonant Materials') AS n
 WHERE NOT EXISTS (SELECT 1 FROM attribute a WHERE a.AttributeName = n.name);

SET @has_source = (SELECT COUNT(*) FROM information_schema.COLUMNS
                    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'item' AND COLUMN_NAME = 'Source');
SET @sql = IF(@has_source, 'DO 0', 'ALTER TABLE item ADD COLUMN Source VARCHAR(40) NULL AFTER Category');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_group = (SELECT COUNT(*) FROM information_schema.COLUMNS
                   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'item' AND COLUMN_NAME = 'GroupSize');
SET @sql = IF(@has_group, 'DO 0', 'ALTER TABLE item ADD COLUMN GroupSize SMALLINT NULL AFTER Source');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
