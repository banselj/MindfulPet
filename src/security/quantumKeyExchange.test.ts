import * as quantumKeyExchange from './quantumKeyExchange';

describe('quantumKeyExchange', () => {
  it('should generate a session key pair', () => {
    const keyPair = quantumKeyExchange.generateSessionKeyPair();
    expect(keyPair).toHaveProperty('publicKey');
    expect(keyPair).toHaveProperty('secretKey');
    expect(keyPair.publicKey).toBeDefined();
    expect(keyPair.secretKey).toBeDefined();
  });

  it('should measure in random bases', () => {
    const eprPairs3D = [[1,0],[0,1]];
    const measurementOperators = [[1,0],[0,1]];
    const result = quantumKeyExchange.measureInRandomBases(eprPairs3D, measurementOperators);
    expect(result).toBeDefined();
  });
});
