/* eslint-disable no-unmodified-loop-condition */
import { Browser, expect, Page, test } from "@playwright/test";
import axios from "axios";
import Chance from "chance";

import config from "../../index.config";
import confirmEmail from "./confirmEmail";
export const DEFAULT_PLATFORM = "prod";
export const openloginversion = process.env.APP_VERSION || "v3";
const testEmailAppApiKey = process.env.TESTMAIL_APP_APIKEY;
console.log(`Environment:${process.env.PLATFORM}`);
console.log(`App Version:${openloginversion}`);
const env_map: { [key: string]: string } = {
  prod: `https://test-dashboard.web3auth.io`,
  beta: `https://beta.openlogin.com/${openloginversion}`,
  cyan: `https://cyan.openlogin.com/${openloginversion}`,
  staging: `https://dev-dashboard.web3auth.io`,
  testing: `https://testing.openlogin.com/${openloginversion}`,
  celeste: `https://celeste.openlogin.com/${openloginversion}`,
  aqua: `https://aqua.openlogin.com/${openloginversion}`,
  local: "http://localhost:3000",
};

function delay(time: number | undefined) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
}

export async function slowOperation(op: () => Promise<void>, timeout?: number) {
  // Set slow timeout
  test.setTimeout(timeout || 2 * 60 * 1000); // => 2 mins timeout
  await op();
  // Reset timeout
  test.setTimeout(config.timeout || 0);
}

function useAutoCancelShareTransfer(page: Page): () => Promise<void> {
  let stopped = false;
  const promise = new Promise<void>((resolve) => {
    const checkLogin = async () => {
      while (!stopped) {
        try {
          if (await page.isVisible("text=New login detected")) {
            await page.click('button:has-text("Cancel")', { force: true });
          }
        } catch {
          // Handle error
        }
      }
      resolve();
    };

    checkLogin();
  });

  return async () => {
    stopped = true;
    await promise;
  };
}

async function waitForTkeyRehydration(page: Page, size = 100): Promise<boolean> {
  return new Promise(function (resolve) {
    page.on("console", (msg) => {
      console.log(msg);
      //will check on the implementation,currently rehydrating tkey: 914.059814453125 ms is only displayed
      // 120 state will change if the openlogin default state changes.
      // need better way to rehydrate or find if the object is empty
      if (msg.text().includes("e2e:tests:tkeyjson")) {
        const text = msg.text();
        const length = parseInt(text.split("e2e:tests:tkeyjson:")[1]);
        if (length > size) resolve(true);
      }
    });
  });
}

async function waitForAddPassword(page: Page): Promise<boolean> {
  return new Promise(function (resolve) {
    page.on("console", (msg) => {
      if (msg.type() === "info" && msg.text() === "e2e:tests:addPasswordCompleted") {
        resolve(true);
      }
    });
  });
}

async function waitForSessionStorage(page: Page, openloginURL: string) {
  const sessionStorage: { tKeyModule: string } = await page.evaluate(() => sessionStorage);
  const { shares } = JSON.parse(sessionStorage.tKeyModule).tKeyModule.tKey;
  const noShare = Object.keys(shares).length;
  if (noShare < 2) {
    // console.log("not enough shares");
    await page.goto(`${openloginURL}/wallet/home`);
    await page.waitForURL(`${openloginURL}/wallet/home`, {
      waitUntil: "load",
    });
    await page.waitForTimeout(3000);
    await waitForTkeyRehydration(page);
    await page.goto(`${openloginURL}/wallet/account`);
    await page.waitForURL(`${openloginURL}/wallet/account`, {
      waitUntil: "load",
    });
  }
}

async function waitForChangePassword(page: Page): Promise<boolean> {
  return new Promise(function (resolve) {
    page.on("console", (msg) => {
      if (msg.type() === "info" && msg.text().includes("e2e:tests:changePasswordCompleted")) {
        resolve(true);
      }
    });
  });
}

async function waitForDeleteShare(page: Page): Promise<boolean> {
  return new Promise(function (resolve) {
    page.on("console", (msg) => {
      if (msg.type() === "info" && msg.text().includes("e2e:tests:deleteShareCompleted")) {
        resolve(true);
      }
    });
  });
}

function useAutoCancel2FASetup(page: Page): () => Promise<void> {
  let stopped = false;
  const promise = new Promise<void>((resolve) => {
    const check2FA = async () => {
      while (!stopped) {
        try {
          if (await page.getByLabel("Set up 2FA").isVisible()) {
            await page.locator("xpath=.//button[text()='Skip for Now']").first().click();
          }
        } catch {
          // Handle error
        }
      }
      resolve();
    };

    check2FA();
  });

  return async () => {
    stopped = true;
    await promise;
  };
}

async function catchErrorAndExit(page: Page): Promise<boolean | undefined> {
  try {
    if (await page.isVisible("text=Too many requests")) {
      console.log("Error: Test failed due to too many requests");
      return true;
    }
  } catch {
    // Handle error
  }
  try {
    if (await page.isVisible("text=Unable to detect login share from the Auth Network")) {
      console.log("Error: Test failed to detect login share from the Auth Network");
      return true;
    }
  } catch {
    // Handle error
  }
  try {
    if (await page.isVisible("text=Unable to connect to Auth Network. The Network may be congested.")) {
      console.log("Error: Test failed to connect to Auth Network. The Network may be congested.");
      return true;
    }
  } catch {
    // Handle error
  }
}

function catchError(page: Page): () => Promise<void> {
  let stopped = false;
  const promise = new Promise<void>((resolve) => {
    const checkConditions = async () => {
      while (!stopped) {
        try {
          if (await page.isVisible("text=Too many requests")) {
            console.log("Error: Test failed due to too many requests");
          }
        } catch {
          return true;
        }
        try {
          if (await page.isVisible("text=Unable to detect login share from the Auth Network")) {
            console.log("Error: Test failed to detect login share from the Auth Network");
          }
        } catch {
          return true;
        }
        try {
          if (await page.isVisible("text=Unable to connect to Auth Network. The Network may be congested.")) {
            console.log("Error: Test failed to connect to Auth Network. The Network may be congested.");
          }
        } catch {
          return true;
        }
      }
      resolve();
    };

    checkConditions();
  });

  return async () => {
    stopped = true;
    await promise;
  };
}

async function signInWithGoogle({
  page,
  google,
}: {
  page: Page;
  google: {
    email: string;
    password: string;
  };
}): Promise<boolean> {
  try {
    await page.waitForURL("https://accounts.google.com/**");
    await page.waitForSelector('input[type="Email"]');
    expect(await page.isVisible('input[type="Email"]')).toBe(true);
    await page.fill('input[type="Email"]', google.email);
    expect(await page.isVisible('button:has-text("Next")')).toBe(true);
    await page.click(`button:has-text("Next")`);
    await page.fill('input[type="password"]', google.password);
    await page.click(`button:has-text("Next")`);
    await page.waitForURL("https://myaccount.google.com/**");
    return true;
  } catch {
    return false;
  }
}

async function signInWithGitHub({
  page,
  github,
}: {
  page: Page;
  github: {
    email: string;
    password: string;
  };
}): Promise<boolean> {
  try {
    await page.goto("https://github.com/login");
    await page.waitForSelector("text=Sign in");
    await page.isVisible("text=Sign in");

    await page.fill('input[autocomplete="username"]', github.email);

    await page.fill('input[autocomplete="current-password"]', github.password);

    await page.click('input[value="Sign in"]');

    await page.waitForSelector("text=Create repository");
    expect(page.isVisible("text=Create repository")).toBe(true);
    return true;
  } catch {
    return false;
  }
}

async function authorizeWithGitHub({ page }: { page: Page }) {
  try {
    await page.waitForSelector("text=Authorize TorusLabs", {
      timeout: 10 * 1000,
    });
    await page.click('button:has-text("Authorize TorusLabs")', {
      timeout: 9000,
    });
  } catch {
    // Handle error
  }
}

async function signInWithTwitter({
  page,
  twitter,
  openloginURL,
}: {
  page: Page;
  twitter: {
    account: string;
    email: string;
    password: string;
  };
  openloginURL: string;
}): Promise<void> {
  await page.goto(openloginURL);
  await page.click('button:has-text("Get Started")');
  await page.click("[aria-label='login with twitter']");
  await page.waitForURL("https://api.twitter.com/oauth/**");
  const appName = process.env.PLATFORM === "testing" ? "torus-test-auth0" : "Web3Auth";
  await page.waitForSelector(`h2:text("Authorize ${appName} to access your account?")`);
  await page.click(`input:has-text("Sign in")`);
  // Only for the first time users, they have to click on authorize web3Auth app
  try {
    // smaller timeout, we don't want to wait here for longer
    await page.click(`input:has-text("Authorize app")`);
  } catch {
    // Handle error
  }

  await page.waitForSelector('text="Sign in to Twitter"');
  await page.fill('input[autocomplete="username"]', twitter.account);
  await page.click(`div[role="button"] span:has-text("Next")`);
  await page.fill('input[type="password"]', twitter.password);

  // Login tests are slow tests, >1 min is consumed in the redirection loop from the social provider to finally reach wallet/home. Hence the max test timeout.
  // FLOW: social-redirections => [host]/auth(SLOW) => [host]/register(SLOW) => [host]/wallet/home
  await slowOperation(
    async () => {
      await page.click(`div[role="button"] span:has-text("Log in")`);
      try {
        // smaller timeout, we don't want to wait here for longer
        await page.waitForSelector('text="Help us keep your account safe."', {
          timeout: 1000,
        });
        await page.fill('input[autocomplete="email"]', twitter.email);
        await page.click(`div[role="button"] span:has-text("Next")`);
      } catch (err) {
        // Handle error
      }
      try {
        await page.waitForSelector("input#allow", {
          timeout: 1000,
        });
        await page.click("input#allow");
      } catch {
        // Handle error
      }
    },
    3 * 60 * 1000
  );
}

async function signInWithTwitterWithoutLogin({
  page,
  twitter,
}: {
  page: Page;
  twitter: {
    account: string;
    email: string;
    password: string;
  };
  openloginURL: string;
}): Promise<void> {
  await page.waitForSelector("text=Authorise Web3Auth to access your account?");
  await page.fill("#username_or_email", twitter.account);
  await page.fill('input[type="password"]', twitter.password);
  await page.click("xpath=.//input[@value='Sign In']");
}

async function signInWithFacebook({
  page,
  FB,
}: {
  page: Page;
  FB: {
    name: string;
    email: string;
    password: string;
    firstName: string;
    backupPhrase: string;
  };
  openloginURL: string;
}): Promise<void> {
  await page.waitForURL("https://www.facebook.com/**");
  await page.isVisible("text=Log in");
  await page.waitForSelector("#email");
  console.log(`Email:${FB.email}`);
  await page.fill("#email", FB.email);
  await page.waitForSelector('[placeholder="Password"]');
  await page.fill('[placeholder="Password"]', FB.password);
  await page.click(`button:has-text("Login"), [name="login"]`);
  try {
    await page.waitForSelector(`button:has-text("Continue"), [aria-label="Continue"], [aria-label="Continue as ${FB.firstName}"]`);
    await page.click(`button:has-text("Continue"), [aria-label="Continue"], [aria-label="Continue as ${FB.firstName}"]`);
  } catch {
    // Handle error
  }
}

async function signInWithDiscord({
  page,
  discord,
}: {
  page: Page;
  discord: {
    email: string;
    password: string;
  };
}): Promise<boolean> {
  try {
    await page.waitForURL("https://discord.com/oauth2/**");
    await page.isVisible("text=Welcome back!");
    await page.fill('[name="email"]', discord.email);
    await page.fill('[name="password"]', discord.password);
    await page.click(`button:has-text("Log In")`);
    await page.click("#checkbox");
    return true;
  } catch {
    return false;
  }
}
async function ensureDeviceShareDeleted(page: Page) {
  let isDeleted = false;
  try {
    await page.click('button:has-text("Remove share")');
    if (await page.locator("text=Device share deletion unsuccessful").isVisible()) {
      console.log("Unable to delete device share");
      await page.reload();
    } else {
      // inner try/catch block to handle a scenario where there is no timeout/error
      // but still did not  get successful message, reload the page and return false
      try {
        await page.waitForSelector("text=Device share successfully deleted");
        isDeleted = true;
      } catch {
        await page.reload();
      }
    }
    // catch to handle timeout scenario after clicking "Remove share" button
    // close delete share conformation dialog and reload the page
  } catch {
    await page.click('[aria-label="Close Delete Share Dialog"]');
    await page.reload();
  }
  return isDeleted;
}

// Delete all shares
async function deleteCurrentDeviceShare(page: Page) {
  let x;
  let deviceShares = page.locator('[aria-label="delete device share"]');
  let countShares = await deviceShares.count();
  while (countShares > 0) {
    x = waitForDeleteShare(page);
    await deviceShares.first().click();
    const isDeleted = await ensureDeviceShareDeleted(page);
    await x;

    if (isDeleted) {
      countShares = countShares - 1;
    } else {
      deviceShares = page.locator('[aria-label="delete device share"]');
      countShares = await deviceShares.count();
    }
  }
}

async function addPasswordShare(page: Page, password: string) {
  // wait for password to be visible
  await page.isVisible("input[name='openlogin-password']");
  await page.isVisible("input[name='openlogin-confirm-password']");
  await page.locator("input[name='openlogin-password']").fill(password);
  await page.locator("input[name='openlogin-confirm-password']").fill(password);

  const y = waitForAddPassword(page);
  await page.isEnabled('button:has-text("Confirm")');
  await page.click('button:has-text("Confirm")');
  await page.isVisible('button:has-text("Change password")');
  await page.locator("text=Password successfully changed").isVisible();
  await y;
}

async function changePasswordShare(page: Page, password: string) {
  await page.locator('button:has-text("Change Password")').isVisible();
  await page.locator('button:has-text("Change Password")').click();

  await page.locator("input[name='openlogin-password']").isVisible();
  await page.locator("input[name='openlogin-confirm-password']").isVisible();

  await page.locator("input[name='openlogin-password']").fill(password);
  await page.locator("input[name='openlogin-confirm-password']").fill(password);

  const y = waitForChangePassword(page);
  await page.click('button:has-text("Confirm")');
  await page.isVisible('button:has-text("Change password")');
  await page.locator("text=Password successfully changed").isVisible();
  await y;
}

async function signInWithEmailWithTestEmailApp(page: Page, email: string, browser: Browser, tag: string, timestamp: number): Promise<boolean> {
  try {
    console.log(`Email:${email}`);
    await page.fill('[placeholder="name@domain.com"]', email);
    await page.click('button:has-text("Login with Email")');
    await delay(20000);
    const pages = browser.contexts()[0].pages();
    // pages[0] is the first page, and pages[1] is the new page
    await pages[1].bringToFront(); // Bring the new page to the front
    // Setup our JSON API endpoint
    const ENDPOINT = `https://api.testmail.app/api/json?apikey=${testEmailAppApiKey}&namespace=kelg8`;
    const res = await axios.get(`${ENDPOINT}&tag=${tag}&livequery=true&timestamp_from=${timestamp}`);
    const inbox = await res.data;
    const href = inbox.emails[0].subject.match(/\d+/)[0];
    console.error(href);
    await pages[1].locator(`xpath=.//input[@data-test='single-input'][@class='otp-input']`).first().type(href);
    useAutoCancel2FASetup(pages[1]);
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}
async function signInWithEmailWithTestEmailAppInDemoApp(
  page: Page,
  email: string,
  browser: Browser,
  tag: string,
  timestamp: number
): Promise<boolean> {
  try {
    console.log(`Email:${email}`);
    await page.locator(`//iframe[contains(@id,"walletIframe")]`).waitFor({ state: "visible" });
    const frame = page.frameLocator(`//iframe[contains(@id,"walletIframe")]`);
    await frame?.locator('[placeholder="name@domain.com"]').fill(email);
    await frame?.locator('button:has-text("Login with Email")').click();
    await delay(10000);
    const pages = await browser.contexts()[0].pages();
    // pages[0] is the first page, and pages[1] is the new page
    await pages[1].bringToFront(); // Bring the new page to the front
    // Setup our JSON API endpoint
    const ENDPOINT = `https://api.testmail.app/api/json?apikey=${testEmailAppApiKey}&namespace=kelg8`;
    const res = await axios.get(`${ENDPOINT}&tag=${tag}&livequery=true&timestamp_from=${timestamp}`);
    const inbox = await res.data;
    const href = inbox.emails[0].subject.match(/\d+/)[0];
    console.error(href);
    await pages[1].locator(`xpath=.//input[@data-test='single-input'][@class='otp-input']`).first().type(href);
    useAutoCancel2FASetup(pages[1]);
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}

async function signInWithMobileNumber({
  page,
  user,
  browser,
}: {
  page: Page;
  browser: Browser;
  user: {
    mobileNumberForLogin: string;
    mobileNumberForSMS: string;
  };
}) {
  await delay(15000);
  const context2 = await browser.newContext();
  const page2 = await context2.newPage();
  await page2.goto(`https://receive-sms.cc/Finland-Phone-Number/${user.mobileNumberForSMS}`);
  try {
    await page2.waitForSelector('div:has-text("is your verification code on Web3Auth")');
  } catch {
    await page2.reload();
  }
  const otp = (await page2.locator("xpath=.//div[contains(text(),'is your verification code on Web3Auth')]/span").first().textContent()) || "";
  console.log(`otp:${otp}`);
  await page2.close();
  await page.locator("xpath=.//input[@aria-label='Please enter verification code. Digit 1']").fill(otp);
}

function generateEmailWithTag() {
  // Randomly generating the tag...
  const chance = new Chance();
  const tag = chance.string({
    length: 12,
    pool: "abcdefghijklmnopqrstuvwxyz0123456789",
  });
  return `kelg8.${tag}@inbox.testmail.app`;
}

function generateRandomEmail() {
  if (process.env.MAIL_APP === "testmail") {
    return generateEmailWithTag();
  }
}

export {
  addPasswordShare,
  authorizeWithGitHub,
  catchError,
  catchErrorAndExit,
  changePasswordShare,
  confirmEmail,
  delay,
  deleteCurrentDeviceShare,
  env_map,
  generateRandomEmail,
  // signInWithDapps,
  signInWithDiscord,
  signInWithEmailWithTestEmailApp,
  signInWithEmailWithTestEmailAppInDemoApp,
  signInWithFacebook,
  signInWithGitHub,
  signInWithGoogle,
  signInWithMobileNumber,
  signInWithTwitter,
  signInWithTwitterWithoutLogin,
  useAutoCancel2FASetup,
  useAutoCancelShareTransfer,
  waitForSessionStorage,
  waitForTkeyRehydration,
};
