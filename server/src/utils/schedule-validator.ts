export interface EventScheduleData {
  startTime: string | Date;
  endTime: string | Date;
  rounds?: Array<{
    id?: string;
    roundNumber: number;
    name?: string;
    submissionStart?: string | Date | null;
    submissionDeadline?: string | Date | null;
  }>;
}

export function validateEventAndRoundsSchedule(data: EventScheduleData): void {
  const eventStart = new Date(data.startTime);
  const eventEnd = new Date(data.endTime);

  if (isNaN(eventStart.getTime()) || isNaN(eventEnd.getTime())) {
    throw {
      status: 400,
      code: "INVALID_DATES",
      message: "Event start time and end time must be valid dates.",
    };
  }

  if (eventStart >= eventEnd) {
    throw {
      status: 400,
      code: "INVALID_SCHEDULE",
      message: "Event end time must be after event start time.",
    };
  }

  const rounds = data.rounds || [];
  if (rounds.length === 0) return;

  // Sort rounds by roundNumber ascending
  const sortedRounds = [...rounds].sort((a, b) => Number(a.roundNumber) - Number(b.roundNumber));

  // Phase 1: Check individual round validity & event window bounds
  for (let i = 0; i < sortedRounds.length; i++) {
    const rd = sortedRounds[i];
    const rNum = rd.roundNumber;
    const rName = rd.name || `Round ${rNum}`;

    const rStart = rd.submissionStart ? new Date(rd.submissionStart) : null;
    const rDeadline = rd.submissionDeadline ? new Date(rd.submissionDeadline) : null;

    if (rStart && isNaN(rStart.getTime())) {
      throw {
        status: 400,
        code: "INVALID_ROUND_SCHEDULE",
        message: `Round ${rNum} (${rName}): Invalid submission start date.`,
      };
    }
    if (rDeadline && isNaN(rDeadline.getTime())) {
      throw {
        status: 400,
        code: "INVALID_ROUND_SCHEDULE",
        message: `Round ${rNum} (${rName}): Invalid submission deadline date.`,
      };
    }

    if (rStart && rDeadline) {
      if (rStart >= rDeadline) {
        throw {
          status: 400,
          code: "INVALID_ROUND_SCHEDULE",
          message: `Round ${rNum} (${rName}): Round deadline must be after the submission start time.`,
        };
      }
    }

    if (rStart) {
      if (rStart < eventStart || rStart > eventEnd) {
        throw {
          status: 400,
          code: "INVALID_ROUND_SCHEDULE",
          message: `Round ${rNum} (${rName}) schedule must fall within event start and end time.`,
        };
      }
    }
    if (rDeadline) {
      if (rDeadline < eventStart || rDeadline > eventEnd) {
        throw {
          status: 400,
          code: "INVALID_ROUND_SCHEDULE",
          message: `Round ${rNum} (${rName}) schedule must fall within event start and end time.`,
        };
      }
    }
  }

  // Phase 2: Chronological round ordering (Round N Start >= Round N-1 Deadline)
  for (let i = 1; i < sortedRounds.length; i++) {
    const rd = sortedRounds[i];
    const prevRd = sortedRounds[i - 1];
    const rStart = rd.submissionStart ? new Date(rd.submissionStart) : null;
    const prevDeadline = prevRd.submissionDeadline ? new Date(prevRd.submissionDeadline) : null;

    if (rStart && prevDeadline) {
      if (rStart < prevDeadline) {
        throw {
          status: 400,
          code: "INVALID_ROUND_ORDER",
          message: `Round ${rd.roundNumber} must start after Round ${prevRd.roundNumber} ends.`,
        };
      }
    }
  }

  // Phase 3: Overlap checks for arbitrary overlapping ranges
  for (let i = 0; i < sortedRounds.length; i++) {
    const rd = sortedRounds[i];
    const rStart = rd.submissionStart ? new Date(rd.submissionStart) : null;
    const rDeadline = rd.submissionDeadline ? new Date(rd.submissionDeadline) : null;

    for (let j = i + 1; j < sortedRounds.length; j++) {
      const other = sortedRounds[j];
      const otherStart = other.submissionStart ? new Date(other.submissionStart) : null;
      const otherDeadline = other.submissionDeadline ? new Date(other.submissionDeadline) : null;

      if (rStart && rDeadline && otherStart && otherDeadline) {
        if (rStart < otherDeadline && otherStart < rDeadline) {
          throw {
            status: 400,
            code: "ROUND_OVERLAP",
            message: `Round ${other.roundNumber} schedule overlaps with Round ${rd.roundNumber}.`,
          };
        }
      }
    }
  }
}
