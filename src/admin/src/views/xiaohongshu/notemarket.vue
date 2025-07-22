<route lang="yaml">
meta:
  title: 笔记市场管理
</route>

<template>
  <div>
    <PageHeader>
      <template #title>
        <div class="flex items-center gap-4">笔记市场管理</div>
      </template>
      <template #content>
        <div class="text-sm/6">
          <div>
            管理小红书笔记市场内容，包括笔记的添加、编辑和删除等操作。
          </div>
        </div>
      </template>
      <HButton outline type="success" @click="handleAdd">
        <SvgIcon name="i-ri:file-text-line" />
        新增笔记
      </HButton>
    </PageHeader>
    <page-main>
      <el-form ref="formRef" :inline="true" :model="searchParams">
        <el-form-item label="笔记标题">
          <el-input v-model="searchParams.title" placeholder="请输入笔记标题" clearable />
        </el-form-item>
        <el-form-item label="笔记类型">
          <el-select
            v-model="searchParams.typeId"
            placeholder="请选择笔记类型"
            clearable
            style="width: 160px"
          >
            <el-option
              v-for="item in typeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="参数类型">
          <el-input v-model="searchParams.paramsType" placeholder="请输入参数类型" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchTable">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </page-main>
    <page-main style="width: 100%">
      <client-only>
        <BasicTable
          :columns="columns"
          :request="loadDataTable"
          :row-key="(row: any) => row.id"
          ref="actionRef"
          :actionColumn="actionColumn"
          @update:checked-row-keys="onCheckedRow"
          :scroll-x="1090"
        />
      </client-only>

      <el-dialog
        v-model="showModal"
        title="笔记信息"
        width="800px"
        :close-on-click-modal="false"
        destroy-on-close
        @close="handleDialogClose"
      >
        <el-form
          :model="formParams"
          :rules="rules"
          ref="formRef"
          label-width="80px"
          class="py-4"
        >
          <el-form-item label="笔记标题" prop="title">
            <el-input v-model="formParams.title" placeholder="请输入笔记标题（如填写笔记ID，可自动获取）" />
          </el-form-item>
          <el-form-item label="笔记类型" prop="typeId">
            <el-select
              v-model="formParams.typeId"
              placeholder="请选择笔记类型"
              style="width: 100%"
            >
              <el-option
                v-for="item in typeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="页面模板">
            <div class="flex items-center mb-3">
              <el-select
                v-model="tempSelectedTemplateId"
                placeholder="请选择页面模板"
                style="width: 100%; min-width: 300px;"
                clearable
              >
                <el-option
                  v-for="item in htmlTemplateOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
              <el-button 
                type="primary" 
                class="ml-2" 
                @click="addTemplate" 
                :disabled="!tempSelectedTemplateId || selectedTemplates.length >= 9"
              >
                添加
              </el-button>
            </div>
            
            <div class="template-container">
              <!-- 调试输出 -->
              <pre v-if="false">{{ JSON.stringify(selectedTemplates, null, 2) }}</pre>
              
              <div v-if="selectedTemplates.length === 0" class="empty-template-hint">
                请选择并添加HTML模板
              </div>
              
              <div v-else>
                <div class="template-list-view">
                  <el-table 
                    :data="selectedTemplates" 
                    border 
                    style="width: 100%" 
                    :header-cell-style="{background:'#f5f7fa', color: '#606266'}"
                    class="template-table"
                  >
                    <el-table-column width="70" align="center">
                      <template #header>
                        <span>序号</span>
                      </template>
                      <template #default="{ $index }">
                        <div class="index-cell">
                          <el-tag v-if="$index === 0" type="danger" effect="dark" class="main-tag">主图</el-tag>
                          <span v-else class="index-number">{{ $index + 1 }}</span>
                        </div>
                      </template>
                    </el-table-column>
                    
                    <el-table-column label="模板名称" prop="name" min-width="150">
                      <template #default="{ row }">
                        <div class="template-name">
                          {{ row.name }}
                        </div>
                      </template>
                    </el-table-column>
                    
                    <el-table-column label="重复" width="100" align="center">
                      <template #default="{ row }">
                        <el-switch 
                          v-model="row.isRepeatable" 
                          active-color="#409eff"
                          inactive-color="#dcdfe6"
                        />
                      </template>
                    </el-table-column>
                    
                    <el-table-column label="操作" width="150" align="center">
                      <template #default="{ row, $index }">
                        <div class="template-actions-cell">
                          <el-button-group>
                            <el-tooltip content="预览" placement="top" :hide-after="300">
                              <el-button 
                                type="primary" 
                                circle
                                size="small" 
                                @click="previewSelectedTemplate(row)"
                                :icon="Search"
                              ></el-button>
                            </el-tooltip>
                            
                            <el-tooltip content="上移" placement="top" :hide-after="300">
                              <el-button 
                                type="default" 
                                circle
                                size="small" 
                                :disabled="$index === 0"
                                @click="moveTemplate($index, $index - 1)"
                                :icon="ArrowUp"
                              ></el-button>
                            </el-tooltip>
                            
                            <el-tooltip content="下移" placement="top" :hide-after="300">
                              <el-button 
                                type="default" 
                                circle
                                size="small" 
                                :disabled="$index === selectedTemplates.length - 1"
                                @click="moveTemplate($index, $index + 1)"
                                :icon="ArrowDown"
                              ></el-button>
                            </el-tooltip>
                            
                            <el-tooltip content="删除" placement="top" :hide-after="300">
                              <el-button 
                                type="danger" 
                                circle
                                size="small" 
                                @click="removeTemplate($index)"
                                :icon="Delete"
                              ></el-button>
                            </el-tooltip>
                          </el-button-group>
                        </div>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
                
                <div class="template-counter">
                  已选择 {{ selectedTemplates.length }}/9 个模板
                </div>
              </div>
            </div>
          </el-form-item>
          <el-form-item label="封面图" prop="coverImage">
            <el-upload
              list-type="picture-card"
              :limit="1"
              :file-list="uploadFileList"
              @change="handleUploadChange"
              @remove="handleUploadRemove"
            >
              <i class="el-icon-plus"></i>
            </el-upload>
            <div class="text-xs text-gray-500 mt-1">如填写笔记ID，封面图可自动获取</div>
          </el-form-item>
          <el-form-item label="笔记内容" prop="content">
            <el-input
              v-model="formParams.content"
              type="textarea"
              placeholder="请输入笔记内容（如填写笔记ID，可自动获取）"
              :rows="5"
            />
          </el-form-item>
          <el-form-item label="笔记ID">
            <el-input v-model="formParams.noteId" placeholder="请输入笔记ID（填写后可自动获取标题、内容和封面图）" />
          </el-form-item>
          <el-form-item label="排序" prop="sort">
            <el-input-number v-model="formParams.sort" placeholder="请输入排序值" />
          </el-form-item>
          <el-form-item label="状态" prop="status">
            <el-switch v-model="formParams.status" />
          </el-form-item>
          <el-form-item label="工作流" prop="workflowId">
            <el-select
              v-model="formParams.workflowId"
              placeholder="请选择工作流"
              style="width: 100%"
            >
              <el-option
                v-for="item in workflowOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="用户类型">
            <el-select
              v-model="formParams.userTypeIds"
              multiple
              collapse-tags
              collapse-tags-tooltip
              placeholder="所有用户可见"
              style="width: 100%"
              clearable
            >
              <el-option
                v-for="item in userTypeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
            <div class="text-xs text-gray-500 mt-1">未选择则所有用户可见</div>
          </el-form-item>
          <el-form-item label="参数类型" prop="paramsType">
            <el-input
              v-model="formParams.paramsType"
              placeholder="请输入参数类型（选填）"
              clearable
            />
          </el-form-item>
        </el-form>
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="closeModal">取消</el-button>
            <el-button type="primary" :loading="formBtnLoading" @click="confirmForm">确定</el-button>
          </div>
        </template>
      </el-dialog>
      
      <!-- 模板预览弹窗 -->
      <el-dialog
        v-model="showTemplatePreview"
        :title="`模板预览: ${previewTemplateName}`"
        width="800px"
        :close-on-click-modal="false"
        destroy-on-close
        @close="handleTemplatePreviewClose"
      >
        <div class="code-preview">
          <pre><code>{{ templatePreviewContent }}</code></pre>
        </div>
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="showTemplatePreview = false">关闭</el-button>
          </div>
        </template>
      </el-dialog>
    </page-main>
  </div>
</template>

<script lang="ts" setup>
import { h, reactive, ref, onMounted, nextTick, computed } from 'vue';
import { useMessage } from 'naive-ui';
import { PlusOutlined } from '@vicons/antd';
import { BasicTable, TableAction } from '@/components/Table';
import { request } from '@/utils/service';
import SvgIcon from '@/components/SvgIcon/index.vue';
import HButton from '@/layouts/ui-kit/HButton.vue';
import { Search, Delete, ArrowUp, ArrowDown } from '@element-plus/icons-vue';
import type { DataTableColumn } from 'naive-ui';

interface NoteType {
  id: string | number;
  name: string;
}

interface HtmlTemplate {
  id: number;
  name: string;
  htmlCode: string;
  status: number;
  isRepeatable?: boolean;
  uniqueId?: string;
  userTypeIds?: number[];
}

interface Note {
  id: string | number;
  title: string;
  typeId: string | number | null;
  typeName?: string;
  coverImage: string;
  content: string;
  sort: number;
  status: boolean;
  createTime?: string;
  noteId?: string;
  workflowId?: string | number | null;
  botId?: string | number | null;
  paramsType?: string | null;
  htmlTemplates?: HtmlTemplate[];
  userTypeIds?: number[];
  [key: string]: any; // 添加索引签名使其兼容 InternalRowData
}

interface UploadFileInfo {
  id: string;
  name: string;
  status: string;
  url: string;
}

interface TableData {
  items: any[];
  total: number;
}

const actionRef = ref();
const message = useMessage();
const formRef = ref();
const showModal = ref(false);
const formBtnLoading = ref(false);
const typeOptions = ref<{ label: string; value: string | number }[]>([]);
const htmlTemplateOptions = ref<{ label: string; value: number }[]>([]);
const workflowOptions = ref<{ label: string; value: number | string }[]>([]);
const userTypeOptions = ref<{ label: string; value: number }[]>([]);
const tempSelectedTemplateId = ref<number | null>(null);
const selectedTemplates = ref<HtmlTemplate[]>([]);
const uploadFileList = ref<any[]>([]);
const showTemplatePreview = ref(false);
const templatePreviewContent = ref('');
const previewTemplateName = ref('');

const searchParams = reactive({
  title: '',
  typeId: null as string | number | null,
  paramsType: '',
});

const formParams = reactive<Note>({
  id: '',
  title: '',
  typeId: null,
  coverImage: '',
  content: '',
  sort: 0,
  status: true,
  noteId: '',
  workflowId: null,
  botId: null,
  paramsType: null,
  userTypeIds: [],
});

const rules = {
  title: [{ required: false, message: '请输入笔记标题', trigger: 'blur' }],
  typeId: [{ required: false, message: '请选择笔记类型', trigger: 'change' }],
  content: [{ required: false, message: '请输入笔记内容', trigger: 'blur' }],
  workflowId: [{ required: false, message: '请选择工作流', trigger: 'change' }]
};

// 添加工作流名称映射函数
function getWorkflowName(workflowId: string | number | null): string {
  if (!workflowId) return '未设置';
  
  // 从工作流选项中查找对应的名称
  const workflow = workflowOptions.value.find(item => item.value === workflowId);
  return workflow ? workflow.label : `工作流 ${workflowId}`;
}

const columns = [
  {
    title: 'ID',
    key: 'id',
    width: 80,
  },
  {
    title: '笔记标题',
    key: 'title',
    width: 150,
  },
  {
    title: '笔记类型',
    key: 'typeName',
    width: 120,
  },
  {
    title: '工作流',
    key: 'workflowName',
    width: 150,
    render(row: any) {
      // 优先使用botId，其次使用workflowId
      const workflowId = row.botId || row.workflowId;
      return h('span', {}, getWorkflowName(workflowId));
    },
  },
  {
    title: '参数类型',
    key: 'paramsType',
    width: 120,
  },
  {
    title: '封面图',
    key: 'coverImage',
    width: 120,
    render(row: any) {
      return h('img', {
        src: row.coverImage,
        style: {
          width: '50px',
          height: '50px',
          objectFit: 'cover',
        },
      });
    },
  },
  {
    title: '排序',
    key: 'sort',
    width: 100,
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render(row: any) {
      return h(
        'span',
        {
          style: {
            color: row.status ? 'green' : 'red',
          },
        },
        row.status ? '启用' : '禁用'
      );
    },
  },
  {
    title: '创建时间',
    key: 'createTime',
    width: 180,
  },
] as any;

const actionColumn = reactive({
  width: 260,
  title: '操作',
  key: 'action',
  fixed: 'right',
  render(record: any) {
    return h(TableAction, {
      style: 'button',
      actions: [
        {
          label: '编辑',
          onClick: handleEdit.bind(null, record),
          type: 'primary',
        },
        {
          label: '复制',
          onClick: handleDuplicate.bind(null, record),
          type: 'info',
        },
        {
          label: '删除',
          onClick: handleDelete.bind(null, record),
          type: 'error',
        },
      ],
    });
  },
} as any);

onMounted(async () => {
  console.log('组件挂载，开始加载数据');
  try {
    // 并行加载所有数据
    await Promise.all([
      loadNoteTypes(),
      loadHtmlTemplates(),
      loadWorkflows(),
      loadUserTypes()
    ]);
    console.log('数据加载完成，HTML模板选项:', htmlTemplateOptions.value);
    console.log('工作流选项:', workflowOptions.value);
    console.log('用户类型选项:', userTypeOptions.value);
    
    // 设置定时刷新工作流数据，每5分钟刷新一次
    const refreshInterval = 5 * 60 * 1000; // 5分钟
    setInterval(() => {
      console.log('定时刷新工作流数据');
      loadWorkflows();
    }, refreshInterval);
  } catch (error) {
    console.error('数据加载失败:', error);
    message.error('部分数据加载失败，请刷新页面重试');
  }
});

async function loadNoteTypes() {
  try {
    const res = await request({
      url: '/xiaohongshu/notetype/list',
      method: 'get',
      params: { pageSize: 999 },
    });
    
    if (res && (res as any).items) {
      typeOptions.value = (res as any).items.map((item: any) => ({
        label: item.name,
        value: item.id,
      }));
    }
  } catch (error) {
    console.error('加载笔记类型失败:', error);
    message.error('加载笔记类型失败');
  }
}

async function loadHtmlTemplates() {
  try {
    const response = await request({
      url: '/htmllib/list',
      method: 'get',
      params: { status: 1 }
    });
    
    console.log('HTML模板API返回数据:', response);
    
    // 正确处理API返回数据
    let templates = [];
    const res = response as any; // 使用any类型避免类型错误
    
    // 处理多层嵌套的数据结构
    if (res && res.data && Array.isArray(res.data.items)) {
      // 最常见的情况：{ data: { items: [...] } }
      templates = res.data.items;
    } else if (res && Array.isArray(res.items)) {
      // 直接包含items的情况：{ items: [...] }
      templates = res.items;
    } else if (res && Array.isArray(res.data)) {
      // 直接包含数据的情况：{ data: [...] }
      templates = res.data;
    } else if (Array.isArray(res)) {
      // 直接是数组的情况：[...]
      templates = res;
    }
    
    console.log('提取的模板数据:', templates);
    
    if (templates.length > 0) {
      htmlTemplateOptions.value = templates.map((item: any) => ({
        label: item.name,
        value: item.id,
      }));
      console.log('生成的模板选项:', htmlTemplateOptions.value);
    } else {
      // 添加一些测试数据，以防API未返回数据
      htmlTemplateOptions.value = [
        { label: '商品详情模板', value: 1 },
        { label: '图文介绍模板', value: 2 },
        { label: '产品展示模板', value: 3 }
      ];
      console.log('未找到HTML模板数据，使用默认选项');
    }
  } catch (error) {
    console.error('加载HTML模板失败:', error);
    message.error('加载HTML模板失败，使用默认选项');
    
    // 添加默认选项，确保用户可以继续操作
    htmlTemplateOptions.value = [
      { label: '商品详情模板', value: 1 },
      { label: '图文介绍模板', value: 2 },
      { label: '产品展示模板', value: 3 }
    ];
  }
}

async function loadWorkflows() {
  try {
    console.log('开始加载工作流列表...');
    const res = await request({
      url: '/coze',
      method: 'get',
      params: {
        page: 1,
        size: 990
      }
    });
    
    console.log('Coze API返回数据:', res);
    
    // 处理API响应，从Coze配置中提取工作流信息
    let cozeConfigs = [];
    
    if (res && res.data && Array.isArray(res.data.items)) {
      // 标准格式 {data: {items: [...]}}
      cozeConfigs = res.data.items;
      console.log('从标准格式中提取Coze配置:', cozeConfigs);
    } else if (res && typeof res === 'object' && 'items' in res && Array.isArray(res.items)) {
      // 直接格式 {items: [...]}
      cozeConfigs = res.items;
      console.log('从直接格式中提取Coze配置:', cozeConfigs);
    } else {
      console.warn('Coze API返回格式异常，无法解析:', res);
      message.warning('Coze数据格式异常，使用默认选项');
      cozeConfigs = [];
    }
    
    // 统一处理工作流数据
    if (cozeConfigs && cozeConfigs.length > 0) {
      // 从Coze配置中提取工作流信息，优先使用botId，其次使用workflowId
      workflowOptions.value = cozeConfigs.map((item: any) => {
        // 确定要使用的ID值
        const idValue = item.botId || item.workflowId || item.id;
        // 确定要显示的名称
        const displayName = item.name || `Coze Bot ${idValue}`;
        
        return {
          label: displayName,
          value: idValue
        };
      });
      console.log('工作流选项加载成功:', workflowOptions.value);
    } else {
      // 如果没有工作流，添加默认选项
      workflowOptions.value = [
        { label: '小红书笔记生成器', value: '7483341266928468008' },
        { label: '图文内容创作', value: '7477025304549294118' },
        { label: '产品介绍生成', value: '7499876543219876543' }
      ];
      console.log('未找到工作流，使用默认工作流选项');
    }
  } catch (error) {
    console.error('加载工作流失败:', error);
    message.error('加载工作流失败，使用默认选项');
    // 添加默认工作流，确保用户可以继续操作
    workflowOptions.value = [
      { label: '小红书笔记生成器', value: '7483341266928468008' },
      { label: '图文内容创作', value: '7477025304549294118' },
      { label: '产品介绍生成', value: '7499876543219876543' }
    ];
  }
}

async function loadUserTypes() {
  try {
    const response = await request({
      url: '/system/user-type/list',
      method: 'get',
    });
    
    // 使用类型断言
    const res = response as any;
    
    if (res && typeof res === 'object') {
      let items = [];
      
      // 处理多层嵌套的数据结构
      if (res.data && Array.isArray(res.data.items)) {
        items = res.data.items;
      } else if (res.data && Array.isArray(res.data)) {
        items = res.data;
      } else if (Array.isArray(res.items)) {
        items = res.items;
      } else if (Array.isArray(res)) {
        items = res;
      }
      
      if (items.length > 0) {
        userTypeOptions.value = items.map((item: any) => ({
          label: item.name,
          value: item.id,
        }));
      } else {
        // 添加默认选项，确保用户可以继续操作
        userTypeOptions.value = [
          { label: '普通用户', value: 1 },
          { label: 'VIP用户', value: 2 },
          { label: '企业用户', value: 3 }
        ];
      }
    } else {
      // 添加默认选项，确保用户可以继续操作
      userTypeOptions.value = [
        { label: '普通用户', value: 1 },
        { label: 'VIP用户', value: 2 },
        { label: '企业用户', value: 3 }
      ];
    }
  } catch (error) {
    console.error('加载用户类型失败:', error);
    message.error('加载用户类型失败，使用默认选项');
    
    // 添加默认选项，确保用户可以继续操作
    userTypeOptions.value = [
      { label: '普通用户', value: 1 },
      { label: 'VIP用户', value: 2 },
      { label: '企业用户', value: 3 }
    ];
  }
}

function onCheckedRow(rowKeys: (string | number)[]) {
  console.log(rowKeys);
}

async function loadDataTable(params: any): Promise<TableData> {
  try {
    const queryParams = { ...params, ...searchParams };
    const response = await request({
      url: '/xiaohongshu/note/list',
      method: 'get',
      params: queryParams,
    });
    
    // 确保返回的数据格式符合BasicTable组件要求
    if (response && typeof response === 'object') {
      if ('items' in response && 'total' in response) {
        // 已经是正确格式
        return {
          items: Array.isArray(response.items) ? response.items : [],
          total: Number(response.total) || 0
        };
      } else if (response.data && typeof response.data === 'object') {
        // 从response.data中提取
        if ('items' in response.data && 'total' in response.data) {
          return {
            items: Array.isArray(response.data.items) ? response.data.items : [],
            total: Number(response.data.total) || 0
          };
        }
      }
    }
    
    // 默认返回空数据
    console.warn('API返回格式不符合要求，返回空数据');
    return { items: [], total: 0 };
  } catch (error) {
    console.error('加载数据失败:', error);
    return { items: [], total: 0 };
  }
}

function searchTable() {
  nextTick(() => {
    actionRef.value?.reload();
  });
}

function resetSearch() {
  searchParams.title = '';
  searchParams.typeId = null;
  searchParams.paramsType = '';
  nextTick(() => {
    actionRef.value?.reload();
  });
}

// 修改计算属性，允许重复添加模板
const availableTemplateOptions = computed(() => {
  return htmlTemplateOptions.value;
});

// 修改添加模板函数
async function addTemplate() {
  if (!tempSelectedTemplateId.value) {
    message.warning('请先选择HTML模板');
    return;
  }
  
  if (selectedTemplates.value.length >= 9) {
    message.warning('最多只能添加9个模板');
    return;
  }
  
  try {
    console.log('正在获取HTML模板详情，ID:', tempSelectedTemplateId.value);
    const response = await request({
      url: `/htmllib/${tempSelectedTemplateId.value}`,
      method: 'get',
    });
    
    console.log('获取到的HTML模板详情:', response);
    
    // 正确处理API返回数据
    let templateData = null;
    const res = response as any; // 使用any类型避免类型错误
    
    if (res && typeof res === 'object') {
      // 处理多层嵌套的数据结构
      if (res.data) {
        templateData = res.data;
      } else {
        templateData = res;
      }
    }
    
    console.log('提取的模板详情数据:', templateData);
    
    if (templateData) {
      // 添加isRepeatable属性，默认为false，以及userTypeIds属性，默认为空数组
      const template = {
        ...templateData,
        isRepeatable: false,
        userTypeIds: [], // 默认对所有用户可见
        // 生成唯一ID，用于区分重复添加的同一模板
        uniqueId: Date.now() + Math.random().toString(36).substring(2, 9)
      };
      
      selectedTemplates.value.push(template);
      console.log('添加模板后的列表:', selectedTemplates.value);
      console.log('列表长度:', selectedTemplates.value.length);
      tempSelectedTemplateId.value = null;
      
      // 强制更新视图
      nextTick(() => {
        console.log('视图更新后的模板列表长度:', selectedTemplates.value.length);
      });
    }
  } catch (error) {
    console.error('获取HTML模板详情失败:', error);
    message.error('获取HTML模板详情失败');
  }
}

// 从已选择列表中移除模板
function removeTemplate(index: number) {
  selectedTemplates.value.splice(index, 1);
}

// 预览已选择的模板
function previewSelectedTemplate(template: HtmlTemplate) {
  templatePreviewContent.value = template.htmlCode || '';
  previewTemplateName.value = template.name;
  showTemplatePreview.value = true;
}

function handleAdd() {
  // 先清空所有数据
  formParams.id = '';
  formParams.title = '';
  formParams.typeId = null;
  formParams.coverImage = '';
  formParams.content = '';
  formParams.sort = 0;
  formParams.status = true;
  formParams.noteId = '';
  formParams.workflowId = null;
  formParams.botId = null;
  formParams.paramsType = null;
  formParams.userTypeIds = [];
  
  // 清空文件列表和模板
  uploadFileList.value = [];
  tempSelectedTemplateId.value = null;
  selectedTemplates.value = [];
  
  // 然后再显示弹窗
  showModal.value = true;
  
  // 确保表单验证状态重置
  nextTick(() => {
    if (formRef.value) {
      formRef.value.resetFields();
    }
    console.log('表单重置完成，当前workflowId:', formParams.workflowId);
  });
}

function handleEdit(record: Note) {
  // 先清空所有数据，避免显示上一次的值
  formParams.id = '';
  formParams.title = '';
  formParams.typeId = null;
  formParams.coverImage = '';
  formParams.content = '';
  formParams.sort = 0;
  formParams.status = true;
  formParams.noteId = '';
  formParams.workflowId = null;
  formParams.botId = null;
  formParams.paramsType = null;
  formParams.userTypeIds = [];
  uploadFileList.value = [];
  tempSelectedTemplateId.value = null;
  selectedTemplates.value = [];
  
  // 然后再显示弹窗
  showModal.value = true;
  
  // 最后填充当前记录数据
  formParams.id = record.id;
  formParams.title = record.title;
  formParams.typeId = record.typeId;
  formParams.coverImage = record.coverImage;
  formParams.content = record.content;
  formParams.sort = record.sort;
  formParams.status = record.status;
  formParams.noteId = record.noteId || '';
  // 兼容处理，优先使用botId，其次使用workflowId
  formParams.workflowId = record.botId || record.workflowId;
  formParams.botId = record.botId || null;
  formParams.paramsType = record.paramsType || null;
  formParams.userTypeIds = record.userTypeIds || [];
  
  console.log('编辑笔记，工作流ID:', formParams.workflowId, '原始数据:', record);
  
  if (record.coverImage) {
    uploadFileList.value = [
      {
        name: '封面图',
        url: record.coverImage,
      }
    ];
  } else {
    uploadFileList.value = [];
  }
  
  // 加载关联的HTML模板
  loadNoteHtmlTemplates(record.id);
}

// 加载笔记关联的HTML模板
async function loadNoteHtmlTemplates(noteId: string | number) {
  try {
    const response = await request({
      url: `/xiaohongshu/note/${noteId}`,
      method: 'get',
    });
    
    console.log('获取到的笔记详情:', response);
    
    // 正确处理API返回数据
    let htmlTemplates = [];
    const res = response as any; // 使用any类型避免类型错误
    
    if (res && typeof res === 'object') {
      // 处理多层嵌套的数据结构
      if (res.data && res.data.htmlTemplates) {
        htmlTemplates = res.data.htmlTemplates;
      } else if (res.htmlTemplates) {
        htmlTemplates = res.htmlTemplates;
      } else if (res.data) {
        htmlTemplates = res.data.htmlTemplates || [];
      }
    }
    
    console.log('提取的HTML模板关联数据:', htmlTemplates);
    
    if (Array.isArray(htmlTemplates) && htmlTemplates.length > 0) {
      // 确保每个模板都有isRepeatable属性和userTypeIds属性
      selectedTemplates.value = htmlTemplates.map((template: any) => ({
        ...template,
        isRepeatable: template.isRepeatable || false,
        userTypeIds: template.userTypeIds || [] // 确保有userTypeIds字段
      }));
    } else {
      selectedTemplates.value = [];
    }
  } catch (error) {
    console.error('加载笔记关联HTML模板失败:', error);
    selectedTemplates.value = [];
    // 不显示错误提示，避免影响用户体验
  }
}

function handleUploadChange(file: any) {
  if (file.raw) {
    // 处理文件上传
    const fileList = file.fileList;
    if (fileList.length > 0 && fileList[0].url) {
      formParams.coverImage = fileList[0].url;
    } else {
      formParams.coverImage = '';
    }
  }
}

// 添加图片删除处理函数
function handleUploadRemove() {
  // 清空封面图URL
  formParams.coverImage = '';
  uploadFileList.value = [];
  console.log('封面图已删除，当前值:', formParams.coverImage);
}

async function handleDelete(record: Note) {
  try {
    await request({
      url: `/xiaohongshu/note/delete/${record.id}`,
      method: 'delete',
    });
    message.success('删除成功');
    nextTick(() => {
      actionRef.value?.reload();
    });
  } catch (error) {
    message.error('删除失败');
  }
}

function closeModal() {
  // 直接关闭弹窗，@close事件会触发handleDialogClose
  showModal.value = false;
}

// 处理复制笔记
function handleDuplicate(record: Note) {
  // 先清空所有数据，避免显示上一次的值
  formParams.id = '';
  formParams.title = '';
  formParams.typeId = null;
  formParams.coverImage = '';
  formParams.content = '';
  formParams.sort = 0;
  formParams.status = true;
  formParams.noteId = '';
  formParams.workflowId = null;
  formParams.botId = null;
  formParams.paramsType = null;
  formParams.userTypeIds = [];
  uploadFileList.value = [];
  tempSelectedTemplateId.value = null;
  selectedTemplates.value = [];
  
  // 然后再显示弹窗
  showModal.value = true;
  
  // 复制记录数据，但清空ID（创建新记录）
  formParams.title = `${record.title} (复制)`;
  formParams.typeId = record.typeId;
  formParams.coverImage = record.coverImage;
  formParams.content = record.content;
  formParams.sort = record.sort;
  formParams.status = record.status;
  formParams.noteId = record.noteId || '';
  // 优先使用botId，其次使用workflowId
  formParams.workflowId = record.botId || record.workflowId;
  formParams.botId = record.botId || null;
  formParams.paramsType = record.paramsType || null;
  formParams.userTypeIds = record.userTypeIds || [];
  
  console.log('复制笔记，工作流ID:', formParams.workflowId, '原始数据:', record);
  
  // 如果有封面图，设置上传文件列表
  if (record.coverImage) {
    uploadFileList.value = [
      {
        name: '封面图',
        url: record.coverImage,
      }
    ];
  } else {
    uploadFileList.value = [];
  }
  
  // 加载关联的HTML模板
  loadNoteHtmlTemplates(record.id);
}

// 修改确认表单函数，确保在提交前检查封面图是否为空
async function confirmForm() {
  try {
    formBtnLoading.value = true;
    
    // 使用表单验证
    if (!formRef.value) {
      message.error('表单引用不存在');
      formBtnLoading.value = false;
      return;
    }
    
    // 执行表单验证
    await formRef.value.validate();
    
    // 确保数据类型正确
    const submitData = {
      ...formParams,
      sort: Number(formParams.sort),
      status: Boolean(formParams.status),
      typeId: Number(formParams.typeId),
      // 使用botId字段提交，与后端保持一致
      botId: formParams.workflowId,
      userTypeIds: formParams.userTypeIds || [],
      htmlTemplates: selectedTemplates.value.map(t => ({
        id: t.id,
        isRepeatable: t.isRepeatable || false
      }))
    } as any;
    
    // 检查封面图是否已被删除
    if (uploadFileList.value.length === 0) {
      submitData.coverImage = '';
    }
    
    // 处理noteId字段 - 作为字符串处理
    if (submitData.noteId && submitData.noteId.trim() !== '') {
      // 保留字符串类型，不做转换
      submitData.noteId = submitData.noteId.trim();
    } else {
      // 如果为空，则从提交数据中删除该字段
      delete submitData.noteId;
    }
    
    if (submitData.id === '') {
      delete submitData.id; // 创建时不需要id
    } else {
      submitData.id = Number(submitData.id); // 确保id是数字类型
    }
    
    // 从提交数据中删除workflowId字段，避免重复
    delete submitData.workflowId;
    
    const apiUrl = submitData.id
      ? '/xiaohongshu/note/update'
      : '/xiaohongshu/note/create';
    
    console.log('提交的数据:', submitData);
    
    const res = await request({
      url: apiUrl,
      method: 'post',
      data: submitData,
    });
    
    message.success(submitData.id ? '更新成功' : '添加成功');
    showModal.value = false;
    
    // 刷新表格数据
    nextTick(() => {
      actionRef.value?.reload();
    });
  } catch (error: any) {
    console.error('保存失败:', error);
    if (error.message) {
      message.error(error.message);
    } else {
      message.error(formParams.id ? '更新失败' : '添加失败');
    }
  } finally {
    formBtnLoading.value = false;
  }
}

// 添加移动模板的方法
function moveTemplate(fromIndex: number, toIndex: number) {
  if (toIndex < 0 || toIndex >= selectedTemplates.value.length) {
    return;
  }
  
  // 获取要移动的元素
  const templateToMove = selectedTemplates.value[fromIndex];
  
  // 从数组中移除该元素
  selectedTemplates.value.splice(fromIndex, 1);
  
  // 在新位置插入该元素
  selectedTemplates.value.splice(toIndex, 0, templateToMove);
  
  console.log(`模板从位置 ${fromIndex} 移动到位置 ${toIndex}`);
}

function handleDialogClose(done?: () => void) {
  console.log('关闭弹窗，清空所有数据');
  
  // 关闭弹窗时清空所有数据
  formParams.id = '';
  formParams.title = '';
  formParams.typeId = null;
  formParams.coverImage = '';
  formParams.content = '';
  formParams.sort = 0;
  formParams.status = true;
  formParams.noteId = '';
  formParams.workflowId = null;
  formParams.botId = null;
  formParams.paramsType = null;
  formParams.userTypeIds = [];
  
  // 清空文件列表和模板
  uploadFileList.value = [];
  tempSelectedTemplateId.value = null;
  selectedTemplates.value = [];
  
  // 立即重置表单验证状态
  if (formRef.value) {
    formRef.value.resetFields();
  }
  
  // 直接关闭弹窗
  showModal.value = false;
  
  // 如果有done回调，执行它
  if (done) {
    done();
  }
}

// 添加模板预览关闭处理函数
function handleTemplatePreviewClose() {
  templatePreviewContent.value = '';
  previewTemplateName.value = '';
  showTemplatePreview.value = false;
}
</script>

<style scoped>
.code-preview {
  max-height: 500px;
  overflow-y: auto;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
  font-family: monospace;
}

.template-container {
  margin-top: 10px;
  width: 100%;
}

.template-list-view {
  margin-bottom: 15px;
}

.template-table {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.template-actions-cell {
  display: flex;
  justify-content: center;
  align-items: center;
}

.move-buttons {
  display: flex;
  gap: 3px;
}

.no-thumbnail {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  border-radius: 4px;
  color: #909399;
  border: 1px dashed #dcdfe6;
}

.thumbnail-icon {
  font-size: 24px;
  color: #909399;
}

.template-thumbnail {
  width: 60px;
  height: 60px;
  border-radius: 4px;
  border: 1px solid #ebeef5;
  object-fit: cover;
}

.thumbnail-container {
  padding: 5px;
  display: flex;
  justify-content: center;
}

.template-name {
  font-weight: 500;
  padding: 5px 0;
  color: #303133;
}

.index-cell {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.main-tag {
  font-size: 12px;
  padding: 2px 6px;
}

.index-number {
  font-size: 14px;
  font-weight: 500;
  color: #606266;
}

.template-counter {
  margin-top: 10px;
  text-align: right;
  color: #606266;
  font-size: 14px;
  font-weight: 500;
}

.empty-template-hint {
  width: 100%;
  padding: 20px;
  text-align: center;
  color: #909399;
  font-size: 14px;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
  background-color: #f8f8f8;
}
</style> 