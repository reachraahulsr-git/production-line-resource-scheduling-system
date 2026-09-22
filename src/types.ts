export type JobPriority = 'Critical' | 'High' | 'Medium' | 'Low';

export type JobStatus =
  | 'Pending'
  | 'Scheduled'
  | 'In Progress'
  | 'Completed'
  | 'Delayed'
  | 'Cancelled';

export type MachineStatus = 'Available' | 'Busy' | 'Maintenance' | 'Offline';

export interface Job {
  id: string; // e.g., J001
  productName: string;
  quantity: number;
  priority: JobPriority;
  processingTime: number; // in minutes
  requiredMachineType: string; // e.g. CNC, Assembly, Milling, Welding
  deadline: string; // HH:MM, e.g. "16:00"
  status: JobStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Resource {
  id: string; // e.g., M001
  name: string; // e.g., CNC-01
  type: string; // e.g., CNC, Assembly
  capacity: number; // concurrent jobs capacity, default 1
  status: MachineStatus;
  availableFrom: string; // HH:MM, e.g. "08:00"
  availableTo: string; // HH:MM, e.g. "17:00"
  location?: string;
  maintenanceNote?: string;
}

export interface ScheduleItem {
  id: string;
  jobId: string;
  productName: string;
  resourceId: string;
  resourceName: string;
  machineType: string;
  priority: JobPriority;
  startTime: string; // HH:MM, e.g. "08:00"
  endTime: string; // HH:MM, e.g. "08:45"
  processingTime: number; // minutes
  date: string; // YYYY-MM-DD
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Delayed';
  deadline: string;
  delayMinutes?: number;
}

export type ConflictSeverity = 'Critical' | 'Warning' | 'Information';

export type ConflictType =
  | 'Machine Overlap'
  | 'Machine Unavailable'
  | 'Machine Under Maintenance'
  | 'Invalid Resource Assignment'
  | 'Deadline Violation'
  | 'Unscheduled Job';

export interface Conflict {
  id: string;
  jobId: string;
  resourceId?: string;
  conflictType: ConflictType;
  description: string;
  severity: ConflictSeverity;
  status: 'Open' | 'Resolved';
  detectedAt: string;
  resolvedAt?: string;
}

export interface ProductionLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  category: 'Job' | 'Resource' | 'Schedule' | 'Conflict' | 'System';
}

export interface SchedulingResult {
  scheduledItems: ScheduleItem[];
  unscheduledJobs: {
    job: Job;
    reason: string;
  }[];
  conflicts: Conflict[];
  summary: {
    totalPending: number;
    scheduledCount: number;
    unscheduledCount: number;
    totalProcessingMinutes: number;
    machineUtilization: Record<string, number>; // resourceId -> percentage
  };
  logs: string[];
}

export interface DatabaseState {
  jobs: Job[];
  resources: Resource[];
  schedules: ScheduleItem[];
  conflicts: Conflict[];
  productionLogs: ProductionLog[];
  lastGenerated?: string;
}
