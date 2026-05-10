import { useEffect, useState } from 'react';
import {
  Users, TrendingUp, DollarSign, Activity, ShieldCheck,
  UserX, CheckCircle2, Search, Stethoscope, RefreshCw,
} from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { getAdminStats, getAdminUsers, verifyDoctor, getFinanceStats, toggleUser } from '../../api/adminApi';
import toast from 'react-hot-toast';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

/* ── Revenue chart (static projection — real Stripe data needed) ─────── */
const revenueData = [
  { month: 'Jan', revenue: 12400, profit: 4800, subscriptions: 98  },
  { month: 'Feb', revenue: 15200, profit: 6100, subscriptions: 121 },
  { month: 'Mar', revenue: 14100, profit: 5400, subscriptions: 115 },
  { month: 'Apr', revenue: 18700, profit: 7900, subscriptions: 148 },
  { month: 'May', revenue: 21300, profit: 9200, subscriptions: 172 },
  { month: 'Jun', revenue: 24800, profit: 11100, subscriptions: 199 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass px-4 py-3 text-xs">
      <p className="text-slate-300 font-semibold mb-2">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="mb-1">
          {p.name}: <span className="font-bold">
            {p.name !== 'subscriptions' ? `$${p.value.toLocaleString()}` : p.value}
          </span>
        </p>
      ))}
    </div>
  );
};

const roleColor = {
  admin:   'badge-red',
  doctor:  'badge-teal',
  patient: 'badge-purple',
};

const AdminDashboard = () => {
  const [stats,   setStats]   = useState(null);
  const [users,   setUsers]   = useState([]);
  const [financeStats, setFinanceStats] = useState(null);
  const [search,  setSearch]  = useState('');
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, financeRes] = await Promise.all([
        getAdminStats(),
        getAdminUsers(),
        getFinanceStats()
      ]);
      setStats(statsRes.data.data);
      setUsers(usersRes.data.data.users);
      setFinanceStats(financeRes.data.data);
    } catch (err) {
      toast.error('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleVerify = async (doctorId) => {
    setVerifying(doctorId);
    try {
      await verifyDoctor(doctorId);
      toast.success('Doctor verified successfully!');
      setUsers((prev) =>
        prev.map((u) =>
          u._id === doctorId
            ? { ...u, doctorProfile: { ...u.doctorProfile, isVerified: true } }
            : u
        )
      );
    } catch {
      toast.error('Verification failed.');
    } finally {
      setVerifying(null);
    }
  };

  const handleToggleUser = async (userId, isActive) => {
    try {
      await toggleUser(userId, { isActive });
      toast.success(`User ${isActive ? 'unblocked' : 'blocked'} successfully!`);
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId
            ? { ...u, isActive }
            : u
        )
      );
    } catch {
      toast.error('Failed to update user status.');
    }
  };

  const filtered = users.filter((u) =>
    `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  );

  const pendingDoctors = users.filter(
    (u) => u.role === 'doctor' && !u.doctorProfile?.isVerified
  );

  const statCards = stats
    ? [
        { label: 'Total Users',    value: stats.totalUsers,    icon: Users,       color: 'text-brand-400',  bg: 'bg-brand-500/10',  change: null },
        { label: 'Doctors',        value: stats.totalDoctors,  icon: Stethoscope, color: 'text-emerald-400',bg: 'bg-emerald-500/10',change: null },
        { label: 'Patients',       value: stats.totalPatients, icon: Activity,    color: 'text-accent-400', bg: 'bg-accent-500/10', change: null },
        { label: 'Pending Verify', value: pendingDoctors.length, icon: ShieldCheck,color: 'text-amber-400', bg: 'bg-amber-500/10', change: null },
        { label: 'Total Revenue',  value: `$${financeStats?.totalRevenue || 0}`, icon: DollarSign, color: 'text-yellow-400', bg: 'bg-yellow-500/10', change: null },
      ]
    : [];

  return (
    <DashboardLayout>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Live platform overview & management</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} className="btn-ghost gap-2 text-xs">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <span className="badge-amber px-4 py-2 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" /> Admin Panel
          </span>
        </div>
      </div>

      {/* ── Real Stat cards ──────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-5 gap-5 mb-8">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card h-28 skeleton" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-5 mb-8">
          {statCards.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="card-hover animate-slide-up">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-4`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <p className="stat-value">{value ?? '—'}</p>
              <p className="stat-label">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Charts ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-5 mb-8">
        <div className="card col-span-2">
          <h2 className="text-sm font-semibold text-white mb-4">Revenue & Profit (Projected)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#14b8a6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}   />
                </linearGradient>
                <linearGradient id="pro" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                     tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              <Area type="monotone" dataKey="revenue" stroke="#14b8a6" strokeWidth={2} fill="url(#rev)" name="Revenue" />
              <Area type="monotone" dataKey="profit"  stroke="#8b5cf6" strokeWidth={2} fill="url(#pro)" name="Profit" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h2 className="text-sm font-semibold text-white mb-4">Subscriptions</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueData} barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="subscriptions" fill="#14b8a6" radius={[4,4,0,0]} name="subscriptions" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Pending Verifications ─────────────────────────────────────── */}
      {pendingDoctors.length > 0 && (
        <div className="card mb-6 border-amber-500/20">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-white">
              Pending Doctor Verifications
              <span className="ml-2 badge-amber">{pendingDoctors.length}</span>
            </h2>
          </div>
          <div className="space-y-2">
            {pendingDoctors.map((doc) => (
              <div key={doc._id}
                   className="flex items-center justify-between p-4 rounded-xl bg-amber-500/5
                              border border-amber-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-gradient flex items-center
                                  justify-center text-sm font-bold text-white">
                    {doc.firstName[0]}{doc.lastName[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      Dr. {doc.firstName} {doc.lastName}
                    </p>
                    <p className="text-xs text-slate-400">{doc.email}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleVerify(doc._id)}
                    disabled={verifying === doc._id}
                    className="btn-sm bg-brand-500/20 text-brand-400 border border-brand-500/30 hover:bg-brand-500/30"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {verifying === doc._id ? 'Verifying...' : 'Verify'}
                  </button>
                  <button className="btn-sm bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20">
                    <UserX className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── All Users Table ───────────────────────────────────────────── */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-white">
            All Users <span className="text-slate-500 font-normal ml-1">({filtered.length})</span>
          </h2>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              className="input pl-9 w-56 py-1.5 text-xs"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => <div key={i} className="h-14 skeleton rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-slate-500 py-8 text-sm">No users found.</p>
        ) : (
          <div className="space-y-2 max-h-[420px] overflow-y-auto scrollbar-hide">
            {filtered.map((u) => (
              <div key={u._id}
                   className="flex items-center justify-between p-3 rounded-xl bg-surface/60
                              border border-surface-border hover:border-brand-500/20 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-brand-gradient flex items-center
                                  justify-center text-xs font-bold text-white shrink-0">
                    {u.firstName[0]}{u.lastName[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {u.firstName} {u.lastName}
                    </p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={roleColor[u.role] || 'badge-teal'}>{u.role}</span>
                  {u.role === 'doctor' && (
                    <span className={u.doctorProfile?.isVerified ? 'badge-teal' : 'badge-amber'}>
                      {u.doctorProfile?.isVerified ? '✓ Verified' : 'Pending'}
                    </span>
                  )}
                  <span className={u.isActive ? 'badge-teal' : 'badge-red'}>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <button 
                    onClick={() => handleToggleUser(u._id, !u.isActive)}
                    className={`btn-sm ${u.isActive ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20' : 'bg-brand-500/10 text-brand-400 border border-brand-500/20 hover:bg-brand-500/20'}`}
                  >
                    {u.isActive ? 'Block' : 'Unblock'}
                  </button>
                  <p className="text-[10px] text-slate-500">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
