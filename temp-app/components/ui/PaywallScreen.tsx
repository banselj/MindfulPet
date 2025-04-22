import React from 'react';
import { View, Text, StyleSheet, Button, ActivityIndicator, Linking } from 'react-native';
import { useSubscription } from '../../context/SubscriptionContext';

export default function PaywallScreen() {
  const { purchaseSubscription, restorePurchases, loading } = useSubscription();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Go Premium</Text>
      <Text style={styles.subtitle}>Unlock advanced AI insights, analytics, exclusive meditation content, and more!</Text>
      <View style={styles.benefits}>
        <Text style={styles.benefit}>✓ AI-powered insights</Text>
        <Text style={styles.benefit}>✓ Advanced analytics</Text>
        <Text style={styles.benefit}>✓ Exclusive meditations</Text>
        <Text style={styles.benefit}>✓ Priority support</Text>
        <Text style={styles.benefit}>✓ Privacy-first features</Text>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#4B9CD3" />
      ) : (
        <>
          <Button title="Subscribe for $4.99/month" onPress={purchaseSubscription} />
          <Button title="Restore Purchase" onPress={restorePurchases} color="#888" />
        </>
      )}
      <Text style={styles.disclaimer}>Cancel anytime in your app store settings.</Text>
      <Text
        style={styles.link}
        onPress={() => Linking.openURL('https://yourusername.github.io/MindfulPet/PRIVACY.md')}
      >
        Privacy Policy
      </Text>
      <Text
        style={styles.link}
        onPress={() => Linking.openURL('https://yourusername.github.io/MindfulPet/TERMS.md')}
      >
        Terms of Service
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 18,
    color: '#333',
  },
  benefits: {
    marginBottom: 18,
    alignSelf: 'stretch',
  },
  benefit: {
    fontSize: 15,
    marginVertical: 2,
    color: '#222',
  },
  disclaimer: {
    fontSize: 12,
    color: '#888',
    marginTop: 18,
    marginBottom: 6,
    textAlign: 'center',
  },
  link: {
    color: '#4B9CD3',
    textDecorationLine: 'underline',
    marginVertical: 2,
    fontSize: 13,
  },
});
