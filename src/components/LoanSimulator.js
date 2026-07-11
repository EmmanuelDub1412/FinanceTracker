import React, { useState, useMemo } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Calculator, TrendingDown, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { fmtHTG, amortize } from '../utils/finance';
import { useLanguage } from '../i18n/LanguageContext';

export default function LoanSimulator() {
  const { t } = useLanguage();
  const PRESETS = [
    { key: 'preset_auto',     principal: 500000,  rate: 18, months: 60  },
    { key: 'preset_home',     principal: 2000000, rate: 14, months: 180 },
    { key: 'preset_personal', principal: 150000,  rate: 24, months: 24  },
    { key: 'preset_card',     principal: 50000,   rate: 36, months: 12  },
  ];
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
          <div className="pt">{t('loan.title')}</div>
          <div className="ps">{t('loan.subtitle')}</div>
        </div>
      </div>

      {/* Presets */}
      <div className="flex g8 mb24" style={{flexWrap:'wrap'}}>
        {PRESETS.map(pr=>(
          <button key={pr.key} className="btn btn-ghost btn-sm"
            onClick={()=>setP(x=>({...x,principal:pr.principal,annualRate:pr.rate,months:pr.months}))}>
            {t(`loan.${pr.key}`)}
          </button>
        ))}
      </div>

      <div className="two" style={{alignItems:'start'}}>
        {/* LEFT — Parameters */}
        <div style={{display:'grid',gap:16}}>
          <div className="card">
            <div className="card-hd">
              <div className="card-title"><Calculator size={16} style={{color:'var(--g1)'}}/> {t('loan.params')}</div>
            </div>
            <div className="fgrid">
              <div className="frow">
                <div className="fg">
                  <label className="fl">{t('loan.amount')}</label>
                  <input className="fi" type="number" value={p.principal} onChange={e=>set('principal',e.target.value)}/>
                </div>
                <div className="fg">
                  <label className="fl">{t('loan.currency')}</label>
                  <select className="fs" value={p.currency} onChange={e=>set('currency',e.target.value)}>
                    <option value="HTG">HTG</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>

              <div className="fg">
                <label className="fl" style={{display:'flex',justifyContent:'space-between'}}>
                  <span>{t('loan.annualRate')}</span>
                  <span style={{color:'var(--g1)',fontWeight:700}}>{p.annualRate}%</span>
                </label>
                <input type="range" min="1" max="60" step="0.5" value={p.annualRate} onChange={e=>set('annualRate',e.target.value)}/>
                <div className="flex" style={{justifyContent:'space-between',fontSize:10,color:'var(--text3)',marginTop:2}}>
                  <span>1%</span><span>30%</span><span>60%</span>
                </div>
              </div>

              <div className="fg">
                <label className="fl" style={{display:'flex',justifyContent:'space-between'}}>
                  <span>{t('loan.duration')}</span>
                  <span style={{color:'var(--g1)',fontWeight:700}}>{p.months} {t('loan.months')} ({(p.months/12).toFixed(1)} {t('loan.years')})</span>
                </label>
                <input type="range" min="3" max="360" step="1" value={p.months} onChange={e=>set('months',e.target.value)}/>
                <div className="flex" style={{justifyContent:'space-between',fontSize:10,color:'var(--text3)',marginTop:2}}>
                  <span>3 {t('loan.months')}</span><span>5 {t('loan.years')}</span><span>30 {t('loan.years')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Compare */}
          <div className="card">
            <div className="card-hd">
              <div className="card-title"><TrendingDown size={16} style={{color:'var(--blue)'}}/> {t('loan.compare')}</div>
              <button className="btn btn-ghost btn-sm" onClick={()=>setCompareMode(x=>!x)}>
                {compareMode ? t('loan.remove') : t('loan.add')}
              </button>
            </div>
            {compareMode && (
              <div className="frow">
                <div className="fg">
                  <label className="fl">{t('loan.rateB')}</label>
                  <input className="fi" type="number" value={cp.annualRate} onChange={e=>setc('annualRate',e.target.value)}/>
                </div>
                <div className="fg">
                  <label className="fl">{t('loan.durationB')}</label>
                  <input className="fi" type="number" value={cp.months} onChange={e=>setc('months',e.target.value)}/>
                </div>
              </div>
            )}
            {compareMode && cresult && (
              <div style={{marginTop:12,background:'var(--bg3)',borderRadius:8,padding:14,fontSize:13}}>
                <div className="fb mb8">
                  <span className="muted">{t('loan.monthlyB')}</span>
                  <strong style={{color:'var(--blue)'}}>{fmtHTG(cresult.monthly)}</strong>
                </div>
                <div className="fb mb8">
                  <span className="muted">{t('loan.totalInterestB')}</span>
                  <strong style={{color:'var(--blue)'}}>{fmtHTG(cresult.totalInterest)}</strong>
                </div>
                <div className="fb">
                  <span className="muted">{t('loan.savingsVsA')}</span>
                  <strong style={{color:result.totalInterest>cresult.totalInterest?'var(--g1)':'var(--red)'}}>
                    {fmtHTG(Math.abs(result.totalInterest-cresult.totalInterest))}
                    {result.totalInterest>cresult.totalInterest?t('loan.saved'):t('loan.extra')}
                  </strong>
                </div>
              </div>
            )}
            {!compareMode && <div style={{fontSize:13,color:'var(--text3)'}}>{t('loan.compareHint')}</div>}
          </div>
        </div>

        {/* RIGHT — Results */}
        <div style={{display:'grid',gap:16}}>
          {/* KPI boxes */}
          <div className="sim-res">
            <div className="sim-box">
              <div className="sim-lbl">{t('loan.monthly')}</div>
              <div className="sim-val" style={{color:'var(--g1)'}}>{fmtHTG(result.monthly)}</div>
            </div>
            <div className="sim-box">
              <div className="sim-lbl">{t('loan.totalToRepay')}</div>
              <div className="sim-val">{fmtHTG(result.totalPayment)}</div>
            </div>
            <div className="sim-box">
              <div className="sim-lbl">{t('loan.totalInterest')}</div>
              <div className="sim-val" style={{color:'var(--red)'}}>{fmtHTG(result.totalInterest)}</div>
            </div>
          </div>

          {/* Capital vs intérêts bar */}
          <div className="card">
            <div className="card-hd"><div className="card-title">{t('loan.breakdown')}</div></div>
            <div style={{display:'flex',height:12,borderRadius:6,overflow:'hidden',marginBottom:10}}>
              <div style={{background:'var(--g1)',flex:Number(p.principal)}}/>
              <div style={{background:'var(--red)',flex:result.totalInterest}}/>
            </div>
            <div className="flex g16" style={{fontSize:12}}>
              <span style={{display:'flex',alignItems:'center',gap:5}}><span style={{width:10,height:10,borderRadius:2,background:'var(--g1)',display:'inline-block'}}/> {t('loan.capital')} : {Math.round(Number(p.principal)/result.totalPayment*100)}%</span>
              <span style={{display:'flex',alignItems:'center',gap:5}}><span style={{width:10,height:10,borderRadius:2,background:'var(--red)',display:'inline-block'}}/> {t('loan.interest')} : {Math.round(result.totalInterest/result.totalPayment*100)}%</span>
            </div>
          </div>

          {/* Amortization curve */}
          <div className="card">
            <div className="card-hd"><div className="card-title">{t('loan.balanceEvolution')}</div></div>
            <div style={{height:160}}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={result.schedule.filter((_,i)=>i%scheduleStep===0)} margin={{top:4,right:4,left:0,bottom:0}}>
                  <defs><linearGradient id="gl" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00A86B" stopOpacity={.2}/><stop offset="95%" stopColor="#00A86B" stopOpacity={0}/></linearGradient></defs>
                  <XAxis dataKey="month" stroke="#8A97A8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v=>`M${v}`} interval="preserveStartEnd"/>
                  <YAxis stroke="#8A97A8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v=>`${Math.round(v/1000)}k`}/>
                  <Tooltip formatter={v=>fmtHTG(v)} labelFormatter={v=>`${t('loan.col_month')} ${v}`}/>
                  <Area type="monotone" dataKey="balance" name={t('loan.col_balance')} stroke="#00A86B" strokeWidth={2} fill="url(#gl)"/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Principal vs interest per payment */}
          <div className="card">
            <div className="card-hd"><div className="card-title">{t('loan.principalVsInterest')}</div></div>
            <div style={{height:160}}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={result.schedule.filter((_,i)=>i%scheduleStep===0)} margin={{top:4,right:4,left:0,bottom:0}} barSize={6}>
                  <XAxis dataKey="month" stroke="#8A97A8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v=>`M${v}`} interval="preserveStartEnd"/>
                  <YAxis stroke="#8A97A8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v=>`${Math.round(v/1000)}k`}/>
                  <Tooltip content={<TT/>}/>
                  <Bar dataKey="principal" name={t('loan.col_principal')} stackId="a" fill="#00A86B"/>
                  <Bar dataKey="interest"  name={t('loan.col_interest')}  stackId="a" fill="#E53E3E" radius={[2,2,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Amortization table */}
      <div className="card mt24">
        <div className="card-hd">
          <div className="card-title"><Calendar size={16} style={{color:'var(--g1)'}}/> {t('loan.schedule')}</div>
          <button className="btn btn-ghost btn-sm" onClick={()=>setShowSchedule(s=>!s)}>
            {showSchedule?<><ChevronUp size={14}/> {t('loan.hide')}</>:<><ChevronDown size={14}/> {t('loan.show')}</>}
          </button>
        </div>
        {showSchedule && (
          <div className="tw" style={{maxHeight:380,overflowY:'auto'}}>
            <table>
              <thead>
                <tr>
                  <th>{t('loan.col_month')}</th>
                  <th style={{textAlign:'right'}}>{t('loan.col_payment')}</th>
                  <th style={{textAlign:'right'}}>{t('loan.col_principal')}</th>
                  <th style={{textAlign:'right'}}>{t('loan.col_interest')}</th>
                  <th style={{textAlign:'right'}}>{t('loan.col_balance')}</th>
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
