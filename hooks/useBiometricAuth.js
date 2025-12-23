import { useState, useEffect } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

/**
 * Custom hook for biometric authentication
 * Manages biometric availability, type detection, and credential storage
 */
export const useBiometricAuth = () => {
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState(null);
  const [hasBiometricCredentials, setHasBiometricCredentials] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);

  // Check biometric availability and saved credentials on mount
  useEffect(() => {
    const checkBiometricAvailability = async () => {
      try {
        // Check if biometric hardware is available
        const compatible = await LocalAuthentication.hasHardwareAsync();
        if (!compatible) {
          setBiometricAvailable(false);
          return;
        }

        // Check if biometrics are enrolled
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        if (!enrolled) {
          setBiometricAvailable(false);
          return;
        }

        // Get available authentication types
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (types.length > 0) {
          setBiometricAvailable(true);
          // Determine biometric type for display
          if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
            setBiometricType('Face ID');
          } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
            setBiometricType('Touch ID');
          } else {
            setBiometricType('Biometric');
          }
        }

        // Check if we have saved credentials
        const savedEmail = await SecureStore.getItemAsync('biometricEmail');
        if (savedEmail) {
          setHasBiometricCredentials(true);
        }
      } catch (error) {
        console.error('Error checking biometric availability:', error);
        setBiometricAvailable(false);
      }
    };

    checkBiometricAvailability();
  }, []);

  return {
    biometricAvailable,
    biometricType,
    hasBiometricCredentials,
    setHasBiometricCredentials,
    biometricLoading,
    setBiometricLoading,
  };
};

