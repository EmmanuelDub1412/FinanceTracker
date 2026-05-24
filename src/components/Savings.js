import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Target, Plus, Pencil, Trash2, PlusCircle, TrendingUp, Calendar, Home, Plane, GraduationCap, Car, Heart, Diamond, Palmtree, Briefcase, Smartphone, Dumbbell, Music, Building, Gift } from 'lucide-react';
import { fmtHTG, fmt, compoundSavings } from '../utils/finance';

const GOAL_TYPES = [
  { id:'savings', Icon:Building,      label:'Épargne générale' },
  { id:'home',    Icon:Home,          label:'Logement'         },
  { id:'travel',  Icon:Plane,         label:'Voyage'           },
  { id:'edu',     Icon:GraduationCap, label:'Éducation'        },
  { id:'car',     Icon:Car,           label:'Véhicule'         },
  { id:'health',  Icon:Heart,         label:'Santé'            },
  { id:'wedding', Icon:Diamond,       label:'Mariage'          },
  { id:'leisure', Icon:Palmtree,      label:'Loisirs'          },
  { id:'biz',     Icon:Briefcase,     label:'Affaires'         },
  { id:'tech',    Icon:Smartphone,    label:'Technologie'      },
  { id:'sport',   Icon:Dumbbell,      label:'Sport'            },
  { id:'music',   Icon:Music,         label:'Musique'          },
  { id:'gift',    Icon:Gift,          label:'Cadeau'           },
];

function GoalIcon({ type, size=20, ...rest }) {
  const found = GOAL_TYPES.find(g=>g.id===type)||GOAL_TYPES[0];
  const { Icon } = found;
  return <Icon size={size} {...rest}/>;
}

function SavingsModal({ goal, onSave, onClose }) {
  const [form, setForm] = useState(goal || {
    name:'', targetAmount:'', currentAmount:'0',
    currency:'HTG', targetDate:'', monthlyContrib:'0',
    annualRate:'5', notes:'', iconType:'savings',
  });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-hd">
          <div className="modal-ttl"><Target size={18} style={{color:'var(--g1)'}}/>{goal?'Modifier l\'objectif':'Nouvel Objectif d\'Épargne'}</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="fgrid">
          <div className="fg">
            <label className="fl">Type d'objectif</label>
            <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:6}}>
              {GOAL_TYPES.map(({id,Icon,label})=>(
                <button key={id} title={label} onClick={()=>set('iconType',id)} style={{
                  width:'100%',aspectRatio:'1',borderRadius:8,
                  border:`2px solid ${form.iconType===id?'var(--g1)':'var(--border)'}`,
                  background:form.iconType===id?'var(--g-bg)':'var(--bg3)',
                  color:form.iconType===id?'var(--g1)':'var(--text3)',
                  cursor:'pointer',transition:'all .1s',
                  display:'flex',alignItems:'center',justifyContent:'center',
                }}>
                  <Icon size={16}/>
                </button>
              ))}
            </div>
          </div>
          <div className="fg">
            <label className="fl">Nom de l'objectif *</label>
            <input className="fi" value={form.name} onChange={e=>set('name',e.target.value)} placeholder="ex. Fonds d'urgence"/>
          </div>
          <div className="frow">
            <div className="fg"><label className="fl">Objectif cible *</label><input className="fi" type="number" value={form.targetAmount} onChange={e=>set('targetAmount',e.target.value)} placeholder="0"/></div>
            <div className="fg"><label className="fl">Devise</label><select className="fs" value={form.currency} onChange={e=>set('currency',e.target.value)}><option value="HTG">HTG</option><option value="USD">USD</option></select></div>
          </div>
          <div className="frow">
            <div className="fg"><label className="fl">Montant actuel</label><input className="fi" type="number" value={form.currentAmount} onChange={e=>set('currentAmount',e.target.value)} placeholder="0"/></div>
            <div className="fg"><label className="fl">Contribution mensuelle</label><input className="fi" type="number" value={form.monthlyContrib} onChange={e=>set('monthlyContrib',e.target.value)} placeholder="0"/></div>
          </div>
          <div className="frow">
            <div className="fg"><label className="fl">Date cible</label><input className="fi" type="date" value={form.targetDate} onChange={e=>set('targetDate',e.target.value)}/></div>
            <div className="fg"><label className="fl">Taux annuel (%)</label><input className="fi" type="number" value={form.annualRate} onChange={e=>set('annualRate',e.target.value)}/></div>
          </div>
          <div className="flex g8" style={{justifyContent:'flex-end'}}>
            <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
            <button className="btn btn-primary" onClick={()=>{if(form.name&&form.targetAmount)onSave({...form,targetAmount:Number(form.targetAmount),currentAmount:Number(form.currentAmount)||0,monthlyContrib:Number(form.monthlyContrib)||0});}}>
              {goal?'Enregistrer':'Créer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DepositModal({ goal, onSave, onClose }) {
  const [amount, setAmount] = useState('');
  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{maxWidth:380}}>
        <div className="modal-hd">
          <div className="modal-ttl"><PlusCircle size={18} style={{color:'var(--g1)'}}/> Ajouter des fonds — {goal.name}</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="fgrid">
          <div className="fg"><label className="fl">Montant ({goal.currency})</label><input className="fi" type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0" autoFocus/></div>
          <div className="flex g8" style={{justifyContent:'flex-end'}}>
            <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
            <button className="btn btn-primary" onClick={()=>{if(amount){onSave(Number(amount));onClose();}}}>Confirmer</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Savings({ savings, onAdd, onUpdate, onDelete }) {
  const [showModal,  setShowModal]  = useState(false);
  const [editing,    setEditing]    = useState(null);
  const [depositing, setDepositing] = useState(null);
  const [selected,   setSelected]   = useState(null);

  const enriched = useMemo(()=>savings.map(g=>{
    const pct = Math.min(100,((Number(g.currentAmount)||0)/(Number(g.targetAmount)||1))*100);
    const remaining = Math.max(0,(Number(g.targetAmount)||0)-(Number(g.currentAmount)||0));
    const proj = compoundSavings(Number(g.currentAmount)||0,Number(g.monthlyContrib)||0,Number(g.annualRate)||0,36);
    const reachMonth = proj.findIndex(p=>p.balance>=(Number(g.targetAmount)||0));
    return {...g,pct,remaining,proj,reachMonth};
  }),[savings]);

  const handleSave = (data)=>{ editing?onUpdate(editing.id,data):onAdd(data); setShowModal(false);setEditing(null); };
  const selectedGoal = enriched.find(g=>g.id===selected);

  const TT = ({active,payload})=>{
    if(!active||!payload?.length) return null;
    return <div className="ctt"><div>Mois {payload[0].payload.month}</div><div style={{color:'var(--g1)',fontWeight:700}}>{fmtHTG(payload[0].value)}</div></div>;
  };

  return (
    <div>
      <div className="ph">
        <div><div className="pt">Épargne & Objectifs</div><div className="ps">Définissez vos cibles et suivez votre progression</div></div>
        <button className="btn btn-primary" onClick={()=>{setEditing(null);setShowModal(true);}}><Plus size={15}/> Nouvel Objectif</button>
      </div>

      {savings.length===0 ? (
        <div className="empty">
          <div className="empty-ico"><Target size={48}/></div>
          <div className="empty-ttl">Aucun objectif créé</div>
          <div className="empty-txt" style={{marginBottom:16}}>Définissez vos cibles d'épargne et suivez votre progression</div>
          <button className="btn btn-primary" onClick={()=>setShowModal(true)}><Plus size={15}/> Créer un objectif</button>
        </div>
      ) : (
        <div className={selected?'two':''} style={!selected?{display:'grid',gap:14}:{}}>
          <div style={{display:'grid',gap:14}}>
            {enriched.map(g=>(
              <div key={g.id} className={`sv-card ${selected===g.id?'sel':''}`} onClick={()=>setSelected(selected===g.id?null:g.id)}>
                <div className="fb" style={{marginBottom:12}}>
                  <div className="flex g12">
                    <div style={{width:44,height:44,borderRadius:10,background:'var(--g-bg)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      <GoalIcon type={g.iconType||'savings'} size={22} color="var(--g1)"/>
                    </div>
                    <div>
                      <div style={{fontWeight:700,fontSize:14}}>{g.name}</div>
                      <div style={{fontSize:12,color:'var(--text2)',marginTop:1}}>Objectif : {fmt(Number(g.targetAmount)||0,g.currency)}</div>
                    </div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:'1.2rem',fontWeight:800,color:g.pct>=100?'var(--g1)':'var(--text)'}}>{Math.round(g.pct)}%</div>
                    <div style={{fontSize:11,color:'var(--text3)'}}>{g.pct>=100?'Objectif atteint ✓':`${fmt(g.remaining,g.currency)} restant`}</div>
                  </div>
                </div>
                <div className="prog-track" style={{height:6,marginBottom:8}}>
                  <div className={`prog-fill ${g.pct>=100?'ok':g.pct>=50?'warn':'danger'}`} style={{width:`${g.pct}%`}}/>
                </div>
                <div className="fb" style={{fontSize:12,color:'var(--text2)'}}>
                  <span>{fmt(Number(g.currentAmount)||0,g.currency)} épargné</span>
                  {Number(g.monthlyContrib)>0&&<span>+{fmt(Number(g.monthlyContrib),g.currency)}/mois</span>}
                  {g.targetDate&&<span style={{display:'flex',alignItems:'center',gap:3}}><Calendar size={11}/>{new Date(g.targetDate).toLocaleDateString('fr-FR',{month:'short',year:'numeric'})}</span>}
                </div>
                {g.reachMonth>=0&&g.pct<100&&(
                  <div style={{marginTop:10,padding:'7px 12px',background:'var(--g-bg)',borderRadius:7,fontSize:12,color:'var(--g1)',fontWeight:600,border:'1px solid var(--g-light)',display:'flex',alignItems:'center',gap:6}}>
                    <TrendingUp size={13}/> Objectif atteint dans ~{g.reachMonth+1} mois avec intérêts
                  </div>
                )}
                <div className="flex g8 mt12" onClick={e=>e.stopPropagation()}>
                  <button className="btn btn-primary btn-sm" onClick={()=>setDepositing(g)}><Plus size={12}/> Ajouter</button>
                  <button className="btn btn-ghost btn-sm" onClick={()=>{setEditing(g);setShowModal(true);}}><Pencil size={12}/> Modifier</button>
                  <button className="btn btn-danger btn-sm" onClick={()=>{if(window.confirm('Supprimer cet objectif ?'))onDelete(g.id);}}><Trash2 size={12}/></button>
                </div>
              </div>
            ))}
          </div>

          {selectedGoal&&(
            <div>
              <div className="card" style={{position:'sticky',top:16}}>
                <div className="card-hd">
                  <div className="card-title"><TrendingUp size={16} style={{color:'var(--g1)'}}/> Projection — {selectedGoal.name}</div>
                  <button className="btn btn-ghost btn-sm" onClick={()=>setSelected(null)}>✕</button>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
                  {[
                    {label:'Épargné',value:fmt(Number(selectedGoal.currentAmount)||0,selectedGoal.currency),color:'var(--text)'},
                    {label:'Objectif',value:fmt(Number(selectedGoal.targetAmount)||0,selectedGoal.currency),color:'var(--g1)'},
                    {label:'Restant',value:fmt(selectedGoal.remaining,selectedGoal.currency),color:'var(--red)'},
                    {label:'Taux',value:`${selectedGoal.annualRate||0}%/an`,color:'var(--teal)'},
                  ].map(({label,value,color})=>(
                    <div key={label} style={{background:'var(--bg3)',borderRadius:8,padding:'10px 12px',border:'1px solid var(--border)'}}>
                      <div style={{fontSize:10,color:'var(--text3)',fontWeight:700,textTransform:'uppercase',letterSpacing:.5,marginBottom:3}}>{label}</div>
                      <div style={{fontWeight:700,color,fontSize:'1rem'}}>{value}</div>
                    </div>
                  ))}
                </div>
                <div className="sl">Projection sur 36 mois</div>
                <div style={{height:160}}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={selectedGoal.proj} margin={{top:4,right:4,left:0,bottom:0}}>
                      <defs><linearGradient id="gs" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00A86B" stopOpacity={.2}/><stop offset="95%" stopColor="#00A86B" stopOpacity={0}/></linearGradient></defs>
                      <XAxis dataKey="month" stroke="#8A97A8" fontSize={10} tickLine={false} axisLine={false} interval={5}/>
                      <YAxis stroke="#8A97A8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v=>`${Math.round(v/1000)}k`}/>
                      <Tooltip content={<TT/>}/>
                      <Area type="monotone" dataKey="balance" stroke="#00A86B" strokeWidth={2} fill="url(#gs)"/>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                {selectedGoal.reachMonth>=0&&(
                  <div style={{marginTop:12,padding:'10px 14px',background:'var(--g-bg)',borderRadius:8,fontSize:13,color:'var(--g1)',fontWeight:600,border:'1px solid var(--g-light)'}}>
                    Avec {fmt(Number(selectedGoal.monthlyContrib)||0,selectedGoal.currency)}/mois à {selectedGoal.annualRate||0}%, objectif atteint en {selectedGoal.reachMonth+1} mois.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {showModal&&<SavingsModal goal={editing} onSave={handleSave} onClose={()=>{setShowModal(false);setEditing(null);}}/>}
      {depositing&&<DepositModal goal={depositing} onSave={amt=>onUpdate(depositing.id,{currentAmount:(Number(depositing.currentAmount)||0)+amt})} onClose={()=>setDepositing(null)}/>}
    </div>
  );
}
