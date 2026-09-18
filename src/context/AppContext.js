import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  loginWithFirebase,
  registerWithFirebase,
  logoutFromFirebase,
  updateUserProfile,
  loginWithGoogleCredential,
  loginWithGoogleProfile,
} from '../services/authService';
import {
  subscribeToRescueReports,
  createRescueReportFirebase,
  claimRescueReportFirebase,
  markReportRescuedFirebase,
  addRescueCommentFirebase,
} from '../services/rescueService';
import {
  subscribeToAnimals,
  addAnimalFirebase,
  updateAnimalFirebase,
  subscribeToApplications,
  submitApplicationFirebase,
} from '../services/animalService';
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
  addRescueReport: () => {},
  respondToReport: () => {},
  markRescued: () => {},
  addComment: () => {},
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
  submitDonation: () => {},
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
  const mySubmittedReportIds = useRef(new Set());

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // Robust check to determine if a report was filed by the current user
  const isOwnReport = (report, user) => {
    if (!report || !user) return false;
    const uId = user.id || user.uid;

    // 1. Locally submitted on this device session
    if (mySubmittedReportIds.current && report.id && mySubmittedReportIds.current.has(report.id)) {
      return true;
    }
    // 2. Exact match against user ID or UID
    if (
      report.reporterId &&
      (report.reporterId === uId ||
        report.reporterId === user.id ||
        report.reporterId === user.uid)
    ) {
      return true;
    }
    // 3. Email match
    if (
      user.email &&
      report.reporterEmail &&
      user.email.trim().toLowerCase() === report.reporterEmail.trim().toLowerCase()
    ) {
      return true;
    }
    // 4. Name match as fallback if present
    if (
      user.name &&
      report.reporterName &&
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
      return;
    }

    // 2. On web (where native phone system notifications are unavailable), show the in-app banner component
    setInAppBanner({
      id: String(Date.now()),
      title,
      message,
      report,
      type,
      onPress,
    });
  };

  const hideInAppNotification = () => {
    setInAppBanner(null);
  };

  const getOpenAlertsCount = () =>
    rescueReports.filter((r) => r.status === 'Open').length;

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

  // ── Firebase Real-Time Synchronization ─────────────────────────────────────
  useEffect(() => {
    if (!isMockFirebase()) {
      // Public feeds (Rescue alerts and Adoptable animals)
      const unsubRescues = subscribeToRescueReports((liveReports) => {
        const reportsList = Array.isArray(liveReports) ? liveReports : [];

        // 1. Initial snapshot on app startup: hydrate database feed without firing alert popups
        if (isInitialRescuesLoad.current) {
          isInitialRescuesLoad.current = false;
          setRescueReports(reportsList);
          return;
        }

        const activeUser = currentUserRef.current;
        // 2. Do not trigger push notifications if user is not authenticated (e.g. on onboarding/splash/login)
        if (!activeUser) {
          setRescueReports(reportsList);
          return;
        }

        // 3. Subsequent real-time arrivals: notify advocates and other users (never the reporter)
        setRescueReports((prev) => {
          const existingIds = new Set(prev.map((r) => r.id));
          reportsList.forEach((rep) => {
            if (
              !existingIds.has(rep.id) &&
              rep.status === 'Open' &&
              !isOwnReport(rep, activeUser)
            ) {
              triggerRescueAlertNotification(rep);
            }
          });
          return reportsList;
        });
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

  // User-specific applications listener (runs only when authenticated)
  useEffect(() => {
    if (!isMockFirebase() && currentUser) {
      const unsubApps = subscribeToApplications(currentUser, (liveApps) => {
        setRequests(liveApps || []);
      });
      return () => unsubApps();
    } else {
      setRequests([]);
    }
  }, [currentUser]);

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
  };

  // ── Update current user profile ───────────────────────────────────────────
  const updateUser = (updates) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === currentUser?.id ? { ...u, ...updates } : u))
    );
    setCurrentUser((prev) => ({ ...prev, ...updates }));
    if (currentUser?.id) {
      updateUserProfile(currentUser.id, updates);
    }
  };

  // ── Emergency Rescue Alert Broadcaster ──────────────────────────────────
  const triggerRescueAlertNotification = async (report) => {
    if (!report) return;

    const activeUser = currentUserRef.current;
    // Strictly guard: never trigger notifications if user is unauthenticated (e.g. on splash or onboarding)
    if (!activeUser) return;
    // Strictly guard: NEVER notify the user who posted the report
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
        } catch (e) {
          // ignore
        }
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

    // 1. Trigger notification: phone OS system notification on mobile, in-app banner on web
    if (Platform.OS !== 'web') {
      notifyNearbyRescueAlert({ report, distanceKm: distance });
    } else {
      showInAppNotification({
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

    // 2. Add to notifications feed (increments bell badge count)
    pushNotification({
      userId: activeUser.id,
      title: titleText,
      message: descText,
      body: descText,
      type: 'rescue',
      reportId: report.id,
      icon: 'shield-alert-outline',
      iconBg: '#FDF0ED',
      iconColor: '#C23E3E',
      distanceKm: distance,
    });
  };

  // ── Rescue Reports ────────────────────────────────────────────────────────
  const addRescueReport = (reportData) => {
    const reportId = reportData?.id || `r${Date.now()}`;
    const newReport = {
      id: reportId,
      reporterId: currentUser?.id || currentUser?.uid || 'u_anon',
      reporterName: currentUser?.name || 'Community Member',
      reporterEmail: currentUser?.email || '',
      status: 'Open',
      createdAt: new Date().toISOString(),
      responderId: null,
      comments: [],
      ...reportData,
    };
    // Mark as locally submitted so this device never alerts itself
    mySubmittedReportIds.current.add(reportId);
    if (newReport.id) {
      mySubmittedReportIds.current.add(newReport.id);
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
    setAnimals((prev) =>
      prev.map((a) => (a.id === animalId ? { ...a, ...updates } : a))
    );
    updateAnimalFirebase(animalId, updates);
  };

  // Return a fostered animal back to available listings
  const returnAnimalToListings = (animalId) => {
    setAnimals((prev) =>
      prev.map((a) =>
        a.id === animalId
          ? { ...a, status: 'Available', fosterId: null, fosterName: null }
          : a
      )
    );
    updateAnimalFirebase(animalId, { status: 'Available', fosterId: null, fosterName: null });
  };

  // Permanently mark an animal as adopted
  const markAnimalAdopted = (animalId) => {
    setAnimals((prev) =>
      prev.map((a) =>
        a.id === animalId
          ? { ...a, status: 'Adopted', fosterId: null, fosterName: null }
          : a
      )
    );
    updateAnimalFirebase(animalId, { status: 'Adopted', fosterId: null, fosterName: null });
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
        setAnimals((prev) =>
          prev.map((a) => {
            if (a.id !== req.animalId) return a;
            if (req.type === 'Adoption') {
              return { ...a, status: 'Adopted', fosterId: null, fosterName: null };
            }
            if (req.type === 'Foster') {
              return { ...a, status: 'Being Fostered', fosterId: req.requesterId, fosterName: req.requesterName };
            }
            return a;
          })
        );
      }
    }
  };

  // ── Messaging ─────────────────────────────────────────────────────────────
  const sendMessage = (conversationId, messageData) => {
    if (!conversationId || !messageData) return;
    let newMsg;
    if (typeof messageData === 'string') {
      const trimmed = messageData.trim();
      if (!trimmed) return;
      newMsg = {
        id: `m${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        senderId: currentUser.id,
        text: trimmed,
        type: 'text',
        time: new Date().toISOString(),
      };
    } else {
      newMsg = {
        id: `m${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        senderId: currentUser.id,
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

    const isFromOther = newMsg.senderId !== currentUser?.id;

    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              messages: [...c.messages, newMsg],
              lastMessage: lastSummary,
              lastMessageTime: newMsg.time,
              lastSenderId: newMsg.senderId,
              unreadCount: isFromOther ? (c.unreadCount || 0) + 1 : (c.unreadCount || 0),
              unread: isFromOther || c.unread,
            }
          : c
      )
    );

    if (isFromOther) {
      const convo = conversations.find((c) => c.id === conversationId);
      const senderName = convo?.participantNames?.[newMsg.senderId] || 'ALAGA Member';
      if (Platform.OS !== 'web') {
        notifyNewMessage({
          senderName,
          messageText: lastSummary,
          conversationId,
        });
      } else {
        showInAppNotification({
          title: `Message from ${senderName}`,
          message: lastSummary,
          type: 'message',
          onPress: () => {
            navigate('Chat', { conversationId, userName: senderName });
          },
        });
      }
      pushNotification({
        userId: currentUser?.id,
        title: `Message from ${senderName}`,
        message: lastSummary,
        body: lastSummary,
        type: 'chat',
        icon: 'chatbubble-outline',
        iconBg: '#EBF4F8',
        iconColor: '#2A728F',
        conversationId,
      });
    }
  };

  const startConversation = (otherUserId, otherUserName) => {
    if (!otherUserId || !currentUser?.id) return '';
    const existing = conversations.find(
      (c) =>
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
        [currentUser.id]: currentUser.name,
        [otherUserId]: otherUserName || 'Community Member',
      },
      lastMessage: '',
      lastMessageTime: new Date().toISOString(),
      messages: [],
    };
    setConversations((prev) => [newConv, ...prev]);
    return newConv.id;
  };

  const clearConversation = (conversationId) => {
    if (!conversationId) return;
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? { ...c, messages: [], lastMessage: '', lastMessageTime: new Date().toISOString() }
          : c
      )
    );
  };

  const deleteConversation = (conversationId) => {
    if (!conversationId) return;
    setConversations((prev) => prev.filter((c) => c.id !== conversationId));
  };

  // ── Donations ─────────────────────────────────────────────────────────────
  const submitDonation = (donationData) => {
    const newDonation = {
      id: `d${Date.now()}`,
      donorId: currentUser.id,
      donorName: currentUser.name,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      ...donationData,
    };
    setDonations((prev) => [newDonation, ...prev]);
    return newDonation;
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getUserConversations = () =>
    conversations.filter((c) => c.participants.includes(currentUser?.id));

  const getUnreadMessagesCount = () =>
    getUserConversations().reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  const markConversationRead = (conversationId) => {
    if (!conversationId) return;
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId ? { ...c, unreadCount: 0, unread: false } : c
      )
    );
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

  const pushNotification = (notifData) => {
    const newNotif = {
      id: `n${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
      read: false,
      userId: notifData.userId || currentUser?.id || 'all',
      title: notifData.title || 'Notification',
      body: notifData.body || notifData.message || '',
      message: notifData.body || notifData.message || '',
      type: notifData.type || 'rescue',
      icon: notifData.icon || (notifData.type === 'rescue' ? 'alert-circle' : notifData.type === 'chat' ? 'chatbubble' : 'notifications'),
      iconBg: notifData.iconBg || (notifData.type === 'rescue' ? '#FDE8E7' : notifData.type === 'chat' ? '#E0F2FA' : '#FEF3E2'),
      iconColor: notifData.iconColor || (notifData.type === 'rescue' ? '#D93025' : notifData.type === 'chat' ? '#206B82' : '#F5A623'),
      timeAgo: 'Just now',
      section: 'TODAY',
      ...notifData,
    };
    setNotifications((prev) => [newNotif, ...prev]);
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
        // donations
        submitDonation,
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
