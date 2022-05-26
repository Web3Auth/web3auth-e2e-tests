import { expect } from "@playwright/test";
import { test } from "./index.lib";
import { confirmEmail } from "../../utils";
import { setup2FA } from "../../utils";

test.describe("Setup 2FA", () => {
  test("Setup 2FA from Login", async ({ browser, openloginURL, user }) => {
    const context = await browser.newContext({ acceptDownloads: true });
    const page = await context.newPage();
    await page.goto(openloginURL);
    await page.click('button:has-text("Get Started")');

    // Login with Passwordless
    const timestamp = Math.floor(Date.now() / 1000);
    await page.fill('[placeholder="Email"]', user.email_2fa_login);
    await page.click('button:has-text("Continue with Email")');
    await page.waitForSelector("text=email has been sent");
    expect(await page.isVisible(`text=${user.email_2fa_login}`)).toBeTruthy();

    // Confirm email
    test.fixme(
      !(await confirmEmail({
        context,
        timestamp,
        resend: () => page.click("text=Resend"),
      }))
    );

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
    expect(await page.isVisible(`text=${user.email_2fa_login}`)).toBeTruthy();

    // Logout
    await Promise.all([page.waitForNavigation(), page.click("text=Logout")]);
    expect(page.url()).toBe(`${openloginURL}/`);
  });

  // test("Setup 2FA from Settings", async ({ browser, openloginURL, user }) => {
  //   const context = await browser.newContext({ acceptDownloads: true });
  //   const page = await context.newPage();
  //   await page.goto(openloginURL);
  //   await page.click('button:has-text("Get Started")');

  //   // Login with Passwordless
  //   const timestamp = Math.floor(Date.now() / 1000);
  //   await page.fill('[placeholder="Email"]', user.email_2fa_settings);
  //   await page.click('button:has-text("Continue with Email")');
  //   await page.waitForSelector("text=email has been sent");
  //   expect(
  //     await page.isVisible(`text=${user.email_2fa_settings}`)
  //   ).toBeTruthy();

  //   // Confirm email
  //   test.fixme(
  //     !(await confirmEmail({
  //       context,
  //       timestamp,
  //       resend: () => page.click("text=Resend"),
  //     }))
  //   );

  //   await page.waitForURL(`${openloginURL}/wallet/home`, {
  //     timeout: 2 * 60 * 1000,
  //   });
  //   await Promise.all([
  //     page.waitForNavigation(/*{ url: 'https://app.openlogin.com/wallet/account' }*/),
  //     page.click('div[role="list"] div:has-text("Account")'),
  //   ]);
  //   expect(await setup2FA(page, "Settings")).toBeTruthy();
  //   // Should be signed in in <2 minutes
  //   await page.waitForURL(`${openloginURL}/wallet/home`, {
  //     timeout: 2 * 60 * 1000,
  //   });

  //   // Go to Account page
  //   await Promise.all([page.waitForNavigation(), page.click("text=Account")]);
  //   expect(
  //     await page.isVisible(`text=${user.email_2fa_settings}`)
  //   ).toBeTruthy();

  //   // Logout
  //   await Promise.all([page.waitForNavigation(), page.click("text=Logout")]);
  //   expect(page.url()).toBe(`${openloginURL}/`);
  // });
});

// Save signed-in state to storage
test.afterEach(async ({ page, browserName }) => {
  await page
    .context()
    .storageState({ path: `${__dirname}/${browserName}.json` });
});