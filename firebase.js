// firebase.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { 
  getFirestore 
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

import { 
  getAuth, 
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

// إعدادات مشروعك
const firebaseConfig = {
  apiKey: "AIzaSyDD7WNQ-fiyDudmDzVanIdvphDGkE1vuHA",
  authDomain: "maged-62b15.firebaseapp.com",
  projectId: "maged-62b15",
  storageBucket: "maged-62b15.firebasestorage.app",
  messagingSenderId: "309270610386",
  appId: "1:309270610386:web:516d841a75d6bf95d8880b",
  measurementId: "G-F8FK239XSV"
};

// تشغيل Firebase
const app = initializeApp(firebaseConfig);

// Firestore
export const db = getFirestore(app);

// Auth
export const auth = getAuth(app);

// دوال جاهزة للتسجيل والخروج والمتابعة
export const login = (email, pass) => 
  signInWithEmailAndPassword(auth, email, pass);

export const watchUser = (callback) =>
  onAuthStateChanged(auth, callback);

export const logout = () => signOut(auth);