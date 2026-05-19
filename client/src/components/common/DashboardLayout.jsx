import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { Menu, Bell } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import { Link } from 'react-router-dom';
import api from '../../api/axiosInstance';

const DashboardLayout = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { socket } = useSocket();
  const [notifs, setNotifs] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    if (user?.role === 'admin') {
      const fetchNotifs = async () => {
        try {
          const { data } = await api.get('/admin/notifications');
          setNotifs(data.data.notifications);
        } catch (err) {
          console.error('Failed to fetch notifs:', err);
        }
      };
      fetchNotifs();
      const interval = setInterval(fetchNotifs, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    if (!socket) return;

    const playBeep = () => {
      try {
        const context = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = context.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, context.currentTime); // A4
        oscillator.connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + 0.2);
      } catch (err) {
        console.error('Failed to play sound:', err);
      }
    };

    const handleMessage = (msg) => {
      // Check if we are NOT on the chat page
      const isChatPage = window.location.pathname.includes('/chat');
      if (!isChatPage) {
        toast(`New message from ${msg.sender?.firstName || 'User'}`, { 
          icon: '💬',
          style: {
            borderRadius: '12px',
            background: '#0F172A',
            color: '#FFF',
          }
        });
        playBeep();
      }
    };

    const handleConsultationStart = (data) => {
      const otherParty = user?.role === 'doctor' ? data.booking.patient.firstName : `Dr. ${data.booking.doctor.firstName}`;
      toast(`Consultation with ${otherParty} is starting now!`, {
        icon: '📅',
        style: {
          borderRadius: '12px',
          background: '#10B981',
          color: '#FFF',
        },
        duration: 10000 // 10 seconds
      });
      playBeep();
    };

    socket.on('receive:message', handleMessage);
    socket.on('consultation:start', handleConsultationStart);
    
    return () => {
      socket.off('receive:message', handleMessage);
      socket.off('consultation:start', handleConsultationStart);
    };
  }, [socket]);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      {/* Header */}
      <div className="fixed top-0 left-0 lg:left-64 right-0 h-14 bg-white dark:bg-slate-900 border-b border-surface-border dark:border-white/10 flex items-center justify-between px-4 z-30">
        <button onClick={() => setIsOpen(true)} className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
          <Menu className="w-5 h-5" />
        </button>
        <p className="text-sm font-bold text-slate-900 dark:text-white lg:hidden">NutriWell</p>
        
        {/* Right side: Notifications */}
        <div className="flex items-center gap-2 ml-auto">
          {user?.role === 'admin' && (
            <div className="relative">
              <button onClick={() => setShowNotifs(!showNotifs)} className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                <Bell className="w-5 h-5" />
                {notifs.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
              
              {showNotifs && (
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-surface-border dark:border-white/10 py-2 z-50">
                  <div className="px-4 py-2 border-b border-surface-border dark:border-white/5">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Notifications</p>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifs.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-slate-500 text-center">
                        No new notifications
                      </div>
                    ) : (
                      notifs.map((n) => (
                        <Link key={n.id} to={n.link} onClick={() => setShowNotifs(false)} className="block px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                          <p className="text-sm text-slate-600 dark:text-slate-300">{n.text}</p>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <Sidebar isOpen={isOpen} onClose={() => setIsOpen(false)} />

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 p-4 lg:p-8 mt-14 animate-fade-in w-full max-w-full overflow-x-hidden">
        {children}
      </main>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 lg:hidden" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default DashboardLayout;
