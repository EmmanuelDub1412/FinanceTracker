import React, { useState, useMemo } from 'react';
import { fmtHTG, fmtUSD, fmt, toHTG, computeBalance, ACCOUNT_TYPES, getAccType } from '../utils/finance';

function AccountModal({ account, onSave, onClose }) {
  const [form, setForm] = useState(account || {
    name: '', type: 'bank', currency: 'HTG',
    initialBalance: 0, creditLimit: '', notes: '',
    alertThreshold: '', alertEnabled: false,
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const isCredit = form.type === 'credit';

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    onSave({ ...form, initialBalance: Number(form.initialBalance) || 0 });
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{account ? 'Modifier le compte' : 'Ajouter un compte'}</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Nom du compte *</label>
            <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="ex. Unibank HTG"/>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="form-select" value={form.type} onChange={e => set('type', e.target.value)}>
                {ACCOUNT_TYPES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Devise</label>
              <select className="form-select" value={form.currency} onChange={e => set('currency', e.target.value)}>
                <option value="HTG">HTG — Gourde</option>
                <option value="USD">USD — Dollar</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Solde initial</label>
            <input className="form-input" type="number" value={form.initialBalance} onChange={e => set('initialBalance', e.target.value)} placeholder="0"/>
          </div>

          {isCredit && (
            <div className="form-group">
              <label className="form-label">Limite de crédit ({form.currency})</label>
              <input className="form-input" type="number" value={form.creditLimit} onChange={e => set('creditLimit', e.target.value)} placeholder="ex. 140000"/>
            </div>
          )}

          <hr className="divider"/>
          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text2)' }}>🔔 Alertes</div>

          <div className="toggle-row">
            <span style={{ fontSize: 13 }}>Activer les alertes pour ce compte</span>
            <label className="toggle">
              <input type="checkbox" checked={form.alertEnabled} onChange={e => set('alertEnabled', e.target.checked)}/>
              <span className="toggle-slider"/>
            </label>
          </div>

          {form.alertEnabled && (
            <div className="form-group">
              <label className="form-label">
                {isCredit ? 'Alerter quand le solde disponible descend sous' : 'Alerter quand le solde descend sous'}
              </label>
              <input className="form-input" type="number" value={form.alertThreshold} onChange={e => set('alertThreshold', e.target.value)}
                placeholder={`ex. ${isCredit ? '20000' : '5000'} ${form.currency}`}/>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Notes</label>
            <input className="form-input" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optionnel"/>
          </div>

          <div className="flex gap-8" style={{ justifyContent: 'flex-end', marginTop: 4 }}>
            <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
            <button className="btn btn-primary" onClick={handleSubmit}>
              {account ? 'Enregistrer' : 'Ajouter'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Accounts({ accounts, transactions, settings, onAdd, onUpdate, onDelete }) {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const rate = settings?.usdToHtg || 130;

  const enriched = useMemo(() =>
    accounts.map(a => {
      const balance = computeBalance(a, transactions);
      const accType = getAccType(a.type);
      const isCredit = a.type === 'credit';
      const limit = Number(a.creditLimit) || 0;
      const used = isCredit ? Math.abs(Math.min(0, balance)) : 0;
      const available = isCredit && limit > 0 ? limit - used : null;
      const pct = isCredit && limit > 0 ? (used / limit) * 100 : null;
      const alertFired = a.alertEnabled && a.alertThreshold && (
        isCredit
          ? (available !== null && available < Number(a.alertThreshold))
          : balance < Number(a.alertThreshold)
      );
      return { ...a, balance, accType, isCredit, limit, used, available, pct, alertFired };
    }),
    [accounts, transactions]);

  const totalHTG = useMemo(() =>
    enriched.filter(a => a.type !== 'credit').reduce((s, a) => s + toHTG(a.balance, a.currency, rate), 0),
    [enriched, rate]);

  const totalCreditUsed = useMemo(() =>
    enriched.filter(a => a.isCredit).reduce((s, a) => s + toHTG(a.used, a.currency, rate), 0),
    [enriched, rate]);

  const handleSave = (data) => {
    if (editing) { onUpdate(editing.id, data); }
    else { onAdd(data); }
    setShowModal(false); setEditing(null);
  };

  const handleEdit = (acc) => { setEditing(acc); setShowModal(true); };
  const handleDelete = (id) => { if (window.confirm('Supprimer ce compte ?')) onDelete(id); };

  const progressClass = (pct) => pct >= 90 ? 'danger' : pct >= 70 ? 'warn' : 'safe';

  const grouped = {
    bank:   enriched.filter(a => a.type === 'bank'),
    credit: enriched.filter(a => a.type === 'credit'),
    cash:   enriched.filter(a => a.type === 'cash'),
    saving: enriched.filter(a => a.type === 'saving'),
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Mes Comptes</div>
          <div className="page-subtitle">Gérez vos comptes bancaires, cartes et liquidités</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setShowModal(true); }}>
          + Ajouter un compte
        </button>
      </div>

      {/* Summary strip */}
      <div className="kpi-grid" style={{ marginBottom: 28 }}>
        <div className="kpi-card blue">
          <div className="kpi-icon">🏦</div>
          <div className="kpi-label">Total Actifs (HTG Equiv.)</div>
          <div className="kpi-value blue">{fmtHTG(totalHTG)}</div>
        </div>
        <div className="kpi-card red">
          <div className="kpi-icon">💳</div>
          <div className="kpi-label">Crédit Utilisé</div>
          <div className="kpi-value red">{fmtHTG(totalCreditUsed)}</div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-icon">📊</div>
          <div className="kpi-label">Nombre de Comptes</div>
          <div className="kpi-value green">{accounts.length}</div>
        </div>
      </div>

      {/* Alerts banner */}
      {enriched.filter(a => a.alertFired).map(a => (
        <div key={a.id} className="alert-item danger" style={{ marginBottom: 10 }}>
          <div className="alert-icon">🚨</div>
          <div className="alert-msg">
            <div className="alert-title">Alerte : {a.name}</div>
            <div className="alert-detail">
              {a.isCredit
                ? `Disponible : ${fmt(a.available, a.currency)} (seuil : ${fmt(Number(a.alertThreshold), a.currency)})`
                : `Solde : ${fmt(a.balance, a.currency)} (seuil : ${fmt(Number(a.alertThreshold), a.currency)})`}
            </div>
          </div>
        </div>
      ))}

      {/* Account groups */}
      {[
        { key: 'bank',   label: '🏦 Comptes Bancaires' },
        { key: 'credit', label: '💳 Cartes de Crédit' },
        { key: 'cash',   label: '💵 Cash / Liquide' },
        { key: 'saving', label: '🏧 Comptes Épargne' },
      ].map(({ key, label }) => grouped[key].length > 0 && (
        <div key={key} style={{ marginBottom: 28 }}>
          <div className="section-label">{label}</div>
          <div className="accounts-grid">
            {grouped[key].map(a => (
              <div key={a.id} className="account-card" onClick={() => handleEdit(a)}>
                {a.alertFired && <div className="acc-alert-badge">⚠ ALERTE</div>}
                <div className="acc-header">
                  <div className="acc-icon">{a.accType.icon}</div>
                  <div>
                    <div className="acc-name">{a.name}</div>
                    <div className="acc-type">{a.accType.label} · {a.currency}</div>
                  </div>
                </div>

                {a.isCredit ? (
                  <>
                    <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>Utilisé</div>
                    <div className={`acc-balance ${a.used > 0 ? 'negative' : ''}`}>{fmt(a.used, a.currency)}</div>
                    {a.limit > 0 && (
                      <div className="acc-limit-bar">
                        <div className="limit-row">
                          <span>Disponible : {fmt(a.available, a.currency)}</span>
                          <span>Limite : {fmt(a.limit, a.currency)}</span>
                        </div>
                        <div className="progress-track">
                          <div className={`progress-fill ${progressClass(a.pct)}`} style={{ width: `${a.pct}%` }}/>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className={`acc-balance ${a.balance < 0 ? 'negative' : 'positive'}`}>
                    {fmt(a.balance, a.currency)}
                  </div>
                )}

                {a.notes && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 8 }}>{a.notes}</div>}

                <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                  <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); handleEdit(a); }}>✏ Modifier</button>
                  <button className="btn btn-danger btn-sm" onClick={e => { e.stopPropagation(); handleDelete(a.id); }}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {accounts.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🏦</div>
          <div className="empty-state-title">Aucun compte ajouté</div>
          <div className="empty-state-text">Commencez par ajouter votre premier compte bancaire</div>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>+ Ajouter un compte</button>
        </div>
      )}

      {showModal && <AccountModal account={editing} onSave={handleSave} onClose={() => { setShowModal(false); setEditing(null); }}/>}
    </div>
  );
}
