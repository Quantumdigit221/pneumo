import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Settings,
  LogOut,
  Menu,
  X,
  Activity,
  HeartPulse,
  Wind,
  Stethoscope,
  Bed,
  Layers,
  TrendingUp,
  UserCheck,
  Scan,
  PanelLeftClose,
  PanelLeftOpen,
  EyeOff,
  ChevronRight,
  Hospital,
  FileText,
  Database,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Server
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { CenterSwitcher } from './CenterSwitcher';

const ClinicalVoiceAssistant = React.lazy(() =>
  import('./ClinicalVoiceAssistant').then(m => ({ default: m.ClinicalVoiceAssistant }))
);

interface LayoutProps {
  children: React.ReactNode;
}

interface SidebarItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: string;
  active: boolean;
  collapsed?: boolean;
  onClick: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  to,
  icon,
  label,
  badge,
  active,
  collapsed = false,
  onClick
}) => {
  return (
    <Link
      to={to}
      onClick={onClick}
      title={collapsed ? `${label}${badge ? ` (${badge})` : ''}` : undefined}
      className={`group relative flex items-center ${
        collapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-3.5 py-2.5'
      } rounded-xl transition-all duration-150 text-xs font-semibold ${
        active
          ? 'bg-teal-600 text-white shadow-xs'
          : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
      }`}
    >
      <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2.5 min-w-0'}`}>
        <span className={`${active ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'} flex-shrink-0`}>
          {icon}
        </span>
        {!collapsed && <span className="truncate">{label}</span>}
      </div>

      {!collapsed && badge && (
        <span
          className={`text-3xs px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${
            active ? 'bg-teal-700 text-white' : 'bg-slate-200 text-slate-700'
          }`}
        >
          {badge}
        </span>
      )}

      {/* Indicator dot when collapsed */}
      {collapsed && badge && (
        <span
          className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-teal-500 ring-2 ring-white"
          title={badge}
        />
      )}

      {/* Floating tooltip on hover in collapsed mode */}
      {collapsed && (
        <div className="hidden group-hover:flex absolute left-full ml-2.5 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg shadow-xl whitespace-nowrap z-50 items-center gap-1.5 pointer-events-none animate-in fade-in zoom-in-95 duration-100">
          <span>{label}</span>
          {badge && (
            <span className="text-[10px] bg-teal-600 px-1.5 py-0.5 rounded font-mono font-semibold">
              {badge}
            </span>
          )}
        </div>
      )}
    </Link>
  );
};

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentUser, currentCenter, logout, hostingerStatus, checkHostingerStatus } = useStore();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHostingerModalOpen, setIsHostingerModalOpen] = useState(false);
  const [isTestingHostinger, setIsTestingHostinger] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  // Desktop sidebar state: 'expanded' (w-72), 'collapsed' (w-20 rail), or 'hidden' (w-0 / full screen)
  const [sidebarState, setSidebarState] = useState<'expanded' | 'collapsed' | 'hidden'>(() => {
    try {
      const saved = localStorage.getItem('chrein_sidebar_state');
      if (saved === 'expanded' || saved === 'collapsed' || saved === 'hidden') {
        return saved;
      }
    } catch {
      // localStorage may fail in restricted sandboxes
    }
    return 'expanded';
  });

  const updateSidebarState = (newState: 'expanded' | 'collapsed' | 'hidden') => {
    setSidebarState(newState);
    try {
      localStorage.setItem('chrein_sidebar_state', newState);
    } catch {
      // ignore
    }
  };

  // Keyboard shortcut Ctrl+B or Cmd+B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setSidebarState(prev => {
          const next = prev === 'expanded' ? 'collapsed' : 'expanded';
          try {
            localStorage.setItem('chrein_sidebar_state', next);
          } catch {
            // ignore
          }
          return next;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!currentUser) return <>{children}</>;

  const isActive = (path: string) => location.pathname === path;
  const isCollapsed = sidebarState === 'collapsed';
  const isHidden = sidebarState === 'hidden';

  const getPageTitle = (pathname: string): { title: string; category: string } => {
    switch (pathname) {
      case '/':
        return { title: 'Tableau de Bord Clinique', category: 'Supervision' };
      case '/patients':
        return { title: 'Dossiers Patients & IP', category: 'Prise en charge' };
      case '/consultations':
        return { title: 'Consultation Standardisée en 12 Étapes', category: 'Clinique' };
      case '/specialized-forms':
        return { title: 'Protocoles Spécialisés (TB, BPCO, Asthme)', category: 'Pneumologie' };
      case '/clinical-scores':
        return { title: 'Bibliothèque de Scores Cliniques', category: 'Aide à la décision' };
      case '/hospitalization':
        return { title: 'Hospitalisation & Gestion des Lits', category: 'Séjours' };
      case '/nursing':
        return { title: 'Soins Paramédicaux & Transmissions DAR', category: 'Soins' };
      case '/explorations':
        return { title: 'Explorations Médicales & Gazométrie', category: 'Plateau Technique' };
      case '/imaging-ai':
        return { title: 'Imagerie Médicale & IA Thoracique', category: 'Radiologie' };
      case '/research-stats':
        return { title: 'Statistiques & Recherche Clinique', category: 'Épidémiologie' };
      case '/appointments':
        return { title: 'Rendez-vous & Calendrier de Suivi', category: 'Consultations' };
      case '/documents':
        return { title: 'Documents Médicaux & Certificats Officiels', category: 'Actes & Édition' };
      case '/users':
        return { title: 'Équipe Médicale & Contrôle d\'Accès', category: 'Administration' };
      case '/admin/clinic-config':
        return { title: 'Configuration Structure & Protocoles', category: 'Paramétrage' };
      default:
        return { title: 'Dossier Patient Informatisé', category: 'CHREIN Kaolack' };
    }
  };

  const pageInfo = getPageTitle(location.pathname);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden backdrop-blur-xs"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Side Navigation Bar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 bg-white border-r border-slate-200 shadow-sm transition-all duration-200 ease-in-out ${
          isMobileMenuOpen
            ? 'translate-x-0 w-72'
            : isHidden
            ? '-translate-x-full lg:-translate-x-full lg:w-0'
            : isCollapsed
            ? '-translate-x-full lg:translate-x-0 lg:w-20'
            : '-translate-x-full lg:translate-x-0 lg:w-72'
        }`}
      >
        <div className="h-full flex flex-col justify-between">
          <div className="flex flex-col h-full overflow-hidden">
            {/* Header / Brand */}
            <div className={`border-b border-slate-100 bg-gradient-to-r from-teal-50/40 to-slate-50 ${
              isCollapsed ? 'p-3 flex flex-col items-center' : 'p-4'
            }`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center shadow-xs text-white shrink-0">
                    <Wind className="w-5 h-5" />
                  </div>
                  {!isCollapsed && (
                    <div className="flex-1 overflow-hidden">
                      <h1 className="font-black text-sm text-slate-800 tracking-tight leading-tight">
                        CHREIN Kaolack
                      </h1>
                      <p className="text-xxs text-teal-700 font-bold truncate">
                        Pneumologie & Infectiologie
                      </p>
                    </div>
                  )}
                </div>

                {/* Sidebar toggle controls in header */}
                {!isCollapsed ? (
                  <div className="flex items-center gap-1">
                    {/* Desktop Collapse button */}
                    <button
                      type="button"
                      onClick={() => updateSidebarState('collapsed')}
                      className="hidden lg:flex p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                      title="Réduire le menu latéral (Ctrl+B)"
                    >
                      <PanelLeftClose className="w-4 h-4" />
                    </button>
                    {/* Mobile Close button */}
                    <button
                      type="button"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                      title="Fermer le menu"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => updateSidebarState('expanded')}
                    className="mt-2 p-1.5 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition cursor-pointer"
                    title="Agrandir le menu latéral (Ctrl+B)"
                  >
                    <PanelLeftOpen className="w-4 h-4" />
                  </button>
                )}
              </div>

              {!isCollapsed && (
                <div className="mt-3">
                  <CenterSwitcher />
                </div>
              )}
            </div>

            {/* Navigation links grouped strictly by Cahier des Charges */}
            <nav className={`flex-1 overflow-y-auto space-y-4 ${isCollapsed ? 'p-2' : 'p-3'}`}>
              {/* Groupe 1 : Prise en charge clinique */}
              <div className="space-y-1">
                {!isCollapsed && (
                  <div className="px-3 py-1 text-3xs font-extrabold text-slate-400 uppercase tracking-widest">
                    Prise en Charge Clinique
                  </div>
                )}
                {isCollapsed && <div className="h-2" />}
                <SidebarItem
                  to="/"
                  icon={<LayoutDashboard className="w-4 h-4" />}
                  label="Tableau de Bord"
                  active={isActive('/')}
                  collapsed={isCollapsed}
                  onClick={() => setIsMobileMenuOpen(false)}
                />
                <SidebarItem
                  to="/patients"
                  icon={<Users className="w-4 h-4" />}
                  label="Dossiers Patients (IP)"
                  active={isActive('/patients')}
                  collapsed={isCollapsed}
                  onClick={() => setIsMobileMenuOpen(false)}
                />
                <SidebarItem
                  to="/consultations"
                  icon={<Stethoscope className="w-4 h-4" />}
                  label="Consultation (12 étapes & voix)"
                  badge="IA"
                  active={isActive('/consultations')}
                  collapsed={isCollapsed}
                  onClick={() => setIsMobileMenuOpen(false)}
                />
                <SidebarItem
                  to="/specialized-forms"
                  icon={<Wind className="w-4 h-4" />}
                  label="Formulaires Spécialisés"
                  badge="TB/BPCO"
                  active={isActive('/specialized-forms')}
                  collapsed={isCollapsed}
                  onClick={() => setIsMobileMenuOpen(false)}
                />
                <SidebarItem
                  to="/clinical-scores"
                  icon={<Activity className="w-4 h-4" />}
                  label="Scores Cliniques"
                  badge="Calculs"
                  active={isActive('/clinical-scores')}
                  collapsed={isCollapsed}
                  onClick={() => setIsMobileMenuOpen(false)}
                />
                <SidebarItem
                  to="/appointments"
                  icon={<Calendar className="w-4 h-4" />}
                  label="Rendez-vous & Contrôles"
                  active={isActive('/appointments')}
                  collapsed={isCollapsed}
                  onClick={() => setIsMobileMenuOpen(false)}
                />
                <SidebarItem
                  to="/documents"
                  icon={<FileText className="w-4 h-4" />}
                  label="Documents Médicaux"
                  badge="CRH/Ordo"
                  active={isActive('/documents')}
                  collapsed={isCollapsed}
                  onClick={() => setIsMobileMenuOpen(false)}
                />
              </div>

              {/* Groupe 2 : Hospitalisation & Soins Paramédicaux */}
              <div className="space-y-1">
                {!isCollapsed && (
                  <div className="px-3 py-1 text-3xs font-extrabold text-slate-400 uppercase tracking-widest">
                    Hospitalisation & Paramédical
                  </div>
                )}
                {isCollapsed && <div className="my-2 border-t border-slate-100" />}
                <SidebarItem
                  to="/hospitalization"
                  icon={<Bed className="w-4 h-4" />}
                  label="Hospitalisation & Lits"
                  active={isActive('/hospitalization')}
                  collapsed={isCollapsed}
                  onClick={() => setIsMobileMenuOpen(false)}
                />
                <SidebarItem
                  to="/nursing"
                  icon={<HeartPulse className="w-4 h-4" />}
                  label="Soins Paramédicaux (DAR)"
                  active={isActive('/nursing')}
                  collapsed={isCollapsed}
                  onClick={() => setIsMobileMenuOpen(false)}
                />
              </div>

              {/* Groupe 3 : Explorations & Recherche */}
              <div className="space-y-1">
                {!isCollapsed && (
                  <div className="px-3 py-1 text-3xs font-extrabold text-slate-400 uppercase tracking-widest">
                    Explorations & Recherche
                  </div>
                )}
                {isCollapsed && <div className="my-2 border-t border-slate-100" />}
                <SidebarItem
                  to="/explorations"
                  icon={<Layers className="w-4 h-4" />}
                  label="Explorations Médicales"
                  badge="Courbes"
                  active={isActive('/explorations')}
                  collapsed={isCollapsed}
                  onClick={() => setIsMobileMenuOpen(false)}
                />
                <SidebarItem
                  to="/imaging-ai"
                  icon={<Scan className="w-4 h-4" />}
                  label="Imagerie & IA Thoracique"
                  badge="Ark+/MONAI"
                  active={isActive('/imaging-ai')}
                  collapsed={isCollapsed}
                  onClick={() => setIsMobileMenuOpen(false)}
                />
                <SidebarItem
                  to="/research-stats"
                  icon={<TrendingUp className="w-4 h-4" />}
                  label="Statistiques & Recherche"
                  badge="XLSX"
                  active={isActive('/research-stats')}
                  collapsed={isCollapsed}
                  onClick={() => setIsMobileMenuOpen(false)}
                />
              </div>

              {/* Groupe 4 : Administration & Structure */}
              <div className="space-y-1">
                {!isCollapsed && (
                  <div className="px-3 py-1 text-3xs font-extrabold text-slate-400 uppercase tracking-widest">
                    Administration
                  </div>
                )}
                {isCollapsed && <div className="my-2 border-t border-slate-100" />}
                <SidebarItem
                  to="/users"
                  icon={<UserCheck className="w-4 h-4" />}
                  label="Équipe Médicale"
                  active={isActive('/users')}
                  collapsed={isCollapsed}
                  onClick={() => setIsMobileMenuOpen(false)}
                />
                <SidebarItem
                  to="/admin/clinic-config"
                  icon={<Settings className="w-4 h-4" />}
                  label="Configuration Structure"
                  active={isActive('/admin/clinic-config')}
                  collapsed={isCollapsed}
                  onClick={() => setIsMobileMenuOpen(false)}
                />
              </div>
            </nav>
          </div>

          {/* Connected User Footer */}
          <div className={`border-t border-slate-100 bg-slate-50/70 flex flex-col gap-2 ${
            isCollapsed ? 'p-2 items-center' : 'p-3.5'
          }`}>
            {!isCollapsed ? (
              <>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
                    {currentUser.name.toUpperCase().substring(0, 2)}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-xs font-bold text-slate-800 truncate">{currentUser.name}</p>
                    <p className="text-3xs text-teal-700 font-semibold truncate">
                      {currentUser.specialty || currentUser.role}
                    </p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-red-50 hover:text-red-600 text-xxs text-slate-600 font-semibold transition cursor-pointer"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Déconnexion</span>
                </button>
              </>
            ) : (
              <>
                <div
                  className="w-8 h-8 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center shadow-xs cursor-pointer"
                  title={`${currentUser.name} (${currentUser.specialty || currentUser.role})`}
                >
                  {currentUser.name.toUpperCase().substring(0, 2)}
                </div>
                <button
                  onClick={logout}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                  title="Déconnexion"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ease-in-out ${
          isHidden
            ? 'lg:ml-0'
            : isCollapsed
            ? 'lg:ml-20'
            : 'lg:ml-72'
        }`}
      >
        {/* Universal Top Navigation Header Bar (Desktop & Mobile) */}
        <header className="sticky top-0 z-20 h-14 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 lg:px-6 flex items-center justify-between shadow-2xs">
          {/* Left: Sidebar toggle buttons & Breadcrumb */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Hamburger toggle */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer transition"
              title="Ouvrir le menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Desktop Sidebar Toggle Buttons */}
            <div className="hidden lg:flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  if (isHidden) {
                    updateSidebarState('expanded');
                  } else if (isCollapsed) {
                    updateSidebarState('expanded');
                  } else {
                    updateSidebarState('collapsed');
                  }
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer shadow-2xs ${
                  isHidden
                    ? 'bg-teal-600 text-white border-teal-700 hover:bg-teal-700'
                    : isCollapsed
                    ? 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
                title="Ouvrir ou fermer le menu latéral (Raccourci: Ctrl+B)"
              >
                {isHidden ? (
                  <>
                    <PanelLeftOpen className="w-4 h-4" />
                    <span>Ouvrir le menu</span>
                  </>
                ) : isCollapsed ? (
                  <>
                    <PanelLeftOpen className="w-4 h-4 text-teal-700" />
                    <span>Agrandir</span>
                  </>
                ) : (
                  <>
                    <PanelLeftClose className="w-4 h-4 text-slate-500" />
                    <span>Réduire</span>
                  </>
                )}
              </button>

              {/* Fullscreen / Hide completely button */}
              {!isHidden ? (
                <button
                  type="button"
                  onClick={() => updateSidebarState('hidden')}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition cursor-pointer shadow-2xs"
                  title="Masquer complètement le menu pour plein écran"
                >
                  <EyeOff className="w-4 h-4" />
                </button>
              ) : null}
            </div>

            {/* Separator */}
            <div className="hidden lg:block h-4 w-px bg-slate-200" />

            {/* Breadcrumb Info */}
            <div className="flex items-center gap-2 truncate text-xs">
              <div className="hidden md:flex items-center gap-1.5 text-slate-400 font-semibold truncate">
                <Hospital className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span className="truncate">CHREIN</span>
                <ChevronRight className="w-3 h-3 text-slate-300" />
                <span className="truncate">{pageInfo.category}</span>
                <ChevronRight className="w-3 h-3 text-slate-300" />
              </div>
              <span className="font-extrabold text-slate-800 truncate text-xs sm:text-sm">
                {pageInfo.title}
              </span>
            </div>
          </div>

          {/* Right: Hospital, User Info & Keyboard Shortcut */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Hostinger Database Status & Config Button */}
            <button
              type="button"
              onClick={() => {
                setIsHostingerModalOpen(true);
                checkHostingerStatus().then((res: any) => setTestResult(res)).catch(() => null);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xxs font-bold transition cursor-pointer shadow-2xs ${
                hostingerStatus?.connected
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
              title="Base de données Hostinger : Statut & Diagnostic de connexion"
            >
              <Database className={`w-3.5 h-3.5 ${hostingerStatus?.connected ? 'text-emerald-600' : 'text-amber-600'}`} />
              <span className="hidden sm:inline">
                {hostingerStatus?.connected ? 'BD Hostinger : Active' : 'BD Hostinger : Config'}
              </span>
              <span className={`w-1.5 h-1.5 rounded-full ${hostingerStatus?.connected ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
            </button>

            {/* Active Service Badge */}
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 bg-teal-50 text-teal-800 border border-teal-200 rounded-lg text-xxs font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-pulse" />
              <span>Pneumologie & Infectiologie</span>
            </div>

            {/* Connected User Pill */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-7 h-7 rounded-full bg-teal-600 text-white font-extrabold text-xxs flex items-center justify-center shadow-xs">
                {currentUser.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <span className="text-xs font-bold text-slate-800 block leading-tight">
                  {currentUser.name}
                </span>
                <span className="text-3xs text-slate-400 font-medium block">
                  {currentUser.role}
                </span>
              </div>
            </div>

            {/* Keyboard shortcut hint */}
            <kbd
              className="hidden lg:inline-flex px-1.5 py-0.5 text-3xs font-mono font-bold bg-slate-100 text-slate-500 border border-slate-300 rounded shadow-2xs"
              title="Raccourci clavier pour ouvrir/fermer le menu"
            >
              Ctrl+B
            </kbd>
          </div>
        </header>

        {/* Dynamic Route Screen Content */}
        <main className="flex-1 p-4 lg:p-6 pb-20">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>

        {/* Global Clinical Voice Assistant powered by Open-Source Health LLM */}
        <React.Suspense fallback={null}>
          <ClinicalVoiceAssistant />
        </React.Suspense>
      </div>

      {/* Hostinger Database Diagnostics & Guide Modal */}
      {isHostingerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 border border-slate-200 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5 text-teal-800">
                <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                    Connexion Base de Données Hostinger (MySQL)
                  </h3>
                  <span className="text-3xs text-slate-400 font-mono">
                    Dossier Patient Informatisé • CHREIN Kaolack
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHostingerModalOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Status Box */}
            <div className={`p-4 rounded-xl border flex items-start gap-3 ${
              (testResult?.connected || hostingerStatus?.connected)
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                : 'bg-amber-50/70 border-amber-200 text-amber-900'
            }`}>
              {(testResult?.connected || hostingerStatus?.connected) ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <strong className="font-black uppercase tracking-wide">
                    {(testResult?.connected || hostingerStatus?.connected)
                      ? 'Base Hostinger Connectée avec Succès'
                      : 'Connexion Hostinger Non Établie'}
                  </strong>
                  <span className="text-3xs font-mono font-bold px-2 py-0.5 rounded uppercase bg-white border border-current">
                    {(testResult?.connected || hostingerStatus?.connected) ? 'EN LIGNE' : 'ATTENTE CONFIG'}
                  </span>
                </div>
                <p className="text-xxs leading-relaxed">
                  {(testResult?.connected || hostingerStatus?.connected)
                    ? 'Le pool MySQL Hostinger est actif. Les données patients, consultations et hospitalisations sont synchronisées en temps réel.'
                    : (testResult?.error || hostingerStatus?.error || 'Les variables de connexion Hostinger ne sont pas encore définies ou l’accès distant est bloqué.')}
                </p>
                {testResult?.dbInfo && (
                  <div className="pt-2 mt-2 border-t border-current/20 font-mono text-3xs grid grid-cols-2 gap-1">
                    <div>Hôte : <span className="font-bold">{testResult.dbInfo.host}</span></div>
                    <div>Base : <span className="font-bold">{testResult.dbInfo.database}</span></div>
                    <div>Port : <span className="font-bold">{testResult.dbInfo.port}</span></div>
                    <div>Configuré : <span className="font-bold">{testResult.dbInfo.configured ? 'Oui' : 'Non'}</span></div>
                  </div>
                )}
              </div>
            </div>

            {/* Test Connection Button */}
            <div className="flex justify-end">
              <button
                type="button"
                disabled={isTestingHostinger}
                onClick={async () => {
                  setIsTestingHostinger(true);
                  try {
                    const res = await checkHostingerStatus();
                    setTestResult(res);
                  } finally {
                    setIsTestingHostinger(false);
                  }
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTestingHostinger ? 'animate-spin' : ''}`} />
                <span>{isTestingHostinger ? 'Test du ping en cours...' : 'Tester la connexion maintenant'}</span>
              </button>
            </div>

            {/* Hostinger Setup Instructions Guide */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs text-slate-700">
              <h4 className="font-black text-slate-900 uppercase text-xxs tracking-wider flex items-center gap-1.5">
                <Server className="w-4 h-4 text-teal-600" />
                <span>Guide de Configuration Hostinger (hPanel)</span>
              </h4>

              <ol className="list-decimal pl-4 space-y-2 text-xxs leading-relaxed text-slate-600">
                <li>
                  <strong className="text-slate-800">1. Créer la Base sur Hostinger :</strong><br />
                  Dans votre <em>hPanel Hostinger</em> &gt; <em>Bases de données MySQL</em> &gt; Créez une nouvelle base de données, notez le nom de la base (ex: <code className="bg-white px-1 py-0.5 rounded border font-mono">u123456789_chrein</code>), le nom d'utilisateur et le mot de passe.
                </li>
                <li>
                  <strong className="text-slate-800">2. Étape Cruciale — Activer « MySQL Distant » (Remote MySQL) :</strong><br />
                  Sur Hostinger : <em>Bases de données</em> &gt; <em>MySQL Distant</em> &gt; Ajoutez l'adresse IP <code className="bg-white px-1 py-0.5 rounded border font-mono font-bold">%</code> (signifie toutes les IPs distantes). Sans cela, le pare-feu Hostinger rejette automatiquement toute connexion extérieure.
                </li>
                <li>
                  <strong className="text-slate-800">3. Variables d'Environnement (.env) :</strong><br />
                  Définissez ces 5 variables :
                  <div className="bg-slate-900 text-teal-300 p-2.5 rounded-lg font-mono text-3xs mt-1 space-y-0.5">
                    <div>HOSTINGER_DB_HOST="srvXXX.hstgr.io" (ou IP hôte MySQL Hostinger)</div>
                    <div>HOSTINGER_DB_USER="u123456789_utilisateur"</div>
                    <div>HOSTINGER_DB_PASSWORD="votre_mot_de_passe"</div>
                    <div>HOSTINGER_DB_NAME="u123456789_nom_base"</div>
                    <div>HOSTINGER_DB_PORT="3306"</div>
                  </div>
                </li>
                <li>
                  <strong className="text-slate-800">4. Synchronisation Automatique :</strong><br />
                  Dès la connexion validée, l'application initialise et synchronise automatiquement toutes les tables (patients, consultations, hospitalisations, lits, examens, etc.).
                </li>
              </ol>
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsHostingerModalOpen(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
