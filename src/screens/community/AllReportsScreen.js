import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import EmptyState from '../../components/EmptyState';
import Header from '../../components/Header';

const FILTERS = ['All', 'Open', 'Responded', 'Rescued'];

export default function AllReportsScreen({ navigation }) {
  const { rescueReports } = useApp();
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = rescueReports.filter((r) => {
    if (filter !== 'All' && r.status !== filter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const title = (r.title || `${r.condition || 'Injured'} ${r.animalType.toLowerCase()}`).toLowerCase();
      const loc = (r.location?.address || '').toLowerCase();
      const desc = (r.description || '').toLowerCase();
      return title.includes(q) || loc.includes(q) || desc.includes(q);
    }
    return true;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Aug 25, 2026';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <Header
        title="Rescue Reports"
        onBack={() => navigation.goBack()}
        borderBottom={false}
      />

      {/* ── Search & Filter ────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#8C7D6A" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search reports by animal or location..."
            placeholderTextColor="#8C7D6A"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.filterRow}>
          {FILTERS.map((f) => {
            const isActive = filter === f;
            return (
              <TouchableOpacity
                key={f}
                style={[styles.filterChip, isActive ? styles.filterChipActive : styles.filterChipInactive]}
                onPress={() => setFilter(f)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterChipText, isActive ? styles.filterChipTextActive : styles.filterChipTextInactive]}>
                  {f}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState icon="paw-outline" title="No reports found" subtitle="Try adjusting your search or filters." />
        }
        renderItem={({ item }) => {
          const isHigh = item.urgency === 'High' || item.urgency === 'Critical';
          const cardTitle = item.title || `${item.condition || 'Injured'} ${item.animalType.toLowerCase()}`;

          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('ReportDetail', { reportId: item.id })}
              activeOpacity={0.9}
            >
              <View style={styles.imageWrap}>
                {item.photo ? (
                  <Image source={{ uri: item.photo }} style={styles.cardImage} resizeMode="cover" />
                ) : (
                  <View style={[styles.cardImage, styles.placeholderImage]}>
                    <Ionicons name="paw" size={36} color="#85CCE5" />
                  </View>
                )}
                <View style={[styles.urgencyBadge, isHigh ? styles.badgeHigh : styles.badgeStandard]}>
                  <Text style={[styles.badgeText, isHigh ? styles.badgeTextHigh : styles.badgeTextStandard]}>
                    {isHigh ? 'High' : 'Standard'}
                  </Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{cardTitle}</Text>
                <View style={styles.locRow}>
                  <Ionicons name="location-sharp" size={13} color="#D94F4F" style={{ marginRight: 4 }} />
                  <Text style={styles.cardLoc}>{item.location?.address || 'Pasig City'}</Text>
                </View>
                <Text style={styles.cardDesc} numberOfLines={2}>
                  "{item.description}"
                </Text>

                <View style={styles.cardFooter}>
                  <Text style={styles.cardDate}>{formatDate(item.createdAt)}</Text>
                  <View style={styles.actionRow}>
                    <Text style={styles.viewDetailsText}>View Details</Text>
                    <Ionicons name="arrow-forward" size={14} color="#473018" style={{ marginLeft: 4 }} />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#B8D3C3',
    paddingHorizontal: 14,
    height: 44,
    marginBottom: 10,
    ...SHADOWS.sm,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#473018',
    fontWeight: '500',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 18,
  },
  filterChipActive: {
    backgroundColor: '#E0F2F7',
    borderWidth: 1.5,
    borderColor: '#85CCE5',
  },
  filterChipInactive: {
    backgroundColor: '#F3EFEA',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: '#2E7A99',
  },
  filterChipTextInactive: {
    color: '#8C7D6A',
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 110,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EFECE6',
    ...SHADOWS.card,
  },
  imageWrap: {
    height: 140,
    backgroundColor: '#EBF4F0',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  urgencyBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeHigh: {
    backgroundColor: '#FCE8E6',
  },
  badgeStandard: {
    backgroundColor: '#E2F4EE',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  badgeTextHigh: {
    color: '#D9383A',
  },
  badgeTextStandard: {
    color: '#2E7D32',
  },
  cardBody: {
    padding: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#473018',
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  cardLoc: {
    fontSize: 12,
    color: '#8C7D6A',
    fontWeight: '500',
  },
  cardDesc: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#5C4E3A',
    marginTop: 6,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  cardDate: {
    fontSize: 12,
    color: '#8C7D6A',
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#473018',
  },
});
