import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDeS9pG468xGTcSBb31GBli3n4ZUWo5sVc",
  authDomain: "jewellery-1f0be.firebaseapp.com",
  databaseURL: "https://jewellery-1f0be-default-rtdb.firebaseio.com",
  projectId: "jewellery-1f0be",
  storageBucket: "jewellery-1f0be.firebasestorage.app",
  messagingSenderId: "917180969234",
  appId: "1:917180969234:web:75fcfc29beee95610183cb",
  measurementId: "G-50L5BZBP0T"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export default app;
