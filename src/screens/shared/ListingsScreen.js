import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ScrollView, Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import AnimalCard from '../../components/AnimalCard';
import EmptyState from '../../components/EmptyState';

const SPECIES = ['All', 'Dog', 'Cat', 'Bird', 'Rabbit', 'Other'];
const TYPE_FILTERS = [
  { key: 'All',      label: 'All Pets' },
  { key: 'Adoption', label: 'Adopt'    },
  { key: 'Foster',   label: 'Foster'   },
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

  // Pair items into rows of 2
  const rows = [];
  for (let i = 0; i < filtered.length; i += 2) {
    rows.push([filtered[i], filtered[i + 1] || null]);
  }

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

      {/* ── Grid ──────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="heart-outline"
          title="No animals available"
          subtitle="Try a different filter, or check back later."
          style={styles.empty}
        />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: [left, right] }) => (
            <View style={styles.gridRow}>
              <AnimalCard
                animal={left}
                horizontal
                onPress={() => navigation.navigate('AnimalDetail', { animalId: left.id })}
                style={styles.gridCard}
              />
              {right ? (
                <AnimalCard
                  animal={right}
                  horizontal
                  onPress={() => navigation.navigate('AnimalDetail', { animalId: right.id })}
                  style={styles.gridCard}
                />
              ) : (
                <View style={styles.gridCard} />
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },

  header: {
    backgroundColor: '#FFFFFF',
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
    paddingHorizontal: 14,
    paddingVertical: 7,
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

  grid:    { padding: 12, paddingBottom: 110 },
  gridRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  gridCard:{ flex: 1 },
  empty:   { flex: 1 },
});
