import { readFileSync } from 'fs';
import adapter from '@sveltejs/adapter-static';
import { sveltePreprocess } from 'svelte-preprocess';

// Read template version from package.json
const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
const templateVersion = packageJson.version;
const buildTimestamp = Date.now();

// Scope should end with a slash if defined
// BUILD_BASE_PATH should not have a trailing slash, but just make sure
const serviceWorkerScope = process.env.BUILD_BASE_PATH
    ? process.env.BUILD_BASE_PATH.endsWith('/')
        ? process.env.BUILD_BASE_PATH
        : process.env.BUILD_BASE_PATH + '/'
    : '/';

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
                scope: serviceWorkerScope
            }
        },
        version: {
            name: `${templateVersion}-${buildTimestamp}`
        }
    }
};

export default config;
