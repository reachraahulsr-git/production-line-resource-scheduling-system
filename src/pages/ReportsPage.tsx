import React from 'react';
import {
  Printer,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Cpu,
  Layers,
  Activity,
  Calendar,
} from 'lucide-react';
import { DatabaseState } from '../types';
import { StorageService } from '../services/storageService';
import { TimeUtility } from '../services/schedulingEngine';

interface Props {
  data: DatabaseState;
}

export const ReportsPage: React.FC<Props> = ({ data }) => {
  const { jobs, resources, schedules, conflicts } = data;

  const handlePrint = () => {
    window.print();
  };

  const handleExportJobsCSV = () => {
    const rows: (string | number)[][] = [
      ['Job ID', 'Product Name', 'Quantity', 'Priority', 'Duration (min)', 'Required Machine', 'Deadline', 'Status'],
      ...jobs.map((j) => [
        j.id,
        j.productName,
        j.quantity,
        j.priority,
        j.processingTime,
        j.requiredMachineType,
        j.deadline,
        j.status,
      ]),
    ];
    StorageService.downloadCSV(`production_jobs_${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  const handleExportScheduleCSV = () => {
    const rows: (string | number)[][] = [
      ['Schedule ID', 'Job ID', 'Product', 'Machine ID', 'Machine Name', 'Start Time', 'End Time', 'Duration', 'Deadline', 'Status'],
      ...schedules.map((s) => [
        s.id,
        s.jobId,
        s.productName,
        s.resourceId,
        s.resourceName,
        s.startTime,
        s.endTime,
        s.processingTime,
        s.deadline,
        s.status,
      ]),
    ];
    StorageService.downloadCSV(`production_schedule_${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  const handleExportConflictsCSV = () => {
    const rows: (string | number)[][] = [
      ['Conflict ID', 'Job ID', 'Machine ID', 'Type', 'Description', 'Severity', 'Status', 'Detected At'],
      ...conflicts.map((c) => [
        c.id,
        c.jobId,
        c.resourceId || 'N/A',
        c.conflictType,
        c.description,
        c.severity,
        c.status,
        c.detectedAt,
      ]),
    ];
    StorageService.downloadCSV(`production_conflicts_${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  const delayedSchedules = schedules.filter((s) => s.status === 'Delayed');
  const openConflicts = conflicts.filter((c) => c.status === 'Open');

  return (
    <div className="space-y-6 pb-16 print:p-0 print:space-y-4">
      {/* Top Controls Bar (Hidden during printing) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Executive Production Report</h3>
          <p className="text-xs text-slate-500">
            Generate and export manufacturing schedules, machine metrics, and bottleneck audits
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* CSV Export Dropdown / Buttons */}
          <button
            onClick={handleExportJobsCSV}
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Jobs CSV</span>
          </button>

          <button
            onClick={handleExportScheduleCSV}
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Export Schedule CSV</span>
          </button>

          <button
            onClick={handleExportConflictsCSV}
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-rose-600" />
            <span>Export Conflicts CSV</span>
          </button>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors ml-2"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Printable Report Canvas */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-8 space-y-8 print:border-none print:shadow-none print:p-0">
        {/* Report Official Header */}
        <div className="border-b border-slate-200 pb-5 flex items-start justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600 block">
              Manufacturing Operational Audit
            </span>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              PRODUCTION LINE RESOURCE SCHEDULING SYSTEM
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Production Plan &amp; Machine Utilization Executive Report • Generated on {new Date().toLocaleDateString()}
            </p>
          </div>
          <div className="text-right text-xs text-slate-500 font-mono">
            <div>Shift: Day Shift (08:00 – 18:00)</div>
            <div>Status: <span className="text-emerald-700 font-bold">Validated</span></div>
          </div>
        </div>

        {/* 1. Production Summary KPIs */}
        <div>
          <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            1. Production Summary Key Performance Indicators
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-[11px] text-slate-500 uppercase font-semibold block">Total Work Orders</span>
              <span className="text-2xl font-bold text-slate-900 font-mono mt-1 block">{jobs.length}</span>
              <span className="text-[11px] text-slate-500">Orders in database</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-[11px] text-slate-500 uppercase font-semibold block">Scheduled Orders</span>
              <span className="text-2xl font-bold text-emerald-700 font-mono mt-1 block">{schedules.length}</span>
              <span className="text-[11px] text-emerald-600">Successfully slotted</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-[11px] text-slate-500 uppercase font-semibold block">Active Machines</span>
              <span className="text-2xl font-bold text-blue-700 font-mono mt-1 block">{resources.length}</span>
              <span className="text-[11px] text-blue-600">Operational units</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-[11px] text-slate-500 uppercase font-semibold block">Open Conflicts</span>
              <span className={`text-2xl font-bold font-mono mt-1 block ${openConflicts.length > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                {openConflicts.length}
              </span>
              <span className="text-[11px] text-slate-500">Detected bottlenecks</span>
            </div>
          </div>
        </div>

        {/* 2. Machine Utilization Matrix */}
        <div>
          <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-600" />
            2. Machine Utilization &amp; Capacity Matrix
          </h2>

          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Resource ID</th>
                  <th className="p-3">Machine Name</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Shift Window</th>
                  <th className="p-3">Concurrent Stations</th>
                  <th className="p-3">Allocated Duration</th>
                  <th className="p-3">Utilization Rate</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {resources.map((m) => {
                  const startMin = TimeUtility.timeToMinutes(m.availableFrom);
                  const endMin = TimeUtility.timeToMinutes(m.availableTo);
                  const totalMin = Math.max(1, (endMin - startMin) * (m.capacity || 1));
                  const busyMin = schedules
                    .filter((s) => s.resourceId === m.id)
                    .reduce((sum, s) => sum + s.processingTime, 0);
                  const pct = Math.min(100, Math.round((busyMin / totalMin) * 100));

                  return (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-blue-700">{m.id}</td>
                      <td className="p-3 font-sans font-semibold text-slate-900">{m.name}</td>
                      <td className="p-3 font-sans">{m.type}</td>
                      <td className="p-3">{m.availableFrom} – {m.availableTo}</td>
                      <td className="p-3">{m.capacity} concurrent</td>
                      <td className="p-3">{busyMin} min</td>
                      <td className="p-3 font-bold text-slate-900">{pct}%</td>
                      <td className="p-3 font-sans">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          m.status === 'Available' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {m.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. Scheduled Jobs Audit */}
        <div>
          <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            3. Scheduled Jobs Schedule Table ({schedules.length} records)
          </h2>

          {schedules.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No schedule generated yet.</p>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Job ID</th>
                    <th className="p-3">Product Name</th>
                    <th className="p-3">Machine</th>
                    <th className="p-3">Priority</th>
                    <th className="p-3">Time Window</th>
                    <th className="p-3">Duration</th>
                    <th className="p-3">Deadline</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {schedules.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-blue-700">{s.jobId}</td>
                      <td className="p-3 font-sans font-medium text-slate-900">{s.productName}</td>
                      <td className="p-3 font-sans">{s.resourceName}</td>
                      <td className="p-3 font-sans">{s.priority}</td>
                      <td className="p-3 text-emerald-700 font-semibold">{s.startTime} – {s.endTime}</td>
                      <td className="p-3">{s.processingTime} min</td>
                      <td className="p-3">{s.deadline}</td>
                      <td className="p-3 font-sans">{s.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 4. Delayed Jobs & Risk Analysis */}
        <div>
          <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            4. Delayed Jobs &amp; Deadline Breaches ({delayedSchedules.length})
          </h2>

          {delayedSchedules.length === 0 ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>All scheduled jobs complete within designated deadlines. Zero delays observed.</span>
            </div>
          ) : (
            <div className="border border-rose-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-rose-50 text-rose-900 font-semibold border-b border-rose-200">
                  <tr>
                    <th className="p-3">Job ID</th>
                    <th className="p-3">Product Name</th>
                    <th className="p-3">Scheduled End</th>
                    <th className="p-3">Deadline</th>
                    <th className="p-3">Delay Exceeded</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rose-100">
                  {delayedSchedules.map((d) => (
                    <tr key={d.id} className="hover:bg-rose-50/50 text-rose-900">
                      <td className="p-3 font-bold">{d.jobId}</td>
                      <td className="p-3 font-sans">{d.productName}</td>
                      <td className="p-3 font-bold">{d.endTime}</td>
                      <td className="p-3">{d.deadline}</td>
                      <td className="p-3 font-bold text-rose-700">+{d.delayMinutes} min late</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 5. Production Conflicts & Resolution Log */}
        <div>
          <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            5. Conflict &amp; Constraint Auditing Log ({conflicts.length})
          </h2>

          {conflicts.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No conflict entries recorded.</p>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Conflict ID</th>
                    <th className="p-3">Job</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Severity</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {conflicts.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-600">{c.id}</td>
                      <td className="p-3 text-blue-700 font-bold">{c.jobId}</td>
                      <td className="p-3 font-sans font-semibold text-slate-900">{c.conflictType}</td>
                      <td className="p-3 font-sans">{c.severity}</td>
                      <td className="p-3 font-sans text-slate-700 max-w-sm">{c.description}</td>
                      <td className="p-3 font-sans">{c.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Academic Project Sign-Off Block */}
        <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-500">
          <div>
            <b>Team:</b> Raahul S R (RA2511003050314), Tamilamuthan S (RA2511003050357), Narendranath S (RA2511003050360)
          </div>
          <div className="font-mono">
            Domain: Manufacturing / Production Management
          </div>
        </div>
      </div>
    </div>
  );
};
