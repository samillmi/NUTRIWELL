import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from './SocketContext';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const WebRTCContext = createContext(null);

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export const WebRTCProvider = ({ children }) => {
  const { socket } = useSocket();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callStatus, setCallStatus] = useState('idle'); // idle, calling, ringing, connected
  const [incomingCall, setIncomingCall] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [partnerId, setPartnerId] = useState(null);

  const pc = useRef(null);

  const endCall = useCallback(() => {
    if (socket && partnerId && callStatus !== 'idle') {
      socket.emit('call:end', { peerId: partnerId });
    }
    if (incomingCall && socket && callStatus === 'ringing') {
      socket.emit('call:reject', { callerId: incomingCall.callerId });
    }
    
    if (pc.current) {
      pc.current.close();
      pc.current = null;
    }
    
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    
    setLocalStream(null);
    setRemoteStream(null);
    setCallStatus('idle');
    setIncomingCall(null);
    setPartnerId(null);
    setIsMuted(false);
    setIsVideoOff(false);

    // Optionally navigate back if on video page
    if (window.location.pathname.includes('/video')) {
       navigate(-1);
    }
  }, [socket, partnerId, callStatus, incomingCall, localStream, navigate]);

  const initPC = useCallback((pid) => {
    if (pc.current) return pc.current;
    
    const peerConnection = new RTCPeerConnection(ICE_SERVERS);
    
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && pid) {
        socket?.emit('ice:candidate', { peerId: pid, candidate: event.candidate });
      }
    };

    peerConnection.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    peerConnection.onconnectionstatechange = () => {
      if (peerConnection.connectionState === 'disconnected' || peerConnection.connectionState === 'failed') {
        endCall();
        toast.error('Call disconnected.');
      }
    };

    pc.current = peerConnection;
    return peerConnection;
  }, [socket, endCall]);

  const startLocalStream = async (video = true, audio = true) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video, audio });
      setLocalStream(stream);
      return stream;
    } catch (err) {
      toast.error('Could not access camera/microphone');
      return null;
    }
  };

  // Socket Listeners
  useEffect(() => {
    if (!socket || !user) return;

    const handleIncomingCall = async ({ callerId, callerName, callerAvatar, offer, callType }) => {
      if (callStatus !== 'idle') {
        socket.emit('call:reject', { callerId }); // Busy
        return;
      }
      setIncomingCall({ callerId, callerName, callerAvatar, offer, callType });
      setPartnerId(callerId);
      setCallStatus('ringing');
    };

    const handleCallAnswered = async ({ answer }) => {
      if (!pc.current) return;
      try {
        await pc.current.setRemoteDescription(new RTCSessionDescription(answer));
        setCallStatus('connected');
      } catch (err) {
        console.error('Error setting remote description:', err);
      }
    };

    const handleCallRejected = () => {
      toast('Call was rejected.', { icon: '📵' });
      endCall();
    };

    const handleCallEnded = () => {
      toast('Call ended.', { icon: '📞' });
      endCall();
    };

    const handleIceCandidate = async ({ candidate }) => {
      if (pc.current && candidate) {
        try {
          await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error('Error adding received ice candidate', e);
        }
      }
    };

    const handleUserOffline = () => {
      if (callStatus === 'calling' || callStatus === 'connected') {
        toast.error('User went offline.');
        endCall();
      }
    };

    socket.on('call:incoming', handleIncomingCall);
    socket.on('call:answered', handleCallAnswered);
    socket.on('call:rejected', handleCallRejected);
    socket.on('call:ended', handleCallEnded);
    socket.on('ice:candidate', handleIceCandidate);
    socket.on('call:user-offline', handleUserOffline);

    return () => {
      socket.off('call:incoming', handleIncomingCall);
      socket.off('call:answered', handleCallAnswered);
      socket.off('call:rejected', handleCallRejected);
      socket.off('call:ended', handleCallEnded);
      socket.off('ice:candidate', handleIceCandidate);
      socket.off('call:user-offline', handleUserOffline);
    };
  }, [socket, callStatus, user, endCall]);

  const initiateCall = async (pid, callType = 'video') => {
    if (!pid || !socket) return;
    setPartnerId(pid);
    setCallStatus('calling');
    
    // Navigate immediately to video page
    navigate(`/${user.role}/video?with=${pid}&mode=${callType}`);

    const stream = await startLocalStream(callType === 'video', true);
    if (!stream) {
      endCall();
      return;
    }

    const peerConnection = initPC(pid);
    stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      socket.emit('call:initiate', { calleeId: pid, offer, callType });
      if (callType === 'voice') {
        setIsVideoOff(true);
      }
    } catch (err) {
      console.error('Error creating offer:', err);
      endCall();
    }
  };

  const answerCall = async () => {
    if (!incomingCall || !socket) return;
    
    const callType = incomingCall.callType || 'video';
    // Navigate to video page
    navigate(`/${user.role}/video?with=${incomingCall.callerId}&mode=${callType}`);

    const stream = await startLocalStream(callType === 'video', true);
    if (!stream) {
      rejectCall();
      return;
    }

    const peerConnection = initPC(incomingCall.callerId);
    stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

    try {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      socket.emit('call:answer', { callerId: incomingCall.callerId, answer });
      setCallStatus('connected');
      if (callType === 'voice') {
        setIsVideoOff(true);
      }
    } catch (err) {
      console.error('Error answering call:', err);
      endCall();
    }
  };

  const rejectCall = () => {
    if (incomingCall && socket) {
      socket.emit('call:reject', { callerId: incomingCall.callerId });
    }
    setIncomingCall(null);
    setPartnerId(null);
    setCallStatus('idle');
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => track.enabled = !track.enabled);
      setIsMuted(!localStream.getAudioTracks()[0].enabled);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const tracks = localStream.getVideoTracks();
      if (tracks.length > 0) {
        tracks.forEach(track => track.enabled = !track.enabled);
        setIsVideoOff(!tracks[0].enabled);
      } else {
        setIsVideoOff(true);
      }
    }
  };

  return (
    <WebRTCContext.Provider value={{
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
      toggleVideo,
      partnerId
    }}>
      {children}
    </WebRTCContext.Provider>
  );
};

export const useWebRTCContext = () => useContext(WebRTCContext);
