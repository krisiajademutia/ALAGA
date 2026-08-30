import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';

export default function Badge({ label, color, bg, style }) {
  return (
    <View style={[styles.wrap, { backgroundColor: bg || COLORS.tagBg }, style]}>
      <Text style={[styles.text, { color: color || COLORS.tagText }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: SIZES.sm8 + 2,
    paddingVertical: 3,
    borderRadius: SIZES.r999,
    alignSelf: 'flex-start',
  },
  text: { fontSize: SIZES.xs, fontWeight: '700', letterSpacing: 0.2 },
});
