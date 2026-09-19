import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Dimensions, Platform, Modal, ScrollView, Image, StatusBar as RNStatusBar } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import StatusPill from '../../components/StatusPill';
import EmptyState from '../../components/EmptyState';

const W = Dimensions.get('window').width;

// ── Tab config (Clean, Professional Text Labels) ──────────────────────────────
const COMMUNITY_TABS = [
  { key: 'reports',   label: 'My Reports' },
  { key: 'requests',  label: 'My Requests' },
  { key: 'donations', label: 'Donations' },
];

const ADVOCATE_TABS = [
  { key: 'responses', label: 'Responses' },
  { key: 'requests',  label: 'Requests' },
  { key: 'animals',   label: 'My Animals' },
  { key: 'donations', label: 'Donations' },
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

      {/* ── Header Bar ────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: safeTopPadding }]}>
        <View style={styles.headerTop}>
          {navigation.canGoBack() && (
            <TouchableOpacity
              style={styles.headerBackBtn}
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={22} color="#473018" />
            </TouchableOpacity>
          )}
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle} numberOfLines={1}>Activity Dashboard</Text>
            <Text style={styles.headerSub} numberOfLines={1}>
              {isAdvocate ? 'Manage your rescue operations' : 'Track your reports, requests & contributions'}
            </Text>
          </View>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{rawData.length} Total</Text>
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
                <Text style={[styles.tabPillText, isActive && styles.tabPillTextActive]}>
                  {t.label} {count > 0 ? count : ''}
                </Text>
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
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>Request Details</Text>
                <TouchableOpacity onPress={() => setSelectedRequest(null)}>
                  <Ionicons name="close" size={20} color="#8C7D6A" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Type:</Text>
                  <Text style={styles.modalVal}>{selectedRequest.type || 'Adoption'}</Text>
                </View>

                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Status:</Text>
                  <StatusPill status={selectedRequest.status} />
                </View>

                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Animal:</Text>
                  <Text style={styles.modalVal}>{selectedRequest.animalName || 'Animal'}</Text>
                </View>

                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Date Submitted:</Text>
                  <Text style={styles.modalVal}>{fmtDate(selectedRequest.createdAt)}</Text>
                </View>

                {selectedRequest.message ? (
                  <View style={styles.messageBox}>
                    <Text style={styles.messageBoxTitle}>Note:</Text>
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

// ── Report / Response card (Renders User Animal Photo) ─────────────────────────
function ReportCard({ item, isAdvocate, navigation }) {
  const photoUri = item.photoUri || (Array.isArray(item.photos) && item.photos[0]) || item.image || item.photo || null;

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
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.cardThumbPhoto} resizeMode="cover" />
        ) : (
          <View style={styles.cardThumbFallback}>
            <Text style={styles.cardThumbInitials}>
              {item.animalType ? item.animalType.slice(0, 2).toUpperCase() : 'AL'}
            </Text>
          </View>
        )}
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

        {item.location?.address ? (
          <Text style={styles.cardMeta} numberOfLines={1}>
            {item.location.address}
          </Text>
        ) : null}

        <View style={styles.cardFooter}>
          <Text style={styles.urgencyText}>{item.urgency || 'Normal'} Priority</Text>
          <Text style={styles.cardDate}>{fmtDate(item.createdAt)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Request card ──────────────────────────────────────────────────────────────
function RequestCard({ item, isAdvocate, onPress }) {
  const photoUri = item.animalPhoto || item.photo || item.photoUri || (Array.isArray(item.photos) && item.photos[0]) || null;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
      <View style={styles.cardLeft}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.cardThumbPhoto} resizeMode="cover" />
        ) : (
          <View style={styles.cardThumbFallback}>
            <Text style={styles.cardThumbInitials}>
              {item.animalName ? item.animalName.slice(0, 2).toUpperCase() : 'RQ'}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.animalName || 'Animal Request'}</Text>
          <View style={styles.cardPillWrap}>
            <StatusPill status={item.status} />
          </View>
        </View>
        <View style={styles.cardMetaRow}>
          <Text style={styles.typeTagText}>{item.type || 'Request'}</Text>
          <Text style={styles.cardMeta} numberOfLines={1}>
            {isAdvocate ? `From: ${item.requesterName || 'Community Member'}` : `Advocate: ${item.advocateName || 'Advocate'}`}
          </Text>
        </View>
        {item.message ? (
          <Text style={styles.cardQuote} numberOfLines={2}>"{item.message}"</Text>
        ) : null}
        <View style={styles.cardFooter}>
          <Text style={styles.cardDate}>{fmtDate(item.createdAt)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Donation card ─────────────────────────────────────────────────────────────
function DonationCard({ item, isAdvocate, onVerify, onPreviewReceipt }) {
  const isPending = item.status === 'Pending';
  const hasProof = Boolean(item.proofPhoto);
  const photoUri = item.animalPhoto || item.photo || (hasProof ? item.proofPhoto : null);

  return (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.cardThumbPhoto} resizeMode="cover" />
        ) : (
          <View style={styles.cardThumbFallback}>
            <Text style={styles.cardThumbInitials}>₱</Text>
          </View>
        )}
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <Text style={styles.amountText} numberOfLines={1}>₱{Number(item.amount || 0).toLocaleString()}</Text>
          <View style={styles.cardPillWrap}>
            <StatusPill status={item.status} />
          </View>
        </View>
        <Text style={styles.cardSubTitle} numberOfLines={1}>{item.animalName || 'Rescue Support'}</Text>
        <View style={styles.cardMetaRow}>
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

        {hasProof ? (
          <TouchableOpacity
            style={styles.donationProofRow}
            onPress={() => onPreviewReceipt && onPreviewReceipt(item.proofPhoto)}
            activeOpacity={0.8}
          >
            <Image source={{ uri: item.proofPhoto }} style={styles.donationProofThumb} resizeMode="cover" />
            <View style={{ flex: 1, marginRight: 6 }}>
              <Text style={styles.donationProofLabel} numberOfLines={1}>Transfer Receipt</Text>
              <Text style={styles.donationProofSub} numberOfLines={1}>Tap to view screenshot</Text>
            </View>
          </TouchableOpacity>
        ) : null}

        {isAdvocate && isPending ? (
          <View style={styles.advocateDonationActions}>
            <TouchableOpacity
              style={styles.verifyDonationBtn}
              onPress={() => onVerify && onVerify(item.id, 'Verified')}
              activeOpacity={0.82}
            >
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
  const photoUri = item.photo || (Array.isArray(item.photos) && item.photos[0]) || null;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('AnimalDetail', { animalId: item.id })}
      activeOpacity={0.88}
    >
      <View style={styles.cardLeft}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.cardThumbPhoto} resizeMode="cover" />
        ) : (
          <View style={styles.cardThumbFallback}>
            <Text style={styles.cardThumbInitials}>
              {item.name ? item.name.slice(0, 2).toUpperCase() : 'PA'}
            </Text>
          </View>
        )}
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
        <View style={styles.cardFooter}>
          <Text style={styles.cardDate}>{fmtDate(item.createdAt)}</Text>
        </View>
      </View>
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
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FCF8E8' },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8DEC5',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerBackBtn: {
    marginRight: 8,
    padding: 2,
    flexShrink: 0,
  },
  headerTitleWrap: {
    flex: 1,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#473018',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  headerSub: {
    fontSize: 12,
    color: '#8C7D6A',
    fontFamily: 'PlusJakartaSans_500Medium',
    marginTop: 2,
  },
  headerBadge: {
    flexShrink: 0,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#EBF7FA',
    borderWidth: 1,
    borderColor: '#B8E4E5',
    alignSelf: 'center',
  },
  headerBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#2E7A99',
    fontFamily: 'PlusJakartaSans_700Bold',
  },

  // Scrollable Tab bar
  tabScrollView: {
    marginBottom: 6,
  },
  tabScrollContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
    paddingRight: 16,
  },
  tabPill: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8DEC5',
  },
  tabPillActive: {
    backgroundColor: '#2E7A99',
    borderColor: '#2E7A99',
  },
  tabPillText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#8C7D6A',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  tabPillTextActive: {
    color: '#FFFFFF',
  },

  // Sub-filter carousel
  subFilterContent: {
    gap: 6,
    paddingVertical: 4,
  },
  subFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: '#FCF8E8',
    borderWidth: 1,
    borderColor: '#E8DEC5',
  },
  subFilterChipActive: {
    backgroundColor: '#EBF7FA',
    borderColor: '#B8E4E5',
  },
  subFilterText: {
    fontSize: 11,
    color: '#8C7D6A',
    fontWeight: '600',
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  subFilterTextActive: {
    color: '#2E7A99',
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans_700Bold',
  },

  // List
  list: { padding: 16, paddingBottom: 100 },
  empty: { marginTop: 24 },

  // Shared card shell
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E8DEC5',
    shadowColor: '#473018',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardLeft: {
    marginRight: 12,
    flexShrink: 0,
  },
  cardThumbPhoto: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: '#E8DEC5',
  },
  cardThumbFallback: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: '#EBF7FA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#B8E4E5',
  },
  cardThumbInitials: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2E7A99',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
  },

  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: '#473018',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  cardSubTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#473018',
    fontFamily: 'PlusJakartaSans_700Bold',
    marginBottom: 4,
  },
  amountText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#473018',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
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
  cardMeta: {
    fontSize: 11.5,
    color: '#685038',
    fontFamily: 'PlusJakartaSans_400Regular',
  },
  typeTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2E7A99',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  cardQuote: {
    fontSize: 11,
    color: '#685038',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  urgencyText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#B45309',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  cardDate: {
    fontSize: 10.5,
    color: '#8C7D6A',
    fontFamily: 'PlusJakartaSans_400Regular',
  },

  donationProofRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FCF8E8',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E8DEC5',
  },
  donationProofThumb: {
    width: 32,
    height: 32,
    borderRadius: 6,
    marginRight: 8,
  },
  donationProofLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#473018',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  donationProofSub: {
    fontSize: 10,
    color: '#8C7D6A',
  },

  advocateDonationActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  verifyDonationBtn: {
    backgroundColor: '#306B4D',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  verifyDonationBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  rejectDonationBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D94F4F',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  rejectDonationBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D94F4F',
    fontFamily: 'PlusJakartaSans_700Bold',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#E8DEC5',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#473018',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  modalBody: {
    gap: 10,
    marginBottom: 16,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalLabel: {
    fontSize: 12,
    color: '#8C7D6A',
  },
  modalVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#473018',
  },
  messageBox: {
    backgroundColor: '#FCF8E8',
    padding: 10,
    borderRadius: 10,
    marginTop: 6,
  },
  messageBoxTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8C7D6A',
    marginBottom: 2,
  },
  messageBoxText: {
    fontSize: 12,
    color: '#473018',
    fontStyle: 'italic',
  },
  doneBtn: {
    backgroundColor: '#2E7A99',
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: 'center',
  },
  doneBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans_700Bold',
  },

  // Receipt Modal
  receiptModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  receiptModalCard: {
    backgroundColor: '#473018',
    borderRadius: 20,
    padding: 16,
    width: '100%',
    maxWidth: 340,
  },
  receiptModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  receiptModalTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  receiptFullImage: {
    width: '100%',
    height: 300,
    borderRadius: 10,
    backgroundColor: '#000000',
  },
  receiptCloseBtn: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 8,
  },
  receiptCloseBtnText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
