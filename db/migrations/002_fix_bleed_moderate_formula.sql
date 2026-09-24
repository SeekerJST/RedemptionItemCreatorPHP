-- 002: fix the Bleed (Moderate) cost formula.
-- The rules spreadsheet has Bleed = base + N(N-1)*5/2, with base 5/10/20 for
-- Minor/Moderate/Major. The Moderate row had its /2 inside the parentheses,
-- so only the rank part was halved: base 20 instead of 10, overcharging by
-- 10 BP at every rank. This puts it in the same form as the Minor and Major rows.
--
-- Matches on attribute, scale, and the old formula text rather than the row ID,
-- so it's safe to run on any copy of the DB and a second run changes nothing.
--
-- Undo: SET AttributeFormula = '(20+([N]-1)*[N]*5/2)' on the same row.

UPDATE attributescale
   SET AttributeFormula = '(20+([N]-1)*[N]*5)/2'
 WHERE AttributeID = (SELECT AttributeID FROM (SELECT AttributeID FROM attribute WHERE AttributeName = 'Bleed') AS bleed)
   AND ScaleType = 'MODERATE'
   AND AttributeFormula = '(20+([N]-1)*[N]*5/2)';
