import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { fmtHTG, fmtUSD, toHTG, computeBalance, MONTHS_FR, getCat, getAccType } from '../utils/finance';

const COLORS = ['#2563EB','#3FB950','#F97316','#8B5CF6','#14B8A6','#F85149','#D29922'];

export default function Dashboard({ accounts, transactions, savings, settings, onNav }) {
  const rate = settings?.usdToHtg || 130;

  const balances = useMemo(() =>
    accounts.map(a => ({ ...a, balance: computeBalance(a, transactions) })),
    [accounts, transactions]);

  const totalNetHTG = useMemo(() =>
    balances.reduce((sum, a) => sum + toHTG(a.balance, a.currency, rate), 0),
    [balances, rate]);

  const now = new Date();
  const thisMonthTxs = useMemo(() =>
    transactions.filter(t => {
      const d = t.date?.seconds ? new Date(t.date.seconds*1000) : new Date(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
        && t.status === 'confirmed';
    }),
    [transactions, now]);

  const monthIncome = useMemo(() =>
    thisMonthTxs.filter(t => t.txType === 'income').reduce((s, t) => s + toHTG(Number(t.amount), t.currency, rate), 0),
    [thisMonthTxs, rate]);

  const monthExpense = useMemo(() =>
    thisMonthTxs.filter(t => t.txType === 'expense').reduce((s, t) => s + toHTG(Number(t.amount), t.currency, rate), 0),
    [thisMonthTxs, rate]);

  const monthNet = monthIncome - monthExpense;

  // Last 6 months data
  const monthlyData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const m = d.getMonth(); const y = d.getFullYear();
      const txs = transactions.filter(t => {
        const td = t.date?.seconds ? new Date(t.date.seconds*1000) : new Date(t.date);
        return td.getMonth() === m && td.getFullYear() === y && t.status === 'confirmed';
      });
      const income  = txs.filter(t => t.txType==='income').reduce((s,t)=>s+toHTG(Number(t.amount),t.currency,rate),0);
      const expense = txs.filter(t => t.txType==='expense').reduce((s,t)=>s+toHTG(Number(t.amount),t.currency,rate),0);
      return { name: MONTHS_FR[m], income, expense, net: income - expense };
    });
  }, [transactions, rate]);

  // Expense by category
  const expByCat = useMemo(() => {
    const map = {};
    thisMonthTxs.filter(t => t.txType === 'expense').forEach(t => {
      const cat = getCat(t.category).label;
      map[cat] = (map[cat] || 0) + toHTG(Number(t.amount), t.currency, rate);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a,b)=>b.value-a.value).slice(0,6);
  }, [thisMonthTxs, rate]);

  // Savings progress
  const savingsProgress = useMemo(() =>
    savings.map(g => ({
      ...g,
      pct: Math.min(100, ((g.currentAmount || 0) / (g.targetAmount || 1)) * 100),
    })),
    [savings]);

  // Recent transactions
  const recent = useMemo(() => transactions.slice(0, 6), [transactions]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
        {payload.map(p => (
          <div key={p.name} style={{ color: p.color }}>
            {p.name}: {fmtHTG(p.value)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Tableau de Bord</div>
          <div className="page-subtitle">{new Date().toLocaleDateString('fr-HT', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</div>
        </div>
        <button className="btn btn-primary" onClick={() => onNav('transactions')}>
          + Nouvelle Transaction
        </button>
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        <div className="kpi-card blue">
          <div className="kpi-icon">💎</div>
          <div className="kpi-label">Patrimoine Net</div>
          <div className="kpi-value blue">{fmtHTG(totalNetHTG)}</div>
          <div className="kpi-sub">{accounts.length} compte{accounts.length>1?'s':''} actif{accounts.length>1?'s':''}</div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-icon">📥</div>
          <div className="kpi-label">Revenus ce mois</div>
          <div className="kpi-value green">{fmtHTG(monthIncome)}</div>
          <div className="kpi-sub">{thisMonthTxs.filter(t=>t.txType==='income').length} transactions</div>
        </div>
        <div className="kpi-card red">
          <div className="kpi-icon">📤</div>
          <div className="kpi-label">Dépenses ce mois</div>
          <div className="kpi-value red">{fmtHTG(monthExpense)}</div>
          <div className="kpi-sub">{thisMonthTxs.filter(t=>t.txType==='expense').length} transactions</div>
        </div>
        <div className={`kpi-card ${monthNet >= 0 ? 'teal' : 'red'}`}>
          <div className="kpi-icon">⚖️</div>
          <div className="kpi-label">Solde Net du Mois</div>
          <div className={`kpi-value ${monthNet >= 0 ? 'teal' : 'red'}`}>{fmtHTG(monthNet)}</div>
          <div className="kpi-sub">{monthIncome > 0 ? Math.round((monthExpense/monthIncome)*100) : 0}% du revenu dépensé</div>
        </div>
      </div>

      <div className="two-col-wide">
        {/* Monthly chart */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Flux des 6 derniers mois</div>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3FB950" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#3FB950" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F85149" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#F85149" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#6E7681" fontSize={11} tickLine={false} axisLine={false}/>
                <YAxis stroke="#6E7681" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v=>`${Math.round(v/1000)}k`}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Area type="monotone" dataKey="income" name="Revenus" stroke="#3FB950" strokeWidth={2} fill="url(#gIncome)"/>
                <Area type="monotone" dataKey="expense" name="Dépenses" stroke="#F85149" strokeWidth={2} fill="url(#gExpense)"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense by category donut */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Dépenses par catégorie</div>
          </div>
          {expByCat.length === 0 ? (
            <div className="empty-state" style={{padding:'24px 0'}}>
              <div className="empty-state-icon">📊</div>
              <div className="empty-state-text">Aucune dépense ce mois</div>
            </div>
          ) : (
            <>
              <div style={{ height: 140 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={expByCat} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                      {expByCat.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                    </Pie>
                    <Tooltip formatter={v => fmtHTG(v)}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ marginTop: 8 }}>
                {expByCat.map((c, i) => (
                  <div key={c.name} className="flex-between" style={{ padding: '4px 0', fontSize: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: COLORS[i % COLORS.length] }}/>
                      <span style={{ color: 'var(--text2)' }}>{c.name}</span>
                    </div>
                    <span style={{ fontWeight: 500 }}>{fmtHTG(c.value)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="two-col mt-24">
        {/* Recent transactions */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Transactions récentes</div>
            <button className="btn btn-ghost btn-sm" onClick={() => onNav('transactions')}>Voir tout</button>
          </div>
          {recent.length === 0 ? (
            <div className="empty-state" style={{padding:'20px 0'}}>
              <div className="empty-state-icon">📄</div>
              <div className="empty-state-text">Aucune transaction</div>
            </div>
          ) : (
            recent.map(tx => {
              const cat = getCat(tx.category);
              const isIncome = tx.txType === 'income';
              return (
                <div key={tx.id} className="flex-between" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--bg3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize: 16 }}>{cat.icon}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{tx.description}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>{cat.label}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className={isIncome ? 'tx-income' : 'tx-expense'}>{isIncome ? '+' : '-'}{fmtHTG(toHTG(Number(tx.amount), tx.currency, rate))}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>{tx.currency}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Savings goals mini */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Objectifs d'Épargne</div>
            <button className="btn btn-ghost btn-sm" onClick={() => onNav('savings')}>Voir tout</button>
          </div>
          {savingsProgress.length === 0 ? (
            <div className="empty-state" style={{padding:'20px 0'}}>
              <div className="empty-state-icon">🎯</div>
              <div className="empty-state-text">Aucun objectif défini</div>
            </div>
          ) : (
            savingsProgress.slice(0, 4).map(g => (
              <div key={g.id} style={{ marginBottom: 14 }}>
                <div className="flex-between" style={{ marginBottom: 5 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{g.name}</span>
                  <span style={{ fontSize: 12, color: 'var(--teal)' }}>{Math.round(g.pct)}%</span>
                </div>
                <div className="progress-track">
                  <div className={`progress-fill ${g.pct >= 100 ? 'safe' : g.pct >= 50 ? 'warn' : 'danger'}`} style={{ width: `${g.pct}%` }}/>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>
                  {fmtHTG(g.currentAmount || 0)} / {fmtHTG(g.targetAmount || 0)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
