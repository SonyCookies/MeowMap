import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

// Complete the web browser auth session for OAuth
WebBrowser.maybeCompleteAuthSession();

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sign up with email and password
  const signUp = async (email, password) => {
    // Redirect to web app's email verification success page
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: 'https://meowmap-web.vercel.app/auth/verify-email',
      },
    });
    return { data, error };
  };

  // Sign in with email and password
  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  // Sign out
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  // Forgot password - send password reset email
  const forgotPassword = async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://meowmap-web.vercel.app/auth/reset-password',
    });
    return { data, error };
  };

  // Sign in with OAuth provider
  const signInWithOAuth = async (provider) => {
    try {
      const redirectTo = AuthSession.makeRedirectUri({
        scheme: undefined, // Let it auto-detect
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider, // 'google' or 'github'
        options: {
          redirectTo,
          skipBrowserRedirect: false,
        },
      });

      if (error) throw error;

      // Open the OAuth URL in browser
      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        
        if (result.type === 'success') {
          // The URL will contain the hash with tokens
          const url = result.url;
          
          // Parse URL fragments (Supabase uses hash fragments)
          if (url.includes('#')) {
            const hash = url.split('#')[1];
            const params = new URLSearchParams(hash);
            const access_token = params.get('access_token');
            const refresh_token = params.get('refresh_token');

            if (access_token && refresh_token) {
              // Set the session with the tokens
              const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
                access_token,
                refresh_token,
              });
              
              if (sessionError) throw sessionError;
              return { data: sessionData, error: null };
            }
          }
          
          // Fallback: Try parsing as query params
          const parsed = Linking.parse(url);
          if (parsed.queryParams?.access_token && parsed.queryParams?.refresh_token) {
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: parsed.queryParams.access_token,
              refresh_token: parsed.queryParams.refresh_token,
            });
            
            if (sessionError) throw sessionError;
            return { data: sessionData, error: null };
          }
        }
        
        if (result.type === 'cancel') {
          return { data: null, error: { message: 'OAuth sign in was cancelled' } };
        }
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    signInWithOAuth,
    forgotPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

