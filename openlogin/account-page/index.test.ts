import { expect, Page } from "@playwright/test";
import { test } from "./index.lib";
import { useAutoCancel2FASetup } from "../../utils";
import { useAutoCancelShareTransfer } from "../../utils/index";
import Mailosaur from "mailosaur";
import { Link } from "mailosaur/lib/models";
import { generate } from "generate-password";
import { validateMnemonic } from "bip39";

const mailosaur = new Mailosaur(process.env.MAILOSAUR_API_KEY || "");

const testEmail = `accnt+hello+${Date.now()}@${
  process.env.MAILOSAUR_SERVER_DOMAIN
}`;

const backupEmail = `hello+backup+${Date.now()}@${
  process.env.MAILOSAUR_SERVER_DOMAIN
}`;

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
test.describe.serial("Account page test", () => {
  let page: Page;
  test.beforeAll(async ({ browser, openloginURL }) => {
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

    await useAutoCancelShareTransfer(page);
    await useAutoCancel2FASetup(page);
    await page.waitForURL(`${openloginURL}/wallet/home`, {
      waitUntil: "load",
    });
  });
  test.afterAll(async ({ browser }) => {
    browser.close();
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

    await page.fill('[placeholder="Email"]', backupEmail);

    await page.click('button:has-text("Continue")');

    const seedEmail = await mailosaur.messages.get(
      process.env.MAILOSAUR_SERVER_ID || "",
      {
        sentTo: backupEmail,
      }
    );
    let seedArray = seedEmail?.text?.body?.slice(171).split(" ") || [];
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

  test(`should resend recovery email share`, async ({ openloginURL }) => {
    await page.goto(`${openloginURL}/wallet/account`);
    await page.waitForURL(`${openloginURL}/wallet/account`, {
      waitUntil: "load",
    });
    expect(page.url()).toBe(`${openloginURL}/wallet/account`);
    await page.click('button:has-text("Resend")');

    const resentBackup = await mailosaur.messages.get(
      process.env.MAILOSAUR_SERVER_ID || "",
      {
        sentTo: backupEmail,
      }
    );
    expect(resentBackup.subject === "Your Web3Auth backup phrase").toBeTruthy();

    let seedArray = resentBackup?.text?.body?.slice(171).split(" ") || [];
    let seedString = "";
    for (let i = 0; i < 23; i++) {
      seedString += seedArray[i] + " ";
    }
    seedString += seedArray[23].split("\n")[0];
    expect(validateMnemonic(seedString)).toBeTruthy();
  });

  test(`emailed backup phrase and phrase from UI should match`, async ({
    openloginURL,
  }) => {
    await page.goto(`${openloginURL}/wallet/account`);
    await page.waitForURL(`${openloginURL}/wallet/account`, {
      waitUntil: "load",
    });
    expect(page.url()).toBe(`${openloginURL}/wallet/account`);
    await page.click('button[aria-label="export email share"]');

    const resentBackup = await mailosaur.messages.get(
      process.env.MAILOSAUR_SERVER_ID || "",
      {
        sentTo: backupEmail,
      }
    );
    expect(resentBackup.subject === "Your Web3Auth backup phrase").toBeTruthy();

    let seedArray = resentBackup?.text?.body?.slice(171).split(" ") || [];
    let seedString = "";
    for (let i = 0; i < 23; i++) {
      seedString += seedArray[i] + " ";
    }
    seedString += seedArray[23].split("\n")[0];
    expect(validateMnemonic(seedString)).toBeTruthy();
    expect(
      await page.isVisible("text=Save a copy of your backup phrase")
    ).toBeTruthy();
    expect(await page.isVisible(`text=${seedString}`)).toBeTruthy(); // check if the backup phrase on email matches the one on UI.
  });

  test(`should be able to delete email share`, async ({ openloginURL }) => {
    await page.goto(`${openloginURL}/wallet/account`);
    await page.waitForURL(`${openloginURL}/wallet/account`, {
      waitUntil: "load",
    });
    expect(page.url()).toBe(`${openloginURL}/wallet/account`);
    expect(await page.isVisible("text=2 / 3")).toBeTruthy();
    await page.click('button[aria-label="delete email share"]');
    await page.waitForTimeout(2000);

    await page.goto(`${openloginURL}/wallet/account`);
    await page.waitForURL(`${openloginURL}/wallet/account`, {
      waitUntil: "load",
    });
    await page.reload();
    await page.waitForTimeout(1000);
    expect(await page.isVisible("text=2 / 2")).toBeTruthy();
  });

  test(`should show a popup with copy option while clicking download device share`, async ({
    openloginURL,
  }) => {
    await page.goto(`${openloginURL}/wallet/home`);
    await page.waitForURL(`${openloginURL}/wallet/home`, {
      waitUntil: "load",
    });
    await page.goto(`${openloginURL}/wallet/account`);
    await page.waitForURL(`${openloginURL}/wallet/account`, {
      waitUntil: "load",
    });
    expect(page.url()).toBe(`${openloginURL}/wallet/account`);

    await page.click(`button[aria-label='export device share']`);
    await page.waitForTimeout(1000);

    expect(
      await page.isVisible("text=Save a copy of your backup phrase")
    ).toBeTruthy();
  });

  // should test setting up email backup again after deleting email share.
  test(`should be able to setup email backup again`, async ({
    openloginURL,
  }) => {
    await page.goto(`${openloginURL}/wallet/home`);
    await page.waitForURL(`${openloginURL}/wallet/home`, {
      waitUntil: "load",
    });
    await page.goto(`${openloginURL}/wallet/account`);
    await page.waitForURL(`${openloginURL}/wallet/account`, {
      waitUntil: "load",
    });
    expect(page.url()).toBe(`${openloginURL}/wallet/account`);
    expect(await page.isVisible("text=2 / 2")).toBeTruthy();
    await page.fill('[placeholder="Enter recovery email"]', testEmail);
    await page.click('button:has-text("Confirm")');
    await page.waitForTimeout(4000);
    expect(await page.isVisible("text=2 / 3")).toBeTruthy();
  });

  // below test check password share setup.
  test(`should setup account password`, async ({ openloginURL }) => {
    await page.goto(`${openloginURL}/wallet/home`);
    await page.waitForURL(`${openloginURL}/wallet/home`, {
      waitUntil: "load",
    });
    await page.goto(`${openloginURL}/wallet/account`);
    await page.waitForURL(`${openloginURL}/wallet/account`, {
      waitUntil: "load",
    });
    expect(page.url()).toBe(`${openloginURL}/wallet/account`);
    await page.fill('[placeholder="Set your password"]', randomPassword.trim());
    await page.fill(
      '[placeholder="Re-enter your password"]',
      randomPassword.trim()
    );
    await page.click('button:has-text("Confirm")');
    await page.waitForTimeout(4000);
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
    await page.fill(
      '[placeholder="Set your password"]',
      newRandomPassword.trim()
    );
    await page.fill(
      '[placeholder="Re-enter your password"]',
      newRandomPassword.trim()
    );
    await page.click('button:has-text("Confirm")');
    await page.waitForTimeout(4000);
    expect(await page.isVisible("text=2 / 4")).toBeTruthy();
  });

  test(`should be able to delete device share`, async ({ openloginURL }) => {
    await page.goto(`${openloginURL}/wallet/home`);
    await page.waitForURL(`${openloginURL}/wallet/home`, {
      waitUntil: "load",
    });
    await page.goto(`${openloginURL}/wallet/account`);
    await page.waitForURL(`${openloginURL}/wallet/account`, {
      waitUntil: "load",
    });
    expect(page.url()).toBe(`${openloginURL}/wallet/account`);

    await page.click(`button[aria-label='delete device share']`);

    expect(
      await page.isVisible("text=Delete authentication factor")
    ).toBeTruthy();
    await page.click('button:has-text("Remove Share")');
    await page.waitForTimeout(4000);
    expect(await page.isVisible("text=2 / 3")).toBeTruthy();
    expect(await page.isVisible("text=No device shares found")).toBeTruthy();
  });
});
