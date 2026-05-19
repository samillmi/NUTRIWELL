import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User, UtensilsCrossed, CalendarDays, DollarSign, Star } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { getPublicPlans } from '../../api/dietApi';
import toast from 'react-hot-toast';

const PublicPlans = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getPublicPlans()
      .then(({ data }) => setPlans(data.data.plans))
      .catch(() => toast.error('Failed to load public plans'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = plans.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) || 
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShoppingCart className="w-7 h-7 text-brand-400" /> Plan Marketplace
          </h1>
          <p className="text-slate-400 text-sm mt-1">Browse and purchase diet templates from our experts</p>
        </div>
      </div>

      <div className="card mb-6 p-4">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="input pl-10"
            placeholder="Search by plan name or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-64 skeleton rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card py-16 text-center">
          <p className="text-lg font-medium text-slate-900 dark:text-white">No plans found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(plan => (
            <div key={plan._id} className="card-hover flex flex-col p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-xl bg-brand-gradient shadow-glow-teal flex items-center justify-center text-white">
                  <UtensilsCrossed className="w-6 h-6" />
                </div>
                <div className="bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 px-3 py-1 rounded-full font-bold flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  {plan.price > 0 ? plan.price : 'Free'}
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{plan.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 flex-1">
                {plan.description || 'A comprehensive diet plan tailored for your needs.'}
              </p>

              <div className="flex items-center gap-1 mb-4">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {plan.rating || 5.0}
                </span>
                <span className="text-xs text-slate-500">({plan.totalReviews || 0})</span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6 bg-surface dark:bg-slate-900/50 p-3 rounded-xl border border-surface-border dark:border-white/5">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-brand-400" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-500 uppercase">Author</p>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      Dr. {plan.doctor?.lastName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-accent-400" />
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase">Duration</p>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">{plan.durationWeeks} Weeks</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => navigate(`/patient/checkout?type=plan_purchase&planId=${plan._id}&price=${plan.price || 0}`)}
                className="btn-primary w-full gap-2 mt-auto"
              >
                Buy Now
              </button>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default PublicPlans;
