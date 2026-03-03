import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, AlertTriangle, MapPin, UserCheck, Activity, TrendingUp, MessageCircle, Zap, Send } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/common/DashboardLayout';
import ChatPanel from '../../components/common/ChatPanel';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { path: '/doctor/dashboard', label: 'Dashboard', icon: Activity },
];

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [mothers, setMothers] = useState([]);
  const [nurses, setNurses] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState('high-risk');
  const [selectedMother, setSelectedMother] = useState(null);
  // prefill the filter using doctor's own region if available
  const [regionFilter, setRegionFilter] = useState(user?.region || '');
  const [assignNurseModal, setAssignNurseModal] = useState(null);
  const [escalateModal, setEscalateModal] = useState(null);
  const [selectedNurseId, setSelectedNurseId] = useState('');
  const [hospital, setHospital] = useState('');
  const [escalateReason, setEscalateReason] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setRegionFilter(user.region || '');
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const momsUrl = `/mothers/all?riskLevel=high${regionFilter ? `&region=${encodeURIComponent(regionFilter)}` : ''}`;
      const [mothersRes, nursesRes, analyticsRes] = await Promise.all([
        axios.get(momsUrl),
        axios.get('/nurses/list'),
        axios.get('/doctors/analytics')
      ]);
      setMothers(mothersRes.data.mothers);
      setNurses(nursesRes.data.nurses);
      setAnalytics(analyticsRes.data);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  const fetchAllMothers = async (risk) => {
    try {
      const q = risk ? `?riskLevel=${risk}` : '';
      const { data } = await axios.get(`/mothers/all${q}${regionFilter ? `${q ? '&' : '?'}region=${regionFilter}` : ''}`);
      setMothers(data.mothers);
    } catch {}
  };

  const assignNurse = async () => {
    if (!selectedNurseId || !assignNurseModal) return;
    try {
      await axios.post('/doctors/assign-nurse', {
        motherId: assignNurseModal.userId?._id || assignNurseModal.userId,
        nurseId: selectedNurseId,
        priority: 'high',
        visitType: 'urgent'
      });
      toast.success('Nurse assigned and SMS sent to mother!');
      setAssignNurseModal(null);
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to assign nurse'); }
  };

  const escalate = async () => {
    try {
      await axios.post('/doctors/escalate', {
        motherId: escalateModal.userId?._id || escalateModal.userId,
        hospital,
        reason: escalateReason
      });
      toast.success('Emergency escalation sent. SMS alert delivered.');
      setEscalateModal(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to escalate'); }
  };

  const sendLabReminder = async (motherId) => {
    try {
      await axios.post('/sms/lab-reminder', { motherId, testName: 'Blood Panel', dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) });
      toast.success('Lab reminder SMS sent!');
    } catch { toast.error('SMS failed — check configuration'); }
  };

  const riskColor = (level) => level === 'high' ? 'badge-high' : level === 'moderate' ? 'badge-moderate' : 'badge-low';

  return (
    <DashboardLayout navItems={navItems} title="Doctor Portal">
      {/* Stats */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Mothers', value: analytics.totalMothers, color: 'text-white', icon: Users },
            { label: 'High Risk', value: analytics.highRisk, color: 'text-red-400', icon: AlertTriangle },
            { label: 'Moderate Risk', value: analytics.moderate, color: 'text-yellow-400', icon: Activity },
            { label: 'Low Risk', value: analytics.low, color: 'text-emerald-400', icon: TrendingUp }
          ].map((s, i) => (
            <div key={i} className="glass-card p-5">
              <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
              <div className={`text-2xl font-display font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-white/40 font-body">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3 mb-6 flex-wrap">
        {['high-risk', 'all-mothers', 'chat'].map(tab => (
          <button key={tab} onClick={() => { setActiveTab(tab); if (tab === 'all-mothers') fetchAllMothers(); }}
            className={`px-4 py-2 rounded-xl text-sm font-body font-medium transition-all ${activeTab === tab ? 'text-white' : 'text-white/50 hover:text-white/80'}`}
            style={activeTab === tab ? { background: 'linear-gradient(135deg, #5B2EFF, #7A56FF)' } : { background: 'rgba(28,19,53,0.6)', border: '1px solid rgba(200,162,255,0.1)' }}>
            {tab === 'high-risk' ? '🔴 High Risk Cases' : tab === 'all-mothers' ? '👥 All Mothers' : '💬 Chat'}
          </button>
        ))}
        {(activeTab === 'all-mothers' || activeTab === 'high-risk') && user?.role !== 'doctor' && (
          <input value={regionFilter} onChange={e => setRegionFilter(e.target.value)}
            className="input-field py-2 text-sm w-40" placeholder="Filter by region" 
            onBlur={() => fetchAllMothers(activeTab === 'high-risk' ? 'high' : '')} />
        )}
      </div>

      {activeTab !== 'chat' && (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  {['Mother', 'Risk Level', 'Region', 'Vitals', 'Actions'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-xs text-white/40 font-body font-medium uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-12 text-white/40">
                    <div className="w-8 h-8 border-2 border-lavender border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading...
                  </td></tr>
                ) : mothers.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-12 text-white/40 font-body">No mothers found</td></tr>
                ) : mothers.map((m, i) => (
                  <motion.tr key={m._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                    className="border-b border-white/5 hover:bg-white/2 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-body font-medium text-sm">{m.userId?.name || 'Unknown'}</div>
                      <div className="text-xs text-white/40">{m.userId?.phone}</div>
                    </td>
                    <td className="py-3 px-4"><span className={riskColor(m.riskLevel)}>{m.riskLevel}</span></td>
                    <td className="py-3 px-4 text-sm text-white/60 font-body">{m.region || '—'}</td>
                    <td className="py-3 px-4 text-xs text-white/50 font-mono">
                      BP: {m.bloodPressureSystolic || '--'}/{m.bloodPressureDiastolic || '--'}<br />
                      Hb: {m.hemoglobin || '--'} | Sugar: {m.bloodSugar || '--'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setAssignNurseModal(m)} className="px-2 py-1 rounded-lg text-xs text-lavender font-body" style={{ background: 'rgba(200,162,255,0.1)' }}>
                          Assign Nurse
                        </button>
                        <button onClick={() => setEscalateModal(m)} className="px-2 py-1 rounded-lg text-xs text-red-400 font-body" style={{ background: 'rgba(239,68,68,0.1)' }}>
                          Escalate
                        </button>
                        <button onClick={() => sendLabReminder(m.userId?._id)} className="px-2 py-1 rounded-lg text-xs text-yellow-400 font-body" style={{ background: 'rgba(234,179,8,0.1)' }}>
                          Lab SMS
                        </button>
                        <button onClick={() => { setSelectedMother(m); setActiveTab('chat'); }} className="px-2 py-1 rounded-lg text-xs text-white/60 font-body" style={{ background: 'rgba(255,255,255,0.05)' }}>
                          Chat
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'chat' && selectedMother && (
        <div className="glass-card overflow-hidden" style={{ height: '500px' }}>
          <ChatPanel
            roomId={`doctor-${user?._id}-${selectedMother.userId?._id}`}
            recipientId={selectedMother.userId?._id}
            recipientName={selectedMother.userId?.name}
            isDoctor={true}
          />
        </div>
      )}

      {/* Assign Nurse Modal */}
      {assignNurseModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card p-6 w-full max-w-md">
            <h3 className="font-display text-xl font-bold mb-4">Assign Nurse to {assignNurseModal.userId?.name}</h3>
            <select value={selectedNurseId} onChange={e => setSelectedNurseId(e.target.value)} className="input-field mb-4">
              <option value="">Select a nurse</option>
              {nurses.map(n => <option key={n._id} value={n._id}>{n.name} — {n.region || 'No region'}</option>)}
            </select>
            <div className="flex gap-3">
              <button onClick={assignNurse} className="btn-primary flex-1">Assign & Notify</button>
              <button onClick={() => setAssignNurseModal(null)} className="btn-ghost flex-1">Cancel</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Escalate Modal */}
      {escalateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card p-6 w-full max-w-md">
            <h3 className="font-display text-xl font-bold text-red-400 mb-4">🔴 Emergency Escalation</h3>
            <p className="text-white/60 font-body text-sm mb-4">Patient: {escalateModal.userId?.name}</p>
            <input value={hospital} onChange={e => setHospital(e.target.value)} className="input-field mb-3" placeholder="Hospital name" />
            <textarea value={escalateReason} onChange={e => setEscalateReason(e.target.value)} className="input-field resize-none mb-4" rows={3} placeholder="Reason for escalation..." />
            <div className="flex gap-3">
              <button onClick={escalate} className="btn-coral flex-1">🚨 Escalate & SMS</button>
              <button onClick={() => setEscalateModal(null)} className="btn-ghost flex-1">Cancel</button>
            </div>
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  );
}
