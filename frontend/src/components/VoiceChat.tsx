import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, X, MessageSquare, Loader2, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { sendChatMessage, speakText } from '../services/cropService';
import { useLanguage } from '../context/LanguageContext';
import logo from '../assets/logo.png';

interface VoiceChatProps {
  contextStr?: string;
}

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

const VoiceChat: React.FC<VoiceChatProps> = ({ contextStr }) => {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = sessionStorage.getItem('agri_ai_chat_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    sessionStorage.setItem('agri_ai_chat_history', JSON.stringify(messages));
  }, [messages]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        handleSend(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [language]);

  // Update language of recognition dynamically
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language === 'hi' ? 'hi-IN' : 'en-US';
    }
  }, [language]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const toggleListen = () => {
    if (!recognitionRef.current) {
      alert(language === 'hi' ? "आपका ब्राउज़र वॉयस रिकग्निशन का समर्थन नहीं करता है।" : "Your browser doesn't support voice recognition.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    // Stop speaking if the user interrupts by typing/speaking
    window.speechSynthesis.cancel();

    setInputValue('');
    const userMsg = text.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const response = await sendChatMessage(userMsg, contextStr, messages, language);
      const botText = language === 'hi' ? response.responseHi : response.responseEn;

      setMessages(prev => [...prev, { role: 'assistant', text: botText }]);

      // Auto-speak response
      speakText(botText, language === 'hi' ? 'hi-IN' : 'en-US');
    } catch (error) {
      console.error(error);
      const errMsg = language === 'hi' ? 'कुछ गलत हो गया।' : 'Something went wrong.';
      setMessages(prev => [...prev, { role: 'assistant', text: errMsg }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          if (isOpen) {
            window.speechSynthesis.cancel();
            if (isListening && recognitionRef.current) {
              recognitionRef.current.stop();
              setIsListening(false);
            }
            setIsOpen(false);
          } else {
            setIsOpen(true);
          }
        }}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-tr from-[#5E7153] to-[#788F6A] hover:from-[#6A7E5E] hover:to-[#87A078] rounded-full shadow-[0_0_20px_rgba(94,113,83,0.5)] flex items-center justify-center text-white z-50 border border-white/20 backdrop-blur-md transition-all overflow-hidden"
      >
        <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full pointer-events-none"></div>
        <MessageSquare size={26} strokeWidth={2.5} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95, rotate: 2 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, y: 30, scale: 0.95, rotate: 2 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-28 right-6 w-[380px] max-w-[calc(100vw-32px)] h-[550px] max-h-[75vh] bg-white/95 backdrop-blur-2xl border border-stone-200 rounded-[2rem] shadow-[0_0_40px_rgba(0,0,0,0.15)] z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="relative bg-gradient-to-r from-[#4A5A41] to-[#5E7153] p-5 flex items-center justify-between border-b border-[#3B4834] overflow-hidden">
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-[#788F6A]/20 rounded-full blur-3xl"></div>

              <div className="flex items-center gap-3 relative z-10">
                <div className="relative w-10 h-10">
                  <div className="w-full h-full rounded-full bg-white shadow-[0_0_15px_rgba(94,113,83,0.6)] overflow-hidden flex items-center justify-center">
                    <img src={logo} alt="Logo" className="w-full h-full object-cover scale-110" />
                  </div>
                  {isListening && <span className="absolute inset-0 rounded-full border-2 border-[#788F6A]/50 animate-ping pointer-events-none"></span>}
                </div>
                <div>
                  <h3 className="text-white font-black text-sm tracking-wide">{language === 'hi' ? 'एग्री-एआई' : 'AGRI-AI'}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#A3C491] animate-pulse"></span>
                    <p className="text-stone-200 text-[9px] font-black uppercase tracking-[0.2em]">{language === 'hi' ? 'संचालित: Groq' : 'Powered by Groq'}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  window.speechSynthesis.cancel();
                  if (isListening && recognitionRef.current) {
                    recognitionRef.current.stop();
                    setIsListening(false);
                  }
                }}
                className="text-white/70 hover:text-white p-2 hover:bg-white/20 rounded-full transition-all relative z-10"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-hide relative">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#F4F6F2]/50 to-white/80 pointer-events-none"></div>

              {messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start relative z-10"
                >
                  <div className="max-w-[85%] whitespace-pre-wrap rounded-[1.5rem] px-5 py-3.5 text-[13px] leading-relaxed shadow-lg bg-[#F4F6F2] text-[#3B4834] border border-[#E1E8DB] rounded-bl-sm">
                    {language === 'hi'
                      ? 'एग्री-एआई में आपका स्वागत है! 👋 मैं आपकी मदद के लिए यहाँ हूँ:\n- मिट्टी का विश्लेषण करने में 🧪\n- मौसम की जानकारी देने में 🌤️\n- सबसे अच्छी फसल चुनने में 🌱\n\nक्या आप आज मिलकर कुछ शानदार उगाने के लिए तैयार हैं? 🚜'
                      : 'Welcome to AGRI-AI! 👋 I\'m here to help you to:\n- Analyze your soil 🧪\n- Check the weather 🌤️\n- Choose the best crop 🌱\n\nReady to grow something amazing together today? 🚜'}
                  </div>
                </motion.div>
              )}


              {messages.map((msg, idx) => {
                const parts = msg.text.split(/(\[.*?\]\(.*?\))/g);
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} relative z-10`}
                  >
                    <div className={`max-w-[85%] whitespace-pre-wrap rounded-[1.5rem] px-5 py-3.5 text-[13px] leading-relaxed shadow-lg backdrop-blur-sm ${msg.role === 'user' ? 'bg-gradient-to-br from-[#5E7153] to-[#4A5A41] text-white rounded-br-sm shadow-[#4A5A41]/20' : 'bg-[#F4F6F2] text-[#3B4834] border border-[#E1E8DB] rounded-bl-sm'}`}>
                      {parts.map((part, i) => {
                        const match = part.match(/\[(.*?)\]\((.*?)\)/);
                        if (match) {
                          return <a key={i} href={match[2]} className="text-[#A3C491] font-extrabold underline decoration-[#A3C491]/50 hover:decoration-[#A3C491] transition-all">{match[1]}</a>;
                        }
                        return <span key={i} className="font-medium">{part}</span>;
                      })}
                    </div>
                  </motion.div>
                );
              })}
              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start relative z-10">
                  <div className="bg-[#F4F6F2] border border-[#E1E8DB] rounded-[1.5rem] rounded-bl-sm px-5 py-3.5 flex items-center gap-3 backdrop-blur-md">
                    <Loader2 className="animate-spin text-[#5E7153]" size={16} />
                    <span className="text-[#4A5A41] text-xs font-bold tracking-wide">{language === 'hi' ? 'सोच रहा हूँ...' : 'Analyzing...'}</span>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} className="h-2" />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-[#E1E8DB] backdrop-blur-2xl flex flex-col gap-3">
              <div className="flex items-center gap-2 bg-[#F4F6F2]/50 p-1.5 rounded-full border border-[#E1E8DB] shadow-inner group focus-within:border-[#A3C491] focus-within:bg-[#F4F6F2] transition-all">
                <button
                  onClick={toggleListen}
                  className={`p-3 rounded-full flex-shrink-0 transition-all ${isListening ? 'bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.6)] animate-bounce' : 'bg-white text-[#5E7153] hover:bg-[#E1E8DB] border border-[#E1E8DB]'}`}
                >
                  {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                </button>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend(inputValue)}
                  placeholder={isListening ? (language === 'hi' ? 'सुन रहा हूँ...' : 'Listening...') : (language === 'hi' ? 'संदेश लिखें...' : 'Ask about your farm...')}
                  className="flex-1 bg-transparent text-[13px] font-medium text-[#3B4834] px-2 focus:outline-none placeholder-[#3B4834]/40"
                />
                <button
                  onClick={() => handleSend(inputValue)}
                  disabled={!inputValue.trim() || loading}
                  className="p-3 bg-gradient-to-r from-[#5E7153] to-[#788F6A] text-white rounded-full flex-shrink-0 disabled:opacity-30 disabled:grayscale hover:shadow-[0_0_15px_rgba(94,113,83,0.5)] transition-all"
                >
                  <Send size={16} strokeWidth={2.5} />
                </button>
              </div>
              <p className="text-[10px] text-center text-[#3B4834]/40 font-medium px-2">
                {language === 'hi' ? 'एग्री-एआई गलतियाँ कर सकता है।' : 'AGRI-AI can make mistakes.'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default VoiceChat;
