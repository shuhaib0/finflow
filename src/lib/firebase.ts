// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBtXfQMkeIfFzHKZZNkMwSA49cNwMouLDY",
  authDomain: "ailutions-finance-hub.firebaseapp.com",
  projectId: "ailutions-finance-hub",
  storageBucket: "ailutions-finance-hub.storageBucket",
  messagingSenderId: "180081337020",
  appId: "1:180081337020:web:b2812e5944bd224dd4a6b9"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
