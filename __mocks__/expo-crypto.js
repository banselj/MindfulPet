module.exports = {
  digestStringAsync: jest.fn(async (algorithm, data, options) => 'mocked_digest'),
};
