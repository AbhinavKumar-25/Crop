from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import joblib
import requests
import datetime
import time
import pandas as pd
from dotenv import load_dotenv
import os
import json
import re
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import random

# APP SETUP
app = FastAPI(title="AgriAI Crop Advisor", version="1.0.0")

# Allow React frontend to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace with your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

load_dotenv()

# LOAD MODEL FILES
try:
    model = joblib.load("model.pkl")
    encoder = joblib.load("label_encoder.pkl")
    print("✅ Model and encoder loaded successfully!")
except Exception as e:
    print(f"❌ Error loading model files: {e}")
    model = None
    encoder = None


# DISTRICT SOIL DATA
district_soil_data = {
    "Bokaro":               {"N": 91.23,  "P": 165.51, "K": 136.77, "pH": 5.89},
    "Chatra":               {"N": 104.92, "P": 150.89, "K": 148.75, "pH": 6.48},
    "Deoghar":              {"N": 123.81, "P": 139.57, "K": 138.09, "pH": 6.70},
    "Dhanbad":              {"N": 108.39, "P": 145.22, "K": 139.23, "pH": 6.36},
    "Dumka":                {"N": 92.72,  "P": 116.12, "K": 109.15, "pH": 6.34},
    "East Singhbhum":       {"N": 95.55,  "P": 158.14, "K": 131.11, "pH": 6.18},
    "Garhwa":               {"N": 81.35,  "P": 142.08, "K": 120.45, "pH": 6.93},
    "Giridih":              {"N": 101.22, "P": 143.02, "K": 124.79, "pH": 6.62},
    "Godda":                {"N": 88.33,  "P": 183.59, "K": 114.12, "pH": 6.34},
    "Gumla":                {"N": 110.81, "P": 131.29, "K": 132.94, "pH": 6.30},
    "Hazaribagh":           {"N": 91.08,  "P": 137.89, "K": 136.95, "pH": 6.05},
    "Jamtara":              {"N": 103.48, "P": 132.17, "K": 117.51, "pH": 5.90},
    "Khunti":               {"N": 125.35, "P": 129.07, "K": 131.34, "pH": 6.37},
    "Koderma":              {"N": 124.19, "P": 128.77, "K": 130.35, "pH": 6.91},
    "Latehar":              {"N": 125.45, "P": 122.49, "K": 134.86, "pH": 6.48},
    "Lohardaga":            {"N": 113.04, "P": 139.37, "K": 112.77, "pH": 6.42},
    "Pakur":                {"N": 121.69, "P": 134.78, "K": 125.78, "pH": 6.65},
    "Palamu":               {"N": 104.16, "P": 154.85, "K": 139.13, "pH": 6.98},
    "Ramgarh":              {"N": 79.68,  "P": 142.81, "K": 141.95, "pH": 6.48},
    "Ranchi":               {"N": 99.45,  "P": 146.89, "K": 134.85, "pH": 6.30},
    "Sahibganj":            {"N": 132.28, "P": 176.29, "K": 135.61, "pH": 6.96},
    "Saraikela-Kharsawan":  {"N": 86.55,  "P": 126.13, "K": 133.64, "pH": 5.94},
    "Simdega":              {"N": 100.31, "P": 142.42, "K": 140.12, "pH": 6.17},
    "West Singhbhum":       {"N": 112.54, "P": 146.55, "K": 128.53, "pH": 6.50},
}


# CROP INFO DATABASE
crop_info = {
    "Paddy": {
        "nameHi": "धान",
        "seasonMonths": [6, 7],
        "durationDays": 120,
        "description": "A staple grain crop ideal for high rainfall and humid conditions in Jharkhand.",
        "descriptionHi": "झारखंड में अधिक वर्षा और आर्द्र परिस्थितियों के लिए उपयुक्त एक प्रमुख अनाज फसल।",
        "maintenance": "Requires standing water in fields, regular weeding, and nitrogen-rich fertilizers. Transplanting is done in June–July.",
        "maintenanceHi": "खेतों में खड़े पानी, नियमित निराई और नाइट्रोजन युक्त उर्वरकों की आवश्यकता है। रोपाई जून–जुलाई में की जाती है।",
        "pros": ["High yield in monsoon season", "Primary staple food crop", "Strong government support & MSP", "Adapts well to Jharkhand's red soil"],
        "prosHi": ["मानसून में उच्च उपज", "मुख्य खाद्य फसल", "सरकारी समर्थन और MSP", "झारखंड की लाल मिट्टी के अनुकूल"],
        "cons": ["Water intensive crop", "Susceptible to blast and brown plant hopper"],
        "consHi": ["पानी की अधिक जरूरत", "ब्लास्ट और भूरे फुदके का खतरा"],
        "imageUrl": "https://images.unsplash.com/photo-1536054216670-f67a3536644e?auto=format&fit=crop&q=80&w=800",
    },
    "Wheat": {
        "nameHi": "गेहूं",
        "seasonMonths": [10, 11, 12],
        "durationDays": 110,
        "description": "A rabi season crop well-suited for cool, dry winters with moderate rainfall.",
        "descriptionHi": "रबी मौसम की फसल जो ठंडी, शुष्क सर्दियों और मध्यम वर्षा के लिए उपयुक्त है।",
        "maintenance": "Needs well-drained loamy soil, 2–3 irrigations, and a balanced NPK fertilizer schedule.",
        "maintenanceHi": "अच्छी जल निकासी वाली दोमट मिट्टी, 2–3 सिंचाई और संतुलित NPK उर्वरक कार्यक्रम की जरूरत है।",
        "pros": ["High nutritional value", "Excellent storage life", "Strong market price", "Low pest pressure in winter"],
        "prosHi": ["उच्च पोषण मूल्य", "अच्छी भंडारण क्षमता", "अच्छा बाजार मूल्य", "सर्दियों में कम कीट दबाव"],
        "cons": ["Requires cool climate", "Risk of rust and powdery mildew disease"],
        "consHi": ["ठंडे मौसम की जरूरत", "रस्ट और पाउडरी मिल्ड्यू रोग का खतरा"],
        "imageUrl": "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80&w=800",
    },
    "Maize": {
        "nameHi": "मक्का",
        "seasonMonths": [6, 7],
        "durationDays": 90,
        "description": "A versatile kharif crop with high yield potential in warm, well-drained soils.",
        "descriptionHi": "एक बहुमुखी खरीफ फसल जो गर्म, अच्छी जल निकासी वाली मिट्टी में अधिक उपज देती है।",
        "maintenance": "Requires moderate and consistent water supply, full sunlight, and phosphorus-rich fertilizer at sowing.",
        "maintenanceHi": "मध्यम और नियमित पानी, पूर्ण धूप और बुआई के समय फास्फोरस युक्त उर्वरक की आवश्यकता है।",
        "pros": ["Multiple uses (food, feed, starch)", "Fast growing cycle (~90 days)", "Drought-tolerant hybrid varieties available"],
        "prosHi": ["बहु-उपयोगी (खाना, चारा, स्टार्च)", "तेज़ वृद्धि चक्र (~90 दिन)", "सूखा सहनशील संकर किस्में उपलब्ध"],
        "cons": ["Prone to stem borer pest", "Needs good drainage — waterlogging is fatal"],
        "consHi": ["तना छेदक कीट का खतरा", "अच्छी जल निकासी जरूरी — जलभराव घातक"],
        "imageUrl": "https://images.unsplash.com/photo-1601593346740-925612772716?auto=format&fit=crop&q=80&w=800",
    },
    "Pulses": {
        "nameHi": "दालें",
        "seasonMonths": [6, 7, 8, 9, 10, 11],
        "durationDays": 75,
        "description": "Nitrogen-fixing legumes that improve soil health and provide high-protein food.",
        "descriptionHi": "नाइट्रोजन-स्थिर करने वाली फलियां जो मिट्टी की सेहत सुधारती हैं और प्रोटीन युक्त खाना देती हैं।",
        "maintenance": "Low water requirement. Fixes atmospheric nitrogen naturally, so minimal fertilizer is needed. Avoid waterlogging.",
        "maintenanceHi": "कम पानी की जरूरत। प्राकृतिक रूप से नाइट्रोजन स्थिर करता है, इसलिए न्यूनतम उर्वरक आवश्यक है।",
        "pros": ["Improves soil fertility for next crop", "High protein content for local diet", "Low input cost", "Good for crop rotation"],
        "prosHi": ["अगली फसल के लिए मिट्टी की उर्वरता बढ़ाता है", "स्थानीय आहार के लिए उच्च प्रोटीन", "कम लागत", "फसल चक्र के लिए अच्छा"],
        "cons": ["Susceptible to waterlogging", "Lower yield compared to cereals"],
        "consHi": ["जलभराव के प्रति संवेदनशील", "अनाज की तुलना में कम उपज"],
        "imageUrl": "https://images.unsplash.com/photo-1515543904379-3d757afe72e4?auto=format&fit=crop&q=80&w=800",
    },
    "Mustard": {
        "nameHi": "सरसों",
        "seasonMonths": [10, 11],
        "durationDays": 100,
        "description": "A key oilseed crop for Jharkhand, typically grown in the Rabi season.",
        "descriptionHi": "सरसों झारखंड के लिए एक प्रमुख तिलहन फसल है, जो आमतौर पर रबी मौसम में उगाई जाती है।",
        "maintenance": "Requires well-drained soil and minimal irrigation. Sown in Oct-Nov.",
        "maintenanceHi": "अच्छी जल निकासी वाली मिट्टी और न्यूनतम सिंचाई की जरूरत है। अक्टूबर-नवंबर में बोई जाती है।",
        "pros": ["High oil content", "Low water requirement", "Good market value"],
        "prosHi": ["उच्च तेल की मात्रा", "कम पानी की आवश्यकता", "अच्छा बाजार मूल्य"],
        "cons": ["Sensitive to frost", "Aphid pest risk"],
        "consHi": ["पाले के प्रति संवेदनशील", "माहू कीट का खतरा"],
        "imageUrl": "https://images.unsplash.com/photo-1508349083404-96969c060ec4?auto=format&fit=crop&q=80&w=800",
    },
}


def get_crop_info(crop_name: str) -> dict:
    """Fallback info for any crop the dictionary doesn't cover."""
    return crop_info.get(crop_name, {
        "nameHi": crop_name,
        "description": f"{crop_name} is well-suited to this district's current soil and climate conditions.",
        "descriptionHi": f"इस जिले की वर्तमान मिट्टी और जलवायु परिस्थितियों के लिए {crop_name} उपयुक्त है।",
        "maintenance": "Follow standard agricultural practices recommended by local Krishi Vigyan Kendra.",
        "maintenanceHi": "स्थानीय कृषि विज्ञान केंद्र द्वारा अनुशंसित मानक कृषि पद्धतियों का पालन करें।",
        "pros": ["Well suited to local soil conditions", "Recommended by AI model analysis"],
        "prosHi": ["स्थानीय मिट्टी की स्थिति के अनुकूल", "AI मॉडल विश्लेषण द्वारा अनुशंसित"],
        "cons": ["Consult local agronomist for specific guidance"],
        "consHi": ["विशेष मार्गदर्शन के लिए स्थानीय कृषि विशेषज्ञ से सलाह लें"],
        "imageUrl": "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&q=80&w=800",
    })


# LOCAL AI AGENT FOR CHATBOT

def get_ml_crop_prediction(district_name: str, specific_crop: str = "") -> str:
    """
    Executes the Agricultural Machine Learning model for the given district.
    Call this when a user asks for a prediction OR asks if a specific crop is suitable.
    """
    import os, requests
    api_key = os.getenv("OPENWEATHER_API_KEY")
    if not api_key: return "Error: OPENWEATHER_API_KEY is not set."
    
    dn = district_name.title()
    if dn not in district_soil_data:
        alias_map = {"Seraikela": "Saraikela-Kharsawan"}
        if dn in alias_map: dn = alias_map[dn]
        else: return f"District {district_name} not found in database."
        
    soil = district_soil_data[dn]
    weather_city = dn
    if dn == "Saraikela-Kharsawan": weather_city = "Seraikela"
    elif dn == "East Singhbhum": weather_city = "Jamshedpur"
    elif dn == "West Singhbhum": weather_city = "Chaibasa"
    elif dn == "Palamu": weather_city = "Medininagar"
    elif dn == "Bokaro": weather_city = "Bokaro Steel City"
    
    try:
        url = f"https://api.openweathermap.org/data/2.5/weather?q={weather_city},IN&appid={api_key}&units=metric"
        w_res = requests.get(url, timeout=5).json()
        temp = w_res["main"]["temp"]
        hum = w_res["main"]["humidity"]
        rain = w_res.get("rain", {}).get("1h", 0.0)
    except Exception as e:
        return f"Weather API Failed: {e}"
        
    global model, encoder
    if not model or not encoder: return "ML Model not loaded."
    
    import pandas as pd
    features_df = pd.DataFrame([ [soil['N'], soil['P'], soil['K'], temp, hum, soil['pH'], rain] ], 
                               columns=['N', 'P', 'K', 'Temperature_C', 'Humidity_%', 'pH', 'Rainfall_mm'])
    probabilities = model.predict_proba(features_df)[0]
    classes = encoder.classes_
    
    if specific_crop:
        sc = specific_crop.lower()
        for cls, prob in zip(classes, probabilities):
            if str(cls).lower() == sc:
                conf = round(float(prob) * 100, 1)
                return f"Response Context for {specific_crop} in {district_name}: Confidence is {conf}%. Current weather is {temp}C, {hum}% humidity. N={soil['N']}, P={soil['P']}, K={soil['K']}."
        return f"The crop '{specific_crop}' is not currently part of the ML Model's predictable classes."
    else:
        best_prob, best_crop = 0.0, ""
        for cls, prob in zip(classes, probabilities):
            if prob > best_prob:
                best_prob = prob
                best_crop = str(cls)
        conf = round(float(best_prob) * 100, 1)
        return f"Response Context for {district_name}: Best calculated crop is {best_crop} with {conf}% confidence. Current weather is {temp}C, {hum}% humidity."

def fetch_crop_details(crop_name: str) -> str:
    """Gets farming information like duration days, seasons, pros, cons, and maintenance for a given crop."""
    info = get_crop_info(crop_name.title())
    return f"Crop: {info.get('nameHi', crop_name)}, Duration: {info['durationDays']} days. Pros: {', '.join(info['pros'])}. Cons: {', '.join(info['cons'])}. Maintenance: {info['maintenance']}."


# REQUEST / RESPONSE MODELS
class PredictRequest(BaseModel):
    district: str
    target_crop: Optional[str] = None
    land_size_acres: Optional[float] = 1.0
    start_date: Optional[str] = None

class ChatMessage(BaseModel):
    role: str
    text: str

class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = None
    history: Optional[list[ChatMessage]] = []
    language: Optional[str] = "en"


# ROUTES

@app.get("/")
def home():
    return {"message": "Crop Advisor Backend is Running! 🌾"}


@app.get("/health")
def health():
    return {"status": "ok", "message": "AgriAI backend is running!"}


district_hindi_names = {
    "Bokaro": "बोकारो", "Chatra": "चतरा", "Deoghar": "देवघर",
    "Dhanbad": "धनबाद", "Dumka": "दुमका", "East Singhbhum": "पूर्वी सिंहभूम",
    "Garhwa": "गढ़वा", "Giridih": "गिरिडीह", "Godda": "गोड्डा",
    "Gumla": "गुमला", "Hazaribagh": "हजारीबाग", "Jamtara": "जामताड़ा",
    "Khunti": "खूंटी", "Koderma": "कोडरमा", "Latehar": "लातेहार",
    "Lohardaga": "लोहरदगा", "Pakur": "पाकुड़", "Palamu": "पलामू",
    "Ramgarh": "रामगढ़", "Ranchi": "रांची", "Sahibganj": "साहिबगंज",
    "Saraikela-Kharsawan": "सरायकेला-खरसावां", "Simdega": "सिमडेगा",
    "West Singhbhum": "पश्चिमी सिंहभूम",
}

@app.get("/districts")
def get_districts():
    districts = [
        {
            "code": name,
            "name": name,
            "nameHi": district_hindi_names.get(name, name)  # ← now returns real Hindi name
        }
        for name in district_soil_data.keys()
    ]
    return districts


@app.get("/accuracy")
def get_accuracy():
    try:
        stats = joblib.load("accuracy.pkl")
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not load accuracy stats: {e}")


# PREDICTION CACHE
prediction_cache = {}
CACHE_TTL_SECONDS = 600  # 10 minutes cache per district

@app.post("/predict")
def predict(body: PredictRequest):        # ← Pydantic auto-parses & validates the JSON body
    district = body.district
    target_crop = body.target_crop
    land_size_acres = body.land_size_acres or 1.0
    start_date = body.start_date

    # VALIDATE DISTRICT
    if district not in district_soil_data:
        raise HTTPException(status_code=400, detail="Invalid or missing district name.")

    # CHECK CACHE
    cache_key = f"{district}_{target_crop}_{land_size_acres}_{start_date}"
    now = time.time()
    if cache_key in prediction_cache:
        cached_result, timestamp = prediction_cache[cache_key]
        if now - timestamp < CACHE_TTL_SECONDS:
            print(f"📦 Returning cached prediction for {cache_key}")
            return cached_result

    soil = district_soil_data[district]

    # FETCH REAL-TIME WEATHER
    api_key = os.getenv("OPENWEATHER_API_KEY")
    
    weather_city = district
    if district in ["Saraikela-Kharsawan", "Seraikela Kharsawan"]:
        weather_city = "Seraikela"
    elif district == "East Singhbhum":
        weather_city = "Jamshedpur"
    elif district == "West Singhbhum":
        weather_city = "Chaibasa"
    elif district == "Palamu":
        weather_city = "Medininagar"
    elif district == "Bokaro":
        weather_city = "Bokaro Steel City"

    weather_url = (
        f"https://api.openweathermap.org/data/2.5/weather"
        f"?q={weather_city},IN&appid={api_key}&units=metric"
    )

    try:
        w_res = requests.get(weather_url, timeout=10).json()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Weather API request failed: {e}")

    if "main" not in w_res:
        raise HTTPException(
            status_code=502,
            detail=f"Weather API error: {w_res.get('message', 'City ' + weather_city + ' not found in OpenWeatherMap')}"
        )

    temp = w_res["main"]["temp"]
    hum  = w_res["main"]["humidity"]
    rain = w_res.get("rain", {}).get("1h", 0.0)

    # ML PREDICTION
    if model is None:
        raise HTTPException(status_code=500, detail="Model file not loaded. Check server logs.")

    feature_columns = ['N', 'P', 'K', 'Temperature_C', 'Humidity_%', 'pH', 'Rainfall_mm']
    features_df = pd.DataFrame([[
        soil['N'], soil['P'], soil['K'],
        temp, hum, soil['pH'], rain
    ]], columns=feature_columns)

    print(f"📡 Sending features to model:\n{features_df}")

    prediction = model.predict(features_df)

    # Robust decoding
    if isinstance(prediction[0], str):
        crop_name = prediction[0]
    elif encoder is not None:
        crop_name = encoder.inverse_transform(prediction)[0]
    else:
        crop_name = str(prediction[0])

    # Confidence score & Probabilities
    conf_scores = []
    worst_crop = "Unknown"
    confidence = 0.85
    
    try:
        conf_arr = model.predict_proba(features_df)[0]
        if encoder is not None:
            classes = encoder.classes_
            conf_scores = [{"crop": str(cls), "prob": round(float(prob), 2)} for cls, prob in zip(classes, conf_arr)]
            conf_scores = sorted(conf_scores, key=lambda x: x["prob"], reverse=True)
            confidence = conf_scores[0]["prob"]
            worst_crop = conf_scores[-1]["crop"]
    except Exception as e:
        print(f"⚠️ Could not parse predict_proba: {e}")

    # TARGET CROP LOGIC
    target_crop_details = None
    if target_crop and target_crop.lower() != crop_name.lower():
        target_info = get_crop_info(target_crop)
        
        if start_date:
            try:
                start_dt = datetime.datetime.strptime(start_date, "%Y-%m-%d")
            except ValueError:
                start_dt = datetime.datetime.now()
        else:
            start_dt = datetime.datetime.now()
            
        current_month = start_dt.month
        season_months = target_info.get("seasonMonths", [])
        
        seasonality_warn = ""
        seasonality_warn_hi = ""
        if season_months and current_month not in season_months:
            months_str = ', '.join([datetime.date(1900, m, 1).strftime('%B') for m in season_months])
            seasonality_warn = f"Warning: The selected month is not ideal for planting {target_crop}. Best months are {months_str}."
            seasonality_warn_hi = f"चेतावनी: चयनित महीना {target_crop} बोने के लिए सही नहीं है। सर्वोत्तम महीने {months_str} हैं।"
            
        harvest_dt = start_dt + datetime.timedelta(days=target_info.get("durationDays", 90))
            
        target_crop_details = {
            "name": target_crop,
            "nameHi": target_info.get("nameHi", target_crop),
            "imageUrl": target_info.get("imageUrl", ""),
            "durationDays": target_info.get("durationDays", 90),
            "seasonalityWarning": seasonality_warn,
            "seasonalityWarningHi": seasonality_warn_hi,
            "harvestDate": harvest_dt.strftime("%Y-%m-%d"),
            "startDate": start_dt.strftime("%Y-%m-%d"),
            "remediationPlanEn": "",
            "remediationPlanHi": "",
            "landInsightsEn": "",
            "landInsightsHi": "",
        }

    # BUILD 5-DAY FORECAST
    days_en = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    days_hi = ["सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि", "रवि"]
    today   = datetime.datetime.now().weekday()

    forecast = []
    for i in range(5):
        day_idx    = (today + i) % 7
        is_rainy   = (rain > 0 and i < 2)
        condition    = "Rain Likely" if is_rainy else "Sunny"
        condition_hi = "बारिश संभव" if is_rainy else "धूप"
        forecast.append({
            "d":  days_en[day_idx],
            "dh": days_hi[day_idx],
            "t":  round(temp - (i * 0.4), 1),
            "c":  condition,
            "ch": condition_hi,
        })

    # ASSEMBLE RESPONSE
    info = get_crop_info(crop_name)
    
    ai_desc = info["description"]
    ai_desc_hi = info["descriptionHi"]

    groq_key = os.getenv("GROQ_API_KEY")
    print(f"🔍 DEBUG: Groq API Key loaded? {'YES' if groq_key else 'NO'}")
    
    extended_ai_data = None
    if groq_key:
        try:
            print("🚀 Generating AI crop description with Groq natively...")
            
            prompt = f"""Act as an agricultural expert. Give detailed insights for the recommended crop {crop_name} growing in {district} Jharkhand under current weather.
"""
            if target_crop and target_crop.lower() != crop_name.lower():
                prompt += f"""
The farmer instead wants to grow a custom target crop: {target_crop} on {land_size_acres} acres.
Provide a STEP-BY-STEP soil remediation plan. Explain how they can improve their current soil (N: {soil['N']}, P: {soil['P']}, K: {soil['K']}, pH: {soil['pH']}) to match the ideal conditions for {target_crop}.
"""
            else:
                prompt += "Leave the target fields as empty strings.\n"

            prompt += f"""
Return EXACTLY a JSON object with this format, NO markdown, NO code block ticks.
{{
  "descriptionEn": "2 to 3 lines describing why {crop_name} thrives and uses.",
  "descriptionHi": "Hindi translation of description.",
  "sloganEn": "A short, catchy, professional 1-line slogan about growing {crop_name}.",
  "sloganHi": "Hindi translation of the slogan.",
  "maintenanceEn": "1-2 lines summarizing primary maintenance required for {crop_name}.",
  "maintenanceHi": "Hindi translation of maintenance.",
  "prosEn": ["advantage 1", "advantage 2", "advantage 3"],
  "prosHi": ["फ़ायदा 1", "फ़ायदा 2", "फ़ायदा 3"],
  "consEn": ["challenge 1", "challenge 2", "challenge 3"],
  "consHi": ["चुनौती 1", "चुनौती 2", "चुनौती 3"],
  "watchOutEn": "1 sentence on a key disease or pest to watch out for. Include WORST CASE scenario.",
  "watchOutHi": "Hindi translation of the watch out warning.",
  "targetLandInsightsEn": "1 sentence describing seed/fertilizer volume required for {target_crop} on {land_size_acres} acres.",
  "targetLandInsightsHi": "Hindi translation.",
  "targetRemediationPlanEn": "Step-by-step string on how to prep the soil for {target_crop}. Use '\\n' for new lines.",
  "targetRemediationPlanHi": "Hindi translation."
}}"""
            ai_data = None
            res_text = ""
            for attempt in range(3):
                try:
                    headers = {"Authorization": f"Bearer {groq_key}", "Content-Type": "application/json"}
                    payload = {"model": "llama-3.3-70b-versatile", "messages": [{"role": "user", "content": prompt}], "temperature": 0.2}
                    resp = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload, timeout=10)
                    resp_json = resp.json()
                    res_text = resp_json["choices"][0]["message"]["content"].strip()
                    
                    # Robust parsing
                    match = re.search(r'\{.*\}', res_text, re.DOTALL)
                    if match:
                        ai_data = json.loads(match.group(0))
                        break # Successfully parsed!
                    else:
                        raise ValueError("No JSON block found in response")
                except Exception as ex:
                    print(f"⚠️ Gemini attempt {attempt+1} failed: {ex}")
                    if attempt < 2:
                        time.sleep(2) # Backoff for rate limits
                    else:
                        raise # Give up and fallback
            
            ai_desc = ai_data.get("descriptionEn", ai_desc)
            ai_desc_hi = ai_data.get("descriptionHi", ai_desc_hi)
            extended_ai_data = ai_data
            
            if target_crop_details and "extended_ai_data" in locals() and extended_ai_data:
                target_crop_details["remediationPlanEn"] = extended_ai_data.get("targetRemediationPlanEn", "")
                target_crop_details["remediationPlanHi"] = extended_ai_data.get("targetRemediationPlanHi", "")
                target_crop_details["landInsightsEn"] = extended_ai_data.get("targetLandInsightsEn", "")
                target_crop_details["landInsightsHi"] = extended_ai_data.get("targetLandInsightsHi", "")
                
            print("✅ Gemini AI full profile successfully injected!")
        except Exception as e:
            print(f"⚠️ Gemini AI generation failed: {e}")
            if 'res_text' in locals():
                print(f"RAW FAILED TEXT WAS: {res_text}")

    # Fill extended fields or fall back
    slogan_en = extended_ai_data.get("sloganEn", "Secure and maximize your yield with data-backed precision.") if extended_ai_data else "Secure and maximize your yield with data-backed precision."
    slogan_hi = extended_ai_data.get("sloganHi", "डेटा-समर्थित निर्णयों से अपनी उपज को सुरक्षित और अधिकतम करें।") if extended_ai_data else "डेटा-समर्थित निर्णयों से अपनी उपज को सुरक्षित और अधिकतम करें।"
    
    maint_en = extended_ai_data.get("maintenanceEn", info["maintenance"]) if extended_ai_data else info["maintenance"]
    maint_hi = extended_ai_data.get("maintenanceHi", info.get("maintenanceHi", info["maintenance"])) if extended_ai_data else info.get("maintenanceHi", info["maintenance"])

    pros_en = extended_ai_data.get("prosEn", info["pros"]) if extended_ai_data else info["pros"]
    pros_hi = extended_ai_data.get("prosHi", info.get("prosHi", info["pros"])) if extended_ai_data else info.get("prosHi", info["pros"])

    cons_en = extended_ai_data.get("consEn", info["cons"]) if extended_ai_data else info["cons"]
    cons_hi = extended_ai_data.get("consHi", info.get("consHi", info["cons"])) if extended_ai_data else info.get("consHi", info["cons"])

    watch_out_en = extended_ai_data.get("watchOutEn", "Consult local guidelines for pest control.") if extended_ai_data else "Consult local guidelines for pest control."
    watch_out_hi = extended_ai_data.get("watchOutHi", "कीट नियंत्रण के लिए स्थानीय कृषि दिशानिर्देशों का पालन करें।") if extended_ai_data else "कीट नियंत्रण के लिए स्थानीय कृषि दिशानिर्देशों का पालन करें।"

    final_result = {
        "crop": {
            "name":          crop_name,
            "nameHi":        info["nameHi"],
            "description":   ai_desc,
            "descriptionHi": ai_desc_hi,
            "aiGenerated":   True if extended_ai_data else False,
            "sloganEn":      slogan_en,
            "sloganHi":      slogan_hi,
            "maintenance":   maint_en,
            "maintenanceHi": maint_hi,
            "pros":          pros_en,
            "prosHi":        pros_hi,
            "cons":          cons_en,
            "consHi":        cons_hi,
            "watchOutEn":    watch_out_en,
            "watchOutHi":    watch_out_hi,
            "imageUrl":      info["imageUrl"],
            "durationDays":  info.get("durationDays", 90),
        },
        "targetCropDetails": target_crop_details,
        "soil": {
            "n":    round(soil['N'],  2),
            "p":    round(soil['P'],  2),
            "k":    round(soil['K'],  2),
            "ph":   round(soil['pH'], 2),
            "temp": round(temp,       1),
            "hum":  hum,
            "rain": round(rain,       2),
        },
        "confidence": confidence,
        "confScores": conf_scores,
        "worstCrop":  worst_crop,
        "forecast":   forecast,
    }

    prediction_cache[cache_key] = (final_result, now)
    return final_result


@app.post("/chat")
def chat(body: ChatRequest):
    message = body.message
    context = body.context or ""
    history = body.history or []
    lang = body.language or "en"
    
    try:
        import os
        import requests
        groq_key = os.getenv("GROQ_API_KEY")
        if not groq_key:
            raise Exception("GROQ_API_KEY is not set.")
        
        system_prompt = f"""
You are AGRI-AI, a concise proprietary agricultural assistant for Farmers in Jharkhand.
Always greet the user warmly if it's the start of the conversation.

YOUR STRICT RULES:
1. When asked to predict a crop or check crop viability, ALWAYS use the `get_ml_crop_prediction` tool. If you do not know the district, ASK the user which district they are farming in first. Do not make assumptions.
2. If predicting a crop, ALWAYS include a markdown hyperlink exactly formatted as: `[Click here for Full Prediction Dashboard](/farmer)`. Do NOT use standard html tags.
3. If the user asks if a specific crop like "Wheat" is good instead of the predicted one, use the `get_ml_crop_prediction` tool providing specific_crop="Wheat". If confidence is low, explain why and contrast it with the recommended one.
4. Correct spelling automatically. Keep responses conversational, empathetic, and extremely concise (Swiggy chat style).
5. If the user asks how long a crop takes to grow, use `fetch_crop_details` tool.
6. Weather, temperature, soil composition (NPK), and pH are ESSENTIAL agriculture data. ALWAYS answer users about them using the DASHBOARD STATE! NEVER decline questions about weather or soil!
7. CRITICAL: The user interface is set to '{lang}'. YOUR ENTIRE TEXT RESPONSE MUST BE IN {'HINDI (Devanagari script)' if lang == 'hi' else 'ENGLISH'}. Do not provide dual translations.
8. NEVER invoke ANY tool (like get_ml_crop_prediction) if the user is just saying "hello", "no", "yes", or making generic small talk! ONLY invoke tools when explicitly asked for farming metrics or crop checks!

DASHBOARD STATE: {context}
"""

        messages = [{"role": "system", "content": system_prompt}]
        for msg in history[-4:]: # Truncate to last 4 messages to prevent TPM Rate Limits
            role = "user" if msg.role == "user" else "assistant"
            messages.append({"role": role, "content": msg.text})
            
        messages.append({"role": "user", "content": message})
        
        tools = [
            {
                "type": "function",
                "function": {
                    "name": "get_ml_crop_prediction",
                    "description": "Executes the Agricultural Machine Learning model for the given district. Call this when a user asks for a prediction OR asks if a specific crop is suitable.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "district_name": {"type": "string"},
                            "specific_crop": {"type": "string"}
                        },
                        "required": ["district_name"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "fetch_crop_details",
                    "description": "Gets farming information like duration days, seasons, pros, cons, and maintenance for a given crop.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "crop_name": {"type": "string"}
                        },
                        "required": ["crop_name"]
                    }
                }
            }
        ]

        headers = {"Authorization": f"Bearer {groq_key}", "Content-Type": "application/json"}
        payload = {"model": "llama-3.3-70b-versatile", "messages": messages, "tools": tools, "tool_choice": "auto", "temperature": 0.3}
        resp = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload, timeout=10)
        data = resp.json()
        
        if "error" in data:
            raise Exception(data["error"].get("message", "Unknown Groq Error"))
            
        response_message = data["choices"][0]["message"]
        
        if response_message.get("tool_calls"):
            # Ensure we only pass arguments dicts back, avoiding full object refs
            messages.append(response_message)
            import json
            for tcall in response_message["tool_calls"]:
                fn_name = tcall["function"]["name"]
                try:
                    fn_args = json.loads(tcall["function"]["arguments"])
                except:
                    fn_args = {}
                
                if fn_name == "get_ml_crop_prediction":
                    res = get_ml_crop_prediction(fn_args.get("district_name", ""), fn_args.get("specific_crop", ""))
                else:
                    res = fetch_crop_details(fn_args.get("crop_name", ""))
                
                messages.append({
                    "role": "tool",
                    "name": fn_name,
                    "content": res,
                    "tool_call_id": tcall["id"]
                })
                
            payload2 = {"model": "llama-3.3-70b-versatile", "messages": messages, "temperature": 0.3}
            resp2 = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload2, timeout=10)
            data2 = resp2.json()
            if "error" in data2:
                raise Exception(data2["error"].get("message", "Unknown Groq Tool Loop Error"))
            final_text = data2["choices"][0]["message"]["content"]
        else:
            final_text = response_message.get("content", "Error generating response.")
            
        return {
            "responseEn": final_text,
            "responseHi": final_text
        }
        
    except Exception as e:
        import traceback
        print(f"Chat generation error: {e}")
        import re
        fallback_msg = f"API Error: {str(e)} "
        all_districts = ["Bokaro", "Chatra", "Deoghar", "Dhanbad", "Dumka", "East Singhbhum", "Garhwa", "Giridih", "Godda", "Gumla", "Hazaribagh", "Jamtara", "Khunti", "Koderma", "Latehar", "Lohardaga", "Pakur", "Palamu", "Ramgarh", "Ranchi", "Sahibganj", "Saraikela-Kharsawan", "Simdega", "West Singhbhum"]
        fallback_dist = None
        for d in all_districts:
            if d.lower() in message.lower():
                fallback_dist = d
                break
        if not fallback_dist:
            dist_match = re.search(r"District:\s*([^,]+)", context)
            fallback_dist = dist_match.group(1).strip() if dist_match else "Ranchi"
        try:
            local_ans = get_ml_crop_prediction(fallback_dist)
            fallback_msg += f"Running local Machine Learning model directly: {local_ans} [Click here for Full Prediction Dashboard](/farmer)"
        except Exception:
            fallback_msg += "Local fallback failed."
        return {
            "responseEn": fallback_msg,
            "responseHi": "एग्री-एआई सर्वर एपीआई कोटा समाप्त हो गया है। स्थानीय मशीन लर्निंग मॉडल चला रहा हूँ..."
        }


# RUN
# uvicorn replaces Flask's dev server
# Run from terminal: uvicorn predict:app --host 0.0.0.0 --port 5001 --reload
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("predict:app", host="0.0.0.0", port=5001, reload=True)