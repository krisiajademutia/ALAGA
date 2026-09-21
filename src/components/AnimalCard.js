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
            <Text style={styles.locText} numberOfLines={1}>
              {animal.location ? animal.location.replace(/\s*\(.*?\)/g, '') : 'Pasig City'}
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
              color="#FFFFFF"
            />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Grid card mode (Professional rectangular card architecture)
  gridCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8DEC5',
    flex: 1,
    shadowColor: '#473018',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  gridVisualBox: {
    height: 130,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#F4EDE0',
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
    padding: 8,
    zIndex: 2,
  },
  availableBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#E8DEC5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  availableText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#306B4D',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  heartCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8DEC5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  gridPhotoCountBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    zIndex: 3,
  },
  photoCountBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    zIndex: 3,
  },
  photoCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans_700Bold',
  },

  gridContent: {
    padding: 10,
    backgroundColor: '#FFFFFF',
  },
  petName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#473018',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    marginBottom: 2,
  },
  petBreed: {
    fontSize: 11,
    color: '#8C7D6A',
    fontFamily: 'PlusJakartaSans_500Medium',
    marginBottom: 4,
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  locText: {
    fontSize: 11,
    color: '#685038',
    fontFamily: 'PlusJakartaSans_400Regular',
  },
  actionTagsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  adoptTag: {
    backgroundColor: '#EBF7FA',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#B8E4E5',
  },
  adoptTagText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#2E7A99',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  fosterTag: {
    backgroundColor: '#FEF3DC',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#F3D299',
  },
  fosterTagText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#B45309',
    fontFamily: 'PlusJakartaSans_700Bold',
  },

  // ── Full-width card mode ────────────────────────────────────────────────
  petCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: 20,
    shadowColor: '#2C1810',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  imageBannerWrap: {
    height: 220,
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
    backgroundColor: '#DFF0F5',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  statusPill: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  statusPillAvailable: {
    backgroundColor: '#ECFDF5',
  },
  statusPillFoster: {
    backgroundColor: '#FEF3E2',
  },
  statusPillText: {
    ...FONTS.badge,
    fontSize: 11.5,
    fontWeight: '700',
  },
  statusTextAvailable: {
    color: '#15803D',
  },
  statusTextFoster: {
    color: '#B45309',
  },
  topRightOverlay: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  distancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  distancePillText: {
    ...FONTS.badge,
    color: COLORS.primaryDarkest,
    fontSize: 11.5,
  },
  cardBody: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 18,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.brown,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardMetaText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontFamily: 'PlusJakartaSans_500Medium',
    flexShrink: 1,
  },
  cardDescText: {
    fontSize: 13.5,
    color: COLORS.textPrimary,
    fontFamily: 'PlusJakartaSans_400Regular',
    lineHeight: 20,
    marginBottom: 14,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginBottom: 16,
  },
  tagPill: {
    backgroundColor: '#EBF4EF',
    borderWidth: 1,
    borderColor: '#B8D3C3',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
  },
  tagPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#3A5C47',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    paddingTop: 14,
  },
  ageBadgeText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E7A99',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
    gap: 5,
  },
  actionPillFoster: {
    backgroundColor: '#B45309',
  },
  actionPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  actionPillTextFoster: {
    color: '#FFFFFF',
  },
});
