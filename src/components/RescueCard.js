import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import StatusPill from './StatusPill';
import Avatar from './Avatar';
import { URGENCY_LEVELS } from '../data/mockData';

const URGENCY_COLOR = {
  High:   COLORS.danger,
  Medium: COLORS.warning,
  Low:    COLORS.success,
};

export default function RescueCard({ report, onPress, style }) {
  const uColor  = URGENCY_COLOR[report.urgency] || COLORS.success;
  const timeAgo = fmtAgo(report.createdAt);

  return (
    <TouchableOpacity style={[styles.card, style]} onPress={onPress} activeOpacity={0.88}>

      {/* ── Photo strip ───────────────────────────────────── */}
      <View style={styles.photoWrap}>
        {report.photo ? (
          <Image source={{ uri: report.photo }} style={styles.photo} resizeMode="cover" />
        ) : (
          <View style={styles.photoFallback}>
            <Ionicons name="paw-outline" size={28} color={COLORS.primaryLight} />
            <Text style={styles.photoFallbackText}>No photo attached</Text>
          </View>
        )}

        {/* Urgency — bottom-left over photo */}
        <View style={[styles.urgencyChip, { backgroundColor: uColor }]}>
          <View style={styles.urgencyDot} />
          <Text style={styles.urgencyLabel}>{report.urgency}</Text>
        </View>

        {/* Status — top-right over photo */}
        <View style={styles.statusPos}>
          <StatusPill status={report.status} />
        </View>
      </View>

      {/* ── Body ──────────────────────────────────────────── */}
      <View style={styles.body}>

        {/* Reporter row */}
        <View style={styles.topRow}>
          <Avatar name={report.reporterName} size={24} />
          <Text style={styles.reporterName} numberOfLines={1}>{report.reporterName}</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.timeAgo}>{timeAgo}</Text>
          <View style={styles.spacer} />
          <View style={styles.animalChip}>
            <Ionicons name="paw-outline" size={10} color={COLORS.primaryDeep} />
            <Text style={styles.animalChipText}>{report.animalType}</Text>
          </View>
        </View>

        {/* Description */}
        <Text style={styles.desc} numberOfLines={2}>{report.description}</Text>

        {/* Location */}
        <View style={styles.locRow}>
          <Ionicons name="location-outline" size={12} color={COLORS.textMuted} />
          <Text style={styles.locText} numberOfLines={1}>
            {report.location?.address || 'Location not set'}
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          {report.comments?.length > 0 ? (
            <View style={styles.commentRow}>
              <Ionicons name="chatbubble-outline" size={11} color={COLORS.textMuted} />
              <Text style={styles.commentText}>
                {report.comments.length} comment{report.comments.length !== 1 ? 's' : ''}
              </Text>
            </View>
          ) : <View />}
          <View style={styles.viewRow}>
            <Text style={styles.viewLabel}>View details</Text>
            <Ionicons name="chevron-forward" size={12} color={COLORS.primaryDeep} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function fmtAgo(iso) {
  const s = (Date.now() - new Date(iso)) / 1000;
  if (s < 60)    return 'Just now';
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.r16,
    overflow: 'hidden',
    marginBottom: SIZES.md16,
    ...SHADOWS.card,
  },

  // Photo — compact height so cards aren't bloated
  photoWrap: { position: 'relative' },
  photo:     { width: '100%', height: 140 },
  photoFallback: {
    width: '100%', height: 80,
    backgroundColor: COLORS.tagBg,
    flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    gap: SIZES.xs4,
  },
  photoFallbackText: { fontSize: SIZES.xs, color: COLORS.textMuted },

  urgencyChip: {
    position: 'absolute', bottom: SIZES.sm8, left: SIZES.sm8,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: SIZES.sm8, paddingVertical: 3,
    borderRadius: SIZES.r999,
  },
  urgencyDot:   { width: 5, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.85)' },
  urgencyLabel: { fontSize: SIZES.xs, fontWeight: '800', color: '#fff', fontFamily: 'PlusJakartaSans_700Bold' },
  statusPos:    { position: 'absolute', top: SIZES.sm8, right: SIZES.sm8 },

  // Body
  body: {
    paddingHorizontal: SIZES.md16,
    paddingTop: SIZES.sm8 + 2,
    paddingBottom: SIZES.sm8 + 4,
  },

  topRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: SIZES.xs4 + 2, marginBottom: SIZES.xs4 + 2,
  },
  reporterName: {
    fontSize: SIZES.sm, fontWeight: '700',
    color: COLORS.textPrimary, flexShrink: 1,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  dot:    { fontSize: SIZES.xs, color: COLORS.textMuted },
  timeAgo:{ fontSize: SIZES.xs, color: COLORS.textMuted, fontFamily: 'PlusJakartaSans_500Medium' },
  spacer: { flex: 1 },

  animalChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: COLORS.tagBg,
    paddingHorizontal: SIZES.sm8, paddingVertical: 2,
    borderRadius: SIZES.r999,
  },
  animalChipText: { fontSize: SIZES.xs, fontWeight: '700', color: COLORS.primaryDeep, fontFamily: 'PlusJakartaSans_700Bold' },

  desc: {
    fontSize: 13.5,
    color: COLORS.textPrimary,
    lineHeight: 20,
    marginBottom: SIZES.xs4 + 2,
    fontFamily: 'PlusJakartaSans_400Regular',
  },

  locRow: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    marginBottom: SIZES.sm8,
  },
  locText: { fontSize: SIZES.xs, color: COLORS.textSecondary, flex: 1, fontFamily: 'PlusJakartaSans_500Medium' },

  footer: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: SIZES.xs4 + 2,
    borderTopWidth: 1, borderTopColor: COLORS.divider,
  },
  commentRow:  { flexDirection: 'row', alignItems: 'center', gap: 3 },
  commentText: { fontSize: SIZES.xs, color: COLORS.textMuted, fontFamily: 'PlusJakartaSans_500Medium' },
  viewRow:     { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewLabel:   { fontSize: SIZES.sm, fontWeight: '700', color: COLORS.primaryDeep, fontFamily: 'PlusJakartaSans_700Bold' },
});
