import React, { createContext, useContext, useState, useCallback } from 'react';
import { translations } from './translations';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem('ft_lang') || 'fr');

  const setLang = useCallback((l) => {
    localStorage.setItem('ft_lang', l);
    setLangState(l);
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === 'fr' ? 'en' : 'fr');
  }, [lang, setLang]);

  // Lecture d'une cle du style "settings.title" dans le dictionnaire de la
  // langue active, avec repli sur le francais si la cle manque en anglais.
  const t = useCallback((key) => {
    const path = key.split('.');
    let node = translations[lang];
    for (const p of path) node = node?.[p];
    if (node === undefined) {
      let fallback = translations.fr;
      for (const p of path) fallback = fallback?.[p];
      return fallback ?? key;
    }
    return node;
  }, [lang]);

  // Traduit un id stable (categorie, type de compte, type d'objectif, etc.)
  // via un des sous-dictionnaires (categories, accountTypes, goalTypes...).
  const tId = useCallback((dict, id, fallbackLabel) => {
    const value = translations[lang]?.[dict]?.[id];
    return value ?? fallbackLabel ?? id;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t, tId }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage doit etre utilise a l\'interieur de <LanguageProvider>');
  return ctx;
}
