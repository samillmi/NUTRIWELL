import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { MessageSquare, CheckCircle, Clock, Loader2, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axiosInstance';

const AdminSupport = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replies, setReplies] = useState({});
  const [replyLoading, setReplyLoading] = useState({});

  const fetchMessages = async () => {
    try {
      const { data } = await api.get('/support');
      setMessages(data.data.messages);
    } catch (err) {
      toast.error('Failed to fetch support messages.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await api.put(`/support/${id}`, { status: newStatus });
      toast.success('Status updated!');
      fetchMessages(); // Refresh
    } catch (err) {
      toast.error('Failed to update status.');
    }
  };

  const handleReplyChange = (id, value) => {
    setReplies((p) => ({ ...p, [id]: value }));
  };

  const submitReply = async (id) => {
    const replyText = replies[id];
    if (!replyText) return toast.error('Please enter a reply.');
    
    setReplyLoading((p) => ({ ...p, [id]: true }));
    try {
      await api.put(`/support/${id}`, { reply: replyText });
      toast.success('Reply sent!');
      setReplies((p) => ({ ...p, [id]: '' })); // Clear
      fetchMessages(); // Refresh
    } catch (err) {
      toast.error('Failed to send reply.');
    } finally {
      setReplyLoading((p) => ({ ...p, [id]: false }));
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Support Messages</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage inquiries and support requests from patients and doctors.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-surface-border dark:border-white/5">
            <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-slate-500 dark:text-slate-400">No support messages found.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {messages.map((msg) => (
              <div key={msg._id} className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-surface-border dark:border-white/5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${msg.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                        {msg.status}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(msg.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{msg.subject}</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">{msg.message}</p>
                    
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                        {msg.sender?.firstName?.[0] || 'U'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{msg.sender?.firstName} {msg.sender?.lastName}</p>
                        <p className="text-xs text-slate-500">{msg.sender?.email} • <span className="capitalize">{msg.sender?.role}</span></p>
                      </div>
                    </div>

                    {/* Reply Section */}
                    {msg.reply ? (
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30 mb-4">
                        <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-1">Admin Reply:</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300">{msg.reply}</p>
                        {msg.repliedAt && (
                          <p className="text-xs text-slate-400 mt-1">{new Date(msg.repliedAt).toLocaleString()}</p>
                        )}
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={replies[msg._id] || ''}
                          onChange={(e) => handleReplyChange(msg._id, e.target.value)}
                          placeholder="Type a reply..."
                          className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 text-slate-900 dark:text-white"
                        />
                        <button
                          onClick={() => submitReply(msg._id)}
                          disabled={replyLoading[msg._id]}
                          className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {replyLoading[msg._id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          Reply
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-start gap-2">
                    {msg.status === 'pending' ? (
                      <button
                        onClick={() => handleStatusUpdate(msg._id, 'resolved')}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold py-2 px-3 rounded-lg flex items-center gap-1 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" /> Mark Resolved
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStatusUpdate(msg._id, 'pending')}
                        className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-xs font-bold py-2 px-3 rounded-lg flex items-center gap-1 transition-colors"
                      >
                        <Clock className="w-4 h-4" /> Reopen
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminSupport;
