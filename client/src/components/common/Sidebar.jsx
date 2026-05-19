import { NavLink, useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import {
  LayoutDashboard, Users, Settings, LogOut, Stethoscope,
  UtensilsCrossed, MessageSquare, Video, ScanLine, Bot, ClipboardList,
  ChevronRight, Activity, Shield, Sun, Moon, CreditCard, ShoppingCart, Search, Sparkles, Home,
  Camera, X, BookOpen
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { useTheme } from '../../context/ThemeContext';
import { logout } from '../../api/authApi';
import toast from 'react-hot-toast';
import api from '../../api/axiosInstance';

const navConfig = {
  admin: [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/users', icon: Users, label: 'Users' },
    { to: '/admin/finance', icon: Activity, label: 'Financials' },
    // { to: '/admin/payments', icon: CreditCard, label: 'Payments' },
    { to: '/admin/plans', icon: ClipboardList, label: 'Plans' },
    { to: '/admin/settings', icon: Settings, label: 'Settings' },
    { to: '/admin/blogs', icon: BookOpen, label: 'Blogs' },
    { to: '/admin/support', icon: MessageSquare, label: 'Support Msgs' },
  ],
  doctor: [
    { to: '/doctor', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/doctor/patients', icon: Users, label: 'My Patients' },
    { to: '/doctor/plans', icon: UtensilsCrossed, label: 'Diet Plans' },
    { to: '/doctor/chat', icon: MessageSquare, label: 'Chat' },
    { to: '/doctor/blogs', icon: BookOpen, label: 'My Blogs' },
    { to: '/doctor/contact-admin', icon: Shield, label: 'Contact Admin' },
    { to: '/doctor/settings', icon: Settings, label: 'Settings' },
  ],
  patient: [
    { to: '/patient', icon: Home, label: 'Dashboard' },
    { to: '/patient/plans', icon: UtensilsCrossed, label: 'My Diet Plans' },
    { to: '/patient/marketplace', icon: ShoppingCart, label: 'Public Templates' },
    { to: '/patient/doctors', icon: ClipboardList, label: 'Plans' },
    { to: '/patient/ai', icon: Sparkles, label: 'AI Assistant' },
    { to: '/patient/chat', icon: MessageSquare, label: 'Chat' },
    { to: '/patient/blogs', icon: BookOpen, label: 'Blogs' },
    { to: '/patient/contact-admin', icon: Shield, label: 'Contact Admin' },
    { to: '/patient/settings', icon: Settings, label: 'Settings' },
  ],
};

const roleIcons = { admin: Shield, doctor: Stethoscope, patient: Activity };
const roleLabels = { admin: 'Admin', doctor: 'Doctor', patient: 'Patient' };
const roleColors = {
  admin: 'text-red-400    bg-red-500/10    border-red-500/30',
  doctor: 'text-brand-400  bg-brand-500/10  border-brand-500/30',
  patient: 'text-accent-400 bg-accent-500/10 border-accent-500/30',
};

const Sidebar = ({ isOpen, onClose }) => {
  const { user, clearAuth, setAuth } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const RoleIcon = roleIcons[user?.role] || Shield;
  
  let items = navConfig[user?.role] || [];
  
  // If doctor and not verified, restrict items
  if (user?.role === 'doctor' && !user?.doctorProfile?.isVerified) {
    items = items.filter(item => 
      ['Dashboard', 'Contact Admin', 'Settings'].includes(item.label)
    );
  }

  const handleLogout = async () => {
    try { await logout(); } catch { /* ignore */ }
    clearAuth();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    const loadingToast = toast.loading('Uploading avatar...');

    try {
      const endpoint = user.role === 'doctor' ? '/doctors/profile' : '/patients/profile';
      const { data } = await api.patch(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });

      if (data.success) {
        toast.success('Avatar updated!', { id: loadingToast });
        // Update user in store!
        const token = localStorage.getItem('accessToken');
        setAuth(data.data.user, token);
      }
    } catch (err) {
      console.error('Failed to upload avatar:', err);
      toast.error('Failed to upload avatar.', { id: loadingToast });
    }
  };

  return (
    <aside className={`fixed inset-y-0 left-0 z-40 w-64 flex flex-col
                      bg-surface-card dark:bg-slate-900 border-r border-surface-border dark:border-white/10 transition-transform duration-300
                      ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>

      {/* Close button for mobile */}
      <button
        onClick={onClose}
        className="lg:hidden absolute top-4 right-4 p-2 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-lg"
      >
        <X className="w-5 h-5" />
      </button>

      {/* ── Logo ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-surface-border dark:border-white/10">
        <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center
                        shadow-glow-teal shrink-0">
          <UtensilsCrossed className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">NutriWell</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">AI Diet Platform</p>
        </div>
      </div>

      {/* ── User badge ───────────────────────────────────────────────── */}
      <div className="px-4 py-4 border-b border-surface-border dark:border-white/10">
        <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${roleColors[user?.role]}`}>
          <div className="relative group cursor-pointer shrink-0" onClick={() => fileInputRef.current?.click()}>
            {user?.avatar ? (
              <img src={user.avatar} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-accent-500
                              flex items-center justify-center text-xs font-bold text-white">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-4 h-4 text-white" />
            </div>
          </div>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />

          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              <RoleIcon className="w-3 h-3" />
              <p className="text-[10px] font-medium">{roleLabels[user?.role]}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Nav items ────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5 scrollbar-hide">
        {items.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to.split('/').length <= 2}
            className={({ isActive }) => isActive ? 'nav-item-active' : 'nav-item'}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="flex-1">{label}</span>
            <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </NavLink>
        ))}
      </nav>

      {/* ── Footer actions ─────────────────────────────────────────────── */}
      <div className="p-3 border-t border-surface-border dark:border-white/10 space-y-1">
        <button onClick={toggleTheme} className="nav-item w-full text-slate-500 hover:text-slate-800 dark:hover:text-white">
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        <button onClick={handleLogout} className="nav-item w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10">
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
