import React, { useState, useMemo } from 'react';
import { ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, PiggyBank, Plus, Pencil, Trash2, Search, Filter, CheckCircle, Clock, XCircle } from 'lucide-react';
import { fmtHTG, fmt, toHTG, today, CATEGORIES, getCat } from '../utils/finance';

const TYPE_CONFIG = {
  income:   { label:'Revenu',    Icon:ArrowDownCircle, cls:'on-income',   color:'var(--g1)' },
  expense:  { label:'Dépense',   Icon:ArrowUpCircle,   cls:'on-expense',  color:'var(--red)' },
  transfer: { label:'Transfert', Icon:ArrowLeftRight,  cls:'on-transfer', color:'var(--teal)' },
  savings:  { label:'Épargne',   Icon:PiggyBank,       cls:'on-savings',  color:'var(--purple)' },
};
const STATUS_CONFIG = {
  confirmed: { label:'Confirmé',   cls:'bg-green', Icon:CheckCircle },
  pending:   { label:'En attente', cls:'bg-amber',  Icon:Clock },
  cancelled: { label:'Annulé',     cls:'bg-red',    Icon:XCircle },
};

function TxModal({ tx, accounts, onSave, onClose }) {
  const [form, setForm] = useState(tx || {
    date:today(), description:'', category:'DEP-ALI', txType:'expense',
    debitAccount:'', creditAccount:'', amount:'', currency:'HTG',
    status:'confirmed', beneficiary:'', notes:'',
  });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const filteredCats = CATEGORIES.filter(c => {
    if(form.txType==='income')   return c.type==='income';
    if(form.txType==='transfer') return c.type==='transfer';
    if(form.txType==='savings')  return c.type==='savings';
    return c.type==='expense';
  });

  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{maxWidth:560}}>
        <div className="modal-hd">
          <div className="modal-ttl"><ArrowLeftRight size={18} style={{color:'var(--g1)'}}/>{tx?'Modifier la transaction':'Nouvelle Transaction'}</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        <div className="type-grid" style={{marginBottom:20}}>
          {Object.entries(TYPE_CONFIG).map(([id,{label,Icon,cls}])=>(
            <button key={id} className={`type-btn ${form.txType===id?cls:''}`}
              onClick={()=>{set('txType',id);set('category',CATEGORIES.find(c=>c.type===id)?.id||'');}}>
              <Icon size={16}/>{label}
            </button>
          ))}
        </div>

        <div className="fgrid">
          <div className="frow">
            <div className="fg">
              <label className="fl">Date *</label>
              <input className="fi" type="date" value={form.date} onChange={e=>set('date',e.target.value)}/>
            </div>
            <div className="fg">
              <label className="fl">Catégorie</label>
              <select className="fs" value={form.category} onChange={e=>set('category',e.target.value)}>
                {filteredCats.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
          </div>

          <div className="fg">
            <label className="fl">Description *</label>
            <input className="fi" value={form.description} onChange={e=>set('description',e.target.value)} placeholder="Description de la transaction"/>
          </div>

          <div className="frow">
            <div className="fg">
              <label className="fl">Montant *</label>
              <input className="fi" type="number" value={form.amount} onChange={e=>set('amount',e.target.value)} placeholder="0"/>
            </div>
            <div className="fg">
              <label className="fl">Devise</label>
              <select className="fs" value={form.currency} onChange={e=>set('currency',e.target.value)}>
                <option value="HTG">HTG</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          {form.txType==='transfer' ? (
            <div className="frow">
              <div className="fg">
                <label className="fl">Compte Source</label>
                <select className="fs" value={form.debitAccount} onChange={e=>set('debitAccount',e.target.value)}>
                  <option value="">Sélectionner</option>
                  {accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div className="fg">
                <label className="fl">Compte Destination</label>
                <select className="fs" value={form.creditAccount} onChange={e=>set('creditAccount',e.target.value)}>
                  <option value="">Sélectionner</option>
                  {accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            </div>
          ) : (
            <div className="fg">
              <label className="fl">{form.txType==='income'?'Crédité sur':'Débité de'}</label>
              <select className="fs"
                value={form.txType==='income'?form.creditAccount:form.debitAccount}
                onChange={e=>form.txType==='income'?set('creditAccount',e.target.value):set('debitAccount',e.target.value)}>
                <option value="">Sélectionner un compte</option>
                {accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          )}

          <div className="frow">
            <div className="fg">
              <label className="fl">Statut</label>
              <select className="fs" value={form.status} onChange={e=>set('status',e.target.value)}>
                <option value="confirmed">Confirmé</option>
                <option value="pending">En attente</option>
                <option value="cancelled">Annulé</option>
              </select>
            </div>
            <div className="fg">
              <label className="fl">Bénéficiaire / Tiers</label>
              <input className="fi" value={form.beneficiary||''} onChange={e=>set('beneficiary',e.target.value)} placeholder="Optionnel"/>
            </div>
          </div>

          <div className="flex g8" style={{justifyContent:'flex-end',marginTop:4}}>
            <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
            <button className="btn btn-primary" onClick={()=>{if(form.description&&form.amount)onSave({...form,amount:Number(form.amount)});}}>
              {tx?'Enregistrer':'Ajouter'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Transactions({ transactions, accounts, settings, onAdd, onUpdate, onDelete }) {
  const [showModal, setShowModal] = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [search,    setSearch]    = useState('');
  const [filterType,  setFilterType]  = useState('all');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterAcc,   setFilterAcc]   = useState('');
  const rate = Number(settings?.usdToHtg)||130;

  const accMap = useMemo(()=>Object.fromEntries(accounts.map(a=>[a.id,a.name])),[accounts]);

  const filtered = useMemo(()=>transactions.filter(t=>{
    if(filterType!=='all'&&t.txType!==filterType) return false;
    if(filterMonth){const d=new Date(t.date);const m=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;if(m!==filterMonth)return false;}
    if(filterAcc&&t.debitAccount!==filterAcc&&t.creditAccount!==filterAcc) return false;
    if(search){const s=search.toLowerCase();if(!t.description?.toLowerCase().includes(s)&&!t.beneficiary?.toLowerCase().includes(s)&&!getCat(t.category).label.toLowerCase().includes(s))return false;}
    return true;
  }),[transactions,filterType,filterMonth,filterAcc,search]);

  const totals = useMemo(()=>({
    income:  filtered.filter(t=>t.txType==='income'&&t.status==='confirmed').reduce((s,t)=>s+toHTG(Number(t.amount),t.currency,rate),0),
    expense: filtered.filter(t=>t.txType==='expense'&&t.status==='confirmed').reduce((s,t)=>s+toHTG(Number(t.amount),t.currency,rate),0),
  }),[filtered,rate]);

  const handleSave = (data)=>{ editing?onUpdate(editing.id,data):onAdd(data); setShowModal(false);setEditing(null); };
  const fmtDate = d=>{if(!d)return'';const dt=new Date(d);return dt.toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'});};

  return (
    <div>
      <div className="ph">
        <div>
          <div className="pt">Transactions</div>
          <div className="ps">{filtered.length} transaction{filtered.length>1?'s':''}</div>
        </div>
        <button className="btn btn-primary" onClick={()=>{setEditing(null);setShowModal(true);}}>
          <Plus size={15}/> Nouvelle Transaction
        </button>
      </div>

      <div className="kpi-grid mb16">
        <div className="kpi"><div className="kpi-accent green"><ArrowDownCircle size={18}/></div><div className="kpi-lbl">Revenus</div><div className="kpi-val green">{fmtHTG(totals.income)}</div></div>
        <div className="kpi"><div className="kpi-accent" style={{background:'var(--red-bg)',color:'var(--red)'}}><ArrowUpCircle size={18}/></div><div className="kpi-lbl">Dépenses</div><div className="kpi-val red">{fmtHTG(totals.expense)}</div></div>
        <div className={`kpi`}><div className={`kpi-accent ${totals.income-totals.expense>=0?'teal':''}`} style={totals.income-totals.expense<0?{background:'var(--red-bg)',color:'var(--red)'}:{}}><TrendingUp size={18}/></div><div className="kpi-lbl">Net</div><div className={`kpi-val ${totals.income-totals.expense>=0?'teal':'red'}`}>{fmtHTG(totals.income-totals.expense)}</div></div>
      </div>

      <div className="card mb16" style={{padding:14}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr auto auto auto auto',gap:10,alignItems:'center'}}>
          <div style={{position:'relative'}}>
            <Search size={14} style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'var(--text3)'}}/>
            <input className="fi" placeholder="Rechercher..." value={search} onChange={e=>setSearch(e.target.value)} style={{paddingLeft:32}}/>
          </div>
          <select className="fs" value={filterType} onChange={e=>setFilterType(e.target.value)} style={{width:140}}>
            <option value="all">Tous les types</option>
            <option value="income">Revenus</option>
            <option value="expense">Dépenses</option>
            <option value="transfer">Transferts</option>
            <option value="savings">Épargne</option>
          </select>
          <input className="fi" type="month" value={filterMonth} onChange={e=>setFilterMonth(e.target.value)} style={{width:150}}/>
          <select className="fs" value={filterAcc} onChange={e=>setFilterAcc(e.target.value)} style={{width:160}}>
            <option value="">Tous les comptes</option>
            {accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          {(search||filterType!=='all'||filterMonth||filterAcc)&&(
            <button className="btn btn-ghost btn-sm" onClick={()=>{setSearch('');setFilterType('all');setFilterMonth('');setFilterAcc('');}}>Réinitialiser</button>
          )}
        </div>
      </div>

      <div className="card" style={{padding:0}}>
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>Date</th><th>Description</th><th>Catégorie</th>
                <th>Compte</th><th style={{textAlign:'right'}}>Montant</th>
                <th>Statut</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length===0
                ? <tr><td colSpan={7} style={{textAlign:'center',padding:'40px',color:'var(--text3)'}}>Aucune transaction trouvée</td></tr>
                : filtered.map(tx=>{
                    const cat=getCat(tx.category);
                    const isIn=tx.txType==='income';
                    const sc=STATUS_CONFIG[tx.status]||STATUS_CONFIG.confirmed;
                    const accName=accMap[tx.txType==='income'?tx.creditAccount:tx.debitAccount]||'—';
                    const amtHTG=toHTG(Number(tx.amount),tx.currency,rate);
                    return (
                      <tr key={tx.id}>
                        <td style={{color:'var(--text2)',fontSize:12,whiteSpace:'nowrap'}}>{fmtDate(tx.date)}</td>
                        <td>
                          <div style={{fontWeight:600,fontSize:13}}>{tx.description}</div>
                          {tx.beneficiary&&<div style={{fontSize:11,color:'var(--text3)'}}>{tx.beneficiary}</div>}
                        </td>
                        <td><span style={{fontSize:12,color:'var(--text2)',fontWeight:500}}>{cat.label}</span></td>
                        <td style={{fontSize:12,color:'var(--text2)'}}>{accName}</td>
                        <td className={`tr ${isIn?'tx-in':tx.txType==='transfer'?'tx-tr':'tx-out'}`} style={{fontWeight:700,fontSize:13}}>
                          {isIn?'+':tx.txType==='transfer'?'':'-'}{fmtHTG(amtHTG)}
                          {tx.currency==='USD'&&<div style={{fontSize:10,fontWeight:500,color:'var(--text3)'}}>{fmt(Number(tx.amount),'USD')}</div>}
                        </td>
                        <td><span className={`badge ${sc.cls}`}>{sc.label}</span></td>
                        <td>
                          <div className="flex g8">
                            <button className="btn btn-ghost btn-sm" onClick={()=>{setEditing(tx);setShowModal(true);}}><Pencil size={12}/></button>
                            <button className="btn btn-danger btn-sm" onClick={()=>{if(window.confirm('Supprimer ?'))onDelete(tx.id);}}><Trash2 size={12}/></button>
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
