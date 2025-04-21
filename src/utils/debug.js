import { Platform } from 'react-native';

class DebugUtil {
  static isDebugMode = __DEV__;
  static navigationHistory = [];
  static stateChangeHistory = [];
  static errorLog = [];

  static init() {
    if (!this.isDebugMode) return;

    // Override console methods in development
    if (Platform.OS !== 'web') {
      const originalConsole = { ...console };
      console.warn = (...args) => {
        this.logWarning(...args);
        originalConsole.warn(...args);
      };
      console.error = (...args) => {
        this.logError(...args);
        originalConsole.error(...args);
      };
    }
  }

  static logNavigation(from, to, params) {
    if (!this.isDebugMode) return;

    const navigationEvent = {
      timestamp: new Date().toISOString(),
      from,
      to,
      params,
    };

    this.navigationHistory.push(navigationEvent);
    console.log('Navigation:', navigationEvent);

    // Keep history limited to last 100 events
    if (this.navigationHistory.length > 100) {
      this.navigationHistory.shift();
    }
  }

  static logStateChange(action, prevState, nextState) {
    if (!this.isDebugMode) return;

    const stateChange = {
      timestamp: new Date().toISOString(),
      action,
      changes: this.getStateChanges(prevState, nextState),
    };

    this.stateChangeHistory.push(stateChange);
    console.log('State Change:', stateChange);

    // Keep history limited to last 100 events
    if (this.stateChangeHistory.length > 100) {
      this.stateChangeHistory.shift();
    }
  }

  static logError(error, context = '') {
    const errorEvent = {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : error,
      context,
    };

    this.errorLog.push(errorEvent);
    console.error('Error:', errorEvent);

    // Keep error log limited to last 50 errors
    if (this.errorLog.length > 50) {
      this.errorLog.shift();
    }
  }

  static logWarning(warning, context = '') {
    if (!this.isDebugMode) return;

    console.warn('Warning:', {
      timestamp: new Date().toISOString(),
      warning,
      context,
    });
  }

  static getStateChanges(prevState, nextState) {
    const changes = {};
    
    // Compare each key in the states
    Object.keys(nextState).forEach(key => {
      if (prevState[key] !== nextState[key]) {
        changes[key] = {
          from: prevState[key],
          to: nextState[key],
        };
      }
    });

    return changes;
  }

  static getNavigationHistory() {
    return this.navigationHistory;
  }

  static getStateChangeHistory() {
    return this.stateChangeHistory;
  }

  static getErrorLog() {
    return this.errorLog;
  }

  static clearHistory() {
    this.navigationHistory = [];
    this.stateChangeHistory = [];
    this.errorLog = [];
  }

  static async checkPerformance(operation, context = '') {
    if (!this.isDebugMode) {
      return operation();
    }

    const start = performance.now();
    try {
      const result = await operation();
      const end = performance.now();
      console.log(`Performance [${context}]: ${(end - start).toFixed(2)}ms`);
      return result;
    } catch (error) {
      const end = performance.now();
      console.error(`Performance Error [${context}]: ${(end - start).toFixed(2)}ms`);
      throw error;
    }
  }

  static validateNavigation(from, to, allowedTransitions) {
    if (!this.isDebugMode) return true;

    const isAllowed = allowedTransitions[from]?.includes(to);
    if (!isAllowed) {
      this.logWarning(
        `Invalid navigation attempt from "${from}" to "${to}". This transition is not allowed.`,
        'Navigation Validation'
      );
    }
    return isAllowed;
  }
}

export default DebugUtil;
