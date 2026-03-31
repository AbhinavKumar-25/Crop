export interface CropDetail {
  descEn: string;
  descHi: string;
  prosEn: string[];
  prosHi: string[];
  consEn: string[];
  consHi: string[];
  challengesEn: string;
  challengesHi: string;
  image: string;
}

export const cropDetails: Record<string, CropDetail> = {
  "Paddy": {
    image: "https://images.unsplash.com/photo-1536657464919-892534f60d6e?auto=format&fit=crop&q=80&w=800",
    descEn: "Paddy (Rice) is the primary staple crop of Jharkhand, thriving in the heavy clay soils of regions like Bokaro and East Singhbhum during the Kharif season.",
    descHi: "धान (चावल) झारखंड की प्राथमिक मुख्य फसल है, जो खरीफ मौसम के दौरान बोकारो और पूर्वी सिंहभूम जैसे क्षेत्रों की भारी मिट्टी में अच्छी तरह से बढ़ती है।",
    prosEn: ["High market demand in local mandis", "Adapted to Jharkhand's heavy monsoon rainfall", "Stalks can be used as cattle fodder"],
    prosHi: ["स्थानीय मंडियों में उच्च बाजार मांग", "झारखंड की भारी मानसूनी बारिश के अनुकूल", "डंठल का उपयोग पशु चारे के रूप में किया जा सकता है"],
    consEn: ["Requires constant water stagnation", "High methane emissions", "Labor intensive transplanting"],
    consHi: ["निरंतर जल भराव की आवश्यकता", "उच्च मीथेन उत्सर्जन", "रोपाई में अधिक श्रम की आवश्यकता"],
    challengesEn: "Blast disease and brown plant hoppers can significantly reduce yield if not monitored.",
    challengesHi: "यदि निगरानी न की जाए तो ब्लास्ट रोग और भूरे पौधे के फुदके उपज को काफी कम कर सकते हैं।"
  },
  "Maize": {
    image: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&q=80&w=800",
    descEn: "Maize is widely grown in the upland regions of Jharkhand. It is highly versatile and serves as a critical food and poultry feed source.",
    descHi: "झारखंड के ऊपरी इलाकों में मक्का व्यापक रूप से उगाया जाता है। यह बहुत बहुमुखी है और भोजन और मुर्गी पालन के चारे के रूप में महत्वपूर्ण है।",
    prosEn: ["Low water requirement compared to rice", "Short duration (90-110 days)", "High energy value for livestock"],
    prosHi: ["चावल की तुलना में कम पानी की आवश्यकता", "कम समय की फसल (90-110 दिन)", "पशुधन के लिए उच्च ऊर्जा मूल्य"],
    consEn: ["Highly sensitive to waterlogging", "Requires high Nitrogen inputs", "Vulnerable to Fall Armyworm"],
    consHi: ["जलभराव के प्रति अत्यधिक संवेदनशील", "अधिक नाइट्रोजन की आवश्यकता", "फॉल आर्मीवर्म कीट का खतरा"],
    challengesEn: "Fall Armyworm (FAW) is a major threat in Jharkhand; requires early biological intervention.",
    challengesHi: "फॉल आर्मीवर्म (FAW) झारखंड में एक बड़ा खतरा है; इसके लिए शुरुआती जैविक उपचार की आवश्यकता होती है।"
  },
  "Wheat": {
    image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80&w=800",
    descEn: "Wheat is a major Rabi crop in Jharkhand, grown in areas with assured irrigation during the cool winter months.",
    descHi: "गेहूं झारखंड में एक प्रमुख रबी फसल है, जो ठंडे सर्दियों के महीनों के दौरान सुनिश्चित सिंचाई वाले क्षेत्रों में उगाई जाती है।",
    prosEn: ["Critical for food security", "High nutritional value", "Good storage life"],
    prosHi: ["खाद्य सुरक्षा के लिए महत्वपूर्ण", "उच्च पोषण मूल्य", "भंडारण की अच्छी क्षमता"],
    consEn: ["Depends heavily on irrigation", "Yield drops significantly if temperature rises early in Feb/March"],
    consHi: ["पूरी तरह सिंचाई पर निर्भर", "फरवरी/मार्च में तापमान जल्दी बढ़ने पर उपज कम हो जाती है"],
    challengesEn: "Yellow Rust and heat stress during the grain-filling stage are primary concerns.",
    challengesHi: "अनाज भरने के चरण के दौरान पीला रतुआ और गर्मी का तनाव प्राथमिक चिंताएं हैं।"
  },
  "Pulses": {
    image: "https://images.unsplash.com/photo-1585994192989-b2d9764f9111?auto=format&fit=crop&q=80&w=800",
    descEn: "Pulses like Arhar and Gram are essential for soil health in Jharkhand as they fix Nitrogen naturally.",
    descHi: "अरहर और चना जैसी दालें झारखंड में मिट्टी के स्वास्थ्य के लिए आवश्यक हैं क्योंकि वे प्राकृतिक रूप से नाइट्रोजन को स्थिर करती हैं।",
    prosEn: ["Fixes nitrogen in soil", "Low water requirement", "High protein source"],
    prosHi: ["मिट्टी में नाइट्रोजन की वृद्धि", "कम पानी की आवश्यकता", "प्रोटीन का उच्च स्रोत"],
    consEn: ["Susceptible to pod borer pests", "Slow growth in initial stages"],
    consHi: ["फली छेदक कीटों के प्रति संवेदनशील", "शुरुआती चरणों में धीमी वृद्धि"],
    challengesEn: "Wilt disease is a common problem in Jharkhand's pulse cultivation.",
    challengesHi: "उकठा (विल्ट) रोग झारखंड की दलहन खेती में एक आम समस्या है।"
  },
  "Mustard": {
    image: "https://images.unsplash.com/photo-1508349083404-96969c060ec4?auto=format&fit=crop&q=80&w=800",
    descEn: "Mustard is a key oilseed crop for Jharkhand, typically grown as a secondary crop in the Rabi season.",
    descHi: "सरसों झारखंड के लिए एक प्रमुख तिलहन फसल है, जो आमतौर पर रबी मौसम में दूसरी फसल के रूप में उगाई जाती है।",
    prosEn: ["High oil content and market value", "Can grow with residual soil moisture"],
    prosHi: ["उच्च तेल की मात्रा और बाजार मूल्य", "मिट्टी की बची हुई नमी के साथ बढ़ सकता है"],
    consEn: ["Very sensitive to frost", "Aphid infestation can destroy crops quickly"],
    consHi: ["पाले के प्रति बहुत संवेदनशील", "माहू (एफिड) का प्रकोप फसलों को जल्दी नष्ट कर सकता है"],
    challengesEn: "White rust and Aphid control are mandatory for a successful harvest.",
    challengesHi: "सफल फसल के लिए सफेद रतुआ और माहू नियंत्रण अनिवार्य है।"
  }
};