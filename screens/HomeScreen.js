import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../constants/theme';

export default function HomeScreen() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to MeowMap!</Text>
      {user && (
        <>
          <Text style={styles.subtitle}>Signed in as:</Text>
          <Text style={styles.email}>{user.email}</Text>
        </>
      )}
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutButtonText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 8,
  },
  email: {
    fontSize: 18,
    color: colors.link,
    fontWeight: '600',
    marginBottom: 32,
  },
  signOutButton: {
    backgroundColor: colors.error,
    borderRadius: 8,
    padding: 16,
    paddingHorizontal: 32,
  },
  signOutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

