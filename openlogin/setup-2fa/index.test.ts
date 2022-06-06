import { expect, Page } from "@playwright/test";
import { test } from "./index.lib";
import { confirmEmail } from "../../utils";
import { useAutoCancelShareTransfer } from "../../utils/index";
import * as fs from "fs";

async function setup2FA(page: Page, flow: string) {
  try {
    await Promise.all([
      page.waitForNavigation(/*{ url: 'https://app.openlogin.com/register#upgrading=true' }*/),
      page.click('button:has-text("Enable 2FA")'),
    ]);
    await page.click(".v-input--selection-controls__ripple");
    await page.click('button:has-text("Save current device")');
    // await page.click('button:has-text("View advanced option")');
    await page.click("text=View advanced option");
    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 5 * 1000 }),
      // page.click('button:has-text("Download my recovery phrase")'),
      page.click("text=Download my recovery phrase", { timeout: 5 * 1000 }),
    ]);
    const downloadedFile = await download.path();
    const backupPhrase = fs.readFileSync(downloadedFile, "utf8");
    await page.click('button:has-text("Continue")');
    await page.fill("textarea", backupPhrase);
    await page.click('button:has-text("Verify")');

    // till here

    await Promise.all([
      page.waitForNavigation(/*{ url: 'https://app.openlogin.com/wallet/home' }*/),
      page.click('button:has-text("Done")'),
    ]);
    return true;
  } catch {
    return false;
  }
}

test.describe("Setup 2FA", () => {
  test("Setup 2FA Settings", async ({ browser, openloginURL, user }) => {
    const context = await browser.newContext({ acceptDownloads: true });
    const page = await context.newPage();
    await page.goto(openloginURL);
    await page.click('button:has-text("Get Started")');
    // Login with Passwordless
    const timestamp = Math.floor(Date.now() / 1000);
    await page.fill('[placeholder="Email"]', user.email_2fa_settings);
    await page.click('button:has-text("Continue with Email")');
    await page.waitForSelector("text=email has been sent");
    expect(
      await page.isVisible(`text=${user.email_2fa_settings}`)
    ).toBeTruthy();
    // Confirm email
    const emailContext = await browser.newContext();
    test.fixme(
      !(await confirmEmail({
        context: emailContext,
        timestamp,
        to: user.email_2fa_settings,
        resend: () => page.click("text=Resend"),
      }))
    );
    useAutoCancelShareTransfer(page);
    await page.waitForURL(`${openloginURL}/wallet/home`, {
      timeout: 2 * 60 * 1000,
    });
    await Promise.all([
      page.waitForNavigation(/*{ url: 'https://app.openlogin.com/wallet/account' }*/),
      page.click('div[role="list"] div:has-text("Account")'),
    ]);
    expect(await setup2FA(page, "Login")).toBeTruthy();
    // Should be signed in in <2 minutes
    await page.waitForURL(`${openloginURL}/wallet/home`, {
      timeout: 2 * 60 * 1000,
    });

    // Go to Account page
    await Promise.all([page.waitForNavigation(), page.click("text=Account")]);
    expect(
      await page.isVisible(`text=${user.email_2fa_settings}`)
    ).toBeTruthy();

    // Logout
    await Promise.all([page.waitForNavigation(), page.click("text=Logout")]);
    expect(page.url()).toBe(`${openloginURL}/`);
  });
});

// Save signed-in state to storage
test.afterEach(async ({ page, browserName }) => {
  await page
    .context()
    .storageState({ path: `${__dirname}/${browserName}.json` });
});