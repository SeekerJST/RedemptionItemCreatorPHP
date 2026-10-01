<?php
declare(strict_types=1);

/*
 * Loads the equipment catalog into the database as public (read-only) items.
 *
 *   php db/seed/import_catalog.php [--dry-run] [path/to/catalog.json]
 *
 * The catalog comes from docs/catalog_tools (the source of truth), in three steps:
 *   1. py docs/catalog_tools/gen_catalog_json.py       export the items as app rows
 *   2. cd client && npm run price-catalog               cost them with the app's rules
 *   3. php db/seed/import_catalog.php                   load them (this script)
 *
 * Each item gets a fixed ID derived from its name, so importing again replaces the same
 * items (their child rows too) instead of adding copies. Items dropped from the catalog
 * stay in the database until deleted by hand. Players' copies are separate items and are
 * never touched. Needs migrations 001-006 and config/config.php's db settings.
 */

use SilentSpirits\ItemCreator\Database;
use SilentSpirits\ItemCreator\Domain\Item;
use SilentSpirits\ItemCreator\Http\HttpException;
use SilentSpirits\ItemCreator\Repository\ItemRepository;
use SilentSpirits\ItemCreator\Repository\LookupRepository;

$root = dirname(__DIR__, 2);
require $root . '/src/bootstrap.php';

$args = array_slice($argv, 1);
$dryRun = in_array('--dry-run', $args, true);
$paths = array_values(array_filter($args, static fn (string $a): bool => $a !== '--dry-run'));
$path = $paths[0] ?? __DIR__ . '/catalog.json';

/** A stable UUID (version 5 layout) for a catalog item, from its name. */
function catalogItemId(string $name): string
{
    $hash = sha1('silentspirits:redemption-catalog:' . $name);
    $hash[12] = '5';
    $hash[16] = dechex((hexdec($hash[16]) & 0x3) | 0x8);
    return sprintf('%s-%s-%s-%s-%s', substr($hash, 0, 8), substr($hash, 8, 4), substr($hash, 12, 4), substr($hash, 16, 4), substr($hash, 20, 12));
}

function fail(string $message): void
{
    fwrite(STDERR, $message . "\n");
    exit(1);
}

$json = json_decode((string) @file_get_contents($path), true);
if (!is_array($json) || !isset($json['items']) || !is_array($json['items'])) {
    fail("Can't read a catalog from $path.");
}

$config = require $root . '/config/config.php';
$db = Database::connect($config['db']);
$lookups = new LookupRepository($db);
$items = new ItemRepository($db, $lookups);
$attributeIds = array_flip($lookups->attributeNames()); // AttributeName => AttributeID

$problems = [];
$prepared = [];
foreach ($json['items'] as $i => $entry) {
    $name = (string) ($entry['itemName'] ?? "items[$i]");
    if (!array_key_exists('CostRating', $entry)) {
        $problems[] = "$name: not priced. Run `npm run price-catalog` in client/ first.";
        continue;
    }
    $unknown = [];
    foreach ($entry['attributeList'] as $r => $row) {
        $attribute = (string) ($row['attribute'] ?? '');
        if (!isset($attributeIds[$attribute])) {
            $unknown[] = $attribute;
            continue;
        }
        $entry['attributeList'][$r]['AttributeName'] = $attributeIds[$attribute];
    }
    if ($unknown !== []) {
        $problems[] = "$name: attributes not in the attribute table: " . implode(', ', array_unique($unknown));
        continue;
    }
    try {
        $item = Item::fromArray($entry);
        $item->assertSavable();
    } catch (HttpException $e) {
        $problems[] = "$name: " . $e->getMessage();
        continue;
    }
    $prepared[] = [catalogItemId($name), $item];
}

if ($problems !== []) {
    fail(count($problems) . " item(s) can't be imported; nothing was written.\n  " . implode("\n  ", $problems));
}

if ($dryRun) {
    echo 'Dry run: ' . count($prepared) . " items are ready to import. Nothing was written.\n";
    exit(0);
}

$added = 0;
$replaced = 0;
foreach ($prepared as [$itemId, $item]) {
    $items->import($item, $itemId, true) ? $replaced++ : $added++;
}
echo "Imported " . count($prepared) . " public catalog items: $added new, $replaced replaced.\n";
