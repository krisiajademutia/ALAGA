import React, { createContext, useContext, useState, useEffect } from 'react';
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
  submitDonation: () => {},
  getUserConversations: () => [],
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

  // ── Firebase Real-Time Synchronization ─────────────────────────────────────
  useEffect(() => {
    if (!isMockFirebase()) {
      // Public feeds (Rescue alerts and Adoptable animals)
      const unsubRescues = subscribeToRescueReports((liveReports) => {
        setRescueReports(liveReports || []);
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

  // ── Rescue Reports ────────────────────────────────────────────────────────
  const addRescueReport = (reportData) => {
    const newReport = {
      id: `r${Date.now()}`,
      reporterId: currentUser?.id || 'u_anon',
      reporterName: currentUser?.name || 'Community Member',
      status: 'Open',
      createdAt: new Date().toISOString(),
      responderId: null,
      comments: [],
      ...reportData,
    };
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
    return newRequest;
  };

  const updateRequestStatus = (requestId, status) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status } : r))
    );
    // When approved: update the animal's status accordingly
    if (status === 'Approved') {
      const req = requests.find((r) => r.id === requestId);
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
  const sendMessage = (conversationId, text) => {
    const newMsg = {
      id: `m${Date.now()}`,
      senderId: currentUser.id,
      text,
      time: new Date().toISOString(),
    };
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? { ...c, messages: [...c.messages, newMsg], lastMessage: text, lastMessageTime: newMsg.time }
          : c
      )
    );
  };

  const startConversation = (otherUserId, otherUserName, initialMessage) => {
    const existing = conversations.find(
      (c) =>
        c.participants.includes(currentUser.id) &&
        c.participants.includes(otherUserId)
    );
    if (existing) {
      sendMessage(existing.id, initialMessage);
      return existing.id;
    }
    const newConv = {
      id: `conv${Date.now()}`,
      participants: [currentUser.id, otherUserId],
      participantNames: {
        [currentUser.id]: currentUser.name,
        [otherUserId]: otherUserName,
      },
      lastMessage: initialMessage,
      lastMessageTime: new Date().toISOString(),
      messages: [
        {
          id: `m${Date.now()}`,
          senderId: currentUser.id,
          text: initialMessage,
          time: new Date().toISOString(),
        },
      ],
    };
    setConversations((prev) => [newConv, ...prev]);
    return newConv.id;
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
      .filter((n) => n.userId === currentUser?.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const getUnreadCount = () =>
    notifications.filter((n) => n.userId === currentUser?.id && !n.read).length;

  const markNotificationRead = (notifId) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) =>
      prev.map((n) => (n.userId === currentUser?.id ? { ...n, read: true } : n))
    );
  };

  const pushNotification = (notifData) => {
    setNotifications((prev) => [
      {
        id: `n${Date.now()}`,
        createdAt: new Date().toISOString(),
        read: false,
        ...notifData,
      },
      ...prev,
    ]);
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
        // donations
        submitDonation,
        // helpers
        getUserConversations,
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
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  return ctx || defaultContext;
};
