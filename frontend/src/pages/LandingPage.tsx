import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, User, Globe } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { motion } from 'framer-motion';
import logo from '../assets/logo.png';
import farmerBg from "../assets/farmer-field.jpg";
import GrowingPlant from "../components/GrowingPlant";

const FloatingLeaf = ({ delay, x, size }: { delay: number; x: string; size: number }) => (
  <motion.div
    className="absolute animate-float-particle pointer-events-none"
    style={{ left: x, bottom: "20%", animationDelay: `${delay}s` }}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 3 + delay, duration: 1 }}
  >
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M4 20C4 20 8 16 12 8C16 16 20 20 20 20"
        stroke="hsl(142, 40%, 45%)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
  </motion.div>
);

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, setLanguage, language } = useLanguage();

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center p-4 bg-[#0a0d0a]">
      
      {/* --- BACKGROUND LAYER --- */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 animate-slow-pan"
          style={{
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

      {/* --- HEADER NAVIGATION (Logo Left, Language Right) --- */}
      <header className="absolute top-0 left-0 w-full p-6 z-30 flex items-center justify-between">
        {/* Top Left: Logo */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <img 
            src={logo} 
            alt="Brand Logo" 
            className="w-12 h-12 md:w-14 md:h-14 object-contain rounded-full border border-white/10 shadow-lg shadow-green-900/20" 
          />
          <span className="text-white font-bold tracking-tighter text-xl hidden sm:block">
            AGRI<span className="text-green-500">AI</span>
          </span>
        </motion.div>

        {/* Top Right: Language Selector */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 bg-black/20 backdrop-blur-md p-1.5 rounded-xl border border-white/10"
        >
          <Globe className="w-4 h-4 text-gray-400 ml-2 hidden xs:block" />
          <button
            onClick={() => setLanguage('en')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${
              language === 'en' ? 'bg-green-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            ENG
          </button>
          <button
            onClick={() => setLanguage('hi')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${
              language === 'hi' ? 'bg-green-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            हिंदी
          </button>
        </motion.div>
      </header>

      {/* --- FLOATING LEAVES --- */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <FloatingLeaf delay={0} x="10%" size={20} />
        <FloatingLeaf delay={1.5} x="85%" size={16} />
        <FloatingLeaf delay={3} x="50%" size={18} />
        <FloatingLeaf delay={4} x="25%" size={22} />
      </div>

      {/* --- MAIN HERO CONTENT --- */}
      <div className="relative z-20 w-full max-w-4xl flex flex-col items-center mt-16 md:mt-0">
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-10"
        >
          <div className="flex justify-center mb-6 relative">
            <div className="absolute inset-0 -m-8 rounded-full blur-3xl bg-green-500/10" />
            <GrowingPlant />
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold mb-4 text-white tracking-tight drop-shadow-sm">
            AI Crop <span className="text-green-500">Prediction</span>🌾
          </h1>
          <p className="mt-4 text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed font-light">
            Empowering Jharkhand's farmers with AI-driven soil insights and seasonal weather analytics.
          </p>
        </motion.div>

        {/* --- PROFILE SELECTION CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full px-4">
          {/* Farmer Profile */}
          <motion.button
            whileHover={{ scale: 1.02, backgroundColor: "rgba(255, 255, 255, 1)" }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { setLanguage('hi'); navigate('/farmer'); }}
            className="bg-white/95 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-white/20 transition-all text-left flex flex-col items-center text-center group"
          >
            <div className="bg-green-100 p-5 rounded-full mb-6 group-hover:bg-green-200 transition-colors">
              <User className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('profile.farmer')}</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              सरल भाषा में मिट्टी और मौसम के आधार पर फसल की जानकारी प्राप्त करें।
            </p>
            <span className="mt-5 px-5 py-1.5 bg-green-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-200">सिर्फ हिंदी (Hindi)</span>
          </motion.button>

          {/* Professional Profile */}
          <motion.button
            whileHover={{ scale: 1.02, backgroundColor: "rgba(255, 255, 255, 1)" }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/pro')}
            className="bg-white/95 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-white/20 transition-all text-left flex flex-col items-center text-center group"
          >
            <div className="bg-indigo-100 p-5 rounded-full mb-6 group-hover:bg-indigo-200 transition-colors">
              <Briefcase className="w-12 h-12 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('profile.pro')}</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Advanced data analytics and soil nutrient mapping for professionals.
            </p>
            <span className="mt-5 px-5 py-1.5 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-200">English & हिंदी</span>
          </motion.button>
        </div>

        <footer className="mt-16 text-gray-500 text-[10px] font-bold tracking-[0.2em] uppercase opacity-50">
          Jharkhand Smart Agriculture • Digital India 2026
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;