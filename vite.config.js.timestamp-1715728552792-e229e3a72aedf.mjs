// vite.config.js
import { sveltekit } from "file:///C:/Wycliffe/appbuilder-pwa/node_modules/@sveltejs/kit/src/exports/vite/index.js";
import { NodeGlobalsPolyfillPlugin } from "file:///C:/Wycliffe/appbuilder-pwa/node_modules/@esbuild-plugins/node-globals-polyfill/dist/index.js";
import { NodeModulesPolyfillPlugin } from "file:///C:/Wycliffe/appbuilder-pwa/node_modules/@esbuild-plugins/node-modules-polyfill/dist/index.js";
import rollupNodePolyFill from "file:///C:/Wycliffe/appbuilder-pwa/node_modules/rollup-plugin-node-polyfills/dist/index.js";
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxXeWNsaWZmZVxcXFxhcHBidWlsZGVyLXB3YVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcV3ljbGlmZmVcXFxcYXBwYnVpbGRlci1wd2FcXFxcdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1d5Y2xpZmZlL2FwcGJ1aWxkZXItcHdhL3ZpdGUuY29uZmlnLmpzXCI7Ly8gdml0ZS5jb25maWcuanNcclxuaW1wb3J0IHsgc3ZlbHRla2l0IH0gZnJvbSAnQHN2ZWx0ZWpzL2tpdC92aXRlJztcclxuLy8gcG9seWZpbGwgY29kZSBzb3VyY2VkIGZyb206IGh0dHBzOi8vbWVkaXVtLmNvbS9AZnRhaW9saS91c2luZy1ub2RlLWpzLWJ1aWx0aW4tbW9kdWxlcy13aXRoLXZpdGUtNjE5NDczN2MyY2QyXHJcbi8vIHlhcm4gYWRkIC0tZGV2IEBlc2J1aWxkLXBsdWdpbnMvbm9kZS1nbG9iYWxzLXBvbHlmaWxsXHJcbmltcG9ydCB7IE5vZGVHbG9iYWxzUG9seWZpbGxQbHVnaW4gfSBmcm9tICdAZXNidWlsZC1wbHVnaW5zL25vZGUtZ2xvYmFscy1wb2x5ZmlsbCc7XHJcbi8vIHlhcm4gYWRkIC0tZGV2IEBlc2J1aWxkLXBsdWdpbnMvbm9kZS1tb2R1bGVzLXBvbHlmaWxsXHJcbmltcG9ydCB7IE5vZGVNb2R1bGVzUG9seWZpbGxQbHVnaW4gfSBmcm9tICdAZXNidWlsZC1wbHVnaW5zL25vZGUtbW9kdWxlcy1wb2x5ZmlsbCc7XHJcbi8vIFlvdSBkb24ndCBuZWVkIHRvIGFkZCB0aGlzIHRvIGRlcHMsIGl0J3MgaW5jbHVkZWQgYnkgQGVzYnVpbGQtcGx1Z2lucy9ub2RlLW1vZHVsZXMtcG9seWZpbGxcclxuaW1wb3J0IHJvbGx1cE5vZGVQb2x5RmlsbCBmcm9tICdyb2xsdXAtcGx1Z2luLW5vZGUtcG9seWZpbGxzJztcclxuXHJcbi8qKiBAdHlwZSB7aW1wb3J0KCd2aXRlJykuVXNlckNvbmZpZ30gKi9cclxuY29uc3QgY29uZmlnID0ge1xyXG4gICAgcGx1Z2luczogW3N2ZWx0ZWtpdCgpXSxcclxuICAgIHJlc29sdmU6IHtcclxuICAgICAgICBhbGlhczoge1xyXG4gICAgICAgICAgICAvLyBUaGlzIFJvbGx1cCBhbGlhc2VzIGFyZSBleHRyYWN0ZWQgZnJvbSBAZXNidWlsZC1wbHVnaW5zL25vZGUtbW9kdWxlcy1wb2x5ZmlsbCxcclxuICAgICAgICAgICAgLy8gc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9yZW1vcnNlcy9lc2J1aWxkLXBsdWdpbnMvYmxvYi9tYXN0ZXIvbm9kZS1tb2R1bGVzLXBvbHlmaWxsL3NyYy9wb2x5ZmlsbHMudHNcclxuICAgICAgICAgICAgLy8gcHJvY2VzcyBhbmQgYnVmZmVyIGFyZSBleGNsdWRlZCBiZWNhdXNlIGFscmVhZHkgbWFuYWdlZFxyXG4gICAgICAgICAgICAvLyBieSBub2RlLWdsb2JhbHMtcG9seWZpbGxcclxuICAgICAgICAgICAgLy91dGlsOiAncm9sbHVwLXBsdWdpbi1ub2RlLXBvbHlmaWxscy9wb2x5ZmlsbHMvdXRpbCcsXHJcbiAgICAgICAgICAgIC8vc3lzOiAndXRpbCcsXHJcbiAgICAgICAgICAgIC8vZXZlbnRzOiAncm9sbHVwLXBsdWdpbi1ub2RlLXBvbHlmaWxscy9wb2x5ZmlsbHMvZXZlbnRzJyxcclxuICAgICAgICAgICAgc3RyZWFtOiAncm9sbHVwLXBsdWdpbi1ub2RlLXBvbHlmaWxscy9wb2x5ZmlsbHMvc3RyZWFtJ1xyXG4gICAgICAgICAgICAvLyAvL3BhdGg6ICdyb2xsdXAtcGx1Z2luLW5vZGUtcG9seWZpbGxzL3BvbHlmaWxscy9wYXRoJyxcclxuICAgICAgICAgICAgLy8gcXVlcnlzdHJpbmc6ICdyb2xsdXAtcGx1Z2luLW5vZGUtcG9seWZpbGxzL3BvbHlmaWxscy9xcycsXHJcbiAgICAgICAgICAgIC8vIHB1bnljb2RlOiAncm9sbHVwLXBsdWdpbi1ub2RlLXBvbHlmaWxscy9wb2x5ZmlsbHMvcHVueWNvZGUnLFxyXG4gICAgICAgICAgICAvLyB1cmw6ICdyb2xsdXAtcGx1Z2luLW5vZGUtcG9seWZpbGxzL3BvbHlmaWxscy91cmwnLFxyXG4gICAgICAgICAgICAvLyBzdHJpbmdfZGVjb2RlcjogJ3JvbGx1cC1wbHVnaW4tbm9kZS1wb2x5ZmlsbHMvcG9seWZpbGxzL3N0cmluZy1kZWNvZGVyJyxcclxuICAgICAgICAgICAgLy8gaHR0cDogJ3JvbGx1cC1wbHVnaW4tbm9kZS1wb2x5ZmlsbHMvcG9seWZpbGxzL2h0dHAnLFxyXG4gICAgICAgICAgICAvLyBodHRwczogJ3JvbGx1cC1wbHVnaW4tbm9kZS1wb2x5ZmlsbHMvcG9seWZpbGxzL2h0dHAnLFxyXG4gICAgICAgICAgICAvLyBvczogJ3JvbGx1cC1wbHVnaW4tbm9kZS1wb2x5ZmlsbHMvcG9seWZpbGxzL29zJyxcclxuICAgICAgICAgICAgLy8gYXNzZXJ0OiAncm9sbHVwLXBsdWdpbi1ub2RlLXBvbHlmaWxscy9wb2x5ZmlsbHMvYXNzZXJ0JyxcclxuICAgICAgICAgICAgLy8gY29uc3RhbnRzOiAncm9sbHVwLXBsdWdpbi1ub2RlLXBvbHlmaWxscy9wb2x5ZmlsbHMvY29uc3RhbnRzJyxcclxuICAgICAgICAgICAgLy8gX3N0cmVhbV9kdXBsZXg6ICdyb2xsdXAtcGx1Z2luLW5vZGUtcG9seWZpbGxzL3BvbHlmaWxscy9yZWFkYWJsZS1zdHJlYW0vZHVwbGV4JyxcclxuICAgICAgICAgICAgLy8gX3N0cmVhbV9wYXNzdGhyb3VnaDpcclxuICAgICAgICAgICAgLy8gICAgICdyb2xsdXAtcGx1Z2luLW5vZGUtcG9seWZpbGxzL3BvbHlmaWxscy9yZWFkYWJsZS1zdHJlYW0vcGFzc3Rocm91Z2gnLFxyXG4gICAgICAgICAgICAvLyBfc3RyZWFtX3JlYWRhYmxlOiAncm9sbHVwLXBsdWdpbi1ub2RlLXBvbHlmaWxscy9wb2x5ZmlsbHMvcmVhZGFibGUtc3RyZWFtL3JlYWRhYmxlJyxcclxuICAgICAgICAgICAgLy8gX3N0cmVhbV93cml0YWJsZTogJ3JvbGx1cC1wbHVnaW4tbm9kZS1wb2x5ZmlsbHMvcG9seWZpbGxzL3JlYWRhYmxlLXN0cmVhbS93cml0YWJsZScsXHJcbiAgICAgICAgICAgIC8vIF9zdHJlYW1fdHJhbnNmb3JtOiAncm9sbHVwLXBsdWdpbi1ub2RlLXBvbHlmaWxscy9wb2x5ZmlsbHMvcmVhZGFibGUtc3RyZWFtL3RyYW5zZm9ybScsXHJcbiAgICAgICAgICAgIC8vIHRpbWVyczogJ3JvbGx1cC1wbHVnaW4tbm9kZS1wb2x5ZmlsbHMvcG9seWZpbGxzL3RpbWVycycsXHJcbiAgICAgICAgICAgIC8vIGNvbnNvbGU6ICdyb2xsdXAtcGx1Z2luLW5vZGUtcG9seWZpbGxzL3BvbHlmaWxscy9jb25zb2xlJyxcclxuICAgICAgICAgICAgLy8gdm06ICdyb2xsdXAtcGx1Z2luLW5vZGUtcG9seWZpbGxzL3BvbHlmaWxscy92bScsXHJcbiAgICAgICAgICAgIC8vIHpsaWI6ICdyb2xsdXAtcGx1Z2luLW5vZGUtcG9seWZpbGxzL3BvbHlmaWxscy96bGliJyxcclxuICAgICAgICAgICAgLy8gdHR5OiAncm9sbHVwLXBsdWdpbi1ub2RlLXBvbHlmaWxscy9wb2x5ZmlsbHMvdHR5JyxcclxuICAgICAgICAgICAgLy8gZG9tYWluOiAncm9sbHVwLXBsdWdpbi1ub2RlLXBvbHlmaWxscy9wb2x5ZmlsbHMvZG9tYWluJ1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBvcHRpbWl6ZURlcHM6IHtcclxuICAgICAgICBlc2J1aWxkT3B0aW9uczoge1xyXG4gICAgICAgICAgICAvLyBOb2RlLmpzIGdsb2JhbCB0byBicm93c2VyIGdsb2JhbFRoaXNcclxuICAgICAgICAgICAgZGVmaW5lOiB7XHJcbiAgICAgICAgICAgICAgICBnbG9iYWw6ICdnbG9iYWxUaGlzJ1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAvLyBFbmFibGUgZXNidWlsZCBwb2x5ZmlsbCBwbHVnaW5zXHJcbiAgICAgICAgICAgIHBsdWdpbnM6IFtcclxuICAgICAgICAgICAgICAgIE5vZGVHbG9iYWxzUG9seWZpbGxQbHVnaW4oe1xyXG4gICAgICAgICAgICAgICAgICAgIHByb2Nlc3M6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgYnVmZmVyOiB0cnVlXHJcbiAgICAgICAgICAgICAgICB9KSxcclxuICAgICAgICAgICAgICAgIE5vZGVNb2R1bGVzUG9seWZpbGxQbHVnaW4oKVxyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIGJ1aWxkOiB7XHJcbiAgICAgICAgcm9sbHVwT3B0aW9uczoge1xyXG4gICAgICAgICAgICBwbHVnaW5zOiBbXHJcbiAgICAgICAgICAgICAgICAvLyBFbmFibGUgcm9sbHVwIHBvbHlmaWxscyBwbHVnaW5cclxuICAgICAgICAgICAgICAgIC8vIHVzZWQgZHVyaW5nIHByb2R1Y3Rpb24gYnVuZGxpbmdcclxuICAgICAgICAgICAgICAgIHJvbGx1cE5vZGVQb2x5RmlsbCgpXHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgdGVzdDoge1xyXG4gICAgICAgIGVudmlyb25tZW50OiAnanNkb20nXHJcbiAgICB9XHJcbn07XHJcbmV4cG9ydCBkZWZhdWx0IGNvbmZpZztcclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUNBLFNBQVMsaUJBQWlCO0FBRzFCLFNBQVMsaUNBQWlDO0FBRTFDLFNBQVMsaUNBQWlDO0FBRTFDLE9BQU8sd0JBQXdCO0FBRy9CLElBQU0sU0FBUztBQUFBLEVBQ1gsU0FBUyxDQUFDLFVBQVUsQ0FBQztBQUFBLEVBQ3JCLFNBQVM7QUFBQSxJQUNMLE9BQU87QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLE1BUUgsUUFBUTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUF1Qlo7QUFBQSxFQUNKO0FBQUEsRUFDQSxjQUFjO0FBQUEsSUFDVixnQkFBZ0I7QUFBQTtBQUFBLE1BRVosUUFBUTtBQUFBLFFBQ0osUUFBUTtBQUFBLE1BQ1o7QUFBQTtBQUFBLE1BRUEsU0FBUztBQUFBLFFBQ0wsMEJBQTBCO0FBQUEsVUFDdEIsU0FBUztBQUFBLFVBQ1QsUUFBUTtBQUFBLFFBQ1osQ0FBQztBQUFBLFFBQ0QsMEJBQTBCO0FBQUEsTUFDOUI7QUFBQSxJQUNKO0FBQUEsRUFDSjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0gsZUFBZTtBQUFBLE1BQ1gsU0FBUztBQUFBO0FBQUE7QUFBQSxRQUdMLG1CQUFtQjtBQUFBLE1BQ3ZCO0FBQUEsSUFDSjtBQUFBLEVBQ0o7QUFBQSxFQUNBLE1BQU07QUFBQSxJQUNGLGFBQWE7QUFBQSxFQUNqQjtBQUNKO0FBQ0EsSUFBTyxzQkFBUTsiLAogICJuYW1lcyI6IFtdCn0K
