import { expect, Page, test } from "@playwright/test";

import { catchErrorAndExit, env_map, generateRandomEmail, signInWithEmail } from "../utils";
import { DeveloperDashboardPage } from "./DeveloperDashboardPage";

const openloginURL = env_map[process.env.PLATFORM || "prod"];

const testEmail = generateRandomEmail() || "";
const backupEmail = generateRandomEmail() || "";
let organizationName = "";

test.describe.serial("Account page scenarios", () => {
  let page: Page;
  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    test.setTimeout(3000000);
    await page.goto(openloginURL);
    await signInWithEmail(page, testEmail, browser);
    const shouldExit = await catchErrorAndExit(page);
    expect(shouldExit).toBeFalsy();
    await page.waitForURL(`${openloginURL}/profile/create`, {
      waitUntil: "load",
    });
  });

  test(`Verify user is able to register`, async () => {
    const accountsPage = new DeveloperDashboardPage(page);
    organizationName = testEmail.split("@")[0].split(".")[1];
    await accountsPage.registerUser(organizationName);
    await page.waitForURL(`${openloginURL}/organization/${organizationName}`, {
      waitUntil: "load",
    });
    await page.waitForSelector('span:has-text("Create a Project")');
    expect(await page.locator('span:has-text("Create a Project")').first().isVisible()).toBeTruthy();
  });

  test(`Verify user is able to create a new project`, async () => {
    const accountsPage = new DeveloperDashboardPage(page);
    await accountsPage.clickCreateAProject();
    await accountsPage.createProject(`${testEmail}_project`, "Core Kit", "Sapphire Devnet (MPC Only)", "Android");
    await accountsPage.navigateTo("Project");
    await page.waitForURL(`${openloginURL}/organization/${organizationName}/projects`, {
      waitUntil: "load",
    });
    await accountsPage.searchAndSelectProject(`${testEmail}_project`, "Sapphire Devnet (MPC Only)");
    await accountsPage.verifyProject(`${testEmail}_project`, "Sapphire Devnet (MPC Only)", "Android");
  });

  test(`Verify user is able to able to update project details`, async () => {
    const accountsPage = new DeveloperDashboardPage(page);
    await accountsPage.updateProject("Solana");
    await accountsPage.verifyMessageIsDisplayed("Project updated successfully");
  });

  test(`Verify user is able to convert project to mainnet`, async () => {
    const accountsPage = new DeveloperDashboardPage(page);
    await accountsPage.clickCreateMainnet();
    await accountsPage.createMainnetProject(`${testEmail}_project`, "Sapphire Mainnet (MPC Only)");
    await accountsPage.navigateTo("Project");
    await page.waitForURL(`${openloginURL}/organization/${organizationName}/projects`, {
      waitUntil: "load",
    });
    await accountsPage.searchAndSelectProject(`${testEmail}_project`, "Sapphire Mainnet (MPC Only)");
  });

  test(`Verify user is able to add custom verifiers to the project`, async () => {
    const accountsPage = new DeveloperDashboardPage(page);
    await accountsPage.navigateToTab(" Custom Authentication ");
    await accountsPage.clickCreateAVerifier();
    await accountsPage.createVerifier(testEmail.split("@")[0].substr(testEmail.split("@")[0].length - 6), "Discord");
    await accountsPage.verifyMessageIsDisplayed("Verifier Created Successfully");
  });

  test(`Verify users role`, async () => {
    const accountsPage = new DeveloperDashboardPage(page);
    await accountsPage.navigateTo("Settings");
    await page.goto(`${openloginURL}/organization/${organizationName}/settings`);
    await page.waitForURL(`${openloginURL}/organization/${organizationName}/settings`, {
      waitUntil: "load",
    });
    await accountsPage.navigateToTab(" Member");
    await accountsPage.verifyUserRole(testEmail, "Owner");
  });

  test(`Verify user is able to upgrade to new plan`, async () => {
    const accountsPage = new DeveloperDashboardPage(page);
    await accountsPage.navigateToTab(" Member");
    expect(await page.isVisible("text=You do not have enough seats to invite another member")).toBeTruthy();
    await accountsPage.upgradePlan();
    await accountsPage.verifyMessageIsDisplayed("Subscription Updated Successfully");
    await accountsPage.navigateToTab(" Payment");
    await accountsPage.verifyInvoiceAndCardAddedIsDisplayed("Visa ending with 4242");
  });

  test(`Verify user is able to add invite new team member`, async () => {
    const accountsPage = new DeveloperDashboardPage(page);
    await accountsPage.navigateToTab(" Member");
    await accountsPage.inviteNewTeamMember(backupEmail);
    await accountsPage.verifyMessageIsDisplayed("Invite Sent Successfully");
  });
});
