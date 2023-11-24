import { Shortcut, type ShortcutOptions } from "./shortcut";

export function useShortcut(options?: ShortcutOptions) {
  const shortcut = new Shortcut(options);

  onMounted(() => {
    shortcut.activate();
  });

  onUnmounted(() => {
    shortcut.destroy();
  });

  return shortcut;
}
