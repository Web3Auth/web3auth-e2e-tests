import { expect } from "@playwright/test";
import { test } from "./index.lib";

test.describe("On homepage,", () => {
  test.beforeEach(async ({ page, openloginURL }) => {
    await page.goto(openloginURL);
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
