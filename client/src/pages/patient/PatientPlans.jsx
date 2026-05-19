import { useEffect, useState } from 'react';
import { UtensilsCrossed, CalendarDays, ChevronDown, ChevronUp, CheckCircle2, Star } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { getDietPlans, submitFeedback } from '../../api/dietApi';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';

const PatientPlans = () => {
  const [searchParams] = useSearchParams();
  const planIdParam = searchParams.get('id');

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedDay, setExpandedDay] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState(null);

  const [planRating, setPlanRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getDietPlans()
      .then(({ data }) => {
        const allPlans = data.data.plans;
        setPlans(allPlans);
        const activeOnes = allPlans.filter((p) => p.status === 'active');
        
        if (activeOnes.length > 0) {
          // If ID in URL, use it, otherwise use first active
          const toSelect = activeOnes.find(p => p._id === planIdParam) || activeOnes[0];
          setSelectedPlanId(toSelect._id);
          setPlanRating(toSelect.patientRating || 0);
          setFeedback(toSelect.patientFeedback || '');
        }
      })
      .catch(() => toast.error('Failed to load diet plans'))
      .finally(() => setLoading(false));
  }, [planIdParam]);

  const activePlans = plans.filter((p) => p.status === 'active');
  const activePlan = plans.find((p) => p._id === selectedPlanId) || activePlans[0];
  const pastPlans = plans.filter((p) => p.status !== 'active');

  const handlePlanChange = (p) => {
    setSelectedPlanId(p._id);
    setPlanRating(p.patientRating || 0);
    setFeedback(p.patientFeedback || '');
    setExpandedDay(null);
  };

  const toggleDay = (dayId) => {
    setExpandedDay(expandedDay === dayId ? null : dayId);
  };

  const handleFeedbackSubmit = async () => {
    if (planRating === 0) {
      return toast.error('Please provide a rating for the plan.');
    }
    if (!activePlan) return;

    setSubmitting(true);
    try {
      await submitFeedback(activePlan._id, {
        patientRating: planRating,
        patientFeedback: feedback,
      });
      toast.success('Feedback submitted successfully!');
      setPlans(plans.map(p => p._id === activePlan._id ? { ...p, patientRating: planRating, patientFeedback: feedback } : p));
    } catch (err) {
      toast.error('Failed to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <div className="h-64 skeleton rounded-2xl" />
          <div className="h-32 skeleton rounded-2xl" />
        </div>
      </DashboardLayout>
    );
  }

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

      <div className="space-y-6">
        {/* Plan Switcher Tabs */}
        {activePlans.length > 1 && (
          <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 overflow-x-auto scrollbar-hide">
            {activePlans.map((p) => (
              <button
                key={p._id}
                onClick={() => handlePlanChange(p)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  selectedPlanId === p._id
                    ? 'bg-brand-500 text-white shadow-glow-brand'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-850 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/50'
                }`}
              >
                {p.title}
              </button>
            ))}
          </div>
        )}

        {!activePlan ? (
          <div className="card py-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-brand-500/10 flex items-center justify-center mb-4">
              <UtensilsCrossed className="w-8 h-8 text-brand-400" />
            </div>
            <p className="text-lg font-medium text-white">No active diet plan</p>
            <p className="text-slate-400 text-sm mt-1 max-w-sm">
              You don't have an active diet plan assigned at the moment. Please wait for your doctor to create one.
            </p>
          </div>
        ) : (
          <div key={activePlan._id} className="animate-fade-in space-y-6">
            {/* Active Plan Header */}
            <div className="card relative overflow-hidden ring-1 ring-brand-500/50 shadow-glow-teal bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <div className="absolute top-0 right-0 p-4">
                <span className="badge-teal text-xs px-3 py-1">ACTIVE</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{activePlan.title}</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 max-w-2xl">{activePlan.description}</p>

              <div className="flex gap-6 border-t border-slate-100 dark:border-surface-border pt-4">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Prescribed By</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    Dr. {activePlan.doctor?.firstName} {activePlan.doctor?.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Duration</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{activePlan.durationWeeks} Weeks</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Category</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white capitalize">
                    {activePlan.category?.replace('_', ' ')}
                  </p>
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
                  <div key={day._id} className="card bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-0 overflow-hidden transition-all duration-300">
                    <button
                      className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-surface/50 transition-colors"
                      onClick={() => toggleDay(day._id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center font-bold text-white shadow-sm">
                          Day {day.dayNumber}
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{day.dayName}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{day.meals.length} Meals</p>
                        </div>
                      </div>
                      {expandedDay === day._id ? (
                        <ChevronUp className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                      )}
                    </button>

                    {expandedDay === day._id && (
                      <div className="p-4 bg-slate-50/50 dark:bg-surface/30 border-t border-slate-100 dark:border-surface-border space-y-4">
                        {day.meals.map((meal) => (
                          <div key={meal._id} className="p-4 rounded-xl border border-slate-200/60 dark:border-surface-border bg-white dark:bg-surface-card relative pl-6 shadow-sm">
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-brand-500 rounded-r-md"></div>
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="text-sm font-bold text-brand-600 dark:text-brand-300 capitalize flex items-center gap-2">
                                {meal.type.replace('_', ' ')}
                                <span className="text-xs font-normal text-slate-600 dark:text-slate-500 bg-slate-50 dark:bg-surface px-2 py-0.5 rounded-md border border-slate-200 dark:border-surface-border">
                                  {meal.time}
                                </span>
                              </h4>
                            </div>
                            {meal.instructions && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 italic">"{meal.instructions}"</p>
                            )}
                            <div className="space-y-1.5 mt-2">
                              {meal.foods.map((food, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                                  <CheckCircle2 className="w-4 h-4 text-brand-500/50" />
                                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                                    {food.quantity} {food.unit}
                                  </span>
                                  <span className="text-slate-600 dark:text-slate-400">{food.name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                        {day.meals.length === 0 && (
                          <p className="text-center text-sm text-slate-500 py-4">No meals scheduled.</p>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-sm">The doctor has not filled in the schedule yet.</p>
              )}
            </div>

            {/* Feedback Section */}
            <div className="card bg-white dark:bg-white/[0.05] border-slate-200 dark:border-white/10 backdrop-blur-md p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Give Feedback</h3>
              <div className="mb-4">
                <label className="label text-slate-700 dark:text-slate-300 mb-1.5">Rate the Diet Plan</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onClick={() => setPlanRating(star)} className="focus:outline-none">
                      <Star className={`w-6 h-6 ${planRating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-slate-350 dark:text-slate-600'}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <label className="label text-slate-700 dark:text-slate-300 mb-1.5">Your Comments</label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Write your feedback..."
                  className="input h-24 bg-slate-50 dark:bg-white/[0.05] border-slate-200 dark:border-white/10 text-slate-900 dark:text-white py-2"
                />
              </div>
              <button onClick={handleFeedbackSubmit} disabled={submitting} className="btn-primary">
                {submitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>
          </div>
        )}
      </div>

      {pastPlans.length > 0 && (
        <div className="mt-12">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">Past Plans</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {pastPlans.map((plan) => (
              <div key={plan._id} className="card opacity-60 hover:opacity-100 transition-opacity">
                <h4 className="text-sm font-bold text-white mb-1">{plan.title}</h4>
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
