// TypeScript migration of nutritionAI.js. Adds types, interfaces, and documentation.
import OpenAI from 'openai';
import * as tf from '@tensorflow/tfjs';

export interface UserProfile {
  restrictions: string[];
  goals: string[];
  caloriesTarget: number;
  cookingSkill: string;
  cookingTime: number;
  allergies: string[];
}

export interface MealPlan {
  name: string;
  ingredients: string[];
  instructions?: string;
}

export interface NutritionAIOptions {
  openaiApiKey?: string;
}

/**
 * NutritionAI provides AI-powered meal planning and nutrition analysis.
 */
export class NutritionAI {
  openai: any;
  foodRecognitionModel: any;

  constructor(options: NutritionAIOptions = {}) {
    this.openai = new OpenAI({ apiKey: options.openaiApiKey || process.env.OPENAI_API_KEY });
    this.foodRecognitionModel = null;
  }

  /**
   * Generates a personalized meal plan using OpenAI based on the user profile.
   */
  async generateMealPlan(userProfile: UserProfile): Promise<MealPlan[]> {
    const prompt = `Create a personalized meal plan for someone with the following profile: ${JSON.stringify(userProfile)}. Format as a list.`;
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });
    return this.parseMealPlanResponse(completion.choices[0].message.content);
  }

  /**
   * Parses the AI response into a structured meal plan.
   */
  parseMealPlanResponse(response: string): MealPlan[] {
    // Simple parser for demonstration; improve for production.
    const lines = response.split('\n').filter(Boolean);
    return lines.map(line => ({ name: line.split(':')[1]?.trim() || line.trim(), ingredients: [] }));
  }

  /**
   * Initializes the food recognition model using TensorFlow.js.
   */
  async initializeFoodRecognition(): Promise<void> {
    this.foodRecognitionModel = await tf.loadLayersModel('https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json');
  }

  /**
   * Analyzes a food image and returns recognized food items (mocked).
   */
  async analyzeFoodImage(imageData: any): Promise<string[]> {
    if (!this.foodRecognitionModel) throw new Error('Model not initialized');
    // Add TensorFlow image analysis logic here
    return ['rice', 'chicken']; // Mocked result
  }

  /**
   * Estimates nutrition from recognized food items (mocked).
   */
  async estimateNutrition(foodItems: string[]): Promise<any> {
    // Add real nutrition estimation logic here
    return { calories: 350, protein: 20, carbs: 45, fat: 10 };
  }
}

export default new NutritionAI();
