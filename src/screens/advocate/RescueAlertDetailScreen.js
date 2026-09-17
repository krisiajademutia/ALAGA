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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import Avatar from '../../components/Avatar';

export default function RescueAlertDetailScreen({ route, navigation }) {
  const { reportId } = route.params || {};
  const {
    rescueReports,
    currentUser,
    addComment,
    respondToReport,
    startConversation,
  } = useApp();

  const report = rescueReports.find((r) => r.id === reportId) || rescueReports[0];
  const [commentText, setCommentText] = useState('');
  const [isFav, setIsFav] = useState(false);

  if (!report) return null;

  const handleRespond = () => {
    respondToReport(report.id);
    Alert.alert(
      'Responded',
      'You have claimed to assist this rescue case. Other advocates can see you responded.'
    );
  };

  const handleMessageAdvocate = () => {
    const convId = startConversation(
      report.reporterId,
      report.reporterName,
      `Hi! I saw the rescue alert for ${report.title || report.animalType}. I can help!`
    );
    navigation.navigate('Chat', {
      conversationId: convId,
      otherName: report.reporterName,
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
          {report.photo ? (
            <Image source={{ uri: report.photo }} style={styles.heroImage} resizeMode="cover" />
          ) : (
            <View style={styles.placeholderWrap}>
              <Ionicons name="paw" size={64} color="#92CDE5" />
            </View>
          )}

          {/* Floating Back */}
          <TouchableOpacity
            style={styles.floatingBack}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-back" size={20} color="#473018" />
          </TouchableOpacity>

          {/* Floating Heart */}
          <TouchableOpacity
            style={styles.floatingHeart}
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
              {report.location?.address || 'Pasig City (1.2 km away)'} • {report.dateDisplay || 'August 26, 2026'}
            </Text>
          </View>

          {/* 3 Stats Cards */}
          <View style={styles.statsRow}>
            <View style={[styles.statCard, styles.statGreen]}>
              <Text style={styles.statLabel}>Gender</Text>
              <Text style={styles.statVal}>{report.gender || 'Male'}</Text>
            </View>
            <View style={[styles.statCard, styles.statYellow]}>
              <Text style={styles.statLabel}>Type</Text>
              <Text style={styles.statVal}>{report.animalType || 'Dog'}</Text>
            </View>
            <View style={[styles.statCard, styles.statBlue]}>
              <Text style={styles.statLabel}>Condition</Text>
              <Text style={styles.statVal}>{report.condition || 'Injured'}</Text>
            </View>
          </View>

          {/* Advocate Card */}
          <View style={styles.advocateCard}>
            <View style={styles.advocateLeft}>
              <Avatar name={report.reporterName || 'Elena Ramos'} size={42} />
              <View style={styles.advocateTextCol}>
                <Text style={styles.advocateName}>{report.reporterName || 'Elena Ramos'}</Text>
                <Text style={styles.advocateRole}>
                  Verified Community Foster Advocate
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
              {(report.tags || ['Injured', 'Aggressive', 'Needs help', 'Scared']).map(
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

          {/* Map Preview Card */}
          <TouchableOpacity
            style={styles.mapCard}
            onPress={() => navigation.navigate('RescueAlerts')}
            activeOpacity={0.9}
          >
            <View style={styles.mapPlaceholder}>
              <Ionicons name="location" size={32} color="#D94F4F" />
              <Text style={styles.mapNotice}>Interactive Map View</Text>
            </View>
            <View style={styles.mapFooter}>
              <View style={styles.mapFooterLeft}>
                <Ionicons name="location-outline" size={16} color="#473018" />
                <Text style={styles.mapFooterText}>
                  {report.location?.landmark || 'Near Bantay Hayop Clinic, Pasig Blvd'}
                </Text>
              </View>
              <Text style={styles.mapFooterLink}>Click to view full map</Text>
            </View>
          </TouchableOpacity>

          {/* Respond Button */}
          <TouchableOpacity
            style={styles.respondBtn}
            onPress={handleRespond}
            activeOpacity={0.88}
          >
            <Text style={styles.respondBtnText}>Respond (I’ll help!)</Text>
          </TouchableOpacity>

          {/* Comments Section */}
          <View style={styles.commentsSection}>
            <Text style={styles.commentsTitle}>
              Comments ({report.comments?.length || 1})
            </Text>

            {(report.comments && report.comments.length > 0
              ? report.comments
              : [
                  {
                    id: 'c1',
                    userName: 'Juan Dela Cruz',
                    text: 'Hello po willing to help po! I sent a message',
                    createdAt: 'Aug 27, 2026 3:50 PM',
                  },
                ]
            ).map((c) => (
              <View key={c.id} style={styles.commentItem}>
                <Avatar name={c.userName} size={36} />
                <View style={styles.commentBubble}>
                  <Text style={styles.commentUser}>{c.userName}</Text>
                  <Text style={styles.commentContent}>{c.text}</Text>
                  <View style={styles.commentBottomRow}>
                    <Text style={styles.commentTime}>{c.createdAt}</Text>
                    <TouchableOpacity style={styles.replyBtn}>
                      <Ionicons name="chatbubble-outline" size={12} color="#2E7A99" />
                      <Text style={styles.replyBtnText}>Reply</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}

            {/* Write comment input */}
            <View style={styles.writeCommentRow}>
              <Avatar name={currentUser?.name || 'Kareena Jane'} size={34} />
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
                <Ionicons name="paper-plane-outline" size={22} color="#2E7A99" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
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
  heroImage: {
    width: '100%',
    height: '100%',
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
    color: '#241408',
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
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CCE3EE',
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    ...SHADOWS.sm,
  },
  mapPlaceholder: {
    height: 120,
    backgroundColor: '#F5F9F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapNotice: {
    fontSize: 12,
    color: '#8C7D6A',
    marginTop: 4,
    fontWeight: '600',
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  mapFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#EEF7FA',
  },
  mapFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
    backgroundColor: '#F8FAF9',
    borderWidth: 1,
    borderColor: '#CCE3EE',
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
});
