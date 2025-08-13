<script setup lang="ts">
import image from '../assets/xibao.jpeg';

</script>

<template>
  <img :src="image" alt="image" class="xibao" />

  <div class="card">
  尝试部署第一个vite应用
  </div>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
.xibao {
  width: 60%;
  height: auto;
}
</style>
