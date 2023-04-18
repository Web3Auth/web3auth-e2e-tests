import { test, Page, PlaywrightWorkerOptions, Browser, expect } from "@playwright/test";
import confirmEmail from "./confirmEmail";
import config from "./../index.config"
import { Link } from "mailosaur/lib/models";
import Mailosaur from "mailosaur";
import { version } from "os";

export const DEFAULT_PLATFORM = "cyan"
export var openloginversion= process.env.APPVERSION || 'v3';
const env_map: { [key: string]: string } = {

  prod: "https://app.openlogin.com",
  beta: "https://beta.openlogin.com",
  cyan: "https://cyan.openlogin.com",
  testing: "https://testing.openlogin.com",
  celeste: "https://celeste.openlogin.com",
  local: "http://localhost:3000"
};

function useAutoCancelShareTransfer(page: Page): () => Promise<void> {
  let stopped = false;
  const promise = new Promise<void>(async (resolve) => {
    while (!stopped) {
      try {
        if (await page.isVisible("text=New login detected")) {
          await page.click('button:has-text("Cancel")', { force: true });
        }
      } catch { }
    }
    resolve();
  });

  return async () => {
    stopped = true;
    await promise;
  };
}

async function waitForTkeyRehydration(
  page: Page,
  size = 100
): Promise<boolean> {
  return new Promise(function (resolve) {
    page.on("console", (msg) => {
      console.log(msg)
      //will check on the implementation,currently rehydrating tkey: 914.059814453125 ms is only displayed 
      // 120 state will change if the openlogin default state changes.
      // need better way to rehydrate or find if the object is empty
      if (msg.text().includes("e2e:tests:tkeyjson")) {
        let text = msg.text();
        let length = parseInt(text.split("e2e:tests:tkeyjson:")[1]);
        if (length > size) resolve(true);
      }
    });
  });
}

async function waitForAddPassword(page: Page): Promise<boolean> {
  return new Promise(function (resolve) {
    page.on("console", (msg) => {
      if (
        msg.type() === "info" &&
        msg.text() === "e2e:tests:addPasswordCompleted"
      ) {
        resolve(true);
      }
    });
  });
}

async function waitForSessionStorage(page: Page, openloginURL: string) {
  const sessionStorage: any = await page.evaluate(() => sessionStorage);
  let shares = JSON.parse(sessionStorage.tKeyModule).tKeyModule.tKey.shares;
  let noShare = Object.keys(shares).length;
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
  return;
}

async function waitForChangePassword(page: Page): Promise<boolean> {
  return new Promise(function (resolve) {
    page.on("console", (msg) => {
      if (
        msg.type() === "info" &&
        msg.text().includes("e2e:tests:changePasswordCompleted")
      ) {
        resolve(true);
      }
    });
  });
}

async function waitForDeleteShare(page: Page): Promise<boolean> {
  return new Promise(function (resolve) {
    page.on("console", (msg) => {
      if (
        msg.type() === "info" &&
        msg.text().includes("e2e:tests:deleteShareCompleted")
      ) {
        resolve(true);
      }
    });
  });
}

function useAutoCancel2FASetup(page: Page): () => Promise<void> {
  let stopped = false;
  const promise = new Promise<void>(async (resolve) => {
    while (!stopped) {
      try {
        if (await page.isVisible("text=secure your account"))
          await page.click('button:has-text("Maybe next time")');
      } catch { }
    }
    resolve();
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
      return true
    }
  } catch {
  }
  try {
    if (
      await page.isVisible(
        "text=Unable to detect login share from the Auth Network"
      )
    ) {
      console.log(
        "Error: Test failed to detect login share from the Auth Network"
      );
      return true
    }
  } catch {
  }
  try {
    if (
      await page.isVisible(
        "text=Unable to connect to Auth Network. The Network may be congested."
      )
    ) {
      console.log(
        "Error: Test failed to connect to Auth Network. The Network may be congested."
      );
      return true
    }
  } catch {
  }
}

function catchError(page: Page): () => Promise<void> {
  let stopped = false;
  const promise = new Promise<void>(async (resolve) => {
    while (!stopped) {
      try {
        if (await page.isVisible("text=Too many requests"))
          console.log("Error: Test failed due to too many requests");
      } catch {
        return true
      }
      try {
        if (
          await page.isVisible(
            "text=Unable to detect login share from the Auth Network"
          )
        )
          console.log(
            "Error: Test failed to detect login share from the Auth Network"
          );
      } catch {
        return true
      }
      try {
        if (
          await page.isVisible(
            "text=Unable to connect to Auth Network. The Network may be congested."
          )
        )
          console.log(
            "Error: Test failed to connect to Auth Network. The Network may be congested."
          );
      } catch {
        return true
      }
    }
    resolve();
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
  }
}): Promise<boolean> {
  try {
    await page.waitForURL("https://accounts.google.com/**");
    await page.waitForSelector('input[type="Email"]')
    expect(await page.isVisible('input[type="Email"]'))
    await page.fill('input[type="Email"]', google.email);
    expect(await page.isVisible('button:has-text("Next")'))
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
  }
}): Promise<boolean> {
  try {

    await page.goto("https://github.com/login");
    await page.waitForSelector("text=Sign in");
    await page.isVisible("text=Sign in");

    await page.fill('input[autocomplete="username"]', github.email);

    await page.fill('input[autocomplete="current-password"]', github.password);

    await page.click('input[value="Sign in"]');

    await page.waitForSelector("text=Create repository");
    expect(page.isVisible("text=Create repository"));
    return true;
  } catch {
    return false;
  }
}

async function signInWithTwitter({
  page,
  twitter,
  openloginURL
}: {
  page: Page;
  twitter: {
    account: string;
    email: string;
    password: string;
  },
  openloginURL: string;
}): Promise<void> {
  await page.goto(openloginURL);
  await page.click('button:has-text("Get Started")');
  await page.click("[aria-label='login with twitter']");
  await page.waitForURL("https://api.twitter.com/oauth/**");
  const appName = process.env.PLATFORM === "testing" ? "torus-test-auth0" : "Web3Auth"
  await page.waitForSelector(`h2:text("Authorize ${appName} to access your account?")`);
  await page.click(`input:has-text("Sign in")`);
  // Only for the first time users, they have to click on authorize web3Auth app
  try {
    // smaller timeout, we don't want to wait here for longer
    const ele = await page.waitForSelector(`input:has-text("Authorize app")`, {
      timeout: 1000
    })
    await page.click(`input:has-text("Authorize app")`)
  } catch {
  }

  await page.waitForSelector('text="Sign in to Twitter"');
  await page.fill('input[autocomplete="username"]', twitter.account);
  await page.click(`div[role="button"] span:has-text("Next")`);
  await page.fill('input[type="password"]', twitter.password);

  // Login tests are slow tests, >1 min is consumed in the redirection loop from the social provider to finally reach wallet/home. Hence the max test timeout.
  // FLOW: social-redirections => [host]/auth(SLOW) => [host]/register(SLOW) => [host]/wallet/home
  await slowOperation(async () => {
    await page.click(`div[role="button"] span:has-text("Log in")`)
    try {
      // smaller timeout, we don't want to wait here for longer
      await page.waitForSelector('text="Help us keep your account safe."', {
        timeout: 1000
      })
      await page.fill('input[autocomplete="email"]', twitter.email);
      await page.click(`div[role="button"] span:has-text("Next")`);
    } catch (err) {
    }
    try {
      await page.waitForSelector('input#allow', {
        timeout: 1000
      })
      await page.click('input#allow')
    } catch {
    }
    await useAutoCancelShareTransfer(page)
    await useAutoCancel2FASetup(page)
    await page.waitForURL(`${openloginURL}/wallet/home`)
  }, 3 * 60 * 1000)
}

export async function slowOperation(op: () => Promise<any>, timeout?: number) {
  // Set slow timeout
  test.setTimeout(timeout || 2 * 60 * 1000) // => 2 mins timeout
  await op()
  // Reset timeout
  test.setTimeout(config.timeout || 0)
}

async function signInWithFacebook({
  page,
  FB,
  openloginURL
}: {
  page: Page;
  FB: {
    email: string;
    password: string;
    name: string;
    firstName: string;
  };
  openloginURL: string
}): Promise<void> {
  await page.goto(openloginURL);
  await page.click('button:has-text("Get Started")');
  await page.click('[aria-label="login with facebook"]');

  await page.waitForURL("https://www.facebook.com/**");
  await page.isVisible("text=Log in")
  await page.fill(
    '[placeholder="Email address or phone number"]',
    FB.email
  )
  await page.fill('[placeholder="Password"]', FB.password)
  await page.click(`button:has-text("Login"), [name="login"]`)
  await slowOperation(async () => {
    await page.click(
      `button:has-text("Continue"), [aria-label="Continue"], [aria-label="Continue as ${FB.firstName}"]`
    )
    await useAutoCancelShareTransfer(page);
    await useAutoCancel2FASetup(page);
    await page.waitForURL(`${openloginURL}/wallet/home`)
  }, 3 * 60 * 1000)
}

async function signInWithDiscord({ page, discord }: {
  page: Page, discord: {
    email: string,
    password: string
  }
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
  var isDeleted = false;
  try {
    await page.click('button:has-text("Remove share")');
    if (
      await page.locator("text=Device share deletion unsuccessful").isVisible()
    ) {
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
  var deviceShares = page.locator('[aria-label="delete device share"]');
  var countShares = await deviceShares.count();
  while (countShares > 0) {
    x = waitForDeleteShare(page);
    await deviceShares.first().click();
    let isDeleted = await ensureDeviceShareDeleted(page);
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

  let y = waitForAddPassword(page);
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

  let y = waitForChangePassword(page);
  await page.click('button:has-text("Confirm")');
  await page.isVisible('button:has-text("Change password")');
  await page.locator("text=Password successfully changed").isVisible();
  await y;
}

function findLink(links: Link[], text: string) {
  for (const link of links) {
    if (link.text === text) return link;
  }
 
  return null;
}

async function signInWithEmail(
  page: Page,
  email: string,
  browser: Browser
): Promise<boolean> {
  try {
    await page.click('button:has-text("Get Started")');
    await page.fill('[placeholder="Email"]', email);
    await page.click('button:has-text("Continue with Email")');
    // await page.waitForSelector("text=email has been sent");
    const mailosaur = new Mailosaur(process.env.MAILOSAUR_API_KEY || "");
    const mailBox = await mailosaur.messages.get(
      process.env.MAILOSAUR_SERVER_ID || "",
      {
        sentTo: email,
      }
    );
    let link = findLink(mailBox.html?.links || [], "Approve login request");
    if (!link) {
      link = findLink(mailBox.html?.links || [], "Verify my email");
    }
    await mailosaur.messages.del(mailBox?.id || "");
    const href = link?.href || "";

    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await page2.goto(href);
    await page2.waitForSelector(
      "text=Close this and return to your previous window",
      {
        timeout: 10000,
      }
    );
    await page2.close();
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}

function generateRandomEmail() {
  return `hello+apps+${Date.now()}@${process.env.MAILOSAUR_SERVER_DOMAIN}`;
}

export {
  useAutoCancelShareTransfer,
  useAutoCancel2FASetup,
  signInWithGoogle,
  signInWithTwitter,
  signInWithFacebook,
  signInWithDiscord,
  confirmEmail,
  findLink,
  signInWithEmail,
  generateRandomEmail,
  deleteCurrentDeviceShare,
  waitForTkeyRehydration,
  addPasswordShare,
  changePasswordShare,
  catchError,
  catchErrorAndExit,
  waitForSessionStorage,
  signInWithGitHub,
  env_map,
};
