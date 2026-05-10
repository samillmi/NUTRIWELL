import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/common/DashboardLayout';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';
import { Check, X, CreditCard, Sparkles, ScanLine, User } from 'lucide-react';

const AdminPayments = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    try {
      const { data } = await api.get('/bookings');
      setBookings(data.data.bookings);
    } catch (err) {
      toast.error('Failed to fetch payments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.patch(`/bookings/${id}`, { status });
      toast.success(`Payment ${status === 'confirmed' ? 'approved' : 'rejected'} successfully!`);
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed.');
    }
  };

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const historyBookings = bookings.filter(b => b.status !== 'pending');

  const getTypeIcon = (type) => {
    if (type === 'scanner') return <ScanLine className="w-4 h-4 text-brand-400" />;
    if (type === 'chatbot') return <Sparkles className="w-4 h-4 text-brand-400" />;
    return <CreditCard className="w-4 h-4 text-brand-400" />;
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
          <CreditCard className="w-7 h-7 text-brand-400" /> Payment & Approval Management
        </h1>

        {/* ── Pending Approvals ────────────────────────────────────────── */}
        <div className="card bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Pending Approvals ({pendingBookings.length})</h2>
          {loading ? (
            <p className="text-slate-500">Loading payments...</p>
          ) : pendingBookings.length === 0 ? (
            <p className="text-slate-500">No pending payments to approve.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Patient</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Details</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingBookings.map(b => (
                    <tr key={b._id} className="bg-white border-b dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-brand-500/10 flex items-center justify-center">
                          <User className="w-4 h-4 text-brand-400" />
                        </div>
                        {b.patient?.firstName} {b.patient?.lastName}
                      </td>
                      <td className="px-4 py-3 flex items-center gap-1 capitalize">
                        {getTypeIcon(b.type)} {b.type}
                      </td>
                      <td className="px-4 py-3">
                        {b.type === 'consultation' ? `Dr. ${b.doctor?.lastName} at ${b.time}` : b.reason}
                      </td>
                      <td className="px-4 py-3">
                        {new Date(b.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 flex gap-2">
                        <button
                          onClick={() => handleStatusUpdate(b._id, 'confirmed')}
                          className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors"
                          title="Approve"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(b._id, 'cancelled')}
                          className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                          title="Reject"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── History ────────────────────────────────────────────────── */}
        <div className="card bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Payment History</h2>
          {loading ? (
            <p className="text-slate-500">Loading history...</p>
          ) : historyBookings.length === 0 ? (
            <p className="text-slate-500">No payment history.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Patient</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {historyBookings.map(b => (
                    <tr key={b._id} className="bg-white border-b dark:bg-slate-800 dark:border-slate-700">
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-brand-500/10 flex items-center justify-center">
                          <User className="w-4 h-4 text-brand-400" />
                        </div>
                        {b.patient?.firstName} {b.patient?.lastName}
                      </td>
                      <td className="px-4 py-3 flex items-center gap-1 capitalize">
                        {getTypeIcon(b.type)} {b.type}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          b.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {new Date(b.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminPayments;
