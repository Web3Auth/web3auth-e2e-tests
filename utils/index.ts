import { Page, PlaywrightWorkerOptions } from "@playwright/test";
import confirmEmail from "./confirmEmail";

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
    console.log("clicking remove share button");
    await page.click('button:has-text("Remove share")');
    if (
      await page.locator("text=Device share deletion unsuccessful").isVisible()
    ) {
      console.log("got unsuccessfull message, reloading");
      await page.reload();
    } else {
      try {
        console.log("no error, verifying success message");
        await page.waitForSelector("text=Device share successfully deleted");
        console.log("successfull deleted");
        isDeleted = true;
      } catch {}
    }
  } catch {
    console.log("timeout, closing, reloading");
    await page.click('[aria-label="Close Delete Share Dialog"]');
    await page.reload();
  }
  return isDeleted;
}

async function deleteCurrentDeviceShare(page: Page) {
  // :right-of(:text("current"))
  // while (page.locator('[aria-label="delete device share"]:right-of(:text("current"))').isVisible()) {
  //   console.log("device share found");
  //   await Promise.all([
  //     page.click('[aria-label="delete device share"]'),
  //     page.click('button:has-text("Remove share")'),
  //     page.waitForSelector("text=Device share successfully deleted"),
  //   ]);
  // }
  // const deviceShares = page.locator('[aria-label="delete device share"]');
  // const deviceSharesHandles = await deviceShares.elementHandles();
  // await Promise.all(
  //   deviceSharesHandles.map(async function ensureDeviceShareDeleted(element) {
  //     console.log("device share found");
  //     await element.click();
  //     await page.click('button:has-text("Remove share")');
  //     await page.waitForSelector("text=Device share successfully deleted");
  //     console.log("Deleted!");
  //   })
  // );
  // while (
  //   page
  //     .locator('[aria-label="delete device share"]:right-of(:text("current"))')
  //     .isVisible()
  // ) {
  //   console.log("Device found");
  //   try {
  //     await Promise.all([
  //       page.click(
  //         '[aria-label="delete device share"]:right-of(:text("current"))'
  //       ),
  //       page.click('button:has-text("Remove share")'),
  //       page.waitForSelector("text=Device share successfully deleted"),
  //     ]);
  //   } catch {}
  // }
  var deviceShares = page.locator('[aria-label="delete device share"]');
  var countShares = await deviceShares.count();
  console.log(`TOTAL count : ${countShares}`);
  //await Promise.all
  while (countShares > 0) {
    // await Promise.all([
    await deviceShares.first().click();
    let isDeleted = await ensureDeviceShareDeleted(page);
    // ]);
    if (isDeleted) {
      console.log("Share deleted success fully");
      countShares = countShares - 1;
    } else {
      deviceShares = page.locator('[aria-label="delete device share"]');
      countShares = await deviceShares.count();
    }
  }
}

export {
  useAutoCancelShareTransfer,
  signInWithGoogle,
  signInWithFacebook,
  signInWithDiscord,
  confirmEmail,
  deleteCurrentDeviceShare,
};
