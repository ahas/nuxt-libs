export interface EventDefinition {}
export type EventTopic<T extends EventDefinition = EventDefinition> = keyof T;
export type EventHandler<T extends EventDefinition = EventDefinition> = T[keyof T];
export type EventHandlerMap<T extends EventDefinition = EventDefinition> = Map<
  string,
  EventHandler<T>[]
>;

export class EventBus<T extends EventDefinition = EventDefinition> {
  private readonly map: EventHandlerMap<T>;
  private readonly group?: string;

  constructor(map?: EventHandlerMap<T>, group?: string) {
    this.map = map ?? new Map();
    this.group = group;
  }

  on(topic: EventTopic<T>, handler: EventHandler<T>): void {
    const t = `${this.group}:${topic.toString()}` as any;
    const handlers: EventHandler<T>[] | undefined = this.map.get(t);

    if (handlers) {
      handlers.push(handler);
    } else {
      this.map.set(t, [handler] as EventHandler<T>[]);
    }
  }

  once(topic: EventTopic<T>, handler: EventHandler<T>): void {
    const t = `${this.group}:${topic.toString()}` as any;
    const _handler = (...args: any[]): void => {
      this.off(t, _handler as EventHandler<T>);
      handler(...args);
    };
    this.on(t, _handler as any);
  }

  off(topic: EventTopic<T>, handler?: EventHandler<T>): void {
    const t = `${this.group}:${topic.toString()}` as any;
    const handlers = this.map.get(t);

    if (handlers) {
      if (handler) {
        handlers.splice(handlers.indexOf(handler) >>> 0, 1);
      } else {
        this.map.delete(t);
      }
    }
  }

  emit(topic: EventTopic<T>, ...args: Parameters<T[keyof T]>) {
    const t = `${this.group}:${topic.toString()}` as any;
    let handlers = this.map.get(t);

    if (handlers) {
      for (const handler of handlers as EventHandler<T>[]) {
        handler(...args);
      }
    }
  }

  create(group: string): EventBus<T> {
    return new EventBus(this.map, (this.group ? this.group + ":" : "") + group);
  }
}
