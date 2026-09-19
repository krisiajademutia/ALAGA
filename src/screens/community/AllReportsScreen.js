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
    if (!dateStr) return 'Recently';
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
    backgroundColor: '#F7F7F7', // Slightly gray background to distinguish posts like FB
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EFECE6',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3EFEA',
    borderRadius: 8,
    paddingHorizontal: 14,
    height: 40,
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#473018',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  filterChipActive: {
    backgroundColor: '#473018',
  },
  filterChipInactive: {
    backgroundColor: '#EFECE6',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  filterChipTextInactive: {
    color: '#8C7D6A',
  },
  list: {
    paddingTop: 8,
    paddingBottom: 110,
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#EFECE6',
  },
  imageWrap: {
    width: '100%',
    height: 280,
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeHigh: {
    backgroundColor: '#D9383A',
  },
  badgeStandard: {
    backgroundColor: '#2E7D32',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  badgeTextHigh: {
    color: '#FFFFFF',
  },
  badgeTextStandard: {
    color: '#FFFFFF',
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardLoc: {
    fontSize: 13,
    color: '#666666',
  },
  cardDesc: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#EFECE6',
  },
  cardDate: {
    fontSize: 12,
    color: '#8C7D6A',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewDetailsText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2E7A99',
  },
});
