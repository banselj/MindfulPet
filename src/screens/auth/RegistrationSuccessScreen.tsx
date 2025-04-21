import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions
} from 'react-native';
import { Text, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { QuantumAuth } from '../../security/quantumAuth';

const { width } = Dimensions.get('window');

import type { StackScreenProps } from '@react-navigation/stack';

interface RegistrationSuccessScreenProps extends StackScreenProps<any, any> {}

const RegistrationSuccessScreen = ({ navigation, route }: RegistrationSuccessScreenProps) => {
  // Defensive: route.params may be undefined

  const userId = route?.params?.userId ?? '';
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const rotateAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true
          }),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true
          })
        ])
      )
    ]).start();

    // Auto-navigate to home after delay
    const timer = setTimeout(() => {
      handleContinue();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleContinue = async () => {
    const auth = QuantumAuth.getInstance();
    const status = auth.getAuthStatus();
    
    if (status.isAuthenticated) {
      navigation.replace('Home');
    } else {
      navigation.replace('Login');
    }
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <LinearGradient
      colors={['#1a237e', '#0d47a1', '#01579b']}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Success Animation */}
        <Animated.View style={[
          styles.animationContainer,
          {
            transform: [
              { scale: scaleAnim },
              { rotate: spin }
            ]
          }
        ]}>
          <LottieView
            source={require('../../assets/animations/quantum-success.json')}
            autoPlay
            loop={false}
            style={styles.successAnimation}
          />
        </Animated.View>

        {/* Success Message */}
        <View style={styles.messageContainer}>
          <Text style={styles.title}>
            Quantum Identity Created!
          </Text>
          
          <Text style={styles.subtitle}>
            Your account is now protected by quantum-resistant encryption
          </Text>

          <View style={styles.featuresContainer}>
            <FeatureItem
              icon="🔒"
              text="Post-quantum cryptography enabled"
            />
            <FeatureItem
              icon="🔑"
              text="Quantum key exchange ready"
            />
            <FeatureItem
              icon="🛡️"
              text="Biometric authentication secured"
            />
            <FeatureItem
              icon="📱"
              text="Multi-device support prepared"
            />
          </View>
        </View>

        {/* Continue Button */}
        <Button
          mode="contained"
          onPress={handleContinue}
          style={styles.continueButton}
          labelStyle={styles.buttonLabel}
        >
          Continue to App
        </Button>

        <Text style={styles.autoRedirectText}>
          Automatically continuing in a few seconds...
        </Text>
      </View>
    </LinearGradient>
  );
};

interface FeatureItemProps {
  icon: string;
  text: string;
}
const FeatureItem = ({ icon, text }: FeatureItemProps) => (
  <View style={styles.featureItem}>
    <Text style={styles.featureIcon}>{icon}</Text>
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  animationContainer: {
    width: width * 0.5,
    height: width * 0.5,
    marginBottom: 30
  },
  successAnimation: {
    width: '100%',
    height: '100%'
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 30
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: 20
  },
  featuresContainer: {
    width: '100%',
    marginTop: 20
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 10,
    borderRadius: 8
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 10,
    width: 40,
    textAlign: 'center'
  },
  featureText: {
    color: '#fff',
    fontSize: 16,
    flex: 1
  },
  continueButton: {
    width: '80%',
    marginBottom: 15,
    backgroundColor: '#4caf50',
    paddingVertical: 8
  },
  buttonLabel: {
    fontSize: 16,
    textTransform: 'none'
  },
  autoRedirectText: {
    color: '#fff',
    opacity: 0.7,
    fontSize: 14
  }
});

export default RegistrationSuccessScreen;
