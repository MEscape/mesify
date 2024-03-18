import { initializeApp } from 'firebase/app';
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDxvCUFGRSAdbcvyOcU9xQtELM3cSO4NRY",
    authDomain: "mesify-d32b1.firebaseapp.com",
    projectId: "mesify-d32b1",
    storageBucket: "mesify-d32b1.appspot.com",
    messagingSenderId: "307692437856",
    appId: "1:307692437856:web:3723c75fed26e4b7cb1e05"
};

export const FIREBASE_APP = initializeApp(firebaseConfig);
export const FIREBASE_AUTH = getAuth(FIREBASE_APP);
export const FIREBASE_FIRESTORE = getFirestore(FIREBASE_APP);
export const FIREBASE_STORAGE = getStorage(FIREBASE_APP);

// For more information on how to access Firebase in your project,
// see the Firebase documentation: https://firebase.google.com/docs/web/setup#access-firebase
