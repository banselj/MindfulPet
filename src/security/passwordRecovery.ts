import { SecurityService } from './securityService';
import { QuantumKeyExchange } from './quantumKeyExchange';
import { SecureStorage } from './secureStorage';
import { QuantumSecurityError } from './types';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

interface RecoveryToken {
  token: string;
  userId: string;
  timestamp: number;
  attempts: number;
}

export class PasswordRecovery {
  private static instance: PasswordRecovery;
  private security: SecurityService;
  private qke: QuantumKeyExchange;
  private storage: SecureStorage;
  private static readonly TOKEN_EXPIRY = 900000; // 15 minutes
  private static readonly MAX_ATTEMPTS = 3;
  private static readonly RECOVERY_QUESTIONS = [
    "What was the name of your first pet?",
    "In which city were you born?",
    "What was your childhood nickname?",
    "What was the model of your first car?",
    "What was your favorite subject in school?"
  ];

  private constructor() {
    this.security = SecurityService.getInstance();
    this.qke = new QuantumKeyExchange();
    this.storage = SecureStorage.getInstance();
  }

  public static getInstance(): PasswordRecovery {
    if (!PasswordRecovery.instance) {
      PasswordRecovery.instance = new PasswordRecovery();
    }
    return PasswordRecovery.instance;
  }

  public async setupRecoveryQuestions(
    userId: string,
    answers: { [key: string]: string }
  ): Promise<void> {
    try {
      // Generate quantum salt for each answer
      const securedAnswers = await Promise.all(
        Object.entries(answers).map(async ([question, answer]) => {
          const salt = await this.generateQuantumSalt();
          const hash = await this.hashAnswer(answer, salt);
          return {
            question,
            hash,
            salt
          };
        })
      );

      // Encrypt and store recovery data
      await this.storage.secureSet(
        `recovery_${userId}`,
        await this.security.encryptData({
          answers: securedAnswers,
          timestamp: Date.now()
        })
      );
    } catch (error) {
      throw new QuantumSecurityError(
        'RECOVERY_SETUP_FAILED',
        'Failed to set up recovery questions',
        { originalError: error }
      );
    }
  }

  public async initiateRecovery(
    username: string,
    email: string
  ): Promise<string> {
    try {
      // Verify user exists
      const userData = await this.storage.secureGet(`user_${username}`);
      if (!userData) {
        throw new Error('User not found');
      }

      const decryptedUser = await this.security.decryptData(userData);
      if (decryptedUser.email !== email) {
        throw new Error('Email does not match');
      }

      // Generate quantum-enhanced recovery token
      const token = await this.generateRecoveryToken();
      
      // Store token with metadata
      const recoveryToken: RecoveryToken = {
        token,
        userId: username,
        timestamp: Date.now(),
        attempts: 0
      };

      await this.storage.secureSet(
        `token_${token}`,
        await this.security.encryptData(recoveryToken)
      );

      // Send recovery email (implementation depends on email service)
      await this.sendRecoveryEmail(email, token);

      return token;
    } catch (error) {
      throw new QuantumSecurityError(
        'RECOVERY_INITIATION_FAILED',
        'Failed to initiate password recovery',
        { originalError: error }
      );
    }
  }

  public async verifyRecoveryToken(
    token: string
  ): Promise<{ valid: boolean; userId?: string }> {
    try {
      const storedToken = await this.storage.secureGet(`token_${token}`);
      if (!storedToken) {
        return { valid: false };
      }

      const recoveryToken: RecoveryToken = await this.security.decryptData(storedToken);
      
      // Check expiry
      if (Date.now() - recoveryToken.timestamp > PasswordRecovery.TOKEN_EXPIRY) {
        await this.storage.secureDelete(`token_${token}`);
        return { valid: false };
      }

      // Check attempts
      if (recoveryToken.attempts >= PasswordRecovery.MAX_ATTEMPTS) {
        await this.storage.secureDelete(`token_${token}`);
        return { valid: false };
      }

      return {
        valid: true,
        userId: recoveryToken.userId
      };
    } catch (error) {
      throw new QuantumSecurityError(
        'TOKEN_VERIFICATION_FAILED',
        'Failed to verify recovery token',
        { originalError: error }
      );
    }
  }

  public async verifyRecoveryAnswers(
    userId: string,
    answers: { [key: string]: string }
  ): Promise<boolean> {
    try {
      const recoveryData = await this.storage.secureGet(`recovery_${userId}`);
      if (!recoveryData) {
        return false;
      }

      const decryptedData = await this.security.decryptData(recoveryData);
      const storedAnswers = decryptedData.answers;

      // Verify each answer
      for (const storedAnswer of storedAnswers) {
        const providedAnswer = answers[storedAnswer.question];
        if (!providedAnswer) return false;

        const hash = await this.hashAnswer(providedAnswer, storedAnswer.salt);
        if (hash !== storedAnswer.hash) return false;
      }

      return true;
    } catch (error) {
      throw new QuantumSecurityError(
        'ANSWER_VERIFICATION_FAILED',
        'Failed to verify recovery answers',
        { originalError: error }
      );
    }
  }

  public async resetPassword(
    token: string,
    newPassword: string,
    answers: { [key: string]: string }
  ): Promise<boolean> {
    try {
      // Verify token
      const tokenStatus = await this.verifyRecoveryToken(token);
      if (!tokenStatus.valid || !tokenStatus.userId) {
        return false;
      }

      // Verify recovery answers
      const answersValid = await this.verifyRecoveryAnswers(
        tokenStatus.userId,
        answers
      );
      if (!answersValid) {
        // Increment failed attempts
        const storedToken = await this.storage.secureGet(`token_${token}`);
        const recoveryToken: RecoveryToken = await this.security.decryptData(storedToken);
        recoveryToken.attempts++;
        
        await this.storage.secureSet(
          `token_${token}`,
          await this.security.encryptData(recoveryToken)
        );
        
        return false;
      }

      // Generate new quantum salt
      const salt = await this.generateQuantumSalt();
      
      // Hash new password
      const hashedPassword = await this.hashPassword(newPassword, salt);

      // Update user credentials
      const userData = await this.storage.secureGet(`user_${tokenStatus.userId}`);
      const decryptedUser = await this.security.decryptData(userData);
      
      decryptedUser.hashedPassword = hashedPassword;
      decryptedUser.salt = salt;

      await this.storage.secureSet(
        `user_${tokenStatus.userId}`,
        await this.security.encryptData(decryptedUser)
      );

      // Clean up recovery token
      await this.storage.secureDelete(`token_${token}`);

      return true;
    } catch (error) {
      throw new QuantumSecurityError(
        'PASSWORD_RESET_FAILED',
        'Failed to reset password',
        { originalError: error }
      );
    }
  }

  public getRecoveryQuestions(): string[] {
    return PasswordRecovery.RECOVERY_QUESTIONS;
  }

  private async generateQuantumSalt(): Promise<string> {
    const quantumBytes = await this.qke.generateQuantumRandomness(32);
    const regularBytes = await Crypto.getRandomBytesAsync(32);
    
    // Combine quantum and regular randomness
    const combined = new Uint8Array(64);
    combined.set(new Uint8Array(quantumBytes), 0);
    combined.set(new Uint8Array(regularBytes), 32);
    
    return Buffer.from(combined).toString('base64');
  }

  private async generateRecoveryToken(): Promise<string> {
    const quantumBytes = await this.qke.generateQuantumRandomness(32);
    const regularBytes = await Crypto.getRandomBytesAsync(32);
    
    // Combine and hash for token
    const combined = new Uint8Array(64);
    combined.set(new Uint8Array(quantumBytes), 0);
    combined.set(new Uint8Array(regularBytes), 32);
    
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      combined
    );
    
    return hash;
  }

  private async hashAnswer(
    answer: string,
    salt: string
  ): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(answer.toLowerCase().trim() + salt);
    return await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA512,
      data
    );
  }

  private async hashPassword(
    password: string,
    salt: string
  ): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + salt);
    return await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA512,
      data
    );
  }

  private async sendRecoveryEmail(
    email: string,
    token: string
  ): Promise<void> {
    // Implementation depends on email service
    // This is a placeholder for the actual email sending logic
    console.log(`Recovery email sent to ${email} with token ${token}`);
  }
}
