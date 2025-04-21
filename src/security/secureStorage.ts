import { SecurityService } from './securityService';
import { QuantumSecurityError } from './types';
import * as SecureStore from 'expo-secure-store';

export class SecureStorage {
  private static instance: SecureStorage;
  private security: SecurityService;
  private cache: Map<string, { data: any; timestamp: number }>;
  private static readonly CACHE_TTL = 300000; // 5 minutes

  private constructor() {
    this.security = SecurityService.getInstance();
    this.cache = new Map();
    this.startCacheCleanup();
  }

  public static getInstance(): SecureStorage {
    if (!SecureStorage.instance) {
      SecureStorage.instance = new SecureStorage();
    }
    return SecureStorage.instance;
  }

  public async secureSet(key: string, value: any): Promise<void> {
    try {
      // Encrypt data
      const encrypted = await this.security.encryptData(value);
      
      // Add metadata
      const metadata = {
        timestamp: Date.now(),
        version: '1.0',
        hash: await this.computeHash(value)
      };

      const storageValue = {
        data: encrypted,
        metadata
      };

      // Store encrypted data
      await SecureStore.setItemAsync(
        key,
        JSON.stringify(storageValue)
      );

      // Update cache
      this.cache.set(key, {
        data: value,
        timestamp: Date.now()
      });
    } catch (error) {
      throw new QuantumSecurityError(
        'SECURE_STORAGE_SET_FAILED',
        'Failed to securely store data',
        { originalError: error }
      );
    }
  }

  public async secureGet(key: string): Promise<any> {
    try {
      // Check cache first
      const cached = this.cache.get(key);
      if (cached && Date.now() - cached.timestamp < SecureStorage.CACHE_TTL) {
        return cached.data;
      }

      // Retrieve from secure storage
      const stored = await SecureStore.getItemAsync(key);
      if (!stored) return null;

      const { data: encrypted, metadata } = JSON.parse(stored);
      
      // Decrypt data
      const decrypted = await this.security.decryptData(encrypted);

      // Verify hash
      const currentHash = await this.computeHash(decrypted);
      if (currentHash !== metadata.hash) {
        throw new QuantumSecurityError(
          'DATA_INTEGRITY_VIOLATION',
          'Stored data hash mismatch'
        );
      }

      // Update cache
      this.cache.set(key, {
        data: decrypted,
        timestamp: Date.now()
      });

      return decrypted;
    } catch (error) {
      throw new QuantumSecurityError(
        'SECURE_STORAGE_GET_FAILED',
        'Failed to retrieve secure data',
        { originalError: error }
      );
    }
  }

  public async secureDelete(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
      this.cache.delete(key);
    } catch (error) {
      throw new QuantumSecurityError(
        'SECURE_STORAGE_DELETE_FAILED',
        'Failed to delete secure data',
        { originalError: error }
      );
    }
  }

  public async secureClear(): Promise<void> {
    try {
      const allKeys = await this.getAllKeys();
      await Promise.all(
        allKeys.map(key => this.secureDelete(key))
      );
      this.cache.clear();
    } catch (error) {
      throw new QuantumSecurityError(
        'SECURE_STORAGE_CLEAR_FAILED',
        'Failed to clear secure storage',
        { originalError: error }
      );
    }
  }

  /**
   * Attempts to enumerate all keys stored in SecureStore.
   * On native platforms, attempts to use SecureStore.getAllKeysAsync if available.
   * On web or unsupported platforms, returns an empty array and logs a warning.
   */
  public async getAllKeys(): Promise<string[]> {
    // Expo SecureStore does NOT support key enumeration on web/most platforms.
    // If running on a platform with custom native module, implement here.
    if ((SecureStore as any).getAllKeysAsync) {
      try {
        return await (SecureStore as any).getAllKeysAsync();
      } catch (err) {
        console.warn('SecureStore.getAllKeysAsync failed:', err);
        return [];
      }
    } else {
      // Fallback: not supported
      console.warn('SecureStorage: Key enumeration is not supported on this platform.');
      return [];
    }
  }

  private async computeHash(data: any): Promise<string> {
    const msgBuffer = new TextEncoder().encode(JSON.stringify(data));
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.cache) {
        if (now - value.timestamp > SecureStorage.CACHE_TTL) {
          this.cache.delete(key);
        }
      }
    }, 60000); // Clean up every minute
  }

  // Secure batch operations
  public async secureBatchSet(items: { key: string; value: any }[]): Promise<void> {
    try {
      await Promise.all(
        items.map(item => this.secureSet(item.key, item.value))
      );
    } catch (error) {
      throw new QuantumSecurityError(
        'SECURE_BATCH_SET_FAILED',
        'Failed to store batch data',
        { originalError: error }
      );
    }
  }

  public async secureBatchGet(keys: string[]): Promise<Map<string, any>> {
    try {
      const results = new Map();
      await Promise.all(
        keys.map(async key => {
          const value = await this.secureGet(key);
          if (value !== null) {
            results.set(key, value);
          }
        })
      );
      return results;
    } catch (error) {
      throw new QuantumSecurityError(
        'SECURE_BATCH_GET_FAILED',
        'Failed to retrieve batch data',
        { originalError: error }
      );
    }
  }

  // Secure user preferences
  public async setUserPreferences(userId: string, preferences: any): Promise<void> {
    const key = `user_prefs_${userId}`;
    await this.secureSet(key, {
      ...preferences,
      lastUpdated: Date.now()
    });
  }

  public async getUserPreferences(userId: string): Promise<any> {
    const key = `user_prefs_${userId}`;
    return await this.secureGet(key) || {};
  }

  // Secure wellness data
  public async storeWellnessData(userId: string, data: any): Promise<void> {
    const key = `wellness_${userId}_${Date.now()}`;
    await this.secureSet(key, {
      ...data,
      timestamp: Date.now()
    });
  }

  public async getWellnessHistory(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    const keys = await this.getAllKeys();
    const wellnessKeys = keys.filter(k => 
      k.startsWith(`wellness_${userId}_`)
    );

    const data = await this.secureBatchGet(wellnessKeys);
    return Array.from(data.values())
      .filter(item => 
        item.timestamp >= startDate.getTime() &&
        item.timestamp <= endDate.getTime()
      )
      .sort((a, b) => b.timestamp - a.timestamp);
  }
}
