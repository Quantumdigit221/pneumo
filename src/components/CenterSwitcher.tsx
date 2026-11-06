import React, { useState } from 'react';
import { useStore } from '../store';
import { Building2, ChevronDown, Store } from 'lucide-react';
import { Role } from '../types';

export const CenterSwitcher: React.FC = () => {
  const { currentCenter, allCenters, switchCenter, currentUser } = useStore();
  const [isOpen, setIsOpen] = useState(false);

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  if (currentUser?.role === Role.OFFICINE_MANAGER || (currentUser?.role as string) === 'OFFICINE_MANAGER') {
    return (
      <div className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-emerald-50 text-slate-800 border border-emerald-200 rounded-lg text-xs font-semibold shadow-xs">
        <div className="flex items-center gap-2 truncate min-w-0">
          <Store className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="truncate font-bold text-slate-800">{currentUser.officineName || 'Pharmacie d\'Officine Partenaire'}</span>
        </div>
        <span className="text-[9px] bg-emerald-600 text-white font-black px-1.5 py-0.5 rounded uppercase tracking-wider flex-shrink-0 shadow-xs">
          Officine
        </span>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-teal-50/70 text-slate-800 border border-teal-100/80 rounded-lg text-xs font-semibold shadow-xs">
        <div className="flex items-center gap-2 truncate min-w-0">
          <Building2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
          <span className="truncate font-bold text-slate-800">{currentCenter?.name || 'Mon Établissement'}</span>
        </div>
        <span className="text-[9px] bg-teal-600 text-white font-black px-1.5 py-0.5 rounded uppercase tracking-wider flex-shrink-0 shadow-xs">
          {currentCenter?.id === 'center-2' ? 'Pikine' : currentCenter?.id === 'center-1' ? 'Médina' : 'Dédié'}
        </span>
      </div>
    );
  }

  if (!currentCenter && !isSuperAdmin) return null;

  return (
    <div className="relative">
      <button
        type="button"
        id="center-switcher"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors cursor-pointer"
      >
        <span className="flex items-center gap-2 truncate">
          <Building2 className="w-4 h-4 text-slate-500 flex-shrink-0" />
          <span className="truncate">{currentCenter ? currentCenter.name : 'Supervision Plateforme'}</span>
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1 max-h-56 overflow-y-auto">
            {isSuperAdmin && (
              <button
                type="button"
                id="center-option-global"
                onClick={async () => {
                  await switchCenter(null as any);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 transition-colors flex items-center gap-2 ${
                  !currentCenter ? 'text-teal-600 font-semibold bg-teal-50/50' : 'text-slate-600'
                }`}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                <span className="truncate">Supervision Plateforme</span>
              </button>
            )}
            
            {allCenters.map((center) => (
              <button
                key={center.id}
                type="button"
                id={`center-option-${center.id}`}
                onClick={async () => {
                  await switchCenter(center);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 transition-colors flex items-center gap-2 ${
                  currentCenter && center.id === currentCenter.id ? 'text-teal-600 font-semibold bg-teal-50/50' : 'text-slate-600'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${center.isActive ? 'bg-teal-500' : 'bg-slate-300'}`} />
                <span className="truncate">{center.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
