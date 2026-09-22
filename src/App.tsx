import React, { useEffect, useState } from 'react';
import { Sidebar, PageId } from './components/Sidebar';
import { Header } from './components/Header';
import { DatabaseInspectorModal } from './components/DatabaseInspectorModal';
import { DashboardPage } from './pages/DashboardPage';
import { JobsPage } from './pages/JobsPage';
import { ResourcesPage } from './pages/ResourcesPage';
import { ScheduleGeneratorPage } from './pages/ScheduleGeneratorPage';
import { ScheduleTimelinePage } from './pages/ScheduleTimelinePage';
import { ConflictDetectionPage } from './pages/ConflictDetectionPage';
import { ReportsPage } from './pages/ReportsPage';
import { AboutPage } from './pages/AboutPage';
import {
  DatabaseState,
  Job,
  Resource,
  ScheduleItem,
  SchedulingResult,
} from './types';
import { StorageService } from './services/storageService';
import { SchedulingEngine } from './services/schedulingEngine';
import { PlayCircle, ChevronRight, X, Sparkles, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [data, setData] = useState<DatabaseState>(() => StorageService.loadDatabase());
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDbInspectorOpen, setIsDbInspectorOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastResult, setLastResult] = useState<SchedulingResult | null>(null);

  // 15-Step Demonstration Flow Guide State
  const [isDemoGuideOpen, setIsDemoGuideOpen] = useState(false);
  const [demoStep, setDemoStep] = useState(1);

  // Sync state from server on initial mount
  useEffect(() => {
    StorageService.fetchRemoteDatabase().then((remoteData) => {
      if (remoteData) {
        setData(remoteData);
      }
    });
  }, []);

  // Save changes to local & server storage
  const commitData = (newState: DatabaseState) => {
    setData(newState);
    StorageService.saveDatabase(newState);
  };

  // Job Handlers
  const handleAddJob = (newJob: Job) => {
    const updatedJobs = [...data.jobs, newJob];
    const engine = new SchedulingEngine(updatedJobs, data.resources, data.schedules);
    const auditedConflicts = engine.auditConflicts();
    commitData({
      ...data,
      jobs: updatedJobs,
      conflicts: auditedConflicts,
    });
  };

  const handleUpdateJob = (updatedJob: Job) => {
    const updatedJobs = data.jobs.map((j) => (j.id === updatedJob.id ? updatedJob : j));
    const engine = new SchedulingEngine(updatedJobs, data.resources, data.schedules);
    const auditedConflicts = engine.auditConflicts();
    commitData({
      ...data,
      jobs: updatedJobs,
      conflicts: auditedConflicts,
    });
  };

  const handleDeleteJob = (jobId: string) => {
    const updatedJobs = data.jobs.filter((j) => j.id !== jobId);
    const updatedSchedules = data.schedules.filter((s) => s.jobId !== jobId);
    const engine = new SchedulingEngine(updatedJobs, data.resources, updatedSchedules);
    const auditedConflicts = engine.auditConflicts();
    commitData({
      ...data,
      jobs: updatedJobs,
      schedules: updatedSchedules,
      conflicts: auditedConflicts,
    });
  };

  // Resource Handlers
  const handleAddResource = (newResource: Resource) => {
    const updatedResources = [...data.resources, newResource];
    commitData({
      ...data,
      resources: updatedResources,
    });
  };

  const handleUpdateResource = (updatedResource: Resource) => {
    const updatedResources = data.resources.map((r) =>
      r.id === updatedResource.id ? updatedResource : r
    );
    const engine = new SchedulingEngine(data.jobs, updatedResources, data.schedules);
    const auditedConflicts = engine.auditConflicts();
    commitData({
      ...data,
      resources: updatedResources,
      conflicts: auditedConflicts,
    });
  };

  const handleDeleteResource = (resourceId: string) => {
    const updatedResources = data.resources.filter((r) => r.id !== resourceId);
    const engine = new SchedulingEngine(data.jobs, updatedResources, data.schedules);
    const auditedConflicts = engine.auditConflicts();
    commitData({
      ...data,
      resources: updatedResources,
      conflicts: auditedConflicts,
    });
  };

  // Simulate machine breakdown
  const handleSimulateBreakdown = (resourceId: string) => {
    const updatedResources = data.resources.map((r) =>
      r.id === resourceId ? { ...r, status: 'Maintenance' as const } : r
    );
    const engine = new SchedulingEngine(data.jobs, updatedResources, data.schedules);
    const auditedConflicts = engine.auditConflicts();
    commitData({
      ...data,
      resources: updatedResources,
      conflicts: auditedConflicts,
    });
    // Navigate to conflicts to see the detected maintenance conflict & prompt rescheduling
    setCurrentPage('conflicts');
  };

  // Execute Core Scheduling Engine
  const handleRunEngine = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const engine = new SchedulingEngine(data.jobs, data.resources, []);
      const result = engine.generate();
      setLastResult(result);

      // Update jobs status to Scheduled or Pending
      const scheduledJobIds = new Set(result.scheduledItems.map((s) => s.jobId));
      const updatedJobs = data.jobs.map((j) => {
        if (scheduledJobIds.has(j.id)) {
          return { ...j, status: 'Scheduled' as const };
        }
        return j;
      });

      // Update machine status based on assignments
      const assignedResourceIds = new Set(result.scheduledItems.map((s) => s.resourceId));
      const updatedResources = data.resources.map((r) => {
        if (r.status === 'Maintenance' || r.status === 'Offline') return r;
        return {
          ...r,
          status: assignedResourceIds.has(r.id) ? ('Busy' as const) : ('Available' as const),
        };
      });

      commitData({
        ...data,
        jobs: updatedJobs,
        resources: updatedResources,
        schedules: result.scheduledItems,
        conflicts: result.conflicts,
      });

      setIsGenerating(false);
    }, 400);
  };

  const handleClearSchedule = () => {
    const updatedJobs = data.jobs.map((j) => ({
      ...j,
      status: j.status === 'Scheduled' ? ('Pending' as const) : j.status,
    }));
    const updatedResources = data.resources.map((r) => ({
      ...r,
      status: r.status === 'Busy' ? ('Available' as const) : r.status,
    }));
    commitData({
      ...data,
      jobs: updatedJobs,
      resources: updatedResources,
      schedules: [],
      conflicts: [],
    });
    setLastResult(null);
  };

  // Conflict Handlers
  const handleResolveConflict = (conflictId: string) => {
    const updatedConflicts = data.conflicts.map((c) =>
      c.id === conflictId
        ? { ...c, status: 'Resolved' as const, resolvedAt: new Date().toLocaleTimeString() }
        : c
    );
    commitData({
      ...data,
      conflicts: updatedConflicts,
    });
  };

  const handleApplyRescheduling = (
    reassignments: {
      originalSchedule: ScheduleItem;
      newResource: Resource;
      newStartTime: string;
      newEndTime: string;
    }[]
  ) => {
    const reassignedMap = new Map(reassignments.map((r) => [r.originalSchedule.id, r]));

    const updatedSchedules = data.schedules.map((s) => {
      const match = reassignedMap.get(s.id);
      if (match) {
        return {
          ...s,
          resourceId: match.newResource.id,
          resourceName: match.newResource.name,
          startTime: match.newStartTime,
          endTime: match.newEndTime,
          status: 'Scheduled' as const,
        };
      }
      return s;
    });

    const engine = new SchedulingEngine(data.jobs, data.resources, updatedSchedules);
    const auditedConflicts = engine.auditConflicts();

    commitData({
      ...data,
      schedules: updatedSchedules,
      conflicts: auditedConflicts,
    });
  };

  const handleResetToSample = () => {
    const fresh = StorageService.resetToSample();
    setData(fresh);
    setLastResult(null);
  };

  const handleRefreshConflicts = () => {
    const engine = new SchedulingEngine(data.jobs, data.resources, data.schedules);
    const audited = engine.auditConflicts();
    commitData({
      ...data,
      conflicts: audited,
    });
  };

  // Demo step definitions
  const demoStepsList = [
    { step: 1, page: 'dashboard', label: '1. Open Dashboard -> see overview.' },
    { step: 2, page: 'jobs', label: '2. Go to Jobs -> view sample jobs.' },
    { step: 3, page: 'jobs', label: '3. Add a new job -> form validation -> saved.' },
    { step: 4, page: 'resources', label: '4. Go to Resources -> see machines and status.' },
    { step: 5, page: 'resources', label: '5. Add or edit a machine -> saved.' },
    { step: 6, page: 'generator', label: '6. Go to Schedule Generator -> click Generate Schedule.' },
    { step: 7, page: 'generator', label: '7. System assigns jobs to machines.' },
    { step: 8, page: 'timeline', label: '8. Go to Schedule Timeline -> view Gantt-style schedule.' },
    { step: 9, page: 'timeline', label: '9. Filter by machine/date.' },
    { step: 10, page: 'conflicts', label: '10. Go to Conflict Detection -> see any detected issues.' },
    { step: 11, page: 'conflicts', label: '11. Mark a conflict as resolved or simulate machine breakdown.' },
    { step: 12, page: 'conflicts', label: '12. Trigger rescheduling -> jobs reallocated.' },
    { step: 13, page: 'reports', label: '13. Go to Reports -> view summary and export CSV or print.' },
    { step: 14, page: 'about', label: '14. Go to About -> show project details and team.' },
    { step: 15, page: 'dashboard', label: '15. Return to Dashboard -> see updated statistics.' },
  ];

  const handleJumpToDemoStep = (stepNum: number) => {
    setDemoStep(stepNum);
    const target = demoStepsList.find((s) => s.step === stepNum);
    if (target) {
      setCurrentPage(target.page as PageId);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex text-slate-900 font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={(page) => {
          setCurrentPage(page);
          setIsSidebarOpen(false);
        }}
        openConflictsCount={data.conflicts.filter((c) => c.status === 'Open').length}
        totalJobsCount={data.jobs.length}
        totalMachinesCount={data.resources.length}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Layout */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          onOpenDbInspector={() => setIsDbInspectorOpen(true)}
          onResetData={handleResetToSample}
          onQuickGenerate={handleRunEngine}
          openConflictsCount={data.conflicts.filter((c) => c.status === 'Open').length}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        {/* 15-Step College Evaluation Tour Floating Assistant */}
        <div className="px-4 lg:px-8 pt-4">
          <div className="bg-white border border-blue-200 rounded-xl p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg shrink-0">
                <PlayCircle className="w-4 h-4" />
              </span>
              <div>
                <span className="font-bold text-slate-900 block">
                  15-Step Evaluator Demo Guide:{' '}
                  <span className="text-blue-700 font-semibold">
                    Step {demoStep} of 15
                  </span>
                </span>
                <span className="text-slate-500 text-[11px]">
                  {demoStepsList[demoStep - 1]?.label}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {demoStep > 1 && (
                <button
                  onClick={() => handleJumpToDemoStep(demoStep - 1)}
                  className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-semibold"
                >
                  Prev
                </button>
              )}
              {demoStep < 15 ? (
                <button
                  onClick={() => handleJumpToDemoStep(demoStep + 1)}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs"
                >
                  <span>Next Step</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={() => handleJumpToDemoStep(1)}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Restart Tour</span>
                </button>
              )}
              <button
                onClick={() => setIsDemoGuideOpen(!isDemoGuideOpen)}
                className="px-2 py-1 text-slate-400 hover:text-slate-700 text-[11px] font-medium"
              >
                {isDemoGuideOpen ? 'Hide Steps' : 'View All Steps'}
              </button>
            </div>
          </div>

          {/* Expanded Demo Checklist */}
          {isDemoGuideOpen && (
            <div className="mt-2 bg-white border border-slate-200 rounded-xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-xs animate-in fade-in duration-150">
              {demoStepsList.map((item) => (
                <button
                  key={item.step}
                  onClick={() => handleJumpToDemoStep(item.step)}
                  className={`p-2 rounded-lg text-left transition-all border ${
                    demoStep === item.step
                      ? 'bg-blue-50 border-blue-400 text-blue-900 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="font-mono text-[10px] text-blue-600 mb-0.5">STEP {item.step}</div>
                  <div className="text-[11px] leading-tight line-clamp-2">{item.label}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Page Router */}
        <main className="flex-1 p-4 lg:p-8">
          {currentPage === 'dashboard' && (
            <DashboardPage
              data={data}
              onNavigate={setCurrentPage}
              onGenerateSchedule={handleRunEngine}
            />
          )}

          {currentPage === 'jobs' && (
            <JobsPage
              jobs={data.jobs}
              onAddJob={handleAddJob}
              onUpdateJob={handleUpdateJob}
              onDeleteJob={handleDeleteJob}
            />
          )}

          {currentPage === 'resources' && (
            <ResourcesPage
              resources={data.resources}
              schedules={data.schedules}
              onAddResource={handleAddResource}
              onUpdateResource={handleUpdateResource}
              onDeleteResource={handleDeleteResource}
              onSimulateBreakdown={handleSimulateBreakdown}
            />
          )}

          {currentPage === 'generator' && (
            <ScheduleGeneratorPage
              data={data}
              onRunEngine={handleRunEngine}
              onClearSchedule={handleClearSchedule}
              onNavigate={setCurrentPage}
              lastResult={lastResult}
              isGenerating={isGenerating}
            />
          )}

          {currentPage === 'timeline' && (
            <ScheduleTimelinePage
              schedules={data.schedules}
              resources={data.resources}
              onNavigateToGenerator={() => setCurrentPage('generator')}
            />
          )}

          {currentPage === 'conflicts' && (
            <ConflictDetectionPage
              data={data}
              onResolveConflict={handleResolveConflict}
              onApplyRescheduling={handleApplyRescheduling}
              onRefreshConflicts={handleRefreshConflicts}
            />
          )}

          {currentPage === 'reports' && <ReportsPage data={data} />}

          {currentPage === 'about' && <AboutPage />}
        </main>
      </div>

      {/* Database Inspector Modal */}
      <DatabaseInspectorModal
        isOpen={isDbInspectorOpen}
        onClose={() => setIsDbInspectorOpen(false)}
        databaseState={data}
        onReset={handleResetToSample}
      />
    </div>
  );
}
