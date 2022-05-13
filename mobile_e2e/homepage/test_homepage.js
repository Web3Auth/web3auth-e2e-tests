const webdriver = require("selenium-webdriver");
const { By } = require("selenium-webdriver");
const assert = require("assert");
const { env_map, platform_map, browserStackURL } = require("../common-config");

// Input capabilities
const capabilities = platform_map[process.env.PLATFORM];

// test OpenLogin homepage
async function runTestWithCaps() {
  let driver = new webdriver.Builder()
    .usingServer(browserStackURL)
    .withCapabilities(capabilities)
    .build();
  try {
    await driver.get(env_map[process.env.ENV]);
    // check title to be OpenLogin
    let title = await driver.getTitle();
    assert(title === "OpenLogin");
    // there should be "Get Started" button
    let getStartedBtn = await driver.wait(
      webdriver.until.elementIsVisible(
        driver.findElement(By.xpath("//span[text()='Get Started']"), 10000)
      )
    );

    // click on "Get Started" should show login modal
    await getStartedBtn.click();

    let welcomeMessage = await driver.wait(
      webdriver.until.elementIsVisible(
        driver.findElement(By.xpath("//div[text()='Welcome onboard']"), 10000)
      )
    );
    assert((await welcomeMessage.getText()) === "Welcome onboard");
    // marking the test as pass if all the above steps passed without error
    await driver.executeScript(
      'browserstack_executor: {"action": "setSessionStatus", "arguments": {"status":"passed","reason": "Home page is working fine!"}}'
    );
  } catch (e) {
    //marking the test as Failed if any exception occurred.
    await driver.executeScript(
      'browserstack_executor: {"action": "setSessionStatus", "arguments": {"status":"failed","reason": "Home page is broken"}}'
    );
  }
  await driver.quit();
}
runTestWithCaps();
