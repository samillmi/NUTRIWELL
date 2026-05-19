import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Send, Loader2, MessageSquare, Circle, Paperclip,
  Smile, ArrowLeft, MoreVertical, Phone, Video, Star
} from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { useSocket } from '../../context/SocketContext';
import { getChatHistory } from '../../api/chatApi';
import { getMyPatients } from '../../api/doctorApi';
import { getPatientProfile } from '../../api/patientApi';
import api from '../../api/axiosInstance';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

/* ────────────────────────────────────────────────────────────────────────────
   Re-usable bubble component
──────────────────────────────────────────────────────────────────────────── */
const Bubble = ({ msg, isOwn }) => (
  <div className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''} animate-slide-up`}>
    {!isOwn && (
      msg.senderAvatar ? (
        <img src={msg.senderAvatar} alt={msg.senderInitials} className="w-7 h-7 rounded-full object-cover shrink-0 mt-1" />
      ) : (
        <div className="w-7 h-7 rounded-full bg-brand-gradient flex items-center justify-center
                        text-[10px] font-bold text-white shrink-0 mt-1">
          {msg.senderInitials}
        </div>
      )
    )}
    <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
      <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed
        ${isOwn
          ? 'bg-brand-gradient text-white rounded-tr-sm'
          : 'bg-surface-card dark:bg-slate-800/50 border border-surface-border dark:border-white/10 text-slate-800 dark:text-slate-200 rounded-tl-sm'}`}>
        {msg.isDeleted ? (
          <span className="italic text-slate-400 text-xs">Message deleted</span>
        ) : msg.messageType === 'image' ? (
          <img
            src={msg.content}
            alt="Attachment"
            className="max-w-xs max-h-60 rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(msg.content, '_blank')}
          />
        ) : (
          msg.content
        )}
      </div>
      <p className="text-[10px] text-slate-600 px-1">
        {msg.time}
        {isOwn && msg.readBy?.length > 0 && (
          <span className="ml-1 text-brand-400">✓✓</span>
        )}
      </p>
    </div>
  </div>
);

/* ────────────────────────────────────────────────────────────────────────────
   Conversation selector (left sidebar)
──────────────────────────────────────────────────────────────────────────── */
const ContactItem = ({ contact, isSelected, isOnline, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all
      ${isSelected
        ? 'bg-brand-500/15 border border-brand-500/25'
        : 'hover:bg-surface/60 border border-transparent'}`}
  >
    <div className="relative shrink-0">
      {contact.avatar ? (
        <img src={contact.avatar} alt={contact.name} className="w-10 h-10 rounded-full object-cover" />
      ) : (
        <div className="w-10 h-10 rounded-full bg-brand-gradient flex items-center
                        justify-center text-sm font-bold text-white">
          {contact.initials}
        </div>
      )}
      {isOnline && (
        <Circle className="absolute -bottom-0.5 -right-0.5 w-3 h-3 fill-emerald-400
                           text-emerald-400 border-2 border-surface-card rounded-full" />
      )}
    </div>
    <div className="min-w-0">
      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{contact.name}</p>
      <p className="text-[10px] text-slate-500 truncate">
        {isOnline ? 'Online' : 'Offline'}
      </p>
    </div>
  </button>
);

/* ────────────────────────────────────────────────────────────────────────────
   Main Chat Page — works for both Doctor and Patient
──────────────────────────────────────────────────────────────────────────── */
const ChatPage = () => {
  const { user } = useAuthStore();
  const { socket, onlineUsers } = useSocket();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const sub = user?.subscription;
  const isExpired = sub?.endDate && new Date(sub.endDate) < new Date();
  const isDocOrAdmin = user?.role === 'doctor' || user?.role === 'admin';
  const hasAccess = isDocOrAdmin || (sub?.status === 'active' && !isExpired && ['basic', 'standard', 'premium'].includes(sub.plan));

  if (!hasAccess) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[70vh] text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
            <MessageSquare className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Chat is Locked</h2>
          <p className="text-slate-500 max-w-md mb-6">
            You need an active subscription to access the chat. Please purchase a plan to continue.
          </p>
          <button 
            onClick={() => navigate('/patient/doctors')}
            className="btn-primary"
          >
            Upgrade Plan
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const [contacts, setContacts] = useState([]);
  const [activeId, setActiveId] = useState(searchParams.get('with') || null);
  const [activeName, setActiveName] = useState(searchParams.get('name') || '');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const typingTimer = useRef(null);
  const bottomRef = useRef(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [docRating, setDocRating] = useState(0);
  const [docFeedback, setDocFeedback] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    e.target.value = '';
    setUploadingImage(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const { data } = await api.post('/chat/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const imageUrl = data.data.url;

      const payload = { receiverId: activeId, content: imageUrl, messageType: 'image' };
      const optimistic = {
        id: `opt-${Date.now()}`,
        content: imageUrl,
        messageType: 'image',
        senderId: user._id,
        senderInitials: `${user.firstName[0]}${user.lastName[0]}`,
        isDeleted: false,
        readBy: [],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, optimistic]);

      socket.emit('send:message', payload, (ack) => {
        if (!ack?.success) {
          toast.error('Failed to send image.');
          setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
        }
      });
    } catch (err) {
      console.error('[Chat] Image upload failed:', err);
      toast.error(err.response?.data?.message || 'Failed to upload image.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRateDoctor = async () => {
    if (docRating === 0) {
      toast.error('Please select a rating.');
      return;
    }
    setSubmittingRating(true);
    try {
      await api.post(`/doctors/${activeId}/reviews`, { rating: docRating, feedback: docFeedback });
      toast.success('Review submitted successfully!');
      setShowRatingModal(false);
      setDocRating(0);
      setDocFeedback('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleGoogleMeet = () => {
    const meetUrl = 'https://meet.google.com/new';
    const messageContent = `I am starting a Google Meet meeting. Please join me!`;
    
    const payload = { receiverId: activeId, content: messageContent, messageType: 'text' };
    const optimistic = {
      id: `opt-${Date.now()}`,
      content: messageContent,
      senderId: user._id,
      senderInitials: `${user.firstName[0]}${user.lastName[0]}`,
      isDeleted: false,
      readBy: [],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, optimistic]);
    
    socket.emit('send:message', payload, (ack) => {
      if (!ack?.success) {
        toast.error('Message failed to send.');
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      } else {
        toast.success('Google Meet notification sent!');
        window.open(meetUrl, '_blank');
      }
    });
  };

  /* ── Load contacts (doctor → patients / patient → doctor) ─────── */
  useEffect(() => {
    (async () => {
      try {
        if (user?.role === 'doctor') {
          const { data } = await getMyPatients();
          setContacts(
            data.data.patients.map((p) => ({
              id: p._id,
              name: `${p.firstName} ${p.lastName}`,
              initials: `${p.firstName[0]}${p.lastName[0]}`,
              avatar: p.avatar || '',
              role: 'patient',
            }))
          );
        } else if (user?.role === 'patient') {
          const { data: profileData } = await getPatientProfile();
          const doc = profileData.data.user.assignedDoctor;

          let patientContacts = [];

          if (doc) {
            patientContacts.push({
              id: typeof doc === 'object' ? doc._id : doc,
              name: typeof doc === 'object' ? `Dr. ${doc.firstName} ${doc.lastName}` : 'Your Doctor',
              initials: typeof doc === 'object' ? `${doc.firstName[0]}${doc.lastName[0]}` : 'DR',
              avatar: typeof doc === 'object' ? doc.avatar : '',
              role: 'doctor',
            });
          }

          setContacts(patientContacts);
        }
      } catch (err) {
        console.error('[Chat] Failed to load contacts:', err);
      }
    })();
  }, [user]);

  /* ── Auto-select from URL query ─────────────────────────────────── */
  useEffect(() => {
    if (activeId && contacts.length) {
      const found = contacts.find((c) => c.id === activeId);
      if (found) setActiveName(found.name);
    }
  }, [activeId, contacts]);

  /* ── Load chat history when active contact changes ───────────────── */
  useEffect(() => {
    if (!activeId) return;
    setLoadingChat(true);
    setMessages([]);
    getChatHistory(activeId)
      .then(({ data }) => {
        const raw = data.data.messages;
        setMessages(raw.map(formatMsg));
        
        // Mark as read
        const unreadIds = raw.filter(m => (m.sender?._id || m.sender) !== user?._id).map(m => m._id);
        if (unreadIds.length > 0 && socket) {
          socket.emit('message:read', { messageIds: unreadIds });
        }
      })
      .catch(() => toast.error('Could not load chat history.'))
      .finally(() => setLoadingChat(false));
  }, [activeId]);

  /* ── Scroll to bottom ────────────────────────────────────────────── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ── Socket.io listeners ─────────────────────────────────────────── */
  useEffect(() => {
    if (!socket) return;

    const onReceive = (msg) => {
      const senderId = msg.sender._id || msg.sender;
      // Only update if from our active conversation
      if (senderId === activeId) {
        setMessages((prev) => [...prev, formatMsg(msg)]);
        // Mark as read
        socket.emit('message:read', { messageIds: [msg._id] });
      } else {
        toast(`New message from ${msg.sender?.firstName || 'User'}`, { icon: '💬' });
      }
    };

    const onTypingStart = ({ senderId }) => {
      if (senderId === activeId) setTyping(true);
    };

    const onTypingStop = ({ senderId }) => {
      if (senderId === activeId) setTyping(false);
    };

    socket.on('receive:message', onReceive);
    socket.on('typing:start', onTypingStart);
    socket.on('typing:stop', onTypingStop);

    return () => {
      socket.off('receive:message', onReceive);
      socket.off('typing:start', onTypingStart);
      socket.off('typing:stop', onTypingStop);
    };
  }, [socket, activeId]);

  /* ── Helpers ─────────────────────────────────────────────────────── */
  const formatMsg = (m) => ({
    id: m._id,
    content: m.content,
    messageType: m.messageType || 'text',
    isDeleted: m.isDeleted,
    senderId: m.sender?._id || m.sender,
    senderInitials: m.sender?.firstName
      ? `${m.sender.firstName[0]}${m.sender.lastName[0]}`
      : '??',
    senderAvatar: m.sender?.avatar || '',
    readBy: m.readBy || [],
    time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  });

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (!socket || !activeId) return;
    socket.emit('typing:start', { receiverId: activeId });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket.emit('typing:stop', { receiverId: activeId });
    }, 1500);
  };

  const sendMessage = useCallback(() => {
    if (!input.trim() || !activeId || !socket || sending) return;

    const payload = { receiverId: activeId, content: input.trim(), messageType: 'text' };
    const optimistic = {
      id: `opt-${Date.now()}`,
      content: input.trim(),
      senderId: user._id,
      senderInitials: `${user.firstName[0]}${user.lastName[0]}`,
      isDeleted: false,
      readBy: [],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, optimistic]);
    setInput('');
    setSending(true);

    socket.emit('send:message', payload, (ack) => {
      setSending(false);
      if (!ack?.success) {
        toast.error('Message failed to send.');
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      }
    });
  }, [input, activeId, socket, sending, user]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const selectContact = (c) => {
    setActiveId(c.id);
    setActiveName(c.name);
  };

  const isOnline = (contactId) => onlineUsers?.includes(contactId);

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-4rem)] flex gap-0 md:gap-5">

        {/* ── Left: contacts list ─────────────────────────────────────── */}
        <div className={`${activeId ? 'hidden md:flex' : 'flex'} w-full md:w-64 shrink-0 card p-0 flex-col overflow-hidden`}>
          <div className="p-4 border-b border-surface-border">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-brand-400" />
              {user?.role === 'doctor' ? 'My Patients' : 'My Doctor'}
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-hide">
            {contacts.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">
                {user?.role === 'patient'
                  ? 'No doctor assigned yet.'
                  : 'No patients assigned yet.'}
              </p>
            ) : (
              contacts.map((c) => (
                <ContactItem
                  key={c.id}
                  contact={c}
                  isSelected={activeId === c.id}
                  isOnline={isOnline(c.id)}
                  onClick={() => selectContact(c)}
                />
              ))
            )}
          </div>
        </div>

        {/* ── Right: conversation area ────────────────────────────────── */}
        <div className={`${activeId ? 'flex' : 'hidden md:flex'} flex-1 card p-0 flex-col overflow-hidden`}>
          {!activeId ? (
            /* Empty state */
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20
                              flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-brand-400" />
              </div>
              <p className="text-sm text-slate-400">Select a contact to start chatting</p>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="flex items-center justify-between px-3 md:px-5 py-4
                              border-b border-surface-border shrink-0">
                <div className="flex items-center gap-2 md:gap-3">
                  <button
                    className="md:hidden p-2 -ml-2 text-slate-500 hover:text-slate-700 dark:hover:text-white"
                    onClick={() => setActiveId(null)}
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="relative">
                    {contacts.find((c) => c.id === activeId)?.avatar ? (
                      <img src={contacts.find((c) => c.id === activeId).avatar} alt={activeName} className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-brand-gradient flex items-center
                                      justify-center text-sm font-bold text-white">
                        {contacts.find((c) => c.id === activeId)?.initials || '??'}
                      </div>
                    )}
                    {isOnline(activeId) && (
                      <Circle className="absolute -bottom-0.5 -right-0.5 w-3 h-3 fill-emerald-400
                                         text-emerald-400 border-2 border-surface-card rounded-full" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{activeName}</p>
                    <p className="text-[10px] text-slate-500">
                      {isOnline(activeId) ? '🟢 Online' : '⚫ Offline'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 relative">
                  {user?.role === 'patient' && contacts.find((c) => c.id === activeId)?.role === 'doctor' && (
                    <button
                      className="btn-ghost p-2 rounded-xl text-amber-400"
                      title="Rate Doctor"
                      onClick={() => setShowRatingModal(true)}
                    >
                      <Star className="w-4 h-4 fill-amber-400" />
                    </button>
                  )}
                  {user?.role === 'doctor' && (
                    <>
                      <button 
                        className="btn-ghost p-2 rounded-xl" 
                        title="Start Voice Call"
                        onClick={() => {
                          navigate(`/doctor/video?with=${activeId}&mode=voice`);
                        }}
                      >
                        <Phone className="w-4 h-4" />
                      </button>
                      <button
                        className="btn-ghost p-2 rounded-xl"
                        title="Start Video Call"
                        onClick={() => {
                          navigate(`/doctor/video?with=${activeId}`);
                        }}
                      >
                        <Video className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  {/* Three-dots menu button */}
                  {user?.role === 'doctor' && (
                    <div className="relative">
                      <button
                        onClick={() => setShowMenu(prev => !prev)}
                        className="btn-ghost p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-white"
                        title="More Options"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {showMenu && (
                        <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-slate-800 border border-surface-border dark:border-white/10 shadow-lg py-1 z-50 animate-slide-up">
                          <button
                            onClick={() => {
                              handleGoogleMeet();
                              setShowMenu(false);
                            }}
                            className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors flex items-center gap-2"
                          >
                            <Video className="w-3.5 h-3.5 text-brand-400" /> Call with Google Meet
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 scrollbar-hide">
                {loadingChat ? (
                  <div className="flex justify-center pt-8">
                    <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3">
                    <MessageSquare className="w-10 h-10 text-slate-700" />
                    <p className="text-sm text-slate-500">No messages yet. Say hello! 👋</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <Bubble
                      key={msg.id}
                      msg={msg}
                      isOwn={msg.senderId === user?._id || msg.senderId === user?.id}
                    />
                  ))
                )}

                {/* Typing indicator */}
                {typing && (
                  <div className="flex gap-2 animate-fade-in">
                    <div className="w-7 h-7 rounded-full bg-brand-gradient flex items-center
                                    justify-center text-[10px] font-bold text-white shrink-0">
                      {contacts.find((c) => c.id === activeId)?.initials}
                    </div>
                    <div className="bg-surface-card border border-surface-border rounded-2xl
                                    rounded-tl-sm px-4 py-2.5">
                      <div className="flex gap-1">
                        {[0, 0.2, 0.4].map((d, i) => (
                          <div key={i} className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce"
                            style={{ animationDelay: `${d}s` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="px-4 py-3 border-t border-surface-border dark:border-white/10 shrink-0">
                <div className="flex items-end gap-2 bg-surface dark:bg-slate-900/50 rounded-2xl border border-surface-border dark:border-white/10
                                px-3 py-2.5 focus-within:border-brand-500/50 dark:focus-within:border-brand-500/50 transition-all">
                  <input
                    type="file"
                    accept="image/*"
                    id="chat-image-input"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <button
                    onClick={() => document.getElementById('chat-image-input').click()}
                    disabled={uploadingImage}
                    className="text-slate-500 hover:text-slate-300 transition-colors mb-0.5 flex items-center justify-center shrink-0"
                    title="Send Image"
                  >
                    {uploadingImage ? (
                      <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
                    ) : (
                      <Paperclip className="w-4 h-4" />
                    )}
                  </button>
                  <textarea
                    rows={1}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKey}
                    placeholder={`Message ${activeName}…`}
                    className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-500
                               resize-none focus:outline-none leading-relaxed"
                    style={{ maxHeight: '100px' }}
                  />
                  <button className="text-slate-500 hover:text-slate-300 transition-colors mb-0.5">
                    <Smile className="w-4 h-4" />
                  </button>
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || sending}
                    className="w-8 h-8 rounded-xl bg-brand-gradient flex items-center justify-center
                               hover:opacity-90 disabled:opacity-40 transition-all shrink-0"
                  >
                    {sending
                      ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                      : <Send className="w-3.5 h-3.5 text-white" />}
                  </button>
                </div>
                <p className="text-center text-[10px] text-slate-700 mt-1.5">
                  Messages are encrypted end-to-end
                </p>
              </div>
            </>
          )}
        </div>

        {/* Rating Modal */}
        {showRatingModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-surface-border dark:border-white/10">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Rate Doctor</h3>
              
              <div className="flex gap-1 mb-4 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setDocRating(star)}
                    className="focus:outline-none"
                  >
                    <Star className={`w-8 h-8 ${docRating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`} />
                  </button>
                ))}
              </div>

              <textarea
                value={docFeedback}
                onChange={(e) => setDocFeedback(e.target.value)}
                placeholder="Write your feedback about the doctor..."
                className="input w-full h-24 mb-4 bg-surface dark:bg-slate-900/50 border-surface-border dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-500"
              />

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowRatingModal(false)}
                  className="btn-ghost px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRateDoctor}
                  disabled={submittingRating}
                  className="btn-primary px-4 py-2"
                >
                  {submittingRating ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default ChatPage;
