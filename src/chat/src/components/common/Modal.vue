<template>
  <div v-if="show" class="analysis-modal-overlay" @click.self="handleClose">
    <div class="analysis-modal-container">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  show: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:show'])

const handleClose = () => {
  emit('update:show', false)
}
</script>

<style scoped>
.analysis-modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-2 backdrop-blur-sm;
}

.analysis-modal-container {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-5xl max-h-[95vh] overflow-hidden border border-gray-100 dark:border-gray-700;
}

@media (max-width: 640px) {
  .analysis-modal-overlay {
    @apply p-1;
  }
  
  .analysis-modal-container {
    @apply max-h-[98vh];
  }
}
</style> 