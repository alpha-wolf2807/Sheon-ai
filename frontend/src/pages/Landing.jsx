import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Heart, Shield, Brain, Activity, Users, Star, ChevronRight, Sparkles } from 'lucide-react';

const FloatingOrb = ({ className, delay = 0 }) => (
  <div className={`floating-orb ${className}`} style={{ animationDelay: `${delay}s` }} />
);

export default function Landing() {
  const features = [
    { icon: Brain, title: 'AI Risk Intelligence', desc: 'Bias-calibrated predictive engine detects silent risk patterns invisible to standard screening', color: 'text-lavender' },
    { icon: Shield, title: 'Bias Correction', desc: 'Regional and demographic bias adjustments ensure equitable care across rural and tribal areas', color: 'text-violet' },
    { icon: Activity, title: 'Real-Time Monitoring', desc: 'Continuous vital tracking with nurse visit integration and automatic risk recalibration', color: 'text-coral' },
    { icon: Users, title: 'Care Network', desc: 'Coordinated mother-nurse-doctor communication with instant SMS escalation protocols', color: 'text-lavender' },
    { icon: Heart, title: 'Holistic Support', desc: 'Personalized nutrition, exercise, and emotional support through Gemini AI assistance', color: 'text-coral' },
    { icon: Star, title: 'Community', desc: 'Safe peer community for mothers to share experiences and access verified healthcare knowledge', color: 'text-violet' }
  ];

  return (
    <div className="min-h-screen bg-maatri-bg text-white overflow-hidden">
      {/* Ambient orbs */}
      <FloatingOrb className="w-96 h-96 bg-violet/20 top-0 left-0 -translate-x-1/2 -translate-y-1/2" delay={0} />
      <FloatingOrb className="w-80 h-80 bg-coral/10 top-1/3 right-0 translate-x-1/3" delay={2} />
      <FloatingOrb className="w-64 h-64 bg-lavender/10 bottom-0 left-1/4" delay={4} />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #5B2EFF, #C8A2FF)' }}>
            <Heart className="w-5 h-5 text-white" fill="currentColor" />
          </div>
          <span className="font-display text-xl font-semibold">Sheon <span className="text-lavender">AI</span></span>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4">
          <Link to="/login" className="btn-ghost text-sm py-2 px-4">Sign In</Link>
          <Link to="/register" className="btn-primary text-sm py-2 px-4">Get Started</Link>
        </motion.div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 pt-20 pb-32 text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-surface mb-8 text-sm text-lavender">
            <Sparkles className="w-4 h-4" />
            <span>Bias-Calibrated Predictive Maternal Intelligence</span>
          </div>
          
          <h1 className="font-display text-6xl lg:text-8xl font-bold leading-tight mb-6">
            <span className="gradient-text">Every Mother</span>
            <br />
            <span className="text-white/90">Deserves Care</span>
          </h1>
          
          <p className="text-white/50 text-xl max-w-2xl mx-auto mb-12 font-body font-light leading-relaxed">
            Sheon AI detects hidden maternal risk patterns, corrects systemic healthcare biases, and coordinates a full network of care — before complications arise.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link to="/register" className="btn-primary flex items-center gap-2">
              Begin Your Journey <ChevronRight className="w-4 h-4" />
            </Link>
            <Link to="/login" className="btn-ghost flex items-center gap-2">
              Healthcare Portal
            </Link>
          </div>
        </motion.div>

        {/* Hero stats */}
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.8 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20">
          {[
            { label: 'Mothers Monitored', value: '12,400+' },
            { label: 'Risk Cases Detected', value: '3,280+' },
            { label: 'Complications Prevented', value: '892+' },
            { label: 'States Covered', value: '14 States' }
          ].map((stat, i) => (
            <div key={i} className="glass-card p-6 text-center">
              <div className="text-3xl font-display font-bold text-lavender mb-1">{stat.value}</div>
              <div className="text-white/50 text-sm font-body">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Risk Engine Visualization */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 py-20">
        <div className="glass-card p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-lavender text-sm font-body font-medium mb-4 tracking-wider uppercase">Core Technology</div>
              <h2 className="font-display text-4xl font-bold mb-6">Bias-Calibrated<br /><span className="gradient-text">Risk Engine</span></h2>
              <p className="text-white/60 font-body leading-relaxed mb-8">
                Our proprietary algorithm accounts for systemic healthcare disparities. Rural, tribal, and underserved mothers receive risk scores adjusted for access inequality — not just clinical data.
              </p>
              <div className="space-y-3">
                {['Blood Pressure & Hemoglobin Analysis', 'Silent Risk Pattern Detection', 'Regional Bias Adjustment (1.0x–1.5x)', 'Real-time Recalibration Post Nurse Visit'].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-lavender flex-shrink-0" />
                    <span className="text-white/70 font-body text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative flex items-center justify-center">
              {/* Animated Risk Gauge Preview */}
              <div className="relative w-64 h-64">
                <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
                  <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(200,162,255,0.1)" strokeWidth="16" />
                  <circle cx="100" cy="100" r="80" fill="none" stroke="url(#gaugeGrad)" strokeWidth="16"
                    strokeDasharray="402" strokeDashoffset="160" strokeLinecap="round" />
                  <defs>
                    <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#34d399" />
                      <stop offset="50%" stopColor="#facc15" />
                      <stop offset="100%" stopColor="#f87171" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-4xl font-mono font-bold text-white">42</div>
                  <div className="text-yellow-400 font-body text-sm">Moderate</div>
                  <div className="text-white/40 font-body text-xs mt-1">Risk Score</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="font-display text-5xl font-bold mb-4">Complete Care <span className="gradient-text">Ecosystem</span></h2>
          <p className="text-white/50 text-lg font-body max-w-xl mx-auto">From risk detection to emotional support, every aspect of maternal health — powered by intelligence.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }} viewport={{ once: true }}
              className="glass-card p-6 group hover:border-lavender/30 transition-all duration-300">
              <div className={`${f.color} mb-4`}>
                <f.icon className="w-8 h-8" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-white/50 font-body text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Roles */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 py-20">
        <div className="glass-card p-8">
          <h2 className="font-display text-4xl font-bold text-center mb-12">Built for Every <span className="gradient-text">Stakeholder</span></h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { role: 'Mother', desc: 'Personalized risk tracking, nutrition, community & care plans', icon: '💜', color: 'from-violet/20 to-lavender/10' },
              { role: 'Doctor', desc: 'High-risk patient management, case analytics, nurse dispatch', icon: '⚕️', color: 'from-blue-600/20 to-blue-400/10' },
              { role: 'Nurse', desc: 'Visit scheduling, vital recording, real-time risk updates', icon: '🩺', color: 'from-emerald-600/20 to-emerald-400/10' },
              { role: 'Admin', desc: 'Regional heatmaps, staff approval, system analytics & PDF reports', icon: '🛡️', color: 'from-coral/20 to-coral/5' }
            ].map((r, i) => (
              <div key={i} className={`p-6 rounded-2xl bg-gradient-to-br ${r.color} border border-white/5 text-center`}>
                <div className="text-4xl mb-3">{r.icon}</div>
                <div className="font-display font-semibold text-lg mb-2">{r.role}</div>
                <div className="text-white/50 text-sm font-body">{r.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-3xl mx-auto px-8 py-20 text-center">
        <h2 className="font-display text-5xl font-bold mb-6">Start Protecting <span className="gradient-text">Today</span></h2>
        <p className="text-white/50 font-body mb-10">Join thousands of mothers, nurses and doctors building India's most intelligent maternal care network.</p>
        <Link to="/register" className="btn-primary inline-flex items-center gap-2 text-lg">
          Create Your Account <Heart className="w-5 h-5" fill="currentColor" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 text-center text-white/30 text-sm font-body">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Heart className="w-4 h-4 text-lavender" fill="currentColor" />
          <span className="text-white/50">Sheon AI</span>
        </div>
        <p>Bias-Calibrated Predictive Maternal Intelligence & Care Network</p>
      </footer>
    </div>
  );
}
