<route lang="yaml">
meta:
  title: 笔记页面模板
</route>

<template>
  <div>
    <PageHeader>
      <template #title>
        <div class="flex items-center gap-4">笔记页面模板</div>
      </template>
      <template #content>
        <div class="text-sm/6">
          <div>
            管理小红书笔记页面模板，用于快速创建笔记内容。
          </div>
        </div>
      </template>
      <HButton outline type="success" @click="handleAdd">
        <SvgIcon name="i-ri:file-text-line" />
        新增页面模板
      </HButton>
    </PageHeader>
    <page-main>
      <el-form ref="formRef" :inline="true" :model="searchParams">
        <el-form-item label="模板名称">
          <el-input v-model="searchParams.name" placeholder="请输入模板名称" clearable />
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
        title="页面模板信息"
        width="800px"
        :close-on-click-modal="false"
      >
        <el-form
          :model="formParams"
          :rules="rules"
          ref="formRef"
          label-width="100px"
          class="py-4"
        >
          <el-form-item label="模板名称" prop="name">
            <el-input v-model="formParams.name" placeholder="请输入模板名称" />
          </el-form-item>
          <el-form-item label="模板缩略图" prop="thumbnail">
            <div class="mb-2 text-gray-500 text-sm">
              <i class="el-icon-info mr-1"></i>
              模板缩略图是模板内容渲染后的结果，用于在列表中展示。
            </div>
            <el-upload
              list-type="picture-card"
              :limit="1"
              :file-list="uploadFileList"
              @change="handleUploadChange"
            >
              <i class="el-icon-plus"></i>
            </el-upload>
          </el-form-item>
          <el-form-item label="模板内容" prop="content">
            <el-input
              v-model="formParams.content"
              type="textarea"
              placeholder="请输入HTML模板内容"
              :rows="12"
            />
          </el-form-item>
          <el-form-item label="排序" prop="sort">
            <el-input-number v-model="formParams.sort" :min="0" />
          </el-form-item>
          <el-form-item label="状态" prop="status">
            <el-switch v-model="formParams.status" />
          </el-form-item>
        </el-form>
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="closeModal">取消</el-button>
            <el-button type="primary" :loading="formBtnLoading" @click="confirmForm">确定</el-button>
          </div>
        </template>
      </el-dialog>
      
      <el-dialog
        v-model="showPreview"
        title="模板内容预览"
        width="800px"
        :close-on-click-modal="false"
      >
        <div class="code-preview">
          <pre><code>{{ previewContent }}</code></pre>
        </div>
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="showPreview = false">关闭</el-button>
          </div>
        </template>
      </el-dialog>
    </page-main>
  </div>
</template>

<script lang="ts" setup>
import { h, reactive, ref, onMounted, nextTick } from 'vue';
import { useMessage } from 'naive-ui';
import { BasicTable, TableAction } from '@/components/Table';
import { request } from '@/utils/service';
import SvgIcon from '@/components/SvgIcon/index.vue';
import HButton from '@/layouts/ui-kit/HButton.vue';

interface NoteTemplate {
  id: number;
  name: string;
  content: string;
  thumbnail: string;
  sort: number;
  status: boolean;
  createTime: string;
  updateTime: string;
}

const actionRef = ref();
const message = useMessage();
const formRef = ref();
const showModal = ref(false);
const showPreview = ref(false);
const previewContent = ref('');
const formBtnLoading = ref(false);
const uploadFileList = ref<any[]>([]);

const searchParams = reactive({
  name: '',
});

const formParams = reactive({
  id: '',
  name: '',
  content: '',
  thumbnail: '',
  sort: 0,
  status: true,
});

const rules = {
  name: {
    required: true,
    message: '请输入模板名称',
    trigger: 'blur',
  },
  content: {
    required: true,
    message: '请输入模板内容',
    trigger: 'blur',
  },
};

const columns = [
  {
    title: 'ID',
    key: 'id',
    width: 80,
  },
  {
    title: '模板名称',
    key: 'name',
    width: 150,
  },
  {
    title: '缩略图',
    key: 'thumbnail',
    width: 120,
    render(row: any) {
      return h('img', {
        src: row.thumbnail || '',
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
          label: '删除',
          onClick: handleDelete.bind(null, record),
          type: 'error',
        },
      ],
    });
  },
} as any);

onMounted(async () => {
  // 页面加载完成后的初始化操作
});

function onCheckedRow(rowKeys: (string | number)[]) {
  console.log(rowKeys);
}

async function loadDataTable(params: any) {
  try {
    const queryParams = { ...params, ...searchParams };
    const res = await request({
      url: '/xiaohongshu/notetemplate/list',
      method: 'get',
      params: queryParams,
    });
    
    // 添加类型断言
    return res as any;
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
  searchParams.name = '';
  nextTick(() => {
    actionRef.value?.reload();
  });
}

function handleAdd() {
  showModal.value = true;
  
  // 重置表单数据
  formParams.id = '';
  formParams.name = '';
  formParams.thumbnail = '';
  formParams.content = '';
  formParams.sort = 0;
  formParams.status = true;
  uploadFileList.value = [];
  
  // 确保在下一个渲染周期更新UI
  nextTick(() => {
    console.log('nextTick后showModal状态:', showModal.value);
  });
}

function handleEdit(record: NoteTemplate) {
  showModal.value = true;
  formParams.id = String(record.id);
  formParams.name = record.name;
  formParams.thumbnail = record.thumbnail;
  formParams.content = record.content;
  formParams.sort = record.sort;
  formParams.status = record.status;
  
  if (record.thumbnail) {
    uploadFileList.value = [
      {
        name: '缩略图',
        url: record.thumbnail,
      }
    ];
  } else {
    uploadFileList.value = [];
  }
}

function handlePreview(record: NoteTemplate) {
  previewContent.value = record.content;
  showPreview.value = true;
}

function handleUploadChange(file: any) {
  if (file.raw) {
    // 处理文件上传
    const fileList = file.fileList;
    if (fileList.length > 0 && fileList[0].url) {
      formParams.thumbnail = fileList[0].url;
    } else {
      formParams.thumbnail = '';
    }
  }
}

async function handleDelete(record: NoteTemplate) {
  try {
    await request({
      url: `/xiaohongshu/notetemplate/delete/${record.id}`,
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
  showModal.value = false;
}

async function confirmForm() {
  try {
    formBtnLoading.value = true;
    
    // 简单验证必填字段
    if (!formParams.name) {
      message.error('请输入模板名称');
      formBtnLoading.value = false;
      return;
    }
    
    if (!formParams.content) {
      message.error('请输入模板内容');
      formBtnLoading.value = false;
      return;
    }
    
    // 确保数据类型正确
    const submitData = {
      ...formParams,
      sort: Number(formParams.sort),
      status: Boolean(formParams.status)
    } as any;
    
    if (submitData.id === '') {
      delete submitData.id; // 创建时不需要id
    } else {
      submitData.id = Number(submitData.id); // 确保id是数字类型
    }
    
    const apiUrl = submitData.id
      ? '/xiaohongshu/notetemplate/update'
      : '/xiaohongshu/notetemplate/create';
    
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
    message.error(formParams.id ? '更新失败' : '添加失败');
  } finally {
    formBtnLoading.value = false;
  }
}
</script>

<style scoped>
.text-fields-list {
  margin-top: 8px;
  padding: 8px;
  border: 1px solid #eee;
  border-radius: 4px;
  min-height: 40px;
}

.code-preview {
  max-height: 500px;
  overflow-y: auto;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
  font-family: monospace;
}
</style> 