import { test, expect } from '@playwright/test';

test('Test Navigation', async ({ page }) => {
    const cfg = await import('$lib/data/config');
    await page.goto('http://localhost:5173/');

    if (cfg.default.programType == "DAB") {
        await expect(page.getByTestId("title")).toHaveText(cfg.default.name);
        await page.getByTestId('title').click();
    } else {
        await page.getByTestId('hamburger-icon').click();
    }
    await page.getByTestId("about-icon").click();
    await expect(page.getByTestId("title")).toHaveText("About");

    if (cfg.default.programType == "DAB") {
        await page.getByTestId('title').click();
    } else {
        await page.getByTestId('back-icon').click();
        await page.getByTestId('hamburger-icon').click();
    }
    await page.getByTestId("settings-icon").click();
    await expect(page.getByTestId("title")).toHaveText("Settings");
});

test('Test Text Appearance', async ({ page }) => {
    const cfg = await import('$lib/data/config');
    let menuButton;
    if (cfg.default.programType == "DAB") {
        menuButton = await page.getByTestId('title');
    } else {
        menuButton = await page.getByTestId('hamburger-icon');
    }
    await page.goto('http://localhost:5173/');
    for (let thm of cfg.default.themes) {
        if (thm.name == "Normal" && thm.enabled == true) {
            await menuButton.click();
            await page.getByTestId("text-appearance-icon").click();
            console.log("Ran normal");
            const clbton = page.getByTestId("normal-button");
            await expect(clbton).toBeVisible();
            await clbton.click();
            await expect(page.locator(".dy-drawer-content")).toHaveCSS("background-color", "rgb(240, 240, 240)");
        }
        if (thm.name == "Sepia" && thm.enabled == true) {
            await menuButton.click();
            await page.getByTestId("text-appearance-icon").click();
            console.log("Ran sepia");
            const clbton = page.getByTestId("sepia-button");
            await expect(clbton).toBeVisible();
            await clbton.click();
            await expect(page.locator(".dy-drawer-content")).toHaveCSS("background-color", "rgb(233, 216, 186)");
        }
        if (thm.name == "Dark" && thm.enabled == true) {
            await menuButton.click();
            await page.getByTestId("text-appearance-icon").click();
            console.log("Ran dark");
            const clbton = page.getByTestId("dark-button");
            await expect(clbton).toBeVisible();
            await clbton.click();
            await expect(page.locator(".dy-drawer-content")).toHaveCSS("background-color", "rgb(0, 0, 0)");
        }
    }
})

test('Test About', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    const cfg = await import('$lib/data/config');
    if (cfg.default.programType == "DAB") {
        await page.getByTestId('title').click();
        await page.getByTestId("about-icon").click();
        await expect(page.getByText('About')).toBeVisible();
        const title = await page.locator('.dy-navbar-center');
        await expect(title).toHaveText("About");
    } else {
        await page.getByTestId('hamburger-icon').click();
        await page.getByTestId("about-icon").click();
        await expect(page.locator('.text-xl').filter({ hasText: 'About' })).toBeVisible();
    }
})

test('Test Share', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    const cfg = await import('$lib/data/config');
    if (cfg.default.programType == "DAB") {
        await page.getByTestId('title').click();
    } else {
        await page.getByTestId('hamburger-icon').click();
    }
    if (await page.getByTestId('share-icon').isVisible()) {
        await page.getByTestId("share-icon").click();
        const title = await page.locator('.dy-navbar-center');
        await expect(title).toHaveText("Share App");
    }
})

test('Test Settings', async ({ page }) => {
    const cfg = await import('$lib/data/config');
    await page.goto('http://localhost:5173/');
    if (cfg.default.programType == "DAB") {
        await page.getByTestId('title').click();
    } else {
        await page.getByTestId('hamburger-icon').click();
    }
    if (await page.getByTestId('settings-icon').isVisible()) {
        //console.log(cfg.default.interfaceLanguages.writingSystems.yao.displayNames.en: Ciyawo);

        await page.getByTestId("settings-icon").click();

        await expect(page.getByText('User Interface')).toBeVisible();

        let langString = "Language";
        const selbox = await page.getByTestId('interface-language-setting');
        await expect(selbox).toBeVisible();
        //await expect(selbox).toHaveText("English"); // contains EnglishCiyawo

        for (let sys in cfg.default.writingSystems) {
            console.log("Sys: " + sys);
            await selbox.selectOption(sys);
            for (let sys2 in cfg.default.writingSystems) {
                console.log("Sys2: " + sys2);
                if (cfg.default.writingSystems[sys2].displayNames[sys] != undefined) {
                    langString = cfg.default.writingSystems[sys2].displayNames[sys];
                } else {
                    langString = cfg.default.writingSystems[sys2].displayNames["default"];
                }
                console.log(langString);
                await expect(selbox).toContainText(langString);
            }
            //console.log(cfg.default.writingSystems[sys].displayNames);
            //console.log("Our sought string is " + langString);
            //await expect(selbox).toContainText(langString);
            await expect(selbox).toBeVisible();
        }

        if (cfg.default.programType == "SAB") {
            await expect(await page.locator('div.mt').textContent()).toEqual("John");
            //await expect(page.locator('[class="mt2"]')).toHaveText("The Good News According to");

            await expect(page.getByText('Verse layout')).toBeVisible();
            const selbox1 = page.getByRole('combobox').filter({ has: page.getByRole('option').filter({ hasText: 'Verses in paragraphs' }) });
            await expect(selbox1).toBeVisible();
            await expect(selbox1).toHaveValue("paragraphs");
            await selbox1.selectOption("one-per-line");
            await expect(selbox1).toHaveValue("one-per-line");

            await expect(page.getByText('Images in Bible text')).toBeVisible();
            const selbox2 = page.getByRole('combobox').filter({ has: page.getByRole('option').filter({ hasText: 'Show images' }) });
            await expect(selbox2).toBeVisible();
            await expect(selbox2).toHaveValue("normal");
            await selbox2.selectOption("hidden");
            await expect(selbox2).toHaveValue("hidden");

            await expect(page.getByText('Videos in Bible text')).toBeVisible();
            const selbox3 = page.getByRole('combobox').filter({ has: page.getByRole('option').filter({ hasText: 'Show normal size' }) });
            await expect(selbox3).toBeVisible();
            await expect(selbox3).toHaveValue("normal");
            await selbox3.selectOption("hidden");
            await expect(selbox3).toHaveValue("hidden");

            await page.getByTestId('back-button').click();
            //await expect(page.getByText('The Good News According To')).toBeVisible();
        }
    }
});

test('Test Tabs of Dictionary', async ({ page }) => {
    const cfg = await import('$lib/data/config');
    if (cfg.default.programType == "DAB") {
        await page.goto('http://localhost:5173/');
        // find writing system name
        const vernName = await page.getByTestId("vernacular-language-tab").textContent();
        const revName = await page.getByTestId("reversal-language-tab").textContent();

        // switch for code in config
        let vernCode = "wrong-v";
        let revCode = "wrong-r";
        for (let sys in cfg.default.writingSystems) {
            let sysName = cfg.default.writingSystems[sys].displayNames["default"];
            if (sysName.trim() === vernName.trim()) {
                vernCode = sys;
            }
            if (sysName.trim() === revName.trim()) {
                revCode = sys;
            }
        }
        // switch for alphabet list in config
        const vAlphabet = cfg.default.writingSystems[vernCode].alphabet;
        const rAlphabet = cfg.default.writingSystems[revCode].alphabet;

        // compare with alphabet list in buttons
        await expect(await page.getByTestId('vernacular-language-tab')).toBeVisible();
        await expect(await page.getByTestId('reversal-language-tab')).toBeVisible();

        await page.getByTestId('vernacular-language-tab').click();
        await expect(page.getByTestId('vernacular-language-indicator')).toHaveClass("existing");
        const alphabet = await page.getByTestId('alphabet-strip');
        const buttons = await alphabet.locator('button');
        for (let i = 0; i < await buttons.count(); i++) {
            const buttonText = await buttons.nth(i).textContent();
            expect(vAlphabet[i]).toEqual(buttonText.trim());
        }

        const lv1 = await page.getByTestId('list-view');
        const entries1 = await lv1.locator('li');
        const c1 = await entries1.count();
        expect(c1).toBeGreaterThan(1);

        await page.getByTestId('reversal-language-tab').click();
        await expect(page.getByTestId('reversal-language-indicator')).toHaveClass("existing");
        const alphabet2 = await page.getByTestId('alphabet-strip');
        const buttons2 = await alphabet2.locator('button');
        for (let i = 0; i < await buttons2.count(); i++) {
            const buttonText = await buttons2.nth(i).textContent();
            expect(rAlphabet[i]).toEqual(buttonText.trim());
        }

        const lv2 = await page.getByTestId('list-view');
        const entries2 = await lv2.locator('li');
        const c2 = await entries2.count();
        expect(c2).toBeGreaterThan(1);

    }
});