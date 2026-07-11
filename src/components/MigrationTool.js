import React, { useState } from 'react';
import { loadGapi, signIn as sheetsSignIn, db as sheetsDb } from '../sheetsApi';
import { db as firestoreDb } from '../firestoreApi';

// ─────────────────────────────────────────────────────────────────────────────
// MigrationTool: outil ponctuel — copie les donnees de l'ancien Google Sheet
// vers Firestore, une seule fois. A retirer de l'app une fois la migration
// faite (voir bouton dans Settings.js).
// ─────────────────────────────────────────────────────────────────────────────

// Meme Client ID OAuth qu'avant, utilise uniquement ici pour lire l'ancien
// Google Sheet (scope Sheets), separement de la connexion Firebase normale.
const OLD_CLIENT_ID = '512606910439-7f0795mn9j2u54daro59r261qfh0ntkj.apps.googleusercontent.com';

export default function MigrationTool({ onClose }) {
  const [sheetId, setSheetId] = useState(localStorage.getItem('ft_sheet_id') || '');
  const [status, setStatus] = useState('idle'); // idle | running | done | error
  const [log, setLog] = useState([]);

  const addLog = (msg) => setLog(l => [...l, msg]);

  const runMigration = async () => {
    if (!sheetId.trim()) {
      addLog('⚠ Entre l\'ID de ton ancien Google Sheet d\'abord.');
      return;
    }
    setStatus('running');
    setLog([]);
    try {
      addLog('Connexion a l\'API Google Sheets...');
      await loadGapi();
      await sheetsSignIn(OLD_CLIENT_ID);
      addLog('✓ Connecte a Google Sheets.');

      sheetsDb.setSpreadsheetId(sheetId.trim());

      addLog('Lecture des donnees existantes...');
      const [accounts, transactions, savings, settingsRows] = await Promise.all([
        sheetsDb.readAll('accounts'),
        sheetsDb.readAll('transactions'),
        sheetsDb.readAll('savings'),
        sheetsDb.readAll('settings'),
      ]);
      addLog(`✓ Lu : ${accounts.length} comptes, ${transactions.length} transactions, ${savings.length} objectifs d'epargne, ${settingsRows.length} parametres.`);

      addLog('Ecriture dans Firestore...');
      for (const a of accounts.filter(r => r.id)) {
        await firestoreDb.append('accounts', a);
      }
      for (const t of transactions.filter(r => r.id)) {
        await firestoreDb.append('transactions', t);
      }
      for (const s of savings.filter(r => r.id)) {
        await firestoreDb.append('savings', s);
      }
      for (const s of settingsRows.filter(r => r.key)) {
        await firestoreDb.setSetting(s.key, s.value);
      }
      addLog('✓ Migration terminee avec succes !');
      setStatus('done');
    } catch (e) {
      addLog('✗ Erreur : ' + (e.message || JSON.stringify(e)));
      setStatus('error');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '32px 20px', display: 'flex', justifyContent: 'center' }}>
      <div className="wizard" style={{ maxWidth: 560 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--fd)', fontSize: '1.8rem', marginBottom: 6 }}>
            Migration des donnees
          </div>
          <div style={{ color: 'var(--text2)', fontSize: 14 }}>
            Copie tes anciennes donnees Google Sheets vers la nouvelle base — a faire une seule fois.
          </div>
        </div>

        <div className="step">
          <div className="step-body">
            <p style={{ marginBottom: 10 }}>ID de ton ancien Google Sheet (trouvable dans son URL) :</p>
            <div className="fg">
              <input className="fi" value={sheetId} onChange={e => setSheetId(e.target.value)}
                placeholder="1AbC...XyZ" disabled={status === 'running'}/>
            </div>

            <button className="btn btn-gold btn-lg" style={{ marginTop: 16, width: '100%', justifyContent: 'center' }}
              onClick={runMigration} disabled={status === 'running'}>
              {status === 'running' ? 'Migration en cours...' : '▶ Lancer la migration'}
            </button>

            {log.length > 0 && (
              <div style={{ marginTop: 16, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: 12, fontSize: 12, fontFamily: 'monospace', lineHeight: 1.8 }}>
                {log.map((l, i) => <div key={i}>{l}</div>)}
              </div>
            )}

            {status === 'done' && (
              <button className="btn btn-ghost" style={{ width: '100%', marginTop: 16, justifyContent: 'center' }}
                onClick={onClose}>← Retour a l'app</button>
            )}
            {status !== 'running' && status !== 'done' && (
              <button className="btn btn-ghost" style={{ width: '100%', marginTop: 12, justifyContent: 'center' }}
                onClick={onClose}>Annuler</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
