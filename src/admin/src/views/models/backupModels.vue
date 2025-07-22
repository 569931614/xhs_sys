<script setup lang="ts">
import {
  NButton,
  NCard,
  NDataTable,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  useMessage,
  NPagination,
  NSpace,
  NPopconfirm,
  NTag,
  NSpin,
  NInputNumber,
  type DataTableColumns
} from 'naive-ui';
import { ref, reactive, onMounted, h } from 'vue';
import type { VNodeChild } from 'vue';
import request from '@/utils/request';

interface BackupModel {
  id?: number;
  name: string;        // 模型名称
  baseUrl: string;     // 请求地址
  apiKey: string;      // API Key
  modelType: string;   // 模型类型：text(文字), image(图文), video(视频)
  model: string;       // 使用的模型
  status: number;      // 状态：0-禁用, 1-启用
  priority: number;    // 优先级：数字越小优先级越高
  requestMethod: string; // 请求方式：stream(流式), sync(同步)
  requestType: string;   // 请求类型：chat(聊天), edit(编辑), image(图像)
  createdAt?: string;  // 创建时间
  updatedAt?: string;  // 更新时间
}

// 表格数据
const tableData = ref<BackupModel[]>([]);
const loading = ref(false);

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 30, 40]
});

// 类型定义辅助
type ModelType = 'text' | 'image' | 'video';
interface TypeConfig {
  type: 'default' | 'info' | 'success' | 'warning' | 'error';
  text: string;
}

// 表格列配置
const columns = [
  {
    title: 'ID',
    key: 'id',
    width: 60
  },
  {
    title: '模型名称',
    key: 'name',
    width: 150
  },
  {
    title: '请求地址',
    key: 'baseUrl',
    width: 200
  },
  {
    title: 'API Key',
    key: 'apiKey',
    width: 150,
    render(row: BackupModel, rowIndex: number) {
      const key = row.apiKey || '';
      // 仅显示前4位和后4位，中间用*代替
      if (key.length > 8) {
        return `${key.substring(0, 4)}****${key.substring(key.length - 4)}`;
      }
      return key;
    }
  },
  {
    title: '模型类型',
    key: 'modelType',
    width: 80,
    render(row: BackupModel, rowIndex: number) {
      const typeMap: Record<ModelType, TypeConfig> = {
        text: { type: 'info', text: '文字' },
        image: { type: 'success', text: '图文' },
        video: { type: 'warning', text: '视频' }
      };
      const type = row.modelType as ModelType || 'text';
      const config = typeMap[type] || { type: 'default', text: '未知' };
      return h(NTag, { type: config.type }, { default: () => config.text });
    }
  },
  {
    title: '使用的模型',
    key: 'model',
    width: 120
  },
  {
    title: '优先级 *',
    key: 'priority',
    width: 60,
    titleAlign: 'center',
    align: 'center',
    render(row: BackupModel) {
      return h('span', { class: row.priority <= 5 ? 'high-priority' : '' }, row.priority);
    }
  },
  {
    title: '请求方式',
    key: 'requestMethod',
    width: 80,
    render(row: BackupModel, rowIndex: number) {
      const methodMap: Record<string, TypeConfig> = {
        stream: { type: 'info', text: '流式' },
        sync: { type: 'success', text: '同步' }
      };
      const method = row.requestMethod || 'stream';
      const config = methodMap[method] || { type: 'default', text: '未知' };
      return h(NTag, { type: config.type }, { default: () => config.text });
    }
  },
  {
    title: '请求类型',
    key: 'requestType',
    width: 80,
    render(row: BackupModel, rowIndex: number) {
      const typeMap: Record<string, TypeConfig> = {
        chat: { type: 'default', text: '聊天' },
        edit: { type: 'info', text: '编辑' },
        image: { type: 'success', text: '图像' }
      };
      const type = row.requestType || 'chat';
      const config = typeMap[type] || { type: 'default', text: '未知' };
      return h(NTag, { type: config.type }, { default: () => config.text });
    }
  },
  {
    title: '状态',
    key: 'status',
    width: 60,
    render(row: BackupModel, rowIndex: number) {
      return h(NTag, { type: row.status === 1 ? 'success' : 'error' }, 
        { default: () => row.status === 1 ? '启用' : '禁用' });
    }
  },
  {
    title: '创建时间',
    key: 'createdAt',
    width: 160
  },
  {
    title: '操作',
    key: 'actions',
    render(row: BackupModel, rowIndex: number) {
      return h(NSpace, { justify: 'center' }, {
        default: () => [
          h(NButton, 
            { 
              type: 'primary', 
              size: 'small',
              onClick: () => handleEdit(row)
            }, 
            { default: () => '编辑' }
          ),
          h(NPopconfirm, 
            { 
              onPositiveClick: () => handleDelete(row)
            }, 
            {
              default: () => '确定删除吗？',
              trigger: () => h(NButton, 
                { 
                  type: 'error', 
                  size: 'small'
                }, 
                { default: () => '删除' }
              )
            }
          ),
          h(NButton, 
            { 
              type: row.status === 1 ? 'warning' : 'success', 
              size: 'small',
              onClick: () => handleToggleStatus(row)
            }, 
            { default: () => row.status === 1 ? '禁用' : '启用' }
          )
        ]
      });
    }
  }
] as any;

// 表单相关
const showModal = ref(false);
const formRef = ref(null);
const modalTitle = ref('添加备用模型');
const isEditing = ref(false);
const submitLoading = ref(false);

const formModel = reactive<BackupModel>({
  name: '',
  baseUrl: '',
  apiKey: '',
  modelType: 'image',
  model: 'gpt-4o-image',
  status: 1,
  priority: 10,
  requestMethod: 'sync',
  requestType: 'chat'
});

const modelTypeOptions = [
  { label: '文字模型', value: 'text' },
  { label: '图文模型', value: 'image' },
  { label: '视频模型', value: 'video' }
];

const requestMethodOptions = [
  { label: '流式响应', value: 'stream' },
  { label: '同步响应', value: 'sync' }
];

const requestTypeOptions = [
  { label: '聊天模式', value: 'chat' },
  { label: '编辑模式', value: 'edit' },
  { label: '图像模式', value: 'image' }
];

const message = useMessage();

// 加载数据
const loadData = async () => {
  // 检查是否有token
  const token = localStorage.getItem('token');
  if (!token) {
    message.error('请先登录');
    return;
  }

  loading.value = true;
  try {
    const { page, pageSize } = pagination;
    const res = await request.get('/backup/models', {
      params: { page, pageSize },
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (res.data && res.data.success) {
      tableData.value = res.data.data.items || [];
      pagination.itemCount = res.data.data.total || 0;
    } else {
      message.error(res.data?.message || '加载数据失败');
    }
  } catch (err) {
    console.error('加载备用模型列表失败:', err);
    // 如果是401错误，提示用户重新登录
    const error = err as any;
    if (error.response && error.response.status === 401) {
      message.error('登录已过期，请重新登录');
    } else {
      message.error('加载备用模型列表失败');
    }
  } finally {
    loading.value = false;
  }
};

// 编辑模型
const handleEdit = (row: BackupModel) => {
  isEditing.value = true;
  modalTitle.value = '编辑备用模型';
  
  // 复制数据到表单
  Object.assign(formModel, {
    id: row.id,
    name: row.name,
    baseUrl: row.baseUrl,
    apiKey: row.apiKey,
    modelType: row.modelType,
    model: row.model || 'gpt-4o-image',
    status: row.status,
    priority: row.priority || 10,
    requestMethod: row.requestMethod || 'stream',
    requestType: row.requestType || 'chat'
  });
  
  showModal.value = true;
};

// 添加模型
const handleAdd = () => {
  isEditing.value = false;
  modalTitle.value = '添加备用模型';
  
  // 重置表单
  Object.assign(formModel, {
    id: undefined,
    name: '',
    baseUrl: '',
    apiKey: '',
    modelType: 'image',
    model: 'gpt-4o-image',
    status: 1,
    priority: 10,
    requestMethod: 'sync',
    requestType: 'chat'
  });
  
  showModal.value = true;
};

// 删除模型
const handleDelete = async (row: BackupModel) => {
  // 检查是否有token
  const token = localStorage.getItem('token');
  if (!token) {
    message.error('请先登录');
    return;
  }

  try {
    const res = await request.post('/backup/models/delete', { id: row.id }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (res.data && res.data.success) {
      message.success('删除成功');
      loadData();
    } else {
      message.error(res.data?.message || '删除失败');
    }
  } catch (err) {
    console.error('删除备用模型失败:', err);
    const error = err as any;
    if (error.response && error.response.status === 401) {
      message.error('登录已过期，请重新登录');
    } else {
      message.error('删除备用模型失败');
    }
  }
};

// 切换状态
const handleToggleStatus = async (row: BackupModel) => {
  // 检查是否有token
  const token = localStorage.getItem('token');
  if (!token) {
    message.error('请先登录');
    return;
  }

  try {
    const newStatus = row.status === 1 ? 0 : 1;
    const res = await request.post('/backup/models/update-status', { 
      id: row.id, 
      status: newStatus 
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (res.data && res.data.success) {
      message.success(`${newStatus === 1 ? '启用' : '禁用'}成功`);
      loadData();
    } else {
      message.error(res.data?.message || '操作失败');
    }
  } catch (err) {
    console.error('切换备用模型状态失败:', err);
    const error = err as any;
    if (error.response && error.response.status === 401) {
      message.error('登录已过期，请重新登录');
    } else {
      message.error('操作失败');
    }
  }
};

// 提交表单
const handleSubmit = async () => {
  if (!formModel.name) {
    message.error('请输入模型名称');
    return;
  }
  
  if (!formModel.baseUrl) {
    message.error('请输入请求地址');
    return;
  }
  
  if (!formModel.apiKey) {
    message.error('请输入API Key');
    return;
  }
  
  // 检查是否有token
  const token = localStorage.getItem('token');
  if (!token) {
    message.error('请先登录');
    return;
  }
  
  submitLoading.value = true;
  try {
    const apiUrl = isEditing.value 
      ? '/backup/models/update' 
      : '/backup/models/create';
    
    const res = await request.post(apiUrl, formModel, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (res.data && res.data.success) {
      message.success(isEditing.value ? '更新成功' : '添加成功');
      showModal.value = false;
      loadData();
    } else {
      message.error(res.data?.message || (isEditing.value ? '更新失败' : '添加失败'));
    }
  } catch (err) {
    console.error('保存备用模型失败:', err);
    const error = err as any;
    if (error.response && error.response.status === 401) {
      message.error('登录已过期，请重新登录');
    } else {
      message.error(isEditing.value ? '更新失败' : '添加失败');
    }
  } finally {
    submitLoading.value = false;
  }
};

// 页码变化
const handlePageChange = (page: number) => {
  pagination.page = page;
  loadData();
};

// 每页条数变化
const handlePageSizeChange = (pageSize: number) => {
  pagination.pageSize = pageSize;
  pagination.page = 1;  // 重置到第一页
  loadData();
};

// 初始化
onMounted(() => {
  // 检查是否已登录
  const token = localStorage.getItem('token');
  if (!token) {
    message.warning('请先登录后再访问此页面');
    return;
  }
  loadData();
});
</script>

<template>
  <div class="backup-models-container">
    <NCard title="备用模型管理" class="mb-4">
      <template #header-extra>
        <div class="header-actions">
          <NButton type="primary" @click="handleAdd">
            添加备用模型
          </NButton>
        </div>
      </template>
      
      <NSpin :show="loading">
        <NDataTable
          :columns="columns"
          :data="tableData"
          :bordered="false"
          striped
          :pagination="false"
          :row-key="(row) => row.id"
        />
        
        <div class="priority-note">* 优先级：数字越小优先级越高，系统会优先调用优先级更高的模型</div>
        
        <div class="pagination-container" v-if="tableData.length > 0">
          <NPagination
            v-model:page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :item-count="pagination.itemCount"
            :page-sizes="pagination.pageSizes"
            :show-size-picker="pagination.showSizePicker"
            @update:page="handlePageChange"
            @update:page-size="handlePageSizeChange"
          />
        </div>
      </NSpin>
    </NCard>
    
    <!-- 模型表单弹窗 -->
    <NModal v-model:show="showModal" :title="modalTitle" preset="card" style="width: 600px">
      <NSpin :show="submitLoading">
        <NForm ref="formRef" :model="formModel" label-placement="left" label-width="100">
          <NFormItem label="模型名称" required>
            <NInput v-model:value="formModel.name" placeholder="" />
          </NFormItem>
          
          <NFormItem label="请求地址" required>
            <NInput v-model:value="formModel.baseUrl" placeholder="请输入API请求地址，如：https://api.openai.com" />
          </NFormItem>
          
          <NFormItem label="API Key" required>
            <NInput v-model:value="formModel.apiKey" type="password" placeholder="请输入API Key" show-password-on="click" />
          </NFormItem>
          
          <NFormItem label="模型类型" required>
            <NSelect v-model:value="formModel.modelType" :options="modelTypeOptions" default-value="image" />
            <template #help>
              <span class="form-tip">默认选择图文模型</span>
            </template>
          </NFormItem>
          
          <NFormItem label="使用的模型" required>
            <NInput v-model:value="formModel.model" placeholder="请输入使用的模型，如：gpt-4o-image" />
          </NFormItem>
          
          <NFormItem label="优先级">
            <NInputNumber v-model:value="formModel.priority" :min="1" :max="100" />
            <template #help>
              <span class="priority-tip">数字越小优先级越高，系统会优先调用优先级更高的模型</span>
            </template>
          </NFormItem>
          
          <NFormItem label="请求方式">
            <NSelect v-model:value="formModel.requestMethod" :options="requestMethodOptions" default-value="sync" />
            <template #help>
              <span class="form-tip">默认选择同步响应，推荐用于图像生成</span>
            </template>
          </NFormItem>
          
          <NFormItem label="请求类型">
            <NSelect v-model:value="formModel.requestType" :options="requestTypeOptions" default-value="chat" />
            <template #help>
              <span class="form-tip">默认选择聊天模式</span>
            </template>
          </NFormItem>
          
          <NFormItem label="状态">
            <NSelect v-model:value="formModel.status" :options="[
              { label: '启用', value: 1 },
              { label: '禁用', value: 0 }
            ]" />
          </NFormItem>
        </NForm>
      </NSpin>
      
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showModal = false" :disabled="submitLoading">取消</NButton>
          <NButton type="primary" @click="handleSubmit" :loading="submitLoading">保存</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.backup-models-container {
  padding: 20px;
}
.mb-4 {
  margin-bottom: 16px;
}
.pagination-container {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
.priority-note {
  margin-top: 10px;
  font-size: 12px;
  color: #606266;
  font-style: italic;
}
.priority-tip {
  font-size: 12px;
  color: #606266;
}
.high-priority {
  color: #18a058;
  font-weight: bold;
}
.form-tip {
  font-size: 12px;
  color: #606266;
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}
.config-tip {
  font-size: 13px;
  color: #18a058;
  background-color: #e8f9f0;
  padding: 4px 10px;
  border-radius: 4px;
  border-left: 3px solid #18a058;
}
</style> 