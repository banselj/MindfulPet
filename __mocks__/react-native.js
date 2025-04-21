const ReactNative = jest.requireActual('react-native');

module.exports = {
  ...ReactNative,
  DeviceEventEmitter: {
    emit: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
  },
  NativeModules: {
    ...ReactNative.NativeModules,
    NativeAnimatedModule: {
      startOperationBatch: jest.fn(),
      finishOperationBatch: jest.fn(),
      createAnimatedNode: jest.fn(),
      getValue: jest.fn(),
      connectAnimatedNodes: jest.fn(),
      disconnectAnimatedNodes: jest.fn(),
      startListeningToAnimatedNodeValue: jest.fn(),
      stopListeningToAnimatedNodeValue: jest.fn(),
      connectAnimatedNodeToView: jest.fn(),
      disconnectAnimatedNodeFromView: jest.fn(),
      dropAnimatedNode: jest.fn(),
      setAnimatedNodeValue: jest.fn(),
      setAnimatedNodeOffset: jest.fn(),
      flattenAnimatedNodeOffset: jest.fn(),
      extractAnimatedNodeOffset: jest.fn(),
      addAnimatedEventToView: jest.fn(),
      removeAnimatedEventFromView: jest.fn(),
    },
  },
  Platform: {
    ...ReactNative.Platform,
    OS: 'ios',
    select: jest.fn(obj => obj.ios),
  },
  Animated: {
    ...ReactNative.Animated,
    timing: jest.fn(() => ({
      start: jest.fn(cb => cb && cb({ finished: true })),
    })),
    spring: jest.fn(() => ({
      start: jest.fn(cb => cb && cb({ finished: true })),
    })),
  },
};
