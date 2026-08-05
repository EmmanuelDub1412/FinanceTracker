import React, { useState, useMemo } from 'react';
import { Building2, CreditCard, Banknote, PiggyBank, Smartphone, Plus, Pencil, Trash2, AlertTriangle, TrendingUp, TrendingDown, Wallet, History, ArrowDownCircle, ArrowUpCircle, FileDown } from 'lucide-react';
import { fmtHTG, fmtUSD, fmt, toHTG, computeBalance, accountHistory, getCat, ACCOUNT_TYPES } from '../utils/finance';
import { useLanguage } from '../i18n/LanguageContext';

const TYPE_ICONS = {
  bank:   { Icon: Building2,  cls: 'bank'   },
  credit: { Icon: CreditCard, cls: 'credit' },
  cash:   { Icon: Banknote,   cls: 'cash'   },
  saving: { Icon: PiggyBank,  cls: 'saving' },
  mobile: { Icon: Smartphone, cls: 'mobile' },
};

function AccountModal({ account, onSave, onClose }) {
  const { t, tId } = useLanguage();
  const [form, setForm] = useState(account || {
    name:'', type:'bank', currency:'HTG',
    initialBalance:0, creditLimit:'', accountNumber:'', cardLast4:'',
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
                <option value="HTG">HTG (Gourde)</option>
                <option value="USD">USD (Dollar)</option>
              </select>
            </div>
          </div>
          <div className="fg">
            <label className="fl">{isCredit ? t('accounts.m_initialUsed') : t('accounts.m_initial')}</label>
            <input
              className="fi"
              type="number"
              value={isCredit ? Math.abs(Number(form.initialBalance)||0) : form.initialBalance}
              onChange={e=>set('initialBalance', isCredit ? -Math.abs(Number(e.target.value)||0) : e.target.value)}
            />
          </div>
          {isCredit && (
            <div className="fg">
              <label className="fl">{t('accounts.m_creditLimit')} ({form.currency})</label>
              <input className="fi" type="number" value={form.creditLimit} onChange={e=>set('creditLimit',e.target.value)} placeholder="ex. 140000"/>
            </div>
          )}
          {isCredit ? (
            <div className="fg">
              <label className="fl">{t('accounts.m_cardLast4')}</label>
              <input className="fi" value={form.cardLast4||''} maxLength={4} inputMode="numeric"
                onChange={e=>set('cardLast4', e.target.value.replace(/\D/g,'').slice(0,4))} placeholder="ex. 4432"/>
            </div>
          ) : (
            <div className="fg">
              <label className="fl">{t('accounts.m_accountNumber')}</label>
              <input className="fi" value={form.accountNumber||''} onChange={e=>set('accountNumber',e.target.value)} placeholder={t('accounts.m_accountNumberPh')}/>
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

function AccountHistoryModal({ account, transactions, onClose }) {
  const { t, tId, lang } = useLanguage();
  const allRows = useMemo(()=>accountHistory(account, transactions), [account, transactions]);
  const fmtDate = d=>{if(!d)return'';const dt=new Date(d);return dt.toLocaleDateString(lang==='en'?'en-US':'fr-FR',{day:'2-digit',month:'short',year:'numeric'});};

  const [fromDate, setFromDate] = useState('');
  const [toDate,   setToDate]   = useState('');

  const periodRows = useMemo(()=>allRows.filter(tx=>{
    if(fromDate && tx.date<fromDate) return false;
    if(toDate && tx.date>toDate) return false;
    return true;
  }),[allRows,fromDate,toDate]);

  // L'historique commence toujours par un point de depart : le solde du
  // compte juste avant la premiere transaction affichee (le solde initial
  // du compte si aucune periode n'est filtree, ou le solde a la date de
  // debut choisie sinon).
  const openingBalance = useMemo(()=>{
    if(!fromDate) return Number(account.initialBalance)||0;
    const before = allRows.filter(tx=>tx.date<fromDate);
    return before.length ? before[before.length-1].runningBalance : (Number(account.initialBalance)||0);
  },[allRows,fromDate,account.initialBalance]);

  const openingRow = {
    id:'__opening__', isOpening:true, date:fromDate||account.createdAt||'', description:t('accounts.openingBalance'),
    runningBalance:openingBalance,
  };

  const rows = useMemo(()=>[openingRow, ...periodRows],[periodRows,openingBalance,fromDate]);

  const catLabelOf = tx => tId('categories', tx.category, getCat(tx.category).label);
  const statusLabelOf = tx => t(`status.${tx.status||'confirmed'}`);

  const exportPDF = () => {
    const win = window.open('', '_blank');
    if(!win) { window.alert(t('accounts.popupBlocked')); return; }
    const period = fromDate || toDate
      ? `${t('accounts.periodFrom')} ${fromDate?fmtDate(fromDate):t('accounts.periodStart')} ${t('accounts.periodTo')} ${toDate?fmtDate(toDate):t('accounts.periodToday')}`
      : t('accounts.periodAll');
    const rowsHtml = rows.map(tx=>{
      if(tx.isOpening){
        return `<tr style="background:#F0F2F5;font-weight:700">
          <td>${fmtDate(tx.date)}</td><td>${tx.description}</td><td></td><td></td><td></td>
          <td style="text-align:right">${fmt(tx.runningBalance,account.currency)}</td><td></td>
        </tr>`;
      }
      const isIn = tx.direction==='in';
      return `<tr>
        <td>${fmtDate(tx.date)}</td>
        <td>${tx.description||''}</td>
        <td>${catLabelOf(tx)}</td>
        <td style="text-align:right;color:#E53E3E">${isIn?'':fmt(Number(tx.amount),tx.currency)}</td>
        <td style="text-align:right;color:#00A86B">${isIn?fmt(Number(tx.amount),tx.currency):''}</td>
        <td style="text-align:right;font-weight:600">${fmt(tx.runningBalance,account.currency)}</td>
        <td>${statusLabelOf(tx)}</td>
      </tr>`;
    }).join('');
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${t('accounts.history')} - ${account.name}</title>
      <style>
        body{font-family:Arial,Helvetica,sans-serif;color:#0F1923;padding:24px;}
        h1{font-size:18px;margin:0 0 2px 0;}
        .sub{font-size:12px;color:#4A5568;margin-bottom:2px;}
        table{width:100%;border-collapse:collapse;margin-top:16px;font-size:11px;}
        th,td{padding:6px 8px;border-bottom:1px solid #E2E6EC;text-align:left;}
        th{background:#F0F2F5;font-size:10px;text-transform:uppercase;letter-spacing:.4px;}
        @media print{ body{padding:0;} }
      </style></head><body>
      <h1>${t('accounts.history')} - ${account.name}</h1>
      <div class="sub">${account.currency} ${account.accountNumber?(' - '+account.accountNumber):''}${account.cardLast4?(' - •••• '+account.cardLast4):''}</div>
      <div class="sub">${period}</div>
      <table><thead><tr>
        <th>${t('transactions.col_date')}</th><th>${t('transactions.col_desc')}</th><th>${t('transactions.col_cat')}</th>
        <th style="text-align:right">${t('accounts.colDebit')}</th><th style="text-align:right">${t('accounts.colCredit')}</th>
        <th style="text-align:right">${t('accounts.runningBalance')}</th>
        <th>${t('transactions.col_status')}</th>
      </tr></thead><tbody>${rowsHtml || `<tr><td colspan="7" style="text-align:center;color:#8A97A8;padding:20px">${t('accounts.historyEmpty')}</td></tr>`}</tbody></table>
      </body></html>`);
    win.document.close();
    win.focus();
    setTimeout(()=>win.print(), 300);
  };

  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{maxWidth:760}}>
        <div className="modal-hd">
          <div className="modal-ttl"><History size={18} style={{color:'var(--g1)'}}/> {t('accounts.history')}: {account.name}</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        <div className="flex g8" style={{alignItems:'flex-end',flexWrap:'wrap',marginBottom:14}}>
          <div className="fg" style={{marginBottom:0}}>
            <label className="fl">{t('accounts.periodStart')}</label>
            <input className="fi" type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)} style={{width:150}}/>
          </div>
          <div className="fg" style={{marginBottom:0}}>
            <label className="fl">{t('accounts.periodEnd')}</label>
            <input className="fi" type="date" value={toDate} onChange={e=>setToDate(e.target.value)} style={{width:150}}/>
          </div>
          {(fromDate||toDate) && (
            <button className="btn btn-ghost btn-sm" onClick={()=>{setFromDate('');setToDate('');}}>{t('transactions.reset')}</button>
          )}
          <button className="btn btn-primary btn-sm" style={{marginLeft:'auto'}} onClick={exportPDF}>
            <FileDown size={13}/> {t('accounts.exportPdf')}
          </button>
        </div>

        {allRows.length===0 ? (
          <div className="empty" style={{padding:'24px 0'}}>
            <div className="empty-ico"><History size={40}/></div>
            <div className="empty-txt">{t('accounts.historyEmpty')}</div>
          </div>
        ) : (
          <div className="tw" style={{maxHeight:440,overflowY:'auto'}}>
            <table>
              <thead>
                <tr>
                  <th>{t('transactions.col_date')}</th><th>{t('transactions.col_desc')}</th><th>{t('transactions.col_cat')}</th>
                  <th style={{textAlign:'right'}}>{t('accounts.colDebit')}</th>
                  <th style={{textAlign:'right'}}>{t('accounts.colCredit')}</th>
                  <th style={{textAlign:'right'}}>{t('accounts.runningBalance')}</th>
                  <th>{t('transactions.col_status')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(tx=>{
                  if(tx.isOpening){
                    return (
                      <tr key={tx.id} style={{background:'var(--bg3)'}}>
                        <td style={{color:'var(--text2)',fontSize:12,whiteSpace:'nowrap',fontWeight:700}}>{tx.date?fmtDate(tx.date):''}</td>
                        <td style={{fontWeight:700,fontSize:13}}>{tx.description}</td>
                        <td></td><td></td><td></td>
                        <td className="tr" style={{fontWeight:700,fontSize:13}}>{fmt(tx.runningBalance,account.currency)}</td>
                        <td></td>
                      </tr>
                    );
                  }
                  const catLabel = catLabelOf(tx);
                  const isIn = tx.direction==='in';
                  return (
                    <tr key={tx.id}>
                      <td style={{color:'var(--text2)',fontSize:12,whiteSpace:'nowrap'}}>{fmtDate(tx.date)}</td>
                      <td>
                        <div className="flex g8" style={{alignItems:'center'}}>
                          {isIn ? <ArrowDownCircle size={13} style={{color:'var(--g1)',flexShrink:0}}/> : <ArrowUpCircle size={13} style={{color:'var(--red)',flexShrink:0}}/>}
                          <span style={{fontWeight:600,fontSize:13}}>{tx.description}</span>
                        </div>
                      </td>
                      <td><span style={{fontSize:12,color:'var(--text2)'}}>{catLabel}</span></td>
                      <td className="tr tx-out" style={{fontWeight:700,fontSize:13}}>{!isIn && fmt(Number(tx.amount),tx.currency)}</td>
                      <td className="tr tx-in" style={{fontWeight:700,fontSize:13}}>{isIn && fmt(Number(tx.amount),tx.currency)}</td>
                      <td className="tr" style={{fontWeight:600,fontSize:13,opacity:tx.status==='confirmed'?1:.5}}>{fmt(tx.runningBalance,account.currency)}</td>
                      <td><span className={`badge ${tx.status==='confirmed'?'bg-green':tx.status==='pending'?'bg-amber':'bg-red'}`}>{statusLabelOf(tx)}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Accounts({ accounts, transactions, settings, onAdd, onUpdate, onDelete }) {
  const { t, tId } = useLanguage();
  const [showModal, setShowModal] = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [dispCur,   setDispCur]   = useState('HTG');
  const [viewingHistory, setViewingHistory] = useState(null);
  const rate = Number(settings?.usdToHtg)||130;
  const fmtC = (v) => dispCur==='USD' ? fmtUSD(v/rate) : fmtHTG(v);

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

  // Sous-totaux natifs (non convertis) par devise, pour chaque KPI.
  const nativeAssets = useMemo(()=>{
    const list = enriched.filter(a=>a.type!=='credit');
    return {
      HTG: list.filter(a=>a.currency==='HTG').reduce((s,a)=>s+a.balance,0),
      USD: list.filter(a=>a.currency==='USD').reduce((s,a)=>s+a.balance,0),
    };
  },[enriched]);
  const nativeCreditUsed = useMemo(()=>{
    const list = enriched.filter(a=>a.isCredit);
    return {
      HTG: list.filter(a=>a.currency==='HTG').reduce((s,a)=>s+a.used,0),
      USD: list.filter(a=>a.currency==='USD').reduce((s,a)=>s+a.used,0),
    };
  },[enriched]);

  const handleSave = (data)=>{ editing?onUpdate(editing.id,data):onAdd(data); setShowModal(false);setEditing(null); };
  const progCls = pct => pct>=90?'danger':pct>=70?'warn':'ok';

  const groups = {
    bank:   enriched.filter(a=>a.type==='bank'),
    credit: enriched.filter(a=>a.type==='credit'),
    cash:   enriched.filter(a=>a.type==='cash'),
    saving: enriched.filter(a=>a.type==='saving'),
    mobile: enriched.filter(a=>a.type==='mobile'),
  };
  const groupLabels = {
    bank:t('accounts.groupBank'), credit:t('accounts.groupCredit'), cash:t('accounts.groupCash'), saving:t('accounts.groupSaving'),
    mobile:t('accounts.groupMobile'),
  };

  return (
    <div>
      <div className="ph">
        <div>
          <div className="pt">{t('accounts.title')}</div>
          <div className="ps">{t('accounts.subtitle')}</div>
        </div>
        <div className="flex g8">
          <button className="lang-toggle" onClick={()=>setDispCur(c=>c==='HTG'?'USD':'HTG')} title="HTG / USD">
            {dispCur}
          </button>
          <button className="btn btn-primary" onClick={()=>{setEditing(null);setShowModal(true);}}>
            <Plus size={15}/> {t('accounts.add')}
          </button>
        </div>
      </div>

      <div className="kpi-grid mb24">
        <div className="kpi green">
          <div className="kpi-lbl"><TrendingUp size={12}/> {t('accounts.totalAssets')}</div>
          <div className="kpi-val green">{fmtC(totalHTG)}</div>
          <div className="kpi-sub">{fmtHTG(nativeAssets.HTG)} · {fmtUSD(nativeAssets.USD)}</div>
          <div className="kpi-ico"><Wallet size={48}/></div>
        </div>
        <div className="kpi red">
          <div className="kpi-lbl"><CreditCard size={12}/> {t('accounts.creditUsed')}</div>
          <div className="kpi-val red">{fmtC(totalCreditUsed)}</div>
          <div className="kpi-sub">{fmtHTG(nativeCreditUsed.HTG)} · {fmtUSD(nativeCreditUsed.USD)}</div>
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
            <div className="al-ttl">{t('accounts.alertPrefix')}: {a.name}</div>
            <div className="al-det">
              {a.isCredit
                ? `${t('accounts.available')} : ${fmt(a.available,a.currency)} (${t('accounts.threshold')} : ${fmt(Number(a.alertThreshold),a.currency)})`
                : `${t('accounts.balance')} : ${fmt(a.balance,a.currency)} (${t('accounts.threshold')} : ${fmt(Number(a.alertThreshold),a.currency)})`}
            </div>
          </div>
        </div>
      ))}

      {[['bank','green'],['credit','red'],['cash','teal'],['saving','blue'],['mobile','amber']].map(([key])=>
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
                        <div className="acc-tp">
                          {a.currency}
                          {a.isCredit && a.cardLast4 && ` · •••• ${a.cardLast4}`}
                          {!a.isCredit && a.accountNumber && ` · ${a.accountNumber}`}
                        </div>
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
                      <button className="btn btn-ghost btn-sm" onClick={()=>setViewingHistory(a)}>
                        <History size={12}/> {t('accounts.history')}
                      </button>
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
      {viewingHistory&&<AccountHistoryModal account={viewingHistory} transactions={transactions} onClose={()=>setViewingHistory(null)}/>}
    </div>
  );
}
