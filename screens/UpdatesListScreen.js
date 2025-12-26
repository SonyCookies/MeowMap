// 1. React and React Native
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  StatusBar,
  Platform,
  FlatList,
} from 'react-native';

// 2. Third-party libraries
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';

// 3. Local utilities and hooks
// (none)

// 4. Local components
// (none)

// 5. Constants and contexts
import { colors, theme } from '../constants/theme';

export default function UpdatesListScreen({ updates, onBack, onUpdatePress }) {
  const renderUpdateItem = ({ item }) => (
    <TouchableOpacity
      style={styles.updateItem}
      onPress={() => onUpdatePress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.updateItemImagePlaceholder}>
        <MaterialCommunityIcons name="image" size={24} color={colors.primary} />
      </View>
      <View style={styles.updateItemContent}>
        <Text style={styles.updateItemTitle}>{item.title}</Text>
        <Text style={styles.updateItemSubtitle}>{item.subtitle}</Text>
      </View>
      <FontAwesome name="chevron-right" size={16} color={colors.text} style={styles.chevron} />
    </TouchableOpacity>
  );

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
        
        <Text style={styles.headerTitle}>All Updates</Text>
        
        <View style={styles.headerRightPlaceholder} />
      </View>

      {/* Updates List */}
      <FlatList
        data={updates}
        renderItem={renderUpdateItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textDark,
    flex: 1,
    textAlign: 'center',
  },
  headerRightPlaceholder: {
    width: 40,
  },
  listContent: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  updateItem: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  updateItemImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.md,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  updateItemContent: {
    flex: 1,
  },
  updateItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 4,
  },
  updateItemSubtitle: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  chevron: {
    marginLeft: theme.spacing.sm,
  },
  separator: {
    height: theme.spacing.sm,
  },
});

