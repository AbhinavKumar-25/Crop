from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import requests
import numpy as np
import datetime
import pandas as pd

app = Flask(__name__)
CORS(app)  # Allow React to talk to Python

# ============================================================
# 1. LOAD MODEL FILES (Generated from your .ipynb notebook)
# ============================================================
try:
    model = joblib.load("model.pkl")
    encoder = joblib.load("label_encoder.pkl")
    print("✅ Model and encoder loaded successfully!")
except Exception as e:
    print(f"❌ Error loading model files: {e}")


# ============================================================
# 2. DISTRICT SOIL DATA
# ============================================================
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


# ============================================================
# 3. CROP INFO DATABASE
#    Full bilingual data so the React frontend never crashes.
# ============================================================
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
    "Vegetables": {
        "nameHi": "सब्जियां",
        "description": "High-value short-duration crops with quick market returns, suited for diverse soil types.",
        "descriptionHi": "उच्च मूल्य वाली कम अवधि की फसलें जो जल्दी बाजार में आती हैं और विभिन्न मिट्टी के लिए उपयुक्त हैं।",
        "maintenance": "Requires frequent irrigation, integrated pest management, and organic compost for best yield.",
        "maintenanceHi": "बेहतर उपज के लिए बार-बार सिंचाई, एकीकृत कीट प्रबंधन और जैविक खाद की जरूरत है।",
        "pros": ["High market value per acre", "Multiple quick harvest cycles per year", "Diverse crop options (tomato, brinjal, etc.)"],
        "prosHi": ["प्रति एकड़ उच्च बाजार मूल्य", "प्रति वर्ष कई त्वरित फसल चक्र", "विविध फसल विकल्प (टमाटर, बैंगन आदि)"],
        "cons": ["Highly perishable — needs quick market access", "High labor input required"],
        "consHi": ["जल्दी खराब होती है — त्वरित बाजार पहुंच जरूरी", "अधिक श्रम की आवश्यकता"],
        "imageUrl": "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=800",
    },
    "Oilseeds": {
        "nameHi": "तिलहन",
        "description": "Crops like mustard and linseed grown for edible oil production.",
        "descriptionHi": "सरसों और अलसी जैसी फसलें खाद्य तेल उत्पादन के लिए उगाई जाती हैं।",
        "maintenance": "Requires well-drained soil, moderate rainfall, and minimal irrigation. Mustard is sown in October–November.",
        "maintenanceHi": "अच्छी जल निकासी वाली मिट्टी, मध्यम वर्षा और न्यूनतम सिंचाई की जरूरत है।",
        "pros": ["Good MSP support", "Low water requirement", "Can grow on marginal lands"],
        "prosHi": ["अच्छा MSP समर्थन", "कम पानी की जरूरत", "बंजर जमीन पर भी उग सकता है"],
        "cons": ["Yield affected by frost", "Aphid pest is a major concern"],
        "consHi": ["पाले से उपज प्रभावित होती है", "माहू कीट एक बड़ी चिंता है"],
        "imageUrl": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=800",
    },
}

# Fallback info for any crop the dictionary doesn't cover
def get_crop_info(crop_name):
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


@app.route('/districts', methods=['GET'])
def get_districts():
    # This automatically converts your dictionary keys into a list for the dropdown
    districts = []
    for name in district_soil_data.keys():
        districts.append({
            "code": name,
            "name": name,
            "nameHi": name # You can add a mapping for Hindi names here
        })
    return jsonify(districts)

# ============================================================
# 4. MAIN PREDICTION ROUTE
# ============================================================
@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        district = data.get('district')

        if not district or district not in district_soil_data:
            return jsonify({"error": "Invalid or missing district name."}), 400

        # --- A. GET SOIL DATA ---
        soil = district_soil_data[district]

        # --- B. FETCH REAL-TIME WEATHER ---
        api_key = "ab6cb60f7212eb21a43184223fd05229"
        weather_url = (
            f"https://api.openweathermap.org/data/2.5/weather"
            f"?q={district},IN&appid={api_key}&units=metric"
        )
        w_res = requests.get(weather_url, timeout=10).json()

        # Guard against bad weather API responses
        if "main" not in w_res:
            return jsonify({"error": f"Weather API error: {w_res.get('message', 'Unknown error')}"}), 502

        temp = w_res["main"]["temp"]
        hum  = w_res["main"]["humidity"]
        rain = w_res.get("rain", {}).get("1h", 0.0)  # 0 if not raining

        # --- C. ML PREDICTION ---
        if model is None:
            return jsonify({"error": "Model file not loaded. Check server logs."}), 500

        # Create a Pandas DataFrame with the exact column names from your Jupyter Notebook
        feature_columns = ['N', 'P', 'K', 'Temperature_C', 'Humidity_%', 'pH', 'Rainfall_mm']
        
        features_df = pd.DataFrame([[
            soil['N'], 
            soil['P'], 
            soil['K'], 
            temp, 
            hum, 
            soil['pH'], 
            rain
        ]], columns=feature_columns)
        
        print(f"📡 Sending features to model:\n{features_df}")
        
        # Predict using the DataFrame
        prediction = model.predict(features_df)

        # Robust Decoding: Checks if the output is already a string
        if isinstance(prediction[0], str):
            crop_name = prediction[0]
        elif encoder is not None:
            crop_name = encoder.inverse_transform(prediction)[0]
        else:
            crop_name = str(prediction[0])

        # Confidence Score Check
        try:
            confidence = round(float(model.predict_proba(features_df).max()), 2)
        except AttributeError:
            confidence = 0.85

        # --- D. BUILD 5-DAY FORECAST ---
        days_en = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        days_hi = ["सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि", "रवि"]
        today = datetime.datetime.now().weekday()

        forecast = []
        for i in range(5):
            day_idx = (today + i) % 7
            # Simple heuristic: show rain for first 2 days if it's raining now
            is_rainy = (rain > 0 and i < 2)
            condition    = "Rain Likely" if is_rainy else "Sunny"
            condition_hi = "बारिश संभव" if is_rainy else "धूप"
            forecast.append({
                "d":  days_en[day_idx],
                "dh": days_hi[day_idx],
                "t":  round(temp - (i * 0.4), 1),   # slight temp variation across days
                "c":  condition,
                "ch": condition_hi,
            })

        # --- E. ASSEMBLE FULL RESPONSE ---
        info = get_crop_info(crop_name)

        return jsonify({
            "crop": {
                "name":          crop_name,
                "nameHi":        info["nameHi"],
                "description":   info["description"],
                "descriptionHi": info["descriptionHi"],
                "maintenance":   info["maintenance"],
                "maintenanceEn": info["maintenance"],   # alias expected by FarmerProfile
                "maintenanceHi": info["maintenanceHi"],
                "pros":          info["pros"],
                "prosHi":        info["prosHi"],
                "cons":          info["cons"],
                "consHi":        info["consHi"],
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
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ============================================================
# 5. HEALTH CHECK ROUTE (useful for debugging)
# ============================================================
@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "message": "AgriAI backend is running!"})


# ============================================================
# 6. RUN
#    ✅ FIX: Port changed to 5001 to match cropService.ts (API_BASE_URL)
# ============================================================
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)