import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Zap, Loader2, ArrowLeft, User } from 'lucide-react';
import { toast } from 'sonner';

function formatApiErrorDetail(detail) {
  if (detail == null) return 'Something went wrong. Please try again.';
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && typeof e.msg === 'string' ? e.msg : JSON.stringify(e))).filter(Boolean).join(' ');
  if (detail && typeof detail.msg === 'string') return detail.msg;
  return String(detail);
}

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, register, continueAsGuest } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register(form.name, form.email, form.password);
      }
      toast.success(mode === 'login' ? 'Welcome back!' : 'Account created!');
      navigate('/dashboard');
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    continueAsGuest();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#030114] flex items-center justify-center p-6" data-testid="auth-page">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-violet-600 flex items-center justify-center mx-auto mb-4 ai-glow">
            <Zap size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Outfit' }}>
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            {mode === 'login' ? 'Sign in to access your teaching tools' : 'Start generating teaching materials instantly'}
          </p>
        </div>

        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 md:p-8" data-testid="auth-form-card">
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div className="space-y-2">
                <Label className="text-sm text-slate-300">Full Name</Label>
                <Input
                  data-testid="auth-name-input"
                  type="text"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="bg-black/20 border-white/10 text-white placeholder:text-slate-600 focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-sm text-slate-300">Email</Label>
              <Input
                data-testid="auth-email-input"
                type="email"
                placeholder="you@school.edu"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="bg-black/20 border-white/10 text-white placeholder:text-slate-600 focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-slate-300">Password</Label>
              <Input
                data-testid="auth-password-input"
                type="password"
                placeholder="Min 6 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                className="bg-black/20 border-white/10 text-white placeholder:text-slate-600 focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3" data-testid="auth-error">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              data-testid="auth-submit-button"
              className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-xl py-2.5 font-medium"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : mode === 'login' ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
              data-testid="auth-toggle-mode"
              className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
            >
              {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.06]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#0B0821] px-3 text-slate-500">or</span>
            </div>
          </div>

          <Button
            onClick={handleGuest}
            variant="outline"
            data-testid="guest-access-button"
            className="w-full bg-white/5 hover:bg-white/10 text-slate-200 border-white/10 rounded-xl py-2.5"
          >
            <User size={16} className="mr-2" />
            Continue as Guest
          </Button>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm text-slate-500 hover:text-slate-300 flex items-center justify-center gap-1 mx-auto transition-colors"
            data-testid="back-to-dashboard"
          >
            <ArrowLeft size={14} />
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
