import React, { useState } from 'react';
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
import { useApp } from '../../context/AppContext';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import Avatar from '../../components/Avatar';

const CATEGORIES = [
  { id: 'all', label: 'All Alerts', icon: 'paw' },
  { id: 'cats', label: 'Cats', icon: 'paw-outline' },
  { id: 'dogs', label: 'Dogs', icon: 'paw-outline' },
  { id: 'birds', label: 'Other Animals', icon: 'heart-outline' },
];

const SEGMENTS = ['All Pets', 'Urgent / Foster', 'Nearby (<3km)'];

export default function AdvocateHomeScreen({ navigation }) {
  const { currentUser, rescueReports, getUnreadCount } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeSegment, setActiveSegment] = useState('All Pets');
  const [favorites, setFavorites] = useState({});

  const unreadNotifs = getUnreadCount();
  const insets = useSafeAreaInsets();
  const safeTopPadding = Platform.OS === 'ios' ? Math.max(insets.top, 16) + 4 : (insets.top > 24 ? insets.top + 6 : 14);

  const toggleFavorite = (id) => {
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredReports = rescueReports.filter((r) => {
    if (activeCategory === 'cats' && r.animalType !== 'Cat') return false;
    if (activeCategory === 'dogs' && r.animalType !== 'Dog') return false;
    if (activeSegment === 'Urgent / Foster' && r.urgency !== 'High' && r.urgency !== 'Critical') return false;
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
              <Ionicons name="notifications-outline" size={22} color="#473018" />
              {unreadNotifs > 0 && <View style={styles.notifBadge} />}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('Profile')}
              style={styles.avatarWrap}
            >
              <Avatar name={currentUser?.name || 'Elena Ramos'} uri={currentUser?.avatar} size={42} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Search Bar ────────────────────────────────────── */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#8C7D6A" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search breed, location, or shelter..."
            placeholderTextColor="#8C7D6A"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity style={styles.filterBtn}>
            <Ionicons name="options-outline" size={20} color="#473018" />
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
              <Ionicons name="paw" size={32} color="#473018" />
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

        {/* ── Segmented Tabs ────────────────────────────────── */}
        <View style={styles.segmentContainer}>
          {SEGMENTS.map((seg) => {
            const active = activeSegment === seg;
            return (
              <TouchableOpacity
                key={seg}
                style={[styles.segBtn, active && styles.segBtnActive]}
                onPress={() => setActiveSegment(seg)}
                activeOpacity={0.8}
              >
                <Text style={[styles.segText, active && styles.segTextActive]}>
                  {seg}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

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
        <View style={styles.cardsFeed}>
          {filteredReports.map((r) => {
            const isFav = Boolean(favorites[r.id]);
            const isUrgent = r.urgency === 'High' || r.urgency === 'Critical';
            const petName = r.title || `${r.animalType} · ${r.condition || 'Rescue'}`;
            const breedName = r.animalType === 'Dog' ? 'Aspin Mix' : 'Puspin Tabby';
            const tags = r.tags || [r.animalType || 'Rescue', r.condition || 'Alert'];

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

                  {/* Top-Right Distance & Favorite */}
                  <View style={styles.topRightOverlay}>
                    <View style={styles.distancePill}>
                      <Ionicons name="location-sharp" size={11} color="#206B82" style={{ marginRight: 2 }} />
                      <Text style={styles.distancePillText}>1.2 km</Text>
                    </View>
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

                  {/* Location & Breed */}
                  <View style={styles.cardMetaRow}>
                    <Ionicons name="location-outline" size={13} color="#8C7D6A" style={{ marginRight: 4 }} />
                    <Text style={styles.cardMetaText} numberOfLines={1}>
                      {r.location?.address || 'Pasig City'} · {breedName}
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
                      {r.dateDisplay || 'Aug 25, 2026'}
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E3EFF6',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#D94F4F',
  },
  avatarWrap: {
    ...SHADOWS.sm,
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CCE3EE',
    borderRadius: 25,
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
    fontSize: 13,
    color: '#473018',
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  filterBtn: {
    padding: 4,
  },

  banner: {
    backgroundColor: '#FBEEAC',
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 18,
  },
  bannerDecor1: {
    position: 'absolute',
    right: -10,
    top: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#B8D3C3',
    opacity: 0.5,
  },
  bannerDecor2: {
    position: 'absolute',
    right: 40,
    bottom: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#B8D3C3',
    opacity: 0.4,
  },
  bannerLeft: {
    flex: 1,
    zIndex: 2,
  },
  tagWrap: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#473018',
    letterSpacing: 0.5,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#473018',
    marginBottom: 4,
    letterSpacing: -0.3,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  bannerSub: {
    fontSize: 12.5,
    color: '#5C4E3A',
    lineHeight: 17,
    marginBottom: 14,
    paddingRight: 10,
    fontFamily: 'PlusJakartaSans_400Regular',
  },
  helpBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#473018',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  helpBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans_700Bold',
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
    backgroundColor: '#FFFFFF',
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
    borderRadius: 20,
    borderWidth: 1,
  },
  catPillActive: {
    backgroundColor: '#92CDE5',
    borderColor: '#92CDE5',
  },
  catPillInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#CCE3EE',
  },
  catPillText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  catPillTextActive: {
    color: '#FFFFFF',
  },
  catPillTextInactive: {
    color: '#473018',
  },

  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CCE3EE',
    borderRadius: 25,
    marginHorizontal: 20,
    padding: 3,
    marginBottom: 18,
  },
  segBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  segBtnActive: {
    backgroundColor: '#D8EDE4',
  },
  segText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5C4E3A',
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  segTextActive: {
    color: '#473018',
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans_700Bold',
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
    fontSize: 20,
    fontWeight: '800',
    color: '#473018',
    letterSpacing: -0.4,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  countBadge: {
    backgroundColor: '#E2F0F4',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#206B82',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  seeAllText: {
    fontSize: 13,
    color: '#206B82',
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans_700Bold',
  },

  cardsFeed: {
    paddingHorizontal: 20,
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
