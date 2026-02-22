/**
 * Race Day auto-detection utility.
 * Maps calendar dates to event day numbers.
 * Event: Aarunya Drift X Karting 2.0
 */

// Event schedule (IST dates)
const EVENT_DAYS = {
    '2026-02-21': 1,
    '2026-02-22': 2,
    '2026-02-23': 3,
}

/**
 * Returns the current race day (1, 2, or 3) based on today's date in IST.
 * Falls back to day 1 if the current date is outside the event schedule.
 */
export function getRaceDay() {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
    return EVENT_DAYS[today] || 1
}

/**
 * Returns total number of event days.
 */
export const TOTAL_DAYS = 3
