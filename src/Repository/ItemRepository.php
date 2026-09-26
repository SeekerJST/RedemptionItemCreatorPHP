<?php
declare(strict_types=1);

namespace SilentSpirits\ItemCreator\Repository;

use PDO;
use SilentSpirits\ItemCreator\Domain\Item;
use SilentSpirits\ItemCreator\Http\HttpException;
use Throwable;

/**
 * Persistence for items and their child rows. The PHP port of ItemCreatorModel.cs.
 *
 * Table names are always lowercase: MySQL on Linux (Dreamhost) treats table
 * names as case-sensitive, so the C# "DELETE FROM ITEM" would fail there.
 */
final class ItemRepository
{
    /** Child tables, deleted before the parent row. Mirrors Item.ItemTables(). */
    private const CHILD_TABLES = ['itemattribute', 'itemlimit', 'itemmodifier', 'itemtag', 'itemtask'];

    public function __construct(private PDO $db, private LookupRepository $lookups)
    {
    }

    /**
     * @param bool $includePrivate also list items with IsPublic = 0
     * @return list<array<string, mixed>> item summaries, by name
     */
    public function listItems(bool $includePrivate): array
    {
        $stmt = $this->db->prepare(
            'SELECT i.ItemID, i.ItemName, s.SizeName, i.CostRating
               FROM item i
               LEFT JOIN itemsize s ON s.ItemSizeID = i.ItemSize
              WHERE i.IsPublic = 1 OR ?
              ORDER BY i.ItemName'
        );
        $stmt->bindValue(1, (int) $includePrivate, PDO::PARAM_INT);
        $stmt->execute();

        return array_map(static fn (array $r): array => [
            'itemID' => $r['ItemID'],
            'itemName' => $r['ItemName'],
            'itemSize' => $r['SizeName'],
            'CostRating' => $r['CostRating'],
        ], $stmt->fetchAll());
    }

    public function find(string $itemId): ?Item
    {
        $stmt = $this->db->prepare(
            'SELECT i.ItemID, i.ItemName, s.SizeName, i.CostRating
               FROM item i
               LEFT JOIN itemsize s ON s.ItemSizeID = i.ItemSize
              WHERE i.ItemID = ?'
        );
        $stmt->execute([$itemId]);
        $row = $stmt->fetch();
        if ($row === false) {
            return null;
        }

        $item = new Item();
        $item->itemId = $row['ItemID'];
        $item->itemName = (string) $row['ItemName'];
        $item->itemSize = (string) $row['SizeName'];
        $item->costRating = $row['CostRating'];

        // Rows saved before migration 004 have no SortOrder; they keep their id order.
        $attributeSql = 'SELECT * FROM itemattribute WHERE ItemID = ? ORDER BY SortOrder IS NULL, SortOrder, ItemAttributeID';
        foreach ($this->children($attributeSql, $itemId) as $r) {
            $item->attributes[] = [
                'id' => $r['ItemAttributeID'],
                'parentId' => $r['ParentAttributeID'],
                'system' => $r['System'],
                'attributeId' => $r['AttributeID'],
                'scale' => self::nullableString($r['AttributeScaleID']),
                'rank' => $r['Rank'], // NULL for rows saved before migration 001
                'implementation' => $r['Implementation'],
                'buildPoints' => (int) $r['BuildPoints'],
                'powerSlots' => (int) $r['PowerSlots'],
            ];
        }

        foreach ($this->children('SELECT * FROM itemlimit WHERE ItemID = ? ORDER BY LimitID', $itemId) as $r) {
            $item->limits[] = [
                'id' => $r['LimitID'],
                'desc' => (string) $r['LimitDesc'],
                'scale' => self::nullableString($r['LimitScale']),
                'buildPoints' => (int) $r['BuildPoints'],
            ];
        }

        // TagFree is BIT(1); "+ 0" turns it into an integer instead of a raw byte.
        foreach ($this->children('SELECT TagID, TagDesc, TagRank, TagFree + 0 AS TagFree, BuildPoints FROM itemtag WHERE ItemID = ? ORDER BY TagID', $itemId) as $r) {
            $item->tags[] = [
                'id' => $r['TagID'],
                'desc' => (string) $r['TagDesc'],
                'rank' => self::nullableString($r['TagRank']),
                'free' => $r['TagFree'] === null ? null : (bool) $r['TagFree'],
                'buildPoints' => (int) $r['BuildPoints'],
            ];
        }

        foreach ($this->children('SELECT * FROM itemmodifier WHERE ItemID = ? ORDER BY ModifierID', $itemId) as $r) {
            $item->modifiers[] = ['id' => $r['ModifierID'], 'name' => (string) $r['ModifierName']];
        }

        foreach ($this->children('SELECT * FROM itemtask WHERE ItemID = ? ORDER BY TaskID', $itemId) as $r) {
            $item->tasks[] = ['id' => $r['TaskID'], 'name' => (string) $r['TaskName']];
        }

        return $item;
    }

    /** @return string the new ItemID */
    public function create(Item $item): string
    {
        $sizeId = $this->sizeId($item->itemSize);
        $itemId = self::uuid4();

        $this->transaction(function () use ($item, $itemId, $sizeId): void {
            $this->db->prepare('INSERT INTO item (ItemID, ItemName, ItemSize, CostRating) VALUES (?, ?, ?, ?)')
                ->execute([$itemId, $item->itemName, $sizeId, $item->costRating]);
            $this->insertChildren($itemId, $item);
        });

        return $itemId;
    }

    /** @return bool false when no item has that ID */
    public function update(Item $item): bool
    {
        $itemId = (string) $item->itemId;
        $sizeId = $this->sizeId($item->itemSize);

        return $this->transaction(function () use ($item, $itemId, $sizeId): bool {
            if (!$this->exists($itemId)) {
                return false;
            }
            $this->db->prepare('UPDATE item SET ItemName = ?, ItemSize = ?, CostRating = ? WHERE ItemID = ?')
                ->execute([$item->itemName, $sizeId, $item->costRating, $itemId]);
            $this->deleteChildren($itemId);
            $this->insertChildren($itemId, $item);
            return true;
        });
    }

    /** @return bool false when no item has that ID */
    public function delete(string $itemId): bool
    {
        return $this->transaction(function () use ($itemId): bool {
            if (!$this->exists($itemId)) {
                return false;
            }
            $this->deleteChildren($itemId);
            $this->db->prepare('DELETE FROM item WHERE ItemID = ?')->execute([$itemId]);
            return true;
        });
    }

    // ---- internals --------------------------------------------------------------

    /**
     * Looks the size name up in itemsize instead of hard-coding TINY=1..COLOSSAL=6.
     * The C# version stored 0 for an unknown size, which made the item vanish from
     * every JOIN; this rejects it instead.
     */
    private function sizeId(string $sizeName): int
    {
        foreach ($this->lookups->itemSizeNames() as $id => $name) {
            if (strcasecmp($name, $sizeName) === 0) {
                return $id;
            }
        }
        $valid = implode(', ', $this->lookups->itemSizeNames());
        throw HttpException::badRequest("Unknown itemSize '$sizeName'. Expected one of: $valid.");
    }

    private function exists(string $itemId): bool
    {
        $stmt = $this->db->prepare('SELECT 1 FROM item WHERE ItemID = ? FOR UPDATE');
        $stmt->execute([$itemId]);
        return $stmt->fetchColumn() !== false;
    }

    private function deleteChildren(string $itemId): void
    {
        foreach (self::CHILD_TABLES as $table) {
            $this->db->prepare("DELETE FROM $table WHERE ItemID = ?")->execute([$itemId]);
        }
    }

    private function insertChildren(string $itemId, Item $item): void
    {
        $this->insertRows(
            'itemattribute',
            ['ItemAttributeID', 'ItemID', 'ParentAttributeID', 'AttributeID', 'AttributeScaleID', 'Rank', 'Implementation', 'BuildPoints', 'PowerSlots', 'System', 'SortOrder'],
            array_map(static fn (array $a, int $order): array => [
                $a['id'], $itemId, $a['parentId'], $a['attributeId'], self::nullableInt($a['scale']), $a['rank'],
                $a['implementation'], $a['buildPoints'], $a['powerSlots'], $a['system'], $order,
            ], $item->attributes, array_keys($item->attributes))
        );

        $this->insertRows(
            'itemlimit',
            ['LimitID', 'ItemID', 'LimitDesc', 'LimitScale', 'BuildPoints'],
            array_map(static fn (array $l): array => [
                $l['id'], $itemId, $l['desc'], self::nullableInt($l['scale']), $l['buildPoints'],
            ], $item->limits)
        );

        $this->insertRows(
            'itemtag',
            ['TagID', 'ItemID', 'TagDesc', 'TagRank', 'TagFree', 'BuildPoints'],
            array_map(static fn (array $t): array => [
                $t['id'], $itemId, $t['desc'], self::nullableInt($t['rank']), $t['free'] === null ? null : (int) $t['free'], $t['buildPoints'],
            ], $item->tags)
        );

        $this->insertRows(
            'itemmodifier',
            ['ModifierID', 'ItemID', 'ModifierName'],
            array_map(static fn (array $m): array => [$m['id'], $itemId, $m['name']], $item->modifiers)
        );

        $this->insertRows(
            'itemtask',
            ['TaskID', 'ItemID', 'TaskName'],
            array_map(static fn (array $t): array => [$t['id'], $itemId, $t['name']], $item->tasks)
        );
    }

    /**
     * One multi-row INSERT per table, as the C# did, but skipped for empty lists
     * (the C# attribute insert produced invalid SQL when the list was empty).
     *
     * @param string[] $columns
     * @param list<list<mixed>> $rows
     */
    private function insertRows(string $table, array $columns, array $rows): void
    {
        if ($rows === []) {
            return;
        }

        $tuple = '(' . implode(', ', array_fill(0, count($columns), '?')) . ')';
        $sql = sprintf(
            'INSERT INTO %s (%s) VALUES %s',
            $table,
            '`' . implode('`, `', $columns) . '`', // quoted: `System` and `Rank` are reserved words
            implode(', ', array_fill(0, count($rows), $tuple))
        );

        // Bind with real types: execute([...]) sends everything as strings, and
        // MySQL rejects the string '0' for the BIT(1) itemtag.TagFree column.
        $stmt = $this->db->prepare($sql);
        foreach (array_merge(...$rows) as $i => $value) {
            $type = is_int($value) ? PDO::PARAM_INT : ($value === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
            $stmt->bindValue($i + 1, $value, $type);
        }
        $stmt->execute();
    }

    /** @return list<array<string, mixed>> */
    private function children(string $sql, string $itemId): array
    {
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$itemId]);
        return $stmt->fetchAll();
    }

    /**
     * @template T
     * @param callable(): T $work
     * @return T
     */
    private function transaction(callable $work)
    {
        $this->db->beginTransaction();
        try {
            $result = $work();
            $this->db->commit();
            return $result;
        } catch (Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    private static function nullableString(mixed $value): ?string
    {
        return $value === null ? null : (string) $value;
    }

    private static function nullableInt(?string $value): ?int
    {
        if ($value === null || trim($value) === '') {
            return null;
        }
        if (!preg_match('/^\s*-?\d+\s*$/', $value)) {
            throw HttpException::badRequest("Expected a number but got '$value'.");
        }
        return (int) $value;
    }

    private static function uuid4(): string
    {
        $bytes = random_bytes(16);
        $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
        $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($bytes), 4));
    }
}
