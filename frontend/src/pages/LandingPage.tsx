import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, User, Globe } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import logo from '../assets/logo.png';
import farmerBg from "../assets/farming.jpg";
import GrowingTree from '../components/GrowingPlant';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, setLanguage, language } = useLanguage();

  // MOUSE PARALLAX LOGIC
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth spring physics
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

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center p-4 bg-[#0a0d0a]">

      {/* UPDATED BACKGROUND LAYER */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <motion.div
          className="absolute inset-[-5%]" // Buffer for movement
          style={{
            x, // Links to mouse movement
            y, // Links to mouse movement
            scale: 1.1,
            backgroundImage: `url(${farmerBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(4px) brightness(1) saturate(1)",
          }}
        />
        {/* Stationary Gradient Overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(180deg, hsla(30, 20%, 10%, 0.4) 0%, hsla(142, 30%, 8%, 0.6) 60%, hsla(25, 25%, 8%, 0.8) 100%)",
          }}
        />
      </div>

      {/* HEADER NAVIGATION (Logo Left, Language Right) */}
      <header className="absolute top-0 left-0 w-full p-6 z-30 flex items-center justify-between">
        {/* Top Left: Animated Logo */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <motion.div
            // Infinite 3D rotation logic
            animate={{ rotateY: [0, 360] }}
            transition={{ duration: 8, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
            // Circular container with subtle glow
            className="w-12 h-12 md:w-14 md:h-14 rounded-full border border-white/20 shadow-lg shadow-green-900/40 bg-white/5 flex items-center justify-center overflow-hidden backdrop-blur-sm"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <img
              src={logo}
              alt="Brand Logo"
              className="w-full h-full object-cover"
            />
          </motion.div>

          <div className="flex flex-col">
            <span className="text-white font-black tracking-tighter text-xl leading-none hidden sm:block">
              AGRI<span className="text-green-500">AI</span>
            </span>
            <span className="text-[8px] font-bold text-white/30 uppercase tracking-[0.3em] hidden sm:block">
              Jharkhand
            </span>
          </div>
        </motion.div>

        {/* Top Right: Language Selector */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 bg-black/20 backdrop-blur-md p-1.5 rounded-xl border border-white/10"
        >
          <Globe className="w-4 h-4 text-gray-400 ml-2 hidden sm:block" />
          <button
            onClick={() => setLanguage('en')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${language === 'en' ? 'bg-green-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
              }`}
          >
            ENG
          </button>
          <button
            onClick={() => setLanguage('hi')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${language === 'hi' ? 'bg-green-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
              }`}
          >
            हिंदी
          </button>
        </motion.div>
      </header>

      {/* GLOBAL FLOATING PARTICLES OVERLAY */}
      <div className="absolute inset-0 z-10 pointer-events-none mix-blend-screen opacity-80 pl-16">
        <GrowingTree className="w-full h-full object-cover" />
      </div>

      {/* MAIN HERO CONTENT */}
      <div className="relative z-20 w-full max-w-4xl flex flex-col items-center mt-16 md:mt-0">

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-10 relative z-20"
        >
          <div className="absolute inset-0 -m-16 rounded-full blur-[100px] bg-green-500/10 pointer-events-none" />

          <h1 className="text-4xl md:text-6xl font-extrabold mb-4 text-white tracking-tight drop-shadow-sm">
            {language === 'hi' ? (
              <>झारखंड फसल <span className="text-green-500">सलाहकार</span>🌾</>
            ) : (
              <>Jharkhand Crop <span className="text-green-500">Advisor</span>🌾</>
            )}
          </h1>
          <p className="mt-4 text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed font-light">
            {language === 'hi'
              ? 'एआई-संचालित मिट्टी की जानकारी और मौसम एनालिटिक्स के साथ झारखंड के किसानों को सशक्त बनाना।'
              : "Empowering Jharkhand's farmers with AI-driven soil insights and weather analytics."}
          </p>
        </motion.div>

        {/* PREMIUM SOLID PROFILE SELECTION CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-2xl px-4 mx-auto relative z-20">

          {/* Farmer Profile */}
          <motion.button
            whileHover={{ scale: 1.03, y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { setLanguage('hi'); navigate('/farmer'); }}
            className="group relative bg-white/70 backdrop-blur-xl border border-white/50 p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:bg-white/80 hover:shadow-[0_20px_50px_rgba(74,222,128,0.3)] transition-all duration-300 overflow-hidden flex flex-col items-center text-center"
          >
            <div className="bg-green-50 p-5 rounded-2xl mb-6 group-hover:bg-green-100 group-hover:scale-110 transition-all duration-300">
              <User className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">{t('profile.farmer')}</h2>
            <p className="text-gray-600 text-sm leading-relaxed font-medium">
              {t('profile.farmer.subdesc')}
            </p>
            {/* Animated Bottom Border */}
            <div className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-green-400 to-green-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
          </motion.button>

          {/* Professional Profile */}
          <motion.button
            whileHover={{ scale: 1.03, y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { setLanguage('en'); navigate('/pro') }}
            className="group relative bg-white/70 backdrop-blur-xl border border-white/50 p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:bg-white/80 hover:shadow-[0_20px_50px_rgba(99,102,241,0.3)] transition-all duration-300 overflow-hidden flex flex-col items-center text-center"
          >
            <div className="bg-indigo-50 p-5 rounded-2xl mb-6 group-hover:bg-indigo-100 group-hover:scale-110 transition-all duration-300">
              <Briefcase className="w-12 h-12 text-indigo-600" />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">{t('profile.pro')}</h2>
            <p className="text-gray-600 text-sm leading-relaxed font-medium">
              {t('profile.pro.subdesc')}
            </p>
            {/* Animated Bottom Border */}
            <div className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-indigo-400 to-indigo-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
          </motion.button>
        </div>

        <footer className="mt-20 flex flex-col items-center text-gray-500 text-[12px] font-bold tracking-[0.2em] uppercase opacity-50 text-center gap-2">
          <span>Jharkhand Crop Advisor | © 2026 AGRI-AI</span>
          <span className="opacity-120 normal-case tracking-normal text-xs">AGRIAI CAN MAKE MISTAKES.</span>
        </footer>
      </div>
    </div>
  );
};
export default LandingPage;