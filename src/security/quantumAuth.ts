import { SecurityService } from './securityService';
import { QuantumKeyExchange } from './quantumKeyExchange';
import { SecureStorage } from './secureStorage';
import { QuantumSecurityError, QuantumKeyPair } from './types';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Buffer } from 'buffer';

interface AuthState {
  userId: string;
  sessionId: string;
  keyPair: QuantumKeyPair;
  timestamp: number;
  deviceId: string;
}

export class QuantumAuth {
  private static instance: QuantumAuth;
  private security: SecurityService;
  private qke: QuantumKeyExchange;
  private storage: SecureStorage;
  private currentState: AuthState | null = null;
  private static readonly SESSION_DURATION = 3600000; // 1 hour
  private static readonly REFRESH_THRESHOLD = 300000; // 5 minutes
  private static readonly MAX_FAILED_ATTEMPTS = 5;
  private static readonly LOCKOUT_DURATION = 900000; // 15 minutes

  private constructor() {
    this.security = SecurityService.getInstance();
    this.qke = new QuantumKeyExchange();
    this.storage = SecureStorage.getInstance();
    this.startSessionMonitor();
  }

  public static getInstance(): QuantumAuth {
    if (!QuantumAuth.instance) {
      QuantumAuth.instance = new QuantumAuth();
    }
    return QuantumAuth.instance;
  }

  public async register(
    username: string,
    password: string,
    biometricData?: Float32Array
  ): Promise<string> {
    try {
      // Generate quantum-resistant key pair
      const quantumSession = await this.qke.establishSession();
      
      // Generate device ID
      const deviceId = await this.generateDeviceId();

      // Create quantum-enhanced salt
      const salt = await this.generateQuantumSalt();

      // Hash password with quantum salt
      const hashedPassword = await this.hashPassword(password, salt);

      // Create user credentials
      const credentials = {
        username,
        hashedPassword,
        salt,
        deviceId,
        publicKey: quantumSession.keyPair.publicKey,
        biometricHash: biometricData ? await this.hashBiometricData(biometricData) : null,
        createdAt: Date.now()
      };

      // Store credentials securely
      await this.storage.secureSet(
        `user_${username}`,
        await this.security.encryptData(credentials)
      );

      // Initialize authentication state
      await this.initializeAuthState(username, deviceId, quantumSession);

      return this.currentState!.userId;
    } catch (error) {
      throw new QuantumSecurityError(
        'REGISTRATION_FAILED',
        'Failed to register user',
        { originalError: error }
      );
    }
  }

  public async login(
    username: string,
    password: string,
    biometricData?: Float32Array
  ): Promise<boolean> {
    try {
      // Check for account lockout
      await this.checkLockoutStatus(username);

      // Retrieve encrypted credentials
      const encryptedCreds = await this.storage.secureGet(`user_${username}`);
      if (!encryptedCreds) {
        await this.handleFailedLogin(username);
        return false;
      }

      // Decrypt credentials
      const credentials = await this.security.decryptData(encryptedCreds);

      // Verify password
      const hashedPassword = await this.hashPassword(password, credentials.salt);
      if (hashedPassword !== credentials.hashedPassword) {
        await this.handleFailedLogin(username);
        return false;
      }

      // Verify biometric data if provided
      if (biometricData && credentials.biometricHash) {
        const biometricHash = await this.hashBiometricData(biometricData);
        if (biometricHash !== credentials.biometricHash) {
          await this.handleFailedLogin(username);
          return false;
        }
      }

      // Establish new quantum session
      const quantumSession = await this.qke.establishSession();

      // Initialize authentication state
      await this.initializeAuthState(username, credentials.deviceId, quantumSession);

      // Clear failed login attempts
      await this.clearFailedAttempts(username);

      return true;
    } catch (error) {
      throw new QuantumSecurityError(
        'LOGIN_FAILED',
        'Failed to log in user',
        { originalError: error }
      );
    }
  }

  public async logout(): Promise<void> {
    try {
      if (this.currentState) {
        // Revoke quantum session
        // TODO: revoke quantum session if supported by QuantumKeyExchange
      // await this.qke.revokeSession(this.currentState.sessionId);
        
        // Clear authentication state
        this.currentState = null;
        
        // Clear sensitive data from secure storage
        await this.storage.secureClear();
      }
    } catch (error) {
      throw new QuantumSecurityError(
        'LOGOUT_FAILED',
        'Failed to log out user',
        { originalError: error }
      );
    }
  }

  public async refreshSession(): Promise<boolean> {
    try {
      if (!this.currentState) return false;

      const age = Date.now() - this.currentState.timestamp;
      if (age >= QuantumAuth.SESSION_DURATION) {
        await this.logout();
        return false;
      }

      if (age >= QuantumAuth.REFRESH_THRESHOLD) {
        // Establish new quantum session
        const quantumSession = await this.qke.establishSession();
        
        // Update authentication state
        this.currentState = {
          ...this.currentState,
          sessionId: quantumSession.id,
          keyPair: quantumSession.keyPair,
          timestamp: Date.now()
        };
      }

      return true;
    } catch (error) {
      throw new QuantumSecurityError(
        'SESSION_REFRESH_FAILED',
        'Failed to refresh authentication session',
        { originalError: error }
      );
    }
  }

  public async updateCredentials(
    currentPassword: string,
    newPassword?: string,
    newBiometricData?: Float32Array
  ): Promise<boolean> {
    try {
      if (!this.currentState) return false;

      // Retrieve and decrypt current credentials
      const encryptedCreds = await this.storage.secureGet(
        `user_${this.currentState.userId}`
      );
      const credentials = await this.security.decryptData(encryptedCreds);

      // Verify current password
      const hashedCurrentPassword = await this.hashPassword(
        currentPassword,
        credentials.salt
      );
      if (hashedCurrentPassword !== credentials.hashedPassword) {
        return false;
      }

      // Update password if provided
      if (newPassword) {
        const newSalt = await this.generateQuantumSalt();
        credentials.salt = newSalt;
        credentials.hashedPassword = await this.hashPassword(newPassword, newSalt);
      }

      // Update biometric data if provided
      if (newBiometricData) {
        credentials.biometricHash = await this.hashBiometricData(newBiometricData);
      }

      // Store updated credentials
      await this.storage.secureSet(
        `user_${this.currentState.userId}`,
        await this.security.encryptData(credentials)
      );

      return true;
    } catch (error) {
      throw new QuantumSecurityError(
        'CREDENTIAL_UPDATE_FAILED',
        'Failed to update credentials',
        { originalError: error }
      );
    }
  }

  private async generateDeviceId(): Promise<string> {
    const buffer = await Crypto.getRandomBytesAsync(32);
    return Buffer.from(buffer).toString('base64');
  }

  private async generateQuantumSalt(): Promise<string> {
    // Use quantum entropy from keyPair.secretKey (first 32 bytes)
    const quantumSession = await this.qke.establishSession();
    const quantumBytes = new Uint8Array(quantumSession.keyPair.secretKey.buffer).slice(0, 32);
    const regularBytes = await Crypto.getRandomBytesAsync(32);
    
    // Combine quantum and regular randomness
    const combined = new Uint8Array(64);
    combined.set(new Uint8Array(quantumBytes), 0);
    combined.set(new Uint8Array(regularBytes), 32);
    
    return Buffer.from(combined).toString('base64');
  }

  private async hashPassword(
    password: string,
    salt: string
  ): Promise<string> {
    const data = Buffer.from(password + salt).toString('base64');
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA512,
      data
    );
    return hash;
  }

  private async hashBiometricData(
    biometricData: Float32Array
  ): Promise<string> {
    const data = Buffer.from(biometricData.buffer).toString('base64');
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA512,
      data
    );
    return hash;
  }

  private async initializeAuthState(
    username: string,
    deviceId: string,
    quantumSession: any
  ): Promise<void> {
    this.currentState = {
      userId: username,
      sessionId: quantumSession.id,
      keyPair: quantumSession.keyPair,
      timestamp: Date.now(),
      deviceId
    };
  }

  private async handleFailedLogin(username: string): Promise<void> {
    const key = `failed_attempts_${username}`;
    const attempts = await this.storage.secureGet(key) || 0;
    
    if (attempts + 1 >= QuantumAuth.MAX_FAILED_ATTEMPTS) {
      await this.storage.secureSet(`lockout_${username}`, Date.now());
    }
    
    await this.storage.secureSet(key, attempts + 1);
  }

  private async checkLockoutStatus(username: string): Promise<void> {
    const lockoutTime = await this.storage.secureGet(`lockout_${username}`);
    if (!lockoutTime) return;

    const elapsed = Date.now() - lockoutTime;
    if (elapsed < QuantumAuth.LOCKOUT_DURATION) {
      throw new QuantumSecurityError(
        'ACCOUNT_LOCKED',
        'Account is temporarily locked due to too many failed attempts',
        { remainingTime: QuantumAuth.LOCKOUT_DURATION - elapsed }
      );
    }

    // Clear lockout if duration has passed
    await this.clearFailedAttempts(username);
  }

  private async clearFailedAttempts(username: string): Promise<void> {
    await this.storage.secureDelete(`failed_attempts_${username}`);
    await this.storage.secureDelete(`lockout_${username}`);
  }

  private startSessionMonitor(): void {
    setInterval(async () => {
      try {
        await this.refreshSession();
      } catch (error) {
        console.error('Session refresh failed:', error);
      }
    }, QuantumAuth.REFRESH_THRESHOLD);
  }

  public getAuthStatus(): {
    isAuthenticated: boolean;
    sessionTimeRemaining?: number;
  } {
    if (!this.currentState) {
      return { isAuthenticated: false };
    }

    const timeRemaining = Math.max(
      0,
      QuantumAuth.SESSION_DURATION - (Date.now() - this.currentState.timestamp)
    );

    return {
      isAuthenticated: timeRemaining > 0,
      sessionTimeRemaining: timeRemaining
    };
  }
}
