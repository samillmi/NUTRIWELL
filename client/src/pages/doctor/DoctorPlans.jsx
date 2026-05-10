import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, UtensilsCrossed, CalendarDays, User, Trash2 } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { getDietPlans, deleteDietPlan } from '../../api/dietApi';
import toast from 'react-hot-toast';

const DoctorPlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadPlans = async () => {
    setLoading(true);
    try {
      const { data } = await getDietPlans();
      setPlans(data.data.plans);
    } catch (err) {
      toast.error('Failed to load diet plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this plan?')) return;
    try {
      await deleteDietPlan(id);
      toast.success('Plan deleted successfully');
      setPlans((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      toast.error('Failed to delete plan');
    }
  };

  const filtered = plans.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    (p.patient && `${p.patient.firstName} ${p.patient.lastName}`.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UtensilsCrossed className="w-7 h-7 text-brand-400" /> Diet Plans
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage diet plans for your patients</p>
        </div>
        <Link to="/doctor/plans/new" className="btn-primary gap-2">
          <Plus className="w-4 h-4" /> Create New Plan
        </Link>
      </div>

      <div className="card mb-6">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="input pl-10"
            placeholder="Search plans by title or patient name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-5">
          {[...Array(4)].map((_, i) => <div key={i} className="h-40 skeleton rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card py-16 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-brand-500/10 flex items-center justify-center mb-4">
            <UtensilsCrossed className="w-8 h-8 text-brand-400" />
          </div>
          <p className="text-lg font-medium text-slate-900 dark:text-white">No diet plans found</p>
          <p className="text-slate-400 text-sm mt-1 max-w-sm">
            You haven't created any diet plans yet, or none match your search.
          </p>
          <Link to="/doctor/plans/new" className="btn-primary mt-6">Create your first plan</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5">
          {filtered.map((plan) => (
            <div key={plan._id} className="card-hover group flex flex-col">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center shadow-glow-teal">
                    <UtensilsCrossed className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{plan.title}</h3>
                    <span className={`badge-${plan.status === 'active' ? 'teal' : 'amber'} text-[10px] uppercase`}>
                      {plan.status}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(plan._id)}
                  className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                  title="Delete Plan"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <p className="text-sm text-slate-400 mb-4 line-clamp-2 flex-1">
                {plan.description || 'No description provided.'}
              </p>

              <div className="grid grid-cols-2 gap-3 p-3 bg-surface border border-surface-border rounded-xl">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-brand-400" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-500 uppercase">Assigned To</p>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {plan.patient ? `${plan.patient.firstName} ${plan.patient.lastName}` : 'Unassigned'}
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
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default DoctorPlans;
