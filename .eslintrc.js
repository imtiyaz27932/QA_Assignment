module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  globals: {
    'test': 'readonly',
    'expect': 'readonly',
    'describe': 'readonly',
    'beforeEach': 'readonly',
    'afterEach': 'readonly',
    'beforeAll': 'readonly',
    'afterAll': 'readonly',
  },
  rules: {
    'indent': ['error', 2],
    'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
    'no-console': 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-arrow-callback': 'error',
    'arrow-spacing': 'error',
    'no-trailing-spaces': 'error',
    'comma-dangle': ['error', 'never'],
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],
    'space-before-blocks': 'error',
    'keyword-spacing': 'error',
    'space-infix-ops': 'error',
    'eol-last': 'error',
    'no-multiple-empty-lines': ['error', { 'max': 2 }],
    'max-len': ['error', { 'code': 120, 'ignoreUrls': true, 'ignoreStrings': true }],
    'camelcase': ['error', { 'properties': 'never' }],
    'no-magic-numbers': ['warn', { 'ignore': [0, 1, -1], 'ignoreArrayIndexes': true }]
  },
  overrides: [
    {
      files: ['tests/**/*.spec.js', 'tests/**/*.test.js'],
      rules: {
        'no-magic-numbers': 'off',
        'max-len': ['error', { 'code': 150 }]
      }
    }
  ]
};