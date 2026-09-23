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
          <Avatar name={report.reporterName} uri={report.reporterAvatar} userId={report.reporterId} size={24} />
          <View style={styles.nameWrap}>
            <Text style={styles.reporterName} numberOfLines={1}>{report.reporterName}</Text>
          </View>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.timeAgo}>{timeAgo}</Text>
          <View style={styles.spacer} />
          <Text style={styles.animalText}>{report.animalType}</Text>
        </View>

        {/* Description */}
        <Text style={styles.desc} numberOfLines={2}>{report.description}</Text>

        {/* Location */}
        <View style={styles.locRow}>
          <Text style={styles.locText} numberOfLines={1}>
            {report.location?.address || 'Location not set'}
          </Text>
        </View>

        {/* Ongoing Responder or Rescuer Tag */}
        {report.status === 'Responded' && Boolean(report.responderName) && (
          <View style={styles.responderRow}>
            <View style={styles.ongoingDot} />
            <Text style={styles.responderLabel}>Ongoing Responder: </Text>
            <Text style={styles.responderName} numberOfLines={1}>
              {report.responderName}
            </Text>
          </View>
        )}
        {report.status === 'Rescued' && Boolean(report.responderName) && (
          <View style={[styles.responderRow, styles.rescuedRow]}>
            <Ionicons name="checkmark-circle" size={13} color={COLORS.success} style={{ marginRight: 4 }} />
            <Text style={[styles.responderLabel, { color: COLORS.success }]}>Rescued by: </Text>
            <Text style={[styles.responderName, { color: COLORS.textDark }]} numberOfLines={1}>
              {report.responderName}
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          {report.comments?.length > 0 ? (
            <Text style={styles.commentText}>
              {report.comments.length} comment{report.comments.length !== 1 ? 's' : ''}
            </Text>
          ) : <View />}
          <Text style={styles.viewLabel}>View details</Text>
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
    borderRadius: SIZES.r12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginBottom: SIZES.md16,
    // No shadow, flat clean look
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
  nameWrap: { flexShrink: 1 },
  reporterName: {
    fontSize: SIZES.sm, fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  dot:    { fontSize: SIZES.xs, color: COLORS.textMuted },
  timeAgo:{ fontSize: SIZES.xs, color: COLORS.textMuted, fontFamily: 'PlusJakartaSans_500Medium' },
  spacer: { flex: 1 },

  animalText: { 
    fontSize: SIZES.xs, fontWeight: '700', color: COLORS.primaryDeep, fontFamily: 'PlusJakartaSans_700Bold' 
  },

  desc: {
    fontSize: 13.5,
    color: COLORS.textPrimary,
    lineHeight: 20,
    marginBottom: SIZES.xs4 + 2,
    fontFamily: 'PlusJakartaSans_400Regular',
  },

  locRow: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: SIZES.sm8,
  },
  locText: { fontSize: SIZES.xs, color: COLORS.textSecondary, flex: 1, fontFamily: 'PlusJakartaSans_500Medium' },

  footer: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: SIZES.sm8,
    marginTop: SIZES.sm8,
    borderTopWidth: 1, borderTopColor: COLORS.borderLight,
  },
  commentText: { fontSize: SIZES.xs, color: COLORS.textMuted, fontFamily: 'PlusJakartaSans_500Medium' },
  viewLabel:   { fontSize: SIZES.sm, fontWeight: '700', color: COLORS.primaryDeep, fontFamily: 'PlusJakartaSans_700Bold' },

  responderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: SIZES.xs4,
  },
  rescuedRow: {
    backgroundColor: '#F0FDF4',
  },
  ongoingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0284C7',
    marginRight: 6,
  },
  responderLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  responderName: {
    fontSize: 11,
    color: '#1E293B',
    fontWeight: '600',
    fontFamily: 'PlusJakartaSans_600SemiBold',
    flex: 1,
  },
});
