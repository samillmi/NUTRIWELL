import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export const useWebRTC = (partnerId) => {
  const { socket } = useSocket();
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callStatus, setCallStatus] = useState('idle'); // idle, calling, ringing, connected, ended
  const [incomingCall, setIncomingCall] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const pc = useRef(null);

  // Initialize Peer Connection
  const initPC = useCallback(() => {
    if (pc.current) return pc.current;
    
    const peerConnection = new RTCPeerConnection(ICE_SERVERS);
    
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && partnerId) {
        socket?.emit('ice:candidate', { peerId: partnerId, candidate: event.candidate });
      }
    };

    peerConnection.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    peerConnection.onconnectionstatechange = () => {
      if (peerConnection.connectionState === 'disconnected' || peerConnection.connectionState === 'failed') {
        endCall();
      }
    };

    pc.current = peerConnection;
    return peerConnection;
  }, [partnerId, socket]);

  // Start Local Media
  const startLocalStream = async (video = true, audio = true) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video, audio });
      setLocalStream(stream);
      return stream;
    } catch (err) {
      toast.error('Could not access camera/microphone');
      console.error(err);
      return null;
    }
  };

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = async ({ callerId, callerName, callerAvatar, offer, callType }) => {
      setIncomingCall({ callerId, callerName, callerAvatar, offer, callType });
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
      if (callStatus === 'calling') {
        toast.error('User is offline.');
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
  }, [socket, callStatus]);

  // Actions
  const initiateCall = async () => {
    if (!partnerId || !socket) return;
    setCallStatus('calling');
    
    const stream = await startLocalStream();
    if (!stream) {
      setCallStatus('idle');
      return;
    }

    const peerConnection = initPC();
    stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      socket.emit('call:initiate', { calleeId: partnerId, offer, callType: 'video' });
    } catch (err) {
      console.error('Error creating offer:', err);
      endCall();
    }
  };

  const answerCall = async () => {
    if (!incomingCall || !socket) return;
    
    const stream = await startLocalStream();
    if (!stream) {
      rejectCall();
      return;
    }

    const peerConnection = initPC();
    stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

    try {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      socket.emit('call:answer', { callerId: incomingCall.callerId, answer });
      setCallStatus('connected');
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
    setCallStatus('idle');
  };

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
  }, [socket, partnerId, callStatus, incomingCall, localStream]);

  // Media Controls
  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!localStream.getAudioTracks()[0].enabled);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!localStream.getVideoTracks()[0].enabled);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Don't auto-end if just unmounting unless we want strictly tied lifecycle.
      // Usually, leaving page ends the call.
      if (pc.current) {
        endCall();
      }
    };
  }, [endCall]);

  return {
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
  };
};
