import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  Cpu,
  Edit2,
  Trash2,
  AlertCircle,
  Clock,
  Wrench,
  PowerOff,
  CheckCircle2,
  X,
  Activity,
  Layers,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { MachineStatus, Resource, ScheduleItem } from '../types';
import { TimeUtility } from '../services/schedulingEngine';

interface Props {
  resources: Resource[];
  schedules: ScheduleItem[];
  onAddResource: (resource: Resource) => void;
  onUpdateResource: (resource: Resource) => void;
  onDeleteResource: (resourceId: string) => void;
  onSimulateBreakdown: (resourceId: string) => void;
}

export const ResourcesPage: React.FC<Props> = ({
  resources,
  schedules,
  onAddResource,
  onUpdateResource,
  onDeleteResource,
  onSimulateBreakdown,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [deletingResourceId, setDeletingResourceId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    id: string;
    name: string;
    type: string;
    capacity: number;
    status: MachineStatus;
    availableFrom: string;
    availableTo: string;
    location: string;
    maintenanceNote: string;
  }>({
    id: '',
    name: '',
    type: 'CNC',
    capacity: 1,
    status: 'Available',
    availableFrom: '08:00',
    availableTo: '17:00',
    location: 'Bay 1 - Production',
    maintenanceNote: '',
  });

  const [formError, setFormError] = useState('');

  const resourceTypes = Array.from(
    new Set(resources.map((r) => r.type).concat(['CNC', 'Assembly', 'Milling', 'Welding', 'Lathe']))
  );

  const filteredResources = resources.filter((resource) => {
    const matchesSearch =
      resource.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.type.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || resource.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || resource.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const handleOpenAdd = () => {
    const nextNum = resources.length + 1;
    const generatedId = `M${String(nextNum).padStart(3, '0')}`;
    setFormData({
      id: generatedId,
      name: '',
      type: 'CNC',
      capacity: 1,
      status: 'Available',
      availableFrom: '08:00',
      availableTo: '17:00',
      location: `Bay ${nextNum} - Production`,
      maintenanceNote: '',
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (res: Resource) => {
    setEditingResource(res);
    setFormData({
      id: res.id,
      name: res.name,
      type: res.type,
      capacity: res.capacity,
      status: res.status,
      availableFrom: res.availableFrom,
      availableTo: res.availableTo,
      location: res.location || '',
      maintenanceNote: res.maintenanceNote || '',
    });
    setFormError('');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const cleanId = formData.id.trim().toUpperCase();
    if (!cleanId) {
      setFormError('Resource ID is required.');
      return;
    }

    if (!formData.name.trim()) {
      setFormError('Machine Name is required.');
      return;
    }

    if (formData.capacity <= 0) {
      setFormError('Capacity must be at least 1.');
      return;
    }

    const startMin = TimeUtility.timeToMinutes(formData.availableFrom);
    const endMin = TimeUtility.timeToMinutes(formData.availableTo);
    if (endMin <= startMin) {
      setFormError('Available To time must be strictly after Available From time.');
      return;
    }

    if (!editingResource) {
      const exists = resources.some((r) => r.id.toUpperCase() === cleanId);
      if (exists) {
        setFormError(`Resource ID '${cleanId}' already exists.`);
        return;
      }

      onAddResource({
        ...formData,
        id: cleanId,
      });
      setIsAddModalOpen(false);
    } else {
      onUpdateResource({
        ...editingResource,
        ...formData,
        id: cleanId,
      });
      setEditingResource(null);
    }
  };

  // Quick toggle status handler
  const handleQuickStatusChange = (resource: Resource, newStatus: MachineStatus) => {
    onUpdateResource({
      ...resource,
      status: newStatus,
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Action & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Machine Name, Resource ID, Type..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Add Machine Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenAdd}
              id="add-machine-button"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Machine</span>
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span className="font-medium">Filter Machines:</span>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs focus:outline-hidden focus:border-blue-500"
          >
            <option value="ALL">All Statuses ({resources.length})</option>
            <option value="Available">Available</option>
            <option value="Busy">Busy</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Offline">Offline</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs focus:outline-hidden focus:border-blue-500"
          >
            <option value="ALL">All Machine Types</option>
            {resourceTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Machine Cards / Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredResources.map((machine) => {
          // Machine utilization & active jobs calculation
          const startMin = TimeUtility.timeToMinutes(machine.availableFrom);
          const endMin = TimeUtility.timeToMinutes(machine.availableTo);
          const totalShiftMin = Math.max(1, (endMin - startMin) * (machine.capacity || 1));

          const machineSchedules = schedules.filter((s) => s.resourceId === machine.id);
          const busyMin = machineSchedules.reduce((acc, s) => acc + s.processingTime, 0);
          const utilizationPct = Math.min(100, Math.round((busyMin / totalShiftMin) * 100));

          const statusColors: Record<MachineStatus, { bg: string; text: string; border: string; badge: string }> = {
            Available: {
              bg: 'bg-emerald-50',
              text: 'text-emerald-800',
              border: 'border-emerald-200',
              badge: 'bg-emerald-100 text-emerald-800',
            },
            Busy: {
              bg: 'bg-blue-50',
              text: 'text-blue-800',
              border: 'border-blue-200',
              badge: 'bg-blue-100 text-blue-800',
            },
            Maintenance: {
              bg: 'bg-amber-50',
              text: 'text-amber-800',
              border: 'border-amber-200',
              badge: 'bg-amber-100 text-amber-800',
            },
            Offline: {
              bg: 'bg-rose-50',
              text: 'text-rose-800',
              border: 'border-rose-200',
              badge: 'bg-rose-100 text-rose-800',
            },
          };

          const style = statusColors[machine.status];

          return (
            <div
              key={machine.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-800 rounded">
                        {machine.id}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">
                        {machine.type}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1.5">{machine.name}</h3>
                    <p className="text-xs text-slate-500">{machine.location || 'Main Floor'}</p>
                  </div>

                  {/* Status Dropdown / Badge */}
                  <select
                    value={machine.status}
                    onChange={(e) => handleQuickStatusChange(machine, e.target.value as MachineStatus)}
                    className={`text-xs font-bold px-2.5 py-1 rounded-lg border focus:outline-hidden cursor-pointer ${style.badge}`}
                  >
                    <option value="Available">Available</option>
                    <option value="Busy">Busy</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Offline">Offline</option>
                  </select>
                </div>

                {/* Operating Window & Capacity */}
                <div className="mt-4 grid grid-cols-2 gap-3 py-3 border-y border-slate-100 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">Operating Shift</span>
                    <div className="flex items-center gap-1 font-mono font-semibold text-slate-800 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span>{machine.availableFrom} – {machine.availableTo}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">Concurrent Capacity</span>
                    <span className="font-mono font-semibold text-slate-800 mt-0.5 block">
                      {machine.capacity} {machine.capacity === 1 ? 'Station' : 'Stations'}
                    </span>
                  </div>
                </div>

                {/* Utilization Progress */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-blue-600" />
                      Shift Utilization
                    </span>
                    <span className="font-mono font-bold text-slate-900">{utilizationPct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        utilizationPct > 80
                          ? 'bg-rose-500'
                          : utilizationPct > 50
                          ? 'bg-blue-600'
                          : utilizationPct > 0
                          ? 'bg-emerald-500'
                          : 'bg-slate-300'
                      }`}
                      style={{ width: `${utilizationPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                    <span>{busyMin}m scheduled</span>
                    <span>{totalShiftMin}m total</span>
                  </div>
                </div>

                {/* Scheduled Jobs Preview */}
                <div className="mt-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Assigned Work Orders ({machineSchedules.length})
                  </span>
                  {machineSchedules.length === 0 ? (
                    <span className="text-xs text-slate-400 italic">No jobs currently slotted</span>
                  ) : (
                    <div className="space-y-1">
                      {machineSchedules.slice(0, 2).map((s) => (
                        <div
                          key={s.id}
                          className="px-2 py-1 bg-slate-50 border border-slate-150 rounded text-xs flex items-center justify-between"
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="font-mono font-bold text-blue-700">{s.jobId}</span>
                            <span className="truncate text-slate-700">{s.productName}</span>
                          </div>
                          <span className="font-mono text-[11px] text-emerald-700 font-semibold shrink-0">
                            {s.startTime}
                          </span>
                        </div>
                      ))}
                      {machineSchedules.length > 2 && (
                        <span className="text-[11px] text-blue-600 block">
                          +{machineSchedules.length - 2} more assignments
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(machine)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit Machine Properties"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingResourceId(machine.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete Machine"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Reschedule Simulation Trigger */}
                {machineSchedules.length > 0 && machine.status !== 'Maintenance' && (
                  <button
                    onClick={() => onSimulateBreakdown(machine.id)}
                    className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-semibold rounded-lg border border-amber-200 transition-colors flex items-center gap-1"
                    title="Simulate machine breakdown to demonstrate rescheduling feature"
                  >
                    <Wrench className="w-3 h-3 text-amber-600" />
                    <span>Simulate Breakdown</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Resource Modal */}
      {(isAddModalOpen || editingResource) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold">
                  {editingResource ? `Edit Machine [${editingResource.id}]` : 'Add Manufacturing Resource'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingResource(null);
                }}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Resource ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingResource}
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value.toUpperCase() })}
                    placeholder="e.g. M004"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono disabled:bg-slate-100 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Machine Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. CNC-03 or MILL-01"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Machine Type <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    placeholder="e.g. CNC, Assembly"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Capacity (Concurrent) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    required
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as MachineStatus })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:border-blue-500"
                  >
                    <option value="Available">Available</option>
                    <option value="Busy">Busy</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Offline">Offline</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Available From <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.availableFrom}
                    onChange={(e) => setFormData({ ...formData, availableFrom: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Available To <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.availableTo}
                    onChange={(e) => setFormData({ ...formData, availableTo: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Location / Workshop Bay</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Bay 2 - Precision Machining"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingResource(null);
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  {editingResource ? 'Save Changes' : 'Create Machine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingResourceId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Delete Machine</h4>
                <p className="text-xs text-slate-500">
                  Are you sure you want to remove machine <b className="text-slate-900">{deletingResourceId}</b>?
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingResourceId(null)}
                className="px-3 py-1.5 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteResource(deletingResourceId);
                  setDeletingResourceId(null);
                }}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-xs"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
