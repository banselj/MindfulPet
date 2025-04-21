import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Share,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { BlurView } from 'expo-blur';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';
import { updatePreferences } from '../../state/slices/userSlice';
import { NavigationService } from '../../navigation/NavigationService';

const ProfileScreen = () => {
  const dispatch = useDispatch();
  const user = useSelector(state => state.user);
  const pet = useSelector(state => state.pet);
  const subscription = useSelector(state => state.monetization.subscription);
  const stats = useSelector(state => state.habits.stats);

  const [notifications, setNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticEnabled, setHapticEnabled] = useState(true);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join me on MindfulPals! My pet ${pet.name} and I are on a journey to mindful living. Download now: https://mindfulpals.app/share`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubscriptionPress = () => {
    if (subscription.tier === 'free') {
      NavigationService.navigate('Store', { showSubscriptions: true });
    } else {
      Alert.alert(
        'Active Subscription',
        'You currently have an active subscription. Would you like to manage it?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Manage', onPress: () => NavigationService.navigate('Store', { showSubscriptions: true }) },
        ]
      );
    }
  };

  const toggleSetting = (setting, value) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    switch (setting) {
      case 'notifications':
        setNotifications(value);
        break;
      case 'sound':
        setSoundEnabled(value);
        break;
      case 'haptic':
        setHapticEnabled(value);
        break;
    }
    dispatch(updatePreferences({ [setting]: value }));
  };

  const renderStatsCard = () => (
    <View style={styles.statsCard}>
      <Text style={styles.statsTitle}>Your Journey</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Icon name="meditation" size={24} color="#4CAF50" />
          <Text style={styles.statValue}>{stats.totalMeditationMinutes}</Text>
          <Text style={styles.statLabel}>Minutes Meditated</Text>
        </View>
        <View style={styles.statItem}>
          <Icon name="run" size={24} color="#2196F3" />
          <Text style={styles.statValue}>{stats.totalExerciseMinutes}</Text>
          <Text style={styles.statLabel}>Minutes Active</Text>
        </View>
        <View style={styles.statItem}>
          <Icon name="heart" size={24} color="#E91E63" />
          <Text style={styles.statValue}>{stats.averageMoodScore.toFixed(1)}</Text>
          <Text style={styles.statLabel}>Avg. Mood</Text>
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <BlurView intensity={80} style={styles.header}>
        <View style={styles.profileInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.name ? user.name[0].toUpperCase() : '👤'}
            </Text>
          </View>
          <View>
            <Text style={styles.userName}>{user.name || 'User'}</Text>
            <Text style={styles.userLevel}>Level {user.level || 1}</Text>
          </View>
        </View>
      </BlurView>

      {/* Stats */}
      {renderStatsCard()}

      {/* Subscription Status */}
      <TouchableOpacity
        style={[styles.card, styles.subscriptionCard]}
        onPress={handleSubscriptionPress}
      >
        <Icon
          name={subscription.tier === 'free' ? 'star-outline' : 'star'}
          size={24}
          color="#FFD700"
        />
        <View style={styles.subscriptionInfo}>
          <Text style={styles.subscriptionTitle}>
            {subscription.tier === 'free' ? 'Upgrade to Pro' : 'Pro Member'}
          </Text>
          <Text style={styles.subscriptionDesc}>
            {subscription.tier === 'free'
              ? 'Unlock all premium features'
              : 'Access to all premium features'}
          </Text>
        </View>
        <Icon name="chevron-right" size={24} color="#999" />
      </TouchableOpacity>

      {/* Settings */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <View style={styles.setting}>
          <Text>Notifications</Text>
          <Switch
            value={notifications}
            onValueChange={(value) => toggleSetting('notifications', value)}
          />
        </View>
        <View style={styles.setting}>
          <Text>Sound Effects</Text>
          <Switch
            value={soundEnabled}
            onValueChange={(value) => toggleSetting('sound', value)}
          />
        </View>
        <View style={styles.setting}>
          <Text>Haptic Feedback</Text>
          <Switch
            value={hapticEnabled}
            onValueChange={(value) => toggleSetting('haptic', value)}
          />
        </View>
      </View>

      {/* Actions */}
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.action}
          onPress={handleShare}
        >
          <Icon name="share-variant" size={24} color="#4CAF50" />
          <Text style={styles.actionText}>Share with Friends</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.action}
          onPress={() => NavigationService.navigate('Support')}
        >
          <Icon name="help-circle" size={24} color="#2196F3" />
          <Text style={styles.actionText}>Help & Support</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.action}
          onPress={() => NavigationService.navigate('About')}
        >
          <Icon name="information" size={24} color="#9C27B0" />
          <Text style={styles.actionText}>About</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  userLevel: {
    color: '#666',
  },
  statsCard: {
    margin: 15,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 15,
    elevation: 2,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  card: {
    margin: 15,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 15,
    elevation: 2,
  },
  subscriptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  subscriptionInfo: {
    flex: 1,
    marginLeft: 15,
  },
  subscriptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  subscriptionDesc: {
    color: '#666',
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  setting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  actionText: {
    marginLeft: 15,
    fontSize: 16,
  },
});

export default ProfileScreen;
