import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants/theme';

export default function Input({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  multiline,
  numberOfLines,
  error,
  icon,
  style,
  inputStyle,
  editable = true,
  autoCapitalize = 'none',
}) {
  const [showPw, setShowPw] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.wrapper, style]}>
      {label ? (
        <Text style={styles.label}>{label}</Text>
      ) : null}
      <View style={[
        styles.row,
        focused && styles.rowFocused,
        !!error && styles.rowError,
        !editable && styles.rowDisabled,
      ]}>
        {icon ? <View style={styles.iconLeft}>{icon}</View> : null}
        <TextInput
          style={[styles.input, multiline && styles.inputMulti, inputStyle]}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !showPw}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
          autoCapitalize={autoCapitalize}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {secureTextEntry ? (
          <TouchableOpacity style={styles.iconRight} onPress={() => setShowPw((p) => !p)}>
            <Ionicons
              name={showPw ? 'eye-off-outline' : 'eye-outline'}
              size={SIZES.lg}
              color={COLORS.textMuted}
            />
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: SIZES.md16 },
  label: {
    fontSize: SIZES.xs,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: SIZES.xs4 + 2,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: SIZES.r12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: SIZES.md16,
    minHeight: 50,
  },
  rowFocused:  { borderColor: COLORS.primaryDeep },
  rowError:    { borderColor: COLORS.danger },
  rowDisabled: { opacity: 0.55 },
  input: {
    flex: 1,
    paddingVertical: SIZES.sm8 + 3,
    fontSize: SIZES.body,
    color: COLORS.textPrimary,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  inputMulti: {
    minHeight: 88,
    textAlignVertical: 'top',
    paddingTop: SIZES.sm8 + 4,
  },
  iconLeft:  { marginRight: SIZES.sm8 },
  iconRight: { marginLeft: SIZES.sm8, padding: 2 },
  error: {
    fontSize: SIZES.xs,
    color: COLORS.danger,
    marginTop: SIZES.xs4,
    fontWeight: '500',
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
});
