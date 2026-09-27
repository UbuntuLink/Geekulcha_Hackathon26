// The stages a booked job moves through, shared by the work tracker and the bookings lists.
// Mirrors BookingService.WORK_STEPS on the backend; CANCELLED can end a job at any point.
// AWAITING_PAYMENT: the provider marked the work done; only the customer paying completes the job.
export const WORK_STEPS = ["REQUEST_SENT", "ACCEPTED", "ON_THE_WAY", "IN_PROGRESS", "AWAITING_PAYMENT", "COMPLETED"];

export const STEP_LABELS = {
  REQUEST_SENT: "Booking requested",
  ACCEPTED: "Job accepted",
  ON_THE_WAY: "On the way",
  IN_PROGRESS: "Work in progress",
  AWAITING_PAYMENT: "Work done — awaiting payment",
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
  AWAITING_PAYMENT: "💳",
  COMPLETED: "✓",
  CANCELLED: "✕",
};

// What the provider taps to move a job to each step.
export const STEP_ACTIONS = {
  ACCEPTED: "Accept job",
  ON_THE_WAY: "I'm on the way",
  IN_PROGRESS: "Start work",
  AWAITING_PAYMENT: "Mark work as done",
};

export const ACTIVE_STATUSES = ["REQUEST_SENT", "ACCEPTED", "ON_THE_WAY", "IN_PROGRESS", "AWAITING_PAYMENT"];

export const isFinished = (status) => status === "COMPLETED" || status === "CANCELLED";

/** The provider's next step, or null. COMPLETED is never one: only the customer's payment completes a job. */
export function nextStep(status) {
  const index = WORK_STEPS.indexOf(status);
  const next = index >= 0 && index < WORK_STEPS.length - 1 ? WORK_STEPS[index + 1] : null;
  return next === "COMPLETED" ? null : next;
}

/** Steps the provider can skip ahead to after `next` (never COMPLETED). */
export function laterProviderSteps(next) {
  return WORK_STEPS.slice(WORK_STEPS.indexOf(next) + 1).filter((step) => step !== "COMPLETED");
}

/** The customer may cancel until the provider sets off. */
export const customerCanCancel = (status) => status === "REQUEST_SENT" || status === "ACCEPTED";
