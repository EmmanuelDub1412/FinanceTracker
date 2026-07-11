import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, ArrowDownCircle, ArrowUpCircle, Scale, Wallet, ArrowRight } from 'lucide-react';
import { fmtHTG, fmtUSD, toHTG, computeBalance, getCat } from '../utils/finance';
import { useLanguage } from '../i18n/LanguageContext';

const PIE_COLORS = ['#00C853','#2979FF','#00BFA5','#FFB300','#FF5252','#AA00FF','#FF6D00'];

export default function Dashboard({ accounts, transactions, savings, settings, onNav }) {
  const { t, tId, lang } = useLanguage();
  const MONTHS = t('months');
  const rate = Number(settings?.usdToHtg)||130;
  const now  = new Date();

  const balances = useMemo(()=>accounts.map(a=>({...a,balance:computeBalance(a,transactions)})),[accounts,transactions]);
  const totalNet = useMemo(()=>balances.reduce((s,a)=>s+toHTG(a.balance,a.currency,rate),0),[balances,rate]);

  const thisMonth = useMemo(()=>transactions.filter(t=>{
    const d=new Date(t.date);
    return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear()&&t.status==='confirmed';
  }),[transactions,now]);

  const income  = useMemo(()=>thisMonth.filter(t=>t.txType==='income').reduce((s,t)=>s+toHTG(Number(t.amount),t.currency,rate),0),[thisMonth,rate]);
  const expense = useMemo(()=>thisMonth.filter(t=>t.txType==='expense').reduce((s,t)=>s+toHTG(Number(t.amount),t.currency,rate),0),[thisMonth,rate]);
  const netMonth = income - expense;

  const monthlyData = useMemo(()=>Array.from({length:6},(_,i)=>{
    const d=new Date(now.getFullYear(),now.getMonth()-5+i,1);
    const m=d.getMonth(),y=d.getFullYear();
    const txs=transactions.filter(t=>{const td=new Date(t.date);return td.getMonth()===m&&td.getFullYear()===y&&t.status==='confirmed';});
    return {
      name:MONTHS[m],
      income:txs.filter(t=>t.txType==='income').reduce((s,t)=>s+toHTG(Number(t.amount),t.currency,rate),0),
      expense:txs.filter(t=>t.txType==='expense').reduce((s,t)=>s+toHTG(Number(t.amount),t.currency,rate),0),
    };
  }),[transactions,rate,now,MONTHS]);

  const catData = useMemo(()=>{
    const map={};
    thisMonth.filter(t=>t.txType==='expense').forEach(t=>{
      const k=tId('categories',t.category,getCat(t.category).label);
      map[k]=(map[k]||0)+toHTG(Number(t.amount),t.currency,rate);
    });
    return Object.entries(map).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value).slice(0,6);
  },[thisMonth,rate,tId]);

  const TT = ({active,payload,label})=>{
    if(!active||!payload?.length) return null;
    return <div className="ctt"><div style={{fontWeight:600,marginBottom:4}}>{label}</div>{payload.map(p=><div key={p.name} style={{color:p.color,marginTop:2}}>{p.name}: {fmtHTG(p.value)}</div>)}</div>;
  };

  return (
    <div>
      <div className="ph">
        <div>
          <div className="pt">{t('dashboard.title')}</div>
          <div className="ps">{now.toLocaleDateString(lang==='en'?'en-US':'fr-HT',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</div>
        </div>
        <button className="btn btn-primary" onClick={()=>onNav('transactions')}>
          <ArrowUpCircle size={15}/> {t('dashboard.newTx')}
        </button>
      </div>

      <div className="kpi-grid">
        <div className="kpi green">
          <div className="kpi-lbl"><Wallet size={11}/> {t('dashboard.netWorth')}</div>
          <div className="kpi-val green">{fmtHTG(totalNet)}</div>
          <div className="kpi-sub">{accounts.length} {accounts.length>1?t('dashboard.accounts'):t('dashboard.account')}</div>
          <div className="kpi-ico"><TrendingUp size={52}/></div>
        </div>
        <div className="kpi teal">
          <div className="kpi-lbl"><ArrowDownCircle size={11}/> {t('dashboard.incomeMonth')}</div>
          <div className="kpi-val teal">{fmtHTG(income)}</div>
          <div className="kpi-sub">{thisMonth.filter(t=>t.txType==='income').length} {t('dashboard.transactions')}</div>
        </div>
        <div className="kpi red">
          <div className="kpi-lbl"><ArrowUpCircle size={11}/> {t('dashboard.expenseMonth')}</div>
          <div className="kpi-val red">{fmtHTG(expense)}</div>
          <div className="kpi-sub">{thisMonth.filter(t=>t.txType==='expense').length} {t('dashboard.transactions')}</div>
        </div>
        <div className={`kpi ${netMonth>=0?'green':'red'}`}>
          <div className="kpi-lbl"><Scale size={11}/> {t('dashboard.netMonth')}</div>
          <div className={`kpi-val ${netMonth>=0?'green':'red'}`}>{fmtHTG(netMonth)}</div>
          <div className="kpi-sub">{income>0?Math.round(expense/income*100):0}{t('dashboard.pctSpent')}</div>
        </div>
      </div>

      <div className="twoW mb24">
        <div className="card">
          <div className="card-hd"><div className="card-title">{t('dashboard.flow6')}</div></div>
          <div style={{height:220}}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{top:4,right:4,left:0,bottom:0}}>
                <defs>
                  <linearGradient id="gi" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00C853" stopOpacity={.3}/><stop offset="95%" stopColor="#00C853" stopOpacity={0}/></linearGradient>
                  <linearGradient id="ge" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#FF5252" stopOpacity={.3}/><stop offset="95%" stopColor="#FF5252" stopOpacity={0}/></linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#3D6B50" fontSize={11} tickLine={false} axisLine={false}/>
                <YAxis stroke="#3D6B50" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v=>`${Math.round(v/1000)}k`}/>
                <Tooltip content={<TT/>}/>
                <Area type="monotone" dataKey="income"  name={t('dashboard.income')}  stroke="#00C853" strokeWidth={2} fill="url(#gi)"/>
                <Area type="monotone" dataKey="expense" name={t('dashboard.expense')} stroke="#FF5252" strokeWidth={2} fill="url(#ge)"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <div className="card-hd"><div className="card-title">{t('dashboard.byCategory')}</div></div>
          {catData.length===0
            ? <div className="empty" style={{padding:'20px 0'}}><div className="empty-ico"><TrendingDown size={36}/></div><div className="empty-txt">{t('dashboard.noExpense')}</div></div>
            : <>
                <div style={{height:130}}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart><Pie data={catData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3} dataKey="value">
                      {catData.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
                    </Pie><Tooltip formatter={v=>fmtHTG(v)}/></PieChart>
                  </ResponsiveContainer>
                </div>
                {catData.map((c,i)=>(
                  <div key={c.name} className="fb" style={{padding:'4px 0',fontSize:12}}>
                    <div className="flex g8"><div style={{width:8,height:8,borderRadius:2,background:PIE_COLORS[i%PIE_COLORS.length],flexShrink:0,marginTop:4}}/><span className="muted">{c.name}</span></div>
                    <span style={{fontWeight:600}}>{fmtHTG(c.value)}</span>
                  </div>
                ))}
              </>
          }
        </div>
      </div>

      <div className="two">
        <div className="card">
          <div className="card-hd">
            <div className="card-title">{t('dashboard.recentTx')}</div>
            <button className="btn btn-ghost btn-sm" onClick={()=>onNav('transactions')}>
              {t('dashboard.seeAll')} <ArrowRight size={12}/>
            </button>
          </div>
          {transactions.slice(0,6).length===0
            ? <div className="empty" style={{padding:'20px 0'}}><div className="empty-ico"><ArrowLeftRight size={36}/></div><div className="empty-txt">{t('dashboard.noTx')}</div></div>
            : transactions.slice(0,6).map(tx=>{
                const catLabel=tId('categories',tx.category,getCat(tx.category).label); const isIn=tx.txType==='income';
                return <div key={tx.id} className="fb" style={{padding:'10px 0',borderBottom:'1px solid var(--border)'}}>
                  <div className="flex g12">
                    <div className={`icon-circle ${isIn?'green':'red'}`}>
                      {isIn?<ArrowDownCircle size={16}/>:<ArrowUpCircle size={16}/>}
                    </div>
                    <div>
                      <div style={{fontSize:13,fontWeight:500}}>{tx.description}</div>
                      <div style={{fontSize:11,color:'var(--text3)'}}>{catLabel}</div>
                    </div>
                  </div>
                  <div className={isIn?'tx-in':'tx-out'} style={{fontFamily:'var(--fd)',fontSize:13}}>
                    {isIn?'+':'-'}{fmtHTG(toHTG(Number(tx.amount),tx.currency,rate))}
                  </div>
                </div>;
              })
          }
        </div>
        <div className="card">
          <div className="card-hd">
            <div className="card-title">{t('dashboard.savingsGoals')}</div>
            <button className="btn btn-ghost btn-sm" onClick={()=>onNav('savings')}>
              {t('dashboard.seeAll')} <ArrowRight size={12}/>
            </button>
          </div>
          {savings.length===0
            ? <div className="empty" style={{padding:'20px 0'}}><div className="empty-ico"><Target size={36}/></div><div className="empty-txt">{t('dashboard.noGoal')}</div></div>
            : savings.slice(0,4).map(g=>{
                const pct=Math.min(100,((Number(g.currentAmount)||0)/(Number(g.targetAmount)||1))*100);
                return <div key={g.id} style={{marginBottom:14}}>
                  <div className="fb" style={{marginBottom:5}}>
                    <span style={{fontSize:13,fontWeight:500}}>{g.name}</span>
                    <span className="gv" style={{fontSize:12,fontWeight:600}}>{Math.round(pct)}%</span>
                  </div>
                  <div className="prog-track"><div className={`prog-fill ${pct>=100?'ok':pct>=50?'warn':'danger'}`} style={{width:`${pct}%`}}/></div>
                  <div style={{fontSize:11,color:'var(--text3)',marginTop:3}}>
                    {fmtHTG(Number(g.currentAmount)||0)} / {fmtHTG(Number(g.targetAmount)||0)}
                  </div>
                </div>;
              })
          }
        </div>
      </div>
    </div>
  );
}

function ArrowLeftRight({size}){
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3 4 7l4 4"/><path d="M4 7h16"/><path d="m16 21 4-4-4-4"/><path d="M20 17H4"/></svg>;
}
function Target({size}){
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;
}
