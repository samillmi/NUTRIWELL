import { useState, useEffect } from 'react';
import { PenSquare, Image as ImageIcon, Plus, Clock, Check, X, Loader2, Trash2 } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';

const DoctorBlogs = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedBlogId, setSelectedBlogId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image: ''
  });

  const fetchMyBlogs = async () => {
    try {
      const { data } = await api.get('/blogs/my');
      setBlogs(data.data);
    } catch (err) {
      toast.error('Failed to load blogs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyBlogs();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this blog?')) return;
    try {
      await api.delete(`/blogs/${id}`);
      toast.success('Blog deleted successfully!');
      fetchMyBlogs();
    } catch (err) {
      toast.error('Failed to delete blog.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      toast.error('Title and content are required!');
      return;
    }
    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('content', formData.content);
      if (imageFile) {
        data.append('image', imageFile);
      } else if (formData.image) {
        data.append('image', formData.image);
      }

      const config = {
        headers: { 'Content-Type': 'multipart/form-data' }
      };

      if (selectedBlogId) {
        await api.patch(`/blogs/${selectedBlogId}`, data, config);
        toast.success('Blog updated and resubmitted!');
      } else {
        await api.post('/blogs', data, config);
        toast.success('Blog submitted for approval!');
      }
      setShowModal(false);
      setFormData({ title: '', content: '', image: '' });
      setImageFile(null);
      setSelectedBlogId(null);
      fetchMyBlogs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save blog.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <PenSquare className="w-7 h-7 text-brand-400" /> My Blogs
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Share your knowledge</p>
        </div>
        <button onClick={() => { setFormData({ title: '', content: '', image: '' }); setSelectedBlogId(null); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Post
        </button>
      </div>

      {loading ? (
        <div className="h-96 skeleton rounded-2xl" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map((blog) => (
            <div key={blog._id} className="card bg-white dark:bg-slate-800/50 overflow-hidden flex flex-col">
              {blog.image && (
                <img src={blog.image} alt={blog.title} className="w-full h-48 object-cover" />
              )}
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ${
                    blog.status === 'approved' 
                      ? 'bg-emerald-500/10 text-emerald-500' 
                      : blog.status === 'rejected'
                        ? 'bg-red-500/10 text-red-500'
                        : 'bg-amber-500/10 text-amber-500'
                  }`}>
                    {blog.status === 'approved' && <Check className="w-3 h-3" />}
                    {blog.status === 'rejected' && <X className="w-3 h-3" />}
                    {blog.status === 'pending' && <Clock className="w-3 h-3" />}
                    {blog.status.toUpperCase()}
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(blog.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{blog.title}</h2>
                <div className="max-h-20 overflow-hidden mb-4 w-full">
                  <p className="text-sm text-slate-600 dark:text-slate-400 break-all w-full">{blog.content}</p>
                </div>
                <div className="flex justify-end mt-auto pt-4 border-t border-surface-border dark:border-white/5">
                  <button
                    onClick={() => {
                      setFormData({ title: blog.title, content: blog.content, image: blog.image || '' });
                      setSelectedBlogId(blog._id);
                      setShowModal(true);
                    }}
                    className="btn-ghost p-1.5 rounded-lg text-brand-400 hover:bg-brand-500/10 flex items-center gap-1 text-xs font-semibold"
                  >
                    <PenSquare className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(blog._id)}
                    className="btn-ghost p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 flex items-center gap-1 text-xs font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
          {blogs.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-500">
              <PenSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>You haven't written any blogs yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-surface-border flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Create New Post</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-surface-border dark:border-white/10 bg-transparent text-slate-900 dark:text-white"
                  placeholder="Enter blog title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Image</label>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files[0])}
                    className="text-sm text-slate-500 dark:text-slate-400
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-xl file:border-0
                      file:text-xs file:font-semibold
                      file:bg-brand-500/10 file:text-brand-500
                      hover:file:bg-brand-500/20"
                  />
                  <p className="text-xs text-slate-500">Or use a URL:</p>
                  <div className="relative">
                    <ImageIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      className="w-full pl-10 pr-4 py-2 rounded-xl border border-surface-border dark:border-white/10 bg-transparent text-slate-900 dark:text-white"
                      placeholder="https://images.unsplash.com/..."
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Content</label>
                <textarea
                  rows={6}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-surface-border dark:border-white/10 bg-transparent text-slate-900 dark:text-white"
                  placeholder="Write your article here..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-ghost">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-2">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenSquare className="w-4 h-4" />}
                  Submit for Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default DoctorBlogs;
