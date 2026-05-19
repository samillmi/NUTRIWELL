import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, UtensilsCrossed, Loader2, UserPlus, ArrowLeft } from 'lucide-react';
import { register } from '../../api/authApi';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import loginFoodImg from '../../assets/login_food.png';

const Register = () => {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'patient' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await register(form);
      setAuth(data.data.user, data.data.token);
      toast.success(`Account created successfully! Welcome, ${data.data.user.firstName}!`);
      const roles = { admin: '/admin', doctor: '/doctor', patient: '/patient' };
      navigate(roles[data.data.user.role] || '/patient');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row relative bg-slate-950">

      {/* Background Image (Full Screen) */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-slate-900/60 to-slate-900/90 z-10" />
        <img
          src={loginFoodImg}
          alt="Healthy Food"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Left Side: Branding & Text */}
      <div className="relative z-20 hidden lg:flex lg:w-1/2 flex-col justify-between p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center shadow-glow-teal">
            <UtensilsCrossed className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold">NutriWell</span>
        </div>

        <div>
          <span className="badge-teal mb-4">Join Us Today</span>
          <h2 className="text-5xl font-extrabold mb-4 leading-tight">Start your health journey with AI.</h2>
          <p className="text-slate-300 text-lg max-w-md">Get personalized diet plans, track your progress, and connect with experts.</p>
        </div>

        <div className="text-sm text-slate-500">
          © 2026 NutriWell. All rights reserved.
        </div>
      </div>

      {/* Right Side: Register Form */}
      <div className="relative z-20 w-full lg:w-1/2 flex items-center justify-center p-8 min-h-screen">
        <div className="relative w-full max-w-md animate-slide-up mx-4">
          {/* Back to Home */}
          <Link to="/" className="absolute -top-10 left-0 flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>

          {/* Header for mobile */}
          <div className="text-center mb-6 lg:hidden">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl
                            bg-brand-gradient shadow-glow-teal mb-3">
              <UserPlus className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">Create Account</h1>
            <p className="text-slate-400 mt-1 text-sm">Join NutriWell today</p>
          </div>

          <div className="hidden lg:block mb-8">
            <h1 className="text-3xl font-bold text-white">Create Account</h1>
            <p className="text-slate-400 mt-1 text-sm">Welcome! Please enter your details.</p>
          </div>

          {/* Card */}
          <div className="card bg-white/[0.08] border-white/20 backdrop-blur-2xl p-8 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label text-slate-300" htmlFor="firstName">First Name</label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    placeholder="John"
                    value={form.firstName}
                    onChange={handleChange}
                    className="input bg-white/[0.05] border-white/10 backdrop-blur-md text-white placeholder-slate-400"
                  />
                </div>
                <div>
                  <label className="label text-slate-300" htmlFor="lastName">Last Name</label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    placeholder="Doe"
                    value={form.lastName}
                    onChange={handleChange}
                    className="input bg-white/[0.05] border-white/10 backdrop-blur-md text-white placeholder-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="label text-slate-300" htmlFor="email">Email address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  className="input bg-white/[0.05] border-white/10 backdrop-blur-md text-white placeholder-slate-400"
                />
              </div>

              <div>
                <label className="label text-slate-300" htmlFor="password">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPwd ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={form.password}
                    onChange={handleChange}
                    className="input bg-white/[0.05] border-white/10 backdrop-blur-md pr-11 text-white placeholder-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500
                               hover:text-slate-300 transition-colors"
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="label text-slate-300" htmlFor="role">I am a...</label>
                <select
                  id="role"
                  name="role"
                  className="input bg-white/[0.05] border-white/10 backdrop-blur-md text-white placeholder-slate-400"
                  value={form.role}
                  onChange={handleChange}
                >
                  <option value="patient" className="bg-slate-900">Patient</option>
                  <option value="doctor" className="bg-slate-900">Doctor</option>
                </select>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full mt-4">
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating Account...</>
                  : 'Sign Up'}
              </button>
            </form>

            <p className="text-center text-sm text-slate-400 mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
