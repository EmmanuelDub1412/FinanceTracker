import React, { useState } from 'react';

export default function SheetConnect({ user, onConnect, onCreate, onLogout, loading, error }) {
  const [sheetId, setSheetId] = useState(localStorage.getItem('ft_sheet_id') || '');
  const [mode, setMode] = useState('create'); // 'create' | 'existing'

  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: 500, textAlign: 'left' }}>
        {/* User chip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, padding: '10px 14px', background: 'var(--bg3)', borderRadius: 10, border: '1px solid var(--border)' }}>
          <img src={user?.picture || user?.photoURL} alt="" style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid var(--gold2)' }}/>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.name || user?.displayName}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>{user?.email} · Connecté ✅</div>
          </div>
          <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={onLogout}>Déconnecter</button>
        </div>

        <div style={{ fontFamily: 'var(--fd)', fontSize: '1.3rem', marginBottom: 6 }}>
          Lier votre Google Sheet
        </div>
        <div style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 20 }}>
          Vos données financières seront stockées dans votre propre Google Drive.
        </div>

        {/* Mode tabs */}
        <div className="tabs">
          <div className={`tab ${mode === 'create' ? 'on' : ''}`} onClick={() => setMode('create')}>🆕 Créer automatiquement</div>
          <div className={`tab ${mode === 'existing' ? 'on' : ''}`} onClick={() => setMode('existing')}>🔗 Connecter existant</div>
        </div>

        {error && (
          <div style={{ background: 'var(--red-bg)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 8, padding: '12px 14px', fontSize: 13, color: 'var(--red)', marginBottom: 16 }}>
            ⚠ {error}
          </div>
        )}

        {mode === 'create' ? (
          <div>
            <div style={{ background: 'var(--green-bg)', border: '1px solid rgba(34,197,94,.2)', borderRadius: 10, padding: '14px 16px', fontSize: 13, color: 'var(--text2)', marginBottom: 20, lineHeight: 1.8 }}>
              <div style={{ color: 'var(--green)', fontWeight: 600, marginBottom: 4 }}>✅ Option recommandée</div>
              L'app crée un Google Sheet nommé <strong style={{ color: 'var(--text)' }}>"FinTrack Haiti — Finances Personnelles"</strong> dans votre Google Drive avec tous les onglets préconfigurés. Un seul clic.
            </div>
            <button className="btn btn-gold btn-lg" style={{ width: '100%', justifyContent: 'center' }}
              onClick={onCreate} disabled={loading}>
              {loading ? '⏳ Création en cours...' : '✨ Créer mon Google Sheet et démarrer'}
            </button>
          </div>
        ) : (
          <div className="fgrid">
            <div style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.8, marginBottom: 4 }}>
              Collez l'ID de votre Google Sheet existant.<br/>
              <span style={{ fontSize: 12, color: 'var(--text3)' }}>
                Trouvez-le dans l'URL : <code style={{ color: 'var(--gold)', fontSize: 11 }}>docs.google.com/spreadsheets/d/<strong>ID-ICI</strong>/edit</code>
              </span>
            </div>
            <div className="fg">
              <label className="fl">ID du Google Sheet</label>
              <input className="fi" value={sheetId}
                onChange={e => setSheetId(e.target.value)}
                placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"/>
            </div>
            <button className="btn btn-gold" style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => onConnect(sheetId)} disabled={!sheetId.trim() || loading}>
              {loading ? '⏳ Connexion...' : '🔗 Connecter ce Sheet'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
