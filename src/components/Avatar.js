import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';

export default function Avatar({ name, uri, size = 44, style }) {
  const initials = name
    ? name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const r = size / 2;
  const base = { width: size, height: size, borderRadius: r };

  if (uri) {
    return <Image source={{ uri }} style={[styles.img, base, style]} />;
  }

  return (
    <View style={[styles.placeholder, base, style]}>
      <Text style={[styles.initials, { fontSize: size * 0.35 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  img:         { resizeMode: 'cover' },
  placeholder: { backgroundColor: COLORS.tagBg, alignItems: 'center', justifyContent: 'center' },
  initials:    { color: COLORS.primaryDeep, fontWeight: '800' },
});
