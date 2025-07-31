// Global test setup file
// This file is executed before all tests

// Mock console.log during tests to keep output clean
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Set test timeout
jest.setTimeout(10000);
