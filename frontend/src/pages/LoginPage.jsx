import React, { useState } from 'react';
import { Flame, ShieldCheck, Key, Mail, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Veuillez renseigner votre email et votre mot de passe.');
      return;
    }

    try {
      setIsLoading(true);
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Identifiants invalides. Veuillez vérifier votre email et mot de passe.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-eco-bg flex flex-col justify-center items-center p-4 selection:bg-eco-light">
      <div className="max-w-md w-full bg-white rounded-2xl border border-eco-border shadow-xl p-8">
        
        {/* LOGO & EN-TÊTE */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-eco-dark text-white shadow-md shadow-emerald-950/20 mb-3">
            <Flame className="w-8 h-8 text-eco-primary" />
          </div>
          <h1 className="text-2xl font-bold text-eco-dark tracking-tight">EcoCharge</h1>
          <p className="text-sm text-gray-500 mt-1">
            Système Intelligent de Supervision Méthanisation & Énergie
          </p>
          <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-eco-light px-2.5 py-0.5 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5 text-eco-primary" />
            Accès Sécurisé — Projet Académique IoT
          </div>
        </div>

        {/* MESSAGE D'ERREUR */}
        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* FORMULAIRE */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Identifiant / Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Entrez votre email..."
                autoComplete="username"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-eco-primary focus:border-transparent text-sm text-gray-900 transition-shadow"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Mot de passe
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Entrez votre mot de passe..."
                autoComplete="current-password"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-eco-primary focus:border-transparent text-sm text-gray-900 transition-shadow"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full eco-btn-primary py-2.5 text-sm font-semibold tracking-wide flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? (
              <span>Authentification en cours...</span>
            ) : (
              <>
                <span>Accéder au Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>


      </div>

      {/* FOOTER */}
      <footer className="mt-6 text-center text-xs text-gray-500">
        EcoCharge v1.0.0 — Licence IoT & Systèmes Embarqués — 2026
      </footer>
    </div>
  );
}
