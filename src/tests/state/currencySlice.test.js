import currencyReducer, {
  addCurrency,
  spendCurrency,
  claimDailyReward,
} from '../../state/slices/currencySlice';

describe('currencySlice', () => {
  const initialState = {
    vitality_points: 0,
    mindfulness_tokens: 0,
    evolution_crystals: 0,
    last_daily_reward: null,
  };

  test('should handle initial state', () => {
    expect(currencyReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  test('should handle addCurrency', () => {
    const actual = currencyReducer(initialState, addCurrency({
      type: 'vitality_points',
      amount: 100,
    }));
    expect(actual.vitality_points).toEqual(100);
  });

  test('should handle spendCurrency', () => {
    const stateWithCurrency = {
      ...initialState,
      vitality_points: 100,
    };

    const actual = currencyReducer(stateWithCurrency, spendCurrency({
      type: 'vitality_points',
      amount: 50,
    }));
    expect(actual.vitality_points).toEqual(50);
  });

  test('should prevent spending more than available', () => {
    const stateWithCurrency = {
      ...initialState,
      vitality_points: 40,
    };

    const actual = currencyReducer(stateWithCurrency, spendCurrency({
      type: 'vitality_points',
      amount: 50,
    }));
    expect(actual.vitality_points).toEqual(40); // Should not change
  });

  test('should handle claimDailyReward', () => {
    const actual = currencyReducer(initialState, claimDailyReward());
    expect(actual.vitality_points).toEqual(100);
    expect(actual.mindfulness_tokens).toEqual(10);
    expect(actual.evolution_crystals).toEqual(1);
    expect(actual.last_daily_reward).toBeTruthy();
  });

  test('should prevent claiming daily reward twice in same day', () => {
    const stateAfterClaim = currencyReducer(initialState, claimDailyReward());
    const secondClaim = currencyReducer(stateAfterClaim, claimDailyReward());
    
    // Values should not change after second claim
    expect(secondClaim.vitality_points).toEqual(stateAfterClaim.vitality_points);
    expect(secondClaim.mindfulness_tokens).toEqual(stateAfterClaim.mindfulness_tokens);
    expect(secondClaim.evolution_crystals).toEqual(stateAfterClaim.evolution_crystals);
  });
});
