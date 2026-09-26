// The stages a booked job moves through, shared by the work tracker and the bookings lists.
// Mirrors BookingService.WORK_STEPS on the backend; CANCELLED can end a job at any point.
export const WORK_STEPS = ["REQUEST_SENT", "ACCEPTED", "ON_THE_WAY", "IN_PROGRESS", "COMPLETED"];

export const STEP_LABELS = {
  REQUEST_SENT: "Booking requested",
  ACCEPTED: "Job accepted",
  ON_THE_WAY: "On the way",
  IN_PROGRESS: "Work in progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

// A symbol for each status, shown beside its colour so status never depends on colour alone
// (colour blindness). Decorative for screen readers: the label says the same thing.
export const STEP_ICONS = {
  REQUEST_SENT: "⏳",
  ACCEPTED: "✓",
  ON_THE_WAY: "→",
  IN_PROGRESS: "⚒",
  COMPLETED: "✓",
  CANCELLED: "✕",
};

// What the provider taps to move a job to each step.
export const STEP_ACTIONS = {
  ACCEPTED: "Accept job",
  ON_THE_WAY: "I'm on the way",
  IN_PROGRESS: "Start work",
  COMPLETED: "Mark as completed",
};

export const ACTIVE_STATUSES = ["REQUEST_SENT", "ACCEPTED", "ON_THE_WAY", "IN_PROGRESS"];

export const isFinished = (status) => status === "COMPLETED" || status === "CANCELLED";

/** The next step after this one, or null when the job is finished. */
export function nextStep(status) {
  const index = WORK_STEPS.indexOf(status);
  return index >= 0 && index < WORK_STEPS.length - 1 ? WORK_STEPS[index + 1] : null;
}

/** The customer may cancel until the provider sets off. */
export const customerCanCancel = (status) => status === "REQUEST_SENT" || status === "ACCEPTED";
