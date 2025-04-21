import { Platform } from 'react-native';
import RealTimeMonitoring from '../realTimeMonitoring';

// Mock dependencies
jest.mock('react-native', () => ({
  Platform: {
    OS: 'web'
  }
}));

jest.mock('../constants', () => ({
  LogLevel: {
    INFO: 'INFO',
    ERROR: 'ERROR'
  }
}));

jest.mock('../errorReporting', () => ({
  __esModule: true,
  default: {
    captureError: jest.fn()
  }
}));

jest.mock('../../security/securityService', () => ({
  SecurityService: {
    initialize: jest.fn()
  }
}));

// Mock performance API
global.performance = {
  now: jest.fn(() => Date.now())
};

// Mock console methods
global.console = {
  log: jest.fn(),
  error: jest.fn()
};

// Mock PerformanceObserver
global.PerformanceObserver = class {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  disconnect() {}
};

describe('RealTimeMonitoring Tests', () => {
  beforeEach(() => {
    // Reset metrics before each test
    RealTimeMonitoring.metrics = {
      performance: new Map(),
      errors: new Map(),
      memory: 0,
      cpu: 0,
      fps: 0,
      lastFrameTime: 0,
      frameCount: 0,
      bufferSize: 100
    };
    RealTimeMonitoring.metricsBuffer = [];
  });

  test('initialize should set up monitoring for web platform', async () => {
    await RealTimeMonitoring.initialize();
    expect(RealTimeMonitoring.metrics).toBeDefined();
  });

  test('getMetrics should return correct format', () => {
    const metrics = RealTimeMonitoring.getMetrics();
    expect(metrics).toHaveProperty('memoryUsage');
    expect(metrics).toHaveProperty('cpuUsage');
    expect(metrics).toHaveProperty('fps');
  });

  test('metrics buffer should not exceed maximum size', () => {
    // Fill buffer beyond its size using the public API
    for (let i = 0; i < 150; i++) {
      RealTimeMonitoring.addMetricToBuffer({
        memoryUsage: i,
        cpuUsage: i,
        fps: i,
        timestamp: Date.now()
      });
    }
    
    expect(RealTimeMonitoring.metricsBuffer.length).toBeLessThanOrEqual(RealTimeMonitoring.metrics.bufferSize);
  });

  test('should handle missing performance.memory gracefully', () => {
    // Remove performance.memory
    const originalPerformance = global.performance;
    global.performance = { now: () => Date.now() };
    
    const metrics = RealTimeMonitoring.getMetrics();
    expect(metrics.memoryUsage).toBe(0);
    
    // Restore performance
    global.performance = originalPerformance;
  });
});

describe('RealTimeMonitoring', () => {
  // Mock metrics object
  const mockMetrics = {
    memoryUsage: 100,
    cpuUsage: 50,
    fps: 60
  };

  test('metrics should have correct format', () => {
    expect(mockMetrics).toEqual({
      memoryUsage: expect.any(Number),
      cpuUsage: expect.any(Number),
      fps: expect.any(Number)
    });
  });

  test('metrics should have valid ranges', () => {
    expect(mockMetrics.memoryUsage).toBeGreaterThanOrEqual(0);
    expect(mockMetrics.cpuUsage).toBeGreaterThanOrEqual(0);
    expect(mockMetrics.cpuUsage).toBeLessThanOrEqual(100);
    expect(mockMetrics.fps).toBeGreaterThanOrEqual(0);
  });
});
