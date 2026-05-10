import { Link } from 'react-router-dom';
import { ArrowRight, Bot, ScanLine, UtensilsCrossed, Video, Activity, HeartPulse } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

const LandingPage = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-surface-border bg-surface-card/80 dark:bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-gradient flex items-center justify-center shadow-glow-teal">
              <UtensilsCrossed className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-white">NutriTrack</span>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme} 
              className="p-2 rounded-xl text-slate-500 hover:bg-surface-muted dark:hover:bg-slate-800 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-500" />}
            </button>
            <Link to="/login" className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
              Log in
            </Link>
            <Link to="/register" className="btn-primary py-2 px-4 rounded-full">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center text-center px-4 pt-20 pb-16">
        
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/20 text-brand-600 dark:text-brand-400 text-sm font-medium mb-8 animate-fade-in">
          <span className="flex h-2 w-2 rounded-full bg-brand-500"></span>
          Now with Real-time WebRTC Consultations
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 dark:text-white tracking-tight max-w-4xl animate-slide-up">
          Your Personalized <br className="hidden md:block"/>
          <span className="text-gradient">AI Dietitian</span> & Tracker
        </h1>
        
        <p className="mt-6 text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl animate-slide-up" style={{ animationDelay: '100ms' }}>
          Connect with professional doctors, scan your meals using AI, and track your calories with precision. A complete health platform for doctors and patients.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <Link to="/register" className="btn-primary text-lg px-8 py-4 rounded-full shadow-glow-teal hover:-translate-y-1 transition-transform">
            Join for Free <ArrowRight className="w-5 h-5" />
          </Link>
          <Link to="/login" className="btn-secondary text-lg px-8 py-4 rounded-full dark:hover:bg-white/10 hover:-translate-y-1 transition-transform">
            Doctor Login
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full px-4 animate-slide-up" style={{ animationDelay: '300ms' }}>
          <div className="card text-left p-8 hover:-translate-y-2 transition-transform">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mb-6">
              <Bot className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">AI Food Scanning</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Simply upload a picture of your meal and our AI will instantly estimate the calories and macros.</p>
          </div>

          <div className="card text-left p-8 hover:-translate-y-2 transition-transform">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center mb-6">
              <Video className="w-6 h-6 text-brand-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Live Consultations</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Secure, real-time WebRTC video calls between doctors and patients directly inside the platform.</p>
          </div>

          <div className="card text-left p-8 hover:-translate-y-2 transition-transform">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center mb-6">
              <HeartPulse className="w-6 h-6 text-purple-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Custom Diet Plans</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Doctors can use our advanced builder to create detailed weekly meal plans assigned to specific patients.</p>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-surface-border bg-surface dark:bg-slate-900 py-8 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-500">© 2026 NutriTrack. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
