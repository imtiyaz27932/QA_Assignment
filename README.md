# QA Assignment - Playwright JS

## Prerequisites
- Node.js (v16+ recommended)
- npm

## Setup
1. Clone the repository:
   ```
   git clone <your-repo-url>
   cd QA_Assignment
   ```
2. Install dependencies:
   ```
   npm install
   ```

## Configuration
- Edit `settings.json` to choose:
  - `executionMode`: `parallel` or `sequence`
  - `browserMode`: `headless` or `headed`

## Running Tests
- To run all tests:
  ```
  npx playwright test
  ```
- To run in headed mode:
  ```
  npx playwright test --headed
  ```
- To run in sequence:
  ```
  npx playwright test --workers=1
  ```
- To run a specific test:
  ```
  npx playwright test tests/login.spec.js
  ```

## Outcome Sharing
- Test outcomes are saved in `testOutcome.json` and used by dependent tests.

## API Test
- The API test uploads `sample.txt` using ConvertAPI.

## Submission
- Push your code to GitHub and provide access to `abhinay-srikant` and `samiullah`.

---
For any issues, check Playwright docs: https://playwright.dev/docs/test-configuration
