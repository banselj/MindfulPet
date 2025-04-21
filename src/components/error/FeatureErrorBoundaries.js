import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ErrorReporting from '../../utils/errorReporting';

class SimpleErrorBoundary extends React.Component {
  state = { 
    hasError: false,
    error: null,
    errorInfo: null
  };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error
    console.error('[MVP] Error caught by boundary:', error);
    
    // Report error to monitoring service
    ErrorReporting.captureError(error, {
      componentStack: errorInfo?.componentStack,
      context: 'SimpleErrorBoundary'
    });

    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          {this.props.fallback || null}
        </View>
      );
    }

    return this.props.children;
  }
}

// HOC to wrap components with error boundary
const withErrorBoundary = (WrappedComponent, componentName = 'Unknown') => {
  return function WithErrorBoundary(props) {
    return (
      <SimpleErrorBoundary>
        <WrappedComponent {...props} />
      </SimpleErrorBoundary>
    );
  };
};

// Pre-configured error boundaries for specific features
const PerformanceErrorBoundary = (props) => (
  <SimpleErrorBoundary>
    {props.children}
  </SimpleErrorBoundary>
);

const styles = StyleSheet.create({
  errorContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  errorTitle: {
    fontSize: 18,
    color: '#d32f2f',
    fontWeight: 'bold',
    marginBottom: 10
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15
  }
});

export {
  SimpleErrorBoundary,
  withErrorBoundary,
  PerformanceErrorBoundary
};
