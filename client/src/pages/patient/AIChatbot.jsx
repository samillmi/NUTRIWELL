import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { Bot, Send, Loader2, User, Sparkles, RefreshCw } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { chatbot } from '../../api/aiApi';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

const suggestions = [
  'What should I eat before a morning workout?',
  'How many calories does a 30-min walk burn?',
  'Can you suggest a high-protein breakfast?',
  'What are the best foods for weight loss?',
];

const MessageBubble = ({ msg }) => {
  const isBot = msg.role === 'assistant';
  return (
    <div className={`flex gap-3 animate-slide-up ${isBot ? '' : 'flex-row-reverse'}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0
        ${isBot ? 'bg-brand-gradient shadow-glow-teal' : 'bg-accent-500/20 border border-accent-500/30'}`}>
        {isBot
          ? <Bot className="w-4 h-4 text-white" />
          : <User className="w-4 h-4 text-accent-400" />}
      </div>

      <div className={`max-w-[75%] ${isBot ? '' : 'items-end flex flex-col'}`}>
        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed
          ${isBot
            ? 'bg-surface-card dark:bg-slate-800/50 border border-surface-border dark:border-white/10 text-slate-800 dark:text-slate-200 rounded-tl-sm'
            : 'bg-accent-gradient text-white rounded-tr-sm'
          }`}
          style={!isBot ? { background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' } : {}}
        >
          {msg.content}
        </div>
        <p className="text-[10px] text-slate-600 mt-1 px-1">{msg.time}</p>
      </div>
    </div>
  );
};

const AIChatbot = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [unlocked, setUnlocked] = useState(false);
  const [checking, setChecking] = useState(true);

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi ${user?.firstName || 'there'}! 👋 I'm NutriBot, your personal AI dietary assistant. I can help you with meal planning, calorie counting, and nutrition advice. What would you like to know today?`,
      time: 'Now',
    },
  ]);
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const checkUnlock = async () => {
      try {
        const { data } = await api.get('/bookings/patient');
        const hasBought = data.data.bookings.some(b => b.type === 'chatbot' && b.status === 'confirmed');
        setUnlocked(hasBought);
      } catch (err) {
        console.error('Failed to check unlock status:', err);
      } finally {
        setChecking(false);
      }
    };
    checkUnlock();
  }, []);

  if (checking) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
        </div>
      </DashboardLayout>
    );
  }

  if (!unlocked) {
    return (
      <DashboardLayout>
        <div className="max-w-md mx-auto mt-20 text-center">
          <div className="card p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md">
            <Sparkles className="w-16 h-16 text-brand-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">Unlock AI Chatbot</h1>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Get access to your personal AI dietary assistant for meal planning and advice.
            </p>
            <div className="text-3xl font-bold text-brand-400 mb-6">$9.00</div>
            <button
              onClick={() => navigate(`/patient/checkout?type=chatbot&price=9`)}
              className="btn-primary w-full py-3"
            >
              Buy Now to Unlock
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;

    const userMsg = { role: 'user', content: msg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages((p) => [...p, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.map(({ role, content }) => ({ role, content }));
      const { data } = await chatbot({ message: msg, history });
      setMessages((p) => [
        ...p,
        {
          role: 'assistant',
          content: data.data.reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      toast.error('NutriBot is unavailable right now.');
      setMessages((p) => [
        ...p,
        { role: 'assistant', content: "⚠️ Sorry, I'm having trouble connecting. Please try again shortly.", time: 'Now' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-gradient shadow-glow-teal flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                NutriBot <Sparkles className="w-4 h-4 text-brand-400" />
              </h1>
              <p className="text-xs text-slate-400">Powered by GPT-4o · dietary expert</p>
            </div>
          </div>
          <button
            onClick={() => setMessages([messages[0]])}
            className="btn-ghost gap-2 text-xs"
          >
            <RefreshCw className="w-4 h-4" /> Clear chat
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-5 pr-2 scrollbar-hide pb-4">
          {messages.map((msg, i) => (
            <MessageBubble key={i} msg={msg} />
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="flex gap-3 animate-fade-in">
              <div className="w-8 h-8 rounded-xl bg-brand-gradient flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-surface-card border border-surface-border rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1 items-center h-5">
                  {[0, 0.2, 0.4].map((d, i) => (
                    <div key={i} className="w-2 h-2 rounded-full bg-brand-400 animate-bounce"
                         style={{ animationDelay: `${d}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestion chips */}
        {messages.length <= 1 && (
          <div className="shrink-0 flex flex-wrap gap-2 mb-4">
            {suggestions.map((s) => (
              <button key={s} onClick={() => sendMessage(s)}
                      className="text-xs px-3 py-1.5 rounded-full bg-surface-card border border-surface-border
                                 text-slate-400 hover:text-brand-400 hover:border-brand-500/40 transition-all">
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="shrink-0 mt-2">
          <div className="flex gap-3 items-end bg-surface dark:bg-slate-900/50 rounded-2xl border border-surface-border dark:border-white/10
                          p-3 focus-within:border-brand-500/50 dark:focus-within:border-brand-500/50 transition-all">
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask NutriBot anything about nutrition..."
              className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-500
                         resize-none focus:outline-none leading-relaxed"
              style={{ maxHeight: '120px' }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center
                         hover:opacity-90 disabled:opacity-40 transition-all shrink-0"
            >
              {loading
                ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                : <Send className="w-4 h-4 text-white" />}
            </button>
          </div>
          <p className="text-center text-[10px] text-slate-600 mt-2">
            NutriBot provides general dietary guidance only. Always consult your doctor for medical advice.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AIChatbot;
