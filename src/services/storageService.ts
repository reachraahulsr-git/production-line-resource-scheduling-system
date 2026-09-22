import {
  Conflict,
  DatabaseState,
  Job,
  ProductionLog,
  Resource,
  ScheduleItem,
  SchedulingResult,
} from '../types';
import { getInitialDatabaseState } from './sampleData';
import { SchedulingEngine } from './schedulingEngine';

const STORAGE_KEY = 'prod_scheduling_sys_db_v1';

export class StorageService {
  /**
   * Synchronously load database state from LocalStorage (with fallback to sample seed)
   */
  public static loadDatabase(): DatabaseState {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.error('Failed to parse local database:', e);
    }
    const initial = getInitialDatabaseState();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    } catch {}
    return initial;
  }

  /**
   * Fetch database from remote server if available
   */
  public static async fetchRemoteDatabase(): Promise<DatabaseState | null> {
    try {
      const response = await fetch('/api/db', {
        headers: { Accept: 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.jobs && data.resources) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          return data;
        }
      }
    } catch {
      // Backend not running or offline, fall back to local storage
    }
    return null;
  }

  /**
   * Synchronously write to LocalStorage and asynchronously post to /api/db
   */
  public static saveDatabase(state: DatabaseState): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('LocalStorage save warning:', e);
    }

    try {
      fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state),
      }).catch(() => {});
    } catch {}
  }

  /**
   * Reset to default sample state
   */
  public static resetToSample(): DatabaseState {
    const initialState = getInitialDatabaseState();
    StorageService.saveDatabase(initialState);
    return initialState;
  }

  /**
   * Load current database state from API or LocalStorage
   */
  public static async loadState(): Promise<DatabaseState> {
    try {
      const response = await fetch('/api/db', {
        headers: { Accept: 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.jobs && data.resources) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          return data;
        }
      }
    } catch {
      // Backend not running or offline, fall back to local storage
    }

    // LocalStorage fallback
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.error('Failed to parse local database:', e);
    }

    const initial = getInitialDatabaseState();
    StorageService.saveState(initial);
    return initial;
  }

  /**
   * Save database state to API and LocalStorage
   */
  public static async saveState(state: DatabaseState): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('LocalStorage save warning:', e);
    }

    try {
      await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state),
      });
    } catch {
      // Silently fall back to localStorage persistence
    }
  }

  /**
   * Reset database to default sample dataset
   */
  public static async resetDatabase(): Promise<DatabaseState> {
    const initialState = getInitialDatabaseState();
    await StorageService.saveState(initialState);
    return initialState;
  }

  /**
   * Add a production audit log
   */
  public static logAction(
    state: DatabaseState,
    action: string,
    details: string,
    category: ProductionLog['category'] = 'System'
  ): DatabaseState {
    const newLog: ProductionLog = {
      id: `LOG-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action,
      details,
      category,
    };

    return {
      ...state,
      productionLogs: [newLog, ...(state.productionLogs || [])].slice(0, 50),
    };
  }

  /**
   * Execute Schedule Generation
   */
  public static generateSchedule(state: DatabaseState): {
    updatedState: DatabaseState;
    result: SchedulingResult;
  } {
    const engine = new SchedulingEngine(state.jobs, state.resources, state.schedules);
    const result = engine.generate();

    // Update job statuses based on scheduled result
    const scheduledJobIds = new Set(result.scheduledItems.map((s) => s.jobId));
    const delayedJobIds = new Set(
      result.scheduledItems.filter((s) => s.status === 'Delayed').map((s) => s.jobId)
    );

    const updatedJobs = state.jobs.map((job) => {
      if (delayedJobIds.has(job.id)) {
        return { ...job, status: 'Delayed' as const, updatedAt: new Date().toISOString() };
      }
      if (scheduledJobIds.has(job.id)) {
        return { ...job, status: 'Scheduled' as const, updatedAt: new Date().toISOString() };
      }
      return job;
    });

    let newState: DatabaseState = {
      ...state,
      jobs: updatedJobs,
      schedules: result.scheduledItems,
      conflicts: result.conflicts,
      lastGenerated: new Date().toISOString(),
    };

    newState = StorageService.logAction(
      newState,
      'Schedule Generated',
      `Engine assigned ${result.summary.scheduledCount} jobs across ${state.resources.length} resources. ${result.conflicts.length} conflict alerts flagged.`,
      'Schedule'
    );

    StorageService.saveState(newState);
    return { updatedState: newState, result };
  }

  /**
   * Resolve a Conflict
   */
  public static resolveConflict(state: DatabaseState, conflictId: string): DatabaseState {
    const updatedConflicts = state.conflicts.map((c) => {
      if (c.id === conflictId) {
        return {
          ...c,
          status: 'Resolved' as const,
          resolvedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
      }
      return c;
    });

    let newState: DatabaseState = {
      ...state,
      conflicts: updatedConflicts,
    };

    newState = StorageService.logAction(
      newState,
      'Conflict Resolved',
      `Marked conflict ${conflictId} as resolved by production controller.`,
      'Conflict'
    );

    StorageService.saveState(newState);
    return newState;
  }

  /**
   * Reschedule jobs from an unavailable machine
   */
  public static applyRescheduling(
    state: DatabaseState,
    reassignments: {
      originalSchedule: ScheduleItem;
      newResource: Resource;
      newStartTime: string;
      newEndTime: string;
    }[]
  ): DatabaseState {
    const reassignedMap = new Map<string, (typeof reassignments)[0]>();
    reassignments.forEach((r) => reassignedMap.set(r.originalSchedule.id, r));

    const updatedSchedules: ScheduleItem[] = state.schedules.map((item) => {
      const match = reassignedMap.get(item.id);
      if (match) {
        return {
          ...item,
          resourceId: match.newResource.id,
          resourceName: match.newResource.name,
          startTime: match.newStartTime,
          endTime: match.newEndTime,
          status: 'Scheduled',
        };
      }
      return item;
    });

    // Re-run conflict audit
    const engine = new SchedulingEngine(state.jobs, state.resources, updatedSchedules);
    const refreshedConflicts = engine.auditConflicts(updatedSchedules);

    let newState: DatabaseState = {
      ...state,
      schedules: updatedSchedules,
      conflicts: refreshedConflicts,
    };

    newState = StorageService.logAction(
      newState,
      'Machine Rescheduled',
      `Reallocated ${reassignments.length} affected job(s) to alternative operational machines.`,
      'Resource'
    );

    StorageService.saveState(newState);
    return newState;
  }

  /**
   * Export CSV helper
   */
  public static downloadCSV(filename: string, rows: (string | number)[][]): void {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      rows.map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
