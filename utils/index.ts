import { Page, PlaywrightWorkerOptions } from "@playwright/test";
import { confirmEmail } from "./confirmEmail";
import * as fs from "fs";

function useAutoCancelShareTransfer(page: Page): () => Promise<void> {
  let stopped = false;
  const promise = new Promise<void>(async (resolve) => {
    while (!stopped) {
      try {
        if (await page.isVisible("text=New login detected"))
          await page.click('button:has-text("Cancel")', { force: true });
      } catch {}
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
  name,
}: {
  page: Page;
  name: string;
}): Promise<boolean> {
  try {
    await page.waitForURL("https://www.facebook.com/**");
    await Promise.all([
      page.waitForNavigation(),
      page.click(
        `button:has-text("Continue"), [aria-label="Continue"], [aria-label="Continue as ${name}"]`
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
      page.click('button:has-text("Authorize")'),
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

async function deleteCurrentDeviceShare(page: Page) {
  var deviceShares = page.locator('[aria-label="delete device share"]');
  var countShares = await deviceShares.count();
  while (countShares > 0) {
    await deviceShares.first().click();
    let isDeleted = await ensureDeviceShareDeleted(page);
    if (isDeleted) {
      countShares = countShares - 1;
    } else {
      deviceShares = page.locator('[aria-label="delete device share"]');
      countShares = await deviceShares.count();
    }
  }
}

const env_map = {
  PROD: "https://app.openlogin.com",
  STAGING: "https://beta.openlogin.com",
};

function randomString(length: number) {
  var chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  var result = "";
  for (var i = length; i > 0; --i)
    result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

function randomNumber() {
  return Math.floor(Math.random() * 10);
}

async function setup2FA(page: Page, flow: string) {
  if (flow == "Login") {
    await page.click('button:has-text("Set up 2FA")');
    await page.click(".v-input--selection-controls__ripple");
    await page.click('button:has-text("Continue")');
  } else {
    var isNextTimeClicked = false;
    while (!isNextTimeClicked) {
      try {
        page.click('button:has-text("Maybe next time")', {
          timeout: 10 * 1000,
        });
        isNextTimeClicked = true;
      } catch {
        page.reload();
      }
    }
    await Promise.all([
      page.waitForNavigation(/*{ url: 'https://app.openlogin.com/wallet/account' }*/),
      page.click('div[role="list"] >> :nth-match(div:has-text("Account"), 2)'),
    ]);
    await Promise.all([
      page.waitForNavigation(/*{ url: 'https://app.openlogin.com/register#upgrading=true' }*/),
      page.click('button:has-text("Enable 2FA")'),
    ]);
    await page.click(".v-input--selection-controls__ripple");
    await page.click('button:has-text("Save current device")');
  }
  await page.click('button:has-text("View advanced option")', {
    timeout: 10 * 1000,
  });
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.click('button:has-text("Download my recovery phrase")'),
  ]);

  const shareFile = await download.path();
  const backupPhrase = fs.readFileSync(shareFile, "utf8");
  if (flow == "Login") {
    await page.click(':nth-match(button:has-text("Continue"), 2)');
  } else {
    await page.click('button:has-text("Continue")');
  }

  if (backupPhrase) {
    await page.fill("textarea", backupPhrase);
    await page.click('button:has-text("Verify")');
    await Promise.all([
      page.waitForNavigation(/*{ url: 'https://app.openlogin.com/wallet/home' }*/),
      page.click('button:has-text("Done")'),
    ]);
    return true;
  } else {
    return false;
  }
}

export {
  useAutoCancelShareTransfer,
  signInWithGoogle,
  signInWithFacebook,
  signInWithDiscord,
  confirmEmail,
  deleteCurrentDeviceShare,
  env_map,
  randomString,
  setup2FA,
  randomNumber,
};
