import {
  collection,
  doc,
  addDoc,
  updateDoc,
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
        const animals = [];
        snapshot.forEach((docSnap) => {
          animals.push({
            id: docSnap.id,
            ...docSnap.data(),
          });
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
 * Add a new animal listing
 */
export async function addAnimalFirebase(animalData) {
  if (isMockFirebase() || !db) {
    return { isMock: true };
  }

  try {
    const payload = {
      ...animalData,
      status: animalData.status || 'Available',
      createdAt: new Date().toISOString(),
      timestamp: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, ANIMALS_COLLECTION), payload);
    return { success: true, id: docRef.id, animal: { id: docRef.id, ...payload } };
  } catch (error) {
    console.error('[animalService] Add animal error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update an animal listing
 */
export async function updateAnimalFirebase(animalId, updates) {
  if (isMockFirebase() || !db) return;

  try {
    const animalRef = doc(db, ANIMALS_COLLECTION, animalId);
    await updateDoc(animalRef, updates);
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
      q = query(collection(db, APPLICATIONS_COLLECTION));
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
    const payload = {
      ...appData,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      timestamp: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, APPLICATIONS_COLLECTION), payload);
    return { success: true, id: docRef.id, application: { id: docRef.id, ...payload } };
  } catch (error) {
    console.error('[animalService] Application submission error:', error);
    return { success: false, error: error.message };
  }
}
