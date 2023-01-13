import { expect } from "@playwright/test";
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

const mailosaur = new Mailosaur(process.env.MAILOSAUR_API_KEY || "");

const testEmail = `hello+${Date.now()}@${process.env.MAILOSAUR_SERVER_DOMAIN}`;

const randomPassword = generate({
  length: 15,
  numbers: true,
  uppercase: true,
  lowercase: true,
  strict: true,
});
const newRandomPassword = generate({
  length: 13,
  numbers: true,
  uppercase: true,
  lowercase: true,
  strict: true,
});

function findLink(links: Link[], text: string) {
  for (const link of links) {
    if (link.text === text) return link;
  }
  return null;
}
test.describe.serial.only("Account page test", () => {
  let page;
  test.beforeAll(async ({ browser, openloginURL, user }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    await page.goto(openloginURL);
    await page.click('button:has-text("Get Started")');

    // const testEmail = `hello+${Date.now()}@${
    //   process.env.MAILOSAUR_SERVER_DOMAIN
    // }`;
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

  test(`page title should be "Account" for account page`, async ({
    openloginURL,
  }) => {
    await page.goto(`${openloginURL}/wallet/account`);
    await page.waitForURL(`${openloginURL}/wallet/account`, {
      waitUntil: "load",
    });
    expect(page.url()).toBe(`${openloginURL}/wallet/account`);
    expect(await page.isVisible("text=Account")).toBeTruthy();
  });
  test(`should display 2FA enable window for single factor account`, async ({
    openloginURL,
  }) => {
    await page.goto(`${openloginURL}/wallet/account`);
    await page.waitForURL(`${openloginURL}/wallet/account`, {
      waitUntil: "load",
    });
    expect(page.url()).toBe(`${openloginURL}/wallet/account`);
    expect(
      await page.isVisible(
        "text=We strongly recommend you to enable 2FA on your account"
      )
    ).toBeTruthy();
  });
  test(`should setup 2FA account from account page`, async ({
    openloginURL,
  }) => {
    await page.goto(`${openloginURL}/wallet/account`);
    await page.waitForURL(`${openloginURL}/wallet/account`, {
      waitUntil: "load",
    });
    expect(page.url()).toBe(`${openloginURL}/wallet/account`);
    await page.click('button:has-text("Enable 2FA")');
    page
      .locator(
        "text=I understand that clearing browser history and cookies will delete this factor on my browser."
      )
      .click();
    await page.click('button:has-text("Save current device")');

    const backupEmail = `hello+${Date.now()}@${
      process.env.MAILOSAUR_SERVER_DOMAIN
    }`;

    await page.fill('[placeholder="Email"]', backupEmail);

    await page.click('button:has-text("Continue")');

    const seedEmail = await mailosaur.messages.get(
      process.env.MAILOSAUR_SERVER_ID || "",
      {
        sentTo: backupEmail,
      }
    );
    let seedArray = seedEmail.text.body.slice(171).split(" ");
    let seedString = "";
    for (let i = 0; i < 23; i++) {
      seedString += seedArray[i] + " ";
    }
    seedString += seedArray[23].split("\n")[0];

    await page.fill('[placeholder="Recovery phrase"]', seedString);

    await page.click('button:has-text("Verify")');

    await page.click('button:has-text("Done")');
    await page.reload();
    await page.goto(`${openloginURL}/wallet/account`);
    await page.waitForURL(`${openloginURL}/wallet/account`, {
      waitUntil: "load",
    });

    expect(await page.isVisible("text=Recovery email")).toBeTruthy();
    expect(await page.isVisible("text=Device(s)")).toBeTruthy();
    expect(await page.isVisible("text=2 / 3")).toBeTruthy();
  });

  test(`should setup account password`, async ({ openloginURL }) => {
    await page.goto(`${openloginURL}/wallet/account`);
    await page.waitForURL(`${openloginURL}/wallet/account`, {
      waitUntil: "load",
    });
    expect(page.url()).toBe(`${openloginURL}/wallet/account`);
    console.log("Password is :", randomPassword);
    await page.fill('[placeholder="Set your password"]', randomPassword);
    await page.fill('[placeholder="Re-enter your password"]', randomPassword);
    await page.click('button:has-text("Confirm")');
    await page.reload();
    await page.goto(`${openloginURL}/wallet/account`);
    await page.waitForURL(`${openloginURL}/wallet/account`, {
      waitUntil: "load",
    });
    expect(page.url()).toBe(`${openloginURL}/wallet/account`);
    expect(await page.isVisible("text=2 / 4")).toBeTruthy();
  });

  test(`should change/update account password`, async ({ openloginURL }) => {
    await page.goto(`${openloginURL}/wallet/home`);
    await page.waitForURL(`${openloginURL}/wallet/home`, {
      waitUntil: "load",
    });
    await page.goto(`${openloginURL}/wallet/account`);
    await page.waitForURL(`${openloginURL}/wallet/account`, {
      waitUntil: "load",
    });
    expect(page.url()).toBe(`${openloginURL}/wallet/account`);
    await page.click('button:has-text("Change Password")');
    console.log("New Password is :", newRandomPassword);

    await page.fill('[placeholder="Set your password"]', newRandomPassword);
    await page.fill(
      '[placeholder="Re-enter your password"]',
      newRandomPassword
    );
    await page.click('button:has-text("Confirm")');
    await page.reload();
    await page.goto(`${openloginURL}/wallet/account`);
    await page.waitForURL(`${openloginURL}/wallet/account`, {
      waitUntil: "load",
    });
    expect(page.url()).toBe(`${openloginURL}/wallet/account`);
    expect(await page.isVisible("text=2 / 4")).toBeTruthy();
  });
});
