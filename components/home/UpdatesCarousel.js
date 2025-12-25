// 1. React and React Native
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';

// 2. Third-party libraries
import { MaterialCommunityIcons } from '@expo/vector-icons';

// 3. Local utilities and hooks
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';

// 4. Local components
// (None)

// 5. Constants and contexts
import { colors, theme } from '../../constants/theme';

export default function UpdatesCarousel({ updates, onUpdatePress, onViewAll }) {
  const recentUpdates = updates.slice(0, 5);
  
  const {
    currentIndex,
    scrollViewRef,
    loopedItems,
    handleScroll,
    handleScrollBeginDrag,
    handleScrollEndDrag,
  } = useInfiniteScroll(recentUpdates, {
    cardWidth: 280,
    gap: 12,
    autoScrollInterval: 5000,
  });

  return (
    <View style={styles.updatesContainer}>
      <View style={styles.updatesHeader}>
        <Text style={styles.sectionTitle}>Recent Updates</Text>
        <TouchableOpacity 
          onPress={onViewAll}
          activeOpacity={0.7}
        >
          <Text style={styles.viewAllButton}>View All</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        contentContainerStyle={styles.updatesScrollContent}
        onScroll={handleScroll}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        scrollEventThrottle={16}
      >
        {loopedItems.map((item, index) => (
          <TouchableOpacity 
            key={`${item.id}-${index}`} 
            style={styles.updateCard}
            onPress={() => onUpdatePress(item, 'home')}
            activeOpacity={0.8}
          >
            <View style={styles.updateImagePlaceholder}>
              <MaterialCommunityIcons name="image" size={24} color={colors.primary} />
            </View>
            <Text style={styles.updateTitle}>{item.title}</Text>
            <Text style={styles.updateSubtitle}>{item.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={styles.dotsRow}>
        {recentUpdates.map((item, index) => (
          <View
            key={item.id}
            style={[
              styles.dot,
              currentIndex === index && styles.dotActive
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  updatesContainer: {
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  updatesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: theme.spacing.md,
    color: colors.textDark,
  },
  viewAllButton: {
    fontSize: 14,
    fontWeight: '600',
    paddingRight: theme.spacing.md,
    color: colors.primary,
  },
  updatesScrollContent: {
    paddingHorizontal: Dimensions.get('window').width / 2 - 140,
  },
  updateCard: {
    width: 280,
    marginRight: theme.spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  updateImagePlaceholder: {
    width: '100%',
    height: 70,
    borderRadius: theme.borderRadius.md,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  updateTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 4,
  },
  updateSubtitle: {
    fontSize: 12,
    color: colors.text,
    lineHeight: 16,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    gap: 6,
    justifyContent: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: colors.text,
    opacity: 0.3,
  },
  dotActive: {
    backgroundColor: colors.primary,
    opacity: 1,
    width: 8,
    height: 8,
    borderRadius: theme.borderRadius.sm,
  },
});

