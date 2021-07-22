# torus-e2e-tests

End-to-end testing of [Torus] products.

[![app.openlogin.com](https://github.com/torusresearch/torus-e2e-tests/actions/workflows/app.yml/badge.svg)](https://github.com/torusresearch/torus-e2e-tests/actions/workflows/app.yml)
[![beta.openlogin.com](https://github.com/torusresearch/torus-e2e-tests/actions/workflows/beta.yml/badge.svg)](https://github.com/torusresearch/torus-e2e-tests/actions/workflows/beta.yml)

## Projects

Tests are designed into projects. Each project represents a user who is using one or several Torus products.
Each user starts with an initial state and use different features in Torus product(s):

### `carter-0`

**State**

- Device: macOS + Chrome
- OpenLogin account: Google + Password
- Not signed into OpenLogin (no device share)
- Signed into Google

**Usage flow**

- Login with Google + Password.
- Delete all device shares.
- Cancel all share transfer requests.
- Logout.

### `carter-1`

- Device: Linux + Firefox
- OpenLogin account: Discord + Password
- Not signed into OpenLogin (no device share)
- Signed into Discord
- Everything else is similar to [`carter-0`](#carter0)

### `carter-2`

- Device: macOS + Firefox
- OpenLogin account: Passwordless (Gmail) + Device
- Signed into OpenLogin
- Signed into Google

**Usage flow**

- Login with Passwordless + Device.
- Logout.

### `washington-0`

- Device: macOS + Safari
- Everything else is similar to [`carter-0`](#carter0)

### `washington-1`

- Device: Windows + Chrome
- Everything else is similar to [`carter-1`](#carter1)

### `rick-0`

- Device: Linux + Chrome
- OpenLogin account: Facebook + Password
- Not signed into OpenLogin (no device share)
- Signed into Facebook
- Everything else is similar to [`carter-0`](#carter0)

### `tyler-0`

- Device: Windows + Firefox
- Everything else is similar to [`rick-0`](#rick0)

## Development

### Scripts

| Script                                   | Description                                          |
| ---------------------------------------- | ---------------------------------------------------- |
| `test --project=<project-name>`          | Run tests in headless mode (no GUI, for CI)          |
| `test --project=<project-name> --headed` | Run tests in headed mode (with GUI, for development) |
| `trace <path-to-trace.zip>`              | Trace test results (for development)                 |

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
