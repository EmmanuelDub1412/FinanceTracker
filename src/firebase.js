// firebase.js
// Configuration Firebase (Auth + Firestore) — remplace Google Sheets comme backend.
// Reutilise le meme projet Firebase que le prototype (fintrak-af1ce).

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyATqeoZh-4oHci0HYu194c-hMELt3HOCPU',
  authDomain: 'fintrak-af1ce.firebaseapp.com',
  projectId: 'fintrak-af1ce',
  storageBucket: 'fintrak-af1ce.firebasestorage.app',
  messagingSenderId: '107852012757',
  appId: '1:107852012757:web:b6549324ce892e0bfa565c',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
