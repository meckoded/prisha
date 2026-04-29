import { useState, useEffect } from 'react';
import { getAdminStats, getAdminUsers, updateUserStatus, deleteUser, getAlgorithms, getAdminSettings, updateSetting, type SystemStats, type AdminUser, type AlgorithmInfo } from '../lib/api';

interface AdminDashboardProps {
  show: boolean;
  onClose: () => void;
}

export default function AdminDashboard({ show, onClose }: AdminDashboardProps) {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [algorithms, setAlgorithms] = useState<AlgorithmInfo[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'settings'>('stats');

  useEffect(() => {
    if (!show) return;
    loadData();
  }, [show]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [s, u, a, se] = await Promise.all([
        getAdminStats(),
        getAdminUsers(),
        getAlgorithms(),
        getAdminSettings(),
      ]);
      setStats(s);
      setUsers(u.users);
      setAlgorithms(a.algorithms);
      setSettings(se.settings);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'שגיאה בטעינת נתוני מנהל');
    } finally {
      setLoading(false);
    }
  };

  const handleBlockToggle = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
    try {
      await updateUserStatus(userId, newStatus);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    } catch (err: any) {
      alert(err?.response?.data?.error || 'שגיאה בעדכון סטטוס');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('האם למחוק משתמש זה? כל הנתונים יאבדו.')) return;
    try {
      await deleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      loadData(); // Refresh stats
    } catch (err: any) {
      alert(err?.response?.data?.error || 'שגיאה במחיקת משתמש');
    }
  };

  const handleUpdateSetting = async (key: string, value: string) => {
    try {
      await updateSetting(key, value);
      setSettings(prev => ({ ...prev, [key]: value }));
    } catch (err: any) {
      alert(err?.response?.data?.error || 'שגיאה בעדכון הגדרה');
    }
  };

  if (!show) return null;

  const tabs = [
    { key: 'stats' as const, label: '📊 סטטיסטיקה' },
    { key: 'users' as const, label: '👥 משתמשים' },
    { key: 'settings' as const, label: '⚙️ הגדרות' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold">🛡️ פאנל ניהול</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2.5 text-sm font-semibold text-center border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">טוען...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">{error}</div>
          ) : activeTab === 'stats' ? (
            /* Stats Tab */
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="משתמשים" value={stats?.totalUsers} icon="👥" />
                <StatCard label="פעילים" value={stats?.activeUsers} icon="✅" />
                <StatCard label="אירועים" value={stats?.totalEvents} icon="📝" />
                <StatCard label="תחזיות" value={stats?.totalPredictions} icon="🔮" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">אלגוריתמים ({algorithms.length})</h3>
                <div className="space-y-2">
                  {algorithms.map(algo => (
                    <div key={algo.name} className="bg-gray-50 border border-gray-200 rounded-md p-3">
                      <p className="text-sm font-semibold text-gray-800">{algo.name}</p>
                      <p className="text-xs text-gray-500">{algo.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : activeTab === 'users' ? (
            /* Users Tab */
            <div className="space-y-2">
              {users.map(user => (
                <div key={user.id} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-md p-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {user.name || user.email}
                      {user.role === 'admin' && <span className="text-xs text-purple-600 mr-2">👑 מנהל</span>}
                    </p>
                    <p className="text-xs text-gray-500">{user.email} · נרשם {new Date(user.created_at).toLocaleDateString('he-IL')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {user.status}
                    </span>
                    <button
                      onClick={() => handleBlockToggle(user.id, user.status)}
                      className="text-xs border rounded-md px-2 py-1 hover:bg-gray-100"
                    >
                      {user.status === 'active' ? '🚫' : '✅'}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-xs text-red-600 border border-red-200 rounded-md px-2 py-1 hover:bg-red-50"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
              {users.length === 0 && <p className="text-center py-4 text-gray-500">אין משתמשים</p>}
            </div>
          ) : (
            /* Settings Tab */
            <div className="space-y-4">
              <SettingRow
                label="שם מערכת"
                value={settings.system_name || 'פרישה'}
                onSave={(v) => handleUpdateSetting('system_name', v)}
              />
              <SettingRow
                label="כמות חודשי תחזית עתידיים"
                value={settings.max_predictions_future_months || '6'}
                onSave={(v) => handleUpdateSetting('max_predictions_future_months', v)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value?: number; icon: string }) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
      <p className="text-2xl">{icon}</p>
      <p className="text-2xl font-bold text-blue-800">{value ?? '-'}</p>
      <p className="text-xs text-blue-600">{label}</p>
    </div>
  );
}

function SettingRow({ label, value, onSave }: { label: string; value: string; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);

  const handleSave = () => {
    onSave(val);
    setEditing(false);
  };

  return (
    <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-md p-3">
      <span className="text-sm text-gray-700">{label}</span>
      <div className="flex items-center gap-2">
        {editing ? (
          <>
            <input
              type="text"
              value={val}
              onChange={e => setVal(e.target.value)}
              className="text-sm border border-gray-300 rounded-md px-2 py-1 w-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button onClick={handleSave} className="text-xs bg-blue-600 text-white px-2 py-1 rounded-md">שמור</button>
            <button onClick={() => setEditing(false)} className="text-xs text-gray-500">בטל</button>
          </>
        ) : (
          <>
            <span className="text-sm font-semibold text-gray-800">{value}</span>
            <button onClick={() => { setVal(value); setEditing(true); }} className="text-xs text-blue-600 hover:text-blue-800 border rounded-md px-2 py-1">
              ✏️
            </button>
          </>
        )}
      </div>
    </div>
  );
}
