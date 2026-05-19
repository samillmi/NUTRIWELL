import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon, ArrowRight, Camera, Users, Zap, Shield, Star, ChevronRight, Activity, Brain, Cpu, Check, Sparkles } from 'lucide-react';
import loginFoodImg from '../../assets/login_food.png';

/* ─── Floating Particle Component ─────────────────────── */
const Particle = ({ style }) => (
  <div className="absolute rounded-full opacity-20 animate-float" style={style} />
);

const LandingPage = () => {
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [count1, setCount1] = useState(0);
  const [count2, setCount2] = useState(0);
  const [count3, setCount3] = useState(0);
  const [doctorReviews, setDoctorReviews] = useState([]);
  const [plans, setPlans] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showAllDoctors, setShowAllDoctors] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';
        const response = await fetch(`${apiUrl}/doctors/public`);
        const data = await response.json();
        if (data.success) {
          let allReviews = [];
          data.data.doctors.forEach(doc => {
            if (doc.doctorProfile?.reviews) {
              doc.doctorProfile.reviews.forEach(rev => {
                if (rev.rating >= 4) {
                  allReviews.push({
                    name: rev.patient ? `${rev.patient.firstName} ${rev.patient.lastName}` : 'Anonymous Patient',
                    role: `Patient of Dr. ${doc.firstName}`,
                    stars: rev.rating,
                    text: rev.feedback,
                    avatar: rev.patient?.avatar || '',
                    createdAt: rev.createdAt
                  });
                }
              });
            }
          });
          // Sort by most recent
          allReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setDoctorReviews(allReviews);
          setDoctors(data.data.doctors);
        }
      } catch (err) {
        console.error('Failed to fetch reviews:', err);
      }
    };
    fetchReviews();

    const fetchPlans = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';
        const response = await fetch(`${apiUrl}/plans`);
        const data = await response.json();
        if (data.success) {
          setPlans(data.data.plans);
        }
      } catch (err) {
        console.error('Failed to fetch plans:', err);
      }
    };
    fetchPlans();
  }, []);

  useEffect(() => {
    document.title = "NutriWell — AI-Powered Nutrition Platform";
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const targets = [{ set: setCount1, target: 50 }, { set: setCount2, target: 98 }, { set: setCount3, target: 200 }];
    targets.forEach(({ set, target }) => {
      let n = 0;
      const step = Math.ceil(target / 60);
      const id = setInterval(() => { n = Math.min(n + step, target); set(n); if (n >= target) clearInterval(id); }, 30);
    });
  }, []);

  const particles = Array.from({ length: 12 }, (_, i) => ({
    width: `${8 + (i * 7) % 20}px`, height: `${8 + (i * 7) % 20}px`,
    top: `${(i * 17) % 90}%`, left: `${(i * 13) % 95}%`,
    background: i % 3 === 0 ? '#10b981' : i % 3 === 1 ? '#14b8a6' : '#6366f1',
    animationDelay: `${(i * 0.4).toFixed(1)}s`, animationDuration: `${4 + (i % 4)}s`
  }));

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-sans overflow-x-hidden relative">

      {/* ── Global Styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        body { font-family: 'Inter', sans-serif; }
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
        }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes spin-reverse { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes fade-up { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(16,185,129,0.3); }
          50% { box-shadow: 0 0 60px rgba(16,185,129,0.7), 0 0 100px rgba(16,185,129,0.3); }
        }
        .animate-float { animation: float linear infinite; }
        .animate-spin-slow { animation: spin-slow 20s linear infinite; }
        .animate-spin-reverse { animation: spin-reverse 15s linear infinite; }
        .animate-fade-up { animation: fade-up 0.8s ease forwards; }
        .animate-glow-pulse { animation: glow-pulse 3s ease-in-out infinite; }
        .text-shimmer {
          background: linear-gradient(90deg, #10b981, #14b8a6, #6366f1, #10b981);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 3s linear infinite;
        }
        .glass { background: rgba(255,255,255,0.7); backdrop-filter: blur(20px); border: 1px solid rgba(0,0,0,0.1); }
        .dark .glass { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); }
        .dark-glass { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); backdrop-filter: blur(20px); }
        .card-3d { transition: transform 0.4s ease, box-shadow 0.4s ease; }
        .card-3d:hover { transform: translateY(-12px) rotateX(4deg); box-shadow: 0 40px 80px rgba(0,0,0,0.4), 0 0 40px rgba(16,185,129,0.15); }
        .btn-glow { transition: all 0.3s ease; }
        .btn-glow:hover { box-shadow: 0 0 30px rgba(16,185,129,0.5), 0 0 60px rgba(16,185,129,0.2); transform: translateY(-2px); }
        .grid-bg {
          background-image: linear-gradient(rgba(16,185,129,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.05) 1px, transparent 1px);
          background-size: 40px 40px;
        }
      `}</style>

      {/* ── Background ── */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-tr from-white via-white/70 to-white/90 dark:from-slate-950 dark:via-slate-950/70 dark:to-slate-950/90 z-10" />
        <img
          src={loginFoodImg}
          alt="Healthy Food"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="fixed inset-0 grid-bg -z-10 opacity-20"></div>
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px] -z-10"></div>
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px] -z-10"></div>
      {particles.map((p, i) => <Particle key={i} style={p} />)}

      {/* ── NAV ── */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'glass border-b border-white/5 py-3' : 'py-5'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 bg-emerald-500 rounded-xl animate-glow-pulse"></div>
              <div className="relative w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-xl flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Nutri<span className="text-shimmer">Well</span></span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {['Features', 'Plans', 'Doctors', 'Technology', 'Feedback'].map(n => (
              <a key={n} href={`#${n === 'Doctors' ? 'experts' : n.toLowerCase()}`} className="text-sm text-slate-700 dark:text-slate-400 hover:text-emerald-500 transition-colors font-bold uppercase tracking-wider">{n}</a>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} id="theme-toggle" className="p-2 rounded-xl text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all">
              {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>
            <Link to="/login" className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors uppercase tracking-widest">Log In</Link>
            <Link to="/register" className="bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold py-2.5 px-5 rounded-xl btn-glow">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-28">

        {/* ── HERO ── */}
        <section className="max-w-7xl mx-auto px-6 pt-10 pb-24 grid lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div className="flex flex-col gap-7 animate-fade-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-emerald-400 text-sm font-semibold w-fit">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              AI-Powered · Real-Time · Clinical Grade
            </div>

            <h1 className="text-6xl md:text-7xl font-black tracking-tight leading-[1.05] text-slate-900 dark:text-white">
              The <span className="text-shimmer">Smartest</span><br />
              Way to Eat.<br />
              <span className="text-slate-500 dark:text-slate-400 font-light text-5xl">Powered by AI.</span>
            </h1>

            <p className="text-slate-700 dark:text-slate-400 text-lg leading-relaxed max-w-lg font-medium">
              Scan any meal. Get instant 3D nutrition analysis. Connect with expert dietitians. 
              Transform your health with the most advanced platform ever built.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mt-2">
              <Link to="/register" className="bg-brand-gradient text-white font-black text-lg py-4 px-8 rounded-2xl shadow-glow-brand hover:scale-[1.02] transition-transform inline-flex items-center justify-center gap-2">
                Start Free Today <ArrowRight className="w-5 h-5" />
              </Link>
              <a href="#features" className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-300 font-black text-lg py-4 px-8 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/8 transition-all inline-flex items-center justify-center gap-2">
                Watch Demo <ChevronRight className="w-5 h-5" />
              </a>
            </div>

            {/* Stats Row */}
            <div className="flex gap-8 mt-4 pt-6 border-t border-slate-200 dark:border-white/5">
              <div>
                <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{count1}K+</div>
                <div className="text-slate-600 dark:text-slate-500 text-xs font-black uppercase tracking-tighter mt-1">Active Users</div>
              </div>
              <div>
                <div className="text-3xl font-black text-teal-600 dark:text-teal-400">{count2}%</div>
                <div className="text-slate-600 dark:text-slate-500 text-xs font-black uppercase tracking-tighter mt-1">Accuracy Rate</div>
              </div>
              <div>
                <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{count3}+</div>
                <div className="text-slate-600 dark:text-slate-500 text-xs font-black uppercase tracking-tighter mt-1">Expert Doctors</div>
              </div>
            </div>
          </div>

          {/* Right — 3D Visual */}
          <div className="relative flex items-center justify-center">
            {/* Orbit Rings */}
            <div className="absolute w-[480px] h-[480px] rounded-full border border-emerald-500/10 animate-spin-slow"></div>
            <div className="absolute w-[380px] h-[380px] rounded-full border border-teal-500/15 animate-spin-reverse"></div>
            <div className="absolute w-[280px] h-[280px] rounded-full border border-indigo-500/10 animate-spin-slow" style={{ animationDuration: '12s' }}></div>

            {/* Orbit Dots */}
            {[0,1,2,3].map(i => (
              <div key={i} className="absolute w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.8)]"
                style={{ top: `${50 - 47 * Math.cos((i * Math.PI)/2)}%`, left: `${50 + 47 * Math.sin((i * Math.PI)/2)}%` }}>
              </div>
            ))}

            {/* Main Image */}
            <div className="relative w-80 h-80 rounded-full overflow-hidden animate-glow-pulse shadow-[0_0_80px_rgba(16,185,129,0.3)]">
              <img src="/hero_bowl.png" alt="AI Food Analysis" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050d18]/60 via-transparent to-transparent"></div>
            </div>

            {/* Floating Cards */}
            <div className="absolute top-6 -right-6 bg-white/90 dark:bg-white/10 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex items-center gap-3 animate-float shadow-xl" style={{ animationDuration: '5s' }}>
              <div className="w-10 h-10 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Scan Result</div>
                <div className="text-sm font-black text-slate-900 dark:text-white">486 kcal detected</div>
              </div>
            </div>

            <div className="absolute bottom-8 -left-6 bg-white/90 dark:bg-white/10 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex items-center gap-3 animate-float shadow-xl" style={{ animationDuration: '4s', animationDelay: '1s' }}>
              <div className="w-10 h-10 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-xl flex items-center justify-center">
                <Brain className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">AI Model</div>
                <div className="text-sm font-black text-slate-900 dark:text-white">YOLOv8 · <span className="text-emerald-600 dark:text-emerald-400">Active</span></div>
              </div>
            </div>

            <div className="absolute top-1/2 -right-16 bg-white/90 dark:bg-white/10 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl p-3 flex items-center gap-2 animate-float shadow-lg" style={{ animationDuration: '6s', animationDelay: '2s' }}>
              <Shield className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-teal-600 dark:text-teal-300">Clinical Grade</span>
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section id="features" className="py-28 relative">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20">
              <div className="inline-block px-4 py-1.5 rounded-full glass text-emerald-400 text-sm font-semibold mb-6">
                Core Features
              </div>
              <h2 className="text-5xl md:text-6xl font-black mb-6 text-slate-900 dark:text-white">
                Everything You Need.<br /><span className="text-shimmer">Nothing You Don't.</span>
              </h2>
              <p className="text-slate-700 dark:text-slate-400 text-xl max-w-2xl mx-auto font-medium">
                One platform. All the tools. Complete control over your nutrition journey.
              </p>
            </div>

            {/* Feature Cards */}
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: <Users className="w-7 h-7" />, color: 'teal',
                  title: 'Expert Consultations', badge: null,
                  desc: 'Real-time video sessions with certified clinical nutritionists. Book, meet, and get personalized plans — all within the platform.',
                  stats: '200+ Doctors'
                },
                {
                  icon: <Cpu className="w-7 h-7" />, color: 'indigo',
                  title: 'Neural Meal Planning', badge: 'Alpha',
                  desc: 'Our AI generates weekly meal plans tailored to your biometrics, goals, allergies, and medical conditions. Adapts every day.',
                  stats: '10K+ Recipes'
                },
                {
                  icon: <Camera className="w-7 h-7" />, color: 'emerald',
                  title: '3D AI Food Scanner', badge: 'New',
                  desc: 'Point your camera at any meal. Our YOLOv8 model detects, measures, and calculates every nutrient in seconds with incredible accuracy.',
                  stats: '99.2% Accuracy'
                },
              ].map((f, i) => (
                <div key={i} className={`card-hover relative p-8 transition-all duration-500 overflow-hidden group cursor-pointer 
                  bg-white/80 dark:bg-white/5 border-slate-200 dark:border-white/10`} style={{ animationDelay: `${i * 0.15}s` }}>
                  <div className={`absolute inset-0 bg-gradient-to-br from-${f.color}-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                  {f.badge && (
                    <div className={`absolute top-4 right-4 bg-${f.color}-500 text-white text-[10px] font-black py-1 px-3 rounded-full uppercase tracking-widest`}>{f.badge}</div>
                  )}
                  <div className={`w-14 h-14 bg-${f.color}-500/10 border border-${f.color}-500/20 rounded-2xl flex items-center justify-center text-${f.color}-500 mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                    {f.icon}
                  </div>
                  <h3 className="text-xl font-black mb-3 text-slate-900 dark:text-white group-hover:text-brand-500 transition-colors">{f.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6">{f.desc}</p>
                  <div className={`text-${f.color}-500 text-xs font-black flex items-center gap-2 uppercase tracking-tighter`}>
                    <span className={`w-2 h-2 rounded-full bg-${f.color}-500`}></span>
                    {f.stats}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TECHNOLOGY SHOWCASE ── */}
        <section id="technology" className="py-28 bg-slate-50/50 dark:bg-transparent">
          <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <div className="inline-block px-4 py-1.5 rounded-full glass border-slate-200 dark:border-white/10 text-teal-500 dark:text-teal-400 text-sm font-bold mb-6">
                AI Technology
              </div>
              <h2 className="text-5xl font-black mb-6 leading-tight text-slate-900 dark:text-white">
                Scan. Detect.<br /><span className="text-shimmer">Know Instantly.</span>
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-lg mb-8 leading-relaxed">
                Our AI pipeline combines YOLOv8 object detection with Nutritionix's database 
                to give you calorie and macro data for any meal — in under 2 seconds.
              </p>
              <div className="space-y-4">
                {[
                  { label: 'Detection Speed', value: '< 2s', pct: 95 },
                  { label: 'Nutritional Accuracy', value: '99.2%', pct: 99 },
                  { label: 'Food Categories Supported', value: '500+', pct: 80 },
                ].map((s, i) => (
                  <div key={i} className="bg-white/80 dark:bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-slate-200 dark:border-white/5 shadow-sm">
                    <div className="flex justify-between mb-3">
                      <span className="text-sm text-slate-700 dark:text-slate-300 font-bold">{s.label}</span>
                      <span className="text-sm font-black text-emerald-500">{s.value}</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-gradient rounded-full transition-all duration-1000 shadow-glow-teal" style={{ width: `${s.pct}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right image */}
            <div className="relative flex justify-center">
              <div className="absolute inset-0 bg-teal-500/10 blur-3xl rounded-full -z-10"></div>
              <div className="w-full max-w-sm rounded-3xl overflow-hidden glass border border-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.5)] hover:scale-105 transition-transform duration-500">
                <img src="/ai_scan.png" alt="AI food scanning technology" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </section>
        {/* ── EXPERT DOCTORS ── */}
        <section id="experts" className="py-32 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20">
              <h2 className="text-5xl font-black mb-6 text-slate-900 dark:text-white">World-Class <span className="text-shimmer">Medical Experts</span></h2>
              <p className="text-slate-500 dark:text-slate-400 text-xl">Consult with certified dietitians and nutritionists specialized in your needs.</p>
            </div>
            
            <div className="grid md:grid-cols-4 gap-8">
              {doctors.length > 0 ? (
                (showAllDoctors ? doctors : doctors.slice(0, 4)).map((doc) => (
                  <div key={doc._id} className="group relative animate-fade-up">
                    <div className="bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-6 card-hover transition-all duration-500 h-full flex flex-col items-center text-center">
                      <div className="relative mb-6">
                        <div className="w-32 h-32 rounded-[2rem] overflow-hidden border-2 border-brand-500/30 p-1 group-hover:border-brand-500 transition-colors duration-500">
                          {doc.avatar ? (
                            <img src={doc.avatar} alt={doc.firstName} className="w-full h-full object-cover rounded-[1.7rem]" />
                          ) : (
                            <div className="w-full h-full bg-brand-gradient flex items-center justify-center text-white text-2xl font-black">
                              {doc.firstName[0]}{doc.lastName[0]}
                            </div>
                          )}
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-xl shadow-glow-teal border-2 border-white dark:border-slate-900">
                          <Shield className="w-4 h-4" />
                        </div>
                      </div>

                      <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1">Dr. {doc.firstName} {doc.lastName}</h3>
                      <p className="text-brand-600 dark:text-brand-400 font-bold text-xs uppercase tracking-widest mb-4">
                        {doc.doctorProfile?.specialization || 'Clinical Nutritionist'}
                      </p>
                      
                      <div className="flex items-center gap-1.5 mb-6 bg-slate-100 dark:bg-white/5 px-3 py-1 rounded-full border border-slate-200 dark:border-white/10">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-sm font-black text-slate-900 dark:text-white">{doc.doctorProfile?.rating || '5.0'}</span>
                        <span className="text-xs text-slate-500">({doc.doctorProfile?.totalReviews || 0})</span>
                      </div>

                      <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-3 mb-8 font-medium">
                        {doc.doctorProfile?.bio || 'Expert in personalized nutrition planning and therapeutic diets for clinical conditions.'}
                      </p>

                    </div>
                  </div>
                ))
              ) : (
                [1,2,3,4].map((i) => (
                  <div key={i} className="bg-white/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-6 animate-pulse">
                    <div className="w-32 h-32 rounded-[2rem] bg-slate-200 dark:bg-white/5 mb-6 mx-auto" />
                    <div className="h-4 w-32 bg-slate-200 dark:bg-white/5 mx-auto mb-2 rounded" />
                    <div className="h-3 w-24 bg-slate-200 dark:bg-white/5 mx-auto mb-4 rounded" />
                    <div className="h-20 w-full bg-slate-200 dark:bg-white/5 rounded-xl" />
                  </div>
                ))
              )}
            </div>

            {doctors.length > 4 && (
              <div className="mt-16 text-center">
                <button
                  onClick={() => setShowAllDoctors(!showAllDoctors)}
                  className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-300 font-black text-sm py-4 px-10 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/8 transition-all inline-flex items-center justify-center gap-3 group"
                >
                  {showAllDoctors ? (
                    <>Show Less <ChevronRight className="w-5 h-5 -rotate-90 group-hover:-translate-y-1 transition-transform" /></>
                  ) : (
                    <>View All Experts <ChevronRight className="w-5 h-5 rotate-90 group-hover:translate-y-1 transition-transform" /></>
                  )}
                </button>
              </div>
            )}
          </div>
        </section>
        {/* ── PRICING PLANS ── */}
        <section id="plans" className="py-32 relative">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20">
              <h2 className="text-5xl font-black mb-6 text-slate-900 dark:text-white">Choose Your <span className="text-shimmer">Plan</span></h2>
              <p className="text-slate-500 dark:text-slate-400 text-xl">Select the best plan for your health journey.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-10">
              {plans.map((p) => (
                <div key={p._id} 
                     className={`card-hover relative flex flex-col p-10 transition-all duration-500 overflow-visible
                       ${p.popular ? 'border-2 border-brand-500 ring-8 ring-brand-500/5 scale-105 z-10 bg-white/10 dark:bg-slate-800/20' : 'border border-slate-200 dark:border-white/5 bg-white/5 dark:bg-white/5'}`}>
                  
                  {p.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap">
                      <span className="bg-brand-gradient text-white text-[10px] font-black px-6 py-2 rounded-full shadow-glow-teal flex items-center gap-2 tracking-[0.2em] uppercase">
                        <Sparkles className="w-3.5 h-3.5 shrink-0" /> Most Popular
                      </span>
                    </div>
                  )}

                  <div className="mb-10">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3">{p.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-black text-slate-900 dark:text-white">${p.price}</span>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">/mo</span>
                    </div>
                  </div>
                  
                  <div className="space-y-5 mb-12 flex-1">
                    {p.features.map((f, i) => (
                      <div key={i} className="flex items-start gap-4 group/feat">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5 group-hover/feat:bg-emerald-500/20 transition-colors">
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        </div>
                        <span className="text-base font-medium text-slate-600 dark:text-slate-300 leading-tight">
                          {f}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Link to="/register" 
                    className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-300 text-center
                      ${p.popular 
                        ? 'bg-brand-500 text-white shadow-glow-brand hover:scale-[1.02] hover:bg-brand-600' 
                        : 'bg-white dark:bg-white/10 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/20'}`}>
                    Get Started
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ── */}
        <section id="feedback" className="py-28 relative">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-5xl font-black mb-4 text-slate-900 dark:text-white">Loved by <span className="text-shimmer">Thousands</span></h2>
              <p className="text-slate-500 dark:text-slate-400 text-xl">Real people. Real results. Real transformation.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {doctorReviews.length > 0 ? (
                (showAllReviews ? doctorReviews : doctorReviews.slice(0, 3)).map((t, i) => (
                  <div key={i} className="bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-8 card-hover transition-all duration-300 h-full flex flex-col">
                    <div className="flex gap-1 mb-4">
                      {[...Array(t.stars)].map((_, j) => <Star key={j} className="w-4 h-4 fill-emerald-500 text-emerald-500" />)}
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-6 italic flex-grow">"{t.text}"</p>
                    <div className="flex items-center gap-3">
                      {t.avatar ? (
                        <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-white/10" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center text-white text-xs font-black shadow-glow-teal">
                          {t.name.split(' ').map(n => n[0]).join('')}
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-black text-slate-900 dark:text-white">{t.name}</div>
                        <div className="text-xs text-brand-600 dark:text-brand-400 font-bold">{t.role}</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                [
                  { name: 'Sarah Jenkins', role: 'Lost 15 lbs in 3 months', stars: 5, text: 'NutriWell completely changed my relationship with food. The AI scanner is mind-blowing — it knows exactly what I\'m eating before I even think about it.' },
                  { name: 'Marcus Thorne', role: 'Fitness Enthusiast', stars: 5, text: 'I snapped a photo of my lunch and instantly got protein, carbs, fats — everything. No more guessing. This is the future of nutrition tracking.' },
                  { name: 'Elena Rodriguez', role: 'Managing PCOS', stars: 5, text: 'The professional consultations gave me exactly what I needed. My doctor-assigned meal plan has been life-changing. Highly, highly recommend.' },
                ].map((t, i) => (
                  <div key={i} className="bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-8 card-hover transition-all duration-300 h-full flex flex-col">
                    <div className="flex gap-1 mb-4">
                      {[...Array(t.stars)].map((_, j) => <Star key={j} className="w-4 h-4 fill-emerald-500 text-emerald-500" />)}
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-6 italic flex-grow">"{t.text}"</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center text-white text-xs font-black shadow-glow-teal">
                        {t.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="text-sm font-black text-slate-900 dark:text-white">{t.name}</div>
                        <div className="text-xs text-brand-600 dark:text-brand-400 font-bold">{t.role}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {doctorReviews.length > 3 && (
              <div className="flex justify-center mt-12">
                <button 
                  onClick={() => setShowAllReviews(!showAllReviews)}
                  className="px-10 py-4 bg-white/50 dark:bg-white/10 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all duration-300 shadow-xl"
                >
                  {showAllReviews ? 'Show Less' : `View All ${doctorReviews.length} Reviews`}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ── CTA FINAL ── */}
        <section className="max-w-7xl mx-auto px-6 pb-28">
          <div className="relative rounded-[2rem] overflow-hidden p-1 bg-gradient-to-br from-emerald-500/30 via-teal-500/20 to-indigo-500/30">
            <div className="bg-[#080f1e] rounded-[1.75rem] p-12 md:p-20 text-center relative overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl"></div>
              <div className="relative z-10 max-w-2xl mx-auto">
                <div className="text-6xl mb-6">🚀</div>
                <h2 className="text-4xl md:text-6xl font-black mb-6 text-white">
                  Ready to <span className="text-shimmer">Transform</span><br />Your Health?
                </h2>
                <p className="text-slate-400 text-xl mb-10 leading-relaxed">
                  Join 50,000+ users who've already started their journey. 
                  Free to start. No credit card required.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to="/register" className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-xl py-5 px-10 rounded-2xl btn-glow inline-flex items-center justify-center gap-2">
                    Get Started Free <ArrowRight className="w-6 h-6" />
                  </Link>
                  <Link to="/login" className="dark-glass text-white font-semibold text-xl py-5 px-10 rounded-2xl hover:bg-white/8 transition-all inline-flex items-center justify-center">
                    Sign In
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm">NutriWell</span>
          </div>
          <p className="text-slate-500 text-sm">© {new Date().getFullYear()} NutriWell. All rights reserved.</p>
          <div className="flex gap-6 text-slate-500 text-sm">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
