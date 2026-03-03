import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Heart, Apple, Dumbbell, MessageCircle, Users, Baby, AlertTriangle, TrendingUp, Stethoscope, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/common/DashboardLayout';
import RiskGauge from '../../components/common/RiskGauge';
import ChatPanel from '../../components/common/ChatPanel';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { path: '/mother/dashboard', label: 'Prenatal Dashboard', icon: Heart },
  { path: '/mother/postnatal', label: 'Postnatal Care', icon: Baby },
];

export default function PrenatalDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [babyUpdate, setBabyUpdate] = useState('');
  const [nutrition, setNutrition] = useState(null);
  const [exercise, setExercise] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [riskLoading, setRiskLoading] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [formData, setFormData] = useState({});
  const [communityPosts, setCommunityPosts] = useState([]);
  const [commentDrafts, setCommentDrafts] = useState({});
  const [newPost, setNewPost] = useState('');
  const [postCategory, setPostCategory] = useState('general');

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [profileRes] = await Promise.all([axios.get('/mothers/profile')]);
      setProfile(profileRes.data.profile);
      setFormData({
        bloodPressureSystolic: profileRes.data.profile?.bloodPressureSystolic || '',
        bloodPressureDiastolic: profileRes.data.profile?.bloodPressureDiastolic || '',
        hemoglobin: profileRes.data.profile?.hemoglobin || '',
        bloodSugar: profileRes.data.profile?.bloodSugar || '',
        distanceToHospital: profileRes.data.profile?.distanceToHospital || '',
        symptoms: (profileRes.data.profile?.symptoms || []).join(', '),
        weekOfPregnancy: profileRes.data.profile?.weekOfPregnancy || '',
        age: profileRes.data.profile?.age || '',
        region: profileRes.data.profile?.region || ''
      });
      
      if (profileRes.data.profile?.riskScore) {
        setRiskData({ calibratedScore: profileRes.data.profile.riskScore, riskLevel: profileRes.data.profile.riskLevel });
      }
    } catch (err) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const calculateRisk = async () => {
    setRiskLoading(true);
    try {
      const vitals = {
        bloodPressureSystolic: Number(formData.bloodPressureSystolic) || undefined,
        bloodPressureDiastolic: Number(formData.bloodPressureDiastolic) || undefined,
        hemoglobin: Number(formData.hemoglobin) || undefined,
        bloodSugar: Number(formData.bloodSugar) || undefined,
        distanceToHospital: Number(formData.distanceToHospital) || undefined,
        symptoms: formData.symptoms ? formData.symptoms.split(',').map(s => s.trim()) : [],
        age: Number(formData.age) || undefined,
        region: formData.region,
        weekOfPregnancy: Number(formData.weekOfPregnancy) || undefined
      };
      // Update profile first
      await axios.put('/mothers/profile', vitals);
      const { data } = await axios.post('/risk/calculate', vitals);
      setRiskData(data);
      setProfile(prev => ({ ...prev, riskLevel: data.riskLevel, riskScore: data.calibratedScore }));
      toast.success('Risk score updated!');
    } catch (err) {
      toast.error('Risk calculation failed');
    } finally {
      setRiskLoading(false);
    }
  };

  const fetchBabyUpdate = async () => {
    try {
      const { data } = await axios.get('/gemini/baby-update');
      // construct a friendly string from returned object
      const u = data.update;
      if (u) {
        const facts = (u.facts || []).join('. ');
        setBabyUpdate(`${u.playful}\n\nSize: ${u.size}.\n${facts ? 'Facts: ' + facts + '.' : ''}\n\n${u.tip}`);
      } else setBabyUpdate('Your baby is growing beautifully! 💕 Each week brings amazing new milestones.');
    } catch { setBabyUpdate('Your baby is growing beautifully! 💕 Each week brings amazing new milestones.'); }
  };

  const fetchNutrition = async () => {
    try {
      const { data } = await axios.get('/gemini/nutrition');
      // normalize to UI-friendly card array
      const cards = [];
      if (data.recommendations && data.recommendations.length) {
        cards.push({ category: 'Recommendations', foods: data.recommendations, tip: '' });
      }
      if (data.mealPlan) {
        const foods = Object.values(data.mealPlan).map(v => v);
        cards.push({ category: 'Sample Meal Plan', foods, tip: 'Adjust portions based on appetite and clinician advice.' });
      }
      setNutrition(cards);
    } catch {}
  };

  const fetchExercise = async () => {
    try {
      const { data } = await axios.get('/gemini/exercise-plan');
      // map to UI objects
      const exs = (data.exercises || []).map((e, i) => ({ name: e, duration: i === 0 ? '10 min' : '5-10 min', benefit: 'Improve circulation and comfort', caution: 'None' }));
      setExercise(exs);
    } catch {}
  };

  const loadTabData = (tab) => {
    setActiveTab(tab);
    if (tab === 'baby' && !babyUpdate) fetchBabyUpdate();
    if (tab === 'nutrition' && !nutrition) fetchNutrition();
    if (tab === 'exercise' && !exercise) fetchExercise();
    if (tab === 'community') fetchCommunity();
  };

  const fetchCommunity = async () => {
    try {
      const { data } = await axios.get('/community/posts');
      setCommunityPosts(data.posts);
    } catch {}
  };

  const toggleLike = async (postId, idx) => {
    try {
      const { data } = await axios.post(`/community/posts/${postId}/like`);
      setCommunityPosts(prev => {
        const copy = [...prev];
        if (copy[idx]) {
          // set likes count according to server to avoid double-count issues
          copy[idx].likes = new Array(data.likesCount).fill(null);
          copy[idx].liked = data.liked;
        }
        return copy;
      });
    } catch (err) {
      toast.error('Failed to toggle like');
    }
  };

  const submitComment = async (postId, idx) => {
    const content = (commentDrafts[postId] || '').trim();
    if (!content) return;
    try {
      const { data } = await axios.post(`/community/posts/${postId}/comment`, { content });
      setCommunityPosts(prev => {
        const copy = [...prev];
        copy[idx] = data.post;
        return copy;
      });
      setCommentDrafts(d => ({ ...d, [postId]: '' }));
    } catch (err) { toast.error('Failed to post comment'); }
  };

  const submitPost = async () => {
    if (!newPost.trim()) return;
    try {
      await axios.post('/community/posts', { content: newPost, category: postCategory });
      setNewPost('');
      fetchCommunity();
      toast.success('Post shared!');
    } catch { toast.error('Failed to post'); }
  };

  const requestNurseVisit = async () => {
    try {
      await axios.post('/mothers/request-nurse-visit', { notes: 'Requested from dashboard' });
      toast.success('Nurse visit requested! You will be contacted soon.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Request failed');
    }
  };

  const tabs = [
    { id: 'overview', label: 'Risk Overview', icon: Activity },
    { id: 'baby', label: 'Baby Growth', icon: Baby },
    { id: 'nutrition', label: 'Nutrition', icon: Apple },
    { id: 'exercise', label: 'Exercise', icon: Dumbbell },
    { id: 'community', label: 'Community', icon: Users },
    { id: 'chat', label: 'Doctor Chat', icon: MessageCircle }
  ];

  return (
    <DashboardLayout navItems={navItems} title="Prenatal Dashboard">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-2 border-lavender border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Welcome */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="font-display text-2xl font-bold">Hello, {user?.name?.split(' ')[0]} 💜</h2>
                <p className="text-white/50 font-body text-sm mt-1">
                  {profile?.weekOfPregnancy ? `Week ${profile.weekOfPregnancy} of pregnancy` : 'Update your health details below'}
                  {profile?.trimester && ` · Trimester ${profile.trimester}`}
                </p>
              </div>
              <div className="flex gap-3 items-center">
                {profile?.riskLevel && (
                  <span className={`badge-${profile.riskLevel}`}>
                    {profile.riskLevel.charAt(0).toUpperCase() + profile.riskLevel.slice(1)} Risk
                  </span>
                )}
                <button onClick={requestNurseVisit} className="btn-ghost text-sm py-2 flex items-center gap-2">
                  <Stethoscope className="w-4 h-4" /> Request Nurse Visit
                </button>
              </div>
            </div>
          </motion.div>

          {/* Tab navigation */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => loadTabData(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-body font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                  activeTab === tab.id
                    ? 'text-white' : 'text-white/50 hover:text-white/80'
                }`}
                style={activeTab === tab.id ? { background: 'linear-gradient(135deg, #5B2EFF, #7A56FF)' } : { background: 'rgba(28,19,53,0.6)', border: '1px solid rgba(200,162,255,0.1)' }}>
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === 'overview' && (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Vitals Input */}
              <div className="glass-card p-6">
                <h3 className="font-display text-lg font-semibold mb-4">Update Health Vitals</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'age', label: 'Age (years)', placeholder: '25' },
                    { key: 'weekOfPregnancy', label: 'Pregnancy Week', placeholder: '20' },
                    { key: 'bloodPressureSystolic', label: 'BP Systolic', placeholder: '120' },
                    { key: 'bloodPressureDiastolic', label: 'BP Diastolic', placeholder: '80' },
                    { key: 'hemoglobin', label: 'Hemoglobin (g/dL)', placeholder: '11.5' },
                    { key: 'bloodSugar', label: 'Blood Sugar (mg/dL)', placeholder: '90' },
                    { key: 'distanceToHospital', label: 'Distance to Hospital (km)', placeholder: '15' },
                    { key: 'region', label: 'Region', placeholder: 'e.g. Chennai or Bihar Rural' }
                  ].map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label className="text-xs text-white/50 font-body mb-1 block">{label}</label>
                      <input value={formData[key] || ''} onChange={e => setFormData(f => ({ ...f, [key]: e.target.value }))}
                        className="input-field py-2 text-sm" placeholder={placeholder} />
                    </div>
                  ))}
                  <div className="col-span-2">
                    <label className="text-xs text-white/50 font-body mb-1 block">Symptoms (comma-separated)</label>
                    <input value={formData.symptoms || ''} onChange={e => setFormData(f => ({ ...f, symptoms: e.target.value }))}
                      className="input-field py-2 text-sm" placeholder="headache, swelling, blurred vision" />
                  </div>
                </div>
                <button onClick={calculateRisk} disabled={riskLoading}
                  className="btn-primary w-full mt-4 flex items-center justify-center gap-2 disabled:opacity-60">
                  {riskLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
                  {riskLoading ? 'Calculating...' : 'Calculate My Risk Score'}
                </button>
              </div>

              {/* Risk Gauge */}
              <div className="glass-card p-6 flex flex-col items-center">
                <h3 className="font-display text-lg font-semibold mb-4 self-start">Risk Assessment</h3>
                {riskData ? (
                  <>
                    <RiskGauge score={riskData.calibratedScore} level={riskData.riskLevel} />
                    
                    {riskData.biasAdjustment && (
                      <div className="mt-4 w-full p-3 rounded-xl text-xs font-body" style={{ background: 'rgba(200,162,255,0.08)', border: '1px solid rgba(200,162,255,0.15)' }}>
                        <div className="text-lavender font-medium mb-1">Bias Calibration Applied</div>
                        <div className="text-white/60">Multiplier: {riskData.biasAdjustment.multiplier}x · {riskData.biasAdjustment.reason}</div>
                        <div className="flex gap-4 mt-2 text-white/50">
                          <span>Raw: {riskData.uncalibratedScore}</span>
                          <span>→</span>
                          <span className="text-lavender">Calibrated: {riskData.calibratedScore}</span>
                        </div>
                      </div>
                    )}

                    <button onClick={() => setShowBreakdown(!showBreakdown)}
                      className="mt-3 w-full btn-ghost text-sm py-2 flex items-center justify-center gap-2">
                      {showBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      {showBreakdown ? 'Hide' : 'Show'} Risk Breakdown
                    </button>

                    {showBreakdown && riskData.breakdown && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="w-full mt-3 space-y-2">
                        {Object.entries(riskData.breakdown).filter(([k]) => k !== 'silentRisk').map(([key, val]) => (
                          <div key={key} className="flex items-center justify-between text-sm">
                            <span className="text-white/60 font-body capitalize">{key}</span>
                            <div className="flex items-center gap-3">
                              <div className="w-24 h-1.5 rounded-full bg-white/10 overflow-hidden">
                                <div className="h-full rounded-full bg-lavender" style={{ width: `${val.score}%` }} />
                              </div>
                              <span className={`text-xs font-body ${val.score > 65 ? 'text-red-400' : val.score > 35 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                                {val.status}
                              </span>
                            </div>
                          </div>
                        ))}
                        {riskData.breakdown.silentRisk?.detected && (
                          <div className="mt-3 p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                            <div className="text-red-400 text-xs font-body font-medium mb-1 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Silent Risk Detected
                            </div>
                            {riskData.breakdown.silentRisk.flags.map((flag, i) => (
                              <div key={i} className="text-white/70 text-xs font-body">{flag}</div>
                            ))}
                          </div>
                        )}
                        {riskData.recommendations?.map((rec, i) => (
                          <div key={i} className="text-xs text-white/60 font-body flex items-start gap-2 mt-1">
                            <span className="text-lavender flex-shrink-0">→</span>{rec}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12 text-white/40">
                    <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-body text-sm">Enter your vitals and calculate your risk score</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'baby' && (
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display text-xl font-semibold">Baby Growth Update ✨</h3>
                <button onClick={fetchBabyUpdate} className="btn-ghost text-sm py-2 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" /> Refresh
                </button>
              </div>
              {babyUpdate ? (
                <div className="p-6 rounded-2xl text-white/80 font-body leading-relaxed text-lg"
                  style={{ background: 'linear-gradient(135deg, rgba(91,46,255,0.1), rgba(200,162,255,0.05))', border: '1px solid rgba(200,162,255,0.15)' }}>
                  {babyUpdate}
                </div>
              ) : (
                <div className="flex items-center justify-center py-16">
                  <button onClick={fetchBabyUpdate} className="btn-primary flex items-center gap-2">
                    <Baby className="w-5 h-5" /> Get Baby Update
                  </button>
                </div>
              )}
              {profile?.weekOfPregnancy && (
                <div className="mt-6 grid grid-cols-3 gap-4">
                  {[
                    { label: 'Current Week', value: `Week ${profile.weekOfPregnancy}` },
                    { label: 'Trimester', value: `Trimester ${profile.trimester || '?'}` },
                    { label: 'Remaining', value: `~${42 - (profile.weekOfPregnancy || 0)} weeks` }
                  ].map((s, i) => (
                    <div key={i} className="text-center p-4 rounded-xl" style={{ background: 'rgba(28,19,53,0.6)', border: '1px solid rgba(200,162,255,0.1)' }}>
                      <div className="font-display text-xl font-bold text-lavender">{s.value}</div>
                      <div className="text-xs text-white/40 font-body mt-1">{s.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'nutrition' && (
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display text-xl font-semibold">Personalized Nutrition Plan 🥗</h3>
                <button onClick={fetchNutrition} className="btn-ghost text-sm py-2"><RefreshCw className="w-4 h-4" /></button>
              </div>
              {nutrition ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {nutrition.map((item, i) => (
                    <div key={i} className="p-4 rounded-xl" style={{ background: 'rgba(28,19,53,0.6)', border: '1px solid rgba(200,162,255,0.1)' }}>
                      <div className="text-lavender font-body font-medium mb-2">{item.category}</div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {item.foods.map((food, j) => (
                          <span key={j} className="px-2 py-0.5 rounded-full text-xs text-white/70 font-body" style={{ background: 'rgba(200,162,255,0.1)' }}>{food}</span>
                        ))}
                      </div>
                      <p className="text-white/50 text-xs font-body">{item.tip}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <button onClick={fetchNutrition} className="btn-primary"><Apple className="w-5 h-5 inline mr-2" />Load Nutrition Plan</button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'exercise' && (
            <div className="glass-card p-6">
              <h3 className="font-display text-xl font-semibold mb-6">Safe Pregnancy Exercises 🧘</h3>
              {exercise ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {exercise.map((ex, i) => (
                    <div key={i} className="p-4 rounded-xl" style={{ background: 'rgba(28,19,53,0.6)', border: '1px solid rgba(200,162,255,0.1)' }}>
                      <div className="text-lavender font-body font-semibold mb-1">{ex.name}</div>
                      <div className="text-xs text-white/50 font-body mb-2">Duration: {ex.duration}</div>
                      <div className="text-white/70 text-sm font-body mb-2">{ex.benefit}</div>
                      {ex.caution !== 'None' && <div className="text-yellow-400 text-xs font-body">⚠️ {ex.caution}</div>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <button onClick={fetchExercise} className="btn-primary"><Dumbbell className="w-5 h-5 inline mr-2" />Load Exercise Plan</button>
                </div>
              )}
            </div>
          )}



          {activeTab === 'community' && (
            <div className="glass-card p-6">
              <h3 className="font-display text-xl font-semibold mb-6">Mom Community 💜</h3>
              <div className="mb-6 space-y-3">
                <textarea value={newPost} onChange={e => setNewPost(e.target.value)}
                  className="input-field resize-none" rows={3} placeholder="Share your experience, ask a question, or offer encouragement..." />
                <div className="flex items-center gap-3">
                  <select value={postCategory} onChange={e => setPostCategory(e.target.value)} className="input-field py-2 text-sm flex-1">
                    {['general', 'nutrition', 'exercise', 'mental-health', 'baby-care', 'tips'].map(c => (
                      <option key={c} value={c}>{c.replace('-', ' ')}</option>
                    ))}
                  </select>
                  <button onClick={submitPost} className="btn-primary py-2">Share Post</button>
                </div>
              </div>
              <div className="space-y-4">
                {communityPosts.map((post, i) => (
                  <div key={post._id || i} className="p-4 rounded-xl post-card" style={{ background: 'rgba(28,19,53,0.6)', border: '1px solid rgba(200,162,255,0.1)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lavender text-sm font-body font-medium">{post.isAnonymous ? 'Anonymous Mama' : post.authorId?.name}</span>
                      <span className="text-xs text-white/30 font-body">{new Date(post.createdAt).toLocaleDateString('en-IN')}</span>
                    </div>
                    <p className="text-white/70 font-body text-sm">{post.content}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <span className="text-xs text-white/30 font-body px-2 py-0.5 rounded-full" style={{ background: 'rgba(200,162,255,0.08)' }}>{post.category}</span>
                      <div className="flex items-center gap-3">
                        <button onClick={() => toggleLike(post._id, i)} className="text-xs text-white/40 px-2 py-1 rounded-md" style={{ background: 'rgba(255,255,255,0.02)', cursor: 'pointer' }}>
                          ❤️ {post.likes?.length || 0}
                        </button>
                        <span className="text-xs text-white/40">· {post.comments?.length || 0} replies</span>
                      </div>
                    </div>

                    {/* Comments list and reply */}
                    <div className="mt-3 space-y-2">
                      {(post.comments || []).map((c, ci) => (
                        <div key={ci} className="text-xs text-white/60 font-body">
                          <span className="text-lavender">{c.userId?.name || 'Mama'}</span>: {c.content}
                        </div>
                      ))}

                      <div className="flex items-center gap-2 mt-2">
                        <input value={commentDrafts[post._id] || ''} onChange={e => setCommentDrafts(d => ({ ...d, [post._id]: e.target.value }))}
                          placeholder="Write a supportive reply..." className="input-field py-2 text-sm flex-1" />
                        <button onClick={() => submitComment(post._id, i)} className="btn-ghost py-2">Reply</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="glass-card overflow-hidden" style={{ height: '500px' }}>
              {profile?.assignedDoctorId ? (
                <ChatPanel
                  roomId={`doctor-${profile.assignedDoctorId._id}-${user?._id}`}
                  recipientId={profile.assignedDoctorId._id}
                  recipientName={`Dr. ${profile.assignedDoctorId.name}`}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-center px-8">
                  <div>
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 text-white/20" />
                    <p className="text-white/50 font-body">No doctor assigned yet. A doctor will be assigned to you based on your region and risk level.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
