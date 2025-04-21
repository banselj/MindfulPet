import meditationAI from '../src/ai/services/meditationAI';

describe('meditationAI', () => {
  it('should generate a meditation script', async () => {
    meditationAI.openai.chat.completions.create = jest.fn().mockResolvedValue({
      choices: [{ message: { content: 'Begin by relaxing your body...' } }]
    });
    const script = await meditationAI.generateMeditationScript({
      duration: 10, currentMood: 'stressed', goal: 'calm', experienceLevel: 'beginner'
    });
    expect(script).toContain('relaxing your body');
  });

  // Add more tests for detectEmotionalState, generateVoiceGuidance, etc.
});
