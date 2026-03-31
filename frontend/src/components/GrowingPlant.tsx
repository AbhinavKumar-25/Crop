import { motion } from "framer-motion";

const GrowingPlant = () => {
  return (
    <div className="relative w-40 h-40 flex items-center justify-center">
      {/* Container SVG */}
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-[0_0_20px_rgba(34,197,94,0.4)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Gradients definitions */}
        <defs>
          <linearGradient id="plantGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4ade80" /> {/* Light Green */}
            <stop offset="100%" stopColor="#166534" /> {/* Deep Green */}
          </linearGradient>
        </defs>

        {/* 1. The main stem - Animates its path length */}
        <motion.path
          d="M50 100 C 50 80, 48 60, 52 30"
          stroke="url(#plantGradient)"
          strokeWidth="4"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2.5, ease: "easeInOut" }}
        />

        {/* 2. Lower Left Leaf - Delay-sprouts */}
        <motion.path
          d="M51 80 Q 20 70, 30 40 Q 45 40, 50 75"
          fill="#15803d"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1.2, duration: 1, type: "spring" }}
          style={{ originX: "50px", originY: "80px" }}
        />

        {/* 3. Lower Right Leaf - Delay-sprouts */}
        <motion.path
          d="M49 70 Q 80 60, 70 30 Q 55 30, 50 65"
          fill="#166534"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1.8, duration: 1, type: "spring" }}
          style={{ originX: "50px", originY: "70px" }}
        />

        {/* 4. Upper Left Leaf - Delay-sprouts */}
        <motion.path
          d="M51 55 Q 30 45, 38 25 Q 48 25, 50 50"
          fill="#4ade80"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 2.3, duration: 0.8 }}
          style={{ originX: "50px", originY: "55px" }}
        />

        {/* 5. The Sprout Tip */}
        <motion.circle
          cx="52"
          cy="30"
          r="4"
          fill="#86efac"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 2.8, duration: 0.5 }}
        />
      </svg>
      
      {/* Optional: Add a subtle dirt base */}
      <motion.div 
        className="absolute bottom-1 w-16 h-2 bg-yellow-900/30 rounded-full blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
      />
    </div>
  );
};

export default GrowingPlant;