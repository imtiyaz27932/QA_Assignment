const fs = require('fs');
const path = require('path');
const { faker } = require('@faker-js/faker');
const _ = require('lodash');
const logger = require('./logger');

class TestDataManager {
  constructor() {
    this.testDataPath = path.join(process.cwd(), 'testData');
    this.cache = new Map();
    this.generatedData = new Map();
  }

  // Load test data from JSON files
  loadTestData(fileName) {
    const cacheKey = fileName;
    
    if (this.cache.has(cacheKey)) {
      logger.info(`Loading test data from cache: ${fileName}`);
      return this.cache.get(cacheKey);
    }

    try {
      const filePath = path.join(this.testDataPath, `${fileName}.json`);
      if (!fs.existsSync(filePath)) {
        throw new Error(`Test data file not found: ${filePath}`);
      }

      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      this.cache.set(cacheKey, data);
      logger.info(`Loaded test data: ${fileName}`);
      return data;
    } catch (error) {
      logger.error(`Error loading test data ${fileName}:`, error);
      throw error;
    }
  }

  // Get specific test data
  getUser(type = 'valid', index = 0) {
    const users = this.loadTestData('users');
    const userType = type === 'valid' ? 'validUsers' : 
                    type === 'invalid' ? 'invalidUsers' :
                    type === 'test' ? 'testUsers' : 
                    type === 'bulk' ? 'bulkUsers' : 'validUsers';
    
    if (!users[userType] || users[userType].length === 0) {
      throw new Error(`No ${type} users found in test data`);
    }

    if (index >= users[userType].length) {
      throw new Error(`User index ${index} out of range for ${type} users`);
    }

    return _.cloneDeep(users[userType][index]);
  }

  getProduct(type = 'valid', index = 0) {
    const products = this.loadTestData('products');
    const productType = type === 'valid' ? 'validProducts' : 
                       type === 'outOfStock' ? 'outOfStockProducts' :
                       type === 'discounted' ? 'discountedProducts' :
                       type === 'bulk' ? 'bulkProducts' : 'validProducts';
    
    if (!products[productType] || products[productType].length === 0) {
      throw new Error(`No ${type} products found in test data`);
    }

    if (index >= products[productType].length) {
      throw new Error(`Product index ${index} out of range for ${type} products`);
    }

    return _.cloneDeep(products[productType][index]);
  }

  // Get random test data
  getRandomUser(type = 'valid') {
    const users = this.loadTestData('users');
    const userType = type === 'valid' ? 'validUsers' : 
                    type === 'invalid' ? 'invalidUsers' :
                    type === 'test' ? 'testUsers' : 
                    type === 'bulk' ? 'bulkUsers' : 'validUsers';
    
    if (!users[userType] || users[userType].length === 0) {
      throw new Error(`No ${type} users found in test data`);
    }

    const randomIndex = Math.floor(Math.random() * users[userType].length);
    return _.cloneDeep(users[userType][randomIndex]);
  }

  getRandomProduct(type = 'valid') {
    const products = this.loadTestData('products');
    const productType = type === 'valid' ? 'validProducts' : 
                       type === 'outOfStock' ? 'outOfStockProducts' :
                       type === 'discounted' ? 'discountedProducts' :
                       type === 'bulk' ? 'bulkProducts' : 'validProducts';
    
    if (!products[productType] || products[productType].length === 0) {
      throw new Error(`No ${type} products found in test data`);
    }

    const randomIndex = Math.floor(Math.random() * products[productType].length);
    return _.cloneDeep(products[productType][randomIndex]);
  }

  // Generate dynamic test data using Faker
  generateUser(overrides = {}) {
    const generatedUser = {
      id: faker.string.uuid(),
      email: faker.internet.email(),
      password: faker.internet.password({ length: 12 }),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      phone: faker.phone.number(),
      role: faker.helpers.arrayElement(['user', 'admin', 'manager']),
      isActive: faker.datatype.boolean(),
      dateCreated: faker.date.past().toISOString(),
      profile: {
        bio: faker.lorem.paragraph(),
        location: `${faker.location.city()}, ${faker.location.state()}`,
        website: faker.internet.url(),
        skills: faker.helpers.arrayElements([
          'JavaScript', 'Python', 'React', 'Node.js', 'Docker', 
          'Kubernetes', 'AWS', 'MongoDB', 'PostgreSQL', 'Git'
        ], { min: 2, max: 5 })
      },
      ...overrides
    };

    logger.info(`Generated user: ${generatedUser.email}`);
    return generatedUser;
  }

  generateProduct(overrides = {}) {
    const generatedProduct = {
      id: faker.string.uuid(),
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      price: parseFloat(faker.commerce.price({ min: 10, max: 1000 })),
      category: faker.commerce.department(),
      brand: faker.company.name(),
      sku: faker.string.alphanumeric(8).toUpperCase(),
      inStock: faker.datatype.boolean(),
      quantity: faker.number.int({ min: 0, max: 100 }),
      images: [
        faker.image.url(),
        faker.image.url()
      ],
      specifications: {
        color: faker.color.human(),
        weight: `${faker.number.int({ min: 100, max: 2000 })}g`,
        dimensions: `${faker.number.int({ min: 10, max: 50 })}x${faker.number.int({ min: 10, max: 50 })}x${faker.number.int({ min: 5, max: 20 })}cm`
      },
      tags: faker.helpers.arrayElements([
        'electronics', 'gaming', 'accessories', 'wireless', 'bluetooth',
        'premium', 'budget', 'bestseller', 'new-arrival'
      ], { min: 2, max: 4 }),
      dateAdded: faker.date.past().toISOString(),
      ...overrides
    };

    logger.info(`Generated product: ${generatedProduct.name}`);
    return generatedProduct;
  }

  // Generate bulk test data
  generateUsers(count, overrides = {}) {
    const users = [];
    for (let i = 0; i < count; i++) {
      users.push(this.generateUser(overrides));
    }
    logger.info(`Generated ${count} users`);
    return users;
  }

  generateProducts(count, overrides = {}) {
    const products = [];
    for (let i = 0; i < count; i++) {
      products.push(this.generateProduct(overrides));
    }
    logger.info(`Generated ${count} products`);
    return products;
  }

  // Data manipulation utilities
  modifyUserData(user, modifications) {
    const modifiedUser = _.cloneDeep(user);
    return _.merge(modifiedUser, modifications);
  }

  modifyProductData(product, modifications) {
    const modifiedProduct = _.cloneDeep(product);
    return _.merge(modifiedProduct, modifications);
  }

  // Create invalid data variations
  createInvalidUser(baseUser = null) {
    const user = baseUser || this.getUser('valid', 0);
    
    const invalidVariations = [
      { email: 'invalid-email' },
      { email: '' },
      { password: '' },
      { password: '123' }, // Too short
      { firstName: '' },
      { lastName: '' },
      { phone: 'invalid-phone' },
      { role: 'invalid-role' },
      { email: 'test@' }, // Incomplete email
      { email: '@example.com' }, // Missing username
    ];

    const randomVariation = faker.helpers.arrayElement(invalidVariations);
    return this.modifyUserData(user, randomVariation);
  }

  createInvalidProduct(baseProduct = null) {
    const product = baseProduct || this.getProduct('valid', 0);
    
    const invalidVariations = [
      { name: '' },
      { price: -1 },
      { price: 'invalid-price' },
      { category: '' },
      { quantity: -1 },
      { sku: '' },
      { inStock: 'invalid-boolean' }
    ];

    const randomVariation = faker.helpers.arrayElement(invalidVariations);
    return this.modifyProductData(product, randomVariation);
  }

  // Data persistence
  saveGeneratedData(key, data) {
    this.generatedData.set(key, data);
    logger.info(`Saved generated data with key: ${key}`);
  }

  getGeneratedData(key) {
    if (this.generatedData.has(key)) {
      logger.info(`Retrieved generated data with key: ${key}`);
      return this.generatedData.get(key);
    }
    throw new Error(`No generated data found for key: ${key}`);
  }

  clearGeneratedData(key = null) {
    if (key) {
      this.generatedData.delete(key);
      logger.info(`Cleared generated data for key: ${key}`);
    } else {
      this.generatedData.clear();
      logger.info('Cleared all generated data');
    }
  }

  // Export/Import functionality
  exportTestData(fileName, data) {
    try {
      const filePath = path.join(this.testDataPath, `${fileName}.json`);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      logger.info(`Exported test data to: ${filePath}`);
    } catch (error) {
      logger.error(`Error exporting test data:`, error);
      throw error;
    }
  }

  // Data validation
  validateUserData(user) {
    const requiredFields = ['email', 'password', 'firstName', 'lastName'];
    const missingFields = requiredFields.filter(field => !user[field]);
    
    if (missingFields.length > 0) {
      return {
        valid: false,
        errors: [`Missing required fields: ${missingFields.join(', ')}`]
      };
    }

    const errors = [];
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(user.email)) {
      errors.push('Invalid email format');
    }

    // Password validation
    if (user.password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  validateProductData(product) {
    const requiredFields = ['name', 'price', 'category'];
    const missingFields = requiredFields.filter(field => !product[field]);
    
    if (missingFields.length > 0) {
      return {
        valid: false,
        errors: [`Missing required fields: ${missingFields.join(', ')}`]
      };
    }

    const errors = [];
    
    // Price validation
    if (typeof product.price !== 'number' || product.price < 0) {
      errors.push('Price must be a positive number');
    }

    // Quantity validation
    if (product.quantity !== undefined && (typeof product.quantity !== 'number' || product.quantity < 0)) {
      errors.push('Quantity must be a non-negative number');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Search and filter utilities
  findUserByEmail(email) {
    const users = this.loadTestData('users');
    const allUsers = [
      ...users.validUsers,
      ...users.invalidUsers,
      ...users.testUsers,
      ...users.bulkUsers
    ];
    
    return allUsers.find(user => user.email === email);
  }

  findProductBySku(sku) {
    const products = this.loadTestData('products');
    const allProducts = [
      ...products.validProducts,
      ...products.outOfStockProducts,
      ...products.discountedProducts,
      ...products.bulkProducts
    ];
    
    return allProducts.find(product => product.sku === sku);
  }

  filterProductsByCategory(category) {
    const products = this.loadTestData('products');
    const allProducts = [
      ...products.validProducts,
      ...products.outOfStockProducts,
      ...products.discountedProducts,
      ...products.bulkProducts
    ];
    
    return allProducts.filter(product => 
      product.category && product.category.toLowerCase() === category.toLowerCase()
    );
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
    logger.info('Test data cache cleared');
  }

  // Get all available test data files
  getAvailableDataFiles() {
    try {
      const files = fs.readdirSync(this.testDataPath)
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''));
      
      logger.info(`Available test data files: ${files.join(', ')}`);
      return files;
    } catch (error) {
      logger.error('Error reading test data directory:', error);
      return [];
    }
  }
}

// Export singleton instance
module.exports = new TestDataManager();