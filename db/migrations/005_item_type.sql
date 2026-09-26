-- 005: item categories. The itemtype table (ItemTypeID, ItemTypeName) came from the original
-- design but nothing pointed at it. item.ItemTypeID links an item to its category (Armor,
-- Ranged Weapons, Starships, ...) so the Inventory can group a whole book catalog.
--
-- Categories aren't a fixed list: saving an item with a new category name adds it to itemtype.
-- NULL = uncategorized.
--
-- Safe to run twice: the column and the foreign key are added only if missing.
--
-- Undo: ALTER TABLE item DROP FOREIGN KEY item_itemtype_fk, DROP COLUMN ItemTypeID;

SET @has_column = (SELECT COUNT(*) FROM information_schema.COLUMNS
                    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'item' AND COLUMN_NAME = 'ItemTypeID');
SET @sql = IF(@has_column, 'DO 0',
    'ALTER TABLE item ADD COLUMN ItemTypeID INT NULL DEFAULT NULL AFTER ItemSize');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_fk = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'item' AND CONSTRAINT_NAME = 'item_itemtype_fk');
SET @sql = IF(@has_fk, 'DO 0',
    'ALTER TABLE item ADD CONSTRAINT item_itemtype_fk FOREIGN KEY (ItemTypeID) REFERENCES itemtype (ItemTypeID)');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
