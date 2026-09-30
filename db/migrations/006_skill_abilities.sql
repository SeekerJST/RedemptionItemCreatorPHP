-- 006: Abilities alongside Skills, for Modifier targets (docs/item_creation_rules.md §5.20).
--
--   SkillType  'Skill' or 'Ability'. Modifiers can target either; the Modifier picker lists
--              them in two groups. Abilities: Detection, Discern, Initiative (PJ, 2026-09-29).
--   Also removes the stray 'Skills ' row (skillID 21, trailing space): a placeholder, not a
--   skill. Only deleted if no saved Modifier names it.
--
-- The skills table may be rebuilt for the character creator later; this keeps changes small.
-- Safe to run twice: the column is added only if missing, and each Ability only if missing.
--
-- Undo: DELETE FROM skills WHERE SkillType = 'Ability'; ALTER TABLE skills DROP COLUMN SkillType;
--       INSERT INTO skills (skillID, skillName) VALUES (21, 'Skills ');

SET @has_type = (SELECT COUNT(*) FROM information_schema.COLUMNS
                  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'skills' AND COLUMN_NAME = 'SkillType');
SET @sql = IF(@has_type, 'DO 0',
    'ALTER TABLE skills ADD COLUMN SkillType VARCHAR(10) NOT NULL DEFAULT ''Skill'' AFTER skillName');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

INSERT INTO skills (skillName, SkillType)
SELECT n.name, 'Ability'
  FROM (SELECT 'Detection' AS name UNION ALL SELECT 'Discern' UNION ALL SELECT 'Initiative') AS n
 WHERE NOT EXISTS (SELECT 1 FROM skills s WHERE s.skillName = n.name);

DELETE FROM skills
 WHERE skillName = 'Skills '
   AND NOT EXISTS (SELECT 1 FROM itemmodifier m WHERE m.ModifierName = 'Skills ');
