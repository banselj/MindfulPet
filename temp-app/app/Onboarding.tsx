import React, { useState } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

const SCREENS = [
  {
    title: 'Welcome to MindfulPet!',
    description: 'Your secure, AI-powered wellness companion. Let’s get started!'
  },
  {
    title: 'Quantum & Biometric Security',
    description: 'Your data is protected with quantum-safe cryptography and biometrics.'
  },
  {
    title: 'Wellness & Pet Care',
    description: 'Interact with your virtual pet, meditate, and track your wellness journey.'
  },
  {
    title: 'AI Insights',
    description: 'Get personalized insights and analytics—all privacy-first.'
  },
  {
    title: 'Feedback & Privacy',
    description: 'Questions or suggestions? Email us at your-support@email.com. Review our privacy policy anytime.'
  }
];

export default function Onboarding({ onFinish }: { onFinish: () => void }) {
  const [step, setStep] = useState(0);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{SCREENS[step].title}</Text>
      <Text style={styles.description}>{SCREENS[step].description}</Text>
      <View style={styles.buttonRow}>
        {step > 0 && (
          <Button title="Back" onPress={() => setStep(step - 1)} />
        )}
        {step < SCREENS.length - 1 ? (
          <Button title="Next" onPress={() => setStep(step + 1)} />
        ) : (
          <Button title="Finish" onPress={onFinish} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f4f4',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 18,
    marginBottom: 32,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
  },
});
