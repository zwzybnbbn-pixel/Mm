// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyA92B6JE3Msm_qXnfprubUg2U3ifhIRxn4",
  authDomain: "doctors-system-7d64e.firebaseapp.com",
  projectId: "doctors-system-7d64e",
  storageBucket: "doctors-system-7d64e.firebasestorage.app",
  messagingSenderId: "729835276288",
  appId: "1:729835276288:web:b30656c5249f5ce24fb0e5",
  measurementId: "G-WSKVTW7MTK"
};

// تشغيل التطبيق
const app = initializeApp(firebaseConfig);

// التصدير لبقية الملفات
export const db = getFirestore(app);
export const auth = getAuth(app);