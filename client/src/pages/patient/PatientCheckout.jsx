import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/common/DashboardLayout';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';

const PatientCheckout = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const doctorId = searchParams.get('doctorId');
  const type = searchParams.get('type');
  
  const [form, setForm] = useState({
    date: '',
    time: '',
    reason: '',
    cardNumber: '',
    expiry: '',
    cvv: ''
  });
  const [loading, setLoading] = useState(false);
  const [bookedTimes, setBookedTimes] = useState([]);
  
  const allSlots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];

  useEffect(() => {
    const fetchBookedSlots = async () => {
      if (!form.date || !doctorId) return;
      try {
        const { data } = await api.get(`/bookings/available-slots?doctor=${doctorId}&date=${form.date}`);
        setBookedTimes(data.data.bookedTimes);
      } catch (err) {
        toast.error('Failed to fetch available slots.');
      }
    };
    fetchBookedSlots();
  }, [form.date, doctorId]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Card Validation
    if (!form.cardNumber || form.cardNumber.length !== 8 || !/^\d+$/.test(form.cardNumber)) {
      toast.error('Card number must be exactly 8 digits.');
      return;
    }
    if (!form.expiry || !/^(0[1-9]|1[0-2])\/\d{2}$/.test(form.expiry)) {
      toast.error('Expiry date must be in MM/YY format.');
      return;
    }
    if (!form.cvv || form.cvv.length !== 3 || !/^\d+$/.test(form.cvv)) {
      toast.error('CVV must be exactly 3 digits.');
      return;
    }

    if (type === 'scanner' || type === 'chatbot' || type === 'plan_purchase') {
      setLoading(true);
      try {
        await api.post('/bookings', {
          type: type,
          reason: type === 'plan_purchase' ? `Purchase of Diet Plan ID: ${searchParams.get('planId')}` : `Purchase of ${type}`
        });
        toast.success('Payment submitted! Waiting for Admin approval.');
        navigate('/patient');
      } catch (err) {
        toast.error('Failed to submit payment.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!doctorId) {
      toast.error('Doctor ID is missing.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/bookings', {
        doctor: doctorId,
        date: form.date,
        time: form.time,
        reason: form.reason
      });
      toast.success('Consultation booked successfully!');
      navigate('/patient');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to book consultation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">
          {type === 'scanner' ? 'Unlock AI Food Scanner' : type === 'chatbot' ? 'Unlock AI Chatbot' : type === 'plan_purchase' ? 'Buy Diet Plan' : 'Book Your Consultation'}
        </h1>
        
        <div className="card bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
          <div className="mb-4 p-3 bg-brand-500/10 rounded-lg flex justify-between items-center">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {(type === 'scanner' || type === 'chatbot') ? 'Unlock Fee' : 'Fee'}
            </span>
            <span className="text-lg font-bold text-brand-400">${searchParams.get('price') || 29}</span>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {type !== 'scanner' && type !== 'chatbot' && type !== 'plan_purchase' && (
              <>
                <div>
                  <label className="label block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1" htmlFor="date">
                    Date
                  </label>
                  <input
                    id="date"
                    name="date"
                    type="date"
                    required
                    value={form.date}
                    onChange={handleChange}
                    className="input w-full p-2 border rounded-md dark:bg-slate-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="label block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1" htmlFor="time">
                    Time
                  </label>
                  <select
                    id="time"
                    name="time"
                    required
                    value={form.time}
                    onChange={handleChange}
                    className="input w-full p-2 border rounded-md dark:bg-slate-700 dark:text-white"
                  >
                    <option value="">Select a time</option>
                    {allSlots.map(slot => (
                      <option 
                        key={slot} 
                        value={slot} 
                        disabled={bookedTimes.includes(slot)}
                      >
                        {slot} {bookedTimes.includes(slot) ? '(Booked)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1" htmlFor="reason">
                    Reason for Consultation
                  </label>
                  <textarea
                    id="reason"
                    name="reason"
                    required
                    placeholder="Briefly describe what you want to discuss..."
                    value={form.reason}
                    onChange={handleChange}
                    className="input w-full p-2 border rounded-md dark:bg-slate-700 dark:text-white h-24"
                  />
                </div>
              </>
            )}

            <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
              <h2 className="text-lg font-semibold mb-3 text-slate-900 dark:text-white">Payment Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="label block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1" htmlFor="cardNumber">
                    Card Number
                  </label>
                  <input
                    id="cardNumber"
                    name="cardNumber"
                    type="text"
                    placeholder="8 digits"
                    value={form.cardNumber}
                    onChange={handleChange}
                    maxLength={8}
                    className="input w-full p-2 border rounded-md dark:bg-slate-700 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1" htmlFor="expiry">
                      Expiry Date
                    </label>
                    <input
                      id="expiry"
                      name="expiry"
                      type="text"
                      placeholder="MM/YY"
                      value={form.expiry}
                      onChange={handleChange}
                      maxLength={5}
                      className="input w-full p-2 border rounded-md dark:bg-slate-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="label block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1" htmlFor="cvv">
                      CVV
                    </label>
                    <input
                      id="cvv"
                      name="cvv"
                      type="text"
                      placeholder="3 digits"
                      value={form.cvv}
                      onChange={handleChange}
                      maxLength={3}
                      className="input w-full p-2 border rounded-md dark:bg-slate-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2 px-4 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-md transition-colors"
            >
              {loading ? 'Booking...' : 'Confirm Booking'}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PatientCheckout;
