import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyA5lFaJYrxpGOqAGKyaAWtT6axvlTxz--o",
  authDomain: "jt-boilerpoint.firebaseapp.com",
  projectId: "jt-boilerpoint",
  storageBucket: "jt-boilerpoint.firebasestorage.app",
  messagingSenderId: "671704149856",
  appId: "1:671704149856:web:5e7dcf3cec4a2704593805",
  measurementId: "G-Y4QBGPCHRV"
};

// Initialize firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Use localStorage for Auth persistence instead of the default IndexedDB.
// This avoids conflicts between Auth's IndexedDB and Firestore's IndexedDB cache.
const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch(console.error);

export { auth };
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);
