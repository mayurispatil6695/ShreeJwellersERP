// firebase.ts
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD0ALNJXGKncoM3A1-4dVuk7IclERxUZ50",
  authDomain: "shree-jewellers-93a97.firebaseapp.com",
  databaseURL: "https://shree-jewellers-93a97-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "shree-jewellers-93a97",
  storageBucket: "shree-jewellers-93a97.firebasestorage.app",
  messagingSenderId: "343874127920",
  appId: "1:343874127920:web:be6a826e127fbd28d9c5f5",
  measurementId: "G-7Z2C976384"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const database = getDatabase(app);
const db = database; // alias for compatibility

export { app, analytics, auth, database, db };