import { useState, useEffect } from 'react';
import { Activity, TrendingUp, DollarSign, CreditCard, ShoppingCart } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getFinanceStats } from '../../api/adminApi';
import toast from 'react-hot-toast';



const AdminFinance = () => {
  const [stats, setStats] = useState({ totalRevenue: 0, byType: {}, recentTransactions: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFinanceStats()
      .then(({ data }) => setStats(data.data))
      .catch(() => toast.error('Failed to load financial data'))
      .finally(() => setLoading(false));
  }, []);
  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-7 h-7 text-brand-600" /> Financial Reports
          </h1>
          <p className="text-slate-500 text-sm mt-1">Detailed revenue and subscription metrics</p>
        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="stat-card">
          <div className="flex justify-between items-start">
            <div>
              <p className="stat-label">Total Revenue (All Time)</p>
              <h3 className="stat-value">${loading ? '...' : stats.totalRevenue.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-brand-50 rounded-xl">
              <DollarSign className="w-6 h-6 text-brand-600" />
            </div>
          </div>
          <p className="text-sm font-medium text-emerald-600 flex items-center gap-1 mt-2">
            <TrendingUp className="w-4 h-4" /> +14.5% vs last year
          </p>
        </div>

        <div className="stat-card">
          <div className="flex justify-between items-start">
            <div>
              <p className="stat-label">Plan Purchases & Subs</p>
              <h3 className="stat-value">
                ${loading ? '...' : ((stats.byType?.plan_purchase || 0) + (stats.byType?.subscription || 0)).toLocaleString()}
              </h3>
            </div>
            <div className="p-3 bg-accent-50 rounded-xl">
              <CreditCard className="w-6 h-6 text-accent-600" />
            </div>
          </div>
          <p className="text-sm font-medium text-emerald-600 flex items-center gap-1 mt-2">
            <TrendingUp className="w-4 h-4" /> +5.2% this month
          </p>
        </div>


      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Revenue Growth (Simulated Timeline)</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chartData || []}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dx={-10} tickFormatter={(val) => `$${val}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-1 card flex flex-col">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Recent Transactions</h2>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-12 skeleton rounded-xl" />)}
            </div>
          ) : stats.recentTransactions?.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No transactions yet.</p>
          ) : (
            <div className="space-y-3 flex-1 overflow-y-auto pr-2 scrollbar-hide">
              {stats.recentTransactions.map(t => (
                <div key={t._id} className="flex justify-between items-center p-3 rounded-xl bg-white/80 dark:bg-slate-800/40 backdrop-blur-md border border-slate-200 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-500/10 flex items-center justify-center">
                      {t.type === 'consultation' ? <Activity className="w-4 h-4 text-brand-500" /> : <ShoppingCart className="w-4 h-4 text-brand-500" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                        {t.type.replace('_', ' ')}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        By {t.patient?.firstName || 'User'} {t.patient?.lastName || ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-600">
                      +${t.amount !== undefined ? t.amount : 0}
                    </p>
                    <p className="text-[10px] text-slate-500">{new Date(t.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminFinance;
