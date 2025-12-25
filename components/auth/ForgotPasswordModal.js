// 1. React and React Native
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';

// 2. Third-party libraries
// (None)

// 3. Local utilities and hooks
import { formatCooldown } from '../../utils/cooldown';

// 4. Local components
import EmailInput from './EmailInput';

// 5. Constants and contexts
import { colors } from '../../constants/theme';

export default function ForgotPasswordModal({
  visible,
  email,
  onEmailChange,
  cooldown,
  loading,
  onClose,
  onSubmit,
  onSignInPress,
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View style={styles.closeButtonPlaceholder} />
            <TouchableOpacity 
              onPress={onClose}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Logo */}
          <View style={styles.modalLogoContainer}>
            <Image 
              source={require('../../assets/images/Logo.png')}
              style={styles.modalLogo}
              resizeMode="contain"
            />
          </View>

          {/* Wordmark */}
          <View style={styles.modalWordmarkContainer}>
            <Image 
              source={require('../../assets/images/Wordmark.png')}
              style={styles.modalWordmark}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.modalTitle}>Forgot Password</Text>
          <Text style={styles.forgotPasswordSubtitle}>
            Enter your email address and we'll send you a link to reset your password.
          </Text>

          <EmailInput
            value={email}
            onChangeText={onEmailChange}
            editable={!loading}
          />

          <TouchableOpacity
            style={[
              styles.primaryButton,
              (loading || cooldown > 0) && styles.buttonDisabled
            ]}
            onPress={onSubmit}
            disabled={loading || cooldown > 0}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {cooldown > 0 
                  ? `Resend in ${formatCooldown(cooldown)}`
                  : 'Send Reset Link'
                }
              </Text>
            )}
          </TouchableOpacity>

          {cooldown > 0 && (
            <View style={styles.forgotPasswordSuccessContainer}>
              <Text style={styles.forgotPasswordCooldownText}>
                If an account exists with this email, a password reset link has been sent. Please check your inbox and spam folder.
              </Text>
              <Text style={[styles.forgotPasswordCooldownText, { marginTop: 8, fontSize: 12 }]}>
                You can request another email in {formatCooldown(cooldown)}.
              </Text>
            </View>
          )}

          <View style={styles.switchContainer}>
            <Text style={styles.switchText}>Remember your password? </Text>
            <TouchableOpacity 
              onPress={onSignInPress}
              disabled={loading}
            >
              <Text style={styles.switchLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 0,
  },
  closeButtonPlaceholder: {
    width: 32,
    height: 32,
  },
  modalLogoContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -50,
    marginBottom: -32,
  },
  modalLogo: {
    width: 120,
    height: 120,
  },
  modalWordmarkContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  modalWordmark: {
    width: 200,
    height: 50,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textDark,
    textAlign: 'start',
    marginBottom: 8,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.beige,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: colors.text,
    fontWeight: 'bold',
  },
  forgotPasswordSubtitle: {
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  primaryButton: {
    backgroundColor: colors.buttonPrimary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  forgotPasswordSuccessContainer: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  forgotPasswordCooldownText: {
    fontSize: 12,
    color: colors.success,
    textAlign: 'center',
    lineHeight: 18,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  switchText: {
    color: colors.text,
    fontSize: 14,
  },
  switchLink: {
    color: colors.link,
    fontSize: 14,
    fontWeight: '600',
  },
});

