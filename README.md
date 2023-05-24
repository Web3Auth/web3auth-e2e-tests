# web3auth-e2e-tests

End-to-end testing for Torus products.
[Torus]
[Web3Auth]

### Built With

- [Playwright](https://playwright.dev)
- [Typescript](https://www.typescriptlang.org/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

## Getting Started

### Prerequisites

The following software are required:

- nodejs : Download and Install Node JS from
  ```sh
  https://nodejs.org/en/download/
  ```

### Installation

1. Clone the repo using below URL

```sh
https://github.com/Web3Auth/web3auth-e2e-tests.git
```

2. Navigate to folder and install npm packages using:

```sh
npm install
```
3. For first time installation run below command to download required browsers

```sh
npm i -D @playwright/test
# install supported browsers
npx playwright install
```

## Development

### Scripts

| Script                                                                                    | Description                                          |
| ----------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `test --config=<test-dir>/index.config.ts --project=<chromium\|firefox\|webkit>`          | Run tests in headless mode (no GUI, for CI)          |
| `test --config=<test-dir>/index.config.ts --project=<chromium\|firefox\|webkit> --headed` | Run tests in headed mode (with GUI, for development) |
| `trace <path-to-trace.zip>`                                                               | Trace test results (for development)                 |

### Add a test to an existing test suite

Add a new file `<name>.test.ts` to the test suite's directory:

```ts
test.only("focus this test", async ({ page }) => {
  // Run only this test during development
});
```
```ts
test.skip('skip this test', async ({ page }) => {
  // This test is not run
});
```
When you've done writing the test, change `test.only` to `test` to turn off focus mode.

### Create a new test suite

Duplicate `openlogin/homepage/` and `.github/workflows/openlogin.homepage.yml`, rename and update the tests.

## Status

### OpenLogin

[![OpenLogin Test Run](https://github.com/Web3Auth/web3auth-e2e-tests/actions/workflows/main.yml/badge.svg)](https://github.com/Web3Auth/web3auth-e2e-tests/actions/workflows/main.yml)

[![OpenLogin - Lighthouse](https://github.com/torusresearch/torus-e2e-tests/actions/workflows/lighthouse.yml/badge.svg)](https://github.com/torusresearch/torus-e2e-tests/actions/workflows/lighthouse.yml)

### Select elements

Prefer text or accessibility selectors:

```ts
await page.click("text=Welcome onboard");
await page.click('button:has-text("Get Started")');
await page.click('[aria-label="Continue with Facebook"]');
await page.click("xpath=.//div[text()='Login']");
```

See [full list of selectors](https://playwright.dev/docs/selectors/#quick-guide).

## Framework Execution Pattern

![alt text](https://github.com/Web3Auth/web3auth-e2e-tests/blob/new_ui_openlogin/FW.png)

<!-- Links -->

[torus]: https://tor.us
[Web3Auth]: https://app.openlogin.com/
[Framework Design]: https://lucid.app/lucidchart/0a243786-3d3c-4dcb-b31d-f5c2a224ea42/edit?viewport_loc=-291%2C-13%2C2266%2C1146%2C0_0&invitationId=inv_8cb3a0f7-3930-427f-b82e-259d5b27fa99
