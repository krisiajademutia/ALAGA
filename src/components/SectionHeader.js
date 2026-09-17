import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';

export default function SectionHeader({ title, actionLabel, onAction, style }) {
  return (
    <View style={[styles.row, style]}>
      <Text style={styles.title}>{title}</Text>
      {actionLabel ? (
        <TouchableOpacity onPress={onAction} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.action}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: SIZES.md,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  action: {
    fontSize: SIZES.sm,
    fontWeight: '700',
    color: COLORS.primaryDeep,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
});
