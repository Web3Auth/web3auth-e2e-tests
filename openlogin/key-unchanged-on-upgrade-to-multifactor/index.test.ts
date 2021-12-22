const { expect } = require('@playwright/test');
import { confirmEmail } from "../../index.utils";
import { test } from "./index.lib";

test('user key remains unchanged upon upgrade from 1/1 to 2/n', async ({
  context,
  page,
  openloginURL,
  user
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
    !(await confirmEmail({
      context,
      timestamp,
      resend: () => page.click("text=Resend"),
    }))
  );

  // Should be signed in in <2 minutes
  await page.waitForURL(`${openloginURL}/wallet/home`, {
    timeout: 2 * 60 * 1000,
  });

  let tKeyModuleObj = await page.evaluate(() => {
    return JSON.parse(sessionStorage.getItem('tKeyModule'))
  })
  expect(tKeyModuleObj.tKeyModule.keyMode).toEqual('1/1')

  // Go to Account page
  await Promise.all([page.waitForNavigation(), page.click("text=Account")]);
  expect(await page.isVisible(`text=${user.email}`)).toBeTruthy();

  // Click Enable 2FA
  await Promise.all([
    page.waitForNavigation(),
    page.click('button:has-text("Enable 2FA")')
  ]);

  // Click user acknowledgement checkbox
  await page.click('.v-input--selection-controls__ripple');
  // Click button:has-text("Save current device")
  page.click('button:has-text("Save current device")')

  page.click('button:has-text("View advanced option")')

  // click button to copy backupPhrase and continue
  await page.click('.setup_recovery-box');
  await page.click('button:has-text("Continue")');

  // paste backup phrase from clipboard
  const backupPhrase = await page.evaluate(
    () => navigator.clipboard.readText()
  )
  await page.fill('textarea', backupPhrase);
  await page.click('button:has-text("Verify")');

  // Click button:has-text("Done")
  await Promise.all([
    page.waitForNavigation(/*{ url: 'https://app.openlogin.com/wallet/home' }*/),
    page.click('button:has-text("Done")')
  ])

  tKeyModuleObj = await page.evaluate(() => {
    return JSON.parse(sessionStorage.getItem('tKeyModule'))
  })
  expect(tKeyModuleObj.tKeyModule.keyMode).toEqual('2/n')

  // Go to Account page
  await Promise.all([page.waitForNavigation(), page.click("text=Account")]);
  expect(await page.isVisible(`text=${user.email}`)).toBeTruthy();

  // Logout
  await Promise.all([page.waitForNavigation(), page.click("text=Logout")]);
  expect(page.url()).toBe(`${openloginURL}/`);
});
