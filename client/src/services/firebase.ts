import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInAnonymously,
  onAuthStateChanged,
  signOut as firebaseSignOut
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  getDocs,
  doc,
  setDoc,
  getDoc
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const isFirebaseConfigured = !!import.meta.env.VITE_FIREBASE_API_KEY;

let app, firebaseAuth, firestore, googleProvider;

if (isFirebaseConfigured) {
    app = initializeApp(firebaseConfig);
    firebaseAuth = getAuth(app);
    firestore = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
} else {
    console.warn("Firebase API Key missing. Running in Local Mode.");
}

export const auth = {
    get currentUser() {
        return isFirebaseConfigured ? firebaseAuth.currentUser : null;
    },
    onAuthStateChanged: (callback) => {
        if (!isFirebaseConfigured) return () => {};
        return onAuthStateChanged(firebaseAuth, callback);
    },
    signInWithGoogle: async () => {
        if (!isFirebaseConfigured) throw new Error("Firebase not configured");
        const result = await signInWithPopup(firebaseAuth, googleProvider);
        await db.createOrUpdateProfile(result.user);
        return result.user;
    },
    signInAsGuest: async () => {
        if (!isFirebaseConfigured) throw new Error("Firebase not configured");
        const result = await signInAnonymously(firebaseAuth);
        return result.user;
    },
    signOut: async () => {
        if (!isFirebaseConfigured) return;
        return firebaseSignOut(firebaseAuth);
    }
};

export const db = {
    createOrUpdateProfile: async (user: any) => {
        if (!isFirebaseConfigured || !user) return;
        const userRef = doc(firestore, 'users', user.uid);
        const docSnap = await getDoc(userRef);
        if (!docSnap.exists()) {
            await setDoc(userRef, {
                displayName: user.displayName || 'Guest Player',
                photoURL: user.photoURL || null,
                mmr: 1200,
                matchesPlayed: 0,
                wins: 0,
                createdAt: new Date()
            });
        }
    },
    saveMatchHistory: async (matchData: any) => {
        if (!isFirebaseConfigured) return;
        try {
            await addDoc(collection(firestore, 'match_history'), matchData);
        } catch (e) {
            console.error("Error saving match:", e);
        }
    },
    getLeaderboard: async () => {
        if (!isFirebaseConfigured) return [];
        try {
            const q = query(collection(firestore, 'users'), orderBy('mmr', 'desc'), limit(50));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => doc.data());
        } catch (e) {
            console.error("Error getting leaderboard:", e);
            return [];
        }
    }
};
