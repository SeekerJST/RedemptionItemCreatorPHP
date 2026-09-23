-- 001: store each attribute's Rank.
-- The client always sent Rank, but the C# API had nowhere to put it, so it was
-- lost on save. Nullable: rows saved before this migration have no rank.
--
-- Run once per database (local and Dreamhost). MySQL 8 has no
-- ADD COLUMN IF NOT EXISTS, so a second run fails with "Duplicate column name
-- 'Rank'"; that error is harmless.
--
-- Undo: ALTER TABLE itemattribute DROP COLUMN `Rank`;

ALTER TABLE itemattribute
    ADD COLUMN `Rank` INT NULL DEFAULT NULL AFTER AttributeScaleID;
