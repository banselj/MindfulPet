import { LatticeCrypto } from './latticeCrypto';
import { QuantumKeyExchange } from './quantumKeyExchange';
import { SecureAggregator } from './secureAggregator';
import { QuantumSession, QuantumSecurityError } from './types';
import * as tf from '@tensorflow/tfjs';

export class SecurityService {
  // ... existing fields

  /**
   * Initializes a secure aggregation round.
   * @param config Secure aggregation configuration
   * @returns Promise<string> roundId
   */
  public async initializeRound(config: any): Promise<string> {
    // Delegate to SecureAggregator
    return this.aggregator.initializeRound(config);
  }

  /**
   * Gets the status of a secure aggregation round.
   * @param roundId string
   * @returns status object or null
   */
  public getRoundStatus(roundId: string): {
    participantCount: number;
    threshold: number;
    timeRemaining: number;
  } | null {
    return this.aggregator.getRoundStatus(roundId);
  }

  /**
   * Finalizes a secure aggregation round.
   * @param roundId string
   * @returns Promise<any> aggregated result
   */
  public async finalizeRound(roundId: string): Promise<any> {
    return this.aggregator.finalizeRound(roundId);
  }

  private constructor() {
    this.latticeCrypto = new LatticeCrypto();
    this.keyExchange = new QuantumKeyExchange();
    this.aggregator = new SecureAggregator();
    this.initializeTensorFlow();
  }

  public static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  private async initializeTensorFlow(): Promise<void> {
    try {
      await tf.ready();
      tf.enableProdMode();
      await tf.setBackend('webgl');
    } catch (error) {
      throw new QuantumSecurityError(
        'TF_INIT_FAILED',
        'Failed to initialize TensorFlow',
        { originalError: error }
      );
    }
  }

  public async initializeSecureSession(): Promise<void> {
    try {
      this.currentSession = await this.keyExchange.establishSession();
    } catch (error) {
      throw new QuantumSecurityError(
        'SESSION_INIT_FAILED',
        'Failed to initialize secure session',
        { originalError: error }
      );
    }
  }

  public async encryptData(data: any): Promise<string> {
    try {
      if (!this.currentSession) {
        await this.initializeSecureSession();
      }

      // Convert data to Float64Array
      const buffer = new TextEncoder().encode(JSON.stringify(data));
      const floatArray = new Float64Array(buffer);

      // Encrypt using lattice-based encryption
      const encrypted = await this.latticeCrypto.encrypt(
        floatArray,
        this.currentSession!.keyPair.publicKey
      );

      return btoa(JSON.stringify(encrypted));
    } catch (error) {
      throw new QuantumSecurityError(
        'ENCRYPTION_FAILED',
        'Failed to encrypt data',
        { originalError: error }
      );
    }
  }

  public async decryptData(encryptedData: string): Promise<any> {
    try {
      if (!this.currentSession) {
        throw new QuantumSecurityError(
          'NO_SESSION',
          'No active secure session'
        );
      }

      // Decrypt using lattice-based decryption
      const encrypted = JSON.parse(atob(encryptedData));
      const decrypted = await this.latticeCrypto.decrypt(
        encrypted,
        this.currentSession.keyPair.secretKey
      );

      // Convert back to original data
      const buffer = new Uint8Array(decrypted.buffer);
      const text = new TextDecoder().decode(buffer);
      return JSON.parse(text);
    } catch (error) {
      throw new QuantumSecurityError(
        'DECRYPTION_FAILED',
        'Failed to decrypt data',
        { originalError: error }
      );
    }
  }

  public async secureRequest(
    url: string,
    method: string,
    data?: any
  ): Promise<any> {
    try {
      if (!this.currentSession) {
        await this.initializeSecureSession();
      }

      const encryptedData = data ? await this.encryptData(data) : null;
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/quantum-encrypted',
          'X-Quantum-Session': this.currentSession!.id,
          'X-Quantum-Nonce': Array.from(this.currentSession!.nonce)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('')
        },
        body: encryptedData ? JSON.stringify({ data: encryptedData }) : undefined
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const encryptedResponse = await response.json();
      return await this.decryptData(encryptedResponse.data);
    } catch (error) {
      throw new QuantumSecurityError(
        'REQUEST_FAILED',
        'Secure request failed',
        { originalError: error }
      );
    }
  }

  public async participateInAggregation(
    roundId: string,
    data: any
  ): Promise<void> {
    try {
      if (!this.currentSession) {
        throw new QuantumSecurityError(
          'NO_SESSION',
          'No active secure session'
        );
      }

      // Convert data to Float64Array
      const buffer = new TextEncoder().encode(JSON.stringify(data));
      const floatArray = new Float64Array(buffer);

      // Encrypt data for aggregation
      const encrypted = await this.latticeCrypto.encrypt(
        floatArray,
        this.currentSession.keyPair.publicKey
      );

      // Submit to aggregation round
      await this.aggregator.submitUpdate(
        roundId,
        this.currentSession.id,
        encrypted
      );
    } catch (error) {
      throw new QuantumSecurityError(
        'AGGREGATION_PARTICIPATION_FAILED',
        'Failed to participate in secure aggregation',
        { originalError: error }
      );
    }
  }

  public async refreshSession(): Promise<void> {
    try {
      if (this.currentSession) {
        const newSession = await this.keyExchange.refreshSession(
          this.currentSession.id
        );
        if (newSession) {
          this.currentSession = newSession;
        } else {
          await this.initializeSecureSession();
        }
      } else {
        await this.initializeSecureSession();
      }
    } catch (error) {
      throw new QuantumSecurityError(
        'SESSION_REFRESH_FAILED',
        'Failed to refresh secure session',
        { originalError: error }
      );
    }
  }

  public getSessionStatus(): {
    active: boolean;
    timeRemaining?: number;
  } {
    if (!this.currentSession) {
      return { active: false };
    }

    const age = Date.now() - this.currentSession.timestamp;
    const timeRemaining = Math.max(0, 3600000 - age); // 1 hour session length

    return {
      active: timeRemaining > 0,
      timeRemaining
    };
  }
}
