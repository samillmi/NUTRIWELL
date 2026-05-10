import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, User, Activity, Mail, Phone, ExternalLink } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { getDoctorPatients } from '../../api/doctorApi';
import toast from 'react-hot-toast';

const DoctorPatients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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
                
                {/* Metrics & Goal */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/5">
                  <div className="text-center">
                    <p className="text-[10px] text-slate-500 uppercase font-semibold">Weight</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {patient.currentMetrics?.weight ? `${patient.currentMetrics.weight}kg` : '—'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-slate-500 uppercase font-semibold">Height</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {patient.currentMetrics?.height ? `${patient.currentMetrics.height}cm` : '—'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-slate-500 uppercase font-semibold">Target</p>
                    <p className="text-sm font-bold text-brand-400">
                      {patient.currentMetrics?.targetWeight ? `${patient.currentMetrics.targetWeight}kg` : '—'}
                    </p>
                  </div>
                </div>
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
    </DashboardLayout>
  );
};

export default DoctorPatients;
