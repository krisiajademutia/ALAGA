import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  ActivityIndicator,
  StatusBar as RNStatusBar,
  Dimensions,
  Animated,
  PanResponder,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { COLORS, SIZES, SHADOWS, FONTS } from '../../constants/theme';
import Avatar from '../../components/Avatar';
import Button from '../../components/Button';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ── Sheet Positioning Math ──────────────────────────────
const INITIAL_SHEET_TOP = SCREEN_HEIGHT * 0.38; // Normal state (Photo 1)
const COLLAPSED_VISIBLE_HEIGHT = Platform.OS === 'ios' ? 190 : 175; // Dragged down state (Photo 2: Handle + Name + Location + Fixed BottomBar)
const COLLAPSED_SHEET_TOP = SCREEN_HEIGHT - COLLAPSED_VISIBLE_HEIGHT;
const MAX_DRAG_DOWN = Math.max(80, COLLAPSED_SHEET_TOP - INITIAL_SHEET_TOP);

export default function AnimalDetailScreen({ route, navigation }) {
  const { animalId } = route.params || {};
  const {
    animals,
    currentUser,
    submitRequest,
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
  const [currentPhotoIdx, setCurrentPhotoIdx] = useState(0);

  // PanResponder for dragging white container down to reveal full centered picture
  const panY = useRef(new Animated.Value(0)).current;
  const isCollapsedRef = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 5,
      onPanResponderMove: (_, gestureState) => {
        const startY = isCollapsedRef.current ? MAX_DRAG_DOWN : 0;
        const newY = startY + gestureState.dy;
        if (newY >= 0 && newY <= MAX_DRAG_DOWN + 30) {
          panY.setValue(newY);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 50 || (gestureState.vy > 0.35 && gestureState.dy > 15)) {
          // Dragged down -> collapse sheet so only handle, title, location, and fixed bottom button stay visible
          Animated.spring(panY, {
            toValue: MAX_DRAG_DOWN,
            useNativeDriver: false,
            bounciness: 4,
          }).start(() => {
            isCollapsedRef.current = true;
          });
        } else {
          // Restore to Normal view
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: false,
            bounciness: 4,
          }).start(() => {
            isCollapsedRef.current = false;
          });
        }
      },
    })
  ).current;

  const toggleSheet = () => {
    if (isCollapsedRef.current) {
      Animated.spring(panY, { toValue: 0, useNativeDriver: false, bounciness: 4 }).start();
      isCollapsedRef.current = false;
    } else {
      Animated.spring(panY, { toValue: MAX_DRAG_DOWN, useNativeDriver: false, bounciness: 4 }).start();
      isCollapsedRef.current = true;
    }
  };

  const insets = useSafeAreaInsets();
  const safeTop =
    Math.max(
      insets.top,
      Platform.OS === 'android' ? RNStatusBar.currentHeight || 0 : 12
    ) + 6;

  if (!animal) return null;

  const allPhotos = (animal.photos && animal.photos.length > 0)
    ? animal.photos
    : (animal.photo ? [animal.photo] : []);

  // Owner check
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
            title: 'Success',
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
      animal.advocateName,
      animal.advocateAvatar
    );
    navigation.navigate('Chat', {
      conversationId: convId,
      otherName: animal.advocateName,
      otherId: animal.advocateId,
      otherAvatar: animal.advocateAvatar,
      initialDraft: `Hi! I'm interested in ${animal.name}. Can you tell me more?`,
    });
  };

  // Animated Hero Container Height
  const heroHeight = panY.interpolate({
    inputRange: [0, MAX_DRAG_DOWN],
    outputRange: [SCREEN_HEIGHT * 0.42, COLLAPSED_SHEET_TOP - 10],
    extrapolate: 'clamp',
  });

  // Specs formatting matching screenshot exact values or fallback
  const genderVal = animal.gender
    ? (animal.gender.toLowerCase().includes('male') && !animal.gender.includes('♂') ? 'Male ♂' : animal.gender.toLowerCase().includes('female') && !animal.gender.includes('♀') ? 'Female ♀' : animal.gender)
    : 'Male ♂';
  const ageVal = animal.age || '2 Years';
  const weightVal = animal.weight || '3.8 kg';
  const breedVal = animal.breed || 'Puspin Tabby';
  const advocateNameVal = animal.advocateName || 'Elena Ramos';
  const advocateRoleVal = animal.advocateRole || 'Verified Community Foster Advocate';
  const locationTextVal = animal.location && animal.rescueNote
    ? `${animal.location} • ${animal.rescueNote}`
    : animal.location || animal.rescueNote || 'Pasig City';

  return (
    <View style={styles.flex}>
      <StatusBar style="light" />

      {/* ── Background Hero Picture Section ───────────────── */}
      <Animated.View style={[styles.heroWrap, { height: heroHeight }]}>
        {allPhotos.length > 1 ? (
          <View style={{ flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' }}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const offset = e.nativeEvent.contentOffset.x;
                const idx = Math.round(offset / SCREEN_WIDTH);
                setCurrentPhotoIdx(idx);
              }}
              style={{ width: '100%', height: '100%' }}
            >
              {allPhotos.map((imgUri, idx) => (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.95}
                  onPress={() => setActivePreviewIndex(idx)}
                  style={{ width: SCREEN_WIDTH, height: '100%', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Image
                    source={{ uri: imgUri }}
                    style={styles.heroImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.heroPagingBadge}>
              <Ionicons name="images" size={12} color="#fff" style={{ marginRight: 4 }} />
              <Text style={styles.heroPagingText}>{currentPhotoIdx + 1} / {allPhotos.length}</Text>
            </View>
          </View>
        ) : allPhotos.length === 1 ? (
          <TouchableOpacity
            activeOpacity={0.95}
            onPress={() => setActivePreviewIndex(0)}
            style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
          >
            <Image
              source={{ uri: allPhotos[0] }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.heroPlaceholder}>
            <Ionicons name="paw" size={64} color={COLORS.primary} />
          </View>
        )}

        {/* Floating Top Controls */}
        <TouchableOpacity
          style={[styles.floatingBack, { top: safeTop }]}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={20} color="#473018" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.floatingHeart, { top: safeTop }]}
          onPress={() => setIsFav(!isFav)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={isFav ? 'heart' : 'heart-outline'}
            size={20}
            color={COLORS.danger}
          />
        </TouchableOpacity>
      </Animated.View>

      {/* ── Draggable White Sheet Body ────────────────────────── */}
      <Animated.View
        style={[
          styles.sheetBody,
          {
            transform: [{ translateY: panY }],
          },
        ]}
      >
        {/* Draggable Handle Header Area */}
        <View {...panResponder.panHandlers} style={styles.dragHeaderArea}>
          <TouchableOpacity onPress={toggleSheet} activeOpacity={0.8} style={styles.handleTouchZone}>
            <View style={styles.sheetHandle} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          bounces={false}
        >
          {/* Pet Name & Breed */}
          <View style={styles.nameRow}>
            <Text style={styles.petName}>{animal.name || 'Tamiming'}</Text>
            <Text style={styles.nameBullet}>•</Text>
            <Text style={styles.petBreed}>{breedVal}</Text>
          </View>

          {/* Location & Rescue Tag */}
          <View style={styles.locationRow}>
            <Ionicons name="location-sharp" size={14} color="#D94F4F" style={{ marginRight: 4 }} />
            <Text style={styles.locationText}>{locationTextVal}</Text>
          </View>

          {/* 3 Spec Cards Grid */}
          <View style={styles.specCardsRow}>
            {/* Gender Card */}
            <View style={[styles.specCard, styles.specCardGender]}>
              <Text style={styles.specCardLabel}>Gender</Text>
              <Text style={styles.specCardValue}>{genderVal}</Text>
            </View>

            {/* Age Card */}
            <View style={[styles.specCard, styles.specCardAge]}>
              <Text style={styles.specCardLabel}>Age</Text>
              <Text style={styles.specCardValue}>{ageVal}</Text>
            </View>

            {/* Weight Card */}
            <View style={[styles.specCard, styles.specCardWeight]}>
              <Text style={styles.specCardLabel}>Weight</Text>
              <Text style={styles.specCardValue}>{weightVal}</Text>
            </View>
          </View>

          {/* Advocate Profile Row */}
          <View style={styles.advocateCard}>
            <TouchableOpacity
              style={styles.advocateLeft}
              onPress={() => navigation.navigate('PublicProfile', {
                userId: animal.advocateId,
                userName: advocateNameVal,
                userAvatar: animal.advocateAvatar,
                userRole: 'advocate',
              })}
              activeOpacity={0.8}
            >
              <Avatar name={advocateNameVal} uri={animal.advocateAvatar} userId={animal.advocateId} size={46} />
              <View style={styles.advocateTextCol}>
                <Text style={styles.advocateName} numberOfLines={1}>{advocateNameVal}</Text>
                <Text style={styles.advocateRole} numberOfLines={1}>{advocateRoleVal}</Text>
              </View>
            </TouchableOpacity>

            {isOwner ? (
              <View style={styles.ownerBadgePill}>
                <Ionicons name="person" size={12} color={COLORS.primaryDeep} style={{ marginRight: 4 }} />
                <Text style={styles.ownerBadgePillText}>You</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.chatPillBtn}
                onPress={handleMessageAdvocate}
                activeOpacity={0.8}
              >
                <Ionicons name="chatbox" size={13} color="#473018" style={{ marginRight: 5 }} />
                <Text style={styles.chatPillBtnText}>Chat</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Personality & Story */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personality & Story</Text>
            <Text style={styles.storyText}>
              {animal.description ||
                'Rescued from rain along C-5 road, Oscar is very affectionate, loves naps on warm laps, and gets along well with gentle dogs.'}
            </Text>

            {/* Badges */}
            <View style={styles.badgesRow}>
              {(animal.personalityBadges || ['Gentle', 'Loves Cuddles', 'Kid Friendly']).map(
                (badge) => (
                  <View key={badge} style={styles.badgePill}>
                    <Text style={styles.badgeText}>
                      {badge === 'Gentle' ? '✨ Gentle' : badge === 'Loves Cuddles' ? '💖 Loves Cuddles' : badge === 'Kid Friendly' ? '👶 Kid Friendly' : badge}
                    </Text>
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

          {/* Donate Banner */}
          {!isOwner && animal.status !== 'Adopted' && (
            <TouchableOpacity
              style={styles.donateBanner}
              onPress={() => navigation.navigate('Donate', {
                animalId: animal.id,
                animalName: animal.name,
                advocateId: animal.advocateId,
              })}
            >
              <Ionicons name="gift-outline" size={18} color={COLORS.primaryDeep} />
              <Text style={styles.donateBannerText}>
                Want to support {animal.name}'s food & care? Donate here
              </Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.primaryDeep} />
            </TouchableOpacity>
          )}

          {isOwner && animal.status !== 'Adopted' && (
            <TouchableOpacity
              style={[styles.donateBanner, { backgroundColor: '#EBF4FF', borderColor: '#90CDF4' }]}
              onPress={() => navigation.navigate('MainTabs', { screen: 'Profile', params: { openPayoutModal: true } })}
            >
              <Ionicons name="card-outline" size={18} color="#007DFE" />
              <Text style={[styles.donateBannerText, { color: '#0D3B66' }]}>
                Want to receive donations for {animal.name}? Set up GCash/Maya in Profile
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#007DFE" />
            </TouchableOpacity>
          )}
        </ScrollView>
      </Animated.View>

      {/* ── Fixed Bottom Action Bar (Always at bottom of screen) ── */}
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
                <Ionicons name="checkmark-done-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
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
          </View>
        </View>
      ) : isAdvocate ? (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.collabAdvocateBtn}
            onPress={handleMessageAdvocate}
            activeOpacity={0.88}
          >
            <Ionicons name="chatbubbles" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
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
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.mainAdoptBtn}
            onPress={() => openModal('Adoption')}
            activeOpacity={0.88}
          >
            <Text style={styles.mainAdoptBtnText}>Adopt {animal.name}</Text>
            <Ionicons name="paw" size={15} color="#473018" style={{ marginLeft: 6 }} />
          </TouchableOpacity>

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
            <View style={styles.sheetHandleModal} />

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

      {/* ── Full Screen Photo Viewer Modal ───────────────── */}
      <Modal
        visible={activePreviewIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActivePreviewIndex(null)}
      >
        <View style={styles.fullPreviewOverlay}>
          <StatusBar style="light" />
          <View style={[styles.fullPreviewHeader, { paddingTop: safeTop }]}>
            <TouchableOpacity
              style={styles.fullPreviewCloseBtn}
              onPress={() => setActivePreviewIndex(null)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.fullPreviewCount}>
              {activePreviewIndex !== null ? `${activePreviewIndex + 1} of ${allPhotos.length}` : ''}
            </Text>
            <View style={{ width: 40 }} />
          </View>
          {activePreviewIndex !== null && allPhotos[activePreviewIndex] && (
            <View style={styles.fullPreviewBody}>
              <Image
                source={{ uri: allPhotos[activePreviewIndex] }}
                style={styles.fullPreviewImage}
                resizeMode="contain"
              />
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },

  heroWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
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
    backgroundColor: '#1C1C1C',
  },
  heroPagingBadge: {
    position: 'absolute',
    bottom: 20,
    right: 18,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 21, 16, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  heroPagingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },

  floatingBack: {
    position: 'absolute',
    left: 20,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    ...SHADOWS.md,
  },
  floatingHeart: {
    position: 'absolute',
    right: 20,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    ...SHADOWS.md,
  },

  sheetBody: {
    flex: 1,
    marginTop: INITIAL_SHEET_TOP,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 10,
  },
  dragHeaderArea: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
    backgroundColor: '#FFFFFF',
  },
  handleTouchZone: {
    paddingVertical: 6,
    paddingHorizontal: 20,
  },
  sheetHandle: {
    width: 42,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#D6D3D1',
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 140,
  },

  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  petName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#473018',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  nameBullet: {
    fontSize: 14,
    color: '#8C7D6A',
    marginHorizontal: 8,
  },
  petBreed: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8C7D6A',
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationText: {
    fontSize: 12.5,
    color: '#8C7D6A',
    fontWeight: '500',
    fontFamily: 'PlusJakartaSans_500Medium',
  },

  // 3 Spec Cards Grid
  specCardsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  specCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1.5,
  },
  specCardGender: {
    backgroundColor: '#EAF3ED',
    borderColor: '#CDE4D5',
  },
  specCardAge: {
    backgroundColor: '#FEF8DB',
    borderColor: '#F7EAB7',
  },
  specCardWeight: {
    backgroundColor: '#E3F2F8',
    borderColor: '#C6E5F2',
  },
  specCardLabel: {
    fontSize: 11,
    color: '#786858',
    fontWeight: '500',
    marginBottom: 4,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  specCardValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#473018',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },

  // Advocate Profile Card
  advocateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9F8F5',
    borderColor: '#EFECE6',
    borderWidth: 1.5,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 22,
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
    fontSize: 15,
    fontWeight: '800',
    color: '#473018',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  advocateRole: {
    fontSize: 11.5,
    color: '#8C7D6A',
    marginTop: 2,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  chatPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF1AA',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chatPillBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#473018',
    fontFamily: 'PlusJakartaSans_700Bold',
  },

  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#473018',
    marginBottom: 8,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  storyText: {
    fontSize: 13.5,
    color: '#685038',
    lineHeight: 20,
    marginBottom: 12,
    fontFamily: 'PlusJakartaSans_400Regular',
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badgePill: {
    backgroundColor: '#FAF5E8',
    borderWidth: 1,
    borderColor: '#E8DFC8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#473018',
    fontFamily: 'PlusJakartaSans_600SemiBold',
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
    fontSize: 13,
    color: '#473018',
    fontFamily: 'PlusJakartaSans_500Medium',
  },

  donateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.primaryDark,
    marginTop: 4,
  },
  donateBannerText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.primaryDeep,
    fontFamily: 'PlusJakartaSans_500Medium',
  },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    alignItems: 'center',
    zIndex: 50,
  },
  mainAdoptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#92CDE5',
    paddingVertical: 14,
    borderRadius: 25,
    width: '100%',
    shadowColor: '#473018',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 3,
  },
  mainAdoptBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#473018',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  fosterLink: {
    paddingVertical: 2,
    marginTop: 8,
  },
  fosterLinkText: {
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
  sheetHandleModal: {
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

  // RBAC & Owner Management
  bottomBarOwner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#ECECEC',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    zIndex: 50,
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
    backgroundColor: '#E3F2F6',
    borderWidth: 1,
    borderColor: '#C8E4EE',
  },
  statusAvailableText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryDeep,
  },
  statusFosteredBg: {
    backgroundColor: '#FCF8E8',
    borderWidth: 1,
    borderColor: '#F0E6BE',
  },
  statusFosteredText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8A5D10',
  },
  statusAdoptedBg: {
    backgroundColor: '#EBF4EF',
    borderWidth: 1,
    borderColor: '#CBE3D5',
  },
  statusAdoptedText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.secondaryDark,
  },
  ownerStatusPillText: {},
  ownerBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ownerBadgeNotice: {
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
    backgroundColor: COLORS.primaryDeep,
    paddingVertical: 14,
    borderRadius: 25,
    ...SHADOWS.button,
  },
  markAdoptedBtnText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  relistBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.primaryDeep,
    paddingVertical: 13,
    borderRadius: 25,
  },
  relistBtnText: {
    fontSize: 14,
    color: COLORS.primaryDeep,
  },
  ownerBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF4F7',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CFE6EE',
  },
  ownerBadgePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryDeep,
  },
  collabAdvocateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryDeep,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 25,
    width: '100%',
    ...SHADOWS.button,
  },
  collabAdvocateBtnText: {
    fontSize: 15,
    color: '#FFFFFF',
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
    fontSize: 14,
    color: '#473018',
    fontWeight: '700',
  },
  fullPreviewOverlay: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    justifyContent: 'space-between',
  },
  fullPreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  fullPreviewCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullPreviewCount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  fullPreviewBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  fullPreviewImage: {
    width: '100%',
    height: '80%',
  },
});
