// Starts the whole app for local development: the PHP API (php -S ... dev/router.php) and
// the Vite dev server for the React client. `npm run dev` in client/ runs this, and so does
// Run in Visual Studio (the client project's StartupCommand).
//
// Stopping Vite (Ctrl+C, or Stop in Visual Studio) stops the PHP server too. If something is
// already listening on the API port, it's reused instead of starting a second server.
//
// Environment:
//   PHP_BINARY    php.exe to use. Default: IIS Express's PHP 8.0 if installed, else `php` on PATH.
//   PHP_API_URL   where the API runs (and where Vite proxies /itemcreator). Default http://localhost:5135.
// Arguments after `npm run dev --` go to Vite (e.g. `npm run dev -- --open`).

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createConnection } from 'node:net';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const clientDir = join(root, 'client');
const apiUrl = new URL(process.env.PHP_API_URL || 'http://localhost:5135');
const apiHost = apiUrl.hostname;
const apiPort = Number(apiUrl.port || 80);

const IIS_EXPRESS_PHP = 'C:\\Program Files\\IIS Express\\PHP\\v8.0\\php.exe';
const phpBinary = process.env.PHP_BINARY || (existsSync(IIS_EXPRESS_PHP) ? IIS_EXPRESS_PHP : 'php');

const log = (message) => console.log(`[dev] ${message}`);

/** True if something accepts connections on host:port. */
function isListening(host, port) {
    return new Promise((done) => {
        const socket = createConnection({ host, port });
        socket.setTimeout(500);
        socket.once('connect', () => { socket.destroy(); done(true); });
        socket.once('timeout', () => { socket.destroy(); done(false); });
        socket.once('error', () => done(false));
    });
}

let php = null;
let vite = null;
let stopping = false;

function stop(code) {
    if (stopping) {
        return;
    }
    stopping = true;
    php?.kill();
    vite?.kill();
    process.exitCode = code;
}

if (!existsSync(join(root, 'config', 'config.php'))) {
    log('config/config.php is missing: copy config/config.example.php and fill in the DB credentials.');
    log('The UI will start, but every API call will fail until then.');
}

if (await isListening(apiHost, apiPort)) {
    log(`Something is already listening on ${apiHost}:${apiPort}; using it as the API.`);
} else {
    log(`Starting the PHP API on ${apiHost}:${apiPort} (${phpBinary})`);
    php = spawn(phpBinary, ['-S', `${apiHost}:${apiPort}`, '-t', 'public', join('dev', 'router.php')], {
        cwd: root,
        stdio: 'inherit',
    });
    php.on('error', (e) => {
        log(`Couldn't start PHP (${e.message}). Install PHP 8 or set PHP_BINARY to php.exe.`);
        stop(1);
    });
    php.on('exit', (code) => {
        php = null;
        if (!stopping) {
            log(`The PHP API stopped (exit code ${code}). The UI keeps running; restart to bring the API back.`);
        }
    });
}

if (!stopping) {
    // Vite's own entry point, run with this Node: no shell, so stopping it stops it (not just a wrapper).
    vite = spawn(process.execPath, [join(clientDir, 'node_modules', 'vite', 'bin', 'vite.js'), ...process.argv.slice(2)], {
        cwd: clientDir,
        stdio: 'inherit',
        env: { ...process.env, PHP_API_URL: apiUrl.origin },
    });
    vite.on('error', (e) => {
        log(`Couldn't start Vite (${e.message}). Run \`npm install\` in client/ first.`);
        stop(1);
    });
    vite.on('exit', (code) => {
        vite = null;
        stop(code ?? 0);
    });
}

for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGBREAK']) {
    process.on(signal, () => stop(0));
}
process.on('exit', () => php?.kill());
