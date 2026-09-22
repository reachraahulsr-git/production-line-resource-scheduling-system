import {
  Conflict,
  ConflictSeverity,
  Job,
  JobPriority,
  Resource,
  ScheduleItem,
  SchedulingResult,
} from '../types';

/**
 * Utility helpers for time calculations in 24-hour HH:MM format
 */
export class TimeUtility {
  /**
   * Convert "HH:MM" to total minutes from midnight
   */
  public static timeToMinutes(timeStr: string): number {
    if (!timeStr || !timeStr.includes(':')) return 0;
    const [hours, minutes] = timeStr.split(':').map((val) => parseInt(val, 10));
    return (hours || 0) * 60 + (minutes || 0);
  }

  /**
   * Convert total minutes from midnight to "HH:MM"
   */
  public static minutesToTime(totalMinutes: number): string {
    const clamped = Math.max(0, Math.floor(totalMinutes));
    const hours = Math.floor(clamped / 60) % 24;
    const minutes = clamped % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  /**
   * Format minutes into readable "Xh Ym" or "Y min"
   */
  public static formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
}

/**
 * Object-Oriented Production Line Scheduling Engine
 * Implements: Priority + Earliest Deadline First (EDF) + Resource Availability & Capacity
 */
export class SchedulingEngine {
  private jobs: Job[];
  private resources: Resource[];
  private existingSchedules: ScheduleItem[];
  private targetDate: string;
  private executionLogs: string[] = [];

  // Priority weight hierarchy (Critical > High > Medium > Low)
  private readonly priorityWeights: Record<JobPriority, number> = {
    Critical: 4,
    High: 3,
    Medium: 2,
    Low: 1,
  };

  /**
   * Encapsulated Constructor
   */
  constructor(
    jobs: Job[],
    resources: Resource[],
    existingSchedules: ScheduleItem[] = [],
    targetDate: string = new Date().toISOString().split('T')[0]
  ) {
    this.jobs = [...jobs];
    this.resources = [...resources];
    this.existingSchedules = [...existingSchedules];
    this.targetDate = targetDate;
  }

  /**
   * Log internal steps for educational transparency in college presentation
   */
  private log(message: string): void {
    const timestamp = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    this.executionLogs.push(`[${timestamp}] ${message}`);
  }

  /**
   * Step 1 & 2: Filter and validate pending jobs and available machines
   */
  public getEligibleJobs(): Job[] {
    return this.jobs.filter((j) => j.status === 'Pending' || j.status === 'Delayed');
  }

  public getUsableResources(): Resource[] {
    return this.resources.filter((r) => r.status === 'Available' || r.status === 'Busy');
  }

  /**
   * Step 3 & 4: Multi-Criteria Sorting
   * Primary: Priority (Critical -> High -> Medium -> Low)
   * Secondary: Earliest Deadline First (EDF)
   * Tertiary: Shortest Processing Time (tie-breaker)
   */
  public sortJobs(jobsList: Job[]): Job[] {
    return [...jobsList].sort((a, b) => {
      // 1. Priority weight descending
      const weightA = this.priorityWeights[a.priority] || 0;
      const weightB = this.priorityWeights[b.priority] || 0;
      if (weightA !== weightB) {
        return weightB - weightA;
      }

      // 2. Earliest deadline first (HH:MM converted to minutes)
      const deadlineA = TimeUtility.timeToMinutes(a.deadline);
      const deadlineB = TimeUtility.timeToMinutes(b.deadline);
      if (deadlineA !== deadlineB) {
        return deadlineA - deadlineB;
      }

      // 3. Shorter processing time first
      return a.processingTime - b.processingTime;
    });
  }

  /**
   * Step 5 & 6: Find compatible machines matching requiredMachineType
   */
  private findCompatibleResources(job: Job): Resource[] {
    const normalizedReq = job.requiredMachineType.trim().toLowerCase();
    return this.resources.filter(
      (r) =>
        r.type.trim().toLowerCase() === normalizedReq &&
        (r.status === 'Available' || r.status === 'Busy')
    );
  }

  /**
   * Step 8: Find earliest available continuous time slot for a machine considering capacity
   */
  private findSlotForResource(
    resource: Resource,
    processingDurationMinutes: number,
    currentAllocations: ScheduleItem[]
  ): { startTimeMinutes: number; endTimeMinutes: number } | null {
    const windowStart = TimeUtility.timeToMinutes(resource.availableFrom);
    const windowEnd = TimeUtility.timeToMinutes(resource.availableTo);

    if (windowEnd - windowStart < processingDurationMinutes) {
      return null; // Resource working window too short
    }

    // Filter existing schedule items on this resource for this target date
    const machineAllocations = currentAllocations.filter(
      (item) => item.resourceId === resource.id && item.date === this.targetDate
    );

    const capacity = Math.max(1, resource.capacity || 1);

    // If capacity is 1, check non-overlapping continuous slots
    // Search discrete slots in 5-minute increments
    for (
      let candidateStart = windowStart;
      candidateStart + processingDurationMinutes <= windowEnd;
      candidateStart += 5
    ) {
      const candidateEnd = candidateStart + processingDurationMinutes;

      // Check how many overlapping jobs run during candidateStart..candidateEnd
      let maxConcurrent = 0;
      for (let t = candidateStart; t < candidateEnd; t += 5) {
        const activeCount = machineAllocations.filter((item) => {
          const itemStart = TimeUtility.timeToMinutes(item.startTime);
          const itemEnd = TimeUtility.timeToMinutes(item.endTime);
          return t >= itemStart && t < itemEnd;
        }).length;

        if (activeCount > maxConcurrent) {
          maxConcurrent = activeCount;
        }
      }

      if (maxConcurrent < capacity) {
        return {
          startTimeMinutes: candidateStart,
          endTimeMinutes: candidateEnd,
        };
      }
    }

    return null;
  }

  /**
   * Core Schedule Generation Method
   * Executes steps 1-15 systematically
   */
  public generate(): SchedulingResult {
    this.executionLogs = [];
    this.log('Step 1: Loading pending jobs and available resources from database...');

    const pendingJobs = this.getEligibleJobs();
    const availableResources = this.getUsableResources();

    this.log(`Identified ${pendingJobs.length} eligible job(s) and ${availableResources.length} active machine(s).`);

    if (pendingJobs.length === 0) {
      this.log('No pending or delayed jobs to schedule.');
      return {
        scheduledItems: [...this.existingSchedules],
        unscheduledJobs: [],
        conflicts: this.auditConflicts(this.existingSchedules),
        summary: this.calculateSummary(this.existingSchedules, []),
        logs: this.executionLogs,
      };
    }

    this.log('Step 3 & 4: Applying Priority Sort + Earliest Deadline First (EDF) ranking...');
    const prioritizedJobs = this.sortJobs(pendingJobs);

    prioritizedJobs.forEach((job, index) => {
      this.log(
        `Rank #${index + 1}: [${job.id}] ${job.productName} | Priority: ${job.priority} | Deadline: ${job.deadline} | Duration: ${job.processingTime}m`
      );
    });

    const newSchedules: ScheduleItem[] = [...this.existingSchedules];
    const unscheduled: { job: Job; reason: string }[] = [];

    // Step 5 through 12: Allocation loop
    for (const job of prioritizedJobs) {
      this.log(`Processing Job ${job.id} (${job.productName}) requiring [${job.requiredMachineType}]...`);

      // Step 5: Check machine compatibility
      const compatibleMachines = this.findCompatibleResources(job);
      if (compatibleMachines.length === 0) {
        const reason = `No operational machine of type '${job.requiredMachineType}' is available.`;
        this.log(`FAILED: ${reason}`);
        unscheduled.push({ job, reason });
        continue;
      }

      // Step 6, 7 & 8: Find best machine with earliest available slot
      let bestChoice: {
        resource: Resource;
        startTimeMinutes: number;
        endTimeMinutes: number;
      } | null = null;

      for (const machine of compatibleMachines) {
        const slot = this.findSlotForResource(machine, job.processingTime, newSchedules);
        if (slot) {
          if (!bestChoice || slot.startTimeMinutes < bestChoice.startTimeMinutes) {
            bestChoice = {
              resource: machine,
              startTimeMinutes: slot.startTimeMinutes,
              endTimeMinutes: slot.endTimeMinutes,
            };
          }
        }
      }

      if (!bestChoice) {
        const reason = `All compatible [${job.requiredMachineType}] machines are booked to capacity within their available working window.`;
        this.log(`UNSCHEDULED: ${reason}`);
        unscheduled.push({ job, reason });
        continue;
      }

      // Step 9, 10 & 11: Create schedule item
      const startTime = TimeUtility.minutesToTime(bestChoice.startTimeMinutes);
      const endTime = TimeUtility.minutesToTime(bestChoice.endTimeMinutes);
      const deadlineMinutes = TimeUtility.timeToMinutes(job.deadline);
      const isLate = bestChoice.endTimeMinutes > deadlineMinutes;
      const delayMinutes = isLate ? bestChoice.endTimeMinutes - deadlineMinutes : 0;

      const scheduleItem: ScheduleItem = {
        id: `SCH-${job.id}-${Date.now().toString().slice(-4)}`,
        jobId: job.id,
        productName: job.productName,
        resourceId: bestChoice.resource.id,
        resourceName: bestChoice.resource.name,
        machineType: bestChoice.resource.type,
        priority: job.priority,
        startTime,
        endTime,
        processingTime: job.processingTime,
        date: this.targetDate,
        status: isLate ? 'Delayed' : 'Scheduled',
        deadline: job.deadline,
        delayMinutes,
      };

      newSchedules.push(scheduleItem);
      this.log(
        `ASSIGNED: Job ${job.id} -> Machine ${bestChoice.resource.name} (${startTime} - ${endTime}) ${isLate ? `[⚠️ Exceeds deadline by ${delayMinutes}m]` : '[✓ On Time]'}`
      );
    }

    this.log(`Step 13: Scheduling loop completed. ${newSchedules.length - this.existingSchedules.length} job(s) assigned, ${unscheduled.length} job(s) backlogged.`);

    // Step 14 & 15: Conflict detection and summary
    const detectedConflicts = this.auditConflicts(newSchedules, unscheduled);
    this.log(`Audit complete: ${detectedConflicts.length} conflict(s) or alert(s) detected.`);

    return {
      scheduledItems: newSchedules,
      unscheduledJobs: unscheduled,
      conflicts: detectedConflicts,
      summary: this.calculateSummary(newSchedules, unscheduled),
      logs: this.executionLogs,
    };
  }

  /**
   * Conflict Detection Engine
   * Identifies overlaps, maintenance clashes, deadline violations, and unallocated jobs
   */
  public auditConflicts(
    schedules: ScheduleItem[] = this.existingSchedules,
    unscheduled: { job: Job; reason: string }[] = []
  ): Conflict[] {
    const conflicts: Conflict[] = [];
    let conflictIndex = 1;

    const createConflict = (
      jobId: string,
      resourceId: string | undefined,
      type: Conflict['conflictType'],
      desc: string,
      severity: ConflictSeverity
    ): Conflict => {
      return {
        id: `CONF-${String(conflictIndex++).padStart(3, '0')}`,
        jobId,
        resourceId,
        conflictType: type,
        description: desc,
        severity,
        status: 'Open',
        detectedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
    };

    // 1. Check Unscheduled Jobs
    for (const item of unscheduled) {
      conflicts.push(
        createConflict(
          item.job.id,
          undefined,
          'Unscheduled Job',
          `Job ${item.job.id} (${item.job.productName}) could not be scheduled: ${item.reason}`,
          item.job.priority === 'Critical' ? 'Critical' : 'Warning'
        )
      );
    }

    // 2. Machine Under Maintenance / Offline check
    for (const sched of schedules) {
      const machine = this.resources.find((r) => r.id === sched.resourceId);
      if (machine && (machine.status === 'Maintenance' || machine.status === 'Offline')) {
        conflicts.push(
          createConflict(
            sched.jobId,
            machine.id,
            'Machine Under Maintenance',
            `Job ${sched.jobId} is assigned to ${machine.name}, which is currently marked as ${machine.status}.`,
            'Critical'
          )
        );
      }

      // 3. Machine Operating Window Violations
      if (machine) {
        const startMin = TimeUtility.timeToMinutes(sched.startTime);
        const endMin = TimeUtility.timeToMinutes(sched.endTime);
        const availStart = TimeUtility.timeToMinutes(machine.availableFrom);
        const availEnd = TimeUtility.timeToMinutes(machine.availableTo);

        if (startMin < availStart || endMin > availEnd) {
          conflicts.push(
            createConflict(
              sched.jobId,
              machine.id,
              'Machine Unavailable',
              `Scheduled window (${sched.startTime}-${sched.endTime}) falls outside ${machine.name}'s operational hours (${machine.availableFrom}-${machine.availableTo}).`,
              'Warning'
            )
          );
        }
      }

      // 4. Deadline Violations
      const endMin = TimeUtility.timeToMinutes(sched.endTime);
      const deadlineMin = TimeUtility.timeToMinutes(sched.deadline);
      if (endMin > deadlineMin) {
        const diff = endMin - deadlineMin;
        conflicts.push(
          createConflict(
            sched.jobId,
            sched.resourceId,
            'Deadline Violation',
            `Job ${sched.jobId} completes at ${sched.endTime}, exceeding deadline ${sched.deadline} by ${diff} minutes.`,
            sched.priority === 'Critical' ? 'Critical' : 'Warning'
          )
        );
      }

      // 5. Machine Type Compatibility Mismatch
      const matchingJob = this.jobs.find((j) => j.id === sched.jobId);
      if (
        matchingJob &&
        machine &&
        matchingJob.requiredMachineType.toLowerCase() !== machine.type.toLowerCase()
      ) {
        conflicts.push(
          createConflict(
            sched.jobId,
            machine.id,
            'Invalid Resource Assignment',
            `Job ${sched.jobId} requires '${matchingJob.requiredMachineType}' but is assigned to '${machine.type}' machine (${machine.name}).`,
            'Critical'
          )
        );
      }
    }

    // 6. Overlapping Jobs on Same Machine exceeding capacity
    for (const machine of this.resources) {
      const machineSchedules = schedules.filter((s) => s.resourceId === machine.id);
      const capacity = Math.max(1, machine.capacity || 1);

      for (let i = 0; i < machineSchedules.length; i++) {
        for (let j = i + 1; j < machineSchedules.length; j++) {
          const itemA = machineSchedules[i];
          const itemB = machineSchedules[j];

          const startA = TimeUtility.timeToMinutes(itemA.startTime);
          const endA = TimeUtility.timeToMinutes(itemA.endTime);
          const startB = TimeUtility.timeToMinutes(itemB.startTime);
          const endB = TimeUtility.timeToMinutes(itemB.endTime);

          // Overlap condition: startA < endB && startB < endA
          if (startA < endB && startB < endA && capacity === 1) {
            conflicts.push(
              createConflict(
                itemA.jobId,
                machine.id,
                'Machine Overlap',
                `Time collision on ${machine.name} between Job ${itemA.jobId} (${itemA.startTime}-${itemA.endTime}) and Job ${itemB.jobId} (${itemB.startTime}-${itemB.endTime}).`,
                'Critical'
              )
            );
          }
        }
      }
    }

    return conflicts;
  }

  /**
   * Rescheduling Engine for when a machine breaks down or is taken offline
   */
  public suggestRescheduleForUnavailableResource(
    failedResourceId: string
  ): {
    affectedJobs: ScheduleItem[];
    reassignments: {
      originalSchedule: ScheduleItem;
      newResource: Resource;
      newStartTime: string;
      newEndTime: string;
    }[];
    unsolvableJobs: ScheduleItem[];
  } {
    const affected = this.existingSchedules.filter((s) => s.resourceId === failedResourceId);
    const unaffectedSchedules = this.existingSchedules.filter((s) => s.resourceId !== failedResourceId);

    const reassignments: {
      originalSchedule: ScheduleItem;
      newResource: Resource;
      newStartTime: string;
      newEndTime: string;
    }[] = [];
    const unsolvable: ScheduleItem[] = [];

    const workingAllocations = [...unaffectedSchedules];

    for (const item of affected) {
      const job = this.jobs.find((j) => j.id === item.jobId);
      if (!job) continue;

      // Alternative machines excluding the failed one
      const alternativeMachines = this.resources.filter(
        (r) =>
          r.id !== failedResourceId &&
          r.type.toLowerCase() === item.machineType.toLowerCase() &&
          r.status === 'Available'
      );

      let bestSlot: {
        resource: Resource;
        startTimeMinutes: number;
        endTimeMinutes: number;
      } | null = null;

      for (const machine of alternativeMachines) {
        const slot = this.findSlotForResource(machine, item.processingTime, workingAllocations);
        if (slot) {
          if (!bestSlot || slot.startTimeMinutes < bestSlot.startTimeMinutes) {
            bestSlot = {
              resource: machine,
              startTimeMinutes: slot.startTimeMinutes,
              endTimeMinutes: slot.endTimeMinutes,
            };
          }
        }
      }

      if (bestSlot) {
        const newStartTime = TimeUtility.minutesToTime(bestSlot.startTimeMinutes);
        const newEndTime = TimeUtility.minutesToTime(bestSlot.endTimeMinutes);

        reassignments.push({
          originalSchedule: item,
          newResource: bestSlot.resource,
          newStartTime,
          newEndTime,
        });

        // Add to temporary tracking so subsequent jobs don't collide
        workingAllocations.push({
          ...item,
          resourceId: bestSlot.resource.id,
          resourceName: bestSlot.resource.name,
          startTime: newStartTime,
          endTime: newEndTime,
        });
      } else {
        unsolvable.push(item);
      }
    }

    return {
      affectedJobs: affected,
      reassignments,
      unsolvableJobs: unsolvable,
    };
  }

  /**
   * Utilization and summary calculation
   */
  private calculateSummary(
    schedules: ScheduleItem[],
    unscheduled: { job: Job; reason: string }[]
  ): SchedulingResult['summary'] {
    const totalProcessingMinutes = schedules.reduce((acc, curr) => acc + curr.processingTime, 0);

    const machineUtilization: Record<string, number> = {};
    for (const machine of this.resources) {
      const windowStart = TimeUtility.timeToMinutes(machine.availableFrom);
      const windowEnd = TimeUtility.timeToMinutes(machine.availableTo);
      const totalAvailableMinutes = Math.max(1, (windowEnd - windowStart) * (machine.capacity || 1));

      const busyMinutes = schedules
        .filter((s) => s.resourceId === machine.id)
        .reduce((sum, s) => sum + s.processingTime, 0);

      const percent = Math.min(100, Math.round((busyMinutes / totalAvailableMinutes) * 100));
      machineUtilization[machine.id] = percent;
    }

    return {
      totalPending: this.getEligibleJobs().length,
      scheduledCount: schedules.length,
      unscheduledCount: unscheduled.length,
      totalProcessingMinutes,
      machineUtilization,
    };
  }
}
