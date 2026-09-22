import React from 'react';
import {
  Layers,
  Clock,
  CheckCircle,
  AlertCircle,
  Cpu,
  Activity,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Calendar,
  Zap,
  PlayCircle,
  ChevronRight,
  Check,
} from 'lucide-react';
import { DatabaseState } from '../types';
import { PageId } from '../components/Sidebar';
import { TimeUtility } from '../services/schedulingEngine';

interface Props {
  data: DatabaseState;
  onNavigate: (page: PageId) => void;
  onGenerateSchedule: () => void;
}

export const DashboardPage: React.FC<Props> = ({
  data,
  onNavigate,
  onGenerateSchedule,
}) => {
  const { jobs, resources, schedules, conflicts, productionLogs } = data;

  // Real data calculations
  const totalJobs = jobs.length;
  const pendingJobs = jobs.filter((j) => j.status === 'Pending').length;
  const scheduledJobs = jobs.filter((j) => j.status === 'Scheduled').length;
  const inProgressJobs = jobs.filter((j) => j.status === 'In Progress').length;
  const completedJobs = jobs.filter((j) => j.status === 'Completed').length;
  const delayedJobs = jobs.filter((j) => j.status === 'Delayed').length;

  const totalMachines = resources.length;
  const availableMachines = resources.filter((r) => r.status === 'Available').length;
  const busyMachines = resources.filter((r) => r.status === 'Busy').length;
  const maintenanceMachines = resources.filter(
    (r) => r.status === 'Maintenance' || r.status === 'Offline'
  ).length;

  const openConflicts = conflicts.filter((c) => c.status === 'Open').length;

  // Machine Utilization calculation
  let totalAvailableMinutes = 0;
  let totalScheduledMinutes = 0;

  resources.forEach((machine) => {
    const startMin = TimeUtility.timeToMinutes(machine.availableFrom);
    const endMin = TimeUtility.timeToMinutes(machine.availableTo);
    const windowMinutes = Math.max(0, (endMin - startMin) * (machine.capacity || 1));
    totalAvailableMinutes += windowMinutes;

    const machineAllocations = schedules.filter((s) => s.resourceId === machine.id);
    const allocatedMinutes = machineAllocations.reduce((sum, s) => sum + s.processingTime, 0);
    totalScheduledMinutes += allocatedMinutes;
  });

  const overallUtilization =
    totalAvailableMinutes > 0
      ? Math.min(100, Math.round((totalScheduledMinutes / totalAvailableMinutes) * 100))
      : 0;

  // Jobs by Priority
  const priorityCounts = {
    Critical: jobs.filter((j) => j.priority === 'Critical').length,
    High: jobs.filter((j) => j.priority === 'High').length,
    Medium: jobs.filter((j) => j.priority === 'Medium').length,
    Low: jobs.filter((j) => j.priority === 'Low').length,
  };

  // Jobs by Status
  const statusCounts = {
    Pending: pendingJobs,
    Scheduled: scheduledJobs,
    'In Progress': inProgressJobs,
    Completed: completedJobs,
    Delayed: delayedJobs,
  };

  // Machine-wise utilization breakdown
  const machineUtilizationList = resources.map((machine) => {
    const startMin = TimeUtility.timeToMinutes(machine.availableFrom);
    const endMin = TimeUtility.timeToMinutes(machine.availableTo);
    const capacityMin = Math.max(1, (endMin - startMin) * (machine.capacity || 1));

    const machineSchedules = schedules.filter((s) => s.resourceId === machine.id);
    const busyMin = machineSchedules.reduce((sum, s) => sum + s.processingTime, 0);
    const pct = Math.min(100, Math.round((busyMin / capacityMin) * 100));

    return {
      id: machine.id,
      name: machine.name,
      type: machine.type,
      status: machine.status,
      utilizationPct: pct,
      busyMin,
      totalMin: capacityMin,
      scheduledCount: machineSchedules.length,
    };
  });

  const scheduledCount = schedules.length;
  const unscheduledCount = Math.max(0, totalJobs - scheduledCount);

  return (
    <div className="space-y-6 pb-12">
      {/* College Project Evaluation Quick-Guide */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-blue-950 rounded-xl p-5 text-white shadow-md border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-blue-600/80 text-blue-100 text-[10px] font-extrabold uppercase tracking-wider rounded">
                College Project Demo Flow
              </span>
              <span className="text-xs text-slate-300">
                Manufacturing Production Planning &amp; Optimization
              </span>
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Interactive 15-Step Evaluation Demonstration
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Follow the required presentation steps: view sample jobs &amp; machines, run the scheduling algorithm, inspect the Gantt timeline, audit conflicts, and test rescheduling.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigate('jobs')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white rounded-lg border border-slate-700 transition-colors flex items-center gap-1"
            >
              <span>1. Jobs</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigate('resources')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white rounded-lg border border-slate-700 transition-colors flex items-center gap-1"
            >
              <span>2. Machines</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onGenerateSchedule}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>3. Generate</span>
            </button>
            <button
              onClick={() => onNavigate('timeline')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white rounded-lg border border-slate-700 transition-colors flex items-center gap-1"
            >
              <span>4. Timeline</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigate('conflicts')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white rounded-lg border border-slate-700 transition-colors flex items-center gap-1"
            >
              <span>5. Conflicts</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Jobs */}
        <div
          onClick={() => onNavigate('jobs')}
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-400 cursor-pointer shadow-2xs hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Jobs</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{totalJobs}</span>
            <span className="text-[11px] text-slate-500">work orders</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Pending: <b className="text-slate-800">{pendingJobs}</b></span>
            <span>Delayed: <b className={delayedJobs > 0 ? 'text-rose-600' : 'text-slate-800'}>{delayedJobs}</b></span>
          </div>
        </div>

        {/* Scheduled Jobs */}
        <div
          onClick={() => onNavigate('timeline')}
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-emerald-400 cursor-pointer shadow-2xs hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Scheduled</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-700">{scheduledJobs}</span>
            <span className="text-[11px] text-emerald-600 font-medium">
              {totalJobs > 0 ? `${Math.round((scheduledJobs / totalJobs) * 100)}% of total` : '0%'}
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>In Progress: <b className="text-blue-600">{inProgressJobs}</b></span>
            <span>Done: <b className="text-emerald-700">{completedJobs}</b></span>
          </div>
        </div>

        {/* Manufacturing Machines */}
        <div
          onClick={() => onNavigate('resources')}
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-400 cursor-pointer shadow-2xs hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Machines</span>
            <Cpu className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{totalMachines}</span>
            <span className="text-[11px] text-slate-500">resources</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Available: <b className="text-emerald-600">{availableMachines}</b></span>
            <span>Offline: <b className="text-slate-700">{maintenanceMachines}</b></span>
          </div>
        </div>

        {/* Machine Utilization */}
        <div
          onClick={() => onNavigate('reports')}
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-400 cursor-pointer shadow-2xs hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Utilization</span>
            <Activity className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-blue-700">{overallUtilization}%</span>
            <span className="text-[11px] text-slate-500">overall load</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100">
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${overallUtilization}%` }}
              />
            </div>
          </div>
        </div>

        {/* Active Conflicts */}
        <div
          onClick={() => onNavigate('conflicts')}
          className={`p-4 rounded-xl border cursor-pointer shadow-2xs hover:shadow-sm transition-all ${
            openConflicts > 0
              ? 'bg-rose-50/70 border-rose-200 hover:border-rose-400'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Conflicts
            </span>
            <AlertTriangle
              className={`w-4 h-4 ${openConflicts > 0 ? 'text-rose-600' : 'text-slate-400'}`}
            />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-2xl font-extrabold ${
                openConflicts > 0 ? 'text-rose-700' : 'text-slate-900'
              }`}
            >
              {openConflicts}
            </span>
            <span className="text-[11px] text-slate-500">
              {openConflicts === 1 ? 'alert' : 'alerts'}
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className={openConflicts > 0 ? 'text-rose-700 font-semibold' : 'text-emerald-700'}>
              {openConflicts > 0 ? 'Requires attention' : 'All clear'}
            </span>
            <ArrowRight className="w-3 h-3 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Primary Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Machine Utilization Matrix (5 Cols) */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Machine Utilization &amp; Load</h4>
              <p className="text-xs text-slate-500">
                Real capacity consumption vs available operating shift
              </p>
            </div>
            <button
              onClick={() => onNavigate('resources')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Manage Resources
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            {machineUtilizationList.map((m) => (
              <div key={m.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                      {m.name}
                    </span>
                    <span className="text-slate-600">({m.type})</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                        m.status === 'Available'
                          ? 'bg-emerald-100 text-emerald-700'
                          : m.status === 'Busy'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-slate-500 text-[11px]">
                      {m.busyMin}m / {m.totalMin}m
                    </span>
                    <span className="font-bold text-slate-900">{m.utilizationPct}%</span>
                  </div>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      m.utilizationPct > 90
                        ? 'bg-rose-600'
                        : m.utilizationPct > 60
                        ? 'bg-blue-600'
                        : m.utilizationPct > 0
                        ? 'bg-emerald-500'
                        : 'bg-slate-300'
                    }`}
                    style={{ width: `${m.utilizationPct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Aggregate capacity note */}
          <div className="mt-5 p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs text-slate-600">
            <span>
              Total Scheduled Production Time: <b className="text-slate-900">{totalScheduledMinutes} minutes</b>
            </span>
            <span className="text-[11px] text-slate-500">
              Shift Capacity: {totalAvailableMinutes} min
            </span>
          </div>
        </div>

        {/* Jobs Breakdown by Priority & Status (6 Cols) */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Job Priority Distribution</h4>
                <p className="text-xs text-slate-500">
                  Priority ranks determine the scheduling algorithm queue
                </p>
              </div>
              <button
                onClick={() => onNavigate('jobs')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                View All Jobs
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Visual Priority Bars */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 block">
                  Critical
                </span>
                <span className="text-2xl font-extrabold text-rose-900 font-mono">
                  {priorityCounts.Critical}
                </span>
                <span className="text-[10px] text-rose-600 block mt-0.5">Top scheduling order</span>
              </div>

              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 block">
                  High
                </span>
                <span className="text-2xl font-extrabold text-amber-900 font-mono">
                  {priorityCounts.High}
                </span>
                <span className="text-[10px] text-amber-600 block mt-0.5">High priority</span>
              </div>

              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 block">
                  Medium
                </span>
                <span className="text-2xl font-extrabold text-blue-900 font-mono">
                  {priorityCounts.Medium}
                </span>
                <span className="text-[10px] text-blue-600 block mt-0.5">Standard orders</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                  Low
                </span>
                <span className="text-2xl font-extrabold text-slate-800 font-mono">
                  {priorityCounts.Low}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Buffer capacity</span>
              </div>
            </div>

            {/* Scheduled vs Unscheduled Gauge */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-800">
                  Scheduled vs Unscheduled Workload
                </span>
                <span className="font-mono text-slate-600">
                  {scheduledCount} Scheduled / {totalJobs} Total
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 flex overflow-hidden">
                <div
                  className="bg-emerald-600 h-full transition-all duration-500"
                  style={{ width: `${totalJobs > 0 ? (scheduledCount / totalJobs) * 100 : 0}%` }}
                  title={`${scheduledCount} Scheduled`}
                />
                <div
                  className="bg-amber-400 h-full transition-all duration-500"
                  style={{ width: `${totalJobs > 0 ? (unscheduledCount / totalJobs) * 100 : 0}%` }}
                  title={`${unscheduledCount} Unscheduled / Backlog`}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  Scheduled ({scheduledCount})
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Pending / Backlog ({unscheduledCount})
                </span>
              </div>
            </div>
          </div>

          {/* Quick Schedule Generator Trigger */}
          {pendingJobs > 0 && (
            <div className="mt-5 p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-blue-900 block">
                  {pendingJobs} Pending Job{pendingJobs > 1 ? 's' : ''} Ready for Scheduling
                </span>
                <span className="text-[11px] text-blue-700">
                  Run the optimization algorithm to assign available machine slots.
                </span>
              </div>
              <button
                onClick={onGenerateSchedule}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white rounded-lg shadow-2xs shrink-0 flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                Run Engine
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Active Schedule Quick Preview & Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Active Schedule Table Preview (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Current Production Schedule</h4>
              <p className="text-xs text-slate-500">
                Machine allocations ordered by operational timeline
              </p>
            </div>
            <button
              onClick={() => onNavigate('timeline')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Full Gantt View
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {schedules.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
              <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No schedule items generated yet</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Click &quot;Schedule Generator&quot; or the button below to generate machine allocations for pending jobs.
              </p>
              <button
                onClick={onGenerateSchedule}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs inline-flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                Generate Schedule Now
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Job</th>
                    <th className="p-2.5">Product</th>
                    <th className="p-2.5">Machine</th>
                    <th className="p-2.5">Window</th>
                    <th className="p-2.5">Duration</th>
                    <th className="p-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {schedules.slice(0, 6).map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-mono font-bold text-blue-700">{item.jobId}</td>
                      <td className="p-2.5 font-medium text-slate-900">{item.productName}</td>
                      <td className="p-2.5">
                        <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[11px] text-slate-700">
                          {item.resourceName}
                        </span>
                      </td>
                      <td className="p-2.5 font-mono text-emerald-700 font-semibold">
                        {item.startTime} – {item.endTime}
                      </td>
                      <td className="p-2.5 text-slate-600">{item.processingTime}m</td>
                      <td className="p-2.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            item.status === 'Delayed'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {schedules.length > 6 && (
                <div className="mt-3 text-center">
                  <button
                    onClick={() => onNavigate('timeline')}
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    + {schedules.length - 6} more scheduled items
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Production Logs & Audit Trail (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Production Audit Log</h4>
              <p className="text-xs text-slate-500">Live operational events and scheduling updates</p>
            </div>
            <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
              Active Session
            </span>
          </div>

          <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
            {(productionLogs || []).slice(0, 8).map((log) => (
              <div
                key={log.id}
                className="p-2.5 rounded-lg bg-slate-50 border border-slate-150 text-xs flex items-start gap-2.5"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">{log.action}</span>
                    <span className="text-[10px] font-mono text-slate-400">{log.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">{log.details}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
