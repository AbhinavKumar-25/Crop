import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, MapPin, Loader2, BarChart3, CloudSun, Sprout, 
  Globe, Droplets, Thermometer, Info, Activity, CloudRain, Download, 
  Sun
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { predictCrop, PredictionResult, getDistricts, District } from '../services/cropService';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, PieChart, Pie,
  RadarChart, PolarGrid, PolarAngleAxis, Radar, PolarRadiusAxis // Added these
} from 'recharts';
import logo from '../assets/logo.png';
import { cropDetails } from '../data/cropData';


// --- SUB-COMPONENT: HUMAN-READABLE SOIL GAUGE ---
const SoilGauge = ({ value, label, color, max, minIdeal, maxIdeal }: { 
  value: number, label: string, color: string, max: number, minIdeal: number, maxIdeal: number 
}) => {
  const data = [{ value: value }, { value: max - value }];

  const getStatus = () => {
    if (value < minIdeal) return { text: "Low (कम)", classes: "text-orange-600 bg-orange-50 border-orange-100" };
    if (value > maxIdeal) return { text: "High (ज्यादा)", classes: "text-red-600 bg-red-50 border-red-100" };
    return { text: "Ideal (सही)", classes: "text-green-600 bg-green-50 border-green-100" };
  };

  const status = getStatus();

  

  return (
    <div className="flex flex-col items-center bg-white pt-6 pb-4 px-2 rounded-[2.5rem] border border-slate-100 shadow-sm relative group hover:shadow-md transition-all">
      <div className="h-24 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="100%"
              startAngle={180}
              endAngle={0}
              innerRadius={45}
              outerRadius={65}
              paddingAngle={0}
              dataKey="value"
              stroke="none"
            >
              <Cell fill={color} />
              <Cell fill="#f1f5f9" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-end justify-center pb-1">
          <span className="text-xl font-black text-slate-800 leading-none">{value}</span>
        </div>
      </div>
      <div className="mt-4 flex flex-col items-center gap-2 w-full">
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center px-2 leading-tight">
          {label}
        </span>
        <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tight border ${status.classes}`}>
          {status.text}
        </div>
      </div>
    </div>
  );
};

const ProfessionalProfile: React.FC = () => {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useLanguage();
  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);


  const radarData = result ? [
  { subject: 'Temperature', A: (result.soil.temp / 50) * 100, fullMark: 100 }, // Normalized to 100
  { subject: 'Humidity', A: result.soil.hum, fullMark: 100 },
  { subject: 'Rainfall', A: (result.soil.rain / 300) * 100, fullMark: 100 },
  { subject: 'Soil pH', A: (result.soil.ph / 14) * 100, fullMark: 100 },
  { subject: 'N-P-K Avg', A: ((result.soil.n + result.soil.p + result.soil.k) / 450) * 100, fullMark: 100 },
] : [];

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
      setResult(data);
    } catch (error) {
      console.error("Prediction error:", error);
    }
    setLoading(false);
  };

  const nutrientData = result ? [
    { name: 'Nitrogen (N)', value: result.soil.n, color: '#10b981' },
    { name: 'Phosphorus (P)', value: result.soil.p, color: '#3b82f6' },
    { name: 'Potassium (K)', value: result.soil.k, color: '#f59e0b' },
  ] : [];

  return (
    <div className="min-h-screen bg-[#fcfcfd] flex flex-col">
      {/* --- MASTER UNIFIED HEADER --- */}
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
            <button onClick={() => setLanguage('en')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black tracking-widest transition-all ${language === 'en' ? 'bg-white shadow-sm text-green-600' : 'text-slate-500'}`}>ENG</button>
            <button onClick={() => setLanguage('hi')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black tracking-widest transition-all ${language === 'hi' ? 'bg-white shadow-sm text-green-600' : 'text-slate-500'}`}>हिन्दी</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full p-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* --- LEFT SIDEBAR: CONTROLS & SELECTION --- */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <Globe size={14} /> Dataset Parameters
            </h2>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full p-4 border border-slate-100 rounded-2xl bg-slate-50 text-sm font-bold outline-none mb-4 focus:ring-4 focus:ring-blue-500/10 appearance-none transition-all"
            >
              <option value="">-- Choose District --</option>
              {districts.map((d) => (
                <option key={d.code} value={d.code}>{language === 'hi' ? d.nameHi : d.name}</option>
              ))}
            </select>
            <button
              onClick={handlePredict}
              disabled={!selectedDistrict || loading}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-blue-600 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Activity size={16} />}
              {loading ? 'Analyzing...' : 'Run ML Analysis'}
            </button>
          </div>

          {result && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="bg-white p-6 rounded-[2.5rem] border border-blue-50 shadow-sm">
<img 
  src={cropDetails[result.crop.name]?.image || result.crop.imageUrl} 
  className="w-full h-64 object-cover" 
  alt={result.crop.name} 
  onError={(e) => {
    // Final fallback if the link ever breaks
    e.currentTarget.src = "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&q=80&w=800";
  }}
/>             <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Model Output</p>
              <h3 className="text-3xl font-black text-slate-900 leading-tight">{language === 'hi' ? result.crop.nameHi : result.crop.name}</h3>
              <div className="mt-4 p-4 bg-slate-50 rounded-2xl">
                <p className="text-slate-500 text-xs leading-relaxed italic">
                   {language === 'hi' ? result.crop.descriptionHi : result.crop.description}
                </p>
              </div>
            </motion.div>
          )}
        </aside>

        {/* --- MAIN DASHBOARD AREA --- */}
        <section className="lg:col-span-8 space-y-8">
          <AnimatePresence mode="wait">
            {!result ? (
              <div className="h-full min-h-[500px] border-2 border-dashed border-slate-200 rounded-[3.5rem] flex flex-col items-center justify-center text-slate-300">
                <BarChart3 size={48} className="mb-4 opacity-10" />
                <p className="font-black uppercase tracking-[0.3em] text-[10px]">Select a District to Begin Analysis</p>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                
                {/* 1. SOIL HEALTH GAUGE GRID */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <SoilGauge label="Nitrogen (N)" value={result.soil.n} color="#10b981" max={140} minIdeal={40} maxIdeal={100} />
                  <SoilGauge label="Phosphorus (P)" value={result.soil.p} color="#3b82f6" max={200} minIdeal={30} maxIdeal={80} />
                  <SoilGauge label="Potassium (K)"  value={result.soil.k} color="#f59e0b" max={160} minIdeal={35} maxIdeal={150} />
                  <SoilGauge label="Soil pH" value={result.soil.ph} color="#8b5cf6" max={14} minIdeal={6.0} maxIdeal={7.5} />
                </div>

                {/* 2. ANALYTICS & CLIMATE STRIP */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  {/* Nutrient Bar Chart */}
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                     <div className="flex items-center justify-between mb-8">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">N-P-K Concentration</h4>
                        <Download size={14} className="text-slate-300 cursor-pointer" />
                     </div>
                     <div className="h-64">
                       <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={nutrientData}>
                           <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                           <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} />
                           <YAxis hide />
                           <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)'}} />
                           <Bar dataKey="value" radius={[10, 10, 10, 10]} barSize={40}>
                             {nutrientData.map((e, i) => <Cell key={i} fill={e.color} />)}
                           </Bar>
                         </BarChart>
                       </ResponsiveContainer>
                     </div>
                  </div>

                  {/* Climate Metrics Card */}
                  <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col justify-center">
                    <div className="absolute top-0 right-0 p-8 opacity-10"><CloudSun size={120} /></div>
                    <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-10">Live Environmental Data</h4>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3"><Thermometer className="text-orange-400" size={18}/> <span className="text-sm font-bold text-slate-300">Avg Temperature</span></div>
                        <span className="text-2xl font-black">{result.soil.temp}°C</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3"><Droplets className="text-blue-400" size={18}/> <span className="text-sm font-bold text-slate-300">Humidity Level</span></div>
                        <span className="text-2xl font-black">{result.soil.hum}%</span>
                      </div>
                      <div className="flex items-center justify-between border-t border-white/10 pt-6">
                        <div className="flex items-center gap-3"><CloudSun className="text-indigo-400" size={18}/> <span className="text-sm font-bold text-slate-300">Total Rainfall</span></div>
                        <span className="text-2xl font-black text-blue-400">{result.soil.rain}mm</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
  {/* NEW: WEATHER & SOIL RADAR CHART */}
  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Environmental Fingerprint</h4>
    <div className="h-72 w-full flex justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
          <PolarGrid stroke="#f1f5f9" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name="Current Condition"
            dataKey="A"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.15}
          />
          <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', fontSize: '12px' }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  </div>
</div>

                {/* 3. WEATHER FORECAST (API DRIVEN) */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                   <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2">
                    <Activity size={14} className="text-blue-500" /> 5-Day Projection Outlook
                   </h4>
                   <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                     {result.forecast && result.forecast.map((w, i) => (
                       <div key={i} className="flex flex-col items-center p-5 rounded-3xl bg-slate-50 border border-slate-100 group hover:bg-white hover:shadow-xl transition-all">
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{language === 'hi' ? w.dh : w.d}</span>
                         <div className="my-4 text-blue-500 group-hover:scale-110 transition-transform">
                           {w.c.includes('Rain') ? <CloudRain size={24} /> : <Sun size={24} />}
                         </div>
                         <span className="text-xl font-black text-slate-800">{w.t}°</span>
                         <span className="text-[8px] font-bold text-slate-400 mt-1 uppercase text-center">{language === 'hi' ? w.ch : w.c}</span>
                       </div>
                     ))}
                   </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>
    </div>
  );
};

export default ProfessionalProfile;