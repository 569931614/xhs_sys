<template>
  <component :is="comp">
    <slot />
  </component>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue'

export default defineComponent({
  name: 'ClientOnly',
  setup(_, { slots }) {
    const comp = ref('div')
    const defaultSlot = slots.default ? slots.default() : null
    const show = ref(false)

    onMounted(() => {
      comp.value = 'div'
      show.value = true
    })

    return {
      comp,
      show,
      defaultSlot,
    }
  },
})
</script> 