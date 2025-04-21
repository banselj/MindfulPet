import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { addVitalityPoints } from '../../state/slices/monetizationSlice';

const CommunityScreen = () => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('challenges');
  const [refreshing, setRefreshing] = useState(false);
  const subscription = useSelector(state => state.monetization.subscription);

  const [challenges] = useState([
    {
      id: '1',
      title: '30 Days of Mindfulness',
      participants: 1234,
      progress: 0.6,
      reward: 500,
      endDate: '2025-03-01',
      description: 'Complete daily meditation sessions for 30 days.',
    },
    {
      id: '2',
      title: 'Wellness Warriors',
      participants: 856,
      progress: 0.3,
      reward: 300,
      endDate: '2025-02-15',
      description: 'Track your exercise, sleep, and meditation habits.',
    },
  ]);

  const [community] = useState([
    {
      id: '1',
      type: 'achievement',
      user: 'Sarah',
      avatar: '👩',
      content: 'Just completed 30 days of meditation! 🎉',
      likes: 24,
      comments: 5,
      timestamp: '2h ago',
    },
    {
      id: '2',
      type: 'tip',
      user: 'Mike',
      avatar: '👨',
      content: 'Try doing a quick breathing exercise before important meetings!',
      likes: 15,
      comments: 3,
      timestamp: '4h ago',
    },
  ]);

  const [playdates] = useState([
    {
      id: '1',
      host: 'Emma',
      avatar: '👧',
      petName: 'Luna',
      time: '2:00 PM Today',
      participants: 3,
      maxParticipants: 4,
      activity: 'Group Meditation',
    },
    {
      id: '2',
      host: 'Alex',
      avatar: '🧑',
      petName: 'Nova',
      time: '5:00 PM Today',
      participants: 2,
      maxParticipants: 4,
      activity: 'Pet Playdate',
    },
  ]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  const renderChallenges = () => (
    <FlatList
      data={challenges}
      keyExtractor={item => item.id}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.challengeCard}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <View style={styles.challengeHeader}>
            <Text style={styles.challengeTitle}>{item.title}</Text>
            <Text style={styles.challengeParticipants}>
              👥 {item.participants.toLocaleString()}
            </Text>
          </View>
          <Text style={styles.challengeDescription}>{item.description}</Text>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${item.progress * 100}%` }]} />
          </View>
          <View style={styles.challengeMeta}>
            <Text>🎁 {item.reward} points</Text>
            <Text>⏳ Ends {item.endDate}</Text>
          </View>
        </TouchableOpacity>
      )}
    />
  );

  const renderCommunity = () => (
    <FlatList
      data={community}
      keyExtractor={item => item.id}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      renderItem={({ item }) => (
        <View style={styles.postCard}>
          <View style={styles.postHeader}>
            <Text style={styles.avatar}>{item.avatar}</Text>
            <View>
              <Text style={styles.username}>{item.user}</Text>
              <Text style={styles.timestamp}>{item.timestamp}</Text>
            </View>
          </View>
          <Text style={styles.postContent}>{item.content}</Text>
          <View style={styles.postActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                dispatch(addVitalityPoints(1));
              }}
            >
              <Text>❤️ {item.likes}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text>💭 {item.comments}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    />
  );

  const renderPlaydates = () => (
    <FlatList
      data={playdates}
      keyExtractor={item => item.id}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.playdateCard}
          onPress={() => {
            if (subscription.tier === 'free') {
              // Show premium upgrade prompt
              return;
            }
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <View style={styles.playdateHeader}>
            <Text style={styles.avatar}>{item.avatar}</Text>
            <View>
              <Text style={styles.username}>{item.host}'s {item.petName}</Text>
              <Text style={styles.playdateTime}>{item.time}</Text>
            </View>
          </View>
          <View style={styles.playdateMeta}>
            <Text>🎯 {item.activity}</Text>
            <Text>👥 {item.participants}/{item.maxParticipants}</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.joinButton,
              { opacity: item.participants >= item.maxParticipants ? 0.5 : 1 }
            ]}
            disabled={item.participants >= item.maxParticipants}
          >
            <Text style={styles.joinButtonText}>
              {item.participants >= item.maxParticipants ? 'Full' : 'Join'}
            </Text>
          </TouchableOpacity>
        </TouchableOpacity>
      )}
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'challenges' && styles.activeTab]}
          onPress={() => setActiveTab('challenges')}
        >
          <Text style={styles.tabText}>Challenges</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'community' && styles.activeTab]}
          onPress={() => setActiveTab('community')}
        >
          <Text style={styles.tabText}>Community</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'playdates' && styles.activeTab]}
          onPress={() => setActiveTab('playdates')}
        >
          <Text style={styles.tabText}>Playdates</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'challenges' && renderChallenges()}
      {activeTab === 'community' && renderCommunity()}
      {activeTab === 'playdates' && renderPlaydates()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: 'white',
    elevation: 2,
  },
  tab: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: '#E8F0FE',
  },
  tabText: {
    fontWeight: '500',
  },
  challengeCard: {
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 15,
    elevation: 2,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  challengeParticipants: {
    color: '#666',
  },
  challengeDescription: {
    marginBottom: 10,
    color: '#444',
  },
  progressContainer: {
    height: 6,
    backgroundColor: '#EEE',
    borderRadius: 3,
    marginBottom: 10,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  challengeMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    color: '#666',
  },
  postCard: {
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 15,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    fontSize: 24,
    marginRight: 10,
  },
  username: {
    fontWeight: 'bold',
  },
  timestamp: {
    color: '#666',
    fontSize: 12,
  },
  postContent: {
    marginBottom: 10,
  },
  postActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    paddingTop: 10,
  },
  actionButton: {
    marginRight: 20,
  },
  playdateCard: {
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 15,
    elevation: 2,
  },
  playdateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  playdateTime: {
    color: '#666',
  },
  playdateMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  joinButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 20,
    alignItems: 'center',
  },
  joinButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default CommunityScreen;
