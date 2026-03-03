import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Users, UserCheck, MapPin, BarChart3, MessageSquare,
  FileText, CheckCircle, XCircle, TrendingUp, Activity,
  Download, AlertTriangle, Plus, RefreshCw, Map,
  Thermometer, Phone, Globe
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/common/DashboardLayout';

const navItems = [{ path: '/admin/dashboard', label: 'Admin Control Center', icon: Shield }];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [pending, setPending] = useState([]);
  const [heatmap, setHeatmap] = useState(null);
  const [smsLogs, setSmsLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [createStaff, setCreateStaff] = useState({
    name: '', email: '', password: '', phone: '', role: 'doctor', region: ''
  });
  const [testSMS, setTestSMS] = useState({ phone: '', message: '' });
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [statsRes, pendingRes] = await Promise.all([
        axios.get('/admin/dashboard-stats'),
        axios.get('/admin/pending-approvals')
      ]);
      setStats(statsRes.data);
      setPending(pendingRes.data.pending);
    } catch { toast.error('Failed to load admin data'); }
    finally { setLoading(false); }
  };

  const fetchHeatmap = async () => {
    try {
      const { data } = await axios.get('/admin/heatmap');
      setHeatmap(data);
    } catch { toast.error('Failed to load heatmap'); }
  };

  const fetchSMSLogs = async () => {
    try {
      const { data } = await axios.get('/admin/sms-logs');
      setSmsLogs(data.logs);
    } catch {}
  };

  const approveUser = async (userId, region) => {
    setApproving(userId);
    try {
      await axios.put(`/admin/approve/${userId}`, { region });
      toast.success('User approved successfully');
      fetchAll();
    } catch { toast.error('Approval failed'); }
    finally { setApproving(null); }
  };

  const rejectUser = async (userId) => {
    try {
      await axios.put(`/admin/reject/${userId}`);
      toast.success('User rejected');
      fetchAll();
    } catch { toast.error('Rejection failed'); }
  };

  const createStaffUser = async () => {
    if (!createStaff.name || !createStaff.email || !createStaff.password) {
      toast.error('Fill all required fields');
      return;
    }
    try {
      await axios.post('/auth/admin/create-staff', createStaff);
      toast.success(`${createStaff.role} account created, pending approval`);
      setCreateStaff({ name: '', email: '', password: '', phone: '', role: 'doctor', region: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create account'); }
  };

  const sendTestSMS = async () => {
    if (!testSMS.phone || !testSMS.message) { toast.error('Enter phone and message'); return; }
    try {
      const { data } = await axios.post('/sms/send-test', testSMS);
      if (data.success) toast.success('SMS sent!');
      else toast.error(data.error || 'SMS failed — check Twilio/Fast2SMS config');
    } catch (err) { toast.error(err.response?.data?.message || 'SMS send failed'); }
  };

  const generateReport = async () => {
    try {
      const response = await axios.get('/admin/generate-report', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Sheon-Hospital-Report-${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('PDF report downloaded successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate report');
    }
  };

  const loadTab = (tab) => {
    setActiveTab(tab);
    if (tab === 'heatmap') fetchHeatmap();
    if (tab === 'sms') fetchSMSLogs();
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'approvals', label: 'Approvals', icon: UserCheck, badge: pending.length || null },
    { id: 'create-staff', label: 'Create Staff', icon: Plus },
    { id: 'heatmap', label: 'Regional Heatmap', icon: Map },
    { id: 'sms', label: 'SMS Config', icon: Phone },
    { id: 'reports', label: 'Hospital Reports', icon: FileText },
  ];

  return (
    <DashboardLayout navItems={navItems} title="Admin Control Center">
      <div className="space-y-6">

        {/* Header Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 relative overflow-hidden"
        >
          <div className="floating-orb w-48 h-48 bg-violet/20 -top-12 -right-12" />
          <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #5B2EFF, #C8A2FF)' }}>
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <h2 className="font-display text-2xl font-bold">Admin Control Center</h2>
              </div>
              <p className="text-white/50 font-body text-sm">Full system oversight — approvals, analytics, heatmaps, SMS</p>
            </div>
            <div className="flex gap-3">
              <button onClick={fetchAll} className="btn-ghost text-sm py-2 flex items-center gap-2">
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
              <button onClick={generateReport} className="btn-primary text-sm py-2 flex items-center gap-2">
                <Download className="w-4 h-4" /> PDF Report
              </button>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-lavender', bg: 'rgba(200,162,255,0.1)' },
              { label: 'Total Mothers', value: stats.totalMothers, icon: Activity, color: 'text-violet-400', bg: 'rgba(91,46,255,0.1)' },
              { label: 'High Risk Cases', value: stats.highRisk, icon: AlertTriangle, color: 'text-red-400', bg: 'rgba(239,68,68,0.1)' },
              { label: 'Pending Approvals', value: stats.pendingApprovals, icon: UserCheck, color: 'text-yellow-400', bg: 'rgba(234,179,8,0.1)' },
              { label: 'Doctors', value: stats.totalDoctors, icon: TrendingUp, color: 'text-blue-400', bg: 'rgba(59,130,246,0.1)' },
              { label: 'Nurses', value: stats.totalNurses, icon: Users, color: 'text-emerald-400', bg: 'rgba(52,211,153,0.1)' },
              { label: 'SMS Alerts Sent', value: stats.totalSMS, icon: MessageSquare, color: 'text-coral', bg: 'rgba(255,111,97,0.1)' },
              { label: 'Prevented Complications', value: stats.preventedComplications, icon: CheckCircle, color: 'text-emerald-400', bg: 'rgba(52,211,153,0.1)' },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-5 relative overflow-hidden"
              >
                <div className="absolute top-3 right-3 w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.bg }}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div className={`text-3xl font-display font-bold ${s.color} mb-1`}>{s.value ?? '—'}</div>
                <div className="text-xs text-white/40 font-body">{s.label}</div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => loadTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-body font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 relative ${activeTab === tab.id ? 'text-white' : 'text-white/50 hover:text-white/80'}`}
              style={activeTab === tab.id
                ? { background: 'linear-gradient(135deg, #5B2EFF, #7A56FF)' }
                : { background: 'rgba(28,19,53,0.6)', border: '1px solid rgba(200,162,255,0.1)' }}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.badge ? (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-body">
                  {tab.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && stats && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Risk Distribution Bar */}
            <div className="glass-card p-6">
              <h3 className="font-display text-lg font-semibold mb-5">Risk Distribution</h3>
              {[
                { label: 'High Risk', value: stats.highRisk, total: stats.totalMothers, color: '#f87171' },
                { label: 'Moderate Risk', value: stats.highRisk + (stats.totalMothers - stats.highRisk) * 0.35 | 0, total: stats.totalMothers, color: '#facc15' },
                { label: 'Low Risk', value: stats.totalMothers - stats.highRisk, total: stats.totalMothers, color: '#34d399' },
              ].map((r, i) => (
                <div key={i} className="mb-4">
                  <div className="flex items-center justify-between text-sm font-body mb-1.5">
                    <span className="text-white/70">{r.label}</span>
                    <span style={{ color: r.color }}>{r.value} mothers</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${r.total ? (r.value / r.total) * 100 : 0}%` }}
                      transition={{ duration: 1, delay: i * 0.2 }}
                      className="h-full rounded-full"
                      style={{ background: r.color }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Activity */}
            <div className="glass-card p-6">
              <h3 className="font-display text-lg font-semibold mb-5">Recent Risk Logs</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {stats.recentLogs?.length > 0 ? stats.recentLogs.map((log, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl"
                    style={{ background: 'rgba(28,19,53,0.6)', border: '1px solid rgba(200,162,255,0.05)' }}>
                    <div>
                      <div className="text-sm font-body font-medium">{log.motherId?.name || 'Unknown'}</div>
                      <div className="text-xs text-white/40 font-body">{new Date(log.createdAt).toLocaleDateString('en-IN')}</div>
                    </div>
                    <span className={log.riskLevel === 'high' ? 'badge-high' : log.riskLevel === 'moderate' ? 'badge-moderate' : 'badge-low'}>
                      {log.riskLevel}
                    </span>
                  </div>
                )) : (
                  <p className="text-white/30 text-sm font-body text-center py-8">No recent logs</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── PENDING APPROVALS ── */}
        {activeTab === 'approvals' && (
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <div className="w-8 h-8 border-2 border-lavender border-t-transparent rounded-full animate-spin" />
              </div>
            ) : pending.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <p className="text-white/50 font-body">No pending approvals — all caught up!</p>
              </div>
            ) : pending.map((user) => (
              <motion.div
                key={user._id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="glass-card p-5"
              >
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-display font-bold"
                      style={{ background: user.role === 'doctor' ? 'rgba(59,130,246,0.2)' : 'rgba(52,211,153,0.2)' }}>
                      {user.name[0]}
                    </div>
                    <div>
                      <div className="font-body font-semibold">{user.name}</div>
                      <div className="text-sm text-white/50 font-body">{user.email}</div>
                      <div className="text-xs text-white/30 font-body">{user.phone}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-body capitalize ${user.role === 'doctor' ? 'text-blue-400 bg-blue-400/10 border border-blue-400/20' : 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/20'}`}>
                      {user.role}
                    </span>
                    <span className="text-xs text-white/30 font-body">
                      {new Date(user.createdAt).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/5">
                  <input
                    placeholder="Assign region (e.g. Bihar Rural)"
                    className="input-field py-2 text-sm flex-1"
                    id={`region-${user._id}`}
                  />
                  <button
                    onClick={() => approveUser(user._id, document.getElementById(`region-${user._id}`).value)}
                    disabled={approving === user._id}
                    className="btn-primary py-2 flex items-center gap-2 text-sm disabled:opacity-60"
                  >
                    {approving === user._id
                      ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <CheckCircle className="w-4 h-4" />}
                    Approve
                  </button>
                  <button
                    onClick={() => rejectUser(user._id)}
                    className="px-4 py-2 rounded-xl text-sm font-body text-red-400 flex items-center gap-2 transition-all"
                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* ── CREATE STAFF ── */}
        {activeTab === 'create-staff' && (
          <div className="glass-card p-6">
            <h3 className="font-display text-xl font-semibold mb-6">Create Doctor / Nurse Account</h3>
            <p className="text-white/50 text-sm font-body mb-6">
              Doctors and nurses cannot self-register. Create their accounts here. They will require your approval before login.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { key: 'name', label: 'Full Name', type: 'text', placeholder: 'Dr. Priya Sharma' },
                { key: 'email', label: 'Email Address', type: 'email', placeholder: 'doctor@hospital.com' },
                { key: 'phone', label: 'Phone Number', type: 'tel', placeholder: '9876543210' },
                { key: 'password', label: 'Temporary Password', type: 'password', placeholder: 'Min 8 chars' },
                { key: 'region', label: 'Assigned Region', type: 'text', placeholder: 'Bihar Rural North' },
              ].map(({ key, label, type, placeholder }) => (
                <div key={key}>
                  <label className="text-sm text-white/60 font-body mb-2 block">{label}</label>
                  <input
                    type={type}
                    value={createStaff[key]}
                    onChange={e => setCreateStaff(f => ({ ...f, [key]: e.target.value }))}
                    className="input-field"
                    placeholder={placeholder}
                  />
                </div>
              ))}
              <div>
                <label className="text-sm text-white/60 font-body mb-2 block">Role</label>
                <select
                  value={createStaff.role}
                  onChange={e => setCreateStaff(f => ({ ...f, role: e.target.value }))}
                  className="input-field"
                >
                  <option value="doctor">Doctor</option>
                  <option value="nurse">Nurse</option>
                </select>
              </div>
            </div>
            <button onClick={createStaffUser} className="btn-primary mt-6 flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create Account
            </button>
          </div>
        )}

        {/* ── REGIONAL HEATMAP ── */}
        {activeTab === 'heatmap' && (
          <div className="space-y-4">
            {!heatmap ? (
              <div className="glass-card p-12 text-center">
                <button onClick={fetchHeatmap} className="btn-primary flex items-center gap-2 mx-auto">
                  <Map className="w-5 h-5" /> Load Regional Heatmap
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Regions Covered', value: heatmap.totalRegions },
                    { label: 'Total Mothers', value: heatmap.totalMothers?.toLocaleString() },
                    { label: 'High Risk Total', value: heatmap.totalHighRisk?.toLocaleString() },
                    { label: 'Complications Prevented', value: heatmap.totalPrevented?.toLocaleString() },
                  ].map((s, i) => (
                    <div key={i} className="glass-card p-4 text-center">
                      <div className="text-2xl font-display font-bold text-lavender">{s.value}</div>
                      <div className="text-xs text-white/40 font-body mt-1">{s.label}</div>
                    </div>
                  ))}
                </div>

                <div className="glass-card overflow-hidden">
                  <div className="p-4 border-b border-white/10">
                    <h3 className="font-display text-lg font-semibold">Regional Risk Density Map</h3>
                    <p className="text-xs text-white/40 font-body mt-1">Darker cells = higher risk density after bias calibration</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          {['Region', 'Mothers', 'High Risk %', 'Nurses', 'Distance (km)', 'Bias Factor', 'Prevented'].map(h => (
                            <th key={h} className="text-left py-3 px-4 text-xs text-white/40 font-body font-medium uppercase tracking-wider whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {heatmap.regions?.map((r, i) => {
                          const riskPct = Math.round((r.highRiskCount / r.totalMothers) * 100);
                          const heatColor = riskPct > 40 ? 'rgba(239,68,68,0.15)' : riskPct > 25 ? 'rgba(234,179,8,0.1)' : 'transparent';
                          return (
                            <tr key={i} className="border-b border-white/5 transition-colors hover:bg-white/2" style={{ background: heatColor }}>
                              <td className="py-3 px-4 text-sm font-body font-medium">{r.region}</td>
                              <td className="py-3 px-4 text-sm text-white/70 font-body">{r.totalMothers.toLocaleString()}</td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                                    <div className="h-full rounded-full" style={{ width: `${riskPct}%`, background: riskPct > 40 ? '#f87171' : riskPct > 25 ? '#facc15' : '#34d399' }} />
                                  </div>
                                  <span className={`text-sm font-body ${riskPct > 40 ? 'text-red-400' : riskPct > 25 ? 'text-yellow-400' : 'text-emerald-400'}`}>{riskPct}%</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-sm text-white/60 font-body">{r.activeNurses}</td>
                              <td className="py-3 px-4 text-sm font-body">
                                <span className={r.avgDistanceToHospital > 30 ? 'text-red-400' : r.avgDistanceToHospital > 15 ? 'text-yellow-400' : 'text-emerald-400'}>
                                  {r.avgDistanceToHospital} km
                                </span>
                              </td>
                              <td className="py-3 px-4 text-sm font-mono text-lavender">{r.biasAdjustmentFactor}x</td>
                              <td className="py-3 px-4 text-sm text-emerald-400 font-body">{r.preventedComplications}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── COMPLICATION SIMULATOR ── */}
        {/* ── SMS CONFIGURATION ── */}
        {activeTab === 'sms' && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <h3 className="font-display text-lg font-semibold mb-4">SMS Test Panel</h3>
              <p className="text-white/50 text-sm font-body mb-5">
                Send a test SMS to verify Twilio / Fast2SMS integration.
                Configure SMS_PROVIDER, TWILIO_* or FAST2SMS_API_KEY in your <code className="text-lavender">.env</code> file.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-white/60 font-body mb-2 block">Phone Number</label>
                  <input
                    type="tel"
                    value={testSMS.phone}
                    onChange={e => setTestSMS(f => ({ ...f, phone: e.target.value }))}
                    className="input-field"
                    placeholder="+919876543210"
                  />
                </div>
                <div>
                  <label className="text-sm text-white/60 font-body mb-2 block">Test Message</label>
                  <textarea
                    value={testSMS.message}
                    onChange={e => setTestSMS(f => ({ ...f, message: e.target.value }))}
                    className="input-field resize-none"
                    rows={3}
                    placeholder="Test message from Sheon AI..."
                  />
                </div>
                <button onClick={sendTestSMS} className="btn-primary flex items-center gap-2">
                  <Phone className="w-4 h-4" /> Send Test SMS
                </button>
              </div>

              <div className="mt-6 p-4 rounded-xl" style={{ background: 'rgba(200,162,255,0.06)', border: '1px solid rgba(200,162,255,0.15)' }}>
                <div className="text-lavender text-sm font-body font-medium mb-2">SMS Trigger Events</div>
                {[
                  '🔴 Risk becomes HIGH → immediate SMS',
                  '👩‍⚕️ Nurse assigned → notification to mother',
                  '⚕️ Doctor urgent reply → alert to mother',
                  '🏥 Emergency escalation → SOS alert',
                  '🔬 Lab reminder due → appointment SMS',
                ].map((t, i) => (
                  <div key={i} className="text-white/50 text-xs font-body py-1">{t}</div>
                ))}
              </div>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg font-semibold">Recent SMS Logs</h3>
                <button onClick={fetchSMSLogs} className="btn-ghost text-xs py-1.5 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {smsLogs.length === 0 ? (
                  <p className="text-white/30 text-sm font-body text-center py-8">No SMS logs yet</p>
                ) : smsLogs.map((log, i) => (
                  <div key={i} className="p-3 rounded-xl" style={{ background: 'rgba(28,19,53,0.6)', border: '1px solid rgba(200,162,255,0.05)' }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-body text-white/60">{log.phone}</span>
                      <span className={`text-xs font-body ${log.status === 'sent' ? 'text-emerald-400' : log.status === 'failed' ? 'text-red-400' : 'text-yellow-400'}`}>
                        {log.status}
                      </span>
                    </div>
                    <p className="text-xs text-white/40 font-body truncate">{log.message}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-white/30 font-body">{log.trigger}</span>
                      <span className="text-xs text-white/20 font-body">{new Date(log.createdAt).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── HOSPITAL REPORTS ── */}
        {activeTab === 'reports' && (
          <div className="glass-card p-6">
            <h3 className="font-display text-xl font-semibold mb-2">Hospital Report Generator</h3>
            <p className="text-white/50 text-sm font-body mb-6">
              Generate a comprehensive PDF report of system statistics, regional data, and maternal health outcomes for hospital administration.
            </p>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {[
                { icon: '📊', title: 'System Overview', desc: 'Total mothers, risk distribution, doctors and nurses' },
                { icon: '🗺️', title: 'Regional Data', desc: 'Top 5 regions by risk density with bias factors' },
                { icon: '🛡️', title: 'Prevention Stats', desc: 'Estimated complications prevented by the system' },
                { icon: '📱', title: 'SMS Analytics', desc: 'Alert delivery rates and trigger breakdown' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-xl" style={{ background: 'rgba(28,19,53,0.6)', border: '1px solid rgba(200,162,255,0.1)' }}>
                  <div className="text-2xl">{item.icon}</div>
                  <div>
                    <div className="font-body font-medium text-sm">{item.title}</div>
                    <div className="text-xs text-white/40 font-body mt-0.5">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={generateReport} className="btn-primary flex items-center gap-2">
              <Download className="w-4 h-4" /> Generate & Download PDF Report
            </button>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
