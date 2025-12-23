import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Modal,
  Image,
} from 'react-native';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../constants/theme';
import { supabase } from '../lib/supabase';

// Import extracted components
import EmailInput from '../components/auth/EmailInput';
import PasswordInput from '../components/auth/PasswordInput';
import PasswordStrengthIndicator from '../components/auth/PasswordStrengthIndicator';
import RememberMeCheckbox from '../components/auth/RememberMeCheckbox';
import ErrorModal from '../components/auth/ErrorModal';
import SuccessModal from '../components/auth/SuccessModal';
import TermsModal from '../components/auth/TermsModal';
import PrivacyModal from '../components/auth/PrivacyModal';

// Import extracted hooks
import { useBiometricAuth } from '../hooks/useBiometricAuth';
import { useLoginAttempts } from '../hooks/useLoginAttempts';

// Import extracted utilities
import { validateEmail } from '../utils/emailValidation';
import { checkPasswordStrength } from '../utils/passwordStrength';
import { formatCooldown } from '../utils/cooldown';

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
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordCooldown, setForgotPasswordCooldown] = useState(0);
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const { signIn, signUp, forgotPassword } = useAuth();
  
  // Use extracted hooks
  const {
    biometricAvailable,
    biometricType,
    hasBiometricCredentials,
    setHasBiometricCredentials,
    biometricLoading,
    setBiometricLoading,
  } = useBiometricAuth();
  
  const {
    recordFailedAttempt,
    resetAttempts,
    isLocked,
    getRemainingLockTime,
  } = useLoginAttempts(email);

  // Restore forgot password cooldown from AsyncStorage on mount
  useEffect(() => {
    const restoreForgotPasswordCooldown = async () => {
      try {
        const storedData = await AsyncStorage.getItem('forgotPasswordCooldown');
        if (storedData) {
          const { email, timestamp } = JSON.parse(storedData);
          const now = Date.now();
          const elapsed = Math.floor((now - timestamp) / 1000);
          const remaining = Math.max(0, 300 - elapsed); // 300 seconds = 5 minutes

          if (remaining > 0) {
            setForgotPasswordCooldown(remaining);
            setForgotPasswordEmail(email);
          } else {
            // Cooldown expired, remove from storage
            await AsyncStorage.removeItem('forgotPasswordCooldown');
          }
        }
      } catch (error) {
        console.error('Error restoring forgot password cooldown:', error);
      }
    };

    restoreForgotPasswordCooldown();
  }, []);

  // Restore Remember Me preference on mount
  useEffect(() => {
    const restoreRememberMe = async () => {
      try {
        const stored = await AsyncStorage.getItem('rememberMe');
        if (stored === 'true') {
          setRememberMe(true);
        }
      } catch (error) {
        console.error('Error restoring remember me preference:', error);
      }
    };

    restoreRememberMe();
  }, []);

  // Handle email input change with validation
  const handleEmailChange = (text) => {
    setEmail(text);
    if (text) {
      const validation = validateEmail(text);
      setEmailError(validation.error);
    } else {
      setEmailError('');
    }
  };

  // Handle biometric authentication
  const handleBiometricAuth = async () => {
    if (!biometricAvailable || !hasBiometricCredentials) return;

    setBiometricLoading(true);
    try {
      // Authenticate with biometrics
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Authenticate with ${biometricType || 'biometrics'}`,
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
        fallbackLabel: 'Use Password',
      });

      if (result.success) {
        // Get saved credentials
        const savedEmail = await SecureStore.getItemAsync('biometricEmail');
        const savedPassword = await SecureStore.getItemAsync('biometricPassword');

        if (savedEmail && savedPassword) {
          // Attempt login with saved credentials
          setEmail(savedEmail);
          const { error } = await signIn(savedEmail, savedPassword);

          if (error) {
            // If credentials are invalid, clear them and show error
            await SecureStore.deleteItemAsync('biometricEmail');
            await SecureStore.deleteItemAsync('biometricPassword');
            setHasBiometricCredentials(false);
            setErrorMessage('Biometric login failed. Please sign in with your password.');
            setShowErrorModal(true);
          } else {
            // Success - login handled by AuthContext
            setShowEmailModal(false);
            setEmail('');
            setPassword('');
          }
        } else {
          setErrorMessage('Saved credentials not found. Please sign in with your password.');
          setShowErrorModal(true);
          setHasBiometricCredentials(false);
        }
      } else if (result.error === 'user_cancel') {
        // User cancelled - do nothing
      } else if (result.error === 'user_fallback') {
        // User chose to use password - show email modal
        const savedEmail = await SecureStore.getItemAsync('biometricEmail');
        if (savedEmail) {
          setEmail(savedEmail);
          setShowEmailModal(true);
          setIsSignUp(false);
        }
      } else {
        setErrorMessage('Biometric authentication failed. Please try again or use password.');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      setErrorMessage('Biometric authentication error. Please use password to sign in.');
      setShowErrorModal(true);
    } finally {
      setBiometricLoading(false);
    }
  };

  const handlePasswordChange = (text) => {
    setPassword(text);
    if (isSignUp) {
      checkPasswordStrength(text);
    }
  };

  // Cooldown timer effect
  useEffect(() => {
    let interval = null;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendCooldown]);

  // Resend verification email
  const handleResendVerificationEmail = async () => {
    if (resendCooldown > 0 || resendLoading) return;

    setResendLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: 'https://meowmap-web.vercel.app/auth/verify-email',
        },
      });

      if (error) {
        setErrorMessage(error.message || 'Failed to resend verification email');
        setShowErrorModal(true);
      } else {
        // Start 5-minute cooldown (300 seconds)
        setResendCooldown(300);
      }
    } catch (error) {
      setErrorMessage(error.message || 'An unexpected error occurred');
      setShowErrorModal(true);
    } finally {
      setResendLoading(false);
    }
  };


  // Forgot password cooldown timer effect
  useEffect(() => {
    let interval = null;
    if (forgotPasswordCooldown > 0) {
      interval = setInterval(async () => {
        setForgotPasswordCooldown((prev) => {
          const newValue = prev <= 1 ? 0 : prev - 1;
          
          // Update AsyncStorage when cooldown changes
          if (newValue === 0) {
            // Cooldown finished, remove from storage
            AsyncStorage.removeItem('forgotPasswordCooldown').catch(console.error);
          } else if (forgotPasswordEmail) {
            // Update timestamp in storage
            AsyncStorage.setItem('forgotPasswordCooldown', JSON.stringify({
              email: forgotPasswordEmail,
              timestamp: Date.now() - (300 - newValue) * 1000, // Calculate original timestamp
            })).catch(console.error);
          }
          
          if (prev <= 1) {
            clearInterval(interval);
          }
          return newValue;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [forgotPasswordCooldown, forgotPasswordEmail]);

  // Handle forgot password
  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail) {
      setErrorMessage('Please enter your email address');
      setShowErrorModal(true);
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotPasswordEmail)) {
      setErrorMessage('Please enter a valid email address');
      setShowErrorModal(true);
      return;
    }

    // Check if there's an active cooldown for this email (persisted in AsyncStorage)
    try {
      const storedData = await AsyncStorage.getItem('forgotPasswordCooldown');
      if (storedData) {
        const { email: storedEmail, timestamp } = JSON.parse(storedData);
        if (storedEmail === forgotPasswordEmail) {
          const now = Date.now();
          const elapsed = Math.floor((now - timestamp) / 1000);
          const remaining = Math.max(0, 300 - elapsed);
          
          if (remaining > 0) {
            setForgotPasswordCooldown(remaining);
            const minutes = Math.ceil(remaining / 60);
            setErrorMessage(`Please wait ${minutes} minute(s) before requesting another reset link.`);
            setShowErrorModal(true);
            return;
          } else {
            // Cooldown expired, remove from storage
            await AsyncStorage.removeItem('forgotPasswordCooldown');
          }
        }
      }
    } catch (error) {
      console.error('Error checking forgot password cooldown:', error);
    }

    if (forgotPasswordCooldown > 0 || forgotPasswordLoading) return;

    setForgotPasswordLoading(true);
    try {
      const { error } = await forgotPassword(forgotPasswordEmail);

      if (error) {
        setErrorMessage(error.message || 'Failed to send password reset email');
        setShowErrorModal(true);
      } else {
        // Supabase returns success even if email doesn't exist (for security)
        // Start 5-minute cooldown (300 seconds)
        const cooldownSeconds = 300;
        setForgotPasswordCooldown(cooldownSeconds);
        
        // Store cooldown in AsyncStorage to persist across app restarts
        try {
          await AsyncStorage.setItem('forgotPasswordCooldown', JSON.stringify({
            email: forgotPasswordEmail,
            timestamp: Date.now(),
          }));
        } catch (storageError) {
          console.error('Error saving forgot password cooldown:', storageError);
        }
        
        // Note: Email will be sent if the email exists in the system
      }
    } catch (error) {
      setErrorMessage(error.message || 'An unexpected error occurred');
      setShowErrorModal(true);
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    if (!email || !password) {
      setErrorMessage('Please fill in all fields');
      setShowErrorModal(true);
      return;
    }

    // Validate email format before submission
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setEmailError(emailValidation.error);
      setErrorMessage(emailValidation.error || 'Please enter a valid email address');
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
      // Check if account is locked (only for sign in)
      if (isLocked()) {
        const remainingMinutes = getRemainingLockTime();
        setErrorMessage(`Account is temporarily locked due to too many failed login attempts. Please try again in ${remainingMinutes} minute(s).`);
        setShowErrorModal(true);
        return;
      }

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
          // Handle failed login attempt (only for sign in, not sign up)
          if (!isSignUp) {
            const attemptResult = await recordFailedAttempt(email);
            
            if (attemptResult.locked) {
              setErrorMessage('Too many failed login attempts. Your account has been temporarily locked for 15 minutes. Please try again later.');
            } else {
              setErrorMessage(`${error.message} (${attemptResult.remainingAttempts} attempt(s) remaining before account lock)`);
            }
          } else {
            // For sign up errors, just show the error message
            setErrorMessage(error.message);
          }
          setShowErrorModal(true);
        }
        setLoading(false);
        return;
      } else {
        // Successful login/signup - reset attempt tracking and save preferences
        if (!isSignUp) {
          // Reset failed attempts on successful login
          await resetAttempts();
          try {
            // Store Remember Me preference
            await AsyncStorage.setItem('rememberMe', rememberMe.toString());
            
            // If Remember Me is checked and biometric is available, save credentials securely
            if (rememberMe && biometricAvailable) {
              try {
                await SecureStore.setItemAsync('biometricEmail', email);
                await SecureStore.setItemAsync('biometricPassword', password);
                setHasBiometricCredentials(true);
              } catch (secureError) {
                console.error('Error saving biometric credentials:', secureError);
                // Don't show error to user - biometric is optional
              }
            } else if (!rememberMe) {
              // If Remember Me is unchecked, clear saved biometric credentials
              try {
                await SecureStore.deleteItemAsync('biometricEmail');
                await SecureStore.deleteItemAsync('biometricPassword');
                setHasBiometricCredentials(false);
              } catch (clearError) {
                console.error('Error clearing biometric credentials:', clearError);
              }
            }
          } catch (storageError) {
            console.error('Error saving login data:', storageError);
          }
        }
        
        if (isSignUp) {
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

            {/* Biometric Button - Only show if available and credentials saved */}
            {biometricAvailable && hasBiometricCredentials && (
              <>
                <TouchableOpacity 
                  style={[styles.socialButton, styles.biometricButton]} 
                  onPress={handleBiometricAuth}
                  disabled={biometricLoading}
                >
                  <View style={styles.buttonContent}>
                    <View style={styles.iconContainer}>
                      <MaterialCommunityIcons 
                        name={biometricType === 'Face ID' ? 'face-recognition' : 'fingerprint'} 
                        size={24} 
                        color="#fff" 
                      />
                    </View>
                    {biometricLoading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={[styles.buttonText, styles.biometricButtonText]}>
                        Continue with Biometric
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
                <View style={{ height: 12 }} />
              </>
            )}

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

          <View style={styles.termsContainer}>
            <Text style={styles.termsText}>
              By signing up you agree to our{' '}
            </Text>
            <TouchableOpacity onPress={() => setShowTermsModal(true)} hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}>
              <Text style={styles.linkText}>Terms and Conditions</Text>
            </TouchableOpacity>
            <Text style={styles.termsText}>
              {' '}and{' '}
            </Text>
            <TouchableOpacity onPress={() => setShowPrivacyModal(true)} hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}>
              <Text style={styles.linkText}>Privacy Policy</Text>
            </TouchableOpacity>
            <Text style={styles.termsText}>.</Text>
          </View>
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
                  setEmailError('');
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

            <EmailInput
              value={email}
              onChangeText={handleEmailChange}
              error={emailError}
              editable={!loading}
            />

            <View style={styles.inputContainer}>
              <PasswordInput
                value={password}
                onChangeText={handlePasswordChange}
                showPassword={showPassword}
                onToggleVisibility={() => setShowPassword(!showPassword)}
                editable={!loading}
                autoComplete={isSignUp ? 'password-new' : 'password'}
              />
              {isSignUp && passwordStrength && (
                <PasswordStrengthIndicator passwordStrength={passwordStrength} />
              )}
            </View>

             {isSignUp && (
               <View style={styles.inputContainer}>
                 <PasswordInput
                   value={confirmPassword}
                   onChangeText={setConfirmPassword}
                   placeholder="Confirm Password"
                   showPassword={showConfirmPassword}
                   onToggleVisibility={() => setShowConfirmPassword(!showConfirmPassword)}
                   editable={!loading}
                   autoComplete="password-new"
                   style={confirmPassword && password !== confirmPassword && { borderColor: colors.error, borderWidth: 2 }}
                 />
                 {confirmPassword && password !== confirmPassword && (
                   <Text style={styles.errorText}>Passwords do not match</Text>
                 )}
                 {confirmPassword && password === confirmPassword && password.length > 0 && (
                   <Text style={styles.successText}>✓ Passwords match</Text>
                 )}
               </View>
             )}

            {/* Forgot Password Link and Remember Me - Only show on Sign In */}
            {!isSignUp && (
              <View style={styles.rememberMeContainer}>
                <RememberMeCheckbox
                  checked={rememberMe}
                  onToggle={() => setRememberMe(!rememberMe)}
                  disabled={loading}
                />

                <TouchableOpacity
                  onPress={() => {
                    setShowEmailModal(false);
                    setForgotPasswordEmail(email); // Pre-fill with current email
                    setShowForgotPasswordModal(true);
                  }}
                  style={styles.forgotPasswordLink}
                  disabled={loading}
                >
                  <Text style={styles.forgotPasswordLinkText}>Forgot Password?</Text>
                </TouchableOpacity>
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
                  setEmailError(''); // Clear email error when switching modes
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
        <View style={styles.termsModalContainer}>
          <View style={styles.termsModalContent}>
            <View style={styles.termsModalHeader}>
              <Text style={styles.termsModalTitle}>Terms and Conditions</Text>
              <TouchableOpacity 
                onPress={() => setShowTermsModal(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView 
              style={styles.termsModalScrollContent}
              contentContainerStyle={styles.termsModalScrollContentContainer}
              showsVerticalScrollIndicator={true}
              bounces={true}
            >
              <Text style={styles.termsModalBodyText}>
                <Text style={styles.termsModalSectionTitle}>1. Acceptance of Terms</Text>{'\n\n'}
                By accessing and using MeowMap, you accept and agree to be bound by the terms and provision of this agreement.
                {'\n\n'}
                <Text style={styles.termsModalSectionTitle}>2. Use License</Text>{'\n\n'}
                Permission is granted to temporarily download one copy of MeowMap for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
                {'\n\n'}
                • modify or copy the materials;{'\n'}
                • use the materials for any commercial purpose or for any public display;{'\n'}
                • attempt to reverse engineer any software contained in MeowMap;{'\n'}
                • remove any copyright or other proprietary notations from the materials.
                {'\n\n'}
                <Text style={styles.termsModalSectionTitle}>3. User Account</Text>{'\n\n'}
                You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
                {'\n\n'}
                <Text style={styles.termsModalSectionTitle}>4. Content</Text>{'\n\n'}
                You are responsible for all content that you post, upload, or otherwise make available through MeowMap. You agree not to post content that is illegal, harmful, threatening, abusive, or otherwise objectionable.
                {'\n\n'}
                <Text style={styles.termsModalSectionTitle}>5. Privacy</Text>{'\n\n'}
                Your use of MeowMap is also governed by our Privacy Policy. Please review our Privacy Policy to understand our practices.
                {'\n\n'}
                <Text style={styles.termsModalSectionTitle}>6. Modifications</Text>{'\n\n'}
                MeowMap reserves the right to revise these terms at any time without notice. By using MeowMap you are agreeing to be bound by the then current version of these Terms and Conditions.
                {'\n\n'}
                <Text style={styles.termsModalSectionTitle}>7. Contact</Text>{'\n\n'}
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
        <View style={styles.termsModalContainer}>
          <View style={styles.termsModalContent}>
            <View style={styles.termsModalHeader}>
              <Text style={styles.termsModalTitle}>Privacy Policy</Text>
              <TouchableOpacity 
                onPress={() => setShowPrivacyModal(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView 
              style={styles.termsModalScrollContent}
              contentContainerStyle={styles.termsModalScrollContentContainer}
              showsVerticalScrollIndicator={true}
            >
              <Text style={styles.termsModalBodyText}>
                <Text style={styles.termsModalSectionTitle}>1. Information We Collect</Text>{'\n\n'}
                We collect information that you provide directly to us, including:
                {'\n\n'}
                • Account information (email address, password){'\n'}
                • Profile information you choose to provide{'\n'}
                • Location data when you use location-based features{'\n'}
                • Usage data and interactions with the app
                {'\n\n'}
                <Text style={styles.termsModalSectionTitle}>2. How We Use Your Information</Text>{'\n\n'}
                We use the information we collect to:
                {'\n\n'}
                • Provide, maintain, and improve our services{'\n'}
                • Process transactions and send related information{'\n'}
                • Send technical notices and support messages{'\n'}
                • Respond to your comments and questions{'\n'}
                • Monitor and analyze trends and usage
                {'\n\n'}
                <Text style={styles.termsModalSectionTitle}>3. Information Sharing</Text>{'\n\n'}
                We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
                {'\n\n'}
                • With your consent{'\n'}
                • To comply with legal obligations{'\n'}
                • To protect our rights and safety{'\n'}
                • With service providers who assist us in operating our app
                {'\n\n'}
                <Text style={styles.termsModalSectionTitle}>4. Data Security</Text>{'\n\n'}
                We implement appropriate security measures to protect your personal information. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
                {'\n\n'}
                <Text style={styles.termsModalSectionTitle}>5. Your Rights</Text>{'\n\n'}
                You have the right to:
                {'\n\n'}
                • Access your personal information{'\n'}
                • Correct inaccurate data{'\n'}
                • Request deletion of your data{'\n'}
                • Object to processing of your data{'\n'}
                • Request data portability
                {'\n\n'}
                <Text style={styles.termsModalSectionTitle}>6. Changes to This Policy</Text>{'\n\n'}
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
                {'\n\n'}
                <Text style={styles.termsModalSectionTitle}>7. Contact Us</Text>{'\n\n'}
                If you have any questions about this Privacy Policy, please contact us.
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <SuccessModal
        visible={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          setIsSignUp(false);
        }}
      />

      <ErrorModal
        visible={showErrorModal}
        message={errorMessage}
        onClose={() => setShowErrorModal(false)}
      />

      {/* Forgot Password Modal */}
      <Modal
        visible={showForgotPasswordModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowForgotPasswordModal(false);
          setForgotPasswordEmail('');
        }}
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
                  setShowForgotPasswordModal(false);
                  setForgotPasswordEmail('');
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

            <Text style={styles.modalTitle}>Forgot Password</Text>
            <Text style={styles.forgotPasswordSubtitle}>
              Enter your email address and we'll send you a link to reset your password.
            </Text>

            <EmailInput
              value={forgotPasswordEmail}
              onChangeText={setForgotPasswordEmail}
              editable={!forgotPasswordLoading}
            />

            <TouchableOpacity
              style={[
                styles.primaryButton,
                (forgotPasswordLoading || forgotPasswordCooldown > 0) && styles.buttonDisabled
              ]}
              onPress={handleForgotPassword}
              disabled={forgotPasswordLoading || forgotPasswordCooldown > 0}
            >
              {forgotPasswordLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {forgotPasswordCooldown > 0 
                    ? `Resend in ${formatCooldown(forgotPasswordCooldown)}`
                    : 'Send Reset Link'
                  }
                </Text>
              )}
            </TouchableOpacity>

            {forgotPasswordCooldown > 0 && (
              <View style={styles.forgotPasswordSuccessContainer}>
                <Text style={styles.forgotPasswordCooldownText}>
                  If an account exists with this email, a password reset link has been sent. Please check your inbox and spam folder.
                </Text>
                <Text style={[styles.forgotPasswordCooldownText, { marginTop: 8, fontSize: 12 }]}>
                  You can request another email in {formatCooldown(forgotPasswordCooldown)}.
                </Text>
              </View>
            )}

            <View style={styles.switchContainer}>
              <Text style={styles.switchText}>Remember your password? </Text>
              <TouchableOpacity 
                onPress={() => {
                  setShowForgotPasswordModal(false);
                  setEmail(forgotPasswordEmail); // Pre-fill email in sign-in
                  setForgotPasswordEmail('');
                  setShowEmailModal(true);
                  setIsSignUp(false);
                }}
                disabled={forgotPasswordLoading}
              >
                <Text style={styles.switchLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
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
              {/* Resend Button */}
              <TouchableOpacity
                style={[
                  styles.emailVerificationResendButton,
                  (resendCooldown > 0 || resendLoading) && styles.emailVerificationResendButtonDisabled
                ]}
                onPress={handleResendVerificationEmail}
                disabled={resendCooldown > 0 || resendLoading}
              >
                {resendLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.emailVerificationResendButtonText}>
                    {resendCooldown > 0 
                      ? `Resend in ${formatCooldown(resendCooldown)}`
                      : 'Resend Verification Email'
                    }
                  </Text>
                )}
              </TouchableOpacity>

              <View style={{ height: 12 }} />

              {/* OK Button */}
              <TouchableOpacity
                style={[styles.emailVerificationButton, styles.emailVerificationButtonSecondary]}
                onPress={() => setShowEmailVerificationModal(false)}
              >
                <Text style={styles.emailVerificationButtonTextSecondary}>OK</Text>
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
  // Biometric Button
  biometricButton: {
    backgroundColor: colors.buttonPrimary,
    borderColor: colors.buttonPrimary,
  },
  biometricButtonText: {
    color: '#fff',
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
  inputError: {
    borderColor: colors.error,
    borderWidth: 2,
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
  termsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 50,
  },
  termsText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  linkText: {
    fontSize: 14,
    color: colors.link,
    textDecorationLine: 'underline',
    lineHeight: 20,
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
  // Terms and Privacy Modal Styles
  termsModalContainer: {
    flex: 1,
    backgroundColor: colors.modalOverlay,
    justifyContent: 'flex-end',
  },
  termsModalContent: {
    backgroundColor: colors.surface,
    height: '100%',
  },
  termsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  termsModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textDark,
    flex: 1,
  },
  termsModalScrollContent: {
    flex: 1,
  },
  termsModalScrollContentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  termsModalBodyText: {
    fontSize: 14,
    color: colors.textDark,
    lineHeight: 22,
  },
  termsModalSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: 16,
    marginBottom: 8,
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
  emailVerificationButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emailVerificationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  // Forgot Password Styles
  rememberMeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: -8,
    width: '100%',
  },
  rememberMeCheckboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rememberMeCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: 'transparent',
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rememberMeCheckboxChecked: {
    backgroundColor: colors.buttonPrimary,
    borderColor: colors.buttonPrimary,
  },
  rememberMeText: {
    color: colors.text,
    fontSize: 14,
  },
  forgotPasswordLink: {
    alignSelf: 'flex-end',
  },
  forgotPasswordLinkText: {
    color: colors.link,
    fontSize: 14,
    fontWeight: '500',
  },
  forgotPasswordSubtitle: {
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
    paddingHorizontal: 8,
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
});
