module.exports = {
  load: jest.fn(async () => ({ estimateFaces: jest.fn(async () => [{ landmarks: [] }]) })),
};
