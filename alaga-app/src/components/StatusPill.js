import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';

const MAP = {
  // Rescue report statuses
  Open:             { bg: '#FCE8E8', text: COLORS.danger },
  Responded:        { bg: '#FEF3DC', text: COLORS.warning },
  Rescued:          { bg: '#D8F0E4', text: COLORS.success },
  // Request statuses
  Pending:          { bg: '#FEF3DC', text: COLORS.warning },
  Approved:         { bg: '#D8F0E4', text: COLORS.success },
  Rejected:         { bg: '#FCE8E8', text: COLORS.danger },
  Verified:         { bg: '#D8F0E4', text: COLORS.success },
  // Animal statuses
  Available:        { bg: COLORS.tagBg,  text: COLORS.primaryDeep },
  'Being Fostered': { bg: '#FEF3DC',     text: '#B45309' },
  Adopted:          { bg: '#D8F0E4',     text: COLORS.success },
  'Under Care':     { bg: COLORS.inputBg, text: COLORS.textSecondary },
  // Legacy (kept for backward compat)
  'For Adoption':   { bg: COLORS.tagBg,  text: COLORS.primaryDeep },
  'For Foster':     { bg: '#EEF0FF',     text: '#5B5BD6' },
  Fostered:         { bg: '#D8F0E4',     text: COLORS.success },
};

export default function StatusPill({ status, style }) {
  const c = MAP[status] || { bg: COLORS.inputBg, text: COLORS.textSecondary };
  return (
    <View style={[styles.pill, { backgroundColor: c.bg }, style]}>
      <Text style={[styles.text, { color: c.text }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: SIZES.sm8 + 2,
    paddingVertical: SIZES.xs4,
    borderRadius: SIZES.r999,
    alignSelf: 'flex-start',
  },
  text: { fontSize: SIZES.xs, fontWeight: '700', letterSpacing: 0.3 },
});
