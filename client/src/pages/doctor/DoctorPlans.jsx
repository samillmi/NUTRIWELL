import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, UtensilsCrossed, CalendarDays, User, Trash2, Star } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { getDietPlans, deleteDietPlan } from '../../api/dietApi';
import toast from 'react-hot-toast';

const DoctorPlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedPlan, setExpandedPlan] = useState(null); // Title of the expanded plan

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
    if (!window.confirm('Are you sure you want to delete this plan assignment?')) return;
    try {
      await deleteDietPlan(id);
      toast.success('Plan deleted successfully');
      setPlans((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      toast.error('Failed to delete plan');
    }
  };

  // Group plans by title
  const groupedPlans = plans.reduce((acc, plan) => {
    const title = plan.title;
    if (!acc[title]) {
      acc[title] = {
        ...plan,
        assignments: []
      };
    }
    acc[title].assignments.push(plan);
    return acc;
  }, {});

  const groupedArray = Object.values(groupedPlans);

  const filtered = groupedArray.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.assignments.some(a => a.patient && `${a.patient.firstName} ${a.patient.lastName}`.toLowerCase().includes(search.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || p.assignments.some(a => a.status === statusFilter);
    
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UtensilsCrossed className="w-7 h-7 text-brand-400" /> Diet Plans
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage diet plans and patient assignments</p>
        </div>
        <Link to="/doctor/plans/new" className="btn-primary gap-2 w-full sm:w-auto justify-center">
          <Plus className="w-4 h-4" /> Create New Plan
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-10">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="input pl-11 py-3"
            placeholder="Search by plan name or patient..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-2xl border border-slate-300 dark:border-slate-700/50">
          {['all', 'active', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                statusFilter === status 
                ? 'bg-brand-500 text-white shadow-glow-brand' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => <div key={i} className="h-48 skeleton rounded-3xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card py-20 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 rounded-full bg-brand-500/10 flex items-center justify-center mb-6">
            <UtensilsCrossed className="w-10 h-10 text-brand-400" />
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white">No diet plans found</p>
          <p className="text-slate-500 mt-2">Try adjusting your filters or search terms.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filtered.map((group) => {
            const activeCount = group.assignments.filter(a => a.status === 'active').length;
            const isExpanded = expandedPlan === group.title;

            return (
              <div key={group.title} className="card-hover group flex flex-col bg-white/80 dark:bg-slate-800/40 backdrop-blur-md">
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-brand-gradient flex items-center justify-center shadow-glow-teal text-white shrink-0">
                        <UtensilsCrossed className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-brand-500 transition-colors">
                          {group.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="badge-teal text-[10px] font-black uppercase px-3 py-1">
                            {activeCount} Active Patients
                          </span>
                          <span className="text-[10px] text-slate-500 font-bold px-3 py-1 bg-slate-100 dark:bg-slate-700/50 rounded-full uppercase tracking-tighter">
                            {group.assignments.length} Total
                          </span>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => setExpandedPlan(isExpanded ? null : group.title)}
                      className={`btn-sm rounded-full px-5 py-2 text-[10px] font-black uppercase tracking-widest shadow-sm transition-all w-full sm:w-auto text-center shrink-0 border ${
                        isExpanded 
                        ? 'bg-slate-800 text-white border-slate-800 dark:bg-slate-700 dark:border-slate-700' 
                        : 'bg-white text-slate-900 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-white dark:border-white/10 dark:hover:bg-slate-700'
                      }`}
                    >
                      {isExpanded ? 'Hide Info' : 'Plus Info'}
                    </button>
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed mb-6">
                    {group.description || 'No description provided.'}
                  </p>

                  <div className="flex flex-wrap items-center gap-5 text-slate-500 border-t border-slate-100 dark:border-slate-700/50 pt-5">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-brand-500" />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{group.durationWeeks} Weeks</span>
                    </div>
                    {group.category && (
                      <div className="flex items-center gap-2">
                        <Search className="w-4 h-4 text-brand-500" />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 capitalize">
                          {group.category.replace('_', ' ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded Details: List of Patients */}
                {isExpanded && (
                  <div className="border-t border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/40 p-6 animate-slide-down space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                      Patient Assignments
                    </h4>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                      {group.assignments.map((a) => (
                        <div key={a._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/30 shadow-sm transition-transform hover:scale-[1.01]">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-brand-gradient flex items-center justify-center text-white text-xs font-black shadow-sm shrink-0">
                              {a.patient?.firstName?.[0]}{a.patient?.lastName?.[0]}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 dark:text-white">
                                {a.patient ? `${a.patient.firstName} ${a.patient.lastName}` : 'Unknown Patient'}
                              </p>
                              <span className={`text-[10px] font-black uppercase tracking-tighter ${
                                a.status === 'active' ? 'text-emerald-500' : 'text-rose-500'
                              }`}>
                                {a.status}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-start sm:items-end gap-2 w-full sm:w-auto">
                             <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                               {a.patientRating > 0 && (
                                 <div className="flex text-amber-400 gap-0.5 bg-amber-400/10 px-2 py-1 rounded-lg">
                                   {[...Array(5)].map((_, i) => (
                                     <Star key={i} className={`w-3 h-3 ${i < a.patientRating ? 'fill-current' : 'text-slate-300 dark:text-slate-700'}`} />
                                   ))}
                                 </div>
                               )}
                               <button
                                 onClick={() => handleDelete(a._id)}
                                 className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all shrink-0 ml-auto sm:ml-0"
                                 title="Remove Assignment"
                                >
                                 <Trash2 className="w-4 h-4" />
                               </button>
                             </div>
                             {a.patientFeedback && (
                               <p className="text-[11px] text-slate-500 dark:text-slate-400 italic max-w-full sm:max-w-[200px] text-left sm:text-right" title={a.patientFeedback}>
                                 "{a.patientFeedback}"
                               </p>
                             )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
};

export default DoctorPlans;
