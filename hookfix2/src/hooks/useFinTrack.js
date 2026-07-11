import { useState, useEffect, useCallback, useRef } from 'react';
import { db, genId, loadGapi, signIn, signOut as gsignOut, getAccessToken } from '../sheetsApi';
// ─────────────────────────────────────────────────────────────────────────────
// Central hook: manages auth state + all CRUD against Google Sheets
// ─────────────────────────────────────────────────────────────────────────────
export default function useFinTrack(clientId) {
  const [authState, setAuthState] = useState('loading'); // loading | setup | authed
  const [user, setUser]           = useState(null);
  const [spreadsheetId, setSpreadsheetId] = useState(() => localStorage.getItem('ft_sheet_id') || '');
  const [gapiReady, setGapiReady] = useState(false);
  const [accounts,     setAccounts]     = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [savings,      setSavings]      = useState([]);
  const [settings,     setSettings]     = useState({ usdToHtg: 130 });
  const [loading,      setLoading]      = useState(false);
  const [syncing,      setSyncing]      = useState(false);
  const [error,        setError]        = useState(null);
  const pollRef = useRef(null);
  // ── Load GAPI on mount ─────────────────────────────────────────────────
  useEffect(() => {
    loadGapi()
      .then(() => { setGapiReady(true); })
      .catch(e => setError('Erreur chargement Google API: ' + (e?.message || e)));
  }, []);
  // ── Restore session from localStorage ─────────────────────────────────
  useEffect(() => {
    if (!gapiReady) return;
    const savedUser  = localStorage.getItem('ft_user');
    const savedSheet = localStorage.getItem('ft_sheet_id');
    const savedToken = localStorage.getItem('ft_token');
    if (savedUser && savedSheet && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
        window.gapi.client.setToken({ access_token: savedToken });
        db.setSpreadsheetId(savedSheet);
        setSpreadsheetId(savedSheet);
        setAuthState('authed');
        fetchAll(savedSheet);
      } catch {
        setAuthState('setup');
      }
    } else {
      setAuthState('setup');
    }
  }, [gapiReady]);
  // ── Fetch all data ─────────────────────────────────────────────────────
  // Each read runs independently via Promise.allSettled so that one failing
  // call (e.g. settings on a brand-new sheet) can't block the others from
  // loading and can't wipe out data that already read successfully.
  const fetchAll = useCallback(async (sheetId) => {
    if (!sheetId) return;
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
  // ── Sign in with Google ────────────────────────────────────────────────
  const login = useCallback(async () => {
    if (!gapiReady) return;
    try {
      setError(null);
      const resp = await signIn(clientId);
      // Decode JWT to get user info
      const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: 'Bearer ' + getAccessToken() },
      }).then(r => r.json());
      setUser(userInfo);
      localStorage.setItem('ft_user', JSON.stringify(userInfo));
      localStorage.setItem('ft_token', getAccessToken());
      setAuthState('setup');
    } catch(e) {
      setError('Erreur connexion: ' + (e.error_description || e.message || JSON.stringify(e)));
    }
  }, [gapiReady, clientId]);
  // ── Connect to a spreadsheet ───────────────────────────────────────────
  const connectSheet = useCallback(async (sheetId) => {
    setLoading(true); setError(null);
    try {
      await db.init(sheetId);
      localStorage.setItem('ft_sheet_id', sheetId);
      db.setSpreadsheetId(sheetId);
      setSpreadsheetId(sheetId);
      await fetchAll(sheetId);
      setAuthState('authed');
    } catch(e) {
      setError('Impossible de connecter ce Google Sheet. Vérifiez l\'ID et les permissions. Détail: ' + (e?.message || e));
    } finally {
      setLoading(false);
    }
  }, [fetchAll]);
  // ── Create a new sheet automatically ──────────────────────────────────
  const createNewSheet = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const resp = await window.gapi.client.sheets.spreadsheets.create({
        resource: {
          properties: { title: 'FinTrack Haiti — Finances Personnelles' },
        },
      });
      const newId = resp.result.spreadsheetId;
      await connectSheet(newId);
    } catch(e) {
      setError('Erreur création Google Sheet: ' + (e?.result?.error?.message || e?.message || e));
      setLoading(false);
    }
  }, [connectSheet]);
  // ── Sign out ───────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    gsignOut();
    localStorage.removeItem('ft_user');
    localStorage.removeItem('ft_token');
    setUser(null); setAuthState('setup');
    setAccounts([]); setTransactions([]); setSavings([]);
  }, []);
  // ── CRUD helpers ───────────────────────────────────────────────────────
  const refresh = useCallback(() => fetchAll(spreadsheetId), [fetchAll, spreadsheetId]);
  const withSync = useCallback(async (fn) => {
    setSyncing(true);
    try {
      await fn();
      // Google Sheets API needs a moment to propagate a write before it's
      // reliably readable again. Without this delay, the refetch below can
      // return stale data and a just-added row appears to vanish.
      await new Promise(r => setTimeout(r, 1000));
      await fetchAll(spreadsheetId);
    }
    catch(e) { setError('Erreur: ' + (e?.result?.error?.message || e?.message || e)); }
    finally { setSyncing(false); }
  }, [fetchAll, spreadsheetId]);
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
    authState, user, gapiReady, login, logout,
    spreadsheetId, connectSheet, createNewSheet,
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
