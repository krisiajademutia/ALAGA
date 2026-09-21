import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ScrollView, Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import AnimalCard from '../../components/AnimalCard';
import EmptyState from '../../components/EmptyState';

const SPECIES = ['All', 'Dog', 'Cat', 'Bird', 'Rabbit', 'Other'];
const TYPE_FILTERS = [
  { key: 'All',      label: 'All Pets',  icon: 'grid-outline'  },
  { key: 'Adoption', label: 'Adopt',     icon: 'home-outline'  },
  { key: 'Foster',   label: 'Foster',    icon: 'heart-outline' },
];

export default function ListingsScreen({ navigation }) {
  const { animals } = useApp();
  const [species, setSpecies]       = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  const listed   = animals.filter((a) => a.status === 'Available');
  const filtered = listed.filter((a) => {
    const matchSpecies = species === 'All' || a.species === species;
    const matchType =
      typeFilter === 'All' ||
      a.listingType === typeFilter ||
      a.listingType === 'Both';
    return matchSpecies && matchType;
  });

  const insets = useSafeAreaInsets();
  const safeTop = Platform.OS === 'ios'
    ? Math.max(insets.top, 16) + 4
    : insets.top > 24 ? insets.top + 6 : 14;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* ── Header ──────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: safeTop }]}>
        {/* Title Row */}
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Adopt &amp; Foster</Text>
            <Text style={styles.subtitle}>Find pets available for adoption and care</Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countNum}>{filtered.length} Available</Text>
          </View>
        </View>

        {/* Segmented Type Filter */}
        <View style={styles.segmentedContainer}>
          {TYPE_FILTERS.map(({ key, label }) => {
            const isActive = typeFilter === key;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.segmentBtn, isActive && styles.segmentBtnActive]}
                onPress={() => setTypeFilter(key)}
                activeOpacity={0.8}
              >
                <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Species Filter Carousel */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.speciesContent}
        >
          {SPECIES.map((s) => {
            const isActive = species === s;
            return (
              <TouchableOpacity
                key={s}
                style={[styles.speciesChip, isActive && styles.speciesChipActive]}
                onPress={() => setSpecies(s)}
                activeOpacity={0.8}
              >
                <Text style={[styles.speciesText, isActive && styles.speciesTextActive]}>
                  {s === 'All' ? 'All Pets' : s}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── List ──────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="heart-outline"
          title="No animals available"
          subtitle="Try a different filter, or check back later."
          style={styles.empty}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(a) => a.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <AnimalCard
              animal={item}
              onPress={() => navigation.navigate('AnimalDetail', { animalId: item.id })}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },

  header: {
    backgroundColor: COLORS.background,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },

  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.lg24,
    marginBottom: SIZES.md16,
  },
  title: {
    fontSize: SIZES.xxl,
    fontWeight: '800',
    color: COLORS.brown,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  subtitle: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontFamily: 'PlusJakartaSans_400Regular',
  },
  countBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#EBF7FA',
    borderWidth: 1,
    borderColor: '#B8E4E5',
    alignSelf: 'center',
    marginLeft: 8,
  },
  countNum: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2E7A99',
    fontFamily: 'PlusJakartaSans_700Bold',
  },

  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.inputBg,
    borderRadius: SIZES.r12,
    marginHorizontal: SIZES.lg24,
    padding: 3,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  segmentBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: SIZES.radius,
  },
  segmentBtnActive: {
    backgroundColor: COLORS.surface,
    ...SHADOWS.card,
  },
  segmentText: {
    fontSize: SIZES.small,
    fontWeight: '600',
    color: COLORS.textMuted,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  segmentTextActive: {
    fontWeight: '800',
    color: COLORS.brown,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },

  speciesContent: {
    paddingHorizontal: SIZES.lg24,
    gap: 8,
    paddingBottom: 10,
  },
  speciesChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  speciesChipActive: {
    backgroundColor: COLORS.tagBg,
    borderColor: COLORS.primaryLight,
  },
  speciesText: {
    fontSize: SIZES.small,
    fontWeight: '600',
    color: COLORS.textSecondary,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  speciesTextActive: {
    fontWeight: '800',
    color: COLORS.primaryDeep,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },

  list:  { paddingHorizontal: SIZES.lg24, paddingTop: 16, paddingBottom: 110 },
  empty: { flex: 1 },
});
