import { useEffect, useState } from 'react';
import {
  Users, ClipboardList, MessageSquare, Video,
  Search, AlertCircle, UserCheck, Link as LinkIcon, Shield,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/common/DashboardLayout';
import { getMyPatients, updateDoctorProfile } from '../../api/doctorApi';
import { getUnreadCount } from '../../api/chatApi';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import api from '../../api/axiosInstance';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip,
} from 'recharts';

const radarData = [
  { metric: 'Adherence', value: 82 },
  { metric: 'Calories',  value: 75 },
  { metric: 'Protein',   value: 90 },
  { metric: 'Hydration', value: 65 },
  { metric: 'Activity',  value: 70 },
  { metric: 'Sleep',     value: 55 },
];

const DoctorDashboard = () => {
  const { user }               = useAuthStore();
  const [patients, setPatients]= useState([]);
  const [bookings, setBookings] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activePlansCount, setActivePlansCount] = useState(0);
  const [search,   setSearch]  = useState('');
  const [loading,  setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await getMyPatients();
        setPatients(data.data.patients);
        setActivePlansCount(data.data.activePlansCount || 0);
        
        const { data: unreadData } = await getUnreadCount();
        setUnreadCount(unreadData.data.count);

        const { data: bookingData } = await api.get('/bookings/doctor');
        // Filter out plan_purchase bookings as they are not real consultations
        const filteredBookings = bookingData.data.bookings.filter(b => b.type !== 'plan_purchase');
        setBookings(filteredBookings);
      } catch {
        toast.error('Could not load dashboard data.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = patients.filter((p) =>
    `${p.firstName} ${p.lastName} ${p.email}`.toLowerCase().includes(search.toLowerCase())
  );

  const pendingConsultations = bookings.filter(b => {
    const bookingDate = new Date(b.date);
    const [hours, minutes] = b.time.split(':');
    bookingDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    return bookingDate >= new Date();
  }).length;

  const stats = [
    { label: 'My Patients',   value: patients.length, icon: Users,         color: 'text-brand-400',  bg: 'bg-brand-500/10'  },
    { label: 'Active Plans',  value: activePlansCount,             icon: ClipboardList, color: 'text-accent-400', bg: 'bg-accent-500/10' },
    { label: 'Consultations', value: pendingConsultations,        icon: Video,         color: 'text-emerald-400',bg: 'bg-emerald-500/10'},
    { label: 'Unread Msgs',   value: unreadCount,     icon: MessageSquare, color: 'text-amber-400',  bg: 'bg-amber-500/10'  },
  ];

  return (
    <DashboardLayout>
      {/* Verification Warning */}
      {user?.role === 'doctor' && !user?.doctorProfile?.isVerified && (
        <div className="mb-8 p-6 rounded-3xl bg-brand-gradient shadow-glow-brand animate-fade-up">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center shrink-0">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white mb-1 uppercase tracking-tight">Account Pending Approval</h2>
              <p className="text-white/80 text-sm font-medium max-w-2xl leading-relaxed">
                Welcome to NutriWell! Your professional profile is currently being reviewed by our medical board. 
                Once approved, you'll be able to manage patients, create diet plans, and publish blogs. 
                <strong> This usually takes 24-48 hours.</strong>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Welcome, <span className="text-gradient">Dr. {user?.firstName}</span> 👨‍⚕️
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage your patients & consultations</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Link to="/doctor/chat"  className={`btn-secondary gap-2 ${!user?.doctorProfile?.isVerified ? 'pointer-events-none opacity-50' : ''}`}>
            <MessageSquare className="w-4 h-4" /> Chat
          </Link>
          <Link to="/doctor/plans" className={`btn-primary gap-2 ${!user?.doctorProfile?.isVerified ? 'pointer-events-none opacity-50' : ''}`}>
            <ClipboardList className="w-4 h-4" /> New Diet Plan
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card-hover animate-slide-up">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-4`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="stat-value">{value}</p>
            <p className="stat-label">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Patient list */}
        <div className="card col-span-1 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">My Patients</h2>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                className="input pl-9 py-1.5 text-xs w-44"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => <div key={i} className="h-16 skeleton rounded-xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-3 text-center">
              <UserCheck className="w-12 h-12 text-slate-700" />
              <p className="text-sm text-slate-400">No patients assigned yet.</p>
              <p className="text-xs text-slate-600">Patients will appear here once admin assigns them to you.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-hide">
              {filtered.map((patient) => {
                const bmi = patient.currentMetrics?.bmi;
                return (
                  <div key={patient._id}
                       className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border
                                  border-surface-border hover:border-brand-500/30 transition-all">
                    <div className="w-9 h-9 rounded-full bg-brand-gradient flex items-center
                                    justify-center text-xs font-bold text-white shrink-0">
                      {patient.firstName[0]}{patient.lastName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {patient.firstName} {patient.lastName}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{patient.email}</p>
                      {patient.consultationDate && (
                        <p className="text-xs text-brand-400 mt-0.5">
                          📅 {new Date(patient.consultationDate).toLocaleString()}
                        </p>
                      )}
                    </div>
                    {bmi && (
                      <div className="text-center">
                        <p className="text-xs font-bold text-brand-400">BMI {bmi}</p>
                        <p className="text-[10px] text-slate-500">
                          {patient.currentMetrics?.weight}kg
                        </p>
                      </div>
                    )}
                    <div className="flex gap-1">
                      <Link
                        to={`/doctor/chat?with=${patient._id}&name=${encodeURIComponent(patient.firstName + ' ' + patient.lastName)}`}
                        className="btn-ghost p-1.5 rounded-lg" title="Chat"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </Link>
                      <Link to={`/doctor/video?with=${patient._id}`}
                            className="btn-ghost p-1.5 rounded-lg" title="Video">
                        <Video className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="space-y-5">
          {/* Compliance radar */}
          {/* Agenda / Upcoming Consultations */}
          <div className="card">
            <div className="flex justify-between items-center mb-1">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Agenda</h2>
              <Link to="/doctor/agenda" className="text-xs text-brand-400 hover:underline">Full View</Link>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Upcoming consultations</p>
            
            <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-hide">
              {[...bookings].sort((a, b) => {
                const dateA = new Date(a.date);
                const [hoursA, minutesA] = a.time.split(':');
                dateA.setHours(parseInt(hoursA, 10), parseInt(minutesA, 10), 0, 0);
                const dateB = new Date(b.date);
                const [hoursB, minutesB] = b.time.split(':');
                dateB.setHours(parseInt(hoursB, 10), parseInt(minutesB, 10), 0, 0);
                
                const now = new Date();
                const isPastA = dateA < now;
                const isPastB = dateB < now;
                
                // Future bookings first
                if (isPastA && !isPastB) return 1;
                if (!isPastA && isPastB) return -1;
                
                // If both are future, closest first
                if (!isPastA && !isPastB) return dateA - dateB;
                
                // If both are past, most recent first
                return dateB - dateA;
              }).map((booking) => {
                const bookingDate = new Date(booking.date);
                const [hours, minutes] = booking.time.split(':');
                bookingDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
                const isPast = bookingDate < new Date();

                return (
                  <div key={booking._id} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-surface-border flex justify-between items-center">
                    <div>
                      <p className="text-xs font-medium text-slate-900 dark:text-white">{booking.patient?.firstName} {booking.patient?.lastName}</p>
                      <p className="text-[10px] text-brand-400">
                        📅 {new Date(booking.date).toLocaleDateString()} at {booking.time}
                      </p>
                    </div>
                    <div className="flex gap-1 items-center">
                      {isPast && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-400/10 text-slate-500 dark:text-slate-400 border border-slate-400/20 font-semibold mr-1">
                          DONE
                        </span>
                      )}
                      <Link to={`/doctor/chat?with=${booking.patient?._id}`} className="btn-ghost p-1 rounded-lg" title="Chat">
                        <MessageSquare className="w-3 h-3" />
                      </Link>
                      <Link to={`/doctor/video?with=${booking.patient?._id}`} className="btn-ghost p-1 rounded-lg" title="Video">
                        <Video className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
              {bookings.length === 0 && (
                <div className="text-center py-6 text-slate-600">
                  <Video className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No upcoming consultations.</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick action */}
          <div className="card border-brand-500/20 bg-brand-500/5">
            <h3 className="text-xs font-semibold text-brand-600 dark:text-brand-300 mb-3 uppercase tracking-wide">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <Link to="/doctor/chat" className={`flex items-center gap-3 p-3 rounded-xl
                bg-white dark:bg-slate-800 border border-surface-border hover:border-brand-500/30
                transition-all group ${!user?.doctorProfile?.isVerified ? 'pointer-events-none opacity-50' : ''}`}>
                <MessageSquare className="w-4 h-4 text-brand-400" />
                <span className="text-xs text-slate-700 dark:text-slate-300">Open Chat Console</span>
              </Link>
              <Link to="/doctor/plans" className={`flex items-center gap-3 p-3 rounded-xl
                bg-white dark:bg-slate-800 border border-surface-border hover:border-brand-500/30
                transition-all group ${!user?.doctorProfile?.isVerified ? 'pointer-events-none opacity-50' : ''}`}>
                <ClipboardList className="w-4 h-4 text-accent-400" />
                <span className="text-xs text-slate-700 dark:text-slate-300">Create Diet Plan</span>
              </Link>


            </div>
          </div>

          {patients.length === 0 && !loading && (
            <div className="card border-amber-500/20 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-400">No patients yet</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Contact admin to assign patients to your account.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DoctorDashboard;
