import React, { useState, useMemo, useRef } from 'react';
import { ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, PiggyBank, Plus, Pencil, Trash2, Search, CheckCircle, Clock, XCircle, Paperclip, Camera, FileText, X, Loader2 } from 'lucide-react';
import { fmtHTG, fmt, toHTG, today, CATEGORIES, getCat } from '../utils/finance';
import { useLanguage } from '../i18n/LanguageContext';
import { uploadReceipt, deleteReceipt } from '../firestoreApi';

const TYPE_ICON = { income: ArrowDownCircle, expense: ArrowUpCircle, transfer: ArrowLeftRight, savings: PiggyBank };
const TYPE_CLS  = { income: 'on-income', expense: 'on-expense', transfer: 'on-transfer', savings: 'on-savings' };
const STATUS_CLS = { confirmed: 'bg-green', pending: 'bg-amber', cancelled: 'bg-red' };
const STATUS_ICON = { confirmed: CheckCircle, pending: Clock, cancelled: XCircle };

function TxModal({ tx, accounts, beneficiaries=[], onAddBeneficiary, onDeleteBeneficiary, onSave, onClose }) {
  const { t, tId } = useLanguage();
  const [form, setForm] = useState(tx || {
    date:today(), description:'', category:'DEP-ALI', txType:'expense',
    debitAccount:'', creditAccount:'', amount:'', currency:'HTG',
    status:'confirmed', beneficiary:'', notes:'',
    receiptUrl:'', receiptPath:'', receiptName:'', receiptType:'',
  });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  // Selecteur de beneficiaire : liste deroulante alimentee par la collection
  // "beneficiaires", avec option pour en ajouter un nouveau a la volee.
  const [addingBen, setAddingBen] = useState(false);
  const [newBenName, setNewBenName] = useState('');
  const confirmNewBeneficiary = () => {
    const name = newBenName.trim();
    if (!name) { setAddingBen(false); return; }
    const exists = beneficiaries.find(b => b.name.toLowerCase() === name.toLowerCase());
    if (!exists) onAddBeneficiary?.({ name });
    set('beneficiary', name);
    setNewBenName('');
    setAddingBen(false);
  };

  // Piece jointe : soit un fichier deja upload (receiptUrl existant sur la
  // transaction), soit un nouveau fichier choisi localement en attente
  // d'upload au moment du Save (pour ne pas uploader si l'utilisateur annule).
  const [newFile, setNewFile] = useState(null);
  const [newPreview, setNewPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const cameraInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const pickFile = (file) => {
    if (!file) return;
    setNewFile(file);
    setNewPreview(file.type.startsWith('image/') ? URL.createObjectURL(file) : null);
  };
  const removeAttachment = () => {
    setNewFile(null);
    setNewPreview(null);
    set('receiptUrl',''); set('receiptPath',''); set('receiptName',''); set('receiptType','');
  };

  const filteredCats = CATEGORIES.filter(c => {
    if(form.txType==='income')   return c.type==='income';
    if(form.txType==='transfer') return c.type==='transfer';
    if(form.txType==='savings')  return c.type==='savings';
    return c.type==='expense';
  });

  const handleSave = async () => {
    if (!form.description || !form.amount) return;
    let payload = { ...form, amount: Number(form.amount) };
    if (newFile) {
      setUploading(true);
      try {
        const oldPath = tx?.receiptPath;
        const uploaded = await uploadReceipt(newFile);
        payload = { ...payload, receiptUrl: uploaded.url, receiptPath: uploaded.path, receiptName: uploaded.name, receiptType: uploaded.type };
        if (oldPath && oldPath !== uploaded.path) deleteReceipt(oldPath);
      } catch (e) {
        setUploading(false);
        window.alert(t('transactions.uploadError') + ' ' + (e.message || e));
        return;
      }
      setUploading(false);
    } else if (tx && tx.receiptPath && !form.receiptPath) {
      // L'utilisateur a retire la piece jointe existante.
      deleteReceipt(tx.receiptPath);
    }
    onSave(payload);
  };

  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{maxWidth:560}}>
        <div className="modal-hd">
          <div className="modal-ttl"><ArrowLeftRight size={18} style={{color:'var(--g1)'}}/>{tx?t('transactions.edit'):t('transactions.add')}</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        <div className="type-grid" style={{marginBottom:20}}>
          {Object.keys(TYPE_ICON).map(id=>{
            const Icon = TYPE_ICON[id];
            return (
              <button key={id} className={`type-btn ${form.txType===id?TYPE_CLS[id]:''}`}
                onClick={()=>{set('txType',id);set('category',CATEGORIES.find(c=>c.type===id)?.id||'');}}>
                <Icon size={16}/>{t(`txType.${id}`)}
              </button>
            );
          })}
        </div>

        <div className="fgrid">
          <div className="frow">
            <div className="fg">
              <label className="fl">{t('transactions.date')} *</label>
              <input className="fi" type="date" value={form.date} onChange={e=>set('date',e.target.value)}/>
            </div>
            <div className="fg">
              <label className="fl">{t('transactions.category')}</label>
              <select className="fs" value={form.category} onChange={e=>set('category',e.target.value)}>
                {filteredCats.map(c=><option key={c.id} value={c.id}>{tId('categories',c.id,c.label)}</option>)}
              </select>
            </div>
          </div>

          <div className="fg">
            <label className="fl">{t('transactions.description')} *</label>
            <input className="fi" value={form.description} onChange={e=>set('description',e.target.value)} placeholder={t('transactions.descPh')}/>
          </div>

          <div className="frow">
            <div className="fg">
              <label className="fl">{t('transactions.amount')} *</label>
              <input className="fi" type="number" value={form.amount} onChange={e=>set('amount',e.target.value)} placeholder="0"/>
            </div>
            <div className="fg">
              <label className="fl">{t('transactions.currency')}</label>
              <select className="fs" value={form.currency} onChange={e=>set('currency',e.target.value)}>
                <option value="HTG">HTG</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          {form.txType==='transfer' ? (
            <div className="frow">
              <div className="fg">
                <label className="fl">{t('transactions.sourceAcc')}</label>
                <select className="fs" value={form.debitAccount} onChange={e=>set('debitAccount',e.target.value)}>
                  <option value="">{t('transactions.select')}</option>
                  {accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div className="fg">
                <label className="fl">{t('transactions.destAcc')}</label>
                <select className="fs" value={form.creditAccount} onChange={e=>set('creditAccount',e.target.value)}>
                  <option value="">{t('transactions.select')}</option>
                  {accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            </div>
          ) : (
            <div className="fg">
              <label className="fl">{form.txType==='income'?t('transactions.creditedTo'):t('transactions.debitedFrom')}</label>
              <select className="fs"
                value={form.txType==='income'?form.creditAccount:form.debitAccount}
                onChange={e=>form.txType==='income'?set('creditAccount',e.target.value):set('debitAccount',e.target.value)}>
                <option value="">{t('transactions.selectAcc')}</option>
                {accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          )}

          <div className="frow">
            <div className="fg">
              <label className="fl">{t('transactions.status')}</label>
              <select className="fs" value={form.status} onChange={e=>set('status',e.target.value)}>
                <option value="confirmed">{t('status.confirmed')}</option>
                <option value="pending">{t('status.pending')}</option>
                <option value="cancelled">{t('status.cancelled')}</option>
              </select>
            </div>
            <div className="fg">
              <label className="fl">{t('transactions.beneficiary')}</label>
              <input className="fi" value={form.beneficiary||''} onChange={e=>set('beneficiary',e.target.value)} placeholder={t('transactions.optional')}/>
            </div>
          </div>

          <div className="fg">
            <label className="fl">{t('transactions.receipt')}</label>

            {!newFile && !form.receiptUrl && (
              <div className="flex g8">
                <button type="button" className="btn btn-ghost btn-sm" onClick={()=>cameraInputRef.current?.click()}>
                  <Camera size={13}/> {t('transactions.takePhoto')}
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={()=>fileInputRef.current?.click()}>
                  <Paperclip size={13}/> {t('transactions.chooseFile')}
                </button>
              </div>
            )}

            {/* Input dedie camera : capture="environment" ouvre directement l'appareil photo sur mobile */}
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" style={{display:'none'}}
              onChange={e=>{pickFile(e.target.files?.[0]); e.target.value='';}}/>
            {/* Input dedie fichier : pas de capture, laisse choisir dans la galerie/gestionnaire, PDF inclus */}
            <input ref={fileInputRef} type="file" accept="image/*,application/pdf" style={{display:'none'}}
              onChange={e=>{pickFile(e.target.files?.[0]); e.target.value='';}}/>

            {(newFile || form.receiptUrl) && (
              <div className="flex g8" style={{alignItems:'center',marginTop:newFile||form.receiptUrl?8:0,padding:'8px 10px',background:'var(--bg3)',borderRadius:8,border:'1px solid var(--border)'}}>
                {newPreview ? (
                  <img src={newPreview} alt="" style={{width:36,height:36,objectFit:'cover',borderRadius:6}}/>
                ) : (
                  <div style={{width:36,height:36,borderRadius:6,background:'var(--g-bg)',color:'var(--g1)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <FileText size={16}/>
                  </div>
                )}
                <div style={{flex:1,minWidth:0,fontSize:12,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                  {newFile ? newFile.name : (
                    <a href={form.receiptUrl} target="_blank" rel="noreferrer" style={{color:'var(--g1)',fontWeight:600}}>{form.receiptName || t('transactions.viewReceipt')}</a>
                  )}
                </div>
                <button type="button" className="btn btn-ghost btn-sm" onClick={removeAttachment}><X size={12}/></button>
              </div>
            )}
          </div>

          <div className="flex g8" style={{justifyContent:'flex-end',marginTop:4}}>
            <button className="btn btn-ghost" onClick={onClose} disabled={uploading}>{t('transactions.cancel')}</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={uploading}>
              {uploading ? <><Loader2 size={14} className="spin"/> {t('transactions.uploading')}</> : (tx?t('transactions.save'):t('transactions.add_'))}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Transactions({ transactions, accounts, settings, onAdd, onUpdate, onDelete }) {
  const { t, tId, lang } = useLanguage();
  const [showModal, setShowModal] = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [search,    setSearch]    = useState('');
  const [filterType,  setFilterType]  = useState('all');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterAcc,   setFilterAcc]   = useState('');
  const [dispCur,     setDispCur]     = useState('HTG');
  const rate = Number(settings?.usdToHtg)||130;
  const fmtC = (v) => dispCur==='USD' ? fmt(v/rate,'USD') : fmt(v,'HTG');

  const accMap = useMemo(()=>Object.fromEntries(accounts.map(a=>[a.id,a.name])),[accounts]);

  const filtered = useMemo(()=>transactions.filter(t=>{
    if(filterType!=='all'&&t.txType!==filterType) return false;
    if(filterMonth){const d=new Date(t.date);const m=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;if(m!==filterMonth)return false;}
    if(filterAcc&&t.debitAccount!==filterAcc&&t.creditAccount!==filterAcc) return false;
    if(search){const s=search.toLowerCase();if(!t.description?.toLowerCase().includes(s)&&!t.beneficiary?.toLowerCase().includes(s)&&!getCat(t.category).label.toLowerCase().includes(s))return false;}
    return true;
  }),[transactions,filterType,filterMonth,filterAcc,search]);

  const confirmed = useMemo(()=>filtered.filter(t=>t.status==='confirmed'),[filtered]);
  const nativeSums = (txs) => ({
    HTG: txs.filter(t=>t.currency==='HTG').reduce((s,t)=>s+Number(t.amount),0),
    USD: txs.filter(t=>t.currency==='USD').reduce((s,t)=>s+Number(t.amount),0),
  });
  const incomeTx  = useMemo(()=>confirmed.filter(t=>t.txType==='income'),[confirmed]);
  const expenseTx = useMemo(()=>confirmed.filter(t=>t.txType==='expense'),[confirmed]);
  const totals = useMemo(()=>({
    income:  incomeTx.reduce((s,t)=>s+toHTG(Number(t.amount),t.currency,rate),0),
    expense: expenseTx.reduce((s,t)=>s+toHTG(Number(t.amount),t.currency,rate),0),
  }),[incomeTx,expenseTx,rate]);
  const nativeIncome  = useMemo(()=>nativeSums(incomeTx),[incomeTx]);
  const nativeExpense = useMemo(()=>nativeSums(expenseTx),[expenseTx]);
  const nativeNet = { HTG: nativeIncome.HTG-nativeExpense.HTG, USD: nativeIncome.USD-nativeExpense.USD };

  const handleSave = (data)=>{ editing?onUpdate(editing.id,data):onAdd(data); setShowModal(false);setEditing(null); };
  const fmtDate = d=>{if(!d)return'';const dt=new Date(d);return dt.toLocaleDateString(lang==='en'?'en-US':'fr-FR',{day:'2-digit',month:'short',year:'numeric'});};

  return (
    <div>
      <div className="ph">
        <div>
          <div className="pt">{t('transactions.title')}</div>
          <div className="ps">{filtered.length} {t('dashboard.transactions')}</div>
        </div>
        <div className="flex g8">
          <button className="lang-toggle" onClick={()=>setDispCur(c=>c==='HTG'?'USD':'HTG')} title="HTG / USD">
            {dispCur}
          </button>
          <button className="btn btn-primary" onClick={()=>{setEditing(null);setShowModal(true);}}>
            <Plus size={15}/> {t('transactions.new')}
          </button>
        </div>
      </div>

      <div className="kpi-grid mb16">
        <div className="kpi">
          <div className="kpi-accent green"><ArrowDownCircle size={18}/></div>
          <div className="kpi-lbl">{t('transactions.income')}</div>
          <div className="kpi-val green">{fmtC(totals.income)}</div>
          <div className="kpi-sub">{fmtHTG(nativeIncome.HTG)} · {fmt(nativeIncome.USD,'USD')}</div>
        </div>
        <div className="kpi">
          <div className="kpi-accent" style={{background:'var(--red-bg)',color:'var(--red)'}}><ArrowUpCircle size={18}/></div>
          <div className="kpi-lbl">{t('transactions.expense')}</div>
          <div className="kpi-val red">{fmtC(totals.expense)}</div>
          <div className="kpi-sub">{fmtHTG(nativeExpense.HTG)} · {fmt(nativeExpense.USD,'USD')}</div>
        </div>
        <div className={`kpi`}>
          <div className={`kpi-accent ${totals.income-totals.expense>=0?'teal':''}`} style={totals.income-totals.expense<0?{background:'var(--red-bg)',color:'var(--red)'}:{}}><TrendingUp size={18}/></div>
          <div className="kpi-lbl">{t('transactions.net')}</div>
          <div className={`kpi-val ${totals.income-totals.expense>=0?'teal':'red'}`}>{fmtC(totals.income-totals.expense)}</div>
          <div className="kpi-sub">{fmtHTG(nativeNet.HTG)} · {fmt(nativeNet.USD,'USD')}</div>
        </div>
      </div>

      <div className="card mb16" style={{padding:14}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr auto auto auto auto',gap:10,alignItems:'center'}}>
          <div style={{position:'relative'}}>
            <Search size={14} style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'var(--text3)'}}/>
            <input className="fi" placeholder={t('transactions.search')} value={search} onChange={e=>setSearch(e.target.value)} style={{paddingLeft:32}}/>
          </div>
          <select className="fs" value={filterType} onChange={e=>setFilterType(e.target.value)} style={{width:140}}>
            <option value="all">{t('transactions.allTypes')}</option>
            <option value="income">{t('transactions.income')}</option>
            <option value="expense">{t('transactions.expense')}</option>
            <option value="transfer">{t('txType.transfer')}</option>
            <option value="savings">{t('txType.savings')}</option>
          </select>
          <input className="fi" type="month" value={filterMonth} onChange={e=>setFilterMonth(e.target.value)} style={{width:150}}/>
          <select className="fs" value={filterAcc} onChange={e=>setFilterAcc(e.target.value)} style={{width:160}}>
            <option value="">{t('transactions.allAccounts')}</option>
            {accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          {(search||filterType!=='all'||filterMonth||filterAcc)&&(
            <button className="btn btn-ghost btn-sm" onClick={()=>{setSearch('');setFilterType('all');setFilterMonth('');setFilterAcc('');}}>{t('transactions.reset')}</button>
          )}
        </div>
      </div>

      <div className="card" style={{padding:0}}>
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>{t('transactions.col_date')}</th><th>{t('transactions.col_desc')}</th><th>{t('transactions.col_cat')}</th>
                <th>{t('transactions.col_acc')}</th><th style={{textAlign:'right'}}>{t('transactions.col_amount')}</th>
                <th>{t('transactions.col_status')}</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length===0
                ? <tr><td colSpan={7} style={{textAlign:'center',padding:'40px',color:'var(--text3)'}}>{t('transactions.noneFound')}</td></tr>
                : filtered.map(tx=>{
                    const catLabel=tId('categories',tx.category,getCat(tx.category).label);
                    const isIn=tx.txType==='income';
                    const StatusIcon=STATUS_ICON[tx.status]||STATUS_ICON.confirmed;
                    const accName=accMap[tx.txType==='income'?tx.creditAccount:tx.debitAccount]||'—';
                    const amtHTG=toHTG(Number(tx.amount),tx.currency,rate);
                    return (
                      <tr key={tx.id}>
                        <td style={{color:'var(--text2)',fontSize:12,whiteSpace:'nowrap'}}>{fmtDate(tx.date)}</td>
                        <td>
                          <div className="flex g8" style={{alignItems:'center'}}>
                            <span style={{fontWeight:600,fontSize:13}}>{tx.description}</span>
                            {tx.receiptUrl && (
                              <a href={tx.receiptUrl} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()}
                                title={tx.receiptName||t('transactions.viewReceipt')} style={{color:'var(--g1)',display:'inline-flex'}}>
                                <Paperclip size={12}/>
                              </a>
                            )}
                          </div>
                          {tx.beneficiary&&<div style={{fontSize:11,color:'var(--text3)'}}>{tx.beneficiary}</div>}
                        </td>
                        <td><span style={{fontSize:12,color:'var(--text2)',fontWeight:500}}>{catLabel}</span></td>
                        <td style={{fontSize:12,color:'var(--text2)'}}>{accName}</td>
                        <td className={`tr ${isIn?'tx-in':tx.txType==='transfer'?'tx-tr':'tx-out'}`} style={{fontWeight:700,fontSize:13}}>
                          {isIn?'+':tx.txType==='transfer'?'':'-'}{fmtHTG(amtHTG)}
                          {tx.currency==='USD'&&<div style={{fontSize:10,fontWeight:500,color:'var(--text3)'}}>{fmt(Number(tx.amount),'USD')}</div>}
                        </td>
                        <td><span className={`badge ${STATUS_CLS[tx.status]||STATUS_CLS.confirmed}`}>{t(`status.${tx.status||'confirmed'}`)}</span></td>
                        <td>
                          <div className="flex g8">
                            <button className="btn btn-ghost btn-sm" onClick={()=>{setEditing(tx);setShowModal(true);}}><Pencil size={12}/></button>
                            <button className="btn btn-danger btn-sm" onClick={()=>{if(window.confirm(t('transactions.deleteConfirm')))onDelete(tx.id);}}><Trash2 size={12}/></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
              }
            </tbody>
          </table>
        </div>
      </div>

      {showModal&&<TxModal tx={editing} accounts={accounts} onSave={handleSave} onClose={()=>{setShowModal(false);setEditing(null);}}/>}
    </div>
  );
}
function TrendingUp({size}){return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>}
