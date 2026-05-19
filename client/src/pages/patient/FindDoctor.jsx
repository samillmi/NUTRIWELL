import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, Award, Calendar, ClipboardList, Check, CreditCard, ArrowLeft, Sparkles } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { getPublicDoctors } from '../../api/doctorApi';
import toast from 'react-hot-toast';
import api from '../../api/axiosInstance';
import useAuthStore from '../../store/authStore';

const FindDoctor = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [doctors, setDoctors] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const todayStr = new Date().toISOString().split('T')[0];
  const maxDateStr = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  // Step state
  const [step, setStep] = useState(1); // 1: Plans, 2: Doctors, 3: Slots, 4: Payment
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [slots, setSlots] = useState([]); // Array of {date, time}
  const [paymentForm, setPaymentForm] = useState({
    cardNumber: '',
    expiry: '',
    cvv: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [bookedSlots, setBookedSlots] = useState({}); // { index: [times] }

  useEffect(() => {
    getPublicDoctors()
      .then(({ data }) => setDoctors(data.data.doctors))
      .catch(() => toast.error('Failed to load doctors'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = doctors.filter(doc => 
    doc.firstName.toLowerCase().includes(search.toLowerCase()) || 
    doc.lastName.toLowerCase().includes(search.toLowerCase()) ||
    (doc.doctorProfile?.specialization || '').toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data } = await api.get('/plans');
        setPlans(data.data.plans);
      } catch (err) {
        toast.error('Failed to load plans.');
      }
    };
    fetchPlans();
  }, []);

  const handleSelectPlan = (plan) => {
    const subStatus = user?.subscription?.status;
    if (subStatus === 'active') {
      toast.error('You already have an active subscription! Please cancel it or wait for it to expire before buying a new one.');
      return;
    }
    if (subStatus === 'pending') {
      toast.error('You have a plan purchase pending Admin approval. Please wait.');
      return;
    }
    setSelectedPlan(plan);
    // Initialize slots array based on number of consultations
    setSlots(Array(plan.consultations).fill({ date: '', time: '' }));
    setStep(2);
  };

  const handleSelectDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setStep(3);
  };

  const handleSlotChange = (index, field, value) => {
    const newSlots = [...slots];
    newSlots[index] = { ...newSlots[index], [field]: value };
    setSlots(newSlots);
    
    if (field === 'date' && value) {
      fetchBookedSlots(index, value);
    }
  };

  const fetchBookedSlots = async (index, date) => {
    try {
      const { data } = await api.get(`/bookings/available-slots?doctor=${selectedDoctor._id}&date=${date}`);
      setBookedSlots(prev => ({ ...prev, [index]: data.data.bookedTimes }));
    } catch (err) {
      console.error(err);
    }
  };

  const handlePaymentChange = (e) => {
    setPaymentForm({ ...paymentForm, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (paymentForm.cardNumber.length !== 16 || !/^\d+$/.test(paymentForm.cardNumber)) {
      toast.error('Card number must be exactly 16 digits.');
      return;
    }
    
    // Check if all slots are filled
    const allFilled = slots.every(slot => slot.date && slot.time);
    if (!allFilled) {
      toast.error('Please fill all consultation slots.');
      return;
    }

    setSubmitting(true);
    try {
      const planIndex = plans.findIndex(p => p._id === selectedPlan._id);
      const planCode = planIndex !== -1 ? `plan${planIndex + 1}` : 'basic';

      await api.post('/bookings/bulk', {
        doctor: selectedDoctor._id,
        slots: slots,
        reason: `Purchase of ${selectedPlan.name}`,
        type: 'consultation',
        plan: planCode
      });
      
      const { refreshUser } = useAuthStore.getState();
      await refreshUser();
      
      toast.success('Plan purchased successfully! Welcome to NutriWell!', { icon: '🎉' });
      navigate('/patient');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to complete purchase.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepHeader = () => {
    const steps = [
      { n: 1, label: 'Choose Plan' },
      { n: 2, label: 'Choose Doctor' },
      { n: 3, label: 'Select Slots' },
      { n: 4, label: 'Payment' }
    ];
    return (
      <div className="flex items-center justify-between mb-8 max-w-2xl mx-auto">
        {steps.map((s, idx) => (
          <div key={s.n} className="flex items-center flex-1 last:flex-none">
            <div className={`flex flex-col items-center gap-1`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                ${step === s.n ? 'bg-brand-500 text-white' : 
                  step > s.n ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                {step > s.n ? '✓' : s.n}
              </div>
              <span className={`text-xs font-medium ${step >= s.n ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                {s.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${step > s.n ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Health Plans</h1>
          <p className="text-slate-400 text-sm mt-1">Choose a plan and book your consultations</p>
        </div>
        {step > 1 && (
          <button onClick={() => setStep(step - 1)} className="btn-secondary gap-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        )}
      </div>

      {renderStepHeader()}

      {/* ── STEP 1: PLANS ────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto px-4">
          {plans.map((plan) => (
            <div key={plan._id} 
                 className={`card-hover relative flex flex-col p-8 transition-all duration-500 overflow-visible
                   ${plan.popular ? 'border-2 border-brand-500 ring-4 ring-brand-500/10 scale-105 z-10' : 'border border-surface-border'}`}>
              
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                  <div className="bg-brand-gradient text-white text-[10px] font-black px-5 py-2 rounded-full shadow-glow-teal flex items-center gap-2 tracking-[0.2em] uppercase whitespace-nowrap w-max">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" /> Most Popular
                  </div>
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900 dark:text-white">${plan.price}</span>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">/package</span>
                </div>
              </div>
              
              <div className="space-y-4 mb-10 flex-1">
                {plan.features.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-3 group/feat">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5 group-hover/feat:bg-emerald-500/20 transition-colors">
                      <Check className="w-3 h-3 text-emerald-500" />
                    </div>
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-tight">
                      {feat}
                    </span>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => handleSelectPlan(plan)}
                className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-300
                  ${plan.popular 
                    ? 'btn-primary shadow-glow-teal hover:scale-[1.02]' 
                    : 'btn-secondary hover:bg-slate-100 dark:hover:bg-white/10'}`}
              >
                Select Plan
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── STEP 2: DOCTORS ──────────────────────────────────────────── */}
      {step === 2 && (
        <div className="max-w-5xl mx-auto">
          <div className="card mb-6 p-4">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                className="input pl-10"
                placeholder="Search by name or specialization..."
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
              <p className="text-lg font-medium text-slate-900 dark:text-white">No doctors found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(doc => (
                <div key={doc._id} className="card-hover flex flex-col items-center text-center p-6">
                  <div className="w-20 h-20 rounded-full bg-brand-gradient shadow-glow-teal mb-4 overflow-hidden border-2 border-brand-200 p-0.5">
                    {doc.avatar ? (
                      <img src={doc.avatar} alt="doctor" className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <div className="w-full h-full bg-brand-500 flex items-center justify-center text-white text-2xl font-bold rounded-full">
                        {doc.firstName[0]}
                      </div>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Dr. {doc.firstName} {doc.lastName}</h3>
                  <p className="text-sm text-brand-600 dark:text-brand-400 font-medium mb-3">
                    {doc.doctorProfile?.specialization || 'Dietitian'}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-500 mb-6">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span className="font-bold text-slate-700 dark:text-slate-300">{doc.doctorProfile?.rating || 5.0}</span>
                      <span>({doc.doctorProfile?.totalReviews || 0})</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Award className="w-4 h-4 text-brand-400" />
                      <span>{doc.doctorProfile?.yearsOfExperience || 1}+ Years</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleSelectDoctor(doc)}
                    className="btn-primary w-full gap-2 mt-auto"
                  >
                    Select Doctor
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── STEP 3: SLOTS ────────────────────────────────────────────── */}
      {step === 3 && (
        <div className="max-w-2xl mx-auto card p-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
            Schedule your {selectedPlan.consultations} consultation{selectedPlan.consultations > 1 ? 's' : ''}
          </h2>
          
          <div className="space-y-4 mb-6">
            {slots.map((slot, index) => (
              <div key={index} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-surface-border">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Consultation #{index + 1}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Date</label>
                    <input 
                      type="date" 
                      className="input"
                      value={slot.date}
                      onChange={(e) => handleSlotChange(index, 'date', e.target.value)}
                      min={todayStr}
                      max={maxDateStr}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Time</label>
                    <select 
                      className="input"
                      value={slot.time}
                      onChange={(e) => handleSlotChange(index, 'time', e.target.value)}
                      required
                      disabled={!slot.date}
                    >
                      <option value="">Select Time</option>
                      {['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'].map(t => {
                        const isBooked = bookedSlots[index]?.includes(t);
                        
                        const now = new Date();
                        const currentHour = now.getHours();
                        const currentMinute = now.getMinutes();
                        const [slotHour, slotMinute] = t.split(':').map(Number);
                        const isPast = slot.date === todayStr && (slotHour < currentHour || (slotHour === currentHour && slotMinute <= currentMinute));
                        
                        const isDisabled = isBooked || isPast;
                        
                        return (
                          <option key={t} value={t} disabled={isDisabled}>
                            {t} {isBooked ? '(Booked)' : isPast ? '(Past)' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={() => {
              const allFilled = slots.every(slot => slot.date && slot.time);
              if (allFilled) setStep(4);
              else toast.error('Please fill all slots.');
            }}
            className="btn-primary w-full"
          >
            Continue to Payment
          </button>
        </div>
      )}

      {/* ── STEP 4: PAYMENT ──────────────────────────────────────────── */}
      {step === 4 && (
        <div className="max-w-2xl mx-auto card p-6">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Order Summary</h2>
            <div className="flex justify-between items-center py-2 border-b border-surface-border">
              <span className="text-slate-600 dark:text-slate-400">{selectedPlan.name} with Dr. {selectedDoctor.firstName}</span>
              <span className="font-bold text-slate-900 dark:text-white">${selectedPlan.price}</span>
            </div>
            <div className="flex justify-between items-center py-2 font-bold text-lg text-slate-900 dark:text-white">
              <span>Total</span>
              <span>${selectedPlan.price}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label" htmlFor="cardNumber">Card Number</label>
              <input
                id="cardNumber"
                name="cardNumber"
                type="text"
                placeholder="16 digits"
                value={paymentForm.cardNumber}
                onChange={handlePaymentChange}
                maxLength={16}
                className="input"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor="expiry">Expiry Date</label>
                <input
                  id="expiry"
                  name="expiry"
                  type="text"
                  placeholder="MM/YY"
                  value={paymentForm.expiry}
                  onChange={handlePaymentChange}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label" htmlFor="cvv">CVV</label>
                <input
                  id="cvv"
                  name="cvv"
                  type="text"
                  placeholder="3 digits"
                  value={paymentForm.cvv}
                  onChange={handlePaymentChange}
                  maxLength={3}
                  className="input"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn-primary w-full gap-2 mt-2"
              disabled={submitting}
            >
              <CreditCard className="w-4 h-4" /> 
              {submitting ? 'Processing...' : `Pay $${selectedPlan.price}`}
            </button>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
};

export default FindDoctor;
