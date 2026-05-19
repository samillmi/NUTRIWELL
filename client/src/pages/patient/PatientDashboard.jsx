import { useEffect, useState } from 'react';
import {
  Activity, Flame, Droplets, TrendingDown,
  UtensilsCrossed, ScanLine, Bot, MessageSquare,
  Video, Plus, Scale,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/common/DashboardLayout';
import { getPatientProfile, logMetrics, updatePatientProfile, cancelSubscription, getPatientBookings } from '../../api/patientApi';
import { getDietPlans } from '../../api/dietApi';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

const macroColors = ['#14b8a6', '#8b5cf6', '#f59e0b'];

const MetricsModal = ({ onClose, onSaved, currentMetrics }) => {
  const [form, setForm] = useState({
    weight: currentMetrics?.weight || '',
    height: currentMetrics?.height || '',
    targetWeight: currentMetrics?.targetWeight || ''
  });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await logMetrics({
        weight: Number(form.weight),
        height: Number(form.height),
        targetWeight: Number(form.targetWeight)
      });
      toast.success('Metrics saved!');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save metrics.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="card w-full max-w-sm animate-slide-up bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          <Scale className="w-5 h-5 text-brand-400" /> Update Body Metrics
        </h2>
        <form onSubmit={submit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label text-xs uppercase tracking-wider text-slate-500 mb-1.5 block">Current Weight (kg)</label>
              <input className="input bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-brand-500 text-slate-900 dark:text-white" type="number" step="0.1" min="20" max="300"
                value={form.weight} onChange={(e) => setForm(p => ({ ...p, weight: e.target.value }))}
                placeholder="78.5" required />
            </div>
            <div>
              <label className="label text-xs uppercase tracking-wider text-slate-500 mb-1.5 block">Height (cm)</label>
              <input className="input bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-brand-500 text-slate-900 dark:text-white" type="number" step="1" min="50" max="250"
                value={form.height} onChange={(e) => setForm(p => ({ ...p, height: e.target.value }))}
                placeholder="175" required />
            </div>
          </div>
          <div>
            <label className="label text-xs uppercase tracking-wider text-slate-500 mb-1.5 block">Target Weight (kg)</label>
            <input className="input bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-brand-500 text-slate-900 dark:text-white" type="number" step="0.1" min="20" max="300"
              value={form.targetWeight} onChange={(e) => setForm(p => ({ ...p, targetWeight: e.target.value }))}
              placeholder="70.0" />
            <p className="text-[10px] text-slate-500 mt-1.5 italic">Height is required to calculate your BMI automatically.</p>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2.5">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 py-2.5 shadow-glow-brand">
              {saving ? 'Saving...' : 'Save Metrics'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const focusOptions = [
  "People struggling with weight loss resistance",
  "Individuals managing insulin resistance, PCOS, thyroid disorders, and diabetes",
  "Mothers navigating postpartum recovery and body confidence",
  "Young professionals experiencing bloating, chronic fatigue, and burnout",
  "Women over 40 seeking to balance hormones, age healthily, and maintain vitality",
  "Individuals seeking to break free from repeated dieting cycles and adopt a healthier, more sustainable lifestyle"
];

const GoalsModal = ({ onClose, onSaved, currentGoals, currentFocus }) => {
  const [form, setForm] = useState({
    dailyCalories: currentGoals?.dailyCalories || '',
    proteinGrams: currentGoals?.proteinGrams || '',
    carbsGrams: currentGoals?.carbohydrateGrams || '',
    fatGrams: currentGoals?.fatGrams || '',
    focusAreas: currentFocus || []
  });
  const [saving, setSaving] = useState(false);

  const toggleFocus = (option) => {
    setForm(p => {
      const exists = p.focusAreas.includes(option);
      if (exists) {
        return { ...p, focusAreas: p.focusAreas.filter(o => o !== option) };
      } else {
        return { ...p, focusAreas: [...p.focusAreas, option] };
      }
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updatePatientProfile({
        dietaryGoals: {
          dailyCalories: Number(form.dailyCalories),
          proteinGrams: Number(form.proteinGrams),
          carbohydrateGrams: Number(form.carbsGrams),
          fatGrams: Number(form.fatGrams)
        },
        focusAreas: form.focusAreas
      });
      toast.success('Goals updated!');
      onSaved();
      onClose();
    } catch {
      toast.error('Failed to update goals.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="card w-80 animate-slide-up bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Flame className="w-4 h-4 text-brand-400" /> Set Dietary Goals
        </h2>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label text-slate-600 dark:text-slate-400">Daily Calories (kcal)</label>
            <input className="input bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-brand-500 text-slate-900 dark:text-white" type="number" min="500" max="10000"
              value={form.dailyCalories} onChange={(e) => setForm(p => ({ ...p, dailyCalories: e.target.value }))}
              placeholder="e.g. 2000" required />
          </div>
          <div>
            <label className="label text-slate-600 dark:text-slate-400">Protein Goal (g)</label>
            <input className="input bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-brand-500 text-slate-900 dark:text-white" type="number" min="10" max="500"
              value={form.proteinGrams} onChange={(e) => setForm(p => ({ ...p, proteinGrams: e.target.value }))}
              placeholder="e.g. 150" required />
          </div>
          <div>
            <label className="label text-slate-600 dark:text-slate-400">Carbs Goal (g)</label>
            <input className="input bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-brand-500 text-slate-900 dark:text-white" type="number" min="10" max="1000"
              value={form.carbsGrams} onChange={(e) => setForm(p => ({ ...p, carbsGrams: e.target.value }))}
              placeholder="e.g. 200" required />
          </div>
          <div>
            <label className="label text-slate-600 dark:text-slate-400">Fat Goal (g)</label>
            <input className="input bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-brand-500 text-slate-900 dark:text-white" type="number" min="10" max="300"
              value={form.fatGrams} onChange={(e) => setForm(p => ({ ...p, fatGrams: e.target.value }))}
              placeholder="e.g. 70" required />
          </div>
          <div>
            <label className="label mb-2 block text-slate-600 dark:text-slate-400">Focus Areas / Profile</label>
            <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-hide">
              {focusOptions.map(option => (
                <div key={option}
                  onClick={() => toggleFocus(option)}
                  className={`p-2 rounded-lg text-xs cursor-pointer border transition-all ${form.focusAreas.includes(option)
                    ? 'bg-brand-500/10 border-brand-500 text-brand-400 font-bold'
                    : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/20'
                    }`}>
                  {option}
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const PatientDashboard = () => {
  const { user, refreshUser } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [plans, setPlans] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMetrics, setShowMetrics] = useState(false);
  const [showGoals, setShowGoals] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [profRes, plansRes, bookingsRes] = await Promise.all([
        getPatientProfile(),
        getDietPlans(),
        getPatientBookings(),
      ]);
      setProfile(profRes.data.data.user);
      setPlans(plansRes.data.data.plans);
      const activeBookings = (bookingsRes.data?.data?.bookings || []).filter(
        (b) => b.type === 'consultation' && b.status !== 'cancelled'
      );
      setBookings(activeBookings);
    } catch {
      toast.error('Could not load profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Poll user status if subscription is pending
  useEffect(() => {
    let interval;
    if (user?.subscription?.status === 'pending') {
      interval = setInterval(() => {
        refreshUser();
      }, 10000); // 10 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user?.subscription?.status, refreshUser]);

  const currentMetrics = profile?.currentMetrics;
  const goals = profile?.dietaryGoals || {};
  const healthHistory = profile?.healthMetrics || [];

  // Weight chart data from real history
  const weightData = healthHistory.slice(-8).map((m) => ({
    date: new Date(m.recordedAt).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    weight: m.weight,
  }));

  // Macro rings — based on goals
  const pGrams = goals.proteinGrams || 0;
  const cGrams = goals.carbohydrateGrams || 0;
  const fGrams = goals.fatGrams || 0;

  const pCal = pGrams * 4;
  const cCal = cGrams * 4;
  const fCal = fGrams * 9;
  const totalCal = pCal + cCal + fCal;

  const macros = [
    { name: 'Protein', value: totalCal > 0 ? Math.round((pCal / totalCal) * 100) : 0, color: macroColors[0] },
    { name: 'Carbs', value: totalCal > 0 ? Math.round((cCal / totalCal) * 100) : 0, color: macroColors[1] },
    { name: 'Fat', value: totalCal > 0 ? Math.round((fCal / totalCal) * 100) : 0, color: macroColors[2] },
  ];

  const calorieGoal = goals.dailyCalories || 2000;
  const activePlans = plans.filter((p) => p.status === 'active');

  const sub = user?.subscription;
  const isExpired = sub?.endDate && new Date(sub.endDate) < new Date();
  
  // Granular time calculation
  const getTimeRemaining = () => {
    if (!sub?.endDate) return { total: 0, days: 0, hours: 0, minutes: 0 };
    const total = new Date(sub.endDate) - new Date();
    const minutes = Math.floor((total / 1000 / 60) % 60);
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    const days = Math.floor(total / (1000 * 60 * 60 * 24));
    return { total, days, hours, minutes };
  };

  const timeLeft = getTimeRemaining();
  const daysLeft = timeLeft.days;

  return (
    <DashboardLayout>
      {showMetrics && (
        <MetricsModal
          onClose={() => setShowMetrics(false)}
          onSaved={async () => { await load(); await refreshUser(); }}
          currentMetrics={currentMetrics}
        />
      )}

      {showGoals && (
        <GoalsModal
          onClose={() => setShowGoals(false)}
          onSaved={async () => { await load(); await refreshUser(); }}
          currentGoals={goals}
          currentFocus={profile?.focusAreas || []}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Hello, <span className="text-gradient">{user?.firstName}</span> 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Track your health & nutrition goals</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
          <button onClick={() => setShowGoals(true)} className="btn-secondary gap-2">
            <Flame className="w-4 h-4" /> Edit Goals
          </button>
          <button onClick={() => setShowMetrics(true)} className="btn-secondary gap-2">
            <Plus className="w-4 h-4" /> Log Weight
          </button>
          <Link to="/patient/scanner" className="btn-primary gap-2">
            <ScanLine className="w-4 h-4" /> Scan Food
          </Link>
        </div>
      </div>

      {/* Subscription Banner */}
      {sub?.plan && sub.plan !== 'free' && (
        <div className={`mb-8 p-6 rounded-3xl border transition-all duration-500 overflow-hidden relative group
          ${isExpired 
            ? 'bg-red-500/5 border-red-500/20' 
            : sub.status === 'pending' 
              ? 'bg-amber-500/5 border-amber-500/20' 
              : 'bg-brand-500/5 border-brand-500/20 shadow-sm'}`}>
          
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6 relative z-10">
            <div className="flex items-center gap-5">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm
                ${isExpired ? 'bg-red-500/20 text-red-400' : sub.status === 'pending' ? 'bg-amber-500/20 text-amber-400' : 'bg-brand-500/20 text-brand-400'}`}>
                <Activity className="w-7 h-7" />
              </div>
              <div>
                <h3 className={`text-xl font-black uppercase tracking-tight ${isExpired ? 'text-red-400' : sub.status === 'pending' ? 'text-amber-400' : 'text-brand-400'}`}>
                  {(sub.plan || '').charAt(0).toUpperCase() + (sub.plan || '').slice(1)} Membership {isExpired ? '• Expired' : sub.status === 'pending' ? '• Pending Approval' : '• Active'}
                </h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                  <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">
                    {isExpired 
                      ? 'Your access has ended. Renew now to continue your journey.' 
                      : sub.status === 'pending' 
                        ? 'We are verifying your payment. Access will be granted shortly.' 
                        : <>Time remaining: <span className="text-slate-900 dark:text-white font-bold">
                            {timeLeft.days > 0 && `${timeLeft.days}d `}
                            {timeLeft.hours}h {timeLeft.minutes}m
                          </span> left</>}
                  </p>
                  {sub.endDate && !isExpired && sub.status === 'active' && (
                    <span className="text-[10px] bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-500 uppercase font-black tracking-widest border border-slate-200 dark:border-white/5">
                      Expires: {new Date(sub.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 w-full lg:w-auto">
              <Link
                to="/patient/doctors"
                className={`flex-1 lg:flex-none py-3 px-6 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 text-center
                  ${isExpired 
                    ? 'bg-red-500 text-white hover:bg-red-600 shadow-glow-red' 
                    : 'bg-brand-500 text-white hover:bg-brand-600 shadow-glow-brand'}`}
              >
                {isExpired ? 'Renew Membership' : 'Upgrade Plan'}
              </Link>
              {!isExpired && sub.status === 'active' && (
                <button
                  onClick={async () => {
                    if (window.confirm('Are you sure you want to cancel your plan? You will lose access to Chat, AI Scanner, and Chatbot immediately.')) {
                      try {
                        await cancelSubscription();
                        toast.success('Plan cancelled.');
                        refreshUser();
                        await load();
                      } catch (err) {
                        toast.error('Failed to cancel plan.');
                      }
                    }
                  }}
                  className="flex-1 lg:flex-none py-3 px-6 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 text-center
                    border border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
          
          {/* Subtle Progress Background */}
          {!isExpired && sub.status === 'active' && (
            <div className="absolute bottom-0 left-0 h-1 bg-brand-500/10 w-full overflow-hidden">
              <div 
                className="h-full bg-brand-gradient shadow-glow-teal transition-all duration-1000" 
                style={{ width: `${Math.max(5, (daysLeft / 30) * 100)}%` }}
              ></div>
            </div>
          )}
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
        {[
          {
            label: 'Current Weight',
            value: currentMetrics?.weight ? `${currentMetrics.weight} kg` : '—',
            sub: 'Log to update',
            icon: Activity, color: 'text-brand-400', bg: 'bg-brand-500/10',
          },
          {
            label: 'BMI',
            value: currentMetrics?.bmi ?? '—',
            sub: currentMetrics?.bmi
              ? currentMetrics.bmi < 18.5 ? 'Underweight'
                : currentMetrics.bmi < 25 ? 'Normal'
                  : currentMetrics.bmi < 30 ? 'Overweight' : 'Obese'
              : 'Log metrics',
            icon: TrendingDown, color: 'text-amber-400', bg: 'bg-amber-500/10',
          },
          {
            label: 'Target Weight',
            value: currentMetrics?.targetWeight ? `${currentMetrics.targetWeight} kg` : '—',
            sub: 'Your goal',
            icon: Flame, color: 'text-orange-400', bg: 'bg-orange-500/10',
          },
          {
            label: 'Active Plans',
            value: activePlans.length,
            sub: activePlans.length > 0 ? `${activePlans.length} assigned` : 'No plans assigned',
            icon: UtensilsCrossed, color: 'text-emerald-400', bg: 'bg-emerald-500/10',
          },
        ].map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="card-hover animate-slide-up">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-4`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="stat-value">{value}</p>
            <p className="stat-label">{label}</p>
            <p className="text-[10px] text-slate-600 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
        {/* Weight trend */}
        <div className="card col-span-1 lg:col-span-2 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Weight History</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {weightData.length > 1
                  ? `${(weightData[0].weight - weightData[weightData.length - 1].weight).toFixed(1)} kg change`
                  : 'Log your weight to see progress'}
              </p>
            </div>
            <button onClick={() => setShowMetrics(true)}
              className="btn-sm bg-brand-500/10 border border-brand-500/20 text-brand-400 hover:bg-brand-500/20">
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>
          {weightData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2">
              <Scale className="w-10 h-10 text-slate-400 dark:text-slate-700" />
              <p className="text-sm text-slate-500">No weight logs yet. Click "Log Weight" to start.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={190}>
              <AreaChart data={weightData}>
                <defs>
                  <linearGradient id="wt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.12)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                  domain={['dataMin - 1', 'dataMax + 1']} tickFormatter={(v) => `${v}kg`} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 12, fontSize: 11, color: '#fff' }} />
                <Area type="monotone" dataKey="weight" stroke="#8b5cf6" strokeWidth={2.5}
                  fill="url(#wt)" dot={{ fill: '#8b5cf6', r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Macro target pie */}
        <div className="card flex flex-col items-center bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-1 self-start">Macro Targets</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 self-start mb-3">Based on your goals</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={macros} cx="50%" cy="50%" innerRadius={50} outerRadius={72}
                paddingAngle={3} dataKey="value">
                {macros.map((m, i) => <Cell key={i} fill={m.color} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 12, fontSize: 11, color: '#fff' }}
                formatter={(v, n) => [`${v}%`, n]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-1">
            {macros.map((m) => (
              <div key={m.name} className="text-center">
                <div className="w-2.5 h-2.5 rounded-full mx-auto mb-1" style={{ backgroundColor: m.color }} />
                <p className="text-[10px] text-slate-500 dark:text-slate-400">{m.name}</p>
                <p className="text-xs font-bold text-slate-900 dark:text-white">{m.value}%</p>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50 w-full text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">Daily Calorie Goal</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white mb-2">{calorieGoal} kcal</p>

            <p className="text-xs text-slate-500 dark:text-slate-400">Protein Goal</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white mb-2">{goals.proteinGrams || '—'} g</p>

            <p className="text-xs text-slate-500 dark:text-slate-400">Carbs Goal</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white mb-2">{goals.carbohydrateGrams || '—'} g</p>

            <p className="text-xs text-slate-500 dark:text-slate-400">Fat Goal</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{goals.fatGrams || '—'} g</p>
          </div>
        </div>
      </div>

      {/* Bottom: Active plans + quick links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="col-span-1 lg:col-span-2 space-y-5">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white px-2">Active Diet Plans ({activePlans.length})</h2>
          {activePlans.length === 0 ? (
            <div className="card flex flex-col items-center py-12 gap-3 text-center bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <UtensilsCrossed className="w-12 h-12 text-slate-400 dark:text-slate-700" />
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">No active diet plans found.</p>
              <p className="text-xs text-slate-400 dark:text-slate-600 max-w-xs">Your assigned diet plans will appear here once your doctor creates them.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activePlans.map((plan) => (
                <div key={plan._id} className="card bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/50 hover:border-brand-500/30 group">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-bold text-brand-500 dark:text-brand-300 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{plan.title}</p>
                    <span className="badge-teal">Active</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 min-h-[32px]">{plan.description || 'No description provided.'}</p>
                  <div className="grid grid-cols-2 gap-2 text-center mb-4 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-slate-700/30">
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{plan.durationWeeks}w</p>
                      <p className="text-[10px] text-slate-500">Duration</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white capitalize">{plan.category?.replace('_', ' ')}</p>
                      <p className="text-[10px] text-slate-500">Category</p>
                    </div>
                  </div>
                  <Link to={`/patient/plans?id=${plan._id}`} className="btn-secondary w-full text-xs py-2">
                    View Plan Details →
                  </Link>
                </div>
              ))}
            </div>
          )}

          {/* Upcoming Consultations Section */}
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white px-2 pt-2">Upcoming Consultations ({bookings.length})</h2>
          {bookings.length === 0 ? (
            <div className="card flex flex-col items-center py-10 gap-3 text-center bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <Video className="w-12 h-12 text-slate-400 dark:text-slate-700" />
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">No consultations booked.</p>
              <p className="text-xs text-slate-400 dark:text-slate-600 max-w-xs">You can schedule a consultation with your doctor anytime.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bookings.map((booking) => (
                <div key={booking._id} className="card bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/50 hover:border-brand-500/30 group">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {booking.doctor ? `Dr. ${booking.doctor.firstName} ${booking.doctor.lastName}` : 'Consultation'}
                    </p>
                    <span className={`badge px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      booking.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-4 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/30">
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <span className="font-semibold text-slate-400">Date:</span>
                      <span>{new Date(booking.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <span className="font-semibold text-slate-400">Time:</span>
                      <span className="bg-brand-500/10 text-brand-400 px-2 py-0.5 rounded font-bold">{booking.time}</span>
                    </div>
                    {booking.reason && (
                      <div className="text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                        <span className="font-semibold text-slate-400 block mb-0.5">Reason:</span>
                        <span className="italic">"{booking.reason.replace(/\[Group: [a-z0-9]+\]/i, '').trim()}"</span>
                      </div>
                    )}
                  </div>
                  
                  <Link to={`/patient/chat?with=${booking.doctor?._id}`} className="btn-secondary w-full text-xs py-2 text-center flex items-center justify-center gap-2">
                    <MessageSquare className="w-3.5 h-3.5" /> Message Doctor
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card border-brand-500/10">
          <h2 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-5 px-1">
            Quick Access
          </h2>
          <div className="space-y-3">
            {[
              { to: '/patient/scanner', icon: ScanLine, label: 'Scan Food', color: 'text-brand-500', bg: 'bg-brand-500/10' },
              { to: '/patient/ai', icon: Bot, label: 'Ask NutriBot', color: 'text-blue-500', bg: 'bg-blue-500/10' },
              { to: '/patient/chat', icon: MessageSquare, label: 'Chat w/ Doctor', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              { to: '/patient/plans', icon: UtensilsCrossed, label: 'My Diet Plans', color: 'text-sky-500', bg: 'bg-sky-500/10' },
            ].map(({ to, icon: Icon, label, color, bg }) => (
              <Link key={to} to={to}
                className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50/50 dark:bg-white/5 
                           border border-slate-200 dark:border-white/5 backdrop-blur-sm
                           hover:border-brand-500/40 hover:bg-brand-500/[0.02] dark:hover:bg-white/10 
                           transition-all duration-300 group shadow-sm dark:shadow-none">
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0 
                                transition-transform duration-300 group-hover:scale-110 shadow-sm`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <span className="text-sm font-bold text-slate-600 dark:text-slate-300 
                                 group-hover:text-brand-600 dark:group-hover:text-white transition-colors">
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PatientDashboard;
