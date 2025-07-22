<script setup lang="ts">
import {
  NButton,
  NCard,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NModal,
  NTable,
  NImage,
  useMessage,
  NPagination,
  NIcon,
  NSpace,
  NPopconfirm,
  NSpin,
  NTag,
  NCode,
  NSwitch,
} from 'naive-ui';
import { h, ref, reactive, onMounted } from 'vue';
import { DeleteOutlined, EditOutlined, PlusOutlined, InboxOutlined, UploadOutlined } from '@vicons/antd';
import { CloudUploadOutline } from '@vicons/ionicons5';
import { 
  getHtmlTemplateList, 
  createHtmlTemplate, 
  updateHtmlTemplate, 
  deleteHtmlTemplate,
  uploadHtmlTemplateThumbnail,
  getHtmlTemplateDetail
} from '@/api/modules/htmllib';

// 定义HTML模板接口
interface HtmlTemplate {
  id: number;
  name: string;
  htmlCode: string;
  imageCount: number;
  textCount: number;
  textDetails: string;
  textDetailsArray: string[];
  thumbnailPath: string;
  status: number;
  usageCount?: number;
  createdAt: string;
  updatedAt: string;
  needAiContent: boolean;
  backgroundImages: string[];
  backgroundImagesArray?: string[];
}

// 表格数据
const templates = ref<HtmlTemplate[]>([]);

// 添加加载状态
const loading = ref(false);

// 添加分页配置
const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  pageSizes: [10, 20, 30, 50]
});

// 消息提示
const message = useMessage();

// 是否显示编辑模态框
const showModal = ref(false);

// 是否显示HTML代码预览模态框
const showHtmlPreview = ref(false);

// 预览中的HTML代码
const previewHtmlCode = ref('');

// 是否是添加操作
const isAdding = ref(true);

// 编辑中的模板数据
const editingTemplate = reactive({
  id: null as number | null,
  name: '',
  htmlCode: '',
  imageCount: 1,
  textDetails: [] as string[],
  thumbnailPath: '',
  status: 1,
  needAiContent: false,
  backgroundImages: [] as string[]
});

// 提交表单加载状态
const submitting = ref(false);

// 预览上传的文件
const filePreview = ref({
  file: null as File | null,
  name: '',
  size: 0
});

// 文本相关变量
const newTextItem = ref('');
const textItems = ref<string[]>([]);

// 文件输入引用
const fileInputRef = ref<HTMLInputElement | null>(null);

// 添加上传进度相关的状态
const uploadProgress = ref(0);
const showProgress = ref(false);

// 添加背景图片URL字段
const newBackgroundUrl = ref('');
const backgroundUrls = ref<string[]>([]);

// 表格列定义
const columns = [
  { title: 'ID', key: 'id', width: 60 },
  { title: '模板名称', key: 'name', width: 160 },
  { 
    title: '缩略图', 
    key: 'thumbnailPath', 
    width: 120,
    render(row: HtmlTemplate) {
      return row.thumbnailPath ? 
        h(NImage, {
          src: row.thumbnailPath,
          width: 80,
          height: 45,
          objectFit: 'contain'
        }) : 
        '无缩略图';
    }
  },
  { title: '图片数量', key: 'imageCount', width: 80 },
  { 
    title: '文本数量', 
    key: 'textCount', 
    width: 80,
    render(row: HtmlTemplate) {
      // 计算实际文本数量
      let count = 0;
      
      // 检查textDetails字段 - 可能是数组或字符串
      if (row.textDetails) {
        // 如果已经是数组，直接使用
        if (Array.isArray(row.textDetails)) {
          count = row.textDetails.length;
        } 
        // 如果是字符串，尝试解析
        else if (typeof row.textDetails === 'string') {
          try {
            // 尝试解析JSON
            const parsed = JSON.parse(row.textDetails);
            if (Array.isArray(parsed)) {
              count = parsed.length;
            }
          } catch (e) {
            // JSON解析失败，尝试按逗号分隔
            const items = row.textDetails.split(',').filter(Boolean);
            count = items.length;
          }
        }
      }
      
      // 兼容旧版本，检查textDetailsArray
      if (count === 0 && row.textDetailsArray && Array.isArray(row.textDetailsArray)) {
        count = row.textDetailsArray.length;
      }
      
      return count;
    }
  },
  {
    title: '背景图片数量', 
    key: 'backgroundCount', 
    width: 100,
    render(row: HtmlTemplate) {
      // 计算背景图片数量
      let count = 0;
      
      // 检查backgroundImages字段
      if (row.backgroundImages) {
        // 如果已经是数组，直接使用
        if (Array.isArray(row.backgroundImages)) {
          count = row.backgroundImages.length;
        } 
        // 如果是字符串，尝试解析
        else if (typeof row.backgroundImages === 'string') {
          try {
            // 尝试解析JSON
            const parsed = JSON.parse(row.backgroundImages);
            if (Array.isArray(parsed)) {
              count = parsed.length;
            }
          } catch (e) {
            // JSON解析失败，设为0
            count = 0;
          }
        }
      }
      
      // 兼容新版本，检查backgroundImagesArray
      if (count === 0 && row.backgroundImagesArray && Array.isArray(row.backgroundImagesArray)) {
        count = row.backgroundImagesArray.length;
      }
      
      return count;
    }
  },
  {
    title: '使用应用工作流',
    key: 'status',
    width: 120,
    render(row: HtmlTemplate) {
      return h(
        NTag,
        {
          type: row.status === 1 ? 'success' : 'error',
          size: 'small'
        },
        { default: () => row.status === 1 ? '启用' : '禁用' }
      );
    }
  },
  {
    title: '创建时间',
    key: 'createdAt',
    width: 180,
    render(row: HtmlTemplate) {
      return new Date(row.createdAt).toLocaleString();
    }
  },
  {
    title: '操作',
    key: 'actions',
    width: 300,
    render(row: HtmlTemplate) {
      return h(
        NSpace,
        { align: 'center', justify: 'center' },
        {
          default: () => [
            h(
              NButton,
              {
                size: 'small',
                type: 'primary',
                onClick: () => handleEdit(row)
              },
              { default: () => '编辑', icon: () => h(EditOutlined) }
            ),
            h(
              NButton,
              {
                size: 'small',
                type: 'info',
                onClick: () => handlePreviewHtml(row.htmlCode)
              },
              { default: () => '预览HTML' }
            ),
            h(
              NPopconfirm,
              {
                onPositiveClick: () => handleDelete(row.id),
                negativeText: '取消',
                positiveText: '确定'
              },
              {
                default: () => '确定删除该模板吗？',
                trigger: () => h(
                  NButton,
                  {
                    size: 'small',
                    type: 'error'
                  },
                  { default: () => '删除', icon: () => h(DeleteOutlined) }
                )
              }
            )
          ]
        }
      );
    }
  }
] as any;

// 加载模板列表
const loadTemplates = async () => {
  loading.value = true;
  try {
    const response = await getHtmlTemplateList({
      page: pagination.page,
      pageSize: pagination.pageSize
    });
    
    // 处理返回的数据
    if (response.data.items && Array.isArray(response.data.items)) {
      // 处理每个模板项
      templates.value = response.data.items.map((item: any) => {
        // 解析textDetails字段，确保前端显示正确
        try {
          if (item.textDetails && typeof item.textDetails === 'string') {
            try {
              // 尝试解析成数组
              const parsed = JSON.parse(item.textDetails);
              // 保存解析结果到textDetailsArray字段
              item.textDetailsArray = Array.isArray(parsed) ? parsed : [];
            } catch (e) {
              // 解析失败，尝试用逗号分隔
              item.textDetailsArray = item.textDetails.split(',').filter(Boolean);
            }
          } else if (Array.isArray(item.textDetails)) {
            // 如果已经是数组，直接使用
            item.textDetailsArray = [...item.textDetails];
          } else {
            // 确保有一个空数组
            item.textDetailsArray = [];
          }
        } catch (e) {
          console.error('解析模板文本详情失败:', e);
          item.textDetailsArray = [];
        }
        
        return item;
      });
    } else {
      templates.value = [];
    }
    
    pagination.itemCount = response.data.total || 0;
  } catch (error) {
    console.error('加载HTML模板列表失败:', error);
    message.error('加载HTML模板列表失败');
  } finally {
    loading.value = false;
  }
};

// 处理页面变化
const handlePageChange = (page: number) => {
  pagination.page = page;
  loadTemplates();
};

// 处理每页条数变化
const handlePageSizeChange = (pageSize: number) => {
  pagination.pageSize = pageSize;
  loadTemplates();
};

// 处理添加按钮点击
const handleAdd = () => {
  isAdding.value = true;
  resetEditingTemplate();
  textItems.value = [];
  showModal.value = true;
};

// 处理编辑按钮点击
const handleEdit = async (template: HtmlTemplate) => {
  isAdding.value = false;
  Object.assign(editingTemplate, template);
  
  try {
    // 尝试使用API获取模板详情，包含可替换文本列表
    try {
      const response = await getHtmlTemplateDetail(template.id);
      if (response.data && response.data.success && response.data.data) {
        // 使用API返回的文本详情
        const apiData = response.data.data;
        if (apiData.textDetails) {
          // 尝试解析textDetails
          if (typeof apiData.textDetails === 'string') {
            try {
              textItems.value = JSON.parse(apiData.textDetails);
            } catch (e) {
              textItems.value = apiData.textDetails.split(',').filter(Boolean);
            }
          } else if (Array.isArray(apiData.textDetails)) {
            textItems.value = apiData.textDetails;
          }
        } else {
          // 回退到本地解析
          parseTextDetails(template);
        }
        
        // 解析背景图片列表
        if (apiData.backgroundImages) {
          if (typeof apiData.backgroundImages === 'string') {
            try {
              backgroundUrls.value = JSON.parse(apiData.backgroundImages);
            } catch (e) {
              backgroundUrls.value = [];
            }
          } else if (Array.isArray(apiData.backgroundImages)) {
            backgroundUrls.value = apiData.backgroundImages;
          } else if (apiData.backgroundImagesArray && Array.isArray(apiData.backgroundImagesArray)) {
            backgroundUrls.value = apiData.backgroundImagesArray;
          } else {
            backgroundUrls.value = [];
          }
        } else {
          backgroundUrls.value = [];
        }
      } else {
        // 回退到本地解析
        parseTextDetails(template);
        parseBackgroundImages(template);
      }
    } catch (error) {
      console.error('获取模板详情失败，回退到本地解析:', error);
      // 回退到本地解析
      parseTextDetails(template);
      parseBackgroundImages(template);
    }
  } catch (e) {
    console.error('解析文本详情失败:', e);
    textItems.value = [];
    backgroundUrls.value = [];
  }
  
  showModal.value = true;
};

// 本地解析文本详情的辅助方法
const parseTextDetails = (template: HtmlTemplate) => {
  // 检查是否已有预处理的数据
  if (template.textDetailsArray && Array.isArray(template.textDetailsArray)) {
    textItems.value = [...template.textDetailsArray];
    return;
  }
  
  // 处理textDetails字段
  if (template.textDetails) {
    // 判断类型并处理
    if (Array.isArray(template.textDetails)) {
      // 如果已经是数组，直接使用
      textItems.value = [...template.textDetails];
    } else if (typeof template.textDetails === 'string') {
      // 尝试解析JSON格式
      try {
        const parsedDetails = JSON.parse(template.textDetails);
        if (Array.isArray(parsedDetails)) {
          textItems.value = parsedDetails;
        } else {
          textItems.value = [];
        }
      } catch (e) {
        // 如果JSON解析失败，尝试逗号分隔
        textItems.value = template.textDetails.split(',').map(item => item.trim()).filter(Boolean);
      }
    } else {
      // 其他情况，设为空数组
      textItems.value = [];
    }
  } else {
    // 没有文本详情，设为空数组
    textItems.value = [];
  }
};

// 本地解析背景图片的辅助方法
const parseBackgroundImages = (template: HtmlTemplate) => {
  // 检查是否已有预处理的数据
  if (template.backgroundImagesArray && Array.isArray(template.backgroundImagesArray)) {
    backgroundUrls.value = [...template.backgroundImagesArray];
    return;
  }
  
  // 处理backgroundImages字段
  if (template.backgroundImages) {
    // 判断类型并处理
    if (Array.isArray(template.backgroundImages)) {
      // 如果已经是数组，直接使用
      backgroundUrls.value = [...template.backgroundImages];
    } else if (typeof template.backgroundImages === 'string') {
      // 尝试解析JSON格式
      try {
        const parsedImages = JSON.parse(template.backgroundImages);
        if (Array.isArray(parsedImages)) {
          backgroundUrls.value = parsedImages;
        } else {
          backgroundUrls.value = [];
        }
      } catch (e) {
        // 如果JSON解析失败，设为空数组
        backgroundUrls.value = [];
      }
    } else {
      // 其他情况，设为空数组
      backgroundUrls.value = [];
    }
  } else {
    // 没有背景图片，设为空数组
    backgroundUrls.value = [];
  }
};

// 处理删除
const handleDelete = async (id: number) => {
  try {
    await deleteHtmlTemplate(id);
    message.success('删除成功');
    loadTemplates();
  } catch (error) {
    console.error('删除失败:', error);
    message.error('删除失败');
  }
};

// 预览HTML代码
const handlePreviewHtml = (htmlCode: string) => {
  previewHtmlCode.value = htmlCode;
  showHtmlPreview.value = true;
};

// 重置编辑模板数据
const resetEditingTemplate = () => {
  editingTemplate.id = null;
  editingTemplate.name = '';
  editingTemplate.htmlCode = '';
  editingTemplate.imageCount = 1;
  editingTemplate.textDetails = [];
  editingTemplate.thumbnailPath = '';
  editingTemplate.status = 1;
  editingTemplate.needAiContent = false;
  editingTemplate.backgroundImages = [];
  
  // 清空文件预览
  filePreview.value = {
    file: null,
    name: '',
    size: 0
  };
  
  // 重置文本项和背景图片URL
  textItems.value = [];
  backgroundUrls.value = [];
  
  // 重置上传进度
  uploadProgress.value = 0;
  showProgress.value = false;
};

// 添加文本项
const handleAddTextItem = () => {
  if (newTextItem.value.trim()) {
    textItems.value.push(newTextItem.value.trim());
    newTextItem.value = ''; 
  }
};

// 删除文本项
const handleRemoveTextItem = (index: number) => {
  textItems.value.splice(index, 1);
};

// 触发文件输入
const triggerFileInput = () => {
  if (fileInputRef.value) {
    fileInputRef.value.click();
  }
};

// 处理文件变化
const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    const file = target.files[0];
    filePreview.value = {
      file,
      name: file.name,
      size: Math.round(file.size / 1024) // KB
    };
  }
};

// 清除已选文件
const clearSelectedFile = () => {
  filePreview.value = {
    file: null,
    name: '',
    size: 0
  };
  
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
};

// 处理拖拽相关事件
const handleDragOver = (e: DragEvent) => {
  e.preventDefault();
};

const handleDragEnter = (e: DragEvent) => {
  e.preventDefault();
};

const handleDragLeave = (e: DragEvent) => {
  e.preventDefault();
};

const handleDrop = (e: DragEvent) => {
  e.preventDefault();
  
  if (e.dataTransfer && e.dataTransfer.files.length > 0) {
    const file = e.dataTransfer.files[0];
    
    // 检查文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      message.error('请上传图片格式文件 (JPG, PNG, GIF)');
      return;
    }
    
    filePreview.value = {
      file,
      name: file.name,
      size: Math.round(file.size / 1024) // KB
    };
  }
};

// 上传缩略图
const uploadThumbnail = async () => {
  if (!filePreview.value.file) {
    return null;
  }
  
  showProgress.value = true;
  uploadProgress.value = 0;
  
  try {
    const response = await uploadHtmlTemplateThumbnail(
      filePreview.value.file,
      (progressEvent) => {
        if (progressEvent.total) {
          uploadProgress.value = Math.round((progressEvent.loaded / progressEvent.total) * 100);
        }
      }
    );
    
    return response.data.data.thumbnailPath;
  } catch (error) {
    console.error('上传缩略图失败:', error);
    message.error('上传缩略图失败');
    return null;
  } finally {
    showProgress.value = false;
  }
};

// 添加背景图片URL
const handleAddBackgroundUrl = () => {
  if (newBackgroundUrl.value.trim()) {
    backgroundUrls.value.push(newBackgroundUrl.value.trim());
    newBackgroundUrl.value = ''; 
  }
};

// 删除背景图片URL
const handleRemoveBackgroundUrl = (index: number) => {
  backgroundUrls.value.splice(index, 1);
};

// 提交表单
const handleSubmit = async () => {
  // 表单验证
  if (!editingTemplate.name) {
    message.error('请填写模板名称');
    return;
  }
  
  if (!editingTemplate.htmlCode) {
    message.error('请填写HTML代码');
    return;
  }
  
  submitting.value = true;
  
  try {
    // 如果有新上传的缩略图，先上传
    let thumbnailPath = editingTemplate.thumbnailPath;
    if (filePreview.value.file) {
      thumbnailPath = await uploadThumbnail();
      if (!thumbnailPath) {
        submitting.value = false;
        return;
      }
    }
    
    // 检查文本项是否包含空值或重复值
    const validTextItems = textItems.value.filter(item => item.trim()).map(item => item.trim());
    const uniqueTextItems = [...new Set(validTextItems)];
    
    if (validTextItems.length !== textItems.value.length) {
      message.warning('已自动移除空白文本项');
    }
    
    if (uniqueTextItems.length !== validTextItems.length) {
      message.warning('已自动移除重复文本项');
    }
    
    // 更新文本项数组
    textItems.value = uniqueTextItems;
    
    // 检查背景图片URL是否包含空值或重复值
    const validBackgroundUrls = backgroundUrls.value.filter(url => url.trim()).map(url => url.trim());
    const uniqueBackgroundUrls = [...new Set(validBackgroundUrls)];
    
    if (validBackgroundUrls.length !== backgroundUrls.value.length) {
      message.warning('已自动移除空白背景图片URL');
    }
    
    if (uniqueBackgroundUrls.length !== validBackgroundUrls.length) {
      message.warning('已自动移除重复背景图片URL');
    }
    
    // 更新背景图片URL数组
    backgroundUrls.value = uniqueBackgroundUrls;
    
    // 创建API需要的参数对象
    if (isAdding.value) {
      // 创建新模板
      const createParams = {
        name: editingTemplate.name,
        htmlCode: editingTemplate.htmlCode,
        imageCount: editingTemplate.imageCount,
        thumbnailPath: thumbnailPath,
        textDetails: uniqueTextItems, // 直接使用数组
        backgroundImages: uniqueBackgroundUrls, // 直接使用数组
        status: editingTemplate.status,
        needAiContent: editingTemplate.needAiContent
      };
      
      await createHtmlTemplate(createParams);
      message.success('添加成功');
    } else {
      // 更新现有模板
      if (editingTemplate.id === null) {
        message.error('模板ID不能为空');
        submitting.value = false;
        return;
      }
      
      const updateParams = {
        id: editingTemplate.id,
        name: editingTemplate.name,
        htmlCode: editingTemplate.htmlCode,
        imageCount: editingTemplate.imageCount,
        thumbnailPath: thumbnailPath,
        textDetails: uniqueTextItems, // 直接使用数组
        backgroundImages: uniqueBackgroundUrls, // 直接使用数组
        status: editingTemplate.status,
        needAiContent: editingTemplate.needAiContent
      };
      
      await updateHtmlTemplate(updateParams);
      message.success('更新成功');
    }
    
    // 关闭模态框并重新加载列表
    showModal.value = false;
    loadTemplates();
  } catch (error: any) {
    console.error('保存HTML模板失败:', error);
    // 检查是否是超时错误
    if (error.code === 'ECONNABORTED' || (error.message && error.message.includes('timeout'))) {
      message.error('上传超时，请尝试减小文件大小');
    } else {
      message.error(isAdding.value ? '添加失败' : '更新失败');
    }
  } finally {
    submitting.value = false;
  }
};

// 计算模板的文本数量
const getTextCount = (item: HtmlTemplate): number => {
  // 计算实际文本数量
  let count = 0;
  
  // 检查textDetails字段 - 可能是数组或字符串
  if (item.textDetails) {
    // 如果已经是数组，直接使用
    if (Array.isArray(item.textDetails)) {
      count = item.textDetails.length;
    } 
    // 如果是字符串，尝试解析
    else if (typeof item.textDetails === 'string') {
      try {
        // 尝试解析JSON
        const parsed = JSON.parse(item.textDetails);
        if (Array.isArray(parsed)) {
          count = parsed.length;
        }
      } catch (e) {
        // JSON解析失败，尝试按逗号分隔
        const items = item.textDetails.split(',').filter(Boolean);
        count = items.length;
      }
    }
  }
  
  // 兼容旧版本，检查textDetailsArray
  if (count === 0 && item.textDetailsArray && Array.isArray(item.textDetailsArray)) {
    count = item.textDetailsArray.length;
  }
  
  return count;
};

// 计算模板的背景图片数量
const getBackgroundCount = (item: HtmlTemplate): number => {
  // 计算背景图片数量
  let count = 0;
  
  // 检查backgroundImages字段
  if (item.backgroundImages) {
    // 如果已经是数组，直接使用
    if (Array.isArray(item.backgroundImages)) {
      count = item.backgroundImages.length;
    } 
    // 如果是字符串，尝试解析
    else if (typeof item.backgroundImages === 'string') {
      try {
        // 尝试解析JSON
        const parsed = JSON.parse(item.backgroundImages);
        if (Array.isArray(parsed)) {
          count = parsed.length;
        }
      } catch (e) {
        // JSON解析失败，设为0
        count = 0;
      }
    }
  }
  
  // 兼容新版本，检查backgroundImagesArray
  if (count === 0 && item.backgroundImagesArray && Array.isArray(item.backgroundImagesArray)) {
    count = item.backgroundImagesArray.length;
  }
  
  return count;
};

// 组件挂载时加载数据
onMounted(() => {
  loadTemplates();
});
</script>

<template>
  <div class="container">
    <NCard title="HTML模板库" class="mb-4">
      <template #header-extra>
        <NButton type="primary" @click="handleAdd">
          <template #icon>
            <NIcon><PlusOutlined /></NIcon>
          </template>
          添加HTML模板
        </NButton>
      </template>
      
      <NTable striped :loading="loading">
        <thead>
          <tr>
            <th v-for="column in columns" :key="column.key" :style="{ width: column.width + 'px' }">
              {{ column.title }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in templates" :key="item.id">
            <td>{{ item.id }}</td>
            <td>{{ item.name }}</td>
            <td>
              <NImage 
                v-if="item.thumbnailPath" 
                :src="item.thumbnailPath" 
                width="80" 
                height="45" 
                object-fit="contain"
              />
              <span v-else>无</span>
            </td>
            <td>{{ item.imageCount }}</td>
            <td>
              <!-- 文本数量 -->
              {{ getTextCount(item) }}
            </td>
            <td>
              <!-- 背景图片数量 -->
              {{ getBackgroundCount(item) }}
            </td>
            <td>
              <NTag :type="item.status === 1 ? 'success' : 'error'" size="small">
                {{ item.status === 1 ? '启用' : '禁用' }}
              </NTag>
            </td>
            <td>{{ new Date(item.createdAt).toLocaleString() }}</td>
            <td>
              <NSpace>
                <NButton size="small" type="primary" @click="handleEdit(item)">
                  <template #icon>
                    <NIcon><EditOutlined /></NIcon>
                  </template>
                  编辑
                </NButton>
                <NButton size="small" type="info" @click="handlePreviewHtml(item.htmlCode)">
                  预览HTML
                </NButton>
                <NPopconfirm
                  @positive-click="handleDelete(item.id)"
                  negative-text="取消"
                  positive-text="确定"
                >
                  <template #trigger>
                    <NButton size="small" type="error">
                      <template #icon>
                        <NIcon><DeleteOutlined /></NIcon>
                      </template>
                      删除
                    </NButton>
                  </template>
                  确定删除该模板吗？
                </NPopconfirm>
              </NSpace>
            </td>
          </tr>
          <tr v-if="templates.length === 0">
            <td :colspan="columns.length" class="text-center py-4">暂无数据</td>
          </tr>
        </tbody>
      </NTable>
      
      <!-- 添加分页组件 -->
      <div class="pagination-container">
        <NPagination
          v-model:page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :item-count="pagination.itemCount"
          :page-sizes="pagination.pageSizes"
          @update:page="handlePageChange"
          @update:page-size="handlePageSizeChange"
          show-size-picker
          show-quick-jumper
        />
      </div>
    </NCard>

    <!-- 编辑模态框 -->
    <NModal v-model:show="showModal" :title="isAdding ? '添加HTML模板' : '编辑HTML模板'" preset="card" style="width: 700px">
      <NSpin :show="submitting">
        <NForm label-placement="left" label-width="120" require-mark-placement="right-hanging">
          <NFormItem label="模板名称" required>
            <NInput v-model:value="editingTemplate.name" placeholder="请输入模板名称" style="max-width: 350px;" />
          </NFormItem>
          
          <NFormItem label="HTML代码" required>
            <NInput 
              v-model:value="editingTemplate.htmlCode" 
              type="textarea" 
              placeholder="请输入HTML代码" 
              :autosize="{ minRows: 6, maxRows: 15 }" 
              style="width: 100%; font-family: monospace;" 
            />
          </NFormItem>
          
          <NFormItem label="可替换图片数">
            <NInputNumber v-model:value="editingTemplate.imageCount" :min="0" />
          </NFormItem>
          
          <NFormItem label="文本项列表">
            <div class="text-items-container">
              <div class="text-description mb-2">
                <p>输入模板中需要替换的原始文本，系统将直接根据这些文本进行精确匹配和替换</p>
              </div>
              
              <div class="text-items-input mb-2">
                <NInput v-model:value="newTextItem" placeholder="请输入需要替换的原始文本" style="width: 200px;" />
                <NButton type="primary" size="small" @click="handleAddTextItem" class="ml-2">添加</NButton>
              </div>
              
              <div class="text-items-list">
                <div v-if="textItems.length === 0" class="empty-text-items">暂无文本项，请添加需要替换的文本</div>
                <div v-for="(item, index) in textItems" :key="index" class="text-item">
                  <span>{{ item }}</span>
                  <NButton size="small" type="error" @click="handleRemoveTextItem(index)">删除</NButton>
                </div>
              </div>
              <div class="text-count mt-2">当前文本数量: {{ textItems.length }}</div>
            </div>
          </NFormItem>
          
          <NFormItem label="背景图片列表">
            <div class="background-images-container">
              <div class="background-description mb-2">
                <p>添加可选的背景图片URL列表，用户可从中选择一个作为背景图片</p>
              </div>
              
              <div class="background-images-input mb-2">
                <NInput v-model:value="newBackgroundUrl" placeholder="请输入背景图片URL" style="width: 300px;" />
                <NButton type="primary" size="small" @click="handleAddBackgroundUrl" class="ml-2">添加</NButton>
              </div>
              
              <div class="background-images-list">
                <div v-if="backgroundUrls.length === 0" class="empty-background-images">暂无背景图片，请添加图片URL</div>
                <div v-for="(url, index) in backgroundUrls" :key="index" class="background-image-item">
                  <div class="background-image-preview">
                    <NImage :src="url" width="80" height="45" object-fit="contain" />
                    <span class="background-url-text">{{ url }}</span>
                  </div>
                  <NButton size="small" type="error" @click="handleRemoveBackgroundUrl(index)">删除</NButton>
                </div>
              </div>
              <div class="background-count mt-2">当前背景图片数量: {{ backgroundUrls.length }}</div>
            </div>
          </NFormItem>
          
          <NFormItem label="缩略图">
            <!-- 隐藏的文件输入框 -->
            <input 
              type="file" 
              ref="fileInputRef" 
              style="display: none;"
              accept="image/*" 
              @change="handleFileChange"
            />
            
            <!-- 自定义上传区域 -->
            <div 
              class="upload-area"
              @click="triggerFileInput"
              @dragover="handleDragOver"
              @dragenter="handleDragEnter"
              @dragleave="handleDragLeave"
              @drop="handleDrop"
            >
              <div v-if="filePreview.file" class="file-preview">
                <div class="file-info">
                  <NIcon size="24" class="file-icon"><UploadOutlined /></NIcon>
                  <div class="file-name">{{ filePreview.name }} ({{ filePreview.size }}KB)</div>
                </div>
                <NButton size="small" type="error" @click.stop="clearSelectedFile">移除</NButton>
              </div>
              
              <div v-else-if="editingTemplate.thumbnailPath && !isAdding" class="existing-file">
                <NImage :src="editingTemplate.thumbnailPath" width="200" height="120" object-fit="contain" />
              </div>
              
              <div v-else class="upload-placeholder">
                <NIcon size="48" class="upload-icon"><CloudUploadOutline /></NIcon>
                <div class="upload-text">点击或拖动文件到此区域选择</div>
                <div class="upload-hint">支持JPG, PNG, GIF格式图片，文件将在点击保存按钮后上传</div>
              </div>
            </div>
          </NFormItem>
          
          <NFormItem label="使用应用工作流">
            <NSwitch v-model:value="editingTemplate.status" :checked-value="1" :unchecked-value="0">
              <template #checked>启用</template>
              <template #unchecked>禁用</template>
            </NSwitch>
          </NFormItem>
          
          <NFormItem label="需要AI补充文案">
            <NSwitch v-model:value="editingTemplate.needAiContent" :checked-value="true" :unchecked-value="false">
              <template #checked>是</template>
              <template #unchecked>否</template>
            </NSwitch>
            <div class="text-hint">
              当启用此选项时，在用户未提供文本替换内容时，将自动使用AI生成内容
            </div>
          </NFormItem>
        </NForm>
        
        <div style="display: flex; justify-content: flex-end; margin-top: 20px;">
          <NButton @click="showModal = false" class="mr-2">取消</NButton>
          <NButton type="primary" @click="handleSubmit" :loading="submitting">确定</NButton>
        </div>
      </NSpin>
    </NModal>
    
    <!-- HTML预览模态框 -->
    <NModal v-model:show="showHtmlPreview" title="HTML代码预览" preset="card" style="width: 800px">
      <div class="html-preview">
        <NCode :code="previewHtmlCode" language="html" show-line-numbers style="max-height: 400px; overflow: auto;" />
        
        <div class="html-preview-iframe-container">
          <div class="html-preview-title">效果预览</div>
          <iframe 
            class="html-preview-iframe"
            sandbox="allow-same-origin allow-scripts"
            :srcdoc="previewHtmlCode"
          ></iframe>
        </div>
      </div>
      
      <div style="display: flex; justify-content: flex-end; margin-top: 20px;">
        <NButton @click="showHtmlPreview = false">关闭</NButton>
      </div>
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

.mr-2 {
  margin-right: 8px;
}

.ml-2 {
  margin-left: 8px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.upload-area {
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  min-height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.upload-area:hover {
  border-color: #18a058;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.upload-icon {
  color: #999;
  margin-bottom: 8px;
}

.upload-text {
  font-size: 16px;
  margin-bottom: 8px;
}

.upload-hint {
  font-size: 14px;
  color: #999;
}

.file-preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.file-info {
  display: flex;
  align-items: center;
}

.file-icon {
  margin-right: 8px;
  color: #18a058;
}

.file-name {
  font-size: 14px;
  word-break: break-word;
}

.existing-file {
  padding: 10px;
  border-radius: 8px;
  background-color: #f7f7f9;
}

.text-items-container,
.background-images-container {
  display: flex;
  flex-direction: column;
}

.text-items-input,
.background-images-input {
  display: flex;
  align-items: center;
}

.text-items-list,
.background-images-list {
  margin-top: 8px;
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 8px;
  min-height: 100px;
  max-height: 200px;
  overflow-y: auto;
}

.text-item,
.background-image-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px;
  border-bottom: 1px solid #f0f0f0;
}

.background-image-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: 500px;
  overflow: hidden;
}

.background-url-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 380px;
}

.text-item:last-child,
.background-image-item:last-child {
  border-bottom: none;
}

.empty-text-items,
.empty-background-images {
  color: #999;
  text-align: center;
  padding: 20px 0;
}

.html-preview {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.html-preview-iframe-container {
  margin-top: 16px;
  border: 1px solid #eee;
  border-radius: 4px;
}

.html-preview-title {
  padding: 8px 16px;
  font-weight: bold;
  background-color: #f7f7f9;
  border-bottom: 1px solid #eee;
}

.html-preview-iframe {
  width: 100%;
  height: 300px;
  border: none;
}

.mt-2 {
  margin-top: 8px;
}

.text-count,
.background-count {
  font-size: 14px;
  color: #666;
  text-align: right;
}
</style> 