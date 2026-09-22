import React from 'react';
import {
  Layers,
  Cpu,
  Zap,
  ShieldCheck,
  Users,
  Code,
  BookOpen,
  CheckCircle2,
  GitBranch,
  Terminal,
  Database,
  ArrowRight,
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  const team = [
    {
      name: 'Raahul S R',
      regNo: 'RA2511003050314',
      role: 'Lead Developer & Algorithms Engineer',
      contributions: 'Scheduling Engine Design, EDF Sorting, Continuous Slot Allocation, Express Server Architecture',
    },
    {
      name: 'Tamilamuthan S',
      regNo: 'RA2511003050357',
      role: 'Frontend Architect & UI/UX Designer',
      contributions: 'Interactive Gantt Chart, Machine Utilization Visualizers, Responsive Sidebar & Navigation',
    },
    {
      name: 'Narendranath S',
      regNo: 'RA2511003050360',
      role: 'Systems Analyst & Quality Verification',
      contributions: 'Conflict Detection Auditor, Rescheduling Flow Modeling, CSV Export & Report Generator',
    },
  ];

  const techStack = [
    { name: 'React 19 & TypeScript', category: 'Frontend', role: 'Component-driven reactive user interface with strict static typing' },
    { name: 'Tailwind CSS v4', category: 'Styling', role: 'Design system, utility classes, print stylesheets, responsive layouts' },
    { name: 'Node.js & Express 4', category: 'Backend Server', role: 'RESTful API endpoints, persistence controller, database synchronization' },
    { name: 'Local JSON / IndexedDB Engine', category: 'Data Layer', role: 'Simulated relational storage with full ACID-like table collections' },
    { name: 'Lucide React', category: 'Iconography', role: 'Unified industrial and manufacturing icon suite' },
  ];

  const workflowSteps = [
    { step: 1, title: 'Job Order Intake', desc: 'Work orders entered with product name, quantity, priority, duration, machine requirement, and deadline.' },
    { step: 2, title: 'Resource Registry', desc: 'Machines registered with type, station capacity, and operational shift availability.' },
    { step: 3, title: 'Multi-Criteria Sorting', desc: 'Engine sorts pending jobs primarily by priority (Critical > High > Med > Low) and secondarily by EDF.' },
    { step: 4, title: 'Slot Search & Allocation', desc: 'Finds first non-overlapping continuous slot on compatible machine within working hours.' },
    { step: 5, title: 'Conflict Auditing & Reschedule', desc: 'Real-time auditor verifies overlap invariants, machine maintenance states, and deadline margins.' },
  ];

  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto">
      {/* Hero Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-8 border border-slate-800 shadow-md">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600/30 border border-blue-500/40 rounded-full text-xs font-semibold text-blue-300">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Academic Capstone &amp; Industrial Systems Project</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            PRODUCTION LINE RESOURCE SCHEDULING SYSTEM
          </h1>
          <p className="text-sm text-blue-200 font-medium">
            Smart Production Planning &amp; Resource Optimization
          </p>
          <p className="text-xs text-slate-300 leading-relaxed pt-2">
            A specialized manufacturing execution system (MES) designed to solve complex job-shop machine allocation challenges, prevent bottleneck collisions, balance shift loads, and execute autonomous rescheduling during machine breakdowns.
          </p>
        </div>
      </div>

      {/* Team Members Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
          <Users className="w-5 h-5 text-blue-600" />
          <h2>Project Engineering Team</h2>
        </div>
        <p className="text-xs text-slate-500">
          Developed and submitted for academic project evaluation in the Manufacturing / Production Management domain.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {team.map((member) => (
            <div
              key={member.name}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-blue-300 hover:shadow-xs transition-all space-y-2"
            >
              <div className="w-9 h-9 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                {member.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">{member.name}</h3>
                <div className="text-[11px] font-mono text-blue-600 font-semibold">{member.regNo}</div>
                <div className="text-xs font-semibold text-slate-700 mt-1">{member.role}</div>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug pt-1 border-t border-slate-150">
                {member.contributions}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Problem Statement & Objectives */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-rose-600" />
            Problem Statement
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Modern manufacturing plants frequently suffer from machine idle time, scheduling collisions, and delivery delays caused by ad-hoc, manual, or spreadsheet-based scheduling. When unexpected equipment breakdowns occur, supervisors lack deterministic decision support to quickly reassign work orders without triggering cascading delays across downstream assembly lines.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-600" />
            System Objectives
          </h3>
          <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside leading-relaxed">
            <li>Automate deterministic job-to-machine assignment using Priority + EDF constraints.</li>
            <li>Enforce strict zero-overlap invariants across identical resource stations.</li>
            <li>Visualize production timelines dynamically using an interactive Gantt chart.</li>
            <li>Detect bottleneck conflicts and automate dynamic breakdown recovery.</li>
            <li>Export executive manufacturing reports and CSV datasets for offline auditing.</li>
          </ul>
        </div>
      </div>

      {/* System Architecture & Workflow */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
          <GitBranch className="w-5 h-5 text-blue-600" />
          <h2>Architecture &amp; 5-Phase Workflow</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
          {workflowSteps.map((ws) => (
            <div
              key={ws.step}
              className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 flex flex-col justify-between"
            >
              <div>
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-mono text-[10px] font-bold flex items-center justify-center mb-1">
                  {ws.step}
                </span>
                <h4 className="text-xs font-bold text-slate-900">{ws.title}</h4>
                <p className="text-[11px] text-slate-500 leading-snug mt-1">{ws.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Technology Stack Grid */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
          <Code className="w-5 h-5 text-blue-600" />
          <h2>Technology Stack Specifications</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {techStack.map((tech) => (
            <div key={tech.name} className="p-3.5 border border-slate-200 rounded-xl bg-slate-50/50">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                {tech.category}
              </span>
              <h4 className="text-xs font-bold text-slate-900 mt-0.5">{tech.name}</h4>
              <p className="text-[11px] text-slate-500 leading-snug mt-1">{tech.role}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
