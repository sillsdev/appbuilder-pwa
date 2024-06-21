// vite.config.js
import { sveltekit } from "file:///C:/Users/ReiLe/Google%20Drive/IT/Internship-2024/appbuilder-pwa/node_modules/@sveltejs/kit/src/exports/vite/index.js";
import { NodeGlobalsPolyfillPlugin } from "file:///C:/Users/ReiLe/Google%20Drive/IT/Internship-2024/appbuilder-pwa/node_modules/@esbuild-plugins/node-globals-polyfill/dist/index.js";
import { NodeModulesPolyfillPlugin } from "file:///C:/Users/ReiLe/Google%20Drive/IT/Internship-2024/appbuilder-pwa/node_modules/@esbuild-plugins/node-modules-polyfill/dist/index.js";
import rollupNodePolyFill from "file:///C:/Users/ReiLe/Google%20Drive/IT/Internship-2024/appbuilder-pwa/node_modules/rollup-plugin-node-polyfills/dist/index.js";
var config = {
  plugins: [sveltekit()],
  resolve: {
    alias: {
      // This Rollup aliases are extracted from @esbuild-plugins/node-modules-polyfill,
      // see https://github.com/remorses/esbuild-plugins/blob/master/node-modules-polyfill/src/polyfills.ts
      // process and buffer are excluded because already managed
      // by node-globals-polyfill
      //util: 'rollup-plugin-node-polyfills/polyfills/util',
      //sys: 'util',
      //events: 'rollup-plugin-node-polyfills/polyfills/events',
      stream: "rollup-plugin-node-polyfills/polyfills/stream"
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
        global: "globalThis"
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
    environment: "jsdom"
  }
};
var vite_config_default = config;
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxSZWlMZVxcXFxHb29nbGUgRHJpdmVcXFxcSVRcXFxcSW50ZXJuc2hpcC0yMDI0XFxcXGFwcGJ1aWxkZXItcHdhXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxSZWlMZVxcXFxHb29nbGUgRHJpdmVcXFxcSVRcXFxcSW50ZXJuc2hpcC0yMDI0XFxcXGFwcGJ1aWxkZXItcHdhXFxcXHZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9SZWlMZS9Hb29nbGUlMjBEcml2ZS9JVC9JbnRlcm5zaGlwLTIwMjQvYXBwYnVpbGRlci1wd2Evdml0ZS5jb25maWcuanNcIjsvLyB2aXRlLmNvbmZpZy5qc1xyXG5pbXBvcnQgeyBzdmVsdGVraXQgfSBmcm9tICdAc3ZlbHRlanMva2l0L3ZpdGUnO1xyXG4vLyBwb2x5ZmlsbCBjb2RlIHNvdXJjZWQgZnJvbTogaHR0cHM6Ly9tZWRpdW0uY29tL0BmdGFpb2xpL3VzaW5nLW5vZGUtanMtYnVpbHRpbi1tb2R1bGVzLXdpdGgtdml0ZS02MTk0NzM3YzJjZDJcclxuLy8geWFybiBhZGQgLS1kZXYgQGVzYnVpbGQtcGx1Z2lucy9ub2RlLWdsb2JhbHMtcG9seWZpbGxcclxuaW1wb3J0IHsgTm9kZUdsb2JhbHNQb2x5ZmlsbFBsdWdpbiB9IGZyb20gJ0Blc2J1aWxkLXBsdWdpbnMvbm9kZS1nbG9iYWxzLXBvbHlmaWxsJztcclxuLy8geWFybiBhZGQgLS1kZXYgQGVzYnVpbGQtcGx1Z2lucy9ub2RlLW1vZHVsZXMtcG9seWZpbGxcclxuaW1wb3J0IHsgTm9kZU1vZHVsZXNQb2x5ZmlsbFBsdWdpbiB9IGZyb20gJ0Blc2J1aWxkLXBsdWdpbnMvbm9kZS1tb2R1bGVzLXBvbHlmaWxsJztcclxuLy8gWW91IGRvbid0IG5lZWQgdG8gYWRkIHRoaXMgdG8gZGVwcywgaXQncyBpbmNsdWRlZCBieSBAZXNidWlsZC1wbHVnaW5zL25vZGUtbW9kdWxlcy1wb2x5ZmlsbFxyXG5pbXBvcnQgcm9sbHVwTm9kZVBvbHlGaWxsIGZyb20gJ3JvbGx1cC1wbHVnaW4tbm9kZS1wb2x5ZmlsbHMnO1xyXG5cclxuLyoqIEB0eXBlIHtpbXBvcnQoJ3ZpdGUnKS5Vc2VyQ29uZmlnfSAqL1xyXG5jb25zdCBjb25maWcgPSB7XHJcbiAgICBwbHVnaW5zOiBbc3ZlbHRla2l0KCldLFxyXG4gICAgcmVzb2x2ZToge1xyXG4gICAgICAgIGFsaWFzOiB7XHJcbiAgICAgICAgICAgIC8vIFRoaXMgUm9sbHVwIGFsaWFzZXMgYXJlIGV4dHJhY3RlZCBmcm9tIEBlc2J1aWxkLXBsdWdpbnMvbm9kZS1tb2R1bGVzLXBvbHlmaWxsLFxyXG4gICAgICAgICAgICAvLyBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3JlbW9yc2VzL2VzYnVpbGQtcGx1Z2lucy9ibG9iL21hc3Rlci9ub2RlLW1vZHVsZXMtcG9seWZpbGwvc3JjL3BvbHlmaWxscy50c1xyXG4gICAgICAgICAgICAvLyBwcm9jZXNzIGFuZCBidWZmZXIgYXJlIGV4Y2x1ZGVkIGJlY2F1c2UgYWxyZWFkeSBtYW5hZ2VkXHJcbiAgICAgICAgICAgIC8vIGJ5IG5vZGUtZ2xvYmFscy1wb2x5ZmlsbFxyXG4gICAgICAgICAgICAvL3V0aWw6ICdyb2xsdXAtcGx1Z2luLW5vZGUtcG9seWZpbGxzL3BvbHlmaWxscy91dGlsJyxcclxuICAgICAgICAgICAgLy9zeXM6ICd1dGlsJyxcclxuICAgICAgICAgICAgLy9ldmVudHM6ICdyb2xsdXAtcGx1Z2luLW5vZGUtcG9seWZpbGxzL3BvbHlmaWxscy9ldmVudHMnLFxyXG4gICAgICAgICAgICBzdHJlYW06ICdyb2xsdXAtcGx1Z2luLW5vZGUtcG9seWZpbGxzL3BvbHlmaWxscy9zdHJlYW0nXHJcbiAgICAgICAgICAgIC8vIC8vcGF0aDogJ3JvbGx1cC1wbHVnaW4tbm9kZS1wb2x5ZmlsbHMvcG9seWZpbGxzL3BhdGgnLFxyXG4gICAgICAgICAgICAvLyBxdWVyeXN0cmluZzogJ3JvbGx1cC1wbHVnaW4tbm9kZS1wb2x5ZmlsbHMvcG9seWZpbGxzL3FzJyxcclxuICAgICAgICAgICAgLy8gcHVueWNvZGU6ICdyb2xsdXAtcGx1Z2luLW5vZGUtcG9seWZpbGxzL3BvbHlmaWxscy9wdW55Y29kZScsXHJcbiAgICAgICAgICAgIC8vIHVybDogJ3JvbGx1cC1wbHVnaW4tbm9kZS1wb2x5ZmlsbHMvcG9seWZpbGxzL3VybCcsXHJcbiAgICAgICAgICAgIC8vIHN0cmluZ19kZWNvZGVyOiAncm9sbHVwLXBsdWdpbi1ub2RlLXBvbHlmaWxscy9wb2x5ZmlsbHMvc3RyaW5nLWRlY29kZXInLFxyXG4gICAgICAgICAgICAvLyBodHRwOiAncm9sbHVwLXBsdWdpbi1ub2RlLXBvbHlmaWxscy9wb2x5ZmlsbHMvaHR0cCcsXHJcbiAgICAgICAgICAgIC8vIGh0dHBzOiAncm9sbHVwLXBsdWdpbi1ub2RlLXBvbHlmaWxscy9wb2x5ZmlsbHMvaHR0cCcsXHJcbiAgICAgICAgICAgIC8vIG9zOiAncm9sbHVwLXBsdWdpbi1ub2RlLXBvbHlmaWxscy9wb2x5ZmlsbHMvb3MnLFxyXG4gICAgICAgICAgICAvLyBhc3NlcnQ6ICdyb2xsdXAtcGx1Z2luLW5vZGUtcG9seWZpbGxzL3BvbHlmaWxscy9hc3NlcnQnLFxyXG4gICAgICAgICAgICAvLyBjb25zdGFudHM6ICdyb2xsdXAtcGx1Z2luLW5vZGUtcG9seWZpbGxzL3BvbHlmaWxscy9jb25zdGFudHMnLFxyXG4gICAgICAgICAgICAvLyBfc3RyZWFtX2R1cGxleDogJ3JvbGx1cC1wbHVnaW4tbm9kZS1wb2x5ZmlsbHMvcG9seWZpbGxzL3JlYWRhYmxlLXN0cmVhbS9kdXBsZXgnLFxyXG4gICAgICAgICAgICAvLyBfc3RyZWFtX3Bhc3N0aHJvdWdoOlxyXG4gICAgICAgICAgICAvLyAgICAgJ3JvbGx1cC1wbHVnaW4tbm9kZS1wb2x5ZmlsbHMvcG9seWZpbGxzL3JlYWRhYmxlLXN0cmVhbS9wYXNzdGhyb3VnaCcsXHJcbiAgICAgICAgICAgIC8vIF9zdHJlYW1fcmVhZGFibGU6ICdyb2xsdXAtcGx1Z2luLW5vZGUtcG9seWZpbGxzL3BvbHlmaWxscy9yZWFkYWJsZS1zdHJlYW0vcmVhZGFibGUnLFxyXG4gICAgICAgICAgICAvLyBfc3RyZWFtX3dyaXRhYmxlOiAncm9sbHVwLXBsdWdpbi1ub2RlLXBvbHlmaWxscy9wb2x5ZmlsbHMvcmVhZGFibGUtc3RyZWFtL3dyaXRhYmxlJyxcclxuICAgICAgICAgICAgLy8gX3N0cmVhbV90cmFuc2Zvcm06ICdyb2xsdXAtcGx1Z2luLW5vZGUtcG9seWZpbGxzL3BvbHlmaWxscy9yZWFkYWJsZS1zdHJlYW0vdHJhbnNmb3JtJyxcclxuICAgICAgICAgICAgLy8gdGltZXJzOiAncm9sbHVwLXBsdWdpbi1ub2RlLXBvbHlmaWxscy9wb2x5ZmlsbHMvdGltZXJzJyxcclxuICAgICAgICAgICAgLy8gY29uc29sZTogJ3JvbGx1cC1wbHVnaW4tbm9kZS1wb2x5ZmlsbHMvcG9seWZpbGxzL2NvbnNvbGUnLFxyXG4gICAgICAgICAgICAvLyB2bTogJ3JvbGx1cC1wbHVnaW4tbm9kZS1wb2x5ZmlsbHMvcG9seWZpbGxzL3ZtJyxcclxuICAgICAgICAgICAgLy8gemxpYjogJ3JvbGx1cC1wbHVnaW4tbm9kZS1wb2x5ZmlsbHMvcG9seWZpbGxzL3psaWInLFxyXG4gICAgICAgICAgICAvLyB0dHk6ICdyb2xsdXAtcGx1Z2luLW5vZGUtcG9seWZpbGxzL3BvbHlmaWxscy90dHknLFxyXG4gICAgICAgICAgICAvLyBkb21haW46ICdyb2xsdXAtcGx1Z2luLW5vZGUtcG9seWZpbGxzL3BvbHlmaWxscy9kb21haW4nXHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIG9wdGltaXplRGVwczoge1xyXG4gICAgICAgIGVzYnVpbGRPcHRpb25zOiB7XHJcbiAgICAgICAgICAgIC8vIE5vZGUuanMgZ2xvYmFsIHRvIGJyb3dzZXIgZ2xvYmFsVGhpc1xyXG4gICAgICAgICAgICBkZWZpbmU6IHtcclxuICAgICAgICAgICAgICAgIGdsb2JhbDogJ2dsb2JhbFRoaXMnXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIC8vIEVuYWJsZSBlc2J1aWxkIHBvbHlmaWxsIHBsdWdpbnNcclxuICAgICAgICAgICAgcGx1Z2luczogW1xyXG4gICAgICAgICAgICAgICAgTm9kZUdsb2JhbHNQb2x5ZmlsbFBsdWdpbih7XHJcbiAgICAgICAgICAgICAgICAgICAgcHJvY2VzczogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICBidWZmZXI6IHRydWVcclxuICAgICAgICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgICAgICAgTm9kZU1vZHVsZXNQb2x5ZmlsbFBsdWdpbigpXHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgYnVpbGQ6IHtcclxuICAgICAgICByb2xsdXBPcHRpb25zOiB7XHJcbiAgICAgICAgICAgIHBsdWdpbnM6IFtcclxuICAgICAgICAgICAgICAgIC8vIEVuYWJsZSByb2xsdXAgcG9seWZpbGxzIHBsdWdpblxyXG4gICAgICAgICAgICAgICAgLy8gdXNlZCBkdXJpbmcgcHJvZHVjdGlvbiBidW5kbGluZ1xyXG4gICAgICAgICAgICAgICAgcm9sbHVwTm9kZVBvbHlGaWxsKClcclxuICAgICAgICAgICAgXVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICB0ZXN0OiB7XHJcbiAgICAgICAgZW52aXJvbm1lbnQ6ICdqc2RvbSdcclxuICAgIH1cclxufTtcclxuZXhwb3J0IGRlZmF1bHQgY29uZmlnO1xyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQ0EsU0FBUyxpQkFBaUI7QUFHMUIsU0FBUyxpQ0FBaUM7QUFFMUMsU0FBUyxpQ0FBaUM7QUFFMUMsT0FBTyx3QkFBd0I7QUFHL0IsSUFBTSxTQUFTO0FBQUEsRUFDWCxTQUFTLENBQUMsVUFBVSxDQUFDO0FBQUEsRUFDckIsU0FBUztBQUFBLElBQ0wsT0FBTztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsTUFRSCxRQUFRO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQXVCWjtBQUFBLEVBQ0o7QUFBQSxFQUNBLGNBQWM7QUFBQSxJQUNWLGdCQUFnQjtBQUFBO0FBQUEsTUFFWixRQUFRO0FBQUEsUUFDSixRQUFRO0FBQUEsTUFDWjtBQUFBO0FBQUEsTUFFQSxTQUFTO0FBQUEsUUFDTCwwQkFBMEI7QUFBQSxVQUN0QixTQUFTO0FBQUEsVUFDVCxRQUFRO0FBQUEsUUFDWixDQUFDO0FBQUEsUUFDRCwwQkFBMEI7QUFBQSxNQUM5QjtBQUFBLElBQ0o7QUFBQSxFQUNKO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDSCxlQUFlO0FBQUEsTUFDWCxTQUFTO0FBQUE7QUFBQTtBQUFBLFFBR0wsbUJBQW1CO0FBQUEsTUFDdkI7QUFBQSxJQUNKO0FBQUEsRUFDSjtBQUFBLEVBQ0EsTUFBTTtBQUFBLElBQ0YsYUFBYTtBQUFBLEVBQ2pCO0FBQ0o7QUFDQSxJQUFPLHNCQUFROyIsCiAgIm5hbWVzIjogW10KfQo=
