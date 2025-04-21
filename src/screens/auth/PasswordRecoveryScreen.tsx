import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Text, TextInput, Button, ProgressBar } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { PasswordRecovery } from '../../security/passwordRecovery';
import { QuantumSecurityError } from '../../security/types';
import zxcvbn from 'zxcvbn';
// @ts-ignore: zxcvbn type declaration


enum RecoveryStep {
  INITIATE,
  VERIFY_TOKEN,
  ANSWER_QUESTIONS,
  RESET_PASSWORD,
  SUCCESS
}

import type { StackScreenProps } from '@react-navigation/stack';

interface PasswordRecoveryScreenProps extends StackScreenProps<any, any> {}

const PasswordRecoveryScreen = ({ navigation }: PasswordRecoveryScreenProps) => {
  const [currentStep, setCurrentStep] = useState(RecoveryStep.INITIATE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    token: '',
    answers: {} as { [key: string]: string },
    newPassword: '',
    confirmPassword: ''
  });
  const [recoveryQuestions, setRecoveryQuestions] = useState<string[]>([]);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [quantumProgress, setQuantumProgress] = useState(0);
  const progressAnimation = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const recovery = PasswordRecovery.getInstance();
    setRecoveryQuestions(recovery.getRecoveryQuestions());
    startQuantumAnimation();
  }, []);

  useEffect(() => {
    if (formData.newPassword) {
      const result = zxcvbn(formData.newPassword);
      setPasswordStrength(result.score / 4);
    }
  }, [formData.newPassword]);

  const startQuantumAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(progressAnimation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true
        }),
        Animated.timing(progressAnimation, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true
        })
      ])
    ).start();

    // Simulate quantum processing
    const interval = setInterval(() => {
      setQuantumProgress(prev => {
        const next = Math.min(1, prev + 0.1);
        if (next >= 1) clearInterval(interval);
        return next;
      });
    }, 500);
  };

  const handleInitiateRecovery = async () => {
    try {
      setLoading(true);
      setError('');

      const recovery = PasswordRecovery.getInstance();
      const token = await recovery.initiateRecovery(
        formData.username,
        formData.email
      );

      setFormData(prev => ({ ...prev, token }));
      setCurrentStep(RecoveryStep.VERIFY_TOKEN);
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

  const handleVerifyToken = async () => {
    try {
      setLoading(true);
      setError('');

      const recovery = PasswordRecovery.getInstance();
      const result = await recovery.verifyRecoveryToken(formData.token);

      if (result.valid) {
        setCurrentStep(RecoveryStep.ANSWER_QUESTIONS);
      } else {
        throw new Error('Invalid or expired recovery token');
      }
    } catch (error: any) {
      setError((error as any)?.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAnswers = async () => {
    try {
      setLoading(true);
      setError('');

      const recovery = PasswordRecovery.getInstance();
      const valid = await recovery.verifyRecoveryAnswers(
        formData.username,
        formData.answers
      );

      if (valid) {
        setCurrentStep(RecoveryStep.RESET_PASSWORD);
      } else {
        throw new Error('Incorrect answers to security questions');
      }
    } catch (error: any) {
      setError((error as any)?.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    try {
      setLoading(true);
      setError('');

      if (formData.newPassword !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (passwordStrength < 0.6) {
        throw new Error('Password is not strong enough');
      }

      const recovery = PasswordRecovery.getInstance();
      const success = await recovery.resetPassword(
        formData.token,
        formData.newPassword,
        formData.answers
      );

      if (success) {
        setCurrentStep(RecoveryStep.SUCCESS);
      } else {
        throw new Error('Failed to reset password');
      }
    } catch (error: any) {
      setError((error as any)?.message);
    } finally {
      setLoading(false);
    }
  };

  const renderInitiateStep = () => (
    <View style={styles.formContainer}>
      <Text style={styles.stepTitle}>Initiate Password Recovery</Text>
      
      <TextInput
        label="Username"
        value={formData.username}
        onChangeText={(text: string) => setFormData(prev => ({ ...prev, username: text }))}
        style={styles.input}
        mode="outlined"
        disabled={loading}
      />

      <TextInput
        label="Email"
        value={formData.email}
        onChangeText={(text: string) => setFormData(prev => ({ ...prev, email: text }))}
        style={styles.input}
        mode="outlined"
        keyboardType="email-address"
        disabled={loading}
      />

      <Button
        mode="contained"
        onPress={handleInitiateRecovery}
        loading={loading}
        disabled={loading || !formData.username || !formData.email}
        style={styles.button}
      >
        Send Recovery Token
      </Button>
    </View>
  );

  const renderVerifyTokenStep = () => (
    <View style={styles.formContainer}>
      <Text style={styles.stepTitle}>Verify Recovery Token</Text>
      
      <Text style={styles.instruction}>
        Please check your email for the recovery token and enter it below.
      </Text>

      <TextInput
        label="Recovery Token"
        value={formData.token}
        onChangeText={(text: string) => setFormData(prev => ({ ...prev, token: text }))}
        style={styles.input}
        mode="outlined"
        disabled={loading}
      />

      <Button
        mode="contained"
        onPress={handleVerifyToken}
        loading={loading}
        disabled={loading || !formData.token}
        style={styles.button}
      >
        Verify Token
      </Button>
    </View>
  );

  const renderAnswerQuestionsStep = () => (
    <View style={styles.formContainer}>
      <Text style={styles.stepTitle}>Security Questions</Text>
      
      <ScrollView style={styles.questionsContainer}>
        {recoveryQuestions.map((question, index) => (
          <TextInput
            key={index}
            label={question}
            value={formData.answers[question] || ''}
            onChangeText={(text: string) => setFormData(prev => ({
              ...prev,
              answers: { ...prev.answers, [question]: text }
            }))}
            style={styles.input}
            mode="outlined"
            disabled={loading}
          />
        ))}
      </ScrollView>

      <Button
        mode="contained"
        onPress={handleVerifyAnswers}
        loading={loading}
        disabled={loading || Object.keys(formData.answers).length < recoveryQuestions.length}
        style={styles.button}
      >
        Verify Answers
      </Button>
    </View>
  );

  const renderResetPasswordStep = () => (
    <View style={styles.formContainer}>
      <Text style={styles.stepTitle}>Reset Password</Text>

      <TextInput
        label="New Password"
        value={formData.newPassword}
        onChangeText={(text: string) => setFormData(prev => ({ ...prev, newPassword: text }))}
        secureTextEntry
        style={styles.input}
        mode="outlined"
        disabled={loading}
      />

      <View style={styles.strengthContainer}>
        <ProgressBar
          progress={passwordStrength}
          color={getPasswordStrengthColor()}
          style={styles.strengthBar}
        />
        <Text style={[styles.strengthText, { color: getPasswordStrengthColor() }]}>
          {getPasswordStrengthLabel()}
        </Text>
      </View>

      <TextInput
        label="Confirm New Password"
        value={formData.confirmPassword}
        onChangeText={(text: string) => setFormData(prev => ({ ...prev, confirmPassword: text }))}
        secureTextEntry
        style={styles.input}
        mode="outlined"
        disabled={loading}
      />

      <Button
        mode="contained"
        onPress={handleResetPassword}
        loading={loading}
        disabled={loading || !formData.newPassword || !formData.confirmPassword}
        style={styles.button}
      >
        Reset Password
      </Button>
    </View>
  );

  const renderSuccessStep = () => (
    <View style={styles.successContainer}>
      <LottieView
        source={require('../../assets/animations/recovery-success.json')}
        autoPlay
        loop={false}
        style={styles.successAnimation}
      />
      
      <Text style={styles.successTitle}>
        Password Reset Successfully!
      </Text>
      
      <Text style={styles.successMessage}>
        Your password has been reset with quantum-grade security.
      </Text>

      <Button
        mode="contained"
        onPress={() => navigation.replace('Login')}
        style={styles.button}
      >
        Return to Login
      </Button>
    </View>
  );

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
          {/* Quantum Processing Animation */}
          <Animated.View style={[
            styles.quantumContainer,
            {
              transform: [{
                scale: progressAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.2]
                })
              }]
            }
          ]}>
            <LottieView
              source={require('../../assets/animations/quantum-processing.json')}
              autoPlay
              loop
              style={styles.quantumAnimation}
            />
            <Text style={styles.quantumText}>
              Quantum Security: {Math.round(quantumProgress * 100)}%
            </Text>
          </Animated.View>

          {/* Error Display */}
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}

          {/* Step Content */}
          {currentStep === RecoveryStep.INITIATE && renderInitiateStep()}
          {currentStep === RecoveryStep.VERIFY_TOKEN && renderVerifyTokenStep()}
          {currentStep === RecoveryStep.ANSWER_QUESTIONS && renderAnswerQuestionsStep()}
          {currentStep === RecoveryStep.RESET_PASSWORD && renderResetPasswordStep()}
          {currentStep === RecoveryStep.SUCCESS && renderSuccessStep()}
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
  quantumContainer: {
    alignItems: 'center',
    marginBottom: 20
  },
  quantumAnimation: {
    width: 150,
    height: 150
  },
  quantumText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 20,
    borderRadius: 10
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#1a237e'
  },
  instruction: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#666'
  },
  input: {
    marginBottom: 15,
    backgroundColor: '#fff'
  },
  button: {
    marginTop: 10,
    paddingVertical: 8
  },
  errorText: {
    color: '#f44336',
    textAlign: 'center',
    marginBottom: 15,
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    padding: 10,
    borderRadius: 5
  },
  questionsContainer: {
    maxHeight: 300
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
  successContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 20,
    borderRadius: 10
  },
  successAnimation: {
    width: 200,
    height: 200
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4caf50',
    marginVertical: 20,
    textAlign: 'center'
  },
  successMessage: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center'
  }
});

export default PasswordRecoveryScreen;
