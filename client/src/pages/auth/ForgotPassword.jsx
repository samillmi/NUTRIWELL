import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Loader2, ArrowLeft } from 'lucide-react';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('Reset code sent to your email!');
      navigate(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      {/* Background glow blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-slide-up">
        {/* Back to Login */}
        <Link to="/login" className="absolute -top-10 left-0 flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Login
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Forgot Password</h1>
          <p className="text-slate-400 mt-1 text-sm">Enter your email to receive a reset code</p>
        </div>

        {/* Card */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label" htmlFor="email">Email address</label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pr-11"
                />
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : 'Send Reset Code'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
