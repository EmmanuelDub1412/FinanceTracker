import React, { useState, useMemo } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Calculator, TrendingDown, DollarSign, Calendar, Percent, ChevronDown, ChevronUp } from 'lucide-react';
import { fmtHTG, amortize } from '../utils/finance';

const PRESETS = [
  { label: 'Prêt Auto',       principal: 500000,  rate: 18, months: 60  },
  { label: 'Prêt Immobilier', principal: 2000000, rate: 14, months: 180 },
  { label: 'Prêt Personnel',  principal: 150000,  rate: 24, months: 24  },
  { label: 'Carte de Crédit', principal: 50000,   rate: 36, months: 12  },
];

export default function LoanSimulator() {
  const [p, setP] = useState({ principal: 500000, annualRate: 18, months: 60, currency: 'HTG' });
  const [showSchedule, setShowSchedule] = useState(false);
  const [compareMode, setCompareMode]   = useState(false);
  const [cp, setCp] = useState({ annualRate: 15, months: 48 });

  const set  = (k,v) => setP(x=>({...x,[k]:v}));
  const setc = (k,v) => setCp(x=>({...x,[k]:v}));

  const result  = useMemo(()=>amortize(Number(p.principal)||0, Number(p.annualRate)||0, Number(p.months)||1),[p]);
  const cresult = useMemo(()=>compareMode?amortize(Number(p.principal)||0, Number(cp.annualRate)||0, Number(cp.months)||1):null,[p,cp,compareMode]);

  const TT = ({active,payload,label})=>{
    if(!active||!payload?.length) return null;
    return <div className="ctt"><div style={{fontWeight:700,marginBottom:4}}>{label}</div>{payload.map(x=><div key={x.name} style={{color:x.color,marginTop:2}}>{x.name}: {fmtHTG(x.value)}</div>)}</div>;
  };

  const scheduleStep = Math.max(1, Math.floor(result.schedule.length/20));

  return (
    <div>
      <div className="ph">
        <div>
          <div className="pt">Simulateur de Prêt</div>
          <div className="ps">Calculez et comparez vos scénarios de financement</div>
        </div>
      </div>

      {/* Presets */}
      <div className="flex g8 mb24" style={{flexWrap:'wrap'}}>
        {PRESETS.map(pr=>(
          <button key={pr.label} className="btn btn-ghost btn-sm"
            onClick={()=>setP(x=>({...x,principal:pr.principal,annualRate:pr.rate,months:pr.months}))}>
            {pr.label}
          </button>
        ))}
      </div>

      <div className="two" style={{alignItems:'start'}}>
        {/* LEFT — Parameters */}
        <div style={{display:'grid',gap:16}}>
          <div className="card">
            <div className="card-hd">
              <div className="card-title"><Calculator size={16} style={{color:'var(--g1)'}}/> Paramètres du Prêt</div>
            </div>
            <div className="fgrid">
              <div className="frow">
                <div className="fg">
                  <label className="fl">Montant emprunté</label>
                  <input className="fi" type="number" value={p.principal} onChange={e=>set('principal',e.target.value)}/>
                </div>
                <div className="fg">
                  <label className="fl">Devise</label>
                  <select className="fs" value={p.currency} onChange={e=>set('currency',e.target.value)}>
                    <option value="HTG">HTG</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>

              <div className="fg">
                <label className="fl" style={{display:'flex',justifyContent:'space-between'}}>
                  <span>Taux d'intérêt annuel</span>
                  <span style={{color:'var(--g1)',fontWeight:700}}>{p.annualRate}%</span>
                </label>
                <input type="range" min="1" max="60" step="0.5" value={p.annualRate} onChange={e=>set('annualRate',e.target.value)}/>
                <div className="flex" style={{justifyContent:'space-between',fontSize:10,color:'var(--text3)',marginTop:2}}>
                  <span>1%</span><span>30%</span><span>60%</span>
                </div>
              </div>

              <div className="fg">
                <label className="fl" style={{display:'flex',justifyContent:'space-between'}}>
                  <span>Durée</span>
                  <span style={{color:'var(--g1)',fontWeight:700}}>{p.months} mois ({(p.months/12).toFixed(1)} ans)</span>
                </label>
                <input type="range" min="3" max="360" step="1" value={p.months} onChange={e=>set('months',e.target.value)}/>
                <div className="flex" style={{justifyContent:'space-between',fontSize:10,color:'var(--text3)',marginTop:2}}>
                  <span>3 mois</span><span>5 ans</span><span>30 ans</span>
                </div>
              </div>
            </div>
          </div>

          {/* Compare */}
          <div className="card">
            <div className="card-hd">
              <div className="card-title"><TrendingDown size={16} style={{color:'var(--blue)'}}/> Scénario de comparaison</div>
              <button className="btn btn-ghost btn-sm" onClick={()=>setCompareMode(x=>!x)}>
                {compareMode ? 'Supprimer' : 'Ajouter'}
              </button>
            </div>
            {compareMode && (
              <div className="frow">
                <div className="fg">
                  <label className="fl">Taux B (%)</label>
                  <input className="fi" type="number" value={cp.annualRate} onChange={e=>setc('annualRate',e.target.value)}/>
                </div>
                <div className="fg">
                  <label className="fl">Durée B (mois)</label>
                  <input className="fi" type="number" value={cp.months} onChange={e=>setc('months',e.target.value)}/>
                </div>
              </div>
            )}
            {compareMode && cresult && (
              <div style={{marginTop:12,background:'var(--bg3)',borderRadius:8,padding:14,fontSize:13}}>
                <div className="fb mb8">
                  <span className="muted">Mensualité B</span>
                  <strong style={{color:'var(--blue)'}}>{fmtHTG(cresult.monthly)}</strong>
                </div>
                <div className="fb mb8">
                  <span className="muted">Total intérêts B</span>
                  <strong style={{color:'var(--blue)'}}>{fmtHTG(cresult.totalInterest)}</strong>
                </div>
                <div className="fb">
                  <span className="muted">Économie vs A</span>
                  <strong style={{color:result.totalInterest>cresult.totalInterest?'var(--g1)':'var(--red)'}}>
                    {fmtHTG(Math.abs(result.totalInterest-cresult.totalInterest))}
                    {result.totalInterest>cresult.totalInterest?' économisé':' surcoût'}
                  </strong>
                </div>
              </div>
            )}
            {!compareMode && <div style={{fontSize:13,color:'var(--text3)'}}>Comparez deux scénarios de taux ou de durée pour optimiser votre financement.</div>}
          </div>
        </div>

        {/* RIGHT — Results */}
        <div style={{display:'grid',gap:16}}>
          {/* KPI boxes */}
          <div className="sim-res">
            <div className="sim-box">
              <div className="sim-lbl">Mensualité</div>
              <div className="sim-val" style={{color:'var(--g1)'}}>{fmtHTG(result.monthly)}</div>
            </div>
            <div className="sim-box">
              <div className="sim-lbl">Total à rembourser</div>
              <div className="sim-val">{fmtHTG(result.totalPayment)}</div>
            </div>
            <div className="sim-box">
              <div className="sim-lbl">Total intérêts</div>
              <div className="sim-val" style={{color:'var(--red)'}}>{fmtHTG(result.totalInterest)}</div>
            </div>
          </div>

          {/* Capital vs intérêts bar */}
          <div className="card">
            <div className="card-hd"><div className="card-title">Répartition Capital / Intérêts</div></div>
            <div style={{display:'flex',height:12,borderRadius:6,overflow:'hidden',marginBottom:10}}>
              <div style={{background:'var(--g1)',flex:Number(p.principal)}}/>
              <div style={{background:'var(--red)',flex:result.totalInterest}}/>
            </div>
            <div className="flex g16" style={{fontSize:12}}>
              <span style={{display:'flex',alignItems:'center',gap:5}}><span style={{width:10,height:10,borderRadius:2,background:'var(--g1)',display:'inline-block'}}/> Capital : {Math.round(Number(p.principal)/result.totalPayment*100)}%</span>
              <span style={{display:'flex',alignItems:'center',gap:5}}><span style={{width:10,height:10,borderRadius:2,background:'var(--red)',display:'inline-block'}}/> Intérêts : {Math.round(result.totalInterest/result.totalPayment*100)}%</span>
            </div>
          </div>

          {/* Amortization curve */}
          <div className="card">
            <div className="card-hd"><div className="card-title">Évolution du capital restant</div></div>
            <div style={{height:160}}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={result.schedule.filter((_,i)=>i%scheduleStep===0)} margin={{top:4,right:4,left:0,bottom:0}}>
                  <defs><linearGradient id="gl" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00A86B" stopOpacity={.2}/><stop offset="95%" stopColor="#00A86B" stopOpacity={0}/></linearGradient></defs>
                  <XAxis dataKey="month" stroke="#8A97A8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v=>`M${v}`} interval="preserveStartEnd"/>
                  <YAxis stroke="#8A97A8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v=>`${Math.round(v/1000)}k`}/>
                  <Tooltip formatter={v=>fmtHTG(v)} labelFormatter={v=>`Mois ${v}`}/>
                  <Area type="monotone" dataKey="balance" name="Capital restant" stroke="#00A86B" strokeWidth={2} fill="url(#gl)"/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Principal vs interest per payment */}
          <div className="card">
            <div className="card-hd"><div className="card-title">Principal vs Intérêts par mensualité</div></div>
            <div style={{height:160}}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={result.schedule.filter((_,i)=>i%scheduleStep===0)} margin={{top:4,right:4,left:0,bottom:0}} barSize={6}>
                  <XAxis dataKey="month" stroke="#8A97A8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v=>`M${v}`} interval="preserveStartEnd"/>
                  <YAxis stroke="#8A97A8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v=>`${Math.round(v/1000)}k`}/>
                  <Tooltip content={<TT/>}/>
                  <Bar dataKey="principal" name="Principal" stackId="a" fill="#00A86B"/>
                  <Bar dataKey="interest"  name="Intérêts"  stackId="a" fill="#E53E3E" radius={[2,2,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Amortization table */}
      <div className="card mt24">
        <div className="card-hd">
          <div className="card-title"><Calendar size={16} style={{color:'var(--g1)'}}/> Tableau d'amortissement</div>
          <button className="btn btn-ghost btn-sm" onClick={()=>setShowSchedule(s=>!s)}>
            {showSchedule?<><ChevronUp size={14}/> Masquer</>:<><ChevronDown size={14}/> Afficher</>}
          </button>
        </div>
        {showSchedule && (
          <div className="tw" style={{maxHeight:380,overflowY:'auto'}}>
            <table>
              <thead>
                <tr>
                  <th>Mois</th>
                  <th style={{textAlign:'right'}}>Mensualité</th>
                  <th style={{textAlign:'right'}}>Principal</th>
                  <th style={{textAlign:'right'}}>Intérêts</th>
                  <th style={{textAlign:'right'}}>Capital Restant</th>
                </tr>
              </thead>
              <tbody>
                {result.schedule.map(row=>(
                  <tr key={row.month}>
                    <td style={{fontWeight:600}}>{row.month}</td>
                    <td className="tr" style={{fontWeight:600}}>{fmtHTG(row.payment)}</td>
                    <td className="tr gv">{fmtHTG(row.principal)}</td>
                    <td className="tr rv">{fmtHTG(row.interest)}</td>
                    <td className="tr">{fmtHTG(row.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
