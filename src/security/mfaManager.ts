import { SecurityService } from './securityService';
import { QuantumKeyExchange } from './quantumKeyExchange';
import { SecureStorage } from './secureStorage';
import { QuantumSecurityError } from './types';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
// TODO: Implement TOTP/OTP logic (otplib removed for build compatibility)
import * as LocalAuthentication from 'expo-local-authentication';
import { SessionManager } from './sessionManager';

interface MFASettings {
  userId: string;
  totpEnabled: boolean;
  totpSecret?: string;
  backupCodes: string[];
  biometricEnabled: boolean;
  pushEnabled: boolean;
  lastVerified: number;
  recoveryEmail: string;
}

export class MFAManager {
  private static instance: MFAManager;
  private security: SecurityService;
  private qke: QuantumKeyExchange;
  private storage: SecureStorage;
  private sessionManager: SessionManager;

  private static readonly BACKUP_CODES_COUNT = 10;
  private static readonly VERIFICATION_TIMEOUT = 300000; // 5 minutes

  private constructor() {
    this.security = SecurityService.getInstance();
    this.qke = new QuantumKeyExchange();
    this.storage = SecureStorage.getInstance();
    this.sessionManager = SessionManager.getInstance();
    
    // Configure TOTP settings
    // TODO: OTP logic (authenticator removed for build compatibility)
  }

  public static getInstance(): MFAManager {
    if (!MFAManager.instance) {
      MFAManager.instance = new MFAManager();
    }
    return MFAManager.instance;
  }

  // --- Move all private methods above their first usage ---

  private async generateTOTPSecret(): Promise<string> {
    const quantumSession = await this.qke.establishSession();
    const quantumBytesArr = new Uint8Array(quantumSession.keyPair.secretKey.buffer);
    const quantumBytes = Array.from(quantumBytesArr).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
    // Convert quantumBytes (hex string) to bytes for Uint8Array
    const quantumBytesArrFixed = new Uint8Array(quantumBytes.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    const regularBytes = await Crypto.getRandomBytesAsync(32);
    const combined = new Uint8Array(64);
    combined.set(quantumBytesArrFixed, 0);
    combined.set(new Uint8Array(regularBytes), 32);
    return Buffer.from(combined).toString('base64');
  }

  private async generateBackupCodes(): Promise<string[]> {
    const codes: string[] = [];
    for (let i = 0; i < MFAManager.BACKUP_CODES_COUNT; i++) {
      // Use quantum entropy from keyPair.secretKey (first 8 bytes)
      const quantumSession = await this.qke.establishSession();
      const quantumBytes = new Uint8Array(quantumSession.keyPair.secretKey.buffer).slice(0, 8);
      const regularBytes = await Crypto.getRandomBytesAsync(8);
      const combined = new Uint8Array(16);
      combined.set(quantumBytes, 0);
      combined.set(new Uint8Array(regularBytes), 8);
      const code = Buffer.from(combined)
        .toString('hex')
        .toUpperCase()
        .match(/.{4}/g)
        ?.join('-');
      if (code) codes.push(code);
    }
    return codes;
  }

  private async getMFASettings(userId: string): Promise<MFASettings | null> {
    try {
      const settingsData = await this.storage.secureGet(`mfa_${userId}`);
      if (!settingsData) return null;
      return await this.security.decryptData(settingsData);
    } catch (error) {
      return null;
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

  private async verifyBackupCode(
    settings: MFASettings,
    code: string
  ): Promise<boolean> {
    const normalizedCode = code.toUpperCase().replace(/-/g, '');
    const index = settings.backupCodes.findIndex(
      bc => bc.replace(/-/g, '') === normalizedCode
    );
    if (index === -1) return false;
    // Remove used backup code
    settings.backupCodes.splice(index, 1);
    await this.storage.secureSet(
      `mfa_${settings.userId}`,
      await this.security.encryptData(settings)
    );
    return true;
  }

  private async verifyPushNotification(userId: string): Promise<boolean> {
    // Implementation depends on push notification service
    // This is a placeholder that simulates push verification
    return new Promise(resolve => {
      setTimeout(() => resolve(true), 1000);
    });
  }

  // --- End moved methods ---

  public async setupMFA(
    userId: string,
    options: {
      enableTOTP?: boolean;
      enableBiometric?: boolean;
      enablePush?: boolean;
      recoveryEmail: string;
    }
  ): Promise<{ totpSecret?: string; backupCodes?: string[] }> {
    try {
      const settings: MFASettings = {
        userId,
        totpEnabled: options.enableTOTP || false,
        biometricEnabled: options.enableBiometric || false,
        pushEnabled: options.enablePush || false,
        backupCodes: [],
        lastVerified: 0,
        recoveryEmail: options.recoveryEmail
      };

      if (options.enableTOTP) {
        // Generate quantum-enhanced TOTP secret
        settings.totpSecret = await this.generateTOTPSecret();
      }

      // Generate backup codes
      settings.backupCodes = await this.generateBackupCodes();

      // Store MFA settings
      await this.storage.secureSet(
        `mfa_${userId}`,
        await this.security.encryptData(settings)
      );

      return {
        totpSecret: settings.totpSecret,
        backupCodes: settings.backupCodes
      };
    } catch (error) {
      throw new QuantumSecurityError(
        'MFA_SETUP_FAILED',
        'Failed to set up multi-factor authentication',
        { originalError: error }
      );
    }
  }

  public async verifyMFA(
    userId: string,
    method: 'totp' | 'biometric' | 'backup' | 'push',
    token?: string
  ): Promise<boolean> {
    try {
      const settings = await this.getMFASettings(userId);
      if (!settings) return false;

      let verified = false;

      switch (method) {
        case 'totp':
          if (!settings.totpEnabled || !settings.totpSecret || !token) {
            return false;
          }
          // TODO: OTP logic (authenticator removed for build compatibility)
          // verified = authenticator.verify({ token, secret: settings.totpSecret });
          verified = false;
          break;

        case 'biometric':
          if (!settings.biometricEnabled) return false;
          verified = await this.verifyBiometric();
          break;

        case 'backup':
          if (!token) return false;
          verified = await this.verifyBackupCode(settings, token);
          break;

        case 'push':
          if (!settings.pushEnabled) return false;
          verified = await this.verifyPushNotification(userId);
          break;
      }

      if (verified) {
        // Update last verification time
        settings.lastVerified = Date.now();
        await this.storage.secureSet(
          `mfa_${userId}`,
          await this.security.encryptData(settings)
        );

        // Update session MFA status
        const session = this.sessionManager.getCurrentSession();
        if (session) {
          session.mfaVerified = true;
          await this.storage.secureSet(
            `session_${session.token}`,
            await this.security.encryptData(session)
          );
        }
      }

      return verified;
    } catch (error) {
      throw new QuantumSecurityError(
        'MFA_VERIFICATION_FAILED',
        'Failed to verify multi-factor authentication',
        { originalError: error }
      );
    }
  }

  public async updateMFASettings(
    userId: string,
    updates: Partial<MFASettings>
  ): Promise<void> {
    try {
      const settings = await this.getMFASettings(userId);
      if (!settings) {
        throw new Error('MFA not set up for user');
      }

      const updatedSettings = { ...settings, ...updates };
      
      // If TOTP is being enabled, generate new secret
      if (updates.totpEnabled && !settings.totpEnabled) {
        updatedSettings.totpSecret = await this.generateTOTPSecret();
      }

      await this.storage.secureSet(
        `mfa_${userId}`,
        await this.security.encryptData(updatedSettings)
      );
    } catch (error) {
      throw new QuantumSecurityError(
        'MFA_UPDATE_FAILED',
        'Failed to update MFA settings',
        { originalError: error }
      );
    }
  }

  public async disableMFA(userId: string): Promise<void> {
    try {
      await this.storage.secureDelete(`mfa_${userId}`);
      
      // Update current session
      const session = this.sessionManager.getCurrentSession();
      if (session && session.userId === userId) {
        session.mfaVerified = false;
        await this.storage.secureSet(
          `session_${session.token}`,
          await this.security.encryptData(session)
        );
      }
    } catch (error) {
      throw new QuantumSecurityError(
        'MFA_DISABLE_FAILED',
        'Failed to disable MFA',
        { originalError: error }
      );
    }
  }

  public async regenerateBackupCodes(
    userId: string
  ): Promise<string[]> {
    try {
      const settings = await this.getMFASettings(userId);
      if (!settings) {
        throw new Error('MFA not set up for user');
      }

      settings.backupCodes = await this.generateBackupCodes();
      
      await this.storage.secureSet(
        `mfa_${userId}`,
        await this.security.encryptData(settings)
      );

      return settings.backupCodes;
    } catch (error) {
      throw new QuantumSecurityError(
        'BACKUP_CODES_GENERATION_FAILED',
        'Failed to regenerate backup codes',
        { originalError: error }
      );
    }
  }

  /**
   * Public wrapper for retrieving MFA settings for a user.
   * @param userId The user ID
   * @returns MFA settings object
   */
  public async getMFASettingsPublic(userId: string): Promise<any> {
    return this.getMFASettings(userId);
  }


}
