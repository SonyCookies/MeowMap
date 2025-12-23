import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import AuthScreen from './screens/AuthScreen';
import HomeScreen from './screens/HomeScreen';
import ProfileSetupScreen from './screens/ProfileSetupScreen';
import { supabase } from './lib/supabase';
import { useProfileCheck } from './hooks/useProfileCheck';

function AppContent() {
  const { user, loading } = useAuth();
  const { profile, isComplete, loading: profileLoading, refetch } = useProfileCheck(user?.id);

  // Handle deep links for email confirmation
  useEffect(() => {
    // Handle initial URL if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    // Listen for deep links while app is running
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleDeepLink = async (url) => {
    try {
      // Parse the URL to extract tokens from Supabase callback
      if (url.includes('access_token') || url.includes('refresh_token')) {
        // Try extracting from URL hash (Supabase uses hash fragments)
        if (url.includes('#')) {
          const hash = url.split('#')[1];
          const params = new URLSearchParams(hash);
          const access_token = params.get('access_token');
          const refresh_token = params.get('refresh_token');

          if (access_token && refresh_token) {
            // Set the session with the tokens
            const { error } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            if (error) {
              console.error('Error setting session:', error);
            }
            return;
          }
        }

        // Fallback: Try extracting from query params
        if (url.includes('?')) {
          const parsed = Linking.parse(url);
          const access_token = parsed.queryParams?.access_token;
          const refresh_token = parsed.queryParams?.refresh_token;

          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({
              access_token: String(access_token),
              refresh_token: String(refresh_token),
            });
            if (error) {
              console.error('Error setting session:', error);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error handling deep link:', error);
    }
  };

  // Handle profile completion callback
  const handleProfileComplete = async () => {
    // Refetch profile to update state
    await refetch();
  };

  if (loading || (user && profileLoading)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <>
      {user ? (
        isComplete ? (
          <HomeScreen />
        ) : (
          <ProfileSetupScreen onComplete={handleProfileComplete} />
        )
      ) : (
        <AuthScreen />
      )}
      <StatusBar style="auto" />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
