import React, { useState } from 'react';
import './styles.css';
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
  {id:'dashboard',    label:'Tableau de Bord',    icon:'📊', group:'main'},
  {id:'accounts',     label:'Mes Comptes',         icon:'🏦', group:'main'},
  {id:'transactions', label:'Transactions',        icon:'📄', group:'main'},
  {id:'savings',      label:'Épargne & Objectifs', icon:'🎯', group:'planning'},
  {id:'loan',         label:'Simulateur de Prêt',  icon:'🧮', group:'planning'},
  {id:'settings',     label:'Paramètres',          icon:'⚙️', group:'system'},
];
const GROUPS = {main:'PRINCIPAL', planning:'PLANIFICATION', system:'SYSTÈME'};

export default function App() {
  const [clientId, setClientId] = useState(getClientId);
  const [page, setPage] = useState('dashboard');
  const ft = useFinTrack(clientId);

  if (!clientId) return <SetupWizard onClientIdSaved={id=>{localStorage.setItem('ft_client_id',id);setClientId(id);}} onLogin={()=>ft.login()} gapiReady={ft.gapiReady} error={ft.error} loading={ft.loading}/>;
  if (ft.authState==='loading') return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)',color:'var(--text2)',fontFamily:'var(--fb)'}}><div style={{textAlign:'center'}}><div style={{fontFamily:'var(--fd)',fontSize:'1.5rem',marginBottom:12}}>Fin<em style={{color:'var(--gold)',fontStyle:'normal'}}>Track</em></div><div>Chargement…</div></div></div>;
  if (ft.authState==='setup' && !ft.user) return <SetupWizard onClientIdSaved={id=>{localStorage.setItem('ft_client_id',id);setClientId(id);}} onLogin={()=>ft.login()} gapiReady={ft.gapiReady} error={ft.error} loading={ft.loading}/>;
  if (ft.authState==='setup' && ft.user) return <SheetConnect user={ft.user} onConnect={ft.connectSheet} onCreate={ft.createNewSheet} onLogout={ft.logout} loading={ft.loading} error={ft.error}/>;

  const renderedGroups = [];
  return (
    <div className="shell">
      <header className="topbar">
        <div className="logo">Fin<em>Track</em><span className="logo-badge">Haiti</span></div>
        {ft.syncing && <div className="syncing-dot" title="Sync..."/>}
        {ft.error && <div style={{fontSize:12,color:'var(--red)',background:'var(--red-bg)',padding:'4px 10px',borderRadius:6,border:'1px solid rgba(239,68,68,.2)',cursor:'pointer'}} onClick={()=>ft.setError(null)}>⚠ {ft.error} ✕</div>}
        <div className="topbar-right">
          <div className="rate-chip">1 USD = <b>{ft.settings?.usdToHtg||130} HTG</b></div>
          <span className="user-name" onClick={()=>setPage('settings')}>{(ft.user?.name||ft.user?.displayName||'').split(' ')[0]}</span>
          <img className="avatar" src={ft.user?.picture||ft.user?.photoURL} alt="" onClick={()=>setPage('settings')}/>
        </div>
      </header>
      <nav className="sidebar">
        {NAV.map(item=>{
          const sg=!renderedGroups.includes(item.group);
          if(sg) renderedGroups.push(item.group);
          return <React.Fragment key={item.id}>{sg&&<div className="nav-group-label" style={{marginTop:12}}>{GROUPS[item.group]}</div>}<div className={`nav-item ${page===item.id?'active':''}`} onClick={()=>setPage(item.id)}><span className="nav-icon">{item.icon}</span>{item.label}</div></React.Fragment>;
        })}
        <div className="nav-sheet-info">📊 Google Sheet<br/><a href={`https://docs.google.com/spreadsheets/d/${ft.spreadsheetId}/edit`} target="_blank" rel="noreferrer">{ft.spreadsheetId?.slice(0,22)}…</a></div>
      </nav>
      <main className="main">
        {page==='dashboard'    && <Dashboard accounts={ft.accounts} transactions={ft.transactions} savings={ft.savings} settings={ft.settings} onNav={setPage}/>}
        {page==='accounts'     && <Accounts accounts={ft.accounts} transactions={ft.transactions} settings={ft.settings} onAdd={ft.addAccount} onUpdate={ft.updateAccount} onDelete={ft.deleteAccount}/>}
        {page==='transactions' && <Transactions transactions={ft.transactions} accounts={ft.accounts} settings={ft.settings} onAdd={ft.addTransaction} onUpdate={ft.updateTransaction} onDelete={ft.deleteTransaction}/>}
        {page==='savings'      && <Savings savings={ft.savings} onAdd={ft.addSaving} onUpdate={ft.updateSaving} onDelete={ft.deleteSaving}/>}
        {page==='loan'         && <LoanSimulator settings={ft.settings}/>}
        {page==='settings'     && <Settings user={ft.user} settings={ft.settings} spreadsheetId={ft.spreadsheetId} onSave={ft.saveSetting} onLogout={ft.logout}/>}
      </main>
    </div>
  );
}
