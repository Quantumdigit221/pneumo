import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useStore } from './store';
import { AuthProvider } from './components/AuthProvider';
import { Layout } from './components/Layout';
import { Auth } from './pages/Auth';

// Lazy loading clinical pages for instant transitions
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Patients = lazy(() => import('./pages/Patients').then(m => ({ default: m.Patients })));
const Consultations = lazy(() => import('./pages/Consultations').then(m => ({ default: m.Consultations })));
const SpecializedForms = lazy(() => import('./pages/SpecializedForms').then(m => ({ default: m.SpecializedForms })));
const ClinicalScores = lazy(() => import('./pages/ClinicalScores').then(m => ({ default: m.ClinicalScores })));
const Hospitalization = lazy(() => import('./pages/Hospitalization').then(m => ({ default: m.Hospitalization })));
const NursingModule = lazy(() => import('./pages/NursingModule').then(m => ({ default: m.NursingModule })));
const Explorations = lazy(() => import('./pages/Explorations').then(m => ({ default: m.Explorations })));
const MedicalImagingAI = lazy(() => import('./pages/MedicalImagingAI').then(m => ({ default: m.MedicalImagingAI })));
const ResearchAndStats = lazy(() => import('./pages/ResearchAndStats').then(m => ({ default: m.ResearchAndStats })));
const Appointments = lazy(() => import('./pages/Appointments').then(m => ({ default: m.Appointments })));
const MedicalDocuments = lazy(() => import('./pages/MedicalDocuments').then(m => ({ default: m.MedicalDocuments })));
const Users = lazy(() => import('./pages/Users').then(m => ({ default: m.Users })));
const ClinicConfig = lazy(() => import('./pages/ClinicConfig').then(m => ({ default: m.ClinicConfig })));

// Preload high-frequency clinical modules in background during idle time for 0ms tab switching
if (typeof window !== 'undefined') {
  const schedulePreload = (window as any).requestIdleCallback || ((cb: () => void) => setTimeout(cb, 1200));
  schedulePreload(() => {
    import('./pages/Consultations');
    import('./pages/Hospitalization');
    import('./pages/Patients');
    import('./pages/Dashboard');
  });
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
  );
}

const AuthGuard: React.FC = () => {
  const { currentUser } = useStore();

  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  return <Auth />;
};
