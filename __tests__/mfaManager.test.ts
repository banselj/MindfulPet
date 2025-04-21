import { MFAManager } from '../src/security/mfaManager';

describe('MFAManager', () => {
  it('should retrieve MFA settings for a user', async () => {
    const mfa = MFAManager.getInstance();
    // Mock storage
    // Use a public method or add a protected accessor for testing. If not possible, consider dependency injection or a test hook.
    // Example: (Assuming a protected test accessor is added)
    // (mfa as any).testSetStorage({
    //   secureGet: jest.fn().mockResolvedValue(JSON.stringify({ totpEnabled: true, biometricEnabled: false, pushEnabled: true, recoveryEmail: 'test@example.com' }))
    // });
    // For now, skip this line to avoid private access error.
    const settings = await mfa.getMFASettingsPublic('user123');
    expect(settings).toMatchObject({ totpEnabled: true, biometricEnabled: false, pushEnabled: true, recoveryEmail: 'test@example.com' });
  });

  // Add more tests for enabling/disabling MFA, generating backup codes, etc.
});
