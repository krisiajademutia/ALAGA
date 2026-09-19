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
} from '../services/authService';
import {
  subscribeToRescueReports,
  createRescueReportFirebase,
  claimRescueReportFirebase,
  markReportRescuedFirebase,
  addRescueCommentFirebase,
  updateRescueReportUrgencyFirebase,
} from '../services/rescueService';
import {
  subscribeToAnimals,
  addAnimalFirebase,
  updateAnimalFirebase,
  subscribeToApplications,
  submitApplicationFirebase,
  updateApplicationFirebase,
} from '../services/animalService';
import {
  subscribeToConversations,
  saveConversationFirebase,
  markConversationReadFirebase,
  deleteConversationFirebase,
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
  respondToReport: () => {},
  markRescued: () => {},
  addComment: () => {},
  updateRescueReportUrgency: () => {},
  addAnimal: () => {},
  updateAnimal: () => {},
  returnAnimalToListings: () => {},
  markAnimalAdopted: () => {},
  submitRequest: () => {},
  updateRequestStatus: () => {},
  sendMessage: () => {},
  startConversation: () => '',
  clearConversation: () => {},
  deleteConversation: () => {},
  setActiveConversationId: () => {},
  submitDonation: () => {},
  verifyDonation: () => {},
  getUserConversations: () => [],
  getUnreadMessagesCount: () => 0,
  markConversationRead: () => {},
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
  pushNotification: () => {},
  getAdvocateRescuedCases: () => [],
  getOpenAlertsCount: () => 0,
  showInAppNotification: () => {},
  hideInAppNotification: () => {},
  showAlert: () => {},
  hideAlert: () => {},
};

const AppContext = createContext(defaultContext);

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [rescueReports, setRescueReports] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [requests, setRequests] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [donations, setDonations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [inAppBanner, setInAppBanner] = useState(null);

  const isInitialRescuesLoad = useRef(true);
  const currentUserRef = useRef(currentUser);
  const mySubmittedReportIds = useRef(new Map()); // Map<reportId, authorUserId>
  const notifiedReportIdsRef = useRef(new Set()); // Set of report IDs that have triggered phone alerts for active user
  const notifiedMessageIdsRef = useRef(new Set()); // Set of message IDs that have triggered alerts
  const activeConversationIdRef = useRef(null); // ID of chat screen currently active/focused
  const userProfilesCacheRef = useRef(new Map()); // In-memory cache of fetched user profiles to prevent re-render loops

  const setActiveConversationId = (id) => {
    activeConversationIdRef.current = id;
  };

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
    rescueReports.filter((r) => r.status === 'Open').length;

  const pushNotification = (notifData) => {
    const notifId = notifData.id || `n${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newNotif = {
      id: notifId,
      createdAt: notifData.createdAt || new Date().toISOString(),
      read: false,
      userId: notifData.userId || currentUser?.id || 'all',
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
    setNotifications((prev) => {
      if (
        prev.some(
          (n) =>
            n.id === newNotif.id ||
            (newNotif.reportId && n.reportId === newNotif.reportId && n.userId === newNotif.userId)
        )
      ) {
        return prev;
      }
      return [newNotif, ...prev];
    });
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
    if (!user || !user.id || !Array.isArray(reports) || reports.length === 0) return;
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

      // 2. If this user has not yet received a system/popup alert for this report on this device:
      if (!notifiedReportIdsRef.current.has(rep.id)) {
        notifiedReportIdsRef.current.add(rep.id);
        hasNewToPersist = true;

        // Trigger phone system notification (pull-down shade) + animated in-app toast banner
        triggerRescueAlertNotification(rep);
      }
    }

    if (hasNewToPersist) {
      const arr = Array.from(notifiedReportIdsRef.current);
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
      if (data?.type === 'rescue' && data.reportId) {
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
        setRescueReports(reportsList);

        const activeUser = currentUserRef.current;
        if (activeUser) {
          syncRescueAlertNotifications(activeUser, reportsList);
        }
      });

      const unsubAnimals = subscribeToAnimals((liveAnimals) => {
        setAnimals(liveAnimals || []);
      });

      return () => {
        unsubRescues();
        unsubAnimals();
      };
    }
  }, []);

  // Sync rescue alert & message notifications whenever the logged-in user changes
  useEffect(() => {
    if (currentUser?.id) {
      notifiedReportIdsRef.current.clear();
      notifiedMessageIdsRef.current.clear();

      const storageKey = `@alaga_notified_reports_${currentUser.id}`;
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

      const msgKey = `@alaga_notified_messages_${currentUser.id}`;
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
  }, [currentUser?.id]);

  // User-specific applications, conversations & donations listener (runs only when authenticated)
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
      return () => {
        unsubApps?.();
        unsubConvos?.();
        unsubDonations?.();
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
      return { success: true, user: fbResult.user };
    }
    return { success: false, error: fbResult.error || 'Invalid email or password.' };
  };

  const register = async (data) => {
    const fbResult = await registerWithFirebase(data);
    if (fbResult.success) {
      setCurrentUser(fbResult.user);
      setUsers((prev) => [...prev, fbResult.user]);
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
      setUsers((prev) => {
        const exists = prev.some((u) => u.id === result.user.id);
        return exists ? prev : [...prev, result.user];
      });
      return { success: true, user: result.user };
    }
    return { success: false, error: result.error || 'Google login failed' };
  };

  const logout = () => {
    logoutFromFirebase();
    setCurrentUser(null);
    mySubmittedReportIds.current.clear();
    notifiedReportIdsRef.current.clear();
    notifiedMessageIdsRef.current.clear();
    activeConversationIdRef.current = null;
  };

  // ── Update current user profile ───────────────────────────────────────────
  const updateUser = async (updates) => {
    setUsers((prev) => {
      const exists = (prev || []).some((u) => u.id === currentUser?.id);
      if (exists) {
        return prev.map((u) => (u.id === currentUser?.id ? { ...u, ...updates } : u));
      }
      return [...(prev || []), { ...currentUser, ...updates }];
    });
    setCurrentUser((prev) => ({ ...prev, ...updates }));
    if (currentUser?.id) {
      userProfilesCacheRef.current.delete(currentUser.id);
      await updateUserProfile(currentUser.id, updates);
    }
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
      return existing;
    }
    const remote = await getUserProfileFirebase(userId);
    if (remote) {
      userProfilesCacheRef.current.set(userId, remote);
      return remote;
    }
    return existing || null;
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
      status: 'Open',
      createdAt: new Date().toISOString(),
      responderId: null,
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

  const respondToReport = (reportId) => {
    setRescueReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? {
              ...r,
              status: 'Responded',
              responderId: currentUser?.id,
              responderName: currentUser?.name,
            }
          : r
      )
    );
    claimRescueReportFirebase(reportId, currentUser?.id, currentUser?.name);
  };

  const markRescued = (reportId) => {
    setRescueReports((prev) =>
      prev.map((r) =>
        r.id === reportId ? { ...r, status: 'Rescued' } : r
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
    const newComment = {
      id: `c${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      userId: currentUser?.id || 'u_anon',
      userName: currentUser?.name || 'Community Member',
      text,
      createdAt: new Date().toISOString(),
      replies: [],
    };
    setRescueReports((prev) =>
      prev.map((r) => {
        if (r.id !== reportId) return r;
        if (!parentCommentId) {
          return { ...r, comments: [...(r.comments || []), newComment] };
        }
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
        return { ...r, comments: appendReply(r.comments) };
      })
    );
    addRescueCommentFirebase(reportId, newComment);
  };

  // ── Animal Profiles ───────────────────────────────────────────────────────
  const addAnimal = (animalData) => {
    const newAnimal = {
      id: `a${Date.now()}`,
      advocateId: currentUser?.id || currentUser?.uid || 'u2',
      advocateName: currentUser?.name || 'Elena Ramos',
      advocateEmail: currentUser?.email || null,
      createdAt: new Date().toISOString(),
      fosterId: null,
      fosterName: null,
      ...animalData,
    };
    setAnimals((prev) => [newAnimal, ...prev]);
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
        const lastMsgObj = Array.isArray(convo.messages) && convo.messages.length > 0
          ? convo.messages[convo.messages.length - 1]
          : null;
        const msgKey = lastMsgObj?.id || `${convo.id}_${convo.lastMessageTime}`;

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
              title: `💬 Message from ${senderName}`,
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
            title: `💬 Message from ${senderName}`,
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
        id: `m${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        senderId: uId,
        text: trimmed,
        type: 'text',
        time: new Date().toISOString(),
      };
    } else {
      newMsg = {
        id: `m${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        senderId: uId,
        text: messageData.text || '',
        type: messageData.type || 'text',
        mediaUri: messageData.mediaUri || null,
        location: messageData.location || null,
        duration: messageData.duration || null,
        time: new Date().toISOString(),
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

    let updatedConvo = null;

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

      updatedConvo = {
        ...existing,
        messages: [...(existing.messages || []), newMsg],
        lastMessage: lastSummary,
        lastMessageTime: newMsg.time,
        lastSenderId: newMsg.senderId,
        unreadCounts: nextUnreadCounts,
        unreadCount: (nextUnreadCounts[uId] || 0),
        unread: false, // sender has already read their own message
      };

      return prev.map((c) => (c.id === conversationId ? updatedConvo : c));
    });

    if (updatedConvo) {
      saveConversationFirebase(updatedConvo);
    }
  };

  const startConversation = (otherUserId, otherUserName) => {
    if (!otherUserId || !currentUser?.id) return '';
    const existing = conversations.find(
      (c) =>
        c.participants &&
        c.participants.includes(currentUser.id) &&
        c.participants.includes(otherUserId)
    );
    if (existing) {
      return existing.id;
    }
    const newConv = {
      id: `conv${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      participants: [currentUser.id, otherUserId],
      participantNames: {
        [currentUser.id]: currentUser.name || 'Community Member',
        [otherUserId]: otherUserName || 'Community Member',
      },
      lastMessage: '',
      lastMessageTime: new Date().toISOString(),
      lastSenderId: '',
      messages: [],
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

  const clearConversation = (conversationId) => {
    if (!conversationId) return;
    let updatedConvo = null;
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === conversationId) {
          updatedConvo = { ...c, messages: [], lastMessage: '', lastMessageTime: new Date().toISOString() };
          return updatedConvo;
        }
        return c;
      })
    );
    if (updatedConvo) {
      saveConversationFirebase(updatedConvo);
    }
  };

  const deleteConversation = (conversationId) => {
    if (!conversationId) return;
    setConversations((prev) => prev.filter((c) => c.id !== conversationId));
    deleteConversationFirebase(conversationId);
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
      const notifTitle = '🎁 New Donation Received!';
      const notifBody = `${newDonation.donorName} donated ₱${rawAmount.toLocaleString()} for ${recipientTitle}.`;
      pushNotification({
        userId: advocateId,
        title: notifTitle,
        body: notifBody,
        message: notifBody,
        type: 'donation',
        donationId: newDonation.id,
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
      title: 'Donation Submitted 🐾',
      body: `Thank you! Your donation of ₱${rawAmount.toLocaleString()} for ${recipientTitle} has been recorded (Ref: ${donationData.referenceNumber || 'Cash'}).`,
      message: `Your donation of ₱${rawAmount.toLocaleString()} for ${recipientTitle} has been recorded.`,
      type: 'donation',
      donationId: newDonation.id,
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
      const title = isApproved ? '✅ Donation Verified!' : 'Donation Update';
      const body = isApproved
        ? `Your donation of ₱${donation.amount?.toLocaleString()} for ${donation.animalName || 'ALAGA'} has been verified. Thank you for your generosity! 🐾`
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

  const markConversationRead = (conversationId) => {
    if (!conversationId) return;
    const activeUser = currentUserRef.current || currentUser;
    if (!activeUser?.id) return;
    const uId = activeUser.id;

    setConversations((prev) =>
      prev.map((c) => {
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
      })
    );

    markConversationReadFirebase(conversationId, uId);
  };

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
        });
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
        });
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
        });
      }
      const respId = r?.responderId;
      if (respId && respId !== currentUser?.id && !map.has(respId)) {
        map.set(respId, {
          id: respId,
          name: r.responderName || 'Responding Advocate',
          role: 'advocate',
          location: '',
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
        });
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
    animals.filter((a) => a.advocateId === userId);

  const getUserDonations = () =>
    donations.filter((d) => d.donorId === currentUser?.id);

  const getAdvocateDonations = () =>
    donations.filter((d) => d.advocateId === currentUser?.id || !d.advocateId);

  const getAnimalDonations = (animalId) =>
    donations.filter((d) => d.animalId === animalId);

  // ── Notifications ─────────────────────────────────────────────────────────
  const getUserNotifications = () =>
    notifications
      .filter((n) => !n.userId || n.userId === 'all' || n.userId === currentUser?.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const getUnreadCount = () =>
    notifications.filter(
      (n) => (!n.userId || n.userId === 'all' || n.userId === currentUser?.id) && !n.read
    ).length;

  const markNotificationRead = (notifId) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) =>
      prev.map((n) =>
        !n.userId || n.userId === 'all' || n.userId === currentUser?.id
          ? { ...n, read: true }
          : n
      )
    );
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
        // rescue
        addRescueReport,
        respondToReport,
        markRescued,
        addComment,
        updateRescueReportUrgency,
        // animals
        addAnimal,
        updateAnimal,
        returnAnimalToListings,
        markAnimalAdopted,
        // requests
        submitRequest,
        updateRequestStatus,
        // messages
        sendMessage,
        startConversation,
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
        pushNotification,
        // rescue linking
        getAdvocateRescuedCases,
        // alerts badge and top notifications
        getOpenAlertsCount,
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
