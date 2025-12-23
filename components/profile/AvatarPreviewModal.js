// 1. React and React Native
import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';

// 2. Third-party libraries
import { FontAwesome } from '@expo/vector-icons';

// 5. Constants and contexts
import { colors } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Avatar Preview Modal Component
 * Shows a full-screen preview of the selected avatar
 */
const AvatarPreviewModal = ({ visible, imageUri, onClose, onChange }) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <FontAwesome name="times" size={24} color={colors.textDark} />
          </TouchableOpacity>

          {/* Image Preview */}
          {imageUri && (
            <Image
              source={{ uri: imageUri }}
              style={styles.previewImage}
              resizeMode="contain"
            />
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.changeButton}
              onPress={onChange}
            >
              <FontAwesome name="camera" size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.changeButtonText}>Change Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeButtonAction}
              onPress={onClose}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: SCREEN_WIDTH * 0.9,
    maxHeight: '80%',
    alignItems: 'center',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: -40,
    right: 0,
    zIndex: 10,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  previewImage: {
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_WIDTH * 0.8,
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  actionButtons: {
    marginTop: 24,
    width: '100%',
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.buttonPrimary,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  buttonIcon: {
    marginRight: 4,
  },
  changeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButtonAction: {
    alignItems: 'center',
    padding: 12,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default AvatarPreviewModal;

