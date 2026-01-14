import { readFileSync } from 'fs';
import adapter from '@sveltejs/adapter-static';
import { sveltePreprocess } from 'svelte-preprocess';

// Read template version from package.json
const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
const templateVersion = packageJson.version;
const buildTimestamp = Date.now();

/** @type {import('@sveltejs/kit').Config} */
const config = {
    // Consult https://github.com/sveltejs/svelte-preprocess
    // for more information about preprocessors
    preprocess: [
        sveltePreprocess({
            postcss: true
        })
    ],

    kit: {
        adapter: adapter({
            fallback: '200.html'
        }),
        paths: {
            base: process.env.BUILD_BASE_PATH
        },
        alias: {
            $config: './config',
            $static: './static',
            $assets: './src/gen-assets/'
        },
        router: {
            type: 'hash'
        },
        serviceWorker: {
            options: {
                scope: process.env.BUILD_BASE_PATH
            }
        },
        version: {
            name: `${templateVersion}-${buildTimestamp}`
        }
    }
};

export default config;
