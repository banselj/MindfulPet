import { SessionManager } from '../src/security/sessionManager';

describe('SessionManager', () => {
  it('should retrieve active sessions for a user', async () => {
    const manager = SessionManager.getInstance();
    // Mock storage
    // Use a public method or add a protected accessor for testing. If not possible, consider dependency injection or a test hook.
    // Example: (Assuming a protected test accessor is added)
    // (manager as any).testSetStorage({
    //   secureGet: jest.fn().mockResolvedValue(JSON.stringify(['token1', 'token2']))
    // });
    // For now, skip this line to avoid private access error.
    manager.security.decryptData = jest.fn().mockResolvedValue(['token1', 'token2']);
    const sessions = await manager.getActiveSessions('user123');
    expect(sessions).toEqual(['token1', 'token2']);
  });

  // Add more tests for session creation, destruction, validation, etc.
});
