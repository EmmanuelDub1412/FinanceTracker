import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

export default function Settings({ user, settings, onSave, onLogout }) {
  const { t, lang, setLang } = useLanguage();
  const [rate, setRate] = useState(settings?.usdToHtg || 130);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    await onSave('usdToHtg', Number(rate));
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <div className="ph">
        <div><div className="pt">{t('settings.title')}</div><div className="ps">{t('settings.subtitle')}</div></div>
      </div>
      <div className="card mb16">
        <div className="card-hd"><div className="card-title">👤 {t('settings.account')}</div></div>
        <div className="flex g12" style={{alignItems:'center',marginBottom:16}}>
          <img src={user?.picture||user?.photoURL} alt="" style={{width:52,height:52,borderRadius:'50%',border:'2px solid var(--gold2)'}}/>
          <div>
            <div style={{fontWeight:600}}>{user?.name||user?.displayName}</div>
            <div style={{color:'var(--text2)',fontSize:13}}>{user?.email}</div>
          </div>
        </div>
        <button className="btn btn-danger" onClick={onLogout}>{t('settings.logout')}</button>
      </div>
      <div className="card mb16">
        <div className="card-hd"><div className="card-title">{t('settings.storage')}</div></div>
        <div style={{fontSize:13,color:'var(--text2)'}}>{t('settings.storageText')}</div>
      </div>
      <div className="card mb16">
        <div className="card-hd"><div className="card-title">{t('settings.language')}</div></div>
        <div style={{fontSize:13,color:'var(--text2)',marginBottom:12}}>{t('settings.languageText')}</div>
        <div className="flex g8">
          <button className={`btn ${lang==='fr'?'btn-gold':'btn-ghost'}`} onClick={()=>setLang('fr')}>Français</button>
          <button className={`btn ${lang==='en'?'btn-gold':'btn-ghost'}`} onClick={()=>setLang('en')}>English</button>
        </div>
      </div>
      <div className="card mb16">
        <div className="card-hd"><div className="card-title">{t('settings.exchangeRate')}</div></div>
        <div className="fgrid" style={{maxWidth:380}}>
          <div className="fg">
            <label className="fl">{t('settings.rateLabel')}</label>
            <input className="fi" type="number" value={rate} onChange={e=>setRate(e.target.value)}/>
          </div>
          <button className="btn btn-gold" style={{alignSelf:'start'}} onClick={handleSave}>{saved?t('settings.saved'):t('settings.save')}</button>
        </div>
      </div>
      <div className="card">
        <div className="card-hd"><div className="card-title">{t('settings.privacy')}</div></div>
        <div style={{fontSize:13,color:'var(--text2)',lineHeight:2}}>
          <div>• {t('settings.privacyItem1')}</div>
        </div>
      </div>
    </div>
  );
}
