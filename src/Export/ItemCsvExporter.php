<?php
declare(strict_types=1);

namespace SilentSpirits\ItemCreator\Export;

use SilentSpirits\ItemCreator\Domain\Item;
use SilentSpirits\ItemCreator\Http\HttpException;

/**
 * Renders an item as the CSV sheet that ExportItemToCVS produced in C#.
 * The C# built the file by string concatenation, so any comma in a name
 * ("Harder, Better, Faster, Stronger") shifted the columns; row() quotes fields that need it.
 */
final class ItemCsvExporter
{
    private const SCALE_NAMES = ['1' => 'Minor', '2' => 'Moderate', '3' => 'Major'];
    private const SUB_ROW_MARK = '> ';

    /** @param array<int, string> $attributeNames AttributeID => AttributeName */
    public function export(Item $item, array $attributeNames): string
    {
        $out = fopen('php://temp', 'r+');

        $this->row($out, ['Item Name', $item->itemName]);
        $this->row($out, ['Item Size', $item->itemSize]);
        $this->row($out, ['Category', $item->category]);
        $this->row($out, ['Cost Rating', $item->costRating]);
        $this->row($out, ['Description', $item->description]);
        fwrite($out, "\n");

        if ($item->attributes !== []) {
            $modifierNames = array_column($item->modifiers, 'name', 'id');
            $taskNames = array_column($item->tasks, 'name', 'id');

            $this->row($out, ['System', 'Attribute Name', 'Implementation', 'Scale', 'Rank', 'Build Points', 'Power Slots']);
            foreach (self::treeOrder($item->attributes) as $row) {
                $name = $attributeNames[$row['attributeId']] ?? null;
                if ($name === null) {
                    throw HttpException::badRequest("attributeList contains unknown AttributeName {$row['attributeId']}.");
                }

                // Modifier and Task rows are qualified by the name picked for that grid row.
                if ($name === 'Modifier' && isset($modifierNames[$row['id']])) {
                    $name .= ' - ' . $modifierNames[$row['id']];
                } elseif ($name === 'Task' && isset($taskNames[$row['id']])) {
                    $name .= ' - ' . $taskNames[$row['id']];
                }

                // A sub-row follows its parent, marked with "> ".
                if ($row['parentId'] !== null) {
                    $name = self::SUB_ROW_MARK . $name;
                }

                $this->row($out, [
                    $row['system'],
                    $name,
                    self::implementationLabel($row['implementation']),
                    self::SCALE_NAMES[$row['scale'] ?? ''] ?? '',
                    $row['rank'],
                    $row['buildPoints'],
                    $row['powerSlots'],
                ]);
            }
        }
        fwrite($out, "\n");

        if ($item->tags !== []) {
            $this->row($out, ['Tag Description', 'Rank', 'Is Free', 'Build Points']);
            foreach ($item->tags as $row) {
                $this->row($out, [
                    $row['desc'],
                    $row['rank'],
                    $row['free'] === null ? '' : ($row['free'] ? 'True' : 'False'),
                    $row['buildPoints'],
                ]);
            }
        }
        fwrite($out, "\n");

        if ($item->limits !== []) {
            $this->row($out, ['Limit Description', 'Scale', 'Build Points']);
            foreach ($item->limits as $row) {
                if ($row['desc'] === '') {
                    continue; // the client always sends one blank starter row
                }
                $this->row($out, [$row['desc'], self::SCALE_NAMES[$row['scale'] ?? ''] ?? '', $row['buildPoints']]);
            }
        }
        fwrite($out, "\n");

        rewind($out);
        $csv = (string) stream_get_contents($out);
        fclose($out);
        return $csv;
    }

    /**
     * Top-level rows in their order, each followed by its sub-rows. The client appends a new
     * sub-row at the end of the list, so list order alone doesn't keep it under its parent.
     *
     * @param list<array{id: int, parentId: ?int}> $attributes
     * @return list<array<string, mixed>>
     */
    private static function treeOrder(array $attributes): array
    {
        $children = [];
        foreach ($attributes as $row) {
            if ($row['parentId'] !== null) {
                $children[$row['parentId']][] = $row;
            }
        }

        $ordered = [];
        foreach ($attributes as $row) {
            if ($row['parentId'] === null) {
                $ordered[] = $row;
                array_push($ordered, ...($children[$row['id']] ?? []));
            }
        }
        return $ordered;
    }

    /**
     * The client stores implementations as rule keys ("kinetic", "laserLink"); the rule
     * names live in the client, so spell the key out: "Kinetic", "Laser Link".
     */
    private static function implementationLabel(?string $key): string
    {
        return $key === null ? '' : ucwords(trim((string) preg_replace('/(?<=[a-z])(?=[A-Z])/', ' ', $key)));
    }

    /**
     * RFC 4180 row that only quotes fields that need it. fputcsv also quotes
     * anything containing a space, which is valid but noisier than the C# output.
     *
     * @param resource $out
     * @param array<mixed> $fields
     */
    private function row($out, array $fields): void
    {
        $cells = array_map(static function ($field): string {
            $text = (string) $field;
            return strpbrk($text, ",\"\r\n") === false ? $text : '"' . str_replace('"', '""', $text) . '"';
        }, $fields);

        fwrite($out, implode(',', $cells) . "\n");
    }
}
