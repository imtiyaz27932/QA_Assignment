const axios = require('axios');
const logger = require('./logger');

class APIHelper {
  constructor(baseURL = null, defaultHeaders = {}) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...defaultHeaders
    };
    this.interceptors = [];
    this.lastResponse = null;
    this.lastRequest = null;
  }

  // Setup axios instance
  createInstance() {
    const instance = axios.create({
      baseURL: this.baseURL,
      headers: this.defaultHeaders,
      timeout: 30000,
      validateStatus: function (status) {
        return status >= 200 && status < 600; // Don't throw on any status
      }
    });

    // Add request interceptor
    instance.interceptors.request.use(
      (config) => {
        this.lastRequest = {
          url: config.url,
          method: config.method.toUpperCase(),
          headers: config.headers,
          data: config.data,
          timestamp: new Date().toISOString()
        };
        logger.info(`API Request: ${config.method.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor
    instance.interceptors.response.use(
      (response) => {
        this.lastResponse = {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          data: response.data,
          responseTime: response.config.metadata?.endTime - response.config.metadata?.startTime,
          timestamp: new Date().toISOString()
        };
        logger.info(`API Response: ${response.status} ${response.statusText}`);
        return response;
      },
      (error) => {
        logger.error('Response interceptor error:', error);
        return Promise.reject(error);
      }
    );

    return instance;
  }

  // HTTP Methods
  async get(url, config = {}) {
    const instance = this.createInstance();
    try {
      const response = await instance.get(url, config);
      return this.formatResponse(response);
    } catch (error) {
      throw this.formatError(error);
    }
  }

  async post(url, data = {}, config = {}) {
    const instance = this.createInstance();
    try {
      const response = await instance.post(url, data, config);
      return this.formatResponse(response);
    } catch (error) {
      throw this.formatError(error);
    }
  }

  async put(url, data = {}, config = {}) {
    const instance = this.createInstance();
    try {
      const response = await instance.put(url, data, config);
      return this.formatResponse(response);
    } catch (error) {
      throw this.formatError(error);
    }
  }

  async patch(url, data = {}, config = {}) {
    const instance = this.createInstance();
    try {
      const response = await instance.patch(url, data, config);
      return this.formatResponse(response);
    } catch (error) {
      throw this.formatError(error);
    }
  }

  async delete(url, config = {}) {
    const instance = this.createInstance();
    try {
      const response = await instance.delete(url, config);
      return this.formatResponse(response);
    } catch (error) {
      throw this.formatError(error);
    }
  }

  // Upload file
  async uploadFile(url, filePath, fieldName = 'file', additionalData = {}) {
    const FormData = require('form-data');
    const fs = require('fs');
    
    const formData = new FormData();
    formData.append(fieldName, fs.createReadStream(filePath));
    
    // Add additional form data
    Object.keys(additionalData).forEach(key => {
      formData.append(key, additionalData[key]);
    });

    const instance = this.createInstance();
    try {
      const response = await instance.post(url, formData, {
        headers: {
          ...formData.getHeaders()
        }
      });
      return this.formatResponse(response);
    } catch (error) {
      throw this.formatError(error);
    }
  }

  // Authentication helpers
  setBearerToken(token) {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
    logger.info('Bearer token set for API requests');
  }

  setBasicAuth(username, password) {
    const credentials = Buffer.from(`${username}:${password}`).toString('base64');
    this.defaultHeaders['Authorization'] = `Basic ${credentials}`;
    logger.info('Basic auth credentials set for API requests');
  }

  setApiKey(key, value, location = 'header') {
    if (location === 'header') {
      this.defaultHeaders[key] = value;
    }
    logger.info(`API key set in ${location}: ${key}`);
  }

  clearAuth() {
    delete this.defaultHeaders['Authorization'];
    logger.info('Authentication cleared');
  }

  // Response formatting
  formatResponse(response) {
    return {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data,
      config: response.config,
      request: this.lastRequest,
      success: response.status >= 200 && response.status < 300
    };
  }

  formatError(error) {
    const errorDetails = {
      message: error.message,
      request: this.lastRequest,
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        headers: error.response.headers,
        data: error.response.data
      } : null,
      code: error.code,
      timestamp: new Date().toISOString()
    };
    
    logger.error('API Error:', errorDetails);
    return errorDetails;
  }

  // Assertion helpers
  assertStatusCode(response, expectedStatus) {
    if (response.status !== expectedStatus) {
      throw new Error(`Expected status ${expectedStatus} but got ${response.status}`);
    }
    logger.info(`✅ Status code assertion passed: ${expectedStatus}`);
  }

  assertResponseTime(response, maxTime) {
    if (response.responseTime > maxTime) {
      throw new Error(`Response time ${response.responseTime}ms exceeded maximum ${maxTime}ms`);
    }
    logger.info(`✅ Response time assertion passed: ${response.responseTime}ms <= ${maxTime}ms`);
  }

  assertResponseBodyContains(response, expectedValue, path = null) {
    const body = response.data;
    let actualValue = body;
    
    if (path) {
      actualValue = this.getValueByPath(body, path);
    }
    
    const contains = typeof actualValue === 'string' 
      ? actualValue.includes(expectedValue)
      : JSON.stringify(actualValue).includes(JSON.stringify(expectedValue));
      
    if (!contains) {
      throw new Error(`Response body does not contain expected value: ${expectedValue}`);
    }
    logger.info(`✅ Response body contains assertion passed`);
  }

  assertResponseBodyEquals(response, expectedValue, path = null) {
    const body = response.data;
    let actualValue = body;
    
    if (path) {
      actualValue = this.getValueByPath(body, path);
    }
    
    if (JSON.stringify(actualValue) !== JSON.stringify(expectedValue)) {
      throw new Error(`Response body does not equal expected value. Expected: ${JSON.stringify(expectedValue)}, Actual: ${JSON.stringify(actualValue)}`);
    }
    logger.info(`✅ Response body equals assertion passed`);
  }

  assertResponseSchema(response, schema) {
    // Basic schema validation - can be enhanced with libraries like Joi or AJV
    const body = response.data;
    const isValid = this.validateSchema(body, schema);
    
    if (!isValid) {
      throw new Error(`Response does not match expected schema`);
    }
    logger.info(`✅ Response schema assertion passed`);
  }

  // Utility methods
  getValueByPath(obj, path) {
    return path.split('.').reduce((current, key) => current && current[key], obj);
  }

  validateSchema(data, schema) {
    // Simple schema validation - implement as needed
    try {
      // This is a basic implementation, consider using a proper schema validation library
      for (const key in schema) {
        if (schema.hasOwnProperty(key)) {
          if (typeof data[key] !== schema[key]) {
            return false;
          }
        }
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  // Performance testing helpers
  async performanceTest(url, method = 'GET', data = null, iterations = 10) {
    const results = [];
    
    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      
      try {
        let response;
        switch (method.toUpperCase()) {
          case 'GET':
            response = await this.get(url);
            break;
          case 'POST':
            response = await this.post(url, data);
            break;
          case 'PUT':
            response = await this.put(url, data);
            break;
          case 'DELETE':
            response = await this.delete(url);
            break;
          default:
            throw new Error(`Unsupported method: ${method}`);
        }
        
        const endTime = Date.now();
        results.push({
          iteration: i + 1,
          responseTime: endTime - startTime,
          status: response.status,
          success: response.success
        });
        
      } catch (error) {
        const endTime = Date.now();
        results.push({
          iteration: i + 1,
          responseTime: endTime - startTime,
          status: error.response?.status || 0,
          success: false,
          error: error.message
        });
      }
    }
    
    const stats = this.calculateStats(results);
    logger.info('Performance test results:', stats);
    return { results, stats };
  }

  calculateStats(results) {
    const responseTimes = results.map(r => r.responseTime);
    const successCount = results.filter(r => r.success).length;
    
    return {
      totalRequests: results.length,
      successfulRequests: successCount,
      failedRequests: results.length - successCount,
      successRate: (successCount / results.length) * 100,
      avgResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      minResponseTime: Math.min(...responseTimes),
      maxResponseTime: Math.max(...responseTimes),
      medianResponseTime: this.median(responseTimes)
    };
  }

  median(arr) {
    const sorted = arr.slice().sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 
      ? (sorted[middle - 1] + sorted[middle]) / 2 
      : sorted[middle];
  }

  // Data generation helpers
  generateTestData(template) {
    const { faker } = require('@faker-js/faker');
    const data = {};
    
    for (const [key, type] of Object.entries(template)) {
      switch (type) {
        case 'email':
          data[key] = faker.internet.email();
          break;
        case 'name':
          data[key] = faker.person.fullName();
          break;
        case 'phone':
          data[key] = faker.phone.number();
          break;
        case 'address':
          data[key] = faker.location.streetAddress();
          break;
        case 'company':
          data[key] = faker.company.name();
          break;
        case 'uuid':
          data[key] = faker.string.uuid();
          break;
        case 'number':
          data[key] = faker.number.int({ min: 1, max: 1000 });
          break;
        case 'boolean':
          data[key] = faker.datatype.boolean();
          break;
        case 'date':
          data[key] = faker.date.future().toISOString();
          break;
        default:
          data[key] = faker.lorem.word();
      }
    }
    
    return data;
  }

  // Cookie and session management
  setCookie(name, value, options = {}) {
    // Implementation depends on the testing context
    logger.info(`Setting cookie: ${name} = ${value}`);
  }

  getCookie(name) {
    // Implementation depends on the testing context
    logger.info(`Getting cookie: ${name}`);
  }

  clearCookies() {
    // Implementation depends on the testing context
    logger.info('Clearing all cookies');
  }
}

module.exports = APIHelper;