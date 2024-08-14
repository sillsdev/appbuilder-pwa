import adapter from '@sveltejs/adapter-static';
import { sveltePreprocess } from 'svelte-preprocess';

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
            fallback: 'index.html'
        }),
        paths: {
            base: process.env.BUILD_BASE_PATH
        },
        alias: {
            $config: './config'
        }
    }
};

export default config;
