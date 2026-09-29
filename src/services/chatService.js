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

async function getAuthenticatedFirebaseUser() {
  if (!auth) return null;
  // Native Firebase Auth restores its AsyncStorage session asynchronously. Wait
  // for that first restore before treating the user as signed out.
  if (typeof auth.authStateReady === 'function') {
    await auth.authStateReady();
  }
  return auth.currentUser || null;
}

/**
 * Real-time listener for active user's conversations in Firestore
 * Complies with Firestore security rules by querying only conversations
 * where the authenticated user is listed in the 'participants' array.
 */
export function subscribeToConversations(user, onUpdate, onError) {
  if (isMockFirebase() || !db) return () => {};
  let cancelled = false;
  let unsubscribeSnapshot = null;

  getAuthenticatedFirebaseUser().then((firebaseUser) => {
    if (cancelled) return;
    if (!firebaseUser) {
      onUpdate?.([], { fromCache: false });
      return;
    }

    const q = query(
      collection(db, CONVERSATIONS_COLLECTION),
      where('participants', 'array-contains', firebaseUser.uid)
    );
    unsubscribeSnapshot = onSnapshot(
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
  }).catch((error) => {
    if (!cancelled) onError?.(error);
  });

  return () => {
    cancelled = true;
    unsubscribeSnapshot?.();
  };
}

/**
 * Real-time listener for messages in a conversation's subcollection.
 * Matches Firestore rule: conversations/{convId}/messages/{msgId}
 * allow read, create: if isAuthenticated();
 */
export function subscribeToMessages(conversationId, onUpdate, onError) {
  if (isMockFirebase() || !db || !conversationId) {
    onUpdate?.([], { fromCache: false });
    return () => {};
  }
  let cancelled = false;
  let unsubscribeSnapshot = null;
  getAuthenticatedFirebaseUser().then((firebaseUser) => {
    if (cancelled) return;
    if (!firebaseUser) {
      onUpdate?.([], { fromCache: false });
      return;
    }

    const q = query(
      collection(db, CONVERSATIONS_COLLECTION, conversationId, 'messages'),
      orderBy('time', 'asc')
    );
    unsubscribeSnapshot = onSnapshot(
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
  }).catch((error) => {
    if (!cancelled) onError?.(error);
  });

  return () => {
    cancelled = true;
    unsubscribeSnapshot?.();
  };
}

/**
 * Save a single message to the conversations/{convId}/messages subcollection.
 * Matches Firestore rule: allow create: if isAuthenticated();
 */
export async function saveMessageFirebase(conversationId, message) {
  if (isMockFirebase() || !db || !conversationId || !message) return { isMock: true };
  const firebaseUser = await getAuthenticatedFirebaseUser();
  if (!firebaseUser) return { error: 'Not authenticated' };

  const type = message.type || 'text';
  const hasContent = type === 'text'
    ? Boolean(String(message.text || '').trim())
    : type === 'image' || type === 'video'
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

  const firebaseUser = await getAuthenticatedFirebaseUser();
  const currentUid = firebaseUser?.uid;
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

/** Save the first message and its conversation metadata as one atomic operation. */
export async function saveConversationMessageFirebase(convoData, message) {
  if (isMockFirebase() || !db || !convoData?.id || !message) return { isMock: true };
  const firebaseUser = await getAuthenticatedFirebaseUser();
  if (!firebaseUser) return { error: 'Not authenticated' };

  const type = message.type || 'text';
  const hasContent = type === 'text'
    ? Boolean(String(message.text || '').trim())
    : type === 'image' || type === 'video'
      ? Boolean(message.mediaUri)
      : type === 'location'
        ? Boolean(message.location)
        : type === 'report_link'
          ? Boolean(message.reportId && String(message.text || '').trim())
          : Boolean(String(message.text || '').trim());
  if (!hasContent) return { error: 'Message has no content' };

  try {
    const participants = Array.isArray(convoData.participants) ? [...convoData.participants] : [];
    if (!participants.includes(firebaseUser.uid)) participants.push(firebaseUser.uid);
    const { messages: _stripped, ...convoMeta } = convoData; // eslint-disable-line no-unused-vars
    const msgId = message.id || `m${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const convoRef = doc(db, CONVERSATIONS_COLLECTION, convoData.id);
    const msgRef = doc(db, CONVERSATIONS_COLLECTION, convoData.id, 'messages', msgId);
    const batch = writeBatch(db);
    batch.set(convoRef, { ...convoMeta, participants }, { merge: true });
    batch.set(msgRef, { ...message, id: msgId, timestamp: serverTimestamp() });
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
    // If updateDoc fails (e.g. document doesn't exist yet in firestore), ignore
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
    // If client rules don't permit subcollection bulk deletes, ignore quietly
    return { success: false };
  }
}

/**
 * Delete a conversation in Firestore and clean up all its subcollection messages
 */
export async function deleteConversationFirebase(conversationId) {
  if (isMockFirebase() || !db || !conversationId) return { isMock: true };

  try {
    // 1. Delete all messages inside the subcollection first (best effort)
    await clearConversationMessagesFirebase(conversationId);
    // 2. Delete the conversation document itself
    const docRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
    await deleteDoc(docRef);
    return { success: true };
  } catch (err) {
    // If deleteDoc fails, fallback to clearing metadata
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
