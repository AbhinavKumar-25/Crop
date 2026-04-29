import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
   ArrowLeft, Volume2, MapPin, Loader2, WifiOff, CloudRain, Sun, Sprout,
   Droplets, CloudSun, TestTube2, Activity, AlertCircle, Eye,
   BarChart3, Thermometer, Wind, Calendar, Info
} from 'lucide-react';
import {
   PieChart, Pie, Cell, ResponsiveContainer,
   BarChart, Bar, XAxis, YAxis, Tooltip, LabelList,
   Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { useLanguage } from '../context/LanguageContext';
import { speakText, getDistricts, predictCrop, getAccuracy, District, PredictionResult } from '../services/cropService';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../assets/logo.png';
import backgroundVideo from '../assets/backgroundvideo.mp4';
import VoiceChat from '../components/VoiceChat';

import paddyImg from '../assets/crops/paddy.jpg';
import wheatImg from '../assets/crops/wheat.jpg';
import maizeImg from '../assets/crops/maize.jpg';
import pulsesImg from '../assets/crops/pulses.jpg';
import mustardImg from '../assets/crops/mustard.jpg';
import cottonImg from '../assets/crops/cotton.jpg';
import sugarcaneImg from '../assets/crops/sugarcane.jpg';
import defaultImg from '../assets/crops/default.jpg';

// CROP IMAGES
const CROP_IMAGES: Record<string, string> = {
   Paddy: paddyImg, Wheat: wheatImg, Maize: maizeImg, Pulses: pulsesImg,
   Mustard: mustardImg, Cotton: cottonImg, Sugarcane: sugarcaneImg, default: defaultImg,
};

const getCropImage = (name: string, fallbackUrl?: string) => {
   const normalizedName = Object.keys(CROP_IMAGES).find(k => k.trim().toLowerCase() === name.trim().toLowerCase()) || name;
   return CROP_IMAGES[normalizedName] || fallbackUrl || CROP_IMAGES.default;
};

// --- ANALYTICS COMPONENTS ---

const getStatus = (label: string, value: number) => {
   if (label === 'Soil pH') {
      if (value < 5.5) return 'Low';
      if (value > 7.5) return 'High';
      return 'Ideal';
   } else {
      if (value < 30) return 'Low';
      if (value > 100) return 'High';
      return 'Ideal';
   }
};

const SoilGauge: React.FC<{ label: string; value: number; max: number; unit: string; color: string }> = ({ label, value, max, unit, color }) => {
   const data = [{ value: value }, { value: Math.max(0, max - value) }];
   const status = getStatus(label, value);
   const statusColors: any = { Low: 'text-rose-500', High: 'text-amber-500', Ideal: 'text-green-500' };

   return (
      <div className="flex flex-col items-center p-6 bg-white/90 backdrop-blur-md rounded-[2.5rem] border border-white/20 shadow-lg relative">
         <div className="absolute top-4 right-4 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-slate-100"><span className={statusColors[status]}>{status}</span></div>
         <div className="h-28 w-28">
            <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                  <Pie data={data} innerRadius={35} outerRadius={45} startAngle={180} endAngle={0} dataKey="value">
                     <Cell fill={color} />
                     <Cell fill="rgba(0,0,0,0.05)" />
                  </Pie>
               </PieChart>
            </ResponsiveContainer>
         </div>
         <div className="-mt-8 text-center">
            <p className="text-2xl font-black text-slate-900 leading-none">{value}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{unit}</p>
         </div>
         <p className="mt-4 text-xs font-black text-slate-500 uppercase tracking-widest">{label}</p>
      </div>
   );
};

const SuitabilityRadar: React.FC<{ data: any }> = ({ data }) => (
   <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
         <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
            <PolarGrid stroke="rgba(0,0,0,0.1)" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Tooltip
               formatter={(value: any, name: any, props: any) => [props.payload.value, props.payload.subject]}
               contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
            />
            <Radar name="Suitability" dataKey="A" stroke="#22c55e" fill="#22c55e" fillOpacity={0.5} />
         </RadarChart>
      </ResponsiveContainer>
   </div>
);

const FarmerBackground: React.FC = () => (
   <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover" style={{ filter: 'blur(4px) brightness(1) saturate(1)' }}>
         <source src={backgroundVideo} type="video/mp4" />
      </video>
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, hsla(30, 20%, 10%, 0.4) 0%, hsla(142, 30%, 8%, 0.6) 60%, hsla(25, 25%, 8%, 0.8) 100%)" }} />
   </div>
);

const PredictionPage: React.FC = () => {
   const navigate = useNavigate();
   const { language, setLanguage } = useLanguage();

   const [districts, setDistricts] = useState<District[]>([]);
   const [selectedDistrict, setSelectedDistrict] = useState('');
   const [targetCrop, setTargetCrop] = useState('');
   const [landSize, setLandSize] = useState<number | ''>(1);
   const [startDate, setStartDate] = useState('');
   const [loading, setLoading] = useState(false);
   const [customLoading, setCustomLoading] = useState(false);
   const [result, setResult] = useState<PredictionResult | null>(null);
   const [isSpeaking, setIsSpeaking] = useState(false);
   const [accuracy, setAccuracy] = useState<number | null>(null);

   // RESTRICT PAST DATES
   const todayDate = new Date().toISOString().split('T')[0];

   useEffect(() => { return () => window.speechSynthesis.cancel(); }, []);
   useEffect(() => {
      getDistricts().then(setDistricts);
      getAccuracy().then(d => {
         const raw = d.accuracy ?? d.test_accuracy ?? d.score ?? 0.94;
         setAccuracy(Math.round(raw * 100));
      });
   }, []);

   const handlePredict = async () => {
      if (!selectedDistrict || !navigator.onLine) return;
      setLoading(true);
      try {
         const data = await predictCrop(selectedDistrict);
         if (data) setResult(data);
      } catch (e) { alert("Error fetching prediction."); } finally { setLoading(false); }
   };

   const handleCustomPredict = async () => {
      if (!selectedDistrict || !targetCrop || !navigator.onLine) return;
      if (startDate && startDate < todayDate) {
         alert(language === 'hi' ? "कृपया भविष्य की तारीख चुनें।" : "Please select a valid future date.");
         return;
      }
      setCustomLoading(true);
      try {
         const data = await predictCrop(selectedDistrict, targetCrop, landSize === '' ? undefined : landSize, startDate);
         if (data) setResult(data);
      } catch (e) { alert("Error fetching custom analysis."); } finally { setCustomLoading(false); }
   };

   const handleSpeak = () => {
      if (!result) return;
      if (isSpeaking) { window.speechSynthesis.cancel(); setIsSpeaking(false); return; }
      const text = language === 'hi' ? `${result.crop.nameHi}: ${result.crop.descriptionHi}` : `${result.crop.name}: ${result.crop.description}`;
      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = language === 'hi' ? 'hi-IN' : 'en-US';
      utt.onstart = () => setIsSpeaking(true);
      utt.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utt);
   };

   const radarData = result ? [
      { subject: 'Humidity (%)', A: result.soil.hum, value: result.soil.hum },
      { subject: 'Temp (°C)', A: Math.min((result.soil.temp / 50) * 100, 100), value: result.soil.temp },
      { subject: 'Rainfall (mm)', A: Math.min((result.soil.rain / 300) * 100, 100), value: result.soil.rain },
   ] : [];

   return (
      <div className="min-h-screen flex flex-col relative overflow-hidden">
         <FarmerBackground />

         <motion.header
            initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="sticky top-0 z-50 px-6 py-3 border-b border-white/10 backdrop-blur-md bg-black/20 shadow-lg"
         >
            <div className="max-w-7xl mx-auto flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <button onClick={() => navigate('/')} className="p-2 hover:bg-white/10 rounded-xl transition-all text-white border border-white/5"><ArrowLeft size={18} /></button>
                  <div className="flex items-center gap-3">
                     <motion.div
                        animate={{ rotateY: [0, 360] }}
                        transition={{ duration: 8, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
                        className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 border border-white/20 overflow-hidden shadow-[0_0_15px_rgba(74,222,128,0.2)]"
                        style={{ transformStyle: 'preserve-3d' }}
                     >
                        <img src={logo} alt="Logo" className="w-full h-full object-cover" />
                     </motion.div>
                     <div>
                        <h1 className="text-lg font-black text-white leading-none tracking-tight">AGRI<span className="text-green-500">AI</span></h1>
                        <p className="text-[8px] font-bold text-white/40 uppercase tracking-[0.3em]">Jharkhand</p>
                     </div>
                  </div>
               </div>
               <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
                  {['en', 'hi'].map(l => (
                     <button key={l} onClick={() => setLanguage(l as any)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${language === l ? 'bg-white text-green-700 shadow-md' : 'text-white/50 hover:text-white'}`}>{l === 'en' ? 'ENG' : 'हिन्दी'}</button>
                  ))}
               </div>
            </div>
         </motion.header>

         <main className="flex-grow w-full max-w-7xl mx-auto p-4 sm:p-8 relative z-10 space-y-12">

            {/* SECTION 1: SELECTION & HERO */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
               {/* LEFT COLUMN: SELECTION & PROBABILITY */}
               <div className="lg:col-span-4 flex flex-col gap-8">
                  {/* SELECTION CARD */}
                  <div className="bg-white/90 backdrop-blur-md p-8 rounded-[3rem] shadow-2xl border border-white/20">
                     <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2"><MapPin size={16} className="text-green-600" /> {language === 'hi' ? 'अपना जिला चुनें' : 'SELECT YOUR DISTRICT'}</h3>
                     <select value={selectedDistrict} onChange={e => setSelectedDistrict(e.target.value)} className="w-full p-5 border-2 border-slate-100 rounded-[2rem] bg-slate-50 text-xl font-black outline-none focus:ring-8 focus:ring-green-500/5 appearance-none text-center transition-all">
                        <option value="">-- {language === 'hi' ? 'चुनें' : 'District'} --</option>
                        {districts.map(d => <option key={d.code} value={d.code}>{language === 'hi' ? d.nameHi : d.name}</option>)}
                     </select>
                     <button onClick={handlePredict} disabled={!selectedDistrict || loading} className="w-full mt-6 bg-slate-900 text-white py-5 rounded-[2rem] text-xs font-black uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-95 disabled:bg-slate-200">
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <Activity size={20} />}
                        {language === 'hi' ? 'विश्लेषण शुरू करें' : 'Analyze Now'}
                     </button>
                  </div>

                  {/* PROBABILITY CHART */}
                  {result && (
                     <AnimatePresence mode="wait">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/90 backdrop-blur-md p-8 rounded-[3rem] shadow-2xl border border-white/20">
                           <div className="space-y-6">
                              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Probability Distribution</h4>
                              <div className="h-48 w-full">
                                 <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={result.confScores?.filter(s => s.crop.trim().toLowerCase() !== result.crop.name.trim().toLowerCase()).slice(0, 5) || []} layout="vertical" margin={{ left: -15, right: 10 }}>
                                       <XAxis type="number" hide domain={[0, 1]} />
                                       <YAxis dataKey="crop" type="category" width={70} fontSize={10} fontWeight="bold" stroke="#64748b" axisLine={false} tickLine={false} />
                                       <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} formatter={(val: any) => `${(Number(val) * 100).toFixed(1)}%`} />
                                       <Bar dataKey="prob" fill="#3b82f6" radius={[0, 8, 8, 0]} barSize={12}>
                                          <LabelList dataKey="prob" position="right" formatter={(val: any) => `${(Number(val) * 100).toFixed(0)}%`} fill="#64748b" fontSize={10} fontWeight="bold" />
                                       </Bar>
                                    </BarChart>
                                 </ResponsiveContainer>
                              </div>
                              <p className="text-[10px] font-bold text-slate-400 text-center leading-relaxed px-4">Showing top alternatives (excluding primary recommendation).</p>
                           </div>
                        </motion.div>
                     </AnimatePresence>
                  )}
               </div>

               {/* HERO CROP CARD */}
               <div className="lg:col-span-8">
                  <AnimatePresence mode="wait">
                     {!result ? (
                        <div className="h-full min-h-[300px] bg-white/10 border-4 border-dashed border-white/20 rounded-[3.5rem] flex flex-col items-center justify-center text-center p-12 backdrop-blur-sm">
                           <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-6 text-white/40"><Sprout size={48} /></div>
                           <h2 className="text-2xl font-black text-white/80">{language === 'hi' ? 'डेटा की शक्ति से खेती करें' : 'Empower Your Farming with AI'}</h2>
                           <p className="text-sm text-white/40 mt-3 max-w-sm">{language === 'hi' ? 'शुरू करने के लिए ऊपर अपना जिला चुनें' : 'Select a district to unlock professional soil and climate insights.'}</p>
                        </div>
                     ) : (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-8 h-full">
                           <div className="bg-white/90 backdrop-blur-xl rounded-[3.5rem] shadow-2xl overflow-hidden border border-white/30 flex flex-col md:flex-row h-full">
                              <div className="w-full md:w-2/5 relative h-64 md:h-auto">
                                 <img src={getCropImage(result.crop.name, result.crop.imageUrl)} className="w-full h-full object-cover" />
                                 <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />
                              </div>
                              <div className="flex-1 p-10 flex flex-col justify-center">
                                 <div className="flex justify-between items-start mb-6">
                                    <h2 className="text-5xl font-black text-slate-800">{language === 'hi' ? result.crop.nameHi : result.crop.name}</h2>
                                    <button onClick={handleSpeak} className="p-4 bg-green-100 text-green-700 rounded-2xl shadow-lg hover:scale-105 active:scale-90 transition-all flex-shrink-0">
                                       {isSpeaking ? <Activity className="animate-pulse" /> : <Volume2 />}
                                    </button>
                                 </div>
                                 <p className="text-slate-600 font-bold leading-relaxed">{language === 'hi' ? result.crop.descriptionHi : result.crop.description}</p>
                                 {(result.crop.sloganEn || result.crop.sloganHi) && (
                                    <p className="text-green-600 font-black tracking-wide mt-4 italic">
                                       "{language === 'hi' ? result.crop.sloganHi : result.crop.sloganEn}"
                                    </p>
                                 )}
                                 <div className="mt-8 flex gap-3">
                                 </div>
                              </div>
                           </div>

                           {/* ADVISORY CARDS */}
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div className="bg-white/90 p-10 rounded-[3rem] border border-white/20 shadow-xl">
                                 <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-4 flex items-center gap-2"><Sun size={16} /> Expert Maintenance</h4>
                                 <p className="text-slate-700 font-bold leading-relaxed">{language === 'hi' ? result.crop.maintenanceHi : result.crop.maintenance}</p>
                              </div>
                              <div className="bg-slate-900/90 p-10 rounded-[3rem] text-white shadow-xl border border-white/10">
                                 <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-4 flex items-center gap-2"><AlertCircle size={16} /> Risk Mitigation</h4>
                                 <p className="text-slate-300 font-bold leading-relaxed">{language === 'hi' ? result.crop.advisoryHi : result.crop.advisoryEn}</p>
                              </div>
                           </div>
                        </motion.div>
                     )}
                  </AnimatePresence>
               </div>
            </section>

            {/* SECTION 2: PROFESSIONAL ANALYTICS HUB */}
            {result && (
               <section className="space-y-8">
                  <div className="flex items-center justify-between px-4">
                     <h2 className="text-3xl font-black text-white flex items-center gap-4"><Activity className="text-green-400" /> {language === 'hi' ? 'प्रोफेशनल एनालिटिक्स हब' : 'Professional Analytics Hub'}</h2>
                     <div className="px-6 py-2 bg-white/10 rounded-full border border-white/20"><p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Conf: {accuracy}%</p></div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                     {/* SOIL GAUGES (5 Cols) */}
                     <div className="xl:col-span-5 grid grid-cols-2 gap-4">
                        <SoilGauge label="Nitrogen" value={result.soil.n} max={160} unit="mg/kg" color="#10b981" />
                        <SoilGauge label="Phosphorus" value={result.soil.p} max={160} unit="mg/kg" color="#3b82f6" />
                        <SoilGauge label="Potassium" value={result.soil.k} max={160} unit="mg/kg" color="#f59e0b" />
                        <SoilGauge label="Soil pH" value={result.soil.ph} max={14} unit="pH" color="#8b5cf6" />
                     </div>

                     {/* RADAR CHART (7 Cols) */}
                     <div className="xl:col-span-7 bg-white/90 backdrop-blur-md p-10 rounded-[3.5rem] shadow-2xl border border-white/20 flex flex-col justify-center items-center">
                        <div className="space-y-6 w-full max-w-md">
                           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Soil Suitability Balance</h4>
                           <SuitabilityRadar data={radarData} />
                           <p className="text-[10px] font-bold text-slate-400 text-center leading-relaxed px-4">Visual representation of how your soil matches the crop's ideal environment.</p>
                        </div>
                     </div>
                  </div>
               </section>
            )}

            {/* SECTION 3: WEATHER DETAILED REPORT */}
            {result && (
               <section className="space-y-8">
                  <div className="flex items-center justify-between px-4">
                     <h2 className="text-3xl font-black text-white flex items-center gap-4"><CloudSun size={32} className="text-blue-400" /> {language === 'hi' ? 'मौसम रिपोर्ट' : 'Weather Report'}</h2>
                  </div>

                  <div className="bg-gradient-to-br from-slate-900 to-slate-800 backdrop-blur-xl p-8 sm:p-12 rounded-[3.5rem] shadow-2xl border border-white/10 text-white relative overflow-hidden flex flex-col lg:flex-row gap-12 items-center">
                     {/* Decorative background circle */}
                     <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/20 blur-3xl rounded-full pointer-events-none"></div>

                     {/* CURRENT WEATHER (Left) */}
                     <div className="w-full lg:w-1/3 space-y-6 relative z-10">
                        <div>
                           <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-2">{language === 'hi' ? 'वर्तमान मौसम' : 'Current Conditions'}</p>
                           <h3 className="text-4xl font-black">{districts.find(d => d.code === selectedDistrict)?.name || selectedDistrict}</h3>
                        </div>
                        <div className="flex items-end gap-4">
                           <span className="text-7xl font-black tracking-tighter">{result.soil.temp}°</span>
                           <span className="text-2xl font-bold text-white/50 mb-2">C</span>
                        </div>
                        <div className="flex items-center gap-6 text-sm font-bold text-white/70">
                           <div className="flex items-center gap-2"><Droplets size={16} className="text-blue-400" /> {result.soil.hum}%</div>
                           <div className="flex items-center gap-2"><CloudRain size={16} className="text-blue-400" /> {result.soil.rain} mm</div>
                        </div>

                        <a
                           href={`https://www.google.com/search?q=weather+in+${districts.find(d => d.code === selectedDistrict)?.name || selectedDistrict}`}
                           target="_blank"
                           rel="noopener noreferrer"
                           className="inline-flex items-center gap-2 mt-4 text-[10px] font-black text-blue-400 uppercase tracking-widest hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-full border border-white/10"
                        >
                           {language === 'hi' ? 'मौसम के बारे में और जानें' : 'More about weather'} <ArrowLeft className="rotate-180" size={14} />
                        </a>
                     </div>

                     {/* FORECAST (Right) */}
                     <div className="flex-1 w-full relative z-10">
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                           {result.forecast?.map((w, i) => (
                              <div key={i} className="flex flex-col items-center p-6 rounded-[2rem] bg-white/5 border border-white/10 hover:bg-white/10 transition-all group backdrop-blur-sm">
                                 <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">{language === 'hi' ? w.dh : w.d}</span>
                                 <div className="my-4 text-blue-300 group-hover:scale-110 transition-transform">
                                    {w.c.includes('Rain') ? <CloudRain size={28} /> : <Sun size={28} />}
                                 </div>
                                 <span className="text-2xl font-black">{w.t}°</span>
                                 <span className="text-[9px] font-bold text-white/50 mt-2 uppercase tracking-widest text-center leading-tight">{language === 'hi' ? w.ch : w.c}</span>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>
               </section>
            )}

            {/* SECTION 4: CUSTOM PLANNING */}
            {result && (
               <section className="space-y-8 pb-20">
                  <div className="bg-white/10 backdrop-blur-md p-12 rounded-[4rem] border border-white/10 text-center relative overflow-hidden shadow-2xl">
                     <div className="absolute top-0 right-0 p-12 opacity-5 text-white"><Sprout size={160} /></div>
                     <h2 className="text-4xl font-black text-white mb-4 flex items-center justify-center gap-4"><Sprout size={40} className="text-green-400" /> {language === 'hi' ? 'कस्टम फसल योजना' : 'Custom Crop Planning'}</h2>
                     <p className="text-white/40 font-bold mb-10 max-w-2xl mx-auto">{language === 'hi' ? 'अपनी पसंद की फसल का विश्लेषण करें और उसे उगाने की रणनीति प्राप्त करें।' : 'Analyze any specific crop you want to grow and get a detailed expert strategy.'}</p>

                     <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left max-w-5xl mx-auto">
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-white/60 uppercase tracking-widest ml-6">Target Crop</label>
                           <select value={targetCrop} onChange={e => setTargetCrop(e.target.value)} className="w-full p-5 bg-white/10 border border-white/10 rounded-[2rem] text-white font-bold outline-none focus:ring-4 focus:ring-white/20 transition-all">
                              <option value="" className="text-slate-900">-- Choose Crop --</option>
                              {['Paddy', 'Wheat', 'Maize', 'Pulses', 'Mustard', 'Cotton', 'Sugarcane']
                                 .filter(c => c.trim().toLowerCase() !== result?.crop.name.trim().toLowerCase())
                                 .map(c => <option key={c} value={c} className="text-slate-900">{c}</option>)}
                           </select>
                        </div>
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-white/60 uppercase tracking-widest ml-6">Land Size (Acres)</label>
                           <input type="number" step="0.1" value={landSize} onChange={e => setLandSize(e.target.value ? parseFloat(e.target.value) : '')} className="w-full p-5 bg-white/10 border border-white/10 rounded-[2rem] text-white font-bold outline-none" placeholder="1.0" />
                        </div>
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-white/60 uppercase tracking-widest ml-6">Planting Date</label>
                           <input type="date" min={todayDate} value={startDate} onChange={e => setStartDate(e.target.value)} onClick={e => { try { e.currentTarget.showPicker(); } catch (err) { } }} style={{ colorScheme: 'dark' }} className="w-full p-5 bg-white/10 border border-white/10 rounded-[2rem] text-white font-bold outline-none cursor-pointer" />
                        </div>
                     </div>
                     <button onClick={handleCustomPredict} disabled={!targetCrop || customLoading} className="mt-12 px-16 py-5 bg-green-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-sm hover:bg-green-500 transition-all shadow-2xl shadow-green-900/40 flex items-center gap-3 disabled:bg-white/10 mx-auto">
                        {customLoading ? <Loader2 size={24} className="animate-spin" /> : <Activity size={24} />}
                        {language === 'hi' ? 'योजना बनाएं' : 'Generate Strategy'}
                     </button>
                  </div>

                  {result && result.targetCropDetails && (
                     <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="mt-8 bg-white/95 backdrop-blur-xl p-8 sm:p-12 rounded-[3.5rem] border border-white/20 shadow-2xl space-y-10 overflow-hidden">

                        {/* TOP HEADER & ALERTS */}
                        <div className="flex flex-col xl:flex-row gap-8 items-start xl:items-center justify-between border-b border-slate-100 pb-10">
                           <div className="flex items-center gap-8">
                              <img src={getCropImage(result.targetCropDetails.name)} className="w-24 h-24 sm:w-32 sm:h-32 rounded-[2.5rem] object-cover shadow-2xl border-4 border-white" />
                              <div>
                                 <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Target Analysis</p>
                                 <h3 className="text-4xl sm:text-5xl font-black text-slate-800">{language === 'hi' ? result.targetCropDetails.nameHi : result.targetCropDetails.name}</h3>
                              </div>
                           </div>

                           <div className="flex-1 w-full xl:max-w-2xl space-y-3">
                              {result.targetCropDetails.seasonalityWarning && (
                                 <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-4 animate-pulse">
                                    <AlertCircle className="text-amber-600 shrink-0" size={20} />
                                    <p className="text-[11px] font-bold text-amber-900 leading-tight">{language === 'hi' ? result.targetCropDetails.seasonalityWarningHi : result.targetCropDetails.seasonalityWarning}</p>
                                 </div>
                              )}
                              {(result.targetCropDetails.remediationPlanEn || result.targetCropDetails.remediationPlanHi) && (
                                 <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-4">
                                    <Activity className="text-rose-600 shrink-0" size={20} />
                                    <p className="text-[11px] font-bold text-rose-900 leading-tight">
                                       {language === 'hi' ? 'मिट्टी में सुधार की आवश्यकता है।' : 'Soil requires specific nutrient remediation.'}
                                    </p>
                                 </div>
                              )}
                           </div>
                        </div>

                        {/* CONTENT GRID */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                           {/* FIELD ANALYTICS (Left) */}
                           <div className="lg:col-span-5 space-y-6">
                              <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-6">
                                 <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Growth Timeline</h5>
                                 <div className="flex items-center justify-between font-black text-slate-700">
                                    <div className="text-center"><p className="text-[8px] text-slate-400 uppercase mb-1">Start</p><p className="text-xs">{result.targetCropDetails.startDate}</p></div>
                                    <div className="flex-1 px-4 flex flex-col items-center">
                                       <div className="w-full h-1.5 bg-blue-100 rounded-full overflow-hidden">
                                          <div className="h-full bg-blue-500" style={{ width: '65%' }}></div>
                                       </div>
                                       <p className="text-[8px] mt-2 text-blue-500 uppercase">{result.targetCropDetails.durationDays} Days</p>
                                    </div>
                                    <div className="text-center"><p className="text-[8px] text-slate-400 uppercase mb-1">Harvest</p><p className="text-xs text-green-600">{result.targetCropDetails.harvestDate}</p></div>
                                 </div>
                              </div>

                              <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
                                 <div className="absolute top-0 right-0 p-8 opacity-10"><TestTube2 size={80} /></div>
                                 <h5 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4">Field Requirements</h5>
                                 <p className="text-sm font-bold leading-relaxed relative z-10">
                                    {language === 'hi' ? result.targetCropDetails.landInsightsHi : result.targetCropDetails.landInsightsEn || "Analyzing field data..."}
                                 </p>
                              </div>
                           </div>

                           {/* STRATEGY (Right) */}
                           <div className="lg:col-span-7">
                              <div className="bg-blue-50/50 rounded-[3rem] border border-blue-100 p-8 h-full flex flex-col">
                                 <h5 className="text-xs font-black text-blue-700 uppercase tracking-widest mb-6 flex items-center gap-2"><TestTube2 size={20} /> Soil Improvement Strategy</h5>
                                 <div className="flex-grow max-h-[350px] overflow-y-auto pr-4 custom-scrollbar">
                                    <p className="text-slate-800 font-bold leading-relaxed whitespace-pre-wrap text-sm">
                                       {language === 'hi' ? result.targetCropDetails.remediationPlanHi : result.targetCropDetails.remediationPlanEn}
                                    </p>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </motion.div>
                  )}
               </section>
            )}

         </main>

         <footer className="absolute bottom-4 inset-x-0 z-30 flex flex-col items-center text-gray-400 text-[10px] sm:text-[12px] font-bold tracking-[0.1em] uppercase opacity-60 text-center gap-1">
            <span>Jharkhand Crop Advisor | © 2026 AGRI-AI</span>
            <span className="normal-case tracking-normal text-[10px]">AGRIAI CAN MAKE MISTAKES.</span>
         </footer>

         <div className="fixed bottom-8 right-8 z-[100]"><VoiceChat /></div>
      </div>
   );
};

export default PredictionPage;