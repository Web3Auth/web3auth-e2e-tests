import { BrowserContext } from "@playwright/test";

async function confirmEmail({
  context,
  timestamp,
  resend,
}: {
  context: BrowserContext;
  timestamp: number;
  resend: () => Promise<void>;
}) {
  const page = await context.newPage();
  try {
    await page.goto(
      `https://mail.google.com/mail/u/0/#advanced-search/is_unread=true&query=from%3Atorus+subject%3A(verify+your+email)+after%3A${timestamp}&isrefinement=true`
    );
    await page.waitForSelector("a[title='Gmail']", { state: "attached" });

    // Try click on the verify link
    const maxReloads = 20;
    let reloads = 0;
    while (reloads < maxReloads) {
      try {
        reloads++;
        await page.click('div[role="link"] >> text=Verify your email', {
          timeout: 2000,
        });
        break;
      } catch {
        if (reloads % 5 === 0) await resend();
        await page.reload();
      }
    }
    if (reloads >= maxReloads) return false;

    const [popup] = await Promise.all([
      page.waitForEvent("popup"),
      page.click(
        'table[role="content-container"] a:has-text("Confirm my email")'
      ),
    ]);
    await popup.waitForSelector("text=Done");
    await popup.close();

    return true;
  } catch {
    return false;
  } finally {
    await page.close();
  }
}

export {
  confirmEmail
}
