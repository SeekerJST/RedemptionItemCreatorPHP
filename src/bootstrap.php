<?php
declare(strict_types=1);

/*
 * Bootstrap for the Item Creator API: a tiny PSR-4 style autoloader so the
 * project runs on shared hosting without Composer.
 */
spl_autoload_register(static function (string $class): void {
    $prefix = 'SilentSpirits\\ItemCreator\\';
    if (strncmp($class, $prefix, strlen($prefix)) !== 0) {
        return;
    }

    $file = __DIR__ . '/' . str_replace('\\', '/', substr($class, strlen($prefix))) . '.php';
    if (is_file($file)) {
        require $file;
    }
});
