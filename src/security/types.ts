export interface Matrix {
  rows: number;
  cols: number;
  data: Float64Array;
}

export interface Ciphertext {
  u: Matrix;
  v: Float64Array;
}

export interface QuantumKeyPair {
  publicKey: Matrix;
  secretKey: Float64Array;
}

export interface QuantumSession {
  id: string;
  keyPair: QuantumKeyPair;
  timestamp: number;
  nonce: Uint8Array;
}

export interface SecureAggregationConfig {
  roundId: string;
  participantCount: number;
  threshold: number;
  timeout: number;
}

export class QuantumSecurityError extends Error {
  constructor(
    public code: string,
    message: string,
    public metadata?: Record<string, any>
  ) {
    super(`[QSec-${code}] ${message}`);
    this.name = 'QuantumSecurityError';
  }
}
