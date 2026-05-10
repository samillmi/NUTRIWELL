import { useEffect, useState } from 'react';
import {
  Activity, Flame, Droplets, TrendingDown,
  UtensilsCrossed, ScanLine, Bot, MessageSquare,
  Video, Plus, Scale,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/common/DashboardLayout';
import { getPatientProfile, logMetrics } from '../../api/patientApi';
import { getDietPlans } from '../../api/dietApi';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

const macroColors = ['#14b8a6', '#8b5cf6', '#f59e0b'];

const MetricsModal = ({ onClose, onSaved }) => {
  const [form, setForm] = useState({ weight: '', height: '', targetWeight: '' });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await logMetrics({ 
        weight: Number(form.weight), 
        height: Number(form.height),
        targetWeight: form.targetWeight ? Number(form.targetWeight) : undefined
      });
      toast.success('Metrics saved!');
      onSaved();
      onClose();
    } catch {
      toast.error('Failed to save metrics.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="card w-80 animate-slide-up">
        <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <Scale className="w-4 h-4 text-brand-400" /> Log Body Metrics
        </h2>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Weight (kg)</label>
            <input className="input" type="number" step="0.1" min="20" max="300"
                   value={form.weight} onChange={(e) => setForm(p => ({...p, weight: e.target.value}))}
                   placeholder="e.g. 78.5" required />
          </div>
          <div>
            <label className="label">Height (cm)</label>
            <input className="input" type="number" min="100" max="250"
                   value={form.height} onChange={(e) => setForm(p => ({...p, height: e.target.value}))}
                   placeholder="e.g. 172" required />
          </div>
          <div>
            <label className="label">Target Weight (kg)</label>
            <input className="input" type="number" step="0.1" min="20" max="300"
                   value={form.targetWeight} onChange={(e) => setForm(p => ({...p, targetWeight: e.target.value}))}
                   placeholder="e.g. 70.0" />
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
  const [profile,     setProfile]     = useState(null);
  const [plans,       setPlans]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showMetrics, setShowMetrics] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [profRes, plansRes] = await Promise.all([
        getPatientProfile(),
        getDietPlans(),
      ]);
      setProfile(profRes.data.data.user);
      setPlans(plansRes.data.data.plans);
    } catch {
      toast.error('Could not load profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const currentMetrics = profile?.currentMetrics;
  const goals          = profile?.dietaryGoals || {};
  const healthHistory  = profile?.healthMetrics || [];

  // Weight chart data from real history
  const weightData = healthHistory.slice(-8).map((m) => ({
    date:   new Date(m.recordedAt).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    weight: m.weight,
  }));

  // Macro rings — based on goals
  const macros = [
    { name: 'Protein', value: 28, color: macroColors[0] },
    { name: 'Carbs',   value: 48, color: macroColors[1] },
    { name: 'Fat',     value: 24, color: macroColors[2] },
  ];

  const calorieGoal = goals.dailyCalories || 2000;
  const activePlan  = plans.find((p) => p.status === 'active');

  return (
    <DashboardLayout>
      {showMetrics && (
        <MetricsModal
          onClose={() => setShowMetrics(false)}
          onSaved={async () => { await load(); await refreshUser(); }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Hello, <span className="text-gradient">{user?.firstName}</span> 👋
          </h1>
          <p className="text-slate-400 text-sm mt-1">Track your health & nutrition goals</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowMetrics(true)} className="btn-secondary gap-2">
            <Plus className="w-4 h-4" /> Log Weight
          </button>
          <Link to="/patient/scanner" className="btn-primary gap-2">
            <ScanLine className="w-4 h-4" /> Scan Food
          </Link>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-4 gap-5 mb-8">
        {[
          {
            label: 'Current Weight',
            value: currentMetrics?.weight ? `${currentMetrics.weight} kg` : '—',
            sub:   'Log to update',
            icon:  Activity,    color: 'text-brand-400',  bg: 'bg-brand-500/10',
          },
          {
            label: 'BMI',
            value: currentMetrics?.bmi ?? '—',
            sub:   currentMetrics?.bmi
              ? currentMetrics.bmi < 18.5 ? 'Underweight'
              : currentMetrics.bmi < 25 ? 'Normal'
              : currentMetrics.bmi < 30 ? 'Overweight' : 'Obese'
              : 'Log metrics',
            icon: TrendingDown, color: 'text-amber-400',  bg: 'bg-amber-500/10',
          },
          {
            label: 'Target Weight',
            value: currentMetrics?.targetWeight ? `${currentMetrics.targetWeight} kg` : '—',
            sub:   'Your goal',
            icon:  Flame,       color: 'text-orange-400', bg: 'bg-orange-500/10',
          },
          {
            label: 'Diet Plan',
            value: activePlan ? 'Active' : 'None',
            sub:   activePlan?.title || 'No plan assigned',
            icon:  UtensilsCrossed, color: 'text-emerald-400', bg: 'bg-emerald-500/10',
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
      <div className="grid grid-cols-3 gap-5 mb-8">
        {/* Weight trend */}
        <div className="card col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Weight History</h2>
              <p className="text-xs text-slate-400">
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
              <Scale className="w-10 h-10 text-slate-700" />
              <p className="text-sm text-slate-500">No weight logs yet. Click "Log Weight" to start.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={190}>
              <AreaChart data={weightData}>
                <defs>
                  <linearGradient id="wt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                       domain={['dataMin - 1', 'dataMax + 1']} tickFormatter={(v) => `${v}kg`} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 12, fontSize: 11 }} />
                <Area type="monotone" dataKey="weight" stroke="#8b5cf6" strokeWidth={2.5}
                      fill="url(#wt)" dot={{ fill: '#8b5cf6', r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Macro target pie */}
        <div className="card flex flex-col items-center">
          <h2 className="text-sm font-semibold text-white mb-1 self-start">Macro Targets</h2>
          <p className="text-xs text-slate-400 self-start mb-3">Based on your goals</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={macros} cx="50%" cy="50%" innerRadius={50} outerRadius={72}
                   paddingAngle={3} dataKey="value">
                {macros.map((m, i) => <Cell key={i} fill={m.color} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 12, fontSize: 11 }}
                       formatter={(v, n) => [`${v}%`, n]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-1">
            {macros.map((m) => (
              <div key={m.name} className="text-center">
                <div className="w-2.5 h-2.5 rounded-full mx-auto mb-1" style={{ backgroundColor: m.color }} />
                <p className="text-[10px] text-slate-400">{m.name}</p>
                <p className="text-xs font-bold text-white">{m.value}%</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom: Active plan + quick links */}
      <div className="grid grid-cols-3 gap-5">
        {/* Active diet plan card */}
        <div className="card col-span-2">
          <h2 className="text-sm font-semibold text-white mb-4">Active Diet Plan</h2>
          {!activePlan ? (
            <div className="flex flex-col items-center py-8 gap-3">
              <UtensilsCrossed className="w-10 h-10 text-slate-700" />
              <p className="text-sm text-slate-400">No active diet plan assigned.</p>
              <p className="text-xs text-slate-600">Your doctor will assign a plan soon.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-brand-500/10 border border-brand-500/20">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold text-brand-300">{activePlan.title}</p>
                  <span className="badge-teal">Active</span>
                </div>
                <p className="text-xs text-slate-400 mb-3">{activePlan.description}</p>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-lg font-bold text-white">{activePlan.durationWeeks}w</p>
                    <p className="text-[10px] text-slate-500">Duration</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white capitalize">{activePlan.category?.replace('_', ' ')}</p>
                    <p className="text-[10px] text-slate-500">Category</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">{activePlan.weeklyPlan?.length || 0}</p>
                    <p className="text-[10px] text-slate-500">Days planned</p>
                  </div>
                </div>
              </div>
              <Link to="/patient/plans" className="btn-secondary w-full text-sm">
                View Full Plan →
              </Link>
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="card">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">Quick Access</h2>
          <div className="space-y-2">
            {[
              { to: '/patient/scanner', icon: ScanLine,     label: 'Scan Food',     color: 'text-brand-400',  bg: 'bg-brand-500/10'  },
              { to: '/patient/chatbot', icon: Bot,           label: 'Ask NutriBot',  color: 'text-accent-400', bg: 'bg-accent-500/10' },
              { to: '/patient/chat',    icon: MessageSquare, label: 'Chat w/ Doctor',color: 'text-emerald-400',bg: 'bg-emerald-500/10'},
              { to: '/patient/video',   icon: Video,         label: 'Video Call',    color: 'text-amber-400',  bg: 'bg-amber-500/10'  },
              { to: '/patient/plans',   icon: UtensilsCrossed,label:'My Diet Plans', color: 'text-sky-400',    bg: 'bg-sky-500/10'    },
            ].map(({ to, icon: Icon, label, color, bg }) => (
              <Link key={to} to={to}
                    className="flex items-center gap-3 p-3 rounded-xl bg-surface/60 border
                               border-surface-border hover:border-brand-500/30 transition-all group">
                <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-3.5 h-3.5 ${color}`} />
                </div>
                <span className="text-xs text-slate-300 group-hover:text-white transition-colors">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PatientDashboard;
