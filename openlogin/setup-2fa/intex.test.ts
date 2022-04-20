import { expect } from "@playwright/test";
import { test } from "./index.lib";

test.describe("Setup 2FA", () => {
  test.beforeEach(async ({ page, openloginURL }) => {
    await page.goto(openloginURL);
  });

  test(`Setup 2FA from Login`, async ({ page }) => {
    const title = await page.title();
    expect(title).toBe("OpenLogin");
  });

  test(`Setup 2FA from Settings`, async ({ page }) => {
    expect(await page.isVisible(`button:has-text("Get Started")`)).toBeTruthy();
  });
});

// Save signed-in state to storage
test.afterEach(async ({ page, browserName }) => {
  await page
    .context()
    .storageState({ path: `${__dirname}/${browserName}.json` });
});
