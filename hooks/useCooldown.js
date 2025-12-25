import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Custom hook for managing cooldown timers with AsyncStorage persistence
 * 
 * @param {string} storageKey - AsyncStorage key for persisting cooldown
 * @param {number} cooldownDuration - Cooldown duration in seconds (default: 300)
 * @param {string} identifier - Optional identifier (e.g., email) for the cooldown
 * @returns {Object} - Cooldown state and functions
 */
export const useCooldown = (storageKey, cooldownDuration = 300, identifier = null) => {
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(true);

  // Restore cooldown from AsyncStorage on mount
  useEffect(() => {
    const restoreCooldown = async () => {
      try {
        const storedData = await AsyncStorage.getItem(storageKey);
        if (storedData) {
          const { identifier: storedIdentifier, timestamp } = JSON.parse(storedData);
          
          // If identifier is provided, check if it matches
          if (identifier && storedIdentifier !== identifier) {
            setLoading(false);
            return;
          }
          
          const now = Date.now();
          const elapsed = Math.floor((now - timestamp) / 1000);
          const remaining = Math.max(0, cooldownDuration - elapsed);

          if (remaining > 0) {
            setCooldown(remaining);
          } else {
            // Cooldown expired, remove from storage
            await AsyncStorage.removeItem(storageKey);
          }
        }
      } catch (error) {
        console.error(`Error restoring cooldown for ${storageKey}:`, error);
      } finally {
        setLoading(false);
      }
    };

    restoreCooldown();
  }, [storageKey, cooldownDuration, identifier]);

  // Cooldown timer effect
  useEffect(() => {
    let interval = null;
    if (cooldown > 0) {
      interval = setInterval(async () => {
        setCooldown((prev) => {
          const newValue = prev <= 1 ? 0 : prev - 1;
          
          // Update AsyncStorage when cooldown changes
          if (newValue === 0) {
            // Cooldown finished, remove from storage
            AsyncStorage.removeItem(storageKey).catch(console.error);
          } else if (identifier) {
            // Update timestamp in storage
            AsyncStorage.setItem(storageKey, JSON.stringify({
              identifier,
              timestamp: Date.now() - (cooldownDuration - newValue) * 1000,
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
  }, [cooldown, storageKey, cooldownDuration, identifier]);

  /**
   * Start cooldown timer
   * @param {string} newIdentifier - Optional identifier to store with cooldown
   */
  const startCooldown = async (newIdentifier = null) => {
    const idToStore = newIdentifier || identifier;
    setCooldown(cooldownDuration);
    
    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify({
        identifier: idToStore,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.error(`Error saving cooldown for ${storageKey}:`, error);
    }
  };

  /**
   * Clear cooldown
   */
  const clearCooldown = async () => {
    setCooldown(0);
    try {
      await AsyncStorage.removeItem(storageKey);
    } catch (error) {
      console.error(`Error clearing cooldown for ${storageKey}:`, error);
    }
  };

  /**
   * Check if cooldown is active
   */
  const isOnCooldown = () => {
    return cooldown > 0;
  };

  return {
    cooldown,
    loading,
    startCooldown,
    clearCooldown,
    isOnCooldown,
  };
};

