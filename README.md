

## Project Overview
This project showcases a modular, scalable QA automation framework using Playwright with JavaScript and the Page Object Model (POM). It covers:

✅ UI Automation: Login, Signup, Logout, Profile Verification

🌐 API Automation: File Upload, Download, Authenticated Requests

🔁 Outcome Sharing Between Tests

📋 Custom Logging for Debugging & Reporting

⚙️ Configurable Execution (Headed/Headless, Parallel/Sequential)

🧪 Built-in Fixtures for Consistent Setup & Teardown

Tested and developed on Windows OS.
---

## 1. Prerequisites
Before running the project, ensure the following are installed:

Node.js (v16 or higher)

npm (comes with Node.js)

Git (for cloning repo)


## 2. Installation Steps
1. **Clone the repository:**

   git clone <your-repo-url>
   cd QA_Assignment

2. **Install dependencies:**

   npm install

3. **Set environment variables:**

Create a .env file at the root level with the following content:

BASE_URL=https://www.automationexercise.com/
LOGIN_EMAIL=your@email.com
LOGIN_PASSWORD=yourpassword
SIGNUP_NAME=Your Name
SIGNUP_EMAIL=your@email.com
SIGNUP_PASSWORD=yourpassword
CONVERT_API_BASE=https://v2.convertapi.com
CONVERT_API_TOKEN=your_convertapi_token


4. **Configure test execution:**
   - Edit `settings.json` to choose:
     - `executionMode`: `parallel` or `sequence`
     - `browserMode`: `headless` or `headed`

5. **Global Setup for Authenticated Tests:**
   - The project uses a `global-setup.js` file to log in once and save the authenticated session to `storageState.json`.
   - This enables all tests to reuse the login session automatically.
   - No manual login is needed in each test file.
   - See `global-setup.js` for details.

6. **Faker Library for Dynamic Test Data:**
   - The project uses [`@faker-js/faker`](https://www.npmjs.com/package/@faker-js/faker) to generate random names, emails, passwords, and other data for signup and other tests.
   - This helps avoid duplicate data errors and makes tests more robust.
   - Example usage:
     ```js
     const { faker } = require('@faker-js/faker');
     const name = faker.person.fullName();
     const email = faker.internet.email();
     ```
   - Faker is already included in `package.json` dependencies.

---

## 3. Project Structure

QA_Assignment/
├── pages/              # Page Object Model classes (Login, Signup)
│   └── LoginPage.js
├── tests/              # Test suites for UI & API
│   ├── login.spec.js
│   ├── signup.spec.js
│   └── api.spec.js
├── utils/              # Reusable utility modules
│   ├── logger.js          # Custom logger for step-by-step tracking
│   ├── outcomeHelper.js   # Read/write shared data across tests
│   └── fixtures.js        # Optional shared setup logic
├── sample.txt          # Sample file for download/upload test
├── .env                # Environment variables
├── settings.json       # Runtime configuration (browser/execution mode)
├── playwright.config.js # Global Playwright settings
├── testOutcome.json    # JSON file storing intermediate test results
└── README.md           # Documentation 

---

## 4. How to Execute Tests
### UI Tests
-👉 All UI Tests (headless mode by default)
  
  npx playwright test
 
-👉 Headed Mode (visible browser for debugging)
 
  npx playwright test --headed

 
- 👉 Sequential Execution (single thread)
  npx playwright test --workers=1

- 👉 Specific Test File
  npx playwright test tests/login.spec.js


### API Tests
- 👉 API Tests Only
 npx playwright test tests/api.spec.js


---

## 5. What Has Been Used


- 🧩 Key Components :
🔹 1. logger.js – Custom Logging Utility
Located in utils/logger.js, it logs every step with a timestamp to test.log:

logger.info("Navigating to login page");
 INFO: Navigating to login page
Benefits:

Easy debugging

Post-mortem analysis of test failures

TLs can easily trace what happened and when

🔹 2. outcomeHelper.js – Share Outcomes Across Tests
Located in utils/outcomeHelper.js, it allows one test's result to be used in another.

Example usage:

writeTestData("loginSuccess", true);
const result = readTestData("loginSuccess");
Used mainly to:

Skip logout/profile validation if login fails

Maintain test dependencies cleanly

🔹 3. fixtures.js (Optional Setup Fixtures)
If added, fixtures.js can be used for reusable setup steps using Playwright's test fixtures pattern.

Example:

t
export const testWithLogin = base.extend({
  loggedInPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(process.env.LOGIN_EMAIL, process.env.LOGIN_PASSWORD);
    await use(page);
  }
});

🔹 4. playwright.config.js – Global Configuration
Sets base URL, reporter, retries, and timeout:


use: {
  baseURL: process.env.BASE_URL,
  trace: "on-first-retry"
},
reporter: [["html"], ["list"]]


✅ Test Coverage
🔐 UI Tests
Login with valid credentials

Login with invalid credentials

Signup with valid credentails

Logout post-login



🌐 API Tests
Download sample file and validate content

Read from and write to the file system

Upload file to ConvertAPI

Access protected endpoint with bearer token

🔄 Outcome Sharing Flow
login.spec.js stores login success status in testOutcome.json.

logout.spec.js or profile.spec.js reads this status to decide whether to execute.

Prevents cascading failures.


---

## 6. Test Coverage
### UI Tests
- Login (valid/invalid)
- Signup
- Logout
- 

### API Tests
- File download, read, and write
- File upload to ConvertAPI
- Authenticated endpoint access

---

## 7. How Outcome Sharing Works
- Test results are saved in `testOutcome.json` and used by dependent tests (e.g., logout/profile only run if login succeeds).

---

## 8. How Logging Works
- All major steps are logged to `test.log` with timestamps for traceability.

---

## 9. Submission
- Push your code to GitHub and provide access to `abhinay-srikant` and `samiullah`.

---

## 10. Troubleshooting
- If you face issues, check Playwright docs: https://playwright.dev/docs/test-configuration
- Ensure your `.env` and `settings.json` are correctly set.
- Check `test.log` for step-by-step execution details.

---


