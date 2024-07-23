import { expect, test } from "@playwright/test";

import { AccountsPage } from "../account-page/AccountsPage";
import { useAutoCancel2FASetup ,
  env_map,
  generateRandomEmail,
,
  signInWithEmailIntoTorusWallet} from "../utils";
const torusLoginURL = env_map.torusV2;
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
