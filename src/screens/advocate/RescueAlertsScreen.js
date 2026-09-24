import React, { useState, useCallback } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { COLORS, SIZES, SHADOWS, FONTS } from '../../constants/theme';
import EmptyState from '../../components/EmptyState';
import { sortRescueReports } from '../../services/rescueService';

const FILTERS = ['Open', 'Responded', 'Rescued', 'All'];

export default function RescueAlertsScreen({ navigation }) {
  const { rescueReports, markAlertsAsViewed } = useApp();
  const [filter, setFilter] = useState('Open');
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      if (markAlertsAsViewed) {
        markAlertsAsViewed();
      }
    }, [markAlertsAsViewed])
  );

  const filtered = React.useMemo(() => {
    const list = rescueReports.filter((r) => {
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
    return sortRescueReports(list);
  }, [rescueReports, filter, searchQuery]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Recently';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const insets = useSafeAreaInsets();
  const safeTopPadding =
    Platform.OS === 'ios'
      ? Math.max(insets.top, 16) + 4
      : insets.top > 24
        ? insets.top + 6
        : 14;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* ── Title-Only Clean Header ─────────────────────────── */}
      <View style={[styles.header, { paddingTop: safeTopPadding }]}>
        <Text style={styles.headerTitle}>Rescue Alerts</Text>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons
            name="search-outline"
            size={20}
            color={COLORS.textMuted}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search breed, location, or shelter..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={18} color="#8C7D6A" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.filterBtn} activeOpacity={0.7}>
              <Ionicons name="options-outline" size={20} color={COLORS.brown} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          {FILTERS.map((f) => {
            const isActive = filter === f;
            return (
              <TouchableOpacity
                key={f}
                style={[
                  styles.filterChip,
                  isActive ? styles.filterChipActive : styles.filterChipInactive,
                ]}
                onPress={() => setFilter(f)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isActive ? styles.filterChipTextActive : styles.filterChipTextInactive,
                  ]}
                >
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
            subtitle={
              filter === 'Open'
                ? 'No open rescue alerts matching your criteria.'
                : 'Nothing here yet.'
            }
          />
        }
        renderItem={({ item }) => {
          const isRescued = item.status === 'Rescued' || item.urgency === 'Closed' || Boolean(item.rescuedAt);
          const isHigh = !isRescued && (item.urgency === 'High' || item.urgency === 'Critical');
          const badgeText = isRescued ? 'Closed' : isHigh ? 'High' : 'Standard';
          const cardTitle =
            item.title || `${item.condition || 'Injured'} ${item.animalType.toLowerCase()}`;
          const viaText = item.reporterName
            ? `Via: ${item.reporterName}`
            : 'Via: Community Member';

          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('RescueAlertDetail', { reportId: item.id })}
              activeOpacity={0.9}
            >
              {/* Image & floating badge */}
              <View style={styles.imageWrap}>
                {item.photo ? (
                  <Image
                    source={{ uri: item.photo }}
                    style={styles.cardImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.cardImage, styles.placeholderImage]}>
                    <Ionicons name="paw" size={40} color="#85CCE5" />
                  </View>
                )}
                <View
                  style={[
                    styles.urgencyBadge,
                    isRescued
                      ? styles.badgeClosed
                      : isHigh
                      ? styles.badgeHigh
                      : styles.badgeStandard,
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      isRescued
                        ? styles.badgeTextClosed
                        : isHigh
                        ? styles.badgeTextHigh
                        : styles.badgeTextStandard,
                    ]}
                  >
                    {badgeText}
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
                    <Ionicons
                      name="arrow-forward"
                      size={14}
                      color={COLORS.brown}
                      style={{ marginLeft: 4 }}
                    />
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
    backgroundColor: '#FFFFFF',
  },

  /* ── Matched Clean Header ── */
  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    ...FONTS.titleXl,
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.brown,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: SIZES.r24,
    borderWidth: 1.5,
    borderColor: COLORS.secondary,
    paddingHorizontal: 14,
    height: 48,
    marginTop: 12,
    marginBottom: 12,
    ...SHADOWS.sm,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    ...FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.brown,
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
    borderRadius: SIZES.r20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  filterChipInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.borderLight || '#E8DFC8',
  },
  filterChipText: {
    ...FONTS.subheading,
    fontSize: 13,
  },
  filterChipTextActive: {
    color: COLORS.primaryDeep,
  },
  filterChipTextInactive: {
    color: COLORS.textMuted,
  },

  /* ── List & Cards ── */
  list: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 110,
    backgroundColor: '#FFFFFF',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: SIZES.r24,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight || '#E8DFC8',
    ...SHADOWS.card,
  },
  imageWrap: {
    position: 'relative',
    height: 145,
    backgroundColor: COLORS.secondaryLight,
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
  badgeClosed: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
  badgeTextClosed: {
    color: '#4B5563',
  },
  cardBody: {
    padding: 16,
  },
  cardTitle: {
    ...FONTS.titleMd,
    fontSize: 17,
  },
  cardVia: {
    ...FONTS.meta,
    marginTop: 2,
  },
  cardDesc: {
    ...FONTS.bodyRegular,
    fontSize: 13,
    fontStyle: 'italic',
    color: COLORS.textSecondary,
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
    ...FONTS.caption,
    fontSize: 12,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewDetailsText: {
    ...FONTS.button,
    fontSize: 13,
    color: COLORS.brown,
  },
});