# Playwright Basics

See the official documentation at http://playwright.dev/docs/intro

Playwright is another testing framework similar to Vitest in some respects but largely different in its end-to-end approach. Playwright has functions called [locators](http://playwright.dev/docs/locators) to locate page elements and more functions called [actions](https://playwright.dev/docs/input) to interact with them.

Although you can locate many items based on text in their content, classes, or css, it is often preferable to give them test ids to refer to. This is done by adding `data-testid="your-test-id"` in their Svelte HTML tag. Then use:

`const myItem = await page.getByTestId("your-test-id");`

You can install the Playwright plugin for VSCode and run individual tests using the "play" symbol appearing next to each test block (note the app itself must already be running locally).

-   Make sure your test file ends with `.spec.ts` (or .js for JavaScript). 
    If you're testing `foo.ts`, you'd probably name the test file `foo.spec.ts`.
-   Use the `test` function to write an end-to-end test
-   Within each test, use `expect` to provide an assertion.

Here's what a test generally looks like:

```js
test('Test Navigation', async ({ page }) => {
    await page.goto('http://localhost:5173/');

    await page.getByTestId("about-icon").click();
    await expect(page.getByTestId("title")).toHaveText("About");
});
```

Gotchas:

-   Make sure you import `test`, and `expect` from playwright, not from node.test or vitest.

# Running Tests

Run `npx playwright test` in a terminal window to run all the tests in the project. Currently, Playwright does not start the local dev app before testing, so that must be done in another thread first (such as `npm run dev`).