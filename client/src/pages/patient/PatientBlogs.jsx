import { useState, useEffect } from 'react';
import { BookOpen, Clock, X } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';

const PatientBlogs = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [readingBlog, setReadingBlog] = useState(null);

  const fetchApprovedBlogs = async () => {
    try {
      const { data } = await api.get('/blogs');
      setBlogs(data.data);
    } catch (err) {
      toast.error('Failed to load blogs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovedBlogs();
  }, []);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <BookOpen className="w-7 h-7 text-brand-400" /> Healthy Living Blogs
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Articles by our expert doctors</p>
      </div>

      {loading ? (
        <div className="h-96 skeleton rounded-2xl" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map((blog) => (
            <div key={blog._id} className="card bg-white dark:bg-slate-800/50 overflow-hidden flex flex-col hover:shadow-lg transition-all border border-surface-border dark:border-white/5">
              {blog.image && (
                <img src={blog.image} alt={blog.title} className="w-full h-48 object-cover" />
              )}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {blog.author?.avatar ? (
                      <img src={blog.author.avatar} alt={blog.author.firstName} className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-brand-gradient flex items-center justify-center text-[10px] font-bold text-white">
                        {blog.author?.firstName?.[0]}{blog.author?.lastName?.[0]}
                      </div>
                    )}
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Dr. {blog.author?.firstName} {blog.author?.lastName}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{blog.title}</h2>
                  <div className="max-h-20 overflow-hidden mb-4 w-full">
                    <p className="text-sm text-slate-600 dark:text-slate-400 break-all w-full">{blog.content}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {new Date(blog.createdAt).toLocaleDateString()}
                  </span>
                  <button onClick={() => setReadingBlog(blog)} className="text-brand-400 hover:text-brand-500 font-medium">Read More →</button>
                </div>
              </div>
            </div>
          ))}
          {blogs.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-500">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No articles published yet.</p>
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

export default PatientBlogs;
