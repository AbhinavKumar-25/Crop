import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface FloatingParticlesProps {
  className?: string;
}

const FloatingParticles: React.FC<FloatingParticlesProps> = ({ className = "" }) => {

  const particles = useMemo(() => {
    return Array.from({ length: 60 }).map((_, i) => ({
      id: i,

      x: Math.random() * 100,
      y: Math.random() * 100 + 20,
      size: Math.random() * 5 + 2,
      duration: Math.random() * 25 + 20,
      delay: Math.random() * -30,
      color: Math.random() > 0.85 ? '#fbbf24' : (Math.random() > 0.5 ? '#a7f3d0' : '#86efac')
    }));
  }, []);

  return (
    <div className={`pointer-events-none z-0 absolute inset-0 overflow-hidden ${className}`}>
      {particles.map((p) => {

        const driftX = (Math.random() - 0.5) * 30;

        return (
          <motion.div
            key={p.id}

            className="absolute rounded-full mix-blend-screen"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.x}%`,
              top: `${p.y}%`,
              backgroundColor: p.color,
              boxShadow: `0 0 ${p.size * 3}px ${p.color}, 0 0 ${p.size}px white`,
              filter: `blur(${Math.random() * 1.5}px)`,
            }}
            animate={{

              y: [`0vh`, `-80vh`],

              x: [`0vw`, `${driftX}vw`],

              opacity: [0, Math.random() * 0.4 + 0.4, Math.random() * 0.6 + 0.4, 0]
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              ease: "linear",
              delay: p.delay,
            }}
          />
        );
      })}
    </div>
  );
};

export default FloatingParticles;
