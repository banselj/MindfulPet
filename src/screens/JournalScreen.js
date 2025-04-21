import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePet } from '../contexts/PetContext';
import { useAchievements } from '../contexts/AchievementsContext';
import { auth, db } from '../services/firebase';
import { collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp } from 'firebase/firestore';
import { MoodTracker } from '../components/MoodTracker';

export const JournalScreen = () => {
  const [entry, setEntry] = useState('');
  const [mood, setMood] = useState(null);
  const [moodHistory, setMoodHistory] = useState([]);
  const { petState, updatePetStats } = usePet();
  const { updateAchievement } = useAchievements();

  useEffect(() => {
    loadMoodHistory();
  }, []);

  const loadMoodHistory = async () => {
    try {
      const userId = auth.currentUser.uid;
      const journalRef = collection(db, 'users', userId, 'journal');
      const q = query(journalRef, orderBy('timestamp', 'desc'), limit(7));
      const querySnapshot = await getDocs(q);
      
      const history = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setMoodHistory(history);
    } catch (error) {
      console.error('Error loading mood history:', error);
    }
  };

  const handleSaveEntry = async () => {
    if (!mood) {
      Alert.alert('Select Mood', 'Please select your mood before saving.');
      return;
    }

    if (!entry.trim()) {
      Alert.alert('Empty Entry', 'Please write something before saving.');
      return;
    }

    try {
      const userId = auth.currentUser.uid;
      await addDoc(collection(db, 'users', userId, 'journal'), {
        content: entry,
        mood: mood,
        timestamp: serverTimestamp(),
      });

      // Update mood history
      await loadMoodHistory();

      // Update achievements
      await updateAchievement('mood_tracker', moodHistory.length + 1);

      // Update pet stats based on mood
      let happinessChange = 0;
      let energyChange = 0;
      
      switch (mood) {
        case 'Happy':
          happinessChange = 10;
          energyChange = 5;
          break;
        case 'Calm':
          happinessChange = 5;
          energyChange = 10;
          break;
        case 'Sad':
          happinessChange = -5;
          energyChange = -5;
          break;
        case 'Angry':
          happinessChange = -8;
          energyChange = -3;
          break;
        case 'Anxious':
          happinessChange = -3;
          energyChange = -8;
          break;
      }

      await updatePetStats({
        happiness: Math.max(0, Math.min(100, petState.happiness + happinessChange)),
        energy: Math.max(0, Math.min(100, petState.energy + energyChange)),
        lastJournalEntry: new Date().toISOString(),
      });

      Alert.alert('Success', 'Journal entry saved successfully!');
      setEntry('');
      setMood(null);
    } catch (error) {
      console.error('Error saving journal entry:', error);
      Alert.alert('Error', 'Failed to save journal entry. Please try again.');
    }
  };

  const renderMoodHistoryItem = ({ item }) => {
    const date = item.timestamp?.toDate() || new Date();
    return (
      <View style={styles.historyItem}>
        <Text style={styles.historyEmoji}>
          {item.mood === 'Happy' ? '😊' :
           item.mood === 'Calm' ? '😌' :
           item.mood === 'Sad' ? '😔' :
           item.mood === 'Angry' ? '😤' : '😰'}
        </Text>
        <View style={styles.historyContent}>
          <Text style={styles.historyDate}>
            {date.toLocaleDateString()} {date.toLocaleTimeString()}
          </Text>
          <Text style={styles.historyText} numberOfLines={2}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Daily Journal</Text>
        
        <MoodTracker onMoodSelect={setMood} />

        <TextInput
          style={styles.input}
          multiline
          placeholder="Write your thoughts here..."
          value={entry}
          onChangeText={setEntry}
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSaveEntry}
        >
          <MaterialCommunityIcons name="content-save" size={24} color="#fff" />
          <Text style={styles.saveButtonText}>Save Entry</Text>
        </TouchableOpacity>

        {moodHistory.length > 0 && (
          <View style={styles.historyContainer}>
            <Text style={styles.historyTitle}>Mood History</Text>
            <FlatList
              data={moodHistory}
              renderItem={renderMoodHistoryItem}
              keyExtractor={item => item.id}
              scrollEnabled={false}
            />
          </View>
        )}

        {petState.emoji && (
          <View style={styles.petContainer}>
            <Text style={styles.petEmoji}>{petState.emoji}</Text>
            <Text style={styles.petText}>
              {petState.name} is here to listen...
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  input: {
    height: 150,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  historyContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  historyItem: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  historyEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
  },
  historyDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  historyText: {
    fontSize: 14,
    color: '#333',
  },
  petContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  petEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  petText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
