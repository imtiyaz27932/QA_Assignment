# 🎭 Playwright Testing Framework

A comprehensive, production-ready Playwright testing framework with advanced features for web application testing.

## 🚀 Features

- **Multi-Browser Support**: Chromium, Firefox, WebKit, and mobile browsers
- **Advanced Page Object Model**: Reusable page objects with built-in utilities
- **Custom Fixtures**: Authentication, database, API testing, and more
- **Test Data Management**: JSON-based test data with dynamic generation
- **Performance Monitoring**: Built-in performance metrics and assertions
- **Network Mocking**: API mocking and network condition simulation
- **Cross-Environment Testing**: Support for multiple environments
- **Comprehensive Reporting**: HTML, Allure, JSON, and JUnit reports
- **CI/CD Integration**: GitHub Actions with automated deployment
- **Error Tracking**: Console errors, page errors, and network failures
- **Screenshot & Video**: Automatic capture on failures
- **Parallel Execution**: Configurable parallel/sequential test execution

## 📁 Project Structure

```
playwright-testing-framework/
├── .github/
│   └── workflows/
│       └── playwright-tests.yml      # CI/CD pipeline
├── fixtures/
│   ├── customFixtures.js            # Custom test fixtures
│   └── loginFixture.js              # Authentication fixtures
├── pages/
│   ├── BasePage.js                  # Base page object class
│   ├── loginPage.js                 # Login page object
│   └── signUp.js                    # Sign up page object
├── tests/
│   ├── examples/
│   │   ├── loginTest.spec.js        # Login test examples
│   │   └── apiTest.spec.js          # API test examples
│   ├── uiTests/                     # UI test suites
│   ├── apiTests/                    # API test suites
│   └── BaseTest.js                  # Base test class
├── testData/
│   ├── users.json                   # User test data
│   └── products.json               # Product test data
├── utils/
│   ├── apiHelper.js                 # API testing utilities
│   ├── browserHelper.js             # Browser manipulation utilities
│   ├── testDataManager.js           # Test data management
│   ├── logger.js                    # Logging utilities
│   ├── setConfig.js                 # Configuration management
│   └── fileutilis.js               # File utilities
├── storageState/                    # Authentication state storage
├── screenshots/                     # Test screenshots
├── downloads/                       # Downloaded files
├── playwright.config.js             # Playwright configuration
├── global-setup.js                 # Global test setup
├── global-teardown.js              # Global test cleanup
└── settings.json                   # Framework settings
```

## 🛠️ Installation

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd playwright-testing-framework
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install Playwright browsers**
   ```bash
   npm run install:browsers
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

## ⚙️ Configuration

### Environment Configuration

Configure different environments by updating the settings:

```bash
# Set environment
npm run set-parallel      # Enable parallel execution
npm run set-sequential    # Enable sequential execution
npm run set-headless      # Run in headless mode
npm run set-headed        # Run with browser UI

# Set specific environment
node utils/setConfig.js env:staging
node utils/setConfig.js env:production
```

### Settings File

Edit `settings.json` to customize framework behavior:

```json
{
  "executionMode": "parallel",
  "browserMode": "headless",
  "environment": "staging"
}
```

## 🧪 Writing Tests

### Basic Test Example

```javascript
const { test } = require('../fixtures/customFixtures');
const { expect } = require('@playwright/test');
const BasePage = require('../pages/BasePage');

test.describe('Login Tests', () => {
  test('successful login', async ({ page, testData, screenshot }) => {
    const user = testData.getUser('valid', 0);
    const basePage = new BasePage(page);
    
    await page.goto('/login');
    await basePage.fill('[data-testid="email"]', user.email);
    await basePage.fill('[data-testid="password"]', user.password);
    await basePage.click('[data-testid="login-button"]');
    
    await page.waitForURL('/dashboard');
    await basePage.assertElementVisible('[data-testid="user-menu"]');
    
    await screenshot.takeScreenshot('successful-login');
  });
});
```

### Using Custom Fixtures

The framework provides several custom fixtures:

```javascript
test('authenticated user test', async ({ authenticatedUser, apiHelper }) => {
  // User is already logged in
  const { user, token } = authenticatedUser;
  
  // API helper is pre-configured with auth token
  const response = await apiHelper.get('/api/profile');
  expect(response.status).toBe(200);
});

test('mobile test', async ({ mobileDevice, testData }) => {
  const { page } = mobileDevice;
  // Test runs on mobile viewport
});

test('performance test', async ({ page, performanceMonitor }) => {
  await performanceMonitor.startMonitoring();
  await page.goto('/heavy-page');
  
  const metrics = await performanceMonitor.getMetrics();
  expect(metrics.loadTime).toBeLessThan(3000);
});
```

### API Testing

```javascript
test('API CRUD operations', async ({ apiHelper, testData }) => {
  const newUser = testData.generateUser();
  
  // Create
  const createResponse = await apiHelper.post('/api/users', newUser);
  apiHelper.assertStatusCode(createResponse, 201);
  
  const userId = createResponse.data.id;
  
  // Read
  const getResponse = await apiHelper.get(`/api/users/${userId}`);
  apiHelper.assertStatusCode(getResponse, 200);
  
  // Update
  const updateData = { firstName: 'Updated' };
  const updateResponse = await apiHelper.put(`/api/users/${userId}`, updateData);
  apiHelper.assertStatusCode(updateResponse, 200);
  
  // Delete
  const deleteResponse = await apiHelper.delete(`/api/users/${userId}`);
  apiHelper.assertStatusCode(deleteResponse, 204);
});
```

### Test Data Management

```javascript
test('using test data', async ({ testData }) => {
  // Get predefined test data
  const validUser = testData.getUser('valid', 0);
  const invalidUser = testData.getUser('invalid', 0);
  
  // Generate dynamic test data
  const generatedUser = testData.generateUser({
    role: 'admin',
    isActive: true
  });
  
  // Create invalid variations
  const invalidVariation = testData.createInvalidUser(validUser);
  
  // Save generated data for later use
  testData.saveGeneratedData('testUser', generatedUser);
});
```

## 🏃‍♂️ Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests in headed mode
npm run test:headed

# Run tests with UI mode
npm run test:ui

# Run specific browser
npm run test:chromium
npm run test:firefox
npm run test:webkit

# Run mobile tests
npm run test:mobile

# Run API tests only
npm run test:api

# Run UI tests only
npm run test:ui-tests
```

### Test Categories

```bash
# Run smoke tests
npm run test:smoke

# Run regression tests
npm run test:regression

# Run tests in parallel
npm run test:parallel

# Run tests sequentially
npm run test:sequential
```

### Debug Mode

```bash
# Run tests in debug mode
npm run test:debug

# Run specific test file
npx playwright test tests/examples/loginTest.spec.js --debug

# Run tests with specific tag
npx playwright test --grep @smoke
```

## 📊 Reporting

### Built-in Reports

The framework generates multiple report formats:

1. **HTML Report**: Interactive report with screenshots and traces
   ```bash
   npm run report
   ```

2. **Allure Report**: Comprehensive reporting with analytics
   ```bash
   npm run report:allure
   ```

3. **JSON Report**: Machine-readable test results
4. **JUnit Report**: CI/CD integration compatible format

### Custom Reporting

You can extend reporting by adding custom reporters in `playwright.config.js`:

```javascript
reporter: [
  ['html', { outputFolder: 'playwright-report' }],
  ['allure-playwright'],
  ['json', { outputFile: 'test-results/results.json' }],
  ['./utils/customReporter.js'] // Your custom reporter
]
```

## 🔧 Utilities

### Browser Helper

```javascript
const { browserHelper } = await use;

// Performance monitoring
await browserHelper.startPerformanceMonitoring();
const metrics = await browserHelper.getPerformanceMetrics();

// Network manipulation
await browserHelper.blockResources(['image', 'font']);
await browserHelper.simulateSlowNetwork();

// Browser state management
await browserHelper.clearBrowserData();
await browserHelper.setGeolocation(40.7128, -74.0060);
```

### API Helper

```javascript
const apiHelper = new APIHelper('https://api.example.com');

// Authentication
apiHelper.setBearerToken('your-token');
apiHelper.setBasicAuth('username', 'password');

// HTTP methods
const response = await apiHelper.get('/users');
const createResponse = await apiHelper.post('/users', userData);
const updateResponse = await apiHelper.put('/users/1', updateData);
const deleteResponse = await apiHelper.delete('/users/1');

// File upload
const uploadResponse = await apiHelper.uploadFile('/upload', filePath);

// Performance testing
const results = await apiHelper.performanceTest('/api/users', 'GET', null, 10);
```

### Test Data Manager

```javascript
const testDataManager = require('./utils/testDataManager');

// Load test data
const users = testDataManager.loadTestData('users');

// Generate data
const user = testDataManager.generateUser();
const product = testDataManager.generateProduct();

// Bulk generation
const users = testDataManager.generateUsers(10);

// Validation
const validation = testDataManager.validateUserData(user);
if (!validation.valid) {
  console.log('Validation errors:', validation.errors);
}
```

## 🔄 CI/CD Integration

### GitHub Actions

The framework includes a comprehensive GitHub Actions workflow that:

- Runs tests on multiple browsers
- Supports multiple environments
- Generates and deploys Allure reports
- Provides PR comments with results
- Includes security scanning and quality checks

### Manual Workflow Dispatch

You can manually trigger tests with specific parameters:

1. Go to Actions tab in GitHub
2. Select "Playwright Tests" workflow
3. Click "Run workflow"
4. Choose environment, browser, and test type

### Environment Variables

Set these secrets in your GitHub repository:

```
SLACK_WEBHOOK=<your-slack-webhook-url>
```

## 🏗️ Extending the Framework

### Custom Fixtures

Create custom fixtures in `fixtures/customFixtures.js`:

```javascript
const test = base.extend({
  myCustomFixture: async ({}, use) => {
    // Setup
    const customObject = new MyCustomClass();
    await customObject.initialize();
    
    await use(customObject);
    
    // Cleanup
    await customObject.cleanup();
  }
});
```

### Custom Page Objects

Extend the BasePage class:

```javascript
const BasePage = require('./BasePage');

class ProductPage extends BasePage {
  constructor(page) {
    super(page);
    this.addToCartButton = '[data-testid="add-to-cart"]';
    this.productTitle = '[data-testid="product-title"]';
  }
  
  async addProductToCart() {
    await this.click(this.addToCartButton);
    await this.assertElementVisible('[data-testid="cart-notification"]');
  }
  
  async getProductTitle() {
    return await this.getText(this.productTitle);
  }
}

module.exports = ProductPage;
```

### Custom Utilities

Add new utilities in the `utils/` directory:

```javascript
class DatabaseHelper {
  async connect() {
    // Database connection logic
  }
  
  async query(sql, params) {
    // Database query logic
  }
  
  async cleanup() {
    // Cleanup test data
  }
}

module.exports = DatabaseHelper;
```

## 🐛 Debugging

### Debug Mode

Run tests in debug mode to step through execution:

```bash
npm run test:debug
```

### Trace Viewer

Playwright automatically captures traces on failures. View them:

```bash
npx playwright show-trace test-results/trace.zip
```

### Screenshots and Videos

Configure automatic capture:

```javascript
use: {
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
  trace: 'retain-on-failure'
}
```

### Console Logging

The framework includes comprehensive logging:

```javascript
const logger = require('./utils/logger');

logger.info('Test step completed');
logger.warn('Warning message');
logger.error('Error occurred', error);
```

## 📝 Best Practices

### Test Organization

1. **Group related tests** using `test.describe()`
2. **Use descriptive test names** that explain what is being tested
3. **Tag tests** appropriately (@smoke, @regression, @api)
4. **Keep tests independent** - each test should be able to run in isolation

### Page Objects

1. **Use meaningful selectors** - prefer data-testid attributes
2. **Encapsulate page logic** in page object methods
3. **Return page objects** from navigation methods for chaining
4. **Use assertions** in page objects for immediate feedback

### Test Data

1. **Use test data files** for static data
2. **Generate dynamic data** for unique test scenarios
3. **Clean up test data** after tests complete
4. **Validate test data** before using in tests

### Performance

1. **Use parallel execution** for faster test runs
2. **Optimize selectors** for better performance
3. **Reuse browser contexts** when possible
4. **Monitor test execution time** and optimize slow tests

## 🔒 Security

The framework includes several security features:

- **Dependency scanning** with npm audit
- **Vulnerability scanning** with Trivy
- **Secure credential handling** with environment variables
- **Rate limiting protection** in API tests

## 📈 Performance Monitoring

Built-in performance monitoring includes:

- Page load times
- API response times
- Resource loading metrics
- Memory usage tracking
- Network condition simulation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the linter and tests
6. Submit a pull request

### Code Quality

The framework enforces code quality through:

- ESLint for code linting
- Prettier for code formatting
- Pre-commit hooks for automated checks

## 📚 Additional Resources

- [Playwright Documentation](https://playwright.dev)
- [Testing Best Practices](https://playwright.dev/docs/best-practices)
- [API Testing Guide](https://playwright.dev/docs/test-api-testing)
- [Page Object Model Pattern](https://playwright.dev/docs/pom)

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter issues or have questions:

1. Check the [documentation](#-additional-resources)
2. Search [existing issues](../../issues)
3. Create a [new issue](../../issues/new)
4. Contact the team via Slack

---

**Happy Testing! 🎭**



