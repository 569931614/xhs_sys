<template>
  <div class="table-action">
    <template v-if="style === 'button'">
      <n-space>
        <template v-for="(action, index) in actions" :key="index">
          <n-button
            v-if="!action.show || action.show()"
            :type="action.type || 'default'"
            :size="action.size || 'small'"
            @click="handleAction(action)"
            :disabled="!!action.disabled"
          >
            <template v-if="action.icon" #icon>
              <n-icon>
                <component :is="action.icon" />
              </n-icon>
            </template>
            {{ action.label }}
          </n-button>
        </template>
      </n-space>
    </template>

    <template v-else>
      <n-dropdown
        :options="dropdownOptions"
        @select="handleSelect"
        :disabled="dropdownOptions.length === 0"
      >
        <n-button size="small">
          <template #icon>
            <n-icon>
              <more-outlined />
            </n-icon>
          </template>
          更多
        </n-button>
      </n-dropdown>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
import { NButton, NSpace, NDropdown, NIcon } from 'naive-ui'
import { MoreOutlined } from '@vicons/antd'

interface ActionItem {
  label: string;
  onClick?: () => void;
  type?: 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error';
  size?: 'tiny' | 'small' | 'medium' | 'large';
  disabled?: boolean;
  show?: () => boolean;
  icon?: any;
}

export default defineComponent({
  name: 'TableAction',
  components: {
    NButton,
    NSpace,
    NDropdown,
    NIcon,
    MoreOutlined,
  },
  props: {
    style: {
      type: String,
      default: 'dropdown',
      validator: (val: string) => ['button', 'dropdown'].includes(val),
    },
    actions: {
      type: Array as () => ActionItem[],
      default: () => [],
    },
  },
  setup(props) {
    // 下拉菜单选项
    const dropdownOptions = computed(() => {
      return props.actions
        .filter((item: ActionItem) => !item.show || item.show())
        .map((action: ActionItem, index: number) => {
          return {
            key: index,
            label: action.label,
            disabled: !!action.disabled,
          }
        })
    })

    // 处理按钮点击事件
    function handleAction(action: ActionItem) {
      if (action.onClick && typeof action.onClick === 'function') {
        action.onClick()
      }
    }

    // 处理下拉菜单选择事件
    function handleSelect(key: number) {
      const action = props.actions[key]
      if (action && action.onClick && typeof action.onClick === 'function') {
        action.onClick()
      }
    }

    return {
      dropdownOptions,
      handleAction,
      handleSelect,
    }
  },
})
</script>

<style scoped>
.table-action {
  display: flex;
  justify-content: center;
}
</style> 