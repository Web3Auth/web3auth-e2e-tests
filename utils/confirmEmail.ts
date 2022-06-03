import { BrowserContext } from "playwright";

interface Filter {
  [key: string]: string | number | undefined;
}

const generateFilterStr = (filter: Filter) => {
  const filterItems = Object.entries(filter);
  return filterItems.reduce((filterStr, [filterName, filterVal], currIdx) => {
    if (filterVal === undefined) return filterStr;

    const prefix = currIdx === 0 ? "" : "+";
    return filterStr + `${prefix}${filterName}:${filterVal}`;
  }, "");
};

export async function confirmEmail({
  context,
  timestamp,
  to,
  resend,
}: {
  context: BrowserContext;
  timestamp: number;
  /**
   * Specify this property for passwordless tests since they
   * utilise the same email inbox and thus we need to filter
   * by recipient in order to click the correct magic link
   */
  to: string;
  resend: () => Promise<void>;
}) {
  const emailPage = await context.newPage();
  try {
    // from:Web3Auth subject:(verify your email) after:1654083432 to:testuserYXJ@openlogin.com
    const mailFilterStr = generateFilterStr({
      from: "Web3Auth",
      subject: "(verify+your+email)",
      after: timestamp,
      to: to,
    });
    await emailPage.goto(
      `https://mail.google.com/mail/u/0/#advanced-search/is_unread=true&query=${mailFilterStr}&isrefinement=true`
    );
    await page.waitForSelector("a[title='Gmail']", { state: "attached" });

    // Try click on the verify link
    const maxReloads = 20;
    let reloads = 0;
    while (reloads < maxReloads) {
      try {
        reloads++;
        await emailPage.click('div[role="link"] >> text=Verify your email', {
          timeout: 30 * 1000,
        });
        break;
      } catch {
        if (reloads % 5 === 0) await resend();
        await emailPage.reload();
      }
    }
    if (reloads >= maxReloads) return false;
    const [popup] = await Promise.all([
      emailPage.waitForEvent("popup"),
      emailPage.click(
        'table[role="content-container"] a:has-text("Confirm my email")'
      ),
    ]);
    await popup.waitForSelector(
      "text=Close this and return to your previous window"
    );
    await popup.close();
    return true;
  } catch {
    return false;
  } finally {
    await emailPage.close();
  }
}

export default confirmEmail;
