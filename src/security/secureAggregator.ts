import { LatticeCrypto } from './latticeCrypto';
import { Ciphertext, SecureAggregationConfig, QuantumSecurityError } from './types';
import * as tf from '@tensorflow/tfjs';

export class SecureAggregator {
  private static readonly MIN_PARTICIPANTS = 3;
  private static readonly NOISE_SCALE = 2.0;
  private static readonly MAX_AGGREGATION_TIME = 30000; // 30 seconds

  private crypto: LatticeCrypto;
  private activeRounds: Map<string, {
    config: SecureAggregationConfig;
    updates: Map<string, Ciphertext>;
    startTime: number;
  }>;

  constructor() {
    this.crypto = new LatticeCrypto();
    this.activeRounds = new Map();
    this.startRoundCleanup();
  }

  public async initializeRound(config: SecureAggregationConfig): Promise<string> {
    try {
      if (config.participantCount < SecureAggregator.MIN_PARTICIPANTS) {
        throw new QuantumSecurityError(
          'INSUFFICIENT_PARTICIPANTS',
          'Not enough participants for secure aggregation'
        );
      }

      const roundId = crypto.randomUUID();
      this.activeRounds.set(roundId, {
        config,
        updates: new Map(),
        startTime: Date.now()
      });

      return roundId;
    } catch (error) {
      throw new QuantumSecurityError(
        'ROUND_INIT_FAILED',
        'Failed to initialize aggregation round',
        { originalError: error }
      );
    }
  }

  public async submitUpdate(
    roundId: string,
    participantId: string,
    update: Ciphertext
  ): Promise<void> {
    const round = this.activeRounds.get(roundId);
    if (!round) {
      throw new QuantumSecurityError(
        'INVALID_ROUND',
        'Aggregation round not found'
      );
    }

    // Verify round hasn't expired
    if (Date.now() - round.startTime > round.config.timeout) {
      this.activeRounds.delete(roundId);
      throw new QuantumSecurityError(
        'ROUND_EXPIRED',
        'Aggregation round has expired'
      );
    }

    // Add update to round
    round.updates.set(participantId, update);
  }

  public async finalizeRound(roundId: string): Promise<Ciphertext> {
    try {
      const round = this.activeRounds.get(roundId);
      if (!round) {
        throw new QuantumSecurityError(
          'INVALID_ROUND',
          'Aggregation round not found'
        );
      }

      // Check if we have enough updates
      if (round.updates.size < round.config.threshold) {
        throw new QuantumSecurityError(
          'THRESHOLD_NOT_MET',
          'Not enough updates to finalize round'
        );
      }

      // Perform secure aggregation
      const updates = Array.from(round.updates.values());
      let aggregated = updates[0];

      for (let i = 1; i < updates.length; i++) {
        aggregated = await this.crypto.homomorphicAdd(aggregated, updates[i]);
      }

      // Add differential privacy noise
      const noisyResult = await this.addDifferentialPrivacyNoise(
        aggregated,
        round.updates.size
      );

      // Cleanup round
      this.activeRounds.delete(roundId);

      return noisyResult;
    } catch (error) {
      throw new QuantumSecurityError(
        'AGGREGATION_FAILED',
        'Failed to finalize aggregation round',
        { originalError: error }
      );
    }
  }

  private async addDifferentialPrivacyNoise(
    aggregated: Ciphertext,
    numParticipants: number
  ): Promise<Ciphertext> {
    // Scale noise based on number of participants
    const noiseScale = SecureAggregator.NOISE_SCALE / Math.sqrt(numParticipants);

    // Generate noise tensors
    const uNoise = tf.randomNormal(
      [aggregated.u.rows, aggregated.u.cols],
      0,
      noiseScale
    );
    const vNoise = tf.randomNormal(
      [aggregated.v.length],
      0,
      noiseScale
    );

    // Add noise to aggregated result
    return {
      u: {
        rows: aggregated.u.rows,
        cols: aggregated.u.cols,
        data: new Float32Array(
          tf.add(
            tf.tensor2d(
              Array.from(aggregated.u.data),
              [aggregated.u.rows, aggregated.u.cols]
            ),
            uNoise
          ).dataSync()
        )
      },
      v: new Float32Array(
        tf.add(
          tf.tensor1d(aggregated.v),
          vNoise
        ).dataSync()
      )
    };
  }

  private startRoundCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [roundId, round] of this.activeRounds) {
        if (now - round.startTime > round.config.timeout) {
          this.activeRounds.delete(roundId);
        }
      }
    }, 10000); // Clean up every 10 seconds
  }

  public getRoundStatus(roundId: string): {
    participantCount: number;
    threshold: number;
    timeRemaining: number;
  } | null {
    const round = this.activeRounds.get(roundId);
    if (!round) return null;

    return {
      participantCount: round.updates.size,
      threshold: round.config.threshold,
      timeRemaining: Math.max(
        0,
        round.config.timeout - (Date.now() - round.startTime)
      )
    };
  }
}
