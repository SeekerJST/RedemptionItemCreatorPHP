import { fileURLToPath, URL } from 'node:url';

import { defineConfig, searchForWorkspaceRoot } from 'vite';
import plugin from '@vitejs/plugin-react';
import { env } from 'process';

// The PHP API (php -S localhost:5135 -t public dev/router.php). Override with PHP_API_URL.
const target = env.PHP_API_URL || 'http://localhost:5135';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [plugin()],
    // Relative asset URLs so the build works from a subfolder of the site, not just "/".
    base: './',
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    server: {
        // The book fonts live in ../Fonts (not in git: see .gitignore); theme.css loads Aerovias from there.
        fs: {
            allow: [searchForWorkspaceRoot(fileURLToPath(new URL('.', import.meta.url))), '../Fonts']
        },
        proxy: {
            '^/itemcreator': {
                target,
                changeOrigin: true
            }
        },
        port: parseInt(env.DEV_SERVER_PORT || '58967')
    },
    build: {
        // Build straight into the PHP web root. Not emptied, because public/
        // also holds api/ and .htaccess; "prebuild" clears the old assets instead.
        outDir: '../public',
        emptyOutDir: false
    }
})
