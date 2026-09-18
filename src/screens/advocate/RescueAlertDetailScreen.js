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

export default function RescueAlertDetailScreen({ route, navigation }) {
  const { reportId } = route.params || {};
  const {
    rescueReports,
    currentUser,
    addComment,
    respondToReport,
    markRescued,
    startConversation,
    showAlert,
  } = useApp();

  const report = rescueReports.find((r) => r.id === reportId) || rescueReports[0];
  const [commentText, setCommentText] = useState('');
  const [isFav, setIsFav] = useState(false);
  const [previewImageIndex, setPreviewImageIndex] = useState(null);

  const photosList = (report?.photos && report.photos.length > 0)
    ? report.photos
    : (report?.photo ? [report.photo] : []);

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
    });
  };

  const handleSendComment = () => {
    if (!commentText.trim()) return;
    addComment(report.id, commentText.trim());
    setCommentText('');
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
                <Ionicons name="expand-outline" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.tapToExpandText}>
                  {photosList.length > 1 ? `${photosList.length} Photos · Tap to view` : 'Tap to view full image'}
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

          {/* Rescue Case Title */}
          <Text style={styles.detailTitle}>
            {report.title || `${report.animalType || 'Animal'} Rescue Alert`}
          </Text>

          {/* Location & Date */}
          <View style={styles.locRow}>
            <Ionicons name="location-sharp" size={15} color="#D94F4F" style={{ marginRight: 4 }} />
            <Text style={styles.locText}>
              {report.location?.address || 'Pasig City'} • {report.createdAt ? new Date(report.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
            </Text>
          </View>

          {/* 3 Stats Cards */}
          <View style={styles.statsRow}>
            <View style={[styles.statCard, styles.statGreen]}>
              <Text style={styles.statLabel}>Gender</Text>
              <Text style={styles.statVal}>{report.gender || 'Unknown'}</Text>
            </View>
            <View style={[styles.statCard, styles.statYellow]}>
              <Text style={styles.statLabel}>Type</Text>
              <Text style={styles.statVal}>{report.animalType || 'Dog'}</Text>
            </View>
            <View style={[styles.statCard, styles.statBlue]}>
              <Text style={styles.statLabel}>Condition</Text>
              <Text style={styles.statVal}>{report.condition || 'Rescue'}</Text>
            </View>
          </View>

          {/* Advocate Card */}
          <View style={styles.advocateCard}>
            <View style={styles.advocateLeft}>
              <Avatar name={report.reporterName || 'Community Member'} size={42} />
              <View style={styles.advocateTextCol}>
                <Text style={styles.advocateName}>{report.reporterName || 'Community Member'}</Text>
                <Text style={styles.advocateRole}>
                  Reporter · Community Member
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.chatBtn}
              onPress={handleMessageAdvocate}
              activeOpacity={0.8}
            >
              <Ionicons name="chatbubble" size={14} color="#473018" style={{ marginRight: 4 }} />
              <Text style={styles.chatBtnText}>Chat</Text>
            </TouchableOpacity>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descText}>{report.description}</Text>

            {/* Badges */}
            <View style={styles.badgesRow}>
              {(report.tags || [report.animalType || 'Rescue', report.condition || 'Needs help']).map(
                (tag, idx) => (
                  <View
                    key={tag}
                    style={[
                      styles.tagPill,
                      idx === 0 && styles.tagPillGreen,
                      idx === 1 && styles.tagPillYellow,
                      idx === 2 && styles.tagPillBlue,
                      idx === 3 && styles.tagPillTeal,
                    ]}
                  >
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                )
              )}
            </View>
          </View>

          {/* ── Interactive Map View ─────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reported Location</Text>
            <MapCard
              location={report.location}
              title={report.title || `${report.animalType || 'Animal'} reported here`}
              style={styles.mapCard}
            />
          </View>

          {/* ── Dynamic Rescue Action Panel ────────────────────── */}
          {report.status === 'Open' ? (
            <TouchableOpacity
              style={styles.respondBtn}
              onPress={handleRespond}
              activeOpacity={0.88}
            >
              <Ionicons name="shield-checkmark-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.respondBtnText}>Respond (I’ll help!)</Text>
            </TouchableOpacity>
          ) : report.status === 'Responded' ? (
            <View style={styles.respondedCard}>
              <View style={styles.respondedHeaderRow}>
                <View style={styles.respondedIconWrap}>
                  <Ionicons name="shield-checkmark" size={22} color="#2E7A99" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.respondedTitle}>
                    {isResponder ? 'You are responding to this case' : `Claimed by ${report.responderName || 'Advocate'}`}
                  </Text>
                  <Text style={styles.respondedSub}>
                    {isResponder
                      ? 'Coordinate directly with the reporter or mark safe when secured.'
                      : 'An advocate is currently responding to assist this animal.'}
                  </Text>
                </View>
              </View>

              <View style={styles.respondedActionsRow}>
                <TouchableOpacity
                  style={styles.actionChatBtn}
                  onPress={handleMessageAdvocate}
                  activeOpacity={0.85}
                >
                  <Ionicons name="chatbubbles" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.actionChatBtnText}>Chat with Reporter</Text>
                </TouchableOpacity>

                {isResponder && (
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
            <View style={styles.rescuedBanner}>
              <Ionicons name="checkmark-circle" size={24} color="#2E7D32" />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={styles.rescuedTitle}>Animal Safely Rescued 🎉</Text>
                <Text style={styles.rescuedSub}>
                  This case is closed and the animal has been secured.
                </Text>
              </View>
            </View>
          )}

          {/* Comments Section */}
          <View style={styles.commentsSection}>
            <Text style={styles.commentsTitle}>
              Comments ({report.comments?.length || 0})
            </Text>

            {report.comments && report.comments.length > 0 ? (
              report.comments.map((c) => (
                <View key={c.id} style={styles.commentItem}>
                  <Avatar name={c.userName} size={36} />
                  <View style={styles.commentBubble}>
                    <Text style={styles.commentUser}>{c.userName}</Text>
                    <Text style={styles.commentContent}>{c.text}</Text>
                    <View style={styles.commentBottomRow}>
                      <Text style={styles.commentTime}>
                        {c.createdAt ? (c.createdAt.includes('T') ? new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : c.createdAt) : 'Just now'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.noCommentsWrap}>
                <Ionicons name="chatbubbles-outline" size={28} color="#C4B8A5" style={{ marginBottom: 6 }} />
                <Text style={styles.noCommentsText}>No comments yet</Text>
                <Text style={styles.noCommentsSub}>Be the first to share an update or offer assistance.</Text>
              </View>
            )}

            {/* Write comment input */}
            <View style={styles.writeCommentRow}>
              <Avatar name={currentUser?.name || 'User'} size={34} />
              <View style={styles.commentInputWrap}>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Write a comment..."
                  placeholderTextColor="#8C7D6A"
                  value={commentText}
                  onChangeText={setCommentText}
                />
              </View>
              <TouchableOpacity
                style={styles.sendIconBtn}
                onPress={handleSendComment}
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
    height: 240,
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
    bottom: 32,
    right: 18,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 20, 20, 0.65)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  tapToExpandText: {
    color: '#FFFFFF',
    fontSize: 11,
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
    top: Platform.OS === 'ios' ? 50 : 32,
    left: 18,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.card,
  },
  floatingHeart: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 32,
    right: 18,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.card,
  },

  sheetBody: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -24,
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D6D3D1',
    alignSelf: 'center',
    marginBottom: 14,
  },

  detailTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.brown,
    letterSpacing: -0.3,
    marginBottom: 6,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  locText: {
    fontSize: 13,
    color: '#5C4E3A',
    fontWeight: '500',
    fontFamily: 'PlusJakartaSans_500Medium',
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 18,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  statGreen: {
    backgroundColor: '#E8F5EE',
  },
  statYellow: {
    backgroundColor: '#FEF8DE',
  },
  statBlue: {
    backgroundColor: '#E0F2FA',
  },
  statLabel: {
    fontSize: 11,
    color: '#8C7D6A',
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  statVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#473018',
    fontFamily: 'PlusJakartaSans_700Bold',
  },

  advocateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E3EFF6',
    borderRadius: 20,
    padding: 14,
    marginBottom: 20,
    ...SHADOWS.sm,
  },
  advocateLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  advocateTextCol: {
    flex: 1,
  },
  advocateName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#473018',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  advocateRole: {
    fontSize: 11,
    color: '#8C7D6A',
    marginTop: 2,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBEEAC',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
  },
  chatBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#473018',
    fontFamily: 'PlusJakartaSans_700Bold',
  },

  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#473018',
    marginBottom: 8,
    letterSpacing: -0.2,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  descText: {
    fontSize: 13.5,
    color: '#4B3F33',
    lineHeight: 21,
    fontWeight: '400',
    marginBottom: 12,
    fontFamily: 'PlusJakartaSans_400Regular',
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagPillGreen: {
    backgroundColor: '#E8F5EE',
  },
  tagPillYellow: {
    backgroundColor: '#FEF8DE',
  },
  tagPillBlue: {
    backgroundColor: '#E0F2FA',
  },
  tagPillTeal: {
    backgroundColor: '#D8EDE4',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#473018',
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },

  // Map Card
  mapCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    marginTop: 6,
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
    borderRadius: 25,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#2E7A99',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  respondBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans_700Bold',
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
});
