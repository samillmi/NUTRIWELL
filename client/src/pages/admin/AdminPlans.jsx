import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, Check, CreditCard, Sparkles } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';

const AdminPlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    consultations: '',
    features: '',
    gradient: 'from-brand-500 to-emerald-600',
    popular: false
  });

  const fetchPlans = async () => {
    try {
      const { data } = await api.get('/plans');
      setPlans(data.data.plans);
    } catch (err) {
      toast.error('Failed to load plans.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      price: Number(formData.price),
      consultations: Number(formData.consultations),
      features: formData.features.split(',').map(f => f.trim()).filter(f => f)
    };

    try {
      if (editingPlan) {
        await api.patch(`/plans/${editingPlan._id}`, payload);
        toast.success('Plan updated!');
      } else {
        await api.post('/plans', payload);
        toast.success('Plan created!');
      }
      setFormData({ name: '', price: '', consultations: '', features: '', gradient: 'from-brand-500 to-emerald-600', popular: false });
      setEditingPlan(null);
      fetchPlans();
    } catch (err) {
      toast.error('Failed to save plan.');
    }
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      price: plan.price,
      consultations: plan.consultations,
      features: plan.features.join(', '),
      gradient: plan.gradient || 'from-brand-500 to-emerald-600',
      popular: plan.popular || false
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this plan?')) return;
    try {
      await api.delete(`/plans/${id}`);
      toast.success('Plan deleted!');
      fetchPlans();
    } catch (err) {
      toast.error('Failed to delete plan.');
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Manage Pricing Plans</h1>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <CreditCard className="w-4 h-4" />
            <span>Billing & Plans</span>
          </div>
        </div>

        {/* Form Card */}
        <div className="card mb-10 border-brand-500/10 shadow-glow-brand/5">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <Plus className="w-5 h-5 text-brand-500" />
            {editingPlan ? 'Edit Plan' : 'Create New Plan'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">Plan Name</label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleInputChange} 
                  required 
                  className="input" 
                  placeholder="e.g. Premium Care" 
                />
              </div>
              <div>
                <label className="label">Price ($)</label>
                <input 
                  type="number" 
                  name="price" 
                  value={formData.price} 
                  onChange={handleInputChange} 
                  required 
                  className="input" 
                  placeholder="e.g. 99" 
                />
              </div>
              <div>
                <label className="label">Consultations Count</label>
                <input 
                  type="number" 
                  name="consultations" 
                  value={formData.consultations} 
                  onChange={handleInputChange} 
                  required 
                  className="input" 
                  placeholder="e.g. 4" 
                />
              </div>

              <div className="md:col-span-2">
                <label className="label">Features (comma separated)</label>
                <textarea 
                  name="features" 
                  value={formData.features} 
                  onChange={handleInputChange} 
                  required 
                  className="input min-h-[100px] py-3" 
                  placeholder="e.g. 4 Consultations, Direct Chat, AI Access" 
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-surface-border">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center">
                  <input 
                    type="checkbox" 
                    name="popular" 
                    checked={formData.popular} 
                    onChange={handleInputChange} 
                    id="popular" 
                    className="peer sr-only" 
                  />
                  <div className="w-10 h-5 bg-slate-300 dark:bg-slate-700 rounded-full peer-checked:bg-brand-500 transition-colors"></div>
                  <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5 shadow-sm"></div>
                </div>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300 group-hover:text-brand-500 transition-colors">
                  Mark as Popular
                </span>
              </label>

              <div className="flex gap-3 w-full sm:w-auto">
                {editingPlan && (
                  <button 
                    type="button" 
                    onClick={() => { 
                      setEditingPlan(null); 
                      setFormData({ name: '', price: '', consultations: '', features: '', gradient: 'from-brand-500 to-emerald-600', popular: false }); 
                    }} 
                    className="btn-secondary flex-1 sm:flex-none"
                  >
                    Cancel
                  </button>
                )}
                <button type="submit" className="btn-primary flex-1 sm:flex-none">
                  {editingPlan ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {editingPlan ? 'Update Plan' : 'Create Plan'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            [...Array(3)].map((_, i) => <div key={i} className="h-64 skeleton rounded-3xl" />)
          ) : plans.length === 0 ? (
            <div className="col-span-full py-20 text-center card bg-slate-50 dark:bg-slate-800/20 border-dashed">
              <CreditCard className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
              <p className="text-slate-500">No pricing plans created yet.</p>
            </div>
          ) : (
            plans.map(plan => (
              <div key={plan._id} className={`card-hover group overflow-visible ${plan.popular ? 'ring-2 ring-brand-500 ring-offset-4 dark:ring-offset-slate-900' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <span className="bg-brand-gradient text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-glow-teal flex items-center gap-1.5 tracking-widest uppercase whitespace-nowrap w-max">
                      <Sparkles className="w-3 h-3" /> Popular
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-brand-500 transition-colors">{plan.name}</h3>
                    <p className="text-xs text-slate-500">{plan.consultations} Consultations</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-slate-900 dark:text-white">${plan.price}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-tighter">per package</p>
                  </div>
                </div>

                <div className="space-y-3 mb-8 flex-grow">
                  {plan.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-emerald-500" />
                      </div>
                      <span className="line-clamp-1">{feat}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-end gap-2 pt-5 border-t border-surface-border">
                  <button 
                    onClick={() => handleEdit(plan)} 
                    className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-brand-500 hover:bg-brand-500/10 transition-all"
                    title="Edit Plan"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(plan._id)} 
                    className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-all"
                    title="Delete Plan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminPlans;
