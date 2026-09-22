import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Wrench,
  ArrowRight,
  ShieldAlert,
  AlertCircle,
  Info,
  Clock,
  Cpu,
  Layers,
  Check,
} from 'lucide-react';
import { Conflict, ConflictSeverity, DatabaseState, Resource, ScheduleItem } from '../types';
import { SchedulingEngine } from '../services/schedulingEngine';

interface Props {
  data: DatabaseState;
  onResolveConflict: (conflictId: string) => void;
  onApplyRescheduling: (
    reassignments: {
      originalSchedule: ScheduleItem;
      newResource: Resource;
      newStartTime: string;
      newEndTime: string;
    }[]
  ) => void;
  onRefreshConflicts: () => void;
}

export const ConflictDetectionPage: React.FC<Props> = ({
  data,
  onResolveConflict,
  onApplyRescheduling,
  onRefreshConflicts,
}) => {
  const { conflicts, resources, schedules, jobs } = data;
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Rescheduling modal state
  const [selectedBreakdownMachineId, setSelectedBreakdownMachineId] = useState<string>(
    resources[0]?.id || ''
  );
  const [reschedulePlan, setReschedulePlan] = useState<{
    affectedJobs: ScheduleItem[];
    reassignments: {
      originalSchedule: ScheduleItem;
      newResource: Resource;
      newStartTime: string;
      newEndTime: string;
    }[];
    unsolvableJobs: ScheduleItem[];
  } | null>(null);

  const filteredConflicts = conflicts.filter((c) => {
    const matchesSeverity = severityFilter === 'ALL' || c.severity === severityFilter;
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSeverity && matchesStatus;
  });

  const openCount = conflicts.filter((c) => c.status === 'Open').length;
  const criticalCount = conflicts.filter((c) => c.severity === 'Critical' && c.status === 'Open').length;
  const warningCount = conflicts.filter((c) => c.severity === 'Warning' && c.status === 'Open').length;

  const handleComputeReschedule = () => {
    if (!selectedBreakdownMachineId) return;
    const engine = new SchedulingEngine(jobs, resources, schedules);
    const plan = engine.suggestRescheduleForUnavailableResource(selectedBreakdownMachineId);
    setReschedulePlan(plan);
  };

  const handleConfirmReschedule = () => {
    if (!reschedulePlan || reschedulePlan.reassignments.length === 0) return;
    onApplyRescheduling(reschedulePlan.reassignments);
    setReschedulePlan(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Overview Metric Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider">Active Conflicts</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <span className="text-2xl font-extrabold text-slate-900 font-mono mt-1 block">
            {openCount}
          </span>
          <span className="text-[11px] text-slate-500">Requiring supervisor resolution</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/30 shadow-2xs">
          <div className="flex items-center justify-between text-rose-600 text-xs">
            <span className="font-semibold uppercase tracking-wider">Critical Violations</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <span className="text-2xl font-extrabold text-rose-700 font-mono mt-1 block">
            {criticalCount}
          </span>
          <span className="text-[11px] text-rose-600">Overlap / offline machine</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/30 shadow-2xs">
          <div className="flex items-center justify-between text-amber-600 text-xs">
            <span className="font-semibold uppercase tracking-wider">Warnings</span>
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-2xl font-extrabold text-amber-700 font-mono mt-1 block">
            {warningCount}
          </span>
          <span className="text-[11px] text-amber-600">Deadline risk or delay</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Real-Time Audit
          </span>
          <button
            onClick={onRefreshConflicts}
            className="mt-2 w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Re-Audit Constraints</span>
          </button>
        </div>
      </div>

      {/* Interactive Rescheduling Workflow Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-slate-900 rounded-xl p-5 text-white shadow-md border border-blue-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                Emergency Machine Breakdown &amp; Rescheduler
              </span>
            </div>
            <h3 className="text-base font-bold tracking-tight">
              Automated Rescheduling Assistant
            </h3>
            <p className="text-xs text-slate-300">
              When a machine goes down, select it below to instantly identify affected jobs, locate compatible alternatives, and compute next available time slots.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={selectedBreakdownMachineId}
              onChange={(e) => setSelectedBreakdownMachineId(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs font-semibold text-white focus:outline-hidden"
            >
              {resources.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.type} - {m.status})
                </option>
              ))}
            </select>

            <button
              onClick={handleComputeReschedule}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Find Alternative Slots</span>
            </button>
          </div>
        </div>

        {/* Reschedule Proposal Preview */}
        {reschedulePlan && (
          <div className="mt-4 pt-4 border-t border-slate-700 bg-slate-950/60 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Reschedule Proposal: {reschedulePlan.affectedJobs.length} affected job(s) found on machine
              </span>
              <button
                onClick={() => setReschedulePlan(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Dismiss
              </button>
            </div>

            {reschedulePlan.affectedJobs.length === 0 ? (
              <p className="text-xs text-slate-400">
                No active jobs currently scheduled on this machine. No reallocations needed.
              </p>
            ) : (
              <div className="space-y-2">
                <div className="divide-y divide-slate-800 text-xs">
                  {reschedulePlan.reassignments.map((item, i) => (
                    <div
                      key={i}
                      className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-slate-300 font-mono text-[11px]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-blue-400">{item.originalSchedule.jobId}</span>
                        <span className="font-sans text-white">{item.originalSchedule.productName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="line-through text-rose-400">
                          {item.originalSchedule.resourceName} ({item.originalSchedule.startTime}–{item.originalSchedule.endTime})
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                          {item.newResource.name} ({item.newStartTime}–{item.newEndTime})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {reschedulePlan.unsolvableJobs.length > 0 && (
                  <div className="p-2 bg-rose-950/80 border border-rose-800 rounded text-xs text-rose-300">
                    ⚠️ {reschedulePlan.unsolvableJobs.length} job(s) could not be reallocated due to capacity limits on compatible alternatives.
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleConfirmReschedule}
                    disabled={reschedulePlan.reassignments.length === 0}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Confirm &amp; Apply Rescheduled Plan</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Conflict Filter & List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Detected Production Conflicts</h3>
            <p className="text-xs text-slate-500">
              System flags collisions, deadline breaches, and resource incompatibilities
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs focus:outline-hidden"
            >
              <option value="ALL">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="Warning">Warning</option>
              <option value="Information">Information</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs focus:outline-hidden"
            >
              <option value="ALL">All Statuses</option>
              <option value="Open">Open</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>

        {filteredConflicts.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-900">No conflicts found</h4>
            <p className="text-xs text-slate-400 mt-1">
              Current schedule satisfies all machine constraints and working shift windows.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Conflict ID</th>
                  <th className="p-3.5">Job ID</th>
                  <th className="p-3.5">Machine</th>
                  <th className="p-3.5">Conflict Type</th>
                  <th className="p-3.5">Description</th>
                  <th className="p-3.5">Severity</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredConflicts.map((c) => {
                  const severityBadge = {
                    Critical: 'bg-rose-100 text-rose-700 border-rose-200',
                    Warning: 'bg-amber-100 text-amber-700 border-amber-200',
                    Information: 'bg-blue-100 text-blue-700 border-blue-200',
                  };

                  return (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="p-3.5 font-mono font-bold text-slate-600">{c.id}</td>
                      <td className="p-3.5 font-mono font-bold text-blue-700">{c.jobId}</td>
                      <td className="p-3.5 font-mono text-slate-700">
                        {c.resourceId || 'N/A'}
                      </td>
                      <td className="p-3.5 font-semibold text-slate-900">{c.conflictType}</td>
                      <td className="p-3.5 text-slate-600 max-w-md">{c.description}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            severityBadge[c.severity]
                          }`}
                        >
                          {c.severity}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            c.status === 'Resolved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        {c.status === 'Open' ? (
                          <button
                            onClick={() => onResolveConflict(c.id)}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            <span>Mark Resolved</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-mono">
                            Resolved ({c.resolvedAt})
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
