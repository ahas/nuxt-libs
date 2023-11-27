import { KeyCommand, Shortcut, type ShortcutCommandListener } from "./shortcut";
import { onUnmounted } from "vue";

const _shortcut = new Shortcut();

export function useShortcut() {
  return _shortcut;
}

export function onCommand(listener: ShortcutCommandListener): void;
export function onCommand(
  command: string,
  listener: ShortcutCommandListener,
): KeyCommand;
export function onCommand(...args: any[]) {
  if (args.length === 2) {
    const command = _shortcut.on(args[0], args[1]);
    onUnmounted(() => _shortcut.off(command));
    return command;
  } else {
    _shortcut.on(args[0]);
    onUnmounted(() => _shortcut.off(args[0]));
  }
}
