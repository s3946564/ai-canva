import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAnLk8ZqBSWo608AJ1-_xovUWYQ1dQno5I",
  authDomain: "jtan-ai-canva.firebaseapp.com",
  projectId: "jtan-ai-canva",
  storageBucket: "jtan-ai-canva.firebasestorage.app",
  messagingSenderId: "714726274213",
  appId: "1:714726274213:web:d27dd27c5d98e1c42e494c",
  measurementId: "G-94B6LYZS5F"
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
