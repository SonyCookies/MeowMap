// 1. React and React Native
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

// 2. Third-party libraries
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';

// 3. Local utilities and hooks
// (None)

// 4. Local components
import CoatPatternPicker from './CoatPatternPicker';
import ColorPicker from './ColorPicker';

// 5. Constants and contexts
import { colors, theme } from '../../constants/theme';

export default function SightingFormModal({
  visible,
  sightingForm,
  onFormChange,
  submitting,
  showCoatPatternPicker,
  showColorPicker,
  onShowCoatPatternPicker,
  onShowColorPicker,
  onShowImageOptions,
  onRemovePhoto,
  onSubmit,
  onCancel,
  isEditMode = false,
  sightingId = null,
}) {
  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={onCancel}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalBackdrop} />
          <View style={[styles.modalContent, submitting && styles.modalContentDisabled]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEditMode ? 'Edit Cat Sighting' : 'Report Cat Sighting'}
              </Text>
              <TouchableOpacity onPress={onCancel}>
                <FontAwesome name="times" size={20} color={colors.textDark} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Cat Name */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Cat Name / Nickname *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., The Grocery Store Tabby"
                  placeholderTextColor={colors.text}
                  value={sightingForm.catName}
                  onChangeText={(text) => onFormChange({ ...sightingForm, catName: text })}
                />
              </View>

              {/* Description */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="e.g., Very shy, orange, wearing a blue collar"
                  placeholderTextColor={colors.text}
                  value={sightingForm.description}
                  onChangeText={(text) => onFormChange({ ...sightingForm, description: text })}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              {/* Coat Pattern */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Coat Pattern (Recommended)</Text>
                <TouchableOpacity
                  style={styles.dropdown}
                  onPress={onShowCoatPatternPicker}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.dropdownText, !sightingForm.coatPattern && styles.dropdownPlaceholder]}>
                    {sightingForm.coatPattern ? sightingForm.coatPattern.split(' (')[0] : 'Select coat pattern'}
                  </Text>
                  <MaterialCommunityIcons name="chevron-down" size={20} color={colors.text} />
                </TouchableOpacity>
              </View>

              {/* Primary Color */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Primary Color</Text>
                <TouchableOpacity
                  style={styles.dropdown}
                  onPress={onShowColorPicker}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.dropdownText, !sightingForm.primaryColor && styles.dropdownPlaceholder]}>
                    {sightingForm.primaryColor || 'Select primary color'}
                  </Text>
                  <MaterialCommunityIcons name="chevron-down" size={20} color={colors.text} />
                </TouchableOpacity>
              </View>

              {/* Urgency Level */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Urgency Level</Text>
                <View style={styles.urgencyButtons}>
                  {[
                    { level: 'Just chilling', icon: 'emoticon-happy', color: colors.success },
                    { level: 'Needs food', icon: 'food', color: colors.warning },
                    { level: 'Appears injured', icon: 'alert-circle', color: colors.error },
                  ].map(({ level, icon, color }) => {
                    const isActive = sightingForm.urgencyLevel === level;
                    return (
                      <TouchableOpacity
                        key={level}
                        style={[
                          styles.urgencyButton,
                          isActive && { borderColor: color },
                        ]}
                        onPress={() => onFormChange({ ...sightingForm, urgencyLevel: level })}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons
                          name={icon}
                          size={20}
                          color={isActive ? color : colors.text}
                        />
                        <Text
                          style={[
                            styles.urgencyButtonText,
                            isActive && { color: color },
                          ]}
                        >
                          {level}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Photo Upload */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Photo</Text>
                <TouchableOpacity
                  style={styles.photoButton}
                  onPress={onShowImageOptions}
                  activeOpacity={0.7}
                >
                  {sightingForm.photo ? (
                    <Image source={{ uri: sightingForm.photo }} style={styles.photoPreview} />
                  ) : (
                    <View style={styles.photoPlaceholder}>
                      <MaterialCommunityIcons name="camera" size={32} color={colors.primary} />
                      <Text style={styles.photoPlaceholderText}>Take Photo or Choose from Gallery</Text>
                    </View>
                  )}
                </TouchableOpacity>
                {sightingForm.photo && (
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={onRemovePhoto}
                  >
                    <Text style={styles.removePhotoText}>Remove Photo</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onCancel}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                onPress={onSubmit}
                activeOpacity={0.7}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.submitButtonText}>Submit Sighting</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Coat Pattern Picker */}
      <CoatPatternPicker
        visible={showCoatPatternPicker}
        selectedPattern={sightingForm.coatPattern}
        onSelect={(pattern) => onFormChange({ ...sightingForm, coatPattern: pattern })}
        onClose={onShowCoatPatternPicker}
      />

      {/* Color Picker */}
      <ColorPicker
        visible={showColorPicker}
        selectedColor={sightingForm.primaryColor}
        onSelect={(color) => onFormChange({ ...sightingForm, primaryColor: color })}
        onClose={onShowColorPicker}
      />
    </>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  modalContentDisabled: {
    opacity: 0.6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textDark,
  },
  modalBody: {
    padding: theme.spacing.md,
    maxHeight: 500,
  },
  formGroup: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: theme.spacing.xs,
  },
  input: {
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: 16,
    color: colors.textDark,
  },
  textArea: {
    minHeight: 100,
    paddingTop: theme.spacing.md,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  dropdownText: {
    flex: 1,
    fontSize: 16,
    color: colors.textDark,
  },
  dropdownPlaceholder: {
    color: colors.text,
  },
  urgencyButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  urgencyButton: {
    flex: 1,
    minWidth: '30%',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: colors.cream,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  urgencyButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textDark,
    textAlign: 'center',
  },
  photoButton: {
    width: '100%',
    height: 200,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cream,
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  photoPlaceholderText: {
    marginTop: theme.spacing.sm,
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removePhotoButton: {
    marginTop: theme.spacing.sm,
    alignSelf: 'flex-start',
  },
  removePhotoText: {
    fontSize: 14,
    color: colors.error,
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: theme.spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
  },
  submitButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

