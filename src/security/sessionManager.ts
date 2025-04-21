import { SecurityService } from './securityService';
import { QuantumKeyExchange } from './quantumKeyExchange';
import { SecureStorage } from './secureStorage';
import { QuantumSecurityError } from './types';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';

interface SessionData {
  userId: string;
  token: string;
  quantumKey: string;
  createdAt: number;
  lastRefreshed: number;
  deviceId: string;
  biometricVerified: boolean;
  mfaVerified: boolean;
}

export class SessionManager {
  private static instance: SessionManager;
  /**
 * Exposed for session data decryption in UI (SecuritySettingsScreen, etc.).
 * Only use for legitimate session management flows.
 */
public security: SecurityService;
  private qke: QuantumKeyExchange;
  private storage: SecureStorage;
  
  private static readonly SESSION_DURATION = 3600000; // 1 hour
  private static readonly REFRESH_THRESHOLD = 300000; // 5 minutes
  private static readonly MAX_SESSIONS = 5;
  private currentSession: SessionData | null = null;

  private constructor() {
    this.security = SecurityService.getInstance();
    this.qke = new QuantumKeyExchange();
    this.storage = SecureStorage.getInstance();
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  public async createSession(
    userId: string,
    useBiometric: boolean = false
  ): Promise<SessionData> {
    try {
      // Generate quantum session token
      const quantumKey = await this.qke.generateQuantumKey();
      const token = await this.generateSessionToken();
      const deviceId = await this.getDeviceId();

      let biometricVerified = false;
      if (useBiometric) {
        biometricVerified = await this.verifyBiometric();
      }

      const session: SessionData = {
        userId,
        token,
        quantumKey,
        createdAt: Date.now(),
        lastRefreshed: Date.now(),
        deviceId,
        biometricVerified,
        mfaVerified: false
      };

      // Store session data
      await this.storage.secureSet(
        `session_${token}`,
        await this.security.encryptData(session)
      );

      // Update active sessions list
      await this.manageActiveSessions(userId, token);

      this.currentSession = session;
      return session;
    } catch (error) {
      throw new QuantumSecurityError(
        'SESSION_CREATION_FAILED',
        'Failed to create secure session',
        { originalError: error }
      );
    }
  }

  public async validateSession(token: string): Promise<boolean> {
    try {
      const sessionData = await this.storage.secureGet(`session_${token}`);
      if (!sessionData) return false;

      const session: SessionData = await this.security.decryptData(sessionData);
      
      // Verify session age
      const now = Date.now();
      if (now - session.createdAt > SessionManager.SESSION_DURATION) {
        await this.destroySession(token);
        return false;
      }

      // Verify device
      const currentDeviceId = await this.getDeviceId();
      if (session.deviceId !== currentDeviceId) {
        await this.destroySession(token);
        return false;
      }

      // Check if refresh is needed
      if (now - session.lastRefreshed > SessionManager.REFRESH_THRESHOLD) {
        await this.refreshSession(token);
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  public async refreshSession(token: string): Promise<void> {
    try {
      const sessionData = await this.storage.secureGet(`session_${token}`);
      if (!sessionData) {
        throw new Error('Session not found');
      }

      const session: SessionData = await this.security.decryptData(sessionData);
      
      // Generate new quantum key
      session.quantumKey = await this.qke.generateQuantumKey();
      session.lastRefreshed = Date.now();

      // Update session storage
      await this.storage.secureSet(
        `session_${token}`,
        await this.security.encryptData(session)
      );

      if (this.currentSession?.token === token) {
        this.currentSession = session;
      }
    } catch (error) {
      throw new QuantumSecurityError(
        'SESSION_REFRESH_FAILED',
        'Failed to refresh session',
        { originalError: error }
      );
    }
  }

  public async destroySession(token: string): Promise<void> {
    try {
      // Get session data
      const sessionData = await this.storage.secureGet(`session_${token}`);
      if (!sessionData) return;

      const session: SessionData = await this.security.decryptData(sessionData);
      
      // Remove from active sessions
      const activeSessions = await this.getActiveSessions(session.userId);
      const updatedSessions = activeSessions.filter(t => t !== token);
      
      await this.storage.secureSet(
        `active_sessions_${session.userId}`,
        await this.security.encryptData(updatedSessions)
      );

      // Delete session data
      await this.storage.secureDelete(`session_${token}`);

      if (this.currentSession?.token === token) {
        this.currentSession = null;
      }
    } catch (error) {
      throw new QuantumSecurityError(
        'SESSION_DESTRUCTION_FAILED',
        'Failed to destroy session',
        { originalError: error }
      );
    }
  }

  public async destroyAllSessions(userId: string): Promise<void> {
    try {
      const activeSessions = await this.getActiveSessions(userId);
      
      // Destroy each session
      await Promise.all(
        activeSessions.map(token => this.destroySession(token))
      );

      // Clear active sessions list
      await this.storage.secureDelete(`active_sessions_${userId}`);
    } catch (error) {
      throw new QuantumSecurityError(
        'ALL_SESSIONS_DESTRUCTION_FAILED',
        'Failed to destroy all sessions',
        { originalError: error }
      );
    }
  }

  public getCurrentSession(): SessionData | null {
    return this.currentSession;
  }

  private async manageActiveSessions(
    userId: string,
    newToken: string
  ): Promise<void> {
    const activeSessions = await this.getActiveSessions(userId);
    
    // Add new session
    activeSessions.push(newToken);

    // Remove oldest sessions if limit exceeded
    while (activeSessions.length > SessionManager.MAX_SESSIONS) {
      const oldestToken = activeSessions.shift();
      if (oldestToken) {
        await this.destroySession(oldestToken);
      }
    }

    // Update active sessions list
    await this.storage.secureSet(
      `active_sessions_${userId}`,
      await this.security.encryptData(activeSessions)
    );
  }

  /**
 * Returns all active session tokens for the given user.
 * Used for session management UI and cleanup.
 */
public async getActiveSessions(userId: string): Promise<string[]> {
    try {
      const sessionsData = await this.storage.secureGet(
        `active_sessions_${userId}`
      );
      
      if (!sessionsData) return [];
      
      return await this.security.decryptData(sessionsData);
    } catch (error) {
      return [];
    }
  }

  private async generateSessionToken(): Promise<string> {
    const quantumBytes = await this.qke.generateQuantumRandomness(32);
    const regularBytes = await Crypto.getRandomBytesAsync(32);
    
    const combined = new Uint8Array(64);
    combined.set(new Uint8Array(quantumBytes), 0);
    combined.set(new Uint8Array(regularBytes), 32);
    
    return await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      combined
    );
  }

  private async getDeviceId(): Promise<string> {
    try {
      const storedId = await SecureStore.getItemAsync('device_id');
      if (storedId) return storedId;

      // Generate new device ID
      const deviceInfo = {
        platform: Platform.OS,
        version: Platform.Version,
        brand: Platform.select({ ios: 'Apple', android: 'Android' }),
        timestamp: Date.now()
      };

      const deviceId = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        JSON.stringify(deviceInfo)
      );

      await SecureStore.setItemAsync('device_id', deviceId);
      return deviceId;
    } catch (error) {
      throw new Error('Failed to generate device ID');
    }
  }

  private async verifyBiometric(): Promise<boolean> {
    try {
      const available = await LocalAuthentication.hasHardwareAsync();
      if (!available) return false;

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Verify your identity',
        disableDeviceFallback: false
      });

      return result.success;
    } catch (error) {
      return false;
    }
  }
}
