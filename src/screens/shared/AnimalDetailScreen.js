import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import StatusPill from '../../components/StatusPill';
import Avatar from '../../components/Avatar';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import Input from '../../components/Input';
import { FOSTER_DURATIONS } from '../../data/mockData';

export default function AnimalDetailScreen({ route, navigation }) {
  const { animalId } = route.params;
  const { animals, currentUser, submitRequest, requests, startConversation } = useApp();
  const animal = animals.find((a) => a.id === animalId);

  const [modalVisible, setModalVisible] = useState(false);
  const [requestType, setRequestType] = useState('Adoption');
  const [message, setMessage] = useState('');
  const [commitDuration, setCommitDuration] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!animal) return null;

  const isOwner     = currentUser?.id === animal.advocateId;
  const isCommunity = currentUser?.role === 'community';

  const existingRequest = requests.find(
    (r) => r.animalId === animalId && r.requesterId === currentUser?.id
  );

  const isAvailable = animal.status === 'Available';
  const canRequest  = isCommunity && !existingRequest && isAvailable;

  // What types can be requested?
  const canAdopt  = animal.listingType === 'Adoption' || animal.listingType === 'Both';
  const canFoster = animal.listingType === 'Foster'   || animal.listingType === 'Both';

  const openModal = (type) => {
    setRequestType(type);
    setMessage('');
    setCommitDuration('');
    setModalVisible(true);
  };

  const handleSubmit = () => {
    if (!message.trim()) {
      Alert.alert('Add a message', 'Please introduce yourself and share a bit about your home.');
      return;
    }
    if (requestType === 'Foster' && !commitDuration) {
      Alert.alert('Select duration', 'Please choose how long you can commit to fostering.');
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      submitRequest({
        animalId: animal.id,
        animalName: animal.name,
        advocateId: animal.advocateId,
        type: requestType,
        message: message.trim(),
        commitDuration: requestType === 'Foster' ? commitDuration : null,
      });
      setSubmitting(false);
      setModalVisible(false);
      Alert.alert(
        requestType === 'Adoption' ? '🏠 Adoption Request Sent!' : '💛 Foster Request Sent!',
        `Your request for ${animal.name} has been sent to ${animal.advocateName}. They will review it and get back to you soon.`,
        [{ text: 'Got it!' }]
      );
    }, 800);
  };

  const handleMessageAdvocate = () => {
    const convId = startConversation(
      animal.advocateId, animal.advocateName,
      `Hi! I'm interested in ${animal.name}. Can you tell me more?`
    );
    navigation.navigate('Chat', { conversationId: convId, otherName: animal.advocateName });
  };

  return (
    <View style={styles.flex}>
      <StatusBar style="light" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Hero ──────────────────────────────────────────── */}
        <View style={styles.heroWrap}>
          {animal.photo ? (
            <Image source={{ uri: animal.photo }} style={styles.hero} resizeMode="cover" />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Ionicons name="paw" size={64} color={COLORS.primaryLight} />
            </View>
          )}
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.heroPill}>
            <StatusPill status={animal.status} />
          </View>
        </View>

        <View style={styles.body}>

          {/* Name row */}
          <View style={styles.nameRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.animalName}>{animal.name}</Text>
              <Text style={styles.animalSub}>{animal.species} · {animal.breed} · {animal.gender}</Text>
            </View>
            <View style={styles.agePill}>
              <Text style={styles.ageText}>{animal.age}</Text>
            </View>
          </View>

          {/* Listing type + foster duration info */}
          {isAvailable && (
            <View style={styles.listingInfoRow}>
              {canAdopt && (
                <View style={styles.listingChip}>
                  <Ionicons name="home" size={13} color={COLORS.primaryDeep} />
                  <Text style={styles.listingChipText}>Open for Adoption</Text>
                </View>
              )}
              {canFoster && (
                <View style={[styles.listingChip, styles.listingChipFoster]}>
                  <Ionicons name="heart" size={13} color="#B45309" />
                  <Text style={[styles.listingChipText, { color: '#B45309' }]}>
                    Foster{animal.fosterDuration ? ` · ${animal.fosterDuration}` : ''}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Tags */}
          {animal.tags?.length > 0 && (
            <View style={styles.tags}>
              {animal.tags.map((t) => <Badge key={t} label={t} />)}
            </View>
          )}

          {/* Health chips */}
          <View style={styles.healthRow}>
            <HealthChip icon="shield-checkmark" label="Vaccinated"      active={animal.vaccinated} />
            <HealthChip icon="medkit"           label="Neutered/Spayed" active={animal.neutered} />
            <HealthChip icon="color-palette"    label={animal.color}    neutral />
          </View>

          {/* About */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>About {animal.name}</Text>
            <Text style={styles.description}>{animal.description}</Text>
          </View>

          {/* What does adoption / foster mean? */}
          {isAvailable && (
            <View style={styles.infoCard}>
              <Text style={styles.infoCardTitle}>What does this mean?</Text>
              {canAdopt && (
                <View style={styles.infoItem}>
                  <Ionicons name="home-outline" size={16} color={COLORS.primaryDeep} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.infoItemTitle}>Adoption — Permanent Home</Text>
                    <Text style={styles.infoItemDesc}>
                      You become {animal.name}'s forever owner. They will live with you permanently.
                    </Text>
                  </View>
                </View>
              )}
              {canAdopt && canFoster && <View style={styles.infoDivider} />}
              {canFoster && (
                <View style={styles.infoItem}>
                  <Ionicons name="heart-outline" size={16} color="#B45309" />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.infoItemTitle, { color: '#B45309' }]}>Foster — Temporary Care</Text>
                    <Text style={styles.infoItemDesc}>
                      You take care of {animal.name} temporarily
                      {animal.fosterDuration ? ` (suggested: ${animal.fosterDuration})` : ''}.
                      The advocate remains the owner and will find a permanent home.
                    </Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Details */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Details</Text>
            <InfoRow icon="paw-outline"      label="Condition" value={animal.condition} />
            <InfoRow icon="calendar-outline" label="Listed on" value={new Date(animal.createdAt).toLocaleDateString('en-PH', { dateStyle: 'medium' })} />
          </View>

          {/* Advocate */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Posted by</Text>
            <TouchableOpacity
              style={styles.advocateRow}
              onPress={() => navigation.navigate('PublicProfile', { userId: animal.advocateId })}
              activeOpacity={0.8}
            >
              <Avatar name={animal.advocateName} size={42} />
              <View style={styles.advocateInfo}>
                <Text style={styles.advocateName}>{animal.advocateName}</Text>
                <View style={styles.advocateBadge}>
                  <Ionicons name="shield-checkmark" size={11} color={COLORS.secondaryDark} />
                  <Text style={styles.advocateBadgeText}>Animal Advocate · View Profile</Text>
                </View>
              </View>
              {!isOwner ? (
                <TouchableOpacity
                  style={styles.msgBtn}
                  onPress={(e) => { e.stopPropagation(); handleMessageAdvocate(); }}
                >
                  <Ionicons name="chatbubble-ellipses" size={18} color={COLORS.primaryDeep} />
                </TouchableOpacity>
              ) : (
                <Ionicons name="chevron-forward" size={15} color={COLORS.textMuted} />
              )}
            </TouchableOpacity>
          </View>

          {/* Existing request */}
          {existingRequest && (
            <View style={styles.existingBanner}>
              <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
              <View style={{ flex: 1 }}>
                <Text style={styles.existingTitle}>
                  You applied to {existingRequest.type === 'Adoption' ? 'adopt' : 'foster'} {animal.name}
                </Text>
                <Text style={styles.existingStatus}>Status: {existingRequest.status}</Text>
              </View>
              <StatusPill status={existingRequest.status} />
            </View>
          )}

          {/* Currently being fostered notice */}
          {animal.status === 'Being Fostered' && (
            <View style={styles.fosteredBanner}>
              <Ionicons name="heart" size={18} color="#B45309" />
              <Text style={styles.fosteredText}>
                {animal.name} is currently being fostered by {animal.fosterName || 'someone'}.
                Check back later — they may be available for permanent adoption soon.
              </Text>
            </View>
          )}

          {/* Donate */}
          {isCommunity && (
            <Button
              title={`Donate for ${animal.name}`}
              onPress={() => navigation.navigate('Donate', { animalId: animal.id, animalName: animal.name })}
              variant="outline"
              fullWidth
              style={styles.donateBtn}
              icon={<Ionicons name="gift-outline" size={16} color={COLORS.primaryDeep} />}
            />
          )}
        </View>
      </ScrollView>

      {/* ── Bottom CTA ─────────────────────────────────────── */}
      {canRequest && (
        <View style={styles.bottomBar}>
          {canAdopt && canFoster ? (
            // Both options available — show two buttons
            <View style={styles.bothBtnsRow}>
              <TouchableOpacity
                style={[styles.halfBtn, styles.adoptBtn]}
                onPress={() => openModal('Adoption')}
                activeOpacity={0.85}
              >
                <Ionicons name="home" size={17} color="#fff" />
                <Text style={styles.halfBtnText}>Adopt</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.halfBtn, styles.fosterBtn]}
                onPress={() => openModal('Foster')}
                activeOpacity={0.85}
              >
                <Ionicons name="heart" size={17} color="#fff" />
                <Text style={styles.halfBtnText}>Foster</Text>
              </TouchableOpacity>
            </View>
          ) : canAdopt ? (
            <Button
              title={`Apply to Adopt ${animal.name}`}
              onPress={() => openModal('Adoption')}
              fullWidth
              icon={<Ionicons name="home" size={17} color="#fff" />}
            />
          ) : (
            <Button
              title={`Apply to Foster ${animal.name}`}
              onPress={() => openModal('Foster')}
              fullWidth
              style={{ backgroundColor: '#D97706' }}
              icon={<Ionicons name="heart" size={17} color="#fff" />}
            />
          )}
        </View>
      )}

      {/* ── Apply Modal ────────────────────────────────────── */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity style={styles.overlayDismiss} onPress={() => setModalVisible(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />

            {/* Header */}
            <View style={styles.sheetHeader}>
              <View style={[
                styles.sheetIconWrap,
                { backgroundColor: requestType === 'Adoption' ? COLORS.tagBg : '#FEF3DC' },
              ]}>
                <Ionicons
                  name={requestType === 'Adoption' ? 'home' : 'heart'}
                  size={24}
                  color={requestType === 'Adoption' ? COLORS.primaryDeep : '#B45309'}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetTitle}>
                  {requestType === 'Adoption' ? 'Adoption Request' : 'Foster Request'}
                </Text>
                <Text style={styles.sheetSubtitle}>
                  {requestType === 'Adoption'
                    ? `You are applying to permanently adopt ${animal.name}.`
                    : `You are applying to temporarily foster ${animal.name}.`}
                </Text>
              </View>
            </View>

            {/* What this means */}
            <View style={styles.sheetInfoBox}>
              <Ionicons
                name="information-circle-outline"
                size={15}
                color={requestType === 'Adoption' ? COLORS.primaryDeep : '#B45309'}
              />
              <Text style={[
                styles.sheetInfoText,
                { color: requestType === 'Adoption' ? COLORS.primaryDeep : '#B45309' },
              ]}>
                {requestType === 'Adoption'
                  ? `${animal.name} will become part of your family permanently.`
                  : `You will care for ${animal.name} temporarily${animal.fosterDuration ? ` (suggested: ${animal.fosterDuration})` : ''}. The advocate retains ownership.`}
              </Text>
            </View>

            {/* Foster duration picker */}
            {requestType === 'Foster' && (
              <>
                <Text style={styles.fieldLabel}>How long can you commit?</Text>
                <View style={styles.durationGrid}>
                  {FOSTER_DURATIONS.map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={[styles.durationChip, commitDuration === d && styles.durationChipOn]}
                      onPress={() => setCommitDuration(d)}
                    >
                      <Text style={[styles.durationText, commitDuration === d && styles.durationTextOn]}>
                        {d}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* Message */}
            <Text style={styles.fieldLabel}>Your message to {animal.advocateName}</Text>
            <Input
              placeholder={
                requestType === 'Adoption'
                  ? `Tell ${animal.advocateName} about yourself, your home, and why you'd like to adopt ${animal.name}...`
                  : `Tell ${animal.advocateName} about yourself and how you will care for ${animal.name}...`
              }
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={4}
              autoCapitalize="sentences"
            />

            {/* Actions */}
            <View style={styles.sheetActions}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setModalVisible(false)}
                style={styles.cancelBtn}
              />
              <Button
                title="Submit Request"
                onPress={handleSubmit}
                loading={submitting}
                style={[
                  styles.submitBtn,
                  requestType === 'Foster' && { backgroundColor: '#D97706' },
                ]}
                icon={<Ionicons name={requestType === 'Adoption' ? 'home' : 'heart'} size={16} color="#fff" />}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function HealthChip({ icon, label, active, neutral }) {
  const color = neutral ? COLORS.textSecondary : active ? COLORS.secondaryDark : COLORS.textMuted;
  const bg    = neutral ? COLORS.inputBg       : active ? COLORS.advocateBadge  : COLORS.inputBg;
  return (
    <View style={[hc.chip, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={13} color={color} />
      <Text style={[hc.label, { color }]}>{label}</Text>
    </View>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <View style={ir.row}>
      <Ionicons name={icon} size={14} color={COLORS.textMuted} style={{ marginRight: 8, marginTop: 2 }} />
      <View>
        <Text style={ir.label}>{label}</Text>
        <Text style={ir.value}>{value}</Text>
      </View>
    </View>
  );
}

const hc = StyleSheet.create({
  chip:  { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: SIZES.sm8 + 2, paddingVertical: SIZES.xs4 + 2, borderRadius: SIZES.r999 },
  label: { fontSize: SIZES.xs, fontWeight: '600' },
});

const ir = StyleSheet.create({
  row:   { flexDirection: 'row', marginBottom: SIZES.sm8 },
  label: { fontSize: SIZES.xs, color: COLORS.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { fontSize: SIZES.body, color: COLORS.textPrimary, marginTop: 2 },
});

const styles = StyleSheet.create({
  flex:   { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingBottom: 130 },

  heroWrap:       { position: 'relative' },
  hero:           { width: '100%', height: 280 },
  heroPlaceholder:{ width: '100%', height: 280, backgroundColor: COLORS.tagBg, alignItems: 'center', justifyContent: 'center' },
  backBtn: {
    position: 'absolute', top: 48, left: 20,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center',
  },
  heroPill: { position: 'absolute', bottom: 14, right: 14 },

  body: { paddingHorizontal: SIZES.lg24, paddingTop: SIZES.lg24 },

  nameRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SIZES.sm8 },
  animalName: { fontSize: SIZES.xxl, fontWeight: '800', color: COLORS.brown },
  animalSub:  { fontSize: SIZES.body, color: COLORS.textSecondary, marginTop: 3 },
  agePill: {
    backgroundColor: COLORS.tagBg, paddingHorizontal: SIZES.sm8 + 2,
    paddingVertical: SIZES.xs4 + 2, borderRadius: SIZES.r999, marginLeft: SIZES.sm8,
  },
  ageText: { fontSize: SIZES.xs, fontWeight: '700', color: COLORS.primaryDeep },

  listingInfoRow: { flexDirection: 'row', gap: SIZES.sm8, marginBottom: SIZES.md16, flexWrap: 'wrap' },
  listingChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.tagBg, paddingHorizontal: SIZES.sm8 + 2, paddingVertical: SIZES.xs4 + 2,
    borderRadius: SIZES.r999, borderWidth: 1, borderColor: COLORS.primaryLight,
  },
  listingChipFoster: { backgroundColor: '#FEF3DC', borderColor: '#FDE3AC' },
  listingChipText: { fontSize: SIZES.sm, fontWeight: '700', color: COLORS.primaryDeep },

  tags:      { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.xs4 + 2, marginBottom: SIZES.md16 },
  healthRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.sm8, marginBottom: SIZES.md16 },

  card: {
    backgroundColor: COLORS.surface, borderRadius: SIZES.r16,
    padding: SIZES.md16, marginBottom: SIZES.md16, ...SHADOWS.card,
  },
  cardTitle:   { fontSize: SIZES.body, fontWeight: '800', color: COLORS.brown, marginBottom: SIZES.sm8 + 2 },
  description: { fontSize: SIZES.body, color: COLORS.textSecondary, lineHeight: 22 },

  infoCard: {
    backgroundColor: COLORS.surface, borderRadius: SIZES.r16,
    padding: SIZES.md16, marginBottom: SIZES.md16,
    borderWidth: 1, borderColor: COLORS.divider,
    ...SHADOWS.sm,
  },
  infoCardTitle: { fontSize: SIZES.sm, fontWeight: '800', color: COLORS.brown, marginBottom: SIZES.sm8 + 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoItem: { flexDirection: 'row', gap: SIZES.sm8, alignItems: 'flex-start' },
  infoItemTitle: { fontSize: SIZES.body, fontWeight: '700', color: COLORS.primaryDeep, marginBottom: 3 },
  infoItemDesc:  { fontSize: SIZES.sm, color: COLORS.textSecondary, lineHeight: 18 },
  infoDivider:   { height: 1, backgroundColor: COLORS.divider, marginVertical: SIZES.sm8 + 2 },

  advocateRow: { flexDirection: 'row', alignItems: 'center' },
  advocateInfo:{ flex: 1, marginLeft: SIZES.sm8 + 2 },
  advocateName:{ fontSize: SIZES.body, fontWeight: '700', color: COLORS.brown },
  advocateBadge:{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  advocateBadgeText: { fontSize: SIZES.xs, color: COLORS.secondaryDark, fontWeight: '600' },
  msgBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: COLORS.tagBg, alignItems: 'center', justifyContent: 'center',
  },

  existingBanner: {
    flexDirection: 'row', alignItems: 'center', gap: SIZES.sm8,
    backgroundColor: '#D8F0E4', borderRadius: SIZES.r12,
    padding: SIZES.md16, marginBottom: SIZES.md16,
    borderWidth: 1, borderColor: '#A8D8BC',
  },
  existingTitle:  { fontSize: SIZES.body, fontWeight: '700', color: COLORS.success },
  existingStatus: { fontSize: SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },

  fosteredBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: SIZES.sm8,
    backgroundColor: '#FEF3DC', borderRadius: SIZES.r12,
    padding: SIZES.md16, marginBottom: SIZES.md16,
    borderWidth: 1, borderColor: '#FDE3AC',
  },
  fosteredText: { flex: 1, fontSize: SIZES.sm, color: '#92400E', lineHeight: 20 },

  donateBtn: { marginBottom: SIZES.md16 },

  // Bottom bar
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: SIZES.lg24, paddingBottom: 34, paddingTop: SIZES.sm8 + 4,
    backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.divider,
    ...SHADOWS.card,
  },
  bothBtnsRow: { flexDirection: 'row', gap: SIZES.sm8 },
  halfBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SIZES.xs4 + 2, paddingVertical: SIZES.sm8 + 4, borderRadius: SIZES.r999,
    ...SHADOWS.button,
  },
  adoptBtn:     { backgroundColor: COLORS.primaryDeep },
  fosterBtn:    { backgroundColor: '#D97706' },
  halfBtnText:  { fontSize: SIZES.body, fontWeight: '700', color: '#fff' },

  // Modal
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  overlayDismiss: { flex: 1 },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: SIZES.lg24, paddingBottom: Platform.OS === 'ios' ? 44 : SIZES.lg24,
    maxHeight: '90%',
  },
  sheetHandle: {
    width: 44, height: 4, borderRadius: 2, backgroundColor: COLORS.border,
    alignSelf: 'center', marginBottom: SIZES.md16,
  },
  sheetHeader: { flexDirection: 'row', gap: SIZES.md16, alignItems: 'flex-start', marginBottom: SIZES.md16 },
  sheetIconWrap: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  sheetTitle:    { fontSize: SIZES.lg, fontWeight: '800', color: COLORS.brown },
  sheetSubtitle: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 3, lineHeight: 18 },

  sheetInfoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: SIZES.xs4 + 2,
    backgroundColor: COLORS.inputBg, borderRadius: SIZES.r12,
    padding: SIZES.sm8 + 4, marginBottom: SIZES.md16,
  },
  sheetInfoText: { flex: 1, fontSize: SIZES.sm, fontWeight: '600', lineHeight: 18 },

  fieldLabel: {
    fontSize: SIZES.xs, fontWeight: '700', color: COLORS.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: SIZES.sm8,
  },

  durationGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.xs4 + 2, marginBottom: SIZES.md16 },
  durationChip: {
    paddingHorizontal: SIZES.sm8 + 4, paddingVertical: SIZES.xs4 + 4,
    borderRadius: SIZES.r999, backgroundColor: COLORS.inputBg,
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  durationChipOn:  { backgroundColor: '#FEF3DC', borderColor: '#F59E0B' },
  durationText:    { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.textSecondary },
  durationTextOn:  { color: '#B45309', fontWeight: '700' },

  sheetActions: { flexDirection: 'row', gap: SIZES.sm8, marginTop: SIZES.xs4 },
  cancelBtn:    { flex: 1 },
  submitBtn:    { flex: 2 },
});
