from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import requests
import datetime
import time
import pandas as pd
from dotenv import load_dotenv
import os
import json
import re
from google import genai

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


# REQUEST / RESPONSE MODELS
class PredictRequest(BaseModel):
    district: str


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

    # VALIDATE DISTRICT
    if district not in district_soil_data:
        raise HTTPException(status_code=400, detail="Invalid or missing district name.")

    # CHECK CACHE
    now = time.time()
    if district in prediction_cache:
        cached_result, timestamp = prediction_cache[district]
        if now - timestamp < CACHE_TTL_SECONDS:
            print(f"📦 Returning cached prediction for {district}")
            return cached_result

    soil = district_soil_data[district]

    # FETCH REAL-TIME WEATHER
    api_key = os.getenv("OPENWEATHER_API_KEY")
    weather_url = (
        f"https://api.openweathermap.org/data/2.5/weather"
        f"?q={district},IN&appid={api_key}&units=metric"
    )

    try:
        w_res = requests.get(weather_url, timeout=10).json()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Weather API request failed: {e}")

    if "main" not in w_res:
        raise HTTPException(
            status_code=502,
            detail=f"Weather API error: {w_res.get('message', 'Unknown error')}"
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

    # Confidence score
    try:
        confidence = round(float(model.predict_proba(features_df).max()), 2)
    except AttributeError:
        confidence = 0.85

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

    gemini_key = os.getenv("GEMINI_API_KEY")
    print(f"🔍 DEBUG: Gemini API Key loaded? {'YES' if gemini_key else 'NO'}")
    
    if gemini_key:
        try:
            print("🚀 Generating AI crop description...")
            client = genai.Client(api_key=gemini_key)
            prompt = f"""Act as an agricultural expert. Give detailed insights for the crop {crop_name} growing in {district} Jharkhand under current weather.
Return EXACTLY a JSON object with this format, NO markdown, NO code block ticks.
{{
  "descriptionEn": "2 to 3 lines describing why it thrives and uses.",
  "descriptionHi": "Hindi translation of description.",
  "sloganEn": "A short, catchy, professional 1-line slogan about growing this crop.",
  "sloganHi": "Hindi translation of the slogan.",
  "maintenanceEn": "1-2 lines summarizing primary maintenance required.",
  "maintenanceHi": "Hindi translation of maintenance.",
  "prosEn": ["advantage 1", "advantage 2", "advantage 3"],
  "prosHi": ["फ़ायदा 1", "फ़ायदा 2", "फ़ायदा 3"],
  "consEn": ["challenge 1", "challenge 2", "challenge 3"],
  "consHi": ["चुनौती 1", "चुनौती 2", "चुनौती 3"],
  "watchOutEn": "1 sentence on a key disease or pest to watch out for.",
  "watchOutHi": "Hindi translation of the watch out warning."
}}"""
            ai_data = None
            res_text = ""
            for attempt in range(3):
                try:
                    gen_res = client.models.generate_content(model='gemini-2.5-flash', contents=prompt)
                    res_text = gen_res.text.strip()
                    
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
            print("✅ Gemini AI full profile successfully injected!")
        except Exception as e:
            print(f"⚠️ Gemini AI generation failed: {e}")
            if 'res_text' in locals():
                print(f"RAW FAILED TEXT WAS: {res_text}")

    # Fill extended fields or fall back
    slogan_en = extended_ai_data.get("sloganEn", "Secure and maximize your yield with data-backed precision.") if "extended_ai_data" in locals() else "Secure and maximize your yield with data-backed precision."
    slogan_hi = extended_ai_data.get("sloganHi", "डेटा-समर्थित निर्णयों से अपनी उपज को सुरक्षित और अधिकतम करें।") if "extended_ai_data" in locals() else "डेटा-समर्थित निर्णयों से अपनी उपज को सुरक्षित और अधिकतम करें।"
    
    maint_en = extended_ai_data.get("maintenanceEn", info["maintenance"]) if "extended_ai_data" in locals() else info["maintenance"]
    maint_hi = extended_ai_data.get("maintenanceHi", info.get("maintenanceHi", info["maintenance"])) if "extended_ai_data" in locals() else info.get("maintenanceHi", info["maintenance"])

    pros_en = extended_ai_data.get("prosEn", info["pros"]) if "extended_ai_data" in locals() else info["pros"]
    pros_hi = extended_ai_data.get("prosHi", info.get("prosHi", info["pros"])) if "extended_ai_data" in locals() else info.get("prosHi", info["pros"])

    cons_en = extended_ai_data.get("consEn", info["cons"]) if "extended_ai_data" in locals() else info["cons"]
    cons_hi = extended_ai_data.get("consHi", info.get("consHi", info["cons"])) if "extended_ai_data" in locals() else info.get("consHi", info["cons"])

    watch_out_en = extended_ai_data.get("watchOutEn", "Consult local guidelines for pest control.") if "extended_ai_data" in locals() else "Consult local guidelines for pest control."
    watch_out_hi = extended_ai_data.get("watchOutHi", "कीट नियंत्रण के लिए स्थानीय कृषि दिशानिर्देशों का पालन करें।") if "extended_ai_data" in locals() else "कीट नियंत्रण के लिए स्थानीय कृषि दिशानिर्देशों का पालन करें。"

    final_result = {
        "crop": {
            "name":          crop_name,
            "nameHi":        info["nameHi"],
            "description":   ai_desc,
            "descriptionHi": ai_desc_hi,
            "aiGenerated":   True if "extended_ai_data" in locals() else False,
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
        },
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
        "forecast":   forecast,
    }

    prediction_cache[district] = (final_result, now)
    return final_result


# RUN
# uvicorn replaces Flask's dev server
# Run from terminal: uvicorn predict:app --host 0.0.0.0 --port 5001 --reload
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("predict:app", host="0.0.0.0", port=5001, reload=True)