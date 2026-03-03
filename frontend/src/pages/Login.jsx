import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Heart, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const demoLogins = [
    // { label: 'Demo Mother', email: 'mother@demo.com', password: 'Demo@1234' },
    // { label: 'Demo Doctor', email: 'doctor@demo.com', password: 'Demo@1234' },
    // { label: 'Demo Nurse', email: 'nurse@demo.com', password: 'Demo@1234' },
    // { label: 'Admin', email: 'admin@Sheon.com', password: 'Admin@1234' }
  ];

  return (
    <div className="min-h-screen bg-maatri-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <Link to="/" className="flex items-center justify-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #5B2EFF, #C8A2FF)' }}>
              <Heart className="w-5 h-5 text-white" fill="currentColor" />
            </div>
            <span className="font-display text-xl font-semibold">Sheon <span className="text-lavender">AI</span></span>
          </Link>

          <div className="glass-card p-8">
            <h2 className="font-display text-3xl font-bold mb-2">Welcome Back</h2>
            <p className="text-white/50 font-body mb-8">Sign in to your care portal</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-sm text-white/60 font-body mb-2 block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="input-field pl-10" placeholder="you@example.com" required />
                </div>
              </div>
              <div>
                <label className="text-sm text-white/60 font-body mb-2 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input type={showPw ? 'text' : 'password'} value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    className="input-field pl-10 pr-10" placeholder="••••••••" required />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60">
                {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-white/10">
              {/* <p className="text-white/40 text-xs text-center mb-3 font-body">Quick Demo Access</p> */}
              <div className="grid grid-cols-2 gap-2">
                {demoLogins.map((d, i) => (
                  <button key={i} onClick={() => setForm({ email: d.email, password: d.password })}
                    className="text-xs py-2 px-3 rounded-lg text-white/60 hover:text-white transition-colors"
                    style={{ background: 'rgba(200,162,255,0.08)', border: '1px solid rgba(200,162,255,0.1)' }}>
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-center mt-6 text-white/40 text-sm font-body">
              New mother? <Link to="/register" className="text-lavender hover:text-lavender/80 transition-colors">Create account</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
