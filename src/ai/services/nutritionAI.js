import OpenAI from 'openai';
import * as tf from '@tensorflow/tfjs';

class NutritionAI {
  constructor() {
    this.openai = new OpenAI(process.env.OPENAI_API_KEY);
    this.foodRecognitionModel = null;
    this.initializeFoodRecognition();
  }

  async initializeFoodRecognition() {
    // Load MobileNet model for food recognition
    this.foodRecognitionModel = await tf.loadLayersModel(
      'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json'
    );
  }

  async generateMealPlan(userProfile) {
    const prompt = `Create a personalized meal plan for someone with the following profile:
    - Dietary restrictions: ${userProfile.restrictions.join(', ')}
    - Goals: ${userProfile.goals.join(', ')}
    - Calories target: ${userProfile.caloriesTarget}
    - Cooking skill: ${userProfile.cookingSkill}
    - Available time: ${userProfile.cookingTime} minutes
    - Allergies: ${userProfile.allergies.join(', ')}
    
    For each meal, include:
    1. Name of the dish
    2. Ingredients with quantities
    3. Nutritional information
    4. Preparation steps
    5. Cooking time
    6. Difficulty level`;

    const completion = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a professional nutritionist and chef specialized in creating personalized meal plans."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });

    return this.parseMealPlanResponse(completion.choices[0].message.content);
  }

  parseMealPlanResponse(response) {
    // Parse the GPT response into structured meal plan data
    const meals = [];
    const sections = response.split('\n\n');
    
    let currentMeal = null;
    sections.forEach(section => {
      if (section.startsWith('Meal:') || section.startsWith('- Meal:')) {
        if (currentMeal) meals.push(currentMeal);
        currentMeal = {
          name: section.split(':')[1].trim(),
          ingredients: [],
          nutrition: {},
          steps: [],
          time: 0,
          difficulty: ''
        };
      } else if (currentMeal) {
        if (section.includes('Ingredients:')) {
          currentMeal.ingredients = this.parseIngredients(section);
        } else if (section.includes('Nutrition:')) {
          currentMeal.nutrition = this.parseNutrition(section);
        } else if (section.includes('Steps:')) {
          currentMeal.steps = this.parseSteps(section);
        } else if (section.includes('Time:')) {
          currentMeal.time = parseInt(section.match(/\d+/)[0]);
        } else if (section.includes('Difficulty:')) {
          currentMeal.difficulty = section.split(':')[1].trim();
        }
      }
    });
    
    if (currentMeal) meals.push(currentMeal);
    return meals;
  }

  parseIngredients(section) {
    return section
      .split('\n')
      .slice(1) // Skip the "Ingredients:" header
      .map(line => {
        const [amount, unit, ...nameParts] = line.trim().split(' ');
        return {
          name: nameParts.join(' '),
          amount: parseFloat(amount),
          unit: unit
        };
      });
  }

  parseNutrition(section) {
    const nutrition = {};
    section
      .split('\n')
      .slice(1) // Skip the "Nutrition:" header
      .forEach(line => {
        const [nutrient, amount] = line.split(':').map(s => s.trim());
        nutrition[nutrient.toLowerCase()] = parseFloat(amount);
      });
    return nutrition;
  }

  parseSteps(section) {
    return section
      .split('\n')
      .slice(1) // Skip the "Steps:" header
      .map(step => step.trim());
  }

  async analyzeFoodImage(imageData) {
    if (!this.foodRecognitionModel) {
      throw new Error('Food recognition model not initialized');
    }

    // Preprocess image
    const tensor = tf.browser.fromPixels(imageData)
      .resizeBilinear([224, 224])
      .toFloat()
      .expandDims();

    // Normalize the image
    const normalized = tensor.div(255.0);

    // Get prediction
    const prediction = await this.foodRecognitionModel.predict(normalized).data();
    
    // Cleanup
    tensor.dispose();
    normalized.dispose();

    return this.interpretFoodPrediction(prediction);
  }

  interpretFoodPrediction(prediction) {
    // Map prediction to food categories and nutritional information
    const foodCategories = [
      'fruits', 'vegetables', 'grains', 'protein', 'dairy'
    ];

    const topPredictions = prediction
      .map((prob, idx) => ({
        category: foodCategories[idx % foodCategories.length],
        probability: prob
      }))
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 3);

    return {
      predictions: topPredictions,
      estimatedNutrition: this.estimateNutrition(topPredictions[0].category)
    };
  }

  estimateNutrition(category) {
    // Provide rough nutritional estimates based on food category
    const nutritionDatabase = {
      fruits: {
        calories: 60,
        carbs: 15,
        fiber: 3,
        protein: 1,
        fat: 0
      },
      vegetables: {
        calories: 45,
        carbs: 10,
        fiber: 4,
        protein: 2,
        fat: 0
      },
      grains: {
        calories: 150,
        carbs: 30,
        fiber: 2,
        protein: 4,
        fat: 1
      },
      protein: {
        calories: 200,
        carbs: 0,
        fiber: 0,
        protein: 25,
        fat: 12
      },
      dairy: {
        calories: 120,
        carbs: 12,
        fiber: 0,
        protein: 8,
        fat: 5
      }
    };

    return nutritionDatabase[category] || null;
  }

  async generateRecipeVariation(recipe, constraints) {
    const prompt = `Modify this recipe:
    ${recipe.name}
    
    Original ingredients:
    ${recipe.ingredients.map(i => `${i.amount} ${i.unit} ${i.name}`).join('\n')}
    
    Constraints:
    ${Object.entries(constraints).map(([key, value]) => `- ${key}: ${value}`).join('\n')}
    
    Please provide a modified version that meets these constraints while maintaining similar flavors and textures.`;

    const completion = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a creative chef specialized in recipe modification and substitutions."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 1000
    });

    return this.parseMealPlanResponse(completion.choices[0].message.content)[0];
  }

  calculateMealScore(meal, userProfile) {
    let score = 0;
    
    // Check if meal meets caloric goals
    const calorieMatch = 1 - Math.abs(meal.nutrition.calories - userProfile.caloriesTarget / 3) / (userProfile.caloriesTarget / 3);
    score += calorieMatch * 30;

    // Check if meal meets dietary restrictions
    const meetsRestrictions = !meal.ingredients.some(ingredient =>
      userProfile.restrictions.some(restriction =>
        ingredient.name.toLowerCase().includes(restriction.toLowerCase())
      )
    );
    score += meetsRestrictions ? 20 : -50;

    // Check cooking time
    const timeMatch = meal.time <= userProfile.cookingTime;
    score += timeMatch ? 20 : -20;

    // Check difficulty level
    const difficultyMatch = this.matchDifficulty(meal.difficulty, userProfile.cookingSkill);
    score += difficultyMatch * 30;

    return Math.max(0, Math.min(100, score));
  }

  matchDifficulty(mealDifficulty, userSkill) {
    const difficultyLevels = ['beginner', 'intermediate', 'advanced'];
    const mealLevel = difficultyLevels.indexOf(mealDifficulty.toLowerCase());
    const userLevel = difficultyLevels.indexOf(userSkill.toLowerCase());
    
    return 1 - Math.abs(mealLevel - userLevel) / difficultyLevels.length;
  }
}

export default new NutritionAI();
