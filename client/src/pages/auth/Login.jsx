import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, UtensilsCrossed, Loader2, ArrowLeft } from 'lucide-react';
import { login, googleLogin } from '../../api/authApi';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import loginFoodImg from '../../assets/login_food.png';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const { data } = await login(form);
      setAuth(data.data.user, data.data.token);
      toast.success(`Welcome back, ${data.data.user.firstName}!`);
      const roles = { admin: '/admin', doctor: '/doctor', patient: '/patient' };
      navigate(roles[data.data.user.role] || '/patient');
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid email or password.';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      const { data } = await googleLogin({ token: credentialResponse.credential });
      setAuth(data.data.user, data.data.token);
      toast.success(`Welcome back, ${data.data.user.firstName}!`);
      navigate('/patient');
    } catch (err) {
      toast.error('Google login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || "placeholder_client_id"}>
      <div className="min-height-screen flex flex-col lg:flex-row relative bg-slate-950">

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
            <span className="badge-teal mb-4">AI-Powered Nutrition</span>
            <h2 className="text-5xl font-extrabold mb-4 leading-tight">Track your health & nutrition goals.</h2>
            <p className="text-slate-300 text-lg max-w-md">Personalized diet plans, real-time tracking, and AI-powered advice at your fingertips.</p>
          </div>

          <div className="text-sm text-slate-500">
            © 2026 NutriWell. All rights reserved.
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="relative z-20 w-full lg:w-1/2 flex items-center justify-center p-8 min-h-screen">
          <div className="relative w-full max-w-md animate-slide-up mx-4">
            {/* Back to Home */}
            <Link to="/" className="absolute -top-10 left-0 flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </Link>

            {/* Header for mobile (hidden on lg because we have branding on the left) */}
            <div className="text-center mb-6 lg:hidden">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl
                              bg-brand-gradient shadow-glow-teal mb-3">
                <UtensilsCrossed className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white">NutriWell</h1>
              <p className="text-slate-400 mt-1 text-sm">Sign in to your account</p>
            </div>

            <div className="hidden lg:block mb-8">
              <h1 className="text-3xl font-bold text-white">Sign In</h1>
              <p className="text-slate-400 mt-1 text-sm">Welcome back! Please enter your details.</p>
            </div>

            {/* Card */}
            <div className="card bg-white/[0.08] border-white/20 backdrop-blur-2xl p-8 shadow-2xl">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="label" htmlFor="email">Email address</label>
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
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="label mb-0" htmlFor="password">Password</label>
                    <Link to="/forgot-password"
                      className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
                      Forgot password?
                    </Link>
                  </div>
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

                {errorMsg && (
                  <div className="text-red-400 text-sm font-medium text-center bg-red-400/10 py-2 rounded-lg border border-red-400/20">
                    ⚠️ {errorMsg}
                  </div>
                )}

                <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
                    : 'Sign In'}
                </button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700/50"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-slate-900 px-2 text-slate-500">Or continue with</span>
                </div>
              </div>

              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={credentialResponse => {
                    handleGoogleLoginSuccess(credentialResponse);
                  }}
                  onError={() => {
                    toast.error('Google Login Failed');
                  }}
                  theme="filled_blue"
                  shape="pill"
                />
              </div>

              <p className="text-center text-sm text-slate-500 mt-6">
                Don't have an account?{' '}
                <Link to="/register" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
                  Create one
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
};

export default Login;
