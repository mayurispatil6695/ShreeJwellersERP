import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration (shree-jewellers-erp)
const firebaseConfig = {
  apiKey: "AIzaSyAWkPgMA5-sczqVUtVkKR-WOePvyTKdw3o",
  authDomain: "shree-jewellers-erp.firebaseapp.com",
  databaseURL: "https://shree-jewellers-erp-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "shree-jewellers-erp",
  storageBucket: "shree-jewellers-erp.firebasestorage.app",
  messagingSenderId: "180059515236",
  appId: "1:180059515236:web:323f0668dd511b21edf271",
  measurementId: "G-F8BBLRCS1Z"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const database = getDatabase(app);
const db = database;  // 👈 alias for compatibility

export { app, analytics, auth, database, db };