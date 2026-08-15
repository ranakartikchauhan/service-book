import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './en';
import hi from './hi';

const translations = { en, hi };
const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    AsyncStorage.getItem('app_language').then((saved) => {
      if (saved && translations[saved]) {
        setLanguage(saved);
      }
    });
  }, []);

  const changeLanguage = async (newLang) => {
    if (translations[newLang]) {
      setLanguage(newLang);
      await AsyncStorage.setItem('app_language', newLang);
    }
  };

  const t = (key) => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  return useContext(LanguageContext);
}
