import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Suspense, lazy, useEffect } from 'react';

import ProtectedRoute from './components/common/ProtectedRoute';
import { SocketProvider } from './context/SocketContext';
import { WebRTCProvider } from './context/WebRTCContext';
import { ThemeProvider } from './context/ThemeContext';
import useAuthStore from './store/authStore';
import IncomingCallModal from './components/chat/IncomingCallModal';

/* ── Lazy-loaded pages ──────────────────────────────────────────────── */
const LandingPage     = lazy(() => import('./pages/public/LandingPage'));
const Login           = lazy(() => import('./pages/auth/Login'));
const Register        = lazy(() => import('./pages/auth/Register'));

// Admin
const AdminDashboard  = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminSettings   = lazy(() => import('./pages/admin/AdminSettings'));
const AdminUsers      = lazy(() => import('./pages/admin/AdminUsers'));
const AdminFinance    = lazy(() => import('./pages/admin/AdminFinance'));

// Doctor
const DoctorDashboard = lazy(() => import('./pages/doctor/DoctorDashboard'));
const DoctorPatients  = lazy(() => import('./pages/doctor/DoctorPatients'));
const DoctorPlans     = lazy(() => import('./pages/doctor/DoctorPlans'));
const DietPlanBuilder = lazy(() => import('./pages/doctor/DietPlanBuilder'));
const DoctorAgenda    = lazy(() => import('./pages/doctor/DoctorAgenda'));

// Patient
const PatientDashboard= lazy(() => import('./pages/patient/PatientDashboard'));
const FoodScanner     = lazy(() => import('./pages/patient/FoodScanner'));
const AIChatbot       = lazy(() => import('./pages/patient/AIChatbot'));
const PatientPlans    = lazy(() => import('./pages/patient/PatientPlans'));
const PatientCheckout = lazy(() => import('./pages/patient/PatientCheckout'));
const FindDoctor      = lazy(() => import('./pages/patient/FindDoctor'));
const PublicPlans     = lazy(() => import('./pages/patient/PublicPlans'));

// Shared Chat page (doctor & patient)
const ChatPage        = lazy(() => import('./pages/chat/ChatPage'));
const VideoCall       = lazy(() => import('./pages/chat/VideoCall'));
const SettingsPage    = lazy(() => import('./pages/shared/SettingsPage'));

/* ── Loading spinner ────────────────────────────────────────────────── */
const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
      <p className="text-xs text-slate-500">Loading NutriTrack…</p>
    </div>
  </div>
);

/* ── Reusable guard wrapper ─────────────────────────────────────────── */
const Guard = ({ roles, children }) => (
  <ProtectedRoute roles={roles}>{children}</ProtectedRoute>
);

export default function App() {
  const { refreshUser, token } = useAuthStore();

  // Restore session on page reload
  useEffect(() => {
    if (token) refreshUser();
  }, []); // eslint-disable-line

  return (
    <ThemeProvider>
      <BrowserRouter>
        <SocketProvider>
          <WebRTCProvider>
            <IncomingCallModal />
            <Suspense fallback={<Spinner />}>
            <Routes>
              {/* ── Public ────────────────────────────────────────────── */}
              <Route path="/"         element={<LandingPage />} />
              <Route path="/login"    element={<Login />} />
              <Route path="/register" element={<Register />} />

            {/* ── Admin ─────────────────────────────────────────────── */}
            <Route path="/admin"          element={<Guard roles="admin"><AdminDashboard /></Guard>} />
            <Route path="/admin/users"    element={<Guard roles="admin"><AdminUsers /></Guard>} />
            <Route path="/admin/finance"  element={<Guard roles="admin"><AdminFinance /></Guard>} />
            <Route path="/admin/settings" element={<Guard roles="admin"><AdminSettings /></Guard>} />

            {/* ── Doctor ────────────────────────────────────────────── */}
            <Route path="/doctor"             element={<Guard roles="doctor"><DoctorDashboard /></Guard>} />
            <Route path="/doctor/patients"    element={<Guard roles="doctor"><DoctorPatients /></Guard>} />
            <Route path="/doctor/plans"       element={<Guard roles="doctor"><DoctorPlans /></Guard>} />
            <Route path="/doctor/plans/new"   element={<Guard roles="doctor"><DietPlanBuilder /></Guard>} />
            <Route path="/doctor/chat"        element={<Guard roles="doctor"><ChatPage /></Guard>} />
            <Route path="/doctor/video"       element={<Guard roles="doctor"><VideoCall /></Guard>} />
            <Route path="/doctor/agenda"      element={<Guard roles="doctor"><DoctorAgenda /></Guard>} />
            <Route path="/doctor/settings"    element={<Guard roles="doctor"><SettingsPage /></Guard>} />

            {/* ── Patient ───────────────────────────────────────────── */}
            <Route path="/patient"          element={<Guard roles="patient"><PatientDashboard /></Guard>} />
            <Route path="/patient/scanner"  element={<Guard roles="patient"><FoodScanner /></Guard>} />
            <Route path="/patient/ai"       element={<Guard roles="patient"><AIChatbot /></Guard>} />
            <Route path="/patient/plans"    element={<Guard roles="patient"><PatientPlans /></Guard>} />
            <Route path="/patient/chat"     element={<Guard roles="patient"><ChatPage /></Guard>} />
            <Route path="/patient/video"    element={<Guard roles="patient"><VideoCall /></Guard>} />
            <Route path="/patient/checkout" element={<Guard roles="patient"><PatientCheckout /></Guard>} />
            <Route path="/patient/doctors"  element={<Guard roles="patient"><FindDoctor /></Guard>} />
            <Route path="/patient/marketplace" element={<Guard roles="patient"><PublicPlans /></Guard>} />
            <Route path="/patient/settings" element={<Guard roles="patient"><SettingsPage /></Guard>} />

            {/* ── Fallback ──────────────────────────────────────────── */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>

        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background:   '#1e293b',
              color:        '#f1f5f9',
              border:       '1px solid #334155',
              borderRadius: '12px',
              fontSize:     '13px',
            },
            success: { iconTheme: { primary: '#14b8a6', secondary: '#042f2e' } },
            error:   { iconTheme: { primary: '#f87171', secondary: '#3f0000' } },
          }}
        />
        </WebRTCProvider>
      </SocketProvider>
    </BrowserRouter>
    </ThemeProvider>
  );
}
