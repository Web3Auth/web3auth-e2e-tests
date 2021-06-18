import { expect } from "@playwright/test";
import { test } from "../base";

test("Login with Passwordless, Logout", async ({
  context,
  page,
  openloginURL,
  user,
}) => {
  if (!user.passwordless) return test.skip();

  // Delete all current emails
  const gmailPage = await context.newPage();
  await gmailPage.goto("https://mail.google.com/mail/u/0/#inbox");
  await gmailPage.click("[aria-label=Select]");
  if (await gmailPage.isVisible("[aria-label=Delete]"))
    await gmailPage.click("[aria-label=Delete]");

  // Login with Passwordless
  await page.goto(openloginURL);
  await page.click('button:has-text("Get Started")');

  // Enter email
  await page.fill('[placeholder="Email"]', user.passwordless.gmail);
  await page.click('button:has-text("Continue with Email")');
  await page.waitForSelector("text=email has been sent");
  expect(await page.isVisible(`text=${user.passwordless.gmail}`)).toBeTruthy();

  // Confirm email
  while (
    // Wait until having received new Torus email
    !(await gmailPage.isVisible(
      'tr:has-text("unread, Torus, Verify your email")'
    ))
  )
    await gmailPage.click("[aria-label=Refresh]");
  await gmailPage.click('tr:has-text("unread, Torus, Verify your email")');
  const [confirmationPage] = await Promise.all([
    gmailPage.waitForEvent("popup"),
    gmailPage.click('a:has-text("Confirm my email")'),
  ]);
  await confirmationPage.waitForSelector("text=Done");

  // Should be signed in in <1 minutes
  await page.waitForURL(`${openloginURL}/wallet/home`, {
    timeout: 60 * 1000,
  });

  // Go to Account page
  await Promise.all([page.waitForNavigation(), page.click("text=Account")]);
  expect(await page.innerText(`text=${user.passwordless.gmail}`)).toBe(
    user.passwordless.gmail
  );

  // Logout
  await Promise.all([page.waitForNavigation(), page.click("text=Logout")]);
  expect(page.url()).toBe(`${openloginURL}/`);
});
