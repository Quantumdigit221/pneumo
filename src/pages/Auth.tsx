import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Wind, Mail, Lock, Stethoscope, HeartPulse, ShieldCheck, UserCheck } from 'lucide-react';

export const Auth: React.FC = () => {
  const { login } = useStore();
  const [email, setEmail] = useState('doc@chrein.sn');
  const [password, setPassword] = useState('password');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Security: Brute-force & rate-limiting protection
  const [failedAttempts, setFailedAttempts] = useState(() => {
    try {
      return Number(sessionStorage.getItem('auth_failed_attempts') || 0);
    } catch {
      return 0;
    }
  });
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  useEffect(() => {
    if (lockoutSeconds > 0) {
      const timer = setTimeout(() => setLockoutSeconds(s => s - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [lockoutSeconds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail) return;

    setSubmitting(true);
    setErrorMsg('');

    const ok = await login(trimmedEmail, password);
    if (!ok) {
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);
      try {
        sessionStorage.setItem('auth_failed_attempts', String(nextAttempts));
      } catch {
        // ignore storage error in sandbox
      }

      if (nextAttempts >= 5) {
        setLockoutSeconds(30);
        setErrorMsg('Sécurité renforcée : trop de tentatives erronées. Patienter 30 secondes.');
      } else {
        setErrorMsg(`Identifiants non reconnus. Essayez l'un des accès rapides ci-dessous.`);
      }
    } else {
      try {
        sessionStorage.removeItem('auth_failed_attempts');
      } catch {
        // ignore
      }
    }
    setSubmitting(false);
  };

  const handleQuickLogin = (emailAddress: string, pass = 'password') => {
    setEmail(emailAddress);
    setPassword(pass);
    login(emailAddress, pass);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden">
        {/* Brand visual header */}
        <div className="p-6 bg-gradient-to-r from-teal-800 to-slate-900 text-white text-center space-y-2">
          <div className="w-12 h-12 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center mx-auto shadow-md">
            <Wind className="w-6 h-6 text-teal-300" />
          </div>
          <div>
            <span className="text-3xs font-extrabold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-200 uppercase tracking-widest border border-teal-400/30">
              CHREIN • Kaolack
            </span>
            <h1 className="font-black text-lg tracking-tight text-white mt-1">
              Pneumologie & Maladies Infectieuses
            </h1>
            <p className="text-xxs text-teal-100/80">
              Dossier Patient Informatisé Intelligent & Sécurisé
            </p>
          </div>
        </div>

        {/* Content & Sign In Forms */}
        <div className="p-6 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl font-medium">
                {errorMsg}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xxs font-extrabold text-slate-500 uppercase tracking-wider">
                Email Professionnel
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="w-4 h-4 text-slate-400" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="praticien@chrein.sn"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-xs outline-none focus:bg-white focus:border-teal-500 font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xxs font-extrabold text-slate-500 uppercase tracking-wider">
                Mot de passe
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="w-4 h-4 text-slate-400" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-xs outline-none focus:bg-white focus:border-teal-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || lockoutSeconds > 0}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-xs transition-all cursor-pointer"
            >
              {submitting ? 'Connexion en cours...' : 'Accéder au Dossier Patient'}
            </button>
          </form>

          {/* Quick Demo Accès strictly for clinical roles */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <span className="text-3xs uppercase font-extrabold text-slate-400 block tracking-wider text-center">
              Accès Rapide par Profil Médical & Soignant
            </span>
            <div className="grid grid-cols-2 gap-2 text-left">
              <button
                type="button"
                onClick={() => handleQuickLogin('doc@chrein.sn')}
                className="p-2.5 bg-teal-50/60 hover:bg-teal-100/70 border border-teal-200 rounded-xl transition cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-teal-950">
                  <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                  <span>Dr. Cheikh Ndao</span>
                </div>
                <div className="text-3xs text-teal-700 font-medium truncate">Chef de Service Pneumo</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('toure@chrein.sn')}
                className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Stethoscope className="w-3.5 h-3.5 text-sky-600" />
                  <span>Dr. A. Touré</span>
                </div>
                <div className="text-3xs text-slate-500 font-medium truncate">Pneumo-Phtisiologue</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('infirmiere@chrein.sn')}
                className="p-2.5 bg-pink-50/50 hover:bg-pink-100/60 border border-pink-200 rounded-xl transition cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-pink-950">
                  <HeartPulse className="w-3.5 h-3.5 text-pink-600" />
                  <span>Mme F. B. Sarr</span>
                </div>
                <div className="text-3xs text-pink-700 font-medium truncate">Infirmière Major Soins</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('superadmin@senegal-sante.sn', 'SenegalSante2026!')}
                className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
                  <span>SuperAdmin</span>
                </div>
                <div className="text-3xs text-slate-500 font-medium truncate">Ministère de la Santé</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
