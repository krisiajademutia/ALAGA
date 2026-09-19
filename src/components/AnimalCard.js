import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS, FONTS } from '../constants/theme';

export default function AnimalCard({ animal, onPress, style, horizontal = false }) {
  const [isFav, setIsFav] = useState(false);

  const toggleFavorite = (e) => {
    e.stopPropagation();
    setIsFav(!isFav);
  };

  if (horizontal) {
    const isFoster = animal.fosterNeeded || animal.listingType === 'Foster';
    const bgColors = {
      Cat: '#ABD7E2',
      Dog: '#FBEEAC',
      Rabbit: '#B8E4E5',
    };
    const avatarBg = animal.avatarBg || bgColors[animal.species] || '#B8D3C3';

    return (
      <TouchableOpacity style={[styles.gridCard, style]} onPress={onPress} activeOpacity={0.88}>
        {/* Top visual box */}
        <View style={styles.gridVisualBox}>
          {animal.photo ? (
            <Image source={{ uri: animal.photo }} style={styles.cardCoverPhoto} resizeMode="cover" />
          ) : (
            <View style={[styles.fallbackBox, { backgroundColor: avatarBg }]}>
              <Ionicons name="paw" size={36} color={COLORS.primaryDarkest} />
            </View>
          )}

          {Boolean(animal.photos && animal.photos.length > 1) && (
            <View style={styles.gridPhotoCountBadge}>
              <Ionicons name="images" size={9} color="#fff" style={{ marginRight: 2 }} />
              <Text style={styles.photoCountText}>{animal.photos.length}</Text>
            </View>
          )}

          {/* Top Row: Available Badge & Heart */}
          <View style={styles.topRowOverlay}>
            <View style={styles.availableBadge}>
              <Text style={styles.availableText}>Available</Text>
            </View>
            <TouchableOpacity
              style={styles.heartCircle}
              onPress={toggleFavorite}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons
                name={isFav ? 'heart' : 'heart-outline'}
                size={14}
                color={isFav ? COLORS.danger : COLORS.textMuted}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content Box */}
        <View style={styles.gridContent}>
          <Text style={styles.petName} numberOfLines={1}>
            {animal.name}
          </Text>
          <Text style={styles.petBreed} numberOfLines={1}>
            {animal.species} · {animal.breed} · {animal.ageTag || animal.age}
          </Text>
          <View style={styles.locRow}>
            <Ionicons name="location-sharp" size={12} color={COLORS.danger} style={{ marginRight: 2 }} />
            <Text style={styles.locText} numberOfLines={1}>
              {animal.location || 'Pasig City (1.8 km)'}
            </Text>
          </View>

          {/* Action/type tag row */}
          <View style={styles.actionTagsRow}>
            {animal.listingType === 'Both' ? (
              <>
                <View style={styles.adoptTag}>
                  <Text style={styles.adoptTagText}>Adopt</Text>
                </View>
                <View style={styles.fosterTag}>
                  <Text style={styles.fosterTagText}>Foster</Text>
                </View>
              </>
            ) : isFoster ? (
              <View style={styles.fosterTag}>
                <Text style={styles.fosterTagText}>
                  Foster{animal.fosterDuration ? ` · ${animal.fosterDuration}` : ''}
                </Text>
              </View>
            ) : (
              <View style={styles.adoptTag}>
                <Text style={styles.adoptTagText}>Adopt</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Full-width card matching HomeScreen design
  const isFoster = animal.fosterNeeded || animal.listingType === 'Foster';
  const badges = animal.personalityBadges || [animal.gender, animal.ageTag || animal.age];

  return (
    <TouchableOpacity style={[styles.petCard, style]} onPress={onPress} activeOpacity={0.9}>
      {/* Visual Image Banner with Floating Badges */}
      <View style={styles.imageBannerWrap}>
        {animal.photo ? (
          <Image
            source={{ uri: animal.photo }}
            style={styles.cardImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imageFallbackWrap}>
            <Ionicons name="paw" size={46} color={COLORS.primary} />
          </View>
        )}

        {Boolean(animal.photos && animal.photos.length > 1) && (
          <View style={styles.photoCountBadge}>
            <Ionicons name="images" size={10} color="#fff" style={{ marginRight: 3 }} />
            <Text style={styles.photoCountText}>{animal.photos.length}</Text>
          </View>
        )}

        {/* Top-Left Status Badge */}
        <View style={[styles.statusPill, isFoster ? styles.statusPillFoster : styles.statusPillAvailable]}>
          <Ionicons
            name={isFoster ? 'heart' : 'paw'}
            size={12}
            color={isFoster ? '#92400E' : '#15803D'}
            style={{ marginRight: 3 }}
          />
          <Text style={[styles.statusPillText, isFoster ? styles.statusTextFoster : styles.statusTextAvailable]}>
            {isFoster ? 'Foster Needed' : 'Available'}
          </Text>
        </View>

        {/* Top-Right Distance & Favorite */}
        <View style={styles.topRightOverlay}>
          <View style={styles.distancePill}>
            <Ionicons name="location-sharp" size={11} color={COLORS.primaryDarkest} style={{ marginRight: 2 }} />
            <Text style={styles.distancePillText}>{animal.distance || '1.2 km'}</Text>
          </View>
          <TouchableOpacity
            style={styles.heartCircle}
            onPress={toggleFavorite}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={isFav ? 'heart' : 'heart-outline'}
              size={16}
              color={isFav ? COLORS.danger : '#6B7280'}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Card Body */}
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {animal.name}
        </Text>
        <View style={styles.cardMetaRow}>
          <Ionicons name="location-outline" size={13} color={COLORS.textMuted} style={{ marginRight: 4 }} />
          <Text style={styles.cardMetaText} numberOfLines={1}>
            {animal.location || 'Pasig City'} · {animal.breed} · {animal.gender}
          </Text>
        </View>

        {/* Description preview */}
        <Text style={styles.cardDescText} numberOfLines={2}>
          {animal.description}
        </Text>

        {/* Tags Row */}
        <View style={styles.tagsContainer}>
          {badges.map((b) => (
            <View key={b} style={styles.tagPill}>
              <Text style={styles.tagPillText}>{b}</Text>
            </View>
          ))}
        </View>

        {/* Footer CTA */}
        <View style={styles.cardFooter}>
          <Text style={styles.ageBadgeText}>
            Age: {animal.ageTag || animal.age}
          </Text>
          <View style={[styles.actionPill, isFoster && styles.actionPillFoster]}>
            <Text style={[styles.actionPillText, isFoster && styles.actionPillTextFoster]}>
              {isFoster ? 'Apply to Foster' : `Adopt ${animal.name}`}
            </Text>
            <Ionicons
              name="arrow-forward"
              size={13}
              color={isFoster ? COLORS.brown : COLORS.primaryDarkest}
              style={{ marginLeft: 4 }}
            />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Grid card mode
  gridCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.r20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8F2F6',
    flex: 1,
    ...SHADOWS.card,
  },
  gridVisualBox: {
    height: 125,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#E8F2F6',
  },
  cardCoverPhoto: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  fallbackBox: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topRowOverlay: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    zIndex: 2,
  },
  availableBadge: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    ...SHADOWS.sm,
  },
  availableText: {
    ...FONTS.badge,
    color: COLORS.success,
  },
  heartCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  gridPhotoCountBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 21, 16, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    zIndex: 3,
  },
  photoCountBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 21, 16, 0.75)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    zIndex: 3,
  },
  photoCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },

  gridContent: {
    padding: 12,
    backgroundColor: COLORS.surface,
  },
  petName: {
    ...FONTS.subheading,
    fontSize: 15,
    color: COLORS.brown,
    marginBottom: 2,
  },
  petBreed: {
    ...FONTS.caption,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locText: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
  },
  actionTagsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  adoptTag: {
    backgroundColor: '#92CDE5',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  adoptTagText: {
    ...FONTS.badge,
    fontSize: 10,
    color: '#473018',
  },
  fosterTag: {
    backgroundColor: '#FBEEAC',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  fosterTagText: {
    ...FONTS.badge,
    fontSize: 10,
    color: '#473018',
  },

  // Full-width card mode
  petCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: 16,
    ...SHADOWS.card,
  },
  imageBannerWrap: {
    height: 180,
    width: '100%',
    position: 'relative',
    backgroundColor: '#E8F2F6',
    overflow: 'hidden',
  },
  imageFallbackWrap: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F2F6',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  statusPill: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusPillAvailable: {
    backgroundColor: '#F0FDF4',
  },
  statusPillFoster: {
    backgroundColor: '#FEF3E2',
  },
  statusPillText: {
    ...FONTS.badge,
  },
  statusTextAvailable: {
    color: '#15803D',
  },
  statusTextFoster: {
    color: '#B45309',
  },
  topRightOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  distancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  distancePillText: {
    ...FONTS.badge,
    color: COLORS.primaryDarkest,
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
  },
  cardTitle: {
    ...FONTS.titleMd,
    color: COLORS.brown,
    marginBottom: 3,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardMetaText: {
    ...FONTS.meta,
    color: COLORS.textSecondary,
  },
  cardDescText: {
    ...FONTS.bodyRegular,
    color: COLORS.textPrimary,
    lineHeight: 19,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  tagPill: {
    backgroundColor: '#EBF4EF',
    borderWidth: 1,
    borderColor: '#B8D3C3',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagPillText: {
    ...FONTS.badge,
    fontSize: 10,
    color: '#473018',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    paddingTop: 12,
  },
  ageBadgeText: {
    ...FONTS.meta,
    color: COLORS.textSecondary,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF7F7',
    borderWidth: 1.2,
    borderColor: '#B8E4E5',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  actionPillFoster: {
    backgroundColor: COLORS.accent,
    borderColor: '#E8DEC5',
  },
  actionPillText: {
    ...FONTS.badge,
    color: '#473018',
  },
  actionPillTextFoster: {
    color: '#473018',
  },
});
