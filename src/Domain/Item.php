<?php
declare(strict_types=1);

namespace SilentSpirits\ItemCreator\Domain;

use SilentSpirits\ItemCreator\Http\HttpException;

/**
 * An item as the React client builds it. The PHP port of Item.cs.
 *
 * fromArray() is deliberately forgiving about input the way Newtonsoft was:
 * keys match case-insensitively ("itemName" or "ItemName"), numeric strings
 * are accepted for numbers ("PowerSlots": "0"), and unknown keys that the grid
 * adds ("$level", "data") are ignored. toArray() always emits one canonical
 * shape, matching the object the client builds in App.jsx.
 */
final class Item
{
    public const MODIFIER_PREFIX = 'Modifier_';
    public const TASK_PREFIX = 'Task_';

    public ?string $itemId = null;
    public string $itemName = '';
    public string $itemSize = '';
    public ?int $costRating = null;
    /** Category name (an itemtype row, created on save if new); null = uncategorized. */
    public ?string $itemType = null;
    /** Listed publicly; null = not sent, so an update keeps the saved value (and a create makes it private). */
    public ?bool $isPublic = null;

    /**
     * In editor order. parentId: the id of the row this one sits under (null = top level).
     * implementation: the client's rule key, e.g. "kinetic" (null = the rule's default).
     *
     * @var list<array{id: int, parentId: ?int, system: ?string, attributeId: int, scale: ?string, rank: ?int, implementation: ?string, buildPoints: int, powerSlots: int}>
     */
    public array $attributes = [];

    /** @var list<array{id: int, desc: string, scale: ?string, buildPoints: int}> */
    public array $limits = [];

    /** @var list<array{id: int, desc: string, rank: ?string, free: ?bool, buildPoints: int}> */
    public array $tags = [];

    /** @var list<array{id: int, name: string}> ids without the "Modifier_" prefix */
    public array $modifiers = [];

    /** @var list<array{id: int, name: string}> ids without the "Task_" prefix */
    public array $tasks = [];

    /** @param array<mixed> $data */
    public static function fromArray(array $data): self
    {
        $data = self::lowerKeys($data);
        $item = new self();

        $item->itemId = self::str($data, 'itemid', 'itemID');
        $item->itemName = trim(self::str($data, 'itemname', 'itemName') ?? '');
        $item->itemSize = trim(self::str($data, 'itemsize', 'itemSize') ?? '');
        $item->costRating = self::int($data, 'costrating', 'CostRating');
        $item->itemType = self::nonEmpty(self::str($data, 'itemtype', 'itemType'));
        $item->isPublic = self::bool($data, 'ispublic', 'IsPublic');

        foreach (self::list($data, 'attributelist') as $i => $row) {
            $where = "attributeList[$i]";
            $item->attributes[] = [
                'id' => self::requiredInt($row, 'id', "$where.id"),
                'parentId' => self::int($row, 'parentid', "$where.parentId"),
                'system' => self::str($row, 'attributesystem', "$where.AttributeSystem"),
                'attributeId' => self::requiredInt($row, 'attributename', "$where.AttributeName"),
                'scale' => self::str($row, 'scale', "$where.Scale"),
                'rank' => self::int($row, 'rank', "$where.Rank"),
                'implementation' => self::nonEmpty(self::str($row, 'implementation', "$where.Implementation")),
                'buildPoints' => self::int($row, 'buildpoints', "$where.BuildPoints") ?? 0,
                'powerSlots' => self::int($row, 'powerslots', "$where.PowerSlots") ?? 0,
            ];
        }

        self::assertOneLevelTree($item->attributes);

        foreach (self::list($data, 'limitlist') as $i => $row) {
            $where = "limitList[$i]";
            $item->limits[] = [
                'id' => self::requiredInt($row, 'id', "$where.id"),
                'desc' => self::str($row, 'limitdesc', "$where.LimitDesc") ?? '',
                'scale' => self::str($row, 'limitscale', "$where.LimitScale"),
                'buildPoints' => self::int($row, 'buildpoints', "$where.BuildPoints") ?? 0,
            ];
        }

        foreach (self::list($data, 'taglist') as $i => $row) {
            $where = "tagList[$i]";
            $item->tags[] = [
                'id' => self::requiredInt($row, 'id', "$where.id"),
                'desc' => self::str($row, 'tagdesc', "$where.TagDesc") ?? '',
                'rank' => self::str($row, 'tagrank', "$where.TagRank"),
                'free' => self::bool($row, 'tagfree', "$where.TagFree"),
                'buildPoints' => self::int($row, 'buildpoints', "$where.BuildPoints") ?? 0,
            ];
        }

        foreach (self::list($data, 'modifierlist') as $i => $row) {
            $item->modifiers[] = [
                'id' => self::prefixedId($row, 'modifierid', self::MODIFIER_PREFIX, "modifierList[$i].modifierID"),
                'name' => self::str($row, 'modifiername', "modifierList[$i].modifierName") ?? '',
            ];
        }

        foreach (self::list($data, 'tasklist') as $i => $row) {
            $item->tasks[] = [
                'id' => self::prefixedId($row, 'taskid', self::TASK_PREFIX, "taskList[$i].taskID"),
                'name' => self::str($row, 'taskname', "taskList[$i].taskName") ?? '',
            ];
        }

        return $item;
    }

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return [
            'itemID' => $this->itemId,
            'itemName' => $this->itemName,
            'itemSize' => $this->itemSize,
            'CostRating' => $this->costRating,
            'itemType' => $this->itemType,
            'IsPublic' => $this->isPublic,
            'modifierList' => array_map(static fn (array $m): array => [
                'modifierID' => self::MODIFIER_PREFIX . $m['id'],
                'modifierName' => $m['name'],
            ], $this->modifiers),
            'taskList' => array_map(static fn (array $t): array => [
                'taskID' => self::TASK_PREFIX . $t['id'],
                'taskName' => $t['name'],
            ], $this->tasks),
            'attributeList' => array_map(static fn (array $a): array => [
                'id' => $a['id'],
                'parentId' => $a['parentId'],
                'AttributeSystem' => $a['system'],
                'AttributeName' => $a['attributeId'],
                'Scale' => $a['scale'],
                'Rank' => $a['rank'],
                'Implementation' => $a['implementation'],
                'BuildPoints' => $a['buildPoints'],
                'PowerSlots' => $a['powerSlots'],
            ], $this->attributes),
            'limitList' => array_map(static fn (array $l): array => [
                'id' => $l['id'],
                'LimitDesc' => $l['desc'],
                'LimitScale' => $l['scale'],
                'BuildPoints' => $l['buildPoints'],
            ], $this->limits),
            'tagList' => array_map(static fn (array $t): array => [
                'id' => $t['id'],
                'TagDesc' => $t['desc'],
                'TagRank' => $t['rank'],
                'TagFree' => $t['free'],
                'BuildPoints' => $t['buildPoints'],
            ], $this->tags),
        ];
    }

    /** Checks needed before an item can be saved (export tolerates a partial item). */
    public function assertSavable(): void
    {
        if ($this->itemName === '') {
            throw HttpException::badRequest('itemName is required.');
        }
        if ($this->itemSize === '') {
            throw HttpException::badRequest('itemSize is required.');
        }
    }

    /**
     * Sub-rows are one level deep (implementation plan, decision 6): every parentId names
     * another row in the list, and that row is top-level. Ids must be unique for that to hold.
     *
     * @param list<array{id: int, parentId: ?int}> $attributes
     */
    private static function assertOneLevelTree(array $attributes): void
    {
        $parentOf = [];
        foreach ($attributes as $i => $a) {
            if (array_key_exists($a['id'], $parentOf)) {
                throw HttpException::badRequest("attributeList[$i].id {$a['id']} is used by more than one row.");
            }
            $parentOf[$a['id']] = $a['parentId'];
        }
        foreach ($attributes as $i => $a) {
            $parent = $a['parentId'];
            if ($parent === null) {
                continue;
            }
            if ($parent === $a['id'] || !array_key_exists($parent, $parentOf)) {
                throw HttpException::badRequest("attributeList[$i].parentId $parent doesn't match another row's id.");
            }
            if ($parentOf[$parent] !== null) {
                throw HttpException::badRequest("attributeList[$i] is nested two levels deep; sub-rows can only sit under a top-level row.");
            }
        }
    }

    // ---- input coercion helpers -------------------------------------------------

    private static function nonEmpty(?string $value): ?string
    {
        return $value === null || trim($value) === '' ? null : trim($value);
    }

    /** @param array<mixed> $a @return array<mixed> */
    private static function lowerKeys(array $a): array
    {
        return array_change_key_case($a, CASE_LOWER);
    }

    /** @param array<mixed> $data @return list<array<mixed>> */
    private static function list(array $data, string $key): array
    {
        $value = $data[$key] ?? null;
        if ($value === null) {
            return [];
        }
        if (!is_array($value) || !self::isList($value)) {
            throw HttpException::badRequest("$key must be an array.");
        }

        $rows = [];
        foreach ($value as $i => $row) {
            if (!is_array($row)) {
                throw HttpException::badRequest("{$key}[$i] must be an object.");
            }
            $rows[] = self::lowerKeys($row);
        }
        return $rows;
    }

    /** @param array<mixed> $row */
    private static function str(array $row, string $key, string $label): ?string
    {
        $value = $row[$key] ?? null;
        if ($value === null) {
            return null;
        }
        if (is_string($value)) {
            return $value;
        }
        if (is_int($value) || is_float($value)) {
            return (string) $value;
        }
        throw HttpException::badRequest("$label must be a string.");
    }

    /** @param array<mixed> $row */
    private static function int(array $row, string $key, string $label): ?int
    {
        $value = $row[$key] ?? null;
        if ($value === null || $value === '') {
            return null;
        }
        if (is_int($value)) {
            return $value;
        }
        if (is_string($value) && preg_match('/^\s*-?\d+\s*$/', $value)) {
            return (int) $value;
        }
        if (is_float($value) && floor($value) === $value) {
            return (int) $value;
        }
        throw HttpException::badRequest("$label must be a whole number.");
    }

    /** @param array<mixed> $row */
    private static function requiredInt(array $row, string $key, string $label): int
    {
        $value = self::int($row, $key, $label);
        if ($value === null) {
            throw HttpException::badRequest("$label is required.");
        }
        return $value;
    }

    /** @param array<mixed> $row */
    private static function bool(array $row, string $key, string $label): ?bool
    {
        $value = $row[$key] ?? null;
        if ($value === null || is_bool($value)) {
            return $value;
        }
        if ($value === 0 || $value === 1) {
            return (bool) $value;
        }
        if (is_string($value)) {
            $parsed = filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if ($parsed !== null) {
                return $parsed;
            }
        }
        throw HttpException::badRequest("$label must be true or false.");
    }

    /** array_is_list() arrived in PHP 8.1; the local IIS Express PHP is 8.0. @param array<mixed> $a */
    private static function isList(array $a): bool
    {
        return $a === [] || array_keys($a) === range(0, count($a) - 1);
    }

    /** "Modifier_5" -> 5. A bare number is accepted too. @param array<mixed> $row */
    private static function prefixedId(array $row, string $key, string $prefix, string $label): int
    {
        $raw = self::str($row, $key, $label);
        if ($raw !== null && stripos($raw, $prefix) === 0) {
            $raw = substr($raw, strlen($prefix));
        }
        if ($raw === null || !preg_match('/^\d+$/', $raw)) {
            throw HttpException::badRequest("$label must look like {$prefix}<number>.");
        }
        return (int) $raw;
    }
}
