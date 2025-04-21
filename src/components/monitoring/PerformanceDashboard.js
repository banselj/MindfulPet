import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import RealTimeMonitoring from '../../utils/realTimeMonitoring';

const PerformanceDashboard = () => {
  const [metrics, setMetrics] = useState({
    memoryUsage: 0,
    cpuUsage: 0,
    fps: 0
  });

  useEffect(() => {
    let mounted = true;
    
    const updateMetrics = () => {
      try {
        if (!mounted) return;
        const currentMetrics = RealTimeMonitoring.getMetrics();
        setMetrics(currentMetrics);
      } catch (error) {
        console.error('Error updating metrics:', error);
      }
    };

    // Initial update
    updateMetrics();

    // Update metrics every second
    const interval = setInterval(updateMetrics, 1000);

    // Cleanup function
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Performance Metrics</Text>
      <View style={styles.metricsContainer}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Memory Usage:</Text>
          <Text style={styles.metricValue}>{(metrics.memoryUsage || 0).toFixed(2)} MB</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>CPU Usage:</Text>
          <Text style={styles.metricValue}>{(metrics.cpuUsage || 0).toFixed(2)}%</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>FPS:</Text>
          <Text style={styles.metricValue}>{(metrics.fps || 0).toFixed(1)}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  metricsContainer: {
    gap: 10,
  },
  metricItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  metricLabel: {
    fontSize: 16,
    color: '#666',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196F3',
  },
});

export default PerformanceDashboard;
