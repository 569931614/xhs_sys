// 定义活动接口
export interface Activity {
  id: string;
  name: string;
  type: string;
  status: string;
  isDefault: boolean;
  totalNotes: number;
  availableNotes: number;
  publishedNotes: number;
}

// 定义上传文件接口
export interface UploadedFile {
  id: string; // 文件唯一ID
  fileId: string; // 从服务器返回的file_id
  name: string; // 文件名
  previewUrl: string; // 本地预览URL
  size: number; // 文件大小
  type: string; // 文件类型
  status: 'uploading' | 'success' | 'error'; // 上传状态
  error?: string; // 错误信息
}

// 素材接口
export interface Material {
  id: string; // 素材ID
  fileId: string; // 从服务器返回的file_id
  cozeFileId: string; // 从Coze返回的file_id
  name: string; // 文件名
  previewUrl: string; // 预览URL
  size: number; // 文件大小
  type: string; // 文件类型
  folderId: string; // 所属文件夹ID
  uploadTime: string; // 上传时间
  expiryTime: string; // 过期时间 (Coze文件的过期时间)
  status: 'valid' | 'expired'; // 素材状态
}

// 素材文件夹接口
export interface MaterialFolder {
  id: string; // 文件夹ID
  name: string; // 文件夹名称
  createTime: string; // 创建时间
  updateTime: string; // 更新时间
  count: number; // 素材数量
}

// 素材库接口
export interface MaterialLibrary {
  folders: MaterialFolder[]; // 文件夹列表
  materials: Material[]; // 素材列表
}

// 定义任务接口
export interface Task {
  id: string;
  brandProduct: string;
  title: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  createTime: string;
  updateTime: string;
  executeId?: string;
  activityId?: string; // 添加活动ID字段
  result?: any;
  error?: string;
  noteId?: string;
  batchId?: string; // 添加批量任务相关字段
  batchCount?: number; // 添加批量任务相关字段
  batchIndex?: number; // 添加批量任务相关字段
  textShareLink?: string;
  qrLoadFailed?: boolean;
  qrCodeType?: 'note' | 'activity'; // 二维码类型，区分笔记二维码和活动二维码
}

// 定义任务组接口
export interface TaskGroup {
  brandProduct: string;
  createTime: string;
  tasks: Task[];
}

// 定义笔记接口
export interface Note {
  title: string;
  content: string;
  noteId?: string;
  images?: string[];
  qrCode?: string;
}

// 定义表单数据接口
export interface ProductForm {
  brandProduct: string;
  title: string;
  titles: string[];
  activityId: string;
  materials: string[];
  batchCount: string;
  templateIds?: string[];
  information?: string; // 添加补充信息字段
}

// 定义批次状态
export type BatchStatus = 'pending' | 'running' | 'completed' | 'failed' | 'mixed';

// 定义批次完成状态
export interface BatchCompletionStatus {
  total: number;
  completed: number;
  failed: number;
  inProgress: number;
} 