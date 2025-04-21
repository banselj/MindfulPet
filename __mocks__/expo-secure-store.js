module.exports = {
  setItemAsync: jest.fn(async (key, value, options) => undefined),
  getItemAsync: jest.fn(async (key, options) => null),
  deleteItemAsync: jest.fn(async (key, options) => undefined),
  isAvailableAsync: jest.fn(async () => true),
};
