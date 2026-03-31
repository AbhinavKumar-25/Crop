import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'hi';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    'app.title': 'Jharkhand Crop Advisor',
    'profile.selection': 'Choose Your Profile',
    'profile.farmer': 'Farmer Profile',
    'profile.farmer.desc': 'Hindi language support with audio assistance',
    'profile.pro': 'Professional Profile',
    'profile.pro.desc': 'Detailed charts, maps, and multilingual support',
    'select.district': 'Select Your District',
    'predict.btn': 'Get Recommendation',
    'predicting': 'Analyzing Soil & Weather...',
    'recommendation': 'Recommended Crop',
    'confidence': 'Confidence Score',
    'soil.health': 'Soil Health Indicators',
    'weather.forecast': '5-Day Weather Forecast',
    'maintenance': 'Maintenance Tips',
    'pros': 'Advantages',
    'cons': 'Disadvantages',
    'back': 'Back',
    'listen': 'Listen to Audio',
    'language': 'Language',
  },
  hi: {
    'app.title': 'झारखंड फसल सलाहकार',
    'profile.selection': 'अपना प्रोफाइल चुनें',
    'profile.farmer': 'किसान प्रोफाइल',
    'profile.farmer.desc': 'ऑडियो सहायता के साथ हिंदी भाषा समर्थन',
    'profile.pro': 'प्रोफेशनल प्रोफाइल',
    'profile.pro.desc': 'विस्तृत चार्ट, मानचित्र और बहुभाषी समर्थन',
    'select.district': 'अपना जिला चुनें',
    'predict.btn': 'फसल की सलाह लें',
    'predicting': 'मिट्टी और मौसम का विश्लेषण किया जा रहा है...',
    'recommendation': 'अनुशंसित फसल',
    'confidence': 'भरोसा स्कोर',
    'soil.health': 'मिट्टी के स्वास्थ्य संकेतक',
    'weather.forecast': '5 दिनों का मौसम पूर्वानुमान',
    'maintenance': 'रखरखाव के टिप्स',
    'pros': 'फायदे',
    'cons': 'नुकसान',
    'back': 'पीछे',
    'listen': 'ऑडियो सुनें',
    'language': 'भाषा',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
