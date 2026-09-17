import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SHADOWS } from '../constants/theme';

/**
 * Standardized Header for all screens across ALAGA.
 * Ensures consistent height, padding, typography (#473018), and back button design.
 */
export default function Header({
  title,
  subtitle,
  onBack,
  showBack = true,
  leftComponent,
  centerComponent,
  rightComponent,
  rightIcon,
  onRightPress,
  style,
  backgroundColor = COLORS.background,
  titleColor = COLORS.brown,
  borderBottom = true,
}) {
  const insets = useSafeAreaInsets();
  // Standard mobile safe top placement across iOS and Android
  const paddingTop = Platform.OS === 'ios' ? Math.max(insets.top, 16) + 4 : (insets.top > 24 ? insets.top + 6 : 14);

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop,
          backgroundColor,
          borderBottomColor: borderBottom ? COLORS.borderLight : 'transparent',
          borderBottomWidth: borderBottom ? 1 : 0,
        },
        style,
      ]}
    >
      <View style={styles.contentRow}>
        {/* Left Action / Back Button */}
        <View style={styles.sideCol}>
          {leftComponent ? (
            leftComponent
          ) : showBack ? (
            <TouchableOpacity
              onPress={onBack}
              style={styles.backBtn}
              activeOpacity={0.78}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={20} color={COLORS.brown} />
            </TouchableOpacity>
          ) : (
            <View style={styles.emptySpacer} />
          )}
        </View>

        {/* Centered Title & Optional Subtitle */}
        <View style={styles.titleCol}>
          {centerComponent ? (
            centerComponent
          ) : (
            <>
              {title ? (
                <Text style={[styles.title, { color: titleColor }]} numberOfLines={1}>
                  {title}
                </Text>
              ) : null}
              {subtitle ? (
                <Text style={styles.subtitle} numberOfLines={1}>
                  {subtitle}
                </Text>
              ) : null}
            </>
          )}
        </View>

        {/* Right Action or Spacer */}
        <View style={[styles.sideCol, styles.rightCol]}>
          {rightComponent ? (
            rightComponent
          ) : rightIcon ? (
            <TouchableOpacity
              onPress={onRightPress}
              style={styles.actionBtn}
              activeOpacity={0.78}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name={rightIcon} size={20} color={COLORS.brown} />
            </TouchableOpacity>
          ) : (
            <View style={styles.emptySpacer} />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingBottom: 10,
    zIndex: 10,
  },
  contentRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  sideCol: {
    minWidth: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  rightCol: {
    alignItems: 'flex-end',
  },
  titleCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  title: {
    ...FONTS.subheading,
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.brown,
    textAlign: 'center',
  },
  subtitle: {
    ...FONTS.caption,
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
    textAlign: 'center',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  emptySpacer: {
    width: 38,
    height: 38,
  },
});
