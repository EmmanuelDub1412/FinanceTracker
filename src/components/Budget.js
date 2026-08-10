import React, { useState, useMemo } from 'react';
import {
  PieChart, Plus, Pencil, Trash2, AlertTriangle, CalendarRange, CalendarDays,
  ShoppingCart, Fuel, Car, Home, HeartPulse, GraduationCap, Smartphone, PartyPopper, Shirt, CreditCard, Package,
} from 'lucide-react';
import { fmt, fmtHTG, toHTG, CATEGORIES, getCat, weekRange, monthRange } from '../utils/finance';
import { useLanguage } from '../i18n/LanguageContext';

const EXPENSE_CATS = CATEGORIES.filter(c => c.type === 'expense');
const PERIODS = ['weekly', 'monthly'];

// Icones minimalistes (lucide) pour chaque categorie de depense, en
// remplacement des emojis utilises ailleurs dans l'app.
const CAT_ICON = {
  'DEP-ALI': ShoppingCart, 'DEP-TRA': Fuel, 'DEP-AUTO': Car, 'DEP-LOG': Home,
  'DEP-SAN': HeartPulse, 'DEP-EDU': GraduationCap, 'DEP-COM': Smartphone,
  'DEP-LOI': PartyPopper, 'DEP-HAB': Shirt, 'DEP-REM': CreditCard, 'DEP-DIV': Package,
};
const getCatIcon = (id) => CAT_ICON[id] || Package;

function BudgetModal({ item, onSave, onClose }) {
  const { t, tId } = useLanguage();
  const [form, setForm] = useState(item || {
    category: EXPENSE_CATS[0]?.id || '', period: 'monthly', amount: '', currency: 'HTG',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const canSave = form.category && Number(form.amount) > 0;

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-hd">
          <div className="modal-ttl">
            <PieChart size={18} style={{ color: 'var(--g1)' }} />
            {item ? t('budget.m_titleEdit') : t('budget.m_titleNew')}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="fgrid">
          <div className="fg">
            <label className="fl">{t('budget.m_category')}</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 6 }}>
              {EXPENSE_CATS.map(c => {
                const Icon = getCatIcon(c.id);
                const active = form.category === c.id;
                return (
                  <button key={c.id} type="button" onClick={() => set('category', c.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 7, padding: '8px 10px',
                      borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                      border: `2px solid ${active ? 'var(--g1)' : 'var(--border)'}`,
                      background: active ? 'var(--g-bg)' : 'var(--bg3)',
                      color: active ? 'var(--g1)' : 'var(--text2)',
                    }}>
                    <Icon size={15} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 12.5, fontWeight: 500 }}>{tId('categories', c.id, c.label)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="fg">
            <label className="fl">{t('budget.m_period')}</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 6 }}>
              {PERIODS.map(p => (
                <button key={p} type="button" onClick={() => set('period', p)} className="btn btn-sm"
                  style={{
                    justifyContent: 'center',
                    border: `2px solid ${form.period === p ? 'var(--g1)' : 'var(--border)'}`,
                    background: form.period === p ? 'var(--g-bg)' : 'var(--bg3)',
                    color: form.period === p ? 'var(--g1)' : 'var(--text2)',
                  }}>
                  {t(`budget.period_${p}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="frow">
            <div className="fg">
              <label className="fl">{t('budget.m_amount')}</label>
              <input className="fi" type="number" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0" />
            </div>
            <div className="fg">
              <label className="fl">{t('budget.m_currency')}</label>
              <select className="fs" value={form.currency} onChange={e => set('currency', e.target.value)}>
                <option value="HTG">HTG</option><option value="USD">USD</option>
              </select>
            </div>
          </div>

          <div className="flex g8" style={{ justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={onClose}>{t('budget.m_cancel')}</button>
            <button className="btn btn-primary" disabled={!canSave} onClick={() => onSave({ ...form, amount: Number(form.amount) })}>
              {item ? t('budget.m_save') : t('budget.m_create')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BudgetSection({ title, RangeIcon, rangeLabel, items, dispCur, fmtC, rate, t, tId, onEdit, onDelete }) {
  if (items.length === 0) return null;

  const totalBudgetedHTG = items.reduce((s, b) => s + toHTG(b.amount, b.currency, rate), 0);
  const totalSpentHTG = items.reduce((s, b) => s + toHTG(b.spent, b.currency, rate), 0);
  const totalRemainingHTG = Math.max(0, totalBudgetedHTG - totalSpentHTG);
  const nativeByCurrency = (key) => ({
    HTG: items.filter(b => b.currency === 'HTG').reduce((s, b) => s + b[key], 0),
    USD: items.filter(b => b.currency === 'USD').reduce((s, b) => s + b[key], 0),
  });
  const nativeBudgeted = nativeByCurrency('amount');
  const nativeSpent = nativeByCurrency('spent');

  return (
    <div className="mb24">
      <div className="fb" style={{ marginBottom: 10 }}>
        <div className="sl" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
          <RangeIcon size={13} /> {title}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text3)' }}>{rangeLabel}</div>
      </div>

      <div className="kpi-grid mb24">
        <div className="kpi">
          <div className="kpi-lbl">{t('budget.totalBudgeted')}</div>
          <div className="kpi-val">{fmtC(totalBudgetedHTG)}</div>
          <div className="kpi-sub">{fmtHTG(nativeBudgeted.HTG)} · {fmt(nativeBudgeted.USD, 'USD')}</div>
        </div>
        <div className="kpi">
          <div className="kpi-lbl">{t('budget.totalSpent')}</div>
          <div className="kpi-val red">{fmtC(totalSpentHTG)}</div>
          <div className="kpi-sub">{fmtHTG(nativeSpent.HTG)} · {fmt(nativeSpent.USD, 'USD')}</div>
        </div>
        <div className="kpi">
          <div className="kpi-lbl">{t('budget.totalRemaining')}</div>
          <div className={`kpi-val ${totalRemainingHTG > 0 ? 'green' : 'red'}`}>{fmtC(totalRemainingHTG)}</div>
        </div>
      </div>

      <div className="acc-grid">
        {items.map(b => {
          const cat = getCat(b.category);
          const CatIcon = getCatIcon(b.category);
          return (
            <div key={b.id} className={`acc-card ${b.over ? 'alert-on' : ''}`}>
              {b.over && <div className="alert-pill"><AlertTriangle size={9} /> {t('budget.over')}</div>}
              <div className="acc-hd">
                <div className="acc-icon-wrap" style={{ background: 'var(--bg3)', color: 'var(--text2)' }}><CatIcon size={20} /></div>
                <div>
                  <div className="acc-nm">{tId('categories', b.category, cat.label)}</div>
                  <div className="acc-tp">{t(`budget.period_${b.period}`)}</div>
                </div>
              </div>

              <div className="prog-row">
                <span>{fmt(b.spent, b.currency)}</span>
                <span>{t('budget.of_')} {fmt(b.amount, b.currency)}</span>
              </div>
              <div className="prog-track" style={{ height: 6, marginBottom: 8 }}>
                <div className={`prog-fill ${b.over ? 'danger' : b.pct >= 70 ? 'warn' : 'ok'}`} style={{ width: `${b.pct}%` }} />
              </div>
              <div style={{ fontSize: 11, color: b.over ? 'var(--red)' : 'var(--text3)' }}>
                {b.over
                  ? `${t('budget.overBy')} ${fmt(b.spent - b.amount, b.currency)}`
                  : `${fmt(b.remaining, b.currency)} ${t('budget.remaining')}`}
              </div>

              <div className="flex g8 mt12">
                <button className="btn btn-ghost btn-sm" onClick={() => onEdit(b)}><Pencil size={12} /> {t('budget.edit_')}</button>
                <button className="btn btn-danger btn-sm" onClick={() => { if (window.confirm(t('budget.deleteConfirm'))) onDelete(b.id); }}><Trash2 size={12} /></button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Budget({ budgets, transactions, settings, onAdd, onUpdate, onDelete }) {
  const { t, tId, lang } = useLanguage();
  const rate = Number(settings?.usdToHtg) || 130;
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [dispCur, setDispCur] = useState('HTG');
  const fmtC = (v) => dispCur === 'USD' ? fmt(v / rate, 'USD') : fmt(v, 'HTG');

  const wr = useMemo(() => weekRange(), []);
  const mr = useMemo(() => monthRange(), []);

  const spentFor = (b, range) => transactions
    .filter(tx => tx.txType === 'expense' && tx.status === 'confirmed' && tx.category === b.category
      && tx.currency === b.currency && tx.date >= range.start && tx.date <= range.end)
    .reduce((s, tx) => s + (Number(tx.amount) || 0), 0);

  const enriched = useMemo(() => budgets.map(b => {
    const range = b.period === 'weekly' ? wr : mr;
    const amount = Number(b.amount) || 0;
    const spent = spentFor(b, range);
    const pct = amount > 0 ? Math.min(100, (spent / amount) * 100) : 0;
    const over = spent > amount;
    const remaining = Math.max(0, amount - spent);
    return { ...b, amount, spent, pct, over, remaining, range };
  }), [budgets, transactions, wr, mr]);

  const weeklyBudgets = enriched.filter(b => b.period === 'weekly');
  const monthlyBudgets = enriched.filter(b => b.period === 'monthly');

  const handleSave = (data) => { editing ? onUpdate(editing.id, data) : onAdd(data); setShowModal(false); setEditing(null); };

  const fmtRangeFr = (r, monthOnly) => {
    const locale = lang === 'en' ? 'en-US' : 'fr-FR';
    const s = new Date(r.start + 'T00:00:00'), e = new Date(r.end + 'T00:00:00');
    if (monthOnly) return s.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
    const opts = { day: '2-digit', month: 'short' };
    return `${s.toLocaleDateString(locale, opts)} – ${e.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' })}`;
  };

  return (
    <div>
      <div className="ph">
        <div>
          <div className="pt">{t('budget.title')}</div>
          <div className="ps">{t('budget.subtitle')}</div>
        </div>
        <div className="flex g8">
          <button className="lang-toggle" onClick={() => setDispCur(c => c === 'HTG' ? 'USD' : 'HTG')} title="HTG / USD">
            {dispCur}
          </button>
          <button className="btn btn-primary" onClick={() => { setEditing(null); setShowModal(true); }}>
            <Plus size={15} /> {t('budget.add')}
          </button>
        </div>
      </div>

      {budgets.length === 0 ? (
        <div className="empty">
          <div className="empty-ico"><PieChart size={48} /></div>
          <div className="empty-ttl">{t('budget.empty')}</div>
          <div className="empty-txt" style={{ marginBottom: 16 }}>{t('budget.emptySub')}</div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={15} /> {t('budget.add')}</button>
        </div>
      ) : (
        <>
          <BudgetSection
            title={t('budget.weekly')} RangeIcon={CalendarDays} rangeLabel={fmtRangeFr(wr, false)}
            items={weeklyBudgets} dispCur={dispCur} fmtC={fmtC} rate={rate} t={t} tId={tId}
            onEdit={(b) => { setEditing(b); setShowModal(true); }} onDelete={onDelete}
          />
          <BudgetSection
            title={t('budget.monthly')} RangeIcon={CalendarRange} rangeLabel={fmtRangeFr(mr, true)}
            items={monthlyBudgets} dispCur={dispCur} fmtC={fmtC} rate={rate} t={t} tId={tId}
            onEdit={(b) => { setEditing(b); setShowModal(true); }} onDelete={onDelete}
          />
        </>
      )}

      {showModal && <BudgetModal item={editing} onSave={handleSave} onClose={() => { setShowModal(false); setEditing(null); }} />}
    </div>
  );
}
