import { expect, Page } from "@playwright/test";
import { test } from "./index.lib";
import {
  signInWithFacebook,
  useAutoCancel2FASetup,
  signInWithGoogle,
} from "../../utils";
import { useAutoCancelShareTransfer } from "../../utils/index";
import Mailosaur from "mailosaur";
import { Link } from "mailosaur/lib/models";
import { generate } from "generate-password";
import { validateMnemonic } from "bip39";

const mailosaur = new Mailosaur(process.env.MAILOSAUR_API_KEY || "");

const testEmail = `hello+apps+${Date.now()}@${
  process.env.MAILOSAUR_SERVER_DOMAIN
}`;

function findLink(links: Link[], text: string) {
  for (const link of links) {
    if (link.text === text) return link;
  }
  return null;
}
test.describe.serial("App authorization page test", () => {
  let page: Page;
  test.beforeAll(async ({ browser, openloginURL, user }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    await page.goto(openloginURL);
    await page.click('button:has-text("Get Started")');

    const timestamp = Math.floor(Date.now() / 1000);
    await page.fill('[placeholder="Email"]', testEmail);
    await page.click('button:has-text("Continue with Email")');
    await page.waitForSelector("text=email has been sent");
    expect(await page.isVisible(`text=${testEmail}`)).toBeTruthy();

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
    await mailosaur.messages.deleteAll(process.env.MAILOSAUR_SERVER_ID || ""); // Deleting emails in email server.

    await useAutoCancelShareTransfer(page);
    await useAutoCancel2FASetup(page);
    await page.waitForURL(`${openloginURL}/wallet/home`, {
      waitUntil: "load",
    });
  });
  test.afterAll(async ({ browser }) => {
    browser.close;
  });

  test(`should login to solana wallet with passwordless login`, async ({
    openloginURL,
    browser,
  }) => {
    const context2 = await browser.newContext();
    const context3 = await browser.newContext();
    const page2 = await context2.newPage();
    await page2.goto("https://solana.tor.us/login");
    await page2.fill('[placeholder="Enter your email"]', testEmail);
    await page2.click('button:has-text("Continue with Email")');
    await page.waitForTimeout(4000);

    const newEmail = await mailosaur.messages.get(
      process.env.MAILOSAUR_SERVER_ID || "",
      {
        sentTo: testEmail,
      }
    );
    expect(newEmail.subject).toBe("Verify your email");
    const link = findLink(newEmail.html?.links || [], "Confirm my email");
    expect(link?.text).toBe("Confirm my email");
    const href = link?.href || "";
    const page3 = await context3.newPage();
    await page3.goto(href);
    await page3.waitForSelector(
      "text=Close this and return to your previous window",
      {
        timeout: 10000,
      }
    );
    await page3.close();
    await page2.close();
    await page.goto(`${openloginURL}/wallet/apps`);
    await page.waitForURL(`${openloginURL}/wallet/apps`, {
      waitUntil: "load",
    });

    expect(page.url()).toBe(`${openloginURL}/wallet/apps`);
    expect(await page.isVisible("text=Authorized Apps")).toBeTruthy();
    expect(
      await page.isVisible("text=solana-prod - solana.tor.us")
    ).toBeTruthy();
  });
});
