// playwright-dev-page.ts
import { expect, Locator, Page } from '@playwright/test';
import Mailosaur from "mailosaur";
const mailosaur = new Mailosaur(process.env.MAILOSAUR_API_KEY || "");
export class DeveloperDashboardPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async clickCreateAProject() {
    await this.page.locator('span:has-text("Create a Project")').click()
  }

  async createProject(name:string, environment:string, platform:string ) {
    await this.page.waitForSelector('#CreateProjectName');
    await this.page.locator('#CreateProjectName').fill(name)
    await this.page.locator('#networkEnvironment').click()
    await this.page.locator(`div:has-text(${platform})`).click()
    await this.page.locator(`xpath=.//input[@placeholder='0 platforms selected']`).first().click()
    await this.page.locator(`span:has-text(${environment})`).click()
    await this.page.click('button:has-text(" Create Project ")');
  }

    async createVerifier(name:string, provider:string, platform:string ) {
    await this.page.locator(`xpath=.//input[@placeholder='Eg. ppp-custom-test']`).first().fill(name)
    await this.page.locator(`div:has-text(${platform})`).click()
    await this.page.click('button:has-text(" Create Verifier ")');
  }

  async createMainnetProject(name:string, platform:string ) {
    await this.page.waitForSelector('#projectName');
    await this.page.locator('#projectName').fill(name)
    await this.page.locator('#networkEnvironment').click()
    await this.page.locator(`div:has-text(${platform})`).click()
    await this.page.click('button:has-text(" Create Mainnet Project ")');
  }

  async navigateTo(option: string) {
     await this.page.click(`span:has-text("${option})`);
    }

    async navigateToTab(option: string) {
      await this.page.click(`div:has-text("${option})`);
     }


     async verifyUserRole(email:string,role: string) {
      expect(await this.page.locator(`xpath=.//p[text()='${email}']/ancestor::td/following-sibling::td/div"`).first().textContent()).toContain(role);
     }

  async searchAndSelectProject(name: string, environment:string) {
    await this.page.locator(`xpath=.//input[@aria-placeholder='Search for projects']`).first().fill(name);
    await this.page.locator(`xpath=.//h6[text()='${name}']/parent::td/following-sibling::td[text()='${environment}']`).first().click()

  }

  async verifyProject(name:string, environment:string, platform:string ) {
    expect (await this.page.locator('#projectName').textContent()).toEqual(name);
    expect (await this.page.locator('#EnvironmentNetwork').textContent()).toEqual(environment);
    expect (await this.page.locator("xpath=.//input[@aria-placeholder='1 platforms selected']").textContent()).toEqual(platform);
  }

  async verifyTeamName(name:string ) {
    expect (await this.page.locator('xpath=.//p[text()="Team Workspace"]/preceding-sibling::h6').textContent()).toEqual(name);
  }

  async verifyMessageIsDisplayed(message:string ) {
    expect (await this.page.locator(`xpath=.//p[text()="${message}"]`).isVisible());
  }

  async updateProject(chain:string) {
    await this.page.locator('#ChainId').click()
    await this.page.click(`span:has-text("${chain})`);
    await this.page.locator(`xpath=.//input[@placeholder='Explain a bit about your project (optional)']`).first().fill("description")
  }

  async clickSave() {
    await this.page.click('button:has-text("Save Changes")');
  }

  async clickCreateVerifier() {
    await this.page.click('button:has-text(" Create Verifier ")');
  }

  async clickArchive(name: string) {
    await this.page.click('button:has-text(" Archive Project ")');
    await this.page.locator(`xpath=.//input[contains(@aria-label, 'Please type')]`).fill(name);
    await this.page.click('button:has-text(" I understand, archive this project ")');
  }

  async clickCreateMainnet() {
    await this.page.click('button:has-text(" Create Mainnet Project ")');
  }

  async addNewTeam(teamName: string, email:string) {
    await this.page.click('p:has-text("Personal Workspace")');
    await this.page.click('button:has-text("+ Add a new team")');
    await this.page.waitForSelector("xpath=.//input[contains(@aria-label, 'Enter a team name')]");
    await this.page.locator(`xpath=.//input[contains(@aria-label, 'Enter a team name')]`).fill(teamName);
    await this.page.locator(`xpath=.//input[contains(@aria-label, 'Enter a team email')]`).fill(email);
    await this.page.locator(`xpath=.//input[contains(@aria-label, 'Enter a team size')]`).fill("10");
    await this.page.click('button:has-text("Create Team")');
  }

  async upgradePlan() {
    await this.page.click('button:has-text(" Upgrade Plan")');
    await this.page.locator('button:has-text("Choose Plan")').first().click();
    await this.page.locator('#Field-numberInput').fill("4242 4242 4242 4242");
    await this.page.locator('#Field-expiryInput').fill("0245");
    await this.page.locator('#Field-cvcInput').fill("123");
    await this.page.locator('#agreePolicy').click();
    await this.page.locator('button:has-text("Change Plan")').first().click();
  }

  async inviteNewTeamMember(email:string) {
    await this.page.click('button:has-text("+ Add Member")');
    await this.page.waitForSelector("#EmailAddress");
    await this.page.locator('#EmailAddress').fill(email);
    await this.page.locator('#Role').click();
    await this.page.click('span:has-text("Admin")');
    await this.page.click('button:has-text("Add Member")');
  }

  async seedEmail(backupEmail: string) {
    const seedEmail = await mailosaur.messages.get(
        process.env.MAILOSAUR_SERVER_ID || "",
        {
          sentTo: backupEmail,
        },
        { timeout: 30 * 1000 }
      );
      let seedArray =
        seedEmail.html?.body
          ?.toString()
          .replace(/(\r\n|\n|\r)/gm, "")
          .slice(11084)
          .split("<")[0]
          .split(" ") || [];
      let seedString = "";
      for (let i = 0; i < 23; i++) {
        seedString += seedArray[i] + " ";
      }
      seedString += seedArray[23];
      await mailosaur.messages.del(seedEmail?.id || "");
      console.log("Recovery phrase" + seedString)
      return seedString;
}

  async verifyRecoveryPhrase(seedString: string) {
    await this.page.fill('[placeholder="Paste your Recovery Factor"]', seedString);
    await this.page.click('button:has-text("Verify")');
  }

  async verifySocialFactor() {
    await this.page.waitForSelector('xpath=.//*[text()="Continue with sms"]');
    await this.page.click('xpath=.//*[text()="Continue with sms"]');
  }


  async setRecoveryPassword(password: string) {
    await this.page.fill('#openlogin-password', password);
    await this.page.fill('#openlogin-confirm-password', password);
    await this.page.click('button:has-text("Confirm")');
  }

  async addSocialRecoveryFactor(factor: string) {
    await this.page.locator("xpath=.//button[@aria-label='View more']").click()
    await this.page.locator(`xpath=.//img[@alt='${factor} Icon']/parent::button`).click()
  }

  async skip2FASetUp() {
    await this.page.locator("xpath=.//button[text()='Skip for Now']").click()
  }

  async clickDone() {
    await this.page.locator("xpath=.//button[text()='Done']").click()
  }

  async clickSupport() {
    await this.page.locator("xpath=.//span[text()='Support']").last().click();
  }

  async clickLearnMore() {
    await this.page.click('span:has-text("Learn more ")');
  }

  async clickLogout() {
    await this.page.locator("xpath=.//span[text()='Logout']").last().click();
  }

  async clickLastClose() {
    await this.page.locator("xpath=.//button[text()='Close']").last().click()
  }

  async clickFirstClose() {
    await this.page.locator("xpath=.//button[text()='Close']").first().click()
  }

  async verifyWithFactor(factorName: string) {
    await this.page.locator(`xpath=.//p[text()='${factorName}']/parent::div/following-sibling::button`).first().click()
  }

  async clickVerifyWithOtherFactors() {
    await this.page.click('button:has-text("Verify with other factors")');
  }

  async clickVerify() {
    await this.page.click('button:has-text("Verify")');
  }

  async clickConfirm() {
    await this.page.click('button:has-text("Confirm")');
  }

  async enterRecoveryEmail(testEmail: string) {
    await this.page.fill('[placeholder="Enter recovery email"]', testEmail);
  }


  async verifyFactorsSetUp(factorcount: string) {
    expect(await this.page.isVisible("text=Factor 1: Social Login")).toBeTruthy();
    expect(await this.page.isVisible("text=Factor 2: Device (s)")).toBeTruthy();
    expect(await this.page.isVisible("text=Factor 3: Social Recovery")).toBeTruthy();
    expect(await this.page.isVisible("text=Recovery email")).toBeTruthy();
    expect(await this.page.isVisible("text=Other Factors : Password")).toBeTruthy();
    expect(await this.page.isVisible(`text=${factorcount}`)).toBeTruthy();
  }

  async resendRecoveryEmail() {
    await this.page.click('button:has-text("Resend")');
    await this.page.waitForTimeout(5000);
  }

  async copyEmailRecoveryShare() {
    await this.page.click('button[aria-label="copy recovery phrase"]');
  }

  async addPasswordShare(password: string) {
    await this.page.locator("#openlogin-password").fill(password);
    await this.page.locator("#openlogin-confirm-password").fill(password);
    await this.page.click('button:has-text("Confirm")');
    await this.page.waitForSelector('button:has-text("Change Password")');
    await this.page.locator("text=Password successfully changed").isVisible();
  }

  async changeSocialFactor() {
    await this.page.locator('span:has-text("Change Social Factor")').click();
  }

  async clickChangePassword() {
    await this.page.locator('button:has-text("Change Password")').click();
  }

  async deleteRecoveryShare() {
    await this.page.locator('button[aria-label="delete device share"]').first().click();
    await this.page.waitForSelector("text=Recovery share deleted successfully");
    await this.page.locator("text=Recovery share deleted successfully").isVisible();
  }

  async copyDeviceShare() {
    await this.page.locator("text=Copy Recovery Phrase").click();
  }

  async deleteDeviceShare() {
    await this.page.locator('button:has-text("Revoke")').click();
  }
}
