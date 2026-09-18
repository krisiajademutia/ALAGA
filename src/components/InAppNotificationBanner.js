import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  Vibration,
  Dimensions,
  PanResponder,
  Image,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

/**
 * Standard Phone Heads-Up Dropdown Notification Banner
 * - Default smartphone black-transparent UI with frosted glass
 * - Stays for seconds (~4.5s) then smoothly auto-dismisses
 * - Swiping up dismisses it immediately
 * - Tapping navigates to the alert/chat
 */
export default function InAppNotificationBanner({
  notification,
  onDismiss,
  onPress,
}) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-180)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const topOffset =
    Platform.OS === 'ios'
      ? Math.max(insets.top, 20) + 4
      : Math.max(insets.top, 12) + 6;

  useEffect(() => {
    if (!notification) return;

    // Gentle haptic feedback on arrival
    try {
      Vibration.vibrate(Platform.OS === 'android' ? [0, 60, 40, 60] : 80);
    } catch (e) {
      // ignore
    }

    // Reset position before sliding down
    translateY.setValue(-180);
    opacity.setValue(0);

    // Slide down smoothly
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: topOffset,
        useNativeDriver: true,
        friction: 8,
        tension: 60,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();

    // Pop up notification stays for 4.5 seconds then auto-dismisses smoothly
    const timer = setTimeout(() => {
      dismiss();
    }, 4500);

    return () => clearTimeout(timer);
  }, [notification?.id]);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -180,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onDismiss) onDismiss();
    });
  };

  // Swiping up dismisses the heads-up notification
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return (
          Math.abs(gestureState.dy) > 6 &&
          Math.abs(gestureState.dy) > Math.abs(gestureState.dx)
        );
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy < 0) {
          translateY.setValue(topOffset + gestureState.dy);
        } else {
          translateY.setValue(topOffset + gestureState.dy * 0.2);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy < -35 || gestureState.vy < -0.5) {
          dismiss();
        } else {
          Animated.spring(translateY, {
            toValue: topOffset,
            useNativeDriver: true,
            friction: 8,
            tension: 60,
          }).start();
        }
      },
    })
  ).current;

  if (!notification) return null;

  const isRescue = notification.type === 'rescue';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
      pointerEvents="box-none"
      {...panResponder.panHandlers}
    >
      <TouchableOpacity
        style={styles.bannerCard}
        activeOpacity={0.92}
        onPress={() => {
          dismiss();
          if (onPress) onPress(notification);
        }}
      >
        {/* Dark Frosted Blur (Default Phone Notification Style) */}
        <BlurView
          intensity={Platform.OS === 'ios' ? 70 : 85}
          tint="dark"
          style={StyleSheet.absoluteFill}
        />

        {/* Black Transparent Tint Layer */}
        <View style={styles.darkOverlay} />

        {/* Card Content */}
        <View style={styles.contentWrap}>
          {/* Default Phone Notification Header: App Icon • App Name • now */}
          <View style={styles.headerRow}>
            <View style={styles.appIdentity}>
              <View style={styles.appIconContainer}>
                <Image
                  source={require('../../assets/alaga-logo.png')}
                  style={styles.appLogoImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.appName}>ALAGA</Text>
              <Text style={styles.headerDot}>•</Text>
              <Text style={styles.timeText}>now</Text>
            </View>

            <TouchableOpacity
              style={styles.closeHit}
              onPress={(e) => {
                if (e && typeof e.stopPropagation === 'function') {
                  e.stopPropagation();
                }
                dismiss();
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={15} color="#A1A1AA" />
            </TouchableOpacity>
          </View>

          {/* Title & Body */}
          <View style={styles.bodyWrap}>
            <Text style={styles.titleText} numberOfLines={1}>
              {notification.title}
            </Text>
            <Text style={styles.messageText} numberOfLines={2}>
              {notification.message}
            </Text>
          </View>

          {/* Subtle Swipe Indicator Bar */}
          <View style={styles.swipeHandle} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 99999,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  bannerCard: {
    width: Math.min(width - 24, 400),
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 16,
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(28, 28, 30, 0.88)',
  },
  contentWrap: {
    paddingTop: 10,
    paddingBottom: 6,
    paddingHorizontal: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  appIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appIconContainer: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    overflow: 'hidden',
    padding: 1.5,
  },
  appLogoImage: {
    width: '100%',
    height: '100%',
  },
  appName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A1A1AA',
    fontFamily: 'PlusJakartaSans_600SemiBold',
    letterSpacing: 0.4,
  },
  headerDot: {
    fontSize: 12,
    color: '#71717A',
    marginHorizontal: 5,
  },
  timeText: {
    fontSize: 12,
    color: '#71717A',
    fontFamily: 'PlusJakartaSans_400Regular',
  },
  closeHit: {
    padding: 2,
  },
  bodyWrap: {
    marginTop: 2,
    marginBottom: 4,
  },
  titleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans_700Bold',
    marginBottom: 2,
    lineHeight: 18,
  },
  messageText: {
    fontSize: 12.8,
    color: '#D4D4D8',
    fontFamily: 'PlusJakartaSans_400Regular',
    lineHeight: 17.5,
  },
  swipeHandle: {
    width: 32,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignSelf: 'center',
    marginTop: 4,
  },
});
