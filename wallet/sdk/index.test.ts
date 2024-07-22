import { test } from "./index.lib";
import http, { Server } from "http";
import handler from "serve-handler";
import path from "path";
import { expect, Frame } from "@playwright/test";

export const HOST = "localhost";
export const PORT = 5000;

let server: Server

test.beforeAll(async () => {
  server = http.createServer((request, response) => {
    return handler(request, response, {
      public: path.resolve(__dirname, "app"),
    });
  });
  await new Promise<void>((resolve) => server.listen(PORT, HOST, resolve));
})

test.afterAll(async () => {
  server.close()
})

test.skip(`torus.login() should open "Sign in" modal`, async ({
  page,
  appURL,
}) => {
  await page.goto(appURL);
  await page.click("text=Login");
  const iframe = page.frame({
    url: "https://app.tor.us/**",
  });
  expect(iframe).not.toBeNull();

  if (!iframe) return test.fixme();
  expect(await iframe.isVisible("text=Sign in")).toBeTruthy();
});

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

buttonsTest.describe("In Login modal,", () => {
  buttonsTest.skip(({ browserName }) => browserName === "firefox");
  buttonsTest(
    "click on 'Google' should do Google login",
    async ({ page, iframe }) => {
      const [popup] = await Promise.all([
        page.waitForEvent("popup"),
        iframe.click('button:has-text("Continue with Google")'),
      ]);
      await popup.waitForURL("https://accounts.google.com/**")
      // await popup.waitForNavigation({ waitUntil: "networkidle" });
      // const url = new URL(popup.url());
      // expect(url.hostname).toBe("accounts.google.com");
    }
  );
});
