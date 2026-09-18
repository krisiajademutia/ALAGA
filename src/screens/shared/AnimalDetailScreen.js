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
  TextInput,
  ActivityIndicator,
  StatusBar as RNStatusBar,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { COLORS, SIZES, SHADOWS, FONTS } from '../../constants/theme';
import Avatar from '../../components/Avatar';
import Input from '../../components/Input';
import Button from '../../components/Button';

export default function AnimalDetailScreen({ route, navigation }) {
  const { animalId } = route.params || {};
  const {
    animals,
    currentUser,
    submitRequest,
    requests,
    startConversation,
    markAnimalAdopted,
    returnAnimalToListings,
    showAlert,
  } = useApp();
  const animal = animals.find((a) => a.id === animalId) || animals[0];

  const [isFav, setIsFav] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [requestType, setRequestType] = useState('Adoption');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activePreviewIndex, setActivePreviewIndex] = useState(null);

  const insets = useSafeAreaInsets();
  const safeTop =
    Math.max(
      insets.top,
      Platform.OS === 'android' ? RNStatusBar.currentHeight || 0 : 12
    ) + 6;

  if (!animal) return null;

  // Real owner check: matches ID or matches name if advocate
  const isOwner = Boolean(
    currentUser && (
      currentUser.id === animal.advocateId ||
      (currentUser.name && animal.advocateName && currentUser.role === 'advocate' && currentUser.name.trim().toLowerCase() === animal.advocateName.trim().toLowerCase())
    )
  );
  const isAdvocate = currentUser?.role === 'advocate';
  const isCommunity = currentUser?.role === 'community' || !currentUser?.role;

  const handleMarkAdopted = () => {
    showAlert({
      title: 'Mark as Adopted',
      message: `Confirm that ${animal.name} has found their forever home and been adopted?`,
      type: 'warning',
      customIcon: 'paw',
      secondaryText: 'Cancel',
      primaryText: 'Confirm Adopted',
      onPrimaryPress: () => {
        markAnimalAdopted(animal.id);
        setTimeout(() => {
          showAlert({
            title: 'Success 🎉',
            message: `${animal.name} is now marked as Adopted!`,
            type: 'success',
            customIcon: 'paw',
            primaryText: 'Great!',
          });
        }, 300);
      },
    });
  };

  const handleReturnToListings = () => {
    showAlert({
      title: 'Return to Available Listings',
      message: `Make ${animal.name} available for adoption and temporary foster care again?`,
      type: 'info',
      customIcon: 'paw',
      secondaryText: 'Cancel',
      primaryText: 'Return to Available',
      onPrimaryPress: () => {
        returnAnimalToListings(animal.id);
        setTimeout(() => {
          showAlert({
            title: 'Updated',
            message: `${animal.name} is now back in available listings.`,
            type: 'success',
            customIcon: 'paw',
            primaryText: 'OK',
          });
        }, 300);
      },
    });
  };

  const openModal = (type) => {
    if (isOwner) {
      showAlert({
        title: 'Listing Owner',
        message: 'You are the advocate managing this listing.',
        type: 'info',
      });
      return;
    }
    if (!isCommunity) {
      showAlert({
        title: 'Advocate Role',
        message: 'Advocate accounts coordinate rescues. Please message the advocate directly to collaborate.',
        type: 'info',
      });
      return;
    }
    setRequestType(type);
    setMessage('');
    setModalVisible(true);
  };

  const handleSubmit = () => {
    if (!message.trim()) {
      showAlert({
        title: 'Add a message',
        message: 'Please introduce yourself and share a bit about your home.',
        type: 'warning',
      });
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
      setTimeout(() => {
        showAlert({
          title: requestType === 'Adoption' ? 'Adoption Request Sent' : 'Foster Request Sent',
          message: `Your request for ${animal.name} has been sent to ${animal.advocateName}. They will review it and get back to you soon.`,
          type: 'success',
          customIcon: 'paw',
          primaryText: 'Got it!',
        });
      }, 300);
    }, 700);
  };

  const handleMessageAdvocate = () => {
    const convId = startConversation(
      animal.advocateId,
      animal.advocateName
    );
    navigation.navigate('Chat', {
      conversationId: convId,
      otherName: animal.advocateName,
      otherId: animal.advocateId,
      initialDraft: `Hi! I'm interested in ${animal.name}. Can you tell me more?`,
    });
  };

  if (!animal) {
    return (
      <View style={[styles.flex, { alignItems: 'center', justifyContent: 'center', padding: 24 }]}>
        <Ionicons name="paw-outline" size={48} color={COLORS.textMuted} />
        <Text style={{ ...FONTS.titleMd, marginTop: 12, color: COLORS.textPrimary }}>Animal Not Found</Text>
        <TouchableOpacity
          style={{ marginTop: 16, paddingVertical: 10, paddingHorizontal: 20, backgroundColor: COLORS.primaryDark, borderRadius: 20 }}
          onPress={() => navigation.goBack()}
        >
          <Text style={{ color: COLORS.surface, fontWeight: '700' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
            style={[styles.floatingBack, { top: safeTop }]}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-back" size={20} color={COLORS.brown} />
          </TouchableOpacity>

          {/* Floating Favorite Button */}
          <TouchableOpacity
            style={[styles.floatingHeart, { top: safeTop }]}
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

          {/* Pet Name */}
          <View style={styles.nameRow}>
            <Text style={styles.petName}>{animal.name}</Text>
            {Boolean(animal.breed) && <Text style={styles.petBreed}>· {animal.breed}</Text>}
          </View>

          {/* Location */}
          <View style={styles.locationRow}>
            <Ionicons name="location-sharp" size={15} color={COLORS.danger} style={{ marginRight: 4 }} />
            <Text style={styles.locationText}>
              {animal.rescueNote || animal.location || 'Location upon request'}
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
              <Text style={styles.statVal}>{animal.age || 'Not specified'}</Text>
            </View>
            <View style={[styles.statCard, styles.statBlue]}>
              <Text style={styles.statLabel}>Weight</Text>
              <Text style={styles.statVal}>{animal.weight || 'Not specified'}</Text>
            </View>
          </View>

          {/* Advocate Card */}
          <View style={styles.advocateCard}>
            <View style={styles.advocateLeft}>
              <Avatar name={animal.advocateName} size={42} />
              <View style={styles.advocateTextCol}>
                <Text style={styles.advocateName}>{animal.advocateName}</Text>
                <Text style={styles.advocateRole}>
                  {animal.advocateRole || 'Animal Advocate'}
                </Text>
              </View>
            </View>
            {isOwner ? (
              <View style={styles.ownerBadgePill}>
                <Ionicons name="person" size={12} color={COLORS.primaryDeep} style={{ marginRight: 3 }} />
                <Text style={styles.ownerBadgePillText}>You</Text>
              </View>
            ) : (
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

          {/* Donate shortcut — Community Supporters only (RBAC) */}
          {!isOwner && isCommunity && animal.status !== 'Adopted' && (
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
          )}
        </View>
      </ScrollView>

      {/* ── Fixed Bottom Actions with RBAC ────────────────────────────── */}
      {isOwner ? (
        <View style={styles.bottomBarOwner}>
          <View style={styles.ownerHeaderRow}>
            <View
              style={[
                styles.ownerStatusPill,
                animal.status === 'Adopted'
                  ? styles.statusAdoptedBg
                  : animal.status === 'Fostered'
                  ? styles.statusFosteredBg
                  : styles.statusAvailableBg,
              ]}
            >
              <Ionicons
                name={
                  animal.status === 'Adopted'
                    ? 'checkmark-circle'
                    : animal.status === 'Fostered'
                    ? 'heart'
                    : 'paw'
                }
                size={13}
                color={
                  animal.status === 'Adopted'
                    ? '#15803D'
                    : animal.status === 'Fostered'
                    ? '#B45309'
                    : COLORS.primaryDeep
                }
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.ownerStatusPillText,
                  animal.status === 'Adopted'
                    ? styles.statusAdoptedText
                    : animal.status === 'Fostered'
                    ? styles.statusFosteredText
                    : styles.statusAvailableText,
                ]}
              >
                {animal.status === 'Adopted'
                  ? 'Adopted'
                  : animal.status === 'Fostered'
                  ? 'Currently Fostered'
                  : 'Active Listing'}
              </Text>
            </View>
            <View style={styles.ownerBadgeWrap}>
              <Ionicons name="shield-checkmark" size={13} color={COLORS.textMuted} style={{ marginRight: 3 }} />
              <Text style={styles.ownerBadgeNotice}>You listed this pet</Text>
            </View>
          </View>

          <View style={styles.ownerActionRow}>
            {animal.status !== 'Adopted' ? (
              <TouchableOpacity
                style={styles.markAdoptedBtn}
                onPress={handleMarkAdopted}
                activeOpacity={0.88}
              >
                <Ionicons name="checkmark-done-circle" size={18} color={COLORS.surface} style={{ marginRight: 6 }} />
                <Text style={styles.markAdoptedBtnText}>Mark as Adopted</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.relistBtn}
                onPress={handleReturnToListings}
                activeOpacity={0.88}
              >
                <Ionicons name="refresh" size={17} color={COLORS.primaryDeep} style={{ marginRight: 6 }} />
                <Text style={styles.relistBtnText}>Return to Available</Text>
              </TouchableOpacity>
            )}

            {animal.status === 'Fostered' && (
              <TouchableOpacity
                style={styles.relistBtn}
                onPress={handleReturnToListings}
                activeOpacity={0.88}
              >
                <Ionicons name="return-up-back" size={17} color={COLORS.primaryDeep} style={{ marginRight: 4 }} />
                <Text style={styles.relistBtnText}>End Foster</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ) : isAdvocate ? (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.collabAdvocateBtn}
            onPress={handleMessageAdvocate}
            activeOpacity={0.88}
          >
            <Ionicons name="chatbubbles" size={18} color={COLORS.surface} style={{ marginRight: 8 }} />
            <Text style={styles.collabAdvocateBtnText}>Message {animal.advocateName}</Text>
          </TouchableOpacity>
          <Text style={styles.collabAdvocateSub}>
            Advocate collaboration & rescue coordination
          </Text>
        </View>
      ) : animal.status === 'Adopted' ? (
        <View style={styles.bottomBar}>
          <View style={styles.alreadyAdoptedNotice}>
            <Ionicons name="heart-circle" size={24} color={COLORS.success} style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.alreadyAdoptedTitle}>{animal.name} has been Adopted! 🎉</Text>
              <Text style={styles.alreadyAdoptedSub}>This rescue has successfully found their forever family.</Text>
            </View>
          </View>
        </View>
      ) : (
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
      )}

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
                  { backgroundColor: requestType === 'Adoption' ? '#EBF7FA' : '#FEF8DE' },
                ]}
              >
                <Ionicons
                  name={requestType === 'Adoption' ? 'home' : 'heart'}
                  size={22}
                  color={requestType === 'Adoption' ? '#2E7A99' : '#C9AB20'}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>
                  {requestType === 'Adoption' ? `Adopt ${animal.name}` : `Foster ${animal.name}`}
                </Text>
                <Text style={styles.modalSub}>
                  {requestType === 'Adoption'
                    ? `Adoption application for ${animal.advocateName}`
                    : `Foster care application for ${animal.advocateName}`}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color="#8C7D6A" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalInputWrap}>
              <Text style={styles.modalInputLabel}>MESSAGE / APPLICANT BACKGROUND</Text>
              <TextInput
                style={styles.modalTextInput}
                placeholder={`Tell ${animal.advocateName} about your living setup, experience with pets, and readiness to care for ${animal.name}...`}
                placeholderTextColor="#947E68"
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setModalVisible(false)}
                activeOpacity={0.75}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, submitting && { opacity: 0.7 }]}
                onPress={handleSubmit}
                disabled={submitting}
                activeOpacity={0.85}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#473018" />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>Submit Application</Text>
                )}
              </TouchableOpacity>
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
    backgroundColor: 'rgba(45, 31, 18, 0.4)',
  },
  overlayDismiss: {
    flex: 1,
  },
  sheetModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 38 : 24,
    borderTopWidth: 1,
    borderColor: '#E8DFC8',
  },
  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E8DFC8',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  modalIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#473018',
  },
  modalSub: {
    fontSize: 12,
    color: '#685038',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalInputWrap: {
    marginBottom: 16,
  },
  modalInputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8C7D6A',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  modalTextInput: {
    backgroundColor: '#FFFDF6',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8DFC8',
    padding: 12,
    fontSize: 13,
    color: '#473018',
    minHeight: 90,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#FAF5E8',
    borderWidth: 1,
    borderColor: '#E8DFC8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#685038',
  },
  modalSubmitBtn: {
    flex: 2,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#92CDE5',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  modalSubmitBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#473018',
  },

  // ── RBAC & Owner Management Styles ───────────────────
  bottomBarOwner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: '#ECECEC',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    ...SHADOWS.card,
  },
  ownerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  ownerStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  statusAvailableBg: {
    backgroundColor: '#ABD7E2',
  },
  statusAvailableText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#473018',
  },
  statusFosteredBg: {
    backgroundColor: '#FBEEAC',
  },
  statusFosteredText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#473018',
  },
  statusAdoptedBg: {
    backgroundColor: '#B8D3C3',
  },
  statusAdoptedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#473018',
  },
  ownerStatusPillText: {
    ...FONTS.caption,
  },
  ownerBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ownerBadgeNotice: {
    ...FONTS.caption,
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  ownerActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  markAdoptedBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#15803D',
    paddingVertical: 14,
    borderRadius: SIZES.r24 + 1,
    ...SHADOWS.button,
  },
  markAdoptedBtnText: {
    ...FONTS.button,
    fontSize: 15,
    color: COLORS.surface,
  },
  relistBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.primaryDeep,
    paddingVertical: 13,
    borderRadius: SIZES.r24 + 1,
  },
  relistBtnText: {
    ...FONTS.button,
    fontSize: 14,
    color: COLORS.primaryDeep,
  },
  ownerBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primaryMid,
  },
  ownerBadgePillText: {
    ...FONTS.caption,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryDeep,
  },
  collabAdvocateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryDark,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: SIZES.r24 + 1,
    width: '100%',
    ...SHADOWS.button,
  },
  collabAdvocateBtnText: {
    ...FONTS.button,
    fontSize: 15,
    color: COLORS.surface,
  },
  collabAdvocateSub: {
    ...FONTS.caption,
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 6,
  },
  alreadyAdoptedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF4EF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: '#B8D3C3',
  },
  alreadyAdoptedTitle: {
    ...FONTS.label,
    fontSize: 14,
    color: '#473018',
    fontWeight: '700',
  },
  alreadyAdoptedSub: {
    ...FONTS.caption,
    fontSize: 11,
    color: '#685038',
    marginTop: 2,
  },
});

