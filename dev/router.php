<?php
declare(strict_types=1);

/*
 * Router for PHP's built-in web server, standing in for public/.htaccess locally:
 *
 *   php -S localhost:5135 -t public dev/router.php
 *
 * 5135 is the port the React dev server proxies /itemcreator to (client/vite.config.js).
 */
$path = (string) parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);

if (preg_match('#(^|/)itemcreator(/|$)#i', $path)) {
    require __DIR__ . '/../public/api/index.php';
    return true;
}

$public = realpath(__DIR__ . '/../public');
$file = realpath($public . $path);
if ($file !== false && is_file($file) && strpos($file, $public) === 0) {
    return false; // let the built-in server send the static file
}

$index = $public . '/index.html';
if (is_file($index)) {
    header('Content-Type: text/html; charset=utf-8');
    readfile($index);
    return true;
}

http_response_code(404);
header('Content-Type: text/plain; charset=utf-8');
echo "No React build in public/ yet. Run the Vite dev server (cd client && npm run dev) or build it (npm run build).\n";
return true;
