import { defineConfig } from '@playwright/test';

export default defineConfig({
    webServer: {
        //command: 'npm run build && npm run preview',
        command: 'npm run dev',
        port: 5173
    },
    testMatch: /.*\.e2e\.ts/, //Playwright test files need to the .e2e.ts subscript, unlike Vitest test files which should have .test.ts
    testDir: 'playwright',
    expect: { timeout: 20000 } // expect() timeout for assertions. Set to 20 seconds to prevent it from failing just because it took too long
});
