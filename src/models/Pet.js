import { db } from '../services/firebase';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';

export class Pet {
  constructor(userId, data = {}) {
    this.userId = userId;
    this.name = data.name || '';
    this.type = data.type || 'cat';  // default pet type
    this.mood = data.mood || 'neutral';
    this.energy = data.energy || 100;
    this.happiness = data.happiness || 100;
    this.lastInteraction = data.lastInteraction || new Date();
    this.accessories = data.accessories || [];
    this.level = data.level || 1;
    this.experience = data.experience || 0;
  }

  // Get pet document reference
  get docRef() {
    return doc(db, 'pets', this.userId);
  }

  // Save pet state to Firebase
  async save() {
    const petData = {
      name: this.name,
      type: this.type,
      mood: this.mood,
      energy: this.energy,
      happiness: this.happiness,
      lastInteraction: this.lastInteraction,
      accessories: this.accessories,
      level: this.level,
      experience: this.experience,
    };
    
    await setDoc(this.docRef, petData, { merge: true });
  }

  // Update pet's mood based on user's mood
  async updateMood(userMood) {
    this.mood = this.calculatePetMood(userMood);
    await this.save();
  }

  // Calculate pet's mood based on user's mood and current state
  calculatePetMood(userMood) {
    // Pet is empathetic to user's mood but also influenced by its own state
    if (this.energy < 30 || this.happiness < 30) {
      return 'sad';
    }
    return userMood;
  }

  // Add experience points and level up if necessary
  async addExperience(points) {
    this.experience += points;
    if (this.experience >= this.level * 100) {
      this.level += 1;
      this.experience = 0;
    }
    await this.save();
  }

  // Static method to load pet data
  static async load(userId) {
    const docRef = doc(db, 'pets', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return new Pet(userId, docSnap.data());
    }
    
    // Create new pet if it doesn't exist
    const newPet = new Pet(userId);
    await newPet.save();
    return newPet;
  }
}
