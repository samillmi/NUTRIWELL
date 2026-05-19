import { useState, useEffect } from 'react';
import { PenSquare, Check, X, Clock, Loader2, Trash2 } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';

const AdminBlogs = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [readingBlog, setReadingBlog] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');

  const filteredBlogs = activeTab === 'pending' 
    ? blogs.filter(b => b.status === 'pending') 
    : blogs.filter(b => b.status === 'approved');

  const fetchAllBlogs = async () => {
    try {
      const { data } = await api.get('/blogs/all');
      setBlogs(data.data);
    } catch (err) {
      toast.error('Failed to load blogs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllBlogs();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this blog?')) return;
    try {
      await api.delete(`/blogs/${id}`);
      toast.success('Blog deleted successfully!');
      fetchAllBlogs();
    } catch (err) {
      toast.error('Failed to delete blog.');
    }
  };

  const handleStatusUpdate = async (id, status) => {
    setActionLoading(id);
    try {
      await api.patch(`/blogs/${id}/status`, { status });
      toast.success(`Blog ${status} successfully!`);
      fetchAllBlogs();
    } catch (err) {
      toast.error('Failed to update blog status.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <PenSquare className="w-7 h-7 text-brand-400" /> Admin Blogs
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage and review articles</p>
      </div>

      <div className="flex gap-4 mb-6 border-b border-surface-border dark:border-white/10">
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-2 px-1 text-sm font-medium transition-colors ${
            activeTab === 'pending'
              ? 'text-brand-400 border-b-2 border-brand-400'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-white'
          }`}
        >
          Pending Approval ({blogs.filter(b => b.status === 'pending').length})
        </button>
        <button
          onClick={() => setActiveTab('approved')}
          className={`pb-2 px-1 text-sm font-medium transition-colors ${
            activeTab === 'approved'
              ? 'text-brand-400 border-b-2 border-brand-400'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-white'
          }`}
        >
          Approved Blogs ({blogs.filter(b => b.status === 'approved').length})
        </button>
      </div>

      {loading ? (
        <div className="h-96 skeleton rounded-2xl" />
      ) : (
        <div className="space-y-4">
          {filteredBlogs.map((blog) => (
            <div key={blog._id} className="card bg-white dark:bg-slate-800/50 p-6 flex flex-col md:flex-row gap-6">
              {blog.image && (
                <img src={blog.image} alt={blog.title} className="w-full md:w-48 h-32 object-cover rounded-xl" />
              )}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(blog.createdAt).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        blog.status === 'approved' 
                          ? 'bg-emerald-500/10 text-emerald-500' 
                          : blog.status === 'rejected'
                            ? 'bg-red-500/10 text-red-500'
                            : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        {blog.status.toUpperCase()}
                      </span>
                      <span className="text-sm font-medium text-brand-400">
                        By Dr. {blog.author?.firstName} {blog.author?.lastName}
                      </span>
                    </div>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{blog.title}</h2>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 break-all line-clamp-3">{blog.content}</p>
                    <button onClick={() => setReadingBlog(blog)} className="text-brand-400 hover:text-brand-500 font-medium text-xs mt-1">Read More →</button>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 mt-4">
                  <button
                    onClick={() => handleDelete(blog._id)}
                    className="btn-ghost text-slate-500 hover:bg-slate-500/10 flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                  {blog.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleStatusUpdate(blog._id, 'rejected')}
                        disabled={actionLoading === blog._id}
                        className="btn-ghost text-red-500 hover:bg-red-500/10 flex items-center gap-1"
                      >
                        {actionLoading === blog._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                        Reject
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(blog._id, 'approved')}
                        disabled={actionLoading === blog._id}
                        className="btn-primary flex items-center gap-1"
                      >
                        {actionLoading === blog._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        Approve
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
          {filteredBlogs.length === 0 && (
            <div className="text-center py-12 text-slate-500 bg-white dark:bg-slate-800/50 rounded-2xl border border-surface-border">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{activeTab === 'pending' ? 'No pending blogs to review.' : 'No blogs found.'}</p>
            </div>
          )}
        </div>
      )}

      {/* Modal for reading full blog */}
      {readingBlog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-surface-border flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{readingBlog.title}</h2>
              <button onClick={() => setReadingBlog(null)} className="text-slate-500 hover:text-slate-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {readingBlog.image && (
                <img src={readingBlog.image} alt={readingBlog.title} className="w-full h-64 object-cover rounded-xl" />
              )}
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span>By Dr. {readingBlog.author?.firstName} {readingBlog.author?.lastName}</span>
                <span>•</span>
                <span>{new Date(readingBlog.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 whitespace-pre-line leading-relaxed break-all w-full">{readingBlog.content}</p>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminBlogs;
