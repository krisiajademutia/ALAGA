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
import { COLORS, SHADOWS, FONTS } from '../constants/theme';

const { width } = Dimensions.get('window');

/**
 * Premium custom Alert Dialog harmonized with ALAGA Design System
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
  customIcon,
}) {
  if (!visible) return null;

  const getIconConfig = () => {
    if (customIcon) {
      return {
        icon: customIcon,
        iconColor:
          type === 'error'
            ? '#D94F4F'
            : type === 'warning'
            ? '#D97706'
            : type === 'success'
            ? '#2D9E5F'
            : '#2E7A99',
        bgColor:
          type === 'error'
            ? '#FDECEE'
            : type === 'warning'
            ? '#FFFBEB'
            : type === 'success'
            ? '#EAF7F0'
            : '#EBF7FA',
        borderColor:
          type === 'error'
            ? '#F8D7DA'
            : type === 'warning'
            ? '#FDE68A'
            : type === 'success'
            ? '#C8EDE0'
            : '#CCEAF3',
      };
    }

    switch (type) {
      case 'error':
        return {
          icon: 'alert-circle',
          iconColor: '#D94F4F',
          bgColor: '#FDECEE',
          borderColor: '#F8D7DA',
        };
      case 'warning':
        return {
          icon: 'warning-outline',
          iconColor: '#D97706',
          bgColor: '#FFFBEB',
          borderColor: '#FDE68A',
        };
      case 'success':
        return {
          icon: 'paw',
          iconColor: '#2D9E5F',
          bgColor: '#EAF7F0',
          borderColor: '#C8EDE0',
        };
      case 'info':
      default:
        return {
          icon: 'shield-checkmark-outline',
          iconColor: '#2E7A99',
          bgColor: '#EBF7FA',
          borderColor: '#CCEAF3',
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
        {/* Background Blur */}
        <BlurView
          intensity={Platform.OS === 'ios' ? 40 : 50}
          tint="dark"
          style={StyleSheet.absoluteFill}
        />

        {/* Backdrop Dismiss */}
        <TouchableWithoutFeedback onPress={onClose || onPrimaryPress}>
          <View style={styles.backdropOverlay} />
        </TouchableWithoutFeedback>

        {/* Dialog Card */}
        <View style={styles.dialogCard}>
          {/* Status Icon */}
          <View
            style={[
              styles.iconWrapper,
              {
                backgroundColor: config.bgColor,
                borderColor: config.borderColor,
              },
            ]}
          >
            <Ionicons name={config.icon} size={30} color={config.iconColor} />
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
                activeOpacity={0.75}
              >
                <Text
                  style={styles.secondaryBtnText}
                  numberOfLines={2}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                >
                  {secondaryText}
                </Text>
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
              <Text
                style={[
                  styles.primaryBtnText,
                  type === 'error' && styles.primaryBtnTextDanger,
                ]}
                numberOfLines={2}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                {primaryText}
              </Text>
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
    paddingHorizontal: 20,
  },
  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(45, 31, 18, 0.48)',
  },
  dialogCard: {
    width: '100%',
    maxWidth: Math.min(width - 32, 380),
    backgroundColor: '#FFFDF8',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: 'center',
    shadowColor: '#473018',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 10,
    borderWidth: 1.5,
    borderColor: '#E8DFC8',
  },
  iconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1.5,
  },
  titleText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 18,
    color: '#473018',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  messageText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13.5,
    color: '#685038',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
    width: '100%',
  },
  secondaryBtn: {
    flex: 1,
    minHeight: 48,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 14,
    backgroundColor: '#FAF5E8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E8DFC8',
  },
  secondaryBtnText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 13,
    color: '#685038',
    textAlign: 'center',
    lineHeight: 18,
  },
  primaryBtn: {
    flex: 1,
    minHeight: 48,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 14,
    backgroundColor: '#92CDE5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2E7A99',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryBtnFull: {
    flex: 1,
  },
  primaryBtnDanger: {
    backgroundColor: '#D94F4F',
    shadowColor: '#D94F4F',
  },
  primaryBtnText: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 13,
    color: '#473018',
    textAlign: 'center',
    lineHeight: 18,
  },
  primaryBtnTextDanger: {
    color: '#FFFFFF',
  },
});
