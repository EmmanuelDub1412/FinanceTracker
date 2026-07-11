import { useState, useEffect, useCallback, useRef } from 'react';
import { db, genId, signInWithGoogle, signOutUser, subscribeToAuth } from '../firestoreApi';
// ─────────────────────────────────────────────────────────────────────────────
// Central hook: manages auth state + all CRUD against Firestore.
// (Anciennement base sur Google Sheets — voir sheetsApi.js pour l'ancienne
// version, conservee pour reference / migration.)
// ─────────────────────────────────────────────────────────────────────────────
export default function useFinTrack() {
  const [authState, setAuthState] = useState('loading'); // loading | authed
  const [user, setUser]           = useState(null);
  const [accounts,     setAccounts]     = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [savings,      setSavings]      = useState([]);
  const [settings,     setSettings]     = useState({ usdToHtg: 130 });
  const [loading,      setLoading]      = useState(false);
  const [syncing,      setSyncing]      = useState(false);
  const [error,        setError]        = useState(null);
  const pollRef = useRef(null);
  // ── Fetch all data ─────────────────────────────────────────────────────
  // Chaque lecture tourne independamment via Promise.allSettled pour qu'un
  // echec isole (ex: aucun parametre encore enregistre) ne bloque pas les
  // autres et n'efface pas les donnees deja chargees avec succes.
  const fetchAll = useCallback(async () => {
    setSyncing(true);
    const [accsR, txsR, savsR, rateR] = await Promise.allSettled([
      db.readAll('accounts'),
      db.readAll('transactions'),
      db.readAll('savings'),
      db.getSetting('usdToHtg'),
    ]);
    const failures = [];
    if (accsR.status === 'fulfilled') {
      setAccounts(accsR.value.filter(a => a.id));
    } else {
      failures.push(accsR.reason?.message || String(accsR.reason));
    }
    if (txsR.status === 'fulfilled') {
      setTransactions(txsR.value.filter(t => t.id).sort((a,b) => b.date.localeCompare(a.date)));
    } else {
      failures.push(txsR.reason?.message || String(txsR.reason));
    }
    if (savsR.status === 'fulfilled') {
      setSavings(savsR.value.filter(s => s.id));
    } else {
      failures.push(savsR.reason?.message || String(savsR.reason));
    }
    if (rateR.status === 'fulfilled') {
      if (rateR.value) setSettings(s => ({ ...s, usdToHtg: Number(rateR.value) }));
    } else {
      failures.push(rateR.reason?.message || String(rateR.reason));
    }
    if (failures.length > 0) {
      setError('Erreur lecture: ' + failures.join(' | '));
    } else {
      setError(null);
    }
    setSyncing(false);
  }, []);
  // ── Ecoute l'etat de connexion Firebase ─────────────────────────────────
  // Firebase garde la session en cache automatiquement (IndexedDB), donc
  // pas besoin de gerer nous-memes localStorage pour l'utilisateur/le token.
  useEffect(() => {
    const unsubscribe = subscribeToAuth((firebaseUser) => {
      setUser(firebaseUser);
      setAuthState('authed');
      if (firebaseUser) {
        fetchAll();
      } else {
        setAccounts([]); setTransactions([]); setSavings([]);
      }
    });
    return unsubscribe;
  }, [fetchAll]);
  // ── Sign in with Google ────────────────────────────────────────────────
  const login = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      await signInWithGoogle();
      // onAuthStateChanged (ci-dessus) met a jour `user` et recharge les
      // donnees automatiquement, pas besoin de le refaire ici.
    } catch(e) {
      setError('Erreur connexion: ' + (e.message || JSON.stringify(e)));
    } finally {
      setLoading(false);
    }
  }, []);
  // ── Sign out ───────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await signOutUser();
    setUser(null);
    setAccounts([]); setTransactions([]); setSavings([]);
  }, []);
  // ── CRUD helpers ───────────────────────────────────────────────────────
  const refresh = useCallback(() => fetchAll(), [fetchAll]);
  const withSync = useCallback(async (fn) => {
    setSyncing(true);
    try {
      await fn();
      await fetchAll();
    }
    catch(e) { setError('Erreur: ' + (e.message || e)); }
    finally { setSyncing(false); }
  }, [fetchAll]);
  // accounts
  const addAccount     = (data) => withSync(() => db.append('accounts', { ...data, id: genId() }));
  const updateAccount  = (id, data) => withSync(() => db.update('accounts', id, data));
  const deleteAccount  = (id) => withSync(() => db.delete('accounts', id));
  // transactions
  const addTransaction    = (data) => withSync(() => db.append('transactions', { ...data, id: genId() }));
  const updateTransaction = (id, data) => withSync(() => db.update('transactions', id, data));
  const deleteTransaction = (id) => withSync(() => db.delete('transactions', id));
  // savings
  const addSaving    = (data) => withSync(() => db.append('savings', { ...data, id: genId() }));
  const updateSaving = (id, data) => withSync(() => db.update('savings', id, data));
  const deleteSaving = (id) => withSync(() => db.delete('savings', id));
  // settings
  const saveSetting = async (key, value) => {
    await db.setSetting(key, value);
    setSettings(s => ({ ...s, [key]: value }));
  };
  return {
    // auth
    authState, user, gapiReady: true, login, logout,
    // data
    accounts, transactions, savings, settings,
    loading, syncing, error, refresh,
    // CRUD
    addAccount, updateAccount, deleteAccount,
    addTransaction, updateTransaction, deleteTransaction,
    addSaving, updateSaving, deleteSaving,
    saveSetting,
    // helpers
    setError,
  };
}
