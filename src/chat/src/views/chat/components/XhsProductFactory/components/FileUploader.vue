<script setup lang="ts">
import { ref, computed, nextTick, onMounted, watch } from 'vue';
import { UploadedFile, ProductForm, Material, MaterialFolder } from '../types';
import { generateRandomId, checkFunctionAvailability } from '../utils';
import { uploadFile, getMaterials } from '../api';
import { ElMessage } from 'element-plus';

// 全局对象引用
declare const window: Window & typeof globalThis;

// 定义组件 props
const props = defineProps<{
  productForm: ProductForm;
  uploadedFiles: UploadedFile[];
  maxFileCount?: number; // 添加最大文件数量属性，可选
  selectedMaterialFolders?: string[]; // 添加已选择的素材库文件夹
  selectedFolderNames?: string[]; // 添加已选择的文件夹名称
  materialNames?: string[]; // 添加素材名称
  materials?: Material[]; // 素材列表，包含previewUrl等信息
  folderIds?: string[]; // 选择的文件夹ID
  folderNames?: string[]; // 选择的文件夹名称
}>();

// 定义组件 emit
const emit = defineEmits<{
  (e: 'update:uploadedFiles', files: UploadedFile[]): void;
  (e: 'update:productForm', form: ProductForm): void;
  (e: 'showStatusMessage', message: string, type: 'success' | 'error' | 'info'): void;
  (e: 'openMaterialLibrary'): void;
  (e: 'update:selectedMaterialFolders', folders: string[]): void;
  (e: 'update:selectedFolderNames', names: string[]): void;
  (e: 'update:folderIds', ids: string[]): void;
  (e: 'update:folderNames', names: string[]): void;
  (e: 'update:materialNames', names: string[]): void;
}>();

// 计算文件数量和限制
const fileCount = computed(() => props.uploadedFiles.length);
const maxFileCount = props.maxFileCount || 20;

// 素材缓存
const materialCache = ref<Record<string, Material>>({});

// 判断选择的是素材项还是文件夹
const isMaterialItems = computed(() => {
  // 检查sessionStorage中的素材选择标记
  return sessionStorage.getItem('materialLibraryMaterialSelection') === 'true';
});

// 判断是否有选择文件夹
const isFolderItems = computed(() => {
  // 检查sessionStorage中的文件夹选择标记
  return sessionStorage.getItem('materialLibraryFolderSelection') === 'true'; 
});

// 从选择中提取素材ID
const materialsFromLibrary = computed(() => {
  if (!props.selectedMaterialFolders) {
    return [];
  }
  
  // 尝试从sessionStorage获取选择信息
  const selectionInfoStr = sessionStorage.getItem('materialSelectionInfo');
  if (selectionInfoStr) {
    try {
      const selectionInfo = JSON.parse(selectionInfoStr);
      if (selectionInfo && selectionInfo.materials && Array.isArray(selectionInfo.materials)) {
        return selectionInfo.materials;
      }
    } catch (e) {
      console.error('解析素材选择信息失败:', e);
    }
  }
  
  // 如果选择类型是素材或both，返回素材ID
  if (sessionStorage.getItem('materialLibraryMaterialSelection') === 'true') {
    return props.selectedMaterialFolders.filter(id => {
      // 排除与folderIds相同的ID
      return !props.folderIds || !props.folderIds.includes(id);
    });
  }
  
  // 否则返回空数组
  return [];
});

// 从选择中提取文件夹ID（原始localFolderIds保持不变）
const foldersFromLibrary = computed(() => {
  // 先检查会话存储中是否明确标记了有文件夹选择，如果没有则直接返回空数组
  if (sessionStorage.getItem('materialLibraryFolderSelection') !== 'true') {
    return [];
  }
  
  // 尝试从sessionStorage获取选择信息
  const selectionInfoStr = sessionStorage.getItem('materialSelectionInfo');
  if (selectionInfoStr) {
    try {
      const selectionInfo = JSON.parse(selectionInfoStr);
      if (selectionInfo && 
          selectionInfo.folders && 
          Array.isArray(selectionInfo.folders) && 
          selectionInfo.folders.length > 0 &&
          selectionInfo.folders.every((id: any) => typeof id === 'string' || typeof id === 'number')) {
        return selectionInfo.folders;
      }
    } catch (e) {
      console.error('解析文件夹选择信息失败:', e);
    }
  }
  
  // 如果会话存储没有有效的文件夹信息，则使用props中的文件夹ID
  if (props.folderIds && Array.isArray(props.folderIds) && props.folderIds.length > 0) {
    return props.folderIds;
  }
  
  return [];
});

// 添加一个判断是否选择了"全部文件夹"的计算属性
const hasSelectedAllFolders = computed(() => {
  // 检查本地文件夹ID数组中是否包含特殊值"1"
  const hasAllFoldersId = Array.isArray(localFolderIds.value) && localFolderIds.value.includes('1');
  
  // 也检查从素材库选择的文件夹中是否包含特殊值"1"
  const allFoldersInLibrary = foldersFromLibrary.value.includes('1');
  
  return hasAllFoldersId || allFoldersInLibrary;
});

// 修改folderNamesMap计算属性，确保特殊值"1"始终显示为"全部文件夹"
const folderNamesMap = computed(() => {
  const result: Record<string, string> = {};
  
  // 特殊处理：确保特殊值"1"始终显示为"全部文件夹"
  result['1'] = '全部文件夹';
  
  // 合并本地文件夹名称
  if (props.folderIds && Array.isArray(props.folderIds) && props.folderNames && Array.isArray(props.folderNames)) {
    props.folderIds.forEach((id, index) => {
      if (index < props.folderNames!.length) {
        const name = props.folderNames![index];
        if (name && name.trim()) {
          // 避免覆盖特殊值"1"的名称
          if (id !== '1') {
          result[id] = name;
          }
        }
      }
    });
  }
  
  // 只在有文件夹选择标记时才尝试从sessionStorage获取文件夹信息
  if (sessionStorage.getItem('materialLibraryFolderSelection') === 'true') {
    const selectionInfoStr = sessionStorage.getItem('materialSelectionInfo');
    if (selectionInfoStr) {
      try {
        const selectionInfo = JSON.parse(selectionInfoStr);
        if (selectionInfo && selectionInfo.folders && selectionInfo.folders.length > 0) {
          // 如果selectionInfo中包含folderNames映射，优先使用
          if (selectionInfo.folderNames && typeof selectionInfo.folderNames === 'object') {
            Object.entries(selectionInfo.folderNames).forEach(([id, name]) => {
              if (name && typeof name === 'string') {
                // 避免覆盖特殊值"1"的名称
                if (id !== '1') {
                result[id] = name;
                }
              }
            });
          } 
          // 否则为文件夹ID生成一个默认名称
          else {
            selectionInfo.folders.forEach((id: string, index: number) => {
              if (!result[id]) {
                // 避免覆盖特殊值"1"的名称
                if (id !== '1') {
                result[id] = `文件夹 ${index + 1}`;
                }
              }
            });
          }
        }
      } catch (e) {
        console.error('解析文件夹选择信息失败:', e);
      }
    }
  }
  
  console.log('folderNamesMap结果:', result);
  return result;
});

// 本地持有的文件夹信息
const localFolderIds = ref<string[]>((props.folderIds && props.folderIds.length > 0) ? [...props.folderIds] : []);
const localFolderNames = ref<string[]>((props.folderNames && props.folderNames.length > 0) ? [...props.folderNames] : []);

// 判断是否有选择文件夹
const hasSelectedFolders = computed(() => {
  console.log('检查是否有选择文件夹:');
  
  // 检查本地文件夹ID数组是否有内容
  const hasFolderIds = Array.isArray(localFolderIds.value) && localFolderIds.value.length > 0;
  console.log('本地文件夹IDs:', hasFolderIds ? localFolderIds.value : '无');
  
  // 额外检查sessionStorage中的标记
  const hasFolderSelection = sessionStorage.getItem('materialLibraryFolderSelection') === 'true';
  console.log('文件夹选择标记:', hasFolderSelection);
  
  // 如果文件夹ID数组有内容，则显示文件夹组件
  return hasFolderIds && hasFolderSelection;
});

// 加载素材数据
async function loadMaterialData() {
  if (!props.selectedMaterialFolders || props.selectedMaterialFolders.length === 0) return;
  
  try {
    // 从API获取素材数据列表
    const response = await getMaterials();
    console.log('getMaterials返回数据:', response);
    
    // 处理各种可能的响应格式
    let materialsData = [];
    if (response?.data?.data && Array.isArray(response.data.data)) {
      materialsData = response.data.data;
    } else if (response?.data && Array.isArray(response.data)) {
      materialsData = response.data;
    } else if (Array.isArray(response)) {
      materialsData = response;
    }
    
    if (materialsData.length > 0) {
      // 将素材按ID索引存入缓存
      materialsData.forEach((material: Material) => {
        if (material.id) {
          materialCache.value[material.id] = material;
        }
      });
      
      console.log('加载了素材数据, 缓存数量:', Object.keys(materialCache.value).length);
    }
  } catch (error) {
    console.error(`无法加载素材数据:`, error);
  }
}

// 获取素材预览URL
function getMaterialPreviewUrl(materialId: string, index: number): string {
  console.log('getMaterialPreviewUrl - 参数:', materialId, index);
  
  // 1. 先尝试直接使用materialId作为URL（有些情况下选择的素材就是一个URL）
  if (materialId && (materialId.startsWith('http://') || materialId.startsWith('https://'))) {
    return materialId;
  }
  
  // 2. 从缓存中查找素材信息
  if (materialId && materialCache.value[materialId]) {
    const material = materialCache.value[materialId];
    
    // 使用预览URL
    if (material.previewUrl) {
      console.log('从缓存找到素材预览URL:', material.previewUrl);
      return material.previewUrl;
    }
    
    // 或使用文件ID
    if (material.fileId) {
      console.log('使用素材fileId作为预览URL:', material.fileId);
      return material.fileId;
    }
  }
  
  // 3. 检查props中是否传入了素材数据
  if (props.materials && props.materials.length > 0) {
    const material = props.materials.find(m => m.id === materialId);
    if (material && material.previewUrl) {
      return material.previewUrl;
    }
  }
  
  // 4. 尝试加载素材数据（可能是首次访问）
  if (!Object.keys(materialCache.value).length) {
    // 延迟加载
    setTimeout(() => {
      loadMaterialData().then(() => {
        console.log('延迟加载素材数据完成，缓存数量:', Object.keys(materialCache.value).length);
      });
    }, 0);
  }
  
  // 5. 基于API格式构建URL
  // 根据接口返回的实际数据，URL格式应为: http://127.0.0.1:9520/file/material/{fileName}
  if (materialId) {
    // 只在真的找不到素材时才构建URL
    if (props.selectedFolderNames && props.selectedFolderNames.length > index) {
      const name = props.selectedFolderNames[index];
      if (name) {
        // 从名称中提取可能的文件名信息
        const timeStamp = Date.now();
        const randomId = materialId.substring(0, 4); 
        return `http://127.0.0.1:9520/file/material/${timeStamp}_${randomId}.jpeg`;
      }
    }
  }
  
  // 6. 兜底方案：使用随机图片
  console.warn('无法获取素材预览URL，使用随机图片替代', materialId);
  return `https://picsum.photos/seed/${materialId || 'material' + index}/300/300`;
}

// 文件上传相关
const uploadLoading = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);
const fileInputId = 'xhs-file-input-' + Date.now(); // 添加唯一ID
const isFileDialogOpen = ref(false);

// 素材库权限控制
const materialLibraryAccess = ref(true); // 默认可用，异步检查后更新

// 打开素材库方法
const openMaterialLibrary = async () => {
  if (!materialLibraryAccess.value) {
    ElMessage.warning('素材库功能不可用，请升级套餐');
    return;
  }
  emit('openMaterialLibrary');
};

// 组件挂载时加载素材数据
onMounted(() => {
  loadMaterialData();
  
  // 检查是否有会话存储的选择信息
  console.log('组件挂载，检查选择信息');
  console.log('materialLibraryFolderSelection:', sessionStorage.getItem('materialLibraryFolderSelection'));
  console.log('materialSelectionInfo:', sessionStorage.getItem('materialSelectionInfo'));
  
  // 初始化本地文件夹信息
  if (props.folderIds && props.folderIds.length > 0) {
    console.log('挂载时初始化本地文件夹IDs:', props.folderIds);
    localFolderIds.value = [...props.folderIds];
  } else {
    console.log('挂载时无文件夹IDs');
    localFolderIds.value = [];
  }
  
  if (props.folderNames && props.folderNames.length > 0) {
    console.log('挂载时初始化本地文件夹Names:', props.folderNames);
    localFolderNames.value = [...props.folderNames];
  } else {
    console.log('挂载时无文件夹Names');
    localFolderNames.value = [];
  }

  // 在组件挂载时检查素材库权限
  checkMaterialLibraryAccess();
});

// 监听父组件传入的文件夹信息变化
watch(() => props.folderIds, (newVal) => {
  if (newVal && newVal.length > 0) {
    console.log('接收到新的文件夹IDs:', newVal);
    localFolderIds.value = [...newVal];
  } else {
    console.log('清空本地文件夹IDs');
    localFolderIds.value = [];
  }
}, { deep: true });

watch(() => props.folderNames, (newVal) => {
  if (newVal && newVal.length > 0) {
    console.log('接收到新的文件夹Names:', newVal);
    localFolderNames.value = [...newVal];
  } else {
    console.log('清空本地文件夹Names');
    localFolderNames.value = [];
  }
}, { deep: true });

// 当选择的素材变化时重新加载
watch(() => props.selectedMaterialFolders, () => {
  loadMaterialData();
}, { deep: true });

// 上传文件处理
async function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = input.files;
  
  // 无论上传成功与否，都重置锁定状态
  isFileDialogOpen.value = false;
  
  if (!files || files.length === 0) {
    return;
  }
  
  const currentCount = fileCount.value;
  const remainingSlots = maxFileCount - currentCount;
  
  if (files.length > remainingSlots) {
    emit('showStatusMessage', `最多只能上传${maxFileCount}个文件，当前还可上传${remainingSlots}个`, 'error');
  }
  
  // 处理文件上传
  const newFiles = Array.from(files).slice(0, remainingSlots);
  
  if (newFiles.length === 0) {
    return;
  }
  
  uploadLoading.value = true;
  
  const updatedFiles = [...props.uploadedFiles];
  const updatedMaterials = [...props.productForm.materials];
  
  for (const file of newFiles) {
    // 创建本地文件预览
    const fileId = generateRandomId('file');
    const reader = new FileReader();
    
    // 添加到上传列表
    const uploadFileObj: UploadedFile = {
      id: fileId,
      fileId: '',
      name: file.name,
      size: file.size,
      type: file.type,
      previewUrl: '',
      status: 'uploading'
    };
    
    updatedFiles.push(uploadFileObj);
    emit('update:uploadedFiles', updatedFiles);
    
    // 读取文件为DataURL，用于本地预览
    reader.onload = (e) => {
      const fileIndex = updatedFiles.findIndex(f => f.id === fileId);
      if (fileIndex !== -1) {
        updatedFiles[fileIndex].previewUrl = e.target?.result as string;
        emit('update:uploadedFiles', updatedFiles);
      }
    };
    reader.readAsDataURL(file);
    
    // 上传文件到服务器
    try {
      const fileId = await uploadFile(file);
      
      // 更新文件状态
      const fileIndex = updatedFiles.findIndex(f => f.id === uploadFileObj.id);
      if (fileIndex !== -1) {
        updatedFiles[fileIndex].fileId = fileId;
        updatedFiles[fileIndex].status = 'success';
        emit('update:uploadedFiles', updatedFiles);
        
        // 添加到表单的materials数组
        updatedMaterials.push(fileId);
        const updatedForm = { ...props.productForm, materials: updatedMaterials };
        emit('update:productForm', updatedForm);
      }
    } catch (error: any) {
      console.error(`上传文件 ${file.name} 失败:`, error);
      
      const fileIndex = updatedFiles.findIndex(f => f.id === uploadFileObj.id);
      if (fileIndex !== -1) {
        updatedFiles[fileIndex].status = 'error';
        updatedFiles[fileIndex].error = error.message || '上传失败';
        emit('update:uploadedFiles', updatedFiles);
      }
    }
  }
  
  uploadLoading.value = false;
  
  // 重置文件输入框，以便可以重复上传相同的文件
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
}

// 删除上传的文件
function deleteFile(fileId: string) {
  const fileIndex = props.uploadedFiles.findIndex(file => file.id === fileId);
  
  if (fileIndex !== -1) {
    // 获取文件的fileId
    const serverFileId = props.uploadedFiles[fileIndex].fileId;
    
    // 从上传列表中删除
    const updatedFiles = [...props.uploadedFiles];
    updatedFiles.splice(fileIndex, 1);
    emit('update:uploadedFiles', updatedFiles);
    
    // 如果已经上传成功，从材料列表中移除
    if (serverFileId) {
      const materialIndex = props.productForm.materials.indexOf(serverFileId);
      if (materialIndex !== -1) {
        const updatedMaterials = [...props.productForm.materials];
        updatedMaterials.splice(materialIndex, 1);
        const updatedForm = { ...props.productForm, materials: updatedMaterials };
        emit('update:productForm', updatedForm);
      }
    }
  }
}

// 触发文件上传
function triggerFileUpload(event: Event) {
  // 如果对话框已经打开，防止重复触发
  if (isFileDialogOpen.value) {
    return;
  }
  
  // 设置锁定状态
  isFileDialogOpen.value = true;
  
  // 阻止事件冒泡，防止与外层点击冲突
  event?.preventDefault();
  event?.stopPropagation();
  
  // 方法1: 通过ref引用获取
  let fileInput = fileInputRef.value;
  
  // 方法2: 如果ref引用为空，尝试通过ID查找
  if (!fileInput) {
    fileInput = document.getElementById(fileInputId) as HTMLInputElement;
  }
  
  // 方法3: 如果方法1和方法2都失败，尝试创建一个临时输入元素
  if (!fileInput) {
    fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    fileInput.onchange = (e) => {
      handleFileUpload(e);
      // 重置锁定状态
      isFileDialogOpen.value = false;
    };
    document.body.appendChild(fileInput);
    
    // 使用后移除临时元素
    setTimeout(() => {
      if (fileInput && document.body.contains(fileInput)) {
        document.body.removeChild(fileInput);
      }
      // 重置锁定状态
      isFileDialogOpen.value = false;
    }, 5000);
  }
  
  if (fileInput) {
    // 确保通过原生DOM API调用click
    // 使用nextTick确保DOM更新后再触发点击
    nextTick(() => {
      fileInput.click();
      
      // 添加对话框关闭时的处理
      window.addEventListener('focus', function onFocus() {
        // 使用短延时确保文件选择后再重置锁定状态
        setTimeout(() => {
          isFileDialogOpen.value = false;
          window.removeEventListener('focus', onFocus);
        }, 300);
      }, { once: true });
    });
  } else {
    emit('showStatusMessage', '无法打开文件选择器，请刷新页面后重试', 'error');
    // 重置锁定状态
    isFileDialogOpen.value = false;
  }
}

// 删除文件
function removeFile(index: number) {
  if (index >= 0 && index < props.uploadedFiles.length) {
    deleteFile(props.uploadedFiles[index].id);
  }
}

// 删除素材
function removeMaterial(index: number) {
  console.log('触发removeMaterial函数, index:', index);
  console.log('当前素材文件夹:', props.selectedMaterialFolders);
  console.log('当前素材名称:', props.materialNames);
  
  if (!props.selectedMaterialFolders || !props.materialNames) {
    console.error('没有选择的素材或素材名称');
    return;
  }
  
  if (index >= 0 && index < props.selectedMaterialFolders.length) {
    console.log(`准备移除素材，索引: ${index}, ID: ${props.selectedMaterialFolders[index]}`);
    const materialId = props.selectedMaterialFolders[index];
    
    // 创建新的素材文件夹数组，移除指定索引的素材
    const updatedFolders = [...props.selectedMaterialFolders];
    updatedFolders.splice(index, 1);
    console.log('更新后的素材文件夹:', updatedFolders);
    
    // 创建新的素材名称数组，移除指定索引的名称
    const updatedNames = [...props.materialNames];
    updatedNames.splice(index, 1);
    console.log('更新后的素材名称:', updatedNames);
    
    // 从表单中也移除此素材ID（如果存在）
    const updatedMaterials = props.productForm.materials.filter(id => id !== materialId);
    const updatedForm = { ...props.productForm, materials: updatedMaterials };
    console.log('更新后的表单材料:', updatedMaterials);
    
    // 更新selectionInfo中的materials数组
    const selectionInfoStr = sessionStorage.getItem('materialSelectionInfo');
    if (selectionInfoStr) {
      try {
        const selectionInfo = JSON.parse(selectionInfoStr);
        if (selectionInfo && selectionInfo.materials) {
          // 从materials列表中移除这个ID
          selectionInfo.materials = selectionInfo.materials.filter((id: string) => id !== materialId);
          sessionStorage.setItem('materialSelectionInfo', JSON.stringify(selectionInfo));
          
          // 如果materials列表为空，更新标记
          if (selectionInfo.materials.length === 0) {
            sessionStorage.removeItem('materialLibraryMaterialSelection');
          }
        }
      } catch (e) {
        console.error('更新材料选择信息失败:', e);
      }
    }
    
    // 发送更新事件
    console.log('发送update:productForm事件');
    emit('update:productForm', updatedForm);
    
    console.log('发送update:selectedMaterialFolders事件');
    emit('update:selectedMaterialFolders', updatedFolders);
    
    console.log('发送update:materialNames事件');
    emit('update:materialNames', updatedNames);
    
    // 提示用户
    emit('showStatusMessage', '已移除素材', 'info');
  } else {
    console.error(`无法移除素材，索引 ${index} 超出范围`, props.selectedMaterialFolders.length);
  }
}

// 删除文件夹
function removeFolder(index: number) {
  console.log('removeFolder 被调用，索引:', index);
  if (index >= 0 && index < localFolderIds.value.length) {
    // 获取要删除的文件夹ID，用于同步更新素材库勾选状态
    const folderIdToRemove = localFolderIds.value[index];
    console.log('将要删除的文件夹ID:', folderIdToRemove);
    
    // 获取要删除的文件夹名称，便于记录日志
    const folderNameToRemove = localFolderNames.value[index] || `文件夹 ${index + 1}`;
    console.log('将要删除的文件夹名称:', folderNameToRemove);
    
    // 更新本地数组
    const updatedFolderIds = [...localFolderIds.value];
    updatedFolderIds.splice(index, 1);
    
    const updatedFolderNames = [...localFolderNames.value];
    if (updatedFolderNames.length > index) {
      updatedFolderNames.splice(index, 1);
    }
    
    console.log('更新后的文件夹IDs:', updatedFolderIds);
    console.log('更新后的文件夹名称:', updatedFolderNames);
    
    // 更新本地和父组件的文件夹数据
    localFolderIds.value = updatedFolderIds;
    localFolderNames.value = updatedFolderNames;
    
    emit('update:folderIds', updatedFolderIds);
    emit('update:folderNames', updatedFolderNames);
    
    // 同步更新素材库的选择状态
    try {
      console.log('开始全面同步更新素材库选择状态');
      const selectionInfoStr = window.sessionStorage.getItem('materialSelectionInfo');
      console.log('当前的materialSelectionInfo:', selectionInfoStr);
      
      if (selectionInfoStr) {
        let selectionInfo;
        try {
          selectionInfo = JSON.parse(selectionInfoStr);
        } catch (e) {
          console.error('解析materialSelectionInfo失败，创建新对象', e);
          selectionInfo = { folders: [], materials: [], folderNames: {} };
        }
        
        let needsUpdate = false;
        
        if (selectionInfo && selectionInfo.folders) {
          console.log('原始选择的文件夹:', selectionInfo.folders);
          
          // 从文件夹列表中移除这个ID
          const originalFoldersLength = selectionInfo.folders.length;
          selectionInfo.folders = selectionInfo.folders.filter((id: string) => id !== folderIdToRemove);
          
          // 如果数组长度变化，表示确实移除了项目
          if (originalFoldersLength !== selectionInfo.folders.length) {
            needsUpdate = true;
          }
          
          console.log('更新后选择的文件夹:', selectionInfo.folders);
          
          // 如果有文件夹名称映射，也需要更新
          if (selectionInfo.folderNames && selectionInfo.folderNames[folderIdToRemove]) {
            delete selectionInfo.folderNames[folderIdToRemove];
            needsUpdate = true;
          }
        }
        
        if (needsUpdate) {
          console.log('选择状态有变化，更新会话存储');
          
          // 持久化到会话存储
          window.sessionStorage.setItem('materialSelectionInfo', JSON.stringify(selectionInfo));
          
          // 如果文件夹列表为空，更新标记
          if (!selectionInfo.folders || selectionInfo.folders.length === 0) {
            console.log('文件夹列表为空，移除materialLibraryFolderSelection标记');
            window.sessionStorage.removeItem('materialLibraryFolderSelection');
            
            // 检查是否只剩素材选择
            if (selectionInfo.materials && selectionInfo.materials.length > 0) {
              console.log('只有素材被选择，设置materialLibrarySelectionType为materials');
              window.sessionStorage.setItem('materialLibrarySelectionType', 'materials');
              window.sessionStorage.setItem('materialLibraryMaterialSelection', 'true');
            } else {
              // 如果什么都没选，清除所有标记
              console.log('没有任何选择，清除所有标记');
              window.sessionStorage.removeItem('materialLibrarySelectionType');
              window.sessionStorage.removeItem('materialLibraryMaterialSelection');
              window.sessionStorage.removeItem('materialSelectionInfo');
            }
          } else {
            // 还有文件夹被选择
            console.log('仍有文件夹被选择，维持materialLibraryFolderSelection标记');
            window.sessionStorage.setItem('materialLibraryFolderSelection', 'true');
            
            // 如果同时有素材被选择，设置类型为both
            if (selectionInfo.materials && selectionInfo.materials.length > 0) {
              console.log('文件夹和素材都被选择，设置materialLibrarySelectionType为both');
              window.sessionStorage.setItem('materialLibrarySelectionType', 'both');
              window.sessionStorage.setItem('materialLibraryMaterialSelection', 'true');
            } else {
              console.log('只有文件夹被选择，设置materialLibrarySelectionType为folders');
              window.sessionStorage.setItem('materialLibrarySelectionType', 'folders');
              window.sessionStorage.removeItem('materialLibraryMaterialSelection');
            }
          }
        } else {
          console.log('选择状态未变化，无需更新');
        }
      } else {
        console.log('没有找到materialSelectionInfo，清除所有相关标记');
        window.sessionStorage.removeItem('materialLibrarySelectionType');
        window.sessionStorage.removeItem('materialLibraryFolderSelection');
        window.sessionStorage.removeItem('materialLibraryMaterialSelection');
      }
    } catch (e) {
      console.error('更新文件夹选择信息失败:', e);
    }
    
    // 显示成功删除消息
    emit('showStatusMessage', `已移除文件夹: ${folderNameToRemove}`, 'info');
  } else {
    console.error('无效的文件夹索引:', index, '当前文件夹数量:', localFolderIds.value.length);
  }
}

// 在组件挂载时检查素材库权限
async function checkMaterialLibraryAccess() {
  materialLibraryAccess.value = await checkFunctionAvailability('xhs_materials');
}
</script>

<template>
  <div class="mb-6">
    <div class="flex justify-between items-center mb-2">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
        素材上传 (最多 {{ maxFileCount }} 张)
      </label>
      <div>
        <span class="text-sm text-gray-500 dark:text-gray-400">{{ fileCount }}/{{ maxFileCount }}</span>
      </div>
    </div>
    
    <div 
      class="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4 text-center hover:border-gray-400 dark:hover:border-gray-600 transition-colors"
      :class="{ 'cursor-pointer': fileCount < maxFileCount, 'bg-gray-50 dark:bg-gray-900/20': fileCount < maxFileCount }"
      @click="fileCount < maxFileCount ? triggerFileUpload($event) : null"
    >
      <input
        :id="fileInputId"
        ref="fileInputRef"
        type="file"
        multiple
        accept="image/*"
        class="hidden"
        @change="handleFileUpload"
      />
      
      <!-- 空状态提示 -->
      <div v-if="fileCount === 0 && (!props.selectedMaterialFolders || props.selectedMaterialFolders.length === 0) && localFolderIds.length === 0">
        <div v-if="uploadLoading" class="py-6">
          <div class="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-300 dark:border-gray-700 border-t-pink-500"></div>
          <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">上传中，请稍候...</p>
        </div>
        <div v-else class="py-6">
          <svg class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">拖放文件到此处或点击上传</p>
          <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">支持 PNG, JPG, JPEG 格式</p>
        </div>
      </div>
      
      <!-- 已达到最大数量提示 -->
      <div v-else-if="fileCount >= maxFileCount" class="py-6">
        <svg class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">已达到最大上传数量</p>
        <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">请删除部分图片后继续上传</p>
      </div>
      
      <!-- 显示已上传的图片和素材项 -->
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 my-2">
        <!-- 显示上传的文件 -->
        <div 
          v-for="file in uploadedFiles" 
          :key="file.id" 
          class="relative group aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm"
        >
          <!-- 预览图 -->
          <img 
            v-if="file.previewUrl" 
            :src="file.previewUrl" 
            class="w-full h-full object-cover"
            :class="{ 'opacity-50': file.status === 'error' }"
            alt="预览图"
          />
          <div v-else class="w-full h-full flex items-center justify-center">
            <svg class="h-8 w-8 text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          
          <!-- 上传状态指示器 -->
          <div v-if="file.status === 'uploading'" class="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 dark:bg-gray-900 dark:bg-opacity-80">
            <div class="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 dark:border-gray-700 border-t-pink-500"></div>
          </div>
          
          <!-- 状态标签 -->
          <div v-if="file.status === 'success'" class="absolute top-1 left-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded z-10">
            已上传
          </div>
          
          <!-- 错误状态 -->
          <div v-if="file.status === 'error'" class="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 dark:bg-gray-900 dark:bg-opacity-80">
            <div class="text-center">
              <svg class="mx-auto h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p class="mt-1 text-xs text-red-500">{{ file.error || '上传失败' }}</p>
            </div>
          </div>
          
          <!-- 删除按钮 -->
          <button
            type="button"
            @click.stop="deleteFile(file.id)"
            class="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            title="删除文件"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <!-- 文件名称（悬停显示） -->
          <div class="absolute inset-x-0 bottom-0 bg-black bg-opacity-60 text-white p-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
            {{ file.name }}
          </div>
        </div>
        
        <!-- 显示从素材库选择的素材 -->
        <div
          v-for="(id, index) in materialsFromLibrary" 
          :key="`material-${id}-${index}`"
          class="relative group aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm"
        >
          <img 
            :src="getMaterialPreviewUrl(id, index)" 
            class="w-full h-full object-cover"
            alt="素材预览"
          />
          <!-- 素材标记和已选择状态 -->
          <div class="absolute top-1 left-1 flex flex-col gap-1">
            <div class="bg-pink-500 text-white text-xs px-1.5 py-0.5 rounded">
              素材库
            </div>
          </div>
          <!-- 素材名称（悬停显示） -->
          <div class="absolute inset-x-0 bottom-0 bg-black bg-opacity-60 text-white p-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity truncate">
            {{ props.materialNames && index < props.materialNames.length 
              ? props.materialNames[index] 
              : `素材 ${index + 1}` }}
          </div>
          
          <!-- 删除按钮 -->
          <button 
            @click="(e) => {
              e.stopPropagation();
              e.preventDefault();
              
              // 获取在原始数组中的索引
              const originalIndex = props.selectedMaterialFolders ? props.selectedMaterialFolders.indexOf(id) : -1;
              
              if (originalIndex >= 0) {
                // 直接从事件中处理删除
                const tempFolders = [...(props.selectedMaterialFolders || [])];
                const tempNames = [...(props.materialNames || [])]; // 使用materialNames
                
                // 从数组中移除当前索引的项
                tempFolders.splice(originalIndex, 1);
                if (tempNames.length > originalIndex) {
                  tempNames.splice(originalIndex, 1);
                }
                
                // 从产品表单的materials中移除该ID
                let updatedMaterials = [...props.productForm.materials];
                const materialIndex = updatedMaterials.indexOf(id);
                if (materialIndex !== -1) {
                  updatedMaterials.splice(materialIndex, 1);
                  
                  // 更新表单
                  emit('update:productForm', { 
                    ...props.productForm, 
                    materials: updatedMaterials 
                  });
                }
                
                // 发送更新事件
                emit('update:selectedMaterialFolders', tempFolders);
                emit('update:materialNames', tempNames); // 使用materialNames
                emit('showStatusMessage', '已移除素材', 'info');
                
                console.log('删除后的素材文件夹:', tempFolders);
                console.log('删除后的素材名称:', tempNames);
              }
            }"
            class="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
            title="删除素材"
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      <div class="flex justify-center mt-4 space-x-2">
        <button
          type="button"
          class="px-3 py-1.5 text-sm bg-pink-500 hover:bg-pink-600 text-white rounded-md flex items-center"
          @click.stop="triggerFileUpload($event)"
          :disabled="fileCount >= maxFileCount || uploadLoading"
          :class="{'opacity-50 cursor-not-allowed': fileCount >= maxFileCount || uploadLoading}"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          上传素材
        </button>
        
        <button
          type="button"
          class="px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md flex items-center"
          @click.stop="openMaterialLibrary"
          :disabled="!materialLibraryAccess"
          :class="{'opacity-50 cursor-not-allowed': !materialLibraryAccess}"
          :title="materialLibraryAccess ? '打开素材库' : '素材库功能不可用，请升级套餐'"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          素材库
        </button>
        
        <slot name="actions"></slot>
      </div>
    </div>
    
    <!-- 选择的文件夹信息区域 -->
    <div v-if="hasSelectedFolders && localFolderIds.length > 0" class="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800/50">
      <div class="flex items-center text-blue-600 dark:text-blue-300 mb-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
        <span class="font-medium">已从素材库选择 {{ (localFolderIds || []).length}} 个文件夹</span>
        
        <!-- 如果选择了全部文件夹，显示提示信息 -->
        <span v-if="hasSelectedAllFolders" class="ml-2 text-xs bg-pink-500 text-white px-2 py-0.5 rounded-full">
          获取所有素材
        </span>
      </div>
      <div class="mt-2 flex flex-wrap gap-2">
        <div 
          v-for="(folderId, index) in localFolderIds" 
          :key="`folder-${folderId}`"
          class="inline-flex items-center px-3 py-1 rounded-full text-sm group relative"
          :class="[
            folderId === '1' 
              ? 'bg-pink-100 dark:bg-pink-800 text-pink-800 dark:text-pink-200' 
              : 'bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
          ]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <!-- 显示文件夹名称，确保优先使用正确的名称，特殊处理folderId='1' -->
          <span class="truncate" :title="folderId === '1' ? '全部文件夹 (所有素材)' : (localFolderNames[index] || `文件夹 ${index + 1}`)">
            {{ folderId === '1' ? '全部文件夹' : (localFolderNames[index] || `文件夹 ${index + 1}`) }}
          </span>
          <!-- 删除按钮 -->
          <button
            type="button"
            @click="removeFolder(index)"
            class="ml-1 p-0.5 rounded-full transition-colors"
            :class="folderId === '1' ? 'hover:bg-pink-200 dark:hover:bg-pink-700' : 'hover:bg-blue-200 dark:hover:bg-blue-700'"
            title="移除文件夹"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      <!-- 如果选择了全部文件夹，添加提示说明 -->
      <div v-if="hasSelectedAllFolders" class="mt-2 text-xs text-gray-500 dark:text-gray-400">
        <span class="italic">提示：选择"全部文件夹"将获取该用户下的所有素材，不限于特定文件夹</span>
      </div>
    </div>
  </div>
</template>