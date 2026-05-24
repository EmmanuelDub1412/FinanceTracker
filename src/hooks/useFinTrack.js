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
      .catch(e => setError('Erreur chargement Google API: ' + e.message));
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
  const fetchAll = useCallback(async (sheetId) => {
    if (!sheetId) return;
    setSyncing(true);
    try {
      // Re-init to ensure all tabs exist before reading
      await db.init(sheetId);
      const [accs, txs, savs] = await Promise.all([
        db.readAll('accounts'),
        db.readAll('transactions'),
        db.readAll('savings'),
      ]);
      const usdRate = await db.getSetting('usdToHtg');
      setAccounts(accs.filter(a => a.id));
      setTransactions(txs.filter(t => t.id).sort((a,b) => String(b.date||'').localeCompare(String(a.date||''))));
      setSavings(savs.filter(s => s.id));
      if (usdRate) setSettings(s => ({ ...s, usdToHtg: Number(usdRate) }));
    } catch(e) {
      setError('Erreur lecture: ' + e.message);
    } finally {
      setSyncing(false);
    }
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
      setError('Impossible de connecter ce Google Sheet. Vérifiez l\'ID et les permissions. Détail: ' + e.message);
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
      setError('Erreur création Google Sheet: ' + e.message);
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
    try { await fn(); await fetchAll(spreadsheetId); }
    catch(e) { setError('Erreur: ' + e.message); }
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
