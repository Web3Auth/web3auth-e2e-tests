import { URL } from "url";
import { expect, Frame } from "@playwright/test";
import { test } from "./index.lib";

const buttonsTest = test.extend<{ iframe: Frame }>({
  iframe: async ({ page, appURL }, use, currentTest) => {
    await page.goto(appURL);
    await page.click("text=Login");
    const iframe = page.frame({
      url: "https://app.tor.us/**",
    });
    if (!iframe) return currentTest.fixme();
    await use(iframe);
  },
});

buttonsTest(
  "Click on 'Google' should do Google login",
  async ({ page, iframe }) => {
    const [popup] = await Promise.all([
      page.waitForEvent("popup"),
      iframe.click('button:has-text("Continue with Google")'),
    ]);
    await popup.waitForNavigation({ waitUntil: "networkidle" });
    const url = new URL(popup.url());
    expect(url.hostname).toBe("accounts.google.com");
  }
);
