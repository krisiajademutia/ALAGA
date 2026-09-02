import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Dimensions, Platform, Modal, ScrollView } from 'react-native';
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

export default function ActivityScreen({ route, navigation }) {
  const {
    currentUser,
    getUserReports, getAdvocateResponses,
    getUserRequests, getAdvocateRequests,
    getAdvocateAnimals, getUserDonations,
  } = useApp();

  const isAdvocate = currentUser?.role === 'advocate';
  const TABS = isAdvocate ? ADVOCATE_TABS : COMMUNITY_TABS;
  const initialTab = route?.params?.tab || TABS[0].key;
  const [activeTab, setActiveTab] = useState(initialTab);
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedRequest, setSelectedRequest] = useState(null);

  React.useEffect(() => {
    if (route?.params?.tab) {
      setActiveTab(route.params.tab);
    }
  }, [route?.params?.tab]);

  const getRawData = () => {
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

  const rawData = getRawData();
  const filteredData = statusFilter === 'All'
    ? rawData
    : rawData.filter((item) => item.status === statusFilter);

  // Sub-status options based on active tab
  const getStatusOptions = () => {
    const statuses = new Set(['All']);
    rawData.forEach((item) => {
      if (item.status) statuses.add(item.status);
    });
    return Array.from(statuses);
  };

  const statusOptions = getStatusOptions();

  const renderItem = ({ item }) => {
    if (activeTab === 'reports' || activeTab === 'responses') {
      return <ReportCard item={item} isAdvocate={isAdvocate} navigation={navigation} />;
    }
    if (activeTab === 'requests') {
      return <RequestCard item={item} isAdvocate={isAdvocate} onPress={() => setSelectedRequest(item)} />;
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
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Activity Dashboard</Text>
            <Text style={styles.headerSub}>
              {isAdvocate ? 'Track & manage your rescue operations' : 'Track your reports, requests & contributions'}
            </Text>
          </View>
          <View style={styles.headerBadge}>
            <Ionicons name="time" size={16} color={COLORS.primaryDeep} />
            <Text style={styles.headerBadgeText}>{rawData.length} total</Text>
          </View>
        </View>

        {/* Segmented Tab Navigation */}
        <View style={styles.tabContainer}>
          {TABS.map((t) => {
            const isActive = activeTab === t.key;
            const count = (() => {
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
                style={[styles.tabBtn, isActive && styles.tabBtnActive]}
                onPress={() => {
                  setActiveTab(t.key);
                  setStatusFilter('All');
                }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isActive ? t.iconActive : t.icon}
                  size={15}
                  color={isActive ? COLORS.primaryDeep : COLORS.textMuted}
                />
                <Text style={[styles.tabBtnText, isActive && styles.tabBtnTextActive]} numberOfLines={1}>
                  {t.label}
                </Text>
                {count > 0 && (
                  <View style={[styles.badge, isActive ? styles.badgeActive : styles.badgeInactive]}>
                    <Text style={[styles.badgeText, isActive && styles.badgeTextActive]}>{count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Sub-status Filter Carousel */}
        {statusOptions.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subFilterContent}>
            {statusOptions.map((st) => (
              <TouchableOpacity
                key={st}
                style={[styles.subFilterChip, statusFilter === st && styles.subFilterChipActive]}
                onPress={() => setStatusFilter(st)}
              >
                <Text style={[styles.subFilterText, statusFilter === st && styles.subFilterTextActive]}>
                  {st}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* ── List ────────────────────────────────────────────── */}
      <FlatList
        key={activeTab + '_' + statusFilter}
        data={filteredData}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="time-outline"
            title="No activity recorded"
            subtitle="Your activity logs and updates will appear here."
            style={styles.empty}
          />
        }
        renderItem={renderItem}
      />

      {/* ── Request Detail Modal ───────────────────────────── */}
      {selectedRequest && (
        <Modal visible transparent animationType="slide" onRequestClose={() => setSelectedRequest(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />
              <View style={styles.modalHeader}>
                <View style={styles.modalIconWrap}>
                  <Ionicons
                    name={selectedRequest.type === 'Adoption' ? 'home' : 'heart'}
                    size={22}
                    color={COLORS.primaryDeep}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>{selectedRequest.type} Request</Text>
                  <Text style={styles.modalSub}>{selectedRequest.animalName}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedRequest(null)} style={styles.modalClose}>
                  <Ionicons name="close" size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Status:</Text>
                  <StatusPill status={selectedRequest.status} />
                </View>

                {selectedRequest.commitDuration ? (
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Commitment:</Text>
                    <Text style={styles.modalVal}>{selectedRequest.commitDuration}</Text>
                  </View>
                ) : null}

                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Date Submitted:</Text>
                  <Text style={styles.modalVal}>{fmtDate(selectedRequest.createdAt)}</Text>
                </View>

                {selectedRequest.message ? (
                  <View style={styles.messageBox}>
                    <Text style={styles.messageBoxTitle}>Applicant Note:</Text>
                    <Text style={styles.messageBoxText}>"{selectedRequest.message}"</Text>
                  </View>
                ) : null}
              </View>

              <TouchableOpacity
                style={styles.doneBtn}
                onPress={() => setSelectedRequest(null)}
              >
                <Text style={styles.doneBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
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
function RequestCard({ item, isAdvocate, onPress }) {
  const isAdoption = item.type === 'Adoption';
  const typeColor  = isAdoption ? COLORS.primaryDeep : '#B45309';
  const typeBg     = isAdoption ? COLORS.tagBg : '#FEF3DC';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
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
      <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} style={styles.cardChevron} />
    </TouchableOpacity>
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
    paddingTop: Platform.OS === 'ios' ? 52 : 28,
    paddingBottom: SIZES.sm8,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SIZES.md16,
  },
  headerTitle: { fontSize: SIZES.xxl, fontWeight: '800', color: COLORS.brown },
  headerSub:   { fontSize: SIZES.xs, color: COLORS.textSecondary, marginTop: 2, maxWidth: 240 },
  headerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.tagBg, paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: SIZES.radiusFull,
  },
  headerBadgeText: { fontSize: SIZES.xs, fontWeight: '800', color: COLORS.primaryDeep },

  // Segmented Tab bar
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.inputBg,
    borderRadius: SIZES.r12,
    padding: 3,
    marginBottom: SIZES.sm8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: SIZES.radius,
  },
  tabBtnActive: {
    backgroundColor: COLORS.surface,
    ...SHADOWS.card,
  },
  tabBtnText: {
    fontSize: SIZES.xs,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  tabBtnTextActive: {
    fontWeight: '800',
    color: COLORS.brown,
  },
  badge: {
    minWidth: 16, height: 16, borderRadius: 8,
    paddingHorizontal: 4,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeInactive: { backgroundColor: COLORS.border },
  badgeActive:   { backgroundColor: COLORS.primaryDeep },
  badgeText:     { fontSize: 9, fontWeight: '800', color: COLORS.textMuted },
  badgeTextActive: { color: '#fff' },

  // Sub-filter carousel
  subFilterContent: {
    gap: 6,
    paddingVertical: 4,
  },
  subFilterChip: {
    paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: SIZES.radiusFull, backgroundColor: COLORS.inputBg,
    borderWidth: 1, borderColor: COLORS.border,
  },
  subFilterChipActive: {
    backgroundColor: COLORS.tagBg, borderColor: COLORS.primaryLight,
  },
  subFilterText: { fontSize: SIZES.xs, color: COLORS.textMuted, fontWeight: '600' },
  subFilterTextActive: { color: COLORS.primaryDeep, fontWeight: '800' },

  // List
  list: { padding: SIZES.md16, paddingBottom: 110 },
  empty: { marginTop: SIZES.xl32 },

  // Shared card shell
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.r16,
    padding: SIZES.md16,
    marginBottom: SIZES.sm8 + 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardLeft: { marginRight: 12 },
  cardIconWrap: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
  },
  cardBody:    { flex: 1 },
  cardChevron: { marginLeft: SIZES.xs4, marginTop: 4 },

  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.xs4,
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
    marginBottom: 4,
  },
  cardMeta:    { fontSize: SIZES.xs, color: COLORS.textSecondary },
  cardMetaDot: { fontSize: SIZES.xs, color: COLORS.textMuted },
  cardDate:    { fontSize: SIZES.xsmall, color: COLORS.textMuted, marginTop: 4 },
  cardQuote:   {
    fontSize: SIZES.xs, color: COLORS.textSecondary,
    fontStyle: 'italic', lineHeight: 17,
    marginTop: 4, marginBottom: 2,
  },
  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: 4,
  },

  // Urgency
  urgencyPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: SIZES.radiusFull,
  },
  urgencyDot:  { width: 5, height: 5, borderRadius: 3 },
  urgencyText: { fontSize: SIZES.xsmall, fontWeight: '700' },

  // Request type pill
  typePill: {
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: SIZES.radiusFull,
  },
  typePillText: { fontSize: SIZES.xsmall, fontWeight: '700' },

  // Amount (donations)
  amountText: {
    fontSize: SIZES.medium, fontWeight: '900', color: COLORS.brown,
  },

  // Duration (foster)
  durationPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#FEF3DC',
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: SIZES.radiusFull, alignSelf: 'flex-start',
    marginTop: 4,
  },
  durationText: { fontSize: SIZES.xsmall, color: '#B45309', fontWeight: '600' },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: SIZES.lg24, paddingBottom: 36,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: COLORS.border, alignSelf: 'center', marginBottom: SIZES.md16,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: SIZES.md16,
  },
  modalIconWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.tagBg, alignItems: 'center', justifyContent: 'center',
  },
  modalTitle: { fontSize: SIZES.lg, fontWeight: '800', color: COLORS.brown },
  modalSub: { fontSize: SIZES.sm, color: COLORS.textSecondary },
  modalClose: { padding: 4 },
  modalBody: { gap: 12, marginBottom: SIZES.lg24 },
  modalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalLabel: { fontSize: SIZES.sm, color: COLORS.textMuted, fontWeight: '600' },
  modalVal: { fontSize: SIZES.sm, color: COLORS.brown, fontWeight: '700' },
  messageBox: {
    backgroundColor: COLORS.inputBg, borderRadius: SIZES.r12, padding: 12,
    marginTop: 4, borderWidth: 1, borderColor: COLORS.border,
  },
  messageBoxTitle: { fontSize: SIZES.xs, fontWeight: '700', color: COLORS.textMuted, marginBottom: 4 },
  messageBoxText: { fontSize: SIZES.sm, color: COLORS.brown, fontStyle: 'italic', lineHeight: 20 },
  doneBtn: {
    backgroundColor: COLORS.primaryDeep, borderRadius: SIZES.r12, paddingVertical: 12,
    alignItems: 'center',
  },
  doneBtnText: { fontSize: SIZES.body, fontWeight: '800', color: '#fff' },
});
