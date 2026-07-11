import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { PiggyBank, TrendingUp, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { fmtHTG, fmtUSD } from '../utils/finance';
import { useLanguage } from '../i18n/LanguageContext';

const FREQ_PER_YEAR = { monthly: 12, quarterly: 4, semiannual: 2, annual: 1 };

// Contributions land at the END of each contribution period (ordinary annuity).
function simulateInvestment({ principal, annualRate, years, capFreq, contribAmount, contribFreq }) {
  const capPerYear = FREQ_PER_YEAR[capFreq];
  const contribPerYear = FREQ_PER_YEAR[contribFreq];
  const totalCapPeriods = Math.round(years * capPerYear);
  const ratePerCapPeriod = (annualRate / 100) / capPerYear;
  const capPeriodsPerContribPeriod = capPerYear / contribPerYear;

  const schedule = [];
  let balance = principal;
  let totalContributed = principal;

  for (let per = 1; per <= totalCapPeriods; per++) {
    const startBalance = balance;
    const interest = startBalance * ratePerCapPeriod;
    balance = startBalance + interest;

    let contribThisPeriod = 0;
    if (contribAmount > 0 && capPeriodsPerContribPeriod > 0) {
      if (capPeriodsPerContribPeriod < 1) {
        contribThisPeriod = contribAmount * (contribPerYear / capPerYear);
        balance += contribThisPeriod;
        totalContributed += contribThisPeriod;
      } else if (per % Math.round(capPeriodsPerContribPeriod) === 0) {
        contribThisPeriod = contribAmount;
        balance += contribThisPeriod;
        totalContributed += contribThisPeriod;
      }
    }

    schedule.push({ period: per, startBalance, interest, contribution: contribThisPeriod, endBalance: balance });
  }

  return { finalBalance: balance, totalContributed, totalInterest: balance - totalContributed, schedule };
}

export default function InvestmentSimulator() {
  const { t } = useLanguage();
  const FREQ_LABEL = { monthly: t('freq.monthly'), quarterly: t('freq.quarterly'), semiannual: t('freq.semiannual'), annual: t('freq.annual') };
  const PRESETS = [
    { key: 'preset_conservative', principal: 100000, rate: 6,  years: 5,  contrib: 3000 },
    { key: 'preset_growth',       principal: 200000, rate: 10, years: 10, contrib: 5000 },
    { key: 'preset_retirement',   principal: 500000, rate: 8,  years: 20, contrib: 8000 },
    { key: 'preset_short',        principal: 50000,  rate: 5,  years: 2,  contrib: 2000 },
  ];
  const [p, setP] = useState({ principal: 100000, annualRate: 8, years: 5, capFreq: 'monthly', currency: 'HTG' });
  const [enableContrib, setEnableContrib] = useState(true);
  const [contrib, setContrib] = useState({ amount: 5000, freq: 'monthly' });
  const [showSchedule, setShowSchedule] = useState(false);

  const set  = (k, v) => setP(x => ({ ...x, [k]: v }));
  const setc = (k, v) => setContrib(x => ({ ...x, [k]: v }));
  const fmt = p.currency === 'USD' ? fmtUSD : fmtHTG;

  const result = useMemo(() => simulateInvestment({
    principal: Number(p.principal) || 0,
    annualRate: Number(p.annualRate) || 0,
    years: Number(p.years) || 0,
    capFreq: p.capFreq,
    contribAmount: enableContrib ? (Number(contrib.amount) || 0) : 0,
    contribFreq: contrib.freq,
  }), [p, enableContrib, contrib]);

  const scheduleStep = Math.max(1, Math.floor(result.schedule.length / 24));
  const chartData = result.schedule.filter((_, i) => i % scheduleStep === 0);

  return (
    <div>
      <div className="ph">
        <div>
          <div className="pt">{t('investment.title')}</div>
          <div className="ps">{t('investment.subtitle')}</div>
        </div>
      </div>

      {/* Presets */}
      <div className="flex g8 mb24" style={{ flexWrap: 'wrap' }}>
        {PRESETS.map(pr => (
          <button key={pr.key} className="btn btn-ghost btn-sm"
            onClick={() => { setP(x => ({ ...x, principal: pr.principal, annualRate: pr.rate, years: pr.years })); setContrib(c => ({ ...c, amount: pr.contrib })); }}>
            {t(`investment.${pr.key}`)}
          </button>
        ))}
      </div>

      <div className="two" style={{ alignItems: 'start' }}>
        {/* LEFT — Parameters */}
        <div style={{ display: 'grid', gap: 16 }}>
          <div className="card">
            <div className="card-hd">
              <div className="card-title"><PiggyBank size={16} style={{ color: 'var(--g1)' }}/> {t('investment.params')}</div>
            </div>
            <div className="fgrid">
              <div className="frow">
                <div className="fg">
                  <label className="fl">{t('investment.initialAmount')}</label>
                  <input className="fi" type="number" value={p.principal} onChange={e => set('principal', e.target.value)}/>
                </div>
                <div className="fg">
                  <label className="fl">{t('investment.currency')}</label>
                  <select className="fs" value={p.currency} onChange={e => set('currency', e.target.value)}>
                    <option value="HTG">HTG</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>
              <div className="fg">
                <label className="fl" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{t('investment.annualReturn')}</span>
                  <span style={{ color: 'var(--g1)', fontWeight: 700 }}>{p.annualRate}%</span>
                </label>
                <input type="range" min="0" max="30" step="0.5" value={p.annualRate} onChange={e => set('annualRate', e.target.value)}/>
                <div className="flex" style={{ justifyContent: 'space-between', fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>
                  <span>0%</span><span>15%</span><span>30%</span>
                </div>
              </div>
              <div className="fg">
                <label className="fl" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{t('investment.duration')}</span>
                  <span style={{ color: 'var(--g1)', fontWeight: 700 }}>{p.years} {t('investment.years')}</span>
                </label>
                <input type="range" min="1" max="30" step="1" value={p.years} onChange={e => set('years', e.target.value)}/>
                <div className="flex" style={{ justifyContent: 'space-between', fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>
                  <span>1</span><span>15</span><span>30</span>
                </div>
              </div>
              <div className="fg">
                <label className="fl">{t('investment.capFreq')}</label>
                <select className="fs" value={p.capFreq} onChange={e => set('capFreq', e.target.value)}>
                  {Object.entries(FREQ_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Contributions */}
          <div className="card">
            <div className="card-hd">
              <div className="card-title"><TrendingUp size={16} style={{ color: 'var(--blue)' }}/> {t('investment.contributions')}</div>
              <button className="btn btn-ghost btn-sm" onClick={() => setEnableContrib(x => !x)}>
                {enableContrib ? t('investment.remove') : t('investment.add')}
              </button>
            </div>
            {enableContrib && (
              <div className="frow">
                <div className="fg">
                  <label className="fl">{t('investment.contribAmount')}</label>
                  <input className="fi" type="number" value={contrib.amount} onChange={e => setc('amount', e.target.value)}/>
                </div>
                <div className="fg">
                  <label className="fl">{t('investment.frequency')}</label>
                  <select className="fs" value={contrib.freq} onChange={e => setc('freq', e.target.value)}>
                    {Object.entries(FREQ_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
            )}
            {!enableContrib && <div style={{ fontSize: 13, color: 'var(--text3)' }}>{t('investment.contribHint')}</div>}
          </div>
        </div>

        {/* RIGHT — Results */}
        <div style={{ display: 'grid', gap: 16 }}>
          <div className="sim-res">
            <div className="sim-box">
              <div className="sim-lbl">{t('investment.finalAmount')}</div>
              <div className="sim-val" style={{ color: 'var(--g1)' }}>{fmt(result.finalBalance)}</div>
            </div>
            <div className="sim-box">
              <div className="sim-lbl">{t('investment.totalContributed')}</div>
              <div className="sim-val">{fmt(result.totalContributed)}</div>
            </div>
            <div className="sim-box">
              <div className="sim-lbl">{t('investment.totalInterest')}</div>
              <div className="sim-val" style={{ color: 'var(--g1)' }}>{fmt(result.totalInterest)}</div>
            </div>
          </div>

          {/* Répartition */}
          <div className="card">
            <div className="card-hd"><div className="card-title">{t('investment.breakdown')}</div></div>
            <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: 10 }}>
              <div style={{ background: 'var(--blue)', flex: result.totalContributed }}/>
              <div style={{ background: 'var(--g1)', flex: Math.max(result.totalInterest, 0) }}/>
            </div>
            <div className="flex g16" style={{ fontSize: 12 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--blue)', display: 'inline-block' }}/> {t('investment.contributed')} : {Math.round(result.totalContributed / result.finalBalance * 100)}%</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--g1)', display: 'inline-block' }}/> {t('investment.interest')} : {Math.round(result.totalInterest / result.finalBalance * 100)}%</span>
            </div>
          </div>

          {/* Growth curve */}
          <div className="card">
            <div className="card-hd"><div className="card-title">{t('investment.growth')}</div></div>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs><linearGradient id="gi" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00A86B" stopOpacity={.25}/><stop offset="95%" stopColor="#00A86B" stopOpacity={0}/></linearGradient></defs>
                  <XAxis dataKey="period" stroke="#8A97A8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `P${v}`} interval="preserveStartEnd"/>
                  <YAxis stroke="#8A97A8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `${Math.round(v/1000)}k`}/>
                  <Tooltip formatter={v => fmt(v)} labelFormatter={v => `${t('investment.col_period')} ${v}`}/>
                  <Area type="monotone" dataKey="endBalance" name={t('investment.col_end')} stroke="#00A86B" strokeWidth={2} fill="url(#gi)"/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed schedule */}
      <div className="card mt24">
        <div className="card-hd">
          <div className="card-title"><Calendar size={16} style={{ color: 'var(--g1)' }}/> {t('investment.schedule')}</div>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowSchedule(s => !s)}>
            {showSchedule ? <><ChevronUp size={14}/> {t('investment.hide')}</> : <><ChevronDown size={14}/> {t('investment.show')}</>}
          </button>
        </div>
        {showSchedule && (
          <div className="tw" style={{ maxHeight: 380, overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>{t('investment.col_period')}</th>
                  <th style={{ textAlign: 'right' }}>{t('investment.col_start')}</th>
                  <th style={{ textAlign: 'right' }}>{t('investment.col_contrib')}</th>
                  <th style={{ textAlign: 'right' }}>{t('investment.col_interest')}</th>
                  <th style={{ textAlign: 'right' }}>{t('investment.col_end')}</th>
                </tr>
              </thead>
              <tbody>
                {result.schedule.map(row => (
                  <tr key={row.period}>
                    <td style={{ fontWeight: 600 }}>{row.period}</td>
                    <td className="tr">{fmt(row.startBalance)}</td>
                    <td className="tr gv">{row.contribution > 0 ? fmt(row.contribution) : '—'}</td>
                    <td className="tr gv">{fmt(row.interest)}</td>
                    <td className="tr" style={{ fontWeight: 600 }}>{fmt(row.endBalance)}</td>
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
