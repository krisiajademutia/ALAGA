import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Platform, StatusBar as RNStatusBar } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import AnimalCard from '../../components/AnimalCard';
import EmptyState from '../../components/EmptyState';

const SPECIES = ['All', 'Dog', 'Cat', 'Bird', 'Rabbit', 'Other'];
const TYPE_FILTERS = [
  { key: 'All',      label: 'All',       icon: 'grid-outline' },
  { key: 'Adoption', label: 'Adopt',     icon: 'home-outline' },
  { key: 'Foster',   label: 'Foster',    icon: 'heart-outline' },
];

export default function ListingsScreen({ navigation }) {
  const { animals } = useApp();
  const [species, setSpecies] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  // Only show animals that are actively available
  const listed = animals.filter((a) => a.status === 'Available');

  const filtered = listed.filter((a) => {
    const matchSpecies = species === 'All' || a.species === species;
    const matchType =
      typeFilter === 'All' ||
      a.listingType === typeFilter ||
      a.listingType === 'Both';
    return matchSpecies && matchType;
  });

  const rows = [];
  for (let i = 0; i < filtered.length; i += 2) {
    rows.push([filtered[i], filtered[i + 1] || null]);
  }

  const insets = useSafeAreaInsets();
  const safeTopPadding = Platform.OS === 'ios' ? Math.max(insets.top, 16) + 4 : (insets.top > 24 ? insets.top + 6 : 14);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: safeTopPadding }]}>
        <View style={styles.titleRow}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={styles.title} numberOfLines={1}>Adopt & Foster</Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              Find pets available for adoption and temporary care
            </Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countNum} numberOfLines={1}>{filtered.length} Available</Text>
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
        <View style={styles.speciesContainer}>
          <Text style={styles.sectionLabel}>Species</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.speciesContent}
          >
            {SPECIES.map((s) => {
              const isActive = species === s;
              const speciesLabel = s === 'All' ? 'All Pets' : s;
              return (
                <TouchableOpacity
                  key={s}
                  style={[styles.speciesChip, isActive && styles.speciesChipActive]}
                  onPress={() => setSpecies(s)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.speciesText, isActive && styles.speciesTextActive]}>
                    {speciesLabel}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>

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
  root: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.background,
    paddingBottom: SIZES.sm8,
    borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  titleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SIZES.lg24, marginBottom: SIZES.md16,
  },
  title:    { fontSize: SIZES.xxl, fontWeight: '800', color: COLORS.brown },
  subtitle: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#EBF7FA',
    borderWidth: 1,
    borderColor: '#B8E4E5',
    flexShrink: 0,
    alignSelf: 'center',
  },
  countNum: { fontSize: 11.5, fontWeight: '700', color: '#2E7A99' },

  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.inputBg,
    borderRadius: SIZES.r12,
    marginHorizontal: SIZES.lg24,
    padding: 3,
    marginBottom: SIZES.sm8 + 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
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
  },
  segmentTextActive: {
    fontWeight: '800',
    color: COLORS.brown,
  },

  speciesContainer: {
    marginBottom: 6,
  },
  sectionLabel: {
    fontSize: SIZES.xsmall,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginHorizontal: SIZES.lg24,
    marginBottom: 6,
  },
  speciesContent: {
    paddingHorizontal: SIZES.lg24,
    gap: 8,
    paddingBottom: 4,
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
  },
  speciesTextActive: {
    fontWeight: '800',
    color: COLORS.primaryDeep,
  },

  legendBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: SIZES.lg24,
    paddingTop: 6,
    paddingBottom: 2,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { fontSize: SIZES.xsmall, color: COLORS.textMuted },
  legendText: { fontSize: SIZES.xsmall, color: COLORS.textMuted, fontWeight: '500' },

  grid:    { padding: SIZES.md16, paddingBottom: 110 },
  gridRow: { flexDirection: 'row', gap: SIZES.md16, marginBottom: SIZES.md16 },
  gridCard:{ flex: 1 },
  empty:   { flex: 1 },
});
