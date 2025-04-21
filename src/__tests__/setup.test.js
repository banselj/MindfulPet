describe('Test Environment Setup', () => {
  test('Basic test functionality', () => {
    expect(true).toBe(true);
  });

  test('Async functionality', async () => {
    const result = await Promise.resolve(42);
    expect(result).toBe(42);
  });

  test('Mock functionality', () => {
    const mock = jest.fn();
    mock('test');
    expect(mock).toHaveBeenCalledWith('test');
  });
});
