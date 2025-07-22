<route lang="yaml">
meta:
  title: Coze 工作流管理
</route>

<script lang="ts" setup>
import apiCoze from '@/api/modules/coze';
import { ElMessage, ElMessageBox } from 'element-plus';
import { onMounted, reactive, ref, watch } from 'vue';

interface CozeItem {
  id: number;
  botId: string;
  name: string;
  publicKey: string;
  secretKey: string;
  clientId: string;
  spaceId: string;
  status: number;
  createdAt: string;
}

const tableData = ref<CozeItem[]>([]);
const total = ref(0);

// 表单验证规则
const rules = {
  botId: [{ required: true, message: '请输入Bot ID', trigger: 'blur' }],
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  publicKey: [{ required: true, message: '请输入公钥', trigger: 'blur' }],
  secretKey: [{ required: true, message: '请输入私钥', trigger: 'blur' }],
  clientId: [{ required: true, message: '请输入客户端ID', trigger: 'blur' }],
  spaceId: [{ required: true, message: '请输入空间ID', trigger: 'blur' }],
};

// 分页信息
const paging = reactive({
  page: 1,
  size: 990,
});

// 弹窗显示控制
const dialogVisible = ref(false);
const dialogTitle = ref('添加Coze配置');

// 监听对话框状态变化
watch(dialogVisible, (newVal) => {
  if (!newVal) {
    // 当对话框关闭时，重置表单
    resetForm();
  }
});

// 表单数据
const form = reactive({
  id: undefined as number | undefined,
  botId: '',
  name: '',
  publicKey: '',
  secretKey: '',
  clientId: '',
  spaceId: '',
  status: 1,
});

// 表单引用
const formRef = ref();

// 获取列表数据
const getList = async () => {
  try {
    const res = await apiCoze.getCozeList(paging);
    if (res && res.data) {
      tableData.value = res.data.items || [];
      total.value = res.data.total || 0;
    }
  } catch (error) {
    console.error('获取Coze列表失败', error);
    ElMessage.error('获取Coze列表失败');
  }
};

// 打开添加弹窗
const handleAdd = () => {
  dialogTitle.value = '添加Coze配置';
  resetForm();
  dialogVisible.value = true;
};

// 打开编辑弹窗
const handleEdit = async (row: CozeItem) => {
  dialogTitle.value = '编辑Coze配置';
  resetForm();
  
  try {
    const res = await apiCoze.getCozeDetail(row.id);
    if (res && res.data) {
      Object.assign(form, res.data);
    }
    dialogVisible.value = true;
  } catch (error) {
    console.error('获取Coze详情失败', error);
    ElMessage.error('获取Coze详情失败');
  }
};

// 处理删除
const handleDelete = (row: CozeItem) => {
  ElMessageBox.confirm('确定要删除该Coze配置吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      try {
        await apiCoze.deleteCoze(row.id);
        ElMessage.success('删除成功');
        getList();
      } catch (error) {
        console.error('删除Coze配置失败', error);
        ElMessage.error('删除Coze配置失败');
      }
    })
    .catch(() => {
      // 取消删除
    });
};

// 切换状态
const handleStatusChange = async (row: CozeItem) => {
  try {
    await apiCoze.updateCoze(row.id, { status: row.status === 1 ? 0 : 1 });
    ElMessage.success('状态更新成功');
    getList();
  } catch (error) {
    console.error('更新状态失败', error);
    ElMessage.error('更新状态失败');
  }
};

// 重置表单
const resetForm = () => {
  // 完全重置表单数据
  Object.assign(form, {
    id: undefined,
    botId: '',
    name: '',
    publicKey: '',
    secretKey: '',
    clientId: '',
    spaceId: '',
    status: 1,
  });
  
  // 清除表单验证
  if (formRef.value) {
    formRef.value.resetFields();
  }
};

// 监听对话框关闭事件，确保表单数据被清除
const handleDialogClose = () => {
  resetForm();
};

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return;
  
  formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      try {
        // 创建表单数据的副本，避免引用问题
        const formData = {
          botId: form.botId,
          name: form.name,
          publicKey: form.publicKey,
          secretKey: form.secretKey,
          clientId: form.clientId,
          spaceId: form.spaceId,
          status: form.status,
        };
        
        if (form.id) {
          // 更新
          await apiCoze.updateCoze(form.id, formData);
          ElMessage.success('更新成功');
        } else {
          // 新增
          await apiCoze.addCoze(formData);
          ElMessage.success('添加成功');
        }
        dialogVisible.value = false;
        resetForm(); // 提交后重置表单
        getList();
      } catch (error) {
        console.error('保存Coze配置失败', error);
        ElMessage.error('保存Coze配置失败');
      }
    }
  });
};

// 处理分页变化
const handleSizeChange = (size: number) => {
  paging.size = size;
  getList();
};

const handleCurrentChange = (page: number) => {
  paging.page = page;
  getList();
};

// 组件挂载时获取列表数据
onMounted(() => {
  getList();
});
</script>

<template>
  <div>
    <PageHeader>
      <template #title>
        <div class="flex items-center gap-4">Coze 工作流管理</div>
      </template>
      <template #content>
        <div class="text-sm/6">
          <div>
            管理 Coze Bot 的密钥和配置。您可以添加多个 Coze Bot，方便在不同场景下使用。
          </div>
        </div>
      </template>
      <HButton @click="handleAdd">
        <SvgIcon name="mdi:plus-circle-outline" />
        添加配置
      </HButton>
    </PageHeader>

    <el-card style="margin: 20px">
      <el-table :data="tableData" border style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="名称" width="180" />
        <el-table-column prop="botId" label="Bot ID" />
        <el-table-column prop="clientId" label="客户端ID" show-overflow-tooltip />
        <el-table-column prop="spaceId" label="空间ID" show-overflow-tooltip />
        <el-table-column prop="publicKey" label="公钥" show-overflow-tooltip />
        <el-table-column prop="secretKey" label="私钥" show-overflow-tooltip>
          <template #default="scope">
            <el-input
              v-model="scope.row.secretKey"
              disabled
              type="password"
              show-password
            />
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120">
          <template #default="scope">
            <el-switch
              v-model="scope.row.status"
              :active-value="1"
              :inactive-value="0"
              @change="() => handleStatusChange(scope.row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="scope">
            {{ new Date(scope.row.createdAt).toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="scope">
            <el-button size="small" @click="handleEdit(scope.row)">
              <SvgIcon name="mdi:pencil" class="mr-1" />
              编辑
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click="handleDelete(scope.row)"
            >
              <SvgIcon name="mdi:delete" class="mr-1" />
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="flex justify-end mt-5">
        <el-pagination
          v-model:current-page="paging.page"
          v-model:page-size="paging.size"
          :total="total"
          :page-sizes="[10, 20, 30, 50, 100, 990]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 添加/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px" @close="handleDialogClose">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
      >
        <el-form-item label="Bot ID" prop="botId">
          <el-input v-model="form.botId" placeholder="请输入Coze Bot ID" />
        </el-form-item>
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入名称，便于管理" />
        </el-form-item>
        <el-form-item label="客户端ID" prop="clientId">
          <el-input v-model="form.clientId" placeholder="请输入客户端ID" />
        </el-form-item>
        <el-form-item label="空间ID" prop="spaceId">
          <el-input v-model="form.spaceId" placeholder="请输入空间ID" />
        </el-form-item>
        <el-form-item label="公钥" prop="publicKey">
          <el-input v-model="form.publicKey" placeholder="请输入Coze公钥" />
        </el-form-item>
        <el-form-item label="私钥" prop="secretKey">
          <el-input
            v-model="form.secretKey"
            placeholder="请输入Coze私钥"
            type="password"
            show-password
          />
        </el-form-item>
        <el-form-item label="状态" v-if="form.id">
          <el-switch
            v-model="form.status"
            :active-value="1"
            :inactive-value="0"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="submitForm">确 定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template> 