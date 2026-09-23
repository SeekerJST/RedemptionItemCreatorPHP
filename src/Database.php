<?php
declare(strict_types=1);

namespace SilentSpirits\ItemCreator;

use PDO;

final class Database
{
    /** @param array{host: string, port?: int, name: string, user: string, pass: string} $db */
    public static function connect(array $db): PDO
    {
        $dsn = sprintf(
            'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
            $db['host'],
            $db['port'] ?? 3306,
            $db['name']
        );

        return new PDO($dsn, $db['user'], $db['pass'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            // Native prepares make mysqlnd return INT columns as PHP ints, so the
            // lookup endpoints emit numbers (not "1") exactly like the C# DataTable JSON.
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::ATTR_STRINGIFY_FETCHES => false,
        ]);
    }
}
