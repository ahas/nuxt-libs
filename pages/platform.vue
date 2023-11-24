<template>
  <div class="container">
    <table class="platform-table">
      <thead>
        <tr>
          <th>Platform</th>
          <th>Available</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(v, k) in platform">
          <td>{{ k[0].toUpperCase() + k.substring(1) }}</td>
          <td>{{ v ? "Yes" : "No" }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { usePlatform } from "~/libs/platform/composables";

const platform = usePlatform();
</script>

<style scoped lang="scss">
.container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

table.platform-table {
  &,
  & th,
  & td {
    border: 1px solid black;
    border-collapse: collapse;
  }

  & th,
  & td {
    padding: 4px 8px;
  }

  & th {
    text-align: center;
  }
}
</style>
