import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Heart, User, Mail, Phone, Lock, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', region: '', state: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (!form.region.trim()) { toast.error('Please enter your region'); return; }
    if (!form.state.trim()) { toast.error('Please enter your state'); return; }
    
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.phone, form.region, form.state);
      toast.success('Account created! Welcome to Sheon 💜');
      navigate('/mother/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { key: 'name', label: 'Full Name', icon: User, type: 'text', placeholder: 'Your full name' },
    { key: 'email', label: 'Email Address', icon: Mail, type: 'email', placeholder: 'you@example.com' },
    { key: 'phone', label: 'Phone Number', icon: Phone, type: 'tel', placeholder: '9876543210' },
    { key: 'region', label: 'Your Region', icon: MapPin, type: 'text', placeholder: 'e.g. Chennai' },
    { key: 'state', label: 'Your State', icon: MapPin, type: 'text', placeholder: 'e.g. Tamil Nadu' },
    { key: 'password', label: 'Password', icon: Lock, type: 'password', placeholder: '••••••••' },
    { key: 'confirmPassword', label: 'Confirm Password', icon: Lock, type: 'password', placeholder: '••••••••' }
  ];

  return (
    <div className="min-h-screen bg-maatri-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <Link to="/" className="flex items-center justify-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #5B2EFF, #C8A2FF)' }}>
              <Heart className="w-5 h-5 text-white" fill="currentColor" />
            </div>
            <span className="font-display text-xl font-semibold">Sheon <span className="text-lavender">AI</span></span>
          </Link>

          <div className="glass-card p-8">
            <h2 className="font-display text-3xl font-bold mb-2">Begin Your Journey</h2>
            <p className="text-white/50 font-body mb-8">Create your mother's care profile</p>

            <div className="p-4 rounded-xl mb-6" style={{ background: 'rgba(91,46,255,0.1)', border: '1px solid rgba(91,46,255,0.2)' }}>
              <p className="text-lavender text-xs font-body">ℹ️ Mothers can self-register. Doctors and nurses are created by admin.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {fields.map(({ key, label, icon: Icon, type, placeholder }) => (
                <div key={key}>
                  <label className="text-sm text-white/60 font-body mb-2 block">{label}</label>
                  <div className="relative">
                    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      className="input-field pl-10" placeholder={placeholder} required />
                  </div>
                </div>
              ))}
              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2 disabled:opacity-60">
                {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Heart className="w-4 h-4" fill="currentColor" />}
                {loading ? 'Creating Account...' : 'Create Mother Account'}
              </button>
            </form>

            <p className="text-center mt-6 text-white/40 text-sm font-body">
              Already registered? <Link to="/login" className="text-lavender hover:text-lavender/80">Sign in</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
