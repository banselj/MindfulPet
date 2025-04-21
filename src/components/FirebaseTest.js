import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID,
  FIREBASE_MEASUREMENT_ID
} from '@env';

// Initialize Firebase directly in component for testing
const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID,
  measurementId: FIREBASE_MEASUREMENT_ID
};

console.log('Firebase Config:', firebaseConfig); // For debugging

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export const FirebaseTest = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSignUp = async () => {
    try {
      setMessage('Attempting to create user...');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      setMessage('User created successfully: ' + userCredential.user.email);
    } catch (error) {
      setMessage('Error: ' + error.message);
      console.error('Detailed error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Firebase Test</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Button title="Test Sign Up" onPress={handleSignUp} />
      
      <Text style={styles.message}>{message}</Text>
      
      <View style={styles.debugInfo}>
        <Text>Debug Info:</Text>
        <Text>API Key: {FIREBASE_API_KEY ? '✓' : '✗'}</Text>
        <Text>Auth Domain: {FIREBASE_AUTH_DOMAIN ? '✓' : '✗'}</Text>
        <Text>Project ID: {FIREBASE_PROJECT_ID ? '✓' : '✗'}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  message: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f0f0f0',
  },
  debugInfo: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
  },
});
