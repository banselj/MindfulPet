import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import * as LocalAuthentication from 'expo-local-authentication';
import LottieView from 'lottie-react-native';
import { QuantumAuth } from '../../security/quantumAuth';
import { QuantumSecurityError } from '../../security/types';
import type { StackScreenProps } from '@react-navigation/stack';

interface LoginScreenProps extends StackScreenProps<any, any> {}

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }: LoginScreenProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [quantumReadiness, setQuantumReadiness] = useState(0);
  const quantumAnimation = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    checkBiometricSupport();
    animateQuantumReadiness();
  }, []);

  const checkBiometricSupport = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    setBiometricSupported(compatible);
  };

  const animateQuantumReadiness = () => {
    Animated.sequence([
      Animated.timing(quantumAnimation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true
      }),
      Animated.timing(quantumAnimation, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true
      })
    ]).start(() => {
      setQuantumReadiness(prev => Math.min(100, prev + 20));
      if (quantumReadiness < 100) {
        animateQuantumReadiness();
      }
    });
  };

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError('');

      if (!username || !password) {
        throw new Error('Please enter both username and password');
      }

      const auth = QuantumAuth.getInstance();
      
      // Initialize quantum authentication
      let biometricData;
      if (biometricSupported) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Authenticate to enhance quantum security',
          disableDeviceFallback: false
        });
        
        if (result.success) {
          // Convert biometric result to quantum-compatible format
          biometricData = new Float32Array(
            Buffer.from(JSON.stringify(result)).buffer
          );
        }
      }

      // Attempt login with quantum security
      const success = await auth.login(username, password, biometricData);

      if (success) {
        navigation.replace('Home');
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error: any) {
      if (error instanceof QuantumSecurityError) {
        if (error.code === 'ACCOUNT_LOCKED') {
          const minutes = Math.ceil((error as any)?.metadata?.remainingTime / 60000);
          setError(`Account locked. Try again in ${minutes} minutes`);
        } else {
          setError('Security error: ' + error.message);
        }
      } else {
        setError((error as any)?.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => {
    navigation.navigate('Register');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient
        colors={['#1a237e', '#0d47a1', '#01579b']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {/* Quantum Security Animation */}
          <View style={styles.quantumContainer}>
            <LottieView
              source={require('../../assets/animations/quantum-security.json')}
              autoPlay
              loop
              style={styles.quantumAnimation}
            />
            <Animated.View style={[
              styles.quantumOverlay,
              {
                opacity: quantumAnimation,
                transform: [{
                  scale: quantumAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.2]
                  })
                }]
              }
            ]} />
            <Text style={styles.quantumText}>
              Quantum Security: {quantumReadiness}%
            </Text>
          </View>

          {/* Login Form */}
          <View style={styles.form}>
            <TextInput
              label="Username"
              value={username}
              onChangeText={setUsername}
              style={styles.input}
              mode="outlined"
              autoCapitalize="none"
              disabled={loading}
              left={<TextInput.Icon name="account" />}
            />

            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
              mode="outlined"
              disabled={loading}
              left={<TextInput.Icon name="lock" />}
            />

            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={loading}
              disabled={loading || quantumReadiness < 100}
              style={styles.loginButton}
            >
              {loading ? 'Quantum Authentication...' : 'Login'}
            </Button>

            {biometricSupported && (
              <TouchableOpacity
                style={styles.biometricButton}
                onPress={handleLogin}
                disabled={loading}
              >
                <Text style={styles.biometricText}>
                  Use Biometric Authentication
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.registerButton}
              onPress={handleRegister}
              disabled={loading}
            >
              <Text style={styles.registerText}>
                New user? Register with quantum protection
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  gradient: {
    flex: 1
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center'
  },
  quantumContainer: {
    alignItems: 'center',
    marginBottom: 40
  },
  quantumAnimation: {
    width: 200,
    height: 200
  },
  quantumOverlay: {
    position: 'absolute',
    width: 200,
    height: 200,
    backgroundColor: 'rgba(25, 118, 210, 0.1)',
    borderRadius: 100
  },
  quantumText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
    fontWeight: 'bold'
  },
  form: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84
  },
  input: {
    marginBottom: 15,
    backgroundColor: '#fff'
  },
  errorText: {
    color: '#f44336',
    marginBottom: 15,
    textAlign: 'center'
  },
  loginButton: {
    marginTop: 10,
    marginBottom: 15,
    paddingVertical: 8,
    backgroundColor: '#1976d2'
  },
  biometricButton: {
    alignItems: 'center',
    marginBottom: 15
  },
  biometricText: {
    color: '#1976d2',
    fontSize: 16
  },
  registerButton: {
    alignItems: 'center'
  },
  registerText: {
    color: '#1976d2',
    fontSize: 14
  }
});

export default LoginScreen;
