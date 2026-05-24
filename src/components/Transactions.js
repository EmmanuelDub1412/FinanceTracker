import React, { useState, useMemo } from 'react';
import { fmtHTG, fmt, toHTG, today, CATEGORIES, getCat } from '../utils/finance';

function TxModal({ tx, accounts, onSave, onClose }) {
  const [form, setForm] = useState(tx || {
    date: today(), description: '', category: 'DEP-ALI', txType: 'expense',
    debitAccount: '', creditAccount: '', amount: '', currency: 'HTG',
    status: 'confirmed', notes: '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const filteredCats = CATEGORIES.filter(c => {
    if (form.txType === 'income') return c.type === 'income';
    if (form.txType === 'transfer') return c.type === 'transfer';
    if (form.txType === 'savings') return c.type === 'savings';
    return c.type === 'expense';
  });

  const handleSubmit = () => {
    if (!form.description || !form.amount || !form.date) return;
    onSave({ ...form, amount: Number(form.amount) });
  };

  const typeColors = { income: 'var(--green)', expense: 'var(--red)', transfer: 'var(--teal)', savings: 'var(--purple)' };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <div className="modal-title">{tx ? 'Modifier la transaction' : 'Nouvelle Transaction'}</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        {/* Type selector */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 20 }}>
          {[
            { id: 'income',   label: '📥 Revenu',   color: 'green' },
            { id: 'expense',  label: '📤 Dépense',  color: 'red' },
            { id: 'transfer', label: '🔄 Transfert',color: 'teal' },
            { id: 'savings',  label: '🏦 Épargne',  color: 'purple' },
          ].map(t => (
            <button key={t.id} onClick={() => { set('txType', t.id); set('category', CATEGORIES.find(c=>c.type===t.id)?.id||''); }}
              style={{
                padding: '8px 4px', borderRadius: 8, border: '2px solid',
                borderColor: form.txType===t.id ? `var(--${t.color})` : 'var(--border)',
                background: form.txType===t.id ? `rgba(var(--${t.color}-rgb,0,0,0),0.1)` : 'var(--bg3)',
                color: form.txType===t.id ? `var(--${t.color})` : 'var(--text2)',
                cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-body)', fontWeight: 500,
                transition: 'all 0.15s',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="form-grid">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Date *</label>
              <input className="form-input" type="date" value={form.date} onChange={e => set('date', e.target.value)}/>
            </div>
            <div className="form-group">
              <label className="form-label">Catégorie</label>
              <select className="form-select" value={form.category} onChange={e => set('category', e.target.value)}>
                {filteredCats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description *</label>
            <input className="form-input" value={form.description} onChange={e => set('description', e.target.value)} placeholder="ex. Courses Hypérion"/>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Montant *</label>
              <input className="form-input" type="number" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0"/>
            </div>
            <div className="form-group">
              <label className="form-label">Devise</label>
              <select className="form-select" value={form.currency} onChange={e => set('currency', e.target.value)}>
                <option value="HTG">HTG</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          {form.txType === 'transfer' ? (
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Compte Source (Débité)</label>
                <select className="form-select" value={form.debitAccount} onChange={e => set('debitAccount', e.target.value)}>
                  <option value="">— Choisir —</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Compte Destination (Crédité)</label>
                <select className="form-select" value={form.creditAccount} onChange={e => set('creditAccount', e.target.value)}>
                  <option value="">— Choisir —</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label">{form.txType === 'income' ? 'Crédité sur' : 'Débité de'}</label>
              <select className="form-select"
                value={form.txType === 'income' ? form.creditAccount : form.debitAccount}
                onChange={e => form.txType === 'income' ? set('creditAccount', e.target.value) : set('debitAccount', e.target.value)}>
                <option value="">— Choisir un compte —</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Statut</label>
              <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="confirmed">✅ Confirmé</option>
                <option value="pending">⏳ En attente</option>
                <option value="cancelled">❌ Annulé</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Tiers / Bénéficiaire</label>
              <input className="form-input" value={form.beneficiary||''} onChange={e => set('beneficiary', e.target.value)} placeholder="Optionnel"/>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Notes</label>
            <input className="form-input" value={form.notes||''} onChange={e => set('notes', e.target.value)} placeholder="Optionnel"/>
          </div>

          <div className="flex gap-8" style={{ justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
            <button className="btn btn-primary" onClick={handleSubmit}>
              {tx ? 'Enregistrer' : 'Ajouter'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const STATUS_CONFIG = {
  confirmed: { label: 'Confirmé',  badge: 'badge-green' },
  pending:   { label: 'En attente',badge: 'badge-yellow' },
  cancelled: { label: 'Annulé',    badge: 'badge-red' },
};

export default function Transactions({ transactions, accounts, settings, onAdd, onUpdate, onDelete }) {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState(null);
  const [search, setSearch]       = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterAcc, setFilterAcc]   = useState('');
  const rate = settings?.usdToHtg || 130;

  const accMap = useMemo(() => Object.fromEntries(accounts.map(a => [a.id, a.name])), [accounts]);

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      if (filterType !== 'all' && t.txType !== filterType) return false;
      if (filterMonth) {
        const d = t.date?.seconds ? new Date(t.date.seconds*1000) : new Date(t.date);
        const m = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
        if (m !== filterMonth) return false;
      }
      if (filterAcc && t.debitAccount !== filterAcc && t.creditAccount !== filterAcc) return false;
      if (search) {
        const s = search.toLowerCase();
        if (!t.description?.toLowerCase().includes(s) &&
            !t.beneficiary?.toLowerCase().includes(s) &&
            !getCat(t.category).label.toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [transactions, filterType, filterMonth, filterAcc, search]);

  const totals = useMemo(() => ({
    income:  filtered.filter(t=>t.txType==='income'&&t.status==='confirmed').reduce((s,t)=>s+toHTG(Number(t.amount),t.currency,rate),0),
    expense: filtered.filter(t=>t.txType==='expense'&&t.status==='confirmed').reduce((s,t)=>s+toHTG(Number(t.amount),t.currency,rate),0),
  }), [filtered, rate]);

  const handleSave = (data) => {
    if (editing) onUpdate(editing.id, data);
    else onAdd(data);
    setShowModal(false); setEditing(null);
  };

  const formatDate = (d) => {
    if (!d) return '';
    const date = d?.seconds ? new Date(d.seconds*1000) : new Date(d);
    return date.toLocaleDateString('fr-HT', { day:'2-digit', month:'short', year:'numeric' });
  };

  const typeColors = { income: 'tx-income', expense: 'tx-expense', transfer: 'tx-transfer', savings: 'text-purple' };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Transactions</div>
          <div className="page-subtitle">{filtered.length} transaction{filtered.length>1?'s':''}</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setShowModal(true); }}>
          + Nouvelle Transaction
        </button>
      </div>

      {/* Totals */}
      <div className="kpi-grid" style={{ marginBottom: 20 }}>
        <div className="kpi-card green">
          <div className="kpi-label">Revenus (filtrés)</div>
          <div className="kpi-value green">{fmtHTG(totals.income)}</div>
        </div>
        <div className="kpi-card red">
          <div className="kpi-label">Dépenses (filtrés)</div>
          <div className="kpi-value red">{fmtHTG(totals.expense)}</div>
        </div>
        <div className={`kpi-card ${totals.income - totals.expense >= 0 ? 'teal' : 'red'}`}>
          <div className="kpi-label">Net</div>
          <div className={`kpi-value ${totals.income - totals.expense >= 0 ? 'teal' : 'red'}`}>{fmtHTG(totals.income - totals.expense)}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-16" style={{ padding: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 10, alignItems: 'center' }}>
          <input className="form-input" placeholder="🔍  Rechercher..." value={search} onChange={e => setSearch(e.target.value)} style={{ margin: 0 }}/>
          <select className="form-select" value={filterType} onChange={e => setFilterType(e.target.value)} style={{ width: 140 }}>
            <option value="all">Tous les types</option>
            <option value="income">📥 Revenus</option>
            <option value="expense">📤 Dépenses</option>
            <option value="transfer">🔄 Transferts</option>
            <option value="savings">🏦 Épargne</option>
          </select>
          <input className="form-input" type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} style={{ width: 150 }}/>
          <select className="form-select" value={filterAcc} onChange={e => setFilterAcc(e.target.value)} style={{ width: 160 }}>
            <option value="">Tous les comptes</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Catégorie</th>
                <th>Compte</th>
                <th style={{textAlign:'right'}}>Montant</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text3)' }}>
                  Aucune transaction trouvée
                </td></tr>
              ) : filtered.map(tx => {
                const cat = getCat(tx.category);
                const isIncome = tx.txType === 'income';
                const statusConf = STATUS_CONFIG[tx.status] || STATUS_CONFIG.confirmed;
                const accName = accMap[tx.txType === 'income' ? tx.creditAccount : tx.debitAccount] || '—';
                const amtHTG = toHTG(Number(tx.amount), tx.currency, rate);
                return (
                  <tr key={tx.id}>
                    <td style={{ color: 'var(--text2)', fontSize: 12, whiteSpace: 'nowrap' }}>{formatDate(tx.date)}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{tx.description}</div>
                      {tx.beneficiary && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{tx.beneficiary}</div>}
                    </td>
                    <td>
                      <span style={{ fontSize: 12 }}>{cat.icon} {cat.label}</span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text2)' }}>{accName}</td>
                    <td className={`text-right ${typeColors[tx.txType] || ''}`} style={{ fontWeight: 600, fontFamily: 'var(--font-display)', fontSize: 13 }}>
                      {isIncome ? '+' : tx.txType === 'transfer' ? '' : '-'}{fmtHTG(amtHTG)}
                      {tx.currency === 'USD' && <div style={{ fontSize: 10, fontWeight: 400, color: 'var(--text3)', fontFamily: 'var(--font-body)' }}>{fmt(Number(tx.amount), 'USD')}</div>}
                    </td>
                    <td><span className={`badge ${statusConf.badge}`}>{statusConf.label}</span></td>
                    <td>
                      <div className="flex gap-8">
                        <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(tx); setShowModal(true); }}>✏</button>
                        <button className="btn btn-danger btn-sm" onClick={() => { if(window.confirm('Supprimer ?')) onDelete(tx.id); }}>🗑</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && <TxModal tx={editing} accounts={accounts} onSave={handleSave} onClose={() => { setShowModal(false); setEditing(null); }}/>}
    </div>
  );
}
