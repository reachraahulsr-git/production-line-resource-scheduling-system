import React, { useState } from 'react';
import {
  Zap,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  RotateCcw,
  Terminal,
  Layers,
  Cpu,
  Calendar,
  Sparkles,
  Info,
} from 'lucide-react';
import { DatabaseState, SchedulingResult } from '../types';
import { PageId } from '../components/Sidebar';

interface Props {
  data: DatabaseState;
  onRunEngine: () => void;
  onClearSchedule: () => void;
  onNavigate: (page: PageId) => void;
  lastResult: SchedulingResult | null;
  isGenerating: boolean;
}

export const ScheduleGeneratorPage: React.FC<Props> = ({
  data,
  onRunEngine,
  onClearSchedule,
  onNavigate,
  lastResult,
  isGenerating,
}) => {
  const { jobs, resources, schedules } = data;
  const pendingJobs = jobs.filter((j) => j.status === 'Pending' || j.status === 'Delayed');
  const availableResources = resources.filter(
    (r) => r.status === 'Available' || r.status === 'Busy'
  );

  const [activeTab, setActiveTab] = useState<'results' | 'logs' | 'algorithm'>('results');

  const algorithmSteps = [
    { step: 1, title: 'Load Pending Jobs', desc: 'Queries database for jobs in Pending or Delayed status' },
    { step: 2, title: 'Load Resources', desc: 'Filters operational machines (Available/Busy status)' },
    { step: 3, title: 'Priority Ranking', desc: 'Ranks orders by Critical > High > Medium > Low weight' },
    { step: 4, title: 'EDF Secondary Sort', desc: 'Applies Earliest Deadline First tie-breaker' },
    { step: 5, title: 'Machine Compatibility', desc: 'Matches required machine type against available assets' },
    { step: 6, title: 'Availability Window', desc: 'Verifies machine operational hours (Available From-To)' },
    { step: 7, title: 'Capacity & Active Slots', desc: 'Inspects concurrent allocations on target machine' },
    { step: 8, title: 'Continuous Slot Search', desc: 'Finds earliest unblocked interval of required duration' },
    { step: 9, title: 'Resource Assignment', desc: 'Allocates job to optimal candidate resource' },
    { step: 10, title: 'Calculate Start Time', desc: 'Locks exact HH:MM commencement time' },
    { step: 11, title: 'Calculate End Time', desc: 'Computes completion time = start + processingTime' },
    { step: 12, title: 'Overlap Prevention', desc: 'Strict constraint enforcing non-overlapping intervals' },
    { step: 13, title: 'Backlog Detection', desc: 'Flags jobs that cannot be scheduled due to constraints' },
    { step: 14, title: 'Persist Schedule', desc: 'Writes generated allocations to database' },
    { step: 15, title: 'Audit & Display', desc: 'Audits conflicts and updates interactive Gantt timeline' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Control Room Hero Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-6 border border-slate-800 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-blue-600/30 border border-blue-500/40 rounded-full text-[11px] font-semibold text-blue-300">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Core Algorithmic Optimization Module</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight">
              Production Line Resource Scheduling Engine
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Executes multi-criteria constraint satisfaction: <b>Priority Ranks</b> (Critical &gt; High &gt; Medium &gt; Low) paired with <b>Earliest Deadline First (EDF)</b>, machine compatibility matching, and non-overlapping interval allocation.
            </p>
            <div className="flex items-center gap-4 text-xs font-mono text-slate-400 pt-1">
              <span>Eligible Jobs: <b className="text-white">{pendingJobs.length}</b></span>
              <span>•</span>
              <span>Available Machines: <b className="text-white">{availableResources.length}</b></span>
              <span>•</span>
              <span>Active Allocations: <b className="text-white">{schedules.length}</b></span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            {schedules.length > 0 && (
              <button
                onClick={onClearSchedule}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset Schedule</span>
              </button>
            )}

            <button
              onClick={onRunEngine}
              disabled={isGenerating}
              id="generate-schedule-engine-btn"
              className={`w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg transition-all ${
                isGenerating
                  ? 'bg-blue-800 text-blue-200 cursor-wait'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/50 active:scale-95'
              }`}
            >
              <Zap className={`w-4 h-4 ${isGenerating ? 'animate-spin' : 'fill-current'}`} />
              <span>{isGenerating ? 'Computing Schedule...' : 'GENERATE SCHEDULE'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('results')}
          className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'results'
              ? 'border-blue-600 text-blue-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Execution Results &amp; Allocations</span>
          {schedules.length > 0 && (
            <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded-full text-[10px]">
              {schedules.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'logs'
              ? 'border-blue-600 text-blue-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Algorithmic Execution Logs</span>
        </button>

        <button
          onClick={() => setActiveTab('algorithm')}
          className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'algorithm'
              ? 'border-blue-600 text-blue-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Info className="w-4 h-4" />
          <span>15-Step Pipeline Architecture</span>
        </button>
      </div>

      {/* Tab 1: Execution Results */}
      {activeTab === 'results' && (
        <div className="space-y-6">
          {schedules.length === 0 && (!lastResult || lastResult.scheduledItems.length === 0) ? (
            <div className="p-12 text-center bg-white rounded-xl border border-dashed border-slate-300 shadow-2xs">
              <Zap className="w-12 h-12 text-blue-400 mx-auto mb-3" />
              <h4 className="text-base font-bold text-slate-900">Schedule Has Not Been Generated Yet</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                Click &quot;GENERATE SCHEDULE&quot; above to run the Priority + Earliest Deadline First allocation engine on {pendingJobs.length} eligible job order(s).
              </p>
              <button
                onClick={onRunEngine}
                className="mt-4 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm inline-flex items-center gap-2"
              >
                <Zap className="w-4 h-4 fill-current" />
                Run Algorithm Now
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Quick Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Scheduled Allocations
                  </span>
                  <span className="text-2xl font-extrabold text-emerald-700 font-mono mt-1 block">
                    {schedules.length}
                  </span>
                  <span className="text-[11px] text-emerald-600">Assigned without collisions</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Unscheduled Backlog
                  </span>
                  <span className="text-2xl font-extrabold text-amber-600 font-mono mt-1 block">
                    {lastResult?.unscheduledJobs.length || 0}
                  </span>
                  <span className="text-[11px] text-slate-500">Unallocated pending jobs</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Total Processing Time
                  </span>
                  <span className="text-2xl font-extrabold text-blue-700 font-mono mt-1 block">
                    {schedules.reduce((acc, s) => acc + s.processingTime, 0)}m
                  </span>
                  <span className="text-[11px] text-slate-500">Scheduled workload</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Next Evaluation Step
                  </span>
                  <button
                    onClick={() => onNavigate('timeline')}
                    className="mt-2 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <span>View Gantt Timeline</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Unscheduled Diagnostics If Any */}
              {lastResult && lastResult.unscheduledJobs.length > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Unscheduled Jobs Diagnostic Report ({lastResult.unscheduledJobs.length})</span>
                  </div>
                  <div className="divide-y divide-amber-200 text-xs text-amber-900">
                    {lastResult.unscheduledJobs.map(({ job, reason }) => (
                      <div key={job.id} className="py-2 flex items-start justify-between gap-4">
                        <div>
                          <span className="font-mono font-bold">[{job.id}]</span>{' '}
                          <span className="font-semibold">{job.productName}</span>{' '}
                          <span className="text-slate-600 font-normal">
                            ({job.requiredMachineType}, {job.processingTime}m)
                          </span>
                        </div>
                        <span className="text-rose-700 font-medium text-[11px]">{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Generated Schedules Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Generated Schedule Matrix
                    </h3>
                    <p className="text-xs text-slate-500">
                      Deterministic time slots assigned by machine compatibility and operating shifts
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onNavigate('timeline')}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold rounded-lg flex items-center gap-1"
                    >
                      <span>Interactive Gantt Chart</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-3.5">Job ID</th>
                        <th className="p-3.5">Product</th>
                        <th className="p-3.5">Machine</th>
                        <th className="p-3.5">Priority</th>
                        <th className="p-3.5">Start Time</th>
                        <th className="p-3.5">End Time</th>
                        <th className="p-3.5">Processing Time</th>
                        <th className="p-3.5">Deadline</th>
                        <th className="p-3.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {schedules.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50 font-mono">
                          <td className="p-3.5 font-bold text-blue-700">{s.jobId}</td>
                          <td className="p-3.5 font-sans font-semibold text-slate-900">
                            {s.productName}
                          </td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded font-semibold text-[11px]">
                              {s.resourceName} ({s.machineType})
                            </span>
                          </td>
                          <td className="p-3.5 font-sans">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                s.priority === 'Critical'
                                  ? 'bg-rose-100 text-rose-700'
                                  : s.priority === 'High'
                                  ? 'bg-amber-100 text-amber-700'
                                  : s.priority === 'Medium'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {s.priority}
                            </span>
                          </td>
                          <td className="p-3.5 text-emerald-700 font-bold">{s.startTime}</td>
                          <td className="p-3.5 text-slate-900 font-bold">{s.endTime}</td>
                          <td className="p-3.5 text-slate-700">{s.processingTime} min</td>
                          <td className="p-3.5 text-slate-600">{s.deadline}</td>
                          <td className="p-3.5 font-sans">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                s.status === 'Delayed'
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              {s.status}
                              {s.delayMinutes ? ` (+${s.delayMinutes}m)` : ''}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Execution Logs Terminal */}
      {activeTab === 'logs' && (
        <div className="bg-slate-950 rounded-xl border border-slate-800 p-5 shadow-md">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-xs">
            <div className="flex items-center gap-2 text-slate-300 font-mono">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Scheduling Engine Execution Log Stream</span>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              {lastResult?.logs.length || 0} event entries
            </span>
          </div>

          <div className="font-mono text-xs text-slate-300 space-y-1 max-h-[500px] overflow-y-auto leading-relaxed">
            {lastResult && lastResult.logs.length > 0 ? (
              lastResult.logs.map((log, idx) => (
                <div
                  key={idx}
                  className={`py-0.5 ${
                    log.includes('FAILED') || log.includes('UNSCHEDULED')
                      ? 'text-rose-400'
                      : log.includes('ASSIGNED')
                      ? 'text-emerald-400'
                      : log.includes('Step')
                      ? 'text-blue-300 font-bold'
                      : 'text-slate-300'
                  }`}
                >
                  {log}
                </div>
              ))
            ) : (
              <div className="text-slate-500 italic py-4">
                No logs in buffer. Click &quot;GENERATE SCHEDULE&quot; to execute the engine and stream live logs.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Algorithm Architecture */}
      {activeTab === 'algorithm' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              15-Step Algorithmic Pipeline Architecture
            </h3>
            <p className="text-xs text-slate-500">
              Academic design breakdown satisfying all project requirements for scheduling logic
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {algorithmSteps.map((s) => (
              <div
                key={s.step}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1 hover:bg-white hover:border-blue-300 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                    {s.step}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900">{s.title}</h4>
                </div>
                <p className="text-[11px] text-slate-600 pl-8 leading-snug">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1">
            <span className="font-bold block">Scheduling Complexity &amp; Guarantees:</span>
            <p className="text-[11px] text-blue-800">
              • Time Complexity: <code>O(J log J + J · M · T)</code> where J = jobs, M = compatible machines, T = discrete 5-min intervals in operational window.
            </p>
            <p className="text-[11px] text-blue-800">
              • Non-Overlapping Invariant: No machine with capacity = 1 will ever be assigned concurrent overlapping jobs.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
