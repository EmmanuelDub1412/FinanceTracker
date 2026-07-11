import React, { useEffect, useState } from 'react';
import { verifyResetCode, confirmReset } from '../firestoreApi';
import { useLanguage } from '../i18n/LanguageContext';

// ─────────────────────────────────────────────────────────────────────────────
// ResetPasswordScreen: page affichee quand l'utilisateur clique sur le lien
// recu par email ("mot de passe oublie"), au theme FinTrack au lieu de la
// page generique Firebase. Voir App.js pour la detection du lien (oobCode).
// ─────────────────────────────────────────────────────────────────────────────

export default function ResetPasswordScreen({ oobCode, onDone }) {
  const { t } = useLanguage();
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
      setError(t('reset.errShort'));
      return;
    }
    if (password !== confirmPw) {
      setError(t('reset.errMismatch'));
      return;
    }
    setStatus('saving');
    try {
      await confirmReset(oobCode, password);
      setStatus('done');
    } catch (e) {
      setError(t('reset.errExpired'));
      setStatus('invalid');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: 400 }}>
        <div className="login-logo">Fin<em>Track</em></div>

        {status === 'checking' && (
          <div className="login-tag">{t('reset.checking')}</div>
        )}

        {status === 'invalid' && (
          <>
            <div className="login-tag">{t('reset.invalidTitle')}</div>
            {error && (
              <div style={{ background: 'var(--red-bg)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 8, padding: '12px 14px', fontSize: 13, color: 'var(--red)', margin: '16px 0', textAlign: 'left' }}>
                ⚠ {error}
              </div>
            )}
            <button className="btn btn-gold btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
              onClick={onDone}>{t('reset.backToLogin')}</button>
          </>
        )}

        {status === 'ready' && (
          <>
            <div className="login-tag">{t('reset.newPasswordFor')}<br/>{t('reset.forEmail')} <strong>{email}</strong></div>

            {error && (
              <div style={{ background: 'var(--red-bg)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 8, padding: '12px 14px', fontSize: 13, color: 'var(--red)', margin: '16px 0', textAlign: 'left' }}>
                ⚠ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ textAlign: 'left', marginTop: 16 }}>
              <div className="fg">
                <label className="fl">{t('reset.newPassword')}</label>
                <input className="fi" type="password" value={password} autoFocus
                  onChange={e => setPassword(e.target.value)} placeholder="••••••••" required/>
              </div>
              <div className="fg" style={{ marginTop: 12 }}>
                <label className="fl">{t('reset.confirmPassword')}</label>
                <input className="fi" type="password" value={confirmPw}
                  onChange={e => setConfirmPw(e.target.value)} placeholder="••••••••" required/>
              </div>
              <button type="submit" className="btn btn-gold btn-lg" style={{ marginTop: 16, width: '100%', justifyContent: 'center' }}
                disabled={status === 'saving'}>
                {status === 'saving' ? t('reset.saving') : t('reset.save')}
              </button>
            </form>
          </>
        )}

        {status === 'done' && (
          <>
            <div style={{ background: 'var(--g-bg)', border: '1px solid rgba(16,185,129,.3)', borderRadius: 8, padding: '12px 14px', fontSize: 13, color: 'var(--g1)', margin: '16px 0' }}>
              {t('reset.done')}
            </div>
            <button className="btn btn-gold btn-lg" style={{ width: '100%', justifyContent: 'center' }}
              onClick={onDone}>{t('reset.goLogin')}</button>
          </>
        )}
      </div>
    </div>
  );
}
