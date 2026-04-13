import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Sheet, SheetContent, SheetTrigger } from '../components/ui/sheet';
import { Button } from '../components/ui/button';
import {
  LayoutDashboard,
  FileText,
  HelpCircle,
  BookOpen,
  CreditCard,
  Menu,
  LogOut,
  LogIn,
  Zap,
  ChevronRight
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/worksheet', label: 'Worksheet Generator', icon: FileText },
  { path: '/quiz', label: 'Quiz Generator', icon: HelpCircle },
  { path: '/lesson', label: 'Lesson Builder', icon: BookOpen },
  { path: '/pricing', label: 'Pricing', icon: CreditCard },
];

function NavLink({ item, isActive, onClick }) {
  return (
    <Link
      to={item.path}
      onClick={onClick}
      data-testid={`nav-${item.path.slice(1)}`}
      className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 ${
        isActive
          ? 'sidebar-link-active text-white'
          : 'sidebar-link text-slate-400 hover:text-slate-200'
      }`}
    >
      <item.icon size={18} strokeWidth={1.5} />
      <span>{item.label}</span>
      {isActive && <ChevronRight size={14} className="ml-auto text-violet-400" />}
    </Link>
  );
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-white/[0.06]">
        <Link to="/dashboard" className="flex items-center gap-2.5" data-testid="logo-link">
          <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center ai-glow">
            <Zap size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white" style={{ fontFamily: 'Outfit' }}>
              EduForge
            </h1>
            <span className="text-[10px] font-medium text-violet-400 uppercase tracking-widest">AI</span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 py-4 space-y-1" data-testid="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            item={item}
            isActive={location.pathname === item.path}
            onClick={() => setMobileOpen(false)}
          />
        ))}
      </nav>

      <div className="p-4 border-t border-white/[0.06]">
        {user ? (
          <div className="space-y-3">
            <div className="px-3">
              <p className="text-sm font-medium text-white truncate">{user.name || user.email}</p>
              <p className="text-xs text-slate-500">{user.plan === 'pro' ? 'Pro Plan' : 'Free Plan'}</p>
            </div>
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full justify-start text-slate-400 hover:text-white hover:bg-white/5"
              data-testid="logout-button"
            >
              <LogOut size={16} className="mr-2" />
              Sign Out
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => { navigate('/auth'); setMobileOpen(false); }}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white"
            data-testid="signin-button"
          >
            <LogIn size={16} className="mr-2" />
            Sign In
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#030114]">
      <aside
        className="hidden md:flex w-64 flex-col bg-[#0B0821] border-r border-white/[0.06] flex-shrink-0"
        data-testid="desktop-sidebar"
      >
        {sidebarContent}
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <div className="md:hidden fixed top-0 left-0 right-0 z-50 glass border-b border-white/[0.05] px-4 py-3 flex items-center gap-3">
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white" data-testid="mobile-menu-button">
              <Menu size={20} />
            </Button>
          </SheetTrigger>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <span className="font-bold text-white" style={{ fontFamily: 'Outfit' }}>EduForge AI</span>
          </div>
        </div>
        <SheetContent side="left" className="w-64 p-0 bg-[#0B0821] border-r border-white/[0.06]">
          {sidebarContent}
        </SheetContent>
      </Sheet>

      <main className="flex-1 overflow-y-auto pt-0 md:pt-0">
        <div className="md:hidden h-14" />
        {children}
      </main>
    </div>
  );
}
