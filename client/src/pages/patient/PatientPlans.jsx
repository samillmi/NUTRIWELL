import { useEffect, useState } from 'react';
import { UtensilsCrossed, CalendarDays, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { getDietPlans } from '../../api/dietApi';
import toast from 'react-hot-toast';

const PatientPlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedDay, setExpandedDay] = useState(null);

  useEffect(() => {
    getDietPlans()
      .then(({ data }) => setPlans(data.data.plans))
      .catch(() => toast.error('Failed to load diet plans'))
      .finally(() => setLoading(false));
  }, []);

  const activePlan = plans.find((p) => p.status === 'active');
  const pastPlans = plans.filter((p) => p.status !== 'active');

  const toggleDay = (dayId) => {
    setExpandedDay(expandedDay === dayId ? null : dayId);
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UtensilsCrossed className="w-7 h-7 text-brand-400" /> My Diet Plans
          </h1>
          <p className="text-slate-400 text-sm mt-1">View the nutrition plan prescribed by your doctor</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="h-64 skeleton rounded-2xl" />
          <div className="h-32 skeleton rounded-2xl" />
        </div>
      ) : !activePlan ? (
        <div className="card py-16 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-brand-500/10 flex items-center justify-center mb-4">
            <UtensilsCrossed className="w-8 h-8 text-brand-400" />
          </div>
          <p className="text-lg font-medium text-slate-900 dark:text-white">No active diet plan</p>
          <p className="text-slate-400 text-sm mt-1 max-w-sm">
            You don't have an active diet plan assigned at the moment. Please wait for your doctor to create one.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Plan Header */}
          <div className="card relative overflow-hidden ring-1 ring-brand-500/50 shadow-glow-teal">
            <div className="absolute top-0 right-0 p-4">
              <span className="badge-teal text-xs px-3 py-1">ACTIVE</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{activePlan.title}</h2>
            <p className="text-sm text-slate-300 mb-6 max-w-2xl">{activePlan.description}</p>
            
            <div className="flex gap-6 border-t border-surface-border pt-4">
              <div>
                <p className="text-[10px] text-slate-500 uppercase">Prescribed By</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Dr. {activePlan.doctor.firstName} {activePlan.doctor.lastName}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase">Duration</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{activePlan.durationWeeks} Weeks</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase">Category</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white capitalize">{activePlan.category.replace('_', ' ')}</p>
              </div>
            </div>
          </div>

          {/* Daily Schedule */}
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-accent-400" /> Weekly Schedule
          </h3>

          <div className="space-y-4">
            {activePlan.weeklyPlan?.length > 0 ? (
              activePlan.weeklyPlan.map((day) => (
                <div key={day._id} className="card p-0 overflow-hidden transition-all duration-300">
                  <button 
                    className="w-full p-4 flex items-center justify-between hover:bg-surface/50 transition-colors"
                    onClick={() => toggleDay(day._id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center font-bold text-white">
                        Day {day.dayNumber}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{day.dayName}</p>
                        <p className="text-xs text-slate-400">{day.meals.length} Meals</p>
                      </div>
                    </div>
                    {expandedDay === day._id ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </button>

                  {/* Meals List - Expanded View */}
                  {expandedDay === day._id && (
                    <div className="p-4 bg-surface/30 border-t border-surface-border space-y-4">
                      {day.meals.map((meal) => (
                        <div key={meal._id} className="p-4 rounded-xl border border-surface-border bg-surface-card relative pl-6">
                          {/* Timeline dot */}
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-brand-500 rounded-r-md"></div>
                          
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="text-sm font-bold text-brand-300 capitalize flex items-center gap-2">
                                {meal.type.replace('_', ' ')}
                                <span className="text-xs font-normal text-slate-500 bg-surface px-2 py-0.5 rounded-md border border-surface-border">
                                  {meal.time}
                                </span>
                              </h4>
                            </div>
                          </div>
                          
                          {meal.instructions && (
                            <p className="text-xs text-slate-400 mb-3 italic">"{meal.instructions}"</p>
                          )}

                          <div className="space-y-1.5 mt-2">
                            {meal.foods.map((food, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-sm text-slate-200">
                                <CheckCircle2 className="w-4 h-4 text-brand-500/50" />
                                <span className="font-medium">{food.quantity} {food.unit}</span>
                                <span className="text-slate-400">{food.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      {day.meals.length === 0 && (
                        <p className="text-center text-sm text-slate-500 py-4">No meals scheduled for this day.</p>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-sm">The doctor has not filled in the daily schedule yet.</p>
            )}
          </div>
        </div>
      )}

      {pastPlans.length > 0 && (
        <div className="mt-12">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">Past Plans</h3>
          <div className="grid grid-cols-3 gap-4">
            {pastPlans.map(plan => (
              <div key={plan._id} className="card opacity-60 hover:opacity-100 transition-opacity">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">{plan.title}</h4>
                <p className="text-xs text-slate-400">{new Date(plan.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default PatientPlans;
