import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, KeyboardAvoidingView, Platform, Alert, Modal, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import StatusPill from '../../components/StatusPill';
import Avatar from '../../components/Avatar';
import Button from '../../components/Button';
import MapCard from '../../components/MapCard';
import Header from '../../components/Header';
import { URGENCY_LEVELS } from '../../data/mockData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PHOTO_CARD_WIDTH = SCREEN_WIDTH - SIZES.paddingL * 2;

export default function ReportDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const safeTop = Platform.OS === 'ios' ? Math.max(insets.top, 16) + 4 : (insets.top > 24 ? insets.top + 6 : 14);
  const { reportId } = route.params || {};
  const { rescueReports, currentUser, addComment, respondToReport, markRescued, deleteRescueReport, startConversation, showAlert } = useApp();
  const report = rescueReports.find((r) => r.id === reportId);
  const [commentText, setCommentText] = useState('');
  const [replyTarget, setReplyTarget] = useState(null); // { id, name }
  const [previewImageIndex, setPreviewImageIndex] = useState(null);

  if (!report) {
    return (
      <View style={[styles.flex, { alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#FFF' }]}>
        <Ionicons name="shield-outline" size={48} color={COLORS.border} />
        <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.brown, marginTop: 12 }}>Report Not Found</Text>
        <Text style={{ fontSize: 13, color: COLORS.textMuted, textAlign: 'center', marginTop: 4, marginBottom: 16 }}>
          This rescue report has been resolved or removed.
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

  const urgency    = URGENCY_LEVELS.find((u) => u.label === report.urgency) || URGENCY_LEVELS[2];
  const isAdvocate = currentUser?.role === 'advocate';
  const isResponder = currentUser?.id === report.responderId;
  const isAuthor = Boolean(
    currentUser && (
      currentUser.id === report.reporterId ||
      (currentUser.email && report.reporterEmail && currentUser.email.toLowerCase() === report.reporterEmail.toLowerCase())
    )
  );
  const canDelete = isAuthor || isAdvocate;
  const canRespond  = isAdvocate && report.status === 'Open';
  const canMarkRescued = isAdvocate && isResponder && report.status === 'Responded';

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

  const handleComment = () => {
    if (!commentText.trim()) return;
    addComment(reportId, commentText.trim(), replyTarget?.id || null);
    setCommentText('');
    setReplyTarget(null);
  };

  const handleRespond = () => {
    showAlert({
      title: 'Respond to Rescue',
      message: 'Are you willing to assist with this rescue case?',
      type: 'info',
      customIcon: 'paw',
      secondaryText: 'Cancel',
      primaryText: "Yes, I'll Help",
      onPrimaryPress: () => respondToReport(reportId),
    });
  };

  const handleMarkRescued = () => {
    showAlert({
      title: 'Mark as Rescued',
      message: 'Confirm that this animal has been successfully rescued.',
      type: 'warning',
      customIcon: 'checkmark-circle',
      secondaryText: 'Cancel',
      primaryText: 'Confirm',
      onPrimaryPress: () => markRescued(reportId),
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <StatusBar style="dark" />

      <Header
        title="Rescue Report"
        onBack={() => navigation.goBack()}
        rightComponent={
          canDelete ? (
            <TouchableOpacity
              onPress={handleDeleteReport}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{ padding: 4 }}
            >
              <Ionicons name="trash-outline" size={20} color="#C23E3E" />
            </TouchableOpacity>
          ) : null
        }
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Photo Gallery or Single Photo */}
        {(() => {
          const allPhotos = (report.photos && report.photos.length > 0) ? report.photos : (report.photo ? [report.photo] : []);
          if (allPhotos.length === 0) {
            return (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoHint}>No photo attached</Text>
              </View>
            );
          }
          if (allPhotos.length === 1) {
            return (
              <TouchableOpacity
                activeOpacity={0.92}
                onPress={() => setPreviewImageIndex(0)}
                style={styles.photoContainer}
              >
                <Image source={{ uri: allPhotos[0] }} style={styles.photo} resizeMode="cover" />
                <View style={styles.tapToExpandBadge}>
                  <Ionicons name="expand-outline" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.tapToExpandText}>Tap to view full image</Text>
                </View>
              </TouchableOpacity>
            );
          }
          return (
            <View style={styles.multiPhotoWrap}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                style={styles.multiPhotoScroll}
              >
                {allPhotos.map((imgUri, idx) => (
                  <TouchableOpacity
                    key={idx}
                    activeOpacity={0.92}
                    onPress={() => setPreviewImageIndex(idx)}
                    style={styles.multiPhotoCard}
                  >
                    <Image source={{ uri: imgUri }} style={styles.photo} resizeMode="cover" />
                    <View style={styles.photoCountBadge}>
                      <Text style={styles.photoCountText}>{idx + 1} / {allPhotos.length}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Text style={styles.multiPhotoHint}>Swipe to see all photos · Tap to view full size</Text>
            </View>
          );
        })()}

        {/* Status + Urgency pills */}
        <View style={styles.pillRow}>
          <StatusPill status={report.status} />
          <Text style={[styles.urgencyText, { color: urgency.color }]}>
            {report.urgency} Urgency
          </Text>
        </View>

        {/* Animal info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Animal Details</Text>
          <InfoRow label="Type"        value={report.animalType} />
          <InfoRow label="Condition"   value={report.condition} />
          <InfoRow label="Description" value={report.description} />
        </View>

        {/* ── Location card with interactive map ─────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <MapCard
            location={report.location}
            title={`${report.animalType} reported here`}
            style={styles.mapCard}
          />
        </View>

        {/* Reporter — tappable avatar → PublicProfile */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reported By</Text>
          <TouchableOpacity
            style={styles.userRow}
            onPress={() => navigation.navigate('PublicProfile', {
              userId: report.reporterId,
              userName: report.reporterName,
              userAvatar: report.reporterAvatar,
            })}
            activeOpacity={0.8}
          >
            <Avatar name={report.reporterName} uri={report.reporterAvatar} size={42} />
            <View style={styles.userInfo}>
              <Text style={styles.userName} numberOfLines={1}>{report.reporterName}</Text>
              <Text style={styles.userSub} numberOfLines={1}>
                {new Date(report.createdAt).toLocaleDateString('en-PH', { dateStyle: 'medium' })}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Responder section */}
        {report.responderId && (
          <View style={styles.responderSection}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.responderText}>
                  {report.responderName || 'An advocate'} has responded to this rescue.
                </Text>
                <Text style={{ fontSize: 11.5, color: '#685038', marginTop: 2 }}>
                  Coordinate live assistance and arrival with the advocate.
                </Text>
              </View>
            </View>

            {report.responderId !== currentUser?.id && (
              <TouchableOpacity
                style={styles.simpleBtn}
                onPress={() => {
                  const convId = startConversation(report.responderId, report.responderName || 'Advocate');
                  navigation.navigate('Chat', {
                    conversationId: convId,
                    otherName: report.responderName || 'Advocate',
                    otherId: report.responderId,
                    initialDraft: `Hi ${report.responderName || ''}! Thank you for responding to my rescue report. Here is the latest update:`,
                    linkedReport: report,
                  });
                }}
              >
                <Text style={styles.simpleBtnText}>
                  Chat with {report.responderName || 'Advocate'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Advocate action buttons */}
        {canRespond && (
          <Button
            title="Respond — I'll Help"
            onPress={handleRespond}
            variant="secondary"
            style={styles.actionBtn}
          />
        )}
        {canMarkRescued && (
          <Button
            title="Mark as Rescued"
            onPress={handleMarkRescued}
            style={styles.actionBtn}
          />
        )}

        {/* Comments */}
        <Text style={styles.commentsTitle}>
          Comments: {countComments(report.comments)}
        </Text>
        {(!report.comments || report.comments.length === 0) && (
          <Text style={styles.noComments}>No comments yet. Be the first to respond.</Text>
        )}
        {report.comments?.map((c) => (
          <CommentNode
            key={c.id}
            comment={c}
            onReply={(target) => {
              setReplyTarget({ id: target.id, name: target.userName });
            }}
            onUserPress={(userId) => navigation.navigate('PublicProfile', { userId })}
          />
        ))}
      </ScrollView>

      {/* Replying Banner */}
      {replyTarget && (
        <View style={styles.replyBanner}>
          <Text style={styles.replyBannerText}>
            Replying to <Text style={{ fontWeight: '700' }}>{replyTarget.name}</Text>
          </Text>
          <TouchableOpacity onPress={() => setReplyTarget(null)}>
            <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>
      )}

      {/* Comment input */}
      <View style={styles.inputBar}>
        <Avatar name={currentUser?.name} size={34} />
        <TextInput
          style={styles.commentInput}
          placeholder={replyTarget ? `Reply to ${replyTarget.name}...` : "Write a comment..."}
          placeholderTextColor={COLORS.textMuted}
          value={commentText}
          onChangeText={setCommentText}
          returnKeyType="send"
          onSubmitEditing={handleComment}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !commentText.trim() && styles.sendBtnDisabled]}
          onPress={handleComment}
          disabled={!commentText.trim()}
        >
          <Ionicons
            name="send"
            size={18}
            color={commentText.trim() ? COLORS.primaryDeep : COLORS.textMuted}
          />
        </TouchableOpacity>
      </View>

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
              {(() => {
                const photosList = (report.photos && report.photos.length > 0) ? report.photos : (report.photo ? [report.photo] : []);
                return previewImageIndex !== null ? `${previewImageIndex + 1} of ${photosList.length}` : '';
              })()}
            </Text>

            <View style={{ width: 40 }} />
          </View>

          <View style={styles.previewImageArea}>
            {(() => {
              const photosList = (report.photos && report.photos.length > 0) ? report.photos : (report.photo ? [report.photo] : []);
              if (previewImageIndex !== null && photosList[previewImageIndex]) {
                return (
                  <Image
                    source={{ uri: photosList[previewImageIndex] }}
                    style={styles.previewFullImage}
                    resizeMode="contain"
                  />
                );
              }
              return null;
            })()}
          </View>

          {(() => {
            const photosList = (report.photos && report.photos.length > 0) ? report.photos : (report.photo ? [report.photo] : []);
            if (photosList.length <= 1) return null;
            return (
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
            );
          })()}
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function countComments(comments = []) {
  let count = 0;
  comments.forEach((c) => {
    count += 1;
    if (c.replies) count += countComments(c.replies);
  });
  return count;
}

function CommentNode({ comment, onReply, onUserPress, depth = 0 }) {
  const isReply = depth > 0;
  return (
    <View style={[styles.commentNodeWrap, isReply && styles.replyIndent]}>
      <View style={styles.commentItem}>
        <TouchableOpacity onPress={() => onUserPress(comment.userId)} style={{ marginTop: 2 }}>
          <Avatar name={comment.userName} size={isReply ? 26 : 32} />
        </TouchableOpacity>
        <View style={[styles.commentBubble, isReply && styles.commentBubbleReply]}>
          <Text style={styles.commentUser}>{comment.userName}</Text>
          <Text style={styles.commentText}>{comment.text}</Text>
          <View style={styles.commentMeta}>
            <Text style={styles.commentTime}>
              {new Date(comment.createdAt).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
            </Text>
            <TouchableOpacity onPress={() => onReply(comment)} style={styles.replyBtn}>
              <Ionicons name="chatbubble-outline" size={13} color={COLORS.primaryDeep} />
              <Text style={styles.replyBtnText}>Reply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      {comment.replies && comment.replies.length > 0 && (
        <View style={styles.repliesList}>
          {comment.replies.map((r) => (
            <CommentNode key={r.id} comment={r} onReply={onReply} onUserPress={onUserPress} depth={Math.min(depth + 1, 2)} />
          ))}
        </View>
      )}
    </View>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#FFFFFF' },

  scroll: { paddingBottom: 40 },

  photoContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: 350,
    resizeMode: 'cover',
  },
  tapToExpandBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
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
  multiPhotoWrap: {
    position: 'relative',
  },
  multiPhotoScroll: {
  },
  multiPhotoCard: {
    width: SCREEN_WIDTH,
    position: 'relative',
    overflow: 'hidden',
  },
  photoCountBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(20, 20, 20, 0.65)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  photoCountText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  multiPhotoHint: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    color: '#FFFFFF',
    backgroundColor: 'rgba(20, 20, 20, 0.65)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: SIZES.xsmall,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  photoPlaceholder: {
    height: 200,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoHint: { color: COLORS.textMuted, fontSize: SIZES.small, marginTop: 8, fontFamily: 'PlusJakartaSans_500Medium' },

  pillRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  urgencyText: { fontSize: SIZES.sm, fontWeight: '700', fontFamily: 'PlusJakartaSans_700Bold' },

  section: {
    backgroundColor: COLORS.surface,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 6,
    borderBottomColor: '#F2F2F2',
  },
  sectionTitle: {
    fontSize: 15, fontWeight: '700',
    color: COLORS.textPrimary, marginBottom: 12,
    fontFamily: 'PlusJakartaSans_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  mapCard: { borderRadius: 0, overflow: 'hidden' },

  infoRow: { 
    flexDirection: 'row', 
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  infoContent:{ flex: 1 },
  infoLabel:  {
    fontSize: 12, color: '#666',
    fontWeight: '600',
    fontFamily: 'PlusJakartaSans_600SemiBold',
    marginBottom: 4,
  },
  infoValue:  { fontSize: 14, color: COLORS.textPrimary, fontFamily: 'PlusJakartaSans_400Regular' },

  userRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  userInfo: { flex: 1, flexShrink: 1 },
  userName: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, fontFamily: 'PlusJakartaSans_700Bold' },
  userSub:  { fontSize: 13, color: COLORS.textMuted, marginTop: 2, fontFamily: 'PlusJakartaSans_400Regular' },

  responderSection: {
    backgroundColor: '#F0F8FF',
    padding: 16,
    borderBottomWidth: 6,
    borderBottomColor: '#F2F2F2',
  },
  responderText: { flex: 1, fontSize: 14, color: '#004085', fontWeight: '600', fontFamily: 'PlusJakartaSans_600SemiBold' },

  simpleBtn: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#2E7A99',
    paddingVertical: 10, borderRadius: SIZES.r8,
    marginTop: 12,
  },
  simpleBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold' },

  actionBtn: { marginHorizontal: 16, marginBottom: 12, borderRadius: SIZES.r8 },

  commentsTitle: {
    fontSize: 15, fontWeight: '700',
    color: COLORS.textPrimary, 
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    fontFamily: 'PlusJakartaSans_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  noComments: { fontSize: SIZES.body, color: COLORS.textMuted, marginHorizontal: 16, marginBottom: SIZES.paddingM, fontFamily: 'PlusJakartaSans_400Regular' },

  commentNodeWrap: { marginBottom: 12, paddingHorizontal: 16 },
  replyIndent: {
    marginLeft: 38,
    marginTop: 8,
  },
  repliesList: { marginTop: 4 },
  commentItem: { flexDirection: 'row', alignItems: 'flex-start' },
  commentBubble: {
    flex: 1, marginLeft: 10,
  },
  commentBubbleReply: {
  },
  commentUser: { fontSize: 14, fontWeight: '700', color: '#1A1A1A', fontFamily: 'PlusJakartaSans_700Bold' },
  commentText: { fontSize: 14, color: '#333333', marginTop: 2, lineHeight: 20, fontFamily: 'PlusJakartaSans_400Regular' },
  commentMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 12 },
  commentTime: { fontSize: 12, color: COLORS.textMuted, fontFamily: 'PlusJakartaSans_500Medium' },
  replyBtn: { flexDirection: 'row', alignItems: 'center' },
  replyBtnText: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted, fontFamily: 'PlusJakartaSans_600SemiBold' },

  replyBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SIZES.paddingL, paddingVertical: 8,
    backgroundColor: '#F5F5F5', borderTopWidth: 1, borderTopColor: COLORS.divider,
  },
  replyBannerText: { fontSize: SIZES.small, color: COLORS.textPrimary, fontFamily: 'PlusJakartaSans_600SemiBold' },

  inputBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: '#E0E0E0',
  },
  commentInput: {
    flex: 1, minHeight: 40, backgroundColor: '#F0F2F5',
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8,
    fontSize: 14, color: '#1A1A1A',
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  sendBtn:         { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.35 },

  // Full-Screen Image Preview Modal
  previewModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
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
