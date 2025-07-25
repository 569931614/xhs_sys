<template>
  <button 
    class="inline-flex items-center justify-center bg-primary-600 hover:bg-primary-700 text-white rounded focus:outline-none transition-colors"
    :class="[
      loading ? 'opacity-75 cursor-not-allowed' : '',
      disabled ? 'opacity-50 cursor-not-allowed' : '',
      size === 'xs' ? 'btn-xs' : '',
      size === 'sm' ? 'btn-sm' : '',
      size === 'md' ? 'btn-md' : '',
      size === 'lg' ? 'btn-lg' : ''
    ]"
    :disabled="disabled || loading"
    @click="$emit('click')"
  >
    <span v-if="loading" class="mr-2">
      <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </span>
    <slot></slot>
  </button>
</template>

<script setup lang="ts">
defineProps({
  loading: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  size: {
    type: String,
    default: 'md',
    validator: (value: string) => ['xs', 'sm', 'md', 'lg'].includes(value)
  }
})

defineEmits(['click'])
</script>

<style scoped>
.btn-xs {
  @apply px-2 py-1 text-xs font-medium;
}

.btn-sm {
  @apply px-3 py-1.5 text-sm font-medium;
}

.btn-md {
  @apply px-4 py-2 text-sm font-medium;
}

.btn-lg {
  @apply px-5 py-2.5 text-base font-medium;
}
</style> 