<?php
// Copy this file to config.php (gitignored) and fill in real values.
// Keep config/ outside the public web folder in production.
return [
    'db' => [
        'host' => 'localhost',
        'port' => 3306,
        'name' => 'itemcreator',
        'user' => 'your_db_user',
        'pass' => 'your_db_password',
    ],

    // Create/update/delete endpoints. There's no login yet, so leave this
    // false on the public site unless you want anyone to be able to save items.
    'allow_writes' => false,

    // true = error responses include exception messages. Local dev only.
    'debug' => false,
];
