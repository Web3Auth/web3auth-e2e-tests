import { Page, PlaywrightWorkerOptions, Browser } from "@playwright/test";
import confirmEmail from "./confirmEmail";
import { Link } from "mailosaur/lib/models";
import Mailosaur from "mailosaur";

const env_map: { [key: string]: string } = {
  prod: "https://app.openlogin.com",
  beta: "https://beta.openlogin.com",
  cyan: "https://cyan.openlogin.com",
  local: "http://localhost:3000",
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

async function waitForTkeyRehydration(page: Page, size = 100): Promise<boolean> {
  return new Promise(function (resolve) {
    page.on('console', (msg) => {
      // 120 state will change if the openlogin default state changes.
      // need better way to rehydrate or find if the object is empty
      if (msg.type() === 'info' && msg.text().includes("e2e:tests:tkeyjson")) {
        let text = msg.text();
        let length = parseInt(text.split("e2e:tests:tkeyjson:")[1]);
        if (length > size) resolve(true);
      }
    });
  });
}

async function waitForAddPassword(page: Page): Promise<boolean> {
  return new Promise(function (resolve) {
    page.on('console', (msg) => {
      if (msg.type() === 'info' && msg.text() === "e2e:tests:addPasswordCompleted") {
        resolve(true);
      }
    });
  });
}

async function waitForChangePassword(page: Page): Promise<boolean> {
  return new Promise(function (resolve) {
    page.on('console', (msg) => {
      if (msg.type() === 'info' && msg.text().includes("e2e:tests:changePasswordCompleted")) {
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

async function signInWithGoogle({
  page,
  browserName,
  email,
}: {
  page: Page;
  browserName: PlaywrightWorkerOptions["browserName"];
  email: string;
}): Promise<boolean> {
  try {
    await page.waitForURL("https://accounts.google.com/**");
    await page.click(`text=${email}`);
    if (browserName === "chromium") {
      // On Chromium, Google sometimes re-ask for user's consent
      if (
        page
          .url()
          .startsWith("https://accounts.google.com/signin/oauth/legacy/consent")
      )
        await page.click('button:has-text("Allow")');
    }
    if (browserName === "webkit")
      // Workaround wait for URL issue on Safari
      while (page.url().startsWith("https://accounts.google.com"))
        await page.waitForTimeout(100);
    return true;
  } catch {
    return false;
  }
}

async function signInWithFacebook({
  page,
  FB,
}: {
  page: Page;
  FB: {
    email: string;
    password: string;
    name: string;
    firstName: string;
  };
}): Promise<boolean> {
  try {
    await page.waitForURL("https://www.facebook.com/**");
    await Promise.all([
      // await page.waitForNavigation({
      //   waitUntil: "load",
      // }),
      await page.isVisible("text=Log in"),
      await page.fill(
        '[placeholder="Email address or phone number"]',
        FB.email
      ),
      await page.fill('[placeholder="Password"]', FB.password),
      await page.click(`button:has-text("Login"), [name="login"]`),
      page.click(
        `button:has-text("Continue"), [aria-label="Continue"], [aria-label="Continue as ${FB.firstName}"]`
      ),
    ]);
    return true;
  } catch {
    return false;
  }
}

async function signInWithDiscord(page: Page): Promise<boolean> {
  try {
    await page.waitForURL("https://discord.com/oauth2/**");
    await Promise.all([
      page.waitForNavigation(),
      page.click('button:has-text("Authorise"), button:has-text("Authorize")'),
    ]);
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
    x = page.waitForResponse(
      (resp) =>
        resp.url().includes("/metadata.tor.us/releaseLock") &&
        resp.status() === 200
    );
    await deviceShares.first().click();
    let isDeleted = await ensureDeviceShareDeleted(page);
    if (isDeleted) {
      countShares = countShares - 1;
    } else {
      deviceShares = page.locator('[aria-label="delete device share"]');
      countShares = await deviceShares.count();
    }
  }
  await x;
}

async function addPasswordShare(page: Page, password: string) {
  // wait for password to be visible
  await page.isVisible("input[name='openlogin-password']");
  await page.isVisible("input[name='openlogin-confirm-password']");

  await page.locator("input[name='openlogin-password']").fill(password);
  await page.locator("input[name='openlogin-confirm-password']").fill(password);

  // let x = page.waitForResponse(
  //   (resp) =>
  //     resp.url().includes("/metadata.tor.us/releaseLock") &&
  //     resp.status() === 200
  // );
  let y = waitForAddPassword(page);
  await page.click('button:has-text("Confirm")');
  // await x;

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
  // let x = page.waitForResponse(
  //   (resp) =>
  //     resp.url().includes("/metadata.tor.us/releaseLock") &&
  //     resp.status() === 200
  // );
  let y = waitForChangePassword(page);
  await page.click('button:has-text("Confirm")');
  // await x;
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
    await page.waitForSelector("text=email has been sent");
    const mailosaur = new Mailosaur(process.env.MAILOSAUR_API_KEY || "");
    const mailBox = await mailosaur.messages.get(
      process.env.MAILOSAUR_SERVER_ID || "",
      {
        sentTo: email,
      }
    );
    let link = findLink(mailBox.html?.links || [], "Confirm my email");
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
  } catch {
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
  env_map,
};
