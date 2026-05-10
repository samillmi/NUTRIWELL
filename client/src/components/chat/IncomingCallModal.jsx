import { Phone, PhoneOff, User } from 'lucide-react';
import { useWebRTCContext } from '../../context/WebRTCContext';

const IncomingCallModal = () => {
  const { callStatus, incomingCall, answerCall, rejectCall } = useWebRTCContext();

  if (callStatus !== 'ringing' || !incomingCall) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-card w-[350px] p-6 rounded-3xl shadow-2xl border border-surface-border flex flex-col items-center text-center">
        
        {/* Ringing Avatar */}
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-full animate-pulse-glow bg-brand-500/20" />
          <div className="relative z-10 w-24 h-24 rounded-full bg-surface border border-surface-border flex items-center justify-center shadow-card">
            {incomingCall.callerAvatar ? (
              <img src={incomingCall.callerAvatar} alt="Caller" className="w-full h-full rounded-full object-cover" />
            ) : (
              <User className="w-10 h-10 text-brand-500" />
            )}
          </div>
        </div>

        <h2 className="text-xl font-bold text-slate-900 mb-1">{incomingCall.callerName}</h2>
        <p className="text-slate-500 text-sm mb-8">Incoming video call...</p>

        <div className="flex w-full justify-center gap-8">
          <button 
            onClick={rejectCall} 
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center group-hover:bg-red-500 transition-colors shadow-card">
              <PhoneOff className="w-6 h-6 text-red-500 group-hover:text-white" />
            </div>
            <span className="text-xs font-semibold text-slate-500">Decline</span>
          </button>

          <button 
            onClick={answerCall} 
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-14 h-14 rounded-2xl bg-brand-500 flex items-center justify-center group-hover:bg-brand-600 shadow-glow-teal animate-bounce transition-colors">
              <Phone className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-semibold text-slate-500">Answer</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default IncomingCallModal;
