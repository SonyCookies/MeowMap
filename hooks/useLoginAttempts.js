import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Custom hook for managing login attempt tracking and rate limiting
 * Tracks failed login attempts and locks account after 5 attempts for 15 minutes
 */
export const useLoginAttempts = (email) => {
  const [failedLoginAttempts, setFailedLoginAttempts] = useState(0);
  const [accountLockedUntil, setAccountLockedUntil] = useState(null);

  // Restore login attempt tracking from AsyncStorage when email changes
  useEffect(() => {
    const restoreLoginAttempts = async () => {
      try {
        const storedData = await AsyncStorage.getItem('loginAttempts');
        if (storedData) {
          const { email: storedEmail, attempts, lockUntil } = JSON.parse(storedData);
          
          // Only restore if it's for the current email
          if (storedEmail === email) {
            if (lockUntil) {
              const now = Date.now();
              const lockTime = parseInt(lockUntil, 10);
              
              if (now < lockTime) {
                // Account is still locked
                setAccountLockedUntil(lockTime);
                setFailedLoginAttempts(5); // Max attempts reached
              } else {
                // Lock expired, clear it
                await AsyncStorage.removeItem('loginAttempts');
                setFailedLoginAttempts(0);
                setAccountLockedUntil(null);
              }
            } else if (attempts) {
              // Restore attempt count (no lock)
              setFailedLoginAttempts(attempts);
              setAccountLockedUntil(null);
            }
          } else {
            // Different email - clear state for this email
            setFailedLoginAttempts(0);
            setAccountLockedUntil(null);
          }
        } else {
          // No stored data - clear state
          setFailedLoginAttempts(0);
          setAccountLockedUntil(null);
        }
      } catch (error) {
        console.error('Error restoring login attempts:', error);
        // On error, clear state
        setFailedLoginAttempts(0);
        setAccountLockedUntil(null);
      }
    };

    if (email) {
      restoreLoginAttempts();
    } else {
      // No email entered - clear state
      setFailedLoginAttempts(0);
      setAccountLockedUntil(null);
    }
  }, [email]);

  const recordFailedAttempt = async (userEmail) => {
    const newAttempts = failedLoginAttempts + 1;
    setFailedLoginAttempts(newAttempts);
    
    if (newAttempts >= 5) {
      // Lock account for 15 minutes (900 seconds)
      const lockUntil = Date.now() + (15 * 60 * 1000);
      setAccountLockedUntil(lockUntil);
      
      // Store in AsyncStorage
      try {
        await AsyncStorage.setItem('loginAttempts', JSON.stringify({
          email: userEmail,
          attempts: 5,
          lockUntil: lockUntil.toString(),
        }));
      } catch (storageError) {
        console.error('Error saving login attempts:', storageError);
      }
      
      return {
        locked: true,
        remainingAttempts: 0,
        lockUntil,
      };
    } else {
      // Store updated attempts in AsyncStorage
      try {
        await AsyncStorage.setItem('loginAttempts', JSON.stringify({
          email: userEmail,
          attempts: newAttempts,
        }));
      } catch (storageError) {
        console.error('Error saving login attempts:', storageError);
      }
      
      const remainingAttempts = Math.max(0, 5 - newAttempts);
      return {
        locked: false,
        remainingAttempts,
      };
    }
  };

  const resetAttempts = async () => {
    setFailedLoginAttempts(0);
    setAccountLockedUntil(null);
    try {
      await AsyncStorage.removeItem('loginAttempts');
    } catch (storageError) {
      console.error('Error clearing login attempts:', storageError);
    }
  };

  const isLocked = () => {
    if (!accountLockedUntil) return false;
    const now = Date.now();
    if (now < accountLockedUntil) {
      return true;
    } else {
      // Lock expired
      setAccountLockedUntil(null);
      setFailedLoginAttempts(0);
      return false;
    }
  };

  const getRemainingLockTime = () => {
    if (!accountLockedUntil) return 0;
    const now = Date.now();
    if (now < accountLockedUntil) {
      return Math.ceil((accountLockedUntil - now) / (1000 * 60)); // minutes
    }
    return 0;
  };

  return {
    failedLoginAttempts,
    accountLockedUntil,
    recordFailedAttempt,
    resetAttempts,
    isLocked,
    getRemainingLockTime,
  };
};

