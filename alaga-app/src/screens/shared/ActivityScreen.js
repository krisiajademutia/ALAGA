import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import StatusPill from '../../components/StatusPill';
import Avatar from '../../components/Avatar';
import EmptyState from '../../components/EmptyState';

const W = Dimensions.get('window').width;

// ── Tab config ────────────────────────────────────────────────────────────────
const COMMUNITY_TABS = [
  { key: 'reports',   label: 'My Reports',  icon: 'alert-circle-outline',   iconActive: 'alert-circle' },
  { key: 'requests',  label: 'My Requests', icon: 'heart-outline',           iconActive: 'heart' },
  { key: 'donations', label: 'Donations',   icon: 'gift-outline',            iconActive: 'gift' },
];

const ADVOCATE_TABS = [
  { key: 'responses', label: 'Responses',  icon: 'shield-checkmark-outline', iconActive: 'shield-checkmark' },
  { key: 'requests',  label: 'Requests',   icon: 'heart-outline',            iconActive: 'heart' },
  { key: 'animals',   label: 'My Animals', icon: 'paw-outline',              iconActive: 'paw' },
];

// ── Icon colors per tab ───────────────────────────────────────────────────────
const TAB_COLORS = {
  reports:   { icon: COLORS.danger,      bg: '#FCE8E8' },
  responses: { icon: COLORS.success,     bg: '#D8F0E4' },
  requests:  { icon: '#7C3AED',          bg: '#F3EEFF' },
  donations: { icon: COLORS.secondaryDark, bg: COLORS.advocateBadge },
  animals:   { icon: COLORS.primaryDeep, bg: COLORS.tagBg },
};

export default function ActivityScreen({ navigation }) {
  const {
    currentUser,
    getUserReports, getAdvocateResponses,
    getUserRequests, getAdvocateRequests,
    getAdvocateAnimals, getUserDonations,
  } = useApp();

  const isAdvocate = currentUser?.role === 'advocate';
  const TABS = isAdvocate ? ADVOCATE_TABS : COMMUNITY_TABS;
  const [activeTab, setActiveTab] = useState(TABS[0].key);

  const getData = () => {
    if (!isAdvocate) {
      if (activeTab === 'reports')   return getUserReports();
      if (activeTab === 'requests')  return getUserRequests();
      if (activeTab === 'donations') return getUserDonations();
    } else {
      if (activeTab === 'responses') return getAdvocateResponses();
      if (activeTab === 'requests')  return getAdvocateRequests();
      if (activeTab === 'animals')   return getAdvocateAnimals();
    }
    return [];
  };

  const data     = getData();
  const tabColor = TAB_COLORS[activeTab] || { icon: COLORS.primaryDeep, bg: COLORS.tagBg };

  const renderItem = ({ item }) => {
    if (activeTab === 'reports' || activeTab === 'responses') {
      return <ReportCard item={item} isAdvocate={isAdvocate} navigation={navigation} />;
    }
    if (activeTab === 'requests') {
      return <RequestCard item={item} isAdvocate={isAdvocate} />;
    }
    if (activeTab === 'donations') {
      return <DonationCard item={item} />;
    }
    if (activeTab === 'animals') {
      return <AnimalCard item={item} navigation={navigation} />;
    }
    return null;
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* ── Header ──────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Activity</Text>
        <Text style={styles.headerSub}>
          {isAdvocate ? 'Track your rescues and animals' : 'Track your reports and requests'}
        </Text>
      </View>

      {/* ── Fixed 3-tab row — always side by side ───────────── */}
      <View style={styles.tabBar}>
        {TABS.map((t) => {
          const isActive = activeTab === t.key;
          const count    = (() => {
            if (!isAdvocate) {
              if (t.key === 'reports')   return getUserReports().length;
              if (t.key === 'requests')  return getUserRequests().length;
              if (t.key === 'donations') return getUserDonations().length;
            } else {
              if (t.key === 'responses') return getAdvocateResponses().length;
              if (t.key === 'requests')  return getAdvocateRequests().length;
              if (t.key === 'animals')   return getAdvocateAnimals().length;
            }
            return 0;
          })();

          return (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => setActiveTab(t.key)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isActive ? t.iconActive : t.icon}
                size={18}
                color={isActive ? COLORS.primaryDeep : COLORS.textMuted}
              />
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}
                numberOfLines={1}
              >
                {t.label}
              </Text>
              {count > 0 && (
                <View style={[styles.tabBadge, isActive && { backgroundColor: COLORS.primaryDeep }]}>
                  <Text style={[styles.tabBadgeText, isActive && { color: '#fff' }]}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Active indicator line ────────────────────────────── */}
      <View style={styles.indicatorRow}>
        {TABS.map((t) => (
          <View
            key={t.key}
            style={[
              styles.indicator,
              activeTab === t.key && { backgroundColor: COLORS.primaryDeep },
            ]}
          />
        ))}
      </View>

      {/* ── List ────────────────────────────────────────────── */}
      <FlatList
        key={activeTab}
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          data.length > 0 ? (
            <View style={styles.listHeader}>
              <Text style={styles.listHeaderText}>
                {data.length} item{data.length !== 1 ? 's' : ''}
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            icon="time-outline"
            title="Nothing here yet"
            subtitle="Your activity will show up here once you get started."
            style={styles.empty}
          />
        }
        renderItem={renderItem}
      />
    </View>
  );
}

// ── Report / Response card ────────────────────────────────────────────────────
function ReportCard({ item, isAdvocate, navigation }) {
  const urgencyColor = item.urgency === 'High' ? COLORS.danger : item.urgency === 'Medium' ? COLORS.warning : COLORS.success;
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate(
        isAdvocate ? 'RescueAlertDetail' : 'ReportDetail',
        { reportId: item.id }
      )}
      activeOpacity={0.88}
    >
      <View style={styles.cardLeft}>
        <View style={[styles.cardIconWrap, { backgroundColor: '#FCE8E8' }]}>
          <Ionicons name="alert-circle" size={22} color={COLORS.danger} />
        </View>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.animalType} · {item.condition}
          </Text>
          <StatusPill status={item.status} />
        </View>
        <View style={styles.cardMetaRow}>
          <Ionicons name="location-outline" size={12} color={COLORS.textMuted} />
          <Text style={styles.cardMeta} numberOfLines={1}>{item.location?.address || 'No location'}</Text>
        </View>
        <View style={styles.cardFooter}>
          <View style={[styles.urgencyPill, { backgroundColor: urgencyColor + '18' }]}>
            <View style={[styles.urgencyDot, { backgroundColor: urgencyColor }]} />
            <Text style={[styles.urgencyText, { color: urgencyColor }]}>{item.urgency}</Text>
          </View>
          <Text style={styles.cardDate}>{fmtDate(item.createdAt)}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} style={styles.cardChevron} />
    </TouchableOpacity>
  );
}

// ── Request card ──────────────────────────────────────────────────────────────
function RequestCard({ item, isAdvocate }) {
  const isAdoption = item.type === 'Adoption';
  const typeColor  = isAdoption ? COLORS.primaryDeep : '#B45309';
  const typeBg     = isAdoption ? COLORS.tagBg : '#FEF3DC';

  return (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={[styles.cardIconWrap, { backgroundColor: '#F3EEFF' }]}>
          <Ionicons name={isAdoption ? 'home' : 'heart'} size={20} color={typeColor} />
        </View>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <View style={[styles.typePill, { backgroundColor: typeBg }]}>
            <Text style={[styles.typePillText, { color: typeColor }]}>{item.type}</Text>
          </View>
          <StatusPill status={item.status} />
        </View>
        <Text style={styles.cardTitle}>{item.animalName}</Text>
        <Text style={styles.cardMeta}>
          {isAdvocate ? `From: ${item.requesterName}` : `Via: ${item.advocateId || 'Advocate'}`}
        </Text>
        {item.commitDuration ? (
          <View style={styles.durationPill}>
            <Ionicons name="time-outline" size={11} color="#B45309" />
            <Text style={styles.durationText}>Commit: {item.commitDuration}</Text>
          </View>
        ) : null}
        {item.message ? (
          <Text style={styles.cardQuote} numberOfLines={2}>"{item.message}"</Text>
        ) : null}
        <Text style={styles.cardDate}>{fmtDate(item.createdAt)}</Text>
      </View>
    </View>
  );
}

// ── Donation card ─────────────────────────────────────────────────────────────
function DonationCard({ item }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={[styles.cardIconWrap, { backgroundColor: COLORS.advocateBadge }]}>
          <Ionicons name="gift" size={20} color={COLORS.secondaryDark} />
        </View>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <Text style={styles.amountText}>₱{item.amount.toLocaleString()}</Text>
          <StatusPill status={item.status} />
        </View>
        <Text style={styles.cardTitle}>{item.animalName}</Text>
        <View style={styles.cardMetaRow}>
          <Ionicons name="card-outline" size={12} color={COLORS.textMuted} />
          <Text style={styles.cardMeta}>{item.method}</Text>
          <Text style={styles.cardMetaDot}>·</Text>
          <Text style={styles.cardMeta}>Ref: {item.referenceNumber}</Text>
        </View>
        {item.message ? (
          <Text style={styles.cardQuote} numberOfLines={2}>"{item.message}"</Text>
        ) : null}
        <Text style={styles.cardDate}>{fmtDate(item.createdAt)}</Text>
      </View>
    </View>
  );
}

// ── Animal card (advocate) ────────────────────────────────────────────────────
function AnimalCard({ item, navigation }) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('AnimalDetail', { animalId: item.id })}
      activeOpacity={0.88}
    >
      <View style={styles.cardLeft}>
        <View style={[styles.cardIconWrap, { backgroundColor: COLORS.tagBg }]}>
          <Ionicons name="paw" size={20} color={COLORS.primaryDeep} />
        </View>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <StatusPill status={item.status} />
        </View>
        <Text style={styles.cardMeta}>{item.species} · {item.breed} · {item.gender}</Text>
        {item.fosterDuration && (item.listingType === 'Foster' || item.listingType === 'Both') ? (
          <View style={styles.durationPill}>
            <Ionicons name="time-outline" size={11} color="#B45309" />
            <Text style={styles.durationText}>Foster: {item.fosterDuration}</Text>
          </View>
        ) : null}
        <Text style={styles.cardDate}>{fmtDate(item.createdAt)}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} style={styles.cardChevron} />
    </TouchableOpacity>
  );
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-PH', { dateStyle: 'medium' });
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },

  // Header
  header: {
    paddingHorizontal: SIZES.lg24,
    paddingTop: 52,
    paddingBottom: SIZES.md16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  headerTitle: { fontSize: SIZES.xxl, fontWeight: '800', color: COLORS.brown },
  headerSub:   { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 3 },

  // Tab bar — fixed 3 columns, never wraps
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    paddingHorizontal: SIZES.md16,
    paddingTop: SIZES.sm8,
  },
  tab: {
    flex: 1,                          // equal width always
    alignItems: 'center',
    justifyContent: 'center',
    gap: SIZES.xs4,
    paddingVertical: SIZES.sm8,
    borderRadius: SIZES.r8,
  },
  tabActive: { backgroundColor: COLORS.tagBg },
  tabLabel: {
    fontSize: SIZES.xs,
    fontWeight: '600',
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  tabLabelActive: {
    color: COLORS.primaryDeep,
    fontWeight: '800',
  },
  tabBadge: {
    minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: COLORS.inputBg,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
  },
  tabBadgeText: {
    fontSize: 9, fontWeight: '800', color: COLORS.textMuted,
  },

  // Indicator line under active tab
  indicatorRow: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.md16,
    backgroundColor: COLORS.surface,
    paddingBottom: SIZES.xs4 + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  indicator: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'transparent',
    marginHorizontal: SIZES.xs4 + 2,
  },

  // List
  list: { padding: SIZES.md16, paddingBottom: 110 },
  listHeader: { marginBottom: SIZES.sm8 },
  listHeaderText: { fontSize: SIZES.sm, color: COLORS.textMuted, fontWeight: '600' },
  empty: { marginTop: SIZES.xl32 },

  // Shared card shell
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.r16,
    padding: SIZES.md16,
    marginBottom: SIZES.md16,
    ...SHADOWS.card,
  },
  cardLeft: { marginRight: SIZES.md16 },
  cardIconWrap: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center',
  },
  cardBody:    { flex: 1 },
  cardChevron: { marginLeft: SIZES.xs4, marginTop: 2 },

  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.xs4 + 2,
    gap: SIZES.sm8,
  },
  cardTitle: {
    flex: 1,
    fontSize: SIZES.body,
    fontWeight: '700',
    color: COLORS.brown,
  },
  cardMetaRow: {
    flexDirection: 'row', alignItems: 'center', gap: SIZES.xs4,
    marginBottom: SIZES.xs4 + 2,
  },
  cardMeta:    { fontSize: SIZES.xs, color: COLORS.textSecondary },
  cardMetaDot: { fontSize: SIZES.xs, color: COLORS.textMuted },
  cardDate:    { fontSize: SIZES.xs, color: COLORS.textMuted, marginTop: SIZES.xs4 },
  cardQuote:   {
    fontSize: SIZES.xs, color: COLORS.textSecondary,
    fontStyle: 'italic', lineHeight: 17,
    marginTop: SIZES.xs4 + 2, marginBottom: SIZES.xs4,
  },
  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: SIZES.xs4 + 2,
  },

  // Urgency
  urgencyPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: SIZES.xs4 + 4, paddingVertical: 2,
    borderRadius: SIZES.r999,
  },
  urgencyDot:  { width: 5, height: 5, borderRadius: 3 },
  urgencyText: { fontSize: SIZES.xs, fontWeight: '700' },

  // Request type pill
  typePill: {
    paddingHorizontal: SIZES.xs4 + 4, paddingVertical: 2,
    borderRadius: SIZES.r999,
  },
  typePillText: { fontSize: SIZES.xs, fontWeight: '700' },

  // Amount (donations)
  amountText: {
    fontSize: SIZES.lg, fontWeight: '900', color: COLORS.brown,
  },

  // Duration (foster)
  durationPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#FEF3DC',
    paddingHorizontal: SIZES.xs4 + 4, paddingVertical: 2,
    borderRadius: SIZES.r999, alignSelf: 'flex-start',
    marginTop: SIZES.xs4 + 2,
  },
  durationText: { fontSize: SIZES.xs, color: '#B45309', fontWeight: '600' },
});
