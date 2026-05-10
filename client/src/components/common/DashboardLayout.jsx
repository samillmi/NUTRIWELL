import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import toast from 'react-hot-toast';

const DashboardLayout = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { socket } = useSocket();

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

    socket.on('receive:message', handleMessage);
    return () => socket.off('receive:message', handleMessage);
  }, [socket]);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white dark:bg-slate-900 border-b border-surface-border dark:border-white/10 flex items-center justify-between px-4 z-30">
        <button onClick={() => setIsOpen(true)} className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
          <Menu className="w-5 h-5" />
        </button>
        <p className="text-sm font-bold text-slate-900 dark:text-white">NutriTrack</p>
        <div className="w-9" /> {/* Spacer to center the title */}
      </div>

      {/* Sidebar */}
      <Sidebar isOpen={isOpen} onClose={() => setIsOpen(false)} />

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 p-4 lg:p-8 mt-14 lg:mt-0 animate-fade-in w-full max-w-full overflow-x-hidden">
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
