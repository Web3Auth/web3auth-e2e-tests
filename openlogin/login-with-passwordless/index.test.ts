import { expect } from "@playwright/test";
import { confirmEmail, useAutoCancel2FASetup } from "../../utils";
import { test } from "./index.lib";
import { useAutoCancelShareTransfer } from "../../utils/index";
import Mailosaur from "mailosaur";
import { Link } from "mailosaur/lib/models";

const mailosaur = new Mailosaur(process.env.MAILOSAUR_API_KEY || "");

function findLink(links: Link[], text: string) {
  for (const link of links) {
    if (link.text === text) return link;
  }
  return null;
}

test("Login with Passwordless+Device", async ({
  context,
  browser,
  page,
  openloginURL,
  user,
}) => {
  // todo: break when mailosaur env are empty
  await page.goto(openloginURL);
  await page.click('button:has-text("Get Started")');

  // Login with Passwordless
  const testEmail = `hello+${Date.now()}@${
    process.env.MAILOSAUR_SERVER_DOMAIN
  }`;
  const timestamp = Math.floor(Date.now() / 1000);
  await page.fill('[placeholder="Email"]', testEmail);
  await page.click('button:has-text("Continue with Email")');
  await page.waitForSelector("text=email has been sent");
  expect(await page.isVisible(`text=${testEmail}`)).toBeTruthy();

  // Search for the email
  const email = await mailosaur.messages.get(
    process.env.MAILOSAUR_SERVER_ID || "",
    {
      sentTo: testEmail,
    }
  );

  expect(email.subject).toBe("Verify your email");
  const link = findLink(email.html?.links || [], "Confirm my email");
  expect(link?.text).toBe("Confirm my email");
  const href = link?.href || "";
  const context2 = await browser.newContext();
  const page2 = await context2.newPage();
  await page2.goto(href);
  await page2.waitForSelector(
    "text=Close this and return to your previous window",
    {
      timeout: 10000,
    }
  );
  await page2.close();

  await useAutoCancelShareTransfer(page);
  await useAutoCancel2FASetup(page);

  await page.waitForURL(`${openloginURL}/wallet/home`, {
    waitUntil: "networkidle",
  });

  const welcome = await page.waitForSelector(`text=Welcome`);

  // Logout;
  await Promise.all([page.waitForNavigation(), page.click("text=Logout")]);
  expect(page.url()).toBe(`${openloginURL}/`);
});
