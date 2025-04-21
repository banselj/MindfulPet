const ready = jest.fn(async () => undefined);
ready.mockResolvedValue = (...args) => ready.mockImplementation(async () => args[0]);
ready.mockRejectedValue = (...args) => ready.mockImplementation(async () => { throw args[0]; });

const sequential = jest.fn(() => ({
  compile: jest.fn(),
  predict: jest.fn().mockReturnValue({
    data: jest.fn().mockResolvedValue([0.2, 0.3, 0.4, 0.1])
  })
}));
sequential.mockResolvedValue = (...args) => sequential.mockImplementation(async () => args[0]);
sequential.mockRejectedValue = (...args) => sequential.mockImplementation(async () => { throw args[0]; });

const loadLayersModel = jest.fn(async () => ({ predict: jest.fn(() => [0]) }));
loadLayersModel.mockResolvedValue = (...args) => loadLayersModel.mockImplementation(async () => args[0]);
loadLayersModel.mockRejectedValue = (...args) => loadLayersModel.mockImplementation(async () => { throw args[0]; });

const tensor = jest.fn(() => ({}));
tensor.mockResolvedValue = (...args) => tensor.mockImplementation(async () => args[0]);
tensor.mockRejectedValue = (...args) => tensor.mockImplementation(async () => { throw args[0]; });

module.exports = {
  ready,
  sequential,
  loadLayersModel,
  tensor,
};
