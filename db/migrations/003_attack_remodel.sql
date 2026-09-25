-- 003: the Attack remodel (docs/implementation_plan.md, "Attack model", Phase 3).
--
-- Before: one attribute per attack variant ("Attack (Kinetic)", "Attack (Plasma)", ...), with
-- Rank = the final Weapon Multiplier.
-- After:
--   Attack             2x at the base cost; Rank = mounts (1 + extra turrets)   (the existing row)
--   Attack (Melee)     half cost; never takes Area
--   Attack Multiplier  a sub-row of an Attack: +1x per rank; carries the implementation
--                      (Energy, Kinetic, Plasma, Flare, Hyperspace, Tse)
--   Anti-Missile       the only 1x attack
--
-- Also deletes every saved item on its first run: they were all test data (decision 7) and
-- some use the removed attack variants.
--
-- Costs come from the client's rules engine (client/src/domain/rules), not attributescale,
-- so the new attributes get no attributescale rows.
--
-- Matches by name, not AttributeID, and is safe to run twice: a second run changes nothing.

START TRANSACTION;

-- The saved test items. Only on the first run (while the old variants still exist), so
-- running this again later can never delete real items.
SET @first_run = (SELECT COUNT(*) FROM attribute
                   WHERE AttributeName IN ('Attack (Anti-Missile)', 'Attack (Kinetic)', 'Attack (Flare)',
                                           'Attack (Plasma)', 'Attack (Tse)', 'Attack (Hyperspace)')) > 0;
DELETE FROM itemattribute WHERE @first_run;
DELETE FROM itemlimit WHERE @first_run;
DELETE FROM itemmodifier WHERE @first_run;
DELETE FROM itemtag WHERE @first_run;
DELETE FROM itemtask WHERE @first_run;
DELETE FROM item WHERE @first_run;

-- Old cost rows for every attack attribute, including the "Attack" and "Attack (Melee)"
-- rows that stay: their Rank no longer means the final multiplier.
DELETE s FROM attributescale s
  JOIN attribute a ON a.AttributeID = s.AttributeID
 WHERE a.AttributeName IN ('Attack', 'Attack (Anti-Missile)', 'Attack (Kinetic)', 'Attack (Flare)', 'Attack (Melee)',
                           'Attack (Plasma)', 'Attack (Tse)', 'Attack (Hyperspace)');

-- The pre-split variants that are now Attack Multiplier implementations (or Anti-Missile).
-- "Attack" and "Attack (Melee)" keep their rows and IDs, with the new meaning.
DELETE FROM attribute
 WHERE AttributeName IN ('Attack (Anti-Missile)', 'Attack (Kinetic)', 'Attack (Flare)',
                         'Attack (Plasma)', 'Attack (Tse)', 'Attack (Hyperspace)');

-- The new attack attributes (Attack (Melee) is added only if missing).
INSERT INTO attribute (AttributeName, SpecializationsFlag)
SELECT n.name, NULL
  FROM (SELECT 'Attack (Melee)' AS name UNION ALL SELECT 'Attack Multiplier' UNION ALL SELECT 'Anti-Missile') n
 WHERE NOT EXISTS (SELECT 1 FROM attribute a WHERE a.AttributeName = n.name);

COMMIT;
