import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Loader2, WifiOff, BarChart3, CloudSun, Sprout, Leaf,
  Globe, Droplets, Thermometer, Activity, CloudRain, Download,
  Sun, AlertCircle, CheckCircle2
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { predictCrop, PredictionResult, getDistricts, getAccuracy, District } from '../services/cropService';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie,
  RadarChart, PolarGrid, PolarAngleAxis, Radar, PolarRadiusAxis
} from 'recharts';
import logo from '../assets/logo.png';
import farmerBg from "../assets/farmer-field.jpg";
import { cropDetails } from '../data/cropData';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

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

// SOIL GAUGE (semicircle, recharts PieChart)
const SoilGauge = ({ value, label, color, max, minIdeal, maxIdeal }: {
  value: number; label: string; color: string;
  max: number; minIdeal: number; maxIdeal: number;
}) => {
  const data = [{ value }, { value: max - value }];
  const status =
    value < minIdeal ? { text: 'Low', classes: 'text-orange-600 bg-orange-50 border-orange-100' }
      : value > maxIdeal ? { text: 'High', classes: 'text-red-600 bg-red-50 border-red-100' }
        : { text: 'Ideal', classes: 'text-green-600 bg-green-50 border-green-100' };

  return (
    <div className="flex flex-col items-center bg-white pt-6 pb-4 px-2 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all">
      <div className="h-24 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="100%" startAngle={180} endAngle={0}
              innerRadius={45} outerRadius={65} paddingAngle={0} dataKey="value" stroke="none">
              <Cell fill={color} />
              <Cell fill="#f1f5f9" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-end justify-center pb-1">
          <span className="text-xl font-black text-slate-800">{value}</span>
        </div>
      </div>
      <div className="mt-4 flex flex-col items-center gap-2 w-full">
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center px-2 leading-tight">{label}</span>
        <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tight border ${status.classes}`}>
          {status.text}
        </div>
      </div>
    </div>
  );
};

// ACCURACY RING
const AccuracyRing: React.FC<{ pct: number; label: string; sublabel: string }> = ({ pct, label, sublabel }) => {
  const radius = 50;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - pct / 100);
  const color = pct >= 80 ? '#16a34a' : pct >= 60 ? '#d97706' : '#dc2626';

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: 128, height: 128 }}>
        <svg width="128" height="128" viewBox="0 0 128 128" className="-rotate-90">
          <circle cx="64" cy="64" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="10" />
          <circle cx="64" cy="64" r={radius} fill="none"
            stroke={color} strokeWidth="10"
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black" style={{ color }}>{pct}%</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs font-black text-slate-700">{label}</p>
        <p className="text-[9px] text-slate-400 font-medium">{sublabel}</p>
      </div>
    </div>
  );
};

// CROP STATS
const CROP_STATS: Record<string, { waterLiters: number; daysToHarvest: number; tips: string[] }> = {
  Paddy: { waterLiters: 1200, daysToHarvest: 120, tips: ['Maintain 5cm standing water', 'Apply Urea in 3 splits', 'Drain 10 days before harvest'] },
  Wheat: { waterLiters: 450, daysToHarvest: 110, tips: ['Irrigate at 20–25 DAS', 'Avoid waterlogging', 'Fungicide at flag leaf stage'] },
  Maize: { waterLiters: 600, daysToHarvest: 90, tips: ['Irrigate at tasseling & grain fill', 'Phosphorus at sowing', 'Monitor for stem borer after 30 days'] },
  Pulses: { waterLiters: 250, daysToHarvest: 75, tips: ['Rhizobium seed treatment', 'Only 1–2 light irrigations', 'Skip nitrogen fertilizer'] },
  Mustard: { waterLiters: 300, daysToHarvest: 100, tips: ['Sow Oct–Nov', 'Critical irrigation at branching', 'Spray insecticide for aphids in Feb'] },
};
const getCropStats = (name: string) =>
  CROP_STATS[name] || { waterLiters: 400, daysToHarvest: 90, tips: ['Follow KVK recommendations', 'Weekly pest monitoring', 'Apply balanced NPK'] };

// MAIN COMPONENT
const ProfessionalProfile: React.FC = () => {
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();

  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [accuracyStats, setAccuracyStats] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // MOUSE PARALLAX LOGIC
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

  const radarData = result ? [
    { subject: 'Temperature', A: (result.soil.temp / 50) * 100, fullMark: 100 },
    { subject: 'Humidity', A: result.soil.hum, fullMark: 100 },
    { subject: 'Rainfall', A: (result.soil.rain / 300) * 100, fullMark: 100 },
    { subject: 'Soil pH', A: (result.soil.ph / 14) * 100, fullMark: 100 },
    { subject: 'N-P-K Avg', A: ((result.soil.n + result.soil.p + result.soil.k) / 450) * 100, fullMark: 100 },
  ] : [];

  useEffect(() => {
    getDistricts().then(setDistricts);
    getAccuracy()
      .then(d => {
        setAccuracyStats(d);
        const raw = d.accuracy ?? d.test_accuracy ?? d.score ?? null;
        if (raw !== null) setAccuracy(Math.round(raw * 100));
      })
      .catch(() => { });
  }, []);

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(reportRef.current, {
        cacheBust: true,
        backgroundColor: '#0a0d0a',
        pixelRatio: 2
      });

      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => { img.onload = resolve; });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (img.height * pdfWidth) / img.width;

      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`AgriAI_Analysis.pdf`);
    } catch (error: any) {
      console.error("PDF Export Error:", error);
      alert(`Failed to export PDF: ${error?.message || String(error)}`);
    } finally {
      setIsExporting(false);
    }
  };

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
  const nutrientData = result ? [
    { name: 'N', value: result.soil.n, color: '#10b981', full: 'Nitrogen' },
    { name: 'P', value: result.soil.p, color: '#3b82f6', full: 'Phosphorus' },
    { name: 'K', value: result.soil.k, color: '#f59e0b', full: 'Potassium' },
  ] : [];

  const confPct = result ? Math.round((result.confidence ?? 0.85) * 100) : null;
  const cropStat = result ? getCropStats(result.crop.name) : null;

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#0a0d0a]">

      {/* BACKGROUND LAYER */}
      <div className="absolute inset-0 z-0">
        <motion.div
          className="absolute inset-[-5%]"
          style={{
            x,
            y,
            scale: 1.1,
            backgroundImage: `url(${farmerBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(4px) brightness(1) saturate(1)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(180deg, hsla(30, 20%, 10%, 0.4) 0%, hsla(142, 30%, 8%, 0.6) 60%, hsla(25, 25%, 8%, 0.8) 100%)",
          }}
        />
      </div>

      {/* HEADER */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 px-6 py-3 border-b border-white/10 backdrop-blur-md bg-black/20 shadow-lg"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-white/10 rounded-xl transition-all text-white border border-white/5"
            >
              <ArrowLeft size={18} />
            </button>

            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotateY: [0, 360] }}
                transition={{ duration: 8, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 border border-white/20 overflow-hidden shadow-[0_0_15px_rgba(74,222,128,0.2)]"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <img
                  src={logo}
                  alt="Logo"
                  className="w-full h-full object-cover"
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

      <main className="flex-grow max-w-7xl mx-auto w-full p-4 sm:p-8 flex flex-col gap-8 sm:gap-10 relative z-10">

        {/* TOP CENTERED INPUT */}
        <div className="flex justify-center w-full">
          <div className="w-full max-w-xl bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <Globe size={14} /> Dataset Parameters
            </h2>
            <select
              value={selectedDistrict}
              onChange={e => setSelectedDistrict(e.target.value)}
              className="w-full p-4 border border-slate-100 rounded-2xl bg-slate-50 text-sm font-bold outline-none mb-4 focus:ring-4 focus:ring-blue-500/10 appearance-none transition-all"
            >
              <option value="">-- {language === 'hi' ? 'जिला चुनें' : 'Choose District'} --</option>
              {districts.map(d => (
                <option key={d.code} value={d.code}>{language === 'hi' ? d.nameHi : d.name}</option>
              ))}
            </select>
            <button
              onClick={handlePredict}
              // Disable if no district, if loading, OR if offline
              disabled={!selectedDistrict || loading || !navigator.onLine}
              className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95 
    ${!navigator.onLine
                  ? 'bg-slate-400 text-white cursor-not-allowed shadow-none'
                  : 'bg-slate-900 text-white shadow-slate-200 hover:bg-blue-600'
                } 
    disabled:bg-slate-200 disabled:shadow-none`}
            >
              {/* Icon Logic */}
              {loading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : !navigator.onLine ? (
                <WifiOff size={16} />
              ) : (
                <Activity size={16} />
              )}

              {/* Text Logic */}
              {loading
                ? (language === 'hi' ? 'खोज जारी है...' : 'Analyzing...')
                : !navigator.onLine
                  ? (language === 'hi' ? 'इंटरनेट उपलब्ध नहीं है' : 'Internet Required')
                  : (language === 'hi' ? 'फसल विश्लेषण चलाएं' : 'Run ML Analysis')
              }
            </button>
          </div>
        </div>

        {/* MAIN DASHBOARD (FULL WIDTH) */}
        <AnimatePresence mode="wait">
          {!result ? (
            <div className="w-full min-h-[300px] border-2 border-dashed border-white/20 bg-white/5 backdrop-blur-sm rounded-[3.5rem] flex flex-col items-center justify-center text-white/50">
              <BarChart3 size={48} className="mb-4 opacity-20" />
              <p className="font-black uppercase tracking-[0.3em] text-[10px]">Select a District to Begin Analysis</p>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="w-full">
              <div className="flex justify-end mb-4">
                <button
                  onClick={handleExportPDF}
                  disabled={isExporting}
                  className="flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest hover:bg-green-600 transition-all shadow-lg"
                >
                  {isExporting ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />}
                  {language === 'hi' ? 'पीडीएफ डाउनलोड करें' : 'Export Report'}
                </button>
              </div>
              <div ref={reportRef} className="space-y-10 w-full rounded-[3.5rem] p-4 sm:p-2 bg-[#0a0d0a]">
                {/* HERO CROP CARD */}
                <div className="bg-white rounded-[2.5rem] border border-blue-50 shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[300px]">
                  <div className="relative w-full md:w-2/5 h-64 md:h-auto">
                    <img
                      src={getCropImage(result.crop.name, result.crop.imageUrl)}
                      className="w-full h-full object-cover"
                      alt={result.crop.name}
                      onError={e => { e.currentTarget.src = CROP_IMAGES.default; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/60 to-transparent" />
                    <span className="absolute top-4 left-4 md:top-6 md:left-6 bg-green-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                      AI Verified ✓
                    </span>
                  </div>
                  <div className="p-8 md:p-12 md:w-3/5 flex flex-col justify-center">
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">Model Output</p>
                    <h3 className="text-4xl lg:text-5xl font-black text-slate-900 leading-tight">
                      {language === 'hi' ? result.crop.nameHi : result.crop.name}
                    </h3>
                    <div className="mt-6 p-5 bg-slate-50 rounded-3xl border border-slate-100">
                      <p className="text-slate-600 text-sm leading-relaxed italic">
                        {language === 'hi' ? result.crop.descriptionHi : result.crop.description}
                      </p>
                      {result.crop.aiGenerated && (
                        <div className="mt-4 flex items-center gap-1">
                          <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-full shadow-sm inline-flex">
                            Powered by Groq ✦
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 w-full">
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-5 border border-green-100 flex items-center gap-4 relative overflow-hidden">
                        <div className="absolute right-0 top-0 opacity-10">
                          <Sprout size={64} className="text-green-500" />
                        </div>
                        <div className="bg-white p-2 rounded-xl shadow-sm z-10 shrink-0">
                          <Leaf size={24} className="text-green-600" />
                        </div>
                        <div className="z-10">
                          <p className="text-[10px] font-black text-green-500 uppercase tracking-widest mb-1">
                            {language === 'hi' ? 'स्मार्ट कृषि' : 'Smart Agriculture'}
                          </p>
                          <p className="text-sm font-bold text-slate-800 leading-snug">
                            {language === 'hi'
                              ? result.crop.sloganHi
                              : result.crop.sloganEn}
                          </p>
                        </div>
                      </div>
                    </div>


                  </div>
                </div>

                {/* 1. SOIL GAUGE GRID */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <SoilGauge label="Nitrogen (N)" value={result.soil.n} color="#10b981" max={140} minIdeal={40} maxIdeal={100} />
                  <SoilGauge label="Phosphorus (P)" value={result.soil.p} color="#3b82f6" max={200} minIdeal={30} maxIdeal={80} />
                  <SoilGauge label="Potassium (K)" value={result.soil.k} color="#f59e0b" max={160} minIdeal={35} maxIdeal={150} />
                  <SoilGauge label="Soil pH" value={result.soil.ph} color="#8b5cf6" max={14} minIdeal={6.0} maxIdeal={7.5} />
                </div>

                {/* 2. NPK BAR + CLIMATE */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">N-P-K Concentration</h4>
                      <Download size={14} className="text-slate-300 cursor-pointer" />
                    </div>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={nutrientData}>
                          <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="full" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }} />
                          <YAxis hide />
                          <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }} />
                          <Bar dataKey="value" radius={[10, 10, 10, 10]} barSize={40}>
                            {nutrientData.map((e, i) => <Cell key={i} fill={e.color} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col justify-center">
                    <div className="absolute top-0 right-0 p-8 opacity-10"><CloudSun size={120} /></div>
                    <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-8">Live Environmental Data</h4>
                    <div className="space-y-5">
                      {[
                        { icon: <Thermometer className="text-orange-400" size={18} />, label: 'Avg Temperature', val: `${result.soil.temp}°C` },
                        { icon: <Droplets className="text-blue-400" size={18} />, label: 'Humidity Level', val: `${result.soil.hum}%` },
                        { icon: <CloudSun className="text-indigo-400" size={18} />, label: 'Total Rainfall', val: `${result.soil.rain}mm` },
                      ].map((r, i) => (
                        <div key={i} className={`flex items-center justify-between ${i === 2 ? 'border-t border-white/10 pt-5' : ''}`}>
                          <div className="flex items-center gap-3">{r.icon}<span className="text-sm font-bold text-slate-300">{r.label}</span></div>
                          <span className="text-2xl font-black text-white">{r.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3. RADAR + ACCURACY DETAIL */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  {/* Radar */}
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Environmental Fingerprint</h4>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                          <PolarGrid stroke="#f1f5f9" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                          <Radar name="Current Condition" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} />
                          <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', fontSize: '12px' }} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col justify-center">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                      <Activity size={14} className="text-green-600" /> Prediction Confidence Breakdown
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Accuracy ring */}
                      <div className="flex flex-col items-center justify-center p-6 bg-green-50 rounded-3xl border border-green-100">
                        <AccuracyRing pct={accuracy ?? 92} label="Best Model Accuracy" sublabel="Machine Learning prediction" />
                      </div>
                      {/* Stats breakdown */}
                      <div className="flex flex-col justify-center gap-4">
                        {[
                          { label: 'Water Required', val: `${cropStat?.waterLiters ?? '—'}L`, icon: <Droplets size={14} className="text-blue-500" />, bg: 'bg-blue-50' },
                          { label: 'Days to Harvest', val: `~${cropStat?.daysToHarvest ?? '—'} days`, icon: <Sun size={14} className="text-amber-500" />, bg: 'bg-amber-50' },
                          { label: 'Crop Verified', val: 'AI + Soil', icon: <CheckCircle2 size={14} className="text-green-500" />, bg: 'bg-green-50' },
                        ].map((s, i) => (
                          <div key={i} className={`${s.bg} rounded-xl px-4 py-3 flex items-center gap-3`}>
                            {s.icon}
                            <div>
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{s.label}</p>
                              <p className="text-sm font-black text-slate-800">{s.val}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. WEATHER FORECAST */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Activity size={14} className="text-blue-500" /> 5-Day Projection Outlook
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                    {result.forecast?.map((w, i) => (
                      <div key={i} className="flex flex-col items-center p-5 rounded-3xl bg-slate-50 border border-slate-100 group hover:bg-white hover:shadow-xl transition-all">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                          {language === 'hi' ? w.dh : w.d}
                        </span>
                        <div className="my-4 text-blue-500 group-hover:scale-110 transition-transform">
                          {w.c.includes('Rain') ? <CloudRain size={22} /> : <Sun size={22} />}
                        </div>
                        <span className="text-xl font-black text-slate-800">{w.t}°</span>
                        <span className="text-[8px] font-bold text-slate-400 mt-1 uppercase text-center">
                          {language === 'hi' ? w.ch : w.c}
                        </span>
                      </div>
                    ))}
                  </div>
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
              AGRIAI CAN MAKE MISTAKES
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

export default ProfessionalProfile;