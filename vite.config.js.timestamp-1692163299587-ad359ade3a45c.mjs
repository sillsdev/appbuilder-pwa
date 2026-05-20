// vite.config.js
import { sveltekit } from "file:///C:/Users/caleb/Documents/GitHub/Wycliffe%20Repos/appbuilder-pwa/node_modules/@sveltejs/kit/src/exports/vite/index.js";
import { NodeGlobalsPolyfillPlugin } from "file:///C:/Users/caleb/Documents/GitHub/Wycliffe%20Repos/appbuilder-pwa/node_modules/@esbuild-plugins/node-globals-polyfill/dist/index.js";
import { NodeModulesPolyfillPlugin } from "file:///C:/Users/caleb/Documents/GitHub/Wycliffe%20Repos/appbuilder-pwa/node_modules/@esbuild-plugins/node-modules-polyfill/dist/index.js";
import rollupNodePolyFill from "file:///C:/Users/caleb/Documents/GitHub/Wycliffe%20Repos/appbuilder-pwa/node_modules/rollup-plugin-node-polyfills/dist/index.js";
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
  }
};
var vite_config_default = config;
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxjYWxlYlxcXFxEb2N1bWVudHNcXFxcR2l0SHViXFxcXFd5Y2xpZmZlIFJlcG9zXFxcXGFwcGJ1aWxkZXItcHdhXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxjYWxlYlxcXFxEb2N1bWVudHNcXFxcR2l0SHViXFxcXFd5Y2xpZmZlIFJlcG9zXFxcXGFwcGJ1aWxkZXItcHdhXFxcXHZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9jYWxlYi9Eb2N1bWVudHMvR2l0SHViL1d5Y2xpZmZlJTIwUmVwb3MvYXBwYnVpbGRlci1wd2Evdml0ZS5jb25maWcuanNcIjsvLyB2aXRlLmNvbmZpZy5qc1xuaW1wb3J0IHsgc3ZlbHRla2l0IH0gZnJvbSAnQHN2ZWx0ZWpzL2tpdC92aXRlJztcbi8vIHBvbHlmaWxsIGNvZGUgc291cmNlZCBmcm9tOiBodHRwczovL21lZGl1bS5jb20vQGZ0YWlvbGkvdXNpbmctbm9kZS1qcy1idWlsdGluLW1vZHVsZXMtd2l0aC12aXRlLTYxOTQ3MzdjMmNkMlxuLy8geWFybiBhZGQgLS1kZXYgQGVzYnVpbGQtcGx1Z2lucy9ub2RlLWdsb2JhbHMtcG9seWZpbGxcbmltcG9ydCB7IE5vZGVHbG9iYWxzUG9seWZpbGxQbHVnaW4gfSBmcm9tICdAZXNidWlsZC1wbHVnaW5zL25vZGUtZ2xvYmFscy1wb2x5ZmlsbCc7XG4vLyB5YXJuIGFkZCAtLWRldiBAZXNidWlsZC1wbHVnaW5zL25vZGUtbW9kdWxlcy1wb2x5ZmlsbFxuaW1wb3J0IHsgTm9kZU1vZHVsZXNQb2x5ZmlsbFBsdWdpbiB9IGZyb20gJ0Blc2J1aWxkLXBsdWdpbnMvbm9kZS1tb2R1bGVzLXBvbHlmaWxsJztcbi8vIFlvdSBkb24ndCBuZWVkIHRvIGFkZCB0aGlzIHRvIGRlcHMsIGl0J3MgaW5jbHVkZWQgYnkgQGVzYnVpbGQtcGx1Z2lucy9ub2RlLW1vZHVsZXMtcG9seWZpbGxcbmltcG9ydCByb2xsdXBOb2RlUG9seUZpbGwgZnJvbSAncm9sbHVwLXBsdWdpbi1ub2RlLXBvbHlmaWxscyc7XG5cbi8qKiBAdHlwZSB7aW1wb3J0KCd2aXRlJykuVXNlckNvbmZpZ30gKi9cbmNvbnN0IGNvbmZpZyA9IHtcbiAgICBwbHVnaW5zOiBbc3ZlbHRla2l0KCldLFxuICAgIHJlc29sdmU6IHtcbiAgICAgICAgYWxpYXM6IHtcbiAgICAgICAgICAgIC8vIFRoaXMgUm9sbHVwIGFsaWFzZXMgYXJlIGV4dHJhY3RlZCBmcm9tIEBlc2J1aWxkLXBsdWdpbnMvbm9kZS1tb2R1bGVzLXBvbHlmaWxsLFxuICAgICAgICAgICAgLy8gc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9yZW1vcnNlcy9lc2J1aWxkLXBsdWdpbnMvYmxvYi9tYXN0ZXIvbm9kZS1tb2R1bGVzLXBvbHlmaWxsL3NyYy9wb2x5ZmlsbHMudHNcbiAgICAgICAgICAgIC8vIHByb2Nlc3MgYW5kIGJ1ZmZlciBhcmUgZXhjbHVkZWQgYmVjYXVzZSBhbHJlYWR5IG1hbmFnZWRcbiAgICAgICAgICAgIC8vIGJ5IG5vZGUtZ2xvYmFscy1wb2x5ZmlsbFxuICAgICAgICAgICAgLy91dGlsOiAncm9sbHVwLXBsdWdpbi1ub2RlLXBvbHlmaWxscy9wb2x5ZmlsbHMvdXRpbCcsXG4gICAgICAgICAgICAvL3N5czogJ3V0aWwnLFxuICAgICAgICAgICAgLy9ldmVudHM6ICdyb2xsdXAtcGx1Z2luLW5vZGUtcG9seWZpbGxzL3BvbHlmaWxscy9ldmVudHMnLFxuICAgICAgICAgICAgc3RyZWFtOiAncm9sbHVwLXBsdWdpbi1ub2RlLXBvbHlmaWxscy9wb2x5ZmlsbHMvc3RyZWFtJ1xuICAgICAgICAgICAgLy8gLy9wYXRoOiAncm9sbHVwLXBsdWdpbi1ub2RlLXBvbHlmaWxscy9wb2x5ZmlsbHMvcGF0aCcsXG4gICAgICAgICAgICAvLyBxdWVyeXN0cmluZzogJ3JvbGx1cC1wbHVnaW4tbm9kZS1wb2x5ZmlsbHMvcG9seWZpbGxzL3FzJyxcbiAgICAgICAgICAgIC8vIHB1bnljb2RlOiAncm9sbHVwLXBsdWdpbi1ub2RlLXBvbHlmaWxscy9wb2x5ZmlsbHMvcHVueWNvZGUnLFxuICAgICAgICAgICAgLy8gdXJsOiAncm9sbHVwLXBsdWdpbi1ub2RlLXBvbHlmaWxscy9wb2x5ZmlsbHMvdXJsJyxcbiAgICAgICAgICAgIC8vIHN0cmluZ19kZWNvZGVyOiAncm9sbHVwLXBsdWdpbi1ub2RlLXBvbHlmaWxscy9wb2x5ZmlsbHMvc3RyaW5nLWRlY29kZXInLFxuICAgICAgICAgICAgLy8gaHR0cDogJ3JvbGx1cC1wbHVnaW4tbm9kZS1wb2x5ZmlsbHMvcG9seWZpbGxzL2h0dHAnLFxuICAgICAgICAgICAgLy8gaHR0cHM6ICdyb2xsdXAtcGx1Z2luLW5vZGUtcG9seWZpbGxzL3BvbHlmaWxscy9odHRwJyxcbiAgICAgICAgICAgIC8vIG9zOiAncm9sbHVwLXBsdWdpbi1ub2RlLXBvbHlmaWxscy9wb2x5ZmlsbHMvb3MnLFxuICAgICAgICAgICAgLy8gYXNzZXJ0OiAncm9sbHVwLXBsdWdpbi1ub2RlLXBvbHlmaWxscy9wb2x5ZmlsbHMvYXNzZXJ0JyxcbiAgICAgICAgICAgIC8vIGNvbnN0YW50czogJ3JvbGx1cC1wbHVnaW4tbm9kZS1wb2x5ZmlsbHMvcG9seWZpbGxzL2NvbnN0YW50cycsXG4gICAgICAgICAgICAvLyBfc3RyZWFtX2R1cGxleDogJ3JvbGx1cC1wbHVnaW4tbm9kZS1wb2x5ZmlsbHMvcG9seWZpbGxzL3JlYWRhYmxlLXN0cmVhbS9kdXBsZXgnLFxuICAgICAgICAgICAgLy8gX3N0cmVhbV9wYXNzdGhyb3VnaDpcbiAgICAgICAgICAgIC8vICAgICAncm9sbHVwLXBsdWdpbi1ub2RlLXBvbHlmaWxscy9wb2x5ZmlsbHMvcmVhZGFibGUtc3RyZWFtL3Bhc3N0aHJvdWdoJyxcbiAgICAgICAgICAgIC8vIF9zdHJlYW1fcmVhZGFibGU6ICdyb2xsdXAtcGx1Z2luLW5vZGUtcG9seWZpbGxzL3BvbHlmaWxscy9yZWFkYWJsZS1zdHJlYW0vcmVhZGFibGUnLFxuICAgICAgICAgICAgLy8gX3N0cmVhbV93cml0YWJsZTogJ3JvbGx1cC1wbHVnaW4tbm9kZS1wb2x5ZmlsbHMvcG9seWZpbGxzL3JlYWRhYmxlLXN0cmVhbS93cml0YWJsZScsXG4gICAgICAgICAgICAvLyBfc3RyZWFtX3RyYW5zZm9ybTogJ3JvbGx1cC1wbHVnaW4tbm9kZS1wb2x5ZmlsbHMvcG9seWZpbGxzL3JlYWRhYmxlLXN0cmVhbS90cmFuc2Zvcm0nLFxuICAgICAgICAgICAgLy8gdGltZXJzOiAncm9sbHVwLXBsdWdpbi1ub2RlLXBvbHlmaWxscy9wb2x5ZmlsbHMvdGltZXJzJyxcbiAgICAgICAgICAgIC8vIGNvbnNvbGU6ICdyb2xsdXAtcGx1Z2luLW5vZGUtcG9seWZpbGxzL3BvbHlmaWxscy9jb25zb2xlJyxcbiAgICAgICAgICAgIC8vIHZtOiAncm9sbHVwLXBsdWdpbi1ub2RlLXBvbHlmaWxscy9wb2x5ZmlsbHMvdm0nLFxuICAgICAgICAgICAgLy8gemxpYjogJ3JvbGx1cC1wbHVnaW4tbm9kZS1wb2x5ZmlsbHMvcG9seWZpbGxzL3psaWInLFxuICAgICAgICAgICAgLy8gdHR5OiAncm9sbHVwLXBsdWdpbi1ub2RlLXBvbHlmaWxscy9wb2x5ZmlsbHMvdHR5JyxcbiAgICAgICAgICAgIC8vIGRvbWFpbjogJ3JvbGx1cC1wbHVnaW4tbm9kZS1wb2x5ZmlsbHMvcG9seWZpbGxzL2RvbWFpbidcbiAgICAgICAgfVxuICAgIH0sXG4gICAgb3B0aW1pemVEZXBzOiB7XG4gICAgICAgIGVzYnVpbGRPcHRpb25zOiB7XG4gICAgICAgICAgICAvLyBOb2RlLmpzIGdsb2JhbCB0byBicm93c2VyIGdsb2JhbFRoaXNcbiAgICAgICAgICAgIGRlZmluZToge1xuICAgICAgICAgICAgICAgIGdsb2JhbDogJ2dsb2JhbFRoaXMnXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gRW5hYmxlIGVzYnVpbGQgcG9seWZpbGwgcGx1Z2luc1xuICAgICAgICAgICAgcGx1Z2luczogW1xuICAgICAgICAgICAgICAgIE5vZGVHbG9iYWxzUG9seWZpbGxQbHVnaW4oe1xuICAgICAgICAgICAgICAgICAgICBwcm9jZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBidWZmZXI6IHRydWVcbiAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICBOb2RlTW9kdWxlc1BvbHlmaWxsUGx1Z2luKClcbiAgICAgICAgICAgIF1cbiAgICAgICAgfVxuICAgIH0sXG4gICAgYnVpbGQ6IHtcbiAgICAgICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgICAgICAgcGx1Z2luczogW1xuICAgICAgICAgICAgICAgIC8vIEVuYWJsZSByb2xsdXAgcG9seWZpbGxzIHBsdWdpblxuICAgICAgICAgICAgICAgIC8vIHVzZWQgZHVyaW5nIHByb2R1Y3Rpb24gYnVuZGxpbmdcbiAgICAgICAgICAgICAgICByb2xsdXBOb2RlUG9seUZpbGwoKVxuICAgICAgICAgICAgXVxuICAgICAgICB9XG4gICAgfVxufTtcbmV4cG9ydCBkZWZhdWx0IGNvbmZpZztcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFDQSxTQUFTLGlCQUFpQjtBQUcxQixTQUFTLGlDQUFpQztBQUUxQyxTQUFTLGlDQUFpQztBQUUxQyxPQUFPLHdCQUF3QjtBQUcvQixJQUFNLFNBQVM7QUFBQSxFQUNYLFNBQVMsQ0FBQyxVQUFVLENBQUM7QUFBQSxFQUNyQixTQUFTO0FBQUEsSUFDTCxPQUFPO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxNQVFILFFBQVE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBdUJaO0FBQUEsRUFDSjtBQUFBLEVBQ0EsY0FBYztBQUFBLElBQ1YsZ0JBQWdCO0FBQUE7QUFBQSxNQUVaLFFBQVE7QUFBQSxRQUNKLFFBQVE7QUFBQSxNQUNaO0FBQUE7QUFBQSxNQUVBLFNBQVM7QUFBQSxRQUNMLDBCQUEwQjtBQUFBLFVBQ3RCLFNBQVM7QUFBQSxVQUNULFFBQVE7QUFBQSxRQUNaLENBQUM7QUFBQSxRQUNELDBCQUEwQjtBQUFBLE1BQzlCO0FBQUEsSUFDSjtBQUFBLEVBQ0o7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNILGVBQWU7QUFBQSxNQUNYLFNBQVM7QUFBQTtBQUFBO0FBQUEsUUFHTCxtQkFBbUI7QUFBQSxNQUN2QjtBQUFBLElBQ0o7QUFBQSxFQUNKO0FBQ0o7QUFDQSxJQUFPLHNCQUFROyIsCiAgIm5hbWVzIjogW10KfQo=
