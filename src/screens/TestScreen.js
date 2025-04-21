import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AuthTest } from '../components/auth/AuthTest';

export const TestScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to MindfulPals</Text>
      <AuthTest />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
  },
});
