import React, { createContext, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { setPet, updateStats, addMoodEntry, updateAttributes } from '../store/petSlice';

const PetContext = createContext();

export const PetProvider = ({ children }) => {
  const dispatch = useDispatch();
  const pet = useSelector(state => state.pet);

  const selectPet = async (petData) => {
    try {
      if (!auth.currentUser) {
        throw new Error('User must be authenticated to select a pet');
      }

      const newPetState = {
        ...petData,
        happiness: 100,
        energy: 100,
        health: 100,
        lastFed: new Date().toISOString(),
        lastPlayed: new Date().toISOString(),
        lastRested: new Date().toISOString(),
        lastMeditated: new Date().toISOString(),
        moodEntries: [],
      };

      // Save to Firestore
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        pet: newPetState,
      }, { merge: true });

      // Update Redux store
      dispatch(setPet(newPetState));
      return newPetState;
    } catch (error) {
      console.error('Error selecting pet:', error);
      throw error;
    }
  };

  const updatePetStats = async (updates) => {
    try {
      if (!auth.currentUser) {
        throw new Error('User must be authenticated to update pet stats');
      }

      // Update Redux store
      dispatch(updateStats(updates));

      // Save to Firestore
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        pet: {
          ...pet,
          ...updates,
          lastUpdated: new Date().toISOString(),
        },
      }, { merge: true });
    } catch (error) {
      console.error('Error updating pet stats:', error);
      throw error;
    }
  };

  const updatePetAttributes = async (attributes) => {
    try {
      if (!auth.currentUser) {
        throw new Error('User must be authenticated to update pet attributes');
      }

      // Update Redux store
      dispatch(updateAttributes(attributes));

      // Save to Firestore
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        pet: {
          ...pet,
          attributes: {
            ...pet.attributes,
            ...attributes,
          },
          lastUpdated: new Date().toISOString(),
        },
      }, { merge: true });
    } catch (error) {
      console.error('Error updating pet attributes:', error);
      throw error;
    }
  };

  const addPetMood = async (mood) => {
    try {
      if (!auth.currentUser) {
        throw new Error('User must be authenticated to add mood');
      }

      const moodEntry = {
        mood,
        timestamp: new Date().toISOString(),
      };

      // Update Redux store
      dispatch(addMoodEntry(moodEntry));

      // Update Firestore
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        pet: {
          ...pet,
          moodEntries: [...pet.moodEntries, moodEntry],
        },
      }, { merge: true });
    } catch (error) {
      console.error('Error adding mood:', error);
      throw error;
    }
  };

  const completeBreathingExercise = async () => {
    try {
      const updates = {
        happiness: Math.min(100, pet.happiness + 15),
        energy: Math.min(100, pet.energy + 15),
        lastMeditated: new Date().toISOString(),
      };

      await updatePetStats(updates);
    } catch (error) {
      console.error('Error updating pet stats after breathing exercise:', error);
      throw error;
    }
  };

  return (
    <PetContext.Provider
      value={{
        ...pet,
        selectPet,
        updateStats: updatePetStats,
        updateAttributes: updatePetAttributes,
        addMood: addPetMood,
        completeBreathingExercise,
      }}
    >
      {children}
    </PetContext.Provider>
  );
};

export const usePet = () => {
  const context = useContext(PetContext);
  if (context === undefined) {
    throw new Error('usePet must be used within a PetProvider');
  }
  return context;
};
