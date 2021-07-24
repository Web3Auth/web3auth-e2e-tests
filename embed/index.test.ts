import { expect } from "@playwright/test";
import { test } from "./index.lib";

test(`torus.login() should open "Sign in" modal`, async ({ page, appURL }) => {
  await page.goto(appURL);
  await page.click("text=Login");
  const iframe = page.frame({
    url: "https://app.tor.us/**",
  });
  expect(iframe).not.toBeNull();

  if (!iframe) return test.fixme();
  expect(await iframe.isVisible("text=Sign in")).toBeTruthy();
});
