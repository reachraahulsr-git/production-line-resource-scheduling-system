import React from 'react';
import {
  LayoutDashboard,
  Layers,
  Cpu,
  Zap,
  CalendarRange,
  AlertTriangle,
  FileText,
  Info,
  GraduationCap,
  Sparkles,
  ChevronRight,
  Factory,
} from 'lucide-react';

export type PageId =
  | 'dashboard'
  | 'jobs'
  | 'resources'
  | 'generator'
  | 'timeline'
  | 'conflicts'
  | 'reports'
  | 'about';

interface SidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  openConflictsCount: number;
  totalJobsCount: number;
  totalMachinesCount: number;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  openConflictsCount,
  totalJobsCount,
  totalMachinesCount,
  isOpen = false,
  onClose,
}) => {
  const navItems: {
    id: PageId;
    label: string;
    icon: React.ElementType;
    badge?: string | number;
    badgeColor?: string;
  }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'jobs',
      label: 'Job Management',
      icon: Layers,
      badge: totalJobsCount,
      badgeColor: 'bg-slate-700 text-slate-200',
    },
    {
      id: 'resources',
      label: 'Resource Management',
      icon: Cpu,
      badge: totalMachinesCount,
      badgeColor: 'bg-slate-700 text-slate-200',
    },
    {
      id: 'generator',
      label: 'Schedule Generator',
      icon: Zap,
      badge: 'Core',
      badgeColor: 'bg-blue-600 text-white',
    },
    {
      id: 'timeline',
      label: 'Schedule Timeline',
      icon: CalendarRange,
    },
    {
      id: 'conflicts',
      label: 'Conflict Detection',
      icon: AlertTriangle,
      badge: openConflictsCount > 0 ? openConflictsCount : undefined,
      badgeColor: 'bg-rose-500 text-white animate-pulse',
    },
    {
      id: 'reports',
      label: 'Reports & Export',
      icon: FileText,
    },
    {
      id: 'about',
      label: 'About Project',
      icon: Info,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-30 lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 w-68 shrink-0 bg-slate-900 text-slate-100 flex flex-col h-screen border-r border-slate-800 select-none z-40 transition-transform duration-200 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
      {/* Brand & System Title */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-900/40 shrink-0">
            <Factory className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-blue-400 block">
              Manufacturing OS
            </span>
            <h1 className="text-sm font-bold text-white tracking-tight leading-tight">
              PRODUCTION LINE
            </h1>
            <p className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">
              Scheduling &amp; Optimization
            </p>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Navigation Modules
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 group ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {item.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold leading-none ${
                      item.badgeColor || 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-200" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Project & Team Credits Badge */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/50">
        <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700/60">
          <div className="flex items-center gap-2 mb-1.5">
            <GraduationCap className="w-4 h-4 text-blue-400" />
            <span className="text-[11px] font-bold text-white uppercase tracking-wider">
              College Project
            </span>
          </div>
          <p className="text-[11px] text-slate-300 font-medium leading-snug">
            Production Line Resource Scheduling System
          </p>
          <div className="mt-2 pt-2 border-t border-slate-700/60 text-[10px] text-slate-400 space-y-0.5">
            <div className="flex justify-between">
              <span className="text-slate-300">Raahul S R</span>
              <span className="font-mono text-slate-400">...0314</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Tamilamuthan S</span>
              <span className="font-mono text-slate-400">...0357</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Narendranath S</span>
              <span className="font-mono text-slate-400">...0360</span>
            </div>
          </div>
        </div>

        <div className="mt-2.5 flex items-center justify-between px-1 text-[10px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            System Active
          </span>
          <span className="text-slate-400">v1.2 Stable</span>
        </div>
      </div>
    </aside>
    </>
  );
};
