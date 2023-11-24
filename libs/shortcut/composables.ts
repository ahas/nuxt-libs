import { Shortcut } from "./shortcut";

export function useShortcut() {
  const shortcut = new Shortcut();

  onMounted(() => {
    shortcut.activate();
  });

  onUnmounted(() => {
    shortcut.destroy();
  });

  return shortcut;
}
