import { MATCH_STATUS } from "../validation/matches.js";

/**
 * Determine a match's status based on start and end times relative to the provided reference time.
 * @param {Date|string|number} startTime - The match start time (Date object, ISO string, or timestamp).
 * @param {Date|string|number} endTime - The match end time (Date object, ISO string, or timestamp).
 * @param {Date} [now=new Date()] - Reference time used to evaluate status; defaults to the current time.
 * @returns {string|null} One of `MATCH_STATUS.SCHEDULED`, `MATCH_STATUS.LIVE`, or `MATCH_STATUS.FINISHED`; returns `null` if either `startTime` or `endTime` is invalid.
 */
export function getMatchStatus(startTime, endTime, now = new Date()) {
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }

  if (now < start) {
    return MATCH_STATUS.SCHEDULED;
  }

  if (now >= end) {
    return MATCH_STATUS.FINISHED;
  }

  return MATCH_STATUS.LIVE;
}

/**
 * Synchronizes a match object's status with the status derived from its start and end times.
 * @param {Object} match - Match object containing `startTime`, `endTime`, and `status` properties; `status` will be updated if it differs from the computed status.
 * @param {function(string): any} updateStatus - Function invoked with the new status when an update is required (may perform persistence or side effects).
 * @returns {string} The match's `status` after synchronization (updated if a change was performed).
 */
export async function syncMatchStatus(match, updateStatus) {
  const nextStatus = getMatchStatus(match.startTime, match.endTime);
  if (!nextStatus) {
    return match.status;
  }
  if (match.status !== nextStatus) {
    await updateStatus(nextStatus);
    match.status = nextStatus;
  }
  return match.status;
}
