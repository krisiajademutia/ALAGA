import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { isMockFirebase } from '../config/firebaseConfig';

/**
 * Sign in user with email & password
 */
export async function loginWithFirebase(email, password) {
  if (isMockFirebase() || !auth) {
    return { isMock: true };
  }

  try {
    const cleanEmail = email.trim();
    const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
    const uid = userCredential.user.uid;

    // Fetch user profile from Firestore users/{uid}
    const userDocRef = doc(db, 'users', uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      return { success: true, user: { id: uid, ...userDocSnap.data() } };
    } else {
      const derivedName = cleanEmail.split('@')[0].replace(/[._]/g, ' ');
      const newUserData = {
        id: uid,
        email: cleanEmail,
        name: userCredential?.user?.displayName || derivedName,
        role: 'community',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(derivedName)}&background=1A535C&color=fff&bold=true`,
        location: '',
        organization: '',
        joinedAt: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        reportCount: 0,
      };
      await setDoc(userDocRef, newUserData);
      return { success: true, user: newUserData };
    }
  } catch (signErr) {
    let msg = 'Incorrect email or password.';
    if (signErr.code === 'auth/user-not-found' || signErr.code === 'auth/invalid-credential') {
      msg = 'No account found with this email or password. Please register first.';
    } else if (signErr.code === 'auth/wrong-password') {
      msg = 'Incorrect password. Please try again.';
    } else if (signErr.code === 'auth/too-many-requests') {
      msg = 'Too many failed attempts. Please try again later.';
    }
    return { success: false, error: msg };
  }
}

/**
 * Register user with email, password, and custom ALAGA profile fields
 */
export async function registerWithFirebase({ email, password, name, role, location, organization }) {
  if (isMockFirebase() || !auth) {
    return { isMock: true };
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const uid = userCredential.user.uid;

    const newUserData = {
      id: uid,
      name: name.trim(),
      email: email.trim(),
      role: role || 'community',
      location: location?.trim() || '',
      organization: organization?.trim() || '',
      avatar: null,
      joinedAt: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      ...(role === 'advocate' ? { rescueCount: 0, animalCount: 0 } : { reportCount: 0 }),
    };

    // Save profile to Firestore users/{uid}
    await setDoc(doc(db, 'users', uid), newUserData);

    return { success: true, user: newUserData };
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      // User verified email via Brevo OTP; attempt sign in with this password
      try {
        const signCred = await signInWithEmailAndPassword(auth, email.trim(), password);
        const uid = signCred.user.uid;
        const userDocRef = doc(db, 'users', uid);
        const userDocSnap = await getDoc(userDocRef);

        let userData;
        if (userDocSnap.exists()) {
          const updates = {
            name: name.trim(),
            role: role || 'community',
            location: location?.trim() || '',
            organization: organization?.trim() || '',
            updatedAt: new Date().toISOString(),
          };
          await updateDoc(userDocRef, updates);
          userData = { id: uid, ...userDocSnap.data(), ...updates };
        } else {
          userData = {
            id: uid,
            name: name.trim(),
            email: email.trim(),
            role: role || 'community',
            location: location?.trim() || '',
            organization: organization?.trim() || '',
            avatar: null,
            joinedAt: new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString(),
            ...(role === 'advocate' ? { rescueCount: 0, animalCount: 0 } : { reportCount: 0 }),
          };
          await setDoc(userDocRef, userData);
        }
        return { success: true, user: userData };
      } catch (signErr) {
        return {
          success: false,
          error:
            'This account already exists in Firebase Auth. If you want a fresh registration with a new password, please remove this user from Firebase Console (Authentication > Users) or log in with your existing password.',
        };
      }
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
      userData = { id: uid, ...userDocSnap.data() };
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

function getGoogleAuthSecret(email) {
  return 'AlagaGAuth_' + email.toLowerCase().replace(/[^a-z0-9]/g, '') + '_2026!';
}

/**
 * Sign in or create account using a Google / Gmail profile
 */
export async function loginWithGoogleProfile({ email, name, photoURL, role = 'community', location = '', organization = '' }) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const displayName = (name || cleanEmail.split('@')[0] || 'Alaga User').trim();
  const defaultAvatar = photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=1A535C&color=fff&bold=true`;

  if (isMockFirebase() || !db) {
    const mockGoogleUser = {
      id: `u_google_${Date.now()}`,
      name: displayName,
      email: cleanEmail,
      role: role || 'community',
      avatar: defaultAvatar,
      location: location || '',
      organization: organization || '',
      authProvider: 'google',
      joinedAt: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      ...(role === 'advocate' ? { rescueCount: 0, animalCount: 0 } : { reportCount: 0 }),
    };
    return { success: true, user: mockGoogleUser };
  }

  try {
    let uid = null;
    const secret = getGoogleAuthSecret(cleanEmail);

    // 1. Authenticate with Firebase Auth
    if (auth) {
      try {
        const cred = await signInWithEmailAndPassword(auth, cleanEmail, secret);
        uid = cred.user.uid;
      } catch (authErr) {
        if (
          authErr.code === 'auth/user-not-found' ||
          authErr.code === 'auth/invalid-credential' ||
          authErr.code === 'auth/wrong-password'
        ) {
          try {
            const newCred = await createUserWithEmailAndPassword(auth, cleanEmail, secret);
            uid = newCred.user.uid;
          } catch (createErr) {
            if (createErr.code === 'auth/email-already-in-use') {
              uid = 'g_' + cleanEmail.replace(/[^a-z0-9]/g, '_');
            } else {
              console.warn('[authService] Google Auth create fallback:', createErr.message);
              uid = 'g_' + cleanEmail.replace(/[^a-z0-9]/g, '_');
            }
          }
        } else {
          uid = 'g_' + cleanEmail.replace(/[^a-z0-9]/g, '_');
        }
      }
    } else {
      uid = 'g_' + cleanEmail.replace(/[^a-z0-9]/g, '_');
    }

    // 2. Fetch or create Firestore user profile
    const userDocRef = doc(db, 'users', uid);
    const userDocSnap = await getDoc(userDocRef);

    let userData;
    if (userDocSnap.exists()) {
      userData = { id: uid, ...userDocSnap.data() };
    } else {
      userData = {
        id: uid,
        name: displayName,
        email: cleanEmail,
        role: role || 'community',
        avatar: defaultAvatar,
        location: location || '',
        organization: organization || '',
        authProvider: 'google',
        joinedAt: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        ...(role === 'advocate' ? { rescueCount: 0, animalCount: 0 } : { reportCount: 0 }),
      };
      await setDoc(userDocRef, userData);
    }

    return { success: true, user: userData };
  } catch (error) {
    console.error('[authService] Google profile sign-in error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Fetch a specific user's profile from Firestore (including their real payoutMethods)
 */
export async function getUserProfileFirebase(userId) {
  if (isMockFirebase() || !db || !userId) return null;
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      return { id: userId, ...userDocSnap.data() };
    }
    return null;
  } catch (err) {
    console.warn('[authService] Error fetching user profile:', err);
    return null;
  }
}

