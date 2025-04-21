module.exports = {
  collection: jest.fn(() => ({
    doc: jest.fn(() => ({
      get: jest.fn(async () => ({ exists: true, data: () => ({}) })),
      set: jest.fn(async () => undefined),
      update: jest.fn(async () => undefined),
      delete: jest.fn(async () => undefined),
    })),
    add: jest.fn(async () => ({ id: 'mock-id' })),
    get: jest.fn(async () => ({ docs: [] })),
  })),
};
