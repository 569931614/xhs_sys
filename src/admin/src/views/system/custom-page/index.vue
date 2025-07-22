<template>
  <div class="custom-page-container">
    <div class="white-bg-container">
      <n-card title="自定义页面管理" :bordered="false" class="page-card">
        <template #header-extra>
          <n-space>
            <n-input
              v-model:value="searchQuery"
              placeholder="搜索页面标题"
              clearable
              @clear="handleSearch"
              @keyup.enter="handleSearch"
              class="search-input"
            >
              <template #suffix>
                <n-button type="primary" text @click="handleSearch">
                  <template #icon>
                    <n-icon><search-outlined /></n-icon>
                  </template>
                </n-button>
              </template>
            </n-input>
            <n-button type="primary" @click="handleAdd" class="add-button">
              <template #icon>
                <n-icon><plus-outlined /></n-icon>
              </template>
              添加页面
            </n-button>
          </n-space>
        </template>
        
        <div class="data-table-wrapper">
          <n-data-table
            ref="tableRef"
            :columns="columns"
            :data="tableData"
            :loading="loading"
            :pagination="pagination"
            :row-class-name="rowClassName"
            @update:page="handlePageChange"
            striped
            :empty="{
              description: '暂无数据，点击添加按钮创建新页面',
              icon: () => h(NIcon, { size: 48 }, { default: () => h(FileOutlined) })
            }"
            class="custom-table"
          />
        </div>
      </n-card>
      
      <!-- 编辑/添加模态框 -->
      <n-modal v-model:show="showModal" :title="modalTitle" preset="card" style="width: 600px" class="custom-modal">
        <n-form
          ref="formRef"
          :model="formData"
          :rules="rules"
          label-placement="left"
          label-width="auto"
          require-mark-placement="right-hanging"
        >
          <n-form-item label="页面标题" path="title">
            <n-input v-model:value="formData.title" placeholder="请输入页面标题" />
          </n-form-item>
          
          <n-form-item label="页面路径" path="path">
            <n-input-group>
              <n-input v-model:value="formData.path" placeholder="请输入页面路径，外部链接需要带http(s)://" />
              <n-button type="primary" ghost @click="previewUrl" :disabled="!formData.path">
                <template #icon>
                  <n-icon><eye-outlined /></n-icon>
                </template>
                预览
              </n-button>
            </n-input-group>
            <template #help>
              <span class="text-xs text-gray-500">
                外部链接需要完整URL (如 https://example.com)，内部页面使用相对路径 (如 /help)
              </span>
            </template>
          </n-form-item>
          
          <n-form-item label="页面类型" path="type">
            <n-radio-group v-model:value="formData.type">
              <n-space>
                <n-radio :value="0">
                  <n-space align="center">
                    <n-icon><link-outlined /></n-icon>
                    <span>外部链接</span>
                  </n-space>
                </n-radio>
                <n-radio :value="1">
                  <n-space align="center">
                    <n-icon><file-outlined /></n-icon>
                    <span>内部页面</span>
                  </n-space>
                </n-radio>
              </n-space>
            </n-radio-group>
          </n-form-item>
          
          <n-form-item label="页面图标" path="icon">
            <n-input-group>
              <n-input v-model:value="formData.icon" placeholder="请输入图标名称" />
              <n-button text @click="showIconHelp">
                <n-icon><question-circle-outlined /></n-icon>
              </n-button>
            </n-input-group>
            <template #help>
              <span class="text-xs text-gray-500">
                推荐使用Iconify图标，格式如：carbon:document, mdi:home, etc.
              </span>
            </template>
          </n-form-item>
          
          <n-form-item label="描述信息" path="description">
            <n-input 
              v-model:value="formData.description" 
              type="textarea" 
              placeholder="请输入描述信息" 
            />
          </n-form-item>
          
          <n-form-item label="排序值" path="order">
            <n-input-number v-model:value="formData.order" placeholder="数字越小越靠前" />
          </n-form-item>
          
          <n-form-item label="状态" path="status">
            <n-radio-group v-model:value="formData.status">
              <n-space>
                <n-radio :value="1">
                  <n-tag type="success">启用</n-tag>
                </n-radio>
                <n-radio :value="0">
                  <n-tag type="error">禁用</n-tag>
                </n-radio>
              </n-space>
            </n-radio-group>
          </n-form-item>
          
          <n-form-item label="用户类型限制" path="userTypes">
            <n-select
              v-model:value="formData.userTypes"
              :options="userTypeOptions"
              multiple
              placeholder="请选择可访问的用户类型，不选则所有用户可访问"
            />
            <template #help>
              <span class="text-xs text-gray-500">
                不选择任何用户类型时，所有用户都可以访问此页面；选择后，只有指定用户类型的用户才能访问
              </span>
            </template>
          </n-form-item>
        </n-form>
        
        <template #footer>
          <n-space justify="end">
            <n-button @click="showModal = false">取消</n-button>
            <n-button type="primary" @click="handleSubmit" :loading="submitLoading">确定</n-button>
          </n-space>
        </template>
      </n-modal>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, h, computed, nextTick } from 'vue';
import { useMessage, useDialog } from 'naive-ui';
import { 
  NButton, 
  NSpace, 
  NTag, 
  NPopconfirm, 
  NIcon, 
  NTooltip,
  NInput,
  NDataTable,
  NCard,
  NForm,
  NFormItem,
  NInputGroup,
  NRadio,
  NRadioGroup,
  NInputNumber,
  NModal,
  NSelect,
  type DataTableColumn,
  DataTableColumns
} from 'naive-ui';
import { 
  getCustomPageList, 
  createCustomPage, 
  updateCustomPage, 
  deleteCustomPage
} from '@/api/modules/customPage';
import { getAllUserTypes } from '@/api/system/user-type';
import type { UserType } from '@/api/system/user-type';
import type { CustomPage } from '@/api/system/custom-page';
import { 
  SearchOutlined, 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  QuestionCircleOutlined,
  EyeOutlined,
  LinkOutlined,
  FileOutlined
} from '@vicons/antd';
import { debounce } from 'lodash-es';

const message = useMessage();
const dialog = useDialog();

// 搜索功能
const searchQuery = ref('');
// 使用防抖处理搜索
const handleSearch = debounce(() => {
  pagination.page = 1;
  loadData();
}, 300);

// 表格数据
const tableData = ref<CustomPage[]>([]);
const loading = ref(false);
const submitLoading = ref(false);
const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 30, 40],
  onChange: (page: number) => {
    pagination.page = page;
    loadData();
  },
  onUpdatePageSize: (pageSize: number) => {
    pagination.pageSize = pageSize;
    pagination.page = 1;
    loadData();
  }
});

// 获取类型和状态的文本和颜色
const getTypeInfo = (type: number) => {
  return type === 0 
    ? { text: '外部链接', type: 'info', icon: LinkOutlined } 
    : { text: '内部页面', type: 'success', icon: FileOutlined };
};

const getStatusInfo = (status: number) => {
  return status === 1 
    ? { text: '启用', type: 'success' } 
    : { text: '禁用', type: 'error' };
};

// 行样式
const rowClassName = (row: CustomPage) => {
  return row.status === 0 ? 'opacity-50' : '';
};

// 表格列定义
const createColumns = () => {
  return [
    {
      title: '页面标题',
      key: 'title',
      width: 200,
      render: (row: CustomPage) => {
        return h('div', { class: 'title-cell' }, row.title);
      }
    },
    {
      title: '页面路径',
      key: 'path',
      width: 200,
      render: (row: CustomPage) => {
        return h('div', { class: 'path-cell' }, row.path);
      }
    },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render: (row: CustomPage) => {
        return h(NTag, {
          type: row.status === 1 ? 'success' : 'error'
        }, {
          default: () => row.status === 1 ? '启用' : '禁用'
        });
      }
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (row: CustomPage) => {
        return h(NSpace, {}, {
          default: () => [
            h(NButton, {
              size: 'small',
              onClick: () => handleEdit(row)
            }, {
              default: () => '编辑'
            }),
            h(NButton, {
              size: 'small',
              type: 'error',
              onClick: () => handleDelete(row)
            }, {
              default: () => '删除'
            })
          ]
        });
      }
    }
  ] as any as DataTableColumns;
};

const columns = createColumns();

// 预览URL
const previewUrl = (urlOrEvent?: string | MouseEvent) => {
  let path = '';
  
  if (typeof urlOrEvent === 'string') {
    path = urlOrEvent;
  } else if (!urlOrEvent) {
    path = formData.path;
  } else {
    path = formData.path;
  }
  
  if (!path) return;
  
  const isExternal = path.startsWith('http://') || path.startsWith('https://');
  if (isExternal) {
    window.open(path, '_blank');
  } else {
    // 对于内部页面，拼接当前域名
    const baseUrl = window.location.origin;
    window.open(`${baseUrl}${path.startsWith('/') ? path : `/${path}`}`, '_blank');
  }
};

// 显示图标帮助
const showIconHelp = () => {
  dialog.info({
    title: '图标使用帮助',
    content: '本系统使用Iconify图标库，您可以访问 https://icones.js.org/ 查找更多图标。\n\n常用图标格式：\n- carbon:document (Carbon图标集的document图标)\n- mdi:home (Material Design Icons的home图标)\n- icon-park:page (Icon Park的page图标)',
  });
};

// 切换状态
const toggleStatus = async (row: CustomPage) => {
  try {
    await updateCustomPage(row.id as number, {
      ...row,
      status: row.status === 1 ? 0 : 1
    });
    message.success('状态更新成功');
    loadData();
  } catch (error) {
    console.error(error);
    message.error('状态更新失败');
  }
};

// 加载数据
const loadData = async () => {
  loading.value = true;
  try {
    const params: any = {
      page: pagination.page,
      size: pagination.pageSize,
    };
    
    if (searchQuery.value) {
      params.title = searchQuery.value;
    }
    
    const res = await getCustomPageList(params);
    
    if (!res || !res.data || !res.data.data) {
      message.error('获取数据失败');
      return;
    }
    
    const responseData = res.data.data;
    
    // 处理空数据情况
    if (!responseData.list) {
      tableData.value = [];
      pagination.itemCount = 0;
    } else {
      tableData.value = responseData.list;
      pagination.itemCount = responseData.total || 0;
    }
  } catch (error: any) {
    console.error('加载数据出错:', error);
    message.error('获取数据失败：' + (error.message || '未知错误'));
    tableData.value = [];
    pagination.itemCount = 0;
  } finally {
    loading.value = false;
  }
};

// 表单相关
const showModal = ref(false);
const modalTitle = ref('');
const formRef = ref(null);
const userTypes = ref<UserType[]>([]);
const defaultFormData = {
  id: null,
  title: '',
  path: '',
  type: 0,
  icon: 'carbon:document',
  description: '',
  order: 0,
  status: 1,
  userTypes: [],
};
const formData = reactive({ ...defaultFormData });
const rules = {
  title: { required: true, message: '请输入页面标题', trigger: 'blur' },
  path: { required: true, message: '请输入页面路径', trigger: 'blur' },
};

// 添加页面
const handleAdd = () => {
  Object.assign(formData, defaultFormData);
  modalTitle.value = '添加页面';
  showModal.value = true;
};

// 编辑页面
const handleEdit = (row: CustomPage) => {
  Object.assign(formData, row);
  modalTitle.value = '编辑页面';
  showModal.value = true;
};

// 删除页面
const handleDelete = (row: CustomPage) => {
  if (!row.id) return;
  deleteCustomPage(row.id).then(() => {
    message.success('删除成功');
    loadData();
  });
};

// 加载用户类型
const loadUserTypes = async () => {
  try {
    const res = await getAllUserTypes();
    if (res && res.data && res.data.data) {
      if (Array.isArray(res.data.data)) {
        userTypes.value = res.data.data.filter(item => item.status === 1);
      }
    }
  } catch (error) {
    console.error('加载用户类型失败', error);
    // 出错时使用空数组，这样不会影响页面正常功能
    userTypes.value = [];
    // 不显示错误消息给用户，避免干扰
    // message.error('加载用户类型失败');
  }
};

// 转换用户类型为选择框选项
const userTypeOptions = computed(() => {
  return userTypes.value.map(item => ({
    label: item.name,
    value: item.id
  }));
});

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return;
  
  // @ts-ignore - 忽略类型错误
  formRef.value.validate(async (errors: any) => {
    if (!errors) {
      try {
        submitLoading.value = true;
        if (formData.id) {
          await updateCustomPage(formData.id, {
            title: formData.title,
            path: formData.path,
            type: formData.type,
            icon: formData.icon,
            description: formData.description,
            order: formData.order,
            status: formData.status,
            userTypes: formData.userTypes,
          });
          message.success('更新成功');
        } else {
          await createCustomPage({
            title: formData.title,
            path: formData.path,
            type: formData.type,
            icon: formData.icon,
            description: formData.description,
            order: formData.order,
            status: formData.status,
            userTypes: formData.userTypes,
          });
          message.success('添加成功');
        }
        showModal.value = false;
        loadData();
      } catch (error) {
        console.error(error);
        message.error('操作失败');
      } finally {
        submitLoading.value = false;
      }
    }
  });
};

// 分页处理函数
const handlePageChange = (page: number) => {
  pagination.page = page;
  loadData();
};

const onPageSizeChange = (pageSize: number) => {
  pagination.pageSize = pageSize;
  loadData();
};

// 初始化
onMounted(() => {
  loadData();
  loadUserTypes();
});
</script>

<style scoped>
.custom-page-container {
  width: 100%;
  height: 100vh;
  padding: 20px;
  background-color: #f5f7fa;
  position: relative;
  overflow: auto;
}

.white-bg-container {
  width: 100%;
  min-height: 600px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 0;
  display: block;
}

.page-card {
  width: 100%;
  min-height: 600px;
  background-color: #fff;
  display: block;
}

.data-table-wrapper {
  width: 100%;
  min-height: 500px;
  margin-top: 16px;
  position: relative;
  display: block;
}

.custom-table {
  width: 100%;
  min-height: 400px;
}

.search-input {
  width: 300px;
}

.add-button {
  margin-left: 10px;
}

.custom-modal {
  border-radius: 8px;
  overflow: hidden;
}

.opacity-50 {
  opacity: 0.5;
}

.flex {
  display: flex;
}

.items-center {
  align-items: center;
}

.space-x-1 > * + * {
  margin-left: 0.25rem;
}

.cursor-pointer {
  cursor: pointer;
}

.text-blue-500 {
  color: #3b82f6;
}

.hover\:underline:hover {
  text-decoration: underline;
}

.text-xs {
  font-size: 0.75rem;
}

.text-gray-500 {
  color: #6b7280;
}

.mb-4 {
  margin-bottom: 1rem;
}

/* 强制表格显示 */
:deep(.n-data-table-wrapper) {
  min-height: 400px !important;
}

:deep(.n-data-table) {
  min-height: 350px !important;
}

:deep(.n-card__content) {
  min-height: 600px !important;
}

:deep(.n-data-table-empty) {
  min-height: 350px !important;
  padding: 40px 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
</style> 