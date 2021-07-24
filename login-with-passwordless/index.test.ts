import { BrowserContext, expect } from "@playwright/test";
import { test } from "./index.lib";

async function confirmEmail({
  context,
  timestamp,
  resend,
}: {
  context: BrowserContext;
  timestamp: number;
  resend: () => Promise<void>;
}) {
  const page = await context.newPage();
  try {
    await page.goto(
      `https://mail.google.com/mail/u/0/#advanced-search/is_unread=true&query=from%3Atorus+subject%3A(verify+your+email)+after%3A${timestamp}&isrefinement=true`
    );

    const maxReloads = 20;
    let reloads = 0;
    while (reloads < maxReloads) {
      try {
        reloads++;
        await page.click('div[role="link"] >> text=Verify your email', {
          timeout: 2000,
        });
        break;
      } catch {
        if (reloads % 5 === 0) await resend();
        await page.reload();
      }
    }
    if (reloads >= maxReloads) return false;

    const [popup] = await Promise.all([
      page.waitForEvent("popup"),
      page.click('a:has-text("Confirm my email")'),
    ]);
    await popup.waitForSelector("text=Done");
    await popup.close();

    return true;
  } catch {
    return false;
  } finally {
    await page.close();
  }
}

test("Login with Passwordless+Device", async ({
  context,
  page,
  openloginURL,
  user,
}) => {
  await page.goto(openloginURL);
  await page.click('button:has-text("Get Started")');

  // Login with Passwordless
  const timestamp = Math.floor(Date.now() / 1000);
  await page.fill('[placeholder="Email"]', user.email);
  await page.click('button:has-text("Continue with Email")');
  await page.waitForSelector("text=email has been sent");
  expect(await page.isVisible(`text=${user.email}`)).toBeTruthy();

  // Confirm email
  test.fixme(
    await confirmEmail({
      context,
      timestamp,
      resend: () => page.click("text=Resend"),
    })
  );

  // Should be signed in in <2 minutes
  await page.waitForURL(`${openloginURL}/wallet/home`, {
    timeout: 2 * 60 * 1000,
  });

  // Go to Account page
  await Promise.all([page.waitForNavigation(), page.click("text=Account")]);
  expect(await page.isVisible(`text=${user.email}`)).toBeTruthy();

  // Logout
  await Promise.all([page.waitForNavigation(), page.click("text=Logout")]);
  expect(page.url()).toBe(`${openloginURL}/`);
});
