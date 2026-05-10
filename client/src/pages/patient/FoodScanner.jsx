import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { Upload, ScanLine, Loader2, CheckCircle2, AlertCircle, X, Flame, Beef, Wheat, Droplet } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { scanFood } from '../../api/aiApi';
import toast from 'react-hot-toast';

const MacroBar = ({ label, value, max, color, icon: Icon }) => (
  <div>
    <div className="flex items-center justify-between mb-1.5">
      <div className="flex items-center gap-1.5">
        <Icon className={`w-3.5 h-3.5 ${color}`} />
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <span className={`text-xs font-bold ${color}`}>{value}g</span>
    </div>
    <div className="h-2 rounded-full bg-surface-border overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.min(100, (value / max) * 100)}%`, background: `var(--tw-gradient-stops)` }}
      />
    </div>
  </div>
);

const FoodScanner = () => {
  const [unlocked, setUnlocked] = useState(false);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  const [dragOver, setDragOver]   = useState(false);
  const [preview,  setPreview]    = useState(null);
  const [file,     setFile]       = useState(null);
  const [loading,  setLoading]    = useState(false);
  const [result,   setResult]     = useState(null);
  const [mealType, setMealType]   = useState('lunch');
  const inputRef = useRef(null);

  useEffect(() => {
    const checkUnlock = async () => {
      try {
        const { data } = await api.get('/bookings/patient');
        const hasBought = data.data.bookings.some(b => b.type === 'scanner' && b.status === 'confirmed');
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
            <ScanLine className="w-16 h-16 text-brand-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">Unlock AI Food Scanner</h1>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              This premium feature allows you to scan your meals and get instant nutrition facts.
            </p>
            <div className="text-3xl font-bold text-brand-400 mb-6">$19.00</div>
            <button
              onClick={() => navigate(`/patient/checkout?type=scanner&price=19`)}
              className="btn-primary w-full py-3"
            >
              Buy Now to Unlock
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const handleFile = useCallback((f) => {
    if (!f || !f.type.startsWith('image/')) {
      toast.error('Please upload a valid image file.');
      return;
    }
    setFile(f);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(f);
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleScan = async () => {
    if (!file) return;
    const form = new FormData();
    form.append('image', file);
    form.append('mealType', mealType);

    setLoading(true);
    try {
      const { data } = await scanFood(form);
      setResult(data.data.scan);
      toast.success(`Detected ${data.data.scan.detectedItems.length} food item(s)!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Scan failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setFile(null); setPreview(null); setResult(null); };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ScanLine className="w-7 h-7 text-brand-400" /> AI Food Scanner
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Upload a photo of your meal — YOLOv8 will detect food items and calculate nutrition
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* ── Left: Upload area ──────────────────────────────────────── */}
          <div className="space-y-4">
            {!preview ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`card flex flex-col items-center justify-center gap-4 py-16 cursor-pointer
                            border-2 border-dashed transition-all duration-300
                            ${dragOver
                              ? 'border-brand-500 bg-brand-500/10 shadow-glow-teal'
                              : 'border-surface-border hover:border-brand-500/50 hover:bg-brand-500/5'}`}
              >
                <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20
                                flex items-center justify-center">
                  <Upload className="w-8 h-8 text-brand-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-white">Drop your food photo here</p>
                  <p className="text-xs text-slate-500 mt-1">or click to browse · JPG, PNG, WebP up to 10 MB</p>
                </div>
                <input ref={inputRef} type="file" accept="image/*" className="hidden"
                       onChange={(e) => handleFile(e.target.files[0])} />
              </div>
            ) : (
              <div className="card p-0 overflow-hidden relative">
                <img src={preview} alt="Food preview" className="w-full h-64 object-cover" />
                {result?.annotatedImageUrl && (
                  <img src={result.annotatedImageUrl} alt="Annotated"
                       className="w-full h-64 object-cover absolute inset-0 transition-opacity" />
                )}
                <button onClick={reset}
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-surface-card/90
                                   border border-surface-border flex items-center justify-center
                                   hover:border-red-500/50 transition-all">
                  <X className="w-4 h-4 text-slate-300" />
                </button>
                {result && (
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-surface-card/95
                                  to-transparent p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-brand-400" />
                      <span className="text-xs font-semibold text-brand-300">
                        {result.detectedItems.length} items detected
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Meal type picker */}
            <div>
              <label className="label">Meal Type</label>
              <div className="grid grid-cols-4 gap-2">
                {['breakfast','lunch','dinner','snack'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setMealType(t)}
                    className={`py-2 rounded-xl text-xs font-medium capitalize transition-all
                      ${mealType === t
                        ? 'bg-brand-500/20 text-brand-300 border border-brand-500/40'
                        : 'bg-surface-card border border-surface-border text-slate-400 hover:border-brand-500/30'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleScan}
              disabled={!file || loading}
              className="btn-primary w-full py-3 text-base"
            >
              {loading
                ? <><Loader2 className="w-5 h-5 animate-spin" /> Analysing with YOLOv8...</>
                : <><ScanLine className="w-5 h-5" /> Scan Food</>}
            </button>
          </div>

          {/* ── Right: Results ─────────────────────────────────────────── */}
          <div className="space-y-4">
            {!result ? (
              <div className="card flex flex-col items-center justify-center py-16 text-center gap-4 border-dashed border-2">
                <ScanLine className="w-12 h-12 text-slate-600" />
                <div>
                  <p className="text-sm font-medium text-slate-400">Results will appear here</p>
                  <p className="text-xs text-slate-600 mt-1">Upload a food image and click Scan</p>
                </div>
              </div>
            ) : (
              <>
                {/* Calorie summary */}
                <div className="card bg-brand-gradient border-0 shadow-glow-teal">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-white/90">Total Calories</p>
                    <Flame className="w-5 h-5 text-white/80" />
                  </div>
                  <p className="text-5xl font-bold text-white mb-1">
                    {Math.round(result.totalNutrition.calories)}
                  </p>
                  <p className="text-xs text-white/70">kcal estimated</p>
                </div>

                {/* Macros */}
                <div className="card space-y-4">
                  <h3 className="text-sm font-semibold text-white">Macronutrients</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="flex items-center gap-1 text-slate-400"><Beef className="w-3.5 h-3.5 text-brand-400" /> Protein</span>
                        <span className="font-bold text-brand-400">{Math.round(result.totalNutrition.proteinG)}g</span>
                      </div>
                      <div className="h-2 rounded-full bg-surface-border overflow-hidden">
                        <div className="h-full bg-brand-500 rounded-full" style={{ width: `${Math.min(100,(result.totalNutrition.proteinG/50)*100)}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="flex items-center gap-1 text-slate-400"><Wheat className="w-3.5 h-3.5 text-accent-400" /> Carbohydrates</span>
                        <span className="font-bold text-accent-400">{Math.round(result.totalNutrition.carbohydrateG)}g</span>
                      </div>
                      <div className="h-2 rounded-full bg-surface-border overflow-hidden">
                        <div className="h-full bg-accent-500 rounded-full" style={{ width: `${Math.min(100,(result.totalNutrition.carbohydrateG/250)*100)}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="flex items-center gap-1 text-slate-400"><Droplet className="w-3.5 h-3.5 text-amber-400" /> Fat</span>
                        <span className="font-bold text-amber-400">{Math.round(result.totalNutrition.fatG)}g</span>
                      </div>
                      <div className="h-2 rounded-full bg-surface-border overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(100,(result.totalNutrition.fatG/65)*100)}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detected items */}
                <div className="card">
                  <h3 className="text-sm font-semibold text-white mb-3">Detected Items</h3>
                  <div className="space-y-2">
                    {result.detectedItems.map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl
                                              bg-surface/60 border border-surface-border">
                        <div>
                          <p className="text-xs font-semibold text-white capitalize">{item.label}</p>
                          <p className="text-[10px] text-slate-500">
                            ~{item.estimatedGrams}g · {Math.round(item.confidence * 100)}% confidence
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-orange-400">
                            {Math.round(item.nutrition.calories)} kcal
                          </p>
                          <p className="text-[10px] text-slate-500">
                            P:{Math.round(item.nutrition.proteinG)}g C:{Math.round(item.nutrition.carbohydrateG)}g
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-600 mt-3 text-center">
                    Processed in {result.processingTimeMs}ms · {result.modelVersion}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FoodScanner;
