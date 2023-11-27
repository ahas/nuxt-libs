<template>
  <div class="container">{{ message }}</div>
</template>

<script setup lang="ts">
import { onCommand } from "~/libs/shortcut/composables";

const message = ref("Waiting for input");

onCommand("coc+a", (event) => {
  message.value = "Select All";
});
onCommand("coc+s", (event) => {
  message.value = "Save";
});
onCommand("coc+shift+s", (event) => {
  message.value = "Save As";
});
onCommand("coc+c", (event) => {
  message.value = "Copy";
});
onCommand("coc+v", (event) => {
  message.value = "Paste";
});
onCommand((event) => {
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
