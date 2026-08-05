import React, { useState, useMemo } from 'react';
import {
  HandCoins, Landmark, CalendarClock, Banknote, Plus, Pencil, Trash2,
  AlertTriangle, ArrowDownCircle, ArrowUpCircle, TrendingUp, CheckCircle2, History, ChevronDown, ChevronUp,
} from 'lucide-react';
import { fmt, toHTG, fmtHTG } from '../utils/finance';
import { useLanguage } from '../i18n/LanguageContext';

const KINDS = ['receivable', 'payable', 'loan', 'bond'];
const KIND_ICON = { receivable: ArrowDownCircle, payable: ArrowUpCircle, loan: Landmark, bond: TrendingUp };
const KIND_CLS  = { receivable: 'green', payable: 'red', loan: 'blue', bond: 'purple' };

const today = () => new Date().toISOString().split('T')[0];

// Next occurrence (on/after today) of a given day-of-month, for loans paid monthly.
function nextDueFromDay(dueDay) {
  const d = Number(dueDay) || 1;
  const now = new Date();
  let cand = new Date(now.getFullYear(), now.getMonth(), d);
  if (cand < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
    cand = new Date(now.getFullYear(), now.getMonth() + 1, d);
  }
  return cand.toISOString().split('T')[0];
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T00:00:00');
  const n = new Date(); n.setHours(0, 0, 0, 0);
  return Math.round((d - n) / 86400000);
}

function LoanModal({ item, defaultKind, onSave, onClose }) {
  const { t } = useLanguage();
  const [form, setForm] = useState(item || {
    kind: defaultKind || 'receivable',
    name: '', currency: 'HTG', notes: '',
    amount: '', dueDate: '',
    principal: '', remainingBalance: '', monthlyPayment: '', dueDay: '1', interestRate: '', startDate: today(),
    couponRate: '', frequency: 'monthly', nextPaymentDate: '', maturityDate: '',
    alertEnabled: false, alertDays: '3',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const kind = form.kind;

  const canSave = form.name && (
    (kind === 'receivable' || kind === 'payable') ? form.amount :
    kind === 'loan' ? form.remainingBalance :
    kind === 'bond' ? form.amount : false
  );

  const handleSave = () => {
    if (!canSave) return;
    const payload = { ...form };
    ['amount', 'principal', 'remainingBalance', 'monthlyPayment', 'interestRate', 'couponRate'].forEach(k => {
      if (payload[k] !== undefined && payload[k] !== '') payload[k] = Number(payload[k]);
    });
    onSave(payload);
  };

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-hd">
          <div className="modal-ttl">
            <HandCoins size={18} style={{ color: 'var(--g1)' }} />
            {item ? t('loansCredits.m_titleEdit') : t('loansCredits.m_titleNew')}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="fgrid">
          {!item && (
            <div className="fg">
              <label className="fl">{t('loansCredits.m_kind')}</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 6 }}>
                {KINDS.map(k => (
                  <button key={k} type="button" onClick={() => set('kind', k)} className="btn btn-sm"
                    style={{
                      justifyContent: 'center',
                      border: `2px solid ${kind === k ? 'var(--g1)' : 'var(--border)'}`,
                      background: kind === k ? 'var(--g-bg)' : 'var(--bg3)',
                      color: kind === k ? 'var(--g1)' : 'var(--text2)',
                    }}>
                    {t(`loansCredits.kind_${k}`)}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="fg">
            <label className="fl">{t('loansCredits.m_name')}</label>
            <input className="fi" value={form.name} onChange={e => set('name', e.target.value)} placeholder={t('loansCredits.m_namePh')} />
          </div>

          {(kind === 'receivable' || kind === 'payable') && (
            <>
              <div className="frow">
                <div className="fg">
                  <label className="fl">{t('loansCredits.m_amount')}</label>
                  <input className="fi" type="number" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0" />
                </div>
                <div className="fg">
                  <label className="fl">{t('loansCredits.m_currency')}</label>
                  <select className="fs" value={form.currency} onChange={e => set('currency', e.target.value)}>
                    <option value="HTG">HTG</option><option value="USD">USD</option>
                  </select>
                </div>
              </div>
              <div className="fg">
                <label className="fl">{t('loansCredits.m_dueDate')}</label>
                <input className="fi" type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} />
              </div>
            </>
          )}

          {kind === 'loan' && (
            <>
              <div className="frow">
                <div className="fg">
                  <label className="fl">{t('loansCredits.m_remainingBalance')}</label>
                  <input className="fi" type="number" value={form.remainingBalance} onChange={e => set('remainingBalance', e.target.value)} placeholder="0" />
                </div>
                <div className="fg">
                  <label className="fl">{t('loansCredits.m_currency')}</label>
                  <select className="fs" value={form.currency} onChange={e => set('currency', e.target.value)}>
                    <option value="HTG">HTG</option><option value="USD">USD</option>
                  </select>
                </div>
              </div>
              <div className="frow">
                <div className="fg">
                  <label className="fl">{t('loansCredits.m_monthlyPayment')}</label>
                  <input className="fi" type="number" value={form.monthlyPayment} onChange={e => set('monthlyPayment', e.target.value)} placeholder="0" />
                </div>
                <div className="fg">
                  <label className="fl">{t('loansCredits.m_dueDate')} ({t('freq.monthly')})</label>
                  <input className="fi" type="number" min="1" max="31" value={form.dueDay} onChange={e => set('dueDay', e.target.value)} placeholder="ex. 5" />
                </div>
              </div>
              <div className="fg">
                <label className="fl">{t('loansCredits.m_interestRate')}</label>
                <input className="fi" type="number" value={form.interestRate} onChange={e => set('interestRate', e.target.value)} placeholder="0" />
              </div>
            </>
          )}

          {kind === 'bond' && (
            <>
              <div className="frow">
                <div className="fg">
                  <label className="fl">{t('loansCredits.m_amount')}</label>
                  <input className="fi" type="number" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0" />
                </div>
                <div className="fg">
                  <label className="fl">{t('loansCredits.m_currency')}</label>
                  <select className="fs" value={form.currency} onChange={e => set('currency', e.target.value)}>
                    <option value="HTG">HTG</option><option value="USD">USD</option>
                  </select>
                </div>
              </div>
              <div className="frow">
                <div className="fg">
                  <label className="fl">{t('loansCredits.m_couponRate')} (%)</label>
                  <input className="fi" type="number" value={form.couponRate} onChange={e => set('couponRate', e.target.value)} placeholder="0" />
                </div>
                <div className="fg">
                  <label className="fl">{t('loansCredits.m_frequency')}</label>
                  <select className="fs" value={form.frequency} onChange={e => set('frequency', e.target.value)}>
                    <option value="monthly">{t('freq.monthly')}</option>
                    <option value="quarterly">{t('freq.quarterly')}</option>
                    <option value="semiannual">{t('freq.semiannual')}</option>
                    <option value="annual">{t('freq.annual')}</option>
                  </select>
                </div>
              </div>
              <div className="frow">
                <div className="fg">
                  <label className="fl">{t('loansCredits.m_nextPaymentDate')}</label>
                  <input className="fi" type="date" value={form.nextPaymentDate} onChange={e => set('nextPaymentDate', e.target.value)} />
                </div>
                <div className="fg">
                  <label className="fl">{t('loansCredits.m_maturityDate')}</label>
                  <input className="fi" type="date" value={form.maturityDate} onChange={e => set('maturityDate', e.target.value)} />
                </div>
              </div>
            </>
          )}

          <hr className="div" />
          <div className="tgl-row">
            <span style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertTriangle size={14} style={{ color: 'var(--amber)' }} /> {t('loansCredits.m_alertOn')}
            </span>
            <label className="tgl">
              <input type="checkbox" checked={form.alertEnabled} onChange={e => set('alertEnabled', e.target.checked)} />
              <span className="tgl-s" />
            </label>
          </div>
          {form.alertEnabled && (
            <div className="fg">
              <label className="fl">{t('loansCredits.m_alertDays')}</label>
              <input className="fi" type="number" min="0" value={form.alertDays} onChange={e => set('alertDays', e.target.value)} placeholder="ex. 3" />
            </div>
          )}

          <div className="fg">
            <label className="fl">{t('loansCredits.m_notes')}</label>
            <input className="fi" value={form.notes || ''} onChange={e => set('notes', e.target.value)} placeholder={t('loansCredits.m_notesPh')} />
          </div>

          <div className="flex g8" style={{ justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={onClose}>{t('loansCredits.m_cancel')}</button>
            <button className="btn btn-primary" disabled={!canSave} onClick={handleSave}>
              {item ? t('loansCredits.m_save') : t('loansCredits.m_create')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoansCredits({ loans, settings, onAdd, onUpdate, onDelete }) {
  const { t, lang } = useLanguage();
  const rate = Number(settings?.usdToHtg) || 130;
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [newKind, setNewKind] = useState('receivable');
  const [openHistory, setOpenHistory] = useState({});
  const [dispCur, setDispCur] = useState('HTG');
  const fmtC = (v) => dispCur === 'USD' ? fmt(v / rate, 'USD') : fmt(v, 'HTG');

  const toggleHistory = (id) => setOpenHistory(h => ({ ...h, [id]: !h[id] }));

  // Marque la mensualite du jour comme payee : archive le versement dans
  // paymentHistory et reduit le solde restant du pret.
  const markPaid = (item) => {
    const amt = Number(item.monthlyPayment) || 0;
    const newBalance = Math.max(0, (Number(item.remainingBalance) || 0) - amt);
    const history = [...(item.paymentHistory || []), { date: today(), amount: amt }];
    onUpdate(item.id, { remainingBalance: newBalance, paymentHistory: history });
  };

  const enriched = useMemo(() => loans.map(l => {
    let dueDate = l.dueDate || null;
    if (l.kind === 'loan') dueDate = nextDueFromDay(l.dueDay);
    if (l.kind === 'bond') dueDate = l.nextPaymentDate || null;
    const dLeft = dueDate ? daysUntil(dueDate) : null;
    const alertFired = (l.alertEnabled === true || l.alertEnabled === 'true') && dLeft !== null && dLeft <= Number(l.alertDays || 0);
    const nativeAmount = l.kind === 'loan' ? (Number(l.remainingBalance) || 0) : (Number(l.amount) || 0);
    const valueHTG = toHTG(nativeAmount, l.currency, rate);
    return { ...l, dueDate, dLeft, alertFired, nativeAmount, valueHTG };
  }), [loans, rate]);

  const groups = {
    receivable: enriched.filter(l => l.kind === 'receivable'),
    payable: enriched.filter(l => l.kind === 'payable'),
    loan: enriched.filter(l => l.kind === 'loan'),
    bond: enriched.filter(l => l.kind === 'bond'),
  };

  // Pour chaque categorie : total combine (converti, devise au choix) +
  // sous-totaux natifs (non convertis) par devise.
  const nativeByCurrency = (items) => ({
    HTG: items.filter(l => l.currency === 'HTG').reduce((s, l) => s + l.nativeAmount, 0),
    USD: items.filter(l => l.currency === 'USD').reduce((s, l) => s + l.nativeAmount, 0),
  });

  const totalReceivable = groups.receivable.reduce((s, l) => s + l.valueHTG, 0);
  const totalPayable = groups.payable.reduce((s, l) => s + l.valueHTG, 0);
  const totalLoanRemaining = groups.loan.reduce((s, l) => s + l.valueHTG, 0);
  const totalBondValue = groups.bond.reduce((s, l) => s + l.valueHTG, 0);

  const nativeReceivable = nativeByCurrency(groups.receivable);
  const nativePayable = nativeByCurrency(groups.payable);
  const nativeLoan = nativeByCurrency(groups.loan);
  const nativeBond = nativeByCurrency(groups.bond);

  const handleSave = (data) => { editing ? onUpdate(editing.id, data) : onAdd(data); setShowModal(false); setEditing(null); };
  const openNew = (kind) => { setNewKind(kind); setEditing(null); setShowModal(true); };

  const KPI = ({ icon: Icon, label, value, native, cls }) => (
    <div className={`kpi ${cls}`}>
      <div className="kpi-lbl"><Icon size={12} /> {label}</div>
      <div className={`kpi-val ${cls}`}>{fmtC(value)}</div>
      <div className="kpi-sub">{fmtHTG(native.HTG)} · {fmt(native.USD, 'USD')}</div>
    </div>
  );

  return (
    <div>
      <div className="ph">
        <div>
          <div className="pt">{t('loansCredits.title')}</div>
          <div className="ps">{t('loansCredits.subtitle')}</div>
        </div>
        <div className="flex g8">
          <button className="lang-toggle" onClick={() => setDispCur(c => c === 'HTG' ? 'USD' : 'HTG')} title="HTG / USD">
            {dispCur}
          </button>
          <button className="btn btn-primary" onClick={() => openNew('receivable')}>
            <Plus size={15} /> {t('loansCredits.add')}
          </button>
        </div>
      </div>

      <div className="kpi-grid mb24">
        <KPI icon={ArrowDownCircle} label={t('loansCredits.totalReceivable')} value={totalReceivable} native={nativeReceivable} cls="green" />
        <KPI icon={ArrowUpCircle} label={t('loansCredits.totalPayable')} value={totalPayable} native={nativePayable} cls="red" />
        <KPI icon={Landmark} label={t('loansCredits.totalLoanRemaining')} value={totalLoanRemaining} native={nativeLoan} cls="blue" />
        <KPI icon={TrendingUp} label={t('loansCredits.totalBondValue')} value={totalBondValue} native={nativeBond} cls="teal" />
      </div>

      {enriched.filter(l => l.alertFired).map(l => (
        <div key={l.id} className="al danger">
          <AlertTriangle size={18} style={{ color: 'var(--red)', flexShrink: 0, marginTop: 1 }} />
          <div>
            <div className="al-ttl">{t('loansCredits.alertPrefix')}: {l.name}</div>
            <div className="al-det">
              {l.dLeft < 0
                ? `${t('loansCredits.overdue')} (${Math.abs(l.dLeft)} ${t('loansCredits.daysLeft')})`
                : `${t('loansCredits.dueOn')} : ${l.dueDate} (${l.dLeft} ${t('loansCredits.daysLeft')})`}
            </div>
          </div>
        </div>
      ))}

      {KINDS.map(kind => groups[kind].length > 0 && (
        <div key={kind} className="mb24">
          <div className="sl">{t(`loansCredits.group${kind[0].toUpperCase()}${kind.slice(1)}`)}</div>
          <div className="acc-grid">
            {groups[kind].map(l => {
              const Icon = KIND_ICON[kind];
              return (
                <div key={l.id} className={`acc-card ${l.alertFired ? 'alert-on' : ''}`} onClick={() => { setEditing(l); setShowModal(true); }}>
                  {l.alertFired && <div className="alert-pill"><AlertTriangle size={9} /> {t('loansCredits.alertPrefix')}</div>}
                  <div className="acc-hd">
                    <div className={`acc-icon-wrap ${KIND_CLS[kind]}`}><Icon size={20} /></div>
                    <div>
                      <div className="acc-nm">{l.name}</div>
                      <div className="acc-tp">{t(`loansCredits.kind_${kind}`)}</div>
                    </div>
                  </div>

                  {kind === 'loan' ? (
                    <>
                      <div className={`acc-bal ${l.remainingBalance > 0 ? 'neg' : 'pos'}`}>{fmt(Number(l.remainingBalance) || 0, l.currency)}</div>
                      {Number(l.monthlyPayment) > 0 && (
                        <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>
                          {fmt(Number(l.monthlyPayment), l.currency)}{t('loansCredits.perMonth')}
                        </div>
                      )}
                      {Number(l.remainingBalance) <= 0 && (l.paymentHistory || []).length > 0 && (
                        <div style={{ marginTop: 8, padding: '5px 10px', background: 'var(--g-bg)', color: 'var(--g1)', borderRadius: 6, fontSize: 11, fontWeight: 700, display: 'inline-block' }}>
                          {t('loansCredits.paidOff')}
                        </div>
                      )}
                    </>
                  ) : kind === 'bond' ? (
                    <>
                      <div className="acc-bal pos">{fmt(Number(l.amount) || 0, l.currency)}</div>
                      {Number(l.couponRate) > 0 && (
                        <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>
                          {l.couponRate}%{t('loansCredits.perYear')}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className={`acc-bal ${kind === 'payable' ? 'neg' : 'pos'}`}>{fmt(Number(l.amount) || 0, l.currency)}</div>
                  )}

                  {l.dueDate && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text3)', marginTop: 8 }}>
                      <CalendarClock size={12} /> {l.dueDate}
                    </div>
                  )}
                  {l.notes && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 8 }}>{l.notes}</div>}

                  <div className="flex g8 mt12" style={{ flexWrap: 'wrap' }} onClick={e => e.stopPropagation()}>
                    {kind === 'loan' && Number(l.remainingBalance) > 0 && (
                      <button className="btn btn-primary btn-sm" onClick={() => markPaid(l)}>
                        <CheckCircle2 size={12} /> {t('loansCredits.markPaid')}
                      </button>
                    )}
                    {kind === 'loan' && (l.paymentHistory || []).length > 0 && (
                      <button className="btn btn-ghost btn-sm" onClick={() => toggleHistory(l.id)}>
                        <History size={12} /> {t('loansCredits.history')} ({l.paymentHistory.length})
                        {openHistory[l.id] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>
                    )}
                    <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(l); setShowModal(true); }}>
                      <Pencil size={12} /> {t('loansCredits.edit_')}
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => { if (window.confirm(t('loansCredits.deleteConfirm'))) onDelete(l.id); }}>
                      <Trash2 size={12} />
                    </button>
                  </div>

                  {kind === 'loan' && openHistory[l.id] && (l.paymentHistory || []).length > 0 && (
                    <div onClick={e => e.stopPropagation()} style={{ marginTop: 10, borderTop: '1px solid var(--border)', paddingTop: 8, maxHeight: 140, overflowY: 'auto' }}>
                      {[...l.paymentHistory].reverse().map((p, i) => (
                        <div key={i} className="fb" style={{ fontSize: 11, color: 'var(--text2)', padding: '3px 0' }}>
                          <span>{t('loansCredits.paidOn')} {new Date(p.date).toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR')}</span>
                          <span style={{ fontWeight: 600, color: 'var(--g1)' }}>{fmt(p.amount, l.currency)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {loans.length === 0 && (
        <div className="empty">
          <div className="empty-ico"><Banknote size={48} /></div>
          <div className="empty-ttl">{t('loansCredits.empty')}</div>
          <div className="empty-txt" style={{ marginBottom: 16 }}>{t('loansCredits.emptySub')}</div>
          <button className="btn btn-primary" onClick={() => openNew('receivable')}><Plus size={15} /> {t('loansCredits.add')}</button>
        </div>
      )}

      {showModal && <LoanModal item={editing} defaultKind={newKind} onSave={handleSave} onClose={() => { setShowModal(false); setEditing(null); }} />}
    </div>
  );
}
