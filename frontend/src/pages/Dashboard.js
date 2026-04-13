import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { FileText, HelpCircle, BookOpen, Zap, ArrowRight, TrendingUp } from 'lucide-react';
import { Button } from '../components/ui/button';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const tools = [
  {
    title: 'Worksheet Generator',
    description: 'Create professional worksheets with multiple choice and short answer questions',
    icon: FileText,
    path: '/worksheet',
    color: 'from-violet-600 to-violet-800',
    glow: 'rgba(124, 58, 237, 0.3)',
  },
  {
    title: 'Quiz Generator',
    description: 'Generate quizzes with answer keys and difficulty scaling',
    icon: HelpCircle,
    path: '/quiz',
    color: 'from-cyan-600 to-blue-700',
    glow: 'rgba(14, 165, 233, 0.3)',
  },
  {
    title: 'Lesson Builder',
    description: 'Build lesson summaries with key concepts and real-world examples',
    icon: BookOpen,
    path: '/lesson',
    color: 'from-emerald-600 to-teal-700',
    glow: 'rgba(16, 185, 129, 0.3)',
  },
];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    axios.get(`${API}/generations/stats`, { withCredentials: true })
      .then(res => setStats(res.data))
      .catch(() => {});
  }, []);

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto animate-fade-in" data-testid="dashboard-page">
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight" style={{ fontFamily: 'Outfit' }}>
          {user ? `Welcome back, ${user.name || 'Educator'}` : 'Welcome to EduForge AI'}
        </h1>
        <p className="mt-3 text-base text-slate-400 max-w-xl">
          Generate professional teaching materials in seconds. Select a tool below to get started.
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10" data-testid="stats-grid">
          <StatCard label="Total Generated" value={stats.total} icon={TrendingUp} />
          <StatCard label="Worksheets" value={stats.worksheets} icon={FileText} />
          <StatCard label="Quizzes" value={stats.quizzes} icon={HelpCircle} />
          <StatCard label="Lessons" value={stats.lessons} icon={BookOpen} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" data-testid="tools-grid">
        {tools.map((tool) => (
          <button
            key={tool.path}
            onClick={() => navigate(tool.path)}
            data-testid={`tool-card-${tool.path.slice(1)}`}
            className="group relative bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 text-left transition-all duration-300 hover:bg-white/[0.04] hover:-translate-y-1"
            style={{ boxShadow: `0 0 0px ${tool.glow}` }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = `0 8px 32px ${tool.glow}`}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = `0 0 0px ${tool.glow}`}
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-4`}>
              <tool.icon size={22} className="text-white" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2" style={{ fontFamily: 'Outfit' }}>
              {tool.title}
            </h3>
            <p className="text-sm text-slate-400 mb-4 leading-relaxed">
              {tool.description}
            </p>
            <div className="flex items-center text-sm font-medium text-violet-400 group-hover:text-violet-300 transition-colors">
              Get Started
              <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        ))}
      </div>

      {!user && (
        <div className="mt-10 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" data-testid="guest-banner">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap size={16} className="text-violet-400" />
              <span className="text-sm font-medium text-violet-400">Guest Mode</span>
            </div>
            <p className="text-sm text-slate-400">
              You have {stats?.remaining ?? 5} free generations remaining. Sign up for more!
            </p>
          </div>
          <Button
            onClick={() => navigate('/auth')}
            className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl"
            data-testid="guest-signup-button"
          >
            Create Free Account
          </Button>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 transition-colors hover:bg-white/[0.04]">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className="text-slate-500" strokeWidth={1.5} />
        <span className="text-xs text-slate-500 font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white" style={{ fontFamily: 'Outfit' }}>{value}</p>
    </div>
  );
}
