<template>
  <ul>
    <li v-for="example in examples">
      <nuxt-link :to="example.to">{{ example.label }}</nuxt-link>
    </li>
  </ul>
</template>

<script setup lang="ts">
const examples = reactive([{ label: "Shortcut", to: "/shortcut" }]);
</script>
