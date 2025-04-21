import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Animated,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { Text, TextInput, Button, ProgressBar } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import * as LocalAuthentication from 'expo-local-authentication';
import LottieView from 'lottie-react-native';
import { QuantumAuth } from '../../security/quantumAuth';
import { QuantumSecurityError } from '../../security/types';
import zxcvbn from 'zxcvbn';
// @ts-ignore: zxcvbn type declaration


const RegisterScreen = ({ navigation }: { navigation: any }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [quantumEntropy, setQuantumEntropy] = useState(0);
  const entropyAnimation = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    checkBiometricSupport();
    startEntropyCollection();
  }, []);

  useEffect(() => {
    if (formData.password) {
      const result = zxcvbn(formData.password);
      setPasswordStrength(result.score / 4);
    } else {
      setPasswordStrength(0);
    }
  }, [formData.password]);

  const checkBiometricSupport = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    setBiometricSupported(compatible);
  };

  const startEntropyCollection = () => {
    // Simulate quantum entropy collection
    const interval = setInterval(() => {
      setQuantumEntropy(prev => {
        const next = Math.min(1, prev + 0.1);
        if (next >= 1) clearInterval(interval);
        return next;
      });
    }, 500);

    // Animate entropy collection visualization
    Animated.loop(
      Animated.sequence([
        Animated.timing(entropyAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true
        }),
        Animated.timing(entropyAnimation, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true
        })
      ])
    ).start();
  };

  const validateForm = () => {
    if (!formData.username || !formData.password || !formData.email) {
      throw new Error('All fields are required');
    }

    if (formData.password !== formData.confirmPassword) {
      throw new Error('Passwords do not match');
    }

    if (passwordStrength < 0.6) {
      throw new Error('Password is not strong enough');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      throw new Error('Invalid email format');
    }
  };

  const handleRegister = async () => {
    try {
      setLoading(true);
      setError('');

      // Validate form
      validateForm();

      // Check quantum entropy
      if (quantumEntropy < 1) {
        throw new Error('Collecting quantum entropy... Please wait');
      }

      const auth = QuantumAuth.getInstance();
      
      // Get biometric data if supported
      let biometricData;
      if (biometricSupported) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Set up biometric authentication',
          disableDeviceFallback: false
        });
        
        if (result.success) {
          biometricData = new Float64Array(
            Buffer.from(JSON.stringify(result)).buffer
          );
        }
      }

      // Register user with quantum protection
      const userId = await auth.register(
        formData.username,
        formData.password,
        biometricData
      );

      // Navigate to success screen
      navigation.replace('RegistrationSuccess', { userId });
    } catch (error: any) {
      if (error instanceof QuantumSecurityError) {
        setError('Security error: ' + (error as any)?.message);
      } else {
        setError((error as any)?.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 0.25) return '#f44336';
    if (passwordStrength <= 0.5) return '#ff9800';
    if (passwordStrength <= 0.75) return '#fdd835';
    return '#4caf50';
  };

  const getPasswordStrengthLabel = () => {
    if (passwordStrength <= 0.25) return 'Weak';
    if (passwordStrength <= 0.5) return 'Fair';
    if (passwordStrength <= 0.75) return 'Good';
    return 'Strong';
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
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Quantum Entropy Visualization */}
          <View style={styles.entropyContainer}>
            <LottieView
              source={require('../../assets/animations/quantum-particles.json')}
              autoPlay
              loop
              style={styles.entropyAnimation}
            />
            <Animated.View style={[
              styles.entropyOverlay,
              {
                opacity: entropyAnimation,
                transform: [{
                  scale: entropyAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.2]
                  })
                }]
              }
            ]} />
            <Text style={styles.entropyText}>
              Quantum Entropy: {Math.round(quantumEntropy * 100)}%
            </Text>
          </View>

          {/* Registration Form */}
          <View style={styles.form}>
            <TextInput
              label="Username"
              value={formData.username}
              onChangeText={(text: string) => setFormData(prev => ({ ...prev, username: text }))}
              style={styles.input}
              mode="outlined"
              autoCapitalize="none"
              disabled={loading}
              left={<TextInput.Icon name="account" />}
            />

            <TextInput
              label="Email"
              value={formData.email}
              onChangeText={(text: string) => setFormData(prev => ({ ...prev, email: text }))}
              style={styles.input}
              mode="outlined"
              autoCapitalize="none"
              keyboardType="email-address"
              disabled={loading}
              left={<TextInput.Icon name="email" />}
            />

            <TextInput
              label="Password"
              value={formData.password}
              onChangeText={(text: string) => setFormData(prev => ({ ...prev, password: text }))}
              secureTextEntry
              style={styles.input}
              mode="outlined"
              disabled={loading}
              left={<TextInput.Icon name="lock" />}
            />

            {/* Password Strength Indicator */}
            <View style={styles.strengthContainer}>
              <ProgressBar
                progress={passwordStrength}
                color={getPasswordStrengthColor()}
                style={styles.strengthBar}
              />
              <Text style={[
                styles.strengthText,
                { color: getPasswordStrengthColor() }
              ]}>
                {getPasswordStrengthLabel()}
              </Text>
            </View>

            <TextInput
              label="Confirm Password"
              value={formData.confirmPassword}
              onChangeText={(text: string) => setFormData(prev => ({ ...prev, confirmPassword: text }))}
              secureTextEntry
              style={styles.input}
              mode="outlined"
              disabled={loading}
              left={<TextInput.Icon name="lock-check" />}
            />

            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}

            <Button
              mode="contained"
              onPress={handleRegister}
              loading={loading}
              disabled={loading || quantumEntropy < 1}
              style={styles.registerButton}
            >
              {loading ? 'Creating Quantum Identity...' : 'Register'}
            </Button>

            {biometricSupported && (
              <Text style={styles.biometricText}>
                ✓ Biometric authentication available
              </Text>
            )}
          </View>
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center'
  },
  entropyContainer: {
    alignItems: 'center',
    marginBottom: 30
  },
  entropyAnimation: {
    width: 150,
    height: 150
  },
  entropyOverlay: {
    position: 'absolute',
    width: 150,
    height: 150,
    backgroundColor: 'rgba(25, 118, 210, 0.1)',
    borderRadius: 75
  },
  entropyText: {
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
  strengthContainer: {
    marginBottom: 15
  },
  strengthBar: {
    height: 4,
    borderRadius: 2
  },
  strengthText: {
    fontSize: 12,
    marginTop: 5,
    textAlign: 'right'
  },
  errorText: {
    color: '#f44336',
    marginBottom: 15,
    textAlign: 'center'
  },
  registerButton: {
    marginTop: 10,
    marginBottom: 15,
    paddingVertical: 8,
    backgroundColor: '#1976d2'
  },
  biometricText: {
    color: '#4caf50',
    fontSize: 14,
    textAlign: 'center'
  }
});

export default RegisterScreen;
