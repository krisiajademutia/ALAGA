import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { isMockFirebase } from '../config/firebaseConfig';

const CONVERSATIONS_COLLECTION = 'conversations';

/**
 * Real-time listener for active user's conversations in Firestore
 * Complies with Firestore security rules by querying only conversations
 * where the authenticated user is listed in the 'participants' array.
 */
export function subscribeToConversations(user, onUpdate, onError) {
  if (isMockFirebase() || !db) return () => {};

  // Conversations are private: require authentication & participant membership
  const currentUid = auth?.currentUser?.uid || user?.id || user?.uid;
  if (!currentUid || !auth?.currentUser) {
    if (onUpdate) onUpdate([]);
    return () => {};
  }

  try {
    const q = query(
      collection(db, CONVERSATIONS_COLLECTION),
      where('participants', 'array-contains', currentUid)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const convos = [];
        snapshot.forEach((docSnap) => {
          convos.push({
            id: docSnap.id,
            ...docSnap.data(),
          });
        });
        if (onUpdate) onUpdate(convos);
      },
      (error) => {
        console.warn('[chatService] Conversations snapshot notice:', error?.message || error);
        if (onError) onError(error);
      }
    );
  } catch (err) {
    console.warn('[chatService] Setup error:', err);
    return () => {};
  }
}

/**
 * Real-time listener for messages in a conversation's subcollection.
 * Matches Firestore rule: conversations/{convId}/messages/{msgId}
 * allow read, create: if isAuthenticated();
 */
export function subscribeToMessages(conversationId, onUpdate, onError) {
  if (isMockFirebase() || !db || !conversationId) return () => {};
  if (!auth?.currentUser) {
    if (onUpdate) onUpdate([]);
    return () => {};
  }

  try {
    const q = query(
      collection(db, CONVERSATIONS_COLLECTION, conversationId, 'messages'),
      orderBy('time', 'asc')
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const msgs = [];
        snapshot.forEach((docSnap) => {
          msgs.push({ id: docSnap.id, ...docSnap.data() });
        });
        if (onUpdate) onUpdate(msgs);
      },
      (error) => {
        console.warn('[chatService] Messages snapshot notice:', error?.message || error);
        if (onError) onError(error);
      }
    );
  } catch (err) {
    console.warn('[chatService] Messages listener setup error:', err);
    return () => {};
  }
}

/**
 * Save a single message to the conversations/{convId}/messages subcollection.
 * Matches Firestore rule: allow create: if isAuthenticated();
 */
export async function saveMessageFirebase(conversationId, message) {
  if (isMockFirebase() || !db || !conversationId || !message) return { isMock: true };
  if (!auth?.currentUser) return { error: 'Not authenticated' };

  try {
    const msgId = message.id || `m${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const docRef = doc(db, CONVERSATIONS_COLLECTION, conversationId, 'messages', msgId);
    await setDoc(docRef, {
      ...message,
      id: msgId,
      timestamp: serverTimestamp(),
    });
    return { success: true, id: msgId };
  } catch (err) {
    console.warn('[chatService] Failed to save message:', err?.message || err);
    return { error: err.message };
  }
}

/**
 * Save or update a conversation document in Firestore.
 * Strips the `messages` array before saving — messages live in the subcollection.
 */
export async function saveConversationFirebase(convoData) {
  if (isMockFirebase() || !db || !convoData?.id) {
    return { isMock: true };
  }

  const currentUid = auth?.currentUser?.uid;
  let participants = Array.isArray(convoData.participants) ? [...convoData.participants] : [];
  if (currentUid && !participants.includes(currentUid)) {
    participants.push(currentUid);
  }

  // Strip messages array — individual messages belong in the subcollection
  const { messages: _stripped, ...convoMeta } = convoData; // eslint-disable-line no-unused-vars

  try {
    const docRef = doc(db, CONVERSATIONS_COLLECTION, convoData.id);
    await setDoc(docRef, { ...convoMeta, participants }, { merge: true });
    return { success: true };
  } catch (err) {
    console.warn('[chatService] Failed to save conversation:', err?.message || err);
    return { error: err.message };
  }
}

/**
 * Mark a conversation as read for a specific user in Firestore
 */
export async function markConversationReadFirebase(conversationId, userId) {
  if (isMockFirebase() || !db || !conversationId || !userId) return;

  try {
    const docRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
    await updateDoc(docRef, {
      [`unreadCounts.${userId}`]: 0,
    });
  } catch (err) {
    // If updateDoc fails (e.g. document doesn't exist yet in firestore), ignore
    console.warn('[chatService] Failed to mark conversation read:', err);
  }
}

/**
 * Delete a conversation in Firestore
 */
export async function deleteConversationFirebase(conversationId) {
  if (isMockFirebase() || !db || !conversationId) return;

  try {
    const docRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('[chatService] Failed to delete conversation:', err);
  }
}
