import { createSession, validateSession, endSession } from './sessionManager';

describe('sessionManager', () => {
  it('should create a new session', () => {
    const userId = 'test-user';
    const session = createSession(userId);
    expect(session).toBeDefined();
    expect(session.userId).toBe(userId);
    expect(typeof session.sessionId).toBe('string');
    expect(session.active).toBe(true);
  });

  it('should validate an active session', () => {
    const userId = 'test-user';
    const session = createSession(userId);
    expect(validateSession(session.sessionId)).toBe(true);
  });

  it('should not validate an ended session', () => {
    const userId = 'test-user';
    const session = createSession(userId);
    endSession(session.sessionId);
    expect(validateSession(session.sessionId)).toBe(false);
  });

  it('should return false for invalid sessionId', () => {
    expect(validateSession('invalid-session-id')).toBe(false);
  });
});
