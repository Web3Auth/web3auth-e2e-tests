import { chromium, expect, Page } from "@playwright/test";
import { test } from "./index.lib";
import { useAutoCancel2FASetup } from "../../utils";
import { useAutoCancelShareTransfer } from "../../utils/index";
import Mailosaur from "mailosaur";
import { Link } from "mailosaur/lib/models";

const mailosaur = new Mailosaur(process.env.MAILOSAUR_API_KEY || "");

const testEmail = `hello+home+${Date.now()}@${
  process.env.MAILOSAUR_SERVER_DOMAIN
}`;

function findLink(links: Link[], text: string) {
  for (const link of links) {
    if (link.text === text) return link;
  }
  return null;
}

test.describe.serial("Home page tests", () => {
  let page: Page;
  test.beforeAll(async ({ openloginURL, browser }) => {
    const context = await browser.newContext({});
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

    await useAutoCancelShareTransfer(page);
    await useAutoCancel2FASetup(page);
    await page.waitForURL(`${openloginURL}/wallet/home`, {
      waitUntil: "load",
    });
  });
  test.afterAll(async ({ browser }) => {
    browser.close;
  });

  test(`should display user email on top right`, async ({ context }) => {
    expect(await page.isVisible(`text=${testEmail}`)).toBeTruthy();
  });
  test(`should display welcome message`, async ({ context }) => {
    expect(await page.isVisible(`text=Welcome, ${testEmail}`)).toBeTruthy();
  });
  test(`Clicking language button should display language dropdown `, async ({
    context,
  }) => {
    await page.click('button:has-text("English")');
    expect(await page.isVisible(`text=German (Deutsch)`)).toBeTruthy();
  });

  // checks if the support button routes to correct url
  test(`Clicking 'Support' button should redirect user to correct support page`, async ({}) => {
    const popupPromise = page.waitForEvent("popup");
    await page.click(`text=Support`);
    const popup = await popupPromise;
    await popup.waitForLoadState();
    const URL = await popup.url();
    expect(URL === "https://torus.crisp.help/en/").toBeTruthy();
  });

  // checks if the learn more button routes to correct url
  test(`Clicking 'Learn more' button should redirect user to correct docs page`, async ({}) => {
    const popupPromise = page.waitForEvent("popup");
    await page.click('a:has-text("Learn more")');
    const popup = await popupPromise;
    await popup.waitForLoadState();
    const URL = await popup.url();
    expect(
      URL === "https://docs.tor.us/open-login/what-is-openlogin"
    ).toBeTruthy();
  });

  test(`Clicking 'Logout' button should logout user`, async ({}) => {
    await page.click(`text=Logout`);
    expect(
      await page.isVisible(`text=Manage all your web interactions in one place`)
    ).toBeTruthy();
  });
});
