# Testing

StudyOS uses JavaScript tooling (likely Vitest/Jest) depending on `package.json` scripts.

## Unit / integration tests

Check scripts in `package.json`:

- `npm test`
- `npm run vitest` (if present)
- other test-related scripts

Common commands:

```bash
npm test
```

or:

```bash
npm run vitest
```

## Test setup

If tests require environment setup, it is typically in:
- `src/test/setup.js`

## Running tests after changes

After updating any core business logic (services, utils, contexts):

1. Run the unit tests
2. Run lint (if configured)
3. Run `npm run dev` and manually verify key flows

## Debugging test failures

- Check for missing env vars
- Ensure mocks match the expectations in the test setup
- Re-run with verbose output if supported by the test runner

