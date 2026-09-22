import React, { useState } from 'react';
import {
  CalendarRange,
  Filter,
  Clock,
  ChevronLeft,
  ChevronRight,
  Layers,
  Cpu,
  AlertCircle,
  Table as TableIcon,
  Search,
} from 'lucide-react';
import { Resource, ScheduleItem } from '../types';
import { TimeUtility } from '../services/schedulingEngine';

interface Props {
  schedules: ScheduleItem[];
  resources: Resource[];
  onNavigateToGenerator: () => void;
}

export const ScheduleTimelinePage: React.FC<Props> = ({
  schedules,
  resources,
  onNavigateToGenerator,
}) => {
  const [selectedMachineId, setSelectedMachineId] = useState<string>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [tableSearch, setTableSearch] = useState<string>('');
  const [hoveredItem, setHoveredItem] = useState<ScheduleItem | null>(null);

  // Define Timeline Horizon: 08:00 (480 min) to 18:00 (1080 min) = 600 minutes
  const TIMELINE_START_HOUR = 8;
  const TIMELINE_END_HOUR = 18;
  const TIMELINE_TOTAL_MINUTES = (TIMELINE_END_HOUR - TIMELINE_START_HOUR) * 60; // 600 min

  const hoursArray = Array.from(
    { length: TIMELINE_END_HOUR - TIMELINE_START_HOUR + 1 },
    (_, i) => TIMELINE_START_HOUR + i
  );

  const filteredResources = resources.filter(
    (r) => selectedMachineId === 'ALL' || r.id === selectedMachineId
  );

  const filteredSchedules = schedules.filter((s) => {
    const matchesMachine = selectedMachineId === 'ALL' || s.resourceId === selectedMachineId;
    const matchesSearch =
      s.jobId.toLowerCase().includes(tableSearch.toLowerCase()) ||
      s.productName.toLowerCase().includes(tableSearch.toLowerCase()) ||
      s.resourceName.toLowerCase().includes(tableSearch.toLowerCase());
    return matchesMachine && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Filter & Horizon Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-600 font-semibold">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span>Filter Timeline:</span>
          </div>

          {/* Machine Filter */}
          <select
            value={selectedMachineId}
            onChange={(e) => setSelectedMachineId(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-medium focus:outline-hidden focus:border-blue-500"
          >
            <option value="ALL">All Machines ({resources.length})</option>
            {resources.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.type})
              </option>
            ))}
          </select>

          {/* Date Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs text-slate-800 font-mono focus:outline-hidden"
            />
          </div>
        </div>

        {/* Priority Legend */}
        <div className="flex items-center gap-3 text-[11px] font-medium text-slate-600">
          <span className="text-slate-400 text-xs font-semibold">Priority:</span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" /> Critical
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> High
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" /> Medium
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-400" /> Low
          </span>
        </div>
      </div>

      {/* Visual Gantt Chart */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Machine-Wise Visual Gantt Chart</h3>
            <p className="text-xs text-slate-500">
              Vertical axis represents manufacturing machines; horizontal axis denotes operating hours (08:00 – 18:00)
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">
            Active Allocations: <b className="text-blue-700">{schedules.length}</b>
          </span>
        </div>

        {schedules.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <CalendarRange className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-800">No scheduled allocations found</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Please open the Schedule Generator and click &quot;GENERATE SCHEDULE&quot; to populate the timeline.
            </p>
            <button
              onClick={onNavigateToGenerator}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs"
            >
              Open Schedule Generator
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto p-4">
            <div className="min-w-[850px]">
              {/* Horizontal Time Scale Header */}
              <div className="flex border-b border-slate-200 pb-2 mb-3">
                <div className="w-48 shrink-0 text-xs font-bold text-slate-700 pl-2">
                  Machine Track
                </div>
                <div className="flex-1 relative flex justify-between text-[11px] font-mono text-slate-500 pr-2">
                  {hoursArray.map((hour) => (
                    <div key={hour} className="text-center">
                      <span>{hour.toString().padStart(2, '0')}:00</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Machine Tracks */}
              <div className="space-y-4">
                {filteredResources.map((machine) => {
                  const machineSchedules = schedules.filter((s) => s.resourceId === machine.id);

                  return (
                    <div
                      key={machine.id}
                      className="flex items-center rounded-xl bg-slate-50 border border-slate-200/80 p-2 hover:bg-slate-50/90 transition-colors"
                    >
                      {/* Machine Title & Info (Vertical Axis) */}
                      <div className="w-48 shrink-0 pr-3 border-r border-slate-200">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                            {machine.name}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {machine.type}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{machine.availableFrom}–{machine.availableTo}</span>
                        </div>
                      </div>

                      {/* Timeline Track (Horizontal Axis) */}
                      <div className="flex-1 h-14 relative mx-2 bg-white rounded-lg border border-slate-200 overflow-hidden shadow-inner">
                        {/* Grid hour divider lines */}
                        <div className="absolute inset-0 flex justify-between pointer-events-none">
                          {hoursArray.map((hour, idx) => (
                            <div
                              key={hour}
                              className={`h-full border-r ${
                                idx === 0 ? 'border-transparent' : 'border-slate-100'
                              }`}
                              style={{ width: `${100 / (hoursArray.length - 1)}%` }}
                            />
                          ))}
                        </div>

                        {/* Scheduled Job Blocks */}
                        {machineSchedules.map((item) => {
                          const startMinutes = TimeUtility.timeToMinutes(item.startTime);
                          const endMinutes = TimeUtility.timeToMinutes(item.endTime);

                          const timelineOriginMinutes = TIMELINE_START_HOUR * 60; // 480
                          const leftPct = Math.max(
                            0,
                            Math.min(
                              100,
                              ((startMinutes - timelineOriginMinutes) / TIMELINE_TOTAL_MINUTES) * 100
                            )
                          );
                          const widthPct = Math.max(
                            2,
                            Math.min(
                              100 - leftPct,
                              ((endMinutes - startMinutes) / TIMELINE_TOTAL_MINUTES) * 100
                            )
                          );

                          const priorityBg: Record<string, string> = {
                            Critical: 'bg-rose-600 border-rose-700 text-white',
                            High: 'bg-amber-500 border-amber-600 text-white',
                            Medium: 'bg-blue-600 border-blue-700 text-white',
                            Low: 'bg-slate-600 border-slate-700 text-white',
                          };

                          const blockStyle = priorityBg[item.priority] || 'bg-blue-600 text-white';

                          return (
                            <div
                              key={item.id}
                              onMouseEnter={() => setHoveredItem(item)}
                              onMouseLeave={() => setHoveredItem(null)}
                              className={`absolute top-1.5 bottom-1.5 rounded-md px-2 py-0.5 border shadow-xs cursor-pointer flex flex-col justify-center transition-transform hover:scale-[1.02] hover:z-10 select-none ${blockStyle}`}
                              style={{
                                left: `${leftPct}%`,
                                width: `${widthPct}%`,
                              }}
                            >
                              <div className="flex items-center justify-between text-[11px] font-bold truncate leading-tight">
                                <span className="font-mono">{item.jobId}</span>
                                <span className="text-[10px] font-mono opacity-90">
                                  {item.processingTime}m
                                </span>
                              </div>
                              <div className="text-[10px] truncate opacity-90 leading-tight">
                                {item.productName}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Hover / Click Detail Popover */}
        {hoveredItem && (
          <div className="p-3 bg-slate-900 text-white text-xs border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-blue-400 bg-slate-800 px-2 py-1 rounded">
                {hoveredItem.jobId}
              </span>
              <span className="font-semibold">{hoveredItem.productName}</span>
              <span className="text-slate-400">|</span>
              <span>Machine: <b className="text-white">{hoveredItem.resourceName}</b></span>
              <span className="text-slate-400">|</span>
              <span className="font-mono text-emerald-400">
                {hoveredItem.startTime} – {hoveredItem.endTime} ({hoveredItem.processingTime} min)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span>Deadline: <b className="font-mono">{hoveredItem.deadline}</b></span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  hoveredItem.status === 'Delayed'
                    ? 'bg-rose-500 text-white'
                    : 'bg-emerald-500 text-white'
                }`}
              >
                {hoveredItem.status} {hoveredItem.delayMinutes ? `(+${hoveredItem.delayMinutes}m)` : ''}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Schedule Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Schedule Allocations Table</h3>
            <p className="text-xs text-slate-500">
              Detailed breakdown of machine start and completion times
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder="Search schedule table..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-blue-500"
            />
          </div>
        </div>

        {filteredSchedules.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No schedule records match the current filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Job ID</th>
                  <th className="p-3">Product Name</th>
                  <th className="p-3">Machine</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Start Time</th>
                  <th className="p-3">End Time</th>
                  <th className="p-3">Processing Time</th>
                  <th className="p-3">Deadline</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSchedules.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 font-mono">
                    <td className="p-3 font-bold text-blue-700">{item.jobId}</td>
                    <td className="p-3 font-sans font-medium text-slate-900">{item.productName}</td>
                    <td className="p-3 font-sans">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded font-semibold text-[11px]">
                        {item.resourceName}
                      </span>
                    </td>
                    <td className="p-3 font-sans">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          item.priority === 'Critical'
                            ? 'bg-rose-100 text-rose-700'
                            : item.priority === 'High'
                            ? 'bg-amber-100 text-amber-700'
                            : item.priority === 'Medium'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {item.priority}
                      </span>
                    </td>
                    <td className="p-3 text-emerald-700 font-bold">{item.startTime}</td>
                    <td className="p-3 text-slate-800 font-bold">{item.endTime}</td>
                    <td className="p-3 text-slate-700">{item.processingTime} min</td>
                    <td className="p-3 text-slate-600">{item.deadline}</td>
                    <td className="p-3 font-sans">
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
          </div>
        )}
      </div>
    </div>
  );
};
