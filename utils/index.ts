import test, { expect, Page, PlaywrightWorkerOptions } from "@playwright/test";
import confirmEmail from "./confirmEmail";
import config from "./../index.config"

export const DEFAULT_PLATFORM = "cyan"

const env_map: { [key: string]: string } = {
  "prod": "https://app.openlogin.com",
  "beta": "https://beta.openlogin.com",
  "cyan": "https://cyan.openlogin.com",
};

function useAutoCancelShareTransfer(page: Page): () => Promise<void> {
  let stopped = false;
  const promise = new Promise<void>(async (resolve) => {
    while (!stopped) {
      try {
        if (await page.isVisible("text=New login detected"))
          await page.click('button:has-text("Cancel")', { force: true });
      } catch { }
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
          await page.click('button:has-text("Maybe next time")', {
            force: true,
          });
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
    await page.isVisible("text=Sign in");
    await page.fill('[aria-label="Email or phone"]', google.email);
    await page.click(`button:has-text("Next")`);
    await page.fill('[aria-label="Enter your password"]', google.password);
    await page.click(`button:has-text("Next")`);
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
    email: string;
    password: string;
  },
  openloginURL: string;
}): Promise<void> {
  await page.goto(openloginURL);
  await page.click('button:has-text("Get Started")');
  await page.click("[aria-label='login with twitter']");

  await page.waitForURL("https://api.twitter.com/oauth/**");
  await page.waitForSelector('h2:text("Authorize Web3Auth to access your account")');
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
  await page.fill('input[autocomplete="username"]', twitter.email);
  await page.click(`div[role="button"] span:has-text("Next")`);
  await page.fill('input[type="password"]', twitter.password);
  // Login tests are slow tests, >1 min is consumed in the redirection loop from the social provider to finally reach wallet/home. Hence the max test timeout.
  // FLOW: social-redirections => [host]/auth(SLOW) => [host]/register(SLOW) => [host]/wallet/home
  await slowOperation(async () => {
    await page.click(`div[role="button"] span:has-text("Log in")`)
    await useAutoCancelShareTransfer(page)
    await useAutoCancel2FASetup(page)
    await page.waitForURL(`${openloginURL}/wallet/home`)
  })
}

async function slowOperation(op: () => Promise<any>, timeout?: number) {
  // Set slow timeout
  test.setTimeout(timeout || 2 * 60 * 1000) // => 2 mins timeout
  await op()
  // Reset timeout
  test.setTimeout(config.timeout || 0)
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

async function signInWithDiscord({ page, discord }: {
  page: Page, discord: {
    email: string,
    password: string
  }
}): Promise<boolean> {
  // try {
  //   await page.waitForURL("https://accounts.google.com/**");
  //   await page.isVisible("text=Sign in");
  //   await page.fill('[aria-label="Email or phone"]', google.email);
  //   await page.click(`button:has-text("Next")`);
  //   await page.fill('[aria-label="Enter your password"]', google.password);
  //   await page.click(`button:has-text("Next")`);
  //   return true;
  // } catch {
  //   return false;
  // }
  // try {
  await page.waitForURL("https://discord.com/oauth2/**");
  await page.isVisible("text=Welcome back!");
  await page.fill('[name="email"]', discord.email);
  await page.fill('[name="password"]', discord.password);
  await page.click(`button:has-text("Log In")`);
  return true;
  // } catch {
  //   return false;
  // }
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

export {
  useAutoCancelShareTransfer,
  useAutoCancel2FASetup,
  signInWithGoogle,
  signInWithTwitter,
  signInWithFacebook,
  signInWithDiscord,
  confirmEmail,
  deleteCurrentDeviceShare,
  env_map,
};
