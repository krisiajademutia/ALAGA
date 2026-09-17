// ALAGA Firebase Cloud Configuration
// To connect to your live project:
// 1. Go to https://console.firebase.google.com
// 2. Create or select your project (e.g. "alaga-app")
// 3. Register a Web App ("</>") and copy your firebaseConfig values below:

export const firebaseConfig = {
  apiKey: "AIzaSyAt2waKeq9dKmb-dIZhKOoUCvmHObzgW-g",
  authDomain: "alaga-2ed4a.firebaseapp.com",
  projectId: "alaga-2ed4a",
  storageBucket: "alaga-2ed4a.firebasestorage.app",
  messagingSenderId: "861385147807",
  appId: "1:861385147807:web:2529eb50967483e5b369aa",
  measurementId: "G-F7R5N5S7EV"
};

// Google OAuth Web Client ID from Firebase Console (Authentication -> Sign-in method -> Google)
export const googleWebClientId = "861385147807-sjs4usuutn8jgj974e5sflod5pg08s1g.apps.googleusercontent.com";

/**
 * Checks if real credentials have been configured
 * Returns true if placeholder values are still in place
 */
export const isMockFirebase = () => {
  return (
    !firebaseConfig.apiKey ||
    firebaseConfig.apiKey.includes('YOUR_FIREBASE') ||
    firebaseConfig.apiKey.length < 20
  );
};
