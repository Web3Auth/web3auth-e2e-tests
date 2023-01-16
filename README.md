# torus-e2e-tests

End-to-end testing of [Torus] products.

## Status

### OpenLogin

[![OpenLogin - Homepage](https://github.com/torusresearch/torus-e2e-tests/actions/workflows/openlogin.homepage.yml/badge.svg)](https://github.com/torusresearch/torus-e2e-tests/actions/workflows/openlogin.homepage.yml)

[![OpenLogin - Google Login](https://github.com/torusresearch/torus-e2e-tests/actions/workflows/openlogin.login-with-google.yml/badge.svg)](https://github.com/torusresearch/torus-e2e-tests/actions/workflows/openlogin.login-with-google.yml)

[![OpenLogin - Facebook Login](https://github.com/torusresearch/torus-e2e-tests/actions/workflows/openlogin.login-with-facebook.yml/badge.svg)](https://github.com/torusresearch/torus-e2e-tests/actions/workflows/openlogin.login-with-facebook.yml)

[![OpenLogin - Facebook Login 2FA](https://github.com/torusresearch/torus-e2e-tests/actions/workflows/openlogin.login-with-facebook-2fa.yml/badge.svg)](https://github.com/torusresearch/torus-e2e-tests/actions/workflows/openlogin.login-with-facebook-2fa.yml)

[![OpenLogin - Discord Login](https://github.com/torusresearch/torus-e2e-tests/actions/workflows/openlogin.login-with-discord.yml/badge.svg)](https://github.com/torusresearch/torus-e2e-tests/actions/workflows/openlogin.login-with-discord.yml)

[![OpenLogin - Passwordless Login](https://github.com/torusresearch/torus-e2e-tests/actions/workflows/openlogin.login-with-passwordless.yml/badge.svg)](https://github.com/torusresearch/torus-e2e-tests/actions/workflows/openlogin.login-with-passwordless.yml)

[![OpenLogin - Lighthouse](https://github.com/torusresearch/torus-e2e-tests/actions/workflows/lighthouse.yml/badge.svg)](https://github.com/torusresearch/torus-e2e-tests/actions/workflows/lighthouse.yml)

[![OpenLogin - Existing v2 User Login](https://github.com/torusresearch/torus-e2e-tests/actions/workflows/openlogin.existing-v2-user-login.yml/badge.svg)](https://github.com/torusresearch/torus-e2e-tests/actions/workflows/openlogin.existing-v2-user-login.yml)

[![OpenLogin - GitHub Login](https://github.com/torusresearch/torus-e2e-tests/actions/workflows/openlogin.login-with-github.yml/badge.svg)](https://github.com/torusresearch/torus-e2e-tests/actions/workflows/openlogin.login-with-github.yml)

[![OpenLogin - New v2 User Login](https://github.com/torusresearch/torus-e2e-tests/actions/workflows/openlogin.new-v2-user-login.yml/badge.svg)](https://github.com/torusresearch/torus-e2e-tests/actions/workflows/openlogin.new-v2-user-login.yml)

[![OpenLogin - Setup 2fa](https://github.com/torusresearch/torus-e2e-tests/actions/workflows/openlogin.setup-2fa.yml/badge.svg)](https://github.com/torusresearch/torus-e2e-tests/actions/workflows/openlogin.setup-2fa.yml)

### Wallet

[![Wallet - SDK](https://github.com/torusresearch/torus-e2e-tests/actions/workflows/wallet.sdk.yml/badge.svg)](https://github.com/torusresearch/torus-e2e-tests/actions/workflows/wallet.sdk.yml)

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

When you've done writing the test, change `test.only` to `test` to turn off focus mode.

### Create a new test suite

Duplicate `openlogin/homepage/` and `.github/workflows/openlogin.homepage.yml`, rename and update the tests.

### Select elements

Prefer text or accessibility selectors:

```ts
await page.click("text=Welcome onboard");
await page.click('button:has-text("Get Started")');
await page.click('[aria-label="Continue with Facebook"]');
```

See [full list of selectors](https://playwright.dev/docs/selectors/#quick-guide).

<!-- Links -->

[torus]: https://tor.us

### Questions

1. which cluster should be used as default ?
