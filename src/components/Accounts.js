import React, { useState, useMemo } from 'react';
import { Building2, CreditCard, Banknote, PiggyBank, Plus, Pencil, Trash2, AlertTriangle, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { fmtHTG, fmtUSD, fmt, toHTG, computeBalance, ACCOUNT_TYPES } from '../utils/finance';
import { useLanguage } from '../i18n/LanguageContext';

const TYPE_ICONS = {
  bank:   { Icon: Building2,  cls: 'bank'   },
  credit: { Icon: CreditCard, cls: 'credit' },
  cash:   { Icon: Banknote,   cls: 'cash'   },
  saving: { Icon: PiggyBank,  cls: 'saving' },
};

function AccountModal({ account, onSave, onClose }) {
  const { t, tId } = useLanguage();
  const [form, setForm] = useState(account || {
    name:'', type:'bank', currency:'HTG',
    initialBalance:0, creditLimit:'',
    alertEnabled:false, alertThreshold:'', notes:'',
  });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const isCredit = form.type === 'credit';

  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-hd">
          <div className="modal-ttl">
            <Building2 size={18} style={{color:'var(--g1)'}}/>
            {account ? t('accounts.edit') : t('accounts.add')}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="fgrid">
          <div className="fg">
            <label className="fl">{t('accounts.m_name')}</label>
            <input className="fi" value={form.name} onChange={e=>set('name',e.target.value)} placeholder={t('accounts.m_namePh')}/>
          </div>
          <div className="frow">
            <div className="fg">
              <label className="fl">{t('accounts.m_type')}</label>
              <select className="fs" value={form.type} onChange={e=>set('type',e.target.value)}>
                {ACCOUNT_TYPES.map(ty=><option key={ty.id} value={ty.id}>{tId('accountTypes',ty.id,ty.label)}</option>)}
              </select>
            </div>
            <div className="fg">
              <label className="fl">{t('accounts.m_currency')}</label>
              <select className="fs" value={form.currency} onChange={e=>set('currency',e.target.value)}>
                <option value="HTG">HTG — Gourde</option>
                <option value="USD">USD — Dollar</option>
              </select>
            </div>
          </div>
          <div className="fg">
            <label className="fl">{t('accounts.m_initial')}</label>
            <input className="fi" type="number" value={form.initialBalance} onChange={e=>set('initialBalance',e.target.value)}/>
          </div>
          {isCredit && (
            <div className="fg">
              <label className="fl">{t('accounts.m_creditLimit')} ({form.currency})</label>
              <input className="fi" type="number" value={form.creditLimit} onChange={e=>set('creditLimit',e.target.value)} placeholder="ex. 140000"/>
            </div>
          )}
          <hr className="div"/>
          <div className="tgl-row">
            <span style={{fontSize:13,display:'flex',alignItems:'center',gap:6}}>
              <AlertTriangle size={14} style={{color:'var(--amber)'}}/> {t('accounts.m_alertOn')}
            </span>
            <label className="tgl">
              <input type="checkbox" checked={form.alertEnabled} onChange={e=>set('alertEnabled',e.target.checked)}/>
              <span className="tgl-s"/>
            </label>
          </div>
          {form.alertEnabled && (
            <div className="fg">
              <label className="fl">{isCredit?t('accounts.m_thresholdCredit'):t('accounts.m_thresholdNormal')}</label>
              <input className="fi" type="number" value={form.alertThreshold} onChange={e=>set('alertThreshold',e.target.value)}
                placeholder={`ex. ${isCredit?'20000':'5000'} ${form.currency}`}/>
            </div>
          )}
          <div className="fg">
            <label className="fl">{t('accounts.m_notes')}</label>
            <input className="fi" value={form.notes||''} onChange={e=>set('notes',e.target.value)} placeholder={t('accounts.m_notesPh')}/>
          </div>
          <div className="flex g8" style={{justifyContent:'flex-end'}}>
            <button className="btn btn-ghost" onClick={onClose}>{t('accounts.m_cancel')}</button>
            <button className="btn btn-primary" onClick={()=>{if(form.name)onSave({...form,initialBalance:Number(form.initialBalance)||0});}}>
              {account?t('accounts.m_save'):t('accounts.m_add')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Accounts({ accounts, transactions, settings, onAdd, onUpdate, onDelete }) {
  const { t, tId } = useLanguage();
  const [showModal, setShowModal] = useState(false);
  const [editing,   setEditing]   = useState(null);
  const rate = Number(settings?.usdToHtg)||130;

  const enriched = useMemo(()=>accounts.map(a=>{
    const balance = computeBalance(a, transactions);
    const isCredit = a.type==='credit';
    const limit = Number(a.creditLimit)||0;
    const used  = isCredit ? Math.abs(Math.min(0,balance)) : 0;
    const available = isCredit&&limit>0 ? limit-used : null;
    const pct = isCredit&&limit>0 ? (used/limit)*100 : null;
    const alertFired = a.alertEnabled==='true'||a.alertEnabled===true ? (
      isCredit ? (available!==null&&available<Number(a.alertThreshold)) : balance<Number(a.alertThreshold)
    ) : false;
    return {...a,balance,isCredit,limit,used,available,pct,alertFired};
  }),[accounts,transactions]);

  const totalHTG = useMemo(()=>enriched.filter(a=>a.type!=='credit').reduce((s,a)=>s+toHTG(a.balance,a.currency,rate),0),[enriched,rate]);
  const totalCreditUsed = useMemo(()=>enriched.filter(a=>a.isCredit).reduce((s,a)=>s+toHTG(a.used,a.currency,rate),0),[enriched,rate]);

  const handleSave = (data)=>{ editing?onUpdate(editing.id,data):onAdd(data); setShowModal(false);setEditing(null); };
  const progCls = pct => pct>=90?'danger':pct>=70?'warn':'ok';

  const groups = {
    bank:   enriched.filter(a=>a.type==='bank'),
    credit: enriched.filter(a=>a.type==='credit'),
    cash:   enriched.filter(a=>a.type==='cash'),
    saving: enriched.filter(a=>a.type==='saving'),
  };
  const groupLabels = {
    bank:t('accounts.groupBank'), credit:t('accounts.groupCredit'), cash:t('accounts.groupCash'), saving:t('accounts.groupSaving'),
  };

  return (
    <div>
      <div className="ph">
        <div>
          <div className="pt">{t('accounts.title')}</div>
          <div className="ps">{t('accounts.subtitle')}</div>
        </div>
        <button className="btn btn-primary" onClick={()=>{setEditing(null);setShowModal(true);}}>
          <Plus size={15}/> {t('accounts.add')}
        </button>
      </div>

      <div className="kpi-grid mb24">
        <div className="kpi green">
          <div className="kpi-lbl"><TrendingUp size={12}/> {t('accounts.totalAssets')}</div>
          <div className="kpi-val green">{fmtHTG(totalHTG)}</div>
          <div className="kpi-ico"><Wallet size={48}/></div>
        </div>
        <div className="kpi red">
          <div className="kpi-lbl"><CreditCard size={12}/> {t('accounts.creditUsed')}</div>
          <div className="kpi-val red">{fmtHTG(totalCreditUsed)}</div>
        </div>
        <div className="kpi blue">
          <div className="kpi-lbl">{t('accounts.count')}</div>
          <div className="kpi-val blue">{accounts.length}</div>
        </div>
      </div>

      {enriched.filter(a=>a.alertFired).map(a=>(
        <div key={a.id} className="al danger">
          <AlertTriangle size={18} style={{color:'var(--red)',flexShrink:0,marginTop:1}}/>
          <div>
            <div className="al-ttl">{t('accounts.alertPrefix')} — {a.name}</div>
            <div className="al-det">
              {a.isCredit
                ? `${t('accounts.available')} : ${fmt(a.available,a.currency)} (${t('accounts.threshold')} : ${fmt(Number(a.alertThreshold),a.currency)})`
                : `${t('accounts.balance')} : ${fmt(a.balance,a.currency)} (${t('accounts.threshold')} : ${fmt(Number(a.alertThreshold),a.currency)})`}
            </div>
          </div>
        </div>
      ))}

      {[['bank','green'],['credit','red'],['cash','teal'],['saving','blue']].map(([key])=>
        groups[key].length>0&&(
          <div key={key} className="mb24">
            <div className="sl">{groupLabels[key]}</div>
            <div className="acc-grid">
              {groups[key].map(a=>{
                const {Icon,cls} = TYPE_ICONS[a.type]||TYPE_ICONS.bank;
                return (
                  <div key={a.id} className={`acc-card ${a.alertFired?'alert-on':''}`} onClick={()=>{setEditing(a);setShowModal(true);}}>
                    {a.alertFired && <div className="alert-pill"><AlertTriangle size={9}/> {t('accounts.alertPrefix')}</div>}
                    <div className="acc-hd">
                      <div className={`acc-icon-wrap ${cls}`}><Icon size={20}/></div>
                      <div>
                        <div className="acc-nm">{a.name}</div>
                        <div className="acc-tp">{a.currency}</div>
                      </div>
                    </div>
                    {a.isCredit ? (
                      <>
                        <div style={{fontSize:11,color:'var(--text3)',marginBottom:3}}>{t('accounts.usedAmount')}</div>
                        <div className={`acc-bal ${a.used>0?'neg':''}`}>{fmt(a.used,a.currency)}</div>
                        {a.limit>0&&(
                          <div className="acc-limit-bar mt8">
                            <div className="prog-row">
                              <span>{t('accounts.available')} : {fmt(a.available,a.currency)}</span>
                              <span>{Math.round(a.pct)}%</span>
                            </div>
                            <div className="prog-track">
                              <div className={`prog-fill ${progCls(a.pct)}`} style={{width:`${a.pct}%`}}/>
                            </div>
                            <div style={{fontSize:10,color:'var(--text3)',marginTop:3}}>{t('accounts.limit')} : {fmt(a.limit,a.currency)}</div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className={`acc-bal ${a.balance<0?'neg':'pos'}`}>{fmt(a.balance,a.currency)}</div>
                    )}
                    {a.notes&&<div style={{fontSize:11,color:'var(--text3)',marginTop:8}}>{a.notes}</div>}
                    <div className="flex g8 mt12" onClick={e=>e.stopPropagation()}>
                      <button className="btn btn-ghost btn-sm" onClick={()=>{setEditing(a);setShowModal(true);}}>
                        <Pencil size={12}/> {t('accounts.edit_')}
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={()=>{if(window.confirm(t('accounts.deleteConfirm')))onDelete(a.id);}}>
                        <Trash2 size={12}/>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )
      )}

      {accounts.length===0&&(
        <div className="empty">
          <div className="empty-ico"><Building2 size={48}/></div>
          <div className="empty-ttl">{t('accounts.empty')}</div>
          <div className="empty-txt" style={{marginBottom:16}}>{t('accounts.emptySub')}</div>
          <button className="btn btn-primary" onClick={()=>setShowModal(true)}><Plus size={15}/> {t('accounts.add')}</button>
        </div>
      )}

      {showModal&&<AccountModal account={editing} onSave={handleSave} onClose={()=>{setShowModal(false);setEditing(null);}}/>}
    </div>
  );
}
