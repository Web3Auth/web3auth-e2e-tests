import { expect, Page, test } from "@playwright/test";
import Mailosaur from "mailosaur";

import { AccountsPage } from "../account-page/AccountsPage";
import { useAutoCancel2FASetup ,
  DEFAULT_PLATFORM,
  env_map,
  generateRandomEmail,
  signInWithMobileNumber,
,
  signInWithEmailIntoTorusWallet,
  useAutoCancelShareTransfer} from "../utils";
const torusLoginURL = env_map.torusV2;
const user = {
  mobileNumberForLogin: process.env.LOGIN_MOBILE_NUMBER || "",
  mobileNumberForSMS: process.env.SMS_MOBILE_NUMBER || "",
};
const testEmail = generateRandomEmail();

test("Login into torus wallet v2 using passwordless login", async ({ page, browser }) => {
  test.slow();
  const accountsPage = new AccountsPage(page);
  // Listen for all console events and handle errors
  page.on("console", (msg) => {
    if (msg.type() === "error") console.log(`Error text: "${msg.text()}"`);
  });
  await page.goto(torusLoginURL);
  await signInWithEmailIntoTorusWallet(page, testEmail, browser);
  await useAutoCancel2FASetup(page);
  await page.waitForURL(`**/wallet/home`, {
    waitUntil: "load",
  });
  await accountsPage.clickTorusLogout(testEmail);
  expect(page.url()).toContain(`${torusLoginURL}/`);
});
