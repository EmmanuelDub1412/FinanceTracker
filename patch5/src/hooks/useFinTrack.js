import { useState, useEffect, useCallback } from 'react';
import { db, genId, loadGapi, signIn, signOut as gsignOut, getAccessToken } from '../sheetsApi';

export default function useFinTrack(clientId) {
  const [authState, setAuthState] = useState('loading');
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

  // Load GAPI
  useEffect(() => {
    loadGapi()
      .then(() => setGapiReady(true))
      .catch(e => setError('Erreur chargement Google API: ' + e.message));
  }, []);

  // Restore session
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
      } catch { setAuthState('setup'); }
    } else {
      setAuthState('setup');
    }
  }, [gapiReady]);

  // ── Fetch all data ─────────────────────────────────────────────────────
  const fetchAll = useCallback(async (sheetId) => {
    if (!sheetId) return;
    setSyncing(true);
    try {
      // Clear all caches to force fresh read
      db.cache = {};
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

  // ── Sign in ────────────────────────────────────────────────────────────
  const login = useCallback(async () => {
    if (!gapiReady) return;
    try {
      setError(null);
      await signIn(clientId);
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

  // ── Connect sheet ──────────────────────────────────────────────────────
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
      setError('Impossible de connecter ce Google Sheet. Détail: ' + e.message);
    } finally { setLoading(false); }
  }, [fetchAll]);

  // ── Create new sheet ───────────────────────────────────────────────────
  const createNewSheet = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const resp = await window.gapi.client.sheets.spreadsheets.create({
        resource: { properties: { title: 'FinTrack — Finances Personnelles' } },
      });
      await connectSheet(resp.result.spreadsheetId);
    } catch(e) {
      setError('Erreur création Google Sheet: ' + e.message);
      setLoading(false);
    }
  }, [connectSheet]);

  // ── Logout ─────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    gsignOut();
    localStorage.removeItem('ft_user');
    localStorage.removeItem('ft_token');
    setUser(null); setAuthState('setup');
    setAccounts([]); setTransactions([]); setSavings([]);
  }, []);

  const refresh = useCallback(() => fetchAll(spreadsheetId), [fetchAll, spreadsheetId]);

  // ── withSync: write → wait → clear cache → re-read ────────────────────
  const withSync = useCallback(async (fn) => {
    setSyncing(true);
    try {
      await fn();
      // Wait for Sheets API to propagate the write
      await new Promise(r => setTimeout(r, 1000));
      // Force full cache clear
      db.cache = {};
      await fetchAll(spreadsheetId);
    } catch(e) {
      setError('Erreur: ' + e.message);
    } finally {
      setSyncing(false);
    }
  }, [fetchAll, spreadsheetId]);

  // ── CRUD ───────────────────────────────────────────────────────────────
  const addAccount     = d => withSync(() => db.append('accounts',     { ...d, id: genId() }));
  const updateAccount  = (id,d) => withSync(() => db.update('accounts', id, d));
  const deleteAccount  = id => withSync(() => db.delete('accounts', id));

  const addTransaction    = d => withSync(() => db.append('transactions',    { ...d, id: genId() }));
  const updateTransaction = (id,d) => withSync(() => db.update('transactions', id, d));
  const deleteTransaction = id => withSync(() => db.delete('transactions', id));

  const addSaving    = d => withSync(() => db.append('savings',    { ...d, id: genId() }));
  const updateSaving = (id,d) => withSync(() => db.update('savings', id, d));
  const deleteSaving = id => withSync(() => db.delete('savings', id));

  const saveSetting = async (key, value) => {
    await db.setSetting(key, value);
    db.cache = {};
    setSettings(s => ({ ...s, [key]: value }));
  };

  return {
    authState, user, gapiReady, login, logout,
    spreadsheetId, connectSheet, createNewSheet,
    accounts, transactions, savings, settings,
    loading, syncing, error, refresh,
    addAccount, updateAccount, deleteAccount,
    addTransaction, updateTransaction, deleteTransaction,
    addSaving, updateSaving, deleteSaving,
    saveSetting, setError,
  };
}
