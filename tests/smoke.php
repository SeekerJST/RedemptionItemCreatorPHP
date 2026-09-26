<?php
declare(strict_types=1);

/*
 * End-to-end smoke test against a running API. Creates, reads, updates,
 * exports, and deletes a throwaway item, then checks the error paths.
 *
 *   php -S localhost:5135 -t public dev/router.php     (in one terminal)
 *   php tests/smoke.php [http://localhost:5135]        (in another)
 *
 * Needs allow_writes => true in config/config.php.
 */
$base = rtrim($argv[1] ?? 'http://localhost:5135', '/') . '/itemcreator';
$failures = 0;

/** @return array{0: int, 1: string, 2: array<string, string>} status, body, headers */
function call(string $method, string $url, ?string $body = null): array
{
    $context = stream_context_create(['http' => [
        'method' => $method,
        'header' => "Content-Type: application/json\r\n",
        'content' => $body ?? '',
        'ignore_errors' => true, // return 4xx/5xx bodies instead of failing
    ]]);
    $responseBody = (string) @file_get_contents($url, false, $context);

    $status = 0;
    $headers = [];
    foreach ($http_response_header ?? [] as $line) {
        if (preg_match('#^HTTP/\S+ (\d+)#', $line, $m)) {
            $status = (int) $m[1];
        } elseif (strpos($line, ':') !== false) {
            [$name, $value] = explode(':', $line, 2);
            $headers[strtolower(trim($name))] = trim($value);
        }
    }
    return [$status, $responseBody, $headers];
}

function check(string $label, bool $ok, string $extra = ''): void
{
    global $failures;
    echo ($ok ? '  ok   ' : '  FAIL ') . $label . ($ok || $extra === '' ? '' : "\n         $extra") . "\n";
    if (!$ok) {
        $failures++;
    }
}

// Shaped like the object App.jsx builds, quirks included: string PowerSlots,
// grid bookkeeping keys, a comma inside a tag name, and a blank limit row.
$item = [
    'itemID' => null,
    'itemName' => 'Smoke Test Blaster',
    'itemSize' => 'SMALL',
    'CostRating' => 2,
    'modifierList' => [['modifierID' => 'Modifier_2', 'modifierName' => 'Firearms']],
    'taskList' => [['taskID' => 'Task_3', 'taskName' => 'Hacking']],
    'attributeList' => [
        ['id' => 1, 'AttributeName' => 3, 'Scale' => '1', 'Rank' => '4', 'BuildPoints' => 36, 'PowerSlots' => '0', '$level' => 0, 'AttributeSystem' => 'Weapons'],
        ['id' => 2, 'AttributeName' => 20, 'Scale' => '2', 'Rank' => '2', 'BuildPoints' => 20, 'PowerSlots' => 0, 'data' => [], 'AttributeSystem' => 'Modifiers'],
        ['id' => 3, 'AttributeName' => 26, 'Scale' => '1', 'Rank' => '18', 'BuildPoints' => 36, 'PowerSlots' => 1, 'AttributeSystem' => 'Tasks'],
        // Sub-rows of the Attack (row 1), listed after other rows and out of id order, as a
        // drag leaves them: the order must survive a save, and the export must regroup them.
        ['id' => 5, 'parentId' => 1, 'AttributeName' => 24, 'Scale' => '1', 'Rank' => 2, 'Implementation' => 'ammunition', 'BuildPoints' => 10, 'PowerSlots' => 0, 'AttributeSystem' => 'Weapons'],
        ['id' => 4, 'parentId' => 1, 'AttributeName' => 40, 'Scale' => '1', 'Rank' => 2, 'Implementation' => 'kinetic', 'BuildPoints' => 27, 'PowerSlots' => 0, 'AttributeSystem' => 'Weapons'],
    ],
    'limitList' => [
        ['id' => 1, 'LimitDesc' => 'No Far Range', 'LimitScale' => '2', 'BuildPoints' => -20],
        ['id' => 2, 'LimitDesc' => '', 'LimitScale' => 1, 'BuildPoints' => 0],
    ],
    'tagList' => [['id' => 1, 'TagDesc' => 'Harder, Better, Faster, Stronger', 'TagRank' => 1, 'TagFree' => false, 'BuildPoints' => 5]],
];

echo "Lookups\n";
[$status, $body] = call('GET', "$base/getitemsizes/");
$sizes = json_decode($body, true);
check('getitemsizes returns an ID => name map', $status === 200 && is_array($sizes) && in_array('SMALL', $sizes, true), $body);
foreach (['getitemsizesds', 'getskillsds', 'getitemattributesds', 'getattributescaleds', 'getallitems'] as $action) {
    [$status, $body] = call('GET', "$base/$action/");
    check("$action returns a JSON array", $status === 200 && is_array(json_decode($body, true)), "HTTP $status $body");
}

echo "Create\n";
[$status, $body] = call('POST', "$base/createitem", json_encode($item));
$created = json_decode($body, true);
$id = $created['itemID'] ?? null;
check('createitem returns 201 with a new itemID', $status === 201 && is_string($id) && strlen($id) === 36, "HTTP $status $body");
if ($id === null) {
    exit("Can't continue without an item.\n");
}

echo "Read\n";
[$status, $body] = call('GET', "$base/getitem/$id");
$read = json_decode($body, true);
[, $body] = call('GET', "$base/getallitems");
check('getallitems lists the new private item while writes are on', in_array($id, array_column(json_decode($body, true) ?? [], 'itemID'), true), $body);
check('getitem returns the item',$status === 200 && ($read['itemName'] ?? null) === 'Smoke Test Blaster', "HTTP $status $body");
check('size comes back by name', ($read['itemSize'] ?? null) === 'SMALL');
check('CostRating is saved', ($read['CostRating'] ?? null) === 2);
check('attributes round-trip, with AttributeSystem', count($read['attributeList'] ?? []) === 5 && $read['attributeList'][0]['AttributeSystem'] === 'Weapons', $body);
check('attributes come back in the saved order, not id order', array_column($read['attributeList'] ?? [], 'id') === [1, 2, 3, 5, 4], $body);
check('parentId round-trips (null for top-level rows)', array_column($read['attributeList'] ?? [], 'parentId') === [null, null, null, 1, 1], $body);
check('Implementation round-trips (null when not set)', array_column($read['attributeList'] ?? [], 'Implementation') === [null, null, null, 'ammunition', 'kinetic'], $body);
check('PowerSlots "0" string is stored as a number', ($read['attributeList'][0]['PowerSlots'] ?? null) === 0);
check('attribute Rank "4" is saved and comes back as the integer 4', ($read['attributeList'][0]['Rank'] ?? null) === 4, $body);
check('TagFree comes back as a boolean', ($read['tagList'][0]['TagFree'] ?? null) === false, $body);
check('modifier/task IDs keep their prefixes', ($read['modifierList'][0]['modifierID'] ?? null) === 'Modifier_2' && ($read['taskList'][0]['taskID'] ?? null) === 'Task_3');

echo "Update\n";
$update = $read;
$update['itemName'] = 'Smoke Test Blaster Mk II';
$update['itemSize'] = 'medium'; // size names match case-insensitively
$update['tagList'] = [];
$update['attributeList'] = array_slice($update['attributeList'], 0, 1);
[$status, $body] = call('PUT', "$base/updateitem/$id", json_encode($update));
check('updateitem returns 200', $status === 200, "HTTP $status $body");
[, $body] = call('GET', "$base/getitem/$id");
$reread = json_decode($body, true);
check('update replaced name, size, and child rows',
    ($reread['itemName'] ?? null) === 'Smoke Test Blaster Mk II'
    && ($reread['itemSize'] ?? null) === 'MEDIUM'
    && count($reread['attributeList']) === 1
    && $reread['tagList'] === [], $body);
[$status] = call('PUT', "$base/updateitem/not-$id", json_encode($update));
check('updateitem rejects a URL ID that differs from the body', $status === 400);

echo "Export\n";
[$status, $body, $headers] = call('POST', "$base/exportitemtocvs/download", json_encode($item));
check('POST export returns a CSV attachment', $status === 200 && strpos($headers['content-disposition'] ?? '', 'Smoke Test Blaster.csv') !== false, "HTTP $status $body");
check('commas in names are quoted', strpos($body, '"Harder, Better, Faster, Stronger",1,False,5') !== false, $body);
check('Modifier/Task rows are qualified with their names', strpos($body, 'Modifier - Firearms') !== false && strpos($body, 'Task - Hacking') !== false, $body);
check('attribute header has an Implementation column', strpos($body, "System,Attribute Name,Implementation,Scale,Rank,Build Points,Power Slots\n") !== false, $body);
check('sub-rows follow their parent, marked and with their implementation',
    strpos($body, "Weapons,Attack,,Minor,4,36,0\nWeapons,> Resource,Ammunition,Minor,2,10,0\nWeapons,> Attack Multiplier,Kinetic,Minor,2,27,0\nModifiers,") !== false, $body);
check('blank limit rows are skipped', substr_count($body, 'No Far Range') === 1 && strpos($body, ",Minor,0\n") === false, $body);
[$status, $getBody] = call('GET', "$base/exportitemtocvs/download?item=" . rawurlencode(json_encode($item)));
check('GET ?item= export (the C# contract) matches POST', $status === 200 && $getBody === $body);

echo "Delete\n";
[$status] = call('DELETE', "$base/deleteitem/$id");
check('deleteitem returns 204', $status === 204);
[$status] = call('GET', "$base/getitem/$id");
check('deleted item is gone (404)', $status === 404);
[$status] = call('DELETE', "$base/deleteitem/$id");
check('deleting again is a 404', $status === 404);

echo "Validation\n";
[$status] = call('POST', "$base/createitem", '{not json');
check('malformed JSON is a 400', $status === 400);
[$status, $body] = call('POST', "$base/createitem", json_encode(['itemName' => 'X', 'itemSize' => 'GARGANTUAN']));
check('unknown size is a 400 naming the valid sizes', $status === 400 && strpos($body, 'COLOSSAL') !== false, $body);
[$status] = call('POST', "$base/createitem", json_encode(['itemName' => 'X', 'itemSize' => 'SMALL', 'attributeList' => [['id' => 1, 'AttributeName' => 'lots']]]));
check('non-numeric attribute ID is a 400', $status === 400);
[$status, $body] = call('POST', "$base/createitem", json_encode(['itemName' => 'X', 'itemSize' => 'SMALL', 'attributeList' => [['id' => 1, 'AttributeName' => 5, 'Rank' => 'high']]]));
check('non-numeric attribute Rank is a 400', $status === 400 && strpos($body, 'attributeList[0].Rank') !== false, $body);
[$status, $body] = call('POST', "$base/createitem", json_encode(['itemName' => 'X', 'itemSize' => 'SMALL', 'attributeList' => [
    ['id' => 1, 'AttributeName' => 3], ['id' => 2, 'parentId' => 9, 'AttributeName' => 40],
]]));
check('a parentId matching no row is a 400', $status === 400 && strpos($body, 'attributeList[1].parentId') !== false, $body);
[$status, $body] = call('POST', "$base/createitem", json_encode(['itemName' => 'X', 'itemSize' => 'SMALL', 'attributeList' => [
    ['id' => 1, 'AttributeName' => 3], ['id' => 2, 'parentId' => 1, 'AttributeName' => 40], ['id' => 3, 'parentId' => 2, 'AttributeName' => 40],
]]));
check('sub-rows nested two deep are a 400', $status === 400 && strpos($body, 'two levels deep') !== false, $body);
[$status, , $headers] = call('GET', "$base/createitem");
check('wrong method is a 405 with Allow', $status === 405 && ($headers['allow'] ?? '') === 'POST');
[$status] = call('GET', "$base/nosuchaction");
check('unknown action is a 404', $status === 404);

echo $failures === 0 ? "\nAll checks passed.\n" : "\n$failures check(s) failed.\n";
exit($failures === 0 ? 0 : 1);
