import React, { useState } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// SetupWizard: walks user through Google Cloud Console + Sheets setup
// Shows inside the app — no need to read a README
// ─────────────────────────────────────────────────────────────────────────────

const REDIRECT_ORIGIN = window.location.origin;

function CopyRow({ value, label }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="copy-row">
      <div className="copy-val" title={value}>{value}</div>
      <button className="copy-btn" onClick={copy}>{copied ? '✓ Copié !' : '📋 Copier'}</button>
    </div>
  );
}

export default function SetupWizard({ onClientIdSaved, onLogin, gapiReady, error, loading }) {
  const [clientId, setClientId] = useState(localStorage.getItem('ft_client_id') || '');
  const [sheetId,  setSheetId]  = useState(localStorage.getItem('ft_sheet_id')  || '');
  const [step,     setStep]     = useState(0); // 0=guide, 1=connect

  const saveAndContinue = () => {
    if (!clientId.trim()) return;
    localStorage.setItem('ft_client_id', clientId.trim());
    onClientIdSaved(clientId.trim());
    setStep(1);
  };

  if (step === 1) {
    return (
      <div className="login-page">
        <div className="login-card" style={{ maxWidth: 480 }}>
          <div className="login-logo">Fin<em>Track</em></div>
          <div className="login-tag">Connectez votre compte Google<br/>pour accéder à vos données</div>

          {error && (
            <div style={{ background: 'var(--red-bg)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 8, padding: '12px 14px', fontSize: 13, color: 'var(--red)', marginBottom: 16, textAlign: 'left' }}>
              ⚠ {error}
            </div>
          )}

          <button className="btn-goog" onClick={onLogin} disabled={!gapiReady || loading}>
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {loading ? 'Connexion...' : 'Se connecter avec Google'}
          </button>

          <button className="btn btn-ghost" style={{ width: '100%', marginTop: 12, justifyContent: 'center' }}
            onClick={() => setStep(0)}>← Retour au guide</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '32px 20px' }}>
      <div className="wizard">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: 'var(--fd)', fontSize: '2.2rem', marginBottom: 6 }}>
            Fin<em style={{ color: 'var(--gold)', fontStyle: 'normal' }}>Track</em>
            <span style={{ fontSize: 12, fontFamily: 'var(--fb)', color: 'var(--text3)', letterSpacing: 2, marginLeft: 8, textTransform: 'uppercase' }}>Haiti</span>
          </div>
          <div style={{ color: 'var(--text2)', fontSize: 14 }}>
            Configuration initiale — ~10 minutes · Gratuit
          </div>
        </div>

        {/* Intro box */}
        <div style={{ background: 'var(--gold-bg)', border: '1px solid rgba(201,168,76,.2)', borderRadius: 12, padding: '16px 20px', marginBottom: 24, fontSize: 13, color: 'var(--gold)', lineHeight: 1.8 }}>
          <strong>Comment ça fonctionne :</strong> FinTrack utilise votre propre Google Sheet comme base de données. 
          Vos finances restent dans votre Google Drive — aucune donnée ne passe par un serveur tiers. 
          L'app est hébergée sur GitHub Pages, totalement gratuite.
        </div>

        {/* STEP 1 */}
        <div className="step">
          <div className="step-title">
            <span className="step-num">1</span>
            Créer un projet Google Cloud
          </div>
          <div className="step-body">
            <p>Allez sur <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" style={{ color: 'var(--blue)' }}>console.cloud.google.com</a></p>
            <p>→ Cliquez <strong style={{ color: 'var(--text)' }}>« Sélectionner un projet »</strong> en haut → <strong style={{ color: 'var(--text)' }}>« Nouveau projet »</strong></p>
            <p>→ Nom du projet : <code>fintrack-haiti</code> → <strong style={{ color: 'var(--text)' }}>Créer</strong></p>
            <div className="tip">💡 Si c'est votre premier projet Google Cloud, cliquez simplement "Nouveau projet" dans le menu déroulant en haut de la page.</div>
          </div>
        </div>

        {/* STEP 2 */}
        <div className="step">
          <div className="step-title">
            <span className="step-num">2</span>
            Activer l'API Google Sheets
          </div>
          <div className="step-body">
            <p>Dans votre projet → menu de gauche → <strong style={{ color: 'var(--text)' }}>APIs &amp; Services</strong> → <strong style={{ color: 'var(--text)' }}>Bibliothèque</strong></p>
            <p>→ Rechercher <code>Google Sheets API</code> → Cliquer → <strong style={{ color: 'var(--text)' }}>Activer</strong></p>
            <p>→ Refaire la même chose pour <code>Google Drive API</code></p>
          </div>
        </div>

        {/* STEP 3 */}
        <div className="step">
          <div className="step-title">
            <span className="step-num">3</span>
            Créer les identifiants OAuth
          </div>
          <div className="step-body">
            <p>→ <strong style={{ color: 'var(--text)' }}>APIs &amp; Services</strong> → <strong style={{ color: 'var(--text)' }}>Identifiants</strong> → <strong style={{ color: 'var(--text)' }}>+ Créer des identifiants</strong> → <strong style={{ color: 'var(--text)' }}>ID client OAuth</strong></p>
            <br/>
            <p><strong style={{ color: 'var(--text)' }}>Si c'est la première fois :</strong> cliquez d'abord <strong style={{ color: 'var(--text)' }}>« Configurer l'écran d'autorisation »</strong></p>
            <p>→ Choisir <strong style={{ color: 'var(--text)' }}>Externe</strong> → Créer</p>
            <p>→ Remplir : Nom de l'application = <code>FinTrack Haiti</code>, Email = votre email</p>
            <p>→ Cliquer <strong style={{ color: 'var(--text)' }}>Enregistrer et continuer</strong> jusqu'à la fin (tout laisser par défaut)</p>
            <br/>
            <p><strong style={{ color: 'var(--text)' }}>Ensuite, créer l'ID client OAuth :</strong></p>
            <p>→ Type : <strong style={{ color: 'var(--text)' }}>Application Web</strong></p>
            <p>→ Nom : <code>FinTrack</code></p>
            <p>→ <strong style={{ color: 'var(--text)' }}>Origines JavaScript autorisées</strong> — ajouter :</p>
            <CopyRow value={REDIRECT_ORIGIN}/>
            <div className="warn-box">⚠ Si vous testez en local avec <code>npm start</code>, ajoutez aussi <code>http://localhost:3000</code></div>
            <p style={{ marginTop: 10 }}>→ Cliquer <strong style={{ color: 'var(--text)' }}>Créer</strong></p>
            <p>→ Une boîte apparaît avec votre <strong style={{ color: 'var(--gold)' }}>Client ID</strong> — le copier ci-dessous :</p>
          </div>
        </div>

        {/* STEP 4 — paste client ID */}
        <div className="step" style={{ borderColor: 'rgba(201,168,76,.3)' }}>
          <div className="step-title">
            <span className="step-num">4</span>
            Coller votre Client ID
          </div>
          <div className="step-body">
            <p style={{ marginBottom: 10 }}>Il ressemble à : <code>123456789-abc.apps.googleusercontent.com</code></p>
            <div className="fg">
              <label className="fl">Client ID Google OAuth *</label>
              <input className="fi" value={clientId}
                onChange={e => setClientId(e.target.value)}
                placeholder="XXXXXX.apps.googleusercontent.com"/>
            </div>

            {error && (
              <div style={{ background: 'var(--red-bg)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: 'var(--red)', marginTop: 10 }}>
                ⚠ {error}
              </div>
            )}

            <button className="btn btn-gold btn-lg" style={{ marginTop: 16, width: '100%', justifyContent: 'center' }}
              onClick={saveAndContinue}
              disabled={!clientId.trim() || !gapiReady}>
              {gapiReady ? '✓ Continuer — Se connecter avec Google' : 'Chargement de l\'API Google...'}
            </button>
          </div>
        </div>

        {/* STEP 5 - after login */}
        <div className="step" style={{ opacity: 0.6 }}>
          <div className="step-title">
            <span className="step-num">5</span>
            Connecter votre Google Sheet (après connexion)
          </div>
          <div className="step-body">
            <p>Après vous être connecté, l'app vous proposera de :</p>
            <p>→ <strong style={{ color: 'var(--text)' }}>Créer automatiquement</strong> un nouveau Google Sheet (recommandé, 1 clic)</p>
            <p>→ <strong style={{ color: 'var(--text)' }}>Ou connecter</strong> un Sheet existant en collant son ID</p>
            <div className="tip">💡 L'ID d'un Google Sheet se trouve dans son URL :<br/>
              <code>docs.google.com/spreadsheets/d/<strong style={{ color: 'var(--gold)' }}>CET-ID-ICI</strong>/edit</code>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
