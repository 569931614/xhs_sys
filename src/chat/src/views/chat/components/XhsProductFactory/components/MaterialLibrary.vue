<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useDialog } from 'naive-ui';
import { Material, MaterialFolder } from '../types';
import { 
  getMaterialFolders,
  createMaterialFolder,
  getMaterials,
  uploadMaterial,
  deleteMaterial,
  checkMaterialValidity,
  deleteMaterialFolder
} from '../api';

// 添加window类型声明
declare const window: Window & typeof globalThis & {
  useAuthStore?: () => {
    removeToken: () => void;
    setLoginDialog?: (value: boolean) => void;
  }
};

// Props和事件
const props = defineProps<{
  visible: boolean;
  selectedMaterials: string[];
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'select', materials: string[]): void;
  (e: 'error', error: any): void;
}>();

// 状态变量
const loading = ref(false);
const folders = ref<MaterialFolder[]>([]);
const materials = ref<Material[]>([]);
const currentFolderId = ref<string>('');
const selectedMaterials = ref<string[]>([...props.selectedMaterials]);
const folderName = ref('');
const createFolderMode = ref(false);
const uploadLoading = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);
const selectedFolders = ref<string[]>([]);
const folderSelectionMode = ref(true); // 默认始终启用文件夹选择模式
const materialSelectionMode = ref(true); // 始终允许素材选择
const dialog = useDialog();

// 计算属性
const currentFolderName = computed(() => {
  if (!folders.value || !Array.isArray(folders.value)) {
    return '全部素材';
  }
  
  // 处理特殊的"全部文件夹"选项
  if (currentFolderId.value === '1') {
    return '全部文件夹（仅浏览模式）';
  }
  
  // 查找匹配的文件夹
  const folder = folders.value.find(f => f.id === currentFolderId.value);
  return folder ? folder.name : '全部素材';
});

// 选择状态指示
const selectionStatusText = computed(() => {
  let text = '';
  
  if (selectedFolders.value.length > 0) {
    text += `已选择 ${selectedFolders.value.length} 个文件夹`;
    if (selectedMaterials.value.length > 0) {
      text += `, ${selectedMaterials.value.length} 个素材`;
    }
  } else if (selectedMaterials.value.length > 0) {
    text = `已选择 ${selectedMaterials.value.length} 个素材`;
  } else {
    text = '请选择文件夹或素材';
  }
  
  return text;
});

// 监听props变化
watch(() => props.selectedMaterials, (newVal) => {
  selectedMaterials.value = [...newVal];
}, { deep: true });

// 当模态框打开时，初始化数据
watch(() => props.visible, (isVisible) => {
  if (isVisible) {
    // 清空当前选择，以便从会话存储重新加载
    selectedFolders.value = [];
    selectedMaterials.value = [...props.selectedMaterials]; // 保留父组件传入的素材选择
    
    // 从会话存储中恢复选择状态
    const selectionInfoStr = sessionStorage.getItem('materialSelectionInfo');
    
    if (selectionInfoStr) {
      try {
        const selectionInfo = JSON.parse(selectionInfoStr);
        
        // 恢复文件夹选择
        if (selectionInfo && selectionInfo.folders && Array.isArray(selectionInfo.folders) && selectionInfo.folders.length > 0) {
          selectedFolders.value = [...selectionInfo.folders];
          
          // 确认选择标记也存在
          if (sessionStorage.getItem('materialLibraryFolderSelection') !== 'true') {
            sessionStorage.setItem('materialLibraryFolderSelection', 'true');
          }
        } else {
          // 如果没有文件夹选择，确保移除标记
          sessionStorage.removeItem('materialLibraryFolderSelection');
        }
        
        // 恢复素材选择
        if (selectionInfo && selectionInfo.materials && Array.isArray(selectionInfo.materials) && selectionInfo.materials.length > 0) {
          selectedMaterials.value = [...selectionInfo.materials];
          
          // 确认选择标记也存在
          if (sessionStorage.getItem('materialLibraryMaterialSelection') !== 'true') {
            sessionStorage.setItem('materialLibraryMaterialSelection', 'true');
          }
        } else {
          // 如果没有素材选择，确保移除标记
          sessionStorage.removeItem('materialLibraryMaterialSelection');
        }
      } catch (e) {
        console.error('解析选择信息失败:', e);
        // 出错时清除所有选择状态和标记
        sessionStorage.removeItem('materialLibraryFolderSelection');
        sessionStorage.removeItem('materialLibraryMaterialSelection');
        sessionStorage.removeItem('materialLibrarySelectionType');
      }
    } else {
      // 如果没有选择信息，清除所有选择状态和标记
      sessionStorage.removeItem('materialLibraryFolderSelection');
      sessionStorage.removeItem('materialLibraryMaterialSelection');
      sessionStorage.removeItem('materialLibrarySelectionType');
    }
    
    // 重新加载数据
    loadFolders();
  }
});

// 加载文件夹列表
async function loadFolders() {
  try {
    loading.value = true;
    const res: any = await getMaterialFolders();

    // 统一提取文件夹数组，兼容各种嵌套
    let folderData: any[] = [];
    if (Array.isArray(res)) {
      folderData = res;
    } else if (res && Array.isArray(res.data?.data)) {
      folderData = res.data.data;
    } else if (res && Array.isArray(res.data)) {
      folderData = res.data;
    } else if (res && res.data?.data && typeof res.data.data === 'object') {
      folderData = [res.data.data];
    } else if (res && res.data && typeof res.data === 'object') {
      folderData = [res.data];
    } else if (res && typeof res === 'object') {
      for (const key of Object.keys(res)) {
        const val = (res as any)[key];
        if (Array.isArray(val)) {
          folderData = val;
          break;
        }
      }
    }

    if (folderData.length === 0) {
      folders.value = [];
    } else {
      folders.value = [];
      folderData.forEach((folder: any) => {
        // 兼容包裹了一层data的情况
        if (folder && Array.isArray(folder.data)) {
          folder.data.forEach((realFolder: any) => {
            const name = realFolder.name || realFolder.folderName || realFolder.title || '未命名文件夹';
            folders.value.push({
              id: realFolder.id || '',
              name,
              count: realFolder.count || 0,
              createTime: typeof realFolder.createTime === 'string' ? realFolder.createTime : new Date().toISOString(),
              updateTime: typeof realFolder.updateTime === 'string' ? realFolder.updateTime : new Date().toISOString()
            });
          });
        } else {
          const name = folder.name || folder.folderName || folder.title || '未命名文件夹';
          folders.value.push({
            id: folder.id || '',
            name,
            count: folder.count || 0,
            createTime: typeof folder.createTime === 'string' ? folder.createTime : new Date().toISOString(),
            updateTime: typeof folder.updateTime === 'string' ? folder.updateTime : new Date().toISOString()
          });
        }
      });
    }
    await loadMaterials(currentFolderId.value);
  } catch (error) {
    emit('error', error);
    folders.value = [];
  } finally {
    loading.value = false;
  }
}

// 加载素材列表
async function loadMaterials(folderId?: string) {
  try {
    loading.value = true;
    const res = await getMaterials(folderId);

    // 统一提取素材数组，兼容各种嵌套
    let materialsData: any[] = [];
    if (Array.isArray(res)) {
      materialsData = res;
    } else if (res && Array.isArray(res.data?.data)) {
      materialsData = res.data.data;
    } else if (res && Array.isArray(res.data)) {
      materialsData = res.data;
    } else if (res && res.data?.data && typeof res.data.data === 'object') {
      materialsData = [res.data.data];
    } else if (res && res.data && typeof res.data === 'object') {
      materialsData = [res.data];
    } else if (res && typeof res === 'object') {
      for (const key of Object.keys(res)) {
        const val = (res as any)[key];
        if (Array.isArray(val)) {
          materialsData = val;
          break;
        }
      }
    }

    // 确保素材数据格式正确
    materials.value = materialsData.map((material: any) => ({
      id: material.id || '',
      fileId: material.fileId || '',
      cozeFileId: material.cozeFileId || '',
      name: material.name || '未命名素材',
      previewUrl: material.previewUrl || '',
      size: material.size || 0,
      type: material.type || '',
      folderId: material.folderId || '',
      uploadTime: typeof material.uploadTime === 'string' ? material.uploadTime : new Date().toISOString(),
      expiryTime: typeof material.expiryTime === 'string' ? material.expiryTime : new Date().toISOString(),
      status: material.status || 'valid'
    }));
  } catch (error) {
    emit('error', error);
    materials.value = [];
  } finally {
    loading.value = false;
  }
}

// 选择文件夹
async function selectFolder(folderId: string) {
  if (folderId !== currentFolderId.value) {
    currentFolderId.value = folderId;
    await loadMaterials(folderId);
  }
}

// 切换文件夹选择状态
function toggleFolderSelection(folderId: string, event?: Event) {
  // 阻止事件冒泡
  event?.stopPropagation();
  
  const index = selectedFolders.value.indexOf(folderId);
  if (index === -1) {
    // 添加到选择列表
    selectedFolders.value.push(folderId);
  } else {
    // 从选择列表中移除
    selectedFolders.value.splice(index, 1);
  }
}

// 文件夹是否被选中
function isFolderSelected(folderId: string) {
  return selectedFolders.value.includes(folderId);
}

// 确认文件夹选择
function confirmFoldersSelection() {
  if (selectedFolders.value.length > 0) {
    // 设置选择类型为文件夹
    sessionStorage.setItem('materialLibrarySelectionType', 'folders');
    console.log('标记选择类型为文件夹');
    
    emit('select', selectedFolders.value);
    closeModal();
  } else {
    // 提示用户至少选择一个文件夹
    alert('请至少选择一个文件夹');
  }
}

// 创建新文件夹
async function createFolder() {
  if (!folderName.value.trim()) {
    return;
  }
  
  try {
    loading.value = true;
    console.log('开始创建文件夹:', folderName.value.trim());
    const res = await createMaterialFolder(folderName.value.trim());
    console.log('创建文件夹响应:', res);
    
    // 获取实际的文件夹数据，处理可能的嵌套数据结构
    let folderData;
    if (res) {
      if (res.data && res.data.data) {
        // 处理双层嵌套 res.data.data 格式
        folderData = res.data.data;
      } else if (res.data && res.data.success && res.data.data) {
        // 处理 res.data = { success: true, data: {...} } 格式
        folderData = res.data.data;
      } else if (res.data) {
        // 处理单层嵌套 res.data 格式
        folderData = res.data;
      } else {
        // 直接使用响应
        folderData = res;
      }
    }
    
    console.log('提取的文件夹数据:', folderData);
    
    // 验证响应
    if (folderData && folderData.id) {
      console.log('新文件夹创建成功:', folderData);
      // 添加到文件夹列表
      folders.value.unshift(folderData);
      // 切换到新文件夹
      currentFolderId.value = folderData.id;
      // 重置输入
      folderName.value = '';
      createFolderMode.value = false;
      // 加载新文件夹中的素材（即空列表）
      await loadMaterials(currentFolderId.value);
    } else {
      console.error('创建文件夹失败: 响应数据异常', res);
      emit('error', '创建文件夹失败，请重试');
    }
  } catch (error) {
    console.error('创建文件夹失败:', error);
    emit('error', error);
  } finally {
    loading.value = false;
  }
}

// 取消创建文件夹
function cancelCreateFolder() {
  folderName.value = '';
  createFolderMode.value = false;
}

// 触发文件上传
function triggerFileUpload(event?: Event) {
  // 阻止事件冒泡，防止与外层点击冲突
  event?.preventDefault();
  event?.stopPropagation();
  
  console.log('素材库: 触发文件上传');
  
  // 当选择全部文件夹（currentFolderId为'1'）时，提示用户需要选择具体文件夹
  if (currentFolderId.value === '1') {
    dialog.warning({
      title: '请选择具体文件夹',
      content: '全部文件夹视图只能浏览素材，请先选择一个具体文件夹再上传素材',
      positiveText: '确定',
      style: {
        zIndex: 10000
      }
    });
    return;
  }
  
  if (!currentFolderId.value) {
    console.error('素材库: 未选择文件夹');
    dialog.warning({
      title: '上传错误',
      content: '请先选择或创建文件夹',
      positiveText: '确定',
      style: {
        zIndex: 10000, // 确保显示在最顶层
      }
    });
    return;
  }
  
  if (!fileInputRef.value) {
    console.error('文件输入引用为空');
    
    // 尝试创建临时文件输入元素
    const tempFileInput = document.createElement('input');
    tempFileInput.type = 'file';
    tempFileInput.multiple = true;
    tempFileInput.accept = 'image/*';
    tempFileInput.style.display = 'none';
    tempFileInput.onchange = handleFileUpload;
    document.body.appendChild(tempFileInput);
    
    // 触发点击并设置清理定时器
    tempFileInput.click();
    setTimeout(() => {
      if (tempFileInput && document.body.contains(tempFileInput)) {
        document.body.removeChild(tempFileInput);
      }
    }, 5000);
    
    return;
  }
  
  // 确保通过原生DOM API调用click
  console.log('素材库: 找到文件输入元素，触发点击');
  nextTick(() => {
    fileInputRef.value?.click();
    console.log('素材库: 已触发文件选择对话框');
  });
}

// 处理文件上传
async function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = input.files;
  
  console.log('素材库: 文件选择回调触发');
  
  if (!files || files.length === 0) {
    console.log('素材库: 没有选择文件');
    return;
  }
  
  console.log(`素材库: 选择了 ${files.length} 个文件`);
  
  // 再次检查是否在全部文件夹视图
  if (currentFolderId.value === '1') {
    dialog.warning({
      title: '请选择具体文件夹',
      content: '全部文件夹视图下不能上传素材，请先选择一个具体文件夹',
      positiveText: '确定',
      style: {
        zIndex: 10000
      }
    });
    return;
  }
  
  if (!currentFolderId.value) {
    console.error('素材库: 未选择文件夹');
    dialog.warning({
      title: '上传错误',
      content: '请先选择或创建文件夹',
      positiveText: '确定',
      style: {
        zIndex: 10000, // 确保显示在最顶层
      }
    });
    return;
  }
  
  uploadLoading.value = true;
  
  try {
    console.log('素材库: 开始上传文件');
    // 一次性上传所有文件
    for (const file of Array.from(files)) {
      try {
        console.log(`素材库: 上传文件 ${file.name}, ${file.size} 字节`);
      await uploadMaterial(file, currentFolderId.value);
        console.log(`素材库: 文件 ${file.name} 上传成功`);
      } catch (fileError: any) {
        console.error(`素材库: 文件 ${file.name} 上传失败:`, fileError);
        
        // 解析API错误响应
        let errorMessage = `文件 ${file.name} 上传失败`;
        
        // 检查是否是重名错误
        if (fileError?.response?.data?.message && 
            typeof fileError.response.data.message === 'string' && 
            fileError.response.data.message.includes('已有相同名称素材')) {
          errorMessage = fileError.response.data.message;
        } else if (fileError?.message && typeof fileError.message === 'string') {
          errorMessage = fileError.message;
        }
        
        // 使用对话框显示错误，确保显示在其他元素之上
        dialog.warning({
          title: '上传失败',
          content: errorMessage,
          positiveText: '确定',
          style: {
            zIndex: 10000, // 确保显示在最顶层
          }
        });
        
        // 停止处理其他文件
        break;
      }
    }
    
    // 重新加载素材列表
    console.log('素材库: 所有文件上传完成，重新加载素材列表');
    await loadMaterials(currentFolderId.value);
  } catch (error: any) {
    console.error('素材库: 上传文件处理失败:', error);
    
    // 解析错误信息
    let errorMessage = '上传文件失败';
    
    if (error?.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error?.message) {
      errorMessage = error.message;
    }
    
    // 使用对话框显示错误，确保显示在其他元素之上
    dialog.warning({
      title: '上传错误',
      content: errorMessage,
      positiveText: '确定',
      style: {
        zIndex: 10000, // 确保显示在最顶层
      }
    });
  } finally {
    uploadLoading.value = false;
    // 重置文件输入
    if (fileInputRef.value) {
      console.log('素材库: 重置文件输入');
      fileInputRef.value.value = '';
    }
  }
}

// 删除素材
async function deleteMaterialItem(materialId: string) {
  try {
    loading.value = true;
    await deleteMaterial(materialId);
    // 从列表中移除
    materials.value = materials.value.filter(m => m.id !== materialId);
    // 从选中列表中移除
    selectedMaterials.value = selectedMaterials.value.filter(id => id !== materialId);
  } catch (error) {
    console.error('删除素材失败:', error);
    emit('error', error);
  } finally {
    loading.value = false;
  }
}

// 选择/取消选择素材
function toggleSelectMaterial(materialId: string) {
  const index = selectedMaterials.value.indexOf(materialId);
  if (index === -1) {
    // 添加到选中列表
    selectedMaterials.value.push(materialId);
  } else {
    // 从选中列表中移除
    selectedMaterials.value.splice(index, 1);
  }
}

// 判断素材是否被选中
function isMaterialSelected(materialId: string) {
  return selectedMaterials.value.includes(materialId);
}

// 确认选择素材
function confirmSelection() {
  let hasSelection = false;
  
  // 处理选择的文件夹
  if (selectedFolders.value.length > 0) {
    // 设置文件夹选择标记
    sessionStorage.setItem('materialLibraryFolderSelection', 'true');
    hasSelection = true;
  } else {
    // 如果没有选择文件夹，确保移除标记
    sessionStorage.removeItem('materialLibraryFolderSelection');
  }
  
  // 处理选择的素材
  if (selectedMaterials.value.length > 0) {
    // 设置素材选择标记
    sessionStorage.setItem('materialLibraryMaterialSelection', 'true');
    hasSelection = true;
  } else {
    // 如果没有选择素材，确保移除标记
    sessionStorage.removeItem('materialLibraryMaterialSelection');
  }
  
  // 只有真的有选择内容时才设置选择类型
  if (hasSelection) {
    // 设置整体选择类型
    sessionStorage.setItem('materialLibrarySelectionType', 'both');
    
    // 合并选择的文件夹和素材数组，并传递给父组件
    const combinedSelection = [...selectedFolders.value, ...selectedMaterials.value];
    console.log('确认选择: 文件夹', selectedFolders.value, '素材', selectedMaterials.value);
    console.log('合并后的选择:', combinedSelection);
    
    // 收集文件夹名称到映射对象
    const folderNamesMap: Record<string, string> = {};
    selectedFolders.value.forEach(folderId => {
      const folder = folders.value.find(f => f.id === folderId);
      if (folder) {
        folderNamesMap[folderId] = folder.name;
      }
    });
    
    // 传递给父组件的时候，添加额外的信息，标记哪些是文件夹，哪些是素材，以及文件夹名称
    const selectionInfo = {
      folders: selectedFolders.value,
      materials: selectedMaterials.value,
      folderNames: folderNamesMap // 添加文件夹名称映射
    };
    
    console.log('完整选择信息:', selectionInfo);
    
    // 将信息存储到sessionStorage
    sessionStorage.setItem('materialSelectionInfo', JSON.stringify(selectionInfo));
    
    emit('select', combinedSelection);
  } else {
    // 如果没有选择任何项目，清除所有相关状态
    sessionStorage.removeItem('materialLibrarySelectionType');
    sessionStorage.removeItem('materialSelectionInfo');
    sessionStorage.removeItem('materialLibraryFolderSelection');
    sessionStorage.removeItem('materialLibraryMaterialSelection');
    
    // 向父组件传递空数组，以便清除之前的选择
    emit('select', []);
  }
  
  closeModal();
}

// 关闭模态框
function closeModal() {
  // 如果没有确认选择，则清除选择类型标记
  if (selectedMaterials.value.length === 0 && selectedFolders.value.length === 0) {
    // 清理所有会话存储数据
    sessionStorage.removeItem('materialLibrarySelectionType');
    sessionStorage.removeItem('materialSelectionInfo');
    sessionStorage.removeItem('materialLibraryFolderSelection');
    sessionStorage.removeItem('materialLibraryMaterialSelection');
  } else {
    // 确保会话存储中的数据与当前选择状态一致
    const selectionInfo = {
      folders: selectedFolders.value,
      materials: selectedMaterials.value,
      folderNames: {}
    };
    
    // 收集文件夹名称
    selectedFolders.value.forEach(folderId => {
      const folder = folders.value.find(f => f.id === folderId);
      if (folder) {
        (selectionInfo.folderNames as Record<string, string>)[folderId] = folder.name;
      }
    });
    
    // 更新会话存储
    sessionStorage.setItem('materialSelectionInfo', JSON.stringify(selectionInfo));
    
    // 更新选择类型标记
    if (selectedFolders.value.length > 0) {
      sessionStorage.setItem('materialLibraryFolderSelection', 'true');
    } else {
      sessionStorage.removeItem('materialLibraryFolderSelection');
    }
    
    if (selectedMaterials.value.length > 0) {
      sessionStorage.setItem('materialLibraryMaterialSelection', 'true');
    } else {
      sessionStorage.removeItem('materialLibraryMaterialSelection');
    }
    
    // 选择类型
    if (selectedFolders.value.length > 0 && selectedMaterials.value.length > 0) {
      sessionStorage.setItem('materialLibrarySelectionType', 'both');
    } else if (selectedFolders.value.length > 0) {
      sessionStorage.setItem('materialLibrarySelectionType', 'folders');
    } else if (selectedMaterials.value.length > 0) {
      sessionStorage.setItem('materialLibrarySelectionType', 'materials');
    } else {
      sessionStorage.removeItem('materialLibrarySelectionType');
    }
  }
  
  emit('update:visible', false);
}

// 检查素材是否有效
async function checkMaterialValidityStatus(materialId: string): Promise<boolean> {
  try {
    const res = await checkMaterialValidity(materialId);
    return res.data?.valid || false;
  } catch (error) {
    console.error('检查素材有效性失败:', error);
    return false;
  }
}

// 删除文件夹
async function deleteFolder(folderId: string) {
  try {
    if (!folderId) {
      console.error('文件夹ID为空，无法删除');
      emit('error', '文件夹ID为空，无法删除');
      return;
    }

    // 确认删除
    dialog.warning({
      title: '删除确认',
      content: '确定要删除此文件夹吗？此操作将删除文件夹中的所有素材，且不可恢复。',
      positiveText: '确认删除',
      negativeText: '取消',
      positiveButtonProps: {
        type: 'error'
      },
      onPositiveClick: async () => {
        try {
          loading.value = true;
          console.log('开始删除文件夹:', folderId);
          
          // 调用API删除文件夹
          const res = await deleteMaterialFolder(folderId);
          console.log('删除文件夹响应:', res);
          
          // 从文件夹列表中移除
          folders.value = folders.value.filter(folder => folder.id !== folderId);
          
          // 如果删除的是当前选中的文件夹，重置当前文件夹ID
          if (currentFolderId.value === folderId) {
            currentFolderId.value = folders.value.length > 0 ? folders.value[0].id : '';
            // 重新加载素材列表
            await loadMaterials(currentFolderId.value);
          }
          
          // 从选中列表中移除
          const index = selectedFolders.value.indexOf(folderId);
          if (index !== -1) {
            selectedFolders.value.splice(index, 1);
          }

          emit('error', { type: 'success', message: '文件夹删除成功' });
        } catch (error: any) {
          console.error('删除文件夹API调用失败:', error);
          
          // 提取更详细的错误信息
          let errorMessage = '删除文件夹失败';
          
          if (error.response) {
            console.error('错误响应状态:', error.response.status);
            console.error('错误响应数据:', error.response.data);
            
            // 处理重定向错误 (302)
            if (error.response.status === 302) {
              errorMessage = '登录已过期，请重新登录';
              const authStore = window['useAuthStore'] && window['useAuthStore']();
              if (authStore) {
                authStore.removeToken();
                authStore.setLoginDialog && authStore.setLoginDialog(true);
              }
            }
            // 处理认证错误 (401)
            else if (error.response.status === 401) {
              errorMessage = '请先登录后再操作';
              const authStore = window['useAuthStore'] && window['useAuthStore']();
              if (authStore) {
                authStore.removeToken();
                authStore.setLoginDialog && authStore.setLoginDialog(true);
              }
            }
            // 处理权限错误
            else if (error.response.status === 400 && error.response.data?.message?.includes('无权删除')) {
              errorMessage = '您没有权限删除此文件夹，只能删除自己创建的文件夹';
              
              // 获取当前文件夹信息，提供更详细的提示
              const folder = folders.value.find(f => f.id === folderId);
              if (folder) {
                emit('error', `您无法删除"${folder.name}"文件夹，因为它不是由您创建的`);
                return;
              }
            }
            // 处理服务器错误 (400/500等)
            else if (error.response.data && error.response.data.message) {
              errorMessage = error.response.data.message;
            }
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          emit('error', errorMessage);
        } finally {
          loading.value = false;
        }
      }
    });
    return;
  } catch (error) {
    console.error('删除文件夹失败:', error);
    emit('error', '删除文件夹时发生未知错误');
  }
}

// 生命周期钩子
onMounted(() => {
  // 默认加载全部文件夹
  currentFolderId.value = '1';
  loadFolders();
  
  // 在组件初始化时清除sessionStorage中的相关数据
  clearStoredSelections();
  
  // 添加页面卸载和刷新事件监听
  window.addEventListener('beforeunload', clearStoredSelections);
  
  // 返回清理函数
  return () => {
    window.removeEventListener('beforeunload', clearStoredSelections);
  };
});

// 清除保存在sessionStorage中的选择数据
function clearStoredSelections() {
  // 清理所有素材库相关的会话存储
  sessionStorage.removeItem('materialLibrarySelectionType');
  sessionStorage.removeItem('materialSelectionInfo');
  sessionStorage.removeItem('materialLibraryFolderSelection');
  sessionStorage.removeItem('materialLibraryMaterialSelection');
  
  // 重置选择状态
  selectedFolders.value = [];
  selectedMaterials.value = [];
}
</script>

<template>
  <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-2 sm:p-0">
    <div class="w-full max-w-6xl h-[90vh] sm:h-[80vh] flex flex-col bg-white dark:bg-gray-900 rounded-lg overflow-hidden shadow-xl">
      <!-- 头部栏 -->
      <div class="flex justify-between items-center p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center">
          <h3 class="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-200">
            素材库
            <span class="ml-2 text-xs sm:text-sm font-normal text-gray-500 dark:text-gray-400 hidden sm:inline">
              {{ selectionStatusText }}
            </span>
          </h3>
        </div>
        <button 
          @click="closeModal"
          class="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <!-- 移动端显示的选择状态 -->
      <div class="sm:hidden px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-xs">
        {{ selectionStatusText }}
      </div>
      
      <!-- 主体内容 -->
      <div class="flex flex-col md:flex-row flex-1 overflow-hidden">
        <!-- 左侧文件夹列表 -->
        <div class="w-full md:w-64 overflow-y-auto p-4 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700">
          <div class="mb-4">
            <div class="flex justify-between items-center mb-2">
              <h4 class="font-medium text-gray-700 dark:text-gray-300">文件夹</h4>
              <span class="text-xs text-blue-600 dark:text-blue-400">
                (单击选择/浏览)
              </span>
            </div>
            
            <!-- 新建文件夹按钮 -->
            <button 
              @click="createFolderMode = true"
              class="w-full mb-3 px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              新建文件夹
            </button>
            
            <!-- 添加文件夹 -->
            <div v-if="createFolderMode" class="mb-3">
              <div class="flex space-x-2">
                <input 
                  v-model="folderName" 
                  type="text" 
                  placeholder="输入文件夹名称" 
                  class="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:text-gray-200"
                />
                <button 
                  @click="createFolder"
                  class="px-3 py-1.5 text-sm bg-pink-500 hover:bg-pink-600 text-white rounded-md"
                  :disabled="!folderName.trim()"
                  :class="{'opacity-50 cursor-not-allowed': !folderName.trim()}"
                >
                  创建
                </button>
              </div>
              <div class="flex justify-end mt-1">
                <button 
                  @click="createFolderMode = false; folderName = ''"
                  class="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
          
          <!-- 文件夹列表 -->
          <div class="space-y-1 max-h-[30vh] md:max-h-none overflow-y-auto">
            <!-- 全部文件夹选项 - 特殊ID为"1" -->
            <button 
              @click="selectFolder('1')"
              class="w-full text-left px-3 py-2 text-sm rounded-md flex items-center justify-between"
              :class="[
                currentFolderId === '1' ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800',
                isFolderSelected('1') ? 'border-l-4 border-blue-500' : ''
              ]"
            >
              <div class="flex items-center">
                <div 
                  class="mr-2 h-4 w-4 rounded border border-gray-400 flex items-center justify-center" 
                  :class="{ 'bg-blue-500 border-blue-500': isFolderSelected('1') }"
                  @click.stop="toggleFolderSelection('1', $event)"
                >
                  <svg v-if="isFolderSelected('1')" xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                全部文件夹
              </div>
              <span v-if="isFolderSelected('1')" class="text-xs bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-full">
                已选
              </span>
            </button>
            
            <button 
              v-for="folder in folders" 
              :key="folder.id"
              @click="selectFolder(folder.id)"
              class="w-full text-left px-3 py-2 text-sm rounded-md flex items-center justify-between group relative"
              :class="[
                currentFolderId === folder.id ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800',
                isFolderSelected(folder.id) ? 'border-l-4 border-blue-500' : ''
              ]"
            >
              <div class="flex items-center">
                <div 
                  class="mr-2 h-4 w-4 rounded border border-gray-400 flex items-center justify-center" 
                  :class="{ 'bg-blue-500 border-blue-500': isFolderSelected(folder.id) }"
                  @click.stop="toggleFolderSelection(folder.id, $event)"
                >
                  <svg v-if="isFolderSelected(folder.id)" xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <span class="truncate max-w-[120px]">{{ folder.name }}</span>
              </div>
              <div class="flex items-center">
                <span v-if="isFolderSelected(folder.id)" class="text-xs bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-full mr-2">
                  已选
                </span>
                <span class="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-1.5 rounded-full">
                  {{ folder.count }}
                </span>
                <!-- 删除文件夹按钮 -->
                <button 
                  @click.stop="deleteFolder(folder.id)"
                  class="ml-2 p-1 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="删除文件夹"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </button>
          </div>
        </div>
        
        <!-- 右侧素材列表 -->
        <div class="flex-1 flex flex-col overflow-hidden">
          <!-- 工具栏 -->
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border-b border-gray-200 dark:border-gray-600">
            <h4 class="font-medium text-gray-700 dark:text-gray-300 mb-2 sm:mb-0">
              {{ currentFolderName }}
              <span class="block sm:inline text-xs text-gray-500 dark:text-gray-400 mt-1 sm:mt-0 sm:ml-2">
                (已选择 {{ selectedFolders.length }} 个文件夹, {{ selectedMaterials.length }} 个素材)
              </span>
            </h4>
            <div class="flex space-x-2 w-full sm:w-auto">
              <input
                ref="fileInputRef"
                type="file"
                multiple
                accept="image/*"
                class="hidden"
                @change="handleFileUpload"
              />
              <button 
                @click="triggerFileUpload($event)"
                class="w-full sm:w-auto px-3 py-1.5 text-sm bg-pink-500 hover:bg-pink-600 text-white rounded-md flex items-center justify-center"
                :disabled="!currentFolderId || currentFolderId === '1' || uploadLoading"
                :class="{'opacity-50 cursor-not-allowed': !currentFolderId || currentFolderId === '1' || uploadLoading}"
              >
                <svg v-if="!uploadLoading" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <svg v-else class="animate-spin h-4 w-4 mr-1 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {{ uploadLoading ? '上传中...' : '上传素材' }}
              </button>
            </div>
          </div>
          
          <!-- 全部文件夹提示信息 -->
          <div v-if="currentFolderId === '1'" class="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800/30">
            <div class="flex items-center text-blue-600 dark:text-blue-300">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span class="text-sm">当前处于<strong>全部文件夹</strong>视图，您可以浏览所有素材，但要上传素材请从左侧选择一个具体的文件夹</span>
            </div>
          </div>
          
          <!-- 素材网格 -->
          <div class="flex-1 overflow-y-auto p-2 sm:p-4">
            <!-- 已选择状态信息 -->
            <div v-if="selectedFolders.length > 0 || selectedMaterials.length > 0" class="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800/50">
              <div class="flex flex-col">
                <div v-if="selectedFolders.length > 0" class="flex items-center text-blue-600 dark:text-blue-300 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                  <span class="font-medium">已选择 {{ selectedFolders.length }} 个文件夹</span>
                </div>
                
                <div v-if="selectedMaterials.length > 0" class="flex items-center text-pink-600 dark:text-pink-300">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span class="font-medium">已选择 {{ selectedMaterials.length }} 个素材</span>
                </div>
              </div>
            </div>
            
            <!-- 加载中状态 -->
            <div v-if="loading" class="h-full flex items-center justify-center">
              <div class="flex flex-col items-center">
                <div class="h-10 w-10 border-4 border-t-pink-500 rounded-full animate-spin mb-4"></div>
                <p class="text-gray-500 dark:text-gray-400">加载中...</p>
              </div>
            </div>
            
            <!-- 空状态 -->
            <div v-else-if="materials.length === 0 && !loading" class="h-full flex items-center justify-center">
              <div class="text-center p-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p class="text-gray-500 dark:text-gray-400 mb-4">暂无素材</p>
                <button 
                  v-if="currentFolderId && currentFolderId !== '1'"
                  @click="triggerFileUpload"
                  class="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-md inline-flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                  上传素材
                </button>
                
                <!-- 全部文件夹视图提示 -->
                <div v-else-if="currentFolderId === '1'" class="text-gray-500 dark:text-gray-400 mt-2">
                  请选择一个具体的文件夹来上传素材
                </div>
              </div>
            </div>
            
            <!-- 素材列表 -->
            <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
              <div 
                v-for="material in materials" 
                :key="material.id"
                class="relative group aspect-square rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer touch-manipulation"
                :class="{'ring-2 ring-pink-500': isMaterialSelected(material.id)}"
                @click="toggleSelectMaterial(material.id)"
              >
                <!-- 素材状态指示 (过期/有效) -->
                <div 
                  v-if="material.status === 'expired'"
                  class="absolute top-1 left-1 sm:top-2 sm:left-2 z-10 px-1 sm:px-1.5 py-0.5 bg-red-500 text-white text-xs font-medium rounded"
                >
                  已过期
                </div>
                
                <!-- 已上传标识 -->
                <div 
                  class="absolute top-1 left-1 sm:top-2 sm:left-2 z-10 px-1 sm:px-1.5 py-0.5 bg-green-500 text-white text-xs font-medium rounded"
                  v-if="material.status !== 'expired'"
                >
                  已上传
                </div>
                
                <!-- 素材图片 -->
                <img 
                  :src="material.previewUrl" 
                  class="w-full h-full object-cover"
                  :class="{'opacity-70': material.status === 'expired'}"
                  alt="素材图片"
                  loading="lazy"
                />
                
                <!-- 悬停操作层 - 在移动端始终显示半透明操作按钮 -->
                <div class="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center md:opacity-0 opacity-100 md:group-hover:opacity-100 transition-opacity">
                  <div class="flex space-x-2">
                    <!-- 删除按钮 -->
                    <button 
                      @click.stop="deleteMaterialItem(material.id)"
                      class="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full active:scale-95 transition-transform"
                      title="删除素材"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    
                    <!-- 选择/取消选择按钮 -->
                    <button 
                      @click.stop="toggleSelectMaterial(material.id)"
                      :class="isMaterialSelected(material.id) ? 'bg-gray-500 hover:bg-gray-600' : 'bg-pink-500 hover:bg-pink-600'"
                      class="p-2 text-white rounded-full active:scale-95 transition-transform"
                      :title="isMaterialSelected(material.id) ? '取消选择' : '选择素材'"
                    >
                      <svg v-if="isMaterialSelected(material.id)" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <!-- 选中指示器 -->
                <div 
                  v-if="isMaterialSelected(material.id)"
                  class="absolute top-1 right-1 sm:top-2 sm:right-2 h-5 w-5 sm:h-6 sm:w-6 bg-pink-500 rounded-full flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 sm:h-4 sm:w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 底部按钮区域 -->
          <div class="flex justify-end items-center p-3 sm:p-4 border-t border-gray-200 dark:border-gray-700">
            <button 
              @click="closeModal"
              class="flex-1 sm:flex-none px-3 sm:px-4 py-2 mr-2 sm:mr-3 text-sm bg-gray-500 hover:bg-gray-600 text-white rounded-md flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              取消
            </button>
            
            <button 
              @click="confirmSelection"
              class="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm bg-green-500 hover:bg-green-600 text-white rounded-md flex items-center justify-center"
              :disabled="selectedFolders.length === 0 && selectedMaterials.length === 0"
              :class="{'opacity-50 cursor-not-allowed': selectedFolders.length === 0 && selectedMaterials.length === 0}"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              确定选择
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 自定义样式 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 添加错误提示框样式，确保显示在最顶层 */
:deep(.n-dialog) {
  z-index: 99999 !important; /* 非常高的z-index确保在所有元素之上 */
}

:deep(.n-dialog-container) {
  z-index: 99999 !important;
}

:deep(.n-modal-mask) {
  z-index: 99990 !important;
}

/* 使错误提示更醒目 */
:deep(.n-dialog.n-dialog--warning) {
  border: 2px solid #f5a623;
  box-shadow: 0 4px 12px rgba(245, 166, 35, 0.3);
}

/* 移动端优化 */
@media (max-width: 640px) {
  /* 增大移动端点击区域 */
  button {
    min-height: 40px;
    min-width: 40px;
  }
  
  /* 确保移动端的滚动更流畅 */
  .overflow-y-auto {
    -webkit-overflow-scrolling: touch;
    scroll-behavior: smooth;
  }
  
  /* 优化移动端素材卡片 */
  .grid {
    touch-action: manipulation;
  }
}
</style> 