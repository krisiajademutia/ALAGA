import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { COLORS, SIZES, SHADOWS, FONTS } from '../../constants/theme';
import Avatar from '../../components/Avatar';
import Input from '../../components/Input';
import Button from '../../components/Button';

export default function AnimalDetailScreen({ route, navigation }) {
  const { animalId } = route.params || {};
  const { animals, currentUser, submitRequest, requests, startConversation } = useApp();
  const animal = animals.find((a) => a.id === animalId) || animals[0];

  const [isFav, setIsFav] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [requestType, setRequestType] = useState('Adoption');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isOwner = currentUser?.id === animal.advocateId;

  const openModal = (type) => {
    setRequestType(type);
    setMessage('');
    setModalVisible(true);
  };

  const handleSubmit = () => {
    if (!message.trim()) {
      Alert.alert('Add a message', 'Please introduce yourself and share a bit about your home.');
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
        commitDuration: requestType === 'Foster' ? '1 month' : null,
      });
      setSubmitting(false);
      setModalVisible(false);
      Alert.alert(
        requestType === 'Adoption' ? 'Adoption Request Sent' : 'Foster Request Sent',
        `Your request for ${animal.name} has been sent to ${animal.advocateName}. They will review it and get back to you soon.`,
        [{ text: 'Got it!' }]
      );
    }, 700);
  };

  const handleMessageAdvocate = () => {
    const convId = startConversation(
      animal.advocateId,
      animal.advocateName,
      `Hi! I'm interested in ${animal.name}. Can you tell me more?`
    );
    navigation.navigate('Chat', {
      conversationId: convId,
      otherName: animal.advocateName,
    });
  };

  return (
    <View style={styles.flex}>
      <StatusBar style="light" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── Top Hero Image & Floating Controls ────────────── */}
        <View style={styles.heroWrap}>
          {animal.photo ? (
            <Image source={{ uri: animal.photo }} style={styles.heroImage} resizeMode="cover" />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Ionicons name="paw" size={64} color={COLORS.primary} />
            </View>
          )}

          {/* Floating Back Button */}
          <TouchableOpacity
            style={styles.floatingBack}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-back" size={20} color={COLORS.brown} />
          </TouchableOpacity>

          {/* Floating Favorite Button */}
          <TouchableOpacity
            style={styles.floatingHeart}
            onPress={() => setIsFav(!isFav)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={isFav ? 'heart' : 'heart-outline'}
              size={20}
              color={COLORS.danger}
            />
          </TouchableOpacity>
        </View>

        {/* ── White Sheet Body ──────────────────────────────── */}
        <View style={styles.sheetBody}>
          <View style={styles.sheetHandle} />

          {/* Pet Name & Verified Row */}
          <View style={styles.nameRow}>
            <Text style={styles.petName}>{animal.name}</Text>
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark" size={12} color={COLORS.surface} />
            </View>
            <Text style={styles.petBreed}>{animal.breed}</Text>
          </View>

          {/* Location & Rescue Tagline */}
          <View style={styles.locationRow}>
            <Ionicons name="location-sharp" size={15} color={COLORS.danger} style={{ marginRight: 4 }} />
            <Text style={styles.locationText}>
              {animal.rescueNote || `${animal.location} • Rescued 3 months ago (1.2 km away)`}
            </Text>
          </View>

          {/* 3 Stats Cards */}
          <View style={styles.statsRow}>
            <View style={[styles.statCard, styles.statGreen]}>
              <Text style={styles.statLabel}>Gender</Text>
              <Text style={styles.statVal}>{animal.gender || 'Unknown'}</Text>
            </View>
            <View style={[styles.statCard, styles.statYellow]}>
              <Text style={styles.statLabel}>Age</Text>
              <Text style={styles.statVal}>{animal.age || '2 Years'}</Text>
            </View>
            <View style={[styles.statCard, styles.statBlue]}>
              <Text style={styles.statLabel}>Weight</Text>
              <Text style={styles.statVal}>{animal.weight || '3.8 kg'}</Text>
            </View>
          </View>

          {/* Advocate Card */}
          <View style={styles.advocateCard}>
            <View style={styles.advocateLeft}>
              <Avatar name={animal.advocateName} size={42} />
              <View style={styles.advocateTextCol}>
                <Text style={styles.advocateName}>{animal.advocateName}</Text>
                <Text style={styles.advocateRole}>
                  {animal.advocateRole || 'Verified Community Foster Advocate'}
                </Text>
              </View>
            </View>
            {!isOwner && (
              <TouchableOpacity
                style={styles.chatBtn}
                onPress={handleMessageAdvocate}
                activeOpacity={0.8}
              >
                <Ionicons name="chatbubble" size={14} color={COLORS.brown} style={{ marginRight: 4 }} />
                <Text style={styles.chatBtnText}>Chat</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Personality & Story */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personality & Story</Text>
            <Text style={styles.storyText}>{animal.description}</Text>

            {/* Badges */}
            <View style={styles.badgesRow}>
              {(animal.personalityBadges || ['Gentle', 'Affectionate', 'Kid-Friendly']).map(
                (badge, idx) => (
                  <View
                    key={badge}
                    style={[
                      styles.badgePill,
                      idx % 3 === 0 && styles.badgePill1,
                      idx % 3 === 1 && styles.badgePill2,
                      idx % 3 === 2 && styles.badgePill3,
                    ]}
                  >
                    <Text style={styles.badgeText}>{badge}</Text>
                  </View>
                )
              )}
            </View>
          </View>

          {/* Health & Medical Records */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Health & Medical Records</Text>
            {(animal.healthRecords || [
              'Rabies & 4-in-1 Vaccinated (Updated)',
              'Spayed / Neutered & Dewormed',
            ]).map((record) => (
              <View key={record} style={styles.recordItem}>
                <View style={styles.recordCheck}>
                  <Ionicons name="checkmark" size={13} color={COLORS.success} />
                </View>
                <Text style={styles.recordText}>{record}</Text>
              </View>
            ))}
          </View>

          {/* Donate shortcut */}
          <TouchableOpacity
            style={styles.donateBanner}
            onPress={() => navigation.navigate('Donate', { animalId: animal.id, animalName: animal.name })}
          >
            <Ionicons name="gift-outline" size={18} color={COLORS.primaryDeep} />
            <Text style={styles.donateBannerText}>
              Want to support {animal.name}'s food & vet care? Donate here
            </Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.primaryDeep} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Fixed Bottom Actions ────────────────────────────── */}
      <View style={styles.bottomBar}>
        <Button
          title={`Adopt ${animal.name}`}
          onPress={() => openModal('Adoption')}
          fullWidth
          style={styles.mainAdoptBtn}
          textStyle={styles.mainAdoptBtnText}
        />

        <TouchableOpacity
          onPress={() => openModal('Foster')}
          style={styles.fosterLink}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.fosterLinkText}>
            Or apply as temporary foster guardian
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Apply Modal ────────────────────────────────────── */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity style={styles.overlayDismiss} onPress={() => setModalVisible(false)} />
          <View style={styles.sheetModal}>
            <View style={styles.sheetHandle} />

            <View style={styles.modalHeader}>
              <View
                style={[
                  styles.modalIconWrap,
                  { backgroundColor: requestType === 'Adoption' ? COLORS.primaryLight : COLORS.accent },
                ]}
              >
                <Ionicons
                  name={requestType === 'Adoption' ? 'home' : 'heart'}
                  size={24}
                  color={requestType === 'Adoption' ? COLORS.primaryDeep : COLORS.accentDark}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>
                  {requestType === 'Adoption' ? `Adopt ${animal.name}` : `Foster ${animal.name}`}
                </Text>
                <Text style={styles.modalSub}>
                  {requestType === 'Adoption'
                    ? `Permanent adoption application to ${animal.advocateName}`
                    : `Temporary foster care application to ${animal.advocateName}`}
                </Text>
              </View>
            </View>

            <Input
              label="Your message / background"
              placeholder={`Tell ${animal.advocateName} about your living setup, experience with pets, and readiness to care for ${animal.name}...`}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={4}
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setModalVisible(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Submit Application"
                onPress={handleSubmit}
                loading={submitting}
                style={{ flex: 2, backgroundColor: COLORS.primaryDeep }}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  scroll: {
    paddingBottom: 110,
  },

  heroWrap: {
    position: 'relative',
    height: 240,
    backgroundColor: COLORS.secondary,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary,
  },
  floatingBack: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 32,
    left: 18,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.surface,
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
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.card,
  },

  sheetBody: {
    backgroundColor: COLORS.surface,
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
    marginBottom: 16,
  },

  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  petName: {
    ...FONTS.titleXl,
    color: COLORS.brown,
    marginRight: 6,
  },
  verifiedBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  petBreed: {
    ...FONTS.bodyMedium,
    color: COLORS.textMuted,
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  locationText: {
    ...FONTS.bodyMedium,
    color: COLORS.textSecondary,
    fontSize: 13,
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 18,
  },
  statCard: {
    flex: 1,
    borderRadius: SIZES.r16,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  statGreen: {
    backgroundColor: COLORS.secondaryLight,
  },
  statYellow: {
    backgroundColor: COLORS.accent,
  },
  statBlue: {
    backgroundColor: COLORS.primaryLight,
  },
  statLabel: {
    ...FONTS.caption,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginBottom: 4,
  },
  statVal: {
    ...FONTS.subheading,
    fontSize: 15,
    color: COLORS.brown,
  },

  advocateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: SIZES.r20,
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
    ...FONTS.bodyMedium,
    fontWeight: '800',
    color: COLORS.brown,
  },
  advocateRole: {
    ...FONTS.caption,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: SIZES.r18,
  },
  chatBtnText: {
    ...FONTS.button,
    fontSize: 13,
    color: COLORS.brown,
  },

  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    ...FONTS.titleMd,
    color: COLORS.brown,
    marginBottom: 8,
  },
  storyText: {
    ...FONTS.bodyRegular,
    color: '#4B3F33',
    lineHeight: 21,
    marginBottom: 12,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badgePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: SIZES.r16,
  },
  badgePill1: {
    backgroundColor: COLORS.secondaryLight,
  },
  badgePill2: {
    backgroundColor: COLORS.accent,
  },
  badgePill3: {
    backgroundColor: COLORS.primaryLight,
  },
  badgeText: {
    ...FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.brown,
  },

  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  recordCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.secondaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordText: {
    ...FONTS.bodyMedium,
    color: COLORS.brown,
  },

  donateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: SIZES.r14,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 4,
  },
  donateBannerText: {
    flex: 1,
    ...FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.primaryDeep,
  },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    alignItems: 'center',
  },
  mainAdoptBtn: {
    backgroundColor: COLORS.primaryDark,
    borderRadius: SIZES.r24 + 1,
  },
  mainAdoptBtnText: {
    ...FONTS.button,
    fontSize: 16,
    color: COLORS.surface,
  },
  fosterLink: {
    paddingVertical: 2,
    marginTop: 8,
  },
  fosterLinkText: {
    ...FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.textSecondary,
    textDecorationLine: 'underline',
  },

  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  overlayDismiss: {
    flex: 1,
  },
  sheetModal: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 44 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  modalIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    ...FONTS.titleMd,
    color: COLORS.brown,
  },
  modalSub: {
    ...FONTS.caption,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
});

