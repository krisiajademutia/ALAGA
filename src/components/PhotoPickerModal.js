import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';

/**
 * Reusable ALAGA Branded Photo Picker Modal / Bottom Sheet
 * Replaces plain unstyled OS Alert.alert for photo uploads
 */
export default function PhotoPickerModal({
  visible,
  onClose,
  onSelectCamera,
  onSelectGallery,
  onViewPhoto,
  onRemovePhoto,
  hasExistingPhoto = false,
  title = 'Add Photo',
  subtitle = 'Choose how you want to provide a photo',
}) {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              <View style={styles.handle} />

              <Text style={styles.title}>{title}</Text>
              {Boolean(subtitle) && <Text style={styles.subtitle}>{subtitle}</Text>}

              {/* View Full Photo (if available) */}
              {hasExistingPhoto && onViewPhoto && (
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={onViewPhoto}
                  activeOpacity={0.75}
                >
                  <View style={styles.iconWrap}>
                    <Ionicons name="eye-outline" size={20} color="#2E7A99" />
                  </View>
                  <View style={styles.textWrap}>
                    <Text style={styles.actionTitle}>View Full Photo</Text>
                    <Text style={styles.actionDesc}>Open high-res image view</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#947E68" />
                </TouchableOpacity>
              )}

              {/* Take Photo */}
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={onSelectCamera}
                activeOpacity={0.75}
              >
                <View style={styles.iconWrap}>
                  <Ionicons name="camera" size={20} color="#2E7A99" />
                </View>
                <View style={styles.textWrap}>
                  <Text style={styles.actionTitle}>Take Photo</Text>
                  <Text style={styles.actionDesc}>Capture using device camera</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#947E68" />
              </TouchableOpacity>

              {/* Choose from Gallery */}
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={onSelectGallery}
                activeOpacity={0.75}
              >
                <View style={styles.iconWrap}>
                  <Ionicons name="images" size={20} color="#2E7A99" />
                </View>
                <View style={styles.textWrap}>
                  <Text style={styles.actionTitle}>Choose from Gallery</Text>
                  <Text style={styles.actionDesc}>Select from your photo library</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#947E68" />
              </TouchableOpacity>

              {/* Remove Photo (if available) */}
              {hasExistingPhoto && onRemovePhoto && (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnDanger]}
                  onPress={onRemovePhoto}
                  activeOpacity={0.75}
                >
                  <View style={[styles.iconWrap, styles.iconWrapDanger]}>
                    <Ionicons name="trash-outline" size={20} color="#D94F4F" />
                  </View>
                  <View style={styles.textWrap}>
                    <Text style={[styles.actionTitle, { color: '#D94F4F' }]}>Remove Photo</Text>
                    <Text style={styles.actionDesc}>Delete current photo attachment</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#D94F4F" />
                </TouchableOpacity>
              )}

              {/* Cancel */}
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={onClose}
                activeOpacity={0.75}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(45, 31, 18, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 38 : 24,
    borderTopWidth: 1,
    borderColor: '#E8DFC8',
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E8DFC8',
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#473018',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#685038',
    marginBottom: 18,
    lineHeight: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFDF6',
    borderWidth: 1,
    borderColor: '#E8DFC8',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  actionBtnDanger: {
    borderColor: '#F8D7DA',
    backgroundColor: '#FFF8F8',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EBF7FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconWrapDanger: {
    backgroundColor: '#FDECEE',
  },
  textWrap: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#473018',
    marginBottom: 2,
  },
  actionDesc: {
    fontSize: 11,
    color: '#8C7D6A',
  },
  cancelBtn: {
    height: 46,
    borderRadius: 14,
    backgroundColor: '#FAF5E8',
    borderWidth: 1,
    borderColor: '#E8DFC8',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#685038',
  },
});
