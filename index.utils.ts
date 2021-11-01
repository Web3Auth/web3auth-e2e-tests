import { Page, PlaywrightWorkerOptions } from "@playwright/test";

export function useAutoCancelShareTransfer(page: Page): () => Promise<void> {
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

export async function signInWithGoogle({
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

export async function signInWithFacebook({
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

export async function signInWithDiscord(page: Page): Promise<boolean> {
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
