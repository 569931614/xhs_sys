<template>
  <div class="user-type-container">
    <div class="white-bg-container">
      <n-card title="用户类型管理" :bordered="false" class="page-card">
        <template #header-extra>
          <n-space>
            <n-input
              v-model:value="searchQuery"
              placeholder="搜索用户类型名称"
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
              添加用户类型
            </n-button>
          </n-space>
        </template>
        
        <div class="data-table-wrapper">
          <n-data-table
            :columns="columns"
            :data="tableData"
            :loading="loading"
            :pagination="pagination"
            :row-class-name="rowClassName"
            @update:page="onPageChange"
            @update:page-size="onPageSizeChange"
            striped
            :empty="{
              description: '暂无数据，点击添加按钮创建新用户类型',
              icon: () => h(NIcon, { size: 48 }, { default: () => h(TeamOutlined) })
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
          <n-form-item label="类型名称" path="name">
            <n-input v-model:value="formData.name" placeholder="请输入用户类型名称" />
          </n-form-item>
          
          <n-form-item label="描述信息" path="description">
            <n-input 
              v-model:value="formData.description" 
              type="textarea" 
              placeholder="请输入描述信息" 
            />
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
import { ref, reactive, onMounted, h, computed } from 'vue';
import { useMessage, useDialog } from 'naive-ui';
import { 
  NButton, 
  NSpace, 
  NTag, 
  NPopconfirm, 
  NIcon, 
  NInput,
  NDataTable,
  NCard,
  NForm,
  NFormItem,
  NModal,
  NRadio,
  NRadioGroup,
  type DataTableColumn,
  DataTableColumns
} from 'naive-ui';
import { 
  getAllUserTypes, 
  createUserType, 
  updateUserType, 
  deleteUserType,
  type UserType
} from '@/api/system/user-type';
import { 
  SearchOutlined, 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined,
  TeamOutlined
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
const tableData = ref<UserType[]>([]);
const loading = ref(false);
const submitLoading = ref(false);
const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 30, 40]
});

// 行样式
const rowClassName = (row: UserType) => {
  return row.status === 0 ? 'opacity-50' : '';
};

// 表格列定义
const createColumns = (): DataTableColumns => {
  const columns = [
    {
      title: '类型名称',
      key: 'name',
      width: 200,
      render: (row: any) => {
        return h('div', { class: 'title-cell' }, (row as UserType).name);
      }
    },
    {
      title: '描述',
      key: 'description',
      width: 300,
      render: (row: any) => {
        return h('div', { class: 'description-cell' }, (row as UserType).description || '-');
      }
    },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render: (row: any) => {
        const status = (row as UserType).status;
        return h(NTag, {
          type: status === 1 ? 'success' : 'error'
        }, {
          default: () => status === 1 ? '启用' : '禁用'
        });
      }
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (row: any) => {
        return h(NSpace, {}, {
          default: () => [
            h(NButton, {
              size: 'small',
              onClick: () => handleEdit(row as UserType)
            }, {
              default: () => '编辑'
            }),
            h(NPopconfirm, {
              onPositiveClick: () => handleDelete(row as UserType)
            }, {
              trigger: () => h(NButton, {
                size: 'small',
                type: 'error'
              }, {
                default: () => '删除'
              }),
              default: () => '确定要删除这个用户类型吗？'
            })
          ]
        });
      }
    }
  ];
  
  return columns as unknown as DataTableColumns;
};

// 使用创建的列定义
const columns = createColumns();

// 表单相关
const showModal = ref(false);
const modalTitle = ref('');
const formRef = ref(null);
const defaultFormData = {
  id: null,
  name: '',
  description: '',
  status: 1,
};
const formData = reactive({ ...defaultFormData });
const rules = {
  name: { required: true, message: '请输入用户类型名称', trigger: 'blur' },
};

// 加载数据
const loadData = async () => {
  loading.value = true;
  try {
    const res = await getAllUserTypes();
    if (res && res.data && res.data.data) {
      if (Array.isArray(res.data.data)) {
        tableData.value = res.data.data;
        pagination.itemCount = res.data.data.length;
      }
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

// 添加用户类型
const handleAdd = () => {
  Object.assign(formData, defaultFormData);
  modalTitle.value = '添加用户类型';
  showModal.value = true;
};

// 编辑用户类型
const handleEdit = (row: UserType) => {
  Object.assign(formData, row);
  modalTitle.value = '编辑用户类型';
  showModal.value = true;
};

// 删除用户类型
const handleDelete = async (row: UserType) => {
  if (!row.id) return;
  try {
    await deleteUserType(row.id);
    message.success('删除成功');
    loadData();
  } catch (error) {
    console.error(error);
    message.error('删除失败');
  }
};

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return;
  
  // @ts-ignore - 忽略类型错误
  formRef.value.validate(async (errors: any) => {
    if (!errors) {
      try {
        submitLoading.value = true;
        if (formData.id) {
          await updateUserType(formData.id, {
            id: formData.id,
            name: formData.name,
            description: formData.description,
            status: formData.status,
          });
          message.success('更新成功');
        } else {
          await createUserType({
            id: 0,
            name: formData.name,
            description: formData.description,
            status: formData.status,
          });
          message.success('添加成功');
        }
        showModal.value = false;
        loadData();
      } catch (error: any) {
        console.error(error);
        message.error('操作失败');
      } finally {
        submitLoading.value = false;
      }
    }
  });
};

// 处理分页
const onPageChange = (page: number) => {
  pagination.page = page;
  loadData();
};

const onPageSizeChange = (pageSize: number) => {
  pagination.pageSize = pageSize;
  pagination.page = 1;
  loadData();
};

// 初始化
onMounted(() => {
  loadData();
});
</script>

<style scoped>
.user-type-container {
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