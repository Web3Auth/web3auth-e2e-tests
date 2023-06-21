import { test, expect , Page} from '@playwright/test';
import { DEFAULT_PLATFORM, env_map } from "../utils/index";
import { signInWithMobileNumber, useAutoCancel2FASetup } from "../utils";
import { useAutoCancelShareTransfer } from "../utils/index";
import { AccountsPage } from '../account-page/AccountsPage';

const openloginURL = env_map[process.env.PLATFORM || "prod"];
const user = {
  mobileNumberForLogin: process.env.LOGIN_MOBILE_NUMBER || "",
  mobileNumberForSMS: process.env.SMS_MOBILE_NUMBER || "",
};

test("Login with mobile number using passwordless login @smoke", async ({ page, browser }) => {
  test.slow()
  const accountsPage = new AccountsPage(page);
  // Listen for all console events and handle errors
  page.on('console', msg => {
  if (msg.type() === 'error')
    console.log(`Error text: "${msg.text()}"`);
  });
  await page.goto(openloginURL);
  await page.fill('#passwordless-email', user.mobileNumberForLogin);
  await page.getByLabel('Connect with Phone or Email').click();
  await signInWithMobileNumber({ page, user, browser })
  await useAutoCancel2FASetup(page);
  await page.waitForURL(`${openloginURL}/wallet/home`, {
    waitUntil: "load",
  });
  await accountsPage.clickLogout();
  expect(page.url()).toContain(`${openloginURL}/`);
});
