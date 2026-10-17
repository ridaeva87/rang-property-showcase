export const ACTIVE_REQUEST_STATUS_CODES = [
  "new",
  "in_progress",
  "waiting_customer",
  "qualified",
  "closed_won",
  "closed_lost",
] as const;

export type ActiveRequestStatusCode = (typeof ACTIVE_REQUEST_STATUS_CODES)[number];

export function isConfigurableRequestStatus(code: string): code is ActiveRequestStatusCode {
  return (ACTIVE_REQUEST_STATUS_CODES as readonly string[]).includes(code);
}

export function canUseRequestStatus(input: {
  currentStatusId: string;
  nextStatusId: string;
  nextIsActive: boolean;
}) {
  return input.nextIsActive || input.currentStatusId === input.nextStatusId;
}

export function requestStatusEventType(isClosed: boolean) {
  return isClosed ? "closed" : "status_changed";
}

export function requestStatusTransition(input: {
  fromStatusId: string;
  toStatusId: string;
  isClosed: boolean;
}) {
  return {
    history: { fromStatusId: input.fromStatusId, toStatusId: input.toStatusId },
    event: {
      eventType: requestStatusEventType(input.isClosed),
      fromValue: input.fromStatusId,
      toValue: input.toStatusId,
    },
  };
}
