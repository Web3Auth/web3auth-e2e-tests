import { BrowserContext } from "playwright";

interface Filter {
  [key: string]: string | number | undefined;
}

const generateFilterStr = (filter: Filter) => {
  const filterItems = Object.entries(filter);
  return filterItems.reduce((filterStr, [filterName, filterVal], currIdx) => {
    if (filterVal === undefined) return filterStr;

    const prefix = currIdx === 0 ? "" : "+";
    return `${filterStr}${prefix}${filterName}:${filterVal}`;
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
  console.log(timestamp);
  try {
    const mailFilterStr = generateFilterStr({
      from: "Web3Auth",
      subject: "(verify+your+email)",
      after: timestamp,
      to,
    });
    console.log(timestamp);
    await emailPage.goto(`https://mail.google.com/mail/u/0/#advanced-search/is_unread=true&query=${mailFilterStr}&isrefinement=true`);
    console.log(`https://mail.google.com/mail/u/0/#advanced-search/is_unread=true&query=${mailFilterStr}&isrefinement=true`);
    await emailPage.waitForSelector("a[title='Gmail']", { state: "attached" });
    console.log(timestamp);
    // Try click on the verify link
    const maxReloads = 2;
    let reloads = 0;
    while (reloads < maxReloads) {
      try {
        reloads++;
        //await emailPage.locator('//tr/td//span[text()="email"]').click()
        await emailPage.click('//tr/td//span[text()="email"]', {
          timeout: 10 * 1000,
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
      emailPage.click('table[role="content-container"] a:has-text("Approve login request")'),
    ]);
    await popup.waitForSelector("text=Close this and return to your previous window");
    await popup.close();
    return true;
  } catch {
    return false;
  } finally {
    await emailPage.close();
  }
}

export default confirmEmail;
