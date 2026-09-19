import {
  collection,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { isMockFirebase } from '../config/firebaseConfig';

const DONATIONS_COLLECTION = 'donations';

/**
 * Real-time listener for donations.
 * In firestore.rules: allow read: if isAuthenticated();
 * All authenticated users can observe donation events in real time.
 */
export function subscribeToDonations(onUpdate, onError) {
  if (isMockFirebase() || !db) return () => {};

  try {
    const q = query(
      collection(db, DONATIONS_COLLECTION),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const donations = [];
        snapshot.forEach((docSnap) => {
          donations.push({
            id: docSnap.id,
            ...docSnap.data(),
          });
        });
        onUpdate(donations);
      },
      (error) => {
        console.warn('[donationService] Snapshot error:', error);
        if (onError) onError(error);
      }
    );
  } catch (err) {
    console.warn('[donationService] Listener setup error:', err);
    return () => {};
  }
}

/**
 * Submit a new donation to Firestore.
 * In firestore.rules: allow create: if isAuthenticated() && request.resource.data.donorId == request.auth.uid;
 */
export async function createDonationFirebase(donationData) {
  if (isMockFirebase() || !db) {
    return { isMock: true };
  }

  try {
    const currentUid = auth?.currentUser?.uid;
    const donorId = currentUid || donationData.donorId;

    const docId = donationData.id || `d_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const docRef = doc(db, DONATIONS_COLLECTION, docId);

    const payload = {
      ...donationData,
      id: docId,
      donorId,
      status: donationData.status || 'Pending',
      createdAt: donationData.createdAt || new Date().toISOString(),
      timestamp: serverTimestamp(),
    };

    await setDoc(docRef, payload);
    return { success: true, id: docId, donation: payload };
  } catch (error) {
    console.warn('[donationService] Create donation warning:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Advocate verifies or updates status of a donation.
 * In firestore.rules: allow update: if isAdvocate();
 */
export async function verifyDonationFirebase(donationId, status = 'Verified', notes = '') {
  if (isMockFirebase() || !db || !donationId) {
    return { isMock: true };
  }

  try {
    const currentUid = auth?.currentUser?.uid || null;
    const docRef = doc(db, DONATIONS_COLLECTION, donationId);

    const updatePayload = {
      status,
      verifiedBy: currentUid,
      verifiedAt: new Date().toISOString(),
    };

    if (notes) {
      updatePayload.advocateNotes = notes;
    }

    await updateDoc(docRef, updatePayload);
    return { success: true };
  } catch (error) {
    console.warn('[donationService] Verify donation warning:', error.message);
    return { success: false, error: error.message };
  }
}
