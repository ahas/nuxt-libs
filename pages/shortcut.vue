<template>
  <div class="container">{{ message }}</div>
</template>

<script setup lang="ts">
import { useShortcut } from "~/libs/shortcut/composables";

const shortcut = useShortcut();
const message = ref("Waiting for input");

shortcut.on("Control+K, Control+L", (event) => {
  message.value = event.command.label;
});
shortcut.on("CmdOrCtrl+S", (event) => {
  message.value = event.command.label;
});
shortcut.on("Control+C", (event) => {
  message.value = event.command.label;
});
shortcut.on((event) => {
  if (event.result === "wait") {
    message.value = "Waiting for key of chord";
    event.originalEvent.preventDefault();
  } else if (event.result === "next") {
    message.value = "Waiting for next combination";
    event.originalEvent.preventDefault();
  } else if (event.result === "skip") {
    if (event.lastResult !== "skip") {
      message.value = "No command";
    } else {
      message.value = "Waiting for input";
    }
  }
});
</script>

<style scoped lang="scss">
.container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}
</style>
