import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  Image,
} from 'react-native';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../constants/theme';

export default function AuthScreen() {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showEmailVerificationModal, setShowEmailVerificationModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  // Password strength checker
  const checkPasswordStrength = (pwd) => {
    if (!pwd) {
      setPasswordStrength(null);
      return;
    }

    let strength = 0;
    const requirements = {
      length: pwd.length >= 8,
      lowercase: /[a-z]/.test(pwd),
      uppercase: /[A-Z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      special: /[^A-Za-z0-9]/.test(pwd),
    };

    // Count met requirements
    if (requirements.length) strength += 1;
    if (requirements.lowercase) strength += 1;
    if (requirements.uppercase) strength += 1;
    if (requirements.number) strength += 1;
    if (requirements.special) strength += 1;

    let level = 'weak';
    let color = '#FF3B30';
    let label = 'Weak';

    if (strength <= 2) {
      level = 'weak';
      color = '#FF3B30';
      label = 'Weak';
    } else if (strength === 3) {
      level = 'medium';
      color = '#FF9500';
      label = 'Medium';
    } else if (strength >= 4) {
      level = 'strong';
      color = '#34C759';
      label = 'Strong';
    }

    setPasswordStrength({
      level,
      color,
      label,
      strength,
      requirements,
    });
  };

  const handlePasswordChange = (text) => {
    setPassword(text);
    if (isSignUp) {
      checkPasswordStrength(text);
    }
  };

  const handleEmailAuth = async () => {
    if (!email || !password) {
      setErrorMessage('Please fill in all fields');
      setShowErrorModal(true);
      return;
    }

    if (isSignUp && !confirmPassword) {
      setErrorMessage('Please confirm your password');
      setShowErrorModal(true);
      return;
    }

    if (isSignUp) {
      if (password.length < 8) {
        setErrorMessage('Password must be at least 8 characters');
        setShowErrorModal(true);
        return;
      }
      if (passwordStrength && passwordStrength.level === 'weak') {
        setErrorMessage('Password is too weak. Please use a stronger password.');
        setShowErrorModal(true);
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match');
        setShowErrorModal(true);
        return;
      }
    } else {
      if (password.length < 6) {
        setErrorMessage('Password must be at least 6 characters');
        setShowErrorModal(true);
        return;
      }
    }

    setLoading(true);
    try {
      const { error } = isSignUp ? await signUp(email, password) : await signIn(email, password);
      
      if (error) {
        // Check if error is related to email verification
        const errorMessage = (error.message || '').toLowerCase();
        const errorCode = error.code || '';
        
        // Common Supabase email verification error patterns
        if (errorMessage.includes('email not confirmed') || 
            errorMessage.includes('email not verified') ||
            errorMessage.includes('confirm your email') ||
            errorMessage.includes('email_not_confirmed') ||
            errorMessage.includes('email address not confirmed') ||
            (errorMessage.includes('email') && (errorMessage.includes('confirm') || errorMessage.includes('verify'))) ||
            errorCode === 'email_not_confirmed') {
          setShowEmailVerificationModal(true);
        } else {
          setErrorMessage(error.message);
          setShowErrorModal(true);
        }
        setLoading(false);
        return;
      } else if (isSignUp) {
        setShowEmailModal(false);
        setShowSuccessModal(true);
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setPasswordStrength(null);
      } else {
        setShowEmailModal(false);
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setPasswordStrength(null);
      }
    } catch (error) {
      setErrorMessage(error.message || 'An unexpected error occurred');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.contentContainer}>
          {/* Cat Illustration at Top */}
          <View style={styles.catIllustrationContainer}>
            <Image 
              source={require('../assets/images/Catracter.png')}
              style={styles.catIllustration}
              resizeMode="contain"
            />
          </View>

          {/* Wordmark */}
          <View style={styles.wordmarkContainer}>
            <Image 
              source={require('../assets/images/Wordmark.png')}
              style={styles.wordmark}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.title}>Sign up or Log in</Text>
          <Text style={styles.subtitle}>Select your preferred method to continue</Text>

          <View style={styles.buttonsContainer}>
            {/* Google Button - Unavailable */}
            <View style={styles.buttonWrapper}>
              <TouchableOpacity style={[styles.socialButton, styles.googleButton]} disabled={true}>
                <View style={styles.buttonContent}>
                  <View style={styles.iconContainer}>
                    <MaterialCommunityIcons name="google" size={24} color={colors.primary} />
                  </View>
                  <Text style={[styles.buttonText, styles.googleButtonText]}>Continue with Google</Text>
                </View>
              </TouchableOpacity>
              <View style={styles.unavailableBadge}>
                <Text style={styles.unavailableBadgeText}>Currently unavailable</Text>
              </View>
            </View>
            <View style={{ height: 12 }} />

            {/* Facebook Button - Unavailable */}
            <View style={styles.buttonWrapper}>
              <TouchableOpacity style={[styles.socialButton, styles.facebookButton]} disabled={true}>
                <View style={styles.buttonContent}>
                  <View style={styles.iconContainer}>
                    <FontAwesome name="facebook" size={24} color="#fff" />
                  </View>
                  <Text style={[styles.buttonText, styles.facebookButtonText]}>Continue with Facebook</Text>
                </View>
              </TouchableOpacity>
              <View style={styles.unavailableBadge}>
                <Text style={styles.unavailableBadgeText}>Currently unavailable</Text>
              </View>
            </View>
            <View style={{ height: 12 }} />

            {/* Apple Button - Unavailable */}
            <View style={styles.buttonWrapper}>
              <TouchableOpacity style={[styles.socialButton, styles.appleButton]} disabled={true}>
                <View style={styles.buttonContent}>
                  <View style={styles.iconContainer}>
                    <FontAwesome name="apple" size={24} color="#fff" />
                  </View>
                  <Text style={[styles.buttonText, styles.appleButtonText]}>Continue with Apple</Text>
                </View>
              </TouchableOpacity>
              <View style={styles.unavailableBadge}>
                <Text style={styles.unavailableBadgeText}>Currently unavailable</Text>
              </View>
            </View>
            <View style={{ height: 12 }} />

            {/* Email Button - Active */}
            <TouchableOpacity 
              style={[styles.socialButton, styles.emailButton]} 
              onPress={() => setShowEmailModal(true)}
            >
              <View style={styles.buttonContent}>
                <View style={styles.iconContainer}>
                  <FontAwesome name="envelope" size={24} color="#fff" />
                </View>
                <Text style={[styles.buttonText, styles.emailButtonText]}>Continue with Email</Text>
              </View>
            </TouchableOpacity>
          </View>

          <Text style={styles.termsText}>
            By signing up you agree to our{' '}
            <Text style={styles.linkText} onPress={() => setShowTermsModal(true)}>
              Terms and Conditions
            </Text>
            {' '}and{' '}
            <Text style={styles.linkText} onPress={() => setShowPrivacyModal(true)}>
              Privacy Policy
            </Text>
            .
          </Text>
        </View>

        {/* Cat Tail at Bottom Right */}
        <View style={styles.catTailContainer}>
          <Image 
            source={require('../assets/images/Catracter.png')}
            style={styles.catTail}
            resizeMode="contain"
          />
        </View>
      </ScrollView>

      {/* Email/Password Modal */}
      <Modal
        visible={showEmailModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEmailModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.closeButtonPlaceholder} />
              <TouchableOpacity 
                onPress={() => {
                  setShowEmailModal(false);
                  setEmail('');
                  setPassword('');
                  setConfirmPassword('');
                  setPasswordStrength(null);
                }}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Logo */}
            <View style={styles.modalLogoContainer}>
              <Image 
                source={require('../assets/images/Logo.png')}
                style={styles.modalLogo}
                resizeMode="contain"
              />
            </View>

            {/* Wordmark */}
            <View style={styles.modalWordmarkContainer}>
              <Image 
                source={require('../assets/images/Wordmark.png')}
                style={styles.modalWordmark}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.modalTitle}>{isSignUp ? 'Sign Up' : 'Sign In'}</Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.passwordInputWrapper}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Password"
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={handlePasswordChange}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete={isSignUp ? 'password-new' : 'password'}
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  <FontAwesome
                    name={showPassword ? 'eye-slash' : 'eye'}
                    size={20}
                    color="#999"
                  />
                </TouchableOpacity>
              </View>
              {isSignUp && password && passwordStrength && (
                <View style={styles.passwordStrengthContainer}>
                  <View style={styles.passwordStrengthBar}>
                    <View
                      style={[
                        styles.passwordStrengthFill,
                        {
                          width: `${(passwordStrength.strength / 5) * 100}%`,
                          backgroundColor: passwordStrength.color,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.passwordStrengthText, { color: passwordStrength.color }]}>
                    {passwordStrength.label}
                  </Text>
                  <View style={styles.passwordRequirementsContainer}>
                    <Text style={styles.passwordRequirementsTitle}>Password requirements:</Text>
                    <View style={styles.passwordRequirementItem}>
                      <Text style={[
                        styles.passwordRequirementIcon,
                        { color: passwordStrength.requirements.length ? '#34C759' : '#999' }
                      ]}>
                        {passwordStrength.requirements.length ? '✓' : '✗'}
                      </Text>
                      <Text style={[
                        styles.passwordRequirementText,
                        { color: passwordStrength.requirements.length ? '#333' : '#999' }
                      ]}>
                        At least 8 characters
                      </Text>
                    </View>
                    <View style={styles.passwordRequirementItem}>
                      <Text style={[
                        styles.passwordRequirementIcon,
                        { color: passwordStrength.requirements.lowercase ? '#34C759' : '#999' }
                      ]}>
                        {passwordStrength.requirements.lowercase ? '✓' : '✗'}
                      </Text>
                      <Text style={[
                        styles.passwordRequirementText,
                        { color: passwordStrength.requirements.lowercase ? '#333' : '#999' }
                      ]}>
                        One lowercase letter
                      </Text>
                    </View>
                    <View style={styles.passwordRequirementItem}>
                      <Text style={[
                        styles.passwordRequirementIcon,
                        { color: passwordStrength.requirements.uppercase ? '#34C759' : '#999' }
                      ]}>
                        {passwordStrength.requirements.uppercase ? '✓' : '✗'}
                      </Text>
                      <Text style={[
                        styles.passwordRequirementText,
                        { color: passwordStrength.requirements.uppercase ? '#333' : '#999' }
                      ]}>
                        One uppercase letter
                      </Text>
                    </View>
                    <View style={styles.passwordRequirementItem}>
                      <Text style={[
                        styles.passwordRequirementIcon,
                        { color: passwordStrength.requirements.number ? '#34C759' : '#999' }
                      ]}>
                        {passwordStrength.requirements.number ? '✓' : '✗'}
                      </Text>
                      <Text style={[
                        styles.passwordRequirementText,
                        { color: passwordStrength.requirements.number ? '#333' : '#999' }
                      ]}>
                        One number
                      </Text>
                    </View>
                    <View style={styles.passwordRequirementItem}>
                      <Text style={[
                        styles.passwordRequirementIcon,
                        { color: passwordStrength.requirements.special ? '#34C759' : '#999' }
                      ]}>
                        {passwordStrength.requirements.special ? '✓' : '✗'}
                      </Text>
                      <Text style={[
                        styles.passwordRequirementText,
                        { color: passwordStrength.requirements.special ? '#333' : '#999' }
                      ]}>
                        One special character
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>

             {isSignUp && (
               <View style={styles.inputContainer}>
                 <View style={[
                   styles.passwordInputWrapper,
                   confirmPassword && password !== confirmPassword && styles.passwordInputWrapperError
                 ]}>
                   <TextInput
                     style={styles.passwordInput}
                     placeholder="Confirm Password"
                     placeholderTextColor="#999"
                     value={confirmPassword}
                     onChangeText={setConfirmPassword}
                     secureTextEntry={!showConfirmPassword}
                     autoCapitalize="none"
                     autoComplete="password-new"
                     editable={!loading}
                   />
                   <TouchableOpacity
                     style={styles.eyeIcon}
                     onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                     disabled={loading}
                   >
                     <FontAwesome
                       name={showConfirmPassword ? 'eye-slash' : 'eye'}
                       size={20}
                       color="#999"
                     />
                   </TouchableOpacity>
                 </View>
                 {confirmPassword && password !== confirmPassword && (
                   <Text style={styles.errorText}>Passwords do not match</Text>
                 )}
                 {confirmPassword && password === confirmPassword && password.length > 0 && (
                   <Text style={styles.successText}>✓ Passwords match</Text>
                 )}
               </View>
             )}

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleEmailAuth}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {isSignUp ? 'Sign Up' : 'Sign In'}
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.switchContainer}>
              <Text style={styles.switchText}>
                {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              </Text>
              <TouchableOpacity 
                onPress={() => {
                  setIsSignUp(!isSignUp);
                  if (isSignUp) {
                    // Clear password strength when switching to sign in
                    setPasswordStrength(null);
                  } else {
                    // Check password strength when switching to sign up
                    checkPasswordStrength(password);
                  }
                }} 
                disabled={loading}
              >
                <Text style={styles.switchLink}>
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Terms and Conditions Modal */}
      <Modal
        visible={showTermsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTermsModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Terms and Conditions</Text>
              <TouchableOpacity 
                onPress={() => setShowTermsModal(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollContent}>
              <Text style={styles.modalBodyText}>
                <Text style={styles.modalSectionTitle}>1. Acceptance of Terms</Text>{'\n\n'}
                By accessing and using MeowMap, you accept and agree to be bound by the terms and provision of this agreement.
                {'\n\n'}
                <Text style={styles.modalSectionTitle}>2. Use License</Text>{'\n\n'}
                Permission is granted to temporarily download one copy of MeowMap for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
                {'\n\n'}
                • modify or copy the materials;{'\n'}
                • use the materials for any commercial purpose or for any public display;{'\n'}
                • attempt to reverse engineer any software contained in MeowMap;{'\n'}
                • remove any copyright or other proprietary notations from the materials.
                {'\n\n'}
                <Text style={styles.modalSectionTitle}>3. User Account</Text>{'\n\n'}
                You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
                {'\n\n'}
                <Text style={styles.modalSectionTitle}>4. Content</Text>{'\n\n'}
                You are responsible for all content that you post, upload, or otherwise make available through MeowMap. You agree not to post content that is illegal, harmful, threatening, abusive, or otherwise objectionable.
                {'\n\n'}
                <Text style={styles.modalSectionTitle}>5. Privacy</Text>{'\n\n'}
                Your use of MeowMap is also governed by our Privacy Policy. Please review our Privacy Policy to understand our practices.
                {'\n\n'}
                <Text style={styles.modalSectionTitle}>6. Modifications</Text>{'\n\n'}
                MeowMap reserves the right to revise these terms at any time without notice. By using MeowMap you are agreeing to be bound by the then current version of these Terms and Conditions.
                {'\n\n'}
                <Text style={styles.modalSectionTitle}>7. Contact</Text>{'\n\n'}
                If you have any questions about these Terms and Conditions, please contact us.
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Privacy Policy Modal */}
      <Modal
        visible={showPrivacyModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPrivacyModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Privacy Policy</Text>
              <TouchableOpacity 
                onPress={() => setShowPrivacyModal(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollContent}>
              <Text style={styles.modalBodyText}>
                <Text style={styles.modalSectionTitle}>1. Information We Collect</Text>{'\n\n'}
                We collect information that you provide directly to us, including:
                {'\n\n'}
                • Account information (email address, password){'\n'}
                • Profile information you choose to provide{'\n'}
                • Location data when you use location-based features{'\n'}
                • Usage data and interactions with the app
                {'\n\n'}
                <Text style={styles.modalSectionTitle}>2. How We Use Your Information</Text>{'\n\n'}
                We use the information we collect to:
                {'\n\n'}
                • Provide, maintain, and improve our services{'\n'}
                • Process transactions and send related information{'\n'}
                • Send technical notices and support messages{'\n'}
                • Respond to your comments and questions{'\n'}
                • Monitor and analyze trends and usage
                {'\n\n'}
                <Text style={styles.modalSectionTitle}>3. Information Sharing</Text>{'\n\n'}
                We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
                {'\n\n'}
                • With your consent{'\n'}
                • To comply with legal obligations{'\n'}
                • To protect our rights and safety{'\n'}
                • With service providers who assist us in operating our app
                {'\n\n'}
                <Text style={styles.modalSectionTitle}>4. Data Security</Text>{'\n\n'}
                We implement appropriate security measures to protect your personal information. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
                {'\n\n'}
                <Text style={styles.modalSectionTitle}>5. Your Rights</Text>{'\n\n'}
                You have the right to:
                {'\n\n'}
                • Access your personal information{'\n'}
                • Correct inaccurate data{'\n'}
                • Request deletion of your data{'\n'}
                • Object to processing of your data{'\n'}
                • Request data portability
                {'\n\n'}
                <Text style={styles.modalSectionTitle}>6. Changes to This Policy</Text>{'\n\n'}
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
                {'\n\n'}
                <Text style={styles.modalSectionTitle}>7. Contact Us</Text>{'\n\n'}
                If you have any questions about this Privacy Policy, please contact us.
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowSuccessModal(false);
          setIsSignUp(false);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.successModalContent}>
            {/* Success Icon */}
            <View style={styles.successIconContainer}>
              <View style={styles.successIconCircle}>
                <FontAwesome name="check" size={48} color="#fff" />
              </View>
            </View>

            <Text style={styles.successModalTitle}>Account Created!</Text>
            <Text style={styles.successModalText}>
              We've sent a verification email to your inbox. Please check your email to verify your account before signing in.
            </Text>

            <View style={styles.successButtonContainer}>
              <TouchableOpacity
                style={styles.successButton}
                onPress={() => {
                  setShowSuccessModal(false);
                  setIsSignUp(false);
                }}
              >
                <Text style={styles.successButtonText}>Got it</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Error Modal */}
      <Modal
        visible={showErrorModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowErrorModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.errorModalContent}>
            {/* Error Icon */}
            <View style={styles.errorIconContainer}>
              <View style={styles.errorIconCircle}>
                <FontAwesome name="exclamation-circle" size={48} color="#fff" />
              </View>
            </View>

            <Text style={styles.errorModalTitle}>Error</Text>
            <Text style={styles.errorModalText}>
              {errorMessage}
            </Text>

            <View style={styles.errorButtonContainer}>
              <TouchableOpacity
                style={styles.errorButton}
                onPress={() => setShowErrorModal(false)}
              >
                <Text style={styles.errorButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Email Verification Modal */}
      <Modal
        visible={showEmailVerificationModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEmailVerificationModal(false)}
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
              <TouchableOpacity
                style={styles.emailVerificationButton}
                onPress={() => setShowEmailVerificationModal(false)}
              >
                <Text style={styles.emailVerificationButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    padding: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  catIllustrationContainer: {
    width: '100%',
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
    marginTop: 10,
    paddingVertical: 10,
  },
  catIllustration: {
    width: 200,
    height: 200,
  },
  wordmarkContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    marginTop: -20,
  },
  wordmark: {
    width: 300,
    height: 60,
  },
  catTailContainer: {
    position: 'absolute',
    bottom: -50,
    right: -449,
    width: 550,
    height: 550,
    overflow: 'hidden',
    zIndex: 1,
    pointerEvents: 'none',
  },
  catTail: {
    width: 550,
    height: 550,
    opacity: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: -10,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 30,
    textAlign: 'center',
  },
  buttonsContainer: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
  },
  socialButton: {
    borderRadius: 12,
    padding: 16,
    width: '100%',
    borderWidth: 1,
    position: 'relative',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  iconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  // Button Wrapper for absolute positioning
  buttonWrapper: {
    position: 'relative',
    width: '100%',
  },
  // Google Button
  googleButton: {
    backgroundColor: colors.googleBg,
    borderColor: colors.googleBorder,
    opacity: 0.8,
  },
  googleButtonText: {
    color: colors.googleText,
  },
  // Facebook Button
  facebookButton: {
    backgroundColor: colors.facebookBg,
    borderColor: colors.facebookBg,
    opacity: 0.8,
  },
  facebookButtonText: {
    color: colors.facebookText,
  },
  // Apple Button
  appleButton: {
    backgroundColor: '#000000',
    borderColor: '#000000',
    opacity: 0.8,
  },
  appleButtonText: {
    color: '#ffffff',
  },
  // Email Button
  emailButton: {
    backgroundColor: colors.emailBg,
    borderColor: colors.emailBg,
  },
  emailButtonText: {
    color: colors.emailText,
  },
  // Unavailable Badge - Absolutely positioned, overlaying the button
  unavailableBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.error,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  unavailableBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  // Modal Styles
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
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: colors.cream,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  passwordInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cream,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  passwordInputWrapperError: {
    borderColor: colors.error,
    borderWidth: 2,
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 16,
    paddingLeft: 8,
  },
  passwordStrengthContainer: {
    marginTop: 8,
  },
  passwordStrengthBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
  },
  passwordStrengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  passwordStrengthText: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  passwordRequirementsContainer: {
    marginTop: 4,
  },
  passwordRequirementsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 6,
  },
  passwordRequirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  passwordRequirementIcon: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 6,
    width: 16,
  },
  passwordRequirementText: {
    fontSize: 11,
    flex: 1,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 6,
    marginLeft: 4,
  },
  successText: {
    fontSize: 12,
    color: '#34C759',
    marginTop: 6,
    marginLeft: 4,
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
  termsText: {
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
    marginTop: 24,
    paddingHorizontal: 50,
    lineHeight: 18,
  },
  linkText: {
    color: colors.link,
    textDecorationLine: 'underline',
  },
  modalScrollContent: {
    maxHeight: '80%',
  },
  modalBodyText: {
    fontSize: 14,
    color: colors.textDark,
    lineHeight: 22,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: 8,
    marginBottom: 4,
  },
  // Success Modal Styles
  successModalContent: {
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
  successIconContainer: {
    marginTop: 8,
    marginBottom: 24,
    alignItems: 'center',
    width: '100%',
  },
  successIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textDark,
    textAlign: 'center',
    marginBottom: 16,
  },
  successModalText: {
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  successButtonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  successButton: {
    backgroundColor: colors.buttonPrimary,
    borderRadius: 8,
    padding: 16,
    width: '100%',
    alignItems: 'center',
  },
  successButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Error Modal Styles
  errorModalContent: {
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
  errorIconContainer: {
    marginTop: 8,
    marginBottom: 24,
    alignItems: 'center',
    width: '100%',
  },
  errorIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textDark,
    textAlign: 'center',
    marginBottom: 16,
  },
  errorModalText: {
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  errorButtonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  errorButton: {
    backgroundColor: colors.error,
    borderRadius: 8,
    padding: 16,
    width: '100%',
    alignItems: 'center',
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Email Verification Modal Styles
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
  emailVerificationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
