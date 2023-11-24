import { EventBus } from "./event-bus";

const _eventBus = new EventBus();

export function useEventBus() {
  return _eventBus;
}
