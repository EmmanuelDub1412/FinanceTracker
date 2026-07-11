import React, { useState } from 'react';

export default function Settings({ user, settings, onSave, onLogout }) {
  const [rate, setRate] = useState(settings?.usdToHtg || 130);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    await onSave('usdToHtg', Number(rate));
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

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
        <div className="card-hd"><div className="card-title">☁️ Stockage des données</div></div>
        <div style={{fontSize:13,color:'var(--text2)'}}>Vos données sont stockées de façon sécurisée et privée, accessibles uniquement depuis votre compte.</div>
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
          <div>• Vos données sont isolées par compte, personne d'autre n'y a accès</div>
          <div>• La connexion se fait uniquement via votre compte Google, sans mot de passe séparé</div>
          <div>• L'app est hébergée sur GitHub Pages</div>
        </div>
      </div>
    </div>
  );
}
