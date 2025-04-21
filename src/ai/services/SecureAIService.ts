import { SecurityService } from '../../security/securityService';
import { SecureStorage } from '../../security/secureStorage';
import { QuantumSecurityError } from '../../security/types';

export abstract class SecureAIService {
  protected security: SecurityService;
  protected storage: SecureStorage;
  protected modelCache: Map<string, {
    model: any;
    timestamp: number;
  }>;
  private static readonly MODEL_CACHE_TTL = 1800000; // 30 minutes

  constructor() {
    this.security = SecurityService.getInstance();
    this.storage = SecureStorage.getInstance();
    this.modelCache = new Map();
    this.startModelCacheCleanup();
  }

  protected async secureModelInference(
    modelId: string,
    input: any,
    options: any = {}
  ): Promise<any> {
    try {
      // Check if we have a valid session
      const sessionStatus = this.security.getSessionStatus();
      if (!sessionStatus.active) {
        await this.security.initializeSecureSession();
      }

      // Load and cache model if needed
      const model = await this.getModelFromCache(modelId);
      
      // Encrypt input data
      const encryptedInput = await this.security.encryptData(input);

      // Perform inference
      const encryptedOutput = await this.performSecureInference(
        model,
        encryptedInput,
        options
      );

      // Decrypt output
      return await this.security.decryptData(encryptedOutput);
    } catch (error) {
      throw new QuantumSecurityError(
        'SECURE_INFERENCE_FAILED',
        'Failed to perform secure model inference',
        { originalError: error }
      );
    }
  }

  protected async secureModelUpdate(
    modelId: string,
    gradients: any,
    options: any = {}
  ): Promise<void> {
    try {
      // Initialize aggregation round
      let roundId;
      if (typeof this.security.initializeRound === 'function') {
        roundId = await this.security.initializeRound({
          roundId: crypto.randomUUID(),
          participantCount: options.participantCount || 1,
          threshold: options.threshold || 1,
          timeout: options.timeout || 30000
        });
      } else {
        throw new Error('No public initializeRound method available on SecurityService');
      }

      // Participate in secure aggregation
      await this.security.participateInAggregation(roundId, gradients);

      // If we're the last participant, finalize the round
      let status;
      if (typeof this.security.getRoundStatus === 'function') {
        status = await this.security.getRoundStatus(roundId);
      } else {
        throw new Error('No public getRoundStatus method available on SecurityService');
      }
if (typeof this.security.getRoundStatus === 'function') {
  status = this.security.getRoundStatus(roundId);
} else {
  throw new Error('No public getRoundStatus method available on SecurityService');
}
      if (status && status.participantCount >= status.threshold) {
        let aggregatedGradients;
if (typeof this.security.finalizeRound === 'function') {
  aggregatedGradients = await this.security.finalizeRound(roundId);
} else {
  throw new Error('No public finalizeRound method available on SecurityService');
}
        await this.applyModelUpdate(modelId, aggregatedGradients);
      }
    } catch (error) {
      throw new QuantumSecurityError(
        'SECURE_UPDATE_FAILED',
        'Failed to perform secure model update',
        { originalError: error }
      );
    }
  }

  private async getModelFromCache(modelId: string): Promise<any> {
    const cached = this.modelCache.get(modelId);
    if (
      cached &&
      Date.now() - cached.timestamp < SecureAIService.MODEL_CACHE_TTL
    ) {
      return cached.model;
    }

    const model = await this.loadModel(modelId);
    this.modelCache.set(modelId, {
      model,
      timestamp: Date.now()
    });

    return model;
  }

  protected abstract loadModel(modelId: string): Promise<any>;
  
  protected abstract performSecureInference(
    model: any,
    encryptedInput: any,
    options: any
  ): Promise<any>;
  
  protected abstract applyModelUpdate(
    modelId: string,
    aggregatedGradients: any
  ): Promise<void>;

  private startModelCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.modelCache) {
        if (now - value.timestamp > SecureAIService.MODEL_CACHE_TTL) {
          this.modelCache.delete(key);
        }
      }
    }, 300000); // Clean up every 5 minutes
  }

  // Secure model metrics
  protected async logSecureMetrics(
    modelId: string,
    metrics: any
  ): Promise<void> {
    const key = `metrics_${modelId}_${Date.now()}`;
    await this.storage.secureSet(key, {
      ...metrics,
      timestamp: Date.now()
    });
  }

  protected async getSecureMetrics(
    modelId: string,
    startTime: number,
    endTime: number
  ): Promise<any[]> {
    const keys = await this.storage.getAllKeys();
    const metricKeys = keys.filter(k => k.startsWith(`metrics_${modelId}_`));
    
    const metricsMap = await this.storage.secureBatchGet(metricKeys);
    return Array.from(metricsMap.values())
      .filter(m => m.timestamp >= startTime && m.timestamp <= endTime)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  // Secure model versioning
  protected async saveModelVersion(
    modelId: string,
    version: string,
    metadata: any
  ): Promise<void> {
    const key = `model_version_${modelId}_${version}`;
    await this.storage.secureSet(key, {
      ...metadata,
      version,
      timestamp: Date.now()
    });
  }

  protected async getModelVersion(
    modelId: string,
    version: string
  ): Promise<any> {
    const key = `model_version_${modelId}_${version}`;
    return await this.storage.secureGet(key);
  }

  protected async listModelVersions(modelId: string): Promise<any[]> {
    const keys = await this.storage.getAllKeys();
    const versionKeys = keys.filter(k => k.startsWith(`model_version_${modelId}_`));
    
    const versionsMap = await this.storage.secureBatchGet(versionKeys);
    return Array.from(versionsMap.values())
      .sort((a, b) => b.timestamp - a.timestamp);
  }
}
