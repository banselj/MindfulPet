import * as tf from '@tensorflow/tfjs';
import OpenAI from 'openai';

class WorkoutAI {
  constructor() {
    this.openai = new OpenAI(process.env.OPENAI_API_KEY);
    this.poseModel = null;
    this.initializePoseDetection();
  }

  async initializePoseDetection() {
    // Load the MoveNet model for pose detection
    this.poseModel = await tf.loadGraphModel(
      'https://tfhub.dev/google/tfjs-model/movenet/singlepose/lightning/4'
    );
  }

  // Genetic Algorithm implementation for workout optimization
  generatePopulation(size, constraints) {
    const population = [];
    for (let i = 0; i < size; i++) {
      population.push(this.generateWorkout(constraints));
    }
    return population;
  }

  generateWorkout(constraints) {
    const { duration, difficulty, focusAreas, equipment } = constraints;
    
    const exercises = this.selectExercises(focusAreas, equipment);
    const sets = this.optimizeSets(exercises, duration, difficulty);
    
    return {
      exercises,
      sets,
      restPeriods: this.calculateRestPeriods(difficulty),
      totalDuration: duration,
    };
  }

  selectExercises(focusAreas, equipment) {
    const exerciseDatabase = {
      cardio: [
        { name: 'High Knees', equipment: 'none', intensity: 0.7 },
        { name: 'Mountain Climbers', equipment: 'none', intensity: 0.8 },
        { name: 'Jumping Jacks', equipment: 'none', intensity: 0.6 },
      ],
      strength: [
        { name: 'Push-ups', equipment: 'none', intensity: 0.7 },
        { name: 'Dumbbell Rows', equipment: 'dumbbells', intensity: 0.8 },
        { name: 'Squats', equipment: 'none', intensity: 0.7 },
      ],
      flexibility: [
        { name: 'Dynamic Stretches', equipment: 'none', intensity: 0.4 },
        { name: 'Yoga Flow', equipment: 'mat', intensity: 0.5 },
        { name: 'Joint Mobility', equipment: 'none', intensity: 0.3 },
      ],
    };

    let selectedExercises = [];
    focusAreas.forEach(area => {
      const availableExercises = exerciseDatabase[area].filter(
        exercise => !equipment || equipment.includes(exercise.equipment)
      );
      
      // Select exercises based on genetic diversity
      const numExercises = Math.floor(Math.random() * 3) + 2; // 2-4 exercises per area
      for (let i = 0; i < numExercises; i++) {
        const randomIndex = Math.floor(Math.random() * availableExercises.length);
        selectedExercises.push(availableExercises[randomIndex]);
      }
    });

    return selectedExercises;
  }

  optimizeSets(exercises, duration, difficulty) {
    const sets = {};
    const totalExercises = exercises.length;
    const timePerExercise = duration / totalExercises;

    exercises.forEach(exercise => {
      const baseReps = this.calculateBaseReps(exercise.intensity, difficulty);
      const numSets = this.calculateNumSets(timePerExercise, difficulty);
      
      sets[exercise.name] = {
        reps: baseReps,
        sets: numSets,
        restBetweenSets: this.calculateRestTime(exercise.intensity, difficulty),
      };
    });

    return sets;
  }

  calculateBaseReps(intensity, difficulty) {
    const baseReps = Math.floor(12 * intensity);
    const difficultyMultiplier = 0.8 + (difficulty * 0.4); // 0.8-1.2
    return Math.floor(baseReps * difficultyMultiplier);
  }

  calculateNumSets(timePerExercise, difficulty) {
    const baseSets = 3;
    const difficultyMultiplier = 0.8 + (difficulty * 0.4);
    return Math.floor(baseSets * difficultyMultiplier);
  }

  calculateRestTime(intensity, difficulty) {
    const baseRest = 60; // seconds
    const intensityFactor = 1 + (intensity * 0.5);
    const difficultyFactor = 1 - (difficulty * 0.3);
    return Math.floor(baseRest * intensityFactor * difficultyFactor);
  }

  calculateRestPeriods(difficulty) {
    return {
      betweenExercises: Math.floor(90 - (difficulty * 30)),
      betweenSets: Math.floor(60 - (difficulty * 20)),
    };
  }

  // Fitness function for genetic algorithm
  evaluateWorkout(workout, userMetrics) {
    let score = 0;
    
    // Evaluate exercise selection
    workout.exercises.forEach(exercise => {
      score += this.evaluateExercise(exercise, userMetrics);
    });

    // Evaluate workout structure
    score += this.evaluateStructure(workout, userMetrics);

    return score;
  }

  evaluateExercise(exercise, userMetrics) {
    let score = 0;
    
    // Check if exercise matches user's goals
    if (userMetrics.goals.includes(exercise.type)) score += 10;
    
    // Check if exercise intensity matches user's fitness level
    const intensityDiff = Math.abs(exercise.intensity - userMetrics.fitnessLevel);
    score += 10 * (1 - intensityDiff);

    return score;
  }

  evaluateStructure(workout, userMetrics) {
    let score = 0;
    
    // Check if total duration matches user's available time
    const durationMatch = 1 - Math.abs(workout.totalDuration - userMetrics.availableTime) / userMetrics.availableTime;
    score += 20 * durationMatch;
    
    // Check rest periods
    const restMatch = this.evaluateRestPeriods(workout.restPeriods, userMetrics.fitnessLevel);
    score += 10 * restMatch;

    return score;
  }

  // Mutation and crossover for genetic algorithm
  mutateWorkout(workout) {
    const mutatedWorkout = { ...workout };
    
    // Randomly modify exercise selection
    if (Math.random() < 0.3) {
      const randomExerciseIndex = Math.floor(Math.random() * mutatedWorkout.exercises.length);
      const newExercise = this.selectExercises([workout.exercises[randomExerciseIndex].type], workout.equipment)[0];
      mutatedWorkout.exercises[randomExerciseIndex] = newExercise;
    }
    
    // Randomly modify sets/reps
    if (Math.random() < 0.3) {
      const exerciseNames = Object.keys(mutatedWorkout.sets);
      const randomExercise = exerciseNames[Math.floor(Math.random() * exerciseNames.length)];
      mutatedWorkout.sets[randomExercise].reps *= (0.8 + Math.random() * 0.4); // ±20%
    }

    return mutatedWorkout;
  }

  crossoverWorkouts(workout1, workout2) {
    // Create child workout with mixed properties from parents
    const childWorkout = {
      exercises: [],
      sets: {},
      restPeriods: {},
      totalDuration: workout1.totalDuration,
    };

    // Mix exercises
    const crossoverPoint = Math.floor(workout1.exercises.length / 2);
    childWorkout.exercises = [
      ...workout1.exercises.slice(0, crossoverPoint),
      ...workout2.exercises.slice(crossoverPoint),
    ];

    // Mix sets
    childWorkout.sets = {
      ...workout1.sets,
      ...workout2.sets,
    };

    // Mix rest periods
    childWorkout.restPeriods = Math.random() < 0.5 ? workout1.restPeriods : workout2.restPeriods;

    return childWorkout;
  }

  async generateWorkoutPlan(userMetrics) {
    const constraints = {
      duration: userMetrics.availableTime,
      difficulty: userMetrics.fitnessLevel,
      focusAreas: userMetrics.goals,
      equipment: userMetrics.availableEquipment,
    };

    // Generate initial population
    let population = this.generatePopulation(20, constraints);
    
    // Evolution loop
    for (let generation = 0; generation < 10; generation++) {
      // Evaluate fitness
      const fitnessScores = population.map(workout => ({
        workout,
        fitness: this.evaluateWorkout(workout, userMetrics),
      }));

      // Sort by fitness
      fitnessScores.sort((a, b) => b.fitness - a.fitness);

      // Select top performers
      const elites = fitnessScores.slice(0, 4).map(item => item.workout);

      // Generate new population
      const newPopulation = [...elites];

      while (newPopulation.length < 20) {
        // Select parents
        const parent1 = elites[Math.floor(Math.random() * elites.length)];
        const parent2 = elites[Math.floor(Math.random() * elites.length)];

        // Create child
        let child = this.crossoverWorkouts(parent1, parent2);
        
        // Mutate
        if (Math.random() < 0.3) {
          child = this.mutateWorkout(child);
        }

        newPopulation.push(child);
      }

      population = newPopulation;
    }

    // Return best workout
    const bestWorkout = population[0];
    
    // Generate natural language description
    const description = await this.generateWorkoutDescription(bestWorkout);

    return {
      workout: bestWorkout,
      description,
    };
  }

  async generateWorkoutDescription(workout) {
    const prompt = `Create a natural, encouraging description for this workout:
    Exercises: ${workout.exercises.map(e => e.name).join(', ')}
    Sets and Reps: ${Object.entries(workout.sets).map(([name, details]) => 
      `${name}: ${details.sets} sets of ${details.reps} reps`).join(', ')}
    Rest Periods: ${workout.restPeriods.betweenExercises}s between exercises, ${workout.restPeriods.betweenSets}s between sets`;

    const completion = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an encouraging personal trainer who creates motivating workout descriptions."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 200
    });

    return completion.choices[0].message.content;
  }

  async detectPose(videoElement) {
    if (!this.poseModel) {
      throw new Error('Pose detection model not initialized');
    }

    const video = tf.browser.fromPixels(videoElement);
    const resized = tf.image.resizeBilinear(video, [192, 192]);
    const input = tf.expandDims(resized, 0);
    
    const predictions = await this.poseModel.predict(input);
    
    // Cleanup tensors
    video.dispose();
    resized.dispose();
    input.dispose();

    return predictions;
  }

  async analyzeForm(pose, exerciseType) {
    // Implement exercise-specific form analysis
    const formAnalysis = {
      score: 0,
      feedback: [],
    };

    switch (exerciseType) {
      case 'squat':
        formAnalysis.score = this.analyzeSquatForm(pose);
        break;
      case 'pushup':
        formAnalysis.score = this.analyzePushupForm(pose);
        break;
      // Add more exercise analyses
    }

    return formAnalysis;
  }
}

export default new WorkoutAI();
