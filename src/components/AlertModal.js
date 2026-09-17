import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS, FONTS } from '../constants/theme';

const { width } = Dimensions.get('window');

/**
 * Premium custom Alert Dialog with background blur
 *
 * Props:
 * - visible (boolean)
 * - type ('error' | 'warning' | 'success' | 'info')
 * - title (string)
 * - message (string)
 * - primaryText (string)
 * - onPrimaryPress (function)
 * - secondaryText (string, optional)
 * - onSecondaryPress (function, optional)
 * - onClose (function)
 */
export default function AlertModal({
  visible,
  type = 'info',
  title,
  message,
  primaryText = 'OK',
  onPrimaryPress,
  secondaryText,
  onSecondaryPress,
  onClose,
}) {
  if (!visible) return null;

  const getIconConfig = () => {
    switch (type) {
      case 'error':
        return {
          icon: 'alert-circle',
          iconColor: '#E63946',
          bgColor: '#FDECEE',
          borderColor: '#F8D7DA',
        };
      case 'warning':
        return {
          icon: 'warning-outline',
          iconColor: '#E76F51',
          bgColor: '#FFF3E8',
          borderColor: '#FFE0C2',
        };
      case 'success':
        return {
          icon: 'checkmark-circle-outline',
          iconColor: '#2A9D8F',
          bgColor: '#EAF7F4',
          borderColor: '#C8EDE4',
        };
      case 'info':
      default:
        return {
          icon: 'shield-checkmark-outline',
          iconColor: COLORS.primary,
          bgColor: '#E7F2F5',
          borderColor: '#C6E2E9',
        };
    }
  };

  const config = getIconConfig();

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose || onPrimaryPress}
    >
      <View style={styles.container}>
        {/* Blurred Background */}
        <BlurView
          intensity={Platform.OS === 'ios' ? 45 : 60}
          tint="dark"
          style={StyleSheet.absoluteFill}
        />

        {/* Semi-transparent tint overlay */}
        <TouchableWithoutFeedback onPress={onClose || onPrimaryPress}>
          <View style={styles.backdropOverlay} />
        </TouchableWithoutFeedback>

        {/* Dialog Card */}
        <View style={styles.dialogCard}>
          {/* Top Status Icon */}
          <View
            style={[
              styles.iconWrapper,
              {
                backgroundColor: config.bgColor,
                borderColor: config.borderColor,
              },
            ]}
          >
            <Ionicons name={config.icon} size={36} color={config.iconColor} />
          </View>

          {/* Title */}
          {Boolean(title) && <Text style={styles.titleText}>{title}</Text>}

          {/* Message */}
          {Boolean(message) && <Text style={styles.messageText}>{message}</Text>}

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            {Boolean(secondaryText) && (
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={onSecondaryPress || onClose}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryBtnText}>{secondaryText}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.primaryBtn,
                !secondaryText && styles.primaryBtnFull,
                type === 'error' && styles.primaryBtnDanger,
              ]}
              onPress={onPrimaryPress || onClose}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>{primaryText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 25, 30, 0.45)',
  },
  dialogCard: {
    width: '100%',
    maxWidth: Math.min(width - 44, 380),
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 22,
    alignItems: 'center',
    ...SHADOWS.card,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 14,
    borderWidth: 1,
    borderColor: '#E7F0F3',
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
  },
  titleText: {
    ...FONTS.titleLg,
    color: '#1C2E25',
    textAlign: 'center',
    marginBottom: 10,
  },
  messageText: {
    ...FONTS.bodyMedium,
    color: '#4F635B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  secondaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F1F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    ...FONTS.bodyMedium,
    fontWeight: '700',
    color: '#5C6F68',
  },
  primaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  primaryBtnFull: {
    flex: 1,
  },
  primaryBtnDanger: {
    backgroundColor: '#E63946',
  },
  primaryBtnText: {
    ...FONTS.bodyMedium,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
