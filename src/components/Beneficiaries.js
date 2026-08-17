import React, { useState } from 'react';
import { Users, Plus, Pencil, Trash2, Phone, Mail, Landmark, StickyNote } from 'lucide-react';
import { genId } from '../firestoreApi';
import { useLanguage } from '../i18n/LanguageContext';

function BeneficiaryModal({ item, onSave, onClose }) {
  const { t } = useLanguage();
  const [form, setForm] = useState(item || { name: '', phone: '', email: '', notes: '', accounts: [] });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addAccountRow = () => set('accounts', [...(form.accounts || []), { id: genId(), label: '', bankName: '', accountNumber: '' }]);
  const updateAccountRow = (id, k, v) => set('accounts', (form.accounts || []).map(a => a.id === id ? { ...a, [k]: v } : a));
  const removeAccountRow = (id) => set('accounts', (form.accounts || []).filter(a => a.id !== id));

  const canSave = form.name.trim().length > 0;

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 560 }}>
        <div className="modal-hd">
          <div className="modal-ttl">
            <Users size={18} style={{ color: 'var(--g1)' }} />
            {item ? t('beneficiaries.m_titleEdit') : t('beneficiaries.m_titleNew')}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="fgrid">
          <div className="fg">
            <label className="fl">{t('beneficiaries.m_name')} *</label>
            <input className="fi" value={form.name} onChange={e => set('name', e.target.value)} placeholder={t('beneficiaries.m_namePh')} />
          </div>

          <div className="frow">
            <div className="fg">
              <label className="fl">{t('beneficiaries.m_phone')}</label>
              <input className="fi" value={form.phone || ''} onChange={e => set('phone', e.target.value)} placeholder={t('beneficiaries.m_phonePh')} />
            </div>
            <div className="fg">
              <label className="fl">{t('beneficiaries.m_email')}</label>
              <input className="fi" type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} placeholder={t('beneficiaries.m_emailPh')} />
            </div>
          </div>

          <div className="fg">
            <div className="fb" style={{ marginBottom: 6 }}>
              <label className="fl" style={{ marginBottom: 0 }}>{t('beneficiaries.m_accounts')}</label>
              <button type="button" className="btn btn-ghost btn-sm" onClick={addAccountRow}>
                <Plus size={12} /> {t('beneficiaries.m_addAccount')}
              </button>
            </div>
            {(form.accounts || []).length === 0 && (
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>{t('beneficiaries.m_noAccounts')}</div>
            )}
            <div style={{ display: 'grid', gap: 8 }}>
              {(form.accounts || []).map(a => (
                <div key={a.id} style={{ padding: 10, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg3)' }}>
                  <div className="frow" style={{ marginBottom: 6 }}>
                    <input className="fi" value={a.label} onChange={e => updateAccountRow(a.id, 'label', e.target.value)}
                      placeholder={t('beneficiaries.m_accountLabelPh')} />
                    <input className="fi" value={a.bankName} onChange={e => updateAccountRow(a.id, 'bankName', e.target.value)}
                      placeholder={t('beneficiaries.m_bankPh')} />
                  </div>
                  <div className="flex g8" style={{ alignItems: 'center' }}>
                    <input className="fi" style={{ flex: 1 }} value={a.accountNumber} onChange={e => updateAccountRow(a.id, 'accountNumber', e.target.value)}
                      placeholder={t('beneficiaries.m_accountNumberPh')} />
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => removeAccountRow(a.id)}><Trash2 size={12} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="fg">
            <label className="fl">{t('beneficiaries.m_notes')}</label>
            <input className="fi" value={form.notes || ''} onChange={e => set('notes', e.target.value)} placeholder={t('beneficiaries.m_notesPh')} />
          </div>

          <div className="flex g8" style={{ justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={onClose}>{t('beneficiaries.m_cancel')}</button>
            <button className="btn btn-primary" disabled={!canSave} onClick={() => onSave({ ...form, name: form.name.trim() })}>
              {item ? t('beneficiaries.m_save') : t('beneficiaries.m_create')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Beneficiaries({ beneficiaries, onAdd, onUpdate, onDelete }) {
  const { t } = useLanguage();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const handleSave = (data) => { editing ? onUpdate(editing.id, data) : onAdd(data); setShowModal(false); setEditing(null); };

  return (
    <div>
      <div className="ph">
        <div>
          <div className="pt">{t('beneficiaries.title')}</div>
          <div className="ps">{t('beneficiaries.subtitle')}</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setShowModal(true); }}>
          <Plus size={15} /> {t('beneficiaries.add')}
        </button>
      </div>

      {beneficiaries.length === 0 ? (
        <div className="empty">
          <div className="empty-ico"><Users size={48} /></div>
          <div className="empty-ttl">{t('beneficiaries.empty')}</div>
          <div className="empty-txt" style={{ marginBottom: 16 }}>{t('beneficiaries.emptySub')}</div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={15} /> {t('beneficiaries.add')}</button>
        </div>
      ) : (
        <div className="acc-grid">
          {beneficiaries.map(b => (
            <div key={b.id} className="acc-card" style={{ cursor: 'default' }}>
              <div className="acc-hd">
                <div className="acc-icon-wrap" style={{ background: 'var(--g-bg)', color: 'var(--g1)' }}><Users size={20} /></div>
                <div>
                  <div className="acc-nm">{b.name}</div>
                  {b.phone && <div className="acc-tp" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={11} /> {b.phone}</div>}
                </div>
              </div>

              {b.email && (
                <div style={{ fontSize: 12, color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: 5, marginTop: 8 }}>
                  <Mail size={12} /> {b.email}
                </div>
              )}

              {(b.accounts || []).length > 0 && (
                <div style={{ marginTop: 10, display: 'grid', gap: 6 }}>
                  {b.accounts.map(a => (
                    <div key={a.id} style={{ fontSize: 11.5, color: 'var(--text2)', background: 'var(--bg3)', borderRadius: 6, padding: '6px 9px', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Landmark size={11} style={{ flexShrink: 0, color: 'var(--text3)' }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {a.label && <b style={{ color: 'var(--text)' }}>{a.label}: </b>}
                        {[a.bankName, a.accountNumber].filter(Boolean).join(' · ') || t('beneficiaries.m_noAccounts')}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {b.notes && (
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 8, display: 'flex', alignItems: 'flex-start', gap: 5 }}>
                  <StickyNote size={11} style={{ flexShrink: 0, marginTop: 1 }} /> {b.notes}
                </div>
              )}

              <div className="flex g8 mt12">
                <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(b); setShowModal(true); }}><Pencil size={12} /> {t('beneficiaries.edit_')}</button>
                <button className="btn btn-danger btn-sm" onClick={() => { if (window.confirm(t('beneficiaries.deleteConfirm'))) onDelete(b.id); }}><Trash2 size={12} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && <BeneficiaryModal item={editing} onSave={handleSave} onClose={() => { setShowModal(false); setEditing(null); }} />}
    </div>
  );
}
