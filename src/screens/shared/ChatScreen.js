import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  Alert,
  Image,
  Modal,
  ActivityIndicator,
  Linking,
  Animated,
  PanResponder,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as Clipboard from 'expo-clipboard';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useApp } from '../../context/AppContext';
import { subscribeToMessages } from '../../services/chatService';
import { COLORS, SIZES, SHADOWS, FONTS } from '../../constants/theme';
import Avatar from '../../components/Avatar';

const chatMessagesCache = new Map();

const QUICK_PROMPTS = [
  { icon: 'paw-outline', text: 'How is the animal doing right now?' },
  { icon: 'location-outline', text: 'Can you share the exact landmarks or street address?' },
  { icon: 'car-outline', text: 'I am on my way to help with the rescue!' },
  { icon: 'help-circle-outline', text: 'Is rescue assistance still needed?' },
];

const GIF_CATEGORIES = [
  { id: 'all', label: '✨ All' },
  { id: 'animals', label: '🐾 Animals' },
  { id: 'dogs', label: '🐶 Dogs' },
  { id: 'cats', label: '🐱 Cats' },
  { id: 'love', label: '❤️ Love' },
  { id: 'celebrate', label: '🎉 Celebrate' },
  { id: 'thumbsup', label: '👍 Reactions' },
  { id: 'funny', label: '😂 Funny' },
];

const CURATED_GIFS = [
  // Animals / Dogs
  { id: 'g_dog1', title: 'Happy Golden', category: 'dogs', tags: ['dog', 'happy', 'excited', 'wag', 'cute', 'animal', 'pet'], url: 'https://media.giphy.com/media/4Zo41lhzKt6iZ8xff9/giphy.gif' },
  { id: 'g_dog2', title: 'Puppy Wink', category: 'dogs', tags: ['dog', 'puppy', 'wink', 'cute', 'animal', 'love', 'hi', 'hello'], url: 'https://media.giphy.com/media/bbshzgyFQDqPHXBo4c/giphy.gif' },
  { id: 'g_dog3', title: 'Dog High Five', category: 'dogs', tags: ['dog', 'high five', 'paw', 'good', 'approved', 'yes', 'thanks'], url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif' },
  { id: 'g_dog4', title: 'Happy Dance Dog', category: 'dogs', tags: ['dog', 'dance', 'happy', 'celebrate', 'yay'], url: 'https://media.giphy.com/media/13CoXDiaCcCoyk/giphy.gif' },
  { id: 'g_dog5', title: 'Curious Puppy', category: 'dogs', tags: ['dog', 'puppy', 'head tilt', 'cute', 'question'], url: 'https://media.giphy.com/media/26xBI73gWquCBBCDe/giphy.gif' },
  { id: 'g_dog6', title: 'Dog Hug', category: 'dogs', tags: ['dog', 'hug', 'love', 'cuddle', 'care', 'friends'], url: 'https://media.giphy.com/media/MDJ9IbxxvDUQM/giphy.gif' },
  // Animals / Cats
  { id: 'g_cat1', title: 'Cat Vibing', category: 'cats', tags: ['cat', 'vibing', 'nod', 'music', 'cool', 'yes'], url: 'https://media.giphy.com/media/jpbnoe3UIa8TU8LM13/giphy.gif' },
  { id: 'g_cat2', title: 'Cute Kitten Hug', category: 'cats', tags: ['cat', 'kitten', 'hug', 'love', 'cuddle', 'cute', 'sweet'], url: 'https://media.giphy.com/media/ICOgUNjpvO0PC/giphy.gif' },
  { id: 'g_cat3', title: 'Cat High Five', category: 'cats', tags: ['cat', 'high five', 'paw', 'yes', 'cool', 'nice'], url: 'https://media.giphy.com/media/Lq0h93752f6J9tijrh/giphy.gif' },
  { id: 'g_cat4', title: 'Sleepy Cat', category: 'cats', tags: ['cat', 'sleepy', 'tired', 'nap', 'bed', 'rest'], url: 'https://media.giphy.com/media/mlvseq9yvZhba/giphy.gif' },
  { id: 'g_cat5', title: 'Surprised Cat', category: 'cats', tags: ['cat', 'surprised', 'wow', 'shocked', 'omg'], url: 'https://media.giphy.com/media/unQ3IJU2RG7DO/giphy.gif' },
  { id: 'g_cat6', title: 'Purring Cat Heart', category: 'cats', tags: ['cat', 'heart', 'love', 'purr', 'thank you'], url: 'https://media.giphy.com/media/C9x8gX02SnMIoAClXA/giphy.gif' },
  // Animals General
  { id: 'g_anim1', title: 'Cute Bunny', category: 'animals', tags: ['bunny', 'rabbit', 'cute', 'animal', 'eat'], url: 'https://media.giphy.com/media/10hzvF9FTeJaLK/giphy.gif' },
  { id: 'g_anim2', title: 'Puppy & Kitten', category: 'animals', tags: ['animals', 'friends', 'puppy', 'kitten', 'cute', 'rescue'], url: 'https://media.giphy.com/media/3oEduV4SOS9mmmIOkw/giphy.gif' },
  // Love & Care
  { id: 'g_love1', title: 'Heart Paw', category: 'love', tags: ['heart', 'love', 'paw', 'animal', 'care', 'sweet'], url: 'https://media.giphy.com/media/M90mJvfWfd5mbUuULX/giphy.gif' },
  { id: 'g_love2', title: 'Sending Love', category: 'love', tags: ['love', 'hug', 'warm', 'thanks', 'caring', 'alaga'], url: 'https://media.giphy.com/media/xT0xeJpnrWC4XWblEk/giphy.gif' },
  { id: 'g_love3', title: 'Big Hugs', category: 'love', tags: ['hug', 'hugs', 'love', 'bear', 'support', 'comfort'], url: 'https://media.giphy.com/media/5OqXb948EBkyUcnwHt/giphy.gif' },
  { id: 'g_love4', title: 'Thank You so Much', category: 'love', tags: ['thanks', 'thank you', 'grateful', 'appreciate'], url: 'https://media.giphy.com/media/osjgQPWRx3cac/giphy.gif' },
  // Celebrate / Adopted / Rescued
  { id: 'g_cel1', title: 'Celebration Confetti', category: 'celebrate', tags: ['celebrate', 'party', 'confetti', 'yay', 'adopted', 'rescued', 'win'], url: 'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif' },
  { id: 'g_cel2', title: 'Happy Dance', category: 'celebrate', tags: ['happy', 'dance', 'yay', 'excited', 'success'], url: 'https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif' },
  { id: 'g_cel3', title: 'Clapping Hands', category: 'celebrate', tags: ['applause', 'clapping', 'good job', 'bravo', 'hero'], url: 'https://media.giphy.com/media/l4q8cJzGdR9J8w3hS/giphy.gif' },
  { id: 'g_cel4', title: 'Woohoo Yay', category: 'celebrate', tags: ['woohoo', 'yay', 'hooray', 'awesome', 'great'], url: 'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif' },
  // Thumbs Up & Reactions
  { id: 'g_thu1', title: 'Thumbs Up Dog', category: 'thumbsup', tags: ['thumbs up', 'good', 'agree', 'ok', 'yes', 'approved'], url: 'https://media.giphy.com/media/111ebonMs90YLu/giphy.gif' },
  { id: 'g_thu2', title: 'Double Thumbs Up', category: 'thumbsup', tags: ['thumbs up', 'cool', 'awesome', 'nice', 'perfect'], url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif' },
  { id: 'g_thu3', title: 'On My Way', category: 'thumbsup', tags: ['on my way', 'omw', 'running', 'rescue', 'coming', 'fast'], url: 'https://media.giphy.com/media/3o7Z4tNxQK3ocsBRx6/giphy.gif' },
  { id: 'g_thu4', title: 'Stay Safe', category: 'thumbsup', tags: ['safe', 'care', 'bless', 'prayers', 'rescue'], url: 'https://media.giphy.com/media/l3q2wJsC23ikJg9xe/giphy.gif' },
  // Funny
  { id: 'g_fun1', title: 'Smiling Dog', category: 'funny', tags: ['smile', 'dog', 'funny', 'laugh', 'happy', 'grin'], url: 'https://media.giphy.com/media/3ndAvMC5lfPNMCzq7m/giphy.gif' },
  { id: 'g_fun2', title: 'Shocked Pet', category: 'funny', tags: ['shocked', 'funny', 'what', 'omg', 'eyes'], url: 'https://media.giphy.com/media/vQqeT3AYg8S5O/giphy.gif' },
  { id: 'g_fun3', title: 'Sneaky Cat', category: 'funny', tags: ['sneaky', 'cat', 'funny', 'peek', 'hello'], url: 'https://media.giphy.com/media/BzyTuYCmvSORqs1ABM/giphy.gif' },
  { id: 'g_fun4', title: 'Puppy Zoomies', category: 'funny', tags: ['zoomies', 'puppy', 'fast', 'excited', 'funny'], url: 'https://media.giphy.com/media/mCRJDo24UvJMA/giphy.gif' },
];

function SwipeableMessageRow({ children, isMine, onSwipeReply, onLongPress }) {
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 15 && Math.abs(gestureState.dy) < 12;
      },
      onPanResponderMove: (_, gestureState) => {
        let dx = gestureState.dx;
        const maxOffset = 55;
        if (dx < -maxOffset) dx = -maxOffset;
        if (dx > maxOffset) dx = maxOffset;
        pan.setValue({ x: dx, y: 0 });
      },
      onPanResponderRelease: (_, gestureState) => {
        if (Math.abs(gestureState.dx) > 32) {
          onSwipeReply?.();
        }
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  return (
    <View style={styles.swipeContainer}>
      <Animated.View
        style={[
          styles.swipeReplyIconWrap,
          isMine ? styles.swipeReplyIconLeft : styles.swipeReplyIconRight,
          {
            opacity: pan.x.interpolate({
              inputRange: [-45, -15, 0, 15, 45],
              outputRange: [1, 0.4, 0, 0.4, 1],
            }),
            transform: [
              {
                scale: pan.x.interpolate({
                  inputRange: [-45, -15, 0, 15, 45],
                  outputRange: [1.05, 0.7, 0.3, 0.7, 1.05],
                }),
              },
            ],
          },
        ]}
      >
        <Ionicons name="arrow-undo" size={15} color="#2E7A99" />
      </Animated.View>
      <Animated.View
        {...panResponder.panHandlers}
        style={{ transform: [{ translateX: pan.x }] }}
      >
        <TouchableOpacity
          onLongPress={onLongPress}
          delayLongPress={280}
          activeOpacity={0.92}
        >
          {children}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

export default function ChatScreen({ route, navigation }) {
  const {
    conversationId,
    otherName,
    userName: routeUserName,
    otherId: routeOtherId,
    otherAvatar: routeOtherAvatar,
    userAvatar: routeUserAvatar,
    initialDraft,
    linkedReport,
  } = route.params || {};
  const resolvedOtherName = otherName || routeUserName;
  const { conversations, currentUser, sendMessage, clearConversation, markConversationRead,
    setActiveConversationId, showAlert, updateGroupInfo, removeMemberFromGroup, leaveGroupConversation, getAllKnownUsers, getUserById } = useApp();
  const messagesCacheKey = `@alaga_chat_messages_v1_${currentUser?.id || 'guest'}_${conversationId || 'none'}`;
  const [text, setText] = useState(initialDraft || '');
  const [messages, setMessages] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [attachModalVisible, setAttachModalVisible] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [activeVideo, setActiveVideo] = useState(null);
  // Group info modal state
  const [groupInfoVisible, setGroupInfoVisible] = useState(false);
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupPhoto, setEditGroupPhoto] = useState(null);
  // Add members state
  const [addMembersVisible, setAddMembersVisible] = useState(false);
  const [selectedNewMembers, setSelectedNewMembers] = useState([]);
  const [memberSearch, setMemberSearch] = useState('');
  // Media gallery state
  const [mediaGalleryVisible, setMediaGalleryVisible] = useState(false);
  const [galleryPreview, setGalleryPreview] = useState(null);
  // Assign new admin modal state (when admin leaves)
  const [assignAdminModalVisible, setAssignAdminModalVisible] = useState(false);
  const [selectedNextAdminId, setSelectedNextAdminId] = useState(null);

  // Reply and GIF feature states
  const [replyingTo, setReplyingTo] = useState(null);
  const [gifModalVisible, setGifModalVisible] = useState(false);
  const [gifSearch, setGifSearch] = useState('');
  const [selectedGifCategory, setSelectedGifCategory] = useState('all');
  const [msgActionModalVisible, setMsgActionModalVisible] = useState(false);
  const [selectedMsgAction, setSelectedMsgAction] = useState(null);

  const flatRef = useRef(null);
  const inputRef = useRef(null);
  const isSendingReportRef = useRef(false);
  const isSendingTextRef = useRef(false);

  const insets = useSafeAreaInsets();
  useLayoutEffect(() => {
    const cachedMessages = chatMessagesCache.get(messagesCacheKey) || [];
    setMessages(cachedMessages);
    setIsLoadingMessages(cachedMessages.length === 0);
  }, [conversationId, messagesCacheKey]);

  const safeTopPadding =
    Platform.OS === 'ios'
      ? Math.max(insets.top, 16) + 4
      : insets.top > 24
        ? insets.top + 6
        : 14;

  useEffect(() => {
    if (!conversationId) return;
    let active = true;
    const unsubscribe = subscribeToMessages(
      conversationId,
      (firestoreMsgs, snapshotState = {}) => {
        if (!active || !Array.isArray(firestoreMsgs)) return;
        setMessages((prev) => {
          const merged = new Map();
          // Seed previously loaded / cached / optimistic messages so they never disappear
          (prev || []).forEach((message) => {
            if (message?.id) merged.set(message.id, message);
          });
          // Merge in live messages from Firestore
          firestoreMsgs.forEach((message) => {
            if (message?.id) merged.set(message.id, message);
          });
          const next = Array.from(merged.values()).sort(
            (a, b) => new Date(a.time || 0) - new Date(b.time || 0)
          );
          return next;
        });
        if (!snapshotState.fromCache) {
          chatMessagesCache.set(messagesCacheKey, firestoreMsgs.slice(-200));
        }
        if (firestoreMsgs.length > 0 || !snapshotState.fromCache) {
          setIsLoadingMessages(false);
        }
      },
      (err) => {
        if (!active) return;
        console.warn('[ChatScreen] Messages listener error:', err?.message);
        setIsLoadingMessages(false);
      }
    );
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [conversationId, messagesCacheKey]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 80);
    }
  }, [messages.length]);

  const foundConvo = conversations.find((c) => c.id === conversationId);
  const detectedOtherId = foundConvo?.participants?.find((p) => p !== currentUser?.id);
  const otherId = foundConvo?.isGroup ? null : (routeOtherId || detectedOtherId || null);
  const otherUser = otherId ? getUserById(otherId) : null;
  const convo = foundConvo || {
    id: conversationId,
    participants: currentUser?.id && otherId ? [currentUser.id, otherId] : (currentUser?.id ? [currentUser.id] : []),
    participantNames: {
      ...(currentUser?.id ? { [currentUser.id]: currentUser.name || 'You' } : {}),
      ...(otherId ? { [otherId]: resolvedOtherName || 'Chat' } : {}),
    },
    participantAvatars: {
      ...(currentUser?.id ? { [currentUser.id]: currentUser.avatar || null } : {}),
      ...(otherId ? { [otherId]: routeOtherAvatar || null } : {}),
    },
    lastMessage: '',
    lastMessageTime: new Date().toISOString(),
    unreadCounts: {},
  };
  const isGroup = convo?.isGroup || false;
  const otherAvatar =
    otherUser?.avatar ||
    routeOtherAvatar ||
    routeUserAvatar ||
    (detectedOtherId && convo?.participantAvatars?.[detectedOtherId]) ||
    (otherId && convo?.participantAvatars?.[otherId]) ||
    null;
  const groupName = convo?.groupName || resolvedOtherName || 'Group Chat';
  const groupPhoto = editGroupPhoto || convo?.groupPhoto || null;
  const name = isGroup
    ? groupName
    : (otherUser?.name ||
      resolvedOtherName ||
      (detectedOtherId && convo?.participantNames?.[detectedOtherId]) ||
      (convo?.participant1 === currentUser?.id ? convo?.participant2Name : convo?.participant1Name) ||
      'Chat');

  const myId = currentUser?.id || currentUser?.uid;
  const adminId = convo?.adminId || convo?.creatorId || convo?.participants?.[0] || null;
  const isCurrentUserAdmin = Boolean(myId && adminId && (myId === adminId || currentUser?.id === adminId || currentUser?.uid === adminId));

  const groupMembers = isGroup && convo?.participants
    ? convo.participants.map((pid) => {
      const u = getUserById(pid);
      const isAdm = pid === adminId;
      return {
        id: pid,
        name: u?.name || convo.participantNames?.[pid] || 'Member',
        avatar: u?.avatar || convo.participantAvatars?.[pid] || null,
        isMe: pid === myId || pid === currentUser?.id || pid === currentUser?.uid,
        isAdmin: isAdm,
      };
    })
    : [];

  const mediaMessages = messages.filter((m) => m.type === 'image' || m.type === 'video');

  const nonMembers = isGroup
    ? (getAllKnownUsers?.() || []).filter(
      (u) => u.id !== myId && u.id !== currentUser?.id && u.id !== currentUser?.uid && !(convo?.participants || []).includes(u.id)
    )
    : [];

  useEffect(() => {
    if (setActiveConversationId && conversationId) {
      setActiveConversationId(conversationId);
      return () => {
        setActiveConversationId(null);
      };
    }
  }, [conversationId, setActiveConversationId]);

  // Keep latest messages visible when keyboard opens on Android/iOS
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const sub = Keyboard.addListener(showEvent, () => {
      setTimeout(() => {
        flatRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (convo?.id && markConversationRead) {
      markConversationRead(convo.id);
    }
  }, [convo?.id, messages?.length]);

  useEffect(() => {
    if (initialDraft) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [initialDraft]);

  // Manual send state for linked rescue report: stays visible until user taps "Send Case" or closes with "✕"
  const [showLinkedReportBanner, setShowLinkedReportBanner] = useState(Boolean(linkedReport));

  // Auto-hide the linked report banner if this case has already been linked in the chat
  useEffect(() => {
    if (linkedReport && messages.some((m) => m.type === 'report_link' && m.reportId === linkedReport.id)) {
      setShowLinkedReportBanner(false);
    }
  }, [messages, linkedReport]);

  const handleSendLinkedReport = () => {
    if (!linkedReport || !convo?.id) return;
    if (isSendingReportRef.current) return;
    isSendingReportRef.current = true;
    setShowLinkedReportBanner(false);

    // If this rescue report is already linked in messages, don't duplicate it
    const alreadyLinked = messages.some(
      (m) => m.type === 'report_link' && m.reportId === linkedReport.id
    );
    if (alreadyLinked) {
      isSendingReportRef.current = false;
      return;
    }

    const reportMsgId = `m_rep_${linkedReport.id}_${Date.now()}`;
    const reportMsg = {
      id: reportMsgId,
      _pending: true,
      senderId: currentUser?.id,
      senderName: currentUser?.name || 'User',
      senderAvatar: currentUser?.avatar || null,
      type: 'report_link',
      reportId: linkedReport.id,
      animalType: linkedReport.animalType || 'Animal',
      condition: linkedReport.condition || 'Rescue',
      address: linkedReport.location?.address || '',
      status: linkedReport.status || 'Open',
      reporterName: linkedReport.reporterName || '',
      text: `📋 Rescue Report: ${linkedReport.animalType || 'Animal'} (${linkedReport.condition || 'Rescue'}) at ${linkedReport.location?.address || 'reported location'}`,
      time: new Date().toISOString(),
    };

    setMessages((prev) => {
      if (prev.some((m) => m.type === 'report_link' && m.reportId === linkedReport.id)) {
        return prev;
      }
      return [...prev, reportMsg];
    });

    sendMessage(convo.id, reportMsg).then((saved) => {
      if (!saved) {
        setMessages((prev) => prev.filter((m) => m.id !== reportMsg.id));
        setShowLinkedReportBanner(true);
      }
    });
    setTimeout(() => {
      isSendingReportRef.current = false;
      flatRef.current?.scrollToEnd({ animated: true });
    }, 400);
  };

  const handleStartReply = (msg) => {
    if (!msg) return;
    const currentUid = currentUser?.id || currentUser?.uid;
    const isMine = msg.senderId === currentUid || msg.senderId === currentUser?.id || msg.senderId === currentUser?.uid;
    const senderUser = !isMine && msg.senderId ? getUserById(msg.senderId) : null;
    const senderName = isMine
      ? 'yourself'
      : senderUser?.name || convo?.participantNames?.[msg.senderId] || name || 'Member';

    let snippet = msg.text || '';
    if (msg.type === 'image') snippet = '📷 Photo';
    else if (msg.type === 'gif') snippet = '👾 GIF';
    else if (msg.type === 'video') snippet = '🎥 Video';
    else if (msg.type === 'location') snippet = '📍 Rescue Location';
    else if (msg.type === 'report_link') snippet = '📋 Rescue Report';

    setReplyingTo({
      id: msg.id,
      senderId: msg.senderId,
      senderName,
      text: snippet,
      type: msg.type || 'text',
      mediaUri: msg.mediaUri || null,
      isMine,
    });
    setMsgActionModalVisible(false);
    setTimeout(() => inputRef.current?.focus(), 80);
  };

  const handleOpenMsgAction = (msg) => {
    if (!msg) return;
    setSelectedMsgAction(msg);
    setMsgActionModalVisible(true);
  };

  const handleCopyText = async () => {
    if (selectedMsgAction?.text) {
      await Clipboard.setStringAsync(selectedMsgAction.text);
      setMsgActionModalVisible(false);
      showAlert({
        title: 'Copied',
        message: 'Message text copied to clipboard.',
        type: 'success',
        customIcon: 'copy-outline',
      });
    }
  };

  const handleScrollToMessage = (messageId) => {
    if (!messageId) return;
    const idx = messages.findIndex((m) => m.id === messageId);
    if (idx >= 0 && flatRef.current) {
      try {
        flatRef.current.scrollToIndex({ index: idx, animated: true, viewPosition: 0.5 });
      } catch (e) {
        flatRef.current.scrollToEnd({ animated: true });
      }
    }
  };

  const handleSendGif = (gifUrl) => {
    setGifModalVisible(false);
    if (!convo?.id || !gifUrl) return;
    const currentUid = currentUser?.id || currentUser?.uid;
    const gifMsg = {
      id: `m_gif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      _pending: true,
      senderId: currentUid,
      senderName: currentUser?.name || 'User',
      senderAvatar: currentUser?.avatar || null,
      type: 'gif',
      mediaUri: gifUrl,
      text: '',
      time: new Date().toISOString(),
      ...(replyingTo ? {
        replyTo: {
          id: replyingTo.id,
          senderId: replyingTo.senderId,
          senderName: replyingTo.senderName,
          text: replyingTo.text,
          type: replyingTo.type,
        }
      } : {}),
    };
    setReplyingTo(null);
    setMessages((prev) => [...prev, gifMsg]);
    sendMessage(convo.id, gifMsg).then((saved) => {
      if (!saved) setMessages((prev) => prev.filter((m) => m.id !== gifMsg.id));
    });
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const filteredGifs = CURATED_GIFS.filter((g) => {
    if (selectedGifCategory !== 'all' && g.category !== selectedGifCategory) {
      return false;
    }
    if (!gifSearch.trim()) return true;
    const q = gifSearch.toLowerCase().trim();
    return (
      g.title.toLowerCase().includes(q) ||
      g.category.toLowerCase().includes(q) ||
      (g.tags || []).some((t) => t.toLowerCase().includes(q))
    );
  });

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || !convo) return;
    if (isSendingTextRef.current) return;
    isSendingTextRef.current = true;
    setTimeout(() => { isSendingTextRef.current = false; }, 350);

    const currentUid = currentUser?.id || currentUser?.uid;
    const userMsg = {
      id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      _pending: true,
      senderId: currentUid,
      senderName: currentUser?.name || 'User',
      senderAvatar: currentUser?.avatar || null,
      type: 'text',
      text: trimmed,
      time: new Date().toISOString(),
      ...(replyingTo ? {
        replyTo: {
          id: replyingTo.id,
          senderId: replyingTo.senderId,
          senderName: replyingTo.senderName,
          text: replyingTo.text,
          type: replyingTo.type,
        }
      } : {}),
    };
    setReplyingTo(null);
    setText('');
    setMessages((prev) => [...prev, userMsg]);
    sendMessage(convo.id, userMsg).then((saved) => {
      if (!saved) setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
    });
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleSelectPrompt = (promptText) => {
    setText(promptText);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

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
        const pickedUri = result.assets[0].uri;
        const isGifFile = pickedUri.toLowerCase().endsWith('.gif') || result.assets[0].mimeType === 'image/gif';
        sendMessage(convo.id, {
          type: isGifFile ? 'gif' : 'image',
          mediaUri: pickedUri,
          text: text.trim(),
          ...(replyingTo ? {
            replyTo: {
              id: replyingTo.id,
              senderId: replyingTo.senderId,
              senderName: replyingTo.senderName,
              text: replyingTo.text,
              type: replyingTo.type,
            }
          } : {}),
        });
        setReplyingTo(null);
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
          ...(replyingTo ? {
            replyTo: {
              id: replyingTo.id,
              senderId: replyingTo.senderId,
              senderName: replyingTo.senderName,
              text: replyingTo.text,
              type: replyingTo.type,
            }
          } : {}),
        });
        setReplyingTo(null);
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
          ...(replyingTo ? {
            replyTo: {
              id: replyingTo.id,
              senderId: replyingTo.senderId,
              senderName: replyingTo.senderName,
              text: replyingTo.text,
              type: replyingTo.type,
            }
          } : {}),
        });
        setReplyingTo(null);
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
      } catch (e) { }

      if (convo?.id) {
        sendMessage(convo.id, {
          type: 'location',
          location: {
            latitude: lat,
            longitude: lng,
            address,
          },
          text: text.trim() || '📍 Shared live rescue location',
          ...(replyingTo ? {
            replyTo: {
              id: replyingTo.id,
              senderId: replyingTo.senderId,
              senderName: replyingTo.senderName,
              text: replyingTo.text,
              type: replyingTo.type,
            }
          } : {}),
        });
        setReplyingTo(null);
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
    if (isGroup) {
      setEditGroupName(groupName);
      setEditGroupPhoto(convo?.groupPhoto || null);
      setGroupInfoVisible(true);
      return;
    }
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
            message: 'Are you sure you want to clear all messages and remove this conversation?',
            type: 'warning',
            customIcon: 'trash-outline',
            secondaryText: 'Cancel',
            primaryText: 'Clear All',
            onPrimaryPress: () => {
              const targetId = convo?.id || conversationId;
              setMessages([]);
              chatMessagesCache.delete(messagesCacheKey);
              if (targetId) clearConversation(targetId);
              navigation.goBack();
            },
          });
        }, 200);
      },
      primaryText: otherId ? 'View Profile' : 'OK',
      onPrimaryPress: otherId
        ? () => navigation.navigate('PublicProfile', { userId: otherId, userName: name, userAvatar: otherAvatar })
        : null,
    });
  };

  const handlePickGroupPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') return;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        setEditGroupPhoto(result.assets[0].uri);
      }
    } catch (e) { }
  };

  const handleSaveGroupInfo = () => {
    if (!convo?.id) return;
    updateGroupInfo(convo.id, {
      groupName: editGroupName.trim() || groupName,
      groupPhoto: editGroupPhoto,
    });
    setGroupInfoVisible(false);
  };

  const handleSaveNewMembers = () => {
    if (!convo?.id || selectedNewMembers.length === 0) {
      setMemberSearch('');
      setAddMembersVisible(false);
      return;
    }
    updateGroupInfo(convo.id, {
      addParticipants: selectedNewMembers,
    });
    setSelectedNewMembers([]);
    setMemberSearch('');
    setAddMembersVisible(false);
  };

  const toggleSelectMember = (user) => {
    setSelectedNewMembers((prev) => {
      const already = prev.find((u) => u.id === user.id);
      if (already) return prev.filter((u) => u.id !== user.id);
      return [...prev, { id: user.id, name: user.name, avatar: user.avatar || null }];
    });
  };

  const handleRemoveMember = (member) => {
    if (!convo?.id || !member?.id) return;
    showAlert({
      title: 'Remove Member',
      message: `Are you sure you want to remove ${member.name} from "${name}"?`,
      type: 'warning',
      customIcon: 'person-remove-outline',
      secondaryText: 'Cancel',
      primaryText: 'Remove',
      onPrimaryPress: () => {
        removeMemberFromGroup(convo.id, member.id);
      },
    });
  };

  const handleLeaveGroup = () => {
    if (!convo?.id) return;
    const otherMembers = groupMembers.filter((m) => !m.isMe);

    // If admin is leaving and other members exist, prompt admin selection modal
    if (isCurrentUserAdmin && otherMembers.length > 0) {
      setSelectedNextAdminId(otherMembers[0]?.id || null);
      setAssignAdminModalVisible(true);
      return;
    }

    // Regular member or admin leaving empty group
    showAlert({
      title: 'Leave Group Chat',
      message: otherMembers.length === 0
        ? 'You are the only member left. Leaving will delete this group chat.'
        : `Are you sure you want to leave "${name}"? You will no longer receive new messages from this group.`,
      type: 'warning',
      customIcon: 'log-out-outline',
      secondaryText: 'Cancel',
      primaryText: 'Leave Group',
      onPrimaryPress: () => {
        setGroupInfoVisible(false);
        chatMessagesCache.delete(messagesCacheKey);
        leaveGroupConversation(convo.id);
        navigation.goBack();
      },
    });
  };

  const handleConfirmAdminAndLeave = () => {
    if (!convo?.id || !selectedNextAdminId) return;
    const chosenMember = groupMembers.find((m) => m.id === selectedNextAdminId);
    showAlert({
      title: 'Assign Admin & Leave',
      message: `Appoint ${chosenMember?.name || 'this member'} as the new group admin and leave "${name}"?`,
      type: 'warning',
      customIcon: 'shield-checkmark',
      secondaryText: 'Cancel',
      primaryText: 'Confirm & Leave',
      onPrimaryPress: () => {
        setAssignAdminModalVisible(false);
        setGroupInfoVisible(false);
        chatMessagesCache.delete(messagesCacheKey);
        leaveGroupConversation(convo.id, selectedNextAdminId);
        navigation.goBack();
      },
    });
  };

  const renderEmptyState = () => {
    if (isGroup) {
      return (
        <View style={styles.emptyContainer}>
          <TouchableOpacity
            style={styles.groupEmptyAvatarWrap}
            onPress={() => { setEditGroupName(groupName); setEditGroupPhoto(convo?.groupPhoto || null); setGroupInfoVisible(true); }}
            activeOpacity={0.8}
          >
            {groupPhoto
              ? <Image source={{ uri: groupPhoto }} style={styles.groupEmptyAvatar} />
              : <View style={styles.groupEmptyAvatarPlaceholder}>
                <Ionicons name="people" size={36} color="#2E7A99" />
              </View>
            }
            <View style={styles.groupEmptyCameraBtn}>
              <Ionicons name="camera" size={14} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          <Text style={styles.emptyName}>{name}</Text>
          <View style={styles.groupEmptyBadge}>
            <Ionicons name="people" size={13} color="#2E7A99" />
            <Text style={styles.emptyRoleText}>Group · {groupMembers.length} members</Text>
          </View>
          <Text style={styles.emptyNote}>This is the beginning of your group chat. Say hi!</Text>

          <View style={styles.membersSection}>
            <Text style={styles.membersSectionTitle}>Members</Text>
            {groupMembers.map((m) => (
              <View key={m.id} style={styles.memberRow}>
                <Avatar name={m.name} userId={m.id} uri={m.avatar} size={36} />
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 10, gap: 6, flexWrap: 'wrap' }}>
                  <Text style={styles.memberName}>{m.name}</Text>
                  {m.isMe && (
                    <View style={styles.youBadge}>
                      <Text style={styles.youBadgeText}>You</Text>
                    </View>
                  )}
                  {m.isAdmin && (
                    <View style={styles.adminBadge}>
                      <Ionicons name="shield-checkmark" size={10} color="#1E7E34" style={{ marginRight: 2 }} />
                      <Text style={styles.adminBadgeText}>Admin</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyAvatarWrap}>
          <Avatar name={name} userId={otherId} uri={otherAvatar} size={68} />
        </View>
        <Text style={styles.emptyName}>{name}</Text>
        <View style={styles.emptyRoleBadge}>
          <Ionicons name="shield-checkmark" size={13} color="#2E7A99" />
          <Text style={styles.emptyRoleText}>ALAGA Community Member</Text>
        </View>
        <Text style={styles.emptyNote}>
          This is the start of your private 1-on-1 chat with {name}. Send a message, animal photo, video, or location pin to coordinate!
        </Text>
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
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <StatusBar style="dark" />

      {/* ── Header (With Back Button) ──────── */}
      <View style={[styles.headerWrap, { paddingTop: safeTopPadding }]}>
        <TouchableOpacity
          onPress={() => {
            if (navigation?.canGoBack && navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('Home');
            }
          }}
          style={styles.backBtn}
          activeOpacity={0.78}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={20} color={COLORS.brown} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navCenter}
          onPress={() => {
            if (isGroup) {
              setEditGroupName(groupName);
              setEditGroupPhoto(convo?.groupPhoto || null);
              setGroupInfoVisible(true);
            } else if (otherId) {
              navigation.navigate('PublicProfile', { userId: otherId, userName: name, userAvatar: otherAvatar });
            }
          }}
          activeOpacity={0.75}
        >
          {isGroup ? (
            groupPhoto ? (
              <Image source={{ uri: groupPhoto }} style={[styles.navGroupAvatar, { marginRight: 10 }]} />
            ) : (
              <View style={[styles.navGroupAvatarPlaceholder, { marginRight: 10 }]}>
                <Ionicons name="people" size={20} color="#2E7A99" />
              </View>
            )
          ) : (
            <Avatar name={name} userId={otherId} uri={otherAvatar} size={40} style={{ marginRight: 10 }} />
          )}
          <View style={styles.navTextWrap}>
            <Text style={styles.navName} numberOfLines={1}>{name}</Text>
            <View style={styles.navSubRow}>
              {isGroup
                ? <><Ionicons name="people" size={11} color="#2E7A99" style={{ marginRight: 3 }} />
                  <Text style={styles.navSub}>{groupMembers.length} members</Text></>
                : <><Ionicons name="paw" size={11} color="#2E7A99" style={{ marginRight: 3 }} />
                  <Text style={styles.navSub}>ALAGA Direct Chat</Text></>
              }
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuBtn}
          onPress={handleOpenMenu}
          activeOpacity={0.8}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="ellipsis-vertical" size={18} color={COLORS.brown} />
        </TouchableOpacity>
      </View>

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
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.msgList,
          messages.length === 0 && { flexGrow: 1, justifyContent: 'center' },
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={isLoadingMessages
          ? <ActivityIndicator size="small" color="#2E7A99" />
          : renderEmptyState}
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
          const currentUid = currentUser?.id || currentUser?.uid;
          const isMine = item.senderId === currentUid || item.senderId === currentUser?.id || item.senderId === currentUser?.uid;
          const prevMsg = index > 0 ? messages[index - 1] : null;
          const isSameSenderAsPrev = prevMsg?.senderId === item.senderId;

          const senderUser = !isMine && item.senderId ? getUserById(item.senderId) : null;
          const senderName = isGroup && !isMine && !isSameSenderAsPrev
            ? (senderUser?.name || convo?.participantNames?.[item.senderId] || 'Member')
            : null;

          return (
            <SwipeableMessageRow
              key={item.id}
              isMine={isMine}
              onSwipeReply={() => handleStartReply(item)}
              onLongPress={() => handleOpenMsgAction(item)}
            >
              <View
                style={[
                  styles.msgRow,
                  isMine ? styles.msgRowMine : styles.msgRowTheirs,
                  isSameSenderAsPrev && { marginTop: -6 },
                ]}
              >
                {!isMine && (
                  !isSameSenderAsPrev ? (
                    <Avatar
                      name={senderUser?.name || convo?.participantNames?.[item.senderId] || name}
                      userId={item.senderId || otherId}
                      avatar={senderUser?.avatar}
                      size={30}
                      style={styles.senderAvatar}
                    />
                  ) : (
                    <View style={styles.senderAvatarSpacer} />
                  )
                )}

                <View style={[styles.bubbleColumn, isMine && styles.bubbleColumnMine]}>
                  {senderName && (
                    <Text style={styles.groupSenderName}>{senderName}</Text>
                  )}
                  <View
                    style={[
                      styles.bubble,
                      isMine ? styles.bubbleMine : styles.bubbleTheirs,
                      (item.type === 'image' || item.type === 'gif') && styles.bubbleImageContainer,
                      item.type === 'location' && styles.bubbleLocationContainer,
                      item.type === 'report_link' && { backgroundColor: 'transparent', padding: 0, shadowOpacity: 0, elevation: 0 },
                    ]}
                  >
                    {/* Quoted Reply Header */}
                    {Boolean(item.replyTo) && (
                      <TouchableOpacity
                        style={[
                          styles.replyQuoteWrap,
                          isMine ? styles.replyQuoteWrapMine : styles.replyQuoteWrapTheirs,
                        ]}
                        onPress={() => handleScrollToMessage(item.replyTo.id)}
                        activeOpacity={0.8}
                      >
                        <View style={[styles.replyQuoteBar, isMine && { backgroundColor: '#A4E6FA' }]} />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.replyQuoteAuthor, isMine && styles.replyQuoteAuthorMine]} numberOfLines={1}>
                            {item.replyTo.senderId === currentUid || item.replyTo.senderId === currentUser?.id || item.replyTo.senderId === currentUser?.uid ? 'You' : item.replyTo.senderName || 'Member'}
                          </Text>
                          <Text style={[styles.replyQuoteText, isMine && styles.replyQuoteTextMine]} numberOfLines={2}>
                            {item.replyTo.text || 'Original Message'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    )}

                    {/* GIF Message Rendering */}
                    {item.type === 'gif' && (
                      <TouchableOpacity
                        onPress={() => setPreviewImage(item.mediaUri)}
                        activeOpacity={0.9}
                      >
                        <Image
                          source={{ uri: item.mediaUri }}
                          style={styles.msgGif}
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

                    {/* Image Message Rendering */}
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
                          <Text style={styles.openMapBtnText}>Open in Maps</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {item.type === 'report_link' && (
                      <TouchableOpacity
                        style={styles.reportLinkCard}
                        onPress={() =>
                          navigation.navigate(
                            currentUser?.role === 'advocate' ? 'RescueAlertDetail' : 'ReportDetail',
                            { reportId: item.reportId || item.reportId }
                          )
                        }
                        activeOpacity={0.82}
                      >
                        <View style={styles.reportLinkHeader}>
                          <Ionicons name="alert-circle" size={18} color="#2E7A99" style={{ marginRight: 6 }} />
                          <Text style={styles.reportLinkTitle} numberOfLines={1}>
                            Rescue Report Linked
                          </Text>
                        </View>
                        <Text style={styles.reportLinkAnimal}>
                          {item.animalType || 'Animal'} · {item.condition || 'Rescue'}
                        </Text>
                        {Boolean(item.address) && (
                          <Text style={styles.reportLinkAddr} numberOfLines={2}>
                            📍 {item.address}
                          </Text>
                        )}
                        <View style={styles.reportLinkFooter}>
                          <View style={[styles.reportLinkStatusBadge, item.status === 'Rescued' && { backgroundColor: '#D1FAE5' }, item.status === 'Responded' && { backgroundColor: '#FEF3E2' }]}>
                            <Text style={[styles.reportLinkStatusText, item.status === 'Rescued' && { color: '#065F46' }, item.status === 'Responded' && { color: '#92400E' }]}>
                              {item.status || 'Open'}
                            </Text>
                          </View>
                          <Text style={styles.reportLinkTap}>Tap to view →</Text>
                        </View>
                      </TouchableOpacity>
                    )}

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
              </View>
            </SwipeableMessageRow>
          );
        }}
      />

      {/* ── Optional Manual Link Rescue Report Banner ───────── */}
      {showLinkedReportBanner && Boolean(linkedReport) && (
        <View style={styles.linkedReportBanner}>
          <View style={styles.linkedReportBannerLeft}>
            <View style={styles.linkedReportIconCircle}>
              <Ionicons name="document-text" size={17} color="#2E7A99" />
            </View>
            <View style={{ flex: 1, marginLeft: 9 }}>
              <Text style={styles.linkedReportBannerTitle} numberOfLines={1}>
                Attach Case: {linkedReport.animalType || 'Animal'} ({linkedReport.condition || 'Rescue'})
              </Text>
              <Text style={styles.linkedReportBannerSub} numberOfLines={1}>
                {linkedReport.location?.address || 'Reported rescue location'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.sendReportBannerBtn}
            onPress={handleSendLinkedReport}
            activeOpacity={0.8}
          >
            <Ionicons name="send" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.sendReportBannerBtnText}>Send Case</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dismissReportBannerBtn}
            onPress={() => setShowLinkedReportBanner(false)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={18} color="#8C7D6A" />
          </TouchableOpacity>
        </View>
      )}

      {/* ── Reply Preview Banner ────────────────────────────────── */}
      {Boolean(replyingTo) && (
        <View style={styles.replyBanner}>
          <View style={styles.replyBannerAccent} />
          <View style={styles.replyBannerContent}>
            <View style={styles.replyBannerHeader}>
              <Ionicons name="arrow-undo" size={13} color="#2E7A99" style={{ marginRight: 4 }} />
              <Text style={styles.replyBannerAuthor} numberOfLines={1}>
                Replying to {replyingTo.isMine ? 'yourself' : replyingTo.senderName || 'Member'}
              </Text>
            </View>
            <Text style={styles.replyBannerSnippet} numberOfLines={1}>
              {replyingTo.text || 'Message'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.replyBannerCloseBtn}
            onPress={() => setReplyingTo(null)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={18} color="#8C7D6A" />
          </TouchableOpacity>
        </View>
      )}

      {/* ── Input Bar ─────────────────────────────────────────── */}
      <View style={styles.inputBar}>
        <TouchableOpacity
          style={styles.attachBtn}
          onPress={() => setAttachModalVisible(true)}
          activeOpacity={0.75}
        >
          <Ionicons name="add" size={22} color="#2E7A99" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.gifBtn}
          onPress={() => setGifModalVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.gifBtnText}>GIF</Text>
        </TouchableOpacity>

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
            onFocus={() => {
              setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 120);
            }}
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
              {Boolean(linkedReport) && (
                <TouchableOpacity
                  style={styles.attachOption}
                  onPress={() => {
                    setAttachModalVisible(false);
                    handleSendLinkedReport();
                  }}
                  activeOpacity={0.75}
                >
                  <View style={[styles.attachIconCircle, { backgroundColor: '#E0F2FE' }]}>
                    <Ionicons name="document-text" size={22} color="#0284C7" />
                  </View>
                  <Text style={styles.attachOptionLabel}>Send Case</Text>
                </TouchableOpacity>
              )}

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

      {/* ── Group Info Modal ───────────────────────────────────── */}
      <Modal
        visible={groupInfoVisible}
        animationType="slide"
        onRequestClose={() => setGroupInfoVisible(false)}
      >
        <SafeAreaView style={styles.groupInfoContainer}>
          <View style={styles.groupInfoHeader}>
            <TouchableOpacity
              style={styles.groupInfoCloseBtn}
              onPress={() => setGroupInfoVisible(false)}
            >
              <Ionicons name="close" size={22} color="#473018" />
            </TouchableOpacity>
            <Text style={styles.groupInfoTitle}>Group Info</Text>
            <TouchableOpacity
              style={styles.groupInfoSaveBtn}
              onPress={handleSaveGroupInfo}
            >
              <Text style={styles.groupInfoSaveTxt}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            <View style={styles.groupInfoPhotoSection}>
              <TouchableOpacity
                style={styles.groupInfoAvatarWrap}
                onPress={handlePickGroupPhoto}
                activeOpacity={0.8}
              >
                {editGroupPhoto
                  ? <Image source={{ uri: editGroupPhoto }} style={styles.groupInfoAvatar} />
                  : <View style={styles.groupInfoAvatarPlaceholder}>
                    <Ionicons name="people" size={42} color="#2E7A99" />
                  </View>
                }
                <View style={styles.groupInfoCameraBtn}>
                  <Ionicons name="camera" size={16} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
              <Text style={styles.groupInfoPhotoHint}>Tap to change group photo</Text>
            </View>

            <View style={styles.groupInfoFieldSection}>
              <Text style={styles.groupInfoFieldLabel}>GROUP NAME</Text>
              <View style={styles.groupInfoNameWrap}>
                <Ionicons name="people-outline" size={18} color="#8C7D6A" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.groupInfoNameInput}
                  value={editGroupName}
                  onChangeText={setEditGroupName}
                  placeholder="Group name..."
                  placeholderTextColor="#8C7D6A"
                  maxLength={60}
                />
              </View>
            </View>

            <View style={styles.groupInfoFieldSection}>
              <View style={styles.groupInfoSectionHeader}>
                <Text style={styles.groupInfoFieldLabel}>
                  MEMBERS · {groupMembers.length}
                </Text>
                <TouchableOpacity
                  style={styles.addMemberBtn}
                  onPress={() => { setSelectedNewMembers([]); setAddMembersVisible(true); }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="person-add-outline" size={14} color="#2E7A99" />
                  <Text style={styles.addMemberBtnTxt}>Add</Text>
                </TouchableOpacity>
              </View>
              {groupMembers.map((m) => (
                <View key={m.id} style={styles.groupInfoMemberRow}>
                  <Avatar name={m.name} userId={m.id} uri={m.avatar} size={42} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={styles.memberInfoNameRow}>
                      <Text style={styles.groupInfoMemberName}>{m.name}</Text>
                      {m.isMe && (
                        <View style={styles.youBadge}>
                          <Text style={styles.youBadgeText}>You</Text>
                        </View>
                      )}
                      {m.isAdmin && (
                        <View style={styles.adminBadge}>
                          <Ionicons name="shield-checkmark" size={10} color="#1E7E34" style={{ marginRight: 2 }} />
                          <Text style={styles.adminBadgeText}>Admin</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  {isCurrentUserAdmin && !m.isMe && (
                    <TouchableOpacity
                      style={styles.removeMemberBtn}
                      onPress={() => handleRemoveMember(m)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="person-remove-outline" size={13} color="#D94F4F" style={{ marginRight: 3 }} />
                      <Text style={styles.removeMemberBtnTxt}>Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>

            {mediaMessages.length > 0 && (
              <View style={styles.groupInfoFieldSection}>
                <View style={styles.groupInfoSectionHeader}>
                  <Text style={styles.groupInfoFieldLabel}>
                    MEDIA · {mediaMessages.length}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setMediaGalleryVisible(true)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.seeAllTxt}>See all</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.mediaPreviewGrid}>
                  {mediaMessages.slice(0, 6).map((m, i) => (
                    <TouchableOpacity
                      key={m.id || i}
                      style={styles.mediaPreviewCell}
                      onPress={() => setGalleryPreview(m.mediaUri)}
                      activeOpacity={0.85}
                    >
                      <Image
                        source={{ uri: m.mediaUri }}
                        style={styles.mediaPreviewImg}
                      />
                      {m.type === 'video' && (
                        <View style={styles.mediaVideoOverlay}>
                          <Ionicons name="play-circle" size={22} color="#FFFFFF" />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Leave Group Chat Button */}
            <TouchableOpacity
              style={styles.groupInfoLeaveBtn}
              activeOpacity={0.8}
              onPress={handleLeaveGroup}
            >
              <Ionicons name="log-out-outline" size={18} color="#D97706" />
              <Text style={styles.groupInfoLeaveTxt}>Leave Group Chat</Text>
            </TouchableOpacity>

            {/* Delete Group Button (Admin Only) */}
            {isCurrentUserAdmin && (
              <TouchableOpacity
                style={styles.groupInfoDangerBtn}
                activeOpacity={0.8}
                onPress={() => {
                  setGroupInfoVisible(false);
                  setTimeout(() => {
                    showAlert({
                      title: 'Delete Group Chat',
                      message: 'Delete this group chat and remove all messages for everyone?',
                      type: 'warning',
                      customIcon: 'trash-outline',
                      secondaryText: 'Cancel',
                      primaryText: 'Delete Group',
                      onPrimaryPress: () => {
                        const targetId = convo?.id || conversationId;
                        setMessages([]);
                        chatMessagesCache.delete(messagesCacheKey);
                        if (targetId) clearConversation(targetId);
                        navigation.goBack();
                      },
                    });
                  }, 200);
                }}
              >
                <Ionicons name="trash-outline" size={18} color="#C0392B" />
                <Text style={styles.groupInfoDangerTxt}>Delete Group Chat</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ── Add Members Modal ───────────────────────────────────── */}
      <Modal
        visible={addMembersVisible}
        animationType="slide"
        onRequestClose={() => { setMemberSearch(''); setAddMembersVisible(false); }}
      >
        <SafeAreaView style={styles.groupInfoContainer}>
          <View style={styles.groupInfoHeader}>
            <TouchableOpacity
              style={styles.groupInfoCloseBtn}
              onPress={() => { setMemberSearch(''); setAddMembersVisible(false); }}
            >
              <Ionicons name="close" size={22} color="#473018" />
            </TouchableOpacity>
            <Text style={styles.groupInfoTitle}>Add Members</Text>
            <TouchableOpacity
              style={[
                styles.groupInfoSaveBtn,
                selectedNewMembers.length === 0 && { backgroundColor: '#C9B99A' },
              ]}
              onPress={handleSaveNewMembers}
              disabled={selectedNewMembers.length === 0}
            >
              <Text style={styles.groupInfoSaveTxt}>
                {selectedNewMembers.length > 0 ? `Add (${selectedNewMembers.length})` : 'Add'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.memberSearchWrap}>
            <Ionicons name="search" size={16} color="#8C7D6A" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.memberSearchInput}
              value={memberSearch}
              onChangeText={setMemberSearch}
              placeholder="Search people..."
              placeholderTextColor="#8C7D6A"
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
            {memberSearch.length > 0 && (
              <TouchableOpacity onPress={() => setMemberSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={16} color="#8C7D6A" />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 16 }} keyboardShouldPersistTaps="handled">
            {(() => {
              const query = memberSearch.trim().toLowerCase();
              const filtered = query
                ? nonMembers.filter((u) => u.name?.toLowerCase().includes(query))
                : nonMembers;

              if (nonMembers.length === 0) {
                return (
                  <View style={styles.noMembersWrap}>
                    <Ionicons name="people-outline" size={40} color="#C9B99A" />
                    <Text style={styles.noMembersTxt}>No more users to add</Text>
                  </View>
                );
              }

              if (filtered.length === 0) {
                return (
                  <View style={styles.noMembersWrap}>
                    <Ionicons name="search" size={40} color="#C9B99A" />
                    <Text style={styles.noMembersTxt}>No results for "{memberSearch}"</Text>
                  </View>
                );
              }

              return filtered.map((u) => {
                const isSelected = selectedNewMembers.some((s) => s.id === u.id);
                return (
                  <TouchableOpacity
                    key={u.id}
                    style={[styles.addMemberRow, isSelected && styles.addMemberRowSelected]}
                    onPress={() => toggleSelectMember(u)}
                    activeOpacity={0.8}
                  >
                    <Avatar name={u.name} userId={u.id} uri={u.avatar} size={44} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.addMemberName}>{u.name}</Text>
                      {u.role && u.role !== 'community' && (
                        <Text style={styles.addMemberRole}>{u.role}</Text>
                      )}
                    </View>
                    <View style={[styles.checkCircle, isSelected && styles.checkCircleSelected]}>
                      {isSelected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                    </View>
                  </TouchableOpacity>
                );
              });
            })()}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ── Assign New Admin Modal (Admin Leaving) ─────────────── */}
      <Modal
        visible={assignAdminModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setAssignAdminModalVisible(false)}
      >
        <SafeAreaView style={styles.groupInfoContainer}>
          <View style={styles.groupInfoHeader}>
            <TouchableOpacity
              style={styles.groupInfoCloseBtn}
              onPress={() => setAssignAdminModalVisible(false)}
            >
              <Ionicons name="close" size={22} color="#473018" />
            </TouchableOpacity>
            <Text style={styles.groupInfoTitle}>Assign Next Admin</Text>
            <TouchableOpacity
              style={[
                styles.groupInfoSaveBtn,
                !selectedNextAdminId && { backgroundColor: '#C9B99A' },
              ]}
              onPress={handleConfirmAdminAndLeave}
              disabled={!selectedNextAdminId}
            >
              <Text style={styles.groupInfoSaveTxt}>Done & Leave</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 16 }}>
            <View style={styles.assignAdminNoticeCard}>
              <View style={styles.assignAdminNoticeIcon}>
                <Ionicons name="shield-checkmark" size={24} color="#1E7E34" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.assignAdminNoticeTitle}>Choose the New Admin</Text>
                <Text style={styles.assignAdminNoticeSub}>
                  Before leaving the group, you must appoint a new group admin to manage members and group settings.
                </Text>
              </View>
            </View>

            <Text style={styles.groupInfoFieldLabel}>SELECT NEW ADMIN</Text>

            {groupMembers
              .filter((m) => !m.isMe)
              .map((m) => {
                const isSelected = selectedNextAdminId === m.id;
                return (
                  <TouchableOpacity
                    key={m.id}
                    style={[styles.assignAdminRow, isSelected && styles.assignAdminRowSelected]}
                    onPress={() => setSelectedNextAdminId(m.id)}
                    activeOpacity={0.8}
                  >
                    <Avatar name={m.name} userId={m.id} uri={m.avatar} size={46} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.assignAdminName}>{m.name}</Text>
                      <Text style={styles.assignAdminSub}>Tap to assign as Admin</Text>
                    </View>
                    <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                      {isSelected && <View style={styles.radioInnerDot} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ── Full-Screen Media Gallery Modal ────────────────────── */}
      <Modal
        visible={mediaGalleryVisible}
        animationType="slide"
        onRequestClose={() => { setMediaGalleryVisible(false); setGalleryPreview(null); }}
      >
        <SafeAreaView style={styles.galleryContainer}>
          <View style={styles.galleryHeader}>
            <TouchableOpacity
              style={styles.groupInfoCloseBtn}
              onPress={() => { setMediaGalleryVisible(false); setGalleryPreview(null); }}
            >
              <Ionicons name="close" size={22} color="#473018" />
            </TouchableOpacity>
            <Text style={styles.groupInfoTitle}>Shared Media</Text>
            <View style={{ width: 36 }} />
          </View>

          {galleryPreview ? (
            <View style={styles.galleryFullPreview}>
              <Image
                source={{ uri: galleryPreview }}
                style={styles.galleryFullImg}
                resizeMode="contain"
              />
              <TouchableOpacity
                style={styles.galleryBackBtn}
                onPress={() => setGalleryPreview(null)}
              >
                <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.galleryGrid}>
              {mediaMessages.map((m, i) => (
                <TouchableOpacity
                  key={m.id || i}
                  style={styles.galleryCell}
                  onPress={() => setGalleryPreview(m.mediaUri)}
                  activeOpacity={0.85}
                >
                  <Image
                    source={{ uri: m.mediaUri }}
                    style={styles.galleryCellImg}
                  />
                  {m.type === 'video' && (
                    <View style={styles.mediaVideoOverlay}>
                      <Ionicons name="play-circle" size={28} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* ── GIF Picker Modal ────────────────────────────────────── */}
      <Modal
        visible={gifModalVisible}
        animationType="slide"
        onRequestClose={() => setGifModalVisible(false)}
      >
        <SafeAreaView style={styles.gifModalContainer}>
          <View style={styles.gifModalHeader}>
            <TouchableOpacity
              style={styles.groupInfoCloseBtn}
              onPress={() => setGifModalVisible(false)}
            >
              <Ionicons name="close" size={22} color="#473018" />
            </TouchableOpacity>
            <Text style={styles.groupInfoTitle}>Choose GIF</Text>
            <View style={{ width: 36 }} />
          </View>

          <View style={styles.gifSearchWrap}>
            <Ionicons name="search" size={16} color="#8C7D6A" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.gifSearchInput}
              value={gifSearch}
              onChangeText={setGifSearch}
              placeholder="Search GIFs..."
              placeholderTextColor="#8C7D6A"
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
            {gifSearch.length > 0 && (
              <TouchableOpacity onPress={() => setGifSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={16} color="#8C7D6A" />
              </TouchableOpacity>
            )}
          </View>

          <View style={{ maxHeight: 44, marginBottom: 8 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gifCategoryScroll}>
              {GIF_CATEGORIES.map((cat) => {
                const isActive = selectedGifCategory === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.gifCategoryChip, isActive && styles.gifCategoryChipActive]}
                    onPress={() => setSelectedGifCategory(cat.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.gifCategoryText, isActive && styles.gifCategoryTextActive]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <ScrollView contentContainerStyle={styles.gifGrid} keyboardShouldPersistTaps="handled">
            {filteredGifs.length === 0 ? (
              <View style={styles.noMembersWrap}>
                <Ionicons name="search-outline" size={40} color="#C9B99A" />
                <Text style={styles.noMembersTxt}>No GIFs match your search</Text>
              </View>
            ) : (
              filteredGifs.map((g) => (
                <TouchableOpacity
                  key={g.id}
                  style={styles.gifCard}
                  onPress={() => handleSendGif(g.url)}
                  activeOpacity={0.85}
                >
                  <Image source={{ uri: g.url }} style={styles.gifCardImg} resizeMode="cover" />
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ── Message Action Modal (Long-Press Action Sheet) ───────── */}
      <Modal
        visible={msgActionModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMsgActionModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.msgActionOverlay}
          activeOpacity={1}
          onPress={() => setMsgActionModalVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.msgActionSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.attachHandle} />
            <Text style={styles.msgActionHeader}>Message Options</Text>

            {selectedMsgAction?.text ? (
              <Text style={styles.msgActionPreview} numberOfLines={2}>
                "{selectedMsgAction.text}"
              </Text>
            ) : null}

            <TouchableOpacity
              style={styles.msgActionItem}
              onPress={() => handleStartReply(selectedMsgAction)}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-undo-outline" size={20} color="#2E7A99" />
              <Text style={styles.msgActionItemText}>Reply to Message</Text>
            </TouchableOpacity>

            {selectedMsgAction?.text ? (
              <TouchableOpacity
                style={styles.msgActionItem}
                onPress={handleCopyText}
                activeOpacity={0.7}
              >
                <Ionicons name="copy-outline" size={20} color="#473018" />
                <Text style={styles.msgActionItemText}>Copy Text</Text>
              </TouchableOpacity>
            ) : null}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
    backgroundColor: '#FFFFFF',
  },

  // ── Standardized Clean Header ─────────────────────────────
  headerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0ECE4',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.borderLight || '#F4EDE0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    shadowColor: '#0D1B2A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  navCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
  },
  navAvatarWrap: {
    borderWidth: 1.5,
    borderColor: '#E8DFC8',
    borderRadius: 24,
    padding: 1,
  },
  navGroupAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  navGroupAvatarPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EBF7FA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#B8E4E5',
  },
  navTextWrap: {
    flex: 1,
  },
  navName: {
    ...FONTS.titleMd,
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.brown,
  },
  navSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  navSub: {
    fontSize: 12,
    color: '#685038',
    fontWeight: '600',
  },
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.secondary,
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
    backgroundColor: '#FFFFFF',
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
  senderAvatar: {
    marginRight: 8,
    marginBottom: 2,
    alignSelf: 'flex-end',
  },
  senderAvatarSpacer: {
    width: 30,
    marginRight: 8,
  },
  bubbleColumn: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    maxWidth: '78%',
  },
  bubbleColumnMine: {
    alignItems: 'flex-end',
  },
  groupSenderName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2E7A99',
    marginBottom: 3,
    marginLeft: 4,
  },

  groupEmptyAvatarWrap: {
    width: 88,
    height: 88,
    marginBottom: 12,
    position: 'relative',
  },
  groupEmptyAvatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  groupEmptyAvatarPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#EBF7FA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#92CDE5',
  },
  groupEmptyCameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2E7A99',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FAF7EE',
  },
  groupEmptyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EBF7FA',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    marginBottom: 10,
  },
  membersSection: {
    width: '100%',
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8DFC8',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  membersSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8C7D6A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 10,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#473018',
  },

  groupInfoContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  groupInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E8DFC8',
    backgroundColor: '#FFFFFF',
  },
  groupInfoCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFE8D6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupInfoTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#473018',
  },
  groupInfoSaveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    backgroundColor: '#2E7A99',
    borderRadius: 14,
  },
  groupInfoSaveTxt: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  groupInfoPhotoSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  groupInfoAvatarWrap: {
    width: 100,
    height: 100,
    position: 'relative',
    marginBottom: 10,
  },
  groupInfoAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  groupInfoAvatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#EBF7FA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#92CDE5',
  },
  groupInfoCameraBtn: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2E7A99',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FAF7EE',
  },
  groupInfoPhotoHint: {
    fontSize: 12,
    color: '#8C7D6A',
  },
  groupInfoFieldSection: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  groupInfoFieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8C7D6A',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  groupInfoNameWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
    borderWidth: 1,
    borderColor: '#E8DFC8',
  },
  groupInfoNameInput: {
    flex: 1,
    fontSize: 15,
    color: '#473018',
  },
  groupInfoMemberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFE6D4',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  memberInfoNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  groupInfoMemberName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#473018',
  },
  groupInfoMemberYou: {
    fontSize: 11,
    color: '#2E7A99',
    fontWeight: '600',
    marginTop: 1,
  },
  youBadge: {
    backgroundColor: '#EBF4F7',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  youBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2E7A99',
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F4EA',
    borderWidth: 1,
    borderColor: '#C6ECC9',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1E7E34',
  },
  removeMemberBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  removeMemberBtnTxt: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#D94F4F',
  },
  groupInfoLeaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  groupInfoLeaveTxt: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D97706',
  },
  groupInfoDangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  groupInfoDangerTxt: {
    fontSize: 14,
    fontWeight: '700',
    color: '#C0392B',
  },

  groupInfoSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  addMemberBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EBF7FA',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  addMemberBtnTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2E7A99',
  },
  seeAllTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2E7A99',
  },

  mediaPreviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  mediaPreviewCell: {
    width: '31.5%',
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#E8DFC8',
    position: 'relative',
  },
  mediaPreviewImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  mediaVideoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  memberSearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3EDE0',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E8DFC8',
  },
  memberSearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#473018',
    paddingVertical: 0,
  },
  noMembersWrap: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 14,
  },
  noMembersTxt: {
    fontSize: 15,
    color: '#8C7D6A',
  },
  addMemberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFE6D4',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  addMemberRowSelected: {
    borderColor: '#2E7A99',
    backgroundColor: '#F0F9FC',
  },
  addMemberName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#473018',
  },
  addMemberRole: {
    fontSize: 11,
    color: '#8C7D6A',
    marginTop: 1,
    textTransform: 'capitalize',
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#C9B99A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleSelected: {
    backgroundColor: '#2E7A99',
    borderColor: '#2E7A99',
  },

  galleryContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  galleryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E8DFC8',
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
    padding: 3,
  },
  galleryCell: {
    width: '33%',
    aspectRatio: 1,
    overflow: 'hidden',
    backgroundColor: '#E8DFC8',
    position: 'relative',
  },
  galleryCellImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  galleryFullPreview: {
    flex: 1,
    backgroundColor: '#000000',
    position: 'relative',
  },
  galleryFullImg: {
    flex: 1,
    width: '100%',
  },
  galleryBackBtn: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  bubble: {
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

  attachOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  attachSheet: {
    backgroundColor: '#FFFFFF',
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

  reportLinkCard: {
    backgroundColor: '#EBF7FA',
    borderRadius: 12,
    padding: 12,
    minWidth: 200,
    maxWidth: 260,
    borderWidth: 1,
    borderColor: '#B8E4E5',
  },
  reportLinkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  reportLinkTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A535C',
    flex: 1,
  },
  reportLinkAnimal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F3D40',
    marginBottom: 4,
  },
  reportLinkAddr: {
    fontSize: 11,
    color: '#2E7A99',
    marginBottom: 8,
    lineHeight: 15,
  },
  reportLinkFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reportLinkStatusBadge: {
    backgroundColor: '#FDECEA',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  reportLinkStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#C0392B',
  },
  reportLinkTap: {
    fontSize: 10,
    color: '#2E7A99',
    fontWeight: '600',
  },
  linkedReportBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FC',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#D4EEF7',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  linkedReportBannerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  linkedReportIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#D9F0F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkedReportBannerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A535C',
  },
  linkedReportBannerSub: {
    fontSize: 11,
    color: '#5C7480',
    marginTop: 1,
  },
  sendReportBannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E7A99',
    borderRadius: 14,
    paddingHorizontal: 11,
    paddingVertical: 6,
    marginRight: 6,
  },
  sendReportBannerBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dismissReportBannerBtn: {
    padding: 4,
  },
  assignAdminNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF7EE',
    borderWidth: 1,
    borderColor: '#C3E6CB',
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    marginBottom: 20,
    gap: 12,
  },
  assignAdminNoticeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D4EDDA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  assignAdminNoticeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#155724',
    marginBottom: 3,
  },
  assignAdminNoticeSub: {
    fontSize: 12,
    color: '#1E7E34',
    lineHeight: 16,
  },
  assignAdminRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: '#F0E8DC',
  },
  assignAdminRowSelected: {
    borderColor: '#473018',
    backgroundColor: '#FBF8F4',
  },
  assignAdminName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2C1810',
  },
  assignAdminSub: {
    fontSize: 12,
    color: '#8A7A68',
    marginTop: 2,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#C9B99A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#473018',
  },
  radioInnerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#473018',
  },

  // Swipe to reply & quote preview styles
  swipeContainer: {
    position: 'relative',
    width: '100%',
  },
  swipeReplyIconWrap: {
    position: 'absolute',
    top: '50%',
    marginTop: -14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EBF7FA',
    borderWidth: 1,
    borderColor: '#B8E4E5',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  swipeReplyIconLeft: {
    right: 6,
  },
  swipeReplyIconRight: {
    left: 6,
  },
  replyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F9FA',
    borderTopWidth: 1,
    borderTopColor: '#E2EEF2',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  replyBannerAccent: {
    width: 3,
    height: '100%',
    backgroundColor: '#2E7A99',
    borderRadius: 2,
    marginRight: 10,
  },
  replyBannerContent: {
    flex: 1,
    marginRight: 8,
  },
  replyBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyBannerAuthor: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2E7A99',
  },
  replyBannerSnippet: {
    fontSize: 12,
    color: '#473018',
    marginTop: 2,
  },
  replyBannerCloseBtn: {
    padding: 4,
  },
  replyQuoteWrap: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyQuoteWrapMine: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  replyQuoteWrapTheirs: {
    backgroundColor: '#F4F0E8',
  },
  replyQuoteBar: {
    width: 3,
    height: '100%',
    backgroundColor: '#2E7A99',
    borderRadius: 2,
    marginRight: 8,
  },
  replyQuoteAuthor: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#2E7A99',
    marginBottom: 1,
  },
  replyQuoteText: {
    fontSize: 11.5,
    color: '#473018',
  },
  replyQuoteTextMine: {
    color: '#FFFFFF',
  },
  msgGif: {
    width: 220,
    height: 160,
    borderRadius: 14,
    backgroundColor: '#E8DFC8',
  },
  gifBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EBF7FA',
    borderWidth: 1,
    borderColor: '#C6E7F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gifBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2E7A99',
  },
  gifModalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  gifModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E8DFC8',
  },
  gifSearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3EDE0',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E8DFC8',
  },
  gifSearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#473018',
    paddingVertical: 0,
  },
  gifCategoryScroll: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  gifCategoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F5F0E6',
    borderWidth: 1,
    borderColor: '#E8DFC8',
  },
  gifCategoryChipActive: {
    backgroundColor: '#2E7A99',
    borderColor: '#2E7A99',
  },
  gifCategoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#685038',
  },
  gifCategoryTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  gifGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 16,
  },
  gifCard: {
    width: '48%',
    aspectRatio: 1.3,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F5F0E6',
  },
  gifCardImg: {
    width: '100%',
    height: '100%',
  },
  msgActionOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  msgActionSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    ...SHADOWS.card,
  },
  msgActionHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: '#473018',
    textAlign: 'center',
    marginBottom: 12,
  },
  msgActionPreview: {
    fontSize: 13,
    color: '#685038',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 12,
    lineHeight: 18,
  },
  msgActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F0E8',
  },
  msgActionItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#473018',
  },
});

