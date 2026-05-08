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

const app = initializeApp(firebaseConfig);
const firebaseAuth = getAuth(app);
const firestore = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export const auth = {
    get currentUser() {
        return firebaseAuth.currentUser;
    },
    onAuthStateChanged: (callback) => {
        return onAuthStateChanged(firebaseAuth, callback);
    },
    signInWithGoogle: async () => {
        const result = await signInWithPopup(firebaseAuth, googleProvider);
        await db.createOrUpdateProfile(result.user);
        return result.user;
    },
    signInAsGuest: async () => {
        const result = await signInAnonymously(firebaseAuth);
        return result.user;
    },
    signOut: async () => {
        return firebaseSignOut(firebaseAuth);
    }
};

export const db = {
    createOrUpdateProfile: async (user: any) => {
        if (!user) return;
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
        try {
            await addDoc(collection(firestore, 'match_history'), matchData);
        } catch (e) {
            console.error("Error saving match:", e);
        }
    },
    getLeaderboard: async () => {
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
