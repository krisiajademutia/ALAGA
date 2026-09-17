import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { isMockFirebase } from '../config/firebaseConfig';

const RESCUES_COLLECTION = 'rescues';

/**
 * Real-time listener for rescue alerts
 */
export function subscribeToRescueReports(onUpdate, onError) {
  if (isMockFirebase() || !db) return () => {};

  try {
    const q = query(
      collection(db, RESCUES_COLLECTION),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const reports = [];
        snapshot.forEach((docSnap) => {
          reports.push({
            id: docSnap.id,
            ...docSnap.data(),
          });
        });
        onUpdate(reports);
      },
      (error) => {
        console.warn('[rescueService] Snapshot error:', error);
        if (onError) onError(error);
      }
    );
  } catch (err) {
    console.warn('[rescueService] Listener setup error:', err);
    return () => {};
  }
}

/**
 * Create a new rescue report in Firestore
 */
export async function createRescueReportFirebase(reportData) {
  if (isMockFirebase() || !db) {
    return { isMock: true };
  }

  try {
    const payload = {
      ...reportData,
      status: 'Open',
      responderId: null,
      responderName: null,
      createdAt: new Date().toISOString(),
      timestamp: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, RESCUES_COLLECTION), payload);
    return { success: true, id: docRef.id, report: { id: docRef.id, ...payload } };
  } catch (error) {
    console.error('[rescueService] Create report error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Advocate responds to / claims a rescue report
 */
export async function claimRescueReportFirebase(reportId, advocateId, advocateName) {
  if (isMockFirebase() || !db) return;

  try {
    const reportRef = doc(db, RESCUES_COLLECTION, reportId);
    await updateDoc(reportRef, {
      status: 'Responded',
      responderId: advocateId,
      responderName: advocateName,
      respondedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (error) {
    console.error('[rescueService] Claim error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Mark a rescue case as safely rescued
 */
export async function markReportRescuedFirebase(reportId) {
  if (isMockFirebase() || !db) return;

  try {
    const reportRef = doc(db, RESCUES_COLLECTION, reportId);
    await updateDoc(reportRef, {
      status: 'Rescued',
      rescuedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (error) {
    console.error('[rescueService] Mark rescued error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Add a comment to the rescue subcollection
 */
export async function addRescueCommentFirebase(reportId, commentData) {
  if (isMockFirebase() || !db) return;

  try {
    const commentsRef = collection(db, RESCUES_COLLECTION, reportId, 'comments');
    const newComment = {
      ...commentData,
      createdAt: new Date().toISOString(),
      timestamp: serverTimestamp(),
    };
    const docRef = await addDoc(commentsRef, newComment);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('[rescueService] Add comment error:', error);
    return { success: false, error: error.message };
  }
}
