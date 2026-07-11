import React, { useEffect, useState } from 'react';
import { verifyResetCode, confirmReset } from '../firestoreApi';

// ─────────────────────────────────────────────────────────────────────────────
// ResetPasswordScreen: page affichee quand l'utilisateur clique sur le lien
// recu par email ("mot de passe oublie"), au theme FinTrack au lieu de la
// page generique Firebase. Voir App.js pour la detection du lien (oobCode).
// ─────────────────────────────────────────────────────────────────────────────

export default function ResetPasswordScreen({ oobCode, onDone }) {
  const [status, setStatus] = useState('checking'); // checking | ready | saving | done | invalid
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    verifyResetCode(oobCode)
      .then(userEmail => { setEmail(userEmail); setStatus('ready'); })
      .catch(() => setStatus('invalid'));
  }, [oobCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('Le mot de passe doit faire au moins 6 caractères.');
      return;
    }
    if (password !== confirmPw) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }
    setStatus('saving');
    try {
      await confirmReset(oobCode, password);
      setStatus('done');
    } catch (e) {
      setError('Ce lien est invalide ou a expiré, redemande un email de réinitialisation.');
      setStatus('invalid');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: 400 }}>
        <div className="login-logo">Fin<em>Track</em></div>

        {status === 'checking' && (
          <div className="login-tag">Vérification du lien...</div>
        )}

        {status === 'invalid' && (
          <>
            <div className="login-tag">Lien invalide ou expiré</div>
            {error && (
              <div style={{ background: 'var(--red-bg)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 8, padding: '12px 14px', fontSize: 13, color: 'var(--red)', margin: '16px 0', textAlign: 'left' }}>
                ⚠ {error}
              </div>
            )}
            <button className="btn btn-gold btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
              onClick={onDone}>Retour à la connexion</button>
          </>
        )}

        {status === 'ready' && (
          <>
            <div className="login-tag">Nouveau mot de passe<br/>pour <strong>{email}</strong></div>

            {error && (
              <div style={{ background: 'var(--red-bg)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 8, padding: '12px 14px', fontSize: 13, color: 'var(--red)', margin: '16px 0', textAlign: 'left' }}>
                ⚠ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ textAlign: 'left', marginTop: 16 }}>
              <div className="fg">
                <label className="fl">Nouveau mot de passe</label>
                <input className="fi" type="password" value={password} autoFocus
                  onChange={e => setPassword(e.target.value)} placeholder="••••••••" required/>
              </div>
              <div className="fg" style={{ marginTop: 12 }}>
                <label className="fl">Confirme le mot de passe</label>
                <input className="fi" type="password" value={confirmPw}
                  onChange={e => setConfirmPw(e.target.value)} placeholder="••••••••" required/>
              </div>
              <button type="submit" className="btn btn-gold btn-lg" style={{ marginTop: 16, width: '100%', justifyContent: 'center' }}
                disabled={status === 'saving'}>
                {status === 'saving' ? 'Enregistrement...' : 'Enregistrer le nouveau mot de passe'}
              </button>
            </form>
          </>
        )}

        {status === 'done' && (
          <>
            <div style={{ background: 'var(--g-bg)', border: '1px solid rgba(16,185,129,.3)', borderRadius: 8, padding: '12px 14px', fontSize: 13, color: 'var(--g1)', margin: '16px 0' }}>
              ✓ Mot de passe changé avec succès.
            </div>
            <button className="btn btn-gold btn-lg" style={{ width: '100%', justifyContent: 'center' }}
              onClick={onDone}>Se connecter</button>
          </>
        )}
      </div>
    </div>
  );
}
