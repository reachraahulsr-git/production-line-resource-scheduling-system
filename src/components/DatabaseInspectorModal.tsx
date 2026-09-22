import React, { useState } from 'react';
import { Database, Table, Code, X, RefreshCw, Download, CheckCircle2 } from 'lucide-react';
import { DatabaseState } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  databaseState: DatabaseState;
  onReset: () => void;
}

export const DatabaseInspectorModal: React.FC<Props> = ({
  isOpen,
  onClose,
  databaseState,
  onReset,
}) => {
  const [activeTab, setActiveTab] = useState<'schema' | 'jobs' | 'resources' | 'schedules' | 'conflicts' | 'logs' | 'raw'>('schema');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const sqlSchema = `-- PRODUCTION LINE RESOURCE SCHEDULING SYSTEM
-- RELATIONAL DATABASE SCHEMA (SQLITE / POSTGRESQL COMPATIBLE)

CREATE TABLE IF NOT EXISTS jobs (
    id VARCHAR(20) PRIMARY KEY,
    product_name VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    priority VARCHAR(15) NOT NULL CHECK (priority IN ('Critical', 'High', 'Medium', 'Low')),
    processing_time INTEGER NOT NULL CHECK (processing_time > 0),
    required_machine_type VARCHAR(50) NOT NULL,
    deadline TIME NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS resources (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'Available',
    available_from TIME NOT NULL DEFAULT '08:00',
    available_to TIME NOT NULL DEFAULT '17:00',
    location VARCHAR(100),
    maintenance_note TEXT
);

CREATE TABLE IF NOT EXISTS schedules (
    id VARCHAR(50) PRIMARY KEY,
    job_id VARCHAR(20) NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    product_name VARCHAR(100) NOT NULL,
    resource_id VARCHAR(20) NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    resource_name VARCHAR(100) NOT NULL,
    machine_type VARCHAR(50) NOT NULL,
    priority VARCHAR(15) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    processing_time INTEGER NOT NULL,
    schedule_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Scheduled',
    deadline TIME NOT NULL,
    delay_minutes INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS conflicts (
    id VARCHAR(20) PRIMARY KEY,
    job_id VARCHAR(20) NOT NULL,
    resource_id VARCHAR(20),
    conflict_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(15) NOT NULL CHECK (severity IN ('Critical', 'Warning', 'Information')),
    status VARCHAR(20) NOT NULL DEFAULT 'Open',
    detected_at VARCHAR(20) NOT NULL,
    resolved_at VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS production_logs (
    id VARCHAR(20) PRIMARY KEY,
    timestamp VARCHAR(20) NOT NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT NOT NULL,
    category VARCHAR(30) NOT NULL
);`;

  const handleCopySchema = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJSON = () => {
    const blob = new Blob([JSON.stringify(databaseState, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `production_database_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Database & Relational Schema Inspector</h2>
              <p className="text-xs text-slate-300">
                Persistent relational data model • 5 Tables • SQLite / PostgreSQL DDL
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadJSON}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
              title="Download database snapshot JSON"
            >
              <Download className="w-3.5 h-3.5" />
              Export JSON
            </button>
            <button
              onClick={onReset}
              className="px-3 py-1.5 bg-rose-600/80 hover:bg-rose-600 text-xs font-medium text-white rounded-lg flex items-center gap-1.5 transition-colors"
              title="Reset to default sample records"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset DB
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 py-2.5 bg-slate-100 border-b border-slate-200 overflow-x-auto text-sm">
          <button
            onClick={() => setActiveTab('schema')}
            className={`px-3 py-1.5 rounded-lg font-medium text-xs flex items-center gap-1.5 transition-colors ${
              activeTab === 'schema'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            SQL Schema (DDL)
          </button>
          <button
            onClick={() => setActiveTab('jobs')}
            className={`px-3 py-1.5 rounded-lg font-medium text-xs flex items-center gap-1.5 transition-colors ${
              activeTab === 'jobs'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            jobs ({databaseState.jobs.length})
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            className={`px-3 py-1.5 rounded-lg font-medium text-xs flex items-center gap-1.5 transition-colors ${
              activeTab === 'resources'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            resources ({databaseState.resources.length})
          </button>
          <button
            onClick={() => setActiveTab('schedules')}
            className={`px-3 py-1.5 rounded-lg font-medium text-xs flex items-center gap-1.5 transition-colors ${
              activeTab === 'schedules'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            schedules ({databaseState.schedules.length})
          </button>
          <button
            onClick={() => setActiveTab('conflicts')}
            className={`px-3 py-1.5 rounded-lg font-medium text-xs flex items-center gap-1.5 transition-colors ${
              activeTab === 'conflicts'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            conflicts ({databaseState.conflicts.length})
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-1.5 rounded-lg font-medium text-xs flex items-center gap-1.5 transition-colors ${
              activeTab === 'logs'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            production_logs ({databaseState.productionLogs?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('raw')}
            className={`px-3 py-1.5 rounded-lg font-medium text-xs flex items-center gap-1.5 transition-colors ${
              activeTab === 'raw'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            Raw JSON Dump
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto p-6 bg-slate-50 font-sans">
          {activeTab === 'schema' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Relational SQLite / SQL DDL Definitions</h3>
                  <p className="text-xs text-slate-500">
                    Defines normalized entities with Primary Keys, Foreign Keys, CHECK constraints, and indexes.
                  </p>
                </div>
                <button
                  onClick={handleCopySchema}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5"
                >
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Code className="w-3.5 h-3.5" />}
                  {copied ? 'Copied SQL!' : 'Copy SQL Script'}
                </button>
              </div>
              <pre className="p-4 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto leading-relaxed border border-slate-800 shadow-inner">
                {sqlSchema}
              </pre>
            </div>
          )}

          {activeTab === 'jobs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Table: jobs ({databaseState.jobs.length} records)
                </span>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">id (PK)</th>
                      <th className="p-3">product_name</th>
                      <th className="p-3">quantity</th>
                      <th className="p-3">priority</th>
                      <th className="p-3">processing_time</th>
                      <th className="p-3">required_machine</th>
                      <th className="p-3">deadline</th>
                      <th className="p-3">status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {databaseState.jobs.map((job) => (
                      <tr key={job.id} className="hover:bg-slate-50 font-mono">
                        <td className="p-3 font-bold text-blue-700">{job.id}</td>
                        <td className="p-3 font-sans text-slate-900 font-medium">{job.productName}</td>
                        <td className="p-3">{job.quantity}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-sans font-semibold ${
                              job.priority === 'Critical'
                                ? 'bg-rose-100 text-rose-700'
                                : job.priority === 'High'
                                ? 'bg-amber-100 text-amber-700'
                                : job.priority === 'Medium'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {job.priority}
                          </span>
                        </td>
                        <td className="p-3">{job.processingTime} min</td>
                        <td className="p-3 font-sans">{job.requiredMachineType}</td>
                        <td className="p-3">{job.deadline}</td>
                        <td className="p-3 font-sans">{job.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'resources' && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Table: resources ({databaseState.resources.length} records)
              </span>
              <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">id (PK)</th>
                      <th className="p-3">name</th>
                      <th className="p-3">type</th>
                      <th className="p-3">capacity</th>
                      <th className="p-3">status</th>
                      <th className="p-3">operating_window</th>
                      <th className="p-3">location</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {databaseState.resources.map((res) => (
                      <tr key={res.id} className="hover:bg-slate-50 font-mono">
                        <td className="p-3 font-bold text-blue-700">{res.id}</td>
                        <td className="p-3 font-sans font-medium text-slate-900">{res.name}</td>
                        <td className="p-3 font-sans">{res.type}</td>
                        <td className="p-3">{res.capacity} concurrent</td>
                        <td className="p-3 font-sans">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              res.status === 'Available'
                                ? 'bg-emerald-100 text-emerald-700'
                                : res.status === 'Busy'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {res.status}
                          </span>
                        </td>
                        <td className="p-3">
                          {res.availableFrom} – {res.availableTo}
                        </td>
                        <td className="p-3 font-sans text-slate-600">{res.location || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'schedules' && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Table: schedules ({databaseState.schedules.length} records)
              </span>
              {databaseState.schedules.length === 0 ? (
                <div className="p-8 bg-white border border-slate-200 rounded-xl text-center text-slate-500">
                  <p className="text-sm">No schedule records generated yet.</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Click &quot;Schedule Generator&quot; in sidebar to run the scheduling algorithm.
                  </p>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-3">id (PK)</th>
                        <th className="p-3">job_id (FK)</th>
                        <th className="p-3">resource (FK)</th>
                        <th className="p-3">start_time</th>
                        <th className="p-3">end_time</th>
                        <th className="p-3">duration</th>
                        <th className="p-3">deadline</th>
                        <th className="p-3">status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {databaseState.schedules.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50">
                          <td className="p-3 text-slate-500">{s.id}</td>
                          <td className="p-3 font-bold text-blue-700">{s.jobId}</td>
                          <td className="p-3 font-sans font-medium text-slate-900">{s.resourceName}</td>
                          <td className="p-3 text-emerald-700 font-bold">{s.startTime}</td>
                          <td className="p-3 text-slate-800 font-bold">{s.endTime}</td>
                          <td className="p-3">{s.processingTime}m</td>
                          <td className="p-3">{s.deadline}</td>
                          <td className="p-3 font-sans">{s.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'conflicts' && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Table: conflicts ({databaseState.conflicts.length} records)
              </span>
              {databaseState.conflicts.length === 0 ? (
                <div className="p-8 bg-white border border-slate-200 rounded-xl text-center text-slate-500">
                  <p className="text-sm">No conflict records currently active.</p>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-3">id</th>
                        <th className="p-3">job_id</th>
                        <th className="p-3">conflict_type</th>
                        <th className="p-3">severity</th>
                        <th className="p-3">description</th>
                        <th className="p-3">status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {databaseState.conflicts.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50 font-mono">
                          <td className="p-3 font-bold text-slate-600">{c.id}</td>
                          <td className="p-3 text-blue-700 font-bold">{c.jobId}</td>
                          <td className="p-3 font-sans font-medium text-slate-800">{c.conflictType}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-sans font-semibold ${
                                c.severity === 'Critical'
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              {c.severity}
                            </span>
                          </td>
                          <td className="p-3 font-sans text-slate-700">{c.description}</td>
                          <td className="p-3 font-sans">{c.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Table: production_logs (Audit Trail)
              </span>
              <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">id</th>
                      <th className="p-3">timestamp</th>
                      <th className="p-3">category</th>
                      <th className="p-3">action</th>
                      <th className="p-3">details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(databaseState.productionLogs || []).map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50 font-mono">
                        <td className="p-3 text-slate-400">{l.id}</td>
                        <td className="p-3 text-slate-600">{l.timestamp}</td>
                        <td className="p-3 font-sans">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px]">
                            {l.category}
                          </span>
                        </td>
                        <td className="p-3 font-sans font-semibold text-slate-900">{l.action}</td>
                        <td className="p-3 font-sans text-slate-600">{l.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'raw' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Full Persistent JSON Snapshot
                </span>
              </div>
              <pre className="p-4 bg-slate-900 text-slate-200 font-mono text-xs rounded-xl overflow-x-auto max-h-[500px]">
                {JSON.stringify(databaseState, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
