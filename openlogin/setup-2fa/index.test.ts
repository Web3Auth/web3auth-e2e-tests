import { expect, Page, Browser } from "@playwright/test";
import { test } from "./index.lib";
import { confirmEmail } from "../../utils";
import { useAutoCancelShareTransfer } from "../../utils/index";
import * as fs from "fs";

async function setup2FA(page: Page, flow: string) {
  try {
    if (flow === "settings"){
    await Promise.all([
      page.waitForNavigation(/*{ url: 'https://app.openlogin.com/register#upgrading=true' }*/),
      page.click('button:has-text("Enable 2FA")'),
    ]);}
    else{
      console.log("inside login flow, clicking on start")
      try {
        await page.waitForSelector("text=Enable 2 Factor Authentication (2FA)", {
          timeout: 10000,
        });
        await page.click('button:has-text("Set up 2FA")');
      } catch {return false}
    }
    await page.click(".v-input--selection-controls__ripple");
    if (flow == "settings")
    {await page.click('button:has-text("Save current device")');}
    else{
      await page.locator('button:has-text("Continue")').first().click();
    }
    await page.click("text=View advanced option");
    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 5 * 1000 }),
      page.click("text=Download my recovery phrase", { timeout: 5 * 1000 }),
    ]);
    const downloadedFile = await download.path();
    const backupPhrase = fs.readFileSync(downloadedFile, "utf8");
    if (flow === "settings"){
    await page.click('button:has-text("Continue")');}
    else{
      await page.locator('button:has-text("Continue")').nth(1).click();
    }
    await page.fill("textarea", backupPhrase);
    await page.click('button:has-text("Verify")');

    await Promise.all([
      page.waitForNavigation(/*{ url: 'https://app.openlogin.com/wallet/home' }*/),
      page.click('button:has-text("Done")'),
    ]);
    return true;
  } catch {
    return false;
  }
}

async function emailLogin(
  browser: Browser, 
  browserName: string, 
  openloginURL: string, 
  email: string,
  page: Page){
  await page.goto(openloginURL);
  await page.click('button:has-text("Get Started")');
  // Login with Passwordless
  const timestamp = Math.floor(Date.now() / 1000);
  await page.fill('[placeholder="Email"]', email);
  await page.click('button:has-text("Continue with Email")');
  await page.waitForSelector("text=email has been sent");
  expect(await page.isVisible(`text=${email}`)).toBeTruthy();
  // Confirm email
  const emailContext = await browser.newContext({storageState: `${__dirname}/${browserName}.json`});
  test.fixme(
    !(await confirmEmail({
      context: emailContext,
      timestamp,
      to: email,
      resend: () => page.click("text=Resend"),
    }))
  );
  useAutoCancelShareTransfer(page);
}

async function closeSession(page: Page, openloginURL: string){
  // Logout
  await Promise.all([page.waitForNavigation(), page.click("text=Logout")]);
  expect(page.url()).toBe(`${openloginURL}/`);
}

test.describe("Setup 2FA", () => {
  test("Setup 2FA Settings", async ({ browser, openloginURL, user, browserName }) => {
    const context = await browser.newContext({ acceptDownloads: true, 
      storageState: `${__dirname}/${browserName}.json` });
    const page = await context.newPage();
    // await page.goto(openloginURL);
    // await page.click('button:has-text("Get Started")');
    // // Login with Passwordless
    // const timestamp = Math.floor(Date.now() / 1000);
    // await page.fill('[placeholder="Email"]', user.email);
    // await page.click('button:has-text("Continue with Email")');
    // await page.waitForSelector("text=email has been sent");
    // expect(await page.isVisible(`text=${user.email}`)).toBeTruthy();
    // // Confirm email
    // const emailContext = await browser.newContext({storageState: `${__dirname}/${browserName}.json`});
    // test.fixme(
    //   !(await confirmEmail({
    //     context: emailContext,
    //     timestamp,
    //     to: user.email,
    //     resend: () => page.click("text=Resend"),
    //   }))
    // );
    // useAutoCancelShareTransfer(page);
    await emailLogin(browser, browserName, openloginURL, user.emailSettings, page);
    await page.waitForURL(`${openloginURL}/wallet/home`, {
      timeout: 2 * 60 * 1000,
    });
    await Promise.all([
      page.waitForNavigation(/*{ url: 'https://app.openlogin.com/wallet/account' }*/),
      page.click('div[role="list"] div:has-text("Account")'),
    ]);
    expect(await setup2FA(page, "settings")).toBeTruthy();
    // Should be signed in in <2 minutes
    await page.waitForURL(`${openloginURL}/wallet/home`, {
      timeout: 2 * 60 * 1000,
    });

    // Go to Account page
    await Promise.all([page.waitForNavigation(), page.click("text=Account")]);
    expect(await page.isVisible(`text=${user.emailSettings}`)).toBeTruthy();

    // Logout
    await closeSession(page, openloginURL);
    // await Promise.all([page.waitForNavigation(), page.click("text=Logout")]);
    // expect(page.url()).toBe(`${openloginURL}/`);
  });
  test("Setup 2FA Login", async ({ browser, openloginURL, user, browserName }) => {
    // login 3 times to detect login flow to setup 2fa
    const context = await browser.newContext({ acceptDownloads: true, 
      storageState: `${__dirname}/${browserName}.json` });
    const page = await context.newPage();
    await emailLogin(browser, browserName, openloginURL, user.emailLogin, page);
    await page.waitForURL(`${openloginURL}/wallet/home`, {
      timeout: 2 * 60 * 1000,
    });
    await closeSession(page, openloginURL);
    emailLogin(browser, browserName, openloginURL, user.emailLogin, page);
    await page.waitForURL(`${openloginURL}/wallet/home`, {
      timeout: 2 * 60 * 1000,
    });
    await closeSession(page, openloginURL);
    await emailLogin(browser, browserName, openloginURL, user.emailLogin, page);
    expect(await setup2FA(page, "login")).toBeTruthy();
    // Should be signed in in <2 minutes
    console.log("2fa setup done!!")
    console.log("going to home page")
    await page.waitForURL(`${openloginURL}/wallet/home`, {
      timeout: 2 * 60 * 1000,
    });
    console.log("Going to account page")
    // Go to Account page
    await Promise.all([page.waitForNavigation(), page.click("text=Account")]);
    expect(await page.isVisible(`text=${user.emailLogin}`)).toBeTruthy();
    console.log("user email found..")
    // Logout
    await closeSession(page, openloginURL);
    console.log("Logged out!")
  });
});

// Save signed-in state to storage
test.afterEach(async ({ page, browserName }) => {
  await page
    .context()
    .storageState({ path: `${__dirname}/${browserName}.json` });
  console.log("backup done!!")  
});
