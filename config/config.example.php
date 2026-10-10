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

    // The site-wide switch for saving items: false makes the site read-only (e.g. during
    // maintenance). With it on, saving still takes a signed-in account with a confirmed email.
    'allow_writes' => false,

    // Where emailed links (confirm your account, reset your password) send people: the client's
    // address. Locally, the Vite dev server; on the site, the Gear Creator's URL.
    'app_url' => 'https://www.silentspiritsgames.com/itemcreator/',

    // The no-reply mailbox. transport 'smtp' sends for real; 'log' writes each email to a file
    // (log_dir, default: the system temp dir's itemcreator-mail/) and sends nothing.
    'mail' => [
        'transport' => 'smtp',
        'host' => 'smtp.dreamhost.com',
        'port' => 465,
        'encryption' => 'ssl',
        'username' => 'no-reply@silentspiritsgames.com',
        'password' => 'the_mailbox_password',
        'from' => 'no-reply@silentspiritsgames.com',
        'from_name' => 'SilentSpirits Games',
    ],

    // Sign in with Google (OAuth / OpenID Connect). From Google Cloud > APIs & Services > Credentials,
    // a "Web application" client whose redirect URI is app_url + 'itemcreator/auth/google/callback'.
    // Leave client_id empty to hide the button.
    'google' => [
        'client_id' => '',
        'client_secret' => 'the_client_secret',
    ],

    // The sign-in cookie. One name site-wide, so the rest of the SilentSpirits site can share it.
    // secure: null = only over HTTPS when the request is HTTPS (true on the live site).
    'session' => [
        'name' => 'SSGS_SESSION',
        'secure' => null,
        'lifetime_days' => 30,
    ],

    // true = error responses include exception messages. Local dev only.
    'debug' => false,
];
