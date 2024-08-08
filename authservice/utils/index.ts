/* eslint-disable no-unmodified-loop-condition */
import { Browser, expect, Page } from "@playwright/test";

import confirmEmail from "./confirmEmail";
process.env.APP_VERSION = "v4";
export const DEFAULT_PLATFORM = "prod";
const openloginversion = process.env.APP_VERSION;
import axios from "axios";
import ChanceJS from "chance";
const testEmailAppApiKey = process.env.TESTMAIL_APP_APIKEY;
const env_map: { [key: string]: string } = {
  prod: `https://app.openlogin.com/${openloginversion}`,
  beta: `https://beta.openlogin.com/${openloginversion}`,
  cyan: `https://cyan.openlogin.com/${openloginversion}`,
  staging: `https://staging.openlogin.com/${openloginversion}`,
  testing: `https://testing.openlogin.com/${openloginversion}`,
  celeste: `https://celeste.openlogin.com/${openloginversion}`,
  aqua: `https://aqua.openlogin.com/${openloginversion}`,
  local: "http://localhost:3000",
  torusV2: "https://app.tor.us",
  demo: "https://demo-openlogin.web3auth.io/",
  demoV4: "https://demo-openlogin-v4.web3auth.io/",
  demoV6: "https://demo-openlogin-v6.web3auth.io/",
};

function delay(time: number | undefined) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
}

export async function slowOperation<T>(op: () => Promise<T>, timeout?: number): Promise<T> {
  if (timeout) {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error("Operation timed out"));
      }, timeout);

      op()
        .then((result) => {
          clearTimeout(timer);
          return resolve(result);
        })
        .catch((error) => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }
  return op();
}

function useAutoCancelShareTransfer(page: Page): () => Promise<void> {
  let stopped = false;

  const promise = new Promise<void>((resolve, reject) => {
    async function checkShareTransfer() {
      while (!stopped) {
        try {
          if (await page.isVisible("text=New login detected")) {
            await page.click('button:has-text("Cancel")', { force: true });
          }
        } catch (err) {
          console.log(err);
          return reject(err);
        }
      }
      resolve();
    }

    checkShareTransfer().catch((error) => reject(error));
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

  const promise = new Promise<void>((resolve, reject) => {
    async function check2FA() {
      while (!stopped) {
        try {
          if (await page.getByLabel("Set up 2FA").isVisible()) {
            await page.locator("xpath=.//button[text()='Skip for Now']").first().click();
          }
        } catch (err) {
          console.log(err);
          return reject(err);
        }
      }
      resolve();
    }

    check2FA().catch((error) => reject(error));
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
  } catch (err) {
    console.log(err);
  }
  try {
    if (await page.isVisible("text=Unable to detect login share from the Auth Network")) {
      console.log("Error: Test failed to detect login share from the Auth Network");
      return true;
    }
  } catch (err) {
    console.log(err);
  }
  try {
    if (await page.isVisible("text=Unable to connect to Auth Network. The Network may be congested.")) {
      console.log("Error: Test failed to connect to Auth Network. The Network may be congested.");
      return true;
    }
  } catch (err) {
    console.log(err);
  }
}

function catchError(page: Page): () => Promise<void> {
  let stopped = false;
  const promise = new Promise<void>((resolve, reject) => {
    async function checkPage() {
      while (!stopped) {
        try {
          if (await page.isVisible("text=Too many requests")) {
            console.log("Error: Test failed due to too many requests");
          }
        } catch (error) {
          return reject(true);
        }
        try {
          if (await page.isVisible("text=Unable to detect login share from the Auth Network")) {
            console.log("Error: Test failed to detect login share from the Auth Network");
          }
        } catch (error) {
          return reject(true);
        }
        try {
          if (await page.isVisible("text=Unable to connect to Auth Network. The Network may be congested.")) {
            console.log("Error: Test failed to connect to Auth Network. The Network may be congested.");
          }
        } catch (error) {
          return reject(true);
        }
      }
      resolve();
    }

    checkPage().catch((error) => reject(error));
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
  } catch (err) {
    console.log(err);
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
    await page.waitForSelector(`input:has-text("Authorize app")`, {
      timeout: 1000,
    });
    await page.click(`input:has-text("Authorize app")`);
  } catch (err) {
    console.log(err);
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
        console.log(err);
      }
      try {
        await page.waitForSelector("input#allow", {
          timeout: 1000,
        });
        await page.click("input#allow");
      } catch (err) {
        console.log(err);
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
  } catch (err) {
    console.log(err);
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

async function signInWithEmail(page: Page, email: string, browser: Browser): Promise<boolean> {
  try {
    console.log(`Email:${email}`);
    await page.fill("#passwordless-email", email);
    await page.getByLabel("Connect with Phone or Email").click();
    await page.waitForSelector("text=Verify your email");
    await delay(3000);
    let href;
    if (process.env.MAIL_APP === "testmail") {
      // Setup our JSON API endpoint
      const ENDPOINT = `https://api.testmail.app/api/json?apikey=${testEmailAppApiKey}&namespace=kelg8`;
      const res = await axios.get(`${ENDPOINT}&tag=${email.split("@")[0].split(".")[1]}&livequery=true`);
      const inbox = await res.data;
      href = inbox.emails[0].html.match(/href="([^"]*)/)[1];
    }
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await page2.goto(href);
    await page2.waitForSelector("text=Close this and return to your previous window", {
      timeout: 10000,
    });
    await page2.close();
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}

async function signInWithEmailWithTestEmailApp(page: Page, email: string, browser: Browser, tag: string): Promise<boolean> {
  try {
    console.log(`Email:${email}`);
    await page.fill("#passwordless-email", email);
    await page.getByLabel("Connect with Phone or Email").click();
    await page.waitForSelector("text=Verify your email");
    await delay(3000);
    // Setup our JSON API endpoint
    const ENDPOINT = `https://api.testmail.app/api/json?apikey=${testEmailAppApiKey}&namespace=kelg8`;
    const res = await axios.get(`${ENDPOINT}&tag=${tag}&livequery=true`);
    const inbox = await res.data;
    const href = inbox.emails[0].html.match(/href="([^"]*)/)[1];
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await page2.goto(href);
    await page2.waitForSelector("text=Close this and return to your previous window", {
      timeout: 10000,
    });
    await page2.close();
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}

/**
 * Verify the email by retrieve the code in the email and input to the OTP box.
 *
 * @param {number} email - Email to use to receive the verification code, email from the mail service
 * @param {number} previousCode - If use this email to receive the code many times, use this one to wait until get the new email, if empty, ignore to wait
 */

async function verifyEmailPasswordlessWithVerificationCode(
  page: Page,
  browser: Browser,
  config: { email: string; tag: string; timestamp: number; redirectMode: boolean; previousCode: string }
) {
  console.log(`Email:${config.email}`);

  if (config.redirectMode) await page.locator("text=Email Verification").waitFor({ state: "visible" });

  let count = 0;
  let verificationCode: string;

  while (count < 5) {
    await delay(2000);

    const ENDPOINT = `https://api.testmail.app/api/json?apikey=${testEmailAppApiKey}&namespace=kelg8`;
    const res = await axios.get(`${ENDPOINT}&tag=${config.tag}&livequery=true&timestamp_from=${config.timestamp}`);
    const inbox = await res.data;
    verificationCode = inbox.emails[0].subject.match(/\d+/)[0] as string;

    if (!config.previousCode || verificationCode !== config.previousCode) {
      break;
    }

    count++;
  }

  if (!config.redirectMode) {
    const pages = browser.contexts()[0].pages();
    await pages[1].bringToFront();
    await pages[1].locator(`xpath=.//input[@data-test='single-input'][@class='otp-input']`).first().type(verificationCode);
  } else await page.locator(`xpath=.//input[@data-test='single-input'][@class='otp-input']`).first().type(verificationCode);

  return verificationCode;
}

async function signInWithEmailWithTestEmailOnDemoApp(
  page: Page,
  email: string,
  browser: Browser,
  tag: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  option: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  platform: string
): Promise<boolean> {
  try {
    await page.waitForSelector(`[data-testid="loginProvider"]`);
    await page.click(`[data-testid="loginProvider"]`);
    await page.click(`//*[@data-testid="loginProvider"]//span[text()="email passwordless"]`);

    console.log(`Email:${email}`);
    await page.fill('input[data-testid="loginHint"]', email);
    await page.click('button:has-text("Login with email passwordless")');
    await page.waitForSelector("text=Verify your email");
    await delay(5000);
    // Setup our JSON API endpoint
    const ENDPOINT = `https://api.testmail.app/api/json?apikey=${testEmailAppApiKey}&namespace=kelg8`;
    const res = await axios.get(`${ENDPOINT}&tag=${tag}&livequery=true`);
    const inbox = await res.data;
    const href = inbox.emails[0].html.match(/href="([^"]*)/)[1];
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await page2.goto(href);
    await page2.waitForSelector("text=Close this and return to your previous window", {
      timeout: 10000,
    });
    await page2.close();
    await context2.close();
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}

async function signInWithEmailWithTestEmailOnDemoAppV4(page: Page, email: string, browser: Browser, tag: string, option: string): Promise<boolean> {
  try {
    await page.waitForSelector('xpath=.//select[@class="select"]');
    await page.locator(`xpath=.//option[text()="${option}"]/parent::select`).first().selectOption(option);
    await page.locator(`xpath=.//option[text()="email_passwordless"]/parent::select`).first().selectOption("email_passwordless");
    console.log(`Email:${email}`);
    await page.fill('[placeholder="Enter an email"]', email);
    // await page
    //   .locator(`xpath=.//option[text()="code"]/parent::select`)
    //   .first()
    //   .selectOption("link");
    await page.click('button:has-text("Login with email passwordless")');
    await page.waitForSelector("text=Verify your email");
    await delay(3000);
    // Setup our JSON API endpoint
    const ENDPOINT = `https://api.testmail.app/api/json?apikey=${testEmailAppApiKey}&namespace=kelg8`;
    const res = await axios.get(`${ENDPOINT}&tag=${tag}&livequery=true`);
    const inbox = await res.data;
    const href = inbox.emails[0].html.match(/href="([^"]*)/)[1];
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await page2.goto(href);
    await page2.waitForSelector("text=Close this and return to your previous window", {
      timeout: 10000,
    });
    await page2.close();
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}

async function signInWithEmailWithTestEmailOnW3ADemoApp(
  page: Page,
  email: string,
  browser: Browser,
  tag: string,
  timestamp: number
): Promise<boolean> {
  try {
    console.log(`Email:${email}`);
    await page.fill('[placeholder="name@example.com"]', email);
    await page.click('button:has-text("Continue With Email")');
    await delay(15000);
    const pages = await browser.contexts()[0].pages();
    // pages[0] is the first page, and pages[1] is the new page
    await pages[1].bringToFront(); // Bring the new page to the front

    // Setup our JSON API endpoint
    const ENDPOINT = `https://api.testmail.app/api/json?apikey=${testEmailAppApiKey}&namespace=kelg8`;
    const res = await axios.get(`${ENDPOINT}&tag=${tag}&livequery=true&timestamp_from=${timestamp}`);
    const inbox = await res.data;
    const href = inbox.emails[0].subject.match(/\d+/)[0];
    console.error(href);
    await pages[1].locator(`xpath=.//input[@aria-label='Please enter verification code. Digit 1']`).fill(href);
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
  const chance = new ChanceJS();
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

function getBackUpPhrase(environment: string | undefined) {
  if (environment === "prod") {
    return process.env.BACKUP_PHRASE_PROD;
  }
  if (environment === "cyan") {
    return process.env.BACKUP_PHRASE_CYAN;
  }
  if (environment === "aqua") {
    return process.env.BACKUP_PHRASE_AQUA;
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
  generateEmailWithTag,
  generateRandomEmail,
  getBackUpPhrase,
  // signInWithDapps,
  signInWithDiscord,
  signInWithEmail,
  signInWithEmailWithTestEmailApp,
  signInWithEmailWithTestEmailOnDemoApp,
  signInWithEmailWithTestEmailOnDemoAppV4,
  signInWithEmailWithTestEmailOnW3ADemoApp,
  signInWithFacebook,
  signInWithGitHub,
  signInWithGoogle,
  signInWithMobileNumber,
  signInWithTwitter,
  signInWithTwitterWithoutLogin,
  useAutoCancel2FASetup,
  useAutoCancelShareTransfer,
  verifyEmailPasswordlessWithVerificationCode,
  waitForTkeyRehydration,
};
