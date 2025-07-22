<route lang="yaml">
    meta:
      title: 积分消耗设置
    </route>
    
    <script lang="ts" setup>
    import { ref, reactive, onMounted, computed } from 'vue';
    import { ElMessage, ElMessageBox, FormInstance } from 'element-plus';
    import apiConfig from '@/api/modules/config';
    import apiPackage from '@/api/modules/package';
    import apiPointRule, { ApiResponse, PointConsumptionRule } from '@/api/modules/pointConsumptionRule';
    import type { FormRules } from 'element-plus';
    import { DEDUCTTYPELIST } from '@/constants';
    
    interface FunctionInfo {
      id: number;
      functionId: string;
      functionName: string;
      description: string;
    }
    
    interface ConsumptionRule extends PointConsumptionRule {
      // 添加任何需要的额外属性
    }
    
    interface Package {
      id: number;
      name: string;
      price?: number;
      weight?: number;
    }
    
    const tableData = ref<ConsumptionRule[]>([]);
    const functionList = ref<FunctionInfo[]>([]);
    const loading = ref(false);
    const packageList = ref<Package[]>([]);
    
    // 表单相关
    const formRef = ref<FormInstance>();
    const formVisible = ref(false);
    const formTitle = ref('新增积分消耗规则');
    const formData = reactive<ConsumptionRule>({
      id: 0,
      packageId: 0,
      packageName: '',
      functionId: '',
      model3Rate: 0,
      model4Rate: 0,
      drawMjRate: 0,
      status: 1,
      isAvailable: 1,
      maxConcurrentTasks: 1,
    });
    
    // 功能定义表单
    const functionFormRef = ref<FormInstance>();
    const functionFormVisible = ref(false);
    const functionFormData = reactive<FunctionInfo>({
      id: 0,
      functionId: '',
      functionName: '',
      description: '',
    });
    
    const functionFormRules = reactive<FormRules>({
      functionId: [
        { required: true, message: '请输入功能标识', trigger: 'blur' },
        { pattern: /^[a-zA-Z0-9_]+$/, message: '功能标识只能包含字母、数字和下划线', trigger: 'blur' }
      ],
      functionName: [
        { required: true, message: '请输入功能名称', trigger: 'blur' }
      ],
    });
    
    const formRules = reactive<FormRules>({
      packageId: [{ required: true, message: '请选择套餐', trigger: 'change' }],
      functionId: [{ required: true, message: '请选择功能', trigger: 'change' }],
      model3Rate: [
        { required: true, message: '请输入普通积分消耗数量', trigger: 'blur' },
        { type: 'number', min: 0, message: '积分数量必须大于等于0', trigger: 'blur' }
      ],
      model4Rate: [
        { required: true, message: '请输入高级积分消耗数量', trigger: 'blur' },
        { type: 'number', min: 0, message: '积分数量必须大于等于0', trigger: 'blur' }
      ],
      drawMjRate: [
        { required: true, message: '请输入绘画积分消耗数量', trigger: 'blur' },
        { type: 'number', min: 0, message: '积分数量必须大于等于0', trigger: 'blur' }
      ],
    });
    
    // 获取所有套餐
    const getPackages = async () => {
      try {
        const res = await apiPackage.queryAllPackage({
          page: 1,
          size: 100,
          status: 1, // 只获取启用的套餐
        });
        if (res.data && res.data.rows) {
          packageList.value = res.data.rows.map((pkg: any) => ({
            id: pkg.id,
            name: pkg.name,
            price: pkg.price,
            weight: pkg.weight,
          }));
        }
      } catch (error) {
        console.error('获取套餐列表失败:', error);
      }
    };
    
    // 获取所有函数列表
    const getFunctions = async () => {
      try {
        const res = await apiConfig.queryConfig({
          keys: ['pointConsumptionFunctions'],
        });
        if (res.data && res.data.pointConsumptionFunctions) {
          try {
            functionList.value = JSON.parse(res.data.pointConsumptionFunctions);
          } catch (e) {
            // 空列表
            functionList.value = [];
          }
        } else {
          // 空列表
          functionList.value = [];
        }
      } catch (error) {
        console.error('获取功能列表失败:', error);
        // 空列表
        functionList.value = [];
      }
    };
    
    // 保存功能列表
    const saveFunctions = async () => {
      try {
        await apiConfig.setConfig({
          settings: formatSettings({
            pointConsumptionFunctions: JSON.stringify(functionList.value)
          })
        });
        ElMessage.success('保存功能定义成功');
      } catch (error) {
        console.error('保存功能定义失败:', error);
        ElMessage.error('保存功能定义失败');
      }
    };
    
    // 格式化设置为API需要的格式
    function formatSettings(settings: Record<string, any>) {
      return Object.keys(settings).map((key) => {
        return {
          configKey: key,
          configVal: settings[key],
        };
      });
    }
    
    // 添加或编辑功能
    const handleAddOrEditFunction = (func?: FunctionInfo) => {
      if (func) {
        Object.assign(functionFormData, func);
      } else {
        functionFormData.id = Date.now();
        functionFormData.functionId = '';
        functionFormData.functionName = '';
        functionFormData.description = '';
      }
      functionFormVisible.value = true;
    };
    
    // 删除功能
    const handleDeleteFunction = (func: FunctionInfo) => {
      ElMessageBox.confirm(`确定要删除功能 "${func.functionName}" 吗?`, '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }).then(async () => {
        try {
          // 更新本地列表
          functionList.value = functionList.value.filter(item => item.id !== func.id);
          
          // 同时删除使用此功能的消耗规则
          const rulesToDelete = tableData.value.filter(item => item.functionId === func.functionId);
          
          // 删除关联规则
          for (const rule of rulesToDelete) {
            try {
              await apiPointRule.deleteRule(rule.id);
            } catch (e) {
              console.error('删除规则失败:', e);
            }
          }
          
          // 从本地列表中移除
          tableData.value = tableData.value.filter(item => item.functionId !== func.functionId);
          
          // 保存功能列表
          await saveFunctions();
          
          ElMessage.success('删除成功');
        } catch (error) {
          console.error('删除功能失败:', error);
          ElMessage.error('删除功能失败');
        }
      }).catch(() => {});
    };
    
    // 提交功能表单
    const submitFunctionForm = async () => {
      if (!functionFormRef.value) return;
      
      await functionFormRef.value.validate(async (valid) => {
        if (valid) {
          // 检查功能ID是否重复（除了自己）
          const isDuplicate = functionList.value.some(
            f => f.functionId === functionFormData.functionId && f.id !== functionFormData.id
          );
          if (isDuplicate) {
            ElMessage.error('功能标识已存在，请更换');
            return;
          }
          
          const index = functionList.value.findIndex(item => item.id === functionFormData.id);
          if (index > -1) {
            // 更新已有功能
            functionList.value[index] = { ...functionFormData };
          } else {
            // 添加新功能
            functionList.value.push({ ...functionFormData });
          }
          
          saveFunctions();
          functionFormVisible.value = false;
          ElMessage.success('保存成功');
        }
      });
    };
    
    // 获取消耗规则
    const fetchConsumptionRules = async () => {
      loading.value = true;
      try {
        // 使用API获取所有规则
        const res = await apiPointRule.getAllRules();
        if (res.data && res.data.data) {
          // 设置规则数据
          tableData.value = res.data.data;
          
          // 确保套餐名称正确设置
          tableData.value.forEach(rule => {
            if (rule.packageId === 0) {
              rule.packageName = '无套餐用户';
            } else {
              // 查找套餐名称
              const pkg = packageList.value.find(p => p.id === rule.packageId);
              if (pkg) {
                rule.packageName = pkg.name;
              } else {
                rule.packageName = `套餐ID: ${rule.packageId}`;
              }
            }
          });
        } else {
          tableData.value = [];
        }
      } catch (error) {
        console.error('获取积分消耗规则失败:', error);
        ElMessage.error('获取积分消耗规则失败');
        tableData.value = [];
      } finally {
        loading.value = false;
      }
    };
    
    // 添加或编辑规则
    const handleAddOrEdit = (row?: ConsumptionRule) => {
      if (row) {
        formTitle.value = '编辑积分消耗规则';
        Object.assign(formData, row);
      } else {
        formTitle.value = '新增积分消耗规则';
        formData.id = 0; // 交由后端生成ID
        formData.packageId = 0;
        formData.packageName = '无套餐用户';
        formData.functionId = '';
        formData.model3Rate = 0;
        formData.model4Rate = 0;
        formData.drawMjRate = 0;
        formData.status = 1;
        formData.isAvailable = 1;
        formData.maxConcurrentTasks = 1;
      }
      formVisible.value = true;
    };
    
    // 更新表格中某一行的数据
    const updateTableRow = (index: number, row: ConsumptionRule) => {
      if (index >= 0 && index < tableData.value.length) {
        tableData.value[index] = row;
      }
    };
    
    // 监听功能变化
    const getFunctionName = (functionId: string) => {
      const func = functionList.value.find(f => f.functionId === functionId);
      return func ? func.functionName : functionId;
    };
    
    // 保存表单
    const saveForm = async (formEl: FormInstance | undefined) => {
      if (!formEl) return;
      await formEl.validate(async (valid) => {
        if (valid) {
          loading.value = true;
          try {
            // 构建提交的数据，只包含需要的字段
            const ruleData: Partial<PointConsumptionRule> = {
              packageId: Number(formData.packageId),
              functionId: formData.functionId,
              model3Rate: Number(formData.model3Rate),
              model4Rate: Number(formData.model4Rate),
              drawMjRate: Number(formData.drawMjRate),
              status: Number(formData.status),
              isAvailable: Number(formData.isAvailable),
              maxConcurrentTasks: Number(formData.maxConcurrentTasks),
            };
            
            // 添加描述字段（如果有）
            if (formData.description) {
              ruleData.description = formData.description;
            }
            
            // 设置packageName (前端展示用)
            if (formData.packageId === 0) {
              ruleData.packageName = '无套餐用户';
            } else {
              const pkg = packageList.value.find(p => p.id === formData.packageId);
              ruleData.packageName = pkg ? pkg.name : `套餐ID: ${formData.packageId}`;
            }
            
            // 如果是更新操作，添加ID字段
            if (formData.id) {
              ruleData.id = formData.id;
            }
            
            // 保存规则到API
            let response;
            
            if (formData.id) {
              // 更新现有规则
              console.log(`更新规则ID=${formData.id}, 数据:`, JSON.stringify(ruleData));
              response = await apiPointRule.updateRule(formData.id, ruleData);
            } else {
              // 创建新规则
              console.log('创建新规则数据:', JSON.stringify(ruleData));
              response = await apiPointRule.createRule(ruleData);
            }
            
            console.log('API响应:', response);
            
            if (response.data && response.data.success) {
              ElMessage.success(formData.id ? '更新规则成功' : '创建规则成功');
              formVisible.value = false;
              // 重新获取最新规则列表
              fetchConsumptionRules();
            } else {
              // 显示API返回的错误消息
              ElMessage.error(response.data?.message || '操作失败');
            }
          } catch (error: any) {
            console.error('保存规则失败:', error);
            
            // 提取并显示详细的错误信息
            let errorMsg = '保存规则失败';
            if (error.response && error.response.data) {
              errorMsg += ': ' + (error.response.data.message || error.response.data.error || '未知错误');
            } else if (error.message) {
              errorMsg += ': ' + error.message;
            }
            
            ElMessage.error(errorMsg);
          } finally {
            loading.value = false;
          }
        } else {
          ElMessage.error('请完善表单信息');
        }
      });
    };
    
    // 删除规则
    const handleDelete = (row: ConsumptionRule, index: number) => {
      ElMessageBox.confirm(`确定删除"${row.packageName}"的"${getFunctionName(row.functionId)}"规则吗？`, '删除确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }).then(async () => {
        loading.value = true;
        try {
          console.log('删除规则ID:', row.id);
          const response = await apiPointRule.deleteRule(row.id);
          console.log('删除响应:', response);
          
          if (response.data && response.data.success) {
            ElMessage.success('删除成功');
            // 从表格中移除该行
            tableData.value.splice(index, 1);
          } else {
            ElMessage.error(response.data?.message || '删除失败');
          }
        } catch (error: any) {
          console.error('删除规则失败:', error);
          if (error.response) {
            console.error('错误响应状态:', error.response.status);
            console.error('错误响应数据:', error.response.data);
          }
          ElMessage.error('删除规则失败: ' + (error.message || '未知错误'));
        } finally {
          loading.value = false;
        }
      }).catch(() => {
        // 用户取消删除
      });
    };
    
    // 禁用或启用规则
    const toggleRuleStatus = async (row: ConsumptionRule) => {
      loading.value = true;
      try {
        // 构建状态更新数据，明确包含ID字段
        const newStatus = row.status === 1 ? 0 : 1;
        const updateData = {
          id: row.id,  // 明确包含ID
          status: newStatus
        };
        
        console.log(`更新规则ID=${row.id}状态为: ${newStatus}`);
        const response = await apiPointRule.updateRule(row.id, updateData);
        console.log('状态更新响应:', response);
        
        if (response.data && response.data.success) {
          ElMessage.success(`${newStatus === 1 ? '启用' : '禁用'}成功`);
          // 更新本地状态
          row.status = newStatus;
        } else {
          // 显示API返回的错误消息
          ElMessage.error(response.data?.message || '操作失败');
        }
      } catch (error: any) {
        console.error('更新规则状态失败:', error);
        
        // 提取并显示详细的错误信息
        let errorMsg = '操作失败';
        if (error.response && error.response.data) {
          errorMsg += ': ' + (error.response.data.message || error.response.data.error || '未知错误');
        } else if (error.message) {
          errorMsg += ': ' + error.message;
        }
        
        ElMessage.error(errorMsg);
      } finally {
        loading.value = false;
      }
    };
    
    // 切换功能是否可用
    const toggleAvailability = async (row: ConsumptionRule) => {
      loading.value = true;
      try {
        // 构建状态更新数据
        const newAvailability = row.isAvailable === 1 ? 0 : 1;
        const updateData = {
          id: row.id,
          isAvailable: newAvailability
        };
        
        console.log(`更新规则ID=${row.id}可用性为: ${newAvailability}`);
        const response = await apiPointRule.updateRule(row.id, updateData);
        console.log('可用性更新响应:', response);
        
        if (response.data && response.data.success) {
          ElMessage.success(`设置为${newAvailability === 1 ? '可用' : '不可用'}成功`);
          // 更新本地状态
          row.isAvailable = newAvailability;
        } else {
          // 显示API返回的错误消息
          ElMessage.error(response.data?.message || '操作失败');
        }
      } catch (error: any) {
        console.error('更新功能可用性失败:', error);
        
        // 提取并显示详细的错误信息
        let errorMsg = '操作失败';
        if (error.response && error.response.data) {
          errorMsg += ': ' + (error.response.data.message || error.response.data.error || '未知错误');
        } else if (error.message) {
          errorMsg += ': ' + error.message;
        }
        
        ElMessage.error(errorMsg);
      } finally {
        loading.value = false;
      }
    };
    
    // 监听套餐变化
    const handlePackageChange = (packageId: number) => {
      if (packageId === 0) {
        formData.packageName = '无套餐用户';
      } else {
        const pkg = packageList.value.find(p => p.id === packageId);
        if (pkg) {
          formData.packageName = pkg.name;
        } else {
          formData.packageName = `套餐ID: ${packageId}`;
        }
        console.log(`套餐ID ${packageId} 设置名称为: ${formData.packageName}`);
      }
    };
    
    onMounted(() => {
      getPackages();
      getFunctions();
      fetchConsumptionRules();
    });
    </script>
    
    <template>
      <div>
        <PageHeader>
          <template #title>
            <div class="flex items-center gap-4">积分消耗设置</div>
          </template>
          <template #content>
            <div class="text-sm/6">
              <div>积分消耗设置用于控制不同套餐在使用各种功能时消耗的积分点数。</div>
              <div>设置消耗积分数量，设置为0则不消耗积分，大于0则按设定数量消耗。</div>
              <div>选择"无套餐用户"可为未购买任何套餐的普通用户设置消耗规则。</div>
            </div>
          </template>
          <div class="flex gap-2">
            <HButton outline @click="handleAddOrEditFunction()">
              <SvgIcon name="i-carbon:function" />
              添加功能
            </HButton>
            <HButton outline @click="handleAddOrEdit()">
              <SvgIcon name="i-carbon:add" />
              添加消耗规则
            </HButton>
          </div>
        </PageHeader>
    
        <!-- 功能定义表格 -->
        <el-card style="margin: 20px 20px 10px 20px">
          <div slot="header" class="card-header">
            <h3>功能定义</h3>
            <p class="text-sm text-gray-500">定义系统功能并为其分配唯一标识，用于设置不同套餐的积分消耗规则</p>
          </div>
          <el-table
            :data="functionList"
            style="width: 100%"
            border
          >
            <el-table-column prop="functionId" label="功能标识" width="180" />
            <el-table-column prop="functionName" label="功能名称" width="180" />
            <el-table-column prop="description" label="功能描述" />
            <el-table-column label="操作" width="150">
              <template #default="scope">
                <el-button
                  type="primary"
                  size="small"
                  @click="handleAddOrEditFunction(scope.row)"
                >
                  编辑
                </el-button>
                <el-button
                  type="danger"
                  size="small"
                  @click="handleDeleteFunction(scope.row)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
    
        <!-- 积分消耗规则表格 -->
        <el-card style="margin: 10px 20px 20px 20px">
          <div slot="header" class="card-header">
            <h3>消耗规则设置</h3>
            <p class="text-sm text-gray-500">为不同套餐的不同功能设置积分消耗规则，包括无套餐的普通用户</p>
          </div>
          <el-table
            v-loading="loading"
            :data="tableData"
            style="width: 100%"
            border
          >
            <el-table-column prop="packageName" label="套餐名称" width="150">
              <template #default="scope">
                <div>{{ scope.row.packageId === 0 ? '无套餐用户' : scope.row.packageName || `套餐ID: ${scope.row.packageId}` }}</div>
              </template>
            </el-table-column>
            <el-table-column label="功能" width="150">
              <template #default="scope">
                <div>{{ getFunctionName(scope.row.functionId) }}</div>
                <div class="text-xs text-gray-500">{{ scope.row.functionId }}</div>
              </template>
            </el-table-column>
            <el-table-column label="普通积分消耗" width="150">
              <template #default="scope">
                <div>{{ scope.row.model3Rate }}</div>
                <div class="text-xs text-gray-500">
                  {{ DEDUCTTYPELIST[0].label }}
                </div>
              </template>
            </el-table-column>
            <el-table-column label="高级积分消耗" width="150">
              <template #default="scope">
                <div>{{ scope.row.model4Rate }}</div>
                <div class="text-xs text-gray-500">
                  {{ DEDUCTTYPELIST[1].label }}
                </div>
              </template>
            </el-table-column>
            <el-table-column label="绘画积分消耗" width="150">
              <template #default="scope">
                <div>{{ scope.row.drawMjRate }}</div>
                <div class="text-xs text-gray-500">
                  {{ DEDUCTTYPELIST[2].label }}
                </div>
              </template>
            </el-table-column>
            <el-table-column label="最大并发数" width="120">
              <template #default="scope">
                <div>{{ scope.row.maxConcurrentTasks || 1 }}</div>
                <div class="text-xs text-gray-500">最大可同时执行任务数</div>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
                  {{ scope.row.status === 1 ? '启用' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="isAvailable" label="是否可用" width="100">
              <template #default="scope">
                <el-tag 
                  :type="scope.row.isAvailable === 1 ? 'success' : 'danger'"
                  @click="toggleAvailability(scope.row)"
                  style="cursor: pointer"
                >
                  {{ scope.row.isAvailable === 1 ? '可用' : '不可用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150">
              <template #default="scope">
                <el-button
                  type="primary"
                  size="small"
                  @click="handleAddOrEdit(scope.row)"
                >
                  编辑
                </el-button>
                <el-button
                  type="danger"
                  size="small"
                  @click="handleDelete(scope.row, scope.$index)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
    
        <!-- 积分消耗规则表单弹窗 -->
        <el-dialog v-model="formVisible" :title="formTitle" width="600px">
          <el-form
            ref="formRef"
            :model="formData"
            :rules="formRules"
            label-width="120px"
          >
            <el-form-item label="套餐" prop="packageId">
              <el-select
                v-model="formData.packageId"
                placeholder="请选择套餐"
                style="width: 100%"
                @change="handlePackageChange"
              >
                <el-option
                key="0"
                label="无套餐用户"
                :value="0"
                />
                <el-option
                  v-for="item in packageList"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="功能" prop="functionId">
              <el-select
                v-model="formData.functionId"
                placeholder="请选择功能"
                style="width: 100%"
              >
                <el-option
                  v-for="item in functionList"
                  :key="item.functionId"
                  :label="item.functionName"
                  :value="item.functionId"
                >
                  <div>{{ item.functionName }}</div>
                  <div class="text-xs text-gray-500">{{ item.functionId }}</div>
                </el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="普通积分消耗" prop="model3Rate">
              <el-input-number
                v-model="formData.model3Rate"
                :min="0"
                :step="1"
                style="width: 100%"
              />
              <div class="text-xs text-gray-500 mt-1">
                设置为0则不消耗积分，直接填写消耗的积分数量
              </div>
            </el-form-item>
            <el-form-item label="高级积分消耗" prop="model4Rate">
              <el-input-number
                v-model="formData.model4Rate"
                :min="0"
                :step="1"
                style="width: 100%"
              />
              <div class="text-xs text-gray-500 mt-1">
                设置为0则不消耗积分，直接填写消耗的积分数量
              </div>
            </el-form-item>
            <el-form-item label="绘画积分消耗" prop="drawMjRate">
              <el-input-number
                v-model="formData.drawMjRate"
                :min="0"
                :step="1"
                style="width: 100%"
              />
              <div class="text-xs text-gray-500 mt-1">
                设置为0则不消耗积分，直接填写消耗的积分数量
              </div>
            </el-form-item>
            <el-form-item label="最大并发任务数" prop="maxConcurrentTasks">
              <el-input-number
                v-model="formData.maxConcurrentTasks"
                :min="1"
                :max="10"
                placeholder="请输入最大并发任务数"
                style="width: 100%"
              />
              <div class="text-xs text-gray-500 mt-1">设置功能可同时执行的最大任务数量，对批量生成任务有效</div>
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-switch
                v-model="formData.status"
                :active-value="1"
                :inactive-value="0"
                active-text="启用"
                inactive-text="禁用"
              />
            </el-form-item>
            <el-form-item label="是否可用" prop="isAvailable">
              <el-switch
                v-model="formData.isAvailable"
                :active-value="1"
                :inactive-value="0"
                active-text="可用"
                inactive-text="不可用"
              />
              <div class="text-xs text-gray-500 mt-1">设置为"可用"表示该套餐可以使用此功能，设置为"不可用"表示该套餐无法使用此功能</div>
            </el-form-item>
          </el-form>
          <template #footer>
            <span class="dialog-footer">
              <el-button @click="formVisible = false">取消</el-button>
              <el-button type="primary" @click="saveForm(formRef)">
                确定
              </el-button>
            </span>
          </template>
        </el-dialog>
    
        <!-- 功能定义表单弹窗 -->
        <el-dialog v-model="functionFormVisible" title="功能定义" width="600px">
          <el-form
            ref="functionFormRef"
            :model="functionFormData"
            :rules="functionFormRules"
            label-width="120px"
          >
            <el-form-item label="功能标识" prop="functionId">
              <el-input
                v-model="functionFormData.functionId"
                placeholder="请输入唯一的功能标识，如: chat_gpt4, draw_midjourney"
              />
              <div class="text-xs text-gray-500 mt-1">
                功能标识用于系统识别，只能使用字母、数字和下划线
              </div>
            </el-form-item>
            <el-form-item label="功能名称" prop="functionName">
              <el-input
                v-model="functionFormData.functionName"
                placeholder="请输入功能名称，如: GPT-4聊天, MidJourney绘画"
              />
            </el-form-item>
            <el-form-item label="功能描述" prop="description">
              <el-input
                v-model="functionFormData.description"
                type="textarea"
                :rows="3"
                placeholder="请输入功能描述信息"
              />
            </el-form-item>
          </el-form>
          <template #footer>
            <span class="dialog-footer">
              <el-button @click="functionFormVisible = false">取消</el-button>
              <el-button type="primary" @click="submitFunctionForm">
                确定
              </el-button>
            </span>
          </template>
        </el-dialog>
      </div>
    </template>
    
    <style scoped>
    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }
    
    .card-header {
      margin-bottom: 15px;
    }
    
    h3 {
      font-size: 16px;
      margin: 0 0 5px 0;
    }
    </style>