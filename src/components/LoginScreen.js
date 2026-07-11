import React, { useState } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// LoginScreen: connexion Google OU email/mot de passe.
// ─────────────────────────────────────────────────────────────────────────────

export default function LoginScreen({ onLogin, onLoginEmail, onSignUp, onForgotPassword, gapiReady, error, loading }) {
  const [mode, setMode] = useState('choice'); // choice | signin | signup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setResetSent(false);
    if (mode === 'signin') onLoginEmail(email, password);
    if (mode === 'signup') onSignUp(email, password);
  };

  const handleForgot = async () => {
    if (!email.trim()) return;
    const ok = await onForgotPassword(email.trim());
    if (ok) setResetSent(true);
  };

  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: 400 }}>
        <div className="login-logo">Fin<em>Track</em></div>
        <div className="login-tag">Connectez-vous pour accéder à vos données</div>

        {error && (
          <div style={{ background: 'var(--red-bg)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 8, padding: '12px 14px', fontSize: 13, color: 'var(--red)', marginBottom: 16, textAlign: 'left' }}>
            ⚠ {error}
          </div>
        )}
        {resetSent && (
          <div style={{ background: 'var(--g-bg)', border: '1px solid rgba(16,185,129,.3)', borderRadius: 8, padding: '12px 14px', fontSize: 13, color: 'var(--g1)', marginBottom: 16, textAlign: 'left' }}>
            ✓ Email de réinitialisation envoyé, vérifie ta boîte mail.
          </div>
        )}

        {mode === 'choice' && (
          <>
            <button className="btn-goog" onClick={onLogin} disabled={!gapiReady || loading}>
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {loading ? 'Connexion...' : 'Se connecter avec Google'}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0', color: 'var(--text3)', fontSize: 12 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
              ou
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
            </div>

            <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => setMode('signin')}>
              ✉ Se connecter avec email et mot de passe
            </button>
          </>
        )}

        {(mode === 'signin' || mode === 'signup') && (
          <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
            <div className="fg">
              <label className="fl">Email</label>
              <input className="fi" type="email" value={email} autoFocus
                onChange={e => setEmail(e.target.value)} placeholder="toi@exemple.com" required/>
            </div>
            <div className="fg" style={{ marginTop: 12 }}>
              <label className="fl">Mot de passe</label>
              <input className="fi" type="password" value={password}
                onChange={e => setPassword(e.target.value)} placeholder="••••••••" required/>
            </div>

            {mode === 'signin' && (
              <div style={{ textAlign: 'right', marginTop: 6 }}>
                <span onClick={handleForgot} style={{ fontSize: 12, color: 'var(--g1)', cursor: 'pointer' }}>
                  Mot de passe oublié ?
                </span>
              </div>
            )}

            <button type="submit" className="btn btn-gold btn-lg" style={{ marginTop: 16, width: '100%', justifyContent: 'center' }}
              disabled={loading}>
              {loading ? 'Chargement...' : mode === 'signin' ? 'Se connecter' : 'Créer mon compte'}
            </button>

            <div style={{ textAlign: 'center', marginTop: 14, fontSize: 12.5, color: 'var(--text2)' }}>
              {mode === 'signin' ? (
                <>Pas encore de compte ? <span onClick={() => setMode('signup')} style={{ color: 'var(--g1)', cursor: 'pointer', fontWeight: 600 }}>Créer un compte</span></>
              ) : (
                <>Déjà un compte ? <span onClick={() => setMode('signin')} style={{ color: 'var(--g1)', cursor: 'pointer', fontWeight: 600 }}>Se connecter</span></>
              )}
            </div>

            <button type="button" className="btn btn-ghost" style={{ width: '100%', marginTop: 12, justifyContent: 'center' }}
              onClick={() => setMode('choice')}>← Retour</button>
          </form>
        )}
      </div>
    </div>
  );
}
