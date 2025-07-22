<template>
  <button 
    class="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 flex items-center justify-center w-6 h-6 rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
    @click="$emit('click')"
  >
    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  </button>
</template>

<script setup lang="ts">
defineEmits(['click'])
</script> 