import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Layers,
  X,
  Calendar,
} from 'lucide-react';
import { Job, JobPriority, JobStatus } from '../types';

interface Props {
  jobs: Job[];
  onAddJob: (job: Job) => void;
  onUpdateJob: (job: Job) => void;
  onDeleteJob: (jobId: string) => void;
}

export const JobsPage: React.FC<Props> = ({
  jobs,
  onAddJob,
  onUpdateJob,
  onDeleteJob,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [machineFilter, setMachineFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'priority' | 'deadline' | 'processingTime' | 'id'>('priority');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    id: string;
    productName: string;
    quantity: number;
    priority: JobPriority;
    processingTime: number;
    requiredMachineType: string;
    deadline: string;
    status: JobStatus;
    notes: string;
  }>({
    id: '',
    productName: '',
    quantity: 50,
    priority: 'Medium',
    processingTime: 30,
    requiredMachineType: 'CNC',
    deadline: '16:00',
    status: 'Pending',
    notes: '',
  });

  const [formError, setFormError] = useState<string>('');

  const machineTypes = Array.from(
    new Set(jobs.map((j) => j.requiredMachineType).concat(['CNC', 'Assembly', 'Milling', 'Welding', 'Lathe']))
  );

  // Filter & Search Logic
  const filteredJobs = jobs
    .filter((job) => {
      const matchesSearch =
        job.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.requiredMachineType.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || job.status === statusFilter;
      const matchesPriority = priorityFilter === 'ALL' || job.priority === priorityFilter;
      const matchesMachine = machineFilter === 'ALL' || job.requiredMachineType === machineFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesMachine;
    })
    .sort((a, b) => {
      if (sortBy === 'priority') {
        const weights: Record<JobPriority, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };
        return (weights[b.priority] || 0) - (weights[a.priority] || 0);
      }
      if (sortBy === 'deadline') {
        return a.deadline.localeCompare(b.deadline);
      }
      if (sortBy === 'processingTime') {
        return a.processingTime - b.processingTime;
      }
      return a.id.localeCompare(b.id);
    });

  const handleOpenAdd = () => {
    // Generate next available ID
    const nextNum = jobs.length + 1;
    const generatedId = `J${String(nextNum).padStart(3, '0')}`;
    setFormData({
      id: generatedId,
      productName: '',
      quantity: 50,
      priority: 'Medium',
      processingTime: 30,
      requiredMachineType: 'CNC',
      deadline: '16:00',
      status: 'Pending',
      notes: '',
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (job: Job) => {
    setEditingJob(job);
    setFormData({
      id: job.id,
      productName: job.productName,
      quantity: job.quantity,
      priority: job.priority,
      processingTime: job.processingTime,
      requiredMachineType: job.requiredMachineType,
      deadline: job.deadline,
      status: job.status,
      notes: job.notes || '',
    });
    setFormError('');
  };

  const handleSaveJob = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Validation
    const cleanId = formData.id.trim().toUpperCase();
    if (!cleanId) {
      setFormError('Job ID is required.');
      return;
    }

    if (!formData.productName.trim()) {
      setFormError('Product Name is required.');
      return;
    }

    if (formData.quantity <= 0) {
      setFormError('Quantity must be greater than 0.');
      return;
    }

    if (formData.processingTime <= 0) {
      setFormError('Processing Time must be greater than 0 minutes.');
      return;
    }

    if (!formData.deadline || !formData.deadline.includes(':')) {
      setFormError('Valid Deadline time (HH:MM) is required.');
      return;
    }

    // Check duplicate ID if creating new
    if (!editingJob) {
      const exists = jobs.some((j) => j.id.toUpperCase() === cleanId);
      if (exists) {
        setFormError(`Job ID '${cleanId}' already exists. Please choose a unique ID.`);
        return;
      }

      const newJob: Job = {
        ...formData,
        id: cleanId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      onAddJob(newJob);
      setIsAddModalOpen(false);
    } else {
      const updatedJob: Job = {
        ...editingJob,
        ...formData,
        id: cleanId,
        updatedAt: new Date().toISOString(),
      };
      onUpdateJob(updatedJob);
      setEditingJob(null);
    }
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
              placeholder="Search by Job ID, Product Name, Machine..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Add Job Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenAdd}
              id="add-job-button"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Job</span>
            </button>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span className="font-medium">Filters:</span>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs focus:outline-hidden focus:border-blue-500"
          >
            <option value="ALL">All Statuses ({jobs.length})</option>
            <option value="Pending">Pending</option>
            <option value="Scheduled">Scheduled</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Delayed">Delayed</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs focus:outline-hidden focus:border-blue-500"
          >
            <option value="ALL">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* Machine Filter */}
          <select
            value={machineFilter}
            onChange={(e) => setMachineFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs focus:outline-hidden focus:border-blue-500"
          >
            <option value="ALL">All Machine Types</option>
            {machineTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          {/* Sort By */}
          <div className="ml-auto flex items-center gap-1.5 text-slate-500">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span className="font-medium">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs focus:outline-hidden focus:border-blue-500 font-medium"
            >
              <option value="priority">Priority (Highest First)</option>
              <option value="deadline">Deadline (Earliest First)</option>
              <option value="processingTime">Processing Time (Shortest)</option>
              <option value="id">Job ID (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Job Orders Directory</h3>
            <p className="text-xs text-slate-500">
              Showing {filteredJobs.length} of {jobs.length} total work orders
            </p>
          </div>
          <span className="text-xs text-slate-500">
            Persistent Store: <b className="text-blue-700">jobs table</b>
          </span>
        </div>

        {filteredJobs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No matching jobs found</p>
            <p className="text-xs text-slate-400 mt-1">
              Try adjusting your search query or filters, or add a new job.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Job ID</th>
                  <th className="p-3.5">Product Name</th>
                  <th className="p-3.5">Quantity</th>
                  <th className="p-3.5">Priority</th>
                  <th className="p-3.5">Processing Time</th>
                  <th className="p-3.5">Required Machine</th>
                  <th className="p-3.5">Deadline</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredJobs.map((job) => {
                  const priorityColors = {
                    Critical: 'bg-rose-100 text-rose-700 border-rose-200',
                    High: 'bg-amber-100 text-amber-700 border-amber-200',
                    Medium: 'bg-blue-100 text-blue-700 border-blue-200',
                    Low: 'bg-slate-100 text-slate-700 border-slate-200',
                  };

                  const statusColors = {
                    Pending: 'bg-amber-50 text-amber-700 border-amber-200',
                    Scheduled: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    'In Progress': 'bg-blue-50 text-blue-700 border-blue-200',
                    Completed: 'bg-slate-100 text-slate-700 border-slate-200',
                    Delayed: 'bg-rose-50 text-rose-700 border-rose-200',
                    Cancelled: 'bg-slate-100 text-slate-400 border-slate-200',
                  };

                  return (
                    <tr key={job.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-blue-700">
                        {job.id}
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-900">{job.productName}</div>
                        {job.notes && (
                          <div className="text-[11px] text-slate-400 truncate max-w-xs">
                            {job.notes}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 font-mono text-slate-700">
                        {job.quantity} units
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                            priorityColors[job.priority]
                          }`}
                        >
                          {job.priority}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-slate-800">
                        <span className="font-bold">{job.processingTime}</span> min
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-mono rounded text-[11px]">
                          {job.requiredMachineType}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-slate-800">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{job.deadline}</span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                            statusColors[job.status]
                          }`}
                        >
                          {job.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(job)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Job"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingJobId(job.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Job"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Job Modal */}
      {(isAddModalOpen || editingJob) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold">
                  {editingJob ? `Edit Job [${editingJob.id}]` : 'Add New Production Job'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingJob(null);
                }}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveJob} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* Job ID */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Job ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingJob}
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value.toUpperCase() })}
                    placeholder="e.g. J005"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono disabled:bg-slate-100 focus:outline-hidden focus:border-blue-500"
                  />
                  <span className="text-[10px] text-slate-400">Must be unique (e.g. J001, J002)</span>
                </div>

                {/* Product Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Product Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.productName}
                    onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                    placeholder="e.g. Flange Adapter"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {/* Quantity */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Quantity <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                {/* Processing Time */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Duration (min) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    required
                    value={formData.processingTime}
                    onChange={(e) =>
                      setFormData({ ...formData, processingTime: parseInt(e.target.value, 10) || 5 })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                {/* Deadline */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Deadline (HH:MM) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {/* Priority */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Priority <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as JobPriority })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:border-blue-500"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                {/* Required Machine Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Required Machine <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.requiredMachineType}
                    onChange={(e) => setFormData({ ...formData, requiredMachineType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:border-blue-500"
                  >
                    <option value="CNC">CNC</option>
                    <option value="Assembly">Assembly</option>
                    <option value="Milling">Milling</option>
                    <option value="Welding">Welding</option>
                    <option value="Lathe">Lathe</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as JobStatus })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:border-blue-500"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Delayed">Delayed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Engineering Notes / Specs</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Material specs, tooling tolerances, or shift instructions..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingJob(null);
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  {editingJob ? 'Save Changes' : 'Create Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingJobId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Delete Job Order</h4>
                <p className="text-xs text-slate-500">
                  Are you sure you want to delete job <b className="text-slate-900">{deletingJobId}</b>?
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingJobId(null)}
                className="px-3 py-1.5 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteJob(deletingJobId);
                  setDeletingJobId(null);
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
