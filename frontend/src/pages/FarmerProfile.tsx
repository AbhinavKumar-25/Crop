import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Volume2, MapPin, Loader2, CloudRain, Sun, Sprout, 
  Thermometer, Droplets, CloudSun, TestTube2, Activity, Info, AlertCircle 
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { speakText, getDistricts, predictCrop, District, PredictionResult } from '../services/cropService';
import { cropDetails } from '../data/cropData';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../assets/logo.png';

const FarmerProfile: React.FC = () => {
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  
  // State Management
  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Stop audio when leaving the page
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // Fetch districts on mount
  useEffect(() => {
    const fetchDistricts = async () => {
      const data = await getDistricts();
      setDistricts(data);
    };
    fetchDistricts();
  }, []);

  const handlePredict = async () => {
    if (!selectedDistrict) return;
    setLoading(true);
    try {
      const data = await predictCrop(selectedDistrict);
      console.log("Data from backend:", data); // Add this line to debug!

      setResult(data);
      
    } catch (error) { 
      console.error(error); 
    }
    setLoading(false);
  };

  const handleSpeakAll = () => {
    if (!result) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const detail = cropDetails[result.crop.name];
    const text = language === 'hi' 
      ? `${result.crop.nameHi} के बारे में: ${detail?.descHi || result.crop.descriptionHi}. इसके मुख्य फायदे हैं: ${detail?.prosHi.join(", ")}. सावधानी: ${detail?.challengesHi}`
      : `About ${result.crop.name}: ${detail?.descEn || result.crop.description}. Key advantages include: ${detail?.prosEn.join(", ")}. Challenges: ${detail?.challengesEn}`;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'hi' ? 'hi-IN' : 'en-US';

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      {/* Master Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 border-b border-slate-100">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-600">
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-2">
              <img src={logo} alt="Logo" className="w-8 h-8 rounded-full object-contain" />
              <div>
                <h1 className="text-base font-black text-slate-900 leading-none">AGRI<span className="text-green-600">AI</span></h1>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Jharkhand</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/50">
            <button onClick={() => setLanguage('en')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${language === 'en' ? 'bg-white shadow-sm text-green-600' : 'text-slate-500'}`}>ENG</button>
            <button onClick={() => setLanguage('hi')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${language === 'hi' ? 'bg-white shadow-sm text-green-600' : 'text-slate-500'}`}>हिन्दी</button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Welcome Section */}
        <div className="text-center mb-4">
          <h2 className="text-2xl font-black text-slate-800 mb-2">
            {language === 'hi' ? 'नमस्ते किसान भाई!' : 'Welcome, Farmer!'}
          </h2>
          <p className="text-slate-500 font-medium text-sm italic">
            {language === 'hi' ? 'झारखंड की मिट्टी और मौसम के लिए सर्वश्रेष्ठ फसल चुनें' : 'Find the best crop for Jharkhand soil & weather'}
          </p>
        </div>

        {/* Input Card */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <MapPin size={14} className="text-green-600" /> {language === 'hi' ? 'अपना जिला चुनें' : 'Choose District'}
          </label>
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="w-full p-4 border border-slate-100 rounded-2xl bg-slate-50 text-sm font-bold outline-none focus:ring-4 focus:ring-green-500/10 appearance-none transition-all"
          >
            <option value="">-- {language === 'hi' ? 'जिला चुनें' : 'Select'} --</option>
            {districts.map((d) => (
              <option key={d.code} value={d.code}>{language === 'hi' ? d.nameHi : d.name}</option>
            ))}
          </select>
          <button
            onClick={handlePredict}
            disabled={!selectedDistrict || loading}
            className="w-full mt-6 bg-green-600 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-green-100 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:bg-slate-200"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Activity size={16} />}
            {loading ? (language === 'hi' ? 'खोज जारी है...' : 'Processing...') : (language === 'hi' ? 'फसल की सलाह लें' : 'Predict Best Crop')}
          </button>
        </div>

        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              
              {/* 1. MAIN CROP RESULT CARD */}
              <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-slate-100 relative">
<img 
  src={cropDetails[result.crop.name]?.image || result.crop.imageUrl} 
  className="w-full h-64 object-cover" 
  alt={result.crop.name} 
  onError={(e) => {
    // Final fallback if the link ever breaks
    e.currentTarget.src = "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&q=80&w=800";
  }}
/>                <div className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                         <span className="text-green-600 text-[10px] font-black uppercase tracking-widest">{language === 'hi' ? 'सुझाव' : 'Recommended Crop'}</span>
                         <span className="bg-green-50 text-green-700 text-[9px] font-bold px-2 py-0.5 rounded border border-green-100 uppercase">AI Verified</span>
                      </div>
                      <h2 className="text-5xl font-black text-slate-900 leading-tight">
                        {language === 'hi' ? result.crop.nameHi : result.crop.name}
                      </h2>
                    </div>
                    
                    {/* Audio Control Button */}
                    <button 
                      onClick={handleSpeakAll} 
                      className={`${isSpeaking ? 'bg-red-500 animate-pulse' : 'bg-green-600'} text-white p-5 rounded-full shadow-lg hover:scale-105 active:scale-90 transition-all`}
                    >
                      {isSpeaking ? <Activity size={28} /> : <Volume2 size={28} />}
                    </button>
                  </div>
                  
                  {/* Detailed Description */}
                  <div className="mb-8">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">About the Crop (फसल के बारे में)</h3>
                    <p className="text-slate-600 text-lg leading-relaxed font-medium">
                      {language === 'hi' ? (cropDetails[result.crop.name]?.descHi || result.crop.descriptionHi) : (cropDetails[result.crop.name]?.descEn || result.crop.description)}
                    </p>
                  </div>

                  {/* Pros & Challenges Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div className="bg-green-50 p-6 rounded-3xl border border-green-100">
                      <h4 className="text-green-800 font-black text-[10px] uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Sprout size={14} /> Advantages (फायदे)
                      </h4>
                      <ul className="space-y-2">
                        {(language === 'hi' ? cropDetails[result.crop.name]?.prosHi : cropDetails[result.crop.name]?.prosEn)?.map((p: string, i: number) => (
                          <li key={i} className="text-green-700 text-xs font-bold flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 shrink-0" /> {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100">
                      <h4 className="text-orange-800 font-black text-[10px] uppercase tracking-widest mb-3 flex items-center gap-2">
                        <AlertCircle size={14} /> Challenges (चुनौतियां)
                      </h4>
                      <p className="text-orange-700 text-xs font-bold leading-relaxed">
                        {language === 'hi' ? cropDetails[result.crop.name]?.challengesHi : cropDetails[result.crop.name]?.challengesEn}
                      </p>
                    </div>
                  </div>

                  {/* Maintenance */}
                  <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl shadow-slate-200">
                    <h3 className="font-black text-blue-400 mb-2 flex items-center gap-3 text-[10px] uppercase tracking-widest">
                      <Sun size={16} /> Maintenance Insight
                    </h3>
                    <p className="text-slate-200 text-sm font-medium">
                      {language === 'hi' ? result.crop.maintenanceHi : result.crop.maintenance}
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. SOIL STATUS CARD */}
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <TestTube2 size={14} className="text-green-600" /> {language === 'hi' ? 'मिट्टी की स्थिति' : 'Soil Nutrient Status'}
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Nitrogen (N)', val: result.soil.n, col: 'bg-green-50 text-green-700' },
                    { label: 'Phosphorus (P)', val: result.soil.p, col: 'bg-blue-50 text-blue-700' },
                    { label: 'Potassium (K)', val: result.soil.k, col: 'bg-orange-50 text-orange-700' },
                    { label: 'pH Level', val: result.soil.ph, col: 'bg-purple-50 text-purple-700' },
                  ].map((s, i) => (
                    <div key={i} className={`p-4 rounded-2xl flex flex-col items-center ${s.col} border border-transparent hover:border-current/10 transition-all`}>
                      <span className="text-[10px] font-bold uppercase opacity-70 mb-1">{s.label}</span>
                      <span className="text-xl font-black">{s.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. WEATHER FORECAST */}
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <CloudSun size={14} className="text-blue-500" /> 5-Day Environmental Forecast
                </h4>
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                  {result.forecast && result.forecast.map((w, i) => (
                    <div key={i} className="min-w-[115px] flex flex-col items-center p-5 rounded-3xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-lg transition-all group">
                      <span className="text-[9px] font-black text-slate-400 uppercase">{language === 'hi' ? w.dh : w.d}</span>
                      <div className="my-4 text-blue-500 group-hover:scale-110 transition-transform">
                        {w.c.includes('Rain') ? <CloudRain size={24} /> : <Sun size={24} />}
                      </div>
                      <span className="text-2xl font-black text-slate-800">{w.t}°</span>
                      <span className="text-[8px] font-bold text-slate-400 mt-1 uppercase text-center">{language === 'hi' ? w.ch : w.c}</span>
                    </div>
                  ))}
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default FarmerProfile;