import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet, Platform } from 'react-native';
import { colors } from '../../constants/theme';

const PRIVACY_CONTENT = `1. Information We Collect

We collect information that you provide directly to us, including:

• Account information (email address, password)
• Profile information you choose to provide
• Location data when you use location-based features
• Usage data and interactions with the app

2. How We Use Your Information

We use the information we collect to:

• Provide, maintain, and improve our services
• Process transactions and send related information
• Send technical notices and support messages
• Respond to your comments and questions
• Monitor and analyze trends and usage

3. Information Sharing

We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:

• With your consent
• To comply with legal obligations
• To protect our rights and safety
• With service providers who assist us in operating our app

4. Data Security

We implement appropriate security measures to protect your personal information. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.

5. Your Rights

You have the right to:

• Access your personal information
• Correct inaccurate data
• Request deletion of your data
• Object to processing of your data
• Request data portability

6. Changes to This Policy

We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.

7. Contact Us

If you have any questions about this Privacy Policy, please contact us.`;

/**
 * Privacy Policy Modal component
 */
const PrivacyModal = ({ visible, onClose }) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Privacy Policy</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView 
            style={styles.scrollContent}
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator={true}
            bounces={true}
          >
            <Text style={styles.bodyText}>{PRIVACY_CONTENT}</Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.modalOverlay,
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: colors.surface,
    height: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textDark,
    flex: 1,
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
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  bodyText: {
    fontSize: 14,
    color: colors.textDark,
    lineHeight: 22,
  },
});

export default PrivacyModal;

