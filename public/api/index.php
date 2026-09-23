<?php
declare(strict_types=1);

/*
 * Single entry point for every /itemcreator/* API request (see ../.htaccess).
 *
 * By default src/ and config/ sit next to public/. If you deploy public/ into
 * a web folder and keep src/ + config/ elsewhere (recommended), point to them
 * with "SetEnv ITEMCREATOR_ROOT /home/<user>/itemcreator" in ../.htaccess.
 */
$root = $_SERVER['ITEMCREATOR_ROOT']
    ?? $_SERVER['REDIRECT_ITEMCREATOR_ROOT'] // Apache renames env vars after an internal rewrite
    ?? dirname(__DIR__, 2);

require $root . '/src/bootstrap.php';

\SilentSpirits\ItemCreator\App::run($root);
