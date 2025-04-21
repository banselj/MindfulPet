import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAchievements } from '../contexts/AchievementsContext';

const achievementsList = [
  {
    id: 'first_pet',
    title: 'Pet Parent',
    description: 'Adopted your first MindfulPal',
    icon: 'paw',
    color: '#FFD700',
  },
  {
    id: 'breathing_master',
    title: 'Breathing Master',
    description: 'Complete 5 breathing exercises',
    icon: 'meditation',
    color: '#4CAF50',
  },
  {
    id: 'breathing_beginner',
    title: 'Deep Breather',
    description: 'Complete a 1-minute breathing session',
    icon: 'leaf',
    color: '#81C784',
  },
  {
    id: 'breathing_intermediate',
    title: 'Calm Mind',
    description: 'Complete a 5-minute breathing session',
    icon: 'leaf-maple',
    color: '#66BB6A',
  },
  {
    id: 'breathing_advanced',
    title: 'Zen Master',
    description: 'Complete a 10-minute breathing session',
    icon: 'tree',
    color: '#4CAF50',
  },
  {
    id: 'breathing_expert',
    title: 'Mindfulness Sage',
    description: 'Complete a 30-minute breathing session',
    icon: 'meditation',
    color: '#43A047',
  },
  {
    id: 'breathing_grandmaster',
    title: 'Breathing Grandmaster',
    description: 'Complete a 60-minute breathing session',
    icon: 'star',
    color: '#388E3C',
  },
  {
    id: 'mood_tracker',
    title: 'Mood Observer',
    description: 'Track your mood for 7 consecutive days',
    icon: 'emoticon-outline',
    color: '#2196F3',
  },
  {
    id: 'happy_pet',
    title: 'Happy Pet',
    description: 'Keep your pet\'s happiness above 80% for 3 days',
    icon: 'heart',
    color: '#FF4081',
  },
  {
    id: 'mindful_minutes',
    title: 'Mindful Minutes',
    description: 'Spend 60 minutes total doing breathing exercises',
    icon: 'clock-outline',
    color: '#9C27B0',
  },
];

export const Achievements = ({ visible, onClose }) => {
  const { achievements } = useAchievements();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Achievements</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView}>
            {achievementsList.map((achievement) => {
              const achievementData = achievements[achievement.id];
              const progress = achievementData?.progress || 0;
              const total = achievementData?.total || 1;
              const completed = achievementData?.completed || false;

              return (
                <View 
                  key={achievement.id} 
                  style={[
                    styles.achievementCard,
                    completed && styles.completedCard
                  ]}
                >
                  <View 
                    style={[
                      styles.iconContainer, 
                      { backgroundColor: achievement.color }
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={achievement.icon}
                      size={24}
                      color="white"
                    />
                  </View>
                  <View style={styles.achievementInfo}>
                    <View style={styles.achievementHeader}>
                      <Text style={styles.achievementTitle}>
                        {achievement.title}
                      </Text>
                      {completed && (
                        <MaterialCommunityIcons
                          name="check-circle"
                          size={20}
                          color="#4CAF50"
                        />
                      )}
                    </View>
                    <Text style={styles.achievementDescription}>
                      {achievement.description}
                    </Text>
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBar}>
                        <View
                          style={[
                            styles.progressFill,
                            {
                              width: `${(progress / total) * 100}%`,
                              backgroundColor: achievement.color,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.progressText}>
                        {progress}/{total}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: '80%',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  scrollView: {
    marginBottom: 20,
  },
  achievementCard: {
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
  },
  completedCard: {
    backgroundColor: '#f0f7f0',
    borderColor: '#4CAF50',
    borderWidth: 1,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  achievementTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  achievementDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    marginRight: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    minWidth: 40,
  },
});
