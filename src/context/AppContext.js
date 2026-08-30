import React, { createContext, useContext, useState } from 'react';
import {
  MOCK_USERS,
  MOCK_RESCUE_REPORTS,
  MOCK_ANIMALS,
  MOCK_REQUESTS,
  MOCK_CONVERSATIONS,
  MOCK_DONATIONS,
  MOCK_NOTIFICATIONS,
} from '../data/mockData';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState(MOCK_USERS);
  const [rescueReports, setRescueReports] = useState(MOCK_RESCUE_REPORTS);
  const [animals, setAnimals] = useState(MOCK_ANIMALS);
  const [requests, setRequests] = useState(MOCK_REQUESTS);
  const [conversations, setConversations] = useState(MOCK_CONVERSATIONS);
  const [donations, setDonations] = useState(MOCK_DONATIONS);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  // ── Auth ──────────────────────────────────────────────────────────────────
  const login = (email, password) => {
    const user = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (user) {
      setCurrentUser(user);
      return { success: true, user };
    }
    return { success: false, error: 'Invalid email or password.' };
  };

  const register = (data) => {
    const exists = users.find((u) => u.email.toLowerCase() === data.email.toLowerCase());
    if (exists) return { success: false, error: 'Email already registered.' };
    const newUser = {
      id: `u${Date.now()}`,
      ...data,
      avatar: null,
      joinedAt: new Date().toISOString().split('T')[0],
      ...(data.role === 'advocate' ? { rescueCount: 0 } : {}),
    };
    setUsers((prev) => [...prev, newUser]);
    setCurrentUser(newUser);
    return { success: true, user: newUser };
  };

  const logout = () => setCurrentUser(null);

  // ── Update current user profile ───────────────────────────────────────────
  const updateUser = (updates) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === currentUser.id ? { ...u, ...updates } : u))
    );
    setCurrentUser((prev) => ({ ...prev, ...updates }));
  };

  // ── Rescue Reports ────────────────────────────────────────────────────────
  const addRescueReport = (reportData) => {
    const newReport = {
      id: `r${Date.now()}`,
      reporterId: currentUser.id,
      reporterName: currentUser.name,
      status: 'Open',
      createdAt: new Date().toISOString(),
      responderId: null,
      comments: [],
      ...reportData,
    };
    setRescueReports((prev) => [newReport, ...prev]);
    return newReport;
  };

  const respondToReport = (reportId) => {
    setRescueReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? { ...r, status: 'Responded', responderId: currentUser.id }
          : r
      )
    );
  };

  const markRescued = (reportId) => {
    setRescueReports((prev) =>
      prev.map((r) =>
        r.id === reportId ? { ...r, status: 'Rescued' } : r
      )
    );
  };

  const addComment = (reportId, text) => {
    const newComment = {
      id: `c${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      text,
      createdAt: new Date().toISOString(),
    };
    setRescueReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? { ...r, comments: [...r.comments, newComment] }
          : r
      )
    );
  };

  // ── Animal Profiles ───────────────────────────────────────────────────────
  const addAnimal = (animalData) => {
    const newAnimal = {
      id: `a${Date.now()}`,
      advocateId: currentUser.id,
      advocateName: currentUser.name,
      createdAt: new Date().toISOString(),
      fosterId: null,
      fosterName: null,
      ...animalData,
    };
    setAnimals((prev) => [newAnimal, ...prev]);
    return newAnimal;
  };

  const updateAnimal = (animalId, updates) => {
    setAnimals((prev) =>
      prev.map((a) => (a.id === animalId ? { ...a, ...updates } : a))
    );
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
  };

  // ── Adoption / Foster Requests ────────────────────────────────────────────
  const submitRequest = (requestData) => {
    const newRequest = {
      id: `req${Date.now()}`,
      requesterId: currentUser.id,
      requesterName: currentUser.name,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      ...requestData,
    };
    setRequests((prev) => [newRequest, ...prev]);
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
    animals.filter((a) => a.advocateId === currentUser?.id);

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
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
};
