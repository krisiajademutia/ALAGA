import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithCredential,
  updatePassword as fbUpdatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  collection,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
  deleteField,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { isMockFirebase } from '../config/firebaseConfig';

/**
 * Return null so that when a user hasn't chosen or uploaded their own profile photo,
 * the app displays their clean initial letters instead of random stranger portraits.
 */
export function getDefaultUserAvatar(name = '', userId = '') {
  return null;
}

/**
 * Robustly extract a user's uploaded avatar URL from any supported Firestore/Auth field naming
 */
export function extractUserAvatar(data, firebaseAuthUser = null) {
  if (!data && !firebaseAuthUser) return null;
  const candidate =
    data?.avatar ||
    data?.photoURL ||
    data?.photoUrl ||
    data?.avatarUrl ||
    data?.photo ||
    data?.image ||
    data?.profileImage ||
    data?.profilePicture ||
    firebaseAuthUser?.photoURL ||
    null;

  if (candidate && typeof candidate === 'string' && candidate.trim().length > 0) {
    return candidate.trim();
  }
  return null;
}

// In-memory profile & avatar cache for instant rendering across all screens
const userAvatarCache = new Map();
const userProfileCache = new Map();


/**
 * Normalize an email address.
 * For Gmail/Googlemail:
 * - Converts domain to 'gmail.com'
 * - Lowercases everything
 * - Strips all '.' (dots) from the local part (Gmail treats dots as identical)
 * - Strips '+' (plus-addressing aliases) from the local part (e.g. user+tag@gmail.com -> user@gmail.com)
 * For other domains:
 * - Lowercases and strips '+' aliases
 */
export function normalizeEmail(email) {
  if (!email || typeof email !== 'string') return '';
  const trimmed = email.trim().toLowerCase();
  const atIndex = trimmed.lastIndexOf('@');
  if (atIndex <= 0 || atIndex === trimmed.length - 1) return trimmed;

  let local = trimmed.slice(0, atIndex);
  let domain = trimmed.slice(atIndex + 1);

  if (domain === 'googlemail.com') {
    domain = 'gmail.com';
  }

  // Remove plus addressing (e.g. name+tag -> name)
  local = local.split('+')[0];

  if (domain === 'gmail.com') {
    // Remove all dots in Gmail local part (Gmail delivers all dot variations to the exact same inbox)
    local = local.replace(/\./g, '');
  }

  return `${local}@${domain}`;
}

/**
 * Check if a registered user exists by email address in Firestore.
 * Supports Gmail alias/dot matching to ensure strictly 1 account per Gmail inbox.
 */
export async function checkUserExistsByEmail(email) {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail) return { exists: false };
  const normalized = normalizeEmail(cleanEmail);

  if (isMockFirebase() || !db) {
    return { exists: false };
  }

  try {
    const usersRef = collection(db, 'users');

    // 1. Direct query by exact email
    const q1 = query(usersRef, where('email', '==', cleanEmail));
    const snap1 = await getDocs(q1);
    if (!snap1.empty) {
      const docData = snap1.docs[0].data();
      return { exists: true, user: { id: snap1.docs[0].id, ...docData } };
    }

    // 2. Direct query by normalizedEmail (covers Gmail dots, plus-aliases, etc.)
    const q2 = query(usersRef, where('normalizedEmail', '==', normalized));
    const snap2 = await getDocs(q2);
    if (!snap2.empty) {
      const docData = snap2.docs[0].data();
      return { exists: true, user: { id: snap2.docs[0].id, ...docData } };
    }

    // 3. Fallback scan of existing users to guarantee no variations bypass the check
    const allSnap = await getDocs(usersRef);
    for (const d of allSnap.docs) {
      const data = d.data();
      const existingEmail = (data.email || '').trim().toLowerCase();
      if (
        existingEmail &&
        (existingEmail === cleanEmail ||
          normalizeEmail(existingEmail) === normalized ||
          (data.normalizedEmail && data.normalizedEmail === normalized))
      ) {
        return { exists: true, user: { id: d.id, ...data } };
      }
    }

    return { exists: false };
  } catch (err) {
    console.warn('[authService] checkUserExistsByEmail notice:', err);
    return { exists: false, error: err.message };
  }
}


/**
 * Update password for an authenticated, logged-in user
 */
export async function updateUserPasswordLoggedIn({ newPassword, currentPassword }) {
  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters.' };
  }

  try {
    const currentUser = auth?.currentUser;
    if (!currentUser) return { success: false, error: 'Sign in again before changing your password.' };
    if (currentPassword && currentUser.email) {
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
    }
    await fbUpdatePassword(currentUser, newPassword);
    return { success: true };
  } catch (err) {
    console.error('[authService] updateUserPasswordLoggedIn error:', err);
    return { success: false, error: err.message || 'Failed to update password.' };
  }
}

/**
 * Sign in user with email & password
 */
/**
 * Send an official, secure password reset link to user's email via Firebase Auth
 */
export async function sendPasswordResetEmailFirebase(email) {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail) {
    return { success: false, error: 'Email is required.' };
  }
  if (isMockFirebase() || !auth) {
    return { success: true, isMock: true };
  }
  try {
    await sendPasswordResetEmail(auth, cleanEmail);
    return { success: true };
  } catch (err) {
    console.warn('[authService] sendPasswordResetEmail error:', err);
    let message = 'Failed to send password reset email. Please try again.';
    if (err.code === 'auth/user-not-found') {
      message = 'No account found with this email address. Please check your spelling or sign up.';
    } else if (err.code === 'auth/invalid-email') {
      message = 'Please enter a valid email address.';
    } else if (err.code === 'auth/too-many-requests') {
      message = 'Too many requests. Please wait a few moments before trying again.';
    }
    return { success: false, error: message };
  }
}

/**
 * Sign in user with email & password
 */
export async function loginWithFirebase(email, password) {
  if (isMockFirebase() || !auth) return { isMock: true };
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail || !password) return { success: false, error: 'Email and password are required.' };

  try {
    const credential = await signInWithEmailAndPassword(auth, cleanEmail, password);
    const userRef = doc(db, 'users', credential.user.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await fbSignOut(auth).catch(() => {});
      return { success: false, error: 'No account profile found. Please contact support.' };
    }

    const stored = snap.data();
    const { passwordHash, passwordUpdatedAt, ...data } = stored;
    const user = { id: credential.user.uid, ...data, avatar: extractUserAvatar(data, credential.user) };
    cacheUserProfile(user);
    return { success: true, user };
  } catch (err) {
    let message = 'Incorrect email or password.';
    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') message = 'Incorrect email or password.';
    else if (err.code === 'auth/invalid-email') message = 'Please enter a valid email address.';
    else if (err.code === 'auth/too-many-requests') message = 'Too many failed attempts. Please try again later.';
    return { success: false, error: message };
  }
}
/**
 * Register user with email, password, and custom ALAGA profile fields
 */
export async function registerWithFirebase({ email, password, name, role, location, organization, coords }) {
  if (isMockFirebase() || !auth) {
    return { isMock: true };
  }

  const cleanEmail = (email || '').trim().toLowerCase();
  const normalizedEmailVal = normalizeEmail(cleanEmail);

  // 1. Strictly enforce one account per Gmail / email in Firestore before creating in Auth
  const existingCheck = await checkUserExistsByEmail(cleanEmail);
  if (existingCheck.exists) {
    return {
      success: false,
      error: 'An account with this email address already exists. Each Gmail address is limited to one ALAGA account. Please sign in instead.',
    };
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    const uid = userCredential.user.uid;

    const newUserData = {
      id: uid,
      name: name.trim(),
      email: cleanEmail,
      normalizedEmail: normalizedEmailVal,
      role: role || 'community',
      location: location?.trim() || '',
      organization: organization?.trim() || '',
      coords: coords || null,
      avatar: null,
      joinedAt: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      ...(role === 'advocate' ? { rescueCount: 0, animalCount: 0 } : { reportCount: 0 }),
    };

    // Save profile to Firestore users/{uid}
    await setDoc(doc(db, 'users', uid), newUserData);
    cacheUserProfile(newUserData);

    return { success: true, user: newUserData };
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      return {
        success: false,
        error: 'An account with this email address already exists. Each Gmail address is limited to one ALAGA account. Please sign in instead.',
      };
    }

    let msg = error.message;
    if (error.code === 'auth/weak-password') {
      msg = 'Password should be at least 6 characters.';
    }
    return { success: false, error: msg };
  }
}

/**
 * Sign out from Firebase
 */
export async function logoutFromFirebase() {
  if (isMockFirebase() || !auth) return;
  try {
    await fbSignOut(auth);
  } catch (error) {
    console.warn('[authService] Sign out error:', error);
  }
}

/**
 * Update user profile in Firestore
 */
export async function updateUserProfile(userId, updates) {
  if (isMockFirebase() || !db) return;
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, updates);
  } catch (error) {
    console.warn('[authService] Update profile error:', error);
  }
}

/**
 * Subscribe to auth state changes
 */
export function subscribeAuthState(callback) {
  if (isMockFirebase() || !auth) return () => {};
  return onAuthStateChanged(auth, callback);
}

/**
 * Sign in using Google OAuth ID token with Firebase Auth
 */
export async function loginWithGoogleCredential(idToken) {
  if (isMockFirebase() || !auth) {
    return { isMock: true };
  }

  try {
    const credential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(auth, credential);
    const uid = userCredential.user.uid;

    const userDocRef = doc(db, 'users', uid);
    const userDocSnap = await getDoc(userDocRef);

    let userData;
    if (userDocSnap.exists()) {
      const stored = userDocSnap.data();
      const { passwordHash, passwordUpdatedAt, ...safeUser } = stored;
      if (passwordHash || passwordUpdatedAt) {
        updateDoc(userDocRef, { passwordHash: deleteField(), passwordUpdatedAt: deleteField() }).catch(() => {});
      }
      userData = { id: uid, ...safeUser };
    } else {
      userData = {
        id: uid,
        name: userCredential.user.displayName || 'Google User',
        email: userCredential.user.email,
        role: 'community',
        avatar: userCredential.user.photoURL || null,
        location: '',
        organization: '',
        joinedAt: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        reportCount: 0,
      };
      await setDoc(userDocRef, userData);
    }

    return { success: true, user: userData };
  } catch (error) {
    console.error('[authService] Google sign-in credential error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Cache a user profile object in-memory for instant avatar/name lookups across all screens.
 * Safely merges new properties without wiping out existing avatar, location, or organization.
 */
export function cacheUserProfile(user) {
  if (!user) return;
  const id = user.id || user.uid;
  if (!id) return;

  const existing = userProfileCache.get(id) || {};
  const extracted = extractUserAvatar(user);
  const avatar = extracted || (typeof user.avatar === 'string' && user.avatar.trim() ? user.avatar.trim() : null) || existing.avatar || null;

  const merged = {
    ...existing,
    ...user,
    id,
    avatar,
  };

  userProfileCache.set(id, merged);
  if (avatar) {
    userAvatarCache.set(id, avatar);
  }
}

/**
 * Get synchronously cached avatar URL by userId
 */
export function getCachedUserAvatar(userId) {
  if (userId && userAvatarCache.has(userId)) {
    return userAvatarCache.get(userId);
  }
  return null;
}

/**
 * Synchronously retrieve cached user profile if present
 */
export function getCachedUserProfile(userId) {
  if (!userId) return null;
  return userProfileCache.get(userId) || null;
}

export function clearCachedUserProfile(userId) {
  if (userId) {
    userProfileCache.delete(userId);
    userAvatarCache.delete(userId);
  } else {
    userProfileCache.clear();
    userAvatarCache.clear();
  }
}

/**
 * Fetch a specific user's profile from Firestore (including their real payoutMethods & avatar)
 */
export async function getUserProfileFirebase(userId, forceFresh = false) {
  if (!userId) return null;
  const cached = getCachedUserProfile(userId);
  if (!forceFresh && cached && cached.avatar && cached.name && cached.email) return cached;

  if (isMockFirebase() || !db) return cached || null;
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      const data = userDocSnap.data();
      const authUser = auth?.currentUser?.uid === userId ? auth.currentUser : null;
      const avatar = extractUserAvatar(data, authUser);
      const profile = { id: userId, ...data, avatar };
      cacheUserProfile(profile);
      return profile;
    }
    // Document confirmed not to exist in Firestore! Purge cache and return null
    clearCachedUserProfile(userId);
    return null;
  } catch (err) {
    console.warn('[authService] Error fetching user profile (network/offline):', err?.message || err);
    // On network failure or offline mode, preserve cached profile so users aren't mistakenly logged out
    return cached || null;
  }
}

/**
 * Asynchronously resolve a user's avatar URL from cache or Firestore
 */
export async function resolveUserAvatar(userId, name) {
  const cached = getCachedUserAvatar(userId);
  if (cached) return cached;

  if (userId) {
    const profile = await getUserProfileFirebase(userId, true);
    if (profile && profile.avatar) {
      return profile.avatar;
    }
  }
  return null;
}

/**
 * Fetch all registered users from Firestore users collection and prime the cache
 */
export async function getAllUsersFirebase() {
  if (isMockFirebase() || !db) return [];
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    const list = [];
    usersSnap.forEach((d) => {
      const data = d.data();
      const avatar = extractUserAvatar(data);
      const userObj = { id: d.id, ...data, avatar };
      list.push(userObj);
      cacheUserProfile(userObj);
    });
    return list;
  } catch (err) {
    console.warn('[authService] Error fetching all users:', err?.message || err);
    return [];
  }
}

/**
 * Real-time listener for all registered users in Firestore.
 * Ensures any profile updates (name, avatar, location, organization, role)
 * are instantly synced across all screens in real-time.
 */
export function subscribeToAllUsersFirebase(onUpdate) {
  if (isMockFirebase() || !db) return () => {};
  try {
    const unsub = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const list = [];
        snapshot.forEach((d) => {
          const data = d.data();
          const avatar = extractUserAvatar(data);
          const userObj = { id: d.id, ...data, avatar };
          list.push(userObj);
          cacheUserProfile(userObj);
        });
        if (typeof onUpdate === 'function') {
          onUpdate(list);
        }
      },
      (err) => {
        console.warn('[authService] subscribeToAllUsersFirebase warning:', err?.message || err);
      }
    );
    return unsub;
  } catch (err) {
    console.warn('[authService] subscribeToAllUsersFirebase setup warning:', err?.message || err);
    return () => {};
  }
}

/**
 * Save a notification to the Firestore users/{userId}/notifications subcollection.
 * Sanitizes all undefined values so Firestore setDoc never throws an unsupported field value error.
 * Preserves existing `read: true` status if the user already reviewed/read this notification.
 */
export async function saveNotificationFirebase(userId, notification) {
  if (isMockFirebase() || !db || !userId || !notification?.id) return;
  try {
    const docRef = doc(db, 'users', userId, 'notifications', notification.id);
    
    // Check if document already exists and was already marked read
    let finalRead = notification.read ?? false;
    try {
      const existingSnap = await getDoc(docRef);
      if (existingSnap.exists()) {
        const data = existingSnap.data();
        if (data.read === true) {
          finalRead = true; // Never revert a read notification back to unread
        }
      }
    } catch (e) {}

    // Strip undefined properties to ensure Firestore compatibility
    const sanitized = {};
    Object.keys(notification).forEach((key) => {
      const val = notification[key];
      if (val !== undefined) {
        sanitized[key] = val;
      }
    });

    await setDoc(docRef, {
      ...sanitized,
      read: finalRead,
      timestamp: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.warn('[authService] saveNotificationFirebase warning:', err?.message || err);
  }
}

/**
 * Mark a specific notification as read in Firestore
 */
export async function markNotificationReadFirebase(userId, notificationId) {
  if (isMockFirebase() || !db || !userId || !notificationId) return;
  try {
    const docRef = doc(db, 'users', userId, 'notifications', String(notificationId));
    await updateDoc(docRef, {
      read: true,
      readAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('[authService] markNotificationReadFirebase warning:', err?.message || err);
  }
}

/**
 * Mark ALL notifications as read for a user in Firestore
 */
export async function markAllNotificationsReadFirebase(userId) {
  if (isMockFirebase() || !db || !userId) return;
  try {
    const notifsRef = collection(db, 'users', userId, 'notifications');
    const snapshot = await getDocs(notifsRef);
    if (snapshot.empty) return;

    const batch = writeBatch(db);
    let count = 0;
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (!data.read) {
        batch.update(docSnap.ref, { read: true, readAt: serverTimestamp() });
        count++;
      }
    });
    if (count > 0) {
      await batch.commit();
    }
  } catch (err) {
    console.warn('[authService] markAllNotificationsReadFirebase warning:', err?.message || err);
  }
}

/**
 * Delete a specific notification from Firestore
 */
export async function deleteNotificationFirebase(userId, notificationId) {
  if (isMockFirebase() || !db || !userId || !notificationId) return;
  try {
    const docRef = doc(db, 'users', userId, 'notifications', String(notificationId));
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('[authService] deleteNotificationFirebase warning:', err?.message || err);
  }
}

/**
 * Clear all notifications for a user in Firestore
 */
export async function clearAllNotificationsFirebase(userId) {
  if (isMockFirebase() || !db || !userId) return;
  try {
    const notifsRef = collection(db, 'users', userId, 'notifications');
    const snapshot = await getDocs(notifsRef);
    if (snapshot.empty) return;

    const batch = writeBatch(db);
    snapshot.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
  } catch (err) {
    console.warn('[authService] clearAllNotificationsFirebase warning:', err?.message || err);
  }
}

/**
 * Real-time listener for a user's notifications subcollection.
 * Matches Firestore rule: allow read, write: if isOwner(userId);
 */
export function subscribeToNotificationsFirebase(userId, onUpdate, onError) {
  if (isMockFirebase() || !db || !userId) return () => {};
  try {
    const q = query(
      collection(db, 'users', userId, 'notifications'),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const notifs = [];
        snapshot.forEach((docSnap) => {
          notifs.push({ id: docSnap.id, ...docSnap.data() });
        });
        if (onUpdate) onUpdate(notifs);
      },
      (error) => {
        console.warn('[authService] Notifications snapshot notice:', error?.message || error);
        if (onError) onError(error);
      }
    );
  } catch (err) {
    console.warn('[authService] Notifications listener setup error:', err);
    return () => {};
  }
}
