import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, ClipboardList, CheckCircle, Clock, Upload, Thermometer, Activity } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/common/DashboardLayout';

const navItems = [{ path: '/nurse/dashboard', label: 'My Visits', icon: Calendar }];

export default function NurseDashboard() {
  const [visits, setVisits] = useState([]);
  const [activeVisit, setActiveVisit] = useState(null);
  const [reportForm, setReportForm] = useState({
    bp_systolic: '', bp_diastolic: '', temperature: '', weight: '', pulseRate: '', oxygenSaturation: '',
    symptoms: '', observations: '', recommendations: '', nextVisitDate: ''
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchVisits(); }, []);

  const fetchVisits = async () => {
    try {
      const { data } = await axios.get('/nurses/my-visits');
      setVisits(data.visits);
    } catch { toast.error('Failed to load visits'); }
    finally { setLoading(false); }
  };

  const startVisit = async (visitId) => {
    try {
      let lat, lng;
      if (navigator.geolocation) {
        await new Promise(resolve => navigator.geolocation.getCurrentPosition(pos => { lat = pos.coords.latitude; lng = pos.coords.longitude; resolve(); }, resolve));
      }
      await axios.put(`/nurses/visits/${visitId}/start`, { lat, lng });
      toast.success('Visit started!');
      fetchVisits();
      setActiveVisit(visitId);
    } catch { toast.error('Failed to start visit'); }
  };

  const submitReport = async (visitId) => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('vitals', JSON.stringify({
        bloodPressureSystolic: Number(reportForm.bp_systolic),
        bloodPressureDiastolic: Number(reportForm.bp_diastolic),
        temperature: Number(reportForm.temperature),
        weight: Number(reportForm.weight),
        pulseRate: Number(reportForm.pulseRate),
        oxygenSaturation: Number(reportForm.oxygenSaturation)
      }));
      formData.append('symptoms', JSON.stringify(reportForm.symptoms.split(',').map(s => s.trim()).filter(Boolean)));
      formData.append('observations', reportForm.observations);
      formData.append('recommendations', reportForm.recommendations);
      if (reportForm.nextVisitDate) formData.append('nextVisitDate', reportForm.nextVisitDate);

      const { data } = await axios.post(`/nurses/visits/${visitId}/report`, formData);
      toast.success(`Visit report submitted! New risk level: ${data.report.newRiskLevel || 'recalculating'}`);
      setActiveVisit(null);
      setReportForm({ bp_systolic: '', bp_diastolic: '', temperature: '', weight: '', pulseRate: '', oxygenSaturation: '', symptoms: '', observations: '', recommendations: '', nextVisitDate: '' });
      fetchVisits();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to submit report'); }
    finally { setSubmitting(false); }
  };

  const statusColor = { pending: 'text-yellow-400', confirmed: 'text-blue-400', 'in-progress': 'text-lavender', completed: 'text-emerald-400', cancelled: 'text-red-400' };
  const priorityColor = { high: 'badge-high', medium: 'badge-moderate', low: 'badge-low' };

  return (
    <DashboardLayout navItems={navItems} title="Nurse Portal">
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Visits', value: visits.length },
            { label: 'Pending', value: visits.filter(v => v.status === 'pending').length },
            { label: 'Completed', value: visits.filter(v => v.status === 'completed').length }
          ].map((s, i) => (
            <div key={i} className="glass-card p-4 text-center">
              <div className="text-2xl font-display font-bold text-lavender">{s.value}</div>
              <div className="text-xs text-white/40 font-body">{s.label}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 border-lavender border-t-transparent rounded-full animate-spin" />
          </div>
        ) : visits.length === 0 ? (
          <div className="glass-card p-12 text-center text-white/40">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-body">No visits assigned yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {visits.map((visit) => (
              <motion.div key={visit._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="font-body font-semibold">{visit.motherId?.name || 'Unknown Mother'}</div>
                    <div className="text-xs text-white/40 font-body">{visit.motherId?.phone}</div>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={priorityColor[visit.priority]}>{visit.priority} priority</span>
                      <span className={`text-xs font-body ${statusColor[visit.status]}`}>{visit.status}</span>
                      <span className="text-xs text-white/40 font-body">{visit.visitType}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm text-white/60 font-body">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(visit.scheduledDate).toLocaleDateString('en-IN')}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-white/40 font-body mt-1">
                      <Clock className="w-3 h-3" />
                      {new Date(visit.scheduledDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                {visit.notes && <p className="text-sm text-white/60 font-body mb-4 p-3 rounded-lg" style={{ background: 'rgba(200,162,255,0.05)' }}>{visit.notes}</p>}

                {visit.status === 'confirmed' && (
                  <button onClick={() => startVisit(visit._id)} className="btn-primary flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4" /> Start Visit (Log Location)
                  </button>
                )}

                {(visit.status === 'in-progress' || activeVisit === visit._id) && (
                  <div className="mt-4 border-t border-white/10 pt-4">
                    <h4 className="font-body font-semibold mb-4 text-lavender flex items-center gap-2">
                      <ClipboardList className="w-4 h-4" /> Visit Report Form
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                      {[
                        { key: 'bp_systolic', label: 'BP Systolic', placeholder: '120' },
                        { key: 'bp_diastolic', label: 'BP Diastolic', placeholder: '80' },
                        { key: 'temperature', label: 'Temperature (°F)', placeholder: '98.6' },
                        { key: 'weight', label: 'Weight (kg)', placeholder: '65' },
                        { key: 'pulseRate', label: 'Pulse Rate', placeholder: '75' },
                        { key: 'oxygenSaturation', label: 'SpO2 (%)', placeholder: '98' }
                      ].map(({ key, label, placeholder }) => (
                        <div key={key}>
                          <label className="text-xs text-white/50 font-body mb-1 block">{label}</label>
                          <input type="number" value={reportForm[key]} onChange={e => setReportForm(f => ({ ...f, [key]: e.target.value }))}
                            className="input-field py-2 text-sm" placeholder={placeholder} />
                        </div>
                      ))}
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-white/50 font-body mb-1 block">Symptoms Observed (comma-separated)</label>
                        <input value={reportForm.symptoms} onChange={e => setReportForm(f => ({ ...f, symptoms: e.target.value }))}
                          className="input-field text-sm" placeholder="headache, swelling, fatigue" />
                      </div>
                      <div>
                        <label className="text-xs text-white/50 font-body mb-1 block">Clinical Observations</label>
                        <textarea value={reportForm.observations} onChange={e => setReportForm(f => ({ ...f, observations: e.target.value }))}
                          className="input-field resize-none text-sm" rows={3} placeholder="Describe patient condition..." />
                      </div>
                      <div>
                        <label className="text-xs text-white/50 font-body mb-1 block">Recommendations</label>
                        <textarea value={reportForm.recommendations} onChange={e => setReportForm(f => ({ ...f, recommendations: e.target.value }))}
                          className="input-field resize-none text-sm" rows={2} placeholder="Diet, medication, follow-up advice..." />
                      </div>
                      <div>
                        <label className="text-xs text-white/50 font-body mb-1 block">Next Visit Date</label>
                        <input type="date" value={reportForm.nextVisitDate} onChange={e => setReportForm(f => ({ ...f, nextVisitDate: e.target.value }))}
                          className="input-field text-sm" />
                      </div>
                    </div>
                    <button onClick={() => submitReport(visit._id)} disabled={submitting}
                      className="btn-primary mt-4 w-full flex items-center justify-center gap-2 disabled:opacity-60">
                      {submitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      {submitting ? 'Submitting & Recalculating Risk...' : 'Submit Report & Trigger Risk Update'}
                    </button>
                  </div>
                )}

                {visit.status === 'completed' && (
                  <div className="flex items-center gap-2 text-emerald-400 text-sm font-body">
                    <CheckCircle className="w-4 h-4" /> Visit Completed
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
