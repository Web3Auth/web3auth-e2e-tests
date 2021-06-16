import { test } from "@playwright/test";

const password = "t3stPA55w0rd"; // TODO: Set password of target test account to this value

test.use({
  storageState: ".local/google.json", // TODO: Point to committed state with test accounts
});

test(`Login with Google + Password`, async ({ page }) => {
  await page.goto("https://app.openlogin.com/");
  await page.click('button:has-text("Get Started")');
  await page.click('button:has-text("Continue with Google")');
  await page.waitForNavigation({ waitUntil: "networkidle" });
  await page.click("text=phuc@tor.us");
  await page.waitForNavigation({ waitUntil: "networkidle" });
  await page.fill('[placeholder="Account password"]', password);
});
