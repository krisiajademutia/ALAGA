import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { COLORS, SIZES, SHADOWS, FONTS } from '../../constants/theme';
import AnimalCard from '../../components/AnimalCard';
import EmptyState from '../../components/EmptyState';

const SPECIES = ['All', 'Dog', 'Cat', 'Bird', 'Rabbit', 'Other'];
const TYPE_FILTERS = [
  { key: 'All', label: 'All Pets' },
  { key: 'Adoption', label: 'Adopt' },
  { key: 'Foster', label: 'Foster' },
];

export default function ListingsScreen({ navigation }) {
  const { animals, currentUser } = useApp();
  const [species, setSpecies] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

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
  const safeTop =
    Platform.OS === 'ios'
      ? Math.max(insets.top, 16) + 4
      : insets.top > 24
        ? insets.top + 6
        : 14;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* ── Clean White Header ──────────────────────────────── */}
      <View style={[styles.header, { paddingTop: safeTop }]}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Adopt &amp; Foster</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={styles.countBadge}>
              <Text style={styles.countNum}>{filtered.length} Available</Text>
            </View>
            {currentUser?.role === 'advocate' && (
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => navigation.navigate('AddAnimal')}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={16} color="#FFFFFF" />
                <Text style={styles.addBtnText}>Add Pet</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Clean Segmented Type Filter */}
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
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0ECE4',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    ...FONTS.titleXl,
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.brown,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#EBF7FA',
    borderWidth: 1,
    borderColor: '#B8E4E5',
  },
  countNum: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#2E7A99',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E7A99',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 2,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans_700Bold',
  },

  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: SIZES.r20,
    padding: 3,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: COLORS.secondary,
    ...SHADOWS.sm,
  },
  segmentBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 16,
  },
  segmentBtnActive: {
    backgroundColor: COLORS.primaryLight,
  },
  segmentText: {
    ...FONTS.subheading,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  segmentTextActive: {
    fontWeight: '800',
    color: COLORS.primaryDeep,
  },

  speciesContent: {
    gap: 8,
    paddingVertical: 2,
  },
  speciesChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: SIZES.r20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.borderLight || '#E8DFC8',
  },
  speciesChipActive: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  speciesText: {
    ...FONTS.subheading,
    fontSize: 12.5,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  speciesTextActive: {
    fontWeight: '800',
    color: COLORS.primaryDeep,
  },

  grid: { padding: 12, paddingBottom: 110 },
  gridRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  gridCard: { flex: 1 },
  empty: { flex: 1 },
});