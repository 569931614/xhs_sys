<template>
  <div class="basic-table">
    <n-data-table
      ref="tableRef"
      v-bind="getBindValues"
      :loading="loading"
      :columns="columns"
      :data="data"
      :pagination="pagination"
      @update:sorter="handleSorter"
      @update:filters="handleFilter"
      @update:page="handlePageChange"
      @update:page-size="handlePageSizeChange"
    >
      <template #empty>
        <n-empty description="暂无数据" />
      </template>
      <template v-for="item in Object.keys($slots)" #[item]="slotData">
        <slot :name="item" v-bind="slotData || {}" />
      </template>
    </n-data-table>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, unref, watch, onMounted, nextTick, toRaw } from 'vue'
import { NDataTable, NEllipsis, NEmpty } from 'naive-ui'
import type { DataTableColumn, DataTableBaseColumn } from 'naive-ui'

interface PaginationProps {
  page: number;
  pageSize: number;
  itemCount?: number;
  showSizePicker?: boolean;
  pageSizes?: number[];
  onChange?: (page: number) => void;
  onUpdatePageSize?: (pageSize: number) => void;
  prefix?: (info: { itemCount: number }) => string;
}

interface TableData {
  [key: string]: any;
}

type ActionColumn = DataTableBaseColumn & {
  fixed?: 'left' | 'right';
}

export default defineComponent({
  name: 'BasicTable',
  components: { NDataTable, NEllipsis, NEmpty },
  props: {
    columns: {
      type: Array as () => DataTableColumn[],
      default: () => [],
    },
    request: {
      type: Function as unknown as () => (params: any) => Promise<{ items: any[]; total: number }>,
      default: null,
    },
    rowKey: {
      type: [String, Function],
      default: 'id',
    },
    pagination: {
      type: [Object, Boolean] as unknown as () => PaginationProps | boolean,
      default: () => ({}),
    },
    actionColumn: {
      type: Object as () => ActionColumn,
      default: null,
    },
    scrollX: {
      type: Number,
      default: 0,
    },
    scrollY: {
      type: Number,
      default: 0,
    },
    params: {
      type: Object,
      default: () => ({}),
    },
  },
  emits: ['update:checked-row-keys'],
  setup(props, { emit, attrs, expose }) {
    const tableRef = ref(null);
    const loading = ref(false);
    const data = ref<TableData[]>([]);

    // 分页配置
    const paginationConfig = computed(() => {
      if (props.pagination === false) {
        return false;
      }
      
      const defaultPagination: PaginationProps = {
        page: 1,
        pageSize: 10,
        showSizePicker: true,
        pageSizes: [10, 20, 30, 40, 50],
        onChange: (page: number) => {
          if (typeof paginationConfig.value === 'object') {
            paginationConfig.value.page = page;
          }
        },
        onUpdatePageSize: (pageSize: number) => {
          if (typeof paginationConfig.value === 'object') {
            paginationConfig.value.pageSize = pageSize;
            paginationConfig.value.page = 1;
          }
        },
        prefix: ({ itemCount }: { itemCount: number }) => `共 ${itemCount} 条`,
      };
      
      return Object.assign({}, defaultPagination, props.pagination as PaginationProps);
    });

    // 表格绑定的值
    const getBindValues = computed(() => {
      const bindValues: any = {
        ...attrs,
        rowKey: props.rowKey,
        bordered: true,
        size: 'medium',
        remote: true,
      };

      if (props.scrollX) {
        bindValues.scrollX = props.scrollX;
      }

      if (props.scrollY) {
        bindValues.scrollY = props.scrollY;
      }

      return bindValues;
    });

    // 获取处理后的列
    const getColumns = computed(() => {
      const columns = [...props.columns];
      // 添加操作列
      if (props.actionColumn) {
        columns.push(props.actionColumn as unknown as DataTableColumn);
      }
      return columns;
    });

    // 列
    const columns = ref<DataTableColumn[]>([]);

    // 监听列变化
    watch(
      () => getColumns.value,
      () => {
        columns.value = toRaw(getColumns.value);
      },
      { immediate: true }
    );

    // 监听参数变化
    watch(
      () => props.params,
      () => {
        fetch();
      },
      { deep: true }
    );

    // 排序
    const sorter = ref<Record<string, any>>({});
    // 过滤
    const filters = ref<Record<string, any>>({});

    // 处理排序
    function handleSorter(newSorter: any) {
      sorter.value = newSorter;
      fetch();
    }

    // 处理过滤
    function handleFilter(newFilters: any) {
      filters.value = newFilters;
      fetch();
    }

    // 处理页码改变
    function handlePageChange(page: number) {
      if (typeof paginationConfig.value === 'object') {
        paginationConfig.value.page = page;
        fetch();
      }
    }

    // 处理每页条数改变
    function handlePageSizeChange(pageSize: number) {
      if (typeof paginationConfig.value === 'object') {
        paginationConfig.value.pageSize = pageSize;
        paginationConfig.value.page = 1;
        fetch();
      }
    }

    // 获取数据
    async function fetch() {
      if (!props.request) return;
      try {
        loading.value = true;
        const pagination = unref(paginationConfig);
        const page = typeof pagination === 'object' ? pagination.page : 1;
        const pageSize = typeof pagination === 'object' ? pagination.pageSize : 10;
        
        let params = {
          page,
          pageSize,
          ...props.params,
          ...sorter.value,
          ...filters.value,
        };

        const res = await props.request(params);
        if (res) {
          data.value = res.items || [];
          if (typeof paginationConfig.value === 'object' && res.total !== undefined) {
            paginationConfig.value.itemCount = res.total;
          }
        }
      } finally {
        loading.value = false;
      }
    }

    // 重新加载数据
    function reload() {
      if (typeof paginationConfig.value === 'object') {
        paginationConfig.value.page = 1;
      }
      fetch();
    }

    onMounted(() => {
      nextTick(() => {
        fetch();
      });
    });

    // 暴露方法
    expose({
      reload,
      fetch,
    });

    return {
      tableRef,
      loading,
      data,
      columns,
      pagination: paginationConfig,
      getBindValues,
      handleSorter,
      handleFilter,
      handlePageChange,
      handlePageSizeChange,
    };
  },
});
</script>

<style scoped>
.basic-table {
  width: 100%;
}
</style> 