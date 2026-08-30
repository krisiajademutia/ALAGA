import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import AnimalCard from '../../components/AnimalCard';
import EmptyState from '../../components/EmptyState';

const SPECIES = ['All', 'Dog', 'Cat', 'Bird', 'Rabbit', 'Other'];
const SPECIES_EMOJI = { All: '🐾', Dog: '🐶', Cat: '🐱', Bird: '🐦', Rabbit: '🐰', Other: '🐾' };
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

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.title}>Find a Companion</Text>
            <Text style={styles.subtitle}>
              {filtered.length} animal{filtered.length !== 1 ? 's' : ''} looking for a home
            </Text>
          </View>
          <View style={styles.countBadge}>
            <Ionicons name="paw" size={14} color={COLORS.primaryDeep} />
            <Text style={styles.countNum}>{filtered.length}</Text>
          </View>
        </View>

        {/* Type filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
          {TYPE_FILTERS.map(({ key, label, icon }) => (
            <TouchableOpacity
              key={key}
              style={[styles.filterTab, typeFilter === key && styles.filterTabOn]}
              onPress={() => setTypeFilter(key)}
            >
              <Ionicons name={icon} size={13} color={typeFilter === key ? '#fff' : COLORS.textSecondary} />
              <Text style={[styles.filterText, typeFilter === key && styles.filterTextOn]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Species filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
          {SPECIES.map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.speciesTab, species === s && styles.speciesTabOn]}
              onPress={() => setSpecies(s)}
            >
              <Text style={[styles.speciesText, species === s && styles.speciesTextOn]}>
                {SPECIES_EMOJI[s]} {s}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <Ionicons name="home-outline" size={12} color={COLORS.primaryDeep} />
            <Text style={styles.legendText}>Adoption = permanent home</Text>
          </View>
          <View style={styles.legendItem}>
            <Ionicons name="heart-outline" size={12} color="#B45309" />
            <Text style={styles.legendText}>Foster = temporary care</Text>
          </View>
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
    backgroundColor: COLORS.surface,
    paddingTop: SIZES.xl40 + SIZES.sm8,
    paddingBottom: SIZES.sm8,
    borderBottomWidth: 1, borderBottomColor: COLORS.divider,
    ...SHADOWS.sm,
  },
  titleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SIZES.lg24, marginBottom: SIZES.md16,
  },
  title:    { fontSize: SIZES.xxl, fontWeight: '800', color: COLORS.brown },
  subtitle: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  countBadge: {
    flexDirection: 'row', alignItems: 'center', gap: SIZES.xs4,
    backgroundColor: COLORS.tagBg, paddingHorizontal: SIZES.sm8 + 2,
    paddingVertical: SIZES.xs4 + 2, borderRadius: SIZES.r999,
  },
  countNum: { fontSize: SIZES.body, fontWeight: '800', color: COLORS.primaryDeep },

  filterScroll:  { marginBottom: SIZES.xs4 },
  filterContent: { paddingHorizontal: SIZES.lg24, gap: SIZES.sm8, paddingBottom: SIZES.xs4 },
  filterTab: {
    flexDirection: 'row', alignItems: 'center', gap: SIZES.xs4,
    paddingHorizontal: SIZES.md16 - 2, paddingVertical: SIZES.xs4 + 4,
    borderRadius: SIZES.r999, backgroundColor: COLORS.inputBg,
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  filterTabOn:  { backgroundColor: COLORS.primaryDeep, borderColor: COLORS.primaryDeep },
  filterText:   { fontSize: SIZES.sm, fontWeight: '700', color: COLORS.textSecondary },
  filterTextOn: { color: '#fff' },
  speciesTab: {
    paddingHorizontal: SIZES.sm8 + 4, paddingVertical: SIZES.xs4 + 3,
    borderRadius: SIZES.r999, backgroundColor: COLORS.surface,
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  speciesTabOn:  { backgroundColor: COLORS.tagBg, borderColor: COLORS.primaryDeep },
  speciesText:   { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.textMuted },
  speciesTextOn: { color: COLORS.primaryDeep, fontWeight: '700' },

  legend: {
    flexDirection: 'row', gap: SIZES.md16,
    paddingHorizontal: SIZES.lg24, paddingTop: SIZES.xs4 + 2, paddingBottom: SIZES.xs4,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendText: { fontSize: SIZES.xs, color: COLORS.textMuted },

  grid:    { padding: SIZES.md16, paddingBottom: 110 },
  gridRow: { flexDirection: 'row', gap: SIZES.md16, marginBottom: SIZES.md16 },
  gridCard:{ flex: 1 },
  empty:   { flex: 1 },
});
