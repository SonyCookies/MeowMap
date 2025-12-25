// 1. React and React Native
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
} from 'react-native';

// 2. Third-party libraries
import { FontAwesome } from '@expo/vector-icons';

// 3. Local utilities and hooks
import { formatCooldown } from '../../utils/cooldown';

// 4. Local components
// (None)

// 5. Constants and contexts
import { colors } from '../../constants/theme';

export default function EmailVerificationModal({
  visible,
  cooldown,
  loading,
  onClose,
  onResend,
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.emailVerificationModalContent}>
          {/* Email Icon */}
          <View style={styles.emailVerificationIconContainer}>
            <View style={styles.emailVerificationIconCircle}>
              <FontAwesome name="envelope" size={48} color="#fff" />
            </View>
          </View>

          <Text style={styles.emailVerificationModalTitle}>Email Not Verified</Text>
          <Text style={styles.emailVerificationModalText}>
            Please verify your email address before signing in. We've sent a verification email to your inbox.
          </Text>
          <Text style={styles.emailVerificationModalSubtext}>
            Didn't receive the email? Check your spam folder or click below to resend.
          </Text>

          <View style={styles.emailVerificationButtonContainer}>
            {/* Resend Button */}
            <TouchableOpacity
              style={[
                styles.emailVerificationResendButton,
                (cooldown > 0 || loading) && styles.emailVerificationResendButtonDisabled
              ]}
              onPress={onResend}
              disabled={cooldown > 0 || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.emailVerificationResendButtonText}>
                  {cooldown > 0 
                    ? `Resend in ${formatCooldown(cooldown)}`
                    : 'Resend Verification Email'
                  }
                </Text>
              )}
            </TouchableOpacity>

            <View style={{ height: 12 }} />

            {/* OK Button */}
            <TouchableOpacity
              style={[styles.emailVerificationButton, styles.emailVerificationButtonSecondary]}
              onPress={onClose}
            >
              <Text style={styles.emailVerificationButtonTextSecondary}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.modalOverlay,
  },
  emailVerificationModalContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  emailVerificationIconContainer: {
    marginTop: 8,
    marginBottom: 24,
    alignItems: 'center',
    width: '100%',
  },
  emailVerificationIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailVerificationModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textDark,
    textAlign: 'center',
    marginBottom: 16,
  },
  emailVerificationModalText: {
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  emailVerificationModalSubtext: {
    fontSize: 12,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 32,
    paddingHorizontal: 8,
    fontStyle: 'italic',
  },
  emailVerificationButtonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  emailVerificationButton: {
    backgroundColor: colors.buttonPrimary,
    borderRadius: 8,
    padding: 16,
    width: '100%',
    alignItems: 'center',
  },
  emailVerificationButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emailVerificationButtonTextSecondary: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  emailVerificationResendButton: {
    backgroundColor: colors.buttonPrimary,
    borderRadius: 8,
    padding: 16,
    width: '100%',
    alignItems: 'center',
  },
  emailVerificationResendButtonDisabled: {
    backgroundColor: colors.buttonDisabled,
    opacity: 0.6,
  },
  emailVerificationResendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

