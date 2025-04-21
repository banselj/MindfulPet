const getItem = jest.fn(async (key) => null);
getItem.mockResolvedValue = (...args) => getItem.mockImplementation(async () => args[0]);
getItem.mockRejectedValue = (...args) => getItem.mockImplementation(async () => { throw args[0]; });

const setItem = jest.fn(async (key, value) => undefined);
setItem.mockResolvedValue = (...args) => setItem.mockImplementation(async () => args[0]);
setItem.mockRejectedValue = (...args) => setItem.mockImplementation(async () => { throw args[0]; });

const removeItem = jest.fn(async (key) => undefined);
removeItem.mockResolvedValue = (...args) => removeItem.mockImplementation(async () => args[0]);
removeItem.mockRejectedValue = (...args) => removeItem.mockImplementation(async () => { throw args[0]; });

const clear = jest.fn(async () => undefined);
clear.mockResolvedValue = (...args) => clear.mockImplementation(async () => args[0]);
clear.mockRejectedValue = (...args) => clear.mockImplementation(async () => { throw args[0]; });

module.exports = {
  getItem,
  setItem,
  removeItem,
  clear,
};
