import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import StatusPill from '../../components/StatusPill';
import Avatar from '../../components/Avatar';
import Button from '../../components/Button';
import MapCard from '../../components/MapCard';
import Header from '../../components/Header';
import { URGENCY_LEVELS } from '../../data/mockData';

export default function ReportDetailScreen({ route, navigation }) {
  const { reportId } = route.params || {};
  const { rescueReports, currentUser, addComment, respondToReport, markRescued } = useApp();
  const report = rescueReports.find((r) => r.id === reportId);
  const [commentText, setCommentText] = useState('');
  const [replyTarget, setReplyTarget] = useState(null); // { id, name }

  if (!report) return null;

  const urgency    = URGENCY_LEVELS.find((u) => u.label === report.urgency) || URGENCY_LEVELS[2];
  const isAdvocate = currentUser?.role === 'advocate';
  const isResponder = currentUser?.id === report.responderId;
  const canRespond  = isAdvocate && report.status === 'Open';
  const canMarkRescued = isAdvocate && isResponder && report.status === 'Responded';

  const handleComment = () => {
    if (!commentText.trim()) return;
    addComment(reportId, commentText.trim(), replyTarget?.id || null);
    setCommentText('');
    setReplyTarget(null);
  };

  const handleRespond = () => {
    Alert.alert('Respond to Rescue', 'Are you willing to assist with this rescue case?', [
      { text: 'Cancel', style: 'cancel' },
      { text: "Yes, I'll Help", onPress: () => respondToReport(reportId) },
    ]);
  };

  const handleMarkRescued = () => {
    Alert.alert('Mark as Rescued', 'Confirm that this animal has been successfully rescued.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: () => markRescued(reportId) },
    ]);
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
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Photo */}
        {report.photo ? (
          <Image source={{ uri: report.photo }} style={styles.photo} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Ionicons name="paw" size={48} color={COLORS.primaryLight} />
            <Text style={styles.photoHint}>No photo attached</Text>
          </View>
        )}

        {/* Status + Urgency pills */}
        <View style={styles.pillRow}>
          <StatusPill status={report.status} />
          <View style={[styles.urgencyPill, { backgroundColor: urgency.bg }]}>
            <View style={[styles.urgencyDot, { backgroundColor: urgency.color }]} />
            <Text style={[styles.urgencyText, { color: urgency.color }]}>
              {report.urgency} Urgency
            </Text>
          </View>
        </View>

        {/* Animal info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Animal Details</Text>
          <InfoRow icon="paw-outline"          label="Type"        value={report.animalType} />
          <InfoRow icon="medical-outline"       label="Condition"   value={report.condition} />
          <InfoRow icon="document-text-outline" label="Description" value={report.description} />
        </View>

        {/* ── Location card with interactive map ─────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Location</Text>
          <MapCard
            location={report.location}
            title={`${report.animalType} reported here`}
            style={styles.mapCard}
          />
        </View>

        {/* Reporter — tappable avatar → PublicProfile */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Reported By</Text>
          <TouchableOpacity
            style={styles.userRow}
            onPress={() => navigation.navigate('PublicProfile', { userId: report.reporterId })}
            activeOpacity={0.8}
          >
            <Avatar name={report.reporterName} size={42} />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{report.reporterName}</Text>
              <Text style={styles.userSub}>
                {new Date(report.createdAt).toLocaleDateString('en-PH', { dateStyle: 'medium' })}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Responder badge */}
        {report.responderId && (
          <View style={[styles.card, styles.responderCard]}>
            <Ionicons name="shield-checkmark" size={18} color={COLORS.secondaryDark} />
            <Text style={styles.responderText}>
              An Animal Advocate has responded to this case.
            </Text>
          </View>
        )}

        {/* Advocate action buttons */}
        {canRespond && (
          <Button
            title="Respond — I'll Help!"
            onPress={handleRespond}
            variant="secondary"
            style={styles.actionBtn}
            icon={<Ionicons name="shield-checkmark-outline" size={18} color="#fff" />}
          />
        )}
        {canMarkRescued && (
          <Button
            title="Mark as Rescued"
            onPress={handleMarkRescued}
            style={styles.actionBtn}
            icon={<Ionicons name="checkmark-circle-outline" size={18} color="#fff" />}
          />
        )}

        {/* Comments */}
        <Text style={styles.commentsTitle}>
          Comments ({countComments(report.comments)})
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

function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={15} color={COLORS.textMuted} style={styles.infoIcon} />
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },

  scroll: { padding: SIZES.paddingL, paddingBottom: 20 },

  photo: {
    width: '100%', height: 220, borderRadius: SIZES.radiusLg,
    marginBottom: SIZES.paddingM, resizeMode: 'cover',
  },
  photoPlaceholder: {
    height: 160, backgroundColor: COLORS.tagBg, borderRadius: SIZES.radiusLg,
    alignItems: 'center', justifyContent: 'center', marginBottom: SIZES.paddingM,
  },
  photoHint: { color: COLORS.textMuted, fontSize: SIZES.small, marginTop: 8, fontFamily: 'PlusJakartaSans_500Medium' },

  pillRow: { flexDirection: 'row', gap: 8, marginBottom: SIZES.paddingM },
  urgencyPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: SIZES.radiusFull,
  },
  urgencyDot:  { width: 8, height: 8, borderRadius: 4 },
  urgencyText: { fontSize: SIZES.xsmall, fontWeight: '700', fontFamily: 'PlusJakartaSans_700Bold' },

  card: {
    backgroundColor: COLORS.surface, borderRadius: SIZES.radiusLg,
    padding: SIZES.paddingM, marginBottom: SIZES.paddingM, ...SHADOWS.card,
  },
  cardTitle: {
    fontSize: SIZES.body, fontWeight: '800',
    color: COLORS.brown, marginBottom: 12,
    letterSpacing: -0.2,
    fontFamily: 'PlusJakartaSans_700Bold',
  },

  mapCard: { borderRadius: SIZES.radius, overflow: 'hidden' },

  infoRow:    { flexDirection: 'row', marginBottom: 10 },
  infoIcon:   { marginRight: 10, marginTop: 2 },
  infoContent:{ flex: 1 },
  infoLabel:  {
    fontSize: SIZES.xsmall, color: COLORS.textMuted,
    fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  infoValue:  { fontSize: SIZES.body, color: COLORS.brown, marginTop: 3, lineHeight: 20, fontFamily: 'PlusJakartaSans_500Medium' },

  userRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  userInfo: { flex: 1 },
  userName: { fontSize: SIZES.body, fontWeight: '700', color: COLORS.brown, fontFamily: 'PlusJakartaSans_700Bold' },
  userSub:  { fontSize: SIZES.small, color: COLORS.textMuted, marginTop: 2, fontFamily: 'PlusJakartaSans_500Medium' },

  responderCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.advocateBadge,
  },
  responderText: { flex: 1, fontSize: SIZES.body, color: COLORS.secondaryDark, fontWeight: '600', fontFamily: 'PlusJakartaSans_600SemiBold' },

  actionBtn: { marginBottom: SIZES.paddingM, borderRadius: SIZES.radiusFull },

  commentsTitle: {
    fontSize: SIZES.medium, fontWeight: '800',
    color: COLORS.brown, marginBottom: SIZES.paddingM,
    letterSpacing: -0.2,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  noComments: { fontSize: SIZES.body, color: COLORS.textMuted, marginBottom: SIZES.paddingM, fontFamily: 'PlusJakartaSans_400Regular' },

  commentNodeWrap: { marginBottom: 8 },
  replyIndent: {
    marginLeft: 14,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.border,
    marginTop: 6,
  },
  repliesList: { marginTop: 4 },
  commentItem: { flexDirection: 'row', alignItems: 'flex-start' },
  commentBubble: {
    flex: 1, marginLeft: 8, backgroundColor: COLORS.surface,
    borderRadius: SIZES.r12, paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: COLORS.border,
  },
  commentBubbleReply: {
    backgroundColor: COLORS.inputBg,
  },
  commentUser: { fontSize: SIZES.small, fontWeight: '700', color: COLORS.brown, fontFamily: 'PlusJakartaSans_700Bold' },
  commentText: { fontSize: SIZES.body, color: COLORS.textSecondary, marginTop: 2, lineHeight: 20, fontFamily: 'PlusJakartaSans_400Regular' },
  commentMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  commentTime: { fontSize: SIZES.xsmall, color: COLORS.textMuted, fontFamily: 'PlusJakartaSans_500Medium' },
  replyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 4, paddingVertical: 2 },
  replyBtnText: { fontSize: SIZES.xsmall, fontWeight: '700', color: COLORS.primaryDeep, fontFamily: 'PlusJakartaSans_700Bold' },

  replyBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SIZES.paddingL, paddingVertical: 8,
    backgroundColor: COLORS.tagBg, borderTopWidth: 1, borderTopColor: COLORS.divider,
  },
  replyBannerText: { fontSize: SIZES.small, color: COLORS.primaryDeep, fontFamily: 'PlusJakartaSans_600SemiBold' },

  inputBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: SIZES.paddingL, paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.divider,
  },
  commentInput: {
    flex: 1, minHeight: 40, backgroundColor: COLORS.inputBg,
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8,
    fontSize: SIZES.body, color: COLORS.brown,
    borderWidth: 1.5, borderColor: COLORS.border,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  sendBtn:         { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.35 },
});
