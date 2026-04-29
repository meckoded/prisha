import { useState } from 'react';
import { login, register, setToken, clearToken, type User } from '../lib/api';

interface AuthProps {
  user: User | null;
  onAuthChange: (user: User | null) => void;
}

export default function AuthModal({ user, onAuthChange }: AuthProps) {
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let result: { user: User; token: string };
      if (isRegister) {
        result = await register(email, password, name || undefined);
      } else {
        result = await login(email, password);
      }
      setToken(result.token);
      onAuthChange(result.user);
      setShowLogin(false);
      setEmail('');
      setPassword('');
      setName('');
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'שגיאה בהתחברות');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearToken();
    onAuthChange(null);
  };

  if (user) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <span className="text-gray-600">{user.name || user.email}</span>
        <button onClick={handleLogout} className="text-gray-500 hover:text-red-600 border border-gray-200 rounded-md px-3 py-1">
          התנתק
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowLogin(true)}
        className="text-sm text-blue-600 hover:text-blue-800 border border-blue-200 rounded-md px-3 py-1.5 hover:bg-blue-50"
      >
        התחבר / הרשם
      </button>

      {showLogin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowLogin(false)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">{isRegister ? 'הרשמה' : 'התחברות'}</h2>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">אימייל</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  dir="ltr"
                />
              </div>

              {isRegister && (
                <div>
                  <label className="block text-sm text-gray-600 mb-1">שם</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm text-gray-600 mb-1">סיסמה</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  dir="ltr"
                />
              </div>

              {error && <p className="text-red-600 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded-md text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'מבצע...' : isRegister ? 'הירשם' : 'התחבר'}
              </button>
            </form>

            <button
              onClick={() => { setIsRegister(!isRegister); setError(''); }}
              className="text-sm text-blue-600 hover:text-blue-800 mt-3"
            >
              {isRegister ? 'כבר רשום? התחבר' : 'אין לך חשבון? הירשם'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
