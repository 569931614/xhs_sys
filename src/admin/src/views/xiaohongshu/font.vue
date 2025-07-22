<route lang="yaml">
meta:
  title: 字体管理
</route>

<template>
  <div>
    <PageHeader>
      <template #title>
        <div class="flex items-center gap-4">字体管理</div>
      </template>
      <template #content>
        <div class="text-sm/6">
          <div>
            管理系统字体库，支持添加、编辑和删除字体，以及从API获取字体数据。
          </div>
        </div>
      </template>
      <HButton outline type="success" @click="openModal()">
        <SvgIcon name="i-ri:font-size-2" />
        新增字体
      </HButton>
    </PageHeader>
    
    <page-main>
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="字体名称">
          <el-input v-model="searchForm.name" placeholder="请输入字体名称" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="字体代码">
          <el-input v-model="searchForm.code" placeholder="请输入字体代码" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="字体类型">
          <el-select v-model="searchForm.type" placeholder="请选择字体类型" clearable style="width: 160px">
            <el-option
              v-for="item in typeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable style="width: 160px">
            <el-option
              v-for="item in statusOptions"
              :key="String(item.value)"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </page-main>
    
    <page-main style="width: 100%">
      <div class="mb-4 flex justify-between">
        <div>
          <el-button type="primary" @click="openModal()">新增字体</el-button>
          <el-button type="danger" :disabled="!selectedRowKeys.length" @click="handleBatchDelete">批量删除</el-button>
          <el-button type="info" @click="handleFetchFromApi">从API获取字体数据</el-button>
        </div>
        <div>
          <el-button type="primary" @click="refreshTable">刷新</el-button>
        </div>
      </div>
      
      <el-table
        v-loading="loading"
        :data="tableData"
        border
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="字体名称" width="160" show-overflow-tooltip />
        <el-table-column prop="code" label="字体代码" width="160" show-overflow-tooltip />
        <el-table-column label="预览图" width="120">
          <template #default="scope">
            <div class="thumbnail-container">
              <el-image 
                v-if="scope.row.preview" 
                :src="scope.row.preview" 
                fit="contain"
                class="font-preview-image"
                @click="handlePreviewImage(scope.row.preview)"
              ></el-image>
              <div v-else class="no-thumbnail">无</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="字体类型" width="100">
          <template #default="scope">
            <el-tag size="small">{{ scope.row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-switch
              v-model="scope.row.status"
              @change="() => handleToggleStatus(scope.row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="source" label="来源" width="100" />
        <el-table-column label="创建时间" width="160">
          <template #default="scope">
            {{ new Date(scope.row.createTime).toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column label="更新时间" width="160">
          <template #default="scope">
            {{ new Date(scope.row.updateTime).toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-button type="primary" size="small" @click="openModal(scope.row)">编辑</el-button>
            <el-button type="danger" size="small" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-container">
        <el-pagination
          v-model:currentPage="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="pagination.pageSizes"
          :total="pagination.itemCount"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
      
      <el-dialog
        v-model="showModal"
        title="字体信息"
        width="600px"
        :close-on-click-modal="false"
      >
        <el-form
          ref="formRef"
          :model="formData"
          :rules="rules"
          label-width="100px"
          class="py-4"
        >
          <el-form-item label="字体名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入字体名称" />
          </el-form-item>
          <el-form-item label="字体代码" prop="code">
            <el-input v-model="formData.code" placeholder="请输入字体代码" />
          </el-form-item>
          <el-form-item label="预览图URL" prop="preview">
            <el-input v-model="formData.preview" placeholder="请输入预览图URL" />
          </el-form-item>
          <el-form-item label="预览图" v-if="formData.preview">
            <div class="flex justify-center">
              <el-image 
                :src="formData.preview" 
                class="max-h-40 object-contain" 
                @click="handlePreviewImage(formData.preview)"
              />
            </div>
          </el-form-item>
          <el-form-item label="字体文件URL" prop="url">
            <el-input v-model="formData.url" placeholder="请输入字体文件URL" />
          </el-form-item>
          <el-form-item label="字体类型" prop="type">
            <el-select v-model="formData.type" placeholder="请选择字体类型" style="width: 100%">
              <el-option
                v-for="item in typeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="排序" prop="sort">
            <el-input-number v-model="formData.sort" placeholder="请输入排序值" />
          </el-form-item>
          <el-form-item label="状态" prop="status">
            <el-switch v-model="formData.status" />
          </el-form-item>
          <el-form-item label="备注" prop="remark">
            <el-input v-model="formData.remark" type="textarea" placeholder="请输入备注" />
          </el-form-item>
        </el-form>
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="showModal = false">取消</el-button>
            <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
          </div>
        </template>
      </el-dialog>
      
      <el-dialog
        v-model="showPreviewDialog"
        :title="previewTitle"
        width="500px"
        :close-on-click-modal="true"
        class="font-preview-dialog"
      >
        <div class="font-preview-container">
          <img :src="previewUrl" class="font-preview-large" />
        </div>
      </el-dialog>
    </page-main>
  </div>
</template>
  
<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getFontList, createFont, updateFont, deleteFont, batchDeleteFont, toggleFontStatus, fetchFontsFromApi } from '@/api/modules/font';
import SvgIcon from '@/components/SvgIcon/index.vue';
import HButton from '@/layouts/ui-kit/HButton.vue';
import type { FormInstance } from 'element-plus';
  
// 定义接口
interface FontItem {
  id: number;
  name: string;
  code: string;
  preview: string;
  url: string;
  type: string;
  status: boolean;
  sort: number;
  source: string;
  remark: string;
  createTime: string;
  updateTime: string;
}
  
interface FontResponse {
  items: FontItem[];
  total: number;
}
  
interface ApiResponse {
  message: string;
  data?: any;
}

// 状态与数据
const formRef = ref<FormInstance>();
const loading = ref(false);
const submitLoading = ref(false);
const showModal = ref(false);
const tableData = ref<FontItem[]>([]);
const selectedRowKeys = ref<number[]>([]);
const isEdit = ref(false);

// 预览图相关
const showPreviewDialog = ref(false);
const previewUrl = ref('');
const previewTitle = ref('字体预览');

// 处理预览图点击
const handlePreviewImage = (url: string) => {
  previewUrl.value = url;
  showPreviewDialog.value = true;
};
  
// 搜索表单
const searchForm = reactive({
  name: '',
  code: '',
  type: null as string | null,
  status: null as boolean | null,
  page: 1,
  pageSize: 10
});
  
// 分页配置
const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  pageSizes: [10, 20, 30, 50] as number[],
});
  
// 表单数据
interface FontFormData {
  id: number | null;
  name: string;
  code: string;
  preview: string;
  url: string;
  type: string;
  status: boolean;
  sort: number;
  source: string;
  remark: string;
}
  
const defaultFormData: FontFormData = {
  id: null,
  name: '',
  code: '',
  preview: '',
  url: '',
  type: 'ttf',
  status: true,
  sort: 0,
  source: 'manual',
  remark: ''
};
  
const formData = reactive<FontFormData>({ ...defaultFormData });
  
// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入字体名称', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入字体代码', trigger: 'blur' }
  ],
  url: [
    { required: true, message: '请输入字体文件URL', trigger: 'blur' }
  ]
};
  
// 下拉选项
const typeOptions = [
  { label: 'TTF', value: 'ttf' },
  { label: 'OTF', value: 'otf' },
  { label: 'WOFF', value: 'woff' },
  { label: 'WOFF2', value: 'woff2' }
];
  
const statusOptions = [
  { label: '启用', value: true },
  { label: '禁用', value: false }
];
  
// 方法
// 获取数据
const fetchData = async () => {
  loading.value = true;
  try {
    const params = {
      ...searchForm,
      page: pagination.page,
      pageSize: pagination.pageSize
    };
      
    const res = await getFontList(params) as unknown as any;
    if (res && res.data && res.data.items) {
      tableData.value = res.data.items;
      pagination.itemCount = res.data.total;
    } else {
      tableData.value = [];
      pagination.itemCount = 0;
    }
  } catch (error) {
    console.error('获取字体列表失败:', error);
    ElMessage.error('获取字体列表失败');
    tableData.value = [];
    pagination.itemCount = 0;
  } finally {
    loading.value = false;
  }
};
  
// 打开模态窗
const openModal = (row: FontItem | null = null) => {
  if (row) {
    isEdit.value = true;
    Object.assign(formData, row);
  } else {
    isEdit.value = false;
    Object.assign(formData, { ...defaultFormData });
  }
  showModal.value = true;
};
  
// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return;
    
  try {
    await formRef.value.validate();
    submitLoading.value = true;
      
    if (isEdit.value && formData.id !== null) {
      await updateFont(formData.id, formData);
      ElMessage.success('更新成功');
    } else {
      await createFont(formData);
      ElMessage.success('创建成功');
    }
      
    showModal.value = false;
    fetchData();
  } catch (error) {
    console.error('保存失败:', error);
    ElMessage.error('保存失败');
  } finally {
    submitLoading.value = false;
  }
};
  
// 删除字体
const handleDelete = (row: FontItem) => {
  ElMessageBox.confirm(
    `确定要删除字体 "${row.name}" 吗？`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      await deleteFont(row.id);
      ElMessage.success('删除成功');
      fetchData();
    } catch (error) {
      console.error('删除失败:', error);
      ElMessage.error('删除失败');
    }
  }).catch(() => {});
};
  
// 批量删除
const handleBatchDelete = () => {
  if (!selectedRowKeys.value.length) {
    ElMessage.warning('请选择要删除的字体');
    return;
  }
    
  ElMessageBox.confirm(
    `确定要删除选中的 ${selectedRowKeys.value.length} 个字体吗？`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      await batchDeleteFont(selectedRowKeys.value);
      ElMessage.success('批量删除成功');
      selectedRowKeys.value = [];
      fetchData();
    } catch (error) {
      console.error('批量删除失败:', error);
      ElMessage.error('批量删除失败');
    }
  }).catch(() => {});
};
  
// 切换状态
const handleToggleStatus = async (row: FontItem) => {
  try {
    await toggleFontStatus(row.id);
    ElMessage.success('状态更新成功');
    row.status = !row.status;
  } catch (error) {
    console.error('状态更新失败:', error);
    ElMessage.error('状态更新失败');
  }
};
  
// 从API获取字体数据
const handleFetchFromApi = async () => {
  try {
    loading.value = true;
    const res = await fetchFontsFromApi() as unknown as ApiResponse;
    ElMessage.success(`成功从API获取字体数据: ${res.message || '数据已更新'}`);
    fetchData();
  } catch (error) {
    console.error('从API获取字体数据失败:', error);
    ElMessage.error('从API获取字体数据失败');
  } finally {
    loading.value = false;
  }
};
  
// 搜索
const handleSearch = () => {
  pagination.page = 1;
  fetchData();
};
  
// 重置搜索
const resetSearch = () => {
  Object.assign(searchForm, {
    name: '',
    code: '',
    type: null,
    status: null
  });
  pagination.page = 1;
  fetchData();
};
  
// 刷新表格
const refreshTable = () => {
  fetchData();
};
  
// 选择行变化
const handleSelectionChange = (selection: FontItem[]) => {
  selectedRowKeys.value = selection.map(item => item.id);
};
  
// 页码变化
const handleCurrentChange = (page: number) => {
  pagination.page = page;
  fetchData();
};

// 每页条数变化
const handleSizeChange = (pageSize: number) => {
  pagination.pageSize = pageSize;
  pagination.page = 1;
  fetchData();
};
  
// 初始化
onMounted(() => {
  // 确保页面加载后立即获取数据
  fetchData();
});
</script>
  
<style scoped>
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.thumbnail-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 60px;
}

.font-preview-image {
  width: auto;
  height: 50px;
  max-width: 100px;
  object-fit: contain;
  border-radius: 4px;
  cursor: pointer;
}

.font-preview-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background-color: white;
  border-radius: 8px;
}

.font-preview-large {
  max-width: 100%;
  max-height: 400px;
  object-fit: contain;
  background-color: white;
}

.template-thumbnail {
  width: 60px;
  height: 60px;
  border-radius: 4px;
  border: 1px solid #ebeef5;
  object-fit: cover;
}

.no-thumbnail {
  width: 60px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  border-radius: 4px;
  color: #909399;
  border: 1px dashed #dcdfe6;
}

.max-h-40 {
  max-height: 10rem;
}

.mb-4 {
  margin-bottom: 1rem;
}

.py-4 {
  padding-top: 1rem;
  padding-bottom: 1rem;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style>

<style>
/* 全局样式，修改预览弹窗背景 */
.font-preview-dialog .el-dialog {
  background-color: white;
}

.font-preview-dialog .el-dialog__body {
  padding: 10px;
  background-color: white;
}

.font-preview-dialog .el-dialog__header {
  padding: 15px 20px;
  margin-right: 0;
  background-color: white;
  border-bottom: 1px solid #ebeef5;
}
</style> 