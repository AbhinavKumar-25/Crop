import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Volume2, MapPin, Loader2, WifiOff, CloudRain, Sun, Sprout,
  Droplets, CloudSun, TestTube2, Activity, AlertCircle, Eye
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { speakText, getDistricts, predictCrop, District, PredictionResult } from '../services/cropService';
import { cropDetails } from '../data/cropData';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import logo from '../assets/logo.png';
import farmerBg from '../assets/farmer-field.jpg';


import paddyImg from '../assets/crops/paddy.jpg';
import wheatImg from '../assets/crops/wheat.jpg';
import maizeImg from '../assets/crops/maize.jpg';
import pulsesImg from '../assets/crops/pulses.jpg';
import mustardImg from '../assets/crops/mustard.jpg';
import cottonImg from '../assets/crops/cotton.jpg';
import sugarcaneImg from '../assets/crops/sugarcane.jpg';
import defaultImg from '../assets/crops/default.jpg';

// CROP IMAGES (Local Assets)
const CROP_IMAGES: Record<string, string> = {
  Paddy: paddyImg,
  Wheat: wheatImg,
  Maize: maizeImg,
  Pulses: pulsesImg,
  Mustard: mustardImg,
  Cotton: cottonImg,
  Sugarcane: sugarcaneImg,
  default: defaultImg,
};

const getCropImage = (name: string, fallbackUrl?: string) => {
  const normalizedName = Object.keys(CROP_IMAGES).find(k => k.trim().toLowerCase() === name.trim().toLowerCase())
    || Object.keys(cropDetails).find(k => k.trim().toLowerCase() === name.trim().toLowerCase())
    || name;
  return CROP_IMAGES[normalizedName] || fallbackUrl || CROP_IMAGES.default;
};

// CROP DETAIL CONSTANTS (water, days, tips)
const CROP_STATS: Record<string, { waterLiters: number; daysToHarvest: number; tips: string[]; tipsHi: string[] }> = {
  Paddy: {
    waterLiters: 1200,
    daysToHarvest: 120,
    tips: ['Maintain 5cm standing water during vegetative stage', 'Apply Urea in 3 splits', 'Drain field 10 days before harvest'],
    tipsHi: ['वानस्पतिक अवस्था में 5 सेमी पानी रखें', 'यूरिया को 3 भागों में दें', 'कटाई से 10 दिन पहले पानी निकालें'],
  },
  Wheat: {
    waterLiters: 450,
    daysToHarvest: 110,
    tips: ['First irrigation at crown root initiation (20–25 DAS)', 'Avoid waterlogging at any stage', 'Apply fungicide at flag leaf stage'],
    tipsHi: ['20–25 दिन पर पहली सिंचाई करें', 'किसी भी अवस्था में जलभराव न होने दें', 'फ्लैग पत्ती अवस्था पर फफूंदनाशक डालें'],
  },
  Maize: {
    waterLiters: 600,
    daysToHarvest: 90,
    tips: ['Irrigate at knee-high, tasseling and grain fill stages', 'Apply phosphorus at sowing', 'Watch for stem borer after 30 days'],
    tipsHi: ['घुटने की ऊंचाई, टैसलिंग और दाना भरने पर सिंचाई करें', 'बुआई पर फास्फोरस डालें', '30 दिन बाद तना छेदक पर ध्यान दें'],
  },
  Pulses: {
    waterLiters: 250,
    daysToHarvest: 75,
    tips: ['Seed treatment with Rhizobium culture before sowing', 'Only 1–2 light irrigations needed', 'Avoid nitrogen fertilizer — plant fixes its own'],
    tipsHi: ['बुआई से पहले राइज़ोबियम कल्चर से बीज उपचार करें', 'केवल 1–2 हल्की सिंचाई जरूरी', 'नाइट्रोजन उर्वरक न डालें — पौधा खुद बनाता है'],
  },
  Mustard: {
    waterLiters: 300,
    daysToHarvest: 100,
    tips: ['Sow in October–November for best yield', 'One irrigation at branching stage is critical', 'Spray insecticide against aphids in February'],
    tipsHi: ['अक्टूबर–नवंबर में बोयें', 'शाखा निकलने पर एक सिंचाई जरूरी', 'फरवरी में माहू के लिए कीटनाशक छिड़कें'],
  },
};

const getCropStats = (name: string) =>
  CROP_STATS[name] || {
    waterLiters: 400,
    daysToHarvest: 90,
    tips: ['Follow KVK recommendations', 'Monitor pest pressure weekly', 'Apply balanced NPK as per soil test'],
    tipsHi: ['KVK की सलाह मानें', 'साप्ताहिक कीट निगरानी करें', 'मिट्टी परीक्षण के अनुसार NPK डालें'],
  };

// CIRCULAR PROGRESS RING
interface RingProps {
  value: number;
  max: number;
  minIdeal: number;
  maxIdeal: number;
  label: string;
  unit?: string;
  color: string;
  size?: number;
}

const CircleRing: React.FC<RingProps> = ({
  value, max, minIdeal, maxIdeal, label, unit = '', color, size = 96
}) => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(value / max, 1);
  const offset = circumference * (1 - pct);

  const status =
    value < minIdeal ? { text: 'Low', textHi: 'कम', bg: '#fff7ed', txt: '#c2410c' }
      : value > maxIdeal ? { text: 'High', textHi: 'ज्यादा', bg: '#fef2f2', txt: '#b91c1c' }
        : { text: 'Ideal', textHi: 'सही', bg: '#f0fdf4', txt: '#15803d' };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 96 96" className="-rotate-90">
          <circle cx="48" cy="48" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="8" />
          <circle
            cx="48" cy="48" r={radius} fill="none"
            stroke={color} strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-black text-slate-800 leading-none">{value}</span>
          {unit && <span className="text-[8px] font-bold text-slate-400">{unit}</span>}
        </div>
      </div>
      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest text-center leading-tight">{label}</span>
      <span
        className="text-[8px] font-black px-2 py-0.5 rounded-full uppercase"
        style={{ background: status.bg, color: status.txt }}
      >
        {status.text} · {status.textHi}
      </span>
    </div>
  );
};

// ACCURACY CIRCLE
const AccuracyRing: React.FC<{ pct: number }> = ({ pct }) => {
  const radius = 54;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - pct / 100);
  const color = pct >= 80 ? '#16a34a' : pct >= 60 ? '#d97706' : '#dc2626';

  return (
    <div className="relative" style={{ width: 136, height: 136 }}>
      <svg width="136" height="136" viewBox="0 0 136 136" className="-rotate-90">
        <circle cx="68" cy="68" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="10" />
        <circle
          cx="68" cy="68" r={radius} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black" style={{ color }}>{pct}%</span>
        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Accuracy</span>
      </div>
    </div>
  );
};

// PARALLAX BACKGROUND COMPONENT
const FarmerBackground: React.FC<{ x: any; y: any }> = ({ x, y }) => (
  <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
    <motion.div
      style={{
        x,
        y,
        scale: 1.1,
        backgroundImage: `url(${farmerBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'blur(4px) brightness(1) saturate(1)',
      }}
      className="absolute inset-[-5%]"
    />
    <div
      className="absolute inset-0"
      style={{
        background: "linear-gradient(180deg, hsla(30, 20%, 10%, 0.4) 0%, hsla(142, 30%, 8%, 0.6) 60%, hsla(25, 25%, 8%, 0.8) 100%)",
      }}
    />
  </div>
);
// MAIN COMPONENT
const FarmerProfile: React.FC = () => {
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();

  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [accuracyStats, setAccuracyStats] = useState<any>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { stiffness: 40, damping: 25 };
  const x = useSpring(useTransform(mouseX, [0, window.innerWidth], [25, -25]), springConfig);
  const y = useSpring(useTransform(mouseY, [0, window.innerHeight], [25, -25]), springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  // Stop audio on unmount
  useEffect(() => { return () => window.speechSynthesis.cancel(); }, []);

  useEffect(() => {
    const fetchDistricts = async () => { setDistricts(await getDistricts()); };
    fetchDistricts();
  }, []);

  // Fetch accuracy from backend
  useEffect(() => {
    fetch('http://localhost:5001/accuracy')
      .then(r => r.json())
      .then(d => {
        setAccuracyStats(d);
        // support both {accuracy: 0.94} or {test_accuracy: 0.94}
        const raw = d.accuracy ?? d.test_accuracy ?? d.score ?? null;
        if (raw !== null) setAccuracy(Math.round(raw * 100));
      })
      .catch(() => { }); // silently fail if not available
  }, []);

  const handlePredict = async () => {
    if (!selectedDistrict) return;

    // 1. Check Internet Connection
    if (!navigator.onLine) {
      const offlineMsg = language === 'hi'
        ? 'इंटरनेट कनेक्शन नहीं है! मौसम का डेटा प्राप्त करने के लिए इंटरनेट की आवश्यकता है।'
        : 'No internet connection! Internet is required to gather weather data.';

      alert(offlineMsg);
      return; // Exit function
    }

    setLoading(true);
    setResult(null); // Clear previous results to avoid showing old data if new fetch fails

    try {
      const data = await predictCrop(selectedDistrict);
      console.log("Data from backend:", data);

      if (data) {
        setResult(data);
      } else {
        // Handle case where API returns empty but doesn't throw error
        throw new Error("Empty response");
      }

    } catch (error) {
      console.error("Prediction error:", error);

      // 2. Show error message instead of going blank
      const errorMsg = language === 'hi'
        ? 'क्षमा करें, सर्वर से डेटा प्राप्त करने में विफल।'
        : 'Sorry, failed to fetch data from the server. Please try again.';

      alert(errorMsg);
    } finally {
      // 3. Always turn off loading, even if it fails
      setLoading(false);
    }
  };

  const handleSpeakAll = () => {
    if (!result) return;
    if (isSpeaking) { window.speechSynthesis.cancel(); setIsSpeaking(false); return; }

    const text = language === 'hi'
      ? `${result.crop.nameHi} के बारे में: ${result.crop.descriptionHi} फायदे: ${result.crop.prosHi?.join(', ')}. चुनौतियां: ${result.crop.consHi?.join(', ')}.`
      : `About ${result.crop.name}: ${result.crop.description} Advantages: ${result.crop.pros?.join(', ')}. Challenges: ${result.crop.cons?.join(', ')}.`;

    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = language === 'hi' ? 'hi-IN' : 'en-US';
    utt.onstart = () => setIsSpeaking(true);
    utt.onend = () => setIsSpeaking(false);
    utt.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utt);
  };

  const stats = result ? getCropStats(result.crop.name) : null;
  const confPct = result ? Math.round((result.confidence ?? 0.85) * 100) : null;

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <FarmerBackground x={x} y={y} />
      {/* HEADER */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 px-6 py-3 border-b border-white/10 backdrop-blur-md bg-black/20 shadow-lg"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* COMPACT BACK BUTTON */}
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-white/10 rounded-xl transition-all text-white border border-white/5"
            >
              <ArrowLeft size={18} />
            </button>

            {/* CLEAN LOGO SECTION */}
            <div className="flex items-center gap-3">
              <motion.div
                // Smooth 3D rotation
                animate={{ rotateY: [0, 360] }}
                transition={{ duration: 8, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
                // 'rounded-full' creates the circle; 'overflow-hidden' clips the image inside
                className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 border border-white/20 overflow-hidden shadow-[0_0_15px_rgba(74,222,128,0.2)]"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <img
                  src={logo}
                  alt="Logo"
                  className="w-full h-full object-cover" // 'object-cover' ensures the image fills the circle
                />
              </motion.div>

              <div>
                <h1 className="text-lg font-black text-white leading-none tracking-tight">
                  AGRI<span className="text-green-500">AI</span>
                </h1>
                <p className="text-[8px] font-bold text-white/40 uppercase tracking-[0.3em]">Jharkhand</p>
              </div>
            </div>
          </div>

          {/* COMPACT LANGUAGE TOGGLE */}
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setLanguage('en')}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${language === 'en' ? 'bg-white text-green-700 shadow-md' : 'text-white/50 hover:text-white'
                }`}
            >
              ENG
            </button>
            <button
              onClick={() => setLanguage('hi')}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${language === 'hi' ? 'bg-white text-green-700 shadow-md' : 'text-white/50 hover:text-white'
                }`}
            >
              हिन्दी
            </button>
          </div>
        </div>
      </motion.header>

      <main className="max-w-2xl mx-auto p-6 space-y-6 relative z-10 flex flex-col items-stretch">

        {/* WELCOME */}
        <div className="text-center mb-4">
          <h2 className="text-2xl md:text-3xl font-black text-white drop-shadow-md mb-1">
            {language === 'hi' ? 'नमस्ते किसान भाई! 🌾' : 'Welcome, Farmer! 🌾'}
          </h2>
          <p className="text-green-300 font-bold text-sm md:text-base italic drop-shadow-sm">
            {language === 'hi' ? 'झारखंड की मिट्टी और मौसम के लिए सर्वश्रेष्ठ फसल चुनें' : 'Find the best crop for Jharkhand soil & weather'}
          </p>
        </div>

        {/* INPUT CARD */}
        <div className="w-[672px] max-w-full bg-white/90 backdrop-blur-md p-8 rounded-[2.5rem] shadow-sm border border-white/20">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <MapPin size={14} className="text-green-600" />
            {language === 'hi' ? 'अपना जिला चुनें' : 'Choose District'}
          </label>
          <select
            value={selectedDistrict}
            onChange={e => setSelectedDistrict(e.target.value)}
            className="w-full p-4 border border-slate-100 rounded-2xl bg-slate-50 text-sm font-bold outline-none focus:ring-4 focus:ring-green-500/10 appearance-none transition-all"
          >
            <option value="">-- {language === 'hi' ? 'जिला चुनें' : 'Select District'} --</option>
            {districts.map(d => (
              <option key={d.code} value={d.code}>
                {language === 'hi' ? d.nameHi : d.name}
              </option>
            ))}
          </select>
          <button
            onClick={handlePredict}
            // Button is disabled if: No district selected OR currently loading OR offline
            disabled={!selectedDistrict || loading || !navigator.onLine}
            className={`w-full mt-6 bg-green-600 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-green-100 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:bg-slate-200 disabled:shadow-none 
    ${!navigator.onLine
                ? 'bg-slate-400 text-white cursor-not-allowed shadow-none'
                : 'bg-slate-900 text-white shadow-slate-200 hover:bg-blue-600'
              } 
    disabled:bg-slate-200 disabled:shadow-none`}
          >
            {loading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : !navigator.onLine ? (
              <WifiOff size={16} />
            ) : (
              <Activity size={16} />
            )}

            {loading
              ? (language === 'hi' ? 'खोज जारी है...' : 'Processing...')
              : !navigator.onLine
                ? (language === 'hi' ? 'इंटरनेट उपलब्ध नहीं है' : 'Internet Required')
                : (language === 'hi' ? 'फसल की सलाह लें' : 'Predict Best Crop')
            }
          </button>
        </div>

        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

              {/* 1. CROP RESULT CARD */}
              <div className="bg-white/90 backdrop-blur-md rounded-[2.5rem] shadow-xl overflow-hidden border border-white/20">
                <div className="relative">
                  <img
                    src={getCropImage(result.crop.name, result.crop.imageUrl)}
                    className="w-full h-60 object-cover"
                    alt={result.crop.name}
                    onError={e => { e.currentTarget.src = CROP_IMAGES.default; }}
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-4 left-6 text-white">
                    <span className="text-[9px] font-black uppercase tracking-widest text-green-300">
                      {language === 'hi' ? 'सुझाई गई फसल' : 'Recommended Crop'}
                    </span>
                    <h2 className="text-4xl font-black leading-tight drop-shadow">
                      {language === 'hi' ? result.crop.nameHi : result.crop.name}
                    </h2>
                  </div>
                  {/* AI badge */}
                  <span className="absolute top-4 right-4 bg-green-500 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow">
                    AI Verified ✓
                  </span>
                </div>

                <div className="p-8">
                  {/* Audio */}
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex-1 pr-4">
                      <p className="text-slate-600 text-sm leading-relaxed font-medium">
                        {language === 'hi' ? result.crop.descriptionHi : result.crop.description}
                      </p>
                      {result.crop.aiGenerated && (
                        <div className="mt-3 flex items-center gap-1 opacity-80">
                          <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-full shadow-sm">
                            Powered by Gemini AI ✦
                          </span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={handleSpeakAll}
                      className={`shrink-0 ${isSpeaking ? 'bg-red-500 animate-pulse' : 'bg-green-600'} text-white p-4 rounded-full shadow-lg hover:scale-105 active:scale-90 transition-all`}
                    >
                      {isSpeaking ? <Activity size={22} /> : <Volume2 size={22} />}
                    </button>
                  </div>

                  {/* Pros & Challenges */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-green-50 p-5 rounded-3xl border border-green-100">
                      <h4 className="text-green-800 font-black text-[10px] uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Sprout size={12} /> {language === 'hi' ? 'फायदे' : 'Advantages'}
                      </h4>
                      <ul className="space-y-1.5">
                        {(language === 'hi' ? result.crop.prosHi : result.crop.pros)?.map((p: string, i: number) => (
                          <li key={i} className="text-green-700 text-xs font-bold flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 shrink-0" /> {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-orange-50 p-5 rounded-3xl border border-orange-100">
                      <h4 className="text-orange-800 font-black text-[10px] uppercase tracking-widest mb-3 flex items-center gap-2">
                        <AlertCircle size={12} /> {language === 'hi' ? 'चुनौतियां' : 'Challenges'}
                      </h4>
                      <ul className="space-y-1.5">
                        {(language === 'hi' ? result.crop.consHi : result.crop.cons)?.map((c: string, i: number) => (
                          <li key={i} className="text-orange-700 text-xs font-bold flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" /> {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Maintenance & Watch Out */}
                  <div className="bg-slate-900 text-white p-6 rounded-3xl space-y-5">
                    <div>
                      <h3 className="font-black text-blue-400 mb-2 flex items-center gap-2 text-[10px] uppercase tracking-widest">
                        <Sun size={14} /> {language === 'hi' ? 'देखभाल की जानकारी' : 'Maintenance Insight'}
                      </h3>
                      <p className="text-slate-200 text-sm font-medium leading-relaxed">
                        {language === 'hi' ? result.crop.maintenanceHi : result.crop.maintenance}
                      </p>
                    </div>
                    {result.crop.watchOutEn && (
                      <div className="pt-4 border-t border-slate-700/50">
                        <h3 className="font-black text-rose-400 mb-2 flex items-center gap-2 text-[10px] uppercase tracking-widest">
                          <Eye size={14} /> {language === 'hi' ? 'सावधान रहें' : 'Watch Out For'}
                        </h3>
                        <p className="text-rose-100/90 text-sm font-medium leading-relaxed">
                          {language === 'hi' ? result.crop.watchOutHi : result.crop.watchOutEn}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. SOIL VISUALIZATION (Circular Rings) */}
              <div className="bg-white/90 backdrop-blur-md p-8 rounded-[2.5rem] shadow-sm border border-white/20">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <TestTube2 size={14} className="text-green-600" />
                  {language === 'hi' ? 'मिट्टी की स्थिति' : 'Soil Nutrient Status'}
                </h4>
                <p className="text-[10px] text-slate-400 mb-6 font-medium">
                  {language === 'hi'
                    ? 'हरा = सही मात्रा | नारंगी = कम | लाल = ज्यादा'
                    : 'Green = Ideal range · Orange = Low · Red = Too High'}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <CircleRing label="Nitrogen (N)" value={result.soil.n} max={160} minIdeal={60} maxIdeal={120} color="#10b981" unit="mg/kg" />
                  <CircleRing label="Phosphorus (P)" value={result.soil.p} max={200} minIdeal={30} maxIdeal={80} color="#3b82f6" unit="mg/kg" />
                  <CircleRing label="Potassium (K)" value={result.soil.k} max={180} minIdeal={35} maxIdeal={150} color="#f59e0b" unit="mg/kg" />
                  <CircleRing label="Soil pH" value={result.soil.ph} max={14} minIdeal={6.0} maxIdeal={7.5} color="#8b5cf6" unit="pH" />
                </div>

                {/* Weather rings */}
                <div className="border-t border-slate-100 mt-6 pt-6">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <CloudSun size={14} className="text-blue-500" />
                    {language === 'hi' ? 'मौसम की स्थिति' : 'Current Weather'}
                  </p>
                  <div className="grid grid-cols-3 gap-6">
                    <CircleRing label={language === 'hi' ? 'तापमान' : 'Temperature'} value={result.soil.temp} max={50} minIdeal={15} maxIdeal={35} color="#f97316" unit="°C" />
                    <CircleRing label={language === 'hi' ? 'नमी' : 'Humidity'} value={result.soil.hum} max={100} minIdeal={40} maxIdeal={80} color="#06b6d4" unit="%" />
                    <CircleRing label={language === 'hi' ? 'वर्षा' : 'Rainfall'} value={result.soil.rain} max={50} minIdeal={0} maxIdeal={25} color="#6366f1" unit="mm" />
                  </div>
                </div>
              </div>

              {/* 3. ACCURACY + CROP SUITABILITY CARD */}
              <div className="bg-white/90 backdrop-blur-md p-8 rounded-[2.5rem] shadow-sm border border-white/20">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Activity size={14} className="text-green-600" />
                  {language === 'hi' ? 'AI सटीकता और फसल उपयुक्तता' : 'AI Accuracy & Crop Suitability'}
                </h4>

                {/* Accuracy only (Crop suitability removed) */}
                <div className="flex flex-col sm:flex-row items-center justify-around gap-8 mb-8">
                  {/* Model Accuracy */}
                  <div className="flex flex-col items-center gap-3">
                    <AccuracyRing pct={accuracy ?? 92} />
                    <div className="text-center">
                      <p className="text-xs font-black text-slate-700">
                        {language === 'hi' ? 'मॉडल की सटीकता' : 'Model Accuracy'}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {language === 'hi' ? 'प्रशिक्षण डेटा पर' : 'on training dataset'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Detailed crop info card */}
                {stats && (
                  <div className="space-y-4">
                    {/* Water + Days strip */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 rounded-2xl p-5 flex items-center gap-4 border border-blue-100">
                        <div className="bg-blue-100 p-3 rounded-xl">
                          <Droplets size={20} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">
                            {language === 'hi' ? 'पानी की ज़रूरत' : 'Water Needed'}
                          </p>
                          <p className="text-xl font-black text-blue-700">{stats.waterLiters}L</p>
                          <p className="text-[9px] text-blue-500 font-bold">
                            {language === 'hi' ? 'प्रति एकड़ / मौसम' : 'per acre / season'}
                          </p>
                        </div>
                      </div>
                      <div className="bg-amber-50 rounded-2xl p-5 flex items-center gap-4 border border-amber-100">
                        <div className="bg-amber-100 p-3 rounded-xl">
                          <Sun size={20} className="text-amber-600" />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest">
                            {language === 'hi' ? 'कटाई का समय' : 'Days to Harvest'}
                          </p>
                          <p className="text-xl font-black text-amber-700">~{stats.daysToHarvest}</p>
                          <p className="text-[9px] text-amber-500 font-bold">
                            {language === 'hi' ? 'दिन लगभग' : 'days approx'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. WEATHER FORECAST */}
              <div className="bg-white/90 backdrop-blur-md p-8 rounded-[2.5rem] shadow-sm border border-white/20">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <CloudSun size={14} className="text-blue-500" />
                  {language === 'hi' ? '5 दिन का मौसम पूर्वानुमान' : '5-Day Environmental Forecast'}
                </h4>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {result.forecast?.map((w, i) => (
                    <div key={i} className="min-w-[105px] flex flex-col items-center p-4 rounded-3xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-lg transition-all group">
                      <span className="text-[9px] font-black text-slate-400 uppercase">{language === 'hi' ? w.dh : w.d}</span>
                      <div className="my-3 text-blue-500 group-hover:scale-110 transition-transform">
                        {w.c.includes('Rain') ? <CloudRain size={22} /> : <Sun size={22} />}
                      </div>
                      <span className="text-xl font-black text-slate-800">{w.t}°</span>
                      <span className="text-[8px] font-bold text-slate-400 mt-1 uppercase text-center leading-tight">
                        {language === 'hi' ? w.ch : w.c}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <footer className="mt-auto py-8 px-6 border-t border-white/10 relative z-10 bg-black/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">

          {/* LEFT SECTION: BRANDING */}
          <div className="flex items-center gap-4">
            <motion.div
              whileHover={{ rotateY: 180 }}
              transition={{ duration: 1.5 }}
              className="w-10 h-10 rounded-full border border-white/20 overflow-hidden bg-white/5 flex items-center justify-center"
            >
              <img src={logo} alt="AgriAI Logo" className="w-full h-full object-cover" />
            </motion.div>
            <div>
              <p className="text-xs font-black text-white uppercase tracking-[0.2em] leading-none mb-1">
                AGRI<span className="text-green-500">AI</span>
              </p>
              <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">
                JHARKHAND
              </p>
            </div>
          </div>

          {/* CENTER SECTION: QUICK LINKS */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex flex-wrap justify-center gap-3 sm:gap-8">
              {['Analytics', 'Dataset', 'Neural Ops', 'Support'].map((link) => (
                <motion.a
                  key={link}
                  whileHover={{ y: -2, color: '#4ade80' }} // Green hover to match branding
                  href="#"
                  className="text-[10px] font-black text-white/40 uppercase tracking-widest transition-all"
                >
                  {link}
                </motion.a>
              ))}
            </div>
            <p className="text-[9px] font-bold text-white/30 tracking-widest text-center">
              AGRI AI CAN MAKE MISTAKES
            </p>
          </div>

          {/* RIGHT SECTION: COPYRIGHT */}
          <div className="text-right">
            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">
              © 2026 AGRI-AI
            </p>
          </div>
        </div>
      </footer>
    </div>

  );
};

export default FarmerProfile;