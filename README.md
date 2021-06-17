# torus-e2e-tests

End-to-end testing of [Torus] products.

## Development

### Scripts

| Script                | Description                                                                       |
| --------------------- | --------------------------------------------------------------------------------- |
| `install:system-deps` | Install system dependencies that may be required to run tests in certain browsers |
| `test`                | Run tests in headless mode                                                        |
| `test:headed`         | Run tests in headed mode                                                          |

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
