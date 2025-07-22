<script setup lang="ts">
import {
  NButton,
  NCard,
  NForm,
  NFormItem,
  NInput,
  NModal,
  NTable,
  useMessage,
  NSpace,
  NPagination,
  NSpin,
  NTooltip,
  NSwitch,
} from 'naive-ui';
import { ref, reactive, onMounted } from 'vue';
import promptlibApi from '@/api/modules/promptlib';

// 定义提示词模板接口
interface PromptTemplate {
  id: number;
  identifier: string; // 提示词标识
  prompt: string; // 提示词内容
  modelName: string; // 使用的模型名称
  createdAt?: string; // 创建时间
  updatedAt?: string; // 更新时间
  status?: number; // 状态
  presetValues?: string; // API请求预设值
}

// 分页和加载状态
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
});
const loading = ref(false);

// 查询参数
const queryParams = reactive({
  identifier: '',
  modelName: '',
  status: undefined
});

// 表格数据
const tableData = ref<PromptTemplate[]>([]);

// 消息提示
const message = useMessage();

// 是否显示编辑模态框
const showModal = ref(false);
// 当前编辑的提示词
const editingPrompt = reactive({
  id: 0,
  identifier: '',
  prompt: '',
  modelName: '',
  status: 1,
  presetValues: ''
});
// 是否为新增
const isAdding = ref(false);
// 表单提交中
const submitting = ref(false);

// 日期格式化函数
const formatDate = (dateString: string | Date | undefined): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (e) {
    return String(dateString);
  }
};

// 加载数据
const loadData = async () => {
  loading.value = true;
  tableData.value = []; // 先清空数据
  
  try {
    const { page, pageSize } = pagination;
    const response: any = await promptlibApi.queryPromptTemplates({
      page,
      pageSize,
      ...queryParams
    });
    
    console.log('API响应数据:', response);
    
    // 处理不同的响应结构情况
    if (response && typeof response === 'object') {
      // 情况1: 标准封装结构 {code, success, message, data: {items, total}}
      if (response.code === 200 && response.data && response.data.items) {
        const items = response.data.items;
        if (Array.isArray(items)) {
          tableData.value = items.map((item: any) => ({
            ...item,
            createdAt: formatDate(item.createdAt),
            updatedAt: formatDate(item.updatedAt)
          }));
          pagination.total = Number(response.data.total) || 0;
        }
      }
      // 情况2: 简化结构 {items, total} 直接返回数据
      else if (response.items && Array.isArray(response.items)) {
        tableData.value = response.items.map((item: any) => ({
          ...item,
          createdAt: formatDate(item.createdAt),
          updatedAt: formatDate(item.updatedAt)
        }));
        pagination.total = Number(response.total) || 0;
      }
      // 情况3: 数组形式直接返回数据
      else if (Array.isArray(response)) {
        tableData.value = response.map((item: any) => ({
          ...item,
          createdAt: formatDate(item.createdAt),
          updatedAt: formatDate(item.updatedAt)
        }));
        pagination.total = response.length;
      }
      // 错误处理 - 如果响应包含错误信息
      else if (!response.success && response.message) {
        message.error(response.message);
      }
      else {
        console.warn('未能识别的响应数据格式:', response);
      }
    } else {
      console.warn('响应数据异常:', response);
    }
  } catch (error) {
    // 这个catch块通常不会执行，因为我们已经在API拦截器中处理了错误
    console.error('加载提示词模板失败:', error);
  } finally {
    loading.value = false;
  }
};

// 页码变更
const handlePageChange = (page: number) => {
  pagination.page = page;
  loadData();
};

// 每页条数变更
const handlePageSizeChange = (pageSize: number) => {
  pagination.pageSize = pageSize;
  pagination.page = 1;
  loadData();
};

// 编辑提示词
const handleEdit = (row: PromptTemplate) => {
  isAdding.value = false;
  editingPrompt.id = row.id;
  editingPrompt.identifier = row.identifier;
  editingPrompt.prompt = row.prompt;
  editingPrompt.modelName = row.modelName;
  // 确保状态是数字类型
  editingPrompt.status = row.status !== undefined ? Number(row.status) : 1;
  // 设置预设值
  editingPrompt.presetValues = row.presetValues || '';
  showModal.value = true;
};

// 添加提示词
const handleAdd = () => {
  isAdding.value = true;
  editingPrompt.id = 0;
  editingPrompt.identifier = '';
  editingPrompt.prompt = '';
  editingPrompt.modelName = '';
  editingPrompt.status = 1; // 默认启用
  editingPrompt.presetValues = ''; // 重置预设值
  showModal.value = true;
};

// 删除提示词
const handleRemove = async (row: PromptTemplate) => {
  try {
    const response: any = await promptlibApi.deletePromptTemplate({ id: row.id });
    
    // 统一处理响应结果
    if (response && response.success) {
      message.success('删除成功');
      loadData(); // 重新加载数据
    } else {
      // 显示业务错误信息
      message.error(response.message || '删除失败');
    }
  } catch (error) {
    // 这个catch块通常不会执行，因为我们已经在API拦截器中处理了错误
    console.error('删除提示词模板失败:', error);
  }
};

// 保存提示词
const handleSave = async () => {
  if (!editingPrompt.identifier) {
    message.error('请输入提示词标识');
    return;
  }
  if (!editingPrompt.prompt) {
    message.error('请输入提示词内容');
    return;
  }
  if (!editingPrompt.modelName) {
    message.error('请输入模型名称');
    return;
  }

  submitting.value = true;
  
  try {
    let response: any;
    if (isAdding.value) {
      // 新增
      response = await promptlibApi.createPromptTemplate({
        identifier: editingPrompt.identifier,
        prompt: editingPrompt.prompt,
        modelName: editingPrompt.modelName,
        status: editingPrompt.status,
        presetValues: editingPrompt.presetValues
      });
      
      // 统一处理响应结果
      if (response && response.success) {
        message.success('添加成功');
        showModal.value = false;
        loadData(); // 重新加载数据
      } else {
        // 显示业务错误信息
        message.error(response.message || '添加失败');
      }
    } else {
      // 编辑
      response = await promptlibApi.updatePromptTemplate({
        id: editingPrompt.id,
        identifier: editingPrompt.identifier,
        prompt: editingPrompt.prompt,
        modelName: editingPrompt.modelName,
        status: editingPrompt.status,
        presetValues: editingPrompt.presetValues
      });
      
      // 统一处理响应结果
      if (response && response.success) {
        message.success('编辑成功');
        showModal.value = false;
        loadData(); // 重新加载数据
      } else {
        // 显示业务错误信息
        message.error(response.message || '编辑失败');
      }
    }
  } catch (error) {
    // 此处不应该再执行，因为我们已经修改了API拦截器
    // 但为了健壮性保留
    console.error('保存提示词模板失败:', error);
  } finally {
    submitting.value = false;
  }
};

// 页面加载时获取数据
onMounted(() => {
  loadData();
});

// 修复 columns 和 actionColumn 的类型问题
const columns = [
  // 列定义...
] as any;

const actionColumn = reactive({
  // 配置...
  render(record: any) {
    // 渲染逻辑...
  },
} as any);
</script>

<template>
  <div class="container">
    <NCard title="提示词模板库" class="mb-4">
      <template #header-extra>
        <NButton type="primary" @click="handleAdd">
          添加提示词模板
        </NButton>
      </template>
      
      <NSpin :show="loading">
        <NTable striped>
          <thead>
            <tr>
              <th style="width: 80px">ID</th>
              <th style="width: 150px">提示词标识</th>
              <th>提示词</th>
              <th style="width: 150px">模型名称</th>
              <th style="width: 150px">预设值</th>
              <th style="width: 180px">创建时间</th>
              <th style="width: 150px">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in tableData" :key="item.id">
              <td>{{ item.id }}</td>
              <td>{{ item.identifier }}</td>
              <td class="prompt-cell">
                <NTooltip trigger="hover" placement="top">
                  <template #trigger>
                    <div class="prompt-text">{{ item.prompt }}</div>
                  </template>
                  <div class="prompt-tooltip">{{ item.prompt.substring(0, 500) }}{{ item.prompt.length > 500 ? '...' : '' }}</div>
                </NTooltip>
              </td>
              <td>{{ item.modelName }}</td>
              <td class="preset-cell">
                <NTooltip v-if="item.presetValues" trigger="hover" placement="top">
                  <template #trigger>
                    <div class="prompt-text">{{ item.presetValues }}</div>
                  </template>
                  <div class="prompt-tooltip">{{ item.presetValues.substring(0, 200) }}{{ item.presetValues.length > 200 ? '...' : '' }}</div>
                </NTooltip>
                <span v-else>-</span>
              </td>
              <td>{{ item.createdAt }}</td>
              <td>
                <NSpace>
                  <NButton size="small" type="primary" @click="handleEdit(item)">编辑</NButton>
                  <NButton size="small" type="error" @click="handleRemove(item)">删除</NButton>
                </NSpace>
              </td>
            </tr>
            <tr v-if="tableData.length === 0">
              <td colspan="6" class="text-center py-4">暂无数据</td>
            </tr>
          </tbody>
        </NTable>
        
        <div class="pagination-container">
          <NPagination
            v-model:page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :item-count="pagination.total"
            :page-sizes="[10, 20, 50, 100]"
            show-size-picker
            @update:page="handlePageChange"
            @update:page-size="handlePageSizeChange"
          />
        </div>
      </NSpin>
    </NCard>

    <!-- 编辑模态框 -->
    <NModal v-model:show="showModal" :title="isAdding ? '添加提示词模板' : '编辑提示词模板'" preset="card" style="width: 800px">
      <NSpin :show="submitting">
        <NForm label-placement="left" label-width="auto" require-mark-placement="right-hanging">
          <NFormItem label="提示词标识" required>
            <NInput v-model:value="editingPrompt.identifier" placeholder="请输入提示词标识，如：xhs_title_gen" />
          </NFormItem>
          <NFormItem label="提示词内容" required>
            <NInput
              v-model:value="editingPrompt.prompt"
              type="textarea"
              placeholder="请输入提示词内容，可使用 {{content}} 作为占位符"
              :autosize="{ minRows: 8, maxRows: 16 }"
            />
          </NFormItem>
          <NFormItem label="使用的模型" required>
            <NInput 
              v-model:value="editingPrompt.modelName" 
              placeholder="请输入模型名称，如：gpt-3.5-turbo, gpt-4, claude-3-opus" 
            />
          </NFormItem>
          <NFormItem label="模板状态">
            <NSwitch v-model:value="editingPrompt.status" :checked-value="1" :unchecked-value="0">
              <template #checked>启用</template>
              <template #unchecked>禁用</template>
            </NSwitch>
          </NFormItem>
          <NFormItem label="API请求预设值">
            <NInput
              v-model:value="editingPrompt.presetValues"
              type="textarea"
              placeholder="请输入API请求预设值，如: 你是一个专业的图像生成助手"
              :autosize="{ minRows: 3, maxRows: 6 }"
            />
          </NFormItem>
        </NForm>
      </NSpin>
      <template #footer>
        <div class="flex justify-end space-x-2">
          <NButton @click="showModal = false" :disabled="submitting">取消</NButton>
          <NButton type="primary" @click="handleSave" :loading="submitting" :disabled="submitting">保存</NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.container {
  padding: 20px;
}
.mb-4 {
  margin-bottom: 16px;
}
.flex {
  display: flex;
}
.justify-end {
  justify-content: flex-end;
}
.space-x-2 > * + * {
  margin-left: 8px;
}
.text-center {
  text-align: center;
}
.py-4 {
  padding-top: 16px;
  padding-bottom: 16px;
}
.prompt-cell, .preset-cell {
  max-width: 300px;
}
.prompt-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}
.prompt-tooltip {
  max-width: 400px;
  max-height: 300px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-word;
}
.pagination-container {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style> 