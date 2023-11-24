<template>
  <div class="container">
    <ul>
      <li v-for="example in examples">
        <nuxt-link :to="example.to">{{ example.label }}</nuxt-link>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
const examples = reactive([
  { label: "Shortcut", to: "/shortcut" },
  { label: "Platform", to: "/platform" },
]);
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
