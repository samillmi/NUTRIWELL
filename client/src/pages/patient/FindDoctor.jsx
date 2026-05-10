import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, Award, MapPin, Calendar } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { getPublicDoctors } from '../../api/doctorApi';
import toast from 'react-hot-toast';

const FindDoctor = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Find a Doctor</h1>
          <p className="text-slate-400 text-sm mt-1">Browse our verified nutritionists and dietitians</p>
        </div>
      </div>

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
                onClick={() => navigate(`/patient/checkout?type=consultation_booking&doctorId=${doc._id}&price=${doc.doctorProfile?.consultationFee || 29}`)}
                className="btn-primary w-full gap-2 mt-auto"
              >
                <Calendar className="w-4 h-4" /> Book Consultation
              </button>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default FindDoctor;
