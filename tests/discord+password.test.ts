import { expect } from "@playwright/test";
import { test } from "../base";
import { signInWithDiscord, useAutoCancelShareTransfer } from "../utils";

test("Login with Discord+Password, Cancel share transfer request(s), Delete device share(s), Logout", async ({
  page,
  openloginURL,
  user,
}) => {
  if (openloginURL !== "https://app.openlogin.com") return test.skip();
  if (!user.discord || !user.openlogin) return test.skip();

  // Login with Google
  await page.goto(openloginURL);
  await page.click('button:has-text("Get Started")');
  await page.click(".row div:nth-child(3) .app-btn"); // TODO: Select using aria-label
  await signInWithDiscord(page);

  // Enter password
  await page.waitForURL(`${openloginURL}/tkey-input#**`);
  await page.fill('[placeholder="Account password"]', user.openlogin.password);
  await page.click('button:has-text("Confirm")');

  // Should be signed in in <2 minutes
  await page.waitForURL(`${openloginURL}/wallet/home`, {
    timeout: 2 * 60 * 1000,
  });

  // Start cancelling share transfer request(s) (if any)
  const stopCancellingShareTransfer = useAutoCancelShareTransfer(page);

  // Go to Account page
  await Promise.all([page.waitForNavigation(), page.click("text=Account")]);
  expect(await page.innerText(`text=${user.discord.email}`)).toBe(
    user.discord.email
  );

  // Delete all device shares
  while (
    await page.isVisible(
      // TODO: Select using aria-label
      '.info-box:has(:text("Desktop")):below(:text("Device(s)"))'
    )
  ) {
    await page.click(
      // TODO: Select using aria-label
      '.info-box:has(:text("Desktop")):below(:text("Device(s)")) >> :nth-match(button, 2)'
    );

    // Should have either succeed or fail in <2 minutes
    // TODO: Select using aria-label
    await page.waitForSelector(".system-bar-container", {
      timeout: 2 * 60 * 1000,
    });
    await page.click(".system-bar-container >> button");
  }

  // Logout
  await Promise.all([page.waitForNavigation(), page.click("text=Logout")]);
  expect(page.url()).toBe(`${openloginURL}/`);

  // Teardown
  await stopCancellingShareTransfer();
});
