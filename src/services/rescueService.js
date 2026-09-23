import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
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

    const docId = reportData?.id || `r${Date.now()}`;
    const docRef = doc(db, RESCUES_COLLECTION, docId);
    await setDoc(docRef, { ...payload, id: docId });
    return { success: true, id: docId, report: { id: docId, ...payload } };
  } catch (error) {
    console.warn('[rescueService] Create report warning:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Advocate responds to / claims a rescue report
 */
export async function claimRescueReportFirebase(reportId, advocateId, advocateName) {
  if (isMockFirebase() || !db) return { isMock: true };

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
    console.warn('[rescueService] Claim sync notice:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Mark a rescue case as safely rescued
 */
export async function markReportRescuedFirebase(reportId) {
  if (isMockFirebase() || !db) return { isMock: true };

  try {
    const reportRef = doc(db, RESCUES_COLLECTION, reportId);
    await updateDoc(reportRef, {
      status: 'Rescued',
      rescuedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (error) {
    console.warn('[rescueService] Mark rescued sync notice:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Add a comment to the rescue subcollection
 */
export async function addRescueCommentFirebase(reportId, commentData) {
  if (isMockFirebase() || !db) return { isMock: true };

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
    console.warn('[rescueService] Add comment warning:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Update the urgency level of a rescue report (Triage)
 */
export async function updateRescueReportUrgencyFirebase(reportId, urgency) {
  if (isMockFirebase() || !db || !reportId) return { isMock: true };

  try {
    const reportRef = doc(db, RESCUES_COLLECTION, reportId);
    await updateDoc(reportRef, { urgency });
    return { success: true };
  } catch (error) {
    console.warn('[rescueService] Update urgency warning:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a rescue report from Firestore
 */
export async function deleteRescueReportFirebase(reportId) {
  if (isMockFirebase() || !db || !reportId) return { isMock: true };
  try {
    const docId = String(reportId);
    const docRef = doc(db, RESCUES_COLLECTION, docId);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    console.warn('[rescueService] Delete rescue report error:', error.message);
    return { success: false, error: error.message };
  }
}


