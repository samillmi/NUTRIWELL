import { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, ShieldCheck, Zap, Activity, Star } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import toast from 'react-hot-toast';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { processPayment } from '../../api/paymentApi';
import api from '../../api/axiosInstance';

const PatientCheckout = () => {
  const [loading, setLoading] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [consultationDate, setConsultationDate] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [bookedSlots, setBookedSlots] = useState([]);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const type = searchParams.get('type') || 'subscription';
  const planId = searchParams.get('planId');
  const doctorId = searchParams.get('doctorId');
  const initialPrice = searchParams.get('price');
  
  const [selectedPlan, setSelectedPlan] = useState(type === 'subscription' ? 'premium' : 'custom');

  useEffect(() => {
    const fetchSlots = async () => {
      try {
        const { data } = await api.get(`/consultations/doctor/${doctorId}`);
        setBookedSlots(data?.data?.bookedSlots || []);
      } catch (err) {
        console.error('Failed to load slots');
        setBookedSlots([]);
      }
    };
    if (doctorId && doctorId !== 'undefined' && type === 'consultation_booking') fetchSlots();
  }, [doctorId, type]);

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cardNumber.length !== 8) {
      return toast.error('Card number must be exactly 8 digits.');
    }
    if (type === 'consultation_booking' && !consultationDate) {
      return toast.error('Please select a consultation time slot.');
    }
    setLoading(true);
    
    try {
      const amount = type === 'subscription' 
        ? (selectedPlan === 'premium' ? 49 : 29)
        : Number(initialPrice || 0);

      const description = type === 'subscription' 
        ? `${selectedPlan} subscription` 
        : (type === 'plan_purchase' ? 'Diet Plan Purchase' : 'Consultation Booking');

      await processPayment({
        amount,
        type,
        description,
        planId,
        doctorId,
        consultationDate: type === 'consultation_booking' ? consultationDate : undefined
      });

      toast.success('Payment successful!');
      navigate('/patient');
    } catch (err) {
      const msg = err.response?.data?.message || 'Payment failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const displayPrice = type === 'subscription' 
    ? (selectedPlan === 'premium' ? '49.00' : '29.00') 
    : (initialPrice || '0.00');

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-brand-600 dark:text-brand-400" /> Checkout
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Complete your secure payment</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Details */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Order Summary</h2>
          
          {type === 'subscription' ? (
            <>
              <div 
                onClick={() => setSelectedPlan('premium')}
            className={`card cursor-pointer border-2 transition-all ${
              selectedPlan === 'premium' ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10 shadow-glow-teal' : 'hover:border-brand-500/50'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="badge-teal mb-2">MOST POPULAR</span>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Premium Health</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Full access to doctors & custom diets</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-slate-900 dark:text-white">$49</span>
                <span className="text-slate-500 dark:text-slate-400 text-sm">/mo</span>
              </div>
            </div>
            <ul className="space-y-2 mt-4">
              <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-brand-500" /> Unlimited Video Consultations
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-brand-500" /> Custom Weekly Diet Plans
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-brand-500" /> Advanced AI Food Scanning
              </li>
            </ul>
          </div>

          <div 
            onClick={() => setSelectedPlan('single')}
            className={`card cursor-pointer border-2 transition-all ${
              selectedPlan === 'single' ? 'border-accent-500 bg-accent-50 dark:bg-accent-500/10 shadow-glow-purple' : 'hover:border-accent-500/50'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Single Session</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">One-time consultation with a doctor</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-slate-900 dark:text-white">$29</span>
                <span className="text-slate-500 dark:text-slate-400 text-sm">/session</span>
              </div>
            </div>
            <ul className="space-y-2 mt-4">
              <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-accent-500" /> 1x Video Consultation (30 mins)
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-accent-500" /> Basic AI features
              </li>
            </ul>
          </div>
            </>
          ) : (
            <div className="card border-2 border-brand-500 bg-brand-50 dark:bg-brand-500/10 shadow-glow-teal">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                    {type === 'plan_purchase' ? 'Diet Plan Template' : 'Doctor Consultation'}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">One-time purchase</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">${initialPrice}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Checkout Form */}
        <div>
          <div className="card sticky top-24">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" /> Secure Checkout
            </h2>
            
            <form onSubmit={handleCheckout} className="space-y-4">
              <div>
                <label className="label">Cardholder Name</label>
                <input type="text" required placeholder="John Doe" className="input" />
              </div>
              
              {type === 'consultation_booking' && (
                <div className="space-y-3">
                  <div>
                    <label className="label">Select Date</label>
                    <input 
                      type="date" 
                      required 
                      className="input" 
                      onChange={(e) => {
                        setSelectedDay(e.target.value);
                        setConsultationDate(''); // Reset time when day changes
                      }}
                    />
                  </div>
                  
                  {selectedDay && (
                    <div>
                      <label className="label">Available Slots</label>
                      <div className="grid grid-cols-4 gap-2">
                        {['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30']
                          .filter(time => {
                            const localDateTime = `${selectedDay}T${time}:00`;
                            const slotDateObj = new Date(localDateTime);
                            const slotISO = !isNaN(slotDateObj.getTime()) ? slotDateObj.toISOString() : '';
                            
                            const isBooked = bookedSlots.some(slot => {
                              if (!slot.date) return false;
                              const d = new Date(slot.date);
                              if (isNaN(d.getTime())) return false;
                              
                              const slotTime = new Date(localDateTime).getTime();
                              const bookedTime = d.getTime();
                              
                              return Math.abs(bookedTime - slotTime) < 30 * 60000;
                            });
                            return !isBooked; // Only show free slots
                          })
                          .map(time => {
                            const localDateTime = `${selectedDay}T${time}:00`;
                            const slotDateObj = new Date(localDateTime);
                            const slotISO = !isNaN(slotDateObj.getTime()) ? slotDateObj.toISOString() : '';
                            
                            const isSelected = consultationDate && slotISO && consultationDate.slice(0, 16) === slotISO.slice(0, 16);

                            return (
                              <button
                                key={time}
                                type="button"
                                onClick={() => {
                                  if (slotISO) setConsultationDate(slotISO);
                                }}
                                className={`py-2 px-1 text-xs font-bold rounded-lg border transition-all ${
                                  isSelected
                                    ? 'border-brand-500 bg-brand-500/20 text-brand-500 dark:text-brand-400'
                                    : 'border-surface-border bg-white dark:bg-surface/60 text-slate-800 dark:text-white hover:border-brand-500/50'
                                }`}
                              >
                                {time}
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <div>
                <label className="label">Card Number (8 Digits)</label>
                <div className="relative">
                  <CreditCard className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    required 
                    placeholder="12345678" 
                    className="input pl-10 tracking-widest" 
                    maxLength="8"
                    minLength="8"
                    pattern="\d{8}"
                    title="Card number must be exactly 8 digits"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Expiry Date</label>
                  <input type="text" required placeholder="MM/YY" className="input text-center" maxLength="5" />
                </div>
                <div>
                  <label className="label">CVC</label>
                  <input type="text" required placeholder="123" className="input text-center" maxLength="4" />
                </div>
              </div>

              <div className="pt-4 border-t border-surface-border mt-6">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-slate-600 dark:text-slate-400">Total Amount:</span>
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    ${displayPrice}
                  </span>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-lg">
                  {loading ? 'Processing...' : `Pay $${displayPrice}`}
                </button>
              </div>
            </form>
            
            <p className="text-center text-xs text-slate-400 mt-4 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Payments are secure and encrypted
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PatientCheckout;
