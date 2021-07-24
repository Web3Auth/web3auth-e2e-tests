# torus-e2e-tests

End-to-end testing of [Torus] products.

[![Homepage](https://github.com/torusresearch/torus-e2e-tests/actions/workflows/homepage.yml/badge.svg)](https://github.com/torusresearch/torus-e2e-tests/actions/workflows/homepage.yml)
[![Google Login](https://github.com/torusresearch/torus-e2e-tests/actions/workflows/login-with-google.yml/badge.svg)](https://github.com/torusresearch/torus-e2e-tests/actions/workflows/login-with-google.yml)
[![Facebook Login](https://github.com/torusresearch/torus-e2e-tests/actions/workflows/login-with-facebook.yml/badge.svg)](https://github.com/torusresearch/torus-e2e-tests/actions/workflows/login-with-facebook.yml)
[![Discord Login](https://github.com/torusresearch/torus-e2e-tests/actions/workflows/login-with-discord.yml/badge.svg)](https://github.com/torusresearch/torus-e2e-tests/actions/workflows/login-with-discord.yml)

## Development

### Scripts

| Script                                                                                    | Description                                          |
| ----------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `test --config=<test-dir>/index.config.ts --project=<chromium\|firefox\|webkit>`          | Run tests in headless mode (no GUI, for CI)          |
| `test --config=<test-dir>/index.config.ts --project=<chromium\|firefox\|webkit> --headed` | Run tests in headed mode (with GUI, for development) |
| `trace <path-to-trace.zip>`                                                               | Trace test results (for development)                 |

### Add new test

Add a new file `<name>.test.ts` to `tests` directory:

```ts
test.only("focus this test", async ({ page }) => {
  // Run only this test during development
});
```

When you've done writing the test, change `test.only` to `test` to turn off focus mode.

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
