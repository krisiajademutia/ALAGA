import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import StatusPill from './StatusPill';
import Badge from './Badge';

export default function AnimalCard({ animal, onPress, style, horizontal = false }) {
  if (horizontal) {
    return (
      <TouchableOpacity style={[styles.grid, style]} onPress={onPress} activeOpacity={0.88}>
        <View style={styles.gridPhotoWrap}>
          {animal.photo ? (
            <Image source={{ uri: animal.photo }} style={styles.gridPhoto} resizeMode="cover" />
          ) : (
            <View style={styles.gridPhotoFallback}>
              <Ionicons name="paw-outline" size={24} color={COLORS.primaryLight} />
            </View>
          )}
          <View style={styles.gridStatus}>
            <StatusPill status={animal.status} />
          </View>
          {animal.vaccinated ? (
            <View style={styles.vacDot}>
              <Ionicons name="shield-checkmark" size={9} color="#fff" />
            </View>
          ) : null}
        </View>
        <View style={styles.gridBody}>
          <Text style={styles.gridName} numberOfLines={1}>{animal.name}</Text>
          <Text style={styles.gridBreed} numberOfLines={1}>{animal.breed}</Text>
          <View style={styles.gridMeta}>
            <Ionicons name="paw-outline" size={10} color={COLORS.textMuted} />
            <Text style={styles.gridMetaText}>{animal.species} · {animal.gender}</Text>
          </View>
          {/* Foster duration badge */}
          {animal.fosterDuration && (animal.listingType === 'Foster' || animal.listingType === 'Both') ? (
            <View style={styles.fosterBadge}>
              <Ionicons name="time-outline" size={10} color="#B45309" />
              <Text style={styles.fosterBadgeText}>{animal.fosterDuration}</Text>
            </View>
          ) : animal.tags?.length > 0 ? (
            <Badge label={animal.tags[0]} style={{ marginTop: SIZES.xs4 + 2 }} />
          ) : null}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={[styles.card, style]} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.photoWrap}>
        {animal.photo ? (
          <Image source={{ uri: animal.photo }} style={styles.photo} resizeMode="cover" />
        ) : (
          <View style={styles.photoFallback}>
            <Ionicons name="paw-outline" size={36} color={COLORS.primaryLight} />
          </View>
        )}
        <View style={styles.statusPos}>
          <StatusPill status={animal.status} />
        </View>
        {animal.vaccinated ? (
          <View style={styles.vacBadge}>
            <Ionicons name="shield-checkmark" size={11} color="#fff" />
            <Text style={styles.vacText}>Vaccinated</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <View style={styles.nameRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{animal.name}</Text>
            <Text style={styles.sub} numberOfLines={1}>
              {animal.species} · {animal.breed} · {animal.gender}
            </Text>
          </View>
          <View style={styles.agePill}>
            <Text style={styles.ageText}>{animal.age}</Text>
          </View>
        </View>

        {animal.tags?.length > 0 ? (
          <View style={styles.tags}>
            {animal.tags.slice(0, 3).map((t) => <Badge key={t} label={t} />)}
          </View>
        ) : null}

        <View style={styles.footer}>
          <View style={styles.advocateRow}>
            <Ionicons name="person-circle-outline" size={13} color={COLORS.textMuted} />
            <Text style={styles.advocateName} numberOfLines={1}>{animal.advocateName}</Text>
          </View>
          <View style={styles.viewRow}>
            <Text style={styles.viewLabel}>View</Text>
            <Ionicons name="chevron-forward" size={12} color={COLORS.primaryDeep} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Full-width
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.r16,
    overflow: 'hidden',
    marginBottom: SIZES.md16,
    ...SHADOWS.card,
  },
  photoWrap:    { position: 'relative' },
  photo:        { width: '100%', height: 200 },
  photoFallback:{
    width: '100%', height: 160,
    backgroundColor: COLORS.tagBg,
    alignItems: 'center', justifyContent: 'center',
  },
  statusPos:    { position: 'absolute', top: SIZES.sm8, right: SIZES.sm8 },
  vacBadge: {
    position: 'absolute', bottom: SIZES.sm8, left: SIZES.sm8,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.secondaryDark,
    paddingHorizontal: SIZES.sm8, paddingVertical: 3,
    borderRadius: SIZES.r999,
  },
  vacText: { fontSize: SIZES.xs, color: '#fff', fontWeight: '700' },

  body:    { padding: SIZES.md16 },
  nameRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SIZES.sm8 },
  name:    { fontSize: SIZES.lg, fontWeight: '800', color: COLORS.textPrimary },
  sub:     { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  agePill: {
    backgroundColor: COLORS.tagBg,
    paddingHorizontal: SIZES.sm8 + 2, paddingVertical: 4,
    borderRadius: SIZES.r999, marginLeft: SIZES.sm8,
  },
  ageText: { fontSize: SIZES.xs, fontWeight: '700', color: COLORS.primaryDeep },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.xs4 + 2, marginBottom: SIZES.sm8 + 2 },
  footer: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: SIZES.sm8 + 2, borderTopWidth: 1, borderTopColor: COLORS.divider,
  },
  advocateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  advocateName:{ fontSize: SIZES.xs, color: COLORS.textMuted },
  viewRow:     { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewLabel:   { fontSize: SIZES.sm, fontWeight: '700', color: COLORS.primaryDeep },

  // Grid / horizontal
  grid: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.r16,
    overflow: 'hidden',
    flex: 1,
    ...SHADOWS.card,
  },
  gridPhotoWrap: { position: 'relative' },
  gridPhoto:     { width: '100%', height: 120 },
  gridPhotoFallback: {
    width: '100%', height: 120,
    backgroundColor: COLORS.tagBg,
    alignItems: 'center', justifyContent: 'center',
  },
  gridStatus: { position: 'absolute', top: SIZES.xs4 + 2, right: SIZES.xs4 + 2 },
  vacDot: {
    position: 'absolute', bottom: 5, left: 5,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: COLORS.secondaryDark,
    alignItems: 'center', justifyContent: 'center',
  },
  gridBody:     { padding: SIZES.sm8 + 2 },
  gridName:     { fontSize: SIZES.body, fontWeight: '800', color: COLORS.textPrimary },
  gridBreed:    { fontSize: SIZES.xs, color: COLORS.textSecondary, marginTop: 1 },
  gridMeta:     { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: SIZES.xs4 },
  fosterBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: SIZES.xs4 + 2,
    backgroundColor: '#FEF3DC',
    paddingHorizontal: SIZES.xs4 + 2, paddingVertical: 2,
    borderRadius: SIZES.r999,
    alignSelf: 'flex-start',
  },
  fosterBadgeText: { fontSize: SIZES.xs - 1, color: '#B45309', fontWeight: '700' },
});
