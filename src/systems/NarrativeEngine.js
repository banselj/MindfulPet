import { DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatISO, parseISO, differenceInDays } from 'date-fns';
import BehavioralAnalytics from './BehavioralAnalytics';

class NarrativeEngine {
  constructor() {
    this.currentArc = null;
    this.unlockedChapters = new Set();
    this.narrativeState = {
      mainProgress: 0,
      sideQuests: new Map(),
      achievements: new Set(),
      personalityTraits: new Map(),
      emotionalMemory: []
    };

    this.initialize();
  }

  async initialize() {
    try {
      // Load saved narrative state
      const savedState = await AsyncStorage.getItem('narrative_state');
      if (savedState) {
        const parsed = JSON.parse(savedState);
        this.narrativeState = {
          ...parsed,
          sideQuests: new Map(parsed.sideQuests),
          achievements: new Set(parsed.achievements),
          personalityTraits: new Map(parsed.personalityTraits)
        };
      }

      // Initialize event listeners
      this.setupEventListeners();
    } catch (error) {
      console.error('Error initializing NarrativeEngine:', error);
    }
  }

  setupEventListeners() {
    DeviceEventEmitter.addListener('behaviorPrediction', this.handleBehaviorPrediction);
    DeviceEventEmitter.addListener('achievementUnlocked', this.handleAchievement);
    DeviceEventEmitter.addListener('habitStreak', this.handleHabitStreak);
  }

  async updateNarrativeState(updates) {
    this.narrativeState = {
      ...this.narrativeState,
      ...updates
    };

    // Persist state
    await AsyncStorage.setItem('narrative_state', 
      JSON.stringify({
        ...this.narrativeState,
        sideQuests: Array.from(this.narrativeState.sideQuests.entries()),
        achievements: Array.from(this.narrativeState.achievements),
        personalityTraits: Array.from(this.narrativeState.personalityTraits.entries())
      })
    );

    // Emit state change
    DeviceEventEmitter.emit('narrativeStateUpdated', this.narrativeState);
  }

  handleBehaviorPrediction = async (prediction) => {
    const { behavior, confidence } = prediction;
    
    // Update emotional memory
    this.narrativeState.emotionalMemory.push({
      timestamp: new Date().toISOString(),
      behavior,
      confidence
    });

    // Keep last 30 days of emotional memory
    if (this.narrativeState.emotionalMemory.length > 30) {
      this.narrativeState.emotionalMemory.shift();
    }

    // Update personality traits based on behavior patterns
    this.updatePersonalityTraits();

    // Generate narrative events based on prediction
    const narrativeEvents = this.generateNarrativeEvents(prediction);
    
    // Emit narrative updates
    DeviceEventEmitter.emit('narrativeUpdate', narrativeEvents);
  }

  handleAchievement = async (achievement) => {
    const { id, type, milestone } = achievement;
    
    this.narrativeState.achievements.add(id);
    
    // Update main story progress
    if (type === 'major') {
      this.narrativeState.mainProgress += 0.1; // 10% progress
      
      // Unlock new chapter if progress threshold reached
      if (this.narrativeState.mainProgress >= this.getNextChapterThreshold()) {
        await this.unlockNextChapter();
      }
    }

    // Generate achievement-specific narrative
    const narrativeEvent = this.generateAchievementNarrative(achievement);
    DeviceEventEmitter.emit('narrativeUpdate', [narrativeEvent]);
  }

  handleHabitStreak = async (streak) => {
    const { habitId, days, category } = streak;
    
    // Update side quests
    if (days >= 7) { // Weekly milestone
      const questId = `${category}_weekly_${Math.floor(days / 7)}`;
      this.narrativeState.sideQuests.set(questId, {
        progress: 1,
        completed: true,
        timestamp: new Date().toISOString()
      });
    }

    // Generate streak-specific narrative
    const narrativeEvent = this.generateStreakNarrative(streak);
    DeviceEventEmitter.emit('narrativeUpdate', [narrativeEvent]);
  }

  async unlockNextChapter() {
    const nextChapter = this.getNextChapter();
    if (nextChapter) {
      this.unlockedChapters.add(nextChapter.id);
      
      // Generate chapter introduction narrative
      const narrativeEvent = {
        type: 'chapter_unlock',
        chapter: nextChapter,
        timestamp: new Date().toISOString(),
        content: this.generateChapterIntro(nextChapter)
      };

      DeviceEventEmitter.emit('narrativeUpdate', [narrativeEvent]);
    }
  }

  updatePersonalityTraits() {
    const recentMemory = this.narrativeState.emotionalMemory.slice(-7); // Last week
    
    // Calculate trait tendencies
    const traits = {
      optimism: 0,
      resilience: 0,
      consistency: 0,
      adaptability: 0
    };

    recentMemory.forEach(memory => {
      if (memory.behavior === 'improve') traits.optimism += 0.1;
      if (memory.behavior === 'maintain') traits.consistency += 0.1;
      if (memory.behavior === 'decline' && memory.confidence > 0.7) traits.resilience -= 0.05;
      if (memory.behavior === 'variable') traits.adaptability += 0.05;
    });

    // Update personality traits
    Object.entries(traits).forEach(([trait, value]) => {
      const currentValue = this.narrativeState.personalityTraits.get(trait) || 0;
      this.narrativeState.personalityTraits.set(trait, 
        Math.max(-1, Math.min(1, currentValue + value))
      );
    });
  }

  generateNarrativeEvents(prediction) {
    const events = [];
    const { behavior, confidence } = prediction;

    // Get dominant personality traits
    const dominantTraits = Array.from(this.narrativeState.personalityTraits.entries())
      .filter(([_, value]) => Math.abs(value) > 0.5)
      .map(([trait, _]) => trait);

    // Generate appropriate narrative based on behavior and personality
    if (behavior === 'improve' && confidence > 0.7) {
      events.push({
        type: 'growth',
        content: this.generateGrowthNarrative(dominantTraits),
        timestamp: new Date().toISOString()
      });
    }

    if (behavior === 'decline' && confidence > 0.6) {
      events.push({
        type: 'challenge',
        content: this.generateChallengeNarrative(dominantTraits),
        timestamp: new Date().toISOString()
      });
    }

    return events;
  }

  generateGrowthNarrative(traits) {
    const narratives = {
      optimism: [
        "Your positive energy is contagious! I feel myself growing stronger.",
        "Together, we're creating a brighter future!"
      ],
      resilience: [
        "Your determination inspires me to evolve.",
        "Every challenge we overcome makes our bond stronger."
      ],
      consistency: [
        "Your steady progress is helping me develop new abilities.",
        "I can feel our connection deepening with each passing day."
      ],
      adaptability: [
        "Your flexibility in facing changes amazes me!",
        "We're learning and growing together in unexpected ways."
      ]
    };

    // Select narrative based on dominant trait
    const dominantTrait = traits[0] || 'optimism';
    const options = narratives[dominantTrait];
    return options[Math.floor(Math.random() * options.length)];
  }

  generateChallengeNarrative(traits) {
    const narratives = {
      optimism: [
        "I believe in you! Let's find the silver lining together.",
        "Every setback is just setting us up for a comeback!"
      ],
      resilience: [
        "We've overcome challenges before, and we'll do it again!",
        "Your strength inspires me. Let's face this together."
      ],
      consistency: [
        "Remember our routine? It's helped us through tough times before.",
        "Small steps forward are still progress. Let's stick to our path."
      ],
      adaptability: [
        "Sometimes we need to adjust our approach. What shall we try next?",
        "Change can be challenging, but it's also an opportunity!"
      ]
    };

    const dominantTrait = traits[0] || 'optimism';
    const options = narratives[dominantTrait];
    return options[Math.floor(Math.random() * options.length)];
  }

  generateAchievementNarrative(achievement) {
    return {
      type: 'achievement',
      achievement,
      content: `Amazing! You've unlocked "${achievement.title}"! ${achievement.description}`,
      timestamp: new Date().toISOString()
    };
  }

  generateStreakNarrative(streak) {
    const milestones = {
      7: "A whole week! We're building something special!",
      30: "A month of consistency! You're incredible!",
      100: "100 days! You're truly inspirational!",
      365: "A full year! You've achieved legendary status!"
    };

    return {
      type: 'streak',
      streak,
      content: milestones[streak.days] || `${streak.days} days and counting! Keep it up!`,
      timestamp: new Date().toISOString()
    };
  }

  generateChapterIntro(chapter) {
    // Customize chapter intro based on user's journey and personality
    const traits = Array.from(this.narrativeState.personalityTraits.entries());
    const dominantTrait = traits.reduce((prev, curr) => 
      Math.abs(curr[1]) > Math.abs(prev[1]) ? curr : prev
    )[0];

    return {
      title: chapter.title,
      introduction: this.getChapterIntroduction(chapter, dominantTrait),
      unlockAnimation: this.getUnlockAnimation(chapter.theme)
    };
  }

  getChapterIntroduction(chapter, trait) {
    // Customize introduction based on personality trait
    const intros = {
      optimism: `A new chapter begins! ${chapter.title} promises exciting adventures ahead.`,
      resilience: `You've earned this moment. ${chapter.title} awaits your strength.`,
      consistency: `Your dedication has led us here. Welcome to ${chapter.title}.`,
      adaptability: `Change brings growth! ${chapter.title} offers new possibilities.`
    };

    return intros[trait] || intros.optimism;
  }

  getUnlockAnimation(theme) {
    // Return animation configuration based on chapter theme
    return {
      type: 'chapter_unlock',
      theme,
      duration: 3000,
      effects: ['sparkle', 'glow', 'transform']
    };
  }

  getNextChapterThreshold() {
    const thresholds = [0.2, 0.4, 0.6, 0.8, 1.0];
    return thresholds.find(t => t > this.narrativeState.mainProgress) || 1.0;
  }

  getNextChapter() {
    const chapters = [
      { id: 'origin', title: 'The Awakening', theme: 'discovery' },
      { id: 'growth', title: 'Growing Together', theme: 'nurture' },
      { id: 'challenge', title: 'Facing Challenges', theme: 'resilience' },
      { id: 'transformation', title: 'The Transformation', theme: 'evolution' },
      { id: 'mastery', title: 'Achieving Mastery', theme: 'achievement' }
    ];

    return chapters.find(chapter => !this.unlockedChapters.has(chapter.id));
  }
}

export const generateStoryArc = async (petState) => {
  const { level, achievements, emotionalState, socialConnections } = petState;

  const mainPlot = determineMainPlot(level, achievements);
  const subplots = generateSubplots(achievements, emotionalState);
  const characters = [...socialConnections].map(id => ({ id, role: 'friend' }));

  return {
    mainPlot,
    subplots,
    characters,
    difficulty: determineDifficulty(level, achievements)
  };
};

export const updateNarrative = async (currentNarrative, event) => {
  const { mainPlot, progress, activeQuests } = currentNarrative;
  const { type, details } = event;

  const progressIncrease = calculateProgressIncrease(type, details);
  const newProgress = Math.min(1, progress + progressIncrease);

  const updatedQuests = updateQuests(activeQuests, event);
  const completed = newProgress >= 1;

  return {
    mainPlot,
    progress: newProgress,
    activeQuests: updatedQuests,
    completed
  };
};

export const processAchievement = async (achievement, currentStory) => {
  const { id, type, significance } = achievement;
  const { mainPlot, progress, achievements } = currentStory;

  const storyUpdate = generateStoryUpdate(type, significance);
  const newQuests = generateNewQuests(achievement, currentStory);
  const progressIncrease = calculateAchievementProgress(significance);

  return {
    storyUpdate,
    newQuests,
    achievements: [...achievements, id],
    progressIncrease
  };
};

// Helper functions
const determineMainPlot = (level, achievements) => {
  if (level === 1) return 'Beginning the Journey';
  if (achievements.includes('firstFriend')) return 'Social Butterfly';
  return 'Daily Adventures';
};

const generateSubplots = (achievements, emotionalState) => {
  const subplots = [];
  if (achievements.length < 3) {
    subplots.push('Discovery');
  }
  if (emotionalState === 'happy') {
    subplots.push('Celebration');
  }
  return subplots;
};

const determineDifficulty = (level, achievements) => {
  if (level === 1 || achievements.length === 0) return 'beginner';
  if (level >= 5 && achievements.length >= 10) return 'advanced';
  return 'intermediate';
};

const calculateProgressIncrease = (type, details) => {
  const baseIncrease = {
    socialInteraction: 0.1,
    achievement: 0.2,
    milestone: 0.3
  }[type] || 0.05;

  return details.type === 'major' ? baseIncrease * 2 : baseIncrease;
};

const updateQuests = (activeQuests, event) => {
  return activeQuests.filter(quest => !isQuestCompleted(quest, event));
};

const isQuestCompleted = (quest, event) => {
  // Implementation would check if the event completes the quest
  return false;
};

const generateStoryUpdate = (type, significance) => {
  const updates = {
    social: {
      major: 'A new chapter in friendship begins!',
      minor: 'A pleasant social interaction.'
    },
    care: {
      major: 'A milestone in pet care achieved!',
      minor: 'Taking good care of your pet.'
    }
  };

  return updates[type]?.[significance] || 'Continuing the journey...';
};

const generateNewQuests = (achievement, currentStory) => {
  // Implementation would generate new quests based on the achievement
  return ['exploreNewArea', 'meetNewFriend'];
};

const calculateAchievementProgress = (significance) => {
  return significance === 'major' ? 0.2 : 0.05;
};

export default new NarrativeEngine();
