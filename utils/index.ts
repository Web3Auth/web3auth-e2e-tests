import {
  Page,
  PlaywrightWorkerOptions,
  Browser,
  expect,
} from "@playwright/test";
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

function useAutoCancel2FASetup(page: Page): () => Promise<void> {
  let stopped = false;
  const promise = new Promise<void>(async (resolve) => {
    while (!stopped) {
      try {
        if (await page.isVisible("text=secure your account"))
          await page.click('button:has-text("Maybe next time")');
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

async function deleteDeviceShare(page: Page) {
  await page.click(`button[aria-label='delete device share']`);
  await Promise.all([
    expect(page.isVisible("text=No device shares found")).toBeTruthy(),
    page.waitForResponse(
      (resp) =>
        resp.url().includes("/metadata.tor.us/releaseLock") &&
        resp.status() === 200
    ),
    page.click('button:has-text("Remove Share")'),
  ]);
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
    await mailosaur.messages.del(mailBox.id || ""); // Deleting emails in email server.
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
  deleteDeviceShare,
  findLink,
  signInWithEmail,
  generateRandomEmail,
  env_map,
};
