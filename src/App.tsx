import React, { Suspense, lazy, ErrorInfo, ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useStore } from './store';
import { AuthProvider } from './components/AuthProvider';
import { Layout } from './components/Layout';
import { Auth } from './pages/Auth';

// Helper to recover gracefully from stale dynamic chunk errors after deployments/restarts
function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    const storageKey = 'chrein_chunk_retry';
    let hasRetried = false;
    try {
      hasRetried = window.sessionStorage.getItem(storageKey) === '1';
    } catch {
      hasRetried = false;
    }

    try {
      const mod = await factory();
      try {
        window.sessionStorage.removeItem(storageKey);
      } catch {
        // ignore
      }
      return mod;
    } catch (error) {
      if (!hasRetried && typeof window !== 'undefined') {
        try {
          window.sessionStorage.setItem(storageKey, '1');
        } catch {
          // ignore
        }
        window.location.reload();
        return new Promise<{ default: T }>(() => {});
      }
      throw error;
    }
  });
}

// Lazy loading clinical pages for instant transitions
const Dashboard = lazyWithRetry(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Patients = lazyWithRetry(() => import('./pages/Patients').then(m => ({ default: m.Patients })));
const Consultations = lazyWithRetry(() => import('./pages/Consultations').then(m => ({ default: m.Consultations })));
const SpecializedForms = lazyWithRetry(() => import('./pages/SpecializedForms').then(m => ({ default: m.SpecializedForms })));
const ClinicalScores = lazyWithRetry(() => import('./pages/ClinicalScores').then(m => ({ default: m.ClinicalScores })));
const Hospitalization = lazyWithRetry(() => import('./pages/Hospitalization').then(m => ({ default: m.Hospitalization })));
const NursingModule = lazyWithRetry(() => import('./pages/NursingModule').then(m => ({ default: m.NursingModule })));
const Explorations = lazyWithRetry(() => import('./pages/Explorations').then(m => ({ default: m.Explorations })));
const MedicalImagingAI = lazyWithRetry(() => import('./pages/MedicalImagingAI').then(m => ({ default: m.MedicalImagingAI })));
const ResearchAndStats = lazyWithRetry(() => import('./pages/ResearchAndStats').then(m => ({ default: m.ResearchAndStats })));
const Appointments = lazyWithRetry(() => import('./pages/Appointments').then(m => ({ default: m.Appointments })));
const MedicalDocuments = lazyWithRetry(() => import('./pages/MedicalDocuments').then(m => ({ default: m.MedicalDocuments })));
const Users = lazyWithRetry(() => import('./pages/Users').then(m => ({ default: m.Users })));
const ClinicConfig = lazyWithRetry(() => import('./pages/ClinicConfig').then(m => ({ default: m.ClinicConfig })));

// Preload high-frequency clinical modules in background during idle time for 0ms tab switching
if (typeof window !== 'undefined') {
  const schedulePreload = (window as any).requestIdleCallback || ((cb: () => void) => setTimeout(cb, 1200));
  schedulePreload(() => {
    import('./pages/Consultations').catch(() => {});
    import('./pages/Hospitalization').catch(() => {});
    import('./pages/Patients').catch(() => {});
    import('./pages/Dashboard').catch(() => {});
  });
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class AppErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public declare props: Readonly<ErrorBoundaryProps>;
  public state: ErrorBoundaryState = { hasError: false, errorMessage: '' };

  constructor(props: ErrorBoundaryProps) {
    super(props);
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'Erreur inattendue de chargement'
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[CHREIN DPI] Erreur capturée par ErrorBoundary:', error, info);
  }

  handleReload = () => {
    try {
      window.sessionStorage.removeItem('chrein_chunk_retry');
    } catch {
      // ignore
    }
    window.location.reload();
  };

  handleResetCacheAndReload = () => {
    try {
      const keysToClear: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && (key.startsWith('offline_') || key === 'current_user' || key === 'current_center')) {
          keysToClear.push(key);
        }
      }
      keysToClear.forEach(k => window.localStorage.removeItem(k));
    } catch {
      // ignore
    }
    try {
      window.sessionStorage.clear();
    } catch {
      // ignore
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl shadow-lg p-6 space-y-4">
            <div className="space-y-1">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold">
                CHREIN • Récupération d'affichage
              </span>
              <h1 className="text-lg font-black text-slate-900">
                Un problème d'affichage est survenu
              </h1>
              <p className="text-xs text-slate-600 leading-relaxed">
                L'interface n'a pas pu s'afficher correctement (cache navigateur obsolète ou données locales corrompues).
              </p>
            </div>

            {this.state.errorMessage && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-mono text-slate-600 break-words">
                {this.state.errorMessage}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Recharger la page
              </button>
              <button
                type="button"
                onClick={this.handleResetCacheAndReload}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 transition cursor-pointer"
              >
                Vider le cache local
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Skeleton loader
const PageLoader: React.FC = () => (
  <div className="p-6 space-y-4 max-w-7xl mx-auto animate-pulse">
    <div className="h-7 bg-slate-200/80 rounded-xl w-60" />
    <div className="h-4 bg-slate-100 rounded-lg w-96" />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
      <div className="h-28 bg-slate-100 rounded-2xl" />
      <div className="h-28 bg-slate-100 rounded-2xl" />
      <div className="h-28 bg-slate-100 rounded-2xl" />
      <div className="h-28 bg-slate-100 rounded-2xl" />
    </div>
    <div className="h-72 bg-slate-100 rounded-2xl mt-4" />
  </div>
);

// Protected routes layout for care team
const ProtectedLayout: React.FC = () => {
  const { currentUser } = useStore();

  if (!currentUser) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/consultations" element={<Consultations />} />
          <Route path="/specialized-forms" element={<SpecializedForms />} />
          <Route path="/clinical-scores" element={<ClinicalScores />} />
          <Route path="/hospitalization" element={<Hospitalization />} />
          <Route path="/nursing" element={<NursingModule />} />
          <Route path="/explorations" element={<Explorations />} />
          <Route path="/imaging-ai" element={<MedicalImagingAI />} />
          <Route path="/research-stats" element={<ResearchAndStats />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/documents" element={<MedicalDocuments />} />
          <Route path="/users" element={<Users />} />
          <Route path="/admin/clinic-config" element={<ClinicConfig />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Layout>
  );
};

export default function App() {
  return (
    <AppErrorBoundary>
      <AppProvider>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/auth" element={<AuthGuard />} />
              <Route path="/*" element={<ProtectedLayout />} />
            </Routes>
          </Router>
        </AuthProvider>
      </AppProvider>
    </AppErrorBoundary>
  );
}

const AuthGuard: React.FC = () => {
  const { currentUser } = useStore();

  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  return <Auth />;
};
