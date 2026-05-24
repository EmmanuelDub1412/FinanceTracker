import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { fmtHTG, fmt, compoundSavings, today } from '../utils/finance';

function SavingsModal({ goal, onSave, onClose }) {
  const [form, setForm] = useState(goal || {
    name: '', targetAmount: '', currentAmount: '',
    currency: 'HTG', targetDate: '', monthlyContrib: '',
    annualRate: '5', notes: '', icon: '🎯',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const icons = ['🎯','🏠','✈️','🚗','🎓','💊','💍','📱','🌴','💼','🏋️','🎸','🏦','🌟','🎁'];

  const handleSubmit = () => {
    if (!form.name || !form.targetAmount) return;
    onSave({ ...form, targetAmount: Number(form.targetAmount), currentAmount: Number(form.currentAmount)||0, monthlyContrib: Number(form.monthlyContrib)||0 });
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{goal ? 'Modifier l\'objectif' : 'Nouvel Objectif d\'Épargne'}</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Icône</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {icons.map(ic => (
                <button key={ic} onClick={() => set('icon', ic)} style={{
                  width: 36, height: 36, borderRadius: 8, border: '2px solid',
                  borderColor: form.icon === ic ? 'var(--accent)' : 'var(--border)',
                  background: form.icon === ic ? 'rgba(37,99,235,0.1)' : 'var(--bg3)',
                  fontSize: 18, cursor: 'pointer', transition: 'all 0.1s',
                }}>{ic}</button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Nom de l'objectif *</label>
            <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="ex. Fonds d'urgence"/>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Objectif cible *</label>
              <input className="form-input" type="number" value={form.targetAmount} onChange={e => set('targetAmount', e.target.value)} placeholder="0"/>
            </div>
            <div className="form-group">
              <label className="form-label">Devise</label>
              <select className="form-select" value={form.currency} onChange={e => set('currency', e.target.value)}>
                <option value="HTG">HTG</option><option value="USD">USD</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Montant actuel</label>
              <input className="form-input" type="number" value={form.currentAmount} onChange={e => set('currentAmount', e.target.value)} placeholder="0"/>
            </div>
            <div className="form-group">
              <label className="form-label">Contribution mensuelle</label>
              <input className="form-input" type="number" value={form.monthlyContrib} onChange={e => set('monthlyContrib', e.target.value)} placeholder="0"/>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Date cible</label>
              <input className="form-input" type="date" value={form.targetDate} onChange={e => set('targetDate', e.target.value)}/>
            </div>
            <div className="form-group">
              <label className="form-label">Taux d'intérêt annuel (%)</label>
              <input className="form-input" type="number" value={form.annualRate} onChange={e => set('annualRate', e.target.value)} placeholder="5"/>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Notes</label>
            <input className="form-input" value={form.notes||''} onChange={e => set('notes', e.target.value)} placeholder="Optionnel"/>
          </div>

          <div className="flex gap-8" style={{ justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
            <button className="btn btn-primary" onClick={handleSubmit}>{goal ? 'Enregistrer' : 'Créer'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DepositModal({ goal, onSave, onClose }) {
  const [amount, setAmount] = useState('');
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 360 }}>
        <div className="modal-header">
          <div className="modal-title">Ajouter des fonds — {goal.icon} {goal.name}</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Montant à ajouter ({goal.currency})</label>
            <input className="form-input" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" autoFocus/>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
            <button className="btn btn-green" onClick={() => { if(amount) { onSave(Number(amount)); onClose(); } }}>Ajouter</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Savings({ savings, onAdd, onUpdate, onDelete }) {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState(null);
  const [depositing, setDepositing] = useState(null);
  const [selected, setSelected]   = useState(null);

  const enriched = useMemo(() => savings.map(g => {
    const pct = Math.min(100, ((g.currentAmount||0) / (g.targetAmount||1)) * 100);
    const remaining = Math.max(0, (g.targetAmount||0) - (g.currentAmount||0));
    const monthsLeft = g.monthlyContrib > 0 ? Math.ceil(remaining / g.monthlyContrib) : null;

    const months = 36;
    const projection = compoundSavings(
      g.currentAmount || 0,
      g.monthlyContrib || 0,
      Number(g.annualRate) || 0,
      months
    );
    const reachMonth = projection.findIndex(p => p.balance >= (g.targetAmount||0));
    return { ...g, pct, remaining, monthsLeft, projection, reachMonth };
  }), [savings]);

  const handleSave = (data) => {
    if (editing) onUpdate(editing.id, data);
    else onAdd(data);
    setShowModal(false); setEditing(null);
  };

  const handleDeposit = (goal, amount) => {
    onUpdate(goal.id, { currentAmount: (goal.currentAmount || 0) + amount });
  };

  const selectedGoal = enriched.find(g => g.id === selected);

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
        <div>Mois {payload[0].payload.month}</div>
        <div style={{ color: 'var(--teal)', fontWeight: 600 }}>{fmtHTG(payload[0].value)}</div>
      </div>
    );
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Objectifs d'Épargne</div>
          <div className="page-subtitle">Suivez vos cibles et projetez votre progression</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setShowModal(true); }}>
          + Nouvel Objectif
        </button>
      </div>

      {savings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎯</div>
          <div className="empty-state-title">Aucun objectif créé</div>
          <div className="empty-state-text">Définissez vos cibles d'épargne et suivez votre progression</div>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>+ Créer un objectif</button>
        </div>
      ) : (
        <div className={selected ? 'two-col-wide' : ''}>
          {/* Goals list */}
          <div>
            <div style={{ display: 'grid', gap: 14 }}>
              {enriched.map(g => (
                <div key={g.id} className="saving-card"
                  onClick={() => setSelected(selected === g.id ? null : g.id)}
                  style={{ cursor: 'pointer', borderColor: selected === g.id ? 'var(--accent)' : undefined }}>

                  <div className="flex-between" style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                        {g.icon || '🎯'}
                      </div>
                      <div>
                        <div className="saving-goal-name">{g.name}</div>
                        <div className="saving-goal-target">Objectif : {fmt(g.targetAmount, g.currency)}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="saving-pct">{Math.round(g.pct)}%</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                        {g.pct >= 100 ? '🎉 Atteint !' : `${fmt(g.remaining, g.currency)} restant`}
                      </div>
                    </div>
                  </div>

                  <div className="progress-track" style={{ height: 6, marginBottom: 8 }}>
                    <div className={`progress-fill ${g.pct >= 100 ? 'safe' : g.pct >= 50 ? 'warn' : 'danger'}`}
                      style={{ width: `${g.pct}%`, height: '100%' }}/>
                  </div>

                  <div className="saving-amounts">
                    <span>{fmt(g.currentAmount || 0, g.currency)} épargné</span>
                    {g.monthlyContrib > 0 && <span>+{fmt(g.monthlyContrib, g.currency)}/mois</span>}
                    {g.targetDate && <span>📅 {new Date(g.targetDate).toLocaleDateString('fr-HT', { month:'long', year:'numeric' })}</span>}
                  </div>

                  {g.monthsLeft !== null && g.pct < 100 && (
                    <div style={{ marginTop: 8, padding: '6px 10px', background: 'var(--bg3)', borderRadius: 6, fontSize: 12, color: 'var(--text2)' }}>
                      {g.reachMonth >= 0
                        ? `📈 Objectif atteint dans ~${g.reachMonth + 1} mois avec intérêts`
                        : `⏱ ~${g.monthsLeft} mois sans intérêts`}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                    <button className="btn btn-green btn-sm" onClick={e => { e.stopPropagation(); setDepositing(g); }}>+ Ajouter</button>
                    <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); setEditing(g); setShowModal(true); }}>✏ Modifier</button>
                    <button className="btn btn-danger btn-sm" onClick={e => { e.stopPropagation(); if(window.confirm('Supprimer ?')) onDelete(g.id); }}>🗑</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detail panel */}
          {selectedGoal && (
            <div>
              <div className="card" style={{ position: 'sticky', top: 16 }}>
                <div className="card-header">
                  <div className="card-title">{selectedGoal.icon} Projection — {selectedGoal.name}</div>
                  <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>✕</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  {[
                    { label: 'Actuel', value: fmt(selectedGoal.currentAmount||0, selectedGoal.currency), color: 'var(--text)' },
                    { label: 'Objectif', value: fmt(selectedGoal.targetAmount||0, selectedGoal.currency), color: 'var(--accent)' },
                    { label: 'Restant', value: fmt(selectedGoal.remaining, selectedGoal.currency), color: 'var(--red)' },
                    { label: 'Taux', value: `${selectedGoal.annualRate||0}%/an`, color: 'var(--teal)' },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ background: 'var(--bg3)', borderRadius: 8, padding: '10px 12px' }}>
                      <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 2 }}>{label}</div>
                      <div style={{ fontFamily: 'var(--font-display)', color, fontSize: '1rem' }}>{value}</div>
                    </div>
                  ))}
                </div>

                <div className="section-label">Projection sur 36 mois</div>
                <div style={{ height: 160 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={selectedGoal.projection} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gSaving" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#14B8A6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" stroke="#6E7681" fontSize={10} tickLine={false} axisLine={false} interval={5}/>
                      <YAxis stroke="#6E7681" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v=>`${Math.round(v/1000)}k`}/>
                      <Tooltip content={<CustomTooltip/>}/>
                      <Area type="monotone" dataKey="balance" stroke="#14B8A6" strokeWidth={2} fill="url(#gSaving)"/>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {selectedGoal.reachMonth >= 0 && (
                  <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--teal-bg)', borderRadius: 8, fontSize: 13, color: 'var(--teal)', border: '1px solid rgba(20,184,166,0.2)' }}>
                    🎯 Avec {fmt(selectedGoal.monthlyContrib||0, selectedGoal.currency)}/mois à {selectedGoal.annualRate||0}%,
                    vous atteignez votre objectif en <strong>{selectedGoal.reachMonth + 1} mois</strong>.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {showModal && <SavingsModal goal={editing} onSave={handleSave} onClose={() => { setShowModal(false); setEditing(null); }}/>}
      {depositing && <DepositModal goal={depositing} onSave={(amt) => handleDeposit(depositing, amt)} onClose={() => setDepositing(null)}/>}
    </div>
  );
}
