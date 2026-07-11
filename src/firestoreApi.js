// firestoreApi.js
// Remplace sheetsApi.js — memes methodes (readAll, append, update, delete,
// getSetting, setSetting) mais stockees dans Firestore au lieu de Google
// Sheets. Chaque utilisateur a ses propres donnees, isolees sous
// users/{uid}/{accounts|transactions|savings|settings}.

import {
  collection, doc, getDocs, setDoc, updateDoc, deleteDoc,
} from 'firebase/firestore';
import {
  signInWithPopup, onAuthStateChanged, signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth, googleProvider, db as firestore } from './firebase';

// ── ID generation (identique a l'ancienne version) ─────────────────────────
export const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// ── Main API class ──────────────────────────────────────────────────────────
class FirestoreDB {
  constructor() {
    this.cache = {};
    this.cacheTime = {};
    this.CACHE_MS = 10000; // 10s cache, comme avant
    this._inflight = {};
  }

  get uid() {
    return auth.currentUser?.uid || null;
  }

  _col(tabName) {
    if (!this.uid) throw new Error('Utilisateur non connecte');
    return collection(firestore, 'users', this.uid, tabName);
  }

  // Appele a la connexion/deconnexion pour ne pas melanger les caches
  // d'un utilisateur a l'autre.
  clearCache() {
    this.cache = {};
    this.cacheTime = {};
    this._inflight = {};
  }

  async readAll(tabName) {
    const now = Date.now();
    if (this.cache[tabName] && now - this.cacheTime[tabName] < this.CACHE_MS) {
      return this.cache[tabName];
    }
    if (this._inflight[tabName]) {
      return this._inflight[tabName];
    }
    const promise = getDocs(this._col(tabName))
      .then(snap => {
        const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        this.cache[tabName] = rows;
        this.cacheTime[tabName] = now;
        delete this._inflight[tabName];
        return rows;
      })
      .catch(e => {
        delete this._inflight[tabName];
        throw new Error(`Erreur lecture (${tabName}): ${e.message || e}`);
      });
    this._inflight[tabName] = promise;
    return promise;
  }

  async append(tabName, obj) {
    const id = obj.id || genId();
    // Garde la date de creation d'origine si elle existe deja (utile pour
    // la migration depuis Google Sheets), sinon en genere une nouvelle.
    const data = { ...obj, id, createdAt: obj.createdAt || new Date().toISOString() };
    try {
      await setDoc(doc(this._col(tabName), id), data);
    } catch (e) {
      throw new Error(`Erreur ajout (${tabName}): ${e.message || e}`);
    }
    delete this.cache[tabName];
    return data;
  }

  async update(tabName, id, updates) {
    try {
      await updateDoc(doc(this._col(tabName), id), updates);
    } catch (e) {
      throw new Error(`Erreur mise a jour (${tabName}): ${e.message || e}`);
    }
    delete this.cache[tabName];
  }

  async delete(tabName, id) {
    try {
      await deleteDoc(doc(this._col(tabName), id));
    } catch (e) {
      throw new Error(`Erreur suppression (${tabName}): ${e.message || e}`);
    }
    delete this.cache[tabName];
  }

  // ── Settings helpers (identique a l'ancienne interface) ──────────────────
  async getSetting(key) {
    const rows = await this.readAll('settings');
    return rows.find(r => r.key === key)?.value ?? null;
  }

  async setSetting(key, value) {
    const rows = await this.readAll('settings');
    const existing = rows.find(r => r.key === key);
    if (existing) {
      await this.update('settings', existing.id, { value: String(value) });
    } else {
      await this.append('settings', { id: genId(), key, value: String(value) });
    }
  }
}

export const db = new FirestoreDB();

// ── Auth Google via Firebase (remplace gapi/tokenClient) ───────────────────
export const signInWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
};

export const signOutUser = async () => {
  db.clearCache();
  await firebaseSignOut(auth);
};

// S'abonne aux changements de connexion (connexion, deconnexion, session
// restauree automatiquement au chargement de la page).
export const subscribeToAuth = (callback) => onAuthStateChanged(auth, callback);
