import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, User, Activity, Mail, Phone, ExternalLink, Star, X } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getDoctorPatients } from '../../api/doctorApi';
import toast from 'react-hot-toast';

const PatientDetailsModal = ({ patient, onClose }) => {
  if (!patient) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 bg-white dark:bg-slate-900 border border-surface-border dark:border-white/10 shadow-2xl animate-scale-in">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-brand-gradient flex items-center justify-center text-white text-xl font-bold">
              {patient.firstName[0]}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {patient.firstName} {patient.lastName}
              </h2>
              <p className="text-sm text-slate-500">{patient.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Metrics */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
            <div className="text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Weight</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {patient.currentMetrics?.weight ? `${patient.currentMetrics.weight}kg` : '—'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Height</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {patient.currentMetrics?.height ? `${patient.currentMetrics.height}cm` : '—'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Target</p>
              <p className="text-lg font-bold text-brand-500 dark:text-brand-400">
                {patient.currentMetrics?.targetWeight ? `${patient.currentMetrics.targetWeight}kg` : '—'}
              </p>
            </div>
          </div>

          {/* Chart */}
          {patient.healthMetrics?.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mb-2">Weight Progression</p>
              <div className="h-[150px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={patient.healthMetrics.map(m => ({
                    date: m.recordedAt ? new Date(m.recordedAt).toLocaleDateString() : 'N/A',
                    weight: m.weight
                  }))}>
                    <defs>
                      <linearGradient id={`wt-modal-${patient._id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#64748b" opacity={0.2} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} domain={['dataMin - 1', 'dataMax + 1']} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
                    <Area type="monotone" dataKey="weight" stroke="#8b5cf6" strokeWidth={2.5}
                      fill={`url(#wt-modal-${patient._id})`} dot={{ fill: '#8b5cf6', r: 4 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Goals */}
          {patient.dietaryGoals && (
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mb-2">Dietary Goals</p>
              <div className="grid grid-cols-4 gap-2 text-sm">
                <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Calories</p>
                  <p className="font-bold text-slate-900 dark:text-white">{patient.dietaryGoals.dailyCalories} kcal</p>
                </div>
                <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Protein</p>
                  <p className="font-bold text-slate-900 dark:text-white">{patient.dietaryGoals.proteinGrams}g</p>
                </div>
                <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Carbs</p>
                  <p className="font-bold text-slate-900 dark:text-white">{patient.dietaryGoals.carbohydrateGrams}g</p>
                </div>
                <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Fat</p>
                  <p className="font-bold text-slate-900 dark:text-white">{patient.dietaryGoals.fatGrams}g</p>
                </div>
              </div>
            </div>
          )}

          {/* Focus Areas */}
          {patient.focusAreas && patient.focusAreas.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mb-2">Focus Areas</p>
              <div className="flex flex-wrap gap-1">
                {patient.focusAreas.map((area, i) => (
                  <span key={i} className="text-xs px-3 py-1 rounded-full bg-brand-500/10 text-brand-500 dark:text-brand-400 border border-brand-500/20">
                    {area}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Allergies & Conditions */}
          {(patient.allergies?.length > 0 || patient.medicalConditions?.length > 0) && (
            <div className="grid grid-cols-2 gap-4">
              {patient.allergies?.length > 0 && (
                <div>
                  <p className="text-xs text-red-500 uppercase font-semibold mb-2">Allergies</p>
                  <div className="flex flex-wrap gap-1">
                    {patient.allergies.map((al, i) => (
                      <span key={i} className="text-xs px-3 py-1 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
                        {al}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {patient.medicalConditions?.length > 0 && (
                <div>
                  <p className="text-xs text-amber-500 uppercase font-semibold mb-2">Medical Conditions</p>
                  <div className="flex flex-wrap gap-1">
                    {patient.medicalConditions.map((mc, i) => (
                      <span key={i} className="text-xs px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        {mc}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DoctorPatients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPatientForModal, setSelectedPatientForModal] = useState(null);

  useEffect(() => {
    getDoctorPatients()
      .then(({ data }) => setPatients(data.data.patients))
      .catch(() => toast.error('Failed to load patients'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = patients.filter(p => 
    p.firstName.toLowerCase().includes(search.toLowerCase()) || 
    p.lastName.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <User className="w-7 h-7 text-brand-400" /> My Patients
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage and view your assigned patients</p>
        </div>
      </div>

      <div className="card mb-6 p-4">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="input pl-10"
            placeholder="Search by name or email..."
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
          <p className="text-lg font-medium text-slate-900 dark:text-white">No patients found</p>
          <p className="text-sm text-slate-500 mt-2">You don't have any patients assigned to you yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(patient => (
            <div key={patient._id} className="card-hover flex flex-col p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-brand-gradient flex items-center justify-center text-white text-xl font-bold">
                  {patient.firstName[0]}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {patient.firstName} {patient.lastName}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                    <Activity className="w-3 h-3 text-brand-400" /> 
                    <span>Joined {new Date(patient.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-4 flex-1">
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center border border-slate-200 dark:border-white/10 shrink-0">
                    <Mail className="w-4 h-4 text-slate-400" />
                  </div>
                  <span className="truncate">{patient.email}</span>
                </div>
                {patient.phone && (
                  <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center border border-slate-200 dark:border-white/10 shrink-0">
                      <Phone className="w-4 h-4 text-slate-400" />
                    </div>
                    <span>{patient.phone}</span>
                  </div>
                )}
                
                {patient.review && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10">
                    <p className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Feedback</p>
                    <div className="flex items-center gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className={`w-3.5 h-3.5 ${patient.review.rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`} />
                      ))}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 italic">"{patient.review.feedback}"</p>
                  </div>
                )}

                <button 
                  onClick={() => setSelectedPatientForModal(patient)} 
                  className="btn-secondary text-xs w-full mt-4 mb-4"
                >
                  View Health Profile
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Link to={`/doctor/chat?with=${patient._id}`} className="btn-secondary text-xs">
                  Chat
                </Link>
                <Link to={`/doctor/plans/new?patientId=${patient._id}`} className="btn-primary text-xs gap-1">
                  Create Plan <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <PatientDetailsModal 
        patient={selectedPatientForModal} 
        onClose={() => setSelectedPatientForModal(null)} 
      />
    </DashboardLayout>
  );
};

export default DoctorPatients;
