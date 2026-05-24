import React, { useState } from 'react';
import './styles.css';
import {
  LayoutDashboard, Wallet, ArrowLeftRight, Target,
  Calculator, Settings as SettingsIcon, TrendingUp, RefreshCw
} from 'lucide-react';
import useFinTrack from './hooks/useFinTrack';
import SetupWizard  from './components/SetupWizard';
import SheetConnect from './components/SheetConnect';
import Dashboard    from './components/Dashboard';
import Accounts     from './components/Accounts';
import Transactions from './components/Transactions';
import Savings      from './components/Savings';
import LoanSimulator from './components/LoanSimulator';
import Settings     from './components/Settings';

const getClientId = () => localStorage.getItem('ft_client_id') || '';

const NAV = [
  {id:'dashboard',    label:'Tableau de Bord',    Icon:LayoutDashboard, group:'main'},
  {id:'accounts',     label:'Mes Comptes',         Icon:Wallet,          group:'main'},
  {id:'transactions', label:'Transactions',        Icon:ArrowLeftRight,  group:'main'},
  {id:'savings',      label:'Épargne & Objectifs', Icon:Target,          group:'planning'},
  {id:'loan',         label:'Simulateur de Prêt',  Icon:Calculator,      group:'planning'},
  {id:'settings',     label:'Paramètres',          Icon:SettingsIcon,    group:'system'},
];
const GROUPS = {main:'PRINCIPAL', planning:'PLANIFICATION', system:'SYSTÈME'};

export default function App() {
  const [clientId, setClientId] = useState(getClientId);
  const [page, setPage] = useState('dashboard');
  const ft = useFinTrack(clientId);

  if (!clientId) return <SetupWizard
    onClientIdSaved={id=>{localStorage.setItem('ft_client_id',id);setClientId(id);}}
    onLogin={()=>ft.login()} gapiReady={ft.gapiReady} error={ft.error} loading={ft.loading}/>;

  if (ft.authState==='loading') return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontFamily:'var(--fd)',fontSize:'1.6rem',marginBottom:12,color:'var(--text)'}}>
          Fin<em style={{color:'var(--g1)',fontStyle:'normal'}}>Track</em>
        </div>
        <RefreshCw size={20} style={{color:'var(--text3)',animation:'spin 1s linear infinite'}}/>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  if (ft.authState==='setup' && !ft.user) return <SetupWizard
    onClientIdSaved={id=>{localStorage.setItem('ft_client_id',id);setClientId(id);}}
    onLogin={()=>ft.login()} gapiReady={ft.gapiReady} error={ft.error} loading={ft.loading}/>;

  if (ft.authState==='setup' && ft.user) return <SheetConnect
    user={ft.user} onConnect={ft.connectSheet} onCreate={ft.createNewSheet}
    onLogout={ft.logout} loading={ft.loading} error={ft.error}/>;

  const renderedGroups = [];

  return (
    <div className="shell">
      <header className="topbar">
        <div className="logo">
          <TrendingUp size={22} style={{color:'var(--g1)'}}/>
          Fin<em>Track</em>
          <span className="logo-badge">Haiti</span>
        </div>
        {ft.syncing && <RefreshCw size={14} className="syncing-dot" style={{animation:'spin 1s linear infinite',background:'transparent',borderRadius:0,width:'auto',height:'auto'}}/>}
        {ft.error && (
          <div style={{fontSize:12,color:'var(--red)',background:'var(--red-bg)',padding:'5px 12px',borderRadius:6,border:'1px solid rgba(255,82,82,.2)',cursor:'pointer',display:'flex',alignItems:'center',gap:6}} onClick={()=>ft.setError(null)}>
            ⚠ {ft.error.slice(0,60)}… ✕
          </div>
        )}
        <div className="topbar-right">
          <div className="rate-chip">
            <ArrowLeftRight size={12}/>
            1 USD = <b>{ft.settings?.usdToHtg||130} HTG</b>
          </div>
          <span className="user-name" onClick={()=>setPage('settings')}>
            {(ft.user?.name||ft.user?.displayName||'').split(' ')[0]}
          </span>
          <img className="avatar" src={ft.user?.picture||ft.user?.photoURL} alt="" onClick={()=>setPage('settings')}/>
        </div>
      </header>

      <nav className="sidebar">
        {NAV.map(({id,label,Icon,group})=>{
          const sg=!renderedGroups.includes(group);
          if(sg) renderedGroups.push(group);
          return (
            <React.Fragment key={id}>
              {sg && <div className="nav-group-label">{GROUPS[group]}</div>}
              <div className={`nav-item ${page===id?'active':''}`} onClick={()=>setPage(id)}>
                <Icon size={16}/>{label}
              </div>
            </React.Fragment>
          );
        })}
        <div className="nav-sheet-info">
          <div style={{marginBottom:4,color:'var(--text3)',fontSize:10,letterSpacing:1,textTransform:'uppercase'}}>Google Sheet</div>
          <a href={`https://docs.google.com/spreadsheets/d/${ft.spreadsheetId}/edit`} target="_blank" rel="noreferrer">
            {ft.spreadsheetId?.slice(0,24)}…
          </a>
        </div>
      </nav>

      <main className="main">
        {page==='dashboard'    && <Dashboard    accounts={ft.accounts} transactions={ft.transactions} savings={ft.savings} settings={ft.settings} onNav={setPage}/>}
        {page==='accounts'     && <Accounts     accounts={ft.accounts} transactions={ft.transactions} settings={ft.settings} onAdd={ft.addAccount} onUpdate={ft.updateAccount} onDelete={ft.deleteAccount}/>}
        {page==='transactions' && <Transactions transactions={ft.transactions} accounts={ft.accounts} settings={ft.settings} onAdd={ft.addTransaction} onUpdate={ft.updateTransaction} onDelete={ft.deleteTransaction}/>}
        {page==='savings'      && <Savings      savings={ft.savings} onAdd={ft.addSaving} onUpdate={ft.updateSaving} onDelete={ft.deleteSaving}/>}
        {page==='loan'         && <LoanSimulator settings={ft.settings}/>}
        {page==='settings'     && <Settings     user={ft.user} settings={ft.settings} spreadsheetId={ft.spreadsheetId} onSave={ft.saveSetting} onLogout={ft.logout}/>}
      </main>
    </div>
  );
}
