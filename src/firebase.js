// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// --- Firebase config for your project ---
const firebaseConfig = {
  apiKey: "AIzaSyBcSy2ykYCl815xYOWBqDDPTH1EJgwfWQE",
  authDomain: "geep-fcb99.firebaseapp.com",
  projectId: "geep-fcb99",
  storageBucket: "geep-fcb99.appspot.com",
  messagingSenderId: "918582846529",
  appId: "1:918582846529:web:cf76eb41bb101dec1cd2c0"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
// persist session in browser local storage so user stays logged in
setPersistence(auth, browserLocalPersistence).catch((e) => console.warn("Auth persistence failed:", e));

export const db = getFirestore(app);
export const storage = getStorage(app);
