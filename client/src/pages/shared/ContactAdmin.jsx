import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { Shield, Send, Loader2, MessageSquare, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axiosInstance';

const ContactAdmin = () => {
  const [form, setForm] = useState({ subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [fetching, setFetching] = useState(true);

  const fetchMyMessages = async () => {
    try {
      const { data } = await api.get('/support/my');
      setMessages(data.data.messages);
    } catch (err) {
      console.error('Failed to fetch my messages:', err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchMyMessages();
  }, []);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject || !form.message) {
      return toast.error('Please fill in all fields.');
    }
    setLoading(true);
    try {
      await api.post('/support', form);
      toast.success('Message sent to admin successfully!');
      setForm({ subject: '', message: '' });
      fetchMyMessages(); // Refresh
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Contact Admin</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Send a message to the platform administrator for support or inquiries.</p>
        </div>

        <div className="grid gap-8">
          {/* Form */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-surface-border dark:border-white/5 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Support Message</h2>
                <p className="text-xs text-slate-500">We typically reply within 24 hours.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Subject</label>
                <input
                  type="text"
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  placeholder="What do you need help with?"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Message</label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Describe your issue in detail..."
                  rows={4}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 text-slate-900 dark:text-white resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>

          {/* Previous Messages */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-surface-border dark:border-white/5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Previous Messages</h2>

            {fetching ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-6 text-slate-500 dark:text-slate-400 text-sm">
                No previous messages found.
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div key={msg._id} className="border border-slate-100 dark:border-white/5 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{msg.subject}</h3>
                        <p className="text-xs text-slate-500">{new Date(msg.createdAt).toLocaleString()}</p>
                      </div>
                      <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${msg.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                        {msg.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">{msg.message}</p>

                    {msg.reply && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800/30">
                        <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-1">Reply from Admin:</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300">{msg.reply}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ContactAdmin;
