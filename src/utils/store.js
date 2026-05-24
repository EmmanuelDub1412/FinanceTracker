const KEYS = { accounts:'ft_accounts', transactions:'ft_transactions', savings:'ft_savings', settings:'ft_settings' };
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);
const read    = (k) => { try { return JSON.parse(localStorage.getItem(k)||'[]'); } catch { return []; } };
const readObj = (k, d) => { try { return JSON.parse(localStorage.getItem(k)||JSON.stringify(d)); } catch { return d; } };
const write   = (k, v) => localStorage.setItem(k, JSON.stringify(v));

export const getAccounts    = () => read(KEYS.accounts);
export const saveAccounts   = (l) => write(KEYS.accounts, l);
export const addAccount     = (a)    => { const l=getAccounts(); l.push({...a,id:uid(),createdAt:new Date().toISOString()}); saveAccounts(l); };
export const updateAccount  = (id,d) => saveAccounts(getAccounts().map(a=>a.id===id?{...a,...d}:a));
export const deleteAccount  = (id)   => saveAccounts(getAccounts().filter(a=>a.id!==id));

export const getTransactions   = () => read(KEYS.transactions).sort((a,b)=>b.date.localeCompare(a.date));
export const saveTransactions  = (l) => write(KEYS.transactions, l);
export const addTransaction    = (t)    => { const l=read(KEYS.transactions); l.push({...t,id:uid(),createdAt:new Date().toISOString()}); write(KEYS.transactions,l); };
export const updateTransaction = (id,d) => write(KEYS.transactions, read(KEYS.transactions).map(t=>t.id===id?{...t,...d}:t));
export const deleteTransaction = (id)   => write(KEYS.transactions, read(KEYS.transactions).filter(t=>t.id!==id));

export const getSavings    = () => read(KEYS.savings);
export const saveSavings   = (l) => write(KEYS.savings, l);
export const addSaving     = (g)    => { const l=getSavings(); l.push({...g,id:uid(),createdAt:new Date().toISOString()}); saveSavings(l); };
export const updateSaving  = (id,d) => saveSavings(getSavings().map(s=>s.id===id?{...s,...d}:s));
export const deleteSaving  = (id)   => saveSavings(getSavings().filter(s=>s.id!==id));

const DEF_SETTINGS = { usdToHtg:130, userName:'' };
export const getSettings  = ()  => readObj(KEYS.settings, DEF_SETTINGS);
export const saveSettings = (s) => write(KEYS.settings, {...getSettings(),...s});

export const exportData = () => {
  const data = { version:1, exportedAt:new Date().toISOString(), accounts:getAccounts(), transactions:getTransactions(), savings:getSavings(), settings:getSettings() };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
  a.download = `fintrack_backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
};

export const importData = (file) => new Promise((res,rej) => {
  const r = new FileReader();
  r.onload = e => {
    try {
      const d = JSON.parse(e.target.result);
      if(d.accounts)     saveAccounts(d.accounts);
      if(d.transactions) saveTransactions(d.transactions);
      if(d.savings)      saveSavings(d.savings);
      if(d.settings)     saveSettings(d.settings);
      res(d);
    } catch(err){ rej(new Error('Fichier invalide')); }
  };
  r.readAsText(file);
});

export const hasSeedData = () => getAccounts().length > 0;

export const seedDemoData = () => {
  const m = (n=0) => { const d=new Date(); d.setDate(d.getDate()-n); return d.toISOString().split('T')[0]; };
  saveAccounts([
    {id:'a1',name:'BUH – Compte HTG',type:'bank',currency:'HTG',initialBalance:45000,creditLimit:'',alertEnabled:true,alertThreshold:10000,notes:'',createdAt:new Date().toISOString()},
    {id:'a2',name:'Unibank – Compte HTG',type:'bank',currency:'HTG',initialBalance:28000,creditLimit:'',alertEnabled:false,alertThreshold:'',notes:'',createdAt:new Date().toISOString()},
    {id:'a3',name:'Unibank – Compte USD',type:'bank',currency:'USD',initialBalance:350,creditLimit:'',alertEnabled:false,alertThreshold:'',notes:'',createdAt:new Date().toISOString()},
    {id:'a4',name:'Sogebank – Compte HTG',type:'bank',currency:'HTG',initialBalance:12000,creditLimit:'',alertEnabled:false,alertThreshold:'',notes:'',createdAt:new Date().toISOString()},
    {id:'a5',name:'Unicarte HTG',type:'credit',currency:'HTG',initialBalance:0,creditLimit:140000,alertEnabled:true,alertThreshold:20000,notes:'Limite 140,000 HTG',createdAt:new Date().toISOString()},
    {id:'a6',name:'BUH Mastercard',type:'credit',currency:'HTG',initialBalance:0,creditLimit:75000,alertEnabled:true,alertThreshold:15000,notes:'Limite 75,000 HTG',createdAt:new Date().toISOString()},
    {id:'a7',name:'Cash HTG',type:'cash',currency:'HTG',initialBalance:8500,creditLimit:'',alertEnabled:false,alertThreshold:'',notes:'',createdAt:new Date().toISOString()},
    {id:'a8',name:'Cash USD',type:'cash',currency:'USD',initialBalance:80,creditLimit:'',alertEnabled:false,alertThreshold:'',notes:'',createdAt:new Date().toISOString()},
  ]);
  write(KEYS.transactions, [
    {id:'t1',date:m(1),description:'Salaire',category:'REV-SAL',txType:'income',creditAccount:'a1',debitAccount:'',amount:85000,currency:'HTG',status:'confirmed',createdAt:new Date().toISOString()},
    {id:'t2',date:m(2),description:'Courses Hypérion',category:'DEP-ALI',txType:'expense',debitAccount:'a7',creditAccount:'',amount:4800,currency:'HTG',status:'confirmed',createdAt:new Date().toISOString()},
    {id:'t3',date:m(3),description:'Carburant',category:'DEP-TRA',txType:'expense',debitAccount:'a7',creditAccount:'',amount:3200,currency:'HTG',status:'confirmed',createdAt:new Date().toISOString()},
    {id:'t4',date:m(4),description:'Natcom Internet',category:'DEP-COM',txType:'expense',debitAccount:'a1',creditAccount:'',amount:2500,currency:'HTG',status:'confirmed',createdAt:new Date().toISOString()},
    {id:'t5',date:m(5),description:'Loyer',category:'DEP-LOG',txType:'expense',debitAccount:'a1',creditAccount:'',amount:18000,currency:'HTG',status:'confirmed',createdAt:new Date().toISOString()},
    {id:'t6',date:m(6),description:'Pharmacie',category:'DEP-SAN',txType:'expense',debitAccount:'a5',creditAccount:'',amount:1800,currency:'HTG',status:'confirmed',createdAt:new Date().toISOString()},
    {id:'t7',date:m(7),description:'Consultation client',category:'REV-BIZ',txType:'income',creditAccount:'a3',debitAccount:'',amount:250,currency:'USD',status:'confirmed',createdAt:new Date().toISOString()},
    {id:'t8',date:m(8),description:'Épargne Maison',category:'DEP-EEA',txType:'savings',debitAccount:'a1',creditAccount:'',amount:10000,currency:'HTG',status:'confirmed',createdAt:new Date().toISOString()},
    {id:'t9',date:m(9),description:'Restaurant',category:'DEP-LOI',txType:'expense',debitAccount:'a5',creditAccount:'',amount:3500,currency:'HTG',status:'confirmed',createdAt:new Date().toISOString()},
    {id:'t10',date:m(10),description:'Habillement',category:'DEP-HAB',txType:'expense',debitAccount:'a5',creditAccount:'',amount:5200,currency:'HTG',status:'confirmed',createdAt:new Date().toISOString()},
  ]);
  saveSavings([
    {id:'s1',name:"Fonds d'urgence",icon:'🛡️',targetAmount:300000,currentAmount:85000,currency:'HTG',monthlyContrib:10000,annualRate:5,targetDate:'',notes:'',createdAt:new Date().toISOString()},
    {id:'s2',name:'Voyage famille',icon:'✈️',targetAmount:150000,currentAmount:32000,currency:'HTG',monthlyContrib:8000,annualRate:4,targetDate:'',notes:'',createdAt:new Date().toISOString()},
    {id:'s3',name:'Achat voiture',icon:'🚗',targetAmount:800000,currentAmount:120000,currency:'HTG',monthlyContrib:15000,annualRate:5,targetDate:'',notes:'',createdAt:new Date().toISOString()},
  ]);
};
