import React, { useState, useRef } from 'react';
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
  Dimensions,
  Animated,
  PanResponder,
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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ── Sheet Positioning Math ──────────────────────────────
const INITIAL_SHEET_TOP = SCREEN_HEIGHT * 0.38; // Normal state (Photo 1)
const COLLAPSED_VISIBLE_HEIGHT = Platform.OS === 'ios' ? 190 : 175; // Dragged down state (Photo 2)
const COLLAPSED_SHEET_TOP = SCREEN_HEIGHT - COLLAPSED_VISIBLE_HEIGHT;
const MAX_DRAG_DOWN = Math.max(80, COLLAPSED_SHEET_TOP - INITIAL_SHEET_TOP);

export default function RescueAlertDetailScreen({ route, navigation }) {
  const { reportId } = route.params || {};
  const {
    rescueReports,
    currentUser,
    addComment,
    respondToReport,
    markRescued,
    updateRescueReportUrgency,
    startConversation,
    showAlert,
  } = useApp();

  const report = rescueReports.find((r) => r.id === reportId) || rescueReports[0];
  const [commentText, setCommentText] = useState('');
  const [isFav, setIsFav] = useState(false);
  const [previewImageIndex, setPreviewImageIndex] = useState(null);
  const [urgencyModalVisible, setUrgencyModalVisible] = useState(false);
  const [currentPhotoIdx, setCurrentPhotoIdx] = useState(0);
  const isAdvocate = currentUser?.role === 'advocate';

  // PanResponder for dragging white container down to reveal full centered picture
  const panY = useRef(new Animated.Value(0)).current;
  const isCollapsedRef = useRef(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

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
          // Dragged down -> collapse sheet so full picture is revealed
          Animated.spring(panY, {
            toValue: MAX_DRAG_DOWN,
            useNativeDriver: false,
            bounciness: 4,
          }).start(() => {
            isCollapsedRef.current = true;
            setIsCollapsed(true);
          });
        } else {
          // Restore to Normal view
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: false,
            bounciness: 4,
          }).start(() => {
            isCollapsedRef.current = false;
            setIsCollapsed(false);
          });
        }
      },
    })
  ).current;

  const toggleSheet = () => {
    if (isCollapsedRef.current) {
      Animated.spring(panY, { toValue: 0, useNativeDriver: false, bounciness: 4 }).start();
      isCollapsedRef.current = false;
      setIsCollapsed(false);
    } else {
      Animated.spring(panY, { toValue: MAX_DRAG_DOWN, useNativeDriver: false, bounciness: 4 }).start();
      isCollapsedRef.current = true;
      setIsCollapsed(true);
    }
  };

  const heroHeight = panY.interpolate({
    inputRange: [0, MAX_DRAG_DOWN],
    outputRange: [SCREEN_HEIGHT * 0.42, COLLAPSED_SHEET_TOP - 10],
    extrapolate: 'clamp',
  });

  const bottomBarOpacity = panY.interpolate({
    inputRange: [0, MAX_DRAG_DOWN * 0.6, MAX_DRAG_DOWN],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  });

  const bottomBarTranslateY = panY.interpolate({
    inputRange: [0, MAX_DRAG_DOWN * 0.6, MAX_DRAG_DOWN],
    outputRange: [100, 100, 0],
    extrapolate: 'clamp',
  });

  const photosList = (report?.photos && report.photos.length > 0)
    ? report.photos
    : (report?.photo ? [report.photo] : []);

  const urgencyObj =
    URGENCY_LEVELS.find(
      (u) => u.label.toLowerCase() === (report?.urgency || '').toLowerCase()
    ) || { label: 'High', color: '#D94F4F', bg: '#FDEEEB' };

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

  const handleSendComment = () => {
    if (!commentText.trim()) return;
    addComment(report.id, commentText.trim());
    setCommentText('');
  };

  return (
    <View style={styles.flex}>
      <StatusBar style="light" />

      {/* ── Background Hero Picture Section ───────────────── */}
      <Animated.View style={[styles.heroWrap, { height: heroHeight }]}>
        {photosList.length > 1 ? (
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
              {photosList.map((imgUri, idx) => (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.95}
                  onPress={() => setPreviewImageIndex(idx)}
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
              <Text style={styles.heroPagingText}>{currentPhotoIdx + 1} / {photosList.length}</Text>
            </View>
          </View>
        ) : photosList.length === 1 ? (
          <TouchableOpacity
            activeOpacity={0.95}
            onPress={() => setPreviewImageIndex(0)}
            style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
          >
            <Image
              source={{ uri: photosList[0] }}
              style={styles.heroImage}
              resizeMode="cover"
            />
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
            color="#D94F4F"
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
          keyboardShouldPersistTaps="handled"
        >
          {/* Status, Urgency & Distance Pills */}
          <View style={styles.metaBadgeRow}>
            <StatusPill status={report.status || 'Open'} />
            {Boolean(report.urgency) && (
              <TouchableOpacity
                style={[styles.urgencyBadge, { backgroundColor: urgencyObj.bg }]}
                onPress={() => isAdvocate && setUrgencyModalVisible(true)}
                disabled={!isAdvocate}
                activeOpacity={0.7}
              >
                <View style={[styles.urgencyDot, { backgroundColor: urgencyObj.color }]} />
                <Text style={[styles.urgencyText, { color: urgencyObj.color }]}>
                  {report.urgency} Urgency
                </Text>
                {isAdvocate && (
                  <Ionicons name="pencil" size={10} color={urgencyObj.color} style={{ marginLeft: 4 }} />
                )}
              </TouchableOpacity>
            )}
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

          {/* ── Dynamic Attribute Tags ── */}
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

          {/* ── Reporter Profile Row ── */}
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
                  Reported this rescue case
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.chatBtn}
              onPress={handleMessageAdvocate}
              activeOpacity={0.82}
            >
              <Ionicons name="chatbubble-ellipses" size={14} color="#2E7A99" style={{ marginRight: 5 }} />
              <Text style={styles.chatBtnText}>Message</Text>
            </TouchableOpacity>
          </View>

          {/* ── Description / Report Details ── */}
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

          {/* ── Interactive Map View ── */}
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

          {/* ── Action / Status Panel (Original Inline Position) ── */}
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
                  <Ionicons name="hand-left" size={22} color="#2E7A99" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.respondedTitle}>Rescue Claimed</Text>
                  <Text style={styles.respondedSub}>
                    {report.responderName || 'An advocate'} is responding to this rescue case.
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
          ) : report.status === 'Rescued' ? (
            <View style={styles.rescuedBanner}>
              <Ionicons name="checkmark-circle" size={24} color="#2E7D32" style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.rescuedTitle}>Animal Safely Rescued</Text>
                <Text style={styles.rescuedSub}>This case has been resolved and the animal is in safe hands.</Text>
              </View>
            </View>
          ) : null}

          {/* Comments Section */}
          <View style={styles.commentsSection}>
            <Text style={styles.commentsTitle}>
              Comments ({report.comments?.length || 0})
            </Text>

            {report.comments && report.comments.length > 0 ? (
              report.comments.map((c) => (
                <View key={c.id} style={styles.commentItem}>
                  <TouchableOpacity onPress={() => navigation.navigate('PublicProfile', { userId: c.userId, userName: c.userName, userAvatar: c.userAvatar })} activeOpacity={0.8}>
                    <Avatar name={c.userName} uri={c.userAvatar} userId={c.userId} size={36} />
                  </TouchableOpacity>
                  <View style={styles.commentBubble}>
                    <TouchableOpacity onPress={() => navigation.navigate('PublicProfile', { userId: c.userId, userName: c.userName, userAvatar: c.userAvatar })} activeOpacity={0.8}>
                      <Text style={styles.commentUser}>{c.userName}</Text>
                    </TouchableOpacity>
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
              <Avatar name={currentUser?.name || 'User'} uri={currentUser?.avatar} userId={currentUser?.id} size={34} />
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
        </ScrollView>
      </Animated.View>

      {/* ── Fixed Bottom Action Bar (ONLY Shows When Dragged Down) ── */}
      <Animated.View
        pointerEvents={isCollapsed ? 'auto' : 'none'}
        style={[
          styles.fixedBottomBar,
          {
            opacity: bottomBarOpacity,
            transform: [{ translateY: bottomBarTranslateY }],
          },
        ]}
      >
        {report.status === 'Open' ? (
          <TouchableOpacity
            style={[styles.respondBtn, { marginBottom: 0 }]}
            onPress={handleRespond}
            activeOpacity={0.88}
          >
            <Ionicons name="shield-checkmark-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.respondBtnText}>Respond (I’ll help!)</Text>
          </TouchableOpacity>
        ) : report.status === 'Responded' ? (
          <View style={[styles.respondedActionsRow, { marginTop: 0, paddingTop: 0, borderTopWidth: 0 }]}>
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
        ) : null}
      </Animated.View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  heroWrap: {
    width: SCREEN_WIDTH,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1C1C1C',
    overflow: 'hidden',
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
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  placeholderWrap: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1C1C1C',
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
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 40,
  },

  fixedBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EFE7DA',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 14,
    zIndex: 30,
    ...SHADOWS.md,
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
