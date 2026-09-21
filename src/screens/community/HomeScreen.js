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
import { COLORS, SIZES, SHADOWS, FONTS } from '../../constants/theme';
import Avatar from '../../components/Avatar';
import AnimalCard from '../../components/AnimalCard';

const CATEGORIES = [
  { id: 'all', label: 'All Pets', icon: 'paw' },
  { id: 'cats', label: 'Cats', icon: 'paw-outline' },
  { id: 'dogs', label: 'Dogs', icon: 'paw-outline' },
  { id: 'birds', label: 'Other Animals', icon: 'heart-outline' },
];


export default function CommunityHomeScreen({ navigation }) {
  const { currentUser, animals, getUnreadCount } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const unreadNotifs = getUnreadCount();
  const insets = useSafeAreaInsets();
  const safeTopPadding = Platform.OS === 'ios' ? Math.max(insets.top, 16) + 4 : (insets.top > 24 ? insets.top + 6 : 14);

  const filteredAnimals = animals.filter((a) => {
    if (a.status !== 'Available') return false;
    if (activeCategory === 'cats' && a.species !== 'Cat') return false;
    if (activeCategory === 'dogs' && a.species !== 'Dog') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        a.name.toLowerCase().includes(q) ||
        a.breed.toLowerCase().includes(q) ||
        a.location?.toLowerCase().includes(q)
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
              <Avatar name={currentUser?.name || 'Kareena Jane'} uri={currentUser?.avatar} size={42} />
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
          />
          <TouchableOpacity style={styles.filterBtn}>
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
              onPress={() => navigation.navigate('ReportRescue')}
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
                    color={active ? COLORS.surface : COLORS.textSecondary}
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

        {/* ── Available for Adoption Section ────────────────── */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Available for Adoption</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{filteredAnimals.length}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Listings')} activeOpacity={0.7}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {/* Pet Cards Feed */}
        <View style={styles.cardsFeed}>
          {filteredAnimals.map((pet) => (
            <AnimalCard
              key={pet.id}
              animal={pet}
              onPress={() => navigation.navigate('AnimalDetail', { animalId: pet.id })}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    paddingBottom: 90,
  },

  // Location Header
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

  // Search Bar
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

  // Save Animals Banner
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

  // Category Pills
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

  // Segment Tabs
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8DEC5',
    borderRadius: 16,
    marginHorizontal: 20,
    padding: 4,
    marginBottom: 18,
    shadowColor: '#473018',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  segBtn: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  segBtnActive: {
    backgroundColor: '#92CDE5',
    shadowColor: '#2E7A99',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  segText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#685038',
    fontFamily: 'PlusJakartaSans_600SemiBold',
    textAlign: 'center',
  },
  segTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans_700Bold',
  },

  // Section Header
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

  // Cards Feed
  cardsFeed: {
    paddingHorizontal: 20,
  },
});

