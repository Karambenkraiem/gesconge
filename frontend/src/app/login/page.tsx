'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { settingsAPI } from '../../lib/api';
import toast from 'react-hot-toast';
import { LogIn, Eye, EyeOff, Monitor } from 'lucide-react';
import { ROLE_LABELS, Role } from '../../types';

const DEMO_PASSWORD = '123456';

interface DemoUser {
  matricule: string;
  nom: string;
  prenom: string;
  role: Role;
}

export default function LoginPage() {
  const [matricule, setMatricule] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoUsers, setDemoUsers] = useState<DemoUser[]>([]);
  const { login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    settingsAPI.getDemoMode()
      .then(res => setDemoUsers(res.data.enabled ? res.data.users : []))
      .catch(() => setDemoUsers([]));
  }, []);

  const doLogin = async (m: string, p: string) => {
    setLoading(true);
    try {
      await login(m, p);
      router.replace('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Identifiants incorrects');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matricule || !password) { toast.error('Remplissez tous les champs'); return; }
    doLogin(matricule, password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="absolute rounded-full border border-white"
            style={{ width: `${(i+1)*200}px`, height: `${(i+1)*200}px`,
              top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
        ))}
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-4 border border-white/30">
            <span className="text-3xl font-black text-white">G</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">GesConge</h1>
          <p className="text-blue-200 text-sm mt-1">Gestion des Congés — Équipes A/B/C/D</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 slide-up">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Connexion</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">
                Matricule
              </label>
              <input
                type="text"
                value={matricule}
                onChange={e => setMatricule(e.target.value)}
                placeholder="Ex: OA001"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50 pr-12"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><LogIn size={18} /> Se connecter</>
              )}
            </button>
          </form>
        </div>

        {demoUsers.length > 0 && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mt-4 border border-white/20">
            <div className="flex items-center gap-1.5 text-amber-200 text-xs font-bold mb-3">
              <Monitor size={14} /> Mode démonstration — accès rapide
            </div>
            <div className="grid grid-cols-2 gap-2">
              {demoUsers.map(u => (
                <button
                  key={u.matricule}
                  type="button"
                  disabled={loading}
                  onClick={() => doLogin(u.matricule, DEMO_PASSWORD)}
                  className="text-left bg-white/90 hover:bg-white rounded-xl px-3 py-2 transition-all active:scale-95 disabled:opacity-50"
                >
                  <p className="text-xs font-bold text-gray-800 truncate">{u.prenom} {u.nom}</p>
                  <p className="text-[10px] text-gray-500 truncate">{ROLE_LABELS[u.role]} · {u.matricule}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-blue-200/70 text-xs mt-6">
          Système de gestion des congés © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
