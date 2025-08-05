const { test } = require('../../fixtures/customFixtures');
const { expect } = require('@playwright/test');

test.describe('API Testing Examples', () => {
  test('GET request - fetch user list @api', async ({ apiHelper, testData }) => {
    // Set up authentication
    const admin = testData.getUser('valid', 1);
    apiHelper.setBearerToken('mock-admin-token');
    
    // Make API request
    const response = await apiHelper.get('/api/users');
    
    // Assertions
    apiHelper.assertStatusCode(response, 200);
    expect(response.data).toBeInstanceOf(Array);
    expect(response.data.length).toBeGreaterThan(0);
    
    // Validate response structure
    const user = response.data[0];
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('email');
    expect(user).toHaveProperty('firstName');
    expect(user).toHaveProperty('lastName');
  });

  test('POST request - create new user @api', async ({ apiHelper, testData }) => {
    const newUser = testData.generateUser();
    
    // Create user via API
    const response = await apiHelper.post('/api/users', {
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      password: newUser.password,
      role: 'user'
    });
    
    // Assertions
    apiHelper.assertStatusCode(response, 201);
    expect(response.data).toHaveProperty('id');
    expect(response.data.email).toBe(newUser.email);
    expect(response.data.firstName).toBe(newUser.firstName);
    expect(response.data.lastName).toBe(newUser.lastName);
    
    // Store created user ID for cleanup
    testData.saveGeneratedData('createdUserId', response.data.id);
  });

  test('PUT request - update user @api', async ({ apiHelper, testData }) => {
    const user = testData.getUser('valid', 0);
    const updatedData = {
      firstName: 'UpdatedFirstName',
      lastName: 'UpdatedLastName'
    };
    
    // Update user via API
    const response = await apiHelper.put(`/api/users/${user.id}`, updatedData);
    
    // Assertions
    apiHelper.assertStatusCode(response, 200);
    expect(response.data.firstName).toBe(updatedData.firstName);
    expect(response.data.lastName).toBe(updatedData.lastName);
    expect(response.data.email).toBe(user.email); // Should remain unchanged
  });

  test('DELETE request - remove user @api', async ({ apiHelper, testData }) => {
    // First create a user to delete
    const newUser = testData.generateUser();
    const createResponse = await apiHelper.post('/api/users', newUser);
    const userId = createResponse.data.id;
    
    // Delete the user
    const deleteResponse = await apiHelper.delete(`/api/users/${userId}`);
    
    // Assertions
    apiHelper.assertStatusCode(deleteResponse, 204);
    
    // Verify user is deleted by trying to fetch it
    const getResponse = await apiHelper.get(`/api/users/${userId}`);
    apiHelper.assertStatusCode(getResponse, 404);
  });

  test('API authentication - invalid token @security', async ({ apiHelper }) => {
    // Set invalid token
    apiHelper.setBearerToken('invalid-token');
    
    // Try to access protected endpoint
    const response = await apiHelper.get('/api/users');
    
    // Should return unauthorized
    apiHelper.assertStatusCode(response, 401);
    expect(response.data.error).toBe('Unauthorized');
  });

  test('API validation - invalid data @validation', async ({ apiHelper, testData }) => {
    const invalidUser = testData.createInvalidUser();
    
    // Try to create user with invalid data
    const response = await apiHelper.post('/api/users', invalidUser);
    
    // Should return validation error
    apiHelper.assertStatusCode(response, 400);
    expect(response.data).toHaveProperty('errors');
    expect(response.data.errors).toBeInstanceOf(Array);
    expect(response.data.errors.length).toBeGreaterThan(0);
  });

  test('API pagination @api', async ({ apiHelper }) => {
    // Test pagination parameters
    const response = await apiHelper.get('/api/users?page=1&limit=10');
    
    // Assertions
    apiHelper.assertStatusCode(response, 200);
    expect(response.data).toHaveProperty('data');
    expect(response.data).toHaveProperty('pagination');
    expect(response.data.pagination).toHaveProperty('page');
    expect(response.data.pagination).toHaveProperty('limit');
    expect(response.data.pagination).toHaveProperty('total');
    expect(response.data.data.length).toBeLessThanOrEqual(10);
  });

  test('API search functionality @api', async ({ apiHelper, testData }) => {
    const user = testData.getUser('valid', 0);
    
    // Search for user by email
    const response = await apiHelper.get(`/api/users/search?email=${user.email}`);
    
    // Assertions
    apiHelper.assertStatusCode(response, 200);
    expect(response.data).toBeInstanceOf(Array);
    expect(response.data.length).toBeGreaterThan(0);
    
    const foundUser = response.data[0];
    expect(foundUser.email).toBe(user.email);
  });

  test('API response time performance @performance', async ({ apiHelper }) => {
    const startTime = Date.now();
    
    // Make API request
    const response = await apiHelper.get('/api/users');
    
    const responseTime = Date.now() - startTime;
    
    // Assertions
    apiHelper.assertStatusCode(response, 200);
    expect(responseTime).toBeLessThan(2000); // Should respond within 2 seconds
    
    console.log(`API response time: ${responseTime}ms`);
  });

  test('API load testing @performance', async ({ apiHelper }) => {
    // Perform multiple concurrent requests
    const promises = [];
    const numberOfRequests = 10;
    
    for (let i = 0; i < numberOfRequests; i++) {
      promises.push(apiHelper.get('/api/users'));
    }
    
    const startTime = Date.now();
    const responses = await Promise.all(promises);
    const totalTime = Date.now() - startTime;
    
    // Assertions
    responses.forEach(response => {
      apiHelper.assertStatusCode(response, 200);
    });
    
    const avgResponseTime = totalTime / numberOfRequests;
    expect(avgResponseTime).toBeLessThan(1000); // Average should be under 1 second
    
    console.log(`Load test completed: ${numberOfRequests} requests in ${totalTime}ms`);
    console.log(`Average response time: ${avgResponseTime}ms`);
  });

  test('API content type validation @api', async ({ apiHelper, testData }) => {
    const user = testData.generateUser();
    
    // Send request with XML content type
    const response = await apiHelper.post('/api/users', user, {
      headers: {
        'Content-Type': 'application/xml'
      }
    });
    
    // Should reject non-JSON content
    apiHelper.assertStatusCode(response, 400);
    expect(response.data.error).toContain('Content-Type');
  });

  test('API rate limiting @security', async ({ apiHelper }) => {
    const promises = [];
    const numberOfRequests = 100; // Exceed rate limit
    
    // Make many requests quickly
    for (let i = 0; i < numberOfRequests; i++) {
      promises.push(apiHelper.get('/api/users'));
    }
    
    const responses = await Promise.all(promises.map(p => p.catch(e => e)));
    
    // Some requests should be rate limited
    const rateLimitedResponses = responses.filter(r => r.status === 429);
    expect(rateLimitedResponses.length).toBeGreaterThan(0);
  });

  test('API error handling @error', async ({ apiHelper }) => {
    // Test various error scenarios
    
    // 404 - Not found
    const notFoundResponse = await apiHelper.get('/api/users/999999');
    apiHelper.assertStatusCode(notFoundResponse, 404);
    
    // 405 - Method not allowed
    const methodNotAllowedResponse = await apiHelper.patch('/api/users');
    apiHelper.assertStatusCode(methodNotAllowedResponse, 405);
  });

  test('API data consistency @regression', async ({ apiHelper, testData }) => {
    const user = testData.generateUser();
    
    // Create user
    const createResponse = await apiHelper.post('/api/users', user);
    const userId = createResponse.data.id;
    
    // Fetch user
    const getResponse = await apiHelper.get(`/api/users/${userId}`);
    
    // Data should be consistent
    expect(getResponse.data.email).toBe(user.email);
    expect(getResponse.data.firstName).toBe(user.firstName);
    expect(getResponse.data.lastName).toBe(user.lastName);
    
    // Update user
    const updatedData = { firstName: 'NewFirstName' };
    const updateResponse = await apiHelper.put(`/api/users/${userId}`, updatedData);
    
    // Fetch again to verify update
    const getUpdatedResponse = await apiHelper.get(`/api/users/${userId}`);
    expect(getUpdatedResponse.data.firstName).toBe(updatedData.firstName);
  });

  test('API file upload @api', async ({ apiHelper, fileOperations }) => {
    // Create a test file
    const filePath = await fileOperations.createTestFile('test-avatar.jpg', 'fake-image-content');
    
    // Upload file via API
    const response = await apiHelper.uploadFile('/api/upload/avatar', filePath, 'avatar');
    
    // Assertions
    apiHelper.assertStatusCode(response, 200);
    expect(response.data).toHaveProperty('filename');
    expect(response.data).toHaveProperty('url');
  });

  test('API response schema validation @api', async ({ apiHelper }) => {
    const response = await apiHelper.get('/api/users');
    
    // Define expected schema
    const userSchema = {
      id: 'string',
      email: 'string',
      firstName: 'string',
      lastName: 'string',
      role: 'string',
      isActive: 'boolean'
    };
    
    // Validate schema
    apiHelper.assertStatusCode(response, 200);
    apiHelper.assertResponseSchema(response, userSchema);
  });

  test('API with custom headers @api', async ({ apiHelper }) => {
    // Set custom headers
    const response = await apiHelper.get('/api/users', {
      headers: {
        'X-Client-Version': '1.0.0',
        'X-Request-ID': 'test-request-123'
      }
    });
    
    // Assertions
    apiHelper.assertStatusCode(response, 200);
    
    // Check if custom headers were processed (this depends on your API)
    expect(response.headers).toHaveProperty('x-response-id');
  });

  test('API cors headers @security', async ({ apiHelper }) => {
    const response = await apiHelper.get('/api/users');
    
    // Check CORS headers
    expect(response.headers).toHaveProperty('access-control-allow-origin');
    expect(response.headers).toHaveProperty('access-control-allow-methods');
    expect(response.headers).toHaveProperty('access-control-allow-headers');
  });
});