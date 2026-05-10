import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Save, X, Plus, Trash2, UtensilsCrossed, Calendar } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { createDietPlan } from '../../api/dietApi';
import { getMyPatients } from '../../api/doctorApi';
import toast from 'react-hot-toast';

const DietPlanBuilder = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('patientId');
  const [patients, setPatients] = useState([]);
  const [saving, setSaving] = useState(false);

  // Form State
  const [form, setForm] = useState({
    title: '',
    patient: '',
    description: '',
    category: 'weight_loss',
    durationWeeks: 4,
    startDate: new Date().toISOString().split('T')[0],
    status: 'active',
    isPublic: false,
    price: 0
  });

  // Simple day 1 template
  const [meals, setMeals] = useState([
    { id: 1, type: 'breakfast', time: '08:00', instructions: '', foods: [{ name: '', quantity: 100, unit: 'g' }] }
  ]);

  useEffect(() => {
    getMyPatients()
      .then(({ data }) => setPatients(data.data.patients))
      .catch(() => toast.error('Failed to load patients'));
  }, []);

  useEffect(() => {
    if (patientId) {
      setForm(prev => ({ ...prev, patient: patientId }));
    }
  }, [patientId]);

  const handleAddMeal = () => {
    setMeals([...meals, { id: Date.now(), type: 'lunch', time: '13:00', instructions: '', foods: [{ name: '', quantity: 100, unit: 'g' }] }]);
  };

  const handleMealChange = (id, field, value) => {
    setMeals(meals.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const handleFoodChange = (mealId, foodIdx, field, value) => {
    setMeals(meals.map(m => {
      if (m.id !== mealId) return m;
      const newFoods = [...m.foods];
      newFoods[foodIdx] = { ...newFoods[foodIdx], [field]: value };
      return { ...m, foods: newFoods };
    }));
  };

  const addFood = (mealId) => {
    setMeals(meals.map(m => {
      if (m.id !== mealId) return m;
      return { ...m, foods: [...m.foods, { name: '', quantity: 100, unit: 'g' }] };
    }));
  };

  const removeFood = (mealId, foodIdx) => {
    setMeals(meals.map(m => {
      if (m.id !== mealId) return m;
      return { ...m, foods: m.foods.filter((_, i) => i !== foodIdx) };
    }));
  };

  const removeMeal = (id) => {
    setMeals(meals.filter(m => m.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.isPublic && !form.patient) return toast.error('Please select a patient or make the plan public');
    if (!form.title) return toast.error('Please enter a title');

    setSaving(true);
    try {
      // Build payload matching DietPlan schema
      const payload = {
        ...form,
        patient: form.isPublic ? undefined : form.patient,
        weeklyPlan: [{
          dayNumber: 1,
          meals: meals.map(m => ({
            type: m.type,
            time: m.time,
            instructions: m.instructions,
            foods: m.foods.filter(f => f.name.trim() !== '')
          }))
        }]
      };

      await createDietPlan(payload);
      toast.success('Diet plan created successfully!');
      navigate('/doctor/plans'); // Needs this route added
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create plan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <UtensilsCrossed className="w-7 h-7 text-brand-400" /> Plan Builder
          </h1>
          <p className="text-slate-400 text-sm mt-1">Create a customized diet plan</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/doctor/plans')} className="btn-secondary">
            <X className="w-4 h-4" /> Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving} className="btn-primary">
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Plan'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: General Info */}
        <div className="col-span-1 space-y-6">
          <div className="card space-y-4">
            <h2 className="text-sm font-semibold text-white border-b border-surface-border pb-3">General Information</h2>
            
            <div>
              <label className="label">Plan Title</label>
              <input className="input" placeholder="e.g. 4-Week Fat Loss" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
            </div>

            <div>
              <label className="label flex items-center gap-2 cursor-pointer mb-2">
                <input 
                  type="checkbox" 
                  checked={form.isPublic}
                  onChange={(e) => setForm({...form, isPublic: e.target.checked, patient: e.target.checked ? '' : form.patient})}
                  className="w-4 h-4 text-brand-500 rounded focus:ring-brand-500"
                />
                <span className="text-white font-semibold">Make this a Public Template</span>
              </label>
              <p className="text-xs text-slate-400 mb-4">Public templates can be purchased by any patient on the marketplace.</p>
            </div>

            {form.isPublic ? (
              <div>
                <label className="label">Price ($)</label>
                <input className="input" type="number" min="0" placeholder="0 = Free" value={form.price} onChange={e => setForm({...form, price: Number(e.target.value)})} />
              </div>
            ) : (
              <div>
                <label className="label">Assign to Patient</label>
                <select className="input" value={form.patient} onChange={e => setForm({...form, patient: e.target.value})} required={!form.isPublic}>
                  <option value="">Select a patient...</option>
                  {patients.map(p => (
                    <option key={p._id} value={p._id}>{p.firstName} {p.lastName} ({p.email})</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                <option value="weight_loss">Weight Loss</option>
                <option value="weight_gain">Weight Gain</option>
                <option value="maintenance">Maintenance</option>
                <option value="diabetic">Diabetic</option>
                <option value="cardiac">Cardiac</option>
                <option value="sports">Sports</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Duration (Weeks)</label>
                <input className="input" type="number" min="1" max="52" value={form.durationWeeks} onChange={e => setForm({...form, durationWeeks: Number(e.target.value)})} />
              </div>
              <div>
                <label className="label">Start Date</label>
                <input className="input" type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} />
              </div>
            </div>

            <div>
              <label className="label">Description / Doctor Notes</label>
              <textarea className="input" rows="4" placeholder="Instructions for the patient..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            </div>
          </div>
        </div>

        {/* Right: Meals Builder (Day 1 Template) */}
        <div className="col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-accent-400" /> Daily Meal Template (Day 1)
            </h2>
            <button onClick={handleAddMeal} className="btn-sm btn-ghost border border-brand-500/30 text-brand-400">
              <Plus className="w-3 h-3" /> Add Meal
            </button>
          </div>

          {meals.map((meal, index) => (
            <div key={meal.id} className="card p-5 animate-fade-in border-l-4 border-l-brand-500">
              <div className="flex gap-4 items-start mb-4">
                <div className="flex-1 grid grid-cols-3 gap-4">
                  <div>
                    <label className="label">Meal Type</label>
                    <select className="input" value={meal.type} onChange={e => handleMealChange(meal.id, 'type', e.target.value)}>
                      <option value="breakfast">Breakfast</option>
                      <option value="mid_morning_snack">Mid-Morning Snack</option>
                      <option value="lunch">Lunch</option>
                      <option value="afternoon_snack">Afternoon Snack</option>
                      <option value="dinner">Dinner</option>
                      <option value="evening_snack">Evening Snack</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Time</label>
                    <input className="input" type="time" value={meal.time} onChange={e => handleMealChange(meal.id, 'time', e.target.value)} />
                  </div>
                  <div className="col-span-3">
                    <label className="label">Preparation Instructions</label>
                    <input className="input" placeholder="e.g. Boil eggs for 8 mins" value={meal.instructions} onChange={e => handleMealChange(meal.id, 'instructions', e.target.value)} />
                  </div>
                </div>
                <button onClick={() => removeMeal(meal.id)} className="p-2 text-slate-500 hover:text-red-400 bg-surface rounded-xl mt-6">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Foods list */}
              <div className="space-y-2 bg-surface/50 p-4 rounded-xl border border-surface-border">
                <div className="flex items-center justify-between mb-2">
                  <label className="label !mb-0">Foods</label>
                  <button onClick={() => addFood(meal.id)} className="text-[10px] uppercase font-bold text-brand-400 hover:text-brand-300">
                    + Add Item
                  </button>
                </div>
                {meal.foods.map((food, fIdx) => (
                  <div key={fIdx} className="flex gap-3 items-center">
                    <input className="input flex-1 py-1.5 text-xs" placeholder="Food name (e.g. Oatmeal)" value={food.name} onChange={e => handleFoodChange(meal.id, fIdx, 'name', e.target.value)} />
                    <input className="input w-24 py-1.5 text-xs" type="number" placeholder="Qty" value={food.quantity} onChange={e => handleFoodChange(meal.id, fIdx, 'quantity', Number(e.target.value))} />
                    <select className="input w-20 py-1.5 text-xs" value={food.unit} onChange={e => handleFoodChange(meal.id, fIdx, 'unit', e.target.value)}>
                      <option value="g">g</option>
                      <option value="ml">ml</option>
                      <option value="tbsp">tbsp</option>
                      <option value="cup">cup</option>
                      <option value="piece">piece</option>
                    </select>
                    <button onClick={() => removeFood(meal.id, fIdx)} className="text-slate-500 hover:text-red-400 p-1">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {meals.length === 0 && (
            <div className="text-center py-8 card border-dashed border-2">
              <p className="text-sm text-slate-400">No meals added to this day.</p>
              <button onClick={handleAddMeal} className="text-brand-400 text-xs font-semibold mt-2 hover:underline">Add Meal</button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DietPlanBuilder;
