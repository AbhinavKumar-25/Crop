export interface PredictionResult {
  crop: {
    id?: number;
    code?: string;
    name: string;
    nameHi: string;
    description: string;
    descriptionHi: string;
    aiGenerated?: boolean;
    sloganEn?: string;
    sloganHi?: string;
    watchOutEn?: string;
    watchOutHi?: string;
    waterNeeded?: number;
    daysToHarvest?: number;
    maintenance: string;
    maintenanceHi: string;
    pros: string[];
    prosHi: string[];
    cons: string[];
    consHi: string[];
    imageUrl: string;
  };
  confidence: number;
  soil: {
    n: number;
    p: number;
    k: number;
    ph: number;
    temp: number;
    hum: number;
    rain: number;
  };
  forecast: Array<{
    d: string;
    dh: string;
    t: number;
    c: string;
    ch: string;
  }>;
}

export interface District {
  id: number;
  code: string;
  name: string;
  nameHi: string;
}

// GET DISTRICTS (FROM BACKEND)

const API_URL = import.meta.env.VITE_API_URL || "https://crop-advisor-backend-3plz.onrender.com";

export const getDistricts = async () => {
  const res = await fetch(`${API_URL}/districts`);
  return res.json();
};

// MAIN PREDICTION (CONNECTED TO YOUR ML BACKEND)

export const predictCrop = async (districtId: string) => {
  const res = await fetch(`${API_URL}/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      district: districtId
    })
  });

  return res.json();
};

// VOICE SUPPORT

export const speakText = (text: string, lang: 'hi-IN' | 'en-US' = 'hi-IN') => {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    window.speechSynthesis.speak(utterance);
  } else {
    console.warn('Speech synthesis not supported');
  }
};