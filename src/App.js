import React, { useState } from 'react';
import './styles.css';
import { LayoutDashboard, Wallet, ArrowLeftRight, Target, Calculator, Settings as Cog, TrendingUp, RefreshCw, PiggyBank, Menu } from 'lucide-react';
import useFinTrack from './hooks/useFinTrack';
import LoginScreen  from './components/LoginScreen';
import Dashboard     from './components/Dashboard';
import Accounts      from './components/Accounts';
import Transactions  from './components/Transactions';
import Savings       from './components/Savings';
import LoanSimulator from './components/LoanSimulator';
import InvestmentSimulator from './components/InvestmentSimulator';
import Settings      from './components/Settings';
const NAV = [
  {id:'dashboard',    label:'Tableau de Bord',    Icon:LayoutDashboard, group:'main'},
  {id:'accounts',     label:'Mes Comptes',         Icon:Wallet,          group:'main'},
  {id:'transactions', label:'Transactions',        Icon:ArrowLeftRight,  group:'main'},
  {id:'savings',      label:'Épargne & Objectifs', Icon:Target,          group:'planning'},
  {id:'loan',         label:'Simulateur de Prêt',  Icon:Calculator,      group:'planning'},
  {id:'investment',   label:'Simulation de Placement', Icon:PiggyBank,   group:'planning'},
  {id:'settings',     label:'Paramètres',          Icon:Cog,             group:'system'},
];
const GROUPS = {main:'PRINCIPAL', planning:'PLANIFICATION', system:'SYSTÈME'};
export default function App() {
  const [page, setPage] = useState('dashboard');
  const [navOpen, setNavOpen] = useState(false);
  const ft = useFinTrack();
  if (ft.authState==='loading') return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:'1.6rem',fontWeight:800,marginBottom:16,color:'var(--text)',fontFamily:'var(--fd)'}}>
          Fin<em style={{color:'var(--g1)',fontStyle:'normal'}}>Track</em>
        </div>
        <RefreshCw size={20} style={{color:'var(--text3)',animation:'spin 1s linear infinite'}}/>
        <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
  if (!ft.user) return <LoginScreen
    onLogin={()=>ft.login()}
    onLoginEmail={(email,pw)=>ft.loginWithEmail(email,pw)}
    onSignUp={(email,pw)=>ft.signUp(email,pw)}
    onForgotPassword={(email)=>ft.forgotPassword(email)}
    gapiReady={ft.gapiReady} error={ft.error} loading={ft.loading}/>;
  const renderedGroups = [];
  return (
    <div className="shell">
      <header className="topbar">
        <button className="menu-toggle" onClick={()=>setNavOpen(v=>!v)} aria-label="Menu">
          <Menu size={22}/>
        </button>
        <div className="logo" style={{fontWeight:800}}>
          <TrendingUp size={20} style={{color:'var(--g1)'}}/>
          Fin<em style={{fontStyle:'normal'}}>Track</em>
        </div>
        {ft.syncing && <div className="syncing-dot"/>}
        {ft.error && (
          <div onClick={()=>ft.setError(null)} style={{fontSize:12,color:'var(--red)',background:'var(--red-bg)',padding:'5px 12px',borderRadius:6,border:'1px solid rgba(229,62,62,.2)',cursor:'pointer',display:'flex',alignItems:'center',gap:6}}>
            ⚠ {ft.error.slice(0,50)}… ✕
          </div>
        )}
        <div className="topbar-right">
          <div className="rate-chip">
            <ArrowLeftRight size={11}/>
            1 USD = <b>{ft.settings?.usdToHtg||130} HTG</b>
          </div>
          <span className="user-name" onClick={()=>setPage('settings')}>
            {(ft.user?.name||ft.user?.displayName||'').split(' ')[0]}
          </span>
          <img className="avatar" src={ft.user?.picture||ft.user?.photoURL} alt="" onClick={()=>setPage('settings')}/>
        </div>
      </header>
      <div className={`sidebar-backdrop ${navOpen?'open':''}`} onClick={()=>setNavOpen(false)}/>
      <nav className={`sidebar ${navOpen?'open':''}`}>
        {NAV.map(({id,label,Icon,group})=>{
          const sg=!renderedGroups.includes(group);
          if(sg) renderedGroups.push(group);
          return (
            <React.Fragment key={id}>
              {sg && <div className="nav-group-label">{GROUPS[group]}</div>}
              <div className={`nav-item ${page===id?'active':''}`} onClick={()=>{setPage(id);setNavOpen(false);}}>
                <Icon size={16}/>{label}
              </div>
            </React.Fragment>
          );
        })}
      </nav>
      <main className="main">
        {page==='dashboard'    && <Dashboard    accounts={ft.accounts} transactions={ft.transactions} savings={ft.savings} settings={ft.settings} onNav={setPage}/>}
        {page==='accounts'     && <Accounts     accounts={ft.accounts} transactions={ft.transactions} settings={ft.settings} onAdd={ft.addAccount} onUpdate={ft.updateAccount} onDelete={ft.deleteAccount}/>}
        {page==='transactions' && <Transactions transactions={ft.transactions} accounts={ft.accounts} settings={ft.settings} onAdd={ft.addTransaction} onUpdate={ft.updateTransaction} onDelete={ft.deleteTransaction}/>}
        {page==='savings'      && <Savings      savings={ft.savings} onAdd={ft.addSaving} onUpdate={ft.updateSaving} onDelete={ft.deleteSaving}/>}
        {page==='loan'         && <LoanSimulator settings={ft.settings}/>}
        {page==='investment'   && <InvestmentSimulator settings={ft.settings}/>}
        {page==='settings'     && <Settings     user={ft.user} settings={ft.settings} onSave={ft.saveSetting} onLogout={ft.logout}/>}
      </main>
    </div>
  );
}
