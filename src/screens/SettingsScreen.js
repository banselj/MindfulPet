import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { usePet } from '../contexts/PetContext';

export const SettingsScreen = ({ navigation }) => {
  const { petState } = usePet();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigation.replace('Auth');
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity style={styles.settingItem}>
          <MaterialCommunityIcons name="account" size={24} color="#666" />
          <Text style={styles.settingText}>Profile</Text>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <MaterialCommunityIcons name="bell" size={24} color="#666" />
          <Text style={styles.settingText}>Notifications</Text>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pet</Text>
        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => navigation.navigate('PetSelection')}
        >
          <MaterialCommunityIcons name="paw" size={24} color="#666" />
          <Text style={styles.settingText}>Change Pet</Text>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#666" />
        </TouchableOpacity>
        <View style={styles.settingItem}>
          <MaterialCommunityIcons name="heart" size={24} color="#666" />
          <Text style={styles.settingText}>Pet Name</Text>
          <Text style={styles.settingValue}>{petState.name}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App</Text>
        <TouchableOpacity style={styles.settingItem}>
          <MaterialCommunityIcons name="theme-light-dark" size={24} color="#666" />
          <Text style={styles.settingText}>Theme</Text>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <MaterialCommunityIcons name="information" size={24} color="#666" />
          <Text style={styles.settingText}>About</Text>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.signOutButton}
        onPress={handleSignOut}
      >
        <MaterialCommunityIcons name="logout" size={24} color="#FF5252" />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: 'white',
    marginVertical: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginLeft: 15,
    marginBottom: 10,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
  },
  settingValue: {
    fontSize: 16,
    color: '#666',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    backgroundColor: 'white',
    marginVertical: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  signOutText: {
    color: '#FF5252',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
});
