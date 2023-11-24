import { EventBus, type EventHandler, type EventTopic } from "./event-bus";
import { onUnmounted } from "vue";

const _eventBus = new EventBus();

export function useEventBus() {
  return _eventBus;
}

export function onEvent(topic: EventTopic, handler: EventHandler) {
  _eventBus.on(topic, handler);

  onUnmounted(() => {
    _eventBus.off(topic, handler);
  });
}
