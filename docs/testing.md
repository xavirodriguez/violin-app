# Testing

This document outlines the testing strategy for the Violin Mentor application.

## Testing Strategy

The project uses a combination of manual and automated testing to ensure quality.

- **Static Analysis**: ESLint and TypeScript are used for static analysis to catch errors and enforce code style before runtime.
- **End-to-End (E2E) Testing**: [Playwright](https://playwright.dev/) is used for E2E testing to simulate user interactions and verify the application's behavior in a real browser environment.

## Running Tests

### Static Analysis

To run the linter and type checker, use the following commands:

```bash
pnpm lint
pnpm format:check
```

### End-to-End Tests

The E2E tests are located in the `e2e/` directory. To run the Playwright tests, use the following command:

```bash
pnpm playwright test
```

This will run the tests in headless mode. To see the tests run in a browser, you can use the `--headed` flag:

```bash
pnpm playwright test --headed
```

After the tests run, a report will be generated in the `playwright-report/` directory.
