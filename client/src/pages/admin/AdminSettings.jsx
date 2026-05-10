import { useState } from 'react';
import { Settings, Shield, Bell, Key, Globe, Save } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import toast from 'react-hot-toast';

const AdminSettings = () => {
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      toast.success('Settings updated successfully!');
      setSaving(false);
    }, 1000);
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings className="w-7 h-7 text-red-400" /> System Settings
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage global platform configurations</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn bg-red-500 text-white hover:bg-red-600">
          <Save className="w-4 h-4 mr-2" /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 space-y-2">
          <button className="w-full flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 font-medium">
            <Globe className="w-5 h-5" /> General Settings
          </button>
          <button className="w-full flex items-center gap-3 p-4 hover:bg-surface/60 rounded-xl text-slate-400 font-medium transition-colors">
            <Shield className="w-5 h-5" /> Security & Roles
          </button>
          <button className="w-full flex items-center gap-3 p-4 hover:bg-surface/60 rounded-xl text-slate-400 font-medium transition-colors">
            <Bell className="w-5 h-5" /> Notifications
          </button>
          <button className="w-full flex items-center gap-3 p-4 hover:bg-surface/60 rounded-xl text-slate-400 font-medium transition-colors">
            <Key className="w-5 h-5" /> API Keys
          </button>
        </div>

        <div className="col-span-2 space-y-6">
          <div className="card space-y-5">
            <h2 className="text-lg font-bold text-white mb-4">General Configuration</h2>
            
            <div>
              <label className="label">Platform Name</label>
              <input type="text" className="input" defaultValue="NutriTrack AI" />
            </div>

            <div>
              <label className="label">Support Email</label>
              <input type="email" className="input" defaultValue="support@nutritrack.demo" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Default Currency</label>
                <select className="input">
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="DZD">DZD (DA)</option>
                </select>
              </div>
              <div>
                <label className="label">Timezone</label>
                <select className="input">
                  <option value="UTC">UTC</option>
                  <option value="Africa/Algiers">Africa/Algiers (CET)</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-surface-border">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-surface-border bg-surface text-red-500 focus:ring-red-500" />
                <span className="text-sm text-slate-200">Allow new doctor registrations</span>
              </label>
            </div>
            
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-surface-border bg-surface text-red-500 focus:ring-red-500" />
                <span className="text-sm text-slate-200">Enable AI Chatbot globally</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminSettings;
