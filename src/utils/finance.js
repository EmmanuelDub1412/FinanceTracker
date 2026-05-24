export const fmtHTG = (n) =>
  new Intl.NumberFormat('fr-HT',{minimumFractionDigits:0,maximumFractionDigits:0}).format(n??0)+' HTG';
export const fmtUSD = (n) =>
  new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n??0);
export const fmt = (n, currency='HTG') => currency==='USD' ? fmtUSD(n) : fmtHTG(n);
export const toHTG = (amount, currency, rate) => currency==='USD' ? Number(amount)*rate : Number(amount);
export const today = () => new Date().toISOString().split('T')[0];

export const MONTHS_FR = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

export const computeBalance = (account, transactions) => {
  let balance = Number(account.initialBalance)||0;
  transactions
    .filter(t=>(t.debitAccount===account.id||t.creditAccount===account.id)&&t.status==='confirmed')
    .forEach(t=>{
      const amt = Number(t.amount)||0;
      if(t.creditAccount===account.id) balance+=amt;
      if(t.debitAccount===account.id)  balance-=amt;
    });
  return balance;
};

export const amortize = (principal, annualRate, months) => {
  const r = annualRate/100/12;
  if(!principal||!months) return {monthly:0,totalPayment:0,totalInterest:0,schedule:[]};
  if(r===0){
    const m=principal/months;
    return {monthly:m,totalPayment:principal,totalInterest:0,
      schedule:Array.from({length:months},(_,i)=>({month:i+1,payment:m,principal:m,interest:0,balance:principal-m*(i+1)}))};
  }
  const monthly=principal*(r*Math.pow(1+r,months))/(Math.pow(1+r,months)-1);
  let balance=principal; const schedule=[];
  for(let i=1;i<=months;i++){
    const interest=balance*r, princ=monthly-interest;
    balance-=princ;
    schedule.push({month:i,payment:monthly,principal:princ,interest,balance:Math.max(0,balance)});
  }
  return {monthly,totalPayment:monthly*months,totalInterest:monthly*months-principal,schedule};
};

export const compoundSavings = (initial,monthly,annualRate,months) => {
  const r=annualRate/100/12; let balance=initial; const schedule=[];
  for(let i=1;i<=months;i++){balance=balance*(1+r)+monthly;schedule.push({month:i,balance});}
  return schedule;
};

export const CATEGORIES = [
  {id:'REV-SAL',label:'Salaire / Honoraires',  type:'income',  icon:'💼'},
  {id:'REV-BIZ',label:'Revenus Affaires',       type:'income',  icon:'📊'},
  {id:'REV-DIV',label:'Autres Revenus',         type:'income',  icon:'💰'},
  {id:'DEP-ALI',label:'Alimentation',           type:'expense', icon:'🛒'},
  {id:'DEP-TRA',label:'Transport / Carburant',  type:'expense', icon:'⛽'},
  {id:'DEP-LOG',label:'Logement / Loyer',       type:'expense', icon:'🏠'},
  {id:'DEP-SAN',label:'Santé / Pharmacie',      type:'expense', icon:'💊'},
  {id:'DEP-EDU',label:'Éducation / Formation',  type:'expense', icon:'📚'},
  {id:'DEP-COM',label:'Communication',          type:'expense', icon:'📱'},
  {id:'DEP-LOI',label:'Loisirs / Sorties',      type:'expense', icon:'🎉'},
  {id:'DEP-HAB',label:'Habillement',            type:'expense', icon:'👔'},
  {id:'DEP-EEA',label:'Épargne / Investissement',type:'savings',icon:'🏦'},
  {id:'DEP-REM',label:'Remboursement Dettes',   type:'expense', icon:'💳'},
  {id:'DEP-DIV',label:'Dépenses Diverses',      type:'expense', icon:'📦'},
  {id:'TRF-INT',label:'Transfert Interne',      type:'transfer',icon:'🔄'},
];
export const getCat = (id) => CATEGORIES.find(c=>c.id===id)||{label:id||'—',icon:'•'};

export const ACCOUNT_TYPES = [
  {id:'bank',  label:'Banque',       icon:'🏦',color:'#2563EB'},
  {id:'credit',label:'Carte Crédit', icon:'💳',color:'#DC2626'},
  {id:'cash',  label:'Cash',         icon:'💵',color:'#16A34A'},
  {id:'saving',label:'Épargne',      icon:'🏧',color:'#7C3AED'},
];
export const getAccType = (id) => ACCOUNT_TYPES.find(a=>a.id===id)||ACCOUNT_TYPES[0];
