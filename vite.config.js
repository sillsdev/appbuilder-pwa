// vite.config.js

// polyfill code sourced from: https://medium.com/@ftaioli/using-node-js-builtin-modules-with-vite-6194737c2cd2
// yarn add --dev @esbuild-plugins/node-globals-polyfill
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
// yarn add --dev @esbuild-plugins/node-modules-polyfill
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill';
import { sveltekit } from '@sveltejs/kit/vite';
// You don't need to add this to deps, it's included by @esbuild-plugins/node-modules-polyfill
import rollupNodePolyFill from 'rollup-plugin-node-polyfills';
import { createLogger } from 'vite';

const logger = createLogger();
const loggerWarn = logger.warn;
/** @type {((msg: string) => boolean)[]} */
const matchers = [
    // "pinch" and "swipe" are imported from external module "svelte-gestures" but never used in "src/routes/text/+page.svelte".
    (msg) =>
        !!(
            msg.match(/"pinch"/) &&
            msg.match(/"swipe"/) &&
            msg.match(/"svelte-gestures"/) &&
            msg.match(/"src\/routes\/text\/\+page.svelte"/)
        ),
    // [plugin vite:resolve] Module "fs" has been externalized for browser compatibility, imported by "node_modules/sql.js/dist/sql-wasm.js".
    (msg) =>
        !!(
            msg.match(/vite:resolve/) &&
            msg.match(/externalized/) &&
            msg.match(/sql\.js\/dist\/sql-wasm\.js/)
        ),
    // [plugin vite:resolve] Module "process" has been externalized for browser compatibility, imported by "node_modules/@firebase/util/dist/index.esm2017.js".
    (msg) => !!(msg.match(/vite:resolve/) && msg.match(/externalized/) && msg.match(/@firebase/)),
    /*
    (!) Some chunks are larger than 500 kB after minification. Consider:
        - Using dynamic import() to code-split the application
        - Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
        - Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
    */
    (msg) => !!msg.match(/Some chunks are larger than/)
];
/** @type {(msg: string, options: any) => void} */
logger.warn = (msg, options) => {
    // suppress specific warning messages on build
    if (process.env.NODE_ENV === 'development' || !matchers.some((m) => m(msg))) {
        loggerWarn(msg, options);
    }
};

/** @type {import('vite').UserConfig} */
const config = {
    plugins: [sveltekit()],
    worker: {
        format: 'es',
        plugins: () => []
    },
    resolve: {
        alias: {
            // This Rollup aliases are extracted from @esbuild-plugins/node-modules-polyfill,
            // see https://github.com/remorses/esbuild-plugins/blob/master/node-modules-polyfill/src/polyfills.ts
            // process and buffer are excluded because already managed
            // by node-globals-polyfill
            //util: 'rollup-plugin-node-polyfills/polyfills/util',
            //sys: 'util',
            //events: 'rollup-plugin-node-polyfills/polyfills/events',
            stream: 'rollup-plugin-node-polyfills/polyfills/stream'
            // //path: 'rollup-plugin-node-polyfills/polyfills/path',
            // querystring: 'rollup-plugin-node-polyfills/polyfills/qs',
            // punycode: 'rollup-plugin-node-polyfills/polyfills/punycode',
            // url: 'rollup-plugin-node-polyfills/polyfills/url',
            // string_decoder: 'rollup-plugin-node-polyfills/polyfills/string-decoder',
            // http: 'rollup-plugin-node-polyfills/polyfills/http',
            // https: 'rollup-plugin-node-polyfills/polyfills/http',
            // os: 'rollup-plugin-node-polyfills/polyfills/os',
            // assert: 'rollup-plugin-node-polyfills/polyfills/assert',
            // constants: 'rollup-plugin-node-polyfills/polyfills/constants',
            // _stream_duplex: 'rollup-plugin-node-polyfills/polyfills/readable-stream/duplex',
            // _stream_passthrough:
            //     'rollup-plugin-node-polyfills/polyfills/readable-stream/passthrough',
            // _stream_readable: 'rollup-plugin-node-polyfills/polyfills/readable-stream/readable',
            // _stream_writable: 'rollup-plugin-node-polyfills/polyfills/readable-stream/writable',
            // _stream_transform: 'rollup-plugin-node-polyfills/polyfills/readable-stream/transform',
            // timers: 'rollup-plugin-node-polyfills/polyfills/timers',
            // console: 'rollup-plugin-node-polyfills/polyfills/console',
            // vm: 'rollup-plugin-node-polyfills/polyfills/vm',
            // zlib: 'rollup-plugin-node-polyfills/polyfills/zlib',
            // tty: 'rollup-plugin-node-polyfills/polyfills/tty',
            // domain: 'rollup-plugin-node-polyfills/polyfills/domain'
        }
    },
    optimizeDeps: {
        esbuildOptions: {
            // Node.js global to browser globalThis
            define: {
                global: 'globalThis'
            },
            // Enable esbuild polyfill plugins
            plugins: [
                NodeGlobalsPolyfillPlugin({
                    process: true,
                    buffer: true
                }),
                NodeModulesPolyfillPlugin()
            ]
        }
    },
    build: {
        rollupOptions: {
            plugins: [
                // Enable rollup polyfills plugin
                // used during production bundling
                rollupNodePolyFill()
            ]
        }
    },
    test: {
        environment: 'jsdom'
    },
    customLogger: logger
};
export default config;
