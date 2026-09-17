import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

const VARIANT = {
  primary:   { bg: COLORS.primaryDeep,  text: '#fff',             border: null },
  secondary: { bg: COLORS.secondaryDark, text: '#fff',            border: null },
  outline:   { bg: 'transparent',        text: COLORS.primaryDeep, border: COLORS.primaryDeep },
  ghost:     { bg: 'transparent',        text: COLORS.primaryDeep, border: null },
  danger:    { bg: COLORS.danger,        text: '#fff',             border: null },
  warning:   { bg: COLORS.warning,       text: '#fff',             border: null },
};

const SIZE_STYLE = {
  sm:  { paddingVertical: SIZES.sm8,    paddingHorizontal: SIZES.md16, fontSize: SIZES.sm },
  md:  { paddingVertical: SIZES.sm8 + 4, paddingHorizontal: SIZES.lg24, fontSize: SIZES.body },
  lg:  { paddingVertical: SIZES.md16,   paddingHorizontal: SIZES.xl32, fontSize: SIZES.md },
  // legacy aliases
  small:  { paddingVertical: SIZES.sm8,    paddingHorizontal: SIZES.md16, fontSize: SIZES.sm },
  medium: { paddingVertical: SIZES.sm8 + 4, paddingHorizontal: SIZES.lg24, fontSize: SIZES.body },
  large:  { paddingVertical: SIZES.md16,   paddingHorizontal: SIZES.xl32, fontSize: SIZES.md },
};

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
  fullWidth = false,
}) {
  const v = VARIANT[variant] || VARIANT.primary;
  const s = SIZE_STYLE[size] || SIZE_STYLE.medium;
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        {
          backgroundColor: v.bg,
          paddingVertical: s.paddingVertical,
          paddingHorizontal: s.paddingHorizontal,
          borderWidth: v.border ? 1.5 : 0,
          borderColor: v.border || 'transparent',
          alignSelf: fullWidth ? 'stretch' : 'auto',
          opacity: isDisabled ? 0.5 : 1,
        },
        variant === 'primary' && SHADOWS.button,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.78}
    >
      {loading ? (
        <ActivityIndicator color={v.text} size="small" />
      ) : (
        <View style={styles.inner}>
          {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
          <Text style={[styles.label, { color: v.text, fontSize: s.fontSize }, textStyle]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: SIZES.r999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: { marginRight: SIZES.xs4 + 2 },
  label: { fontWeight: '700', letterSpacing: 0.2, fontFamily: 'PlusJakartaSans_700Bold' },
});
