import React, { useState, useMemo } from 'react';
import {
  TrendingUp, Calendar, ChevronDown, ChevronUp, PiggyBank,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { fmtHTG, fmtUSD } from '../utils/finance';

// ── Periodicity → number of periods per year ──────────────────────────────
const FREQ_PER_YEAR = { monthly: 12, quarterly: 4, semiannual: 2, annual: 1 };
const FREQ_LABEL = { monthly: 'Mensuelle', quarterly: 'Trimestrielle', semiannual: 'Semestrielle', annual: 'Annuelle' };

// ── Core compound-interest simulation ──────────────────────────────────────
// Contributions are added at the END of each contribution period (standard
// ordinary-annuity convention), so a deposit starts earning interest only
// from the following period.
function simulateInvestment({ principal, annualRate, years, capFreq, contribAmount, contribFreq }) {
  const capPerYear = FREQ_PER_YEAR[capFreq];
  const contribPerYear = FREQ_PER_YEAR[contribFreq];
  const totalCapPeriods = Math.round(years * capPerYear);
  const ratePerCapPeriod = (annualRate / 100) / capPerYear;

  // How much is contributed, spread proportionally, per capitalization period.
  // e.g. monthly capitalization + quarterly contributions of 1000
  //      → 1000/3 credited each month, added at each month's period-end,
  //        which is equivalent to adding 1000 every 3rd month for ordinary
  //        annuity timing when capFreq is a multiple of contribFreq's rate.
  // Simpler & exact approach: track on a common monthly-like grid using the
  // capitalization period as the base unit, and add the full contribution
  // amount at the periods that align with the contribution frequency.
  const capPeriodsPerContribPeriod = capPerYear / contribPerYear;

  const schedule = [];
  let balance = principal;
  let totalContributed = principal;

  for (let p = 1; p <= totalCapPeriods; p++) {
    const startBalance = balance;
    const interest = startBalance * ratePerCapPeriod;
    balance = startBalance + interest;

    // Does a contribution land at the end of this capitalization period?
    let contribThisPeriod = 0;
    if (contribAmount > 0 && capPeriodsPerContribPeriod > 0) {
      // Aligns every Nth capitalization period, where N = capPeriodsPerContribPeriod
      if (Math.round(p % capPeriodsPerContribPeriod) === 0 || capPeriodsPerContribPeriod < 1) {
        if (capPeriodsPerContribPeriod < 1) {
          // Contributions more frequent than capitalization: add proportional share each cap period
          contribThisPeriod = contribAmount * (contribPerYear / capPerYear);
        } else {
          contribThisPeriod = contribAmount;
        }
        balance += contribThisPeriod;
        totalContributed += contribThisPeriod;
      }
    }

    schedule.push({
      period: p,
      startBalance,
      interest,
      contribution: contribThisPeriod,
      endBalance: balance,
    });
  }

  const totalInterest = balance - totalContributed;
  return { finalBalance: balance, totalContributed, totalInterest, schedule };
}

export default function InvestmentSimulator({ settings }) {
  const [principal, setPrincipal]         = useState(100000);
  const [annualRate, setAnnualRate]       = useState(8);
  const [years, setYears]                 = useState(5);
  const [capFreq, setCapFreq]             = useState('monthly');
  const [enableContrib, setEnableContrib] = useState(true);
  const [contribAmount, setContribAmount] = useState(5000);
  const [contribFreq, setContribFreq]     = useState('monthly');
  const [currency, setCurrency]           = useState('HTG');
  const [showSchedule, setShowSchedule]   = useState(false);

  const fmt = currency === 'USD' ? fmtUSD : fmtHTG;

  const result = useMemo(() => simulateInvestment({
    principal: Number(principal) || 0,
    annualRate: Number(annualRate) || 0,
    years: Number(years) || 0,
    capFreq,
    contribAmount: enableContrib ? (Number(contribAmount) || 0) : 0,
    contribFreq,
  }), [principal, annualRate, years, capFreq, enableContrib, contribAmount, contribFreq]);

  // Chart data: sample yearly points so long durations stay readable
  const chartData = useMemo(() => {
    const pts = [];
    const capPerYear = FREQ_PER_YEAR[capFreq];
    result.schedule.forEach((row, i) => {
      const periodInYears = (i + 1) / capPerYear;
      // sample every capitalization period if short duration, else every year
      const sampleEvery = result.schedule.length > 60 ? capPerYear : 1;
      if ((i + 1) % sampleEvery === 0 || i === result.schedule.length - 1) {
        pts.push({
          label: periodInYears % 1 === 0 ? `An ${periodInYears}` : `P${i + 1}`,
          investi: row.endBalance - (row.endBalance - (principal + result.schedule.slice(0, i + 1).reduce((s, r) => s + r.contribution, 0))),
          verse: principal + result.schedule.slice(0, i + 1).reduce((s, r) => s + r.contribution, 0),
          total: row.endBalance,
        });
      }
    });
    return pts;
  }, [result, capFreq, principal]);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title"><TrendingUp size={20} style={{ marginRight: 8, verticalAlign: 'middle', color: 'var(--g1)' }}/>Simulation de Placement</div>
          <div className="page-subtitle">Projetez la croissance d'un placement avec intérêts composés et versements périodiques</div>
        </div>
      </div>

      <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 20, alignItems: 'start' }}>
        {/* ── Parameters card ── */}
        <div className="card">
          <div className="card-hd">
            <div className="card-title"><PiggyBank size={16} style={{ color: 'var(--g1)' }}/> Paramètres</div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Devise</label>
              <select className="form-input" value={currency} onChange={e => setCurrency(e.target.value)}>
                <option value="HTG">HTG</option>
                <option value="USD">USD</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Montant initial investi</label>
              <input className="form-input" type="number" min="0" value={principal}
                onChange={e => setPrincipal(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Taux de rendement annuel (%)</label>
              <input className="form-input" type="number" min="0" step="0.1" value={annualRate}
                onChange={e => setAnnualRate(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Durée du placement (années)</label>
              <input className="form-input" type="number" min="0" step="0.5" value={years}
                onChange={e => setYears(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Périodicité de capitalisation</label>
              <select className="form-input" value={capFreq} onChange={e => setCapFreq(e.target.value)}>
                {Object.entries(FREQ_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>

            <hr className="divider" />

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={enableContrib} onChange={e => setEnableContrib(e.target.checked)} id="contribToggle" />
              <label htmlFor="contribToggle" className="form-label" style={{ margin: 0 }}>Versements additionnels réguliers</label>
            </div>

            {enableContrib && (
              <>
                <div className="form-group">
                  <label className="form-label">Montant du versement périodique</label>
                  <input className="form-input" type="number" min="0" value={contribAmount}
                    onChange={e => setContribAmount(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Fréquence des versements</label>
                  <select className="form-input" value={contribFreq} onChange={e => setContribFreq(e.target.value)}>
                    {Object.entries(FREQ_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Results ── */}
        <div>
          <div className="kpi-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
            <div className="card kpi-card">
              <div className="kpi-label">Montant à l'échéance</div>
              <div className="kpi-value" style={{ color: 'var(--g1)' }}>{fmt(result.finalBalance)}</div>
            </div>
            <div className="card kpi-card">
              <div className="kpi-label">Total versé (initial + versements)</div>
              <div className="kpi-value">{fmt(result.totalContributed)}</div>
            </div>
            <div className="card kpi-card">
              <div className="kpi-label">Total des intérêts générés</div>
              <div className="kpi-value" style={{ color: 'var(--g1)' }}>{fmt(result.totalInterest)}</div>
            </div>
          </div>

          <div className="card">
            <div className="card-hd">
              <div className="card-title">Évolution du capital</div>
            </div>
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border2)" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => (v / 1000).toFixed(0) + 'k'} />
                  <Tooltip formatter={(v) => fmt(v)} />
                  <Legend />
                  <Area type="monotone" dataKey="verse" name="Sommes versées" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.25} />
                  <Area type="monotone" dataKey="total" name="Capital total" stackId="2" stroke="#00A86B" fill="#00A86B" fillOpacity={0.35} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ── Detailed schedule ── */}
      <div className="card mt24">
        <div className="card-hd">
          <div className="card-title"><Calendar size={16} style={{ color: 'var(--g1)' }}/> Tableau détaillé par période</div>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowSchedule(s => !s)}>
            {showSchedule ? <><ChevronUp size={14}/> Masquer</> : <><ChevronDown size={14}/> Afficher</>}
          </button>
        </div>
        {showSchedule && (
          <div className="tw" style={{ maxHeight: 380, overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Période</th>
                  <th style={{ textAlign: 'right' }}>Capital de départ</th>
                  <th style={{ textAlign: 'right' }}>Versement</th>
                  <th style={{ textAlign: 'right' }}>Intérêts générés</th>
                  <th style={{ textAlign: 'right' }}>Solde final</th>
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
