import React, { useState, useEffect } from 'react';
import {
  Clock,
  Database,
  RotateCcw,
  Zap,
  AlertTriangle,
  Play,
  CheckCircle2,
  Menu,
} from 'lucide-react';
import { PageId } from './Sidebar';

interface HeaderProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  onOpenDbInspector: () => void;
  onResetData: () => void;
  onQuickGenerate: () => void;
  openConflictsCount: number;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  onNavigate,
  onOpenDbInspector,
  onResetData,
  onQuickGenerate,
  openConflictsCount,
  onToggleSidebar,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const pageTitles: Record<PageId, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Production Overview Dashboard',
      subtitle: 'Real-time telemetry, machine utilization, and active job tracking',
    },
    jobs: {
      title: 'Job Order Management',
      subtitle: 'Configure work orders, batch quantities, processing durations, and strict deadlines',
    },
    resources: {
      title: 'Manufacturing Resource Management',
      subtitle: 'Manage production machinery, multi-capacity fixtures, and operational shifts',
    },
    generator: {
      title: 'Algorithmic Schedule Generator',
      subtitle: 'Core optimization engine: Priority + Earliest Deadline First + Resource Compatibility',
    },
    timeline: {
      title: 'Interactive Schedule Timeline',
      subtitle: 'Visual Gantt chart displaying machine allocations across operating windows',
    },
    conflicts: {
      title: 'Conflict & Bottleneck Detection',
      subtitle: 'Automated auditing for time collisions, maintenance breaches, and missed deadlines',
    },
    reports: {
      title: 'Production Reports & Export',
      subtitle: 'Executive summaries, machine utilization matrices, and CSV data export',
    },
    about: {
      title: 'About Academic Project',
      subtitle: 'Production Line Resource Scheduling System • Manufacturing Management Domain',
    },
  };

  const currentMeta = pageTitles[currentPage] || pageTitles.dashboard;

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-10 shadow-2xs">
      {/* Title & Context */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            title="Toggle navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight leading-snug">
            {currentMeta.title}
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            {currentMeta.subtitle}
          </p>
        </div>
      </div>

      {/* Actions & Telemetry */}
      <div className="flex items-center flex-wrap gap-2.5">
        {/* Live Clock / Shift */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100/80 border border-slate-200 rounded-lg text-xs font-mono text-slate-700">
          <Clock className="w-3.5 h-3.5 text-blue-600" />
          <span>Shift: 08:00–18:00</span>
          <span className="text-slate-300">|</span>
          <span className="font-semibold text-slate-900">{timeStr || '11:24 AM'}</span>
        </div>

        {/* Conflicts Alert Indicator */}
        {openConflictsCount > 0 ? (
          <button
            onClick={() => onNavigate('conflicts')}
            className="px-3 py-1.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs animate-pulse"
            title="View detected conflicts"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>{openConflictsCount} Conflict{openConflictsCount > 1 ? 's' : ''}</span>
          </button>
        ) : (
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium rounded-lg">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Zero Conflicts</span>
          </div>
        )}

        {/* Quick Database Inspector Button */}
        <button
          onClick={onOpenDbInspector}
          className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
          title="Inspect SQLite Relational Tables and DDL Schema"
        >
          <Database className="w-3.5 h-3.5 text-slate-600" />
          <span className="hidden md:inline">DB Inspector</span>
        </button>

        {/* Reset Data Button */}
        <button
          onClick={onResetData}
          className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
          title="Reset to initial sample dataset"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden lg:inline">Reset Sample Data</span>
        </button>

        {/* Quick Generate Schedule Action */}
        <button
          onClick={onQuickGenerate}
          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm shadow-blue-500/20 transition-all"
        >
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span>Generate Schedule</span>
        </button>
      </div>
    </header>
  );
};
