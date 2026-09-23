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

const ANIMALS_COLLECTION = 'animals';
const APPLICATIONS_COLLECTION = 'applications';

/**
 * Real-time listener for animal listings
 */
export function subscribeToAnimals(onUpdate, onError) {
  if (isMockFirebase() || !db) return () => {};

  try {
    const q = query(
      collection(db, ANIMALS_COLLECTION),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const seen = new Set();
        const animals = [];
        snapshot.forEach((docSnap) => {
          const id = docSnap.id;
          if (!seen.has(id)) {
            seen.add(id);
            animals.push({ id, ...docSnap.data() });
          }
        });
        onUpdate(animals);
      },
      (error) => {
        console.warn('[animalService] Animals snapshot error:', error);
        if (onError) onError(error);
      }
    );
  } catch (err) {
    console.warn('[animalService] Setup error:', err);
    return () => {};
  }
}

/**
 * Add a new animal listing using deterministic ID
 */
export async function addAnimalFirebase(animalData) {
  if (isMockFirebase() || !db) {
    return { isMock: true };
  }

  try {
    const docId = animalData?.id || `a${Date.now()}`;
    const payload = {
      ...animalData,
      id: docId,
      status: animalData.status || 'Available',
      createdAt: animalData.createdAt || new Date().toISOString(),
      timestamp: serverTimestamp(),
    };

    const docRef = doc(db, ANIMALS_COLLECTION, docId);
    await setDoc(docRef, payload, { merge: true });
    return { success: true, id: docId, animal: payload };
  } catch (error) {
    console.error('[animalService] Add animal error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update an animal listing. Uses setDoc with merge: true so if the document
 * was created locally or before full network sync, it upserts gracefully
 * instead of throwing "No document to update".
 */
export async function updateAnimalFirebase(animalId, updates, fullAnimalData = null) {
  if (isMockFirebase() || !db || !animalId) return { isMock: true };

  try {
    const docId = String(animalId);
    const animalRef = doc(db, ANIMALS_COLLECTION, docId);
    const dataToSave = {
      ...(fullAnimalData || {}),
      ...updates,
      id: docId,
      updatedAt: new Date().toISOString(),
    };

    await setDoc(animalRef, dataToSave, { merge: true });
    return { success: true };
  } catch (error) {
    console.error('[animalService] Update animal error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Real-time listener for adoption & foster applications
 */
export function subscribeToApplications(user, onUpdate, onError) {
  if (isMockFirebase() || !db) return () => {};

  // Applications are private and require an authenticated user
  const currentUid = user?.id || auth?.currentUser?.uid;
  if (!currentUid) {
    if (onUpdate) onUpdate([]);
    return () => {};
  }

  try {
    let q;
    if (user?.role === 'advocate') {
      // Only load applications for this advocate's own animals
      q = query(
        collection(db, APPLICATIONS_COLLECTION),
        where('advocateId', '==', currentUid)
      );
    } else {
      q = query(
        collection(db, APPLICATIONS_COLLECTION),
        where('requesterId', '==', currentUid)
      );
    }

    return onSnapshot(
      q,
      (snapshot) => {
        const apps = [];
        snapshot.forEach((docSnap) => {
          apps.push({
            id: docSnap.id,
            ...docSnap.data(),
          });
        });
        apps.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        if (onUpdate) onUpdate(apps);
      },
      (error) => {
        console.warn('[animalService] Applications snapshot error:', error);
        if (onError) onError(error);
      }
    );
  } catch (err) {
    console.warn('[animalService] Applications setup error:', err);
    return () => {};
  }
}

/**
 * Submit adoption or foster application
 */
export async function submitApplicationFirebase(appData) {
  if (isMockFirebase() || !db) {
    return { isMock: true };
  }

  try {
    const docId = appData?.id || `req${Date.now()}`;
    const payload = {
      ...appData,
      id: docId,
      status: appData.status || 'Pending',
      createdAt: appData.createdAt || new Date().toISOString(),
      timestamp: serverTimestamp(),
    };

    const docRef = doc(db, APPLICATIONS_COLLECTION, docId);
    await setDoc(docRef, payload, { merge: true });
    return { success: true, id: docId, application: payload };
  } catch (error) {
    console.error('[animalService] Application submission error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update application status (Approved / Rejected)
 */
export async function updateApplicationFirebase(appId, updates) {
  if (isMockFirebase() || !db || !appId) return { isMock: true };

  try {
    const docId = String(appId);
    const appRef = doc(db, APPLICATIONS_COLLECTION, docId);
    await setDoc(appRef, { ...updates, id: docId, updatedAt: new Date().toISOString() }, { merge: true });
    return { success: true };
  } catch (error) {
    console.error('[animalService] Update application error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete an animal listing from Firestore
 */
export async function deleteAnimalFirebase(animalId) {
  if (isMockFirebase() || !db || !animalId) return { isMock: true };
  try {
    const docId = String(animalId);
    const docRef = doc(db, ANIMALS_COLLECTION, docId);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    console.error('[animalService] Delete animal error:', error);
    return { success: false, error: error.message };
  }
}

