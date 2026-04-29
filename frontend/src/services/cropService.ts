export interface PredictionResult {
  crop: {
    id?: number;
    code?: string;
    name: string;
    targetName?: string;
    nameHi: string;
    description: string;
    descriptionHi: string;
    aiGenerated?: boolean;
    sloganEn?: string;
    sloganHi?: string;
    watchOutEn?: string;
    watchOutHi?: string;
    advisoryEn?: string;
    advisoryHi?: string;
    waterNeeded?: number;
    daysToHarvest?: number;
    maintenance: string;
    maintenanceHi: string;
    pros: string[];
    prosHi: string[];
    cons: string[];
    consHi: string[];
    imageUrl: string;
    durationDays?: number;
  };
  targetCropDetails?: {
    name: string;
    nameHi: string;
    imageUrl: string;
    durationDays: number;
    seasonalityWarning: string;
    seasonalityWarningHi: string;
    harvestDate: string;
    startDate: string;
    remediationPlanEn: string;
    remediationPlanHi: string;
    landInsightsEn: string;
    landInsightsHi: string;
  };
  confidence: number;
  confScores?: Array<{ crop: string; prob: number }>;
  worstCrop?: string;
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

const API_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? "http://localhost:5001" : "https://crop-advisor-backend-3plz.onrender.com");

export const getDistricts = async () => {
  const res = await fetch(`${API_URL}/districts`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to fetch districts");
  return data;
};

export const getAccuracy = async () => {
  const res = await fetch(`${API_URL}/accuracy`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to fetch accuracy");
  return data;
};

// MAIN PREDICTION (CONNECTED TO YOUR ML BACKEND)

export const predictCrop = async (districtId: string, targetCrop?: string, landSize?: number, startDate?: string) => {
  const body: any = { district: districtId };
  if (targetCrop) body.target_crop = targetCrop;
  if (landSize) body.land_size_acres = landSize;
  if (startDate) body.start_date = startDate;
  
  const res = await fetch(`${API_URL}/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to fetch prediction");
  return data;
};

export const sendChatMessage = async (message: string, context?: string, history: {role: string, text: string}[] = [], language: string = "en") => {
  const res = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, context, history, language }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Chat failed");
  return data as { responseEn: string; responseHi: string };
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