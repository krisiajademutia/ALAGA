import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  StatusBar as RNStatusBar,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import Avatar from '../../components/Avatar';
import MapCard from '../../components/MapCard';
import StatusPill from '../../components/StatusPill';
import { URGENCY_LEVELS } from '../../data/mockData';
import { getDistanceInKm } from '../../services/notificationService';

function countComments(comments = []) {
  let count = 0;
  (comments || []).forEach((c) => {
    count += 1;
    if (Array.isArray(c.replies)) count += countComments(c.replies);
  });
  return count;
}

function fmtAgo(iso) {
  if (!iso) return '';
  const s = (Date.now() - new Date(iso)) / 1000;
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function RescueAlertDetailScreen({ route, navigation }) {
  const { reportId } = route.params || {};
  const {
    rescueReports,
    currentUser,
    addComment,
    respondToReport,
    markRescued,
    updateRescueReportUrgency,
    deleteRescueReport,
    startConversation,
    showAlert,
  } = useApp();

  const report = rescueReports.find((r) => r.id === reportId) || null;
  const [commentText, setCommentText] = useState('');
  const [replyTarget, setReplyTarget] = useState(null);
  const [isFav, setIsFav] = useState(false);
  const [previewImageIndex, setPreviewImageIndex] = useState(null);
  const [urgencyModalVisible, setUrgencyModalVisible] = useState(false);
  const isAdvocate = currentUser?.role === 'advocate';

  if (!report) {
    return (
      <View style={[styles.flex, { alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#FFF' }]}>
        <Ionicons name="shield-outline" size={48} color={COLORS.border} />
        <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.brown, marginTop: 12 }}>Report Not Found</Text>
        <Text style={{ fontSize: 13, color: COLORS.textMuted, textAlign: 'center', marginTop: 4, marginBottom: 16 }}>
          This rescue alert has been resolved or removed.
        </Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ paddingHorizontal: 20, paddingVertical: 10, backgroundColor: COLORS.primary, borderRadius: 12 }}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isAuthor = Boolean(
    currentUser && (
      currentUser.id === report?.reporterId ||
      (currentUser.email && report?.reporterEmail && currentUser.email.toLowerCase() === report?.reporterEmail.toLowerCase())
    )
  );
  const canDelete = isAuthor || isAdvocate;

  const handleDeleteReport = () => {
    showAlert({
      title: 'Delete Rescue Report?',
      message: 'Are you sure you want to delete this rescue report? All related alerts will also be removed.',
      type: 'warning',
      customIcon: 'trash-outline',
      secondaryText: 'Cancel',
      primaryText: 'Delete',
      onPrimaryPress: async () => {
        await deleteRescueReport(reportId);
        navigation.goBack();
      },
    });
  };

  const photosList = (report?.photos && report.photos.length > 0)
    ? report.photos
    : (report?.photo ? [report.photo] : []);

  const isRescued = report?.status === 'Rescued' || report?.urgency === 'Closed' || Boolean(report?.rescuedAt);
  const effectiveUrgency = isRescued ? 'Closed' : (report?.urgency || 'High');

  const urgencyObj =
    URGENCY_LEVELS.find(
      (u) => u.label.toLowerCase() === effectiveUrgency.toLowerCase()
    ) || (isRescued ? { label: 'Closed', color: '#4B5563', bg: '#F3F4F6' } : { label: 'High', color: '#D94F4F', bg: '#FDEEEB' });

  const distanceKm = React.useMemo(() => {
    const rLat = report?.location?.latitude;
    const rLng = report?.location?.longitude;
    const uLat = currentUser?.latitude || currentUser?.locationCoordinates?.latitude;
    const uLng = currentUser?.longitude || currentUser?.locationCoordinates?.longitude;
    if (rLat && rLng && uLat && uLng) {
      return getDistanceInKm(uLat, uLng, rLat, rLng);
    }
    return null;
  }, [report?.location, currentUser]);

  const detailTags = React.useMemo(() => {
    if (!report) return [];
    const tags = [];
    if (typeof report.animalType === 'string' && report.animalType.trim()) {
      tags.push({
        id: 'animalType',
        icon: 'paw',
        label: 'Animal',
        value: report.animalType.trim(),
        color: '#2E7A99',
        bg: '#EAF4F8',
      });
    }
    if (typeof report.condition === 'string' && report.condition.trim()) {
      tags.push({
        id: 'condition',
        icon: 'medical',
        label: 'Condition',
        value: report.condition.trim(),
        color: '#D97706',
        bg: '#FEF3C7',
      });
    }
    if (
      typeof report.gender === 'string' &&
      report.gender.trim() &&
      report.gender.toLowerCase() !== 'unknown'
    ) {
      tags.push({
        id: 'gender',
        icon: 'male-female',
        label: 'Gender',
        value: report.gender.trim(),
        color: '#7C3AED',
        bg: '#F3E8FF',
      });
    }
    if (
      typeof report.breed === 'string' &&
      report.breed.trim() &&
      report.breed.toLowerCase() !== 'unknown'
    ) {
      tags.push({
        id: 'breed',
        icon: 'pricetag',
        label: 'Breed',
        value: report.breed.trim(),
        color: '#786854',
        bg: '#F5EFE6',
      });
    }
    if (
      typeof report.age === 'string' &&
      report.age.trim() &&
      report.age.toLowerCase() !== 'unknown'
    ) {
      tags.push({
        id: 'age',
        icon: 'time',
        label: 'Age',
        value: report.age.trim(),
        color: '#786854',
        bg: '#F5EFE6',
      });
    }
    return tags;
  }, [report]);

  const insets = useSafeAreaInsets();
  const safeTop =
    Math.max(
      insets.top,
      Platform.OS === 'android' ? RNStatusBar.currentHeight || 0 : 12
    ) + 6;

  if (!report) return null;

  const isResponder = currentUser?.id === report?.responderId;

  const handleRespond = () => {
    showAlert({
      title: 'Respond to Rescue',
      message: `Are you willing to assist ${report.reporterName || 'the reporter'} with this ${report.animalType || 'animal'}?`,
      type: 'info',
      customIcon: 'paw',
      secondaryText: 'Cancel',
      primaryText: "Yes, I'll Help!",
      onPrimaryPress: () => {
        respondToReport(report.id);
        setTimeout(() => {
          showAlert({
            title: 'Rescue Claimed! 🐾',
            message: `You are now registered as responding to this case.\n\nCoordinate landmarks, animal condition, or arrival time with ${report.reporterName || 'the reporter'}?`,
            type: 'success',
            customIcon: 'paw',
            secondaryText: 'Stay Here',
            primaryText: 'Chat with Reporter',
            onPrimaryPress: handleMessageAdvocate,
          });
        }, 300);
      },
    });
  };

  const handleMarkRescued = () => {
    showAlert({
      title: 'Mark as Rescued',
      message: 'Confirm that this animal has been successfully and safely rescued?',
      type: 'warning',
      customIcon: 'checkmark-circle',
      secondaryText: 'Cancel',
      primaryText: 'Confirm Rescued',
      onPrimaryPress: () => {
        markRescued(report.id);
        setTimeout(() => {
          showAlert({
            title: 'Success 🎉',
            message: 'This case has been marked as safely rescued!',
            type: 'success',
            customIcon: 'paw',
            primaryText: 'Great!',
          });
        }, 300);
      },
    });
  };

  const handleMessageAdvocate = () => {
    const convId = startConversation(
      report.reporterId,
      report.reporterName
    );
    navigation.navigate('Chat', {
      conversationId: convId,
      otherName: report.reporterName,
      otherId: report.reporterId,
      initialDraft: `Hi ${report.reporterName || ''}! I am responding to your rescue alert for the ${report.animalType || 'animal'}. I am on my way to help!`,
      linkedReport: report,
    });
  };

  const handleChatWithResponder = () => {
    if (!report?.responderId) return;
    const convId = startConversation(
      report.responderId,
      report.responderName || 'Advocate'
    );
    navigation.navigate('Chat', {
      conversationId: convId,
      otherName: report.responderName || 'Advocate',
      otherId: report.responderId,
      otherAvatar: report.responderAvatar,
      initialDraft: `Hi ${report.responderName || ''}! I am reaching out regarding the rescue alert for the ${report.animalType || 'animal'}.`,
      linkedReport: report,
    });
  };

  const handleSendComment = () => {
    if (!commentText.trim()) return;
    addComment(report.id, commentText.trim(), replyTarget?.id || null);
    setCommentText('');
    setReplyTarget(null);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Top Hero Image & Floating Buttons ──────────────── */}
        <View style={styles.heroWrap}>
          {photosList.length > 0 ? (
            <TouchableOpacity
              activeOpacity={0.92}
              onPress={() => setPreviewImageIndex(0)}
              style={styles.heroTouch}
            >
              <Image source={{ uri: photosList[0] }} style={styles.heroImage} resizeMode="cover" />
              <View style={styles.tapToExpandBadge}>
                <Ionicons name="images-outline" size={13} color="#FFFFFF" style={{ marginRight: 5 }} />
                <Text style={styles.tapToExpandText}>
                  {photosList.length > 1 ? `${photosList.length} Photos · Tap to view gallery` : 'Tap to view full image'}
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.placeholderWrap}>
              <Ionicons name="paw" size={64} color="#92CDE5" />
            </View>
          )}

          {/* Floating Back */}
          <TouchableOpacity
            style={[styles.floatingBack, { top: safeTop }]}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-back" size={20} color="#473018" />
          </TouchableOpacity>

          {/* Floating Delete */}
          {canDelete && (
            <TouchableOpacity
              style={[styles.floatingDelete, { top: safeTop }]}
              onPress={handleDeleteReport}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="trash-outline" size={19} color="#C23E3E" />
            </TouchableOpacity>
          )}

          {/* Floating Heart */}
          <TouchableOpacity
            style={[styles.floatingHeart, { top: safeTop }]}
            onPress={() => setIsFav(!isFav)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={isFav ? 'heart' : 'heart-outline'}
              size={20}
              color={isFav ? '#D94F4F' : '#D94F4F'}
            />
          </TouchableOpacity>
        </View>

        {/* ── Sheet Body ────────────────────────────────────── */}
        <View style={styles.sheetBody}>
          <View style={styles.sheetHandle} />

          {/* Status, Urgency & Distance Pills */}
          <View style={styles.metaBadgeRow}>
            <StatusPill status={isRescued ? 'Rescued' : (report.status || 'Open')} />
            <TouchableOpacity
              style={[styles.urgencyBadge, { backgroundColor: urgencyObj.bg }]}
              onPress={() => isAdvocate && !isRescued && setUrgencyModalVisible(true)}
              disabled={!isAdvocate || isRescued}
              activeOpacity={0.7}
            >
              <View style={[styles.urgencyDot, { backgroundColor: urgencyObj.color }]} />
              <Text style={[styles.urgencyText, { color: urgencyObj.color }]}>
                {effectiveUrgency} Urgency
              </Text>
              {isAdvocate && !isRescued && (
                <Ionicons name="pencil" size={10} color={urgencyObj.color} style={{ marginLeft: 4 }} />
              )}
            </TouchableOpacity>
            {distanceKm !== null && (
              <View style={styles.distanceBadge}>
                <Ionicons name="navigate-outline" size={11} color="#2E7A99" style={{ marginRight: 3 }} />
                <Text style={styles.distanceBadgeText}>
                  {distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m away` : `${distanceKm.toFixed(1)} km away`}
                </Text>
              </View>
            )}
          </View>

          {/* Rescue Case Title */}
          <Text style={styles.detailTitle}>
            {report.title || (report.animalType ? `${report.animalType} Rescue Alert` : 'Rescue Alert')}
          </Text>

          {/* Location & Date */}
          <View style={styles.locRow}>
            <Ionicons name="location-sharp" size={15} color="#D94F4F" style={{ marginRight: 5, marginTop: 1 }} />
            <Text style={styles.locText}>
              {report.location?.address || 'Location reported'}
              {report.createdAt
                ? ` • ${new Date(report.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}`
                : ''}
            </Text>
          </View>

          {/* ── Dynamic Attribute Tags (Only Render Fields Present in Report) ── */}
          {detailTags.length > 0 && (
            <View style={styles.detailTagsRow}>
              {detailTags.map((tag) => (
                <View key={tag.id} style={[styles.detailTag, { backgroundColor: tag.bg }]}>
                  <Ionicons name={tag.icon} size={13} color={tag.color} style={{ marginRight: 5 }} />
                  <Text style={[styles.detailTagText, { color: tag.color }]}>
                    <Text style={styles.detailTagLabel}>{tag.label}: </Text>
                    {tag.value}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.hairline} />

          {/* ── Reporter Profile Row (Unboxed) ─────────────────── */}
          <View style={styles.reporterRow}>
            <TouchableOpacity
              style={styles.reporterLeft}
              onPress={() => navigation.navigate('PublicProfile', {
                userId: report.reporterId,
                userName: report.reporterName,
                userAvatar: report.reporterAvatar,
              })}
              activeOpacity={0.8}
            >
              <Avatar name={report.reporterName || 'Community Member'} uri={report.reporterAvatar} size={42} />
              <View style={styles.reporterTextCol}>
                <View style={styles.reporterNameRow}>
                  <Text style={styles.reporterName} numberOfLines={1}>
                    {report.reporterName || 'Community Member'}
                  </Text>
                  <Ionicons name="checkmark-circle" size={14} color="#2E7A99" style={{ marginLeft: 4 }} />
                </View>
                <Text style={styles.reporterRole}>
                  {isAuthor ? 'You reported this rescue case' : 'Reported this rescue case'}
                </Text>
              </View>
            </TouchableOpacity>
            {!isAuthor && (
              <TouchableOpacity
                style={styles.chatBtn}
                onPress={handleMessageAdvocate}
                activeOpacity={0.82}
              >
                <Ionicons name="chatbubble-ellipses" size={14} color="#2E7A99" style={{ marginRight: 5 }} />
                <Text style={styles.chatBtnText}>Message</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ── Description / Report Details (Unboxed) ─────────── */}
          {Boolean(report.description?.trim()) && (
            <>
              <View style={styles.hairline} />
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Ionicons name="document-text-outline" size={15} color="#2E7A99" style={{ marginRight: 6 }} />
                  <Text style={styles.sectionTitle}>Report Details & Notes</Text>
                </View>
                <Text style={styles.descriptionText}>
                  {report.description.trim()}
                </Text>
                {Boolean(
                  report.location?.landmark &&
                  !report.location.landmark.toLowerCase().includes('near detected')
                ) && (
                  <View style={styles.landmarkInlineRow}>
                    <Ionicons name="flag-outline" size={13} color="#8C7D6A" style={{ marginRight: 5, marginTop: 1 }} />
                    <Text style={styles.landmarkInlineText}>
                      <Text style={styles.landmarkInlineLabel}>Landmark: </Text>
                      {report.location.landmark}
                    </Text>
                  </View>
                )}
              </View>
            </>
          )}

          <View style={styles.hairline} />

          {/* ── Interactive Map View ─────────────────────────── */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="map-outline" size={15} color="#2E7A99" style={{ marginRight: 6 }} />
              <Text style={styles.sectionTitle}>Reported Location</Text>
            </View>
            <MapCard
              location={report.location}
              title={report.title || `${report.animalType || 'Animal'} reported here`}
              style={styles.mapCard}
            />
          </View>

          {/* ── Rescue Status & Ongoing Responders ──────────────── */}
          <View style={styles.hairline} />
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="shield-checkmark-outline" size={16} color="#2E7A99" style={{ marginRight: 6 }} />
              <Text style={styles.sectionTitle}>Rescue Status & Ongoing Responders</Text>
            </View>

            {/* Status Overview Card */}
            <View
              style={[
                styles.rescueStatusCard,
                report.status === 'Responded'
                  ? styles.statusCardResponded
                  : report.status === 'Rescued'
                  ? styles.statusCardRescued
                  : styles.statusCardOpen,
              ]}
            >
              {/* Header with Live Status Dot */}
              <View style={styles.rescueStatusHeader}>
                <View
                  style={[
                    styles.statusIndicatorDot,
                    {
                      backgroundColor:
                        report.status === 'Rescued'
                          ? '#2E7D32'
                          : report.status === 'Responded'
                          ? '#0284C7'
                          : '#D97706',
                    },
                  ]}
                />
                <Text style={styles.rescueStatusTitle}>
                  {report.status === 'Rescued'
                    ? 'Case Closed · Animal Safely Rescued'
                    : report.status === 'Responded'
                    ? 'In Progress · Ongoing Responders En Route'
                    : 'Open · Awaiting Responders'}
                </Text>
              </View>

              <Text style={styles.rescueStatusDescription}>
                {report.status === 'Rescued'
                  ? 'This rescue operation is complete. The animal was safely retrieved and provided with necessary care.'
                  : report.status === 'Responded'
                  ? 'A verified advocate has claimed this case and is actively coordinating the rescue.'
                  : 'This alert is currently open. Nearby verified animal advocates have been alerted to assist.'}
              </Text>

              {/* Responder Details Box */}
              {Boolean(report.responderName || report.status === 'Responded' || report.status === 'Rescued') ? (
                <View style={styles.responderBox}>
                  <Text style={styles.responderBoxHeader}>
                    {report.status === 'Rescued' ? 'RESCUE LEAD / HERO' : 'CURRENTLY ONGOING RESPONDER'}
                  </Text>

                  <View style={styles.responderProfileRow}>
                    <Avatar
                      name={report.responderName || 'Advocate'}
                      uri={report.responderAvatar}
                      userId={report.responderId}
                      size={46}
                    />
                    <View style={styles.responderInfo}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.responderNameText} numberOfLines={1}>
                          {report.responderName || 'Advocate Responder'}
                        </Text>
                        <View
                          style={[
                            styles.ongoingBadge,
                            {
                              backgroundColor:
                                report.status === 'Rescued' ? '#E8F5E9' : '#E0F2FE',
                            },
                          ]}
                        >
                          <View
                            style={[
                              styles.ongoingBadgeDot,
                              {
                                backgroundColor:
                                  report.status === 'Rescued' ? '#2E7D32' : '#0284C7',
                              },
                            ]}
                          />
                          <Text
                            style={[
                              styles.ongoingBadgeText,
                              {
                                color:
                                  report.status === 'Rescued' ? '#2E7D32' : '#0284C7',
                              },
                            ]}
                          >
                            {report.status === 'Rescued' ? 'Rescued' : 'Ongoing'}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.responderRoleSub}>
                        {report.status === 'Rescued'
                          ? 'Verified Animal Rescuer'
                          : isResponder
                          ? 'You are the active responder for this case'
                          : 'Active Rescue Advocate · En Route'}
                      </Text>

                      {Boolean(report.respondedAt) && (
                        <Text style={styles.respondedTimeText}>
                          Claimed {fmtAgo(report.respondedAt)}
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Actions for Responder / Users */}
                  <View style={styles.responderActionsRow}>
                    {/* If current user is NOT the responder, allow chatting with the responder */}
                    {!isResponder && Boolean(report.responderId) && (
                      <TouchableOpacity
                        style={styles.actionChatBtn}
                        onPress={handleChatWithResponder}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="chatbubbles" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.actionChatBtnText}>
                          Chat with {report.responderName?.split(' ')[0] || 'Responder'}
                        </Text>
                      </TouchableOpacity>
                    )}

                    {/* If current user IS the responder, allow chatting with reporter */}
                    {isResponder && Boolean(report.reporterId) && report.reporterId !== currentUser?.id && (
                      <TouchableOpacity
                        style={styles.actionChatBtn}
                        onPress={handleMessageAdvocate}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="chatbubbles" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.actionChatBtnText}>Chat with Reporter</Text>
                      </TouchableOpacity>
                    )}

                    {/* If current user IS the responder and status is Responded, allow marking safe */}
                    {isResponder && report.status === 'Responded' && (
                      <TouchableOpacity
                        style={styles.actionRescuedBtn}
                        onPress={handleMarkRescued}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="checkmark-circle" size={16} color="#2E7D32" style={{ marginRight: 6 }} />
                        <Text style={styles.actionRescuedBtnText}>Mark Rescued</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ) : (
                /* No responder yet */
                <View style={styles.noResponderBox}>
                  <Ionicons name="time-outline" size={20} color="#D97706" style={{ marginRight: 8 }} />
                  <Text style={styles.noResponderText}>
                    No advocates have claimed this rescue case yet.
                  </Text>
                </View>
              )}

              {/* Respond button for Advocates when Open */}
              {report.status === 'Open' && (
                isAdvocate ? (
                  <TouchableOpacity
                    style={styles.respondBtn}
                    onPress={handleRespond}
                    activeOpacity={0.88}
                  >
                    <Ionicons name="shield-checkmark" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.respondBtnText}>Respond & Claim Rescue (I’ll help!)</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.awaitingNote}>
                    <Ionicons name="information-circle-outline" size={15} color="#2E7A99" style={{ marginRight: 5 }} />
                    <Text style={styles.awaitingNoteText}>
                      Nearby advocates have been alerted and will coordinate rescue shortly.
                    </Text>
                  </View>
                )
              )}
            </View>
          </View>

          {/* Comments Section */}
          <View style={styles.commentsSection}>
            <Text style={styles.commentsTitle}>
              Comments ({countComments(report.comments)})
            </Text>

            {report.comments && report.comments.length > 0 ? (
              report.comments.map((c) => (
                <View key={c.id} style={styles.commentNodeWrap}>
                  <View style={styles.commentItem}>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('PublicProfile', { userId: c.userId, userName: c.userName, userAvatar: c.userAvatar })}
                      activeOpacity={0.8}
                    >
                      <Avatar name={c.userName} uri={c.userAvatar} userId={c.userId} size={36} />
                    </TouchableOpacity>
                    <View style={styles.commentBubble}>
                      <TouchableOpacity
                        onPress={() => navigation.navigate('PublicProfile', { userId: c.userId, userName: c.userName, userAvatar: c.userAvatar })}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.commentUser}>{c.userName}</Text>
                      </TouchableOpacity>
                      <Text style={styles.commentContent}>{c.text}</Text>
                      <View style={styles.commentBottomRow}>
                        <Text style={styles.commentTime}>
                          {c.createdAt
                            ? (c.createdAt.includes('T')
                                ? new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : c.createdAt)
                            : 'Just now'}
                        </Text>
                        <TouchableOpacity
                          style={styles.replyBtn}
                          onPress={() => setReplyTarget({ id: c.id, name: c.userName })}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          <Ionicons name="arrow-undo-outline" size={12} color="#2E7A99" />
                          <Text style={styles.replyBtnText}>Reply</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  {/* Render nested replies if present */}
                  {Array.isArray(c.replies) && c.replies.length > 0 && (
                    <View style={styles.repliesList}>
                      {c.replies.map((reply) => (
                        <View key={reply.id} style={styles.replyItem}>
                          <TouchableOpacity
                            onPress={() => navigation.navigate('PublicProfile', { userId: reply.userId, userName: reply.userName, userAvatar: reply.userAvatar })}
                            activeOpacity={0.8}
                          >
                            <Avatar name={reply.userName} uri={reply.userAvatar} userId={reply.userId} size={28} />
                          </TouchableOpacity>
                          <View style={styles.replyBubble}>
                            <TouchableOpacity
                              onPress={() => navigation.navigate('PublicProfile', { userId: reply.userId, userName: reply.userName, userAvatar: reply.userAvatar })}
                              activeOpacity={0.8}
                            >
                              <Text style={styles.commentUser}>{reply.userName}</Text>
                            </TouchableOpacity>
                            <Text style={styles.commentContent}>{reply.text}</Text>
                            <Text style={styles.commentTime}>
                              {reply.createdAt
                                ? (reply.createdAt.includes('T')
                                    ? new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                    : reply.createdAt)
                                : 'Just now'}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))
            ) : (
              <View style={styles.noCommentsWrap}>
                <Ionicons name="chatbubbles-outline" size={28} color="#C4B8A5" style={{ marginBottom: 6 }} />
                <Text style={styles.noCommentsText}>No comments yet</Text>
                <Text style={styles.noCommentsSub}>Be the first to share an update or offer assistance.</Text>
              </View>
            )}

            {/* Replying Banner */}
            {replyTarget && (
              <View style={styles.replyBanner}>
                <View style={styles.replyBannerContent}>
                  <Ionicons name="arrow-undo" size={13} color="#2E7A99" style={{ marginRight: 6 }} />
                  <Text style={styles.replyBannerText}>
                    Replying to <Text style={{ fontWeight: '700', color: '#2E7A99' }}>{replyTarget.name}</Text>
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setReplyTarget(null)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={18} color="#8C7D6A" />
                </TouchableOpacity>
              </View>
            )}

            {/* Write comment input */}
            <View style={styles.writeCommentRow}>
              <Avatar name={currentUser?.name || 'User'} uri={currentUser?.avatar} userId={currentUser?.id} size={34} />
              <View style={styles.commentInputWrap}>
                <TextInput
                  style={styles.commentInput}
                  placeholder={replyTarget ? `Reply to ${replyTarget.name}...` : "Write a comment..."}
                  placeholderTextColor="#8C7D6A"
                  value={commentText}
                  onChangeText={setCommentText}
                  returnKeyType="send"
                  onSubmitEditing={handleSendComment}
                />
              </View>
              <TouchableOpacity
                style={styles.sendIconBtn}
                onPress={handleSendComment}
                disabled={!commentText.trim()}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="paper-plane" size={20} color={commentText.trim() ? '#2E7A99' : '#C4B8A5'} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ── Full-Screen Image Viewer Modal ─────────────────── */}
      <Modal
        visible={previewImageIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewImageIndex(null)}
      >
        <View style={styles.previewModalOverlay}>
          <View style={[styles.previewTopHeader, { paddingTop: safeTop }]}>
            <TouchableOpacity
              style={styles.previewHeaderBtn}
              onPress={() => setPreviewImageIndex(null)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <Text style={styles.previewCounterText}>
              {previewImageIndex !== null ? `${previewImageIndex + 1} of ${photosList.length}` : ''}
            </Text>

            <View style={{ width: 40 }} />
          </View>

          <View style={styles.previewImageArea}>
            {previewImageIndex !== null && photosList[previewImageIndex] && (
              <Image
                source={{ uri: photosList[previewImageIndex] }}
                style={styles.previewFullImage}
                resizeMode="contain"
              />
            )}
          </View>

          {photosList.length > 1 && (
            <View style={styles.previewNavRow}>
              <TouchableOpacity
                style={[styles.previewNavBtn, previewImageIndex === 0 && styles.previewNavBtnDisabled]}
                disabled={previewImageIndex === 0}
                onPress={() => setPreviewImageIndex((prev) => Math.max(0, prev - 1))}
              >
                <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.previewNavBtn,
                  previewImageIndex === photosList.length - 1 && styles.previewNavBtnDisabled,
                ]}
                disabled={previewImageIndex === photosList.length - 1}
                onPress={() => setPreviewImageIndex((prev) => Math.min(photosList.length - 1, prev + 1))}
              >
                <Ionicons name="chevron-forward" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      {/* ── Urgency Triage Modal for Advocates ────────────────── */}
      <Modal
        visible={urgencyModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setUrgencyModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.triageModalOverlay}
          activeOpacity={1}
          onPress={() => setUrgencyModalVisible(false)}
        >
          <View style={styles.triageModalCard}>
            <View style={styles.triageModalHeader}>
              <Text style={styles.triageModalTitle}>Update Case Urgency</Text>
              <TouchableOpacity
                onPress={() => setUrgencyModalVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={20} color="#8C7D6A" />
              </TouchableOpacity>
            </View>
            <Text style={styles.triageModalSub}>
              Select the appropriate urgency level based on your assessment of the animal's physical state.
            </Text>

            <View style={styles.triageOptionsWrap}>
              {URGENCY_LEVELS.map((u) => {
                const isSelected = (report?.urgency || '').toLowerCase() === u.label.toLowerCase();
                return (
                  <TouchableOpacity
                    key={u.label}
                    style={[
                      styles.triageOptionItem,
                      isSelected && { borderColor: u.color, backgroundColor: u.bg },
                    ]}
                    onPress={() => {
                      updateRescueReportUrgency(report.id, u.label);
                      setUrgencyModalVisible(false);
                      showAlert(
                        'success',
                        'Urgency Updated',
                        `This rescue case is now set to ${u.label} Urgency.`
                      );
                    }}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.triageDot, { backgroundColor: u.color }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.triageOptionLabel, isSelected && { color: u.color, fontWeight: '800' }]}>
                        {u.label} Urgency
                      </Text>
                      <Text style={styles.triageOptionDesc}>
                        {u.label === 'High'
                          ? 'Life-threatening trauma, severe bleeding, immediate rescue needed'
                          : u.label === 'Medium'
                          ? 'Malnourished, illness, or vulnerable nursing litter'
                          : 'Stable stray, roaming, not in immediate physical danger'}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={18} color={u.color} style={{ marginLeft: 8 }} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    paddingBottom: 40,
  },

  heroWrap: {
    position: 'relative',
    height: 290,
    backgroundColor: '#E8F2F6',
  },
  heroTouch: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  tapToExpandBadge: {
    position: 'absolute',
    bottom: 34,
    right: 18,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 20, 20, 0.74)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tapToExpandText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  placeholderWrap: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F2F6',
  },
  floatingBack: {
    position: 'absolute',
    left: 18,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 4,
  },
  floatingDelete: {
    position: 'absolute',
    right: 66,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderWidth: 1,
    borderColor: '#FCD8D8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 4,
  },
  floatingHeart: {
    position: 'absolute',
    right: 18,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 4,
  },

  sheetBody: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -26,
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DDD6CA',
    alignSelf: 'center',
    marginBottom: 14,
  },

  metaBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 20,
  },
  urgencyDot: {
    width: 6.5,
    height: 6.5,
    borderRadius: 3.5,
    marginRight: 5,
  },
  urgencyText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF4F8',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 20,
  },
  distanceBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2E7A99',
    fontFamily: 'PlusJakartaSans_700Bold',
  },

  detailTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#382613',
    letterSpacing: -0.4,
    marginBottom: 6,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  locText: {
    fontSize: 12.5,
    color: '#685038',
    fontWeight: '500',
    lineHeight: 18,
    flex: 1,
    fontFamily: 'PlusJakartaSans_500Medium',
  },

  // ── Unboxed Inline Attribute Tags ─────────────────────────
  detailTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  detailTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
  },
  detailTagText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  detailTagLabel: {
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans_700Bold',
  },

  // ── Hairline Divider ──────────────────────────────────────
  hairline: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#EFE7DA',
    marginVertical: 14,
  },

  // ── Unboxed Reporter Row ──────────────────────────────────
  reporterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  reporterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  reporterTextCol: {
    flex: 1,
  },
  reporterNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reporterName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#362415',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  reporterRole: {
    fontSize: 12,
    color: '#8C7D6A',
    marginTop: 2,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF4F8',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chatBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#2E7A99',
    fontFamily: 'PlusJakartaSans_700Bold',
  },

  // ── Content Sections ───────────────────────────────────────
  section: {
    marginBottom: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#3A2613',
    letterSpacing: -0.2,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  descriptionText: {
    fontSize: 14,
    color: '#473018',
    lineHeight: 22,
    fontWeight: '400',
    fontFamily: 'PlusJakartaSans_400Regular',
  },
  landmarkInlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  landmarkInlineText: {
    fontSize: 12.5,
    color: '#786854',
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  landmarkInlineLabel: {
    fontWeight: '700',
    color: '#5C4A38',
    fontFamily: 'PlusJakartaSans_700Bold',
  },

  // Map Card
  mapCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 6,
    marginBottom: 16,
  },
  noCommentsWrap: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noCommentsText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8C7D6A',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  noCommentsSub: {
    fontSize: 12,
    color: '#A89985',
    marginTop: 2,
    textAlign: 'center',
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  mapFooterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#473018',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  mapFooterLink: {
    fontSize: 11,
    color: '#8C7D6A',
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },

  respondBtn: {
    flexDirection: 'row',
    backgroundColor: '#2E7A99',
    borderRadius: 26,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#2E7A99',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  respondBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans_700Bold',
    letterSpacing: 0.2,
  },
  rescueStatusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    marginBottom: 20,
    ...SHADOWS.sm,
  },
  statusCardOpen: {
    borderColor: '#FDE68A',
    backgroundColor: '#FFFDF5',
  },
  statusCardResponded: {
    borderColor: '#BAE6FD',
    backgroundColor: '#F8FCFF',
  },
  statusCardRescued: {
    borderColor: '#BBF7D0',
    backgroundColor: '#F6FCF7',
  },
  rescueStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusIndicatorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  rescueStatusTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#261B0E',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  rescueStatusDescription: {
    fontSize: 12.5,
    color: '#5C4830',
    lineHeight: 18,
    fontFamily: 'PlusJakartaSans_500Medium',
    marginBottom: 14,
  },
  responderBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 13,
    borderWidth: 1,
    borderColor: '#E6DFD5',
  },
  responderBoxHeader: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#8C7A68',
    letterSpacing: 0.8,
    marginBottom: 10,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  responderProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  responderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  responderNameText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#2E1E0E',
    fontFamily: 'PlusJakartaSans_700Bold',
    flexShrink: 1,
  },
  ongoingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  ongoingBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  ongoingBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  responderRoleSub: {
    fontSize: 12,
    color: '#6E5C49',
    marginTop: 2,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  respondedTimeText: {
    fontSize: 11,
    color: '#9E8D7B',
    marginTop: 2,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  responderActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0ECE4',
  },
  noResponderBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 12,
    marginBottom: 12,
  },
  noResponderText: {
    fontSize: 12.5,
    color: '#92400E',
    fontWeight: '600',
    fontFamily: 'PlusJakartaSans_600SemiBold',
    flex: 1,
  },
  awaitingNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FC',
    borderRadius: 10,
    padding: 10,
  },
  awaitingNoteText: {
    fontSize: 11.5,
    color: '#2E7A99',
    fontFamily: 'PlusJakartaSans_500Medium',
    flex: 1,
  },
  respondedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#CBE5F0',
    marginBottom: 24,
    ...SHADOWS.sm,
  },
  respondedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  respondedIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EBF7FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  respondedTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#473018',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  respondedSub: {
    fontSize: 12,
    color: '#685038',
    marginTop: 2,
    lineHeight: 16,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  respondedActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0EBE0',
  },
  actionChatBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E7A99',
    paddingVertical: 10,
    borderRadius: 14,
    ...SHADOWS.sm,
  },
  actionChatBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  actionRescuedBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5EE',
    borderWidth: 1,
    borderColor: '#C3E6D2',
    paddingVertical: 10,
    borderRadius: 14,
  },
  actionRescuedBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2E7D32',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  rescuedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5EE',
    borderWidth: 1.5,
    borderColor: '#C3E6D2',
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
  },
  rescuedTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1B5E20',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  rescuedSub: {
    fontSize: 12,
    color: '#2E7D32',
    marginTop: 2,
    lineHeight: 16,
    fontFamily: 'PlusJakartaSans_500Medium',
  },

  awaitingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#D4E5ED',
    borderRadius: 18,
    padding: 14,
    marginBottom: 24,
    gap: 12,
  },
  awaitingIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EAF3F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  awaitingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C4A5E',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  awaitingSub: {
    fontSize: 12,
    color: '#5B7A8C',
    marginTop: 2,
    lineHeight: 16,
    fontFamily: 'PlusJakartaSans_500Medium',
  },

  commentsSection: {
    marginTop: 4,
  },
  commentsTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#473018',
    marginBottom: 12,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  commentNodeWrap: {
    marginBottom: 14,
  },
  repliesList: {
    marginLeft: 32,
    marginTop: 8,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#E2EBF0',
    gap: 8,
  },
  replyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  replyBubble: {
    flex: 1,
    backgroundColor: '#F7FAFB',
    borderWidth: 1,
    borderColor: '#D8E8F0',
    borderRadius: 14,
    padding: 10,
  },
  replyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EDF5F8',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#CFE4EC',
  },
  replyBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyBannerText: {
    fontSize: 12,
    color: '#473018',
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 14,
  },
  commentBubble: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CCE3EE',
    borderRadius: 16,
    padding: 12,
  },
  commentUser: {
    fontSize: 12,
    fontWeight: '700',
    color: '#473018',
    marginBottom: 3,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  commentContent: {
    fontSize: 13,
    color: '#473018',
    lineHeight: 18,
    marginBottom: 6,
    fontFamily: 'PlusJakartaSans_400Regular',
  },
  commentBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  commentTime: {
    fontSize: 10,
    color: '#8C7D6A',
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  replyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  replyBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2E7A99',
    fontFamily: 'PlusJakartaSans_700Bold',
  },

  writeCommentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  commentInputWrap: {
    flex: 1,
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    height: 40,
    justifyContent: 'center',
  },
  commentInput: {
    fontSize: 13,
    color: '#473018',
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  sendIconBtn: {
    padding: 4,
  },

  // Full-Screen Image Preview Modal
  previewModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 28, 0.96)',
    justifyContent: 'space-between',
  },
  previewTopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 14,
  },
  previewHeaderBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewCounterText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  previewImageArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  previewFullImage: {
    width: '100%',
    height: '100%',
  },
  previewNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 38 : 24,
  },
  previewNavBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewNavBtnDisabled: {
    opacity: 0.25,
  },

  // Urgency Triage Modal Styles
  triageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  triageModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    ...SHADOWS.medium,
  },
  triageModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  triageModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#382513',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  triageModalSub: {
    fontSize: 12,
    color: '#8C7D6A',
    lineHeight: 17,
    marginBottom: 16,
  },
  triageOptionsWrap: {
    gap: 10,
  },
  triageOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E8DFD8',
    backgroundColor: '#FAFAF9',
  },
  triageDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  triageOptionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#382513',
    marginBottom: 2,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  triageOptionDesc: {
    fontSize: 11,
    color: '#8C7D6A',
    lineHeight: 15,
  },
});
