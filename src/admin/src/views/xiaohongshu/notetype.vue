<route lang="yaml">
meta:
  title: 笔记类型管理
</route>

<template>
  <div>
    <PageHeader>
      <template #title>
        <div class="flex items-center gap-4">笔记类型管理</div>
      </template>
      <template #content>
        <div class="text-sm/6">
          <div>
            管理小红书笔记的分类类型，用于对笔记进行分类。
          </div>
        </div>
      </template>
      <HButton outline type="success" @click="handleAdd">
        <SvgIcon name="i-ri:file-text-line" />
        新增笔记类型
      </HButton>
    </PageHeader>
    <page-main>
      <el-form ref="formRef" :inline="true" :model="searchParams">
        <el-form-item label="类型名称">
          <el-input v-model="searchParams.name" placeholder="请输入类型名称" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="searchParams.status"
            placeholder="请选择状态"
            clearable
            style="width: 160px"
          >
            <el-option
              v-for="item in statusOptions"
              :key="String(item.value)"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
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
        title="笔记类型信息"
        width="600px"
        :close-on-click-modal="false"
      >
        <el-form
          :model="formParams"
          :rules="rules"
          ref="formRef"
          label-width="80px"
          class="py-4"
        >
          <el-form-item label="类型名称" prop="name">
            <el-input v-model="formParams.name" placeholder="请输入类型名称" />
          </el-form-item>
          <el-form-item label="描述" prop="description">
            <el-input
              v-model="formParams.description"
              type="textarea"
              placeholder="请输入类型描述"
              :rows="3"
            />
          </el-form-item>
          <el-form-item label="排序" prop="sort">
            <el-input-number v-model="formParams.sort" placeholder="请输入排序值" />
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
    </page-main>
  </div>
</template>

<script lang="ts" setup>
import { h, reactive, ref, onMounted, nextTick } from 'vue';
import { useMessage } from 'naive-ui';
import { PlusOutlined } from '@vicons/antd';
import { BasicTable, TableAction } from '@/components/Table';
import { request } from '@/utils/service';
import SvgIcon from '@/components/SvgIcon/index.vue';
import HButton from '@/layouts/ui-kit/HButton.vue';
import type { DataTableColumn } from 'naive-ui';

// 添加表格数据接口定义
interface TableResult {
  items: any[];
  total: number;
}

interface NoteType {
  id: string | number;
  name: string;
  description: string;
  sort: number;
  status: boolean;
  createTime?: string;
  [key: string]: any; // 添加索引签名使其兼容 InternalRowData
}

const actionRef = ref();
const message = useMessage();
const formRef = ref();
const showModal = ref(false);
const formBtnLoading = ref(false);

const statusOptions = [
  { label: '启用', value: true },
  { label: '禁用', value: false },
];

const searchParams = reactive({
  name: '',
  status: null as boolean | null,
});

const formParams = reactive<NoteType>({
  id: '',
  name: '',
  description: '',
  sort: 0,
  status: true,
});

const rules = {
  name: {
    required: true,
    message: '请输入类型名称',
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
    title: '类型名称',
    key: 'name',
    width: 150,
  },
  {
    title: '描述',
    key: 'description',
    width: 200,
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

function onCheckedRow(rowKeys: (string | number)[]) {
  console.log(rowKeys);
}

async function loadDataTable(params: any): Promise<TableResult> {
  try {
    const queryParams = { ...params, ...searchParams };
    const response = await request({
      url: '/xiaohongshu/notetype/list',
      method: 'get',
      params: queryParams,
    });
    
    console.log('API返回数据:', response);
    
    // 使用类型断言处理API返回的数据
    const res = response as any;
    let result: TableResult = { items: [], total: 0 };
    
    if (res && typeof res === 'object') {
      // 处理多层嵌套的数据结构
      if (res.data && res.data.items) {
        // 标准格式 {data: {items: [...], total: number}}
        result = {
          items: res.data.items || [],
          total: res.data.total || 0
        };
      } else if (res.items) {
        // 直接格式 {items: [...], total: number}
        result = {
          items: res.items || [],
          total: res.total || 0
        };
      } else if (Array.isArray(res)) {
        // 直接是数组的情况，避免使用数组赋值
        const arrayItems: any[] = [];
        for (let i = 0; i < res.length; i++) {
          arrayItems.push(res[i]);
        }
        result = {
          items: arrayItems,
          total: arrayItems.length
        };
      }
    }
    
    console.log('处理后的数据:', result);
    return result;
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
  searchParams.status = null;
  nextTick(() => {
    actionRef.value?.reload();
  });
}

function handleAdd() {

  showModal.value = true;
  // 重置表单数据
  formParams.id = '';
  formParams.name = '';
  formParams.description = '';
  formParams.sort = 0;
  formParams.status = true;
  
  // 确保在下一个渲染周期更新UI
  nextTick(() => {
    console.log('nextTick后showModal状态:', showModal.value);
  });
}

function handleEdit(record: NoteType) {
  showModal.value = true;
  formParams.id = record.id;
  formParams.name = record.name;
  formParams.description = record.description;
  formParams.sort = record.sort;
  formParams.status = record.status;
}

async function handleDelete(record: NoteType) {
  try {
    await request({
      url: `/xiaohongshu/notetype/delete/${record.id}`,
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
  console.log('confirmForm 函数被调用');
  
  try {
    formBtnLoading.value = true;
    console.log('表单数据:', formParams);
    
    // 简单验证必填字段
    if (!formParams.name) {
      message.error('请输入类型名称');
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
      ? '/xiaohongshu/notetype/update'
      : '/xiaohongshu/notetype/create';
    
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