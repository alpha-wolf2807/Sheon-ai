import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Baby, Moon, Heart, Droplet, Smile, RefreshCw, Plus, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/common/DashboardLayout';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { path: '/mother/dashboard', label: 'Prenatal Dashboard', icon: Heart },
  { path: '/mother/postnatal', label: 'Postnatal Care', icon: Baby },
];

export default function PostnatalDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [moodScore, setMoodScore] = useState(7);
  const [moodNotes, setMoodNotes] = useState('');
  const [feedingType, setFeedingType] = useState('breastfeeding');
  const [feedingDuration, setFeedingDuration] = useState(15);
  const [sleepHours, setSleepHours] = useState(6);
  const [sleepQuality, setSleepQuality] = useState('good');
  const [emotionalSupport, setEmotionalSupport] = useState('');
  const [ppdRisk, setPpdRisk] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get('/mothers/profile').then(res => setProfile(res.data.profile)).catch(() => {});
  }, []);

  const logMood = async () => {
    try {
      const { data } = await axios.post('/mothers/mood-log', { score: moodScore, notes: moodNotes });
      setPpdRisk(data.ppdRisk);
      toast.success('Mood logged!');
      if (data.ppdRisk === 'high' || moodScore <= 3) {
        fetchEmotionalSupport();
      }
    } catch { toast.error('Failed to log mood'); }
  };

  const fetchEmotionalSupport = async () => {
    try {
      const { data } = await axios.post('/gemini/emotional-support', { moodScore, notes: moodNotes });
      setEmotionalSupport(data.response);
    } catch { setEmotionalSupport('You are doing amazingly, mama. Take each moment as it comes. 💜'); }
  };

  const logFeeding = async () => {
    try {
      await axios.post('/mothers/feeding-log', { type: feedingType, duration: feedingDuration, notes: '' });
      toast.success('Feeding logged!');
    } catch { toast.error('Failed to log feeding'); }
  };

  const logSleep = async () => {
    try {
      await axios.post('/mothers/sleep-log', { hours: sleepHours, quality: sleepQuality });
      toast.success('Sleep logged!');
    } catch { toast.error('Failed to log sleep'); }
  };

  const vaccinations = [
    { name: 'BCG', dueAt: 'Birth', completed: true },
    { name: 'Hepatitis B (1st dose)', dueAt: 'Birth', completed: true },
    { name: 'OPV (1st dose)', dueAt: '6 weeks', completed: false },
    { name: 'DPT (1st dose)', dueAt: '6 weeks', completed: false },
    { name: 'Hepatitis B (2nd dose)', dueAt: '6 weeks', completed: false },
    { name: 'OPV (2nd dose)', dueAt: '10 weeks', completed: false },
    { name: 'DPT (2nd dose)', dueAt: '10 weeks', completed: false },
    { name: 'OPV (3rd dose)', dueAt: '14 weeks', completed: false },
    { name: 'Measles', dueAt: '9 months', completed: false }
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Heart },
    { id: 'mood', label: 'Mood & PPD', icon: Smile },
    { id: 'feeding', label: 'Feeding Log', icon: Droplet },
    { id: 'sleep', label: 'Sleep Tracker', icon: Moon },
    { id: 'vaccinations', label: 'Vaccinations', icon: Baby },
  ];

  return (
    <DashboardLayout navItems={navItems} title="Postnatal Care">
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
          <h2 className="font-display text-2xl font-bold">Postnatal Recovery Hub 🌸</h2>
          <p className="text-white/50 font-body text-sm mt-1">Track your recovery and baby's health milestones</p>
        </motion.div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-body font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 ${activeTab === tab.id ? 'text-white' : 'text-white/50 hover:text-white/80'}`}
              style={activeTab === tab.id ? { background: 'linear-gradient(135deg, #FF6F61, #FF9088)' } : { background: 'rgba(28,19,53,0.6)', border: '1px solid rgba(200,162,255,0.1)' }}>
              <tab.icon className="w-4 h-4" />{tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Recovery Status', value: profile?.recoveryStatus || 'Good', color: 'text-emerald-400' },
              { label: 'Baby Weight', value: profile?.babyWeight ? `${profile.babyWeight}kg` : '--', color: 'text-lavender' },
              { label: 'Feeding Type', value: profile?.feedingType || 'Not set', color: 'text-coral' },
              { label: 'Mood Score', value: `${profile?.postpartumMoodScore || '--'}/10`, color: 'text-yellow-400' }
            ].map((s, i) => (
              <div key={i} className="glass-card p-4 text-center">
                <div className={`text-2xl font-display font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-white/40 font-body mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'mood' && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <h3 className="font-display text-lg font-semibold mb-4">Daily Mood Check-in</h3>
              <div className="mb-6">
                <label className="text-sm text-white/60 font-body mb-3 block">How are you feeling today? ({moodScore}/10)</label>
                <input type="range" min={1} max={10} value={moodScore} onChange={e => setMoodScore(Number(e.target.value))}
                  className="w-full accent-lavender" />
                <div className="flex justify-between text-xs text-white/40 font-body mt-1">
                  <span>😔 Very Low</span><span>😊 Great</span>
                </div>
              </div>
              <textarea value={moodNotes} onChange={e => setMoodNotes(e.target.value)}
                className="input-field resize-none mb-4" rows={3} placeholder="Share what's on your mind (optional)..." />
              <button onClick={logMood} className="btn-coral w-full flex items-center justify-center gap-2">
                <Smile className="w-4 h-4" /> Log My Mood
              </button>

              {ppdRisk && (
                <div className={`mt-4 p-3 rounded-xl ${ppdRisk === 'high' ? 'bg-red-500/10 border border-red-500/20' : ppdRisk === 'moderate' ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-emerald-500/10 border border-emerald-500/20'}`}>
                  <div className={`text-sm font-body font-medium ${ppdRisk === 'high' ? 'text-red-400' : ppdRisk === 'moderate' ? 'text-yellow-400' : 'text-emerald-400'}`}>
                    {ppdRisk === 'high' ? '🔴 High PPD Risk Detected' : ppdRisk === 'moderate' ? '⚠️ Moderate Risk — Monitor closely' : '✅ Low Risk — Keep going!'}
                  </div>
                  {ppdRisk !== 'low' && <p className="text-white/50 text-xs font-body mt-1">Please speak with your doctor or a mental health professional.</p>}
                </div>
              )}
            </div>

            {emotionalSupport && (
              <div className="glass-card p-6">
                <h3 className="font-display text-lg font-semibold mb-4">Your Personal Support Message 💜</h3>
                <div className="p-5 rounded-2xl font-body text-white/80 leading-relaxed"
                  style={{ background: 'linear-gradient(135deg, rgba(91,46,255,0.1), rgba(200,162,255,0.05))', border: '1px solid rgba(200,162,255,0.15)' }}>
                  {emotionalSupport}
                </div>
                <button onClick={fetchEmotionalSupport} className="btn-ghost w-full mt-4 text-sm py-2 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4" /> Get Another Message
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'feeding' && (
          <div className="glass-card p-6">
            <h3 className="font-display text-lg font-semibold mb-6">Feeding Tracker 🍼</h3>
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="text-sm text-white/60 font-body mb-2 block">Feeding Type</label>
                <select value={feedingType} onChange={e => setFeedingType(e.target.value)} className="input-field">
                  <option value="breastfeeding">Breastfeeding</option>
                  <option value="formula">Formula</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-white/60 font-body mb-2 block">Duration (minutes)</label>
                <input type="number" value={feedingDuration} onChange={e => setFeedingDuration(e.target.value)} className="input-field" />
              </div>
              <div className="flex items-end">
                <button onClick={logFeeding} className="btn-primary w-full flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" /> Log Feeding
                </button>
              </div>
            </div>
            <div className="p-4 rounded-xl" style={{ background: 'rgba(200,162,255,0.08)', border: '1px solid rgba(200,162,255,0.15)' }}>
              <p className="text-lavender font-body font-medium mb-2 text-sm">Breastfeeding Tips</p>
              <ul className="text-white/60 text-sm font-body space-y-1">
                <li>• Feed 8-12 times in 24 hours for newborns</li>
                <li>• Look for hunger cues: rooting, sucking motions</li>
                <li>• Ensure proper latch to avoid nipple pain</li>
                <li>• Stay well-hydrated — drink 8-10 glasses of water</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'sleep' && (
          <div className="glass-card p-6">
            <h3 className="font-display text-lg font-semibold mb-6">Sleep Tracker 😴</h3>
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="text-sm text-white/60 font-body mb-2 block">Hours Slept</label>
                <input type="number" step="0.5" min={0} max={12} value={sleepHours} onChange={e => setSleepHours(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="text-sm text-white/60 font-body mb-2 block">Sleep Quality</label>
                <select value={sleepQuality} onChange={e => setSleepQuality(e.target.value)} className="input-field">
                  {['poor', 'fair', 'good', 'excellent'].map(q => <option key={q} value={q}>{q.charAt(0).toUpperCase() + q.slice(1)}</option>)}
                </select>
              </div>
              <div className="flex items-end">
                <button onClick={logSleep} className="btn-primary w-full flex items-center justify-center gap-2">
                  <Moon className="w-4 h-4" /> Log Sleep
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'vaccinations' && (
          <div className="glass-card p-6">
            <h3 className="font-display text-lg font-semibold mb-6">Baby Vaccination Schedule 💉</h3>
            <div className="space-y-3">
              {vaccinations.map((v, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl"
                  style={{ background: 'rgba(28,19,53,0.6)', border: `1px solid ${v.completed ? 'rgba(52,211,153,0.2)' : 'rgba(200,162,255,0.1)'}` }}>
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${v.completed ? 'bg-emerald-400' : 'bg-white/20'}`} />
                    <div>
                      <div className="font-body font-medium text-sm">{v.name}</div>
                      <div className="text-xs text-white/40 font-body">Due: {v.dueAt}</div>
                    </div>
                  </div>
                  <span className={`text-xs font-body ${v.completed ? 'text-emerald-400' : 'text-yellow-400'}`}>
                    {v.completed ? '✅ Done' : '⏳ Pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
