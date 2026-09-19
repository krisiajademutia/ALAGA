import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Dimensions, Platform, Modal, ScrollView, Image, StatusBar as RNStatusBar } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  { key: 'donations', label: 'Donations',  icon: 'gift-outline',             iconActive: 'gift' },
];

export default function ActivityScreen({ route, navigation }) {
  const {
    currentUser,
    getUserReports, getAdvocateResponses,
    getUserRequests, getAdvocateRequests,
    getAdvocateAnimals, getUserDonations,
    getAdvocateDonations, verifyDonation,
    showAlert,
  } = useApp();

  const isAdvocate = currentUser?.role === 'advocate';
  const TABS = isAdvocate ? ADVOCATE_TABS : COMMUNITY_TABS;
  const initialTab = route?.params?.tab || TABS[0].key;
  const [activeTab, setActiveTab] = useState(initialTab);
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [previewReceiptUrl, setPreviewReceiptUrl] = useState(null);

  React.useEffect(() => {
    if (route?.params?.tab) {
      setActiveTab(route.params.tab);
      setStatusFilter('All');
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
      if (activeTab === 'donations') return getAdvocateDonations ? getAdvocateDonations() : [];
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
      return (
        <DonationCard
          item={item}
          isAdvocate={isAdvocate}
          onVerify={(donationId, status) => {
            if (showAlert) {
              const isApprove = status === 'Verified';
              showAlert({
                title: isApprove ? 'Verify Donation' : 'Reject Donation',
                message: isApprove
                  ? `Confirm receipt of ₱${Number(item.amount || 0).toLocaleString()} for ${item.animalName || 'ALAGA'}? This will notify ${item.donorName || 'the donor'}.`
                  : `Mark this donation as rejected?`,
                type: isApprove ? 'info' : 'warning',
                customIcon: isApprove ? 'gift' : 'alert-circle',
                secondaryText: 'Cancel',
                primaryText: isApprove ? 'Confirm Verified' : 'Confirm Reject',
                onPrimaryPress: () => {
                  verifyDonation(donationId, status);
                },
              });
            } else {
              verifyDonation(donationId, status);
            }
          }}
          onPreviewReceipt={(url) => setPreviewReceiptUrl(url)}
        />
      );
    }
    if (activeTab === 'animals') {
      return <AnimalCard item={item} navigation={navigation} />;
    }
    return null;
  };

  const insets = useSafeAreaInsets();
  const safeTopPadding = Platform.OS === 'ios' ? Math.max(insets.top, 16) + 4 : (insets.top > 24 ? insets.top + 6 : 14);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* ── Header ──────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: safeTopPadding }]}>
        <View style={styles.headerTop}>
          {navigation.canGoBack() && (
            <TouchableOpacity
              style={styles.headerBackBtn}
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={22} color={COLORS.brown} />
            </TouchableOpacity>
          )}
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Activity Dashboard</Text>
            <Text style={styles.headerSub}>
              {isAdvocate ? 'Track & manage your rescue operations' : 'Track your reports, requests & contributions'}
            </Text>
          </View>
          <View style={styles.headerBadge}>
            <Ionicons name="time" size={15} color={COLORS.primaryDeep} style={{ flexShrink: 0 }} />
            <Text style={styles.headerBadgeText}>{rawData.length} total</Text>
          </View>
        </View>

        {/* Scrollable Tab Navigation */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabScrollView}
          contentContainerStyle={styles.tabScrollContainer}
        >
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
                if (t.key === 'donations') return getAdvocateDonations ? getAdvocateDonations().length : 0;
              }
              return 0;
            })();

            return (
              <TouchableOpacity
                key={t.key}
                style={[styles.tabPill, isActive && styles.tabPillActive]}
                onPress={() => {
                  setActiveTab(t.key);
                  setStatusFilter('All');
                }}
                activeOpacity={0.78}
              >
                <Ionicons
                  name={isActive ? t.iconActive : t.icon}
                  size={15}
                  color={isActive ? '#FFFFFF' : COLORS.textSecondary}
                  style={styles.tabIcon}
                />
                <Text style={[styles.tabPillText, isActive && styles.tabPillTextActive]}>
                  {t.label}
                </Text>
                {count > 0 && (
                  <View style={[styles.tabBadge, isActive ? styles.tabBadgeActive : styles.tabBadgeInactive]}>
                    <Text style={[styles.tabBadgeText, isActive && styles.tabBadgeTextActive]}>{count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

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

      {/* ── Receipt Proof Modal ──────────────────────────────── */}
      {Boolean(previewReceiptUrl) && (
        <Modal
          visible={Boolean(previewReceiptUrl)}
          transparent
          animationType="fade"
          onRequestClose={() => setPreviewReceiptUrl(null)}
        >
          <View style={styles.receiptModalOverlay}>
            <View style={styles.receiptModalCard}>
              <View style={styles.receiptModalHeader}>
                <Text style={styles.receiptModalTitle}>Payment Transfer Receipt</Text>
                <TouchableOpacity onPress={() => setPreviewReceiptUrl(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              <Image
                source={{ uri: previewReceiptUrl }}
                style={styles.receiptFullImage}
                resizeMode="contain"
              />
              <TouchableOpacity
                style={styles.receiptCloseBtn}
                onPress={() => setPreviewReceiptUrl(null)}
              >
                <Text style={styles.receiptCloseBtnText}>Close Preview</Text>
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
            {item.animalType || 'Animal'} · {item.condition || 'Rescue Alert'}
          </Text>
          <View style={styles.cardPillWrap}>
            <StatusPill status={item.status} />
          </View>
        </View>
        <View style={styles.cardMetaRow}>
          <Ionicons name="location-outline" size={13} color={COLORS.textMuted} style={styles.cardMetaIcon} />
          <Text style={styles.cardMeta} numberOfLines={1}>
            {item.location?.address || 'No location specified'}
          </Text>
        </View>
        <View style={styles.cardFooter}>
          <View style={[styles.urgencyPill, { backgroundColor: urgencyColor + '18' }]}>
            <View style={[styles.urgencyDot, { backgroundColor: urgencyColor }]} />
            <Text style={[styles.urgencyText, { color: urgencyColor }]}>{item.urgency || 'Normal'}</Text>
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
          <Text style={styles.cardTitle} numberOfLines={1}>{item.animalName || 'Animal Request'}</Text>
          <View style={styles.cardPillWrap}>
            <StatusPill status={item.status} />
          </View>
        </View>
        <View style={styles.cardMetaRow}>
          <View style={[styles.typePill, { backgroundColor: typeBg }]}>
            <Text style={[styles.typePillText, { color: typeColor }]}>{item.type || 'Request'}</Text>
          </View>
          <Text style={styles.cardMeta} numberOfLines={1}>
            {isAdvocate ? `From: ${item.requesterName || 'Community Member'}` : `Via: ${item.advocateName || item.advocateId || 'Advocate'}`}
          </Text>
        </View>
        {item.commitDuration ? (
          <View style={styles.durationPill}>
            <Ionicons name="time-outline" size={11} color="#B45309" style={{ flexShrink: 0 }} />
            <Text style={styles.durationText} numberOfLines={1}>Commit: {item.commitDuration}</Text>
          </View>
        ) : null}
        {item.message ? (
          <Text style={styles.cardQuote} numberOfLines={2}>"{item.message}"</Text>
        ) : null}
        <View style={styles.cardFooter}>
          <Text style={styles.cardDate}>{fmtDate(item.createdAt)}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} style={styles.cardChevron} />
    </TouchableOpacity>
  );
}

// ── Donation card ─────────────────────────────────────────────────────────────
function DonationCard({ item, isAdvocate, onVerify, onPreviewReceipt }) {
  const isPending = item.status === 'Pending';
  const hasProof = Boolean(item.proofPhoto);

  return (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={[styles.cardIconWrap, { backgroundColor: item.status === 'Verified' ? '#E8F5EE' : COLORS.advocateBadge }]}>
          <Ionicons
            name={item.status === 'Verified' ? 'shield-checkmark' : 'gift'}
            size={20}
            color={item.status === 'Verified' ? '#2D9E5F' : COLORS.secondaryDark}
          />
        </View>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <Text style={styles.amountText} numberOfLines={1}>₱{Number(item.amount || 0).toLocaleString()}</Text>
          <View style={styles.cardPillWrap}>
            <StatusPill status={item.status} />
          </View>
        </View>
        <Text style={styles.cardSubTitle} numberOfLines={1}>{item.animalName || 'Rescue Patient Care'}</Text>
        {isAdvocate && item.donorName ? (
          <View style={styles.cardMetaRow}>
            <Ionicons name="person-outline" size={12} color={COLORS.textMuted} style={styles.cardMetaIcon} />
            <Text style={styles.cardMeta} numberOfLines={1}>
              From: <Text style={{ fontWeight: '700', color: COLORS.brown }}>{item.donorName}</Text>
            </Text>
          </View>
        ) : null}
        <View style={styles.cardMetaRow}>
          <Ionicons name="card-outline" size={13} color={COLORS.textMuted} style={styles.cardMetaIcon} />
          <Text style={styles.cardMeta} numberOfLines={1}>
            {item.method || 'Payment'}{item.referenceNumber ? ` · Ref: ${item.referenceNumber}` : ''}
          </Text>
        </View>
        {item.message ? (
          <Text style={styles.cardQuote} numberOfLines={2}>"{item.message}"</Text>
        ) : null}
        <View style={styles.cardFooter}>
          <Text style={styles.cardDate}>{fmtDate(item.createdAt)}</Text>
        </View>

        {/* Proof of Payment Thumbnail if attached */}
        {hasProof ? (
          <TouchableOpacity
            style={styles.donationProofRow}
            onPress={() => onPreviewReceipt && onPreviewReceipt(item.proofPhoto)}
            activeOpacity={0.8}
          >
            <Image source={{ uri: item.proofPhoto }} style={styles.donationProofThumb} resizeMode="cover" />
            <View style={{ flex: 1, marginRight: 6 }}>
              <Text style={styles.donationProofLabel} numberOfLines={1}>Transfer Receipt Attached</Text>
              <Text style={styles.donationProofSub} numberOfLines={1}>Tap to inspect full screenshot</Text>
            </View>
            <Ionicons name="eye-outline" size={16} color={COLORS.primaryDeep} style={{ flexShrink: 0 }} />
          </TouchableOpacity>
        ) : null}

        {/* Advocate verification action buttons */}
        {isAdvocate && isPending ? (
          <View style={styles.advocateDonationActions}>
            <TouchableOpacity
              style={styles.verifyDonationBtn}
              onPress={() => onVerify && onVerify(item.id, 'Verified')}
              activeOpacity={0.82}
            >
              <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" style={{ marginRight: 6, flexShrink: 0 }} />
              <Text style={styles.verifyDonationBtnText}>Verify Donation</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.rejectDonationBtn}
              onPress={() => onVerify && onVerify(item.id, 'Rejected')}
              activeOpacity={0.82}
            >
              <Text style={styles.rejectDonationBtnText}>Reject</Text>
            </TouchableOpacity>
          </View>
        ) : null}
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
          <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
          <View style={styles.cardPillWrap}>
            <StatusPill status={item.status} />
          </View>
        </View>
        <Text style={styles.cardMeta} numberOfLines={1}>
          {[item.species, item.breed, item.gender].filter(Boolean).join(' · ')}
        </Text>
        {item.fosterDuration && (item.listingType === 'Foster' || item.listingType === 'Both') ? (
          <View style={styles.durationPill}>
            <Ionicons name="time-outline" size={11} color="#B45309" style={{ flexShrink: 0 }} />
            <Text style={styles.durationText} numberOfLines={1}>Foster: {item.fosterDuration}</Text>
          </View>
        ) : null}
        <View style={styles.cardFooter}>
          <Text style={styles.cardDate}>{fmtDate(item.createdAt)}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} style={styles.cardChevron} />
    </TouchableOpacity>
  );
}

function fmtDate(val) {
  if (!val) return '';
  let d = null;
  if (typeof val?.toDate === 'function') {
    d = val.toDate();
  } else if (typeof val?.toMillis === 'function') {
    d = new Date(val.toMillis());
  } else if (typeof val === 'number') {
    d = new Date(val);
  } else if (val?.seconds) {
    d = new Date(val.seconds * 1000);
  } else if (typeof val === 'string') {
    d = new Date(val);
  }
  if (!d || isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-PH', { dateStyle: 'medium' });
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },

  // Header
  header: {
    paddingHorizontal: SIZES.lg24,
    paddingBottom: SIZES.sm8,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SIZES.md16,
  },
  headerBackBtn: {
    marginRight: 10,
    padding: 2,
    flexShrink: 0,
  },
  headerTitleWrap: {
    flex: 1,
    marginRight: SIZES.sm8,
  },
  headerTitle: { fontSize: SIZES.xxl, fontWeight: '800', color: COLORS.brown },
  headerSub:   { fontSize: SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
  headerBadge: {
    flexShrink: 0,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.tagBg, paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: SIZES.radiusFull,
  },
  headerBadgeText: { fontSize: SIZES.xs, fontWeight: '800', color: COLORS.primaryDeep },

  // Scrollable Tab bar
  tabScrollView: {
    marginBottom: SIZES.sm8,
  },
  tabScrollContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
    paddingRight: SIZES.md16,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabPillActive: {
    backgroundColor: COLORS.primaryDeep,
    borderColor: COLORS.primaryDeep,
    ...SHADOWS.sm,
  },
  tabIcon: {
    flexShrink: 0,
  },
  tabPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.brown,
  },
  tabPillTextActive: {
    color: '#FFFFFF',
  },
  tabBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  tabBadgeInactive: {
    backgroundColor: COLORS.tagBg,
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primaryDeep,
  },
  tabBadgeTextActive: {
    color: '#FFFFFF',
  },

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
  cardLeft: {
    marginRight: 12,
    flexShrink: 0,
  },
  cardIconWrap: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
  },
  cardChevron: {
    marginLeft: SIZES.xs4,
    marginTop: 4,
    flexShrink: 0,
  },

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
  cardSubTitle: {
    fontSize: SIZES.body,
    fontWeight: '700',
    color: COLORS.brown,
    marginBottom: 4,
  },
  cardPillWrap: {
    flexShrink: 0,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  cardMetaIcon: {
    flexShrink: 0,
  },
  cardMeta: {
    flex: 1,
    fontSize: SIZES.xs,
    color: COLORS.textSecondary,
  },
  cardMetaDot: {
    fontSize: SIZES.xs,
    color: COLORS.textMuted,
    flexShrink: 0,
  },
  cardDate: {
    fontSize: SIZES.xsmall,
    color: COLORS.textMuted,
  },
  cardQuote: {
    fontSize: SIZES.xs,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    lineHeight: 17,
    marginTop: 4,
    marginBottom: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },

  // Urgency
  urgencyPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: SIZES.radiusFull,
    flexShrink: 0,
  },
  urgencyDot:  { width: 5, height: 5, borderRadius: 3 },
  urgencyText: { fontSize: SIZES.xsmall, fontWeight: '700' },

  // Request type pill
  typePill: {
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: SIZES.radiusFull,
    flexShrink: 0,
  },
  typePillText: { fontSize: SIZES.xsmall, fontWeight: '700' },

  // Amount (donations)
  amountText: {
    flex: 1,
    fontSize: SIZES.medium,
    fontWeight: '900',
    color: COLORS.brown,
  },

  // Duration (foster)
  durationPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FEF3DC',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: SIZES.radiusFull, alignSelf: 'flex-start',
    marginTop: 2,
    marginBottom: 4,
  },
  durationText: { fontSize: SIZES.xsmall, color: '#B45309', fontWeight: '600' },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(45, 31, 18, 0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 38 : 24,
    borderTopWidth: 1,
    borderColor: '#E8DFC8',
  },
  modalHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E8DFC8',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  modalIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EBF7FA',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#473018',
  },
  modalSub: {
    fontSize: 12,
    color: '#685038',
    marginTop: 2,
  },
  modalClose: {
    padding: 4,
    flexShrink: 0,
  },
  modalBody: {
    gap: 12,
    marginBottom: 20,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  modalLabel: {
    fontSize: 13,
    color: '#8C7D6A',
    fontWeight: '600',
    flexShrink: 0,
  },
  modalVal: {
    fontSize: 13,
    color: '#473018',
    fontWeight: '700',
    flexShrink: 1,
    textAlign: 'right',
  },
  messageBox: {
    backgroundColor: '#FFFDF6',
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#E8DFC8',
  },
  messageBoxTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8C7D6A',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  messageBoxText: {
    fontSize: 13,
    color: '#473018',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  doneBtn: {
    backgroundColor: '#92CDE5',
    borderRadius: 14,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  doneBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#473018',
  },

  // ── Donation proof and advocate actions ─────────────────
  donationProofRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FA',
    borderWidth: 1,
    borderColor: '#C5E2EE',
    borderRadius: 12,
    padding: 8,
    marginTop: 10,
    gap: 10,
  },
  donationProofThumb: {
    width: 38,
    height: 38,
    borderRadius: 6,
    flexShrink: 0,
  },
  donationProofLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2E7A99',
  },
  donationProofSub: {
    fontSize: 10.5,
    color: '#8C7D6A',
  },
  advocateDonationActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  verifyDonationBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2D9E5F',
    paddingVertical: 9,
    borderRadius: 12,
  },
  verifyDonationBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  rejectDonationBtn: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#FDE8E7',
    flexShrink: 0,
  },
  rejectDonationBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#D93025',
  },

  // ── Receipt Modal ───────────────────────────────────────
  receiptModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  receiptModalCard: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
  },
  receiptModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  receiptModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  receiptFullImage: {
    width: '100%',
    height: 380,
    borderRadius: 12,
    marginBottom: 16,
  },
  receiptCloseBtn: {
    backgroundColor: '#2E7A99',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  receiptCloseBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
