import { test, expect } from "@playwright/test";

test.describe("On homepage,", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("https://app.openlogin.com");
  });

  test(`title should be "OpenLogin"`, async ({ page }) => {
    const title = await page.title();
    expect(title).toBe("OpenLogin");
  });

  test(`there should be "Get Started" button`, async ({ page }) => {
    expect(await page.isVisible(`button:has-text("Get Started")`)).toBeTruthy();
  });

  test(`click on "Get Started" should show login modal`, async ({ page }) => {
    await page.click(`button:has-text("Get Started")`);
    expect(await page.isVisible("text=Welcome onboard")).toBeTruthy();
  });
});
