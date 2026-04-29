import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, User, Globe } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import logo from '../assets/logo.png';
import backgroundVideo from "../assets/backgroundvideo.mp4";
import VoiceChat from '../components/VoiceChat';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, setLanguage, language } = useLanguage();



  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center p-4 bg-[#0a0d0a]">

      {/* UPDATED BACKGROUND LAYER */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            filter: "blur(2px) brightness(1) saturate(1)",
          }}
        >
          <source src={backgroundVideo} type="video/mp4" />
        </video>
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



      {/* MAIN HERO CONTENT */}
      <div className="relative z-20 w-full max-w-4xl flex flex-col items-center mt-16 md:mt-0">

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-10 relative z-20"
        >
          <div className="absolute inset-0 -m-16 rounded-full blur-[100px] bg-green-500/10 pointer-events-none" />

          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-white tracking-tight drop-shadow-sm leading-tight">
            {language === 'hi' ? (
              <>डेटा-आधारित मिट्टी स्वास्थ्य और<br />स्मार्ट फसल पूर्वानुमान</>
            ) : (
              <>Data-Driven Soil Health with<br />Smart Crop Prediction</>
            )}
          </h1>
          <p className="mt-4 text-sm md:text-base text-gray-300 max-w-2xl mx-auto leading-relaxed font-light">
            {language === 'hi'
              ? <>झारखंड राज्य के लिए मिट्टी और जलवायु मानकों का उपयोग करके<br />एआई-आधारित फसल अनुशंसा प्रणाली।</>
              : <>AI-Based Crop Recommendation System Using Soil and Climate Parameters<br />for jharkhand state.</>}
          </p>
        </motion.div>

        {/* GET STARTED BUTTON */}
        <div className="flex justify-center w-full px-4 mx-auto relative z-20 mt-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { navigate('/prediction'); }}
            className="bg-[#10b981] hover:bg-[#059669] text-white px-8 py-3 rounded-full font-bold text-sm md:text-base shadow-lg hover:shadow-green-500/50 transition-all flex items-center justify-center gap-2"
          >
            {language === 'hi' ? 'शुरू करें →' : 'Get Started →'}
          </motion.button>
        </div>

      </div>

      <footer className="absolute bottom-4 inset-x-0 z-30 flex flex-col items-center text-gray-400 text-[10px] sm:text-[12px] font-bold tracking-[0.1em] uppercase opacity-60 text-center gap-1">
        <span>Jharkhand Crop Advisor | © 2026 AGRI-AI</span>
        <span className="normal-case tracking-normal text-[10px]">AGRIAI CAN MAKE MISTAKES.</span>
      </footer>
      <VoiceChat />
    </div>
  );
};
export default LandingPage;