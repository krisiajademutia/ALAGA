import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  ActivityIndicator,
  Modal,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import EmptyState from '../../components/EmptyState';
import StatusPill from '../../components/StatusPill';
import { getUserProfileFirebase, getDefaultUserAvatar } from '../../services/authService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_CARD_WIDTH = (SCREEN_WIDTH - 44) / 2;

export default function PublicProfileScreen({ route, navigation }) {
  const {
    animals = [],
    rescueReports = [],
    currentUser,
    startConversation,
    getAnimalsByAdvocate,
  } = useApp();

  const currentUid = currentUser?.id || currentUser?.uid;
  const targetId = route?.params?.userId || route?.params?.advocateId;

  // Determine if this is the user viewing their own profile
  const isOwnProfile = Boolean(
    !targetId ||
    targetId === currentUid ||
    targetId === currentUser?.id ||
    targetId === currentUser?.uid ||
    (currentUser?.email && route?.params?.userEmail && currentUser.email.toLowerCase() === route?.params?.userEmail.toLowerCase())
  );

  const [fetchedUser, setFetchedUser] = useState(isOwnProfile ? currentUser : null);
  const [loadingUser, setLoadingUser] = useState(!isOwnProfile);
  const [activeTab, setActiveTab] = useState(0); // 0: Posted, 1: Rescued, 2: Payment (if advocate)
  const [viewQrModal, setViewQrModal] = useState(null); // URL of QR code to preview

  // Initial user fallback from route params while Firestore loads
  const fallbackUser = isOwnProfile
    ? currentUser
    : {
        id: targetId,
        name: route?.params?.userName || 'Community Member',
        avatar: route?.params?.userAvatar || null,
        role: route?.params?.userRole || 'community',
        location: route?.params?.userLocation || '',
        organization: route?.params?.userOrg || '',
        joinedAt: route?.params?.userJoinedAt || null,
      };

  useEffect(() => {
    if (isOwnProfile) {
      setFetchedUser(currentUser);
      setLoadingUser(false);
      return;
    }

    let isMounted = true;
    async function loadOtherUserProfile() {
      try {
        setLoadingUser(true);
        const profile = await getUserProfileFirebase(targetId);
        if (isMounted) {
          if (profile) {
            setFetchedUser(profile);
          } else {
            const matchReport = rescueReports.find((r) => r.reporterId === targetId || r.userId === targetId || r.responderId === targetId);
            const matchAnimal = animals.find((a) => a.advocateId === targetId);

            setFetchedUser({
              id: targetId,
              name: route?.params?.userName || matchReport?.reporterName || matchAnimal?.advocateName || 'Community Member',
              avatar: route?.params?.userAvatar || matchReport?.reporterAvatar || matchAnimal?.advocateAvatar || null,
              role: route?.params?.userRole || (matchAnimal ? 'advocate' : 'community'),
              location: matchReport?.location?.address ? matchReport.location.address.split(',')[0] : '',
              organization: matchAnimal?.advocateOrg || '',
              joinedAt: matchReport?.createdAt || matchAnimal?.createdAt || null,
            });
          }
          setLoadingUser(false);
        }
      } catch (e) {
        if (isMounted) setLoadingUser(false);
      }
    }

    if (targetId) {
      loadOtherUserProfile();
    }
    return () => { isMounted = false; };
  }, [targetId, isOwnProfile, currentUser]);

  const user = fetchedUser || fallbackUser;
  if (!user) return null;

  const isAdvocate = user.role === 'advocate';
  const effectiveUserId = isOwnProfile ? currentUid : targetId;

  // Filter ONLY public data — only show animals that are currently Available (not hidden/adopted)
  const userAnimals = effectiveUserId
    ? getAnimalsByAdvocate(effectiveUserId).filter((a) => a.status === 'Available')
    : [];
  const rescueCases = rescueReports.filter(
    (r) => (effectiveUserId && (r.reporterId === effectiveUserId || r.userId === effectiveUserId || r.responderId === effectiveUserId))
  );

  const pm = user.payoutMethods || {};
  const hasPaymentDetails = Boolean(
    pm.gcash?.accountNumber || pm.maya?.accountNumber || pm.bank?.accountNumber || pm.gcash?.qrPhoto || pm.maya?.qrPhoto
  );

  // Clean tabs setup (Instagram style)
  const tabs = [
    { key: 'posted', label: 'Posted Animals' },
    { key: 'rescued', label: 'Rescue Cases' },
    ...(hasPaymentDetails ? [{ key: 'support', label: 'Payment Details' }] : []),
  ];

  const handleMessage = () => {
    const messageTargetId = user.id || user.uid || targetId;
    const convId = startConversation(messageTargetId, user.name);
    navigation.navigate('Chat', {
      conversationId: convId,
      otherName: user.name,
      otherId: messageTargetId,
      otherAvatar: user.avatar,
      initialDraft: `Hi ${user.name}! I found your profile on ALAGA.`,
    });
  };

  const insets = useSafeAreaInsets();
  const safeTopPadding = Platform.OS === 'ios' ? Math.max(insets.top, 16) + 4 : (insets.top > 24 ? insets.top + 6 : 14);

  // Format valid org / location string (NO "N/A" text!)
  const metaDetails = [
    user.organization && user.organization !== 'N/A' ? user.organization : null,
    user.location && user.location !== 'N/A' ? user.location : null,
  ].filter(Boolean).join(' · ');

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* ── Top Header Bar ──────────────────────────────────── */}
      <View style={[styles.topBar, { paddingTop: safeTopPadding }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={22} color="#473018" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1}>
          {user.name ? `${user.name}'s Profile` : 'Member Profile'}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        
        {/* ── FB / IG Style Profile Header Card ───────────────── */}
        <View style={styles.profileHeaderCard}>
          
          {/* Avatar Circle */}
          <View style={styles.avatarWrap}>
            <Image
              source={{ uri: (user.avatar && typeof user.avatar === 'string' && user.avatar.trim().length > 0) ? user.avatar : getDefaultUserAvatar(user.name, user.id) }}
              style={styles.avatar}
            />
          </View>

          {/* User Name */}
          <Text style={styles.userName} numberOfLines={1}>{user.name || 'Community Member'}</Text>

          {/* Clean Role Badge */}
          <View style={[styles.roleBadge, { backgroundColor: isAdvocate ? '#EBF7FA' : '#F4EDE0' }]}>
            <Text style={[styles.roleBadgeText, { color: isAdvocate ? '#2E7A99' : '#8C7D6A' }]}>
              {isAdvocate ? 'Verified Animal Advocate' : 'Community Rescuer'}
            </Text>
          </View>

          {/* Org & Location Metadata Line (Clean, No "N/A") */}
          {metaDetails.length > 0 ? (
            <Text style={styles.metaLineText} numberOfLines={1}>{metaDetails}</Text>
          ) : null}

          {/* IG-Style Clean Stat Counters (No box borders) */}
          <View style={styles.igStatsRow}>
            <View style={styles.igStatItem}>
              <Text style={styles.igStatNum}>{userAnimals.length}</Text>
              <Text style={styles.igStatLabel}>Posted</Text>
            </View>
            <View style={styles.igStatDivider} />
            <View style={styles.igStatItem}>
              <Text style={styles.igStatNum}>{rescueCases.length}</Text>
              <Text style={styles.igStatLabel}>Rescued</Text>
            </View>
          </View>

          {/* Action Buttons Row (IG style) */}
          {!isOwnProfile ? (
            <View style={styles.actionBtnRow}>
              <TouchableOpacity style={styles.msgBtn} onPress={handleMessage} activeOpacity={0.85}>
                <Ionicons name="chatbubble" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.msgBtnText}>Message</Text>
              </TouchableOpacity>

              {hasPaymentDetails && (
                <TouchableOpacity
                  style={styles.supportBtn}
                  onPress={() => navigation.navigate('Donate', { advocateId: user.id || user.uid, advocateName: user.name })}
                  activeOpacity={0.85}
                >
                  <Ionicons name="heart" size={14} color="#2E7A99" style={{ marginRight: 6 }} />
                  <Text style={styles.supportBtnText}>Donate</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.previewTag}>
              <Ionicons name="eye-outline" size={12} color="#2E7A99" style={{ marginRight: 4 }} />
              <Text style={styles.previewTagText}>Public Profile Preview</Text>
            </View>
          )}
        </View>

        {/* ── IG-Style Tab Navigation Switcher ────────────────── */}
        <View style={styles.igTabBar}>
          {tabs.map((tab, idx) => {
            const isActive = activeTab === idx;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.igTabBtn, isActive && styles.igTabBtnActive]}
                onPress={() => setActiveTab(idx)}
                activeOpacity={0.75}
              >
                <Text style={[styles.igTabText, isActive && styles.igTabTextActive]} numberOfLines={1}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Tab Contents: Grid / Feed Items ──────────────────── */}
        <View style={styles.tabContentArea}>

          {/* TAB 0: Posted Animals Grid */}
          {activeTab === 0 && (
            userAnimals.length === 0 ? (
              <EmptyState
                icon="paw-outline"
                title="No posted animals"
                subtitle={`${user.name || 'This user'} hasn't posted any animals for adoption or foster yet.`}
                style={styles.emptyBox}
              />
            ) : (
              <View style={styles.gridContainer}>
                {userAnimals.map((animal) => (
                  <TouchableOpacity
                    key={animal.id}
                    style={styles.gridPetCard}
                    onPress={() => navigation.navigate('AnimalDetail', { animalId: animal.id })}
                    activeOpacity={0.88}
                  >
                    <Image
                      source={{ uri: animal.photo || animal.photos?.[0] || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400' }}
                      style={styles.gridPetImage}
                    />
                    <View style={styles.gridPetInfo}>
                      <Text style={styles.gridPetName} numberOfLines={1}>{animal.name}</Text>
                      <Text style={styles.gridPetSub} numberOfLines={1}>
                        {animal.breed || animal.species}
                      </Text>
                      <View style={styles.gridPetBadge}>
                        <Text style={styles.gridPetBadgeText} numberOfLines={1}>{animal.status || 'Available'}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )
          )}

          {/* TAB 1: Rescued Animals Feed Cards */}
          {activeTab === 1 && (
            rescueCases.length === 0 ? (
              <EmptyState
                icon="shield-outline"
                title="No rescue cases recorded"
                subtitle={`${user.name || 'This user'} hasn't recorded any animal rescue cases.`}
                style={styles.emptyBox}
              />
            ) : (
              <View style={styles.feedContainer}>
                {rescueCases.map((report) => (
                  <RescueFeedCard
                    key={report.id}
                    report={report}
                    onPress={() => navigation.navigate('ReportDetail', { reportId: report.id })}
                  />
                ))}
              </View>
            )
          )}

          {/* TAB 2: Payment & Support (Advocates only) */}
          {activeTab === 2 && (
            <View style={styles.paymentSection}>
              <Text style={styles.paymentSectionTitle}>Verified Donation Details</Text>

              {/* GCash */}
              {pm.gcash?.accountNumber || pm.gcash?.qrPhoto ? (
                <View style={styles.payoutCard}>
                  <View style={styles.payoutHeader}>
                    <Text style={styles.payoutBrandTitle}>GCash</Text>
                    <Text style={styles.payoutHolderName} numberOfLines={1}>
                      {pm.gcash.accountName || user.name}
                    </Text>
                  </View>
                  {pm.gcash.accountNumber ? (
                    <Text style={styles.payoutNumberText}>{pm.gcash.accountNumber}</Text>
                  ) : null}
                  {pm.gcash.qrPhoto ? (
                    <TouchableOpacity
                      style={styles.qrBtn}
                      onPress={() => setViewQrModal(pm.gcash.qrPhoto)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="qr-code-outline" size={14} color="#007DFE" />
                      <Text style={styles.qrBtnText}>View GCash QR Code</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : null}

              {/* Maya */}
              {pm.maya?.accountNumber || pm.maya?.qrPhoto ? (
                <View style={styles.payoutCard}>
                  <View style={styles.payoutHeader}>
                    <Text style={[styles.payoutBrandTitle, { color: '#1AAB5F' }]}>Maya</Text>
                    <Text style={styles.payoutHolderName} numberOfLines={1}>
                      {pm.maya.accountName || user.name}
                    </Text>
                  </View>
                  {pm.maya.accountNumber ? (
                    <Text style={styles.payoutNumberText}>{pm.maya.accountNumber}</Text>
                  ) : null}
                  {pm.maya.qrPhoto ? (
                    <TouchableOpacity
                      style={styles.qrBtn}
                      onPress={() => setViewQrModal(pm.maya.qrPhoto)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="qr-code-outline" size={14} color="#1AAB5F" />
                      <Text style={[styles.qrBtnText, { color: '#1AAB5F' }]}>View Maya QR Code</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : null}

              {/* Bank Transfer */}
              {pm.bank?.accountNumber ? (
                <View style={styles.payoutCard}>
                  <View style={styles.payoutHeader}>
                    <Text style={styles.payoutBrandTitle}>{pm.bank.bankName || 'Bank Transfer'}</Text>
                    <Text style={styles.payoutHolderName} numberOfLines={1}>
                      {pm.bank.accountName || user.name}
                    </Text>
                  </View>
                  <Text style={styles.payoutNumberText}>{pm.bank.accountNumber}</Text>
                </View>
              ) : null}
            </View>
          )}

        </View>
      </ScrollView>

      {/* ── QR Code Preview Modal ──────────────────────────── */}
      {viewQrModal ? (
        <Modal transparent animationType="fade" visible={Boolean(viewQrModal)} onRequestClose={() => setViewQrModal(null)}>
          <View style={styles.qrModalOverlay}>
            <TouchableOpacity style={styles.qrModalBackdrop} onPress={() => setViewQrModal(null)} activeOpacity={1} />
            <View style={styles.qrModalCard}>
              <TouchableOpacity style={styles.qrModalCloseBtn} onPress={() => setViewQrModal(null)}>
                <Ionicons name="close" size={20} color="#473018" />
              </TouchableOpacity>
              <Text style={styles.qrModalTitle}>Scan QR Code to Support</Text>
              <Image source={{ uri: viewQrModal }} style={styles.qrFullImg} resizeMode="contain" />
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

// FB/IG Feed Card Component for Rescue Cases
function RescueFeedCard({ report, onPress }) {
  const photoUri = report.photoUri || (Array.isArray(report.photos) && report.photos[0]) || report.image || null;

  return (
    <TouchableOpacity style={styles.feedCard} onPress={onPress} activeOpacity={0.9}>
      {photoUri ? (
        <Image source={{ uri: photoUri }} style={styles.feedCardImage} resizeMode="cover" />
      ) : null}
      <View style={styles.feedCardContent}>
        <View style={styles.feedCardHeaderRow}>
          <Text style={styles.feedCardTitle} numberOfLines={1}>
            {report.animalType || 'Animal Rescue'}
          </Text>
          <StatusPill status={report.status} />
        </View>

        <Text style={styles.feedCardCondition} numberOfLines={2}>
          {report.condition || 'Emergency rescue report'}
        </Text>

        {report.location?.address ? (
          <View style={styles.feedCardLocationRow}>
            <Ionicons name="location-outline" size={12} color="#8C7D6A" style={{ marginRight: 4 }} />
            <Text style={styles.feedCardLocationText} numberOfLines={1}>
              {report.location.address}
            </Text>
          </View>
        ) : null}

        <Text style={styles.feedCardDate}>{fmtDate(report.createdAt)}</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8DEC5',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FCF8E8',
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#473018',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  scroll: {
    paddingBottom: 60,
  },

  // Profile Header Card (FB/IG Style)
  profileHeaderCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingTop: 20,
    paddingBottom: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8DEC5',
  },
  avatarWrap: {
    marginBottom: 10,
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 2,
    borderColor: '#E8DEC5',
    backgroundColor: '#E8DEC5',
  },
  avatarPlaceholder: {
    backgroundColor: '#B8E4E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: '800',
    color: '#473018',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#473018',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    marginBottom: 4,
    textAlign: 'center',
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 6,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  metaLineText: {
    fontSize: 12,
    color: '#8C7D6A',
    fontFamily: 'PlusJakartaSans_500Medium',
    marginBottom: 12,
    textAlign: 'center',
  },

  // IG-Style Stat Counter Bar
  igStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 16,
    paddingVertical: 6,
  },
  igStatItem: {
    alignItems: 'center',
  },
  igStatNum: {
    fontSize: 18,
    fontWeight: '800',
    color: '#473018',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  igStatLabel: {
    fontSize: 11,
    color: '#8C7D6A',
    fontFamily: 'PlusJakartaSans_500Medium',
    marginTop: 1,
  },
  igStatDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E8DEC5',
  },

  // Action Buttons (IG style)
  actionBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  msgBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E7A99',
    paddingHorizontal: 22,
    paddingVertical: 9,
    borderRadius: 20,
  },
  msgBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  supportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#2E7A99',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
  },
  supportBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2E7A99',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  previewTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF7FA',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  previewTagText: {
    fontSize: 11,
    color: '#2E7A99',
    fontWeight: '600',
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },

  // IG-Style Tab Navigation Bar
  igTabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8DEC5',
  },
  igTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  igTabBtnActive: {
    borderBottomColor: '#2E7A99',
  },
  igTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8C7D6A',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  igTabTextActive: {
    color: '#2E7A99',
  },

  tabContentArea: {
    paddingTop: 14,
  },
  emptyBox: {
    marginHorizontal: 16,
    marginTop: 12,
  },

  // 2-Column Grid Layout for Animals Posted
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 16,
  },
  gridPetCard: {
    width: GRID_CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8DEC5',
    shadowColor: '#473018',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  gridPetImage: {
    width: '100%',
    height: 125,
    backgroundColor: '#E8DEC5',
  },
  gridPetInfo: {
    padding: 10,
  },
  gridPetName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#473018',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    marginBottom: 2,
  },
  gridPetSub: {
    fontSize: 11,
    color: '#8C7D6A',
    fontFamily: 'PlusJakartaSans_500Medium',
    marginBottom: 6,
  },
  gridPetBadge: {
    backgroundColor: '#EBF7FA',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  gridPetBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2E7A99',
    fontFamily: 'PlusJakartaSans_700Bold',
  },

  // Feed Container for Rescue Cases
  feedContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  feedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8DEC5',
    shadowColor: '#473018',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  feedCardImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#E8DEC5',
  },
  feedCardContent: {
    padding: 12,
  },
  feedCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  feedCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#473018',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    flex: 1,
  },
  feedCardCondition: {
    fontSize: 12,
    color: '#685038',
    fontFamily: 'PlusJakartaSans_500Medium',
    marginBottom: 6,
  },
  feedCardLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  feedCardLocationText: {
    fontSize: 11,
    color: '#8C7D6A',
    flex: 1,
  },
  feedCardDate: {
    fontSize: 10,
    color: '#8C7D6A',
  },

  // Payment Section
  paymentSection: {
    paddingHorizontal: 16,
  },
  paymentSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#473018',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    marginBottom: 10,
  },
  payoutCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8DEC5',
    marginBottom: 10,
  },
  payoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  payoutBrandTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#007DFE',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  payoutHolderName: {
    fontSize: 12,
    color: '#685038',
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  payoutNumberText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#473018',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  qrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  qrBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#007DFE',
    fontFamily: 'PlusJakartaSans_700Bold',
  },

  // QR Modal
  qrModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  qrModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  qrModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    position: 'relative',
  },
  qrModalCloseBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FCF8E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrModalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#473018',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    marginBottom: 14,
    marginTop: 4,
  },
  qrFullImg: {
    width: 200,
    height: 200,
    borderRadius: 10,
  },
});
