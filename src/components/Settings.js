import React, { useState } from 'react';

export default function Settings({ user, settings, spreadsheetId, onSave, onLogout }) {
  const [rate, setRate] = useState(settings?.usdToHtg || 130);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    await onSave('usdToHtg', Number(rate));
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const sheetUrl = spreadsheetId ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit` : null;

  return (
    <div>
      <div className="ph">
        <div><div className="pt">Paramètres</div><div className="ps">Configuration de FinTrack</div></div>
      </div>
      <div className="card mb16">
        <div className="card-hd"><div className="card-title">👤 Compte Google</div></div>
        <div className="flex g12" style={{alignItems:'center',marginBottom:16}}>
          <img src={user?.picture||user?.photoURL} alt="" style={{width:52,height:52,borderRadius:'50%',border:'2px solid var(--gold2)'}}/>
          <div>
            <div style={{fontWeight:600}}>{user?.name||user?.displayName}</div>
            <div style={{color:'var(--text2)',fontSize:13}}>{user?.email}</div>
          </div>
        </div>
        <button className="btn btn-danger" onClick={onLogout}>⎋ Déconnecter</button>
      </div>
      <div className="card mb16">
        <div className="card-hd"><div className="card-title">📊 Google Sheet connecté</div></div>
        <div style={{fontSize:13,color:'var(--text2)',marginBottom:10}}>Toutes vos données sont dans votre Google Drive personnel.</div>
        {sheetUrl ? (
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <code style={{background:'var(--bg3)',border:'1px solid var(--border)',padding:'6px 10px',borderRadius:6,fontSize:11,color:'var(--text2)',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{spreadsheetId}</code>
            <a href={sheetUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">📂 Ouvrir</a>
          </div>
        ) : <div style={{color:'var(--text3)',fontSize:13}}>Aucun Sheet connecté</div>}
      </div>
      <div className="card mb16">
        <div className="card-hd"><div className="card-title">💱 Taux de Change</div></div>
        <div className="fgrid" style={{maxWidth:380}}>
          <div className="fg">
            <label className="fl">1 USD = ___ HTG</label>
            <input className="fi" type="number" value={rate} onChange={e=>setRate(e.target.value)}/>
          </div>
          <button className="btn btn-gold" style={{alignSelf:'start'}} onClick={handleSave}>{saved?'✓ Sauvegardé !':'Sauvegarder'}</button>
        </div>
      </div>
      <div className="card">
        <div className="card-hd"><div className="card-title">🔒 Confidentialité</div></div>
        <div style={{fontSize:13,color:'var(--text2)',lineHeight:2}}>
          <div>• Vos données sont uniquement dans votre Google Sheet personnel</div>
          <div>• FinTrack ne stocke aucune donnée sur ses propres serveurs</div>
          <div>• L'app est open source et hébergée sur GitHub Pages</div>
        </div>
      </div>
    </div>
  );
}
