<?php
declare(strict_types=1);

namespace SilentSpirits\ItemCreator\Repository;

use PDO;

/** Read-only reference tables that drive the item creator's dropdowns and cost math. */
final class LookupRepository
{
    public function __construct(private PDO $db)
    {
    }

    /** @return array<int, string> ItemSizeID => SizeName */
    public function itemSizeNames(): array
    {
        $sizes = [];
        foreach ($this->rows('SELECT ItemSizeID, SizeName FROM itemsize ORDER BY ItemSizeID') as $row) {
            $sizes[(int) $row['ItemSizeID']] = (string) $row['SizeName'];
        }
        return $sizes;
    }

    /** @return list<array<string, mixed>> */
    public function itemSizes(): array
    {
        return $this->rows('SELECT * FROM itemsize');
    }

    /** @return list<array<string, mixed>> */
    public function skills(): array
    {
        return $this->rows('SELECT * FROM skills ORDER BY skillName');
    }

    /** @return list<array<string, mixed>> item categories, by name */
    public function itemTypes(): array
    {
        return $this->rows('SELECT * FROM itemtype ORDER BY ItemTypeName');
    }

    /** @return list<array<string, mixed>> */
    public function attributes(): array
    {
        return $this->rows('SELECT * FROM attribute ORDER BY AttributeName');
    }

    /** @return list<array<string, mixed>> */
    public function attributeScales(): array
    {
        return $this->rows('SELECT * FROM attributescale');
    }

    /** @return array<int, string> AttributeID => AttributeName */
    public function attributeNames(): array
    {
        return array_column($this->attributes(), 'AttributeName', 'AttributeID');
    }

    /** @return list<array<string, mixed>> */
    private function rows(string $sql): array
    {
        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll();
    }
}
