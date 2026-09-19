import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import StatusPill from '../../components/StatusPill';
import Avatar from '../../components/Avatar';
import EmptyState from '../../components/EmptyState';
import Header from '../../components/Header';

const FILTERS = ['Pending', 'Approved', 'Rejected', 'All'];

export default function AdvocateRequestsScreen({ navigation }) {
  const { getAdvocateRequests, updateRequestStatus, startConversation, showAlert } = useApp();
  const [filter, setFilter] = useState('Pending');

  const all          = getAdvocateRequests();
  const filtered     = filter === 'All' ? all : all.filter((r) => r.status === filter);
  const pendingCount = all.filter((r) => r.status === 'Pending').length;

  const handleApprove = (req) => {
    const isAdoption = req.type === 'Adoption';
    showAlert({
      title: isAdoption ? 'Approve Adoption' : 'Approve Foster',
      message: isAdoption
        ? `Approve ${req.requesterName} to permanently adopt ${req.animalName}? This will mark ${req.animalName} as Adopted.`
        : `Approve ${req.requesterName} to foster ${req.animalName}? This will mark ${req.animalName} as Being Fostered.\n\nCommit duration: ${req.commitDuration || 'Not specified'}`,
      type: 'info',
      customIcon: 'paw',
      secondaryText: 'Cancel',
      primaryText: 'Approve',
      onPrimaryPress: () => {
        updateRequestStatus(req.id, 'Approved');
        const msg = isAdoption
          ? `Hi ${req.requesterName}! Your adoption request for ${req.animalName} has been approved! Welcome to the family!`
          : `Hi ${req.requesterName}! Your foster request for ${req.animalName} has been approved! Let's coordinate the handover.`;
        const convId = startConversation(req.requesterId, req.requesterName, msg);
        setTimeout(() => {
          showAlert({
            title: 'Request Approved!',
            message: 'A message has been sent to notify them.',
            type: 'success',
            customIcon: 'checkmark-circle',
            secondaryText: 'OK',
            primaryText: 'Open Chat',
            onPrimaryPress: () => navigation.navigate('Chat', { conversationId: convId, otherName: req.requesterName }),
          });
        }, 300);
      },
    });
  };

  const handleReject = (req) => {
    showAlert({
      title: 'Reject Request',
      message: `Reject ${req.requesterName}'s ${req.type.toLowerCase()} request for ${req.animalName}?`,
      type: 'warning',
      customIcon: 'alert-circle',
      secondaryText: 'Cancel',
      primaryText: 'Reject',
      onPrimaryPress: () => updateRequestStatus(req.id, 'Rejected'),
    });
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <Header
        title="Requests"
        onBack={() => navigation.goBack()}
      />

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabOn]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextOn]}>{f}</Text>
            {f === 'Pending' && pendingCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="heart-outline"
            title="No requests here"
            subtitle="Nothing in this category yet."
          />
        }
        renderItem={({ item }) => (
          <RequestCard
            request={item}
            onApprove={() => handleApprove(item)}
            onReject={() => handleReject(item)}
            onViewProfile={() =>
              navigation.navigate('PublicProfile', {
                userId: item.requesterId,
                userName: item.requesterName,
                userAvatar: item.requesterAvatar,
                userRole: 'community',
              })
            }
            onMessage={() => {
              const convId = startConversation(item.requesterId, item.requesterName, item.requesterAvatar);
              navigation.navigate('Chat', {
                conversationId: convId,
                otherName: item.requesterName,
                otherId: item.requesterId,
                otherAvatar: item.requesterAvatar,
                initialDraft: `Hi ${item.requesterName}!`,
              });
            }}
          />
        )}
      />
    </View>
  );
}

function RequestCard({ request, onApprove, onReject, onMessage, onViewProfile }) {
  const isAdoption = request.type === 'Adoption';
  const typeColor  = isAdoption ? COLORS.primaryDeep : '#B45309';
  const typeBg     = isAdoption ? COLORS.tagBg : '#FEF3DC';
  const typeIcon   = isAdoption ? 'home' : 'heart';

  return (
    <View style={styles.card}>
      {/* Top row */}
      <View style={styles.cardTop}>
        <TouchableOpacity onPress={onViewProfile} activeOpacity={0.8} style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 }}>
          <Avatar name={request.requesterName} uri={request.requesterAvatar} userId={request.requesterId} size={42} />
          <View style={styles.cardInfo}>
            <Text style={styles.requesterName} numberOfLines={1}>{request.requesterName}</Text>
            <View style={styles.typeRow}>
              <View style={[styles.typePill, { backgroundColor: typeBg }]}>
                <Ionicons name={typeIcon} size={11} color={typeColor} />
                <Text style={[styles.typeText, { color: typeColor }]}>{request.type}</Text>
              </View>
              <Text style={styles.forAnimal} numberOfLines={1}>for {request.animalName}</Text>
            </View>
          </View>
        </TouchableOpacity>
        <StatusPill status={request.status} />
      </View>

      {/* Commit duration — foster only */}
      {request.type === 'Foster' && request.commitDuration && (
        <View style={styles.durationRow}>
          <Ionicons name="time-outline" size={13} color="#B45309" />
          <Text style={styles.durationText}>Can commit: <Text style={{ fontWeight: '700' }}>{request.commitDuration}</Text></Text>
        </View>
      )}

      {/* Message */}
      {request.message ? (
        <View style={styles.msgBox}>
          <Ionicons name="chatbubble-outline" size={13} color={COLORS.textMuted} />
          <Text style={styles.msgText} numberOfLines={3}>{request.message}</Text>
        </View>
      ) : null}

      <Text style={styles.dateText}>
        {new Date(request.createdAt).toLocaleDateString('en-PH', { dateStyle: 'medium' })}
      </Text>

      {/* Actions — only for pending */}
      {request.status === 'Pending' && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.rejectBtn} onPress={onReject}>
            <Ionicons name="close" size={15} color={COLORS.danger} />
            <Text style={styles.rejectText}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.approveBtn, { backgroundColor: typeColor }]}
            onPress={onApprove}
          >
            <Ionicons name="checkmark" size={15} color="#fff" />
            <Text style={styles.approveText}>
              {isAdoption ? 'Approve Adoption' : 'Approve Foster'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.msgBtn} onPress={onMessage}>
            <Ionicons name="chatbubble-ellipses" size={16} color={COLORS.primaryDeep} />
          </TouchableOpacity>
        </View>
      )}

      {/* Approved info */}
      {request.status === 'Approved' && (
        <View style={styles.approvedBanner}>
          <Ionicons name="checkmark-circle" size={15} color={COLORS.success} />
          <Text style={styles.approvedText}>
            {isAdoption
              ? `${request.requesterName} is now adopting ${request.animalName} permanently.`
              : `${request.requesterName} is currently fostering ${request.animalName}.`}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root:  { flex: 1, backgroundColor: COLORS.background },

  filterRow: {
    flexDirection: 'row', paddingHorizontal: SIZES.lg24,
    paddingVertical: SIZES.sm8 + 4, gap: SIZES.sm8,
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  filterTab: {
    flexDirection: 'row', alignItems: 'center', gap: SIZES.xs4,
    paddingHorizontal: SIZES.sm8 + 4, paddingVertical: SIZES.xs4 + 4,
    borderRadius: SIZES.r999, backgroundColor: COLORS.inputBg,
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  filterTabOn:  { backgroundColor: COLORS.primaryDeep, borderColor: COLORS.primaryDeep },
  filterText:   { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.textSecondary },
  filterTextOn: { color: '#fff' },
  badge: {
    backgroundColor: COLORS.danger, borderRadius: 8,
    minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  badgeText: { fontSize: 9, color: '#fff', fontWeight: '800' },

  list: { padding: SIZES.md16, paddingBottom: 110 },

  card: {
    backgroundColor: COLORS.surface, borderRadius: SIZES.r16,
    padding: SIZES.md16, marginBottom: SIZES.md16, ...SHADOWS.card,
  },
  cardTop:     { flexDirection: 'row', alignItems: 'center', marginBottom: SIZES.sm8 },
  cardInfo:    { flex: 1, marginLeft: SIZES.sm8 + 2 },
  requesterName: { fontSize: SIZES.body, fontWeight: '700', color: COLORS.brown },
  typeRow:     { flexDirection: 'row', alignItems: 'center', gap: SIZES.xs4 + 2, marginTop: 3 },
  typePill:    { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: SIZES.xs4 + 4, paddingVertical: 2, borderRadius: SIZES.r999 },
  typeText:    { fontSize: SIZES.xs, fontWeight: '700' },
  forAnimal:   { fontSize: SIZES.xs, color: COLORS.textSecondary },

  durationRow: {
    flexDirection: 'row', alignItems: 'center', gap: SIZES.xs4,
    backgroundColor: '#FEF3DC', borderRadius: SIZES.r8,
    paddingHorizontal: SIZES.sm8, paddingVertical: SIZES.xs4 + 2,
    marginBottom: SIZES.sm8, alignSelf: 'flex-start',
  },
  durationText: { fontSize: SIZES.xs, color: '#92400E' },

  msgBox: {
    flexDirection: 'row', gap: SIZES.xs4 + 2, alignItems: 'flex-start',
    backgroundColor: COLORS.inputBg, borderRadius: SIZES.r12,
    padding: SIZES.sm8 + 2, marginBottom: SIZES.xs4 + 2,
  },
  msgText:  { flex: 1, fontSize: SIZES.sm, color: COLORS.textSecondary, lineHeight: 18 },
  dateText: { fontSize: SIZES.xs, color: COLORS.textMuted, marginBottom: SIZES.sm8 },

  actions:    { flexDirection: 'row', gap: SIZES.xs4 + 2, marginTop: SIZES.xs4 },
  rejectBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    paddingVertical: SIZES.sm8 + 2, borderRadius: SIZES.r12,
    borderWidth: 1.5, borderColor: COLORS.danger, backgroundColor: '#FCE8E8',
  },
  rejectText:  { fontSize: SIZES.sm, fontWeight: '700', color: COLORS.danger },
  approveBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    paddingVertical: SIZES.sm8 + 2, borderRadius: SIZES.r12,
  },
  approveText: { fontSize: SIZES.sm, fontWeight: '700', color: '#fff' },
  msgBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.tagBg, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: COLORS.primaryLight,
  },

  approvedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: SIZES.xs4 + 2,
    backgroundColor: '#D8F0E4', borderRadius: SIZES.r12,
    padding: SIZES.sm8 + 2, marginTop: SIZES.xs4,
  },
  approvedText: { flex: 1, fontSize: SIZES.sm, color: COLORS.success, fontWeight: '600', lineHeight: 18 },
});
