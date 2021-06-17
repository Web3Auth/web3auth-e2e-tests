# torus-e2e-tests

End-to-end testing of [Torus] products.

## Projects

Tests are designed into projects. Each project represents a user who is using one or several Torus products.
Each user starts with an initial state and use different features in Torus product(s):

### `carter`

**State**

- Device: macOS + Chrome
- OpenLogin account: Google + Password
- Not signed into OpenLogin (no device share)
- Signed into Google

### `washington`

**State**

- Device: macOS + Safari
- OpenLogin account: Google + Password
- Not signed into OpenLogin (no device share)
- Signed into Google

## Development

### Scripts

| Script                                   | Description                                                                       |
| ---------------------------------------- | --------------------------------------------------------------------------------- |
| `install:system-deps`                    | Install system dependencies that may be required to run tests in certain browsers |
| `test:headless --project=<project-name>` | Run tests in headless mode (no GUI, for CI)                                       |
| `test:headed --project=<project-name>`   | Run tests in headed mode (with GUI, for development)                              |
| `trace <path-to-trace.zip>`              | Trace test result (for development)                                               |

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
