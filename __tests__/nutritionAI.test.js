import nutritionAI from '../src/ai/services/nutritionAI';

describe('nutritionAI', () => {
  it('should generate a meal plan', async () => {
    nutritionAI.openai.chat.completions.create = jest.fn().mockResolvedValue({
      choices: [{ message: { content: 'Meal: Test Meal\nIngredients:\n1 cup rice' } }]
    });
    const plan = await nutritionAI.generateMealPlan({
      restrictions: [], goals: [], caloriesTarget: 2000, cookingSkill: 'beginner', cookingTime: 30, allergies: []
    });
    expect(plan[0].name).toBe('Test Meal');
  });

  // Add more tests for analyzeFoodImage, estimateNutrition, etc.
});
