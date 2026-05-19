import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MessageSquare, Video } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import api from '../../api/axiosInstance';
import { Link } from 'react-router-dom';

const DoctorAgenda = () => {
  const { user } = useAuthStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());

  useEffect(() => {
    const fetchSlots = async () => {
      try {
        const { data } = await api.get('/bookings/doctor');
        // Filter out plan_purchase bookings as they are not real consultations
        const filteredBookings = data.data.bookings.filter(b => b.type !== 'plan_purchase');
        setBookedSlots(filteredBookings);
      } catch (err) {
        toast.error('Failed to load agenda.');
      } finally {
        setLoading(false);
      }
    };
    if (user?._id) fetchSlots();
  }, [user?._id]);

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days = [];
  // Padding for first week
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const getSlotsForDay = (day) => {
    if (!day) return [];
    return bookedSlots.filter(slot => {
      const d = new Date(slot.date);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarIcon className="w-7 h-7 text-brand-400" /> My Agenda
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage your schedule</p>
        </div>
        <div className="flex items-center gap-3 justify-between sm:justify-start w-full sm:w-auto">
          <button onClick={prevMonth} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white min-w-[150px] text-center">
            {monthNames[month]} {year}
          </h2>
          <button onClick={nextMonth} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-96 skeleton rounded-2xl" />
      ) : (
        <div className="card p-4 md:p-6 bg-white dark:bg-slate-800/50">
          <div className="grid grid-cols-7 gap-1 md:gap-2 mb-4 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {days.map((day, idx) => {
              const slots = getSlotsForDay(day);
              
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const cellDate = day ? new Date(year, month, day) : null;
              const isPast = cellDate && cellDate < today;
              
              const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();

              return (
                <div
                  key={idx}
                  onClick={() => day && setSelectedDay(day)}
                  className={`min-h-[50px] md:min-h-[100px] p-1 md:p-2 rounded-xl border transition-all cursor-pointer ${
                    day 
                      ? selectedDay === day
                        ? 'border-brand-500 bg-brand-500/10'
                        : isToday 
                          ? 'border-brand-500/50 bg-brand-500/5' 
                          : isPast
                            ? 'border-surface-border bg-slate-200/50 dark:bg-slate-800/30 opacity-50'
                            : 'border-surface-border bg-slate-50 dark:bg-slate-900/50 hover:border-brand-500/30'
                      : 'border-transparent bg-transparent opacity-20'
                  }`}
                >
                  {day && (
                    <>
                      <div className={`text-xs md:text-sm font-bold mb-1 md:mb-2 ${isToday ? 'text-brand-400' : 'text-slate-700 dark:text-white'}`}>
                        {day}
                      </div>
                      
                      {/* Desktop slots list */}
                      <div className="hidden md:block space-y-1 max-h-[70px] overflow-y-auto scrollbar-hide">
                        {slots.map((slot, sIdx) => {
                          const timeStr = slot.time;
                          return (
                            <div key={sIdx} className="text-[10px] p-1 rounded bg-brand-500/20 text-brand-700 dark:text-brand-300 truncate flex flex-col gap-0.5">
                              <span className="font-bold flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5" /> {timeStr}
                              </span>
                              <span className="truncate">{slot.patient?.firstName} {slot.patient?.lastName}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Mobile dot */}
                      {slots.length > 0 && (
                        <div className="md:hidden w-1.5 h-1.5 bg-brand-400 rounded-full mx-auto mt-1" />
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Mobile list for selected day */}
          <div className="mt-4 md:hidden border-t border-surface-border dark:border-white/10 pt-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              Bookings for {monthNames[month]} {selectedDay}
            </h3>
            <div className="space-y-2">
              {getSlotsForDay(selectedDay).length === 0 ? (
                <p className="text-xs text-slate-500">No bookings for this day.</p>
              ) : (
                getSlotsForDay(selectedDay).map((slot, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-surface-border">
                    <div>
                      <p className="text-xs font-medium text-slate-900 dark:text-white">
                        {slot.patient?.firstName} {slot.patient?.lastName}
                      </p>
                      <p className="text-[10px] text-brand-400 flex items-center gap-0.5 mt-0.5">
                        <Clock className="w-3 h-3" /> {slot.time}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Link to={`/doctor/chat?with=${slot.patient?._id}`} className="btn-ghost p-1.5 rounded-lg" title="Chat">
                        <MessageSquare className="w-4 h-4" />
                      </Link>
                      <Link to={`/doctor/video?with=${slot.patient?._id}`} className="btn-ghost p-1.5 rounded-lg" title="Video">
                        <Video className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default DoctorAgenda;
