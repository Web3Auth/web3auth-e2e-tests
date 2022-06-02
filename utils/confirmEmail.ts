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
  const page = await context.newPage();
  try {
    // from:Web3Auth subject:(verify your email) after:1654083432 to:testuserYXJ@openlogin.com
    console.log(`to: ${to}`);
    const mailFilterStr = generateFilterStr({
      from: "Web3Auth",
      subject: "(verify+your+email)",
      after: timestamp,
      to: to,
    });
    console.log(`filter: ${mailFilterStr}`);
    await page.goto(
      `https://mail.google.com/mail/u/0/#advanced-search/is_unread=true&query=${mailFilterStr}&isrefinement=true`
    );
    console.log("step-attaching");
    await page.waitForSelector("a[title='Gmail']", { state: "attached" });

    // Try click on the verify link
    const maxReloads = 20;
    let reloads = 0;
    console.log("step - trying to get email with button");
    while (reloads < maxReloads) {
      try {
        reloads++;
        console.log("step-clicking on mail");
        await page.click('div[role="link"] >> text=Verify your email', {
          timeout: 2500,
        });
        break;
      } catch {
        console.log("step-mail not found");
        if (reloads % 5 === 0) await resend();
        console.log("step-page reload");
        await page.reload();
      }
    }
    if (reloads >= maxReloads) return false;
    console.log("step-waiting for popup");
    console.log("step- and clicking confirm button");
    const [popup] = await Promise.all([
      page.waitForEvent("popup"),
      page.click(
        'table[role="content-container"] a:has-text("Confirm my email")'
      ),
    ]);
    console.log("step-closing email window");
    await popup.waitForSelector(
      "text=Close this and return to your previous window"
    );
    await popup.close();
    console.log("step-done with email..");
    return true;
  } catch {
    return false;
  } finally {
    await page.close();
  }
}

export default confirmEmail;
