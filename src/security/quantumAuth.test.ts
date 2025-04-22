import * as quantumAuth from './quantumAuth';

describe('quantumAuth', () => {
  it('should hash biometric data to a SHA512 string', async () => {
    const fakeBiometric = { buffer: new Uint8Array([1,2,3,4]).buffer };
    const hash = await quantumAuth.hashBiometricData(fakeBiometric);
    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(0);
  });

  it('should reject invalid biometric data', async () => {
    await expect(quantumAuth.hashBiometricData(null)).rejects.toBeDefined();
  });
});
