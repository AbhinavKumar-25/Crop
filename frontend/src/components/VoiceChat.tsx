import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, X, MessageSquare, Loader2, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { sendChatMessage, speakText } from '../services/cropService';
import { useLanguage } from '../context/LanguageContext';

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
  const [messages, setMessages] = useState<Message[]>([]);
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
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-tr from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 rounded-full shadow-[0_0_20px_rgba(52,211,153,0.5)] flex items-center justify-center text-white z-50 border border-white/20 backdrop-blur-md transition-all overflow-hidden"
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
            className="fixed bottom-28 right-6 w-[380px] max-w-[calc(100vw-32px)] h-[550px] max-h-[75vh] bg-slate-950/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-[0_0_40px_rgba(0,0,0,0.5)] z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="relative bg-gradient-to-r from-emerald-900/80 to-slate-900/80 p-5 flex items-center justify-between border-b border-white/5 overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-400"></div>
               <div className="absolute -right-10 -top-10 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl"></div>
               
              <div className="flex items-center gap-3 relative z-10">
                <div className="relative w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center text-white shadow-[0_0_15px_rgba(52,211,153,0.4)]">
                  <Mic size={18} strokeWidth={2.5} />
                  {isListening && <span className="absolute inset-0 rounded-full border-2 border-white/50 animate-ping"></span>}
                </div>
                <div>
                  <h3 className="text-white font-black text-sm tracking-wide">{language === 'hi' ? 'एग्री-एआई' : 'AGRI-AI'}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                     <p className="text-emerald-400 text-[9px] font-black uppercase tracking-[0.2em]">{language === 'hi' ? 'संचालित: Groq' : 'Powered by Groq'}</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => { setIsOpen(false); window.speechSynthesis.cancel(); }} 
                className="text-white/50 hover:text-white p-2 hover:bg-white/10 rounded-full transition-all relative z-10"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-hide relative">
               <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-900/5 to-slate-900/20 pointer-events-none"></div>

              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
                   <MessageSquare size={40} className="text-emerald-500/50 mb-3" />
                  <p className="text-white text-xs font-medium max-w-[200px]">
                     {language === 'hi' ? 'आपका कृषि सहायक तैयार है। कोई भी सवाल पूछें!' : 'Your farming assistant is ready. Ask any question!'}
                  </p>
                </div>
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
                    <div className={`max-w-[85%] rounded-[1.5rem] px-5 py-3.5 text-[13px] leading-relaxed shadow-lg backdrop-blur-sm ${msg.role === 'user' ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-br-sm shadow-emerald-500/20' : 'bg-white/10 text-slate-100 border border-white/10 rounded-bl-sm'}`}>
                      {parts.map((part, i) => {
                        const match = part.match(/\[(.*?)\]\((.*?)\)/);
                        if (match) {
                          return <a key={i} href={match[2]} className="text-teal-300 font-extrabold underline decoration-teal-300/50 hover:decoration-teal-300 transition-all">{match[1]}</a>;
                        }
                        return <span key={i} className="font-medium">{part}</span>;
                      })}
                    </div>
                  </motion.div>
                );
              })}
              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start relative z-10">
                  <div className="bg-white/5 border border-white/10 rounded-[1.5rem] rounded-bl-sm px-5 py-3.5 flex items-center gap-3 backdrop-blur-md">
                     <Loader2 className="animate-spin text-emerald-400" size={16} />
                     <span className="text-emerald-100/70 text-xs font-bold tracking-wide">{language === 'hi' ? 'सोच रहा हूँ...' : 'Analyzing...'}</span>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} className="h-2" />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-slate-950/80 border-t border-white/5 backdrop-blur-2xl">
              <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-full border border-white/10 shadow-inner group focus-within:border-emerald-500/50 focus-within:bg-white/10 transition-all">
                <button
                  onClick={toggleListen}
                  className={`p-3 rounded-full flex-shrink-0 transition-all ${isListening ? 'bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.6)] animate-bounce' : 'bg-white/5 text-emerald-400 hover:bg-emerald-500/20'}`}
                >
                  {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                </button>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend(inputValue)}
                  placeholder={isListening ? (language === 'hi' ? 'सुन रहा हूँ...' : 'Listening...') : (language === 'hi' ? 'संदेश लिखें...' : 'Ask about your farm...')}
                  className="flex-1 bg-transparent text-[13px] font-medium text-white px-2 focus:outline-none placeholder-white/30"
                />
                <button
                  onClick={() => handleSend(inputValue)}
                  disabled={!inputValue.trim() || loading}
                  className="p-3 bg-gradient-to-r from-emerald-500 to-teal-400 text-white rounded-full flex-shrink-0 disabled:opacity-30 disabled:grayscale hover:shadow-[0_0_15px_rgba(52,211,153,0.5)] transition-all"
                >
                  <Send size={16} strokeWidth={2.5}/>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default VoiceChat;
