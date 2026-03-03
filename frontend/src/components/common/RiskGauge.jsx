import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

export default function RiskGauge({ score = 0, level = 'low', size = 220 }) {
  const [displayScore, setDisplayScore] = useState(0);
  
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const halfCirc = circumference / 2;
  const offset = halfCirc - (displayScore / 100) * halfCirc;

  const levelConfig = {
    low: { color: '#34d399', gradient: ['#10b981', '#34d399'], label: 'Low Risk', emoji: '✅' },
    moderate: { color: '#facc15', gradient: ['#f59e0b', '#facc15'], label: 'Moderate Risk', emoji: '⚠️' },
    high: { color: '#f87171', gradient: ['#ef4444', '#f87171'], label: 'High Risk', emoji: '🔴' }
  };
  const cfg = levelConfig[level] || levelConfig.low;

  useEffect(() => {
    const timer = setTimeout(() => {
      let current = 0;
      const interval = setInterval(() => {
        current += 2;
        if (current >= score) { setDisplayScore(score); clearInterval(interval); }
        else setDisplayScore(current);
      }, 20);
      return () => clearInterval(interval);
    }, 300);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size / 1.3 }}>
        <svg width={size} height={size / 1.3} viewBox="-10 -10 220 150" className="overflow-visible">
          <defs>
            <linearGradient id={`gaugeGrad-${level}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={cfg.gradient[0]} />
              <stop offset="100%" stopColor={cfg.gradient[1]} />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Background track */}
          <path d={`M 10 100 A 90 90 0 0 1 190 100`} fill="none" stroke="rgba(200,162,255,0.1)" strokeWidth="16" strokeLinecap="round" />
          
          {/* Tick marks */}
          {[0, 25, 50, 75, 100].map((tick) => {
            const angle = -180 + (tick / 100) * 180;
            const rad = (angle * Math.PI) / 180;
            const cx = 100 + 90 * Math.cos(rad);
            const cy = 100 + 90 * Math.sin(rad);
            return <circle key={tick} cx={cx} cy={cy} r="3" fill={tick <= score ? cfg.color : 'rgba(255,255,255,0.15)'} />;
          })}

          {/* Risk zones */}
          <path d={`M 10 100 A 90 90 0 0 1 100 10`} fill="none" stroke="rgba(52,211,153,0.2)" strokeWidth="16" strokeLinecap="butt" />
          <path d={`M 100 10 A 90 90 0 0 1 155 28`} fill="none" stroke="rgba(250,204,21,0.2)" strokeWidth="16" strokeLinecap="butt" />
          <path d={`M 155 28 A 90 90 0 0 1 190 100`} fill="none" stroke="rgba(248,113,113,0.2)" strokeWidth="16" strokeLinecap="butt" />

          {/* Animated fill */}
          <path
            d={`M 10 100 A 90 90 0 0 1 190 100`}
            fill="none"
            stroke={`url(#gaugeGrad-${level})`}
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={`${(displayScore / 100) * halfCirc} ${halfCirc}`}
            style={{ filter: 'url(#glow)', transition: 'stroke-dasharray 0.05s linear' }}
          />

          {/* Needle */}
          {(() => {
            const angle = -180 + (displayScore / 100) * 180;
            const rad = (angle * Math.PI) / 180;
            const nx = 100 + 72 * Math.cos(rad);
            const ny = 100 + 72 * Math.sin(rad);
            return (
              <line x1="100" y1="100" x2={nx} y2={ny}
                stroke={cfg.color} strokeWidth="2.5" strokeLinecap="round"
                style={{ filter: 'url(#glow)', transition: 'x2 0.05s linear, y2 0.05s linear' }} />
            );
          })()}
          <circle cx="100" cy="100" r="6" fill={cfg.color} style={{ filter: 'url(#glow)' }} />
        </svg>
        
        {/* Center score - centered properly */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-4xl font-mono font-bold" style={{ color: cfg.color }}>{displayScore}</div>
          <div className="text-xs text-white/40 font-body">/ 100</div>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="mt-4 text-center">
        <div className="text-lg font-body font-medium" style={{ color: cfg.color }}>
          {cfg.emoji} {cfg.label}
        </div>
        <div className="text-xs text-white/40 font-body mt-1">Calibrated Risk Score</div>
      </motion.div>
    </div>
  );
}
