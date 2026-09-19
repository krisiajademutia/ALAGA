import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
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
 * Save or update a conversation document in Firestore
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

  try {
    const docRef = doc(db, CONVERSATIONS_COLLECTION, convoData.id);
    await setDoc(docRef, { ...convoData, participants }, { merge: true });
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
