import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useApp } from '../../context/AppContext';
import { COLORS, SIZES, SHADOWS, FONTS } from '../../constants/theme';
import Avatar from '../../components/Avatar';
import EmptyState from '../../components/EmptyState';
import { getDistanceInKm } from '../../services/notificationService';

const CATEGORIES = [
  { id: 'all', label: 'All Alerts', icon: 'paw' },
  { id: 'cats', label: 'Cats', icon: 'paw-outline' },
  { id: 'dogs', label: 'Dogs', icon: 'paw-outline' },
  { id: 'birds', label: 'Other Animals', icon: 'heart-outline' },
];


export default function AdvocateHomeScreen({ navigation }) {
  const { currentUser, rescueReports, getUnreadCount } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [favorites, setFavorites] = useState({});
  const [userLocation, setUserLocation] = useState(null);

  const unreadNotifs = getUnreadCount();
  const insets = useSafeAreaInsets();
  const safeTopPadding = Platform.OS === 'ios' ? Math.max(insets.top, 16) + 4 : (insets.top > 24 ? insets.top + 6 : 14);

  // Initialize or update user location coordinates
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const uLat = currentUser?.latitude || currentUser?.locationCoordinates?.latitude;
      const uLng = currentUser?.longitude || currentUser?.locationCoordinates?.longitude;
      if (uLat && uLng) {
        if (isMounted) setUserLocation({ latitude: Number(uLat), longitude: Number(uLng) });
        return;
      }
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          if (isMounted && pos?.coords) {
            setUserLocation({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            });
          }
        }
      } catch (err) {
        // Fallback silently if device location unavailable
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  const toggleFavorite = (id) => {
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const uLat = userLocation?.latitude || currentUser?.latitude || currentUser?.locationCoordinates?.latitude;
  const uLng = userLocation?.longitude || currentUser?.longitude || currentUser?.locationCoordinates?.longitude;

  const filteredReports = rescueReports.filter((r) => {
    if (activeCategory === 'cats' && r.animalType !== 'Cat') return false;
    if (activeCategory === 'dogs' && r.animalType !== 'Dog') return false;
    if (activeCategory === 'birds' && (r.animalType === 'Cat' || r.animalType === 'Dog')) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.title?.toLowerCase().includes(q) ||
        r.animalType.toLowerCase().includes(q) ||
        r.location?.address?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── Top Header with ALAGA Brand ───────────────────── */}
        <View style={[styles.header, { paddingTop: safeTopPadding }]}>
          <View style={styles.brandContainer}>
            <Image
              source={require('../../../assets/alaga-logo.png')}
              style={styles.headerLogo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.notifBtn}
              onPress={() => navigation.navigate('Notifications')}
              activeOpacity={0.8}
            >
              <Ionicons name="notifications-outline" size={22} color={COLORS.brown} />
              {unreadNotifs > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>
                    {unreadNotifs > 99 ? '99+' : unreadNotifs}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('Profile')}
              style={styles.avatarWrap}
            >
              <Avatar name={currentUser?.name || 'Elena Ramos'} uri={currentUser?.avatar} userId={currentUser?.id} size={42} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Search Bar ────────────────────────────────────── */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search breed, location, or shelter..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {Boolean(searchQuery.trim()) && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{ marginRight: 6 }}
            >
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => navigation.navigate('RescueAlerts')}
            activeOpacity={0.7}
          >
            <Ionicons name="options-outline" size={20} color={COLORS.brown} />
          </TouchableOpacity>
        </View>

        {/* ── Save the Animals Banner ──────────────────────── */}
        <View style={styles.banner}>
          <View style={styles.bannerDecor1} />
          <View style={styles.bannerDecor2} />

          <View style={styles.bannerLeft}>
            <View style={styles.tagWrap}>
              <Text style={styles.tagText}>ALAGA NETWORK</Text>
            </View>
            <Text style={styles.bannerTitle}>Save the animals!</Text>
            <Text style={styles.bannerSub}>
              Every stray deserves safety and love. Adopt, foster, or volunteer today.
            </Text>
            <TouchableOpacity
              style={styles.helpBtn}
              onPress={() => navigation.navigate('RescueAlerts')}
              activeOpacity={0.88}
            >
              <Text style={styles.helpBtnText}>Help Now  →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bannerRight}>
            <View style={styles.pawCircle}>
              <Ionicons name="paw" size={32} color={COLORS.brown} />
            </View>
          </View>
        </View>

        {/* ── Category Pills ────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catScroll}
        >
          {CATEGORIES.map((cat) => {
            const active = activeCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.catPill, active ? styles.catPillActive : styles.catPillInactive]}
                onPress={() => setActiveCategory(cat.id)}
                activeOpacity={0.8}
              >
                {cat.icon && (
                  <Ionicons
                    name={cat.icon}
                    size={16}
                    color={active ? '#206B82' : '#5C4E3A'}
                    style={{ marginRight: 6 }}
                  />
                )}
                <Text
                  style={[
                    styles.catPillText,
                    active ? styles.catPillTextActive : styles.catPillTextInactive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Rescue Alerts Header ──────────────────────────── */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Rescue Alerts</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{filteredReports.length}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('RescueAlerts')} activeOpacity={0.7}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {/* Rescue Alerts Feed */}
        {filteredReports.length === 0 ? (
          <View style={styles.emptyContainer}>
            <EmptyState
              icon="search-outline"
              title="No rescue alerts found"
              subtitle={
                searchQuery.trim()
                  ? `No alerts match "${searchQuery.trim()}". Try another keyword or reset filters.`
                  : activeCategory !== 'all'
                    ? 'No rescue alerts found for this animal category.'
                    : 'No rescue alerts reported yet. Check back soon.'
              }
            />
            {(Boolean(searchQuery.trim()) || activeCategory !== 'all') && (
              <TouchableOpacity
                style={styles.clearFilterBtn}
                onPress={() => {
                  setSearchQuery('');
                  setActiveCategory('all');
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.clearFilterText}>Reset Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.cardsFeed}>
            {filteredReports.map((r) => {
              const isFav = Boolean(favorites[r.id]);
              const isUrgent = r.urgency === 'High' || r.urgency === 'Critical';
              const petName = r.title || `${r.animalType} · ${r.condition || 'Rescue'}`;
              const tags = r.tags || [r.animalType || 'Rescue', r.condition || 'Alert'];

              const rLat = r.location?.latitude;
              const rLng = r.location?.longitude;
              let displayDistance = r.distance;
              if (!displayDistance && uLat && uLng && rLat && rLng) {
                const km = getDistanceInKm(uLat, uLng, rLat, rLng);
                if (km !== null) {
                  displayDistance = km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)} km`;
                }
              }

              return (
                <TouchableOpacity
                  key={r.id}
                  style={styles.alertCard}
                  onPress={() => navigation.navigate('RescueAlertDetail', { reportId: r.id })}
                  activeOpacity={0.9}
                >
                  {/* Visual Banner Container */}
                  <View style={styles.imageBannerWrap}>
                    {r.photo ? (
                      <Image
                        source={{ uri: r.photo }}
                        style={styles.cardImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.imageFallbackWrap}>
                        <Ionicons name="paw" size={46} color="#92CDE5" />
                      </View>
                    )}

                    {/* Top-Left Floating Urgency Pill */}
                    <View style={[styles.urgencyPill, isUrgent ? styles.urgencyHigh : styles.urgencyStandard]}>
                      <Ionicons
                        name={isUrgent ? 'alert-circle' : 'shield-checkmark'}
                        size={12}
                        color={isUrgent ? '#B91C1C' : '#15803D'}
                        style={{ marginRight: 3 }}
                      />
                      <Text style={[styles.urgencyText, isUrgent ? styles.urgencyTextHigh : styles.urgencyTextStandard]}>
                        {r.urgency || (isUrgent ? 'Urgent' : 'Standard')}
                      </Text>
                    </View>

                    {/* Top-Right Favorite & Optional Distance */}
                    <View style={styles.topRightOverlay}>
                      {Boolean(displayDistance) && (
                        <View style={styles.distancePill}>
                          <Ionicons name="location-sharp" size={11} color="#206B82" style={{ marginRight: 2 }} />
                          <Text style={styles.distancePillText}>{displayDistance}</Text>
                        </View>
                      )}
                      <TouchableOpacity
                        style={styles.heartCircle}
                        onPress={() => toggleFavorite(r.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons
                          name={isFav ? 'heart' : 'heart-outline'}
                          size={16}
                          color={isFav ? '#D94F4F' : '#6B7280'}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Card Body */}
                  <View style={styles.cardBody}>
                    <View style={styles.titleRow}>
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {petName}
                      </Text>
                    </View>

                    {/* Location */}
                    <View style={styles.cardMetaRow}>
                      <Ionicons name="location-outline" size={13} color="#8C7D6A" style={{ marginRight: 4 }} />
                      <Text style={styles.cardMetaText} numberOfLines={1}>
                        {r.location?.address || 'Reported Location'}
                      </Text>
                    </View>

                    {/* Description preview */}
                    <Text style={styles.cardDescText} numberOfLines={2}>
                      {r.description}
                    </Text>

                    {/* Tags Row */}
                    <View style={styles.tagsContainer}>
                      {tags.map((t) => {
                        const isWarn = t === 'Injured' || t === 'Critical' || t === 'Urgent';
                        return (
                          <View
                            key={t}
                            style={[styles.tagPill, isWarn && styles.tagPillWarn]}
                          >
                            <Text style={[styles.tagPillText, isWarn && styles.tagPillTextWarn]}>
                              {t}
                            </Text>
                          </View>
                        );
                      })}
                    </View>

                    {/* Card Footer */}
                    <View style={styles.cardFooter}>
                      <Text style={styles.cardDateText}>
                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
                      </Text>
                      <View style={styles.actionPill}>
                        <Text style={styles.actionPillText}>View Details</Text>
                        <Ionicons name="arrow-forward" size={13} color="#206B82" style={{ marginLeft: 4 }} />
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  scroll: {
    paddingBottom: 90,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogo: {
    width: 120,
    height: 40,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.divider,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E8622A',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  notifBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    lineHeight: 12,
  },
  avatarWrap: {
    ...SHADOWS.sm,
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.r24 + 1,
    marginHorizontal: 20,
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    ...FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.brown,
  },
  filterBtn: {
    padding: 4,
  },

  banner: {
    backgroundColor: COLORS.accent,
    marginHorizontal: 20,
    borderRadius: SIZES.r24,
    padding: 20,
    flexDirection: 'row',
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 18,
    ...SHADOWS.card,
  },
  bannerDecor1: {
    position: 'absolute',
    right: -10,
    top: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: COLORS.secondary,
    opacity: 0.5,
  },
  bannerDecor2: {
    position: 'absolute',
    right: 40,
    bottom: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.secondary,
    opacity: 0.4,
  },
  bannerLeft: {
    flex: 1,
    zIndex: 2,
  },
  tagWrap: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: SIZES.r12,
    marginBottom: 8,
  },
  tagText: {
    ...FONTS.badge,
    fontSize: 9,
    color: COLORS.brown,
    letterSpacing: 0.5,
  },
  bannerTitle: {
    ...FONTS.titleXl,
    fontSize: 18,
    color: COLORS.brown,
    marginBottom: 4,
  },
  bannerSub: {
    ...FONTS.bodyRegular,
    fontSize: 12.5,
    color: COLORS.textSecondary,
    lineHeight: 17,
    marginBottom: 14,
    paddingRight: 10,
  },
  helpBtn: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.brown,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: SIZES.r20,
  },
  helpBtnText: {
    ...FONTS.button,
    fontSize: 12,
    color: COLORS.surface,
  },
  bannerRight: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 8,
    zIndex: 2,
  },
  pawCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },

  catScroll: {
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: SIZES.r20,
    borderWidth: 1,
  },
  catPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  catPillInactive: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
  },
  catPillText: {
    ...FONTS.subheading,
    fontSize: 13,
  },
  catPillTextActive: {
    color: COLORS.surface,
  },
  catPillTextInactive: {
    color: COLORS.brown,
  },


  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    ...FONTS.titleXl,
    fontSize: 20,
    color: COLORS.brown,
  },
  countBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: SIZES.r12,
  },
  countBadgeText: {
    ...FONTS.badge,
    fontSize: 12,
    color: COLORS.primaryDarkest,
  },
  seeAllText: {
    ...FONTS.button,
    fontSize: 13,
    color: COLORS.primaryDarkest,
  },

  cardsFeed: {
    paddingHorizontal: 20,
  },
  emptyContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    alignItems: 'center',
  },
  clearFilterBtn: {
    marginTop: -8,
    marginBottom: 20,
    backgroundColor: '#F0F8FB',
    borderWidth: 1,
    borderColor: '#B8E4E5',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: SIZES.r12,
  },
  clearFilterText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#206B82',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EBF1F4',
    marginBottom: 16,
    ...SHADOWS.card,
  },
  imageBannerWrap: {
    height: 180,
    width: '100%',
    position: 'relative',
    backgroundColor: '#E8F2F6',
    overflow: 'hidden',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
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
  urgencyPill: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  urgencyHigh: {
    backgroundColor: '#FEF2F2',
  },
  urgencyStandard: {
    backgroundColor: '#F0FDF4',
  },
  urgencyText: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  urgencyTextHigh: {
    color: '#B91C1C',
  },
  urgencyTextStandard: {
    color: '#15803D',
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
    fontSize: 11,
    fontWeight: '700',
    color: '#206B82',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  heartCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  cardBody: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 18,
    backgroundColor: '#FFFFFF',
  },
  titleRow: {
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#241408',
    letterSpacing: -0.3,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 8,
  },
  cardMetaText: {
    fontSize: 12.5,
    color: '#706050',
    fontWeight: '500',
    letterSpacing: 0.1,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  cardDescText: {
    fontSize: 13.5,
    color: '#4B3F33',
    lineHeight: 19,
    fontWeight: '400',
    marginBottom: 12,
    fontFamily: 'PlusJakartaSans_400Regular',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  tagPill: {
    backgroundColor: '#EEF7FA',
    borderWidth: 1,
    borderColor: '#D4EAF2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagPillWarn: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  tagPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#206B82',
    letterSpacing: 0.2,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  tagPillTextWarn: {
    color: '#DC2626',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3EFEA',
    paddingTop: 12,
  },
  cardDateText: {
    fontSize: 12,
    color: '#706050',
    fontWeight: '500',
    letterSpacing: 0.1,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FB',
    borderWidth: 1.2,
    borderColor: '#CCE3EE',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
  },
  actionPillText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#206B82',
    letterSpacing: 0.2,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
});
