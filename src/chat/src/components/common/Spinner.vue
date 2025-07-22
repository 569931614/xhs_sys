<template>
  <div class="spinner" :class="[size]"></div>
</template>

<script setup lang="ts">
defineProps({
  size: {
    type: String,
    default: 'md',
    validator: (value: string) => ['sm', 'md', 'lg'].includes(value)
  }
})
</script>

<style scoped>
.spinner {
  border-radius: 50%;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-left-color: currentColor;
  animation: spin 1s linear infinite;
  display: inline-block;
  color: #3b82f6;
}

.sm {
  width: 1rem;
  height: 1rem;
  border-width: 2px;
}

.md {
  width: 1.5rem;
  height: 1.5rem;
  border-width: 2px;
}

.lg {
  width: 2rem;
  height: 2rem;
  border-width: 3px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

:deep(.dark) .spinner {
  border-color: rgba(255, 255, 255, 0.1);
  border-left-color: currentColor;
  color: #60a5fa;
}
</style> 