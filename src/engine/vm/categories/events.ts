import type { StatementHandler } from '../types';

export const EVENTS_STATEMENT_HANDLERS: Record<string, StatementHandler> = {
  event_broadcast: ({ val, triggerBroadcast }) => {
    triggerBroadcast(String(val('message')));
    return false;
  },
  event_await: ({ val, thread }) => {
    thread.awaitingEvent = String(val('message'));
    return true;
  },
};
