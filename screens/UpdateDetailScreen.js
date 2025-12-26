// 1. React and React Native
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ImageBackground,
  StatusBar,
  Platform,
} from 'react-native';

// 2. Third-party libraries
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';

// 3. Local utilities and hooks
// (none)

// 4. Local components
// (none)

// 5. Constants and contexts
import { colors, theme } from '../constants/theme';

export default function UpdateDetailScreen({ update, onBack }) {
  if (!update) {
    return null;
  }

  // Format date - you can enhance this with actual date parsing if needed
  const formattedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <ImageBackground
      source={require('../assets/images/HomeScreenBg.png')}
      style={styles.container}
      imageStyle={styles.backgroundImage}
      resizeMode="cover"
    >
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <View style={styles.backButtonCircle}>
            <FontAwesome name="arrow-left" size={18} color={colors.textDark} />
          </View>
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Update Details</Text>
        
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Image Section */}
        <View style={styles.imageSection}>
          <View style={styles.imagePlaceholder}>
            <MaterialCommunityIcons name="image" size={48} color={colors.primary} />
          </View>
        </View>

        {/* Content Section */}
        <View style={styles.contentSection}>
          {/* Title */}
          <Text style={styles.title}>{update.title}</Text>

          {/* Date */}
          <View style={styles.dateContainer}>
            <MaterialCommunityIcons name="calendar-clock" size={16} color={colors.text} />
            <Text style={styles.dateText}>{formattedDate}</Text>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Description */}
          <Text style={styles.description}>{update.subtitle}</Text>

          {/* Additional Content - You can expand this with more details */}
          <View style={styles.additionalInfo}>
            <View style={styles.infoCard}>
              <MaterialCommunityIcons name="information" size={24} color={colors.primary} />
              <View style={styles.infoCardContent}>
                <Text style={styles.infoCardTitle}>More Information</Text>
                <Text style={styles.infoCardText}>
                  This is a community update. Check back regularly for the latest news and updates from your neighborhood.
                </Text>
              </View>
            </View>
          </View>

          {/* Action Button (optional) */}
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Learn More</Text>
            <FontAwesome name="arrow-right" size={16} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    opacity: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: theme.spacing.md,
    backgroundColor: 'transparent',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textDark,
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  imageSection: {
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  contentSection: {
    paddingHorizontal: theme.spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: theme.spacing.sm,
    lineHeight: 32,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  dateText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: theme.spacing.lg,
  },
  description: {
    fontSize: 16,
    color: colors.textDark,
    lineHeight: 24,
    marginBottom: theme.spacing.xl,
  },
  additionalInfo: {
    marginBottom: theme.spacing.xl,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoCardContent: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: theme.spacing.xs,
  },
  infoCardText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

