import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  loginWithFirebase,
  registerWithFirebase,
  logoutFromFirebase,
  updateUserProfile,
  getUserProfileFirebase,
  loginWithGoogleCredential,
  loginWithGoogleProfile,
  cacheUserProfile,
  getCachedUserProfile,
  getAllUsersFirebase,
  subscribeToAllUsersFirebase,
  saveNotificationFirebase,
  markNotificationReadFirebase,
  markAllNotificationsReadFirebase,
  subscribeToNotificationsFirebase,
  deleteNotificationFirebase,
  clearAllNotificationsFirebase,
  subscribeAuthState,
  getDefaultUserAvatar,
  resetUserPasswordWithOtp,
  updateUserPasswordLoggedIn,
  checkUserExistsByEmail,
} from '../services/authService';
import {
  subscribeToRescueReports,
  sortRescueReports,
  createRescueReportFirebase,
  claimRescueReportFirebase,
  markReportRescuedFirebase,
  addRescueCommentFirebase,
  updateRescueReportUrgencyFirebase,
  deleteRescueReportFirebase,
} from '../services/rescueService';
import {
  subscribeToAnimals,
  addAnimalFirebase,
  updateAnimalFirebase,
  deleteAnimalFirebase,
  subscribeToApplications,
  submitApplicationFirebase,
  updateApplicationFirebase,
} from '../services/animalService';
import {
  subscribeToConversations,
  saveConversationFirebase,
  saveMessageFirebase,
  markConversationReadFirebase,
  deleteConversationFirebase,
  clearConversationMessagesFirebase,
} from '../services/chatService';
import {
  subscribeToDonations,
  createDonationFirebase,
  verifyDonationFirebase,
} from '../services/donationService';
import { uploadImageToStorage } from '../services/storageService';
import { isMockFirebase } from '../config/firebaseConfig';
import * as Location from 'expo-location';
import {
  initNotifications,
  notifyNewMessage,
  notifyNearbyRescueAlert,
  notifyPhoneSystem,
  registerNotificationResponseListener,
  getDistanceInKm,
} from '../services/notificationService';
import AlertModal from '../components/AlertModal';
import InAppNotificationBanner from '../components/InAppNotificationBanner';
import { navigate } from '../navigation/navigationRef';

const defaultContext = {
  currentUser: null,
  users: [],
  rescueReports: [],
  animals: [],
  requests: [],
  conversations: [],
  donations: [],
  notifications: [],
  login: () => ({ success: false }),
  register: () => ({ success: false }),
  loginWithGoogle: () => ({ success: false }),
  logout: () => {},
  updateUser: () => {},
  getUserProfile: () => Promise.resolve(null),
  addRescueReport: () => {},
  deleteRescueReport: () => {},
  respondToReport: () => {},
  markRescued: () => {},
  addComment: () => {},
  updateRescueReportUrgency: () => {},
  addAnimal: () => {},
  updateAnimal: () => {},
  deleteAnimal: () => {},
  returnAnimalToListings: () => {},
  markAnimalAdopted: () => {},
  submitRequest: () => {},
  updateRequestStatus: () => {},
  sendMessage: () => {},
  startConversation: () => '',
  startGroupConversation: () => '',
  updateGroupInfo: () => {},
  clearConversation: () => {},
  deleteConversation: () => {},
  setActiveConversationId: () => {},
  submitDonation: () => {},
  verifyDonation: () => {},
  getUserConversations: () => [],
  getUnreadMessagesCount: () => 0,
  markConversationRead: () => {},
  getUserById: () => null,
  getAllKnownUsers: () => [],
  getUserReports: () => [],
  getAdvocateResponses: () => [],
  getUserRequests: () => [],
  getAdvocateRequests: () => [],
  getAdvocateAnimals: () => [],
  getAnimalsByAdvocate: () => [],
  getUserDonations: () => [],
  getAdvocateDonations: () => [],
  getAnimalDonations: () => [],
  getUserNotifications: () => [],
  getUnreadCount: () => 0,
  markNotificationRead: () => {},
  markAllNotificationsRead: () => {},
  deleteNotification: () => {},
  clearAllNotifications: () => {},
  pushNotification: () => {},
  getAdvocateRescuedCases: () => [],
  getOpenAlertsCount: () => 0,
  markAlertsAsViewed: () => {},
  showInAppNotification: () => {},
  hideInAppNotification: () => {},
  isAuthLoading: true,
  isOnboardingCompleted: false,
  completeOnboarding: () => {},
  showAlert: () => {},
  hideAlert: () => {},
};

const AppContext = createContext(defaultContext);

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState(false);
  const [users, setUsers] = useState([]);
  const [rescueReports, setRescueReports] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [requests, setRequests] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [donations, setDonations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [inAppBanner, setInAppBanner] = useState(null);
  const [lastViewedAlertsTime, setLastViewedAlertsTime] = useState(null);

  const isInitialRescuesLoad = useRef(true);
  const currentUserRef = useRef(currentUser);
  const mySubmittedReportIds = useRef(new Map()); // Map<reportId, authorUserId>
  const notifiedReportIdsRef = useRef(new Set()); // Set of report IDs that have triggered phone alerts for active user
  const notifiedMessageIdsRef = useRef(new Set()); // Set of message IDs that have triggered alerts
  const notifiedCommentIdsRef = useRef(new Set()); // Set of comment/reply IDs that have triggered alerts for active user
  const activeConversationIdRef = useRef(null); // ID of chat screen currently active/focused
  const userProfilesCacheRef = useRef(new Map()); // In-memory cache of fetched user profiles to prevent re-render loops

  const setActiveConversationId = useCallback((id) => {
    activeConversationIdRef.current = id;
  }, []);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // Robust check to determine if a report was filed by the given user
  const isOwnReport = (report, user) => {
    if (!report || !user) return false;
    const uId = user.id || user.uid;

    // 1. Locally submitted by THIS user in the current session
    if (mySubmittedReportIds.current && report.id) {
      const localAuthor = mySubmittedReportIds.current.get(report.id);
      if (localAuthor && (localAuthor === uId || (user.email && localAuthor === user.email))) {
        return true;
      }
    }

    // 2. Exact match on reporterId against user ID or UID
    if (
      report.reporterId &&
      uId &&
      (report.reporterId === uId ||
        report.reporterId === user.id ||
        report.reporterId === user.uid)
    ) {
      return true;
    }

    // 3. Exact email match (case-insensitive)
    if (
      user.email &&
      report.reporterEmail &&
      user.email.trim().toLowerCase() === report.reporterEmail.trim().toLowerCase()
    ) {
      return true;
    }

    // 4. Exact name match ONLY IF it's not a generic default placeholder name
    const genericNames = ['community member', 'user', 'animal advocate', 'alaga user'];
    if (
      user.name &&
      report.reporterName &&
      !genericNames.includes(user.name.trim().toLowerCase()) &&
      user.name.trim().toLowerCase() === report.reporterName.trim().toLowerCase()
    ) {
      return true;
    }

    return false;
  };

  const showInAppNotification = ({ title, message, report, type = 'rescue', onPress }) => {
    // 1. On mobile devices, notifyPhoneSystem triggers the phone's native heads-up popup AND places it in the pull-down shade
    if (Platform.OS !== 'web') {
      notifyPhoneSystem({
        title,
        body: message,
        data: { type, reportId: report?.id },
        channelId: type === 'rescue' ? 'rescue-alerts' : 'messages',
      }).catch((err) => {
        console.warn('[AppContext] notifyPhoneSystem error:', err);
      });
    } else {
      // 2. On web (where native phone system notifications are unavailable), show the in-app banner component
      setInAppBanner({
        id: String(Date.now()),
        title,
        message,
        report,
        type,
        onPress,
      });
    }
  };

  const hideInAppNotification = () => {
    setInAppBanner(null);
  };

  const getOpenAlertsCount = () =>
    rescueReports.filter((r) => {
      if (r.status !== 'Open') return false;
      if (lastViewedAlertsTime) {
        const rTime = r.createdAt ? new Date(r.createdAt).getTime() : 0;
        if (rTime <= lastViewedAlertsTime) return false;
      }
      return true;
    }).length;

  const markAlertsAsViewed = () => {
    setLastViewedAlertsTime(Date.now());
  };

  const pushNotification = (notifData) => {
    const notifId = notifData.id || `n${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newNotif = {
      id: notifId,
      createdAt: notifData.createdAt || new Date().toISOString(),
      read: false,
      userId: notifData.userId || currentUserRef.current?.id || 'all',
      title: notifData.title || 'Notification',
      body: notifData.body || notifData.message || '',
      message: notifData.body || notifData.message || '',
      type: notifData.type || 'rescue',
      icon: notifData.icon || (notifData.type === 'rescue' ? 'shield-outline' : notifData.type === 'chat' ? 'chatbubble' : 'notifications'),
      iconBg: notifData.iconBg || (notifData.type === 'rescue' ? '#FDF0ED' : notifData.type === 'chat' ? '#E0F2FA' : '#FEF3E2'),
      iconColor: notifData.iconColor || (notifData.type === 'rescue' ? '#C23E3E' : notifData.type === 'chat' ? '#206B82' : '#F5A623'),
      section: 'TODAY',
      ...notifData,
    };

    // Clean undefined properties so Firestore setDoc never throws unsupported field error
    const cleanNotif = {};
    Object.keys(newNotif).forEach((key) => {
      if (newNotif[key] !== undefined) {
        cleanNotif[key] = newNotif[key];
      }
    });

    let isDuplicate = false;
    const activeUser = currentUserRef.current || currentUser;
    const activeUserId = activeUser?.id || activeUser?.uid;
    const isForActiveUser =
      !cleanNotif.userId ||
      cleanNotif.userId === 'all' ||
      cleanNotif.userId === activeUserId ||
      cleanNotif.userId === activeUser?.id ||
      cleanNotif.userId === activeUser?.uid;

    if (isForActiveUser) {
      setNotifications((prev) => {
        const existing = prev.find(
          (n) =>
            n.id === cleanNotif.id ||
            (cleanNotif.type === 'rescue' && n.type === 'rescue' && cleanNotif.reportId && n.reportId === cleanNotif.reportId)
        );
        if (existing) {
          isDuplicate = true;
          return prev;
        }
        return [cleanNotif, ...prev];
      });
    }

    // Persist to Firestore subcollection for cross-device sync
    const targetUserId = cleanNotif.userId && cleanNotif.userId !== 'all'
      ? cleanNotif.userId
      : activeUserId;
    if (targetUserId && !isDuplicate) {
      saveNotificationFirebase(targetUserId, cleanNotif);
    }
  };

  const triggerRescueAlertNotification = async (report) => {
    if (!report) return;

    const activeUser = currentUserRef.current;
    if (!activeUser) return;
    if (isOwnReport(report, activeUser)) {
      console.log('[AppContext] Suppressing notification: user is the author of this report');
      return;
    }

    let distance = null;
    let distStr = '';
    const rLat = report.location?.latitude;
    const rLng = report.location?.longitude;

    let uLat = activeUser?.latitude || activeUser?.locationCoordinates?.latitude;
    let uLng = activeUser?.longitude || activeUser?.locationCoordinates?.longitude;

    if (rLat && rLng) {
      if (!uLat || !uLng) {
        try {
          const { status } = await Location.getForegroundPermissionsAsync();
          if (status === 'granted') {
            const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            uLat = pos.coords.latitude;
            uLng = pos.coords.longitude;
          }
        } catch (e) {}
      }

      if (uLat && uLng) {
        distance = getDistanceInKm(uLat, uLng, rLat, rLng);
        if (distance !== null) {
          distStr = distance < 1 ? ` (${Math.round(distance * 1000)}m away)` : ` (${distance.toFixed(1)} km away)`;
          
          // DO NOT NOTIFY if the rescue report is further than 50km away
          if (distance > 50) {
            console.log(`[AppContext] Suppressing notification: rescue alert is ${distance.toFixed(1)}km away (limit is 50km)`);
            return;
          }
        }
      }
    }

    const locationText = report.location?.address || 'Near your location';
    const animalLabel = report.animalType || 'Animal';
    const titleText = `Rescue Alert: ${animalLabel} Reported${distStr}`;
    const descText = `${report.title || report.condition || 'Animal in need'} reported at ${locationText}. Tap to review details.`;

    // 1. Post to native smartphone notification shade (mobile)
    if (Platform.OS !== 'web') {
      notifyNearbyRescueAlert({ report, distanceKm: distance });
    } else {
      // 2. On web (where native phone notifications are unavailable), drop down the in-app banner component
      setInAppBanner({
        id: `banner_${report.id}_${Date.now()}`,
        title: titleText,
        message: descText,
        report,
        type: 'rescue',
        onPress: () => {
          if (activeUser?.role === 'advocate') {
            navigate('RescueAlertDetail', { reportId: report.id });
          } else {
            navigate('ReportDetail', { reportId: report.id });
          }
        },
      });
    }

    // 3. Add to notifications feed for this user (increments bell badge count)
    pushNotification({
      id: `rescue_notif_${report.id}`,
      userId: activeUser.id,
      title: titleText,
      message: descText,
      body: descText,
      type: 'rescue',
      reportId: report.id,
      icon: 'shield-outline',
      iconBg: '#FDF0ED',
      iconColor: '#C23E3E',
      distanceKm: distance,
      createdAt: report.createdAt || new Date().toISOString(),
    });
  };

  const syncRescueAlertNotifications = async (user, reports) => {
    if (!user || !user.id || !Array.isArray(reports)) return;
    const uId = user.id || user.uid;

    const storageKey = `@alaga_notified_reports_${uId}`;
    try {
      const stored = await AsyncStorage.getItem(storageKey);
      if (stored) {
        const arr = JSON.parse(stored);
        if (Array.isArray(arr)) {
          arr.forEach((id) => notifiedReportIdsRef.current.add(id));
        }
      }
    } catch (e) {}

    // ── Orphan Pruning: Delete rescue notifications for reports that no longer exist ──
    const validReportIds = new Set(reports.map((r) => r.id));
    setNotifications((prev) => {
      let changed = false;
      const kept = prev.filter((n) => {
        if (n.type === 'rescue' && n.reportId && !validReportIds.has(n.reportId)) {
          changed = true;
          // Delete from Firestore
          deleteNotificationFirebase(uId, n.id);
          // Remove from notified reports cache
          notifiedReportIdsRef.current.delete(n.reportId);
          return false;
        }
        return true;
      });
      if (changed) {
        const arr = Array.from(notifiedReportIdsRef.current);
        AsyncStorage.setItem(storageKey, JSON.stringify(arr)).catch(() => {});
      }
      return changed ? kept : prev;
    });

    if (reports.length === 0) return;

    let hasNewToPersist = false;

    for (const rep of reports) {
      if (!rep || rep.status !== 'Open') continue;
      // Strictly guard: NEVER notify the author of the report
      if (isOwnReport(rep, user)) continue;

      // Only notify for reports created in the last 48 hours
      const repTime = rep.createdAt ? new Date(rep.createdAt).getTime() : 0;
      const hoursAgo = (Date.now() - repTime) / (1000 * 60 * 60);
      if (hoursAgo > 48) continue;

      const locationText = rep.location?.address || 'Near your location';
      const animalLabel = rep.animalType || 'Animal';
      const titleText = `Rescue Alert: ${animalLabel} Reported`;
      const descText = `${rep.title || rep.condition || 'Animal in need'} reported at ${locationText}. Tap to review details.`;
      const notifId = `rescue_notif_${rep.id}`;

      // Check if this rescue alert has already been notified to this user
      const alreadyNotified =
        notifiedReportIdsRef.current.has(rep.id) ||
        notifications.some((n) => n.id === notifId || (n.type === 'rescue' && n.reportId === rep.id));

      if (alreadyNotified) {
        notifiedReportIdsRef.current.add(rep.id);
        continue; // Already processed! Never re-notify and never overwrite read status
      }

      // 1. Ensure the in-app notification feed card exists
      pushNotification({
        id: notifId,
        userId: uId,
        title: titleText,
        message: descText,
        body: descText,
        type: 'rescue',
        reportId: rep.id,
        icon: 'shield-outline',
        iconBg: '#FDF0ED',
        iconColor: '#C23E3E',
        createdAt: rep.createdAt || new Date().toISOString(),
      });

      // 2. Trigger phone system notification (pull-down shade) + animated in-app toast banner
      notifiedReportIdsRef.current.add(rep.id);
      hasNewToPersist = true;
      triggerRescueAlertNotification(rep);
    }

    if (hasNewToPersist) {
      const arr = Array.from(notifiedReportIdsRef.current);
      AsyncStorage.setItem(storageKey, JSON.stringify(arr)).catch(() => {});
    }
  };

  const syncCommentNotifications = async (user, reports) => {
    if (!user || (!user.id && !user.uid) || !Array.isArray(reports) || reports.length === 0) return;
    const uId = user.id || user.uid;

    const storageKey = `@alaga_notified_comments_${uId}`;
    try {
      const stored = await AsyncStorage.getItem(storageKey);
      if (stored) {
        const arr = JSON.parse(stored);
        if (Array.isArray(arr)) {
          arr.forEach((id) => notifiedCommentIdsRef.current.add(id));
        }
      }
    } catch (e) {}

    let hasNewToPersist = false;
    const newNotificationsToAdd = [];

    // Helper to recursively collect all replies and check for notifications
    const checkReplies = (repliesList, parentAuthorId, rep) => {
      if (!Array.isArray(repliesList)) return;
      for (const r of repliesList) {
        if (!r || !r.id) continue;

        // If the reply author is not the current user, AND the parent comment was authored by the current user:
        const isFromOther = r.userId && r.userId !== uId && r.userId !== user.id && r.userId !== user.uid;
        const isReplyingToMe = parentAuthorId && (parentAuthorId === uId || parentAuthorId === user.id || parentAuthorId === user.uid);

        if (isFromOther && isReplyingToMe) {
          const snippet = (r.text || '').length > 55 ? (r.text || '').slice(0, 52) + '...' : (r.text || '');
          const notifId = `reply_notif_${rep.id}_${r.id}`;
          const replyTitle = 'New reply to your comment';
          const replyBody = `${r.userName || 'Community member'} replied: "${snippet}"`;

          newNotificationsToAdd.push({
            id: notifId,
            userId: uId,
            title: replyTitle,
            body: replyBody,
            message: replyBody,
            type: 'comment',
            reportId: rep.id,
            replyId: r.id,
            icon: 'chatbox-ellipses-outline',
            iconBg: '#EBF4F8',
            iconColor: '#2E7A99',
            createdAt: r.createdAt || new Date().toISOString(),
          });

          if (!notifiedCommentIdsRef.current.has(r.id)) {
            notifiedCommentIdsRef.current.add(r.id);
            hasNewToPersist = true;

            const rTime = r.createdAt ? new Date(r.createdAt).getTime() : 0;
            const isRecent = rTime > 0 && (Date.now() - rTime) < 24 * 60 * 60 * 1000;
            if (isRecent) {
              if (Platform.OS !== 'web') {
                notifyPhoneSystem({
                  title: replyTitle,
                  body: replyBody,
                  data: { type: 'comment', reportId: rep.id },
                  channelId: 'default',
                }).catch(() => {});
              } else {
                setInAppBanner({
                  id: `banner_reply_${r.id}`,
                  title: replyTitle,
                  message: replyBody,
                  type: 'comment',
                  onPress: () => {
                    if (user?.role === 'advocate') {
                      navigate('RescueAlertDetail', { reportId: rep.id });
                    } else {
                      navigate('ReportDetail', { reportId: rep.id });
                    }
                  },
                });
              }
            }
          }
        }

        if (Array.isArray(r.replies) && r.replies.length > 0) {
          checkReplies(r.replies, r.userId, rep);
        }
      }
    };

    for (const rep of reports) {
      if (!rep || !Array.isArray(rep.comments) || rep.comments.length === 0) continue;

      const isMyReport = isOwnReport(rep, user);

      for (const c of rep.comments) {
        if (!c || !c.id) continue;

        // 1. Direct comments on current user's report
        const isFromOther = c.userId && c.userId !== uId && c.userId !== user.id && c.userId !== user.uid;
        if (isMyReport && isFromOther) {
          const snippet = (c.text || '').length > 55 ? (c.text || '').slice(0, 52) + '...' : (c.text || '');
          const notifId = `comment_notif_${rep.id}_${c.id}`;
          const commentTitle = 'New comment on your report';
          const commentBody = `${c.userName || 'Community member'}: "${snippet}"`;

          newNotificationsToAdd.push({
            id: notifId,
            userId: uId,
            title: commentTitle,
            body: commentBody,
            message: commentBody,
            type: 'comment',
            reportId: rep.id,
            commentId: c.id,
            icon: 'chatbox-ellipses-outline',
            iconBg: '#EBF4F8',
            iconColor: '#2E7A99',
            createdAt: c.createdAt || new Date().toISOString(),
          });

          if (!notifiedCommentIdsRef.current.has(c.id)) {
            notifiedCommentIdsRef.current.add(c.id);
            hasNewToPersist = true;

            const cTime = c.createdAt ? new Date(c.createdAt).getTime() : 0;
            const isRecent = cTime > 0 && (Date.now() - cTime) < 24 * 60 * 60 * 1000;
            if (isRecent) {
              if (Platform.OS !== 'web') {
                notifyPhoneSystem({
                  title: commentTitle,
                  body: commentBody,
                  data: { type: 'comment', reportId: rep.id },
                  channelId: 'default',
                }).catch(() => {});
              } else {
                setInAppBanner({
                  id: `banner_comment_${c.id}`,
                  title: commentTitle,
                  message: commentBody,
                  type: 'comment',
                  onPress: () => {
                    if (user?.role === 'advocate') {
                      navigate('RescueAlertDetail', { reportId: rep.id });
                    } else {
                      navigate('ReportDetail', { reportId: rep.id });
                    }
                  },
                });
              }
            }
          }
        }

        // 2. Check replies to comments
        if (Array.isArray(c.replies) && c.replies.length > 0) {
          checkReplies(c.replies, c.userId, rep);
        }
      }
    }

    if (newNotificationsToAdd.length > 0) {
      setNotifications((prev) => {
        const existingIds = new Set(prev.map((n) => n.id));
        const toAdd = newNotificationsToAdd.filter((n) => !existingIds.has(n.id));
        if (toAdd.length === 0) return prev;

        // Persist newly created notifications to Firestore under this user's subcollection
        toAdd.forEach((notif) => {
          saveNotificationFirebase(uId, notif);
        });

        return [...toAdd, ...prev].sort(
          (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );
      });
    }

    if (hasNewToPersist) {
      const arr = Array.from(notifiedCommentIdsRef.current);
      AsyncStorage.setItem(storageKey, JSON.stringify(arr)).catch(() => {});
    }
  };

  // ── Global Themed Alert Modal State ─────────────────────────────────────────
  const [globalAlert, setGlobalAlert] = useState({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    primaryText: 'OK',
    onPrimaryPress: null,
    secondaryText: null,
    onSecondaryPress: null,
    customIcon: null,
  });

  const hideAlert = () => {
    setGlobalAlert((prev) => ({ ...prev, visible: false }));
  };

  const showAlert = (arg1, arg2, arg3) => {
    if (typeof arg1 === 'object' && arg1 !== null) {
      setGlobalAlert({
        visible: true,
        type: arg1.type || 'info',
        title: arg1.title || '',
        message: arg1.message || '',
        primaryText: arg1.primaryText || 'OK',
        onPrimaryPress: arg1.onPrimaryPress || null,
        secondaryText: arg1.secondaryText || null,
        onSecondaryPress: arg1.onSecondaryPress || null,
        customIcon: arg1.customIcon || null,
      });
    } else if (Array.isArray(arg3)) {
      const title = arg1 || '';
      const message = arg2 || '';
      const buttons = arg3 || [];

      let secondary = null;
      let primary = null;

      if (buttons.length === 1) {
        primary = buttons[0];
      } else if (buttons.length >= 2) {
        const cancelBtn = buttons.find((b) => b.style === 'cancel') || buttons[0];
        const actionBtn = buttons.find((b) => b !== cancelBtn) || buttons[1];
        secondary = cancelBtn;
        primary = actionBtn;
      }

      const combinedText = (title + ' ' + message).toLowerCase();
      let type = 'info';
      if (combinedText.includes('error') || combinedText.includes('fail')) type = 'error';
      else if (
        combinedText.includes('success') ||
        combinedText.includes('claimed') ||
        combinedText.includes('adopted') ||
        combinedText.includes('approved') ||
        combinedText.includes('rescued')
      )
        type = 'success';
      else if (
        combinedText.includes('confirm') ||
        combinedText.includes('warning') ||
        combinedText.includes('reject') ||
        combinedText.includes('delete') ||
        combinedText.includes('clear')
      )
        type = 'warning';

      setGlobalAlert({
        visible: true,
        type,
        title,
        message,
        primaryText: primary ? primary.text : 'OK',
        onPrimaryPress: primary ? primary.onPress : null,
        secondaryText: secondary ? secondary.text : null,
        onSecondaryPress: secondary ? secondary.onPress : null,
        customIcon: null,
      });
    } else {
      setGlobalAlert({
        visible: true,
        type: 'info',
        title: arg1 || '',
        message: arg2 || '',
        primaryText: 'OK',
        onPrimaryPress: null,
        secondaryText: null,
        onSecondaryPress: null,
        customIcon: null,
      });
    }
  };

  // ── Initialize Notifications on Mount ──────────────────────────────────────
  useEffect(() => {
    initNotifications();

    const unsubListener = registerNotificationResponseListener((data) => {
      if ((data?.type === 'rescue' || data?.type === 'comment') && data.reportId) {
        if (currentUser?.role === 'advocate') {
          navigate('RescueAlertDetail', { reportId: data.reportId });
        } else {
          navigate('ReportDetail', { reportId: data.reportId });
        }
      } else if (data?.type === 'chat' && data.conversationId) {
        navigate('Chat', { conversationId: data.conversationId });
      }
    });

    return () => {
      unsubListener?.();
    };
  }, [currentUser?.role]);

  const completeOnboarding = async () => {
    setIsOnboardingCompleted(true);
    await AsyncStorage.setItem('@alaga_onboarding_completed_v1', 'true').catch(() => {});
  };

  // ── Load & Restore Saved User Auth Session & Onboarding State ─────────────
  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const [savedUserStr, onboardedStr] = await Promise.all([
          AsyncStorage.getItem('@alaga_saved_user_v1'),
          AsyncStorage.getItem('@alaga_onboarding_completed_v1'),
        ]);

        if (!isMounted) return;

        if (onboardedStr === 'true') {
          setIsOnboardingCompleted(true);
        }

        if (savedUserStr) {
          const parsed = JSON.parse(savedUserStr);
          if (parsed && (parsed.id || parsed.uid)) {
            if (!parsed.avatar) {
              parsed.avatar = getDefaultUserAvatar(parsed.name, parsed.id || parsed.uid);
            }
            setCurrentUser(parsed);
            currentUserRef.current = parsed;
            cacheUserProfile(parsed);
            setIsOnboardingCompleted(true);
          }
        }
      } catch (err) {
        console.warn('[AppContext] Error restoring saved auth session:', err);
      } finally {
        if (isMounted) {
          setIsAuthLoading(false);
        }
      }
    })();

    // Background Firebase Auth state listener to sync profile changes & keep token fresh
    const unsubAuth = subscribeAuthState(async (fbUser) => {
      if (!isMounted) return;
      if (fbUser) {
        try {
          const profile = await getUserProfileFirebase(fbUser.uid);
          if (profile && isMounted) {
            const resolvedAvatar =
              profile.avatar ||
              profile.photoURL ||
              profile.photoUrl ||
              profile.avatarUrl ||
              fbUser.photoURL ||
              currentUserRef.current?.avatar ||
              null;
            const updatedProfile = {
              ...profile,
              id: fbUser.uid,
              email: fbUser.email || profile.email,
              avatar: resolvedAvatar,
            };
            setCurrentUser(updatedProfile);
            currentUserRef.current = updatedProfile;
            cacheUserProfile(updatedProfile);
            AsyncStorage.setItem('@alaga_saved_user_v1', JSON.stringify(updatedProfile)).catch(() => {});
            setIsOnboardingCompleted(true);
            AsyncStorage.setItem('@alaga_onboarding_completed_v1', 'true').catch(() => {});
          }
        } catch (e) {
          console.warn('[AppContext] Auth sync notice:', e);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubAuth?.();
    };
  }, []);

  // ── Load & Persist Real-Time Notifications ─────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('@alaga_realtime_notifications_v2');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setNotifications(parsed);
            return;
          }
        }
        setNotifications([]);
      } catch (e) {
        setNotifications([]);
      }
    })();
  }, []);

  useEffect(() => {
    if (Array.isArray(notifications)) {
      AsyncStorage.setItem('@alaga_realtime_notifications_v2', JSON.stringify(notifications)).catch(() => {});
    }
  }, [notifications]);

  // ── Load & Persist Conversations ───────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('@alaga_conversations_v2');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setConversations(parsed);
          }
        }
      } catch (e) {}
    })();
  }, []);

  // ── Load & Persist Donations ───────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('@alaga_donations_v2');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setDonations(parsed);
          }
        }
      } catch (e) {}
    })();
  }, []);

  useEffect(() => {
    if (Array.isArray(donations) && donations.length > 0) {
      AsyncStorage.setItem('@alaga_donations_v2', JSON.stringify(donations)).catch(() => {});
    }
  }, [donations]);

  useEffect(() => {
    if (Array.isArray(conversations) && conversations.length > 0) {
      AsyncStorage.setItem('@alaga_conversations_v2', JSON.stringify(conversations)).catch(() => {});
    }
  }, [conversations]);

  // ── Firebase Real-Time Synchronization ─────────────────────────────────────
  useEffect(() => {
    if (!isMockFirebase()) {
      // Public feeds (Rescue alerts and Adoptable animals)
      const unsubRescues = subscribeToRescueReports((liveReports) => {
        const reportsList = Array.isArray(liveReports) ? liveReports : [];
        setRescueReports((prev) => {
          const merged = reportsList.map((remote) => {
            const local = (prev || []).find((r) => r.id === remote.id);
            const remoteComments = Array.isArray(remote.comments) ? remote.comments : [];
            const localComments = Array.isArray(local?.comments) ? local.comments : [];

            // Merge comments by id so local optimistic comments are never wiped out
            const map = new Map();
            localComments.forEach((c) => { if (c.id) map.set(c.id, c); });
            remoteComments.forEach((c) => { if (c.id) map.set(c.id, c); });

            const isRescued = remote.status === 'Rescued' || remote.urgency === 'Closed' || Boolean(remote.rescuedAt);

            return {
              ...remote,
              status: isRescued ? 'Rescued' : (remote.status || 'Open'),
              urgency: isRescued ? 'Closed' : (remote.urgency || 'High'),
              comments: Array.from(map.values()),
            };
          });
          return sortRescueReports(merged);
        });

        const activeUser = currentUserRef.current;
        if (activeUser) {
          syncRescueAlertNotifications(activeUser, reportsList);
          syncCommentNotifications(activeUser, reportsList);
        }
      });

      const unsubAnimals = subscribeToAnimals((liveAnimals) => {
        const raw = liveAnimals || [];
        // Deduplicate by id — guards against Firestore snapshot races
        const seen = new Set();
        const animalsList = raw.filter((a) => {
          if (!a.id || seen.has(a.id)) return false;
          seen.add(a.id);
          return true;
        });
        setAnimals(animalsList);
        animalsList.forEach((a) => {
          if (a.advocateId && a.advocateAvatar) {
            cacheUserProfile({ id: a.advocateId, name: a.advocateName, avatar: a.advocateAvatar });
          }
        });

        // ── Orphan Pruning: Delete notifications for animals that no longer exist ──
        const validAnimalIds = new Set(animalsList.map((a) => a.id));
        const activeUser = currentUserRef.current;
        setNotifications((prev) => {
          let changed = false;
          const kept = prev.filter((n) => {
            if (n.animalId && !validAnimalIds.has(n.animalId)) {
              changed = true;
              if (activeUser?.id) {
                deleteNotificationFirebase(activeUser.id, n.id);
              }
              return false;
            }
            return true;
          });
          return changed ? kept : prev;
        });
      });

      // Real-time listener for all registered users to keep profiles 100% consistent across all screens
      const unsubUsers = subscribeToAllUsersFirebase((allUsers) => {
        if (Array.isArray(allUsers) && allUsers.length > 0) {
          setUsers(allUsers);
          const activeUser = currentUserRef.current;
          if (activeUser && (activeUser.id || activeUser.uid)) {
            const myId = activeUser.id || activeUser.uid;
            const updatedMe = allUsers.find((u) => u && (u.id === myId || u.uid === myId));
            if (updatedMe) {
              const merged = { ...activeUser, ...updatedMe };
              if (
                merged.name !== activeUser.name ||
                merged.avatar !== activeUser.avatar ||
                merged.location !== activeUser.location ||
                merged.organization !== activeUser.organization ||
                merged.role !== activeUser.role ||
                merged.phone !== activeUser.phone
              ) {
                setCurrentUser(merged);
                currentUserRef.current = merged;
                cacheUserProfile(merged);
              }
            }
          }
        }
      });

      return () => {
        unsubRescues();
        unsubAnimals();
        unsubUsers?.();
      };
    }
  }, []);

  // Sync rescue alert, comment & message notifications whenever the logged-in user changes
  useEffect(() => {
    const uId = currentUser?.id || currentUser?.uid;
    if (uId) {
      cacheUserProfile(currentUser);
      // Pre-populate with existing notifications to avoid race conditions during login
      notifications.forEach((n) => {
        if (n.type === 'rescue' && n.reportId) {
          notifiedReportIdsRef.current.add(n.reportId);
        }
      });
      notifiedMessageIdsRef.current.clear();
      notifiedCommentIdsRef.current.clear();

      const storageKey = `@alaga_notified_reports_${uId}`;
      AsyncStorage.getItem(storageKey)
        .then((stored) => {
          if (stored) {
            try {
              const arr = JSON.parse(stored);
              if (Array.isArray(arr)) {
                arr.forEach((id) => notifiedReportIdsRef.current.add(id));
              }
            } catch (e) {}
          }
          if (Array.isArray(rescueReports) && rescueReports.length > 0) {
            syncRescueAlertNotifications(currentUser, rescueReports);
          }
        })
        .catch(() => {
          if (Array.isArray(rescueReports) && rescueReports.length > 0) {
            syncRescueAlertNotifications(currentUser, rescueReports);
          }
        });

      const commentKey = `@alaga_notified_comments_${uId}`;
      AsyncStorage.getItem(commentKey)
        .then((stored) => {
          if (stored) {
            try {
              const arr = JSON.parse(stored);
              if (Array.isArray(arr)) {
                arr.forEach((id) => notifiedCommentIdsRef.current.add(id));
              }
            } catch (e) {}
          }
          if (Array.isArray(rescueReports) && rescueReports.length > 0) {
            syncCommentNotifications(currentUser, rescueReports);
          }
        })
        .catch(() => {
          if (Array.isArray(rescueReports) && rescueReports.length > 0) {
            syncCommentNotifications(currentUser, rescueReports);
          }
        });

      const msgKey = `@alaga_notified_messages_${uId}`;
      AsyncStorage.getItem(msgKey)
        .then((stored) => {
          if (stored) {
            try {
              const arr = JSON.parse(stored);
              if (Array.isArray(arr)) {
                arr.forEach((id) => notifiedMessageIdsRef.current.add(id));
              }
            } catch (e) {}
          }
          if (Array.isArray(conversations) && conversations.length > 0) {
            handleLiveConversations(conversations);
          }
        })
        .catch(() => {
          if (Array.isArray(conversations) && conversations.length > 0) {
            handleLiveConversations(conversations);
          }
        });
    }
  }, [currentUser?.id, currentUser?.uid]);

  // User-specific applications, conversations, notifications & donations listener (runs only when authenticated)
  useEffect(() => {
    if (!isMockFirebase() && currentUser?.id) {
      const unsubApps = subscribeToApplications(currentUser, (liveApps) => {
        setRequests(liveApps || []);
      });
      const unsubConvos = subscribeToConversations(currentUser, (liveConvos) => {
        handleLiveConversations(liveConvos);
      });
      const unsubDonations = subscribeToDonations((liveDonations) => {
        if (Array.isArray(liveDonations)) {
          setDonations(liveDonations);
        }
      });
      // Gap 2 fix: Subscribe to user's Firestore notifications subcollection for cross-device sync
      const unsubNotifs = subscribeToNotificationsFirebase(
        currentUser.id,
        (firestoreNotifs) => {
          if (!Array.isArray(firestoreNotifs)) return;
          const remoteList = firestoreNotifs || [];

          // Pre-seed notifiedReportIdsRef so existing reports in Firestore are never re-alerted
          remoteList.forEach((n) => {
            if (n.type === 'rescue' && n.reportId) {
              notifiedReportIdsRef.current.add(n.reportId);
            }
          });

          setNotifications((prev) => {
            // Keep notifications that belong to 'all' or other users
            const otherUserNotifs = prev.filter(
              (n) => n.userId && n.userId !== 'all' && n.userId !== currentUser.id && n.userId !== currentUser.uid
            );
            // Deduplicate remoteList
            const seenIds = new Set();
            const deduplicated = [];
            [...remoteList, ...otherUserNotifs].forEach((n) => {
              if (n && n.id && !seenIds.has(n.id)) {
                seenIds.add(n.id);
                deduplicated.push(n);
              }
            });
            return deduplicated.sort(
              (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
            );
          });
        }
      );
      return () => {
        unsubApps?.();
        unsubConvos?.();
        unsubDonations?.();
        unsubNotifs?.();
      };
    } else {
      setRequests([]);
    }
  }, [currentUser?.id]);

  // ── Auth ──────────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    const fbResult = await loginWithFirebase(email, password);
    if (fbResult.success) {
      setCurrentUser(fbResult.user);
      currentUserRef.current = fbResult.user;
      cacheUserProfile(fbResult.user);
      setIsOnboardingCompleted(true);
      await Promise.all([
        AsyncStorage.setItem('@alaga_saved_user_v1', JSON.stringify(fbResult.user)),
        AsyncStorage.setItem('@alaga_onboarding_completed_v1', 'true'),
      ]).catch(() => {});
      return { success: true, user: fbResult.user };
    }
    return { success: false, error: fbResult.error || 'Invalid email or password.' };
  };

  const register = async (data) => {
    const fbResult = await registerWithFirebase(data);
    if (fbResult.success) {
      setCurrentUser(fbResult.user);
      currentUserRef.current = fbResult.user;
      cacheUserProfile(fbResult.user);
      setUsers((prev) => [...prev, fbResult.user]);
      setIsOnboardingCompleted(true);
      await Promise.all([
        AsyncStorage.setItem('@alaga_saved_user_v1', JSON.stringify(fbResult.user)),
        AsyncStorage.setItem('@alaga_onboarding_completed_v1', 'true'),
      ]).catch(() => {});
      return { success: true, user: fbResult.user };
    }
    return { success: false, error: fbResult.error || 'Registration failed.' };
  };

  const loginWithGoogle = async (googleData) => {
    let result;
    if (typeof googleData === 'string') {
      result = await loginWithGoogleCredential(googleData);
    } else {
      result = await loginWithGoogleProfile(googleData);
    }

    if (result.success) {
      setCurrentUser(result.user);
      currentUserRef.current = result.user;
      cacheUserProfile(result.user);
      setUsers((prev) => {
        const exists = prev.some((u) => u.id === result.user.id);
        return exists ? prev : [...prev, result.user];
      });
      setIsOnboardingCompleted(true);
      await Promise.all([
        AsyncStorage.setItem('@alaga_saved_user_v1', JSON.stringify(result.user)),
        AsyncStorage.setItem('@alaga_onboarding_completed_v1', 'true'),
      ]).catch(() => {});
      return { success: true, user: result.user };
    }
    return { success: false, error: result.error || 'Google login failed' };
  };

  const logout = () => {
    logoutFromFirebase();
    AsyncStorage.removeItem('@alaga_saved_user_v1').catch(() => {});
    setCurrentUser(null);
    currentUserRef.current = null;
    mySubmittedReportIds.current.clear();
    notifiedReportIdsRef.current.clear();
    notifiedMessageIdsRef.current.clear();
    notifiedCommentIdsRef.current.clear();
    activeConversationIdRef.current = null;
  };

  // ── Update current user profile ───────────────────────────────────────────
  const updateUser = async (updates) => {
    const normalizedUpdates = { ...updates };
    if (updates.avatar !== undefined) {
      normalizedUpdates.photoURL = updates.avatar;
    }
    setUsers((prev) => {
      const exists = (prev || []).some((u) => u.id === currentUser?.id);
      if (exists) {
        return prev.map((u) => (u.id === currentUser?.id ? { ...u, ...normalizedUpdates } : u));
      }
      return [...(prev || []), { ...currentUser, ...normalizedUpdates }];
    });
    const updated = { ...currentUser, ...normalizedUpdates };
    setCurrentUser(updated);
    currentUserRef.current = updated;
    cacheUserProfile(updated);
    AsyncStorage.setItem('@alaga_saved_user_v1', JSON.stringify(updated)).catch(() => {});
    if (currentUser?.id) {
      userProfilesCacheRef.current.delete(currentUser.id);
      await updateUserProfile(currentUser.id, normalizedUpdates);
    }
  };

  const resetPasswordWithOtp = async (arg1, arg2, arg3) => {
    let targetEmail;
    let targetPassword;
    if (typeof arg3 !== 'undefined') {
      targetEmail = arg1;
      targetPassword = arg3;
    } else if (typeof arg1 === 'object' && arg1 !== null) {
      targetEmail = arg1.email;
      targetPassword = arg1.newPassword;
    } else {
      targetEmail = arg1;
      targetPassword = arg2;
    }
    return await resetUserPasswordWithOtp({ email: targetEmail, newPassword: targetPassword });
  };

  const updateUserPassword = async ({ newPassword, currentPassword }) => {
    return await updateUserPasswordLoggedIn({
      newPassword,
      currentPassword,
      userId: currentUser?.id,
    });
  };

  const checkUserExists = async (email) => {
    return await checkUserExistsByEmail(email);
  };

  const getUserProfile = useCallback(async (userId) => {
    if (!userId) return null;
    if (currentUser?.id === userId) return currentUser;
    if (userProfilesCacheRef.current.has(userId)) {
      return userProfilesCacheRef.current.get(userId);
    }
    const existing = (users || []).find((u) => u.id === userId);
    if (existing?.payoutMethods) {
      userProfilesCacheRef.current.set(userId, existing);
      cacheUserProfile(existing);
      return existing;
    }
    const remote = await getUserProfileFirebase(userId);
    if (remote) {
      userProfilesCacheRef.current.set(userId, remote);
      cacheUserProfile(remote);
      return remote;
    }
    return existing || null;
  }, [currentUser, users]);

  const getUserById = useCallback((id) => {
    if (!id) return null;
    const cleanId = String(id).trim();
    const active = currentUserRef.current || currentUser;
    if (active && (active.id === cleanId || active.uid === cleanId)) {
      return active;
    }
    const foundInUsers = (users || []).find((u) => u && (u.id === cleanId || u.uid === cleanId));
    if (foundInUsers) return foundInUsers;

    const cached = getCachedUserProfile(cleanId);
    if (cached) return cached;

    return null;
  }, [currentUser, users]);

  // ── Rescue Reports ────────────────────────────────────────────────────────
  const addRescueReport = (reportData) => {
    const reportId = reportData?.id || `r${Date.now()}`;
    const authorId = currentUser?.id || currentUser?.uid || 'u_anon';
    const newReport = {
      id: reportId,
      reporterId: authorId,
      reporterName: currentUser?.name || 'Community Member',
      reporterEmail: currentUser?.email || '',
      reporterAvatar: currentUser?.avatar || getDefaultUserAvatar(currentUser?.name, authorId),
      status: 'Open',
      createdAt: new Date().toISOString(),
      responderId: null,
      responderAvatar: null,
      comments: [],
      ...reportData,
    };
    // Mark as locally submitted by this specific author
    mySubmittedReportIds.current.set(reportId, authorId);
    if (newReport.id) {
      mySubmittedReportIds.current.set(newReport.id, authorId);
    }
    setRescueReports((prev) => [newReport, ...prev]);
    createRescueReportFirebase(newReport);
    return newReport;
  };

  const deleteRescueReport = async (reportId) => {
    if (!reportId) return;
    const strId = String(reportId);
    setRescueReports((prev) => prev.filter((r) => r.id !== strId));
    mySubmittedReportIds.current?.delete(strId);
    notifiedReportIdsRef.current?.delete(strId);

    const activeUser = currentUserRef.current || currentUser;
    if (activeUser?.id) {
      const storageKey = `@alaga_notified_reports_${activeUser.id}`;
      const arr = Array.from(notifiedReportIdsRef.current || []);
      AsyncStorage.setItem(storageKey, JSON.stringify(arr)).catch(() => {});
    }

    // Cascade delete any notifications referencing this report
    setNotifications((prev) =>
      prev.filter((n) => {
        if (n.reportId && String(n.reportId) === strId) {
          if (activeUser?.id) {
            deleteNotificationFirebase(activeUser.id, n.id);
          }
          return false;
        }
        return true;
      })
    );

    // Delete in Firestore
    await deleteRescueReportFirebase(strId);
  };

  const respondToReport = (reportId) => {
    const responderAvatar = currentUser?.avatar || getDefaultUserAvatar(currentUser?.name, currentUser?.id);
    const respondedAt = new Date().toISOString();
    setRescueReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? {
              ...r,
              status: 'Responded',
              responderId: currentUser?.id,
              responderName: currentUser?.name,
              responderAvatar,
              respondedAt,
            }
          : r
      )
    );
    claimRescueReportFirebase(reportId, currentUser?.id, currentUser?.name, responderAvatar);
  };

  const markRescued = (reportId) => {
    setRescueReports((prev) =>
      sortRescueReports(
        prev.map((r) =>
          r.id === reportId
            ? { ...r, status: 'Rescued', urgency: 'Closed', rescuedAt: new Date().toISOString() }
            : r
        )
      )
    );
    markReportRescuedFirebase(reportId);
  };

  const updateRescueReportUrgency = (reportId, urgency) => {
    if (!reportId || !urgency) return;
    setRescueReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, urgency } : r))
    );
    updateRescueReportUrgencyFirebase(reportId, urgency);
  };

  const addComment = (reportId, text, parentCommentId = null) => {
    const activeUser = currentUserRef.current || currentUser;
    const authorId = activeUser?.id || activeUser?.uid || 'u_anon';
    const authorName = activeUser?.name || 'Community Member';
    const authorAvatar = activeUser?.avatar || getDefaultUserAvatar(authorName, authorId);

    const newComment = {
      id: `c${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      userId: authorId,
      userName: authorName,
      userAvatar: authorAvatar,
      text,
      createdAt: new Date().toISOString(),
      replies: [],
    };
    let updatedCommentsForReport = null;
    let targetReport = rescueReports.find((r) => r.id === reportId) || null;

    setRescueReports((prev) =>
      prev.map((r) => {
        if (r.id !== reportId) return r;
        targetReport = r;
        let newComments;
        if (!parentCommentId) {
          newComments = [...(r.comments || []), newComment];
        } else {
          const appendReply = (list) =>
            (list || []).map((c) => {
              if (c.id === parentCommentId) {
                return { ...c, replies: [...(c.replies || []), newComment] };
              }
              if (c.replies && c.replies.length > 0) {
                return { ...c, replies: appendReply(c.replies) };
              }
              return c;
            });
          newComments = appendReply(r.comments || []);
        }
        updatedCommentsForReport = newComments;
        return { ...r, comments: newComments };
      })
    );

    addRescueCommentFirebase(reportId, newComment, updatedCommentsForReport);

    // Comments are synced in real-time across devices via subscribeToRescueReports -> syncCommentNotifications.
    // In mock / offline mode, trigger sync for local state.
    if (isMockFirebase()) {
      const active = currentUserRef.current;
      if (active) {
        setTimeout(() => {
          syncCommentNotifications(active, rescueReports);
        }, 100);
      }
    }
  };

  // ── Animal Profiles ───────────────────────────────────────────────────────
  const addAnimal = (animalData) => {
    const newAnimal = {
      id: `a${Date.now()}`,
      advocateId: currentUser?.id || currentUser?.uid || 'u2',
      advocateName: currentUser?.name || 'Elena Ramos',
      advocateAvatar: currentUser?.avatar || getDefaultUserAvatar(currentUser?.name, currentUser?.id || currentUser?.uid),
      advocateEmail: currentUser?.email || null,
      createdAt: new Date().toISOString(),
      fosterId: null,
      fosterName: null,
      ...animalData,
    };
    // Guard: skip if this id is already in state (Firestore listener may have
    // already added it via a fast snapshot)
    setAnimals((prev) => {
      if (prev.some((a) => a.id === newAnimal.id)) return prev;
      return [newAnimal, ...prev];
    });
    addAnimalFirebase(newAnimal);
    return newAnimal;
  };

  const updateAnimal = (animalId, updates) => {
    let fullUpdated = null;
    setAnimals((prev) =>
      prev.map((a) => {
        if (a.id === animalId) {
          fullUpdated = { ...a, ...updates };
          return fullUpdated;
        }
        return a;
      })
    );
    const existing = animals.find((a) => a.id === animalId);
    updateAnimalFirebase(animalId, updates, fullUpdated || (existing ? { ...existing, ...updates } : null));
  };

  const deleteAnimal = async (animalId) => {
    if (!animalId) return;
    const strId = String(animalId);
    setAnimals((prev) => prev.filter((a) => a.id !== strId));

    // Cascade delete any notifications referencing this animal
    const activeUser = currentUserRef.current || currentUser;
    setNotifications((prev) =>
      prev.filter((n) => {
        if (n.animalId && String(n.animalId) === strId) {
          if (activeUser?.id) {
            deleteNotificationFirebase(activeUser.id, n.id);
          }
          return false;
        }
        return true;
      })
    );

    // Remove any adoption / foster applications for this animal
    setRequests((prev) => prev.filter((r) => String(r.animalId) !== strId));

    // Delete from Firestore
    await deleteAnimalFirebase(strId);
  };

  // Return a fostered animal back to available listings
  const returnAnimalToListings = (animalId) => {
    const statusUpdate = { status: 'Available', fosterId: null, fosterName: null };
    let fullUpdated = null;
    setAnimals((prev) =>
      prev.map((a) => {
        if (a.id === animalId) {
          fullUpdated = { ...a, ...statusUpdate };
          return fullUpdated;
        }
        return a;
      })
    );
    const existing = animals.find((a) => a.id === animalId);
    updateAnimalFirebase(animalId, statusUpdate, fullUpdated || (existing ? { ...existing, ...statusUpdate } : null));
  };

  // Permanently mark an animal as adopted
  const markAnimalAdopted = (animalId) => {
    const statusUpdate = { status: 'Adopted', fosterId: null, fosterName: null };
    let fullUpdated = null;
    setAnimals((prev) =>
      prev.map((a) => {
        if (a.id === animalId) {
          fullUpdated = { ...a, ...statusUpdate };
          return fullUpdated;
        }
        return a;
      })
    );
    const existing = animals.find((a) => a.id === animalId);
    updateAnimalFirebase(animalId, statusUpdate, fullUpdated || (existing ? { ...existing, ...statusUpdate } : null));
  };

  // ── Adoption / Foster Requests ────────────────────────────────────────────
  const submitRequest = (requestData) => {
    const newRequest = {
      id: `req${Date.now()}`,
      requesterId: currentUser?.id || 'u1',
      requesterName: currentUser?.name || 'Community Member',
      requesterAvatar: currentUser?.avatar || getDefaultUserAvatar(currentUser?.name, currentUser?.id || 'u1'),
      status: 'Pending',
      createdAt: new Date().toISOString(),
      ...requestData,
    };
    setRequests((prev) => [newRequest, ...prev]);
    submitApplicationFirebase(newRequest);

    // Real-time alert for the animal's advocate
    const animal = animals.find((a) => a.id === requestData.animalId);
    const advocateId = animal?.advocateId;
    if (advocateId) {
      const reqType = requestData.type || 'Adoption';
      const title = `New ${reqType} Application`;
      const body = `${newRequest.requesterName} submitted an application for ${animal?.name || 'an animal'}.`;
      pushNotification({
        userId: advocateId,
        title,
        body,
        message: body,
        type: 'adoption',
        requestId: newRequest.id,
        icon: 'paw-outline',
        iconBg: '#EDF6F1',
        iconColor: '#2B8259',
      });
      if (currentUser?.id !== advocateId) {
        notifyPhoneSystem({
          title,
          body,
          data: { type: 'adoption', requestId: newRequest.id },
          channelId: 'default',
        }).catch(() => {});
      }
    }

    return newRequest;
  };

  const updateRequestStatus = (requestId, status) => {
    const req = requests.find((r) => r.id === requestId);
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status } : r))
    );
    updateApplicationFirebase(requestId, { status });

    if (req) {
      const animal = animals.find((a) => a.id === req.animalId);
      const reqType = req.type || 'Adoption';
      const title = `Application ${status}`;
      const body = `Your ${reqType.toLowerCase()} application for ${animal?.name || 'the animal'} has been ${status.toLowerCase()}.`;

      pushNotification({
        userId: req.requesterId,
        title,
        body,
        message: body,
        type: 'adoption',
        requestId: req.id,
        icon: 'paw-outline',
        iconBg: '#EDF6F1',
        iconColor: '#2B8259',
      });

      if (currentUser?.id !== req.requesterId) {
        notifyPhoneSystem({
          title,
          body,
          data: { type: 'adoption', requestId: req.id },
          channelId: 'default',
        }).catch(() => {});
      }
    }

    // When approved: update the animal's status accordingly
    if (status === 'Approved') {
      if (req) {
        const animalStatusUpdates =
          req.type === 'Adoption'
            ? { status: 'Adopted', fosterId: null, fosterName: null }
            : req.type === 'Foster'
            ? { status: 'Being Fostered', fosterId: req.requesterId, fosterName: req.requesterName }
            : null;

        if (animalStatusUpdates) {
          let updatedAnimal = null;
          setAnimals((prev) =>
            prev.map((a) => {
              if (a.id !== req.animalId) return a;
              updatedAnimal = { ...a, ...animalStatusUpdates };
              return updatedAnimal;
            })
          );
          const existing = animals.find((a) => a.id === req.animalId);
          updateAnimalFirebase(req.animalId, animalStatusUpdates, updatedAnimal || existing);
        }
      }
    }
  };

  // ── Messaging ─────────────────────────────────────────────────────────────
  const handleLiveConversations = (liveConvos) => {
    if (!Array.isArray(liveConvos)) return;
    setConversations(liveConvos);

    const activeUser = currentUserRef.current;
    if (!activeUser || !activeUser.id) return;
    const uId = activeUser.id;

    liveConvos.forEach((convo) => {
      if (!convo || !Array.isArray(convo.participants) || !convo.participants.includes(uId)) {
        return;
      }

      // Check unread count for active user
      const unreadForMe =
        convo.unreadCounts && typeof convo.unreadCounts[uId] === 'number'
          ? convo.unreadCounts[uId]
          : (convo.lastSenderId && convo.lastSenderId !== uId && convo.unread ? (convo.unreadCount || 1) : 0);

      // If user is currently looking at this exact chat screen, auto-mark as read
      if (activeConversationIdRef.current === convo.id) {
        if (unreadForMe > 0) {
          markConversationRead(convo.id);
        }
        return;
      }

      // Only notify if there are unread messages and the last sender was someone else
      if (unreadForMe > 0 && convo.lastSenderId && convo.lastSenderId !== uId) {
        // Messages are now in the subcollection; use lastMessageTime for dedup key
        const msgKey = `${convo.id}_${convo.lastMessageTime || convo.lastSenderId}`;

        if (!notifiedMessageIdsRef.current.has(msgKey)) {
          notifiedMessageIdsRef.current.add(msgKey);

          const storageKey = `@alaga_notified_messages_${uId}`;
          AsyncStorage.getItem(storageKey).then((stored) => {
            const arr = stored ? JSON.parse(stored) : [];
            if (!arr.includes(msgKey)) {
              arr.push(msgKey);
              AsyncStorage.setItem(storageKey, JSON.stringify(arr.slice(-100))).catch(() => {});
            }
          }).catch(() => {});

          const otherId = convo.participants.find((p) => p !== uId);
          const senderName =
            convo.participantNames?.[convo.lastSenderId] ||
            convo.participantNames?.[otherId] ||
            'ALAGA Member';
          const msgText = convo.lastMessage || 'Sent you a message';

          // 1. Phone system heads-up notification (pull-down shade on mobile)
          if (Platform.OS !== 'web') {
            notifyNewMessage({
              senderName,
              messageText: msgText,
              conversationId: convo.id,
            });
          } else {
            // In-app dropdown toast banner on web
            showInAppNotification({
              title: `Message from ${senderName}`,
              message: msgText,
              type: 'message',
              onPress: () => {
                navigate('Chat', { conversationId: convo.id, userName: senderName });
              },
            });
          }

          // 2. Add to bell notification screen stream
          pushNotification({
            id: `msg_notif_${msgKey}`,
            userId: uId,
            title: `Message from ${senderName}`,
            message: msgText,
            body: msgText,
            type: 'chat',
            icon: 'chatbubble-outline',
            iconBg: '#EBF4F8',
            iconColor: '#2A728F',
            conversationId: convo.id,
            senderName,
            createdAt: convo.lastMessageTime || new Date().toISOString(),
          });
        }
      }
    });
  };

  const sendMessage = (conversationId, messageData) => {
    if (!conversationId || !messageData) return;
    const activeUser = currentUserRef.current;
    if (!activeUser || !activeUser.id) return;
    const uId = activeUser.id;

    let newMsg;
    if (typeof messageData === 'string') {
      const trimmed = messageData.trim();
      if (!trimmed) return;
      newMsg = {
        id: `m_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        senderId: uId,
        senderName: activeUser.name || 'User',
        senderAvatar: activeUser.avatar || null,
        text: trimmed,
        type: 'text',
        time: new Date().toISOString(),
      };
    } else {
      newMsg = {
        id: messageData.id || `m_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        senderId: uId,
        senderName: activeUser.name || 'User',
        senderAvatar: activeUser.avatar || null,
        text: messageData.text || '',
        type: messageData.type || 'text',
        mediaUri: messageData.mediaUri || null,
        location: messageData.location || null,
        duration: messageData.duration || null,
        time: messageData.time || new Date().toISOString(),
        // Extra fields for special message types (e.g. report_link)
        ...(messageData.reportId ? { reportId: messageData.reportId } : {}),
        ...(messageData.animalType ? { animalType: messageData.animalType } : {}),
        ...(messageData.condition ? { condition: messageData.condition } : {}),
        ...(messageData.address !== undefined ? { address: messageData.address } : {}),
        ...(messageData.status ? { status: messageData.status } : {}),
        ...(messageData.reporterName !== undefined ? { reporterName: messageData.reporterName } : {}),
      };
    }

    const lastSummary =
      newMsg.type === 'image'
        ? '📷 Photo'
        : newMsg.type === 'video'
        ? '🎥 Video'
        : newMsg.type === 'location'
        ? '📍 Location'
        : newMsg.text;

    // Gap 1 fix: Write message to subcollection, NOT to the conversation doc array
    saveMessageFirebase(conversationId, newMsg).catch((err) => {
      console.warn('[AppContext] saveMessageFirebase warning:', err?.message);
    });

    // Update conversation metadata only (lastMessage, unreadCounts, etc.) — no messages array
    let updatedConvoMeta = null;

    setConversations((prev) => {
      const existing = prev.find((c) => c.id === conversationId);
      if (!existing) return prev;

      const nextUnreadCounts = { ...(existing.unreadCounts || {}) };
      // For all other participants, increment their unread count
      (existing.participants || []).forEach((pId) => {
        if (pId !== uId) {
          nextUnreadCounts[pId] = (nextUnreadCounts[pId] || 0) + 1;
        } else {
          nextUnreadCounts[pId] = 0;
        }
      });

      updatedConvoMeta = {
        ...existing,
        lastMessage: lastSummary,
        lastMessageTime: newMsg.time,
        lastSenderId: newMsg.senderId,
        participantAvatars: {
          ...(existing.participantAvatars || {}),
          [uId]: activeUser.avatar || null,
        },
        unreadCounts: nextUnreadCounts,
        unreadCount: (nextUnreadCounts[uId] || 0),
        unread: false, // sender has already read their own message
      };

      return prev.map((c) => (c.id === conversationId ? updatedConvoMeta : c));
    });

    if (updatedConvoMeta) {
      saveConversationFirebase(updatedConvoMeta);
    }
  };

  const startConversation = (otherUserId, otherUserName, otherUserAvatar) => {
    if (!otherUserId || !currentUser?.id) return '';
    const existing = conversations.find(
      (c) =>
        c.participants &&
        c.participants.includes(currentUser.id) &&
        c.participants.includes(otherUserId)
    );
    if (existing) {
      if (otherUserAvatar && (!existing.participantAvatars || !existing.participantAvatars[otherUserId])) {
        const updated = {
          ...existing,
          participantAvatars: {
            ...(existing.participantAvatars || {}),
            [currentUser.id]: currentUser.avatar || null,
            [otherUserId]: otherUserAvatar,
          },
        };
        setConversations((prev) => prev.map((c) => (c.id === existing.id ? updated : c)));
        saveConversationFirebase(updated);
      }
      return existing.id;
    }
    const newConv = {
      id: `conv${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      participants: [currentUser.id, otherUserId],
      participantNames: {
        [currentUser.id]: currentUser.name || 'Community Member',
        [otherUserId]: otherUserName || 'Community Member',
      },
      participantAvatars: {
        [currentUser.id]: currentUser.avatar || null,
        [otherUserId]: otherUserAvatar || null,
      },
      lastMessage: '',
      lastMessageTime: new Date().toISOString(),
      lastSenderId: '',
      unreadCounts: {
        [currentUser.id]: 0,
        [otherUserId]: 0,
      },
      unread: false,
    };
    setConversations((prev) => [newConv, ...prev]);
    saveConversationFirebase(newConv);
    return newConv.id;
  };

  const startGroupConversation = (memberIds, groupName) => {
    if (!memberIds || memberIds.length < 2 || !currentUser?.id) return '';
    const allIds = [currentUser.id, ...memberIds.filter((id) => id !== currentUser.id)];
    const names = {};
    const avatars = {};
    const unreadCounts = {};
    allIds.forEach((id) => {
      if (id === currentUser.id) {
        names[id] = currentUser.name || 'You';
        avatars[id] = currentUser.avatar || null;
      } else {
        const found = getAllKnownUsers().find((u) => u.id === id);
        names[id] = found?.name || 'Member';
        avatars[id] = found?.avatar || null;
      }
      unreadCounts[id] = 0;
    });
    const newConv = {
      id: `grp${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      isGroup: true,
      groupName: groupName || allIds.map((id) => names[id].split(' ')[0]).join(', '),
      participants: allIds,
      participantNames: names,
      participantAvatars: avatars,
      lastMessage: '',
      lastMessageTime: new Date().toISOString(),
      lastSenderId: '',
      unreadCounts,
      unread: false,
    };
    setConversations((prev) => [newConv, ...prev]);
    saveConversationFirebase(newConv);
    return newConv.id;
  };

  const clearConversation = async (conversationId) => {
    if (!conversationId) return;
    // 1. Remove conversation from local list so it immediately disappears from Messages inbox
    setConversations((prev) => prev.filter((c) => c.id !== conversationId));
    // 2. Clear all subcollection messages and delete the conversation document in Firestore
    try {
      await deleteConversationFirebase(conversationId);
    } catch (err) {
      console.warn('[AppContext] clearConversation warning:', err?.message || err);
    }
  };

  const deleteConversation = async (conversationId) => {
    if (!conversationId) return;
    setConversations((prev) => prev.filter((c) => c.id !== conversationId));
    try {
      await deleteConversationFirebase(conversationId);
    } catch (err) {
      console.warn('[AppContext] deleteConversation warning:', err?.message || err);
    }
  };

  const updateGroupInfo = (conversationId, { groupName, groupPhoto, addParticipants } = {}) => {
    if (!conversationId) return;
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== conversationId || !c.isGroup) return c;
        let participants = c.participants ? [...c.participants] : [];
        let participantNames = { ...(c.participantNames || {}) };
        let participantAvatars = { ...(c.participantAvatars || {}) };

        // Merge in new participants (avoid duplicates)
        if (Array.isArray(addParticipants) && addParticipants.length > 0) {
          addParticipants.forEach(({ id, name, avatar }) => {
            if (id && !participants.includes(id)) {
              participants.push(id);
              if (name) participantNames[id] = name;
              if (avatar) participantAvatars[id] = avatar;
            }
          });
        }

        const updated = {
          ...c,
          participants,
          participantNames,
          participantAvatars,
          ...(groupName !== undefined ? { groupName } : {}),
          ...(groupPhoto !== undefined ? { groupPhoto } : {}),
        };
        saveConversationFirebase(updated);
        return updated;
      })
    );
  };

  // ── Donations ─────────────────────────────────────────────────────────────
  const submitDonation = async (donationData) => {
    const rawAmount = typeof donationData.amount === 'number'
      ? donationData.amount
      : parseFloat(String(donationData.amount || '0').replace(/[^0-9.]/g, '')) || 0;

    let proofUrl = donationData.proofPhoto || null;
    if (proofUrl && typeof proofUrl === 'string' && !proofUrl.startsWith('http') && !proofUrl.startsWith('data:')) {
      try {
        const uploaded = await uploadImageToStorage(proofUrl);
        if (uploaded) proofUrl = uploaded;
      } catch (e) {
        console.warn('[AppContext] Receipt upload warning:', e.message);
      }
    }

    const donorId = currentUser?.id || currentUser?.uid;
    const docId = `d_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newDonation = {
      id: docId,
      donorId,
      donorName: currentUser?.name || 'Community Supporter',
      donorEmail: currentUser?.email || '',
      donorAvatar: currentUser?.avatar || '',
      status: 'Pending',
      createdAt: new Date().toISOString(),
      ...donationData,
      amount: rawAmount,
      amountDisplay: `₱${rawAmount.toLocaleString()}`,
      proofPhoto: proofUrl,
    };

    // Update local state immediately for responsive UI
    setDonations((prev) => [newDonation, ...prev.filter((d) => d.id !== newDonation.id)]);

    // Write to Firestore in real time
    createDonationFirebase(newDonation).catch((err) => {
      console.warn('[AppContext] createDonationFirebase warning:', err);
    });

    // Real-time notification for the recipient advocate (if applicable)
    const advocateId = donationData.advocateId;
    const recipientTitle = donationData.animalName || 'Rescue Patient Care';
    if (advocateId && advocateId !== donorId) {
      const notifTitle = 'New Donation Received';
      const notifBody = `${newDonation.donorName} donated ₱${rawAmount.toLocaleString()} for ${recipientTitle}.`;
      pushNotification({
        userId: advocateId,
        title: notifTitle,
        body: notifBody,
        message: notifBody,
        type: 'donation',
        donationId: newDonation.id,
        animalId: donationData.animalId,
        animalPhoto: donationData.animalPhoto,
        icon: 'gift-outline',
        iconBg: '#FEF3DC',
        iconColor: '#B45309',
      });
      notifyPhoneSystem({
        title: notifTitle,
        body: notifBody,
        data: { type: 'donation', donationId: newDonation.id },
        channelId: 'default',
      }).catch(() => {});
    }

    // Donor confirmation notification
    pushNotification({
      userId: donorId,
      title: 'Donation Submitted',
      body: `Thank you. Your donation of ₱${rawAmount.toLocaleString()} for ${recipientTitle} has been recorded (Ref: ${donationData.referenceNumber || 'Cash'}).`,
      message: `Your donation of ₱${rawAmount.toLocaleString()} for ${recipientTitle} has been recorded.`,
      type: 'donation',
      donationId: newDonation.id,
      animalId: donationData.animalId,
      animalPhoto: donationData.animalPhoto,
      icon: 'heart-outline',
      iconBg: '#E8F5EE',
      iconColor: '#2D9E5F',
    });

    return newDonation;
  };

  const verifyDonation = async (donationId, status = 'Verified', notes = '') => {
    setDonations((prev) =>
      prev.map((d) => (d.id === donationId ? { ...d, status, advocateNotes: notes } : d))
    );
    await verifyDonationFirebase(donationId, status, notes);

    const donation = donations.find((d) => d.id === donationId);
    if (donation && donation.donorId) {
      const isApproved = status === 'Verified';
      const title = isApproved ? 'Donation Verified' : 'Donation Update';
      const body = isApproved
        ? `Your donation of ₱${donation.amount?.toLocaleString()} for ${donation.animalName || 'ALAGA'} has been verified. Thank you for your generosity.`
        : `Your donation for ${donation.animalName || 'ALAGA'} has been updated: ${status}.`;

      pushNotification({
        userId: donation.donorId,
        title,
        body,
        message: body,
        type: 'donation',
        donationId,
        icon: isApproved ? 'checkmark-circle-outline' : 'alert-circle-outline',
        iconBg: isApproved ? '#E8F5EE' : '#FDE8E7',
        iconColor: isApproved ? '#2D9E5F' : '#D93025',
      });
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getUserConversations = () =>
    conversations.filter((c) => Array.isArray(c.participants) && c.participants.includes(currentUser?.id));

  const getUnreadMessagesCount = () => {
    const activeUser = currentUserRef.current || currentUser;
    if (!activeUser?.id) return 0;
    const uId = activeUser.id;

    return getUserConversations().reduce((sum, c) => {
      if (c.unreadCounts && typeof c.unreadCounts[uId] === 'number') {
        return sum + c.unreadCounts[uId];
      }
      // Fallback for legacy data
      if (c.lastSenderId && c.lastSenderId !== uId && c.unread) {
        return sum + (c.unreadCount || 1);
      }
      return sum;
    }, 0);
  };

  const markConversationRead = useCallback((conversationId) => {
    if (!conversationId) return;
    const activeUser = currentUserRef.current || currentUser;
    if (!activeUser?.id) return;
    const uId = activeUser.id;

    setConversations((prev) => {
      const target = prev.find((c) => c.id === conversationId);
      if (!target) return prev;
      const unreadCountForMe = target.unreadCounts?.[uId] || 0;
      if (unreadCountForMe === 0 && !target.unread && (!target.unreadCount || target.unreadCount === 0)) {
        return prev;
      }
      return prev.map((c) => {
        if (c.id === conversationId) {
          const nextCounts = { ...(c.unreadCounts || {}) };
          nextCounts[uId] = 0;
          return {
            ...c,
            unreadCounts: nextCounts,
            unreadCount: 0,
            unread: false,
          };
        }
        return c;
      });
    });

    markConversationReadFirebase(conversationId, uId);
  }, []);

  const getAllKnownUsers = () => {
    const map = new Map();

    // 1. Registered users in state
    (users || []).forEach((u) => {
      if (u && u.id && u.id !== currentUser?.id) {
        map.set(u.id, {
          id: u.id,
          name: u.name || 'Community Member',
          role: u.role || 'community',
          location: u.location || '',
          avatar: u.avatar || null,
        });
        cacheUserProfile(u);
      }
    });

    // 2. Advocates from animals
    (animals || []).forEach((a) => {
      const aId = a?.advocateId;
      if (aId && aId !== currentUser?.id && !map.has(aId)) {
        map.set(aId, {
          id: aId,
          name: a.advocateName || 'Animal Advocate',
          role: 'advocate',
          location: a.location || '',
          avatar: a.advocateAvatar || null,
        });
        if (a.advocateAvatar) {
          cacheUserProfile({ id: aId, name: a.advocateName, avatar: a.advocateAvatar });
        }
      }
    });

    // 3. Reporters & Responders from rescue reports
    (rescueReports || []).forEach((r) => {
      const repId = r?.reporterId;
      if (repId && repId !== currentUser?.id && !map.has(repId)) {
        map.set(repId, {
          id: repId,
          name: r.reporterName || 'Rescue Reporter',
          role: 'community',
          location: r.location?.address || '',
          avatar: r.reporterAvatar || null,
        });
        if (r.reporterAvatar) {
          cacheUserProfile({ id: repId, name: r.reporterName, avatar: r.reporterAvatar });
        }
      }
      const respId = r?.responderId;
      if (respId && respId !== currentUser?.id && !map.has(respId)) {
        map.set(respId, {
          id: respId,
          name: r.responderName || 'Responding Advocate',
          role: 'advocate',
          location: '',
          avatar: r.responderAvatar || null,
        });
      }
    });

    // 4. Requesters from adoption requests
    (requests || []).forEach((rq) => {
      const reqId = rq?.requesterId;
      if (reqId && reqId !== currentUser?.id && !map.has(reqId)) {
        map.set(reqId, {
          id: reqId,
          name: rq.requesterName || 'Applicant',
          role: 'community',
          location: '',
          avatar: rq.requesterAvatar || null,
        });
        if (rq.requesterAvatar) {
          cacheUserProfile({ id: reqId, name: rq.requesterName, avatar: rq.requesterAvatar });
        }
      }
    });

    return Array.from(map.values());
  };

  const getUserReports = () =>
    rescueReports.filter((r) => r.reporterId === currentUser?.id);

  const getAdvocateResponses = () =>
    rescueReports.filter((r) => r.responderId === currentUser?.id);

  const getUserRequests = () =>
    requests.filter((r) => r.requesterId === currentUser?.id);

  const getAdvocateRequests = () =>
    requests.filter((r) => r.advocateId === currentUser?.id);

  const getAdvocateAnimals = () =>
    animals.filter((a) =>
      (currentUser?.id && a.advocateId === currentUser.id) ||
      (currentUser?.uid && a.advocateId === currentUser.uid) ||
      (currentUser?.email && a.advocateEmail && currentUser.email.toLowerCase() === a.advocateEmail.toLowerCase()) ||
      (currentUser?.name && a.advocateName && currentUser.name.trim().toLowerCase() === a.advocateName.trim().toLowerCase())
    );

  const getAnimalsByAdvocate = (userId) =>
    animals.filter((a) => a.advocateId === userId && a.status === 'Available');

  const getUserDonations = () =>
    donations.filter((d) => d.donorId === currentUser?.id);

  const getAdvocateDonations = () =>
    donations.filter((d) => d.advocateId === currentUser?.id || !d.advocateId);

  const getAnimalDonations = (animalId) =>
    donations.filter((d) => d.animalId === animalId);

  // ── Notifications ─────────────────────────────────────────────────────────
  const getUserNotifications = () => {
    const activeUser = currentUserRef.current || currentUser;
    const uId = activeUser?.id || activeUser?.uid;
    return notifications
      .filter((n) => !n.userId || n.userId === 'all' || (uId && (n.userId === uId || n.userId === activeUser?.id || n.userId === activeUser?.uid)))
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  };

  const getUnreadCount = () => {
    const activeUser = currentUserRef.current || currentUser;
    const uId = activeUser?.id || activeUser?.uid;
    return notifications.filter(
      (n) =>
        (!n.userId || n.userId === 'all' || (uId && (n.userId === uId || n.userId === activeUser?.id || n.userId === activeUser?.uid))) &&
        !n.read
    ).length;
  };

  const markNotificationRead = (notifId) => {
    if (!notifId) return;
    const activeUser = currentUserRef.current || currentUser;
    const uId = activeUser?.id || activeUser?.uid;

    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === notifId ? { ...n, read: true } : n));
      AsyncStorage.setItem('@alaga_realtime_notifications_v2', JSON.stringify(updated)).catch(() => {});
      return updated;
    });

    if (uId) {
      markNotificationReadFirebase(uId, notifId);
    }
  };

  const markAllNotificationsRead = () => {
    const activeUser = currentUserRef.current || currentUser;
    const uId = activeUser?.id || activeUser?.uid;

    setNotifications((prev) => {
      const updated = prev.map((n) =>
        !n.userId || n.userId === 'all' || (uId && (n.userId === uId || n.userId === activeUser?.id || n.userId === activeUser?.uid))
          ? { ...n, read: true }
          : n
      );
      AsyncStorage.setItem('@alaga_realtime_notifications_v2', JSON.stringify(updated)).catch(() => {});
      return updated;
    });

    if (uId) {
      markAllNotificationsReadFirebase(uId);
    }
  };

  const deleteNotification = (notifId) => {
    if (!notifId) return;
    const activeUser = currentUserRef.current || currentUser;
    const uId = activeUser?.id || activeUser?.uid;
    setNotifications((prev) => prev.filter((n) => n.id !== notifId));
    if (uId) {
      deleteNotificationFirebase(uId, notifId);
    }
  };

  const clearAllNotifications = () => {
    const activeUser = currentUserRef.current || currentUser;
    const uId = activeUser?.id || activeUser?.uid;
    setNotifications((prev) =>
      prev.filter((n) => n.userId && n.userId !== 'all' && (uId ? (n.userId !== uId && n.userId !== activeUser?.id && n.userId !== activeUser?.uid) : true))
    );
    if (uId) {
      clearAllNotificationsFirebase(uId);
      AsyncStorage.removeItem(`@alaga_notified_reports_${uId}`).catch(() => {});
      AsyncStorage.removeItem(`@alaga_notified_comments_${uId}`).catch(() => {});
      notifiedReportIdsRef.current.clear();
      notifiedCommentIdsRef.current.clear();
    }
    AsyncStorage.removeItem('@alaga_realtime_notifications_v2').catch(() => {});
  };


  // ── Rescue Case Linking ───────────────────────────────────────────────────
  const getAdvocateRescuedCases = () =>
    rescueReports.filter((r) => 
      r.responderId === currentUser?.id && r.status === 'Rescued'
    ).sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));

  return (
    <AppContext.Provider
      value={{
        // state
        currentUser,
        users,
        rescueReports,
        animals,
        requests,
        conversations,
        donations,
        notifications,
        // auth
        login,
        register,
        loginWithGoogle,
        logout,
        updateUser,
        resetPasswordWithOtp,
        updateUserPassword,
        checkUserExists,
        isAuthLoading,
        isOnboardingCompleted,
        completeOnboarding,
        // rescue
        addRescueReport,
        deleteRescueReport,
        respondToReport,
        markRescued,
        addComment,
        updateRescueReportUrgency,
        // animals
        addAnimal,
        updateAnimal,
        deleteAnimal,
        returnAnimalToListings,
        markAnimalAdopted,
        // requests
        submitRequest,
        updateRequestStatus,
        // messages
        sendMessage,
        startConversation,
        startGroupConversation,
        updateGroupInfo,
        clearConversation,
        deleteConversation,
        setActiveConversationId,
        // donations
        submitDonation,
        verifyDonation,
        // helpers
        getUserConversations,
        getUnreadMessagesCount,
        markConversationRead,
        getUserById,
        getAllKnownUsers,
        getUserReports,
        getAdvocateResponses,
        getUserRequests,
        getAdvocateRequests,
        getAdvocateAnimals,
        getAnimalsByAdvocate,
        getUserDonations,
        getAdvocateDonations,
        getAnimalDonations,
        getUserProfile,
        // notifications
        getUserNotifications,
        getUnreadCount,
        markNotificationRead,
        markAllNotificationsRead,
        deleteNotification,
        clearAllNotifications,
        pushNotification,
        // rescue linking
        getAdvocateRescuedCases,
        // alerts badge and top notifications
        getOpenAlertsCount,
        markAlertsAsViewed,
        showInAppNotification,
        hideInAppNotification,
        // global themed alert
        showAlert,
        hideAlert,
      }}
    >
      {children}
      <InAppNotificationBanner
        notification={inAppBanner}
        onDismiss={hideInAppNotification}
        onPress={(notif) => {
          if (typeof notif?.onPress === 'function') {
            notif.onPress();
          }
        }}
      />
      <AlertModal
        visible={globalAlert.visible}
        type={globalAlert.type}
        title={globalAlert.title}
        message={globalAlert.message}
        customIcon={globalAlert.customIcon}
        primaryText={globalAlert.primaryText}
        onPrimaryPress={() => {
          const fn = globalAlert.onPrimaryPress;
          hideAlert();
          if (typeof fn === 'function') {
            setTimeout(fn, 150);
          }
        }}
        secondaryText={globalAlert.secondaryText}
        onSecondaryPress={() => {
          const fn = globalAlert.onSecondaryPress;
          hideAlert();
          if (typeof fn === 'function') {
            setTimeout(fn, 150);
          }
        }}
        onClose={hideAlert}
      />
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  return ctx || defaultContext;
};
