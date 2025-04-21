import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Animated,
  Dimensions,
  Alert
} from 'react-native';
import {
  Text,
  Switch,
  Button,
  Card,
  Title,
  Paragraph,
  List,
  Dialog,
  Portal,
  TextInput
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import { MFAManager } from '../../security/mfaManager';
import { SessionManager } from '../../security/sessionManager';
import { QuantumSecurityError } from '../../security/types';
import LottieView from 'lottie-react-native';

const { width } = Dimensions.get('window');

/**
 * Security Settings Screen for managing MFA, sessions, and security score.
 * @param navigation React Navigation prop
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    padding: 20,
    alignItems: 'center'
  },
  headerAnimation: {
    width: 100,
    height: 100
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10
  },
  section: {
    margin: 10,
    elevation: 2
  },
  scoreCard: {
    margin: 10,
    backgroundColor: '#fff',
    elevation: 4
  },
  scoreContainer: {
    height: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    marginVertical: 10,
    overflow: 'hidden'
  },
  scoreBar: {
    height: '100%',
    backgroundColor: '#4caf50',
    borderRadius: 10
  },
  scoreText: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2
  },
  button: {
    marginTop: 10
  },
  input: {
    marginBottom: 10,
    backgroundColor: '#fff'
  },
  qrContainer: {
    alignItems: 'center',
    marginVertical: 20
  },
  secretText: {
    textAlign: 'center',
    marginVertical: 10,
    fontFamily: 'monospace'
  },
  dialogInstructions: {
    marginTop: 20
  },
  copyButton: {
    marginVertical: 10
  },
  backupWarning: {
    color: '#f44336',
    marginBottom: 10
  },
  codesContainer: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 5
  },
  backupCode: {
    fontFamily: 'monospace',
    fontSize: 16,
    marginVertical: 5,
    textAlign: 'center'
  }
});

const SecuritySettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  // ...existing state and hooks

  // Placeholder for TOTP dialog
  const renderTOTPDialog = () => null;
  // Placeholder for Backup Codes dialog
  const renderBackupCodesDialog = () => null;

  // Render the animated security score bar
  const renderSecurityScore = () => (
    <View style={styles.scoreContainer}>
      <Animated.View
        style={[styles.scoreBar, { width: scoreAnimation.interpolate({
          inputRange: [0, 100],
          outputRange: ['0%', '100%']
        }) }]}
      />
      <Animated.Text style={styles.scoreText}>
        {securityScore}
      </Animated.Text>
    </View>
  );

  const [loading, setLoading] = useState(false);
  const [mfaSettings, setMfaSettings] = useState<{
    recoveryEmail: string;
    totpEnabled: boolean;
    biometricEnabled: boolean;
    pushEnabled: boolean;
  }>({
    totpEnabled: false,
    biometricEnabled: false,
    pushEnabled: false,
    recoveryEmail: ''
  });
  const [sessions, setSessions] = useState<Array<{
    deviceName: string;
    lastActive: Date;
    current: boolean;
    id: string;
  }>>([]);
  const [showTOTPDialog, setShowTOTPDialog] = useState(false);
  const [showBackupCodesDialog, setShowBackupCodesDialog] = useState(false);
  const [totpSecret, setTotpSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [securityScore, setSecurityScore] = useState(0);
  const scoreAnimation = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadSettings();
    loadSessions();
    animateSecurityScore();
  }, []);

  /**
   * Loads MFA settings from the server.
   */
  const loadSettings = async () => {
    try {
      const session = SessionManager.getInstance().getCurrentSession();
      if (!session) return;

      const mfa = MFAManager.getInstance();
      const settings = await MFAManager.getInstance().getMFASettingsPublic(session.userId);
      
      if (settings) {
        setMfaSettings({
          totpEnabled: settings.totpEnabled,
          biometricEnabled: settings.biometricEnabled,
          pushEnabled: settings.pushEnabled,
          recoveryEmail: settings.recoveryEmail
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load security settings');
    }
  };

  /**
   * Loads active sessions from the server.
   */
  const loadSessions = async () => {
    try {
      const sessionManager = SessionManager.getInstance();
      const secureStorage = require('../../security/secureStorage').SecureStorage.getInstance();
      const currentSession = sessionManager.getCurrentSession();
      if (!currentSession) return;

      // Get all active session tokens for the user
      const tokens = await sessionManager.getActiveSessions(currentSession.userId);
      if (!tokens || tokens.length === 0) {
        setSessions([]);
        return;
      }

      // Retrieve session data for each token
      const sessionDetails = await Promise.all(
        tokens.map(async (token: string) => {
          try {
            const sessionData = await secureStorage.secureGet(`session_${token}`);
            if (!sessionData) return null;
            // Decrypt session data
            const decrypted = await sessionManager.security.decryptData(sessionData);
            return {
              deviceName: decrypted.deviceId === currentSession.deviceId ? 'Current Device' : `Device (${decrypted.deviceId.slice(0, 8)})`,
              lastActive: new Date(decrypted.lastRefreshed),
              current: decrypted.token === currentSession.token,
              id: token
            };
          } catch (err) {
            return null;
          }
        })
      );
      setSessions(sessionDetails.filter((s): s is { deviceName: string; lastActive: Date; current: boolean; id: string } => s !== null));
    } catch (error) {
      Alert.alert('Error', 'Failed to load active sessions');
    }
  };

  /**
   * Animates the security score bar.
   */
  const animateSecurityScore = () => {
    // Calculate security score based on enabled features
    const score = calculateSecurityScore();
    setSecurityScore(score);

    Animated.spring(scoreAnimation, {
      toValue: score / 100,
      tension: 20,
      friction: 3,
      useNativeDriver: false
    }).start();
  };

  /**
   * Calculates the security score based on enabled features.
   * @returns The security score (0-100)
   */
  const calculateSecurityScore = (): number => {
    let score = 0;
    if (mfaSettings.totpEnabled) score += 40;
    if (mfaSettings.biometricEnabled) score += 30;
    if (mfaSettings.pushEnabled) score += 20;
    if (mfaSettings.recoveryEmail) score += 10;
    return score;
  };

  /**
   * Toggles MFA settings (TOTP, biometric, push).
   * @param type The type of MFA to toggle
   */
  const handleToggleMFA = async (type: 'totp' | 'biometric' | 'push') => {
    try {
      setLoading(true);
      const session = SessionManager.getInstance().getCurrentSession();
      if (!session) throw new Error('No active session');

      const mfa = MFAManager.getInstance();
      const updates = {
        ...mfaSettings,
        [`${type}Enabled`]: !mfaSettings[`${type}Enabled` as keyof typeof mfaSettings]
      };

      if (type === 'totp' && !mfaSettings.totpEnabled) {
        const result = await mfa.setupMFA(session.userId, {
          enableTOTP: true,
          recoveryEmail: mfaSettings.recoveryEmail
        });
        
        if (result.totpSecret) {
          setTotpSecret(result.totpSecret);
          setShowTOTPDialog(true);
        }
      }

      await mfa.updateMFASettings(session.userId, updates);
      setMfaSettings(updates);
      animateSecurityScore();
    } catch (error) {
      Alert.alert('Error', 'Failed to update MFA settings');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Generates backup codes for TOTP.
   */
  const handleGenerateBackupCodes = async () => {
    try {
      setLoading(true);
      const session = SessionManager.getInstance().getCurrentSession();
      if (!session) throw new Error('No active session');

      const mfa = MFAManager.getInstance();
      const codes = await mfa.regenerateBackupCodes(session.userId);
      setBackupCodes(codes);
      setShowBackupCodesDialog(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate backup codes');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Terminates an active session.
   * @param sessionId The ID of the session to terminate
   */
  const handleTerminateSession = async (sessionId: string) => {
    try {
      const sessionManager = SessionManager.getInstance();
      await sessionManager.destroySession(sessionId);
      loadSessions();
    } catch (error) {
      Alert.alert('Error', 'Failed to terminate session');
    }
  };

  /**
   * Copies the provided text to the clipboard using Expo Clipboard API.
   * @param text The string to copy
   */


// Main render block
return (
  <ScrollView style={styles.container}>
    <LinearGradient
      colors={['#1a237e', '#0d47a1', '#01579b']}
      style={styles.header}
    >
      <LottieView
        source={require('../../assets/animations/security-shield.json')}
        autoPlay
        loop
        style={styles.headerAnimation}
      />
      <Text style={styles.headerTitle}>Security Settings</Text>
    </LinearGradient>
    {renderSecurityScore()}

    <Card style={styles.section}>
      <Card.Content>
        <Title>Multi-Factor Authentication</Title>
        <List.Item
          title="Authenticator App (TOTP)"
          description="Use Google Authenticator or similar apps"
          left={(props: any) => <List.Icon {...props} icon="cellphone-key" />}
          right={() => (
            <Switch
              value={mfaSettings.totpEnabled}
              onValueChange={() => handleToggleMFA('totp')}
              disabled={loading}
              accessibilityLabel="Toggle TOTP Authenticator App"
              accessible
            />
          )}
          accessibilityLabel="Authenticator App (TOTP) option"
          accessible
        />
        <List.Item
          title="Biometric Authentication"
          description="Use fingerprint or face recognition"
          left={(props: any) => <List.Icon {...props} icon="fingerprint" />}
          right={() => (
            <Switch
              value={mfaSettings.biometricEnabled}
              onValueChange={() => handleToggleMFA('biometric')}
              disabled={loading}
              accessibilityLabel="Toggle Biometric Authentication"
              accessible
            />
          )}
          accessibilityLabel="Biometric Authentication option"
          accessible
        />
        <List.Item
          title="Push Notifications"
          description="Receive authentication requests on your device"
          left={(props: any) => <List.Icon {...props} icon="bell-ring" />}
          right={() => (
            <Switch
              value={mfaSettings.pushEnabled}
              onValueChange={() => handleToggleMFA('push')}
              disabled={loading}
              accessibilityLabel="Toggle Push Notification Authentication"
              accessible
            />
          )}
          accessibilityLabel="Push Notifications option"
          accessible
        />
        <Button
          mode="contained"
          onPress={handleGenerateBackupCodes}
          style={styles.button}
          disabled={loading || !mfaSettings.totpEnabled}
          accessibilityLabel="Generate Backup Codes Button"
          accessible
        >
          Generate Backup Codes
        </Button>
      </Card.Content>
    </Card>

    <Card style={styles.section}>
      <Card.Content>
        <Title>Active Sessions</Title>
        {sessions.map((session, index) => (
          <List.Item
            key={index}
            title={session.deviceName}
            description={`Last active: ${session.lastActive.toLocaleString()}`}
            left={(props: any) => (
              <List.Icon
                {...props}
                icon={session.current ? 'cellphone-check' : 'cellphone'}
              />
            )}
            right={() =>
              !session.current && (
                <Button
                  mode="text"
                  onPress={() => handleTerminateSession(session.id)}
                  accessibilityLabel={`Terminate session for ${session.deviceName}`}
                  accessible
                >
                  Terminate
                </Button>
              )
            }
            accessibilityLabel={`Session: ${session.deviceName}`}
            accessible
          />
        ))}
      </Card.Content>
    </Card>

    <Card style={styles.section}>
      <Card.Content>
        <Title>Recovery Options</Title>
        <TextInput
          label="Recovery Email"
          value={mfaSettings.recoveryEmail}
          onChangeText={(text: string) =>
            setMfaSettings(prev => ({ ...prev, recoveryEmail: text }))
          }
          style={styles.input}
          disabled={loading}
          accessibilityLabel="Recovery Email Input"
          accessible
        />
        <Button
          mode="contained"
          onPress={() => {/* Handle recovery email update */}}
          style={styles.button}
          disabled={loading}
          accessibilityLabel="Update Recovery Email Button"
          accessible
        >
          Update Recovery Email
        </Button>
      </Card.Content>
    </Card>

    {/* Dialogs */}
    {renderTOTPDialog()}
    {renderBackupCodesDialog()}
  </ScrollView>
);

// Move styles to the very top of the file
}

export default SecuritySettingsScreen;
