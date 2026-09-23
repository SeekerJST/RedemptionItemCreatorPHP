<?php
declare(strict_types=1);

/*
 * Only here so pressing F5 in Visual Studio works: PHP's built-in server,
 * when started without a router script, sends unknown paths to this file.
 * The real entry points are public/api/index.php (production, via .htaccess)
 * and dev/router.php (php -S localhost:5135 -t public dev/router.php).
 */
$_SERVER['REQUEST_URI'] = $_SERVER['REQUEST_URI'] ?? '/';
if (preg_match('#(^|/)itemcreator(/|$)#i', (string) parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH))) {
    require __DIR__ . '/public/api/index.php';
    return;
}

header('Content-Type: text/html; charset=utf-8');
?>
<!doctype html>
<title>Redemption Item Creator API</title>
<h1>Redemption Item Creator API</h1>
<p>The API is running. Try <a href="itemcreator/getitemsizes">itemcreator/getitemsizes</a>.</p>
<p>For the React app, run <code>npm run dev</code> in <code>client/</code> and open
   <a href="http://localhost:58967">http://localhost:58967</a>.</p>
