// firebase.js
// Configuration Firebase (Auth + Firestore) — remplace Google Sheets comme backend.
// Reutilise le meme projet Firebase que le prototype (fintrak-af1ce).
//
// Le Storage (pieces jointes) est branche sur un DEUXIEME projet Firebase
// (lumivolt-database), qui a du credit/un plan Storage actif, pendant que
// l'auth et Firestore restent sur fintrak-af1ce.
//
// IMPORTANT : un token d'authentification de fintrak-af1ce n'est PAS
// reconnu par les regles de securite Storage de lumivolt-database (deux
// projets = deux emetteurs de token distincts). On ouvre donc une session
// anonyme dediee sur lumivolt-database, geree automatiquement en arriere-
// plan, uniquement pour que Storage puisse voir "request.auth != null".
// Ca ne remplace pas la vraie connexion (Google/email) de l'utilisateur,
// qui reste geree par fintrak-af1ce.

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyATqeoZh-4oHci0HYu194c-hMELt3HOCPU',
  authDomain: 'fintrak-af1ce.firebaseapp.com',
  projectId: 'fintrak-af1ce',
  storageBucket: 'fintrak-af1ce.firebasestorage.app',
  messagingSenderId: '107852012757',
  appId: '1:107852012757:web:b6549324ce892e0bfa565c',
};

// Config du compte qui porte le Storage (credit/plan Blaze actif).
const storageFirebaseConfig = {
  apiKey: 'AIzaSyCsXtw9QqvrhNy2YKg4wqiJKwKWFG3E9G0',
  authDomain: 'lumivolt-database.firebaseapp.com',
  projectId: 'lumivolt-database',
  storageBucket: 'lumivolt-database.firebasestorage.app',
  messagingSenderId: '232887648533',
  appId: '1:232887648533:web:4506955f28a0d18d66a91c',
};

const app = initializeApp(firebaseConfig);
// Deuxieme app nommee 'storage-app' : necessaire des qu'on initialise plus
// d'un projet Firebase dans la meme page (sinon initializeApp() ecraserait
// la premiere instance).
const storageApp = initializeApp(storageFirebaseConfig, 'storage-app');
const storageAuth = getAuth(storageApp);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(storageApp);

// Assure qu'une session anonyme est ouverte sur lumivolt-database avant
// tout upload/suppression de piece jointe. Reutilise la session existante
// si elle est deja active (ne recree pas une session a chaque appel).
export const ensureStorageAuth = async () => {
  if (!storageAuth.currentUser) {
    await signInAnonymously(storageAuth);
  }
  return storageAuth.currentUser;
};
