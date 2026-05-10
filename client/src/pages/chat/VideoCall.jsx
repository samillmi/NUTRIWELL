import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Video, VideoOff, Mic, MicOff, PhoneOff, Phone, User, Loader2 } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { useWebRTCContext } from '../../context/WebRTCContext';
import useAuthStore from '../../store/authStore';

const VideoCall = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const partnerId = searchParams.get('with');
  const { user } = useAuthStore();

  const {
    localStream,
    remoteStream,
    callStatus,
    incomingCall,
    isMuted,
    isVideoOff,
    initiateCall,
    answerCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo
  } = useWebRTCContext();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Attach streams to video elements
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'voice' && !isVideoOff) {
      toggleVideo();
    }
  }, [searchParams, isVideoOff, toggleVideo]);

  // Handle navigating away
  const handleBack = () => {
    if (callStatus !== 'idle') {
      endCall();
    }
    navigate(-1);
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-6rem)] relative rounded-3xl overflow-hidden bg-black/90 shadow-2xl border border-surface-border flex items-center justify-center">
        
        {/* Remote Video (Full Screen) */}
        {remoteStream && callStatus === 'connected' ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover animate-fade-in"
          />
        ) : (
          <div className="flex flex-col items-center justify-center animate-pulse-slow">
            <div className="w-24 h-24 rounded-full bg-surface-card border border-surface-border flex items-center justify-center mb-6 shadow-glow-teal ring-glow">
              {incomingCall ? (
                <User className="w-10 h-10 text-brand-400" />
              ) : (
                <Video className="w-10 h-10 text-brand-400" />
              )}
            </div>
            <h2 className="text-xl font-bold text-white">
              {callStatus === 'idle' && !incomingCall && "Ready to call"}
              {callStatus === 'calling' && "Calling..."}
              {callStatus === 'ringing' && `Incoming Call from ${incomingCall?.callerName}`}
            </h2>
            <p className="text-slate-400 text-sm mt-2">
              {callStatus === 'idle' && !incomingCall && "Click 'Start Call' to begin"}
              {callStatus === 'calling' && "Waiting for them to answer"}
            </p>
          </div>
        )}

        {/* Local Video (PiP) */}
        {(localStream && callStatus !== 'idle') && (
          <div className={`absolute bottom-6 right-6 w-48 h-64 bg-surface-card rounded-2xl overflow-hidden shadow-2xl border-2 ${isVideoOff ? 'border-red-500/50' : 'border-brand-500/50'} z-10 transition-all duration-300`}>
            {isVideoOff ? (
              <div className="w-full h-full flex items-center justify-center bg-surface-card">
                <User className="w-8 h-8 text-slate-500" />
              </div>
            ) : (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100" // Mirror local video
              />
            )}
            {isMuted && (
              <div className="absolute bottom-2 right-2 bg-red-500/80 p-1.5 rounded-lg backdrop-blur-md">
                <MicOff className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
        )}

        {/* Overlay Controls */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-surface-card/80 backdrop-blur-xl p-3 rounded-2xl border border-white/10 shadow-card z-20">
          
          {callStatus === 'idle' && !incomingCall && (
            <button onClick={() => initiateCall(partnerId, searchParams.get('mode') || 'video')} className="btn-primary rounded-xl px-6">
              <Phone className="w-5 h-5 mr-2 text-white" /> Start Call
            </button>
          )}

          {callStatus === 'ringing' && (
            <>
              <button onClick={answerCall} className="w-12 h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center text-white shadow-glow-teal animate-pulse-glow">
                <Phone className="w-5 h-5" />
              </button>
              <button onClick={rejectCall} className="w-12 h-12 rounded-xl bg-red-500 hover:bg-red-600 flex items-center justify-center text-white">
                <PhoneOff className="w-5 h-5" />
              </button>
            </>
          )}

          {(callStatus === 'connected' || callStatus === 'calling') && (
            <>
              <button onClick={toggleMute} className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${isMuted ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-surface border border-surface-border text-slate-300 hover:bg-surface-border'}`}>
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              <button onClick={toggleVideo} className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${isVideoOff ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-surface border border-surface-border text-slate-300 hover:bg-surface-border'}`}>
                {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              </button>
              <button onClick={endCall} className="w-16 h-12 rounded-xl bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-card">
                <PhoneOff className="w-5 h-5" />
              </button>
            </>
          )}

        </div>

        {/* Back Button Overlay */}
        <button onClick={handleBack} className="absolute top-6 left-6 btn-ghost bg-surface-card/50 backdrop-blur-md border border-white/10 z-20">
          Back to Dashboard
        </button>

      </div>
    </DashboardLayout>
  );
};

export default VideoCall;
