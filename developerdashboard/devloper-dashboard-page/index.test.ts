import { test, expect , Page} from '@playwright/test';
import { DeveloperDashboardPage } from './DeveloperDashboardPage';
import Mailosaur from "mailosaur";
import { DEFAULT_PLATFORM, env_map } from "../utils/index";
import { generate } from "generate-password";
import { signInWithGitHub, signInWithMobileNumber } from "../utils";
import { validateMnemonic } from "bip39";
import {
  useAutoCancel2FASetup,
  signInWithEmail,
  deleteCurrentDeviceShare,
  waitForTkeyRehydration,
  addPasswordShare,
  changePasswordShare,
  useAutoCancelShareTransfer,
  generateRandomEmail,
  catchError,
  waitForSessionStorage,
  catchErrorAndExit,
  slowOperation
} from "../utils";
import { delay } from 'cypress/types/bluebird';

const mailosaur = new Mailosaur(process.env.MAILOSAUR_API_KEY || "");
const openloginURL = env_map[process.env.PLATFORM || "prod"];
const github = {
  email: process.env.GITHUB_USER_EMAIL || "",
  password: process.env.GITHUB_USER_PASSWORD || ""
};
const user = {
  mobileNumberForLogin: "+358-4573986537",
  mobileNumberForSMS: "3584573986537"
};

const testEmail =  generateRandomEmail();
const backupEmail = "backup" + generateRandomEmail();

const randomPassword = generate({
  length: 15,
  numbers: true,
  uppercase: true,
  lowercase: true,
  strict: true,
  symbols: '@'
});

test.describe.serial("Account page scenarios", () => {
  let page: Page;
  test.beforeAll(async ({ browser, }) => {
    page = await browser.newPage();
    test.setTimeout(3000000)
    await page.goto(openloginURL);
    await signInWithEmail(page, testEmail, browser);
    const shouldExit = await catchErrorAndExit(page);
    expect(shouldExit).toBeFalsy()
    await page.waitForURL(`${openloginURL}/register`, {
      waitUntil: "load",
    });
  });


test(`Verify user is able to register`, async ({  }) => {
  const accountsPage = new DeveloperDashboardPage(page);
  await accountsPage.registerUser()
  await page.waitForURL(`${openloginURL}/home`, {
      waitUntil: "load",
    });
    await page.waitForSelector('span:has-text("Create a Project")')
    expect(await page.locator('span:has-text("Create a Project")').first().isVisible()).toBeTruthy();
  });

test(`Verify user is able to create a new project`, async ({  }) => {
  const accountsPage = new DeveloperDashboardPage(page);
  await accountsPage.clickCreateAProject()
  await accountsPage.createProject(testEmail+"_project", "Sapphire Devnet", "Android")
  await accountsPage.navigateTo("Project")
  await page.waitForURL(`${openloginURL}/home/projects`, {
    waitUntil: "load",
  });
  await accountsPage.searchAndSelectProject(testEmail+"_project", "Sapphire Devnet");
  await accountsPage.verifyProject(testEmail+"_project", "Sapphire Devnet","Android");
  });

  test(`Verify user is able to able to update project details`, async ({  }) => {
    const accountsPage = new DeveloperDashboardPage(page);
    await accountsPage.updateProject("Solana");
    await accountsPage.verifyMessageIsDisplayed("Project updated successfully");
  });

  test(`Verify user is able to convert project to mainnet`, async ({  }) => {
    const accountsPage = new DeveloperDashboardPage(page);
    await accountsPage.clickCreateMainnet();
    await accountsPage.createMainnetProject(testEmail+"_project", "Mainnet (Asia)")
    await accountsPage.navigateTo("Project")
    await page.waitForURL(`${openloginURL}/home/projects`, {
      waitUntil: "load",
    });
    await accountsPage.searchAndSelectProject(testEmail+"_project", "Mainnet (Asia)");
  });

  test(`Verify user is able to add new team and verify role`, async ({  }) => {
    const accountsPage = new DeveloperDashboardPage(page);
    const teamName = testEmail.split("@")[0];
    await accountsPage.addNewTeam(testEmail.split("@")[0],testEmail);
    await accountsPage.verifyMessageIsDisplayed("Team Created Successfully");
    await accountsPage.navigateTo("Settings")
    await page.waitForURL(`${openloginURL}/home/team/${teamName}/settings`, {
      waitUntil: "load",
    });
    await accountsPage.navigateToTab(" Member")
    await accountsPage.verifyUserRole(testEmail,"Owner")
  });

  test(`Verify user is able to upgrade to new plan`, async ({  }) => {
    const accountsPage = new DeveloperDashboardPage(page);
    await accountsPage.navigateToTab(" Member")
    expect(await page.isVisible('text=You do not have enough seats to invite another member')).toBeTruthy();
    await accountsPage.upgradePlan();
    await accountsPage.verifyMessageIsDisplayed("Subscription Updated Successfully");
  });

  test(`Verify user is able to add invite new team member`, async ({  }) => {
    const accountsPage = new DeveloperDashboardPage(page);
    await accountsPage.navigateToTab(" Member")
    await accountsPage.inviteNewTeamMember(backupEmail);
    await accountsPage.verifyMessageIsDisplayed("Invite Sent Successfully");
  });
});
