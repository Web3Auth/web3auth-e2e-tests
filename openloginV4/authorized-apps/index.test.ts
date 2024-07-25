import { expect, Page, test } from "@playwright/test";

import { signInWithDapps ,
  catchErrorAndExit,
  generateRandomEmail,
  signInWithEmail,
, env_map } from "../utils";

const openloginURL = env_map[process.env.PLATFORM || "prod"];
const testEmail = generateRandomEmail();

test.describe.serial("Authorized Apps page scenarios", () => {
  let page: Page;
  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    test.setTimeout(300000);
    await page.goto(openloginURL);
    await signInWithEmail(page, testEmail, browser);
    const shouldExit = await catchErrorAndExit(page);
    expect(shouldExit).toBeFalsy();
    await page.waitForURL(`${openloginURL}/wallet/home`, {
      timeout: 3 * 60 * 1000,
    });
  });

  test(`should display "You are not connected to any applications yet." when no apps are connected.`, async () => {
    await page.goto(`${openloginURL}/wallet/apps`);
    await page.waitForURL(`${openloginURL}/wallet/apps`, {
      timeout: 3 * 60 * 1000,
    });
    expect(page.url()).toBe(`${openloginURL}/wallet/apps`);
    expect(await page.locator("xpath=.//div[text()='You are not connected to any applications yet.']")).toBeTruthy();
  });

  test(`should connect DApp wallet with passwordless login and list app`, async ({ browser }) => {
    test.setTimeout(120000);
    await signInWithDapps({ page, browser, testEmail });
    await page.goto(`${openloginURL}/wallet/apps`);
    await page.waitForURL(`${openloginURL}/wallet/apps`, {
      timeout: 3 * 60 * 1000,
    });
    expect(page.url()).toBe(`${openloginURL}/wallet/apps`);
    await page.waitForSelector("text=Web3Auth Demo App");
    expect(await page.isVisible("text=Authorized Apps")).toBeTruthy();
    expect(await page.isVisible("text=You are not connected to any applications yet.")).toBeFalsy();
  });

  test(`should be able to delete app share from UI`, async () => {
    await page.click('button[aria-label="delete device share"]');
    await page.goto(`${openloginURL}/wallet/apps`);
    await page.waitForURL(`${openloginURL}/wallet/apps`, {
      timeout: 3 * 60 * 1000,
    });
    expect(page.url()).toBe(`${openloginURL}/wallet/apps`);
    expect(await page.isVisible("text=You are not connected to any applications yet.")).toBeTruthy();
  });
});
