import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet, Platform } from 'react-native';
import { colors } from '../../constants/theme';

const TERMS_CONTENT = `1. Acceptance of Terms

By accessing and using MeowMap, you accept and agree to be bound by the terms and provision of this agreement.

2. Use License

Permission is granted to temporarily download one copy of MeowMap for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:

• modify or copy the materials;
• use the materials for any commercial purpose or for any public display;
• attempt to reverse engineer any software contained in MeowMap;
• remove any copyright or other proprietary notations from the materials.

3. User Account

You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.

4. Content

You are responsible for all content that you post, upload, or otherwise make available through MeowMap. You agree not to post content that is illegal, harmful, threatening, abusive, or otherwise objectionable.

5. Privacy

Your use of MeowMap is also governed by our Privacy Policy. Please review our Privacy Policy to understand our practices.

6. Modifications

MeowMap reserves the right to revise these terms at any time without notice. By using MeowMap you are agreeing to be bound by the then current version of these Terms and Conditions.

7. Contact

If you have any questions about these Terms and Conditions, please contact us.`;

/**
 * Terms and Conditions Modal component
 */
const TermsModal = ({ visible, onClose }) => {
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
            <Text style={styles.title}>Terms and Conditions</Text>
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
            <Text style={styles.bodyText}>{TERMS_CONTENT}</Text>
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

export default TermsModal;

