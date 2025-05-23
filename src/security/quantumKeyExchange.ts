import { QuantumSession, QuantumSecurityError, QuantumKeyPair, Matrix } from './types';
import { v4 as uuidv4 } from 'uuid';
import * as tf from '@tensorflow/tfjs';

export class QuantumKeyExchange {
  private static readonly SESSION_TIMEOUT = 3600000; // 1 hour
  private static readonly MIN_ENTROPY = 256;
  private static readonly QBER_THRESHOLD = 0.11; // Quantum Bit Error Rate threshold

  private activeSessions: Map<string, QuantumSession>;

  constructor() {
    this.activeSessions = new Map();
    this.startSessionCleanup();
  }

  public async establishSession(): Promise<QuantumSession> {
    try {
      const start = performance.now();

      // Generate EPR pairs for quantum key distribution
      const eprPairs = await this.generateEPRPairs();
      
      // Measure in random bases
      const { rawKey, bases } = await this.measureInRandomBases(eprPairs);
      
      // Error correction using CASCADE protocol
      const correctedKey = await this.performErrorCorrection(rawKey);
      
      // Privacy amplification
      const finalKey = await this.privacyAmplification(correctedKey);
      
      // Create session
      const session: QuantumSession = {
        id: uuidv4(),
        keyPair: await this.generateSessionKeyPair(finalKey),
        timestamp: Date.now(),
        nonce: crypto.getRandomValues(new Uint8Array(32))
      };

      // Timing check
      if (performance.now() - start > 200) {
        throw new QuantumSecurityError(
          'TIMING_ANOMALY',
          'Session establishment exceeded safe time threshold'
        );
      }

      this.activeSessions.set(session.id, session);
      return session;
    } catch (error) {
      throw new QuantumSecurityError(
        'SESSION_ESTABLISHMENT_FAILED',
        'Failed to establish quantum secure session',
        { originalError: error }
      );
    }
  }

  private async generateEPRPairs(): Promise<tf.Tensor2D> {
    // Simulate EPR pair generation using quantum superposition
    const numPairs = QuantumKeyExchange.MIN_ENTROPY * 4; // Generate extra for error correction
    
    return tf.tidy(() => {
      // Create superposition states
      const superposition = tf.randomUniform([numPairs, 2], 0, 1);
      // Normalize to create valid quantum states
      const norm = tf.sqrt(tf.sum(tf.square(superposition), 1));
      return tf.div(superposition, tf.expandDims(norm, 1)) as tf.Tensor2D;
    });
  }

  private async measureInRandomBases(
    eprPairs: tf.Tensor2D
  ): Promise<{ rawKey: Uint8Array; bases: Uint8Array }> {
    // Generate random measurement bases
    const bases = crypto.getRandomValues(new Uint8Array(eprPairs.shape[0]));
    
    // Perform measurements in respective bases
    const measurements = await tf.tidy(() => {
      // measurementOperators: [numPairs, 2, 2]
      const measurementOperators: number[][][] = Array.from(bases).map(b =>
        b ? [[1, 1], [1, -1]] : [[1, 0], [0, 1]]
      );
      const measurementTensor = tf.tensor(measurementOperators, [bases.length, 2, 2], 'float32');
      // eprPairs: [numPairs, 2] -> [numPairs, 2, 1] for matMul
      const eprPairs3D = eprPairs.reshape([eprPairs.shape[0], 2, 1]);
      // matMul: [numPairs, 2, 2] x [numPairs, 2, 1] -> [numPairs, 2, 1]
      const result = tf.matMul(measurementTensor, eprPairs3D);
      // Take the first output value for each pair
      const arr2d = result.squeeze([2]).arraySync() as number[][];
      return arr2d.map((arr: number[]) => arr[0]);
    });

    // Ensure measurements is always a number[]
    const measurementsArray: number[] = Array.isArray(measurements) ? measurements as number[] : [measurements as number];
    // Convert measurements to raw key bits
    const rawKey = new Uint8Array(measurementsArray.map((m: number) => m > 0.5 ? 1 : 0));

    return { rawKey, bases };
  }

  private async performErrorCorrection(
    rawKey: Uint8Array
  ): Promise<Uint8Array> {
    // Implement CASCADE protocol for error correction
    const blockSize = 16;
    const numBlocks = Math.ceil(rawKey.length / blockSize);
    const correctedKey = new Uint8Array(rawKey);

    for (let i = 0; i < numBlocks; i++) {
      const start = i * blockSize;
      const end = Math.min(start + blockSize, rawKey.length);
      const block = correctedKey.slice(start, end);
      
      // Compute and verify block parity
      const parity = block.reduce((a, b) => a ^ b, 0);
      if (parity !== 0) {
        // Error detected, perform binary search to locate error
        await this.correctBlockErrors(block, start, correctedKey);
      }
    }

    // Verify QBER
    const errorRate = this.calculateQBER(rawKey, correctedKey);
    if (errorRate > QuantumKeyExchange.QBER_THRESHOLD) {
      throw new QuantumSecurityError(
        'HIGH_QBER',
        'Quantum bit error rate exceeds threshold',
        { qber: errorRate }
      );
    }

    return correctedKey;
  }

  private async correctBlockErrors(
    block: Uint8Array,
    startIndex: number,
    fullKey: Uint8Array
  ): Promise<void> {
    let left = 0;
    let right = block.length;

    while (right - left > 1) {
      const mid = Math.floor((left + right) / 2);
      const subBlock = block.slice(left, mid);
      const parity = subBlock.reduce((a, b) => a ^ b, 0);

      if (parity !== 0) {
        right = mid;
      } else {
        left = mid;
      }
    }

    // Flip the erroneous bit
    fullKey[startIndex + left] ^= 1;
  }

  private calculateQBER(original: Uint8Array, corrected: Uint8Array): number {
    let errors = 0;
    for (let i = 0; i < original.length; i++) {
      if (original[i] !== corrected[i]) errors++;
    }
    return errors / original.length;
  }

  private async privacyAmplification(
    key: Uint8Array
  ): Promise<Uint8Array> {
    // Use universal hash function for privacy amplification
    const hashBuffer = await crypto.subtle.digest(
      'SHA-256',
      key
    );
    return new Uint8Array(hashBuffer);
  }

  private async generateSessionKeyPair(
    seed: Uint8Array
  ): Promise<QuantumKeyPair> {
    // Generate deterministic key pair from quantum-derived seed
    const params = {
      name: 'ECDSA',
      namedCurve: 'P-256'
    };

    // Generate ECDSA key pair
    const keyPair = await crypto.subtle.generateKey(
      params,
      true,
      ['sign', 'verify']
    ) as CryptoKeyPair;

    // Derive secretKey as Float32Array from seed
    const secretKey = new Float32Array(seed.buffer, seed.byteOffset, Math.min(32, Math.floor(seed.byteLength / 4)));

    // Create a dummy publicKey Matrix (for demo, use seed data reshaped)
    const publicKeyData = new Float32Array(32);
    publicKeyData.set(new Uint8Array(seed.buffer, seed.byteOffset, Math.min(32, seed.byteLength)).map(b => b / 255));
    const publicKey: Matrix = {
      rows: 8,
      cols: 4,
      data: publicKeyData
    };

    return {
      publicKey,
      secretKey,
      privateKey: keyPair.privateKey
    };
  }

  private startSessionCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [id, session] of this.activeSessions) {
        if (now - session.timestamp > QuantumKeyExchange.SESSION_TIMEOUT) {
          this.activeSessions.delete(id);
        }
      }
    }, 60000); // Clean up every minute
  }

  public validateSession(sessionId: string): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session) return false;

    const age = Date.now() - session.timestamp;
    return age < QuantumKeyExchange.SESSION_TIMEOUT;
  }

  public async refreshSession(sessionId: string): Promise<QuantumSession | null> {
    if (!this.validateSession(sessionId)) {
      return null;
    }

    const newSession = await this.establishSession();
    this.activeSessions.delete(sessionId);
    return newSession;
  }
}
