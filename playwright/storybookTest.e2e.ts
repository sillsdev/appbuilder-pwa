import { expect, test } from '@playwright/test';

test('Storybook page 1 formatting', async ({ page }) => {
    await page.goto('/?ref=eng_ENGWEB.B002.1');
    await expect(page.getByText('Peter asked Jesus').first()).toContainClass('c_StrongEmphasis');
    const container = page.locator(
        'div.p_Red:has(div:has-text("Jesus meant that we should always forgive"))'
    );
    await expect(container).toHaveCount(1);
});

test('Unordered list item formatting', async ({ page }) => {
    await page.goto('/?ref=eng_ENGWEB.B002.2');
    const container = page.locator('div.list-item:has(div:has-text("list"))');
    await expect(container).toHaveCount(4);

    const container2 = page.locator(
        'div.\\[list-style-type\\:circle\\]:has(div:has-text("A different level of list item"))'
    );
    await expect(container2).toHaveCount(1);

    const container3 = page.locator(
        'div.\\[list-style-type\\:square\\]:has(div:has-text("level"))'
    );
    await expect(container3).toHaveCount(2);
});

test('Ordered list item formatting', async ({ page }) => {
    await page.goto('/?ref=eng_ENGWEB.B002.2');
    const container = page.locator('div.list-item.list-decimal:has(div:has-text("One"))');
    await expect(container).toHaveCount(1);
    await expect(container.first()).toHaveCSS('counter-set', 'list-item 1');
    await expect(
        container.evaluate((el) => el.style.getPropertyValue('padding-inline-start'))
    ).resolves.toBe('1rem');

    const container2 = page.locator('div.list-item.list-decimal:has(div:has-text("Two"))');
    await expect(container2).toHaveCount(1);
    await expect(container2.first()).toHaveCSS('counter-set', 'list-item 2');
    await expect(
        container2.evaluate((el) => el.style.getPropertyValue('padding-inline-start'))
    ).resolves.toBe('1rem');

    const container3 = page.locator('div.list-item.list-decimal:has(div:has-text("Seven"))');
    await expect(container3).toHaveCount(1);
    await expect(container3.first()).toHaveCSS('counter-set', 'list-item 7');
    await expect(
        container3.evaluate((el) => el.style.getPropertyValue('padding-inline-start'))
    ).resolves.toBe('3rem');

    const container4 = page.locator('div.list-item.list-decimal:has(div:has-text("Four"))');
    await expect(container4).toHaveCount(1);
    await expect(container4.first()).toHaveCSS('counter-set', 'list-item 4');
    await expect(
        container4.evaluate((el) => el.style.getPropertyValue('padding-inline-start'))
    ).resolves.toBe('1rem');
});

test('Storybook headings', async ({ page }) => {
    await page.goto('/?ref=eng_ENGWEB.B002.3');
    const container = page.locator('div.s:has(div:has-text("This is a Heading 1"))');
    await expect(container).toHaveCount(1);

    const container2 = page.locator('div.s2:has(div:has-text("Heading 2"))');
    await expect(container2).toHaveCount(1);
});

test('Storybook paragraph alignment', async ({ page }) => {
    await page.goto('/?ref=eng_ENGWEB.B002.4');
    const container = page.locator('div.pc:has(div:has-text("This is a centered paragraph."))');
    await expect(container).toHaveCount(1);

    const container2 = page.locator(
        'div.pr:has(div:has-text("This is a right-justified paragraph."))'
    );
    await expect(container2).toHaveCount(1);
});

test('Storybook images', async ({ page }) => {
    await page.goto('/?ref=eng_ENGWEB.B002.1');
    await expect(page.locator('[src="/illustrations/image1.jpeg"]')).toBeVisible();
    await page.goto('/?ref=eng_ENGWEB.B002.2');
    await expect(page.locator('[src="/illustrations/image1.jpeg"]')).not.toBeVisible();
    await expect(page.locator('[src="/illustrations/image2.jpeg"]')).toBeVisible();
});
