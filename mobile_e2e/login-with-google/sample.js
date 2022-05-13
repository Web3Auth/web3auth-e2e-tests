const webdriver = require("selenium-webdriver");
const { By } = require("selenium-webdriver");
const assert = require("assert");
const { env_map, platform_map, browserStackURL } = require("../common-config");

const capabilities = platform_map[process.env.PLATFORM];

async function runTestWithCaps() {
  //   let driver = new webdriver.Builder()
  //     .usingServer(browserStackURL)
  //     .withCapabilities(capabilities)
  //     .build();
  let driver = new webdriver.Builder().forBrowser("chrome").build();
  try {
    await driver.get("https://gmail.com");
    let emailTB = await driver.wait(
      webdriver.until.elementIsVisible(
        driver.findElement(By.xpath("//input[@type='email']"), 10000)
      )
    );
    await emailTB.sendKeys("shubham.jagdeesh@gmail.com");
    let nextBT = await driver.wait(
      webdriver.until.elementIsVisible(
        driver.findElement(By.xpath("//span[text()='Next']"), 10000)
      )
    );
    await nextBT.click();
    let passwd = await driver.wait(
      webdriver.until.elementIsVisible(
        driver.findElement(By.xpath("//input[@type='password']"), 10000)
      )
    );
    await emailTB.sendKeys("shubh@bit19");
    //a[text()='Use the web version']
    let nextBT2 = await driver.wait(
      webdriver.until.elementIsVisible(
        driver.findElement(By.xpath("//span[text()='Next']"), 10000)
      )
    );
    await nextBT2.click();
    let useWeb = await driver.wait(
      webdriver.until.elementIsVisible(
        driver.findElement(By.xpath("//a[text()='Use the web version']"), 10000)
      )
    );
    await useWeb.click();
    setTimeout(function () {
      console.log("THIS IS");
    }, 100000);
    await fs.writeFileSync(
      "cookies.json",
      JSON.stringify(await driver.manage().getCookies())
    );
    // await driver.executeScript(
    //   'browserstack_executor: {"action": "setSessionStatus", "arguments": {"status":"passed","reason": "Home page is working fine!"}}'
    // );
  } catch (e) {
    console.log("error");
    //marking the test as Failed if any exception occurred.
    // await driver.executeScript(
    //   'browserstack_executor: {"action": "setSessionStatus", "arguments": {"status":"failed","reason": "Home page is broken"}}'
    // );
  }
  const cookies = driver.manage.getCookies();
  console.log(cookies);
  //   await driver.quit();
}
runTestWithCaps();
