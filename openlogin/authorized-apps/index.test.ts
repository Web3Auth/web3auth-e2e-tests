import { expect, Page } from "@playwright/test";
import { test } from "./index.lib";
import {
  useAutoCancel2FASetup,
  findLink,
  signInWithEmail,
  generateRandomEmail,
} from "../../utils";
import { useAutoCancelShareTransfer } from "../../utils/index";
import Mailosaur from "mailosaur";

const mailosaur = new Mailosaur(process.env.MAILOSAUR_API_KEY || "");

const testEmail = generateRandomEmail();

test.describe.serial("App authorization page test", () => {
  test.skip(() => process.env.PLATFORM === "local"); // skipping this test for local
  let page: Page;
  test.beforeAll(async ({ browser, openloginURL }) => {
    test.setTimeout(60000); // adding more time to compensate high loading time
    const context = await browser.newContext();
    page = await context.newPage();
    await page.goto(openloginURL);
    await signInWithEmail(page, testEmail, browser);

    await useAutoCancelShareTransfer(page);
    await useAutoCancel2FASetup(page);
    await page.waitForURL(`${openloginURL}/wallet/home`, {
      waitUntil: "load",
    });
  });
  test.afterAll(async ({ browser }) => {
    browser.close();
  });
  test(`should display "You are not connected to any applications yet." when no apps are connected.`, async ({
    openloginURL,
  }) => {
    await page.goto(`${openloginURL}/wallet/apps`);
    await page.waitForURL(`${openloginURL}/wallet/apps`, {
      waitUntil: "load",
    });
    expect(page.url()).toBe(`${openloginURL}/wallet/apps`);
    expect(
      await page.isVisible(
        "text=You are not connected to any applications yet."
      )
    ).toBeTruthy();
  });

  //below test use testEmail to login to solana wallet prod and there by generates an app share
  // which gets listed in list of apps
  test(`should connect DApp  wallet with passwordless login and list app`, async ({
    openloginURL,
    browser,
  }) => {
    test.setTimeout(120000); // adding more time since test is depended on external websites.
    const context2 = await browser.newContext();
    const context3 = await browser.newContext();
    const page2 = await context2.newPage();
    if (process.env.PLATFORM === "prod") {
      await page2.goto("https://solana.tor.us/login");
      await page2.fill('[placeholder="Enter your email"]', testEmail);
      await page2.click('button:has-text("Continue with Email")');
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
      await page2.waitForURL(`https://solana.tor.us/wallet/home`, {
        waitUntil: "load",
      });
      await page.reload();
      await page.waitForURL(`${openloginURL}/wallet/apps`, {
        waitUntil: "load",
      });

      expect(page.url()).toBe(`${openloginURL}/wallet/apps`);
      await page.waitForSelector("text=solana-prod");
      expect(await page.isVisible("text=Authorized Apps")).toBeTruthy();
      expect(
        await page.isVisible(
          "text=You are not connected to any applications yet."
        )
      ).toBeFalsy();
      expect(await page.isVisible("text=solana-prod")).toBeTruthy();
      await page2.close();
    }
    if (process.env.PLATFORM === "cyan") {
      await page2.goto("https://collect.100thieves.com");
      await page2.click('button:has-text("CONNECT WALLET")');
      await page2.click('button:has-text("CONNECT WITH SOCIAL")');
      await page2.fill('[placeholder="Email"]', testEmail);
      await page2.click('button:has-text("Continue with Email")');

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
          timeout: 20000,
        }
      );
      await page3.close();
      await page2.waitForSelector("text=You are connected with your account", {
        timeout: 30000, // larger timeout for external webpage loading
      });
      await page.reload();
      await page.waitForURL(`${openloginURL}/wallet/apps`, {
        waitUntil: "load",
      });
      await page.waitForSelector("text=LCS Drop");
      expect(await page.isVisible("text=Authorized Apps")).toBeTruthy();
      expect(await page.isVisible("text=LCS Drop")).toBeTruthy();
      await page2.close();
    }
  });

  test(`should be able to delete app share from UI`, async ({
    openloginURL,
  }) => {
    await page.click('button[aria-label="delete device share"]');
    await page.goto(`${openloginURL}/wallet/apps`);
    await page.waitForURL(`${openloginURL}/wallet/apps`, {
      waitUntil: "load",
    });
    expect(page.url()).toBe(`${openloginURL}/wallet/apps`);
    expect(
      await page.isVisible(
        "text=You are not connected to any applications yet."
      )
    ).toBeTruthy();
  });
});
