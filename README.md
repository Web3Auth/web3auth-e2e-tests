# torus-e2e-tests

End-to-end testing of [Torus] products.

## Development

### Scripts

| Script         | Description                                                          |
| -------------- | -------------------------------------------------------------------- |
| `test`         | Run all tests in Chrome headless                                     |
| `test:all`     | Run all tests in all browsers (Chrome, Firefox, and Safari) headless |
| `test:chrome`  | Run all tests in headed Chrome                                       |
| `test:firefox` | Run all tests in headed Firefox                                      |
| `test:safari`  | Run all tests in headed Safari                                       |

### Add new test

Add a new file `<name>.test.ts` to `tests` directory:

```ts
test.only("focus this test", async ({ page }) => {
  // Run only this test during development
});
```

When you've done writing the test, change `test.only` to `test` to turn off focus mode.

<!-- Links -->

[torus]: https://tor.us
