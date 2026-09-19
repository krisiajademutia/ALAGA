import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  Modal,
  SafeAreaView,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useApp } from '../../context/AppContext';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import Avatar from '../../components/Avatar';
import Header from '../../components/Header';

const QUICK_PROMPTS = [
  { icon: 'paw-outline', text: 'How is the animal doing right now?' },
  { icon: 'location-outline', text: 'Can you share the exact landmarks or street address?' },
  { icon: 'car-outline', text: 'I am on my way to help with the rescue!' },
  { icon: 'help-circle-outline', text: 'Is rescue assistance still needed?' },
];

export default function ChatScreen({ route, navigation }) {
  const { conversationId, otherName, userName: routeUserName, otherId: routeOtherId, initialDraft } = route.params || {};
  const resolvedOtherName = otherName || routeUserName;
  const { conversations, currentUser, sendMessage, clearConversation, markConversationRead, setActiveConversationId, showAlert } = useApp();
  const [text, setText] = useState(initialDraft || '');
  const [attachModalVisible, setAttachModalVisible] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [activeVideo, setActiveVideo] = useState(null);

  const flatRef = useRef(null);
  const inputRef = useRef(null);

  const convo = conversations.find((c) => c.id === conversationId);
  const detectedOtherId = convo?.participants?.find((p) => p !== currentUser?.id);
  const otherId = routeOtherId || detectedOtherId || null;
  const name =
    resolvedOtherName ||
    (detectedOtherId && convo?.participantNames?.[detectedOtherId]) ||
    (convo?.participant1 === currentUser?.id ? convo?.participant2Name : convo?.participant1Name) ||
    'Chat';
  const messages = convo ? convo.messages : [];

  // Register active conversation for auto-read and heads-up notification suppression while actively in chat
  useEffect(() => {
    if (setActiveConversationId && conversationId) {
      setActiveConversationId(conversationId);
      return () => {
        setActiveConversationId(null);
      };
    }
  }, [conversationId, setActiveConversationId]);

  // Mark conversation read on mount / view
  useEffect(() => {
    if (convo?.id && markConversationRead) {
      markConversationRead(convo.id);
    }
  }, [convo?.id, messages?.length]);

  // If initial draft is provided, focus the input
  useEffect(() => {
    if (initialDraft) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [initialDraft]);

  const handleSend = () => {
    if (!text.trim() || !convo) return;
    sendMessage(convo.id, { text: text.trim(), type: 'text' });
    setText('');
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleQuickReply = (msg) => {
    if (!convo) return;
    sendMessage(convo.id, { text: msg, type: 'text' });
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
  };

  // ── Media & Location Handlers ──────────────────────────────
  const handlePickImage = async () => {
    setAttachModalVisible(false);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showAlert({
          title: 'Permission Required',
          message: 'Please enable photo library access in your settings to share photos.',
          type: 'warning',
        });
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]?.uri && convo?.id) {
        sendMessage(convo.id, {
          type: 'image',
          mediaUri: result.assets[0].uri,
          text: text.trim(),
        });
        setText('');
        setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } catch (err) {
      showAlert({
        title: 'Error',
        message: 'Could not open photo gallery: ' + err.message,
        type: 'error',
      });
    }
  };

  const handleTakePhoto = async () => {
    setAttachModalVisible(false);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        showAlert({
          title: 'Permission Required',
          message: 'Please enable camera access in your settings to snap photos.',
          type: 'warning',
        });
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]?.uri && convo?.id) {
        sendMessage(convo.id, {
          type: 'image',
          mediaUri: result.assets[0].uri,
          text: text.trim(),
        });
        setText('');
        setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } catch (err) {
      showAlert({
        title: 'Error',
        message: 'Could not open camera: ' + err.message,
        type: 'error',
      });
    }
  };

  const handlePickVideo = async () => {
    setAttachModalVisible(false);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showAlert({
          title: 'Permission Required',
          message: 'Please enable media library access to share rescue videos.',
          type: 'warning',
        });
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: false,
      });
      if (!result.canceled && result.assets?.[0]?.uri && convo?.id) {
        sendMessage(convo.id, {
          type: 'video',
          mediaUri: result.assets[0].uri,
          duration: result.assets[0].duration,
          text: text.trim(),
        });
        setText('');
        setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } catch (err) {
      showAlert({
        title: 'Error',
        message: 'Could not pick video: ' + err.message,
        type: 'error',
      });
    }
  };

  const handleShareLocation = async () => {
    setAttachModalVisible(false);
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setIsLocating(false);
        showAlert({
          title: 'Permission Required',
          message: 'Please allow location permission to share your coordinates.',
          type: 'warning',
        });
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      let address = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      try {
        const rev = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        if (rev && rev[0]) {
          const parts = [
            rev[0].street,
            rev[0].district || rev[0].subregion,
            rev[0].city || rev[0].region,
          ].filter(Boolean);
          if (parts.length > 0) address = parts.join(', ');
        }
      } catch (e) {
        // use coordinate string fallback
      }

      if (convo?.id) {
        sendMessage(convo.id, {
          type: 'location',
          location: {
            latitude: lat,
            longitude: lng,
            address,
          },
          text: text.trim() || '📍 Shared live rescue location',
        });
        setText('');
        setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } catch (err) {
      showAlert({
        title: 'Location Error',
        message: 'Could not get current GPS coordinates: ' + err.message,
        type: 'error',
      });
    } finally {
      setIsLocating(false);
    }
  };

  const openExternalLocation = (loc) => {
    if (!loc?.latitude || !loc?.longitude) return;
    const lat = loc.latitude;
    const lng = loc.longitude;
    const label = encodeURIComponent(loc.address || 'Rescue Location');
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}(${label})`,
      default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
    });
    const fallback = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    Linking.canOpenURL(url)
      .then((sup) => (sup ? Linking.openURL(url) : Linking.openURL(fallback)))
      .catch(() => Linking.openURL(fallback));
  };

  const handleOpenMenu = () => {
    showAlert({
      title: name,
      message: 'Conversation Options',
      type: 'info',
      customIcon: 'chatbubbles',
      secondaryText: 'Clear Messages',
      onSecondaryPress: () => {
        setTimeout(() => {
          showAlert({
            title: 'Clear Conversation',
            message: 'Are you sure you want to clear all messages in this conversation?',
            type: 'warning',
            customIcon: 'alert-circle',
            secondaryText: 'Cancel',
            primaryText: 'Clear All',
            onPrimaryPress: () => {
              if (convo?.id) {
                clearConversation(convo.id);
              }
            },
          });
        }, 200);
      },
      primaryText: otherId ? 'View Profile' : 'OK',
      onPrimaryPress: otherId ? () => navigation.navigate('PublicProfile', { userId: otherId }) : null,
    });
  };

  // Render empty state with friendly intro and quick chips
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyAvatarWrap}>
        <Avatar name={name} size={68} />
      </View>
      <Text style={styles.emptyName}>{name}</Text>
      <View style={styles.emptyRoleBadge}>
        <Ionicons name="shield-checkmark" size={13} color="#2E7A99" />
        <Text style={styles.emptyRoleText}>ALAGA Community Member</Text>
      </View>
      <Text style={styles.emptyNote}>
        This is the start of your private 1-on-1 chat with {name}. Send a message, animal photo, video, or location pin to coordinate!
      </Text>

      {/* Suggested Quick Prompts */}
      <View style={styles.promptsSection}>
        <Text style={styles.promptsHeader}>Suggested quick messages:</Text>
        <View style={styles.promptsWrap}>
          {QUICK_PROMPTS.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.promptChip}
              onPress={() => handleSelectPrompt(item.text)}
              activeOpacity={0.8}
            >
              <Ionicons name={item.icon} size={14} color="#2E7A99" style={{ marginRight: 6 }} />
              <Text style={styles.promptText}>{item.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />

      {/* ── Top Header ────────────────────────────────────────── */}
      <Header
        onBack={() => navigation.goBack()}
        centerComponent={
          <TouchableOpacity
            style={styles.navCenter}
            onPress={() => {
              if (otherId) {
                navigation.navigate('PublicProfile', { userId: otherId });
              }
            }}
            activeOpacity={0.75}
          >
            <View style={styles.navAvatarWrap}>
              <Avatar name={name} size={38} />
            </View>
            <View style={styles.navTextWrap}>
              <Text style={styles.navName} numberOfLines={1}>
                {name}
              </Text>
              <View style={styles.navSubRow}>
                <Ionicons name="paw" size={11} color="#2E7A99" style={{ marginRight: 3 }} />
                <Text style={styles.navSub}>ALAGA Direct Chat</Text>
              </View>
            </View>
          </TouchableOpacity>
        }
        rightComponent={
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={handleOpenMenu}
            activeOpacity={0.8}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="ellipsis-vertical" size={18} color="#473018" />
          </TouchableOpacity>
        }
      />

      {/* ── Locating Status Banner ────────────────────────────── */}
      {isLocating && (
        <View style={styles.locatingBanner}>
          <ActivityIndicator size="small" color="#2E7A99" />
          <Text style={styles.locatingText}>Acquiring real-time GPS coordinates...</Text>
        </View>
      )}

      {/* ── Messages List ─────────────────────────────────────── */}
      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.msgList,
          messages.length === 0 && { flexGrow: 1, justifyContent: 'center' },
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        ListHeaderComponent={
          messages.length > 0 ? (
            <View style={styles.datePillWrap}>
              <View style={styles.datePill}>
                <Text style={styles.datePillText}>
                  {messages[0]?.time ? formatChatDate(messages[0].time) : 'Today'}
                </Text>
              </View>
            </View>
          ) : null
        }
        renderItem={({ item, index }) => {
          const isMine = item.senderId === currentUser?.id;
          const prevMsg = index > 0 ? messages[index - 1] : null;
          const isSameSenderAsPrev = prevMsg?.senderId === item.senderId;

          return (
            <View
              style={[
                styles.msgRow,
                isMine ? styles.msgRowMine : styles.msgRowTheirs,
                isSameSenderAsPrev && { marginTop: -6 },
              ]}
            >
              {!isMine && (
                <View style={styles.senderAvatarWrap}>
                  {!isSameSenderAsPrev ? (
                    <Avatar name={name} size={30} />
                  ) : (
                    <View style={{ width: 30 }} />
                  )}
                </View>
              )}

              <View
                style={[
                  styles.bubble,
                  isMine ? styles.bubbleMine : styles.bubbleTheirs,
                  item.type === 'image' && styles.bubbleImageContainer,
                  item.type === 'location' && styles.bubbleLocationContainer,
                ]}
              >
                {/* ── Image Message ────────────────────────── */}
                {item.type === 'image' && (
                  <TouchableOpacity
                    onPress={() => setPreviewImage(item.mediaUri)}
                    activeOpacity={0.9}
                  >
                    <Image
                      source={{ uri: item.mediaUri }}
                      style={styles.msgImage}
                      resizeMode="cover"
                    />
                    {Boolean(item.text) && (
                      <Text
                        style={[
                          styles.bubbleText,
                          isMine ? styles.bubbleTextMine : styles.bubbleTextTheirs,
                          { marginTop: 6, marginHorizontal: 4 },
                        ]}
                      >
                        {item.text}
                      </Text>
                    )}
                  </TouchableOpacity>
                )}

                {/* ── Video Message ────────────────────────── */}
                {item.type === 'video' && (
                  <TouchableOpacity
                    style={styles.msgVideoCard}
                    onPress={() => setActiveVideo(item.mediaUri)}
                    activeOpacity={0.88}
                  >
                    <View style={styles.videoThumbnailPlaceholder}>
                      <View style={styles.playButtonCircle}>
                        <Ionicons name="play" size={26} color="#FFFFFF" style={{ marginLeft: 3 }} />
                      </View>
                      <View style={styles.videoBadge}>
                        <Ionicons name="videocam" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                        <Text style={styles.videoBadgeText}>
                          {item.duration ? `${Math.round(item.duration)}s` : 'Video Clip'}
                        </Text>
                      </View>
                    </View>
                    {Boolean(item.text) && (
                      <Text
                        style={[
                          styles.bubbleText,
                          isMine ? styles.bubbleTextMine : styles.bubbleTextTheirs,
                          { marginTop: 6, marginHorizontal: 4 },
                        ]}
                      >
                        {item.text}
                      </Text>
                    )}
                  </TouchableOpacity>
                )}

                {/* ── Location Message ──────────────────────── */}
                {item.type === 'location' && (
                  <View style={styles.msgLocationCard}>
                    <View style={styles.locationHeaderRow}>
                      <View style={styles.locationIconBadge}>
                        <Ionicons name="location" size={20} color="#2E7A99" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.locationTitle}>Rescue Location</Text>
                        <Text style={styles.locationAddr} numberOfLines={2}>
                          {item.location?.address || 'Pinned GPS Position'}
                        </Text>
                        {item.location?.latitude && (
                          <Text style={styles.locationCoords}>
                            {item.location.latitude.toFixed(5)}, {item.location.longitude.toFixed(5)}
                          </Text>
                        )}
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.openMapBtn}
                      onPress={() => openExternalLocation(item.location)}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="navigate" size={14} color="#FFFFFF" />
                      <Text style={styles.openMapBtnText}>Open in Google Maps / Directions</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* ── Standard Text Message ─────────────────── */}
                {(!item.type || item.type === 'text') && (
                  <Text
                    style={[
                      styles.bubbleText,
                      isMine ? styles.bubbleTextMine : styles.bubbleTextTheirs,
                    ]}
                  >
                    {item.text}
                  </Text>
                )}

                <View style={styles.timeRow}>
                  <Text style={[styles.bubbleTime, isMine && styles.bubbleTimeMine]}>
                    {formatMessageTime(item.time)}
                  </Text>
                  {isMine && (
                    <Ionicons
                      name="checkmark-done"
                      size={13}
                      color="#A4E6FA"
                      style={{ marginLeft: 4 }}
                    />
                  )}
                </View>
              </View>
            </View>
          );
        }}
      />

      {/* ── Input Bar ─────────────────────────────────────────── */}
      <View style={styles.inputBar}>
        {/* Attachment Plus Button */}
        <TouchableOpacity
          style={styles.attachBtn}
          onPress={() => setAttachModalVisible(true)}
          activeOpacity={0.75}
        >
          <Ionicons name="add" size={22} color="#2E7A99" />
        </TouchableOpacity>

        {/* Quick Paw Prompt */}
        <TouchableOpacity
          style={styles.quickActionBtn}
          onPress={() => handleSelectPrompt('🐾 Hi! Can you provide an update on the animal?')}
          activeOpacity={0.8}
        >
          <Ionicons name="paw" size={18} color="#2E7A99" />
        </TouchableOpacity>

        <View style={styles.inputWrap}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Write a message..."
            placeholderTextColor="#8C7D6A"
            value={text}
            onChangeText={setText}
            multiline
            maxHeight={90}
            returnKeyType="default"
          />
        </View>

        <TouchableOpacity
          style={[
            styles.sendBtn,
            text.trim() ? styles.sendBtnActive : styles.sendBtnDisabled,
          ]}
          onPress={handleSend}
          disabled={!text.trim()}
          activeOpacity={0.85}
        >
          <Ionicons
            name="paper-plane"
            size={17}
            color={text.trim() ? '#FFFFFF' : '#9E9080'}
          />
        </TouchableOpacity>
      </View>

      {/* ── Attachment Sheet Modal ────────────────────────────── */}
      <Modal
        visible={attachModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAttachModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.attachOverlay}
          activeOpacity={1}
          onPress={() => setAttachModalVisible(false)}
        >
          <View style={styles.attachSheet}>
            <View style={styles.attachHandle} />
            <Text style={styles.attachSheetTitle}>Share in Chat</Text>

            <View style={styles.attachGrid}>
              <TouchableOpacity
                style={styles.attachOption}
                onPress={handlePickImage}
                activeOpacity={0.75}
              >
                <View style={[styles.attachIconCircle, { backgroundColor: '#EBF7FA' }]}>
                  <Ionicons name="images" size={22} color="#2E7A99" />
                </View>
                <Text style={styles.attachOptionLabel}>Photo Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.attachOption}
                onPress={handleTakePhoto}
                activeOpacity={0.75}
              >
                <View style={[styles.attachIconCircle, { backgroundColor: '#FDF0EA' }]}>
                  <Ionicons name="camera" size={22} color="#E8622A" />
                </View>
                <Text style={styles.attachOptionLabel}>Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.attachOption}
                onPress={handlePickVideo}
                activeOpacity={0.75}
              >
                <View style={[styles.attachIconCircle, { backgroundColor: '#FDF6E2' }]}>
                  <Ionicons name="videocam" size={22} color="#B45309" />
                </View>
                <Text style={styles.attachOptionLabel}>Send Video</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.attachOption}
                onPress={handleShareLocation}
                activeOpacity={0.75}
              >
                <View style={[styles.attachIconCircle, { backgroundColor: '#EBF7EE' }]}>
                  <Ionicons name="location" size={22} color="#2E7D32" />
                </View>
                <Text style={styles.attachOptionLabel}>Live Location</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Fullscreen Image Preview Modal ────────────────────── */}
      <Modal
        visible={Boolean(previewImage)}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewImage(null)}
      >
        <SafeAreaView style={styles.mediaModalContainer}>
          <View style={styles.mediaModalHeader}>
            <TouchableOpacity
              style={styles.mediaCloseBtn}
              onPress={() => setPreviewImage(null)}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.mediaModalTitle}>Photo View</Text>
            <View style={{ width: 40 }} />
          </View>
          <View style={styles.mediaContentWrap}>
            {previewImage && (
              <Image
                source={{ uri: previewImage }}
                style={styles.fullscreenImage}
                resizeMode="contain"
              />
            )}
          </View>
        </SafeAreaView>
      </Modal>

      {/* ── Fullscreen Video Player Modal ─────────────────────── */}
      <VideoPlayerModal
        visible={Boolean(activeVideo)}
        videoUri={activeVideo}
        onClose={() => setActiveVideo(null)}
      />
    </KeyboardAvoidingView>
  );
}

function NativeVideoPlayer({ videoUri }) {
  const player = useVideoPlayer(videoUri, (p) => {
    p.loop = false;
    p.play();
  });

  return (
    <VideoView
      style={styles.fullscreenVideo}
      player={player}
      nativeControls
      allowsFullscreen
      allowsPictureInPicture
      contentFit="contain"
    />
  );
}

function VideoPlayerModal({ visible, videoUri, onClose }) {
  if (!visible || !videoUri) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.mediaModalContainer}>
        <View style={styles.mediaModalHeader}>
          <TouchableOpacity
            style={styles.mediaCloseBtn}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.mediaModalTitle}>Video Player</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.mediaContentWrap}>
          {Platform.OS === 'web' ? (
            <video
              src={videoUri}
              controls
              autoPlay
              playsInline
              style={{ width: '100%', height: '100%', maxHeight: '80vh', objectFit: 'contain' }}
            />
          ) : (
            <NativeVideoPlayer videoUri={videoUri} />
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function formatChatDate(isoString) {
  if (!isoString) return 'Today';
  const d = new Date(isoString);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return 'Today';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatMessageTime(timeStr) {
  if (!timeStr) return '';
  if (timeStr.includes('M') || timeStr.includes(':')) {
    if (!timeStr.includes('T')) return timeStr;
  }
  const d = new Date(timeStr);
  if (isNaN(d.getTime())) return timeStr;
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#FAF7EE',
  },

  // Header Center & Right
  navCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 8,
  },
  navAvatarWrap: {
    borderWidth: 1.5,
    borderColor: '#E8DFC8',
    borderRadius: 22,
    padding: 1,
  },
  navTextWrap: {
    flex: 1,
  },
  navName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#473018',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  navSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  navSub: {
    fontSize: 11,
    color: '#685038',
    fontWeight: '600',
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  menuBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8DFC8',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },

  locatingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EBF7FA',
    paddingVertical: 7,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#C8E8F2',
  },
  locatingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2E7A99',
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  emptyAvatarWrap: {
    padding: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#E8DFC8',
    marginBottom: 12,
    ...SHADOWS.sm,
  },
  emptyName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#473018',
    textAlign: 'center',
  },
  emptyRoleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EBF7FA',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#C6E7F2',
    marginTop: 6,
    marginBottom: 10,
  },
  emptyRoleText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#2E7A99',
  },
  emptyNote: {
    fontSize: 12.5,
    color: '#7A6B58',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 290,
    marginBottom: 24,
  },
  promptsSection: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EAE2D2',
    ...SHADOWS.sm,
  },
  promptsHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5C4E3A',
    marginBottom: 10,
  },
  promptsWrap: {
    gap: 8,
  },
  promptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F4EB',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E6DDCB',
  },
  promptText: {
    fontSize: 12,
    color: '#473018',
    fontWeight: '600',
    flex: 1,
  },

  // Message list
  msgList: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingBottom: 20,
  },
  datePillWrap: {
    alignItems: 'center',
    marginBottom: 16,
  },
  datePill: {
    backgroundColor: '#ECE5D5',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 14,
  },
  datePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5C4E3A',
  },

  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  msgRowMine: {
    justifyContent: 'flex-end',
  },
  msgRowTheirs: {
    justifyContent: 'flex-start',
  },
  senderAvatarWrap: {
    marginRight: 8,
    marginBottom: 2,
  },

  // Bubbles
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 18,
    ...SHADOWS.sm,
  },
  bubbleMine: {
    backgroundColor: '#2E7A99',
    borderBottomRightRadius: 4,
    shadowColor: '#2E7A99',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  bubbleTheirs: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8DFCE',
    borderBottomLeftRadius: 4,
  },
  bubbleImageContainer: {
    padding: 4,
    overflow: 'hidden',
  },
  bubbleLocationContainer: {
    padding: 0,
    overflow: 'hidden',
    width: 250,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleTextMine: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  bubbleTextTheirs: {
    color: '#473018',
    fontWeight: '500',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    paddingRight: 4,
  },
  bubbleTime: {
    fontSize: 10.5,
    color: '#8C7D6A',
  },
  bubbleTimeMine: {
    color: 'rgba(255, 255, 255, 0.8)',
  },

  // Media bubble contents
  msgImage: {
    width: 230,
    height: 180,
    borderRadius: 14,
    backgroundColor: '#E8E2D6',
  },
  msgVideoCard: {
    width: 230,
    borderRadius: 14,
    overflow: 'hidden',
  },
  videoThumbnailPlaceholder: {
    width: '100%',
    height: 140,
    backgroundColor: '#1E293B',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  playButtonCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(46, 122, 153, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  videoBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  videoBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },

  // Location card inside bubble
  msgLocationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    padding: 12,
  },
  locationHeaderRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  locationIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EBF7FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#473018',
  },
  locationAddr: {
    fontSize: 11.5,
    color: '#685038',
    marginTop: 2,
    lineHeight: 15,
  },
  locationCoords: {
    fontSize: 10.5,
    color: '#2E7A99',
    marginTop: 2,
    fontWeight: '600',
  },
  openMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#2E7A99',
    paddingVertical: 8,
    borderRadius: 10,
  },
  openMapBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },

  // Input Bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EAE2D2',
    ...SHADOWS.card,
  },
  attachBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F5F2EA',
    borderWidth: 1,
    borderColor: '#E4DDD0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EBF7FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrap: {
    flex: 1,
    backgroundColor: '#F5F2EA',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E4DDD0',
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    minHeight: 40,
    justifyContent: 'center',
  },
  input: {
    fontSize: 14,
    color: '#473018',
    lineHeight: 18,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnActive: {
    backgroundColor: '#2E7A99',
    ...SHADOWS.sm,
  },
  sendBtnDisabled: {
    backgroundColor: '#ECE6D8',
  },

  // Attach Sheet Modal
  attachOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  attachSheet: {
    backgroundColor: '#FCF8E8',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    ...SHADOWS.card,
  },
  attachHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D6CBBA',
    alignSelf: 'center',
    marginBottom: 14,
  },
  attachSheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#473018',
    textAlign: 'center',
    marginBottom: 18,
  },
  attachGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  attachOption: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  attachIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    ...SHADOWS.sm,
  },
  attachOptionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#473018',
    textAlign: 'center',
  },

  // Fullscreen Media Modals
  mediaModalContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  mediaModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  mediaCloseBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaModalTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  mediaContentWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenImage: {
    width: '100%',
    height: '100%',
  },
  fullscreenVideo: {
    width: '100%',
    height: '100%',
  },
});
