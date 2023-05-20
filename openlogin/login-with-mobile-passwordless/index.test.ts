import { test, expect , Page} from '@playwright/test';
import { DEFAULT_PLATFORM, env_map } from "../../utils/index";
import { signInWithMobileNumber } from "../../utils";
import { useAutoCancelShareTransfer } from "../../utils/index";
import { AccountsPage } from '../../openlogin/account-page/AccountsPage';

const openloginURL = env_map[process.env.PLATFORM || "prod"];
const user = {
  mobileNumberForLogin: "+358-4573986537",
  mobileNumberForSMS: "3584573986537"
};

test("Login with mobile number using passwordless login", async ({ page, browser }) => {
  const accountsPage = new AccountsPage(page);
  await page.goto(openloginURL);
  await page.fill('#passwordless-email', user.mobileNumberForLogin);
  await page.getByLabel('Connect with Phone or Email').click();
  await signInWithMobileNumber({ page, user, browser })
  await page.waitForURL(`${openloginURL}/wallet/home`, {
    waitUntil: "load",
  });
  await accountsPage.clickLogout();
  expect(page.url()).toContain(`${openloginURL}/`);
});
