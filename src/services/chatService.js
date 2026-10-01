import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { isMockFirebase } from '../config/firebaseConfig';

const CONVERSATIONS_COLLECTION = 'conversations';

/**
 * Recursively strip undefined properties and internal keys so Firestore never
 * throws 'Unsupported field value: undefined'.
 */
function sanitizeForFirestore(obj) {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item));
  }
  // If it's a Firestore FieldValue like serverTimestamp(), preserve it intact
  if (obj._methodName || (obj.constructor && obj.constructor.name === 'FieldValue')) {
    return obj;
  }
  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      clean[key] = typeof value === 'object' && value !== null ? sanitizeForFirestore(value) : value;
    }
  }
  return clean;
}

/**
 * Real-time listener for active user's conversations in Firestore
 * Queries conversations where the user is listed in the 'participants' array.
 */
export function subscribeToConversations(user, onUpdate, onError) {
  if (isMockFirebase() || !db) return () => {};

  const activeUid = user?.id || user?.uid || auth?.currentUser?.uid;
  if (!activeUid) {
    return () => {};
  }

  try {
    const q = query(
      collection(db, CONVERSATIONS_COLLECTION),
      where('participants', 'array-contains', activeUid)
    );
    const unsubscribeSnapshot = onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snapshot) => {
        const convos = [];
        snapshot.forEach((docSnap) => {
          convos.push({ id: docSnap.id, ...docSnap.data() });
        });
        onUpdate?.(convos, { fromCache: snapshot.metadata?.fromCache === true });
      },
      (error) => {
        console.warn('[chatService] Conversations snapshot notice:', error?.code, error?.message || error);
        onError?.(error);
      }
    );
    return () => {
      unsubscribeSnapshot?.();
    };
  } catch (err) {
    console.warn('[chatService] Setup error for conversations listener:', err);
    return () => {};
  }
}

/**
 * Real-time listener for messages in a conversation's subcollection.
 */
export function subscribeToMessages(conversationId, onUpdate, onError) {
  if (isMockFirebase() || !db || !conversationId) {
    return () => {};
  }

  try {
    const q = query(
      collection(db, CONVERSATIONS_COLLECTION, conversationId, 'messages'),
      orderBy('time', 'asc')
    );
    const unsubscribeSnapshot = onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snapshot) => {
        const msgs = [];
        snapshot.forEach((docSnap) => msgs.push({ id: docSnap.id, ...docSnap.data() }));
        onUpdate?.(msgs, { fromCache: snapshot.metadata?.fromCache === true });
      },
      (error) => {
        console.warn('[chatService] Messages snapshot notice:', error?.code, error?.message || error);
        onError?.(error);
      }
    );
    return () => {
      unsubscribeSnapshot?.();
    };
  } catch (err) {
    console.warn('[chatService] Messages listener setup error:', err);
    return () => {};
  }
}

/**
 * Save a single message to the conversations/{convId}/messages subcollection.
 */
export async function saveMessageFirebase(conversationId, message, activeUserId = null) {
  if (isMockFirebase() || !db || !conversationId || !message) return { isMock: true };

  const type = message.type || 'text';
  const hasContent = type === 'text'
    ? Boolean(String(message.text || '').trim())
    : type === 'image' || type === 'video' || type === 'gif'
      ? Boolean(message.mediaUri)
      : type === 'location'
        ? Boolean(message.location)
        : type === 'report_link'
          ? Boolean(message.reportId && String(message.text || '').trim())
          : Boolean(String(message.text || '').trim());
  if (!hasContent) return { error: 'Message has no content' };

  try {
    const msgId = message.id || `m${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const docRef = doc(db, CONVERSATIONS_COLLECTION, conversationId, 'messages', msgId);
    const rawData = {
      ...message,
      id: msgId,
      time: message.time || new Date().toISOString(),
      timestamp: serverTimestamp(),
    };
    delete rawData._pending;
    const cleanMsg = sanitizeForFirestore(rawData);
    await setDoc(docRef, cleanMsg);
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
export async function saveConversationFirebase(convoData, activeUserId = null) {
  if (isMockFirebase() || !db || !convoData?.id) {
    return { isMock: true };
  }

  let participants = Array.isArray(convoData.participants) ? [...convoData.participants] : [];
  if (participants.length === 0) {
    const currentUid = activeUserId || convoData.lastSenderId || auth?.currentUser?.uid;
    if (currentUid) {
      participants.push(currentUid);
    }
  }

  // Strip messages array — individual messages belong in the subcollection
  const { messages: _stripped, ...convoMeta } = convoData; // eslint-disable-line no-unused-vars

  try {
    const docRef = doc(db, CONVERSATIONS_COLLECTION, convoData.id);
    const cleanData = sanitizeForFirestore({ ...convoMeta, participants });
    await setDoc(docRef, cleanData, { merge: true });
    return { success: true };
  } catch (err) {
    console.warn('[chatService] Failed to save conversation:', err?.message || err);
    return { error: err.message };
  }
}

/** Save message and its conversation metadata as one atomic batch operation. */
export async function saveConversationMessageFirebase(convoData, message, activeUserId = null) {
  if (isMockFirebase() || !db || !convoData?.id || !message) return { isMock: true };

  const type = message.type || 'text';
  const hasContent = type === 'text'
    ? Boolean(String(message.text || '').trim())
    : type === 'image' || type === 'video' || type === 'gif'
      ? Boolean(message.mediaUri)
      : type === 'location'
        ? Boolean(message.location)
        : type === 'report_link'
          ? Boolean(message.reportId && String(message.text || '').trim())
          : Boolean(String(message.text || '').trim());
  if (!hasContent) return { error: 'Message has no content' };

  try {
    const senderUid = activeUserId || message.senderId || convoData.lastSenderId || auth?.currentUser?.uid;
    const participants = Array.isArray(convoData.participants) ? [...convoData.participants] : [];
    if (senderUid && !participants.includes(senderUid)) {
      participants.push(senderUid);
    }
    const { messages: _stripped, ...convoMeta } = convoData; // eslint-disable-line no-unused-vars
    const msgId = message.id || `m${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const convoRef = doc(db, CONVERSATIONS_COLLECTION, convoData.id);
    const msgRef = doc(db, CONVERSATIONS_COLLECTION, convoData.id, 'messages', msgId);

    const cleanConvoMeta = sanitizeForFirestore({ ...convoMeta, participants });
    const rawMsg = {
      ...message,
      id: msgId,
      time: message.time || new Date().toISOString(),
      timestamp: serverTimestamp(),
    };
    delete rawMsg._pending;
    const cleanMsg = sanitizeForFirestore(rawMsg);

    const batch = writeBatch(db);
    batch.set(convoRef, cleanConvoMeta, { merge: true });
    batch.set(msgRef, cleanMsg);
    await batch.commit();
    return { success: true, id: msgId };
  } catch (err) {
    console.warn('[chatService] Failed to save conversation and message:', err?.message || err);
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
    if (err?.code !== 'not-found') {
      console.warn('[chatService] Failed to mark conversation read:', err);
    }
  }
}

/**
 * Clear all messages in a conversation's messages subcollection in Firestore (best-effort)
 */
export async function clearConversationMessagesFirebase(conversationId) {
  if (isMockFirebase() || !db || !conversationId) return { isMock: true };

  try {
    const msgsColl = collection(db, CONVERSATIONS_COLLECTION, conversationId, 'messages');
    const snapshot = await getDocs(msgsColl);
    if (!snapshot.empty) {
      const deletePromises = snapshot.docs.map((d) => deleteDoc(d.ref).catch(() => {}));
      await Promise.all(deletePromises);
    }
    return { success: true };
  } catch (_err) {
    return { success: false };
  }
}

/**
 * Delete a conversation in Firestore and clean up all its subcollection messages
 */
export async function deleteConversationFirebase(conversationId) {
  if (isMockFirebase() || !db || !conversationId) return { isMock: true };

  try {
    await clearConversationMessagesFirebase(conversationId);
    const docRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
    await deleteDoc(docRef);
    return { success: true };
  } catch (err) {
    try {
      const docRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
      await updateDoc(docRef, {
        lastMessage: '',
        lastMessageTime: new Date().toISOString(),
      });
    } catch (_fallbackErr) {}
    return { error: err?.message };
  }
}
