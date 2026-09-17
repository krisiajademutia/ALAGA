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
  StatusBar as RNStatusBar,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import EmptyState from '../../components/EmptyState';

const FILTERS = ['Open', 'Responded', 'Rescued', 'All'];

export default function RescueAlertsScreen({ navigation }) {
  const { rescueReports } = useApp();
  const [filter, setFilter] = useState('Open');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = rescueReports.filter((r) => {
    if (filter !== 'All' && r.status !== filter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const title = (r.title || `${r.condition || 'Injured'} ${r.animalType.toLowerCase()}`).toLowerCase();
      const reporter = (r.reporterName || '').toLowerCase();
      const loc = (r.location?.address || '').toLowerCase();
      const desc = (r.description || '').toLowerCase();
      return title.includes(q) || reporter.includes(q) || loc.includes(q) || desc.includes(q);
    }
    return true;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Aug 25, 2026';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const insets = useSafeAreaInsets();
  const safeTopPadding = Platform.OS === 'ios' ? Math.max(insets.top, 16) + 4 : (insets.top > 24 ? insets.top + 6 : 14);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* ── Header ─────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: safeTopPadding }]}>
        <Text style={styles.headerTitle}>Rescue Alerts</Text>
        <Text style={styles.headerSub}>Track your reports, requests & contributions</Text>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#8C7D6A" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search breed, location, or shelter..."
            placeholderTextColor="#8C7D6A"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity style={styles.filterBtn} activeOpacity={0.7}>
            <Ionicons name="options-outline" size={20} color="#473018" />
          </TouchableOpacity>
        </View>

        {/* Filter Pills */}
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

      {/* ── List of Alerts ─────────────────────────────────── */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="notifications-off-outline"
            title="No alerts found"
            subtitle={filter === 'Open' ? 'No open rescue alerts matching your criteria.' : 'Nothing here yet.'}
          />
        }
        renderItem={({ item }) => {
          const isHigh = item.urgency === 'High' || item.urgency === 'Critical';
          const cardTitle = item.title || `${item.condition || 'Injured'} ${item.animalType.toLowerCase()}`;
          const viaText = `Via: ${item.reporterName || 'Elena Ramos'} (Advocate)`;

          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('RescueAlertDetail', { reportId: item.id })}
              activeOpacity={0.9}
            >
              {/* Image & floating badge */}
              <View style={styles.imageWrap}>
                {item.photo ? (
                  <Image source={{ uri: item.photo }} style={styles.cardImage} resizeMode="cover" />
                ) : (
                  <View style={[styles.cardImage, styles.placeholderImage]}>
                    <Ionicons name="paw" size={40} color="#85CCE5" />
                  </View>
                )}
                <View style={[styles.urgencyBadge, isHigh ? styles.badgeHigh : styles.badgeStandard]}>
                  <Text style={[styles.badgeText, isHigh ? styles.badgeTextHigh : styles.badgeTextStandard]}>
                    {isHigh ? 'High' : 'Standard'}
                  </Text>
                </View>
              </View>

              {/* Card Body */}
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{cardTitle}</Text>
                <Text style={styles.cardVia}>{viaText}</Text>
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
    paddingBottom: 10,
    backgroundColor: COLORS.background,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#473018',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 13,
    color: '#8C7D6A',
    marginTop: 3,
    fontWeight: '500',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#B8D3C3',
    paddingHorizontal: 14,
    height: 48,
    marginTop: 14,
    marginBottom: 12,
    ...SHADOWS.sm,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#473018',
    fontWeight: '500',
    paddingVertical: 0,
  },
  filterBtn: {
    padding: 4,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 13,
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
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EFECE6',
    ...SHADOWS.card,
  },
  imageWrap: {
    position: 'relative',
    height: 145,
    backgroundColor: '#EBF4F0',
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
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
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
    padding: 16,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#473018',
  },
  cardVia: {
    fontSize: 12,
    color: '#7A6A55',
    fontWeight: '600',
    marginTop: 2,
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
    marginTop: 14,
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
    fontSize: 13,
    fontWeight: '800',
    color: '#473018',
  },
});

