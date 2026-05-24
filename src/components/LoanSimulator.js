import React, { useState, useMemo } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { fmtHTG, amortize } from '../utils/finance';

const PRESETS = [
  { label: 'Prêt Auto',        principal: 500000, rate: 18, months: 60, currency: 'HTG' },
  { label: 'Prêt Immobilier',  principal: 2000000, rate: 14, months: 180, currency: 'HTG' },
  { label: 'Prêt Personnel',   principal: 150000, rate: 24, months: 24, currency: 'HTG' },
  { label: 'Carte de Crédit',  principal: 50000, rate: 36, months: 12, currency: 'HTG' },
];

export default function LoanSimulator({ settings }) {
  const rate_usd = settings?.usdToHtg || 130;

  const [params, setParams] = useState({
    principal: 500000, annualRate: 18, months: 60, currency: 'HTG', startDate: ''
  });
  const [showSchedule, setShowSchedule] = useState(false);
  const [compareParams, setCompareParams] = useState(null);

  const set = (k, v) => setParams(p => ({ ...p, [k]: v }));

  const result = useMemo(() =>
    amortize(Number(params.principal)||0, Number(params.annualRate)||0, Number(params.months)||1),
    [params]);

  const compareResult = useMemo(() =>
    compareParams ? amortize(Number(compareParams.principal)||0, Number(compareParams.annualRate)||0, Number(compareParams.months)||1) : null,
    [compareParams]);

  const chartData = useMemo(() => {
    return result.schedule.filter((_, i) => i % 3 === 0 || i === result.schedule.length - 1).map(s => ({
      month: `M${s.month}`,
      'Capital restant': Math.round(s.balance),
      'Intérêts cumulés': Math.round(result.totalInterest - (result.schedule[s.month-1]?.interest || 0) * s.month),
    }));
  }, [result]);

  const paymentData = useMemo(() => {
    const step = Math.max(1, Math.floor(result.schedule.length / 24));
    return result.schedule.filter((_, i) => i % step === 0).map(s => ({
      month: `M${s.month}`,
      'Principal': Math.round(s.principal),
      'Intérêts': Math.round(s.interest),
    }));
  }, [result]);

  const fmt = (n) => fmtHTG(n);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
        {payload.map(p => <div key={p.name} style={{ color: p.color }}>{p.name}: {fmtHTG(p.value)}</div>)}
      </div>
    );
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Simulateur de Prêt</div>
          <div className="page-subtitle">Calculez et comparez vos scenarios de financement</div>
        </div>
      </div>

      {/* Presets */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        {PRESETS.map(p => (
          <button key={p.label} className="btn btn-ghost btn-sm" onClick={() => setParams({ ...params, ...p })}>
            {p.label}
          </button>
        ))}
      </div>

      <div className="two-col" style={{ alignItems: 'start' }}>
        {/* Parameters */}
        <div>
          <div className="card mb-16">
            <div className="card-header">
              <div className="card-title">📋 Paramètres du Prêt</div>
            </div>
            <div className="form-grid">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Montant emprunté</label>
                  <input className="form-input" type="number" value={params.principal}
                    onChange={e => set('principal', e.target.value)}/>
                </div>
                <div className="form-group">
                  <label className="form-label">Devise</label>
                  <select className="form-select" value={params.currency} onChange={e => set('currency', e.target.value)}>
                    <option value="HTG">HTG</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Taux d'intérêt annuel : <strong style={{ color: 'var(--accent)' }}>{params.annualRate}%</strong></label>
                <input type="range" min="1" max="60" step="0.5" value={params.annualRate}
                  onChange={e => set('annualRate', e.target.value)}
                  style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }}/>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text3)' }}>
                  <span>1%</span><span>30%</span><span>60%</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Durée : <strong style={{ color: 'var(--accent)' }}>{params.months} mois ({Math.round(params.months/12*10)/10} ans)</strong></label>
                <input type="range" min="3" max="360" step="1" value={params.months}
                  onChange={e => set('months', e.target.value)}
                  style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }}/>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text3)' }}>
                  <span>3 mois</span><span>5 ans</span><span>30 ans</span>
                </div>
              </div>
            </div>
          </div>

          {/* Compare mode */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">⚖️ Scénario de comparaison</div>
              <button className="btn btn-ghost btn-sm"
                onClick={() => setCompareParams(compareParams ? null : { ...params, annualRate: params.annualRate - 2 })}>
                {compareParams ? 'Supprimer' : 'Ajouter'}
              </button>
            </div>
            {compareParams && (
              <div className="form-grid">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Taux B (%)</label>
                    <input className="form-input" type="number" value={compareParams.annualRate}
                      onChange={e => setCompareParams(p => ({ ...p, annualRate: e.target.value }))}/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Durée B (mois)</label>
                    <input className="form-input" type="number" value={compareParams.months}
                      onChange={e => setCompareParams(p => ({ ...p, months: e.target.value }))}/>
                  </div>
                </div>
                {compareResult && (
                  <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: 12, fontSize: 13 }}>
                    <div className="flex-between" style={{ marginBottom: 4 }}>
                      <span style={{ color: 'var(--text2)' }}>Mensualité B :</span>
                      <strong style={{ color: 'var(--orange)' }}>{fmtHTG(compareResult.monthly)}</strong>
                    </div>
                    <div className="flex-between" style={{ marginBottom: 4 }}>
                      <span style={{ color: 'var(--text2)' }}>Total intérêts B :</span>
                      <strong style={{ color: 'var(--orange)' }}>{fmtHTG(compareResult.totalInterest)}</strong>
                    </div>
                    <div className="flex-between">
                      <span style={{ color: 'var(--text2)' }}>Économie vs A :</span>
                      <strong style={{ color: result.totalInterest > compareResult.totalInterest ? 'var(--green)' : 'var(--red)' }}>
                        {fmtHTG(Math.abs(result.totalInterest - compareResult.totalInterest))}
                        {result.totalInterest > compareResult.totalInterest ? ' 🡇 économisé' : ' 🡅 surcoût'}
                      </strong>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div>
          <div className="sim-result">
            <div className="sim-box">
              <div className="sim-box-label">Mensualité</div>
              <div className="sim-box-value" style={{ color: 'var(--accent)' }}>{fmtHTG(result.monthly)}</div>
            </div>
            <div className="sim-box">
              <div className="sim-box-label">Total à rembourser</div>
              <div className="sim-box-value" style={{ color: 'var(--text)' }}>{fmtHTG(result.totalPayment)}</div>
            </div>
            <div className="sim-box">
              <div className="sim-box-label">Total intérêts</div>
              <div className="sim-box-value" style={{ color: 'var(--red)' }}>{fmtHTG(result.totalInterest)}</div>
            </div>
          </div>

          {/* Cost breakdown */}
          <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>Répartition Capital / Intérêts</div>
            <div style={{ display: 'flex', height: 16, borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ background: 'var(--accent)', flex: Number(params.principal) }}/>
              <div style={{ background: 'var(--red)', flex: result.totalInterest }}/>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 11 }}>
              <span><span style={{ color: 'var(--accent)' }}>■</span> Capital : {Math.round(Number(params.principal)/result.totalPayment*100)}%</span>
              <span><span style={{ color: 'var(--red)' }}>■</span> Intérêts : {Math.round(result.totalInterest/result.totalPayment*100)}%</span>
            </div>
          </div>

          {/* Amortization chart */}
          <div className="card mb-16">
            <div className="card-header">
              <div className="card-title">Évolution du capital restant</div>
            </div>
            <div style={{ height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={result.schedule.filter((_,i)=>i%Math.max(1,Math.floor(result.schedule.length/20))===0)} margin={{top:4,right:4,left:0,bottom:0}}>
                  <defs>
                    <linearGradient id="gLoan" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="#6E7681" fontSize={10} tickLine={false} axisLine={false}
                    tickFormatter={v=>`M${v}`} interval="preserveStartEnd"/>
                  <YAxis stroke="#6E7681" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v=>`${Math.round(v/1000)}k`}/>
                  <Tooltip formatter={v => fmtHTG(v)} labelFormatter={v => `Mois ${v}`}/>
                  <Area type="monotone" dataKey="balance" name="Capital restant" stroke="#2563EB" strokeWidth={2} fill="url(#gLoan)"/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Payment breakdown chart */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Principal vs Intérêts par mensualité</div>
            </div>
            <div style={{ height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paymentData} margin={{top:4,right:4,left:0,bottom:0}} stackOffset="expand" barSize={6}>
                  <XAxis dataKey="month" stroke="#6E7681" fontSize={10} tickLine={false} axisLine={false} interval="preserveStartEnd"/>
                  <YAxis stroke="#6E7681" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v=>`${Math.round(v/1000)}k`}/>
                  <Tooltip content={<CustomTooltip/>}/>
                  <Bar dataKey="Principal" stackId="a" fill="#3FB950"/>
                  <Bar dataKey="Intérêts"  stackId="a" fill="#F85149" radius={[2,2,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Amortization schedule toggle */}
      <div className="card mt-24">
        <div className="card-header">
          <div className="card-title">📅 Tableau d'amortissement complet</div>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowSchedule(s => !s)}>
            {showSchedule ? '▲ Masquer' : '▼ Afficher'}
          </button>
        </div>
        {showSchedule && (
          <div className="table-wrap" style={{ maxHeight: 400, overflow: 'auto' }}>
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
                {result.schedule.map(row => (
                  <tr key={row.month}>
                    <td>{row.month}</td>
                    <td className="text-right" style={{fontWeight:500}}>{fmtHTG(row.payment)}</td>
                    <td className="text-right text-green">{fmtHTG(row.principal)}</td>
                    <td className="text-right text-red">{fmtHTG(row.interest)}</td>
                    <td className="text-right">{fmtHTG(row.balance)}</td>
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
