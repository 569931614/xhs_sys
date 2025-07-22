<template>
  <div class="h-full w-full relative overflow-hidden flex flex-col bg-white dark:bg-gray-900">
    <!-- 状态通知 -->
    <StatusNotification
      :message="statusMessage"
      :type="statusType"
      @clear="clearStatusMessage"
    />
    
    <!-- 主页面内容 -->
    <div class="flex-1 overflow-auto p-4 sm:p-6 md:p-8">
      <div class="max-w-4xl mx-auto">
        <!-- 页面标题 -->
        <div class="mb-8 text-center">
          <h1 class="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-200 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mr-2 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            AI智能生成小红书笔记，快速打造品牌爆款内容
          </h1>
        </div>
        
        <!-- 产品表单 -->
        <form @submit.prevent="submitForm" class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <!-- 品牌产品输入 -->
          <BrandProductInput v-model="productForm.brandProduct" />
          
          <!-- 选题管理 -->
          <TitleManager
            v-model="productForm.titles"
            @request-ai-topic="showAiTopicGenModal = true"
          />
          
          <!-- 模板选择按钮 -->
          <div class="mb-6">
            <button
              type="button"
              @click="openTemplateMarket"
              class="w-full px-4 py-3 border border-pink-300 bg-pink-50 dark:bg-pink-900/20 dark:border-pink-800/40 text-pink-700 dark:text-pink-300 rounded-md hover:bg-pink-100 dark:hover:bg-pink-900/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 transform active:scale-95 flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              从笔记模板市场选择模板
            </button>
          </div>
          
          <!-- 模板显示组件 -->
          <TemplateDisplay
            v-if="showTemplates"
            :templates="selectedTemplates"
            @close="selectedTemplates = []"
            @remove="removeTemplate"
          />
          
          <!-- 活动管理 -->
          <ActivityManager
            v-model="productForm.activityId"
            @error="handleError"
            ref="activityManagerRef"
          />
          
          <!-- 补充信息 -->
          <AdditionalInformation
            v-model="productForm.information"
          />
          
          <!-- 文件上传 -->
          <FileUploader
            :max-file-count="maxFileCount"
            :product-form="productForm"
            :uploaded-files="uploadedFiles"
            :selected-material-folders="selectedLibraryMaterials"
            :selected-folder-names="selectedFolderNames"
            :material-names="materialNames"
            :folder-ids="folderIds"
            :folder-names="folderNames"
            @update:uploaded-files="uploadedFiles = $event"
            @update:product-form="handleProductFormUpdate"
            @update:selected-material-folders="selectedLibraryMaterials = $event"
            @update:selected-folder-names="selectedFolderNames = $event"
            @update:material-names="materialNames = $event"
            @update:folder-ids="folderIds = $event"
            @update:folder-names="folderNames = $event"
            @show-status-message="showStatusMessage"
            @openMaterialLibrary="showMaterialLibrary = true"
          >
            <!-- 素材库按钮插槽 -->
            <template #actions>
              <!-- 这个插槽内容可以移除，因为已经直接在FileUploader组件中添加了素材库按钮 -->
            </template>
          </FileUploader>
          
          <!-- 批量设置 -->
          <BatchSettings v-model="productForm.batchCount" />
          
          <!-- 提交按钮 -->
          <div class="mt-8 flex flex-col sm:flex-row sm:justify-between items-center space-y-3 sm:space-y-0">
            <button
              type="submit"
              class="w-full sm:w-auto sm:min-w-[180px] px-6 py-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-md hover:from-pink-600 hover:to-pink-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 active:from-pink-700 active:to-pink-800 transform active:scale-95 flex items-center justify-center"
              :disabled="submitting"
            >
              <span v-if="!submitting" class="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                {{ Number(productForm.batchCount) > 1 ? `批量生成${productForm.batchCount}篇笔记` : '生成笔记' }}
              </span>
              <span v-else class="flex items-center">
                <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                处理中...
              </span>
            </button>
            
            <button
              type="button"
              @click="resetForm"
              class="w-full sm:w-auto px-6 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-700 transform active:scale-95 flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              重置表单
            </button>
          </div>
        </form>
        
        <!-- 任务列表 -->
        <TaskList
          :auto-refresh-enabled="true"
          @view-note-detail="handleViewNoteDetail"
          @view-activity="handleViewActivity"
          @view-qr-code="handleViewQrCode"
          @view-activity-qr-code="handleViewActivityQrCode"
          @edit-note="handleEditNote"
          @retry-task="handleRetryTask"
          @error="handleError"
          ref="taskListRef"
          :tasks="[]"
          :activities="activities"
          :loading-tasks="false"
        />
      </div>
    </div>
    
    <!-- 平台选择弹窗 -->
    <div v-if="showPlatformSelector" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-md">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-bold text-gray-800 dark:text-gray-200">
            选择发布平台
          </h3>
          <button
            type="button"
            @click="showPlatformSelector = false"
            class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div class="grid grid-cols-1 gap-4 mb-4">
          <button
            type="button"
            @click="generateActivityQrCode('all')"
            class="flex items-center justify-center p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
          >
            <div class="flex flex-col items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mb-2 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              <span class="font-medium text-gray-800 dark:text-gray-200">全平台发布</span>
              <span class="text-xs text-gray-500 dark:text-gray-400 mt-1">不区分平台，所有笔记均可查看</span>
            </div>
          </button>
          
          <button
            type="button"
            @click="generateActivityQrCode('xhs')"
            class="flex items-center justify-center p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
          >
            <div class="flex flex-col items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mb-2 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span class="font-medium text-gray-800 dark:text-gray-200">小红书发布</span>
              <span class="text-xs text-gray-500 dark:text-gray-400 mt-1">仅显示小红书平台笔记</span>
            </div>
          </button>
          
          <button
            type="button"
            @click="generateActivityQrCode('douyin')"
            class="flex items-center justify-center p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
          >
            <div class="flex flex-col items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mb-2 text-black dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span class="font-medium text-gray-800 dark:text-gray-200">抖音发布</span>
              <span class="text-xs text-gray-500 dark:text-gray-400 mt-1">仅显示抖音平台笔记</span>
            </div>
          </button>
        </div>
      </div>
    </div>
    
    <!-- 模态框组件 -->
    <ModalDialogs
      ref="modalDialogsRef"
      :showQrModal="showQrModal"
      :currentQrUrl="currentQrUrl"
      :currentQrTask="currentQrTask"
      :showNoteDetailModal="showNoteDetailModal"
      :currentNoteId="currentNoteId"
      :noteDetailLoading="noteDetailLoading"
      :noteDetailError="noteDetailError"
      @close-qr-modal="closeQrModal"
      @close-note-detail-modal="closeNoteDetailModal"
      @view-note-detail="handleViewNoteDetail"
      @iframe-loaded="handleIframeLoaded"
      @iframe-error="handleIframeError"
      @error="handleError"
      @qr-load-error="handleQrLoadError"
      @change-platform="handlePlatformChange"
      @share-to-xhs="shareToXhs"
    />
    
    <!-- 笔记详情弹窗 -->
    <div v-if="showNoteDetailModal" class="fixed inset-0 z-[990] flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
      <div class="w-[700px] h-[800px] max-w-[90vw] max-h-[90vh] flex flex-col bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-xl">
        <!-- 头部栏 -->
        <div class="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <h3 class="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            笔记详情
          </h3>
          <div class="flex space-x-2">
            <button
              type="button"
              @click="closeNoteDetailModal"
              class="p-2 text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-600"
              title="关闭"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <!-- 内容区域 -->
        <div class="flex-grow relative overflow-auto bg-white dark:bg-gray-800">
          <!-- 加载状态 -->
          <div v-if="noteDetailLoading" class="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 dark:bg-gray-800 dark:bg-opacity-80 z-10">
            <div class="flex flex-col items-center">
              <div class="h-10 w-10 border-4 border-t-pink-500 rounded-full animate-spin mb-4"></div>
              <p class="text-gray-700 dark:text-gray-200">笔记加载中...</p>
            </div>
          </div>
          
          <!-- 错误状态 -->
          <div v-else-if="noteDetailError" class="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 dark:bg-gray-800 dark:bg-opacity-80 z-10">
            <div class="text-center p-4 rounded-lg bg-white dark:bg-gray-700 max-w-md shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p class="text-gray-700 dark:text-gray-200 mb-4">{{ noteDetailError }}</p>
              <button
                type="button"
                @click="closeNoteDetailModal"
                class="px-4 py-2 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 transition-all duration-200"
              >
                关闭
              </button>
            </div>
          </div>
          
          <!-- 笔记内容 -->
          <div v-else class="p-6 text-gray-700 dark:text-gray-200">
            <!-- 笔记标题 -->
            <h2 class="text-2xl font-bold mb-4 text-gray-800 dark:text-pink-300">{{ currentNoteDetail.title || '无标题' }}</h2>
            
            <!-- 视频类型笔记展示 -->
            <div v-if="currentNoteDetail.type === 'video'" class="mb-6">
              <!-- 视频封面 -->
              <div v-if="currentNoteDetail.cover" class="relative overflow-hidden rounded-lg border border-gray-100 dark:border-gray-600 shadow-sm mb-4 cursor-pointer" @click="showImagePreview(currentNoteDetail.cover)">
                <div class="aspect-[16/9] relative">
                  <img :src="currentNoteDetail.cover" alt="视频封面" class="w-full h-full object-cover" />
                  <div class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-white opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <!-- 视频播放器 -->
              <div v-if="currentNoteDetail.video" class="mb-4 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-600 shadow-sm">
                <video 
                  controls 
                  class="w-full h-auto"
                  preload="metadata"
                >
                  <source :src="currentNoteDetail.video" type="video/mp4">
                  您的浏览器不支持视频播放
                </video>
              </div>
              
              <!-- 视频注明 -->
              <div class="text-sm text-gray-500 dark:text-gray-400 mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                视频类型笔记
              </div>
            </div>
            
            <!-- 图文类型笔记展示 -->
            <div v-else-if="currentNoteDetail.images && currentNoteDetail.images.length > 0" class="mb-6 grid grid-cols-2 md:grid-cols-3 gap-4">
              <div v-for="(image, index) in currentNoteDetail.images" :key="index" class="relative overflow-hidden rounded-lg border border-gray-100 dark:border-gray-600 shadow-sm cursor-pointer" @click="showImagePreview(image)">
                <div class="aspect-[3/4]">
                  <img :src="image" :alt="`图片 ${index + 1}`" class="w-full h-full object-cover" />
                </div>
              </div>
            </div>
            
            <!-- 笔记内容 -->
            <div class="prose dark:prose-invert max-w-none">
              <div v-if="currentNoteDetail.content" class="whitespace-pre-wrap text-gray-700 dark:text-gray-300">{{ currentNoteDetail.content }}</div>
              <div v-else class="text-gray-400 dark:text-gray-500 italic">无内容</div>
            </div>
            
            <!-- 笔记信息 -->
            <div class="mt-6 pt-4 border-t border-gray-100 dark:border-gray-600">
              <div class="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                <div class="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  创建时间: {{ formatDate(currentNoteDetail.createTime) }}
                </div>
                <div class="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  状态: 
                  <span v-if="currentNoteDetail.isUsed" class="ml-1 text-green-600 dark:text-green-400">已发布到小红书</span>
                  <span v-else-if="currentNoteDetail.isDiscarded" class="ml-1 text-red-600 dark:text-red-400">已弃用</span>
                  <span v-else class="ml-1 text-yellow-600 dark:text-yellow-400">未发布</span>
                </div>
                <div v-if="currentNoteDetail.douyinUsed" class="flex items-center text-blue-600 dark:text-blue-400">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  已发布到抖音
                </div>
                <div v-if="currentNoteDetail.type" class="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                  </svg>
                  类型: {{ currentNoteDetail.type === 'video' ? '视频' : '图文' }}
                </div>
              </div>
            </div>
          </div>
          
          <!-- 保留原有iframe，但隐藏不显示 -->
          <iframe 
            v-if="false && currentNoteId" 
            :src="currentNoteId" 
            class="w-full h-full border-none" 
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            allow="clipboard-write"
            referrerpolicy="no-referrer"
            @load="handleIframeLoaded"
            @error="handleIframeError"
          ></iframe>
        </div>
        
        <!-- 底部操作按钮 -->
        <div class="p-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 flex flex-wrap gap-3 justify-center">
          <button
            type="button"
            @click="openAnalysisPage(currentNoteDetail)"
            class="flex items-center px-4 py-2 bg-green-500 dark:bg-green-600 hover:bg-green-600 dark:hover:bg-green-500 text-white rounded-md transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            打开分享页面
          </button>
          <button
            type="button"
            @click="handleEditNote(currentNoteDetail)"
            class="flex items-center px-4 py-2 bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-md transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            编辑笔记
          </button>
          <button
            type="button"
            @click="discardNote(currentNoteDetail)"
            class="flex items-center px-4 py-2 bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-500 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="currentNoteDetail.isDiscarded"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            弃用笔记
          </button>
          <button
            type="button"
            @click="closeNoteDetailModal"
            class="flex items-center px-4 py-2 bg-gray-400 dark:bg-gray-600 hover:bg-gray-500 dark:hover:bg-gray-500 text-white rounded-md transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            关闭
          </button>
        </div>
      </div>
    </div>
    
    <!-- 编辑笔记模态框 -->
    <EditNoteModal
      v-model:visible="showEditNoteModal"
      :noteId="currentEditNoteId"
      @success="handleEditSuccess"
      @error="handleError"
    />
    
    <!-- AI选题生成弹窗 -->
    <AiTopicGenModal
      v-if="showAiTopicGenModal"
      :brand-product="productForm.brandProduct"
      @close="showAiTopicGenModal = false"
      @generate="handleAiGeneratedTopic"
      @generateMultiple="handleAiGeneratedTopics"
      @error="handleError"
      :visible="showAiTopicGenModal"
      @update:visible="showAiTopicGenModal = $event"
    />
    
    <!-- 素材库弹窗 -->
    <MaterialLibrary
      :visible="showMaterialLibrary"
      @update:visible="showMaterialLibrary = $event"
      :selected-materials="selectedLibraryMaterials"
      @select="handleMaterialLibrarySelect"
      @error="handleError"
    />
    
    <!-- 模板市场弹窗 -->
    <TemplateMarketModal
      :visible="showTemplateMarket"
      @close="showTemplateMarket = false"
      @select="handleTemplateSelection"
    />
    
    <!-- 图片预览模态框 -->
    <div v-if="showImagePreviewModal" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-md">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-bold text-gray-800 dark:text-gray-200">
            图片预览
          </h3>
          <button
            type="button"
            @click="closeImagePreview"
            class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div class="flex justify-center">
          <img :src="previewImageUrl" alt="预览图片" class="max-w-full max-h-90vh" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBasicLayout } from '@/hooks/useBasicLayout';
import { useAppStore, useAuthStore, useAppCatStore } from '@/store';
import { computed, ref, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useRouter } from 'vue-router';
import { fetchXhsActivitiesStatsAPI, createXhsActivityAPI, getXhsSignatureAPI } from '@/api/xhs';
import { uploadFileAPI, getUserTasksAPI, getTaskResultAPI, generateProductAPI, batchGetTaskResultsAPI, retryTaskAPI } from '@/api/xhsProductFactory';
import { ScanCode, Plus } from '@icon-park/vue-next';
import { selectMaterials, getMaterialFolders } from './api';
import { checkAuthStatus, checkInsufficientBalanceError } from './utils';

// 导入组件
import BrandProductInput from './components/BrandProductInput.vue';
import TitleManager from './components/TitleManager.vue';
import ActivityManager from './components/ActivityManager.vue';
import FileUploader from './components/FileUploader.vue';
import BatchSettings from './components/BatchSettings.vue';
import TaskList from './components/TaskList.vue';
import StatusNotification from './components/StatusNotification.vue';
import ModalDialogs from './components/ModalDialogs.vue';
import AiTopicGenModal from './components/AiTopicGenModal.vue';
import MaterialLibrary from './components/MaterialLibrary.vue';
import TemplateDisplay from './components/TemplateDisplay.vue';
import TemplateMarketModal from './components/TemplateMarketModal.vue';
import EditNoteModal from './components/EditNoteModal.vue'; // 导入编辑笔记模态框组件
import AdditionalInformation from './components/AdditionalInformation.vue'; // 导入补充信息组件

// 导入类型
import { ProductForm, Task, UploadedFile, Activity } from './types';

console.log('XhsProductFactory组件开始加载...');

// Store
const authStore = useAuthStore();
const isLogin = computed(() => authStore.isLogin);
const { isMobile } = useBasicLayout();
const router = useRouter();
const appCatStore = useAppCatStore();

// 页面标题
document.title = '图文矩阵PRO版';

// 组件引用
const activityManagerRef = ref<InstanceType<typeof ActivityManager> | null>(null);
const taskListRef = ref<InstanceType<typeof TaskList> | null>(null);
const modalDialogsRef = ref<InstanceType<typeof ModalDialogs> | null>(null);

// 状态变量
const maxFileCount = 20; // 最大文件上传数量
const statusMessage = ref('');
const statusType = ref<'success' | 'error' | 'info' | ''>('');
const activities = ref<Activity[]>([]); // 添加活动列表

// 表单数据
const productForm = ref<ProductForm>({
  brandProduct: '',
  title: '',
  titles: [],
  activityId: '',
  materials: [],
  batchCount: '1',
  templateIds: [], // 添加模板ID字段
  information: '' // 添加补充信息字段
});

// 提交状态
const submitting = ref(false);

// 添加uploadedFiles响应式变量
const uploadedFiles = ref<UploadedFile[]>([]);

// 二维码弹窗
const showQrModal = ref(false);
const currentQrUrl = ref('');
const currentQrTask = ref<Task | null>(null);
// 添加二维码服务状态跟踪
const qrServiceFailed = ref(false);

// 笔记详情弹窗
const showNoteDetailModal = ref(false);
const currentNoteId = ref('');
const noteDetailLoading = ref(false);
const noteDetailError = ref('');
// 添加笔记详情对象
const currentNoteDetail = ref<any>({});

// 编辑笔记弹窗
const showEditNoteModal = ref(false);
const currentEditNoteId = ref('');

// AI选题生成弹窗
const showAiTopicGenModal = ref(false);

// 素材库相关
const showMaterialLibrary = ref(false);
const selectedLibraryMaterials = ref<string[]>([]);
const selectedFolderNames = ref<string[]>([]);
// 文件夹相关
const folderIds = ref<string[]>([]);
const folderNames = ref<string[]>([]);
// 添加一个专门用于素材名称的变量
const materialNames = ref<string[]>([]);

// 在ref声明区域添加新的状态变量
const selectedPlatform = ref<'all' | 'xhs' | 'douyin'>('all'); // 默认为全平台
const showPlatformSelector = ref(false); // 是否显示平台选择器
const currentActivityIdForQr = ref(''); // 保存当前要生成二维码的活动ID

// 模板数据
interface Template {
  id: number | string;
  title: string;
  content: string;
  coverImage?: string;
  source: string;
  typeId?: number;
  type?: { id: number; name: string };
  createTime?: string;
  updateTime?: string;
  likesCount?: number;
  viewsCount?: number;
  noteId?: string;
}

// 模板市场相关
const showTemplateMarket = ref(false);
const selectedTemplates = ref<Template[]>([]);
const showTemplates = computed(() => selectedTemplates.value.length > 0);

// 生成唯一ID的函数
const generateRandomId = (prefix: string = '') => {
  // 使用简短时间戳的最后6位 + 随机字符串，提高唯一性
  const timestamp = Date.now().toString().slice(-6);
  const randomStr = Math.random().toString(36).substring(2, 7);
  return prefix ? `${prefix}_${timestamp}${randomStr}` : `${timestamp}${randomStr}`;
};

// 处理API错误
function handleError(error: any) {
  console.error('API请求失败:', error);
  
  // 检查积分不足错误
  const insufficientBalanceError = checkInsufficientBalanceError(error);
  if (insufficientBalanceError) {
    showStatusMessage(insufficientBalanceError, 'error');
    return;
  }
  
  // 判断是否为认证错误
  if (error?.response?.status === 401 || 
      error?.message?.includes('401') || 
      error?.message?.includes('认证') || 
      error?.message?.includes('登录')) {
    // 显示登录提示
    showStatusMessage('请先登录后再使用', 'error');
    
    // 跳转到登录页
    if (!isLogin.value) {
      setTimeout(() => {
        router.push('/login');
      }, 1500);
      }
    } else {
    // 显示通用错误消息
    showStatusMessage(typeof error === 'string' ? error : error?.message || '操作失败，请稍后重试', 'error');
  }
}

// 显示状态消息
function showStatusMessage(message: string, type: 'success' | 'error' | 'info' = 'info') {
  statusMessage.value = message;
  statusType.value = type;
  
  // 自动清除
  setTimeout(() => {
    clearStatusMessage();
  }, 3000);
}

// 清除状态消息
function clearStatusMessage() {
  statusMessage.value = '';
  statusType.value = '';
}

// 处理AI生成的选题
const handleAiGeneratedTopic = (topic: string) => {
  if (topic && topic.trim() !== '') {
    console.log('收到单个AI生成选题: ', topic.trim());
    
    // 设置当前选中的标题
    productForm.value.title = topic.trim();
    
    // 添加到选题列表
    if (!productForm.value.titles.includes(topic.trim())) {
      productForm.value.titles.push(topic.trim());
      console.log('选题已添加到列表，当前选题列表: ', productForm.value.titles);
      } else {
      console.log('选题已存在，不重复添加');
    }
    
    // 显示成功提示
    showStatusMessage(`已添加选题: ${topic.trim()}`, 'success');
              } else {
    console.warn('收到的选题为空');
  }
};

// 处理AI生成的多个选题
const handleAiGeneratedTopics = (topics: string[]) => {
  if (topics && topics.length > 0) {
    console.log('收到多个AI生成选题: ', topics);
    
    // 添加所有选择的选题
    let addedCount = 0;
    for (let i = 0; i < topics.length; i++) {
      if (topics[i] && topics[i].trim() && !productForm.value.titles.includes(topics[i].trim())) {
        productForm.value.titles.push(topics[i].trim());
        addedCount++;
      }
    }
    
    // 如果有选题被添加，设置当前标题为第一个新选题
    if (addedCount > 0 && topics[0]) {
      productForm.value.title = topics[0].trim();
    }
    
    // 显示添加成功提示
    showStatusMessage(`已添加 ${addedCount} 个选题`, 'success');
  }
};

// 处理素材库选择
async function handleMaterialLibrarySelect(selectedItems: string[]) {
  if (!selectedItems || selectedItems.length === 0) {
    // 清除选择状态
    selectedLibraryMaterials.value = [];
    selectedFolderNames.value = [];
    materialNames.value = []; // 清除素材名称
    folderIds.value = [];
    folderNames.value = [];
    
    // 清除sessionStorage中的标记
    sessionStorage.removeItem('materialLibrarySelectionType');
    sessionStorage.removeItem('materialLibraryFolderSelection');
    sessionStorage.removeItem('materialLibraryMaterialSelection');
    sessionStorage.removeItem('materialSelectionInfo');
    
    showStatusMessage('已清除选择', 'info');
    return;
  }
  
  try {
    // 从sessionStorage获取详细的选择信息
    const selectionInfoStr = sessionStorage.getItem('materialSelectionInfo');
    
    if (selectionInfoStr) {
      try {
        const selectionInfo: any = JSON.parse(selectionInfoStr);
        
        // 处理文件夹选择
        if (selectionInfo && selectionInfo.folders && selectionInfo.folders.length > 0) {
          try {
            // 获取提交的文件夹ID
            const tempFolderIds = [...selectionInfo.folders];
            
            // 初始化临时文件夹名称数组
            const tempFolderNames: string[] = [];
            
            // 优先使用selectionInfo中存储的文件夹名称
            if (selectionInfo.folderNames && typeof selectionInfo.folderNames === 'object') {
              // 按照文件夹ID的顺序，获取对应的名称
              tempFolderIds.forEach((id: string) => {
                if (selectionInfo.folderNames[id]) {
                  tempFolderNames.push(selectionInfo.folderNames[id]);
                } else {
                  tempFolderNames.push(`文件夹 ${tempFolderNames.length + 1}`);
                }
              });
            } else {
              // 如果selectionInfo中没有名称，则调用API获取
              try {
                const foldersResponse: any = await getMaterialFolders();
                
                // 处理API响应
                let allFolders: any[] = [];
                if (typeof foldersResponse === 'object' && foldersResponse !== null) {
                  if (foldersResponse && typeof foldersResponse.data === 'object' && foldersResponse.data?.data) {
                    allFolders = foldersResponse.data.data;
                  } else if (foldersResponse && typeof foldersResponse.data === 'object') {
                    allFolders = foldersResponse.data;
                  }
                } else if (Array.isArray(foldersResponse)) {
                  allFolders = foldersResponse;
                }
                
                // 为每个文件夹ID查找名称
                tempFolderIds.forEach((id: string) => {
                  const folder = allFolders.find((f: any) => f.id === id || f.folderId === id);
                  if (folder) {
                    tempFolderNames.push(folder.name || folder.folderName || `文件夹 ${tempFolderNames.length + 1}`);
                  } else {
                    tempFolderNames.push(`文件夹 ${tempFolderNames.length + 1}`);
                  }
                });
              } catch (error) {
                console.error('通过API获取文件夹名称失败:', error);
                
                // 使用默认生成的名称
                tempFolderIds.forEach((_: string, index: number) => {
                  tempFolderNames.push(`文件夹 ${index + 1}`);
                });
              }
            }
            
            // 更新文件夹变量
            folderIds.value = tempFolderIds;
            folderNames.value = tempFolderNames;
          } catch (error) {
            console.error('处理文件夹选择失败:', error);
            
            // 使用简单逻辑处理
            folderIds.value = [...selectionInfo.folders];
            folderNames.value = selectionInfo.folders.map((_: any, i: number) => `文件夹 ${i + 1}`);
          }
        } else {
          // 没有选择文件夹，清空文件夹数组
          folderIds.value = [];
          folderNames.value = [];
        }
        
        // 处理素材选择
        if (selectionInfo && selectionInfo.materials && selectionInfo.materials.length > 0) {
          try {
            // 假设素材直接返回ID和名称
            const tempMaterialIds: string[] = [...selectionInfo.materials];
            const tempMaterialNames: string[] = selectionInfo.materials.map((id: string) => `素材 ${id.substring(0, 6)}...`);
            
            // 更新素材变量 - 修复这里的问题
            selectedLibraryMaterials.value = tempMaterialIds;
            materialNames.value = tempMaterialNames; // 使用专门的素材名称变量
          } catch (error) {
            console.error('处理素材选择失败:', error);
            
            // 使用简单逻辑处理
            selectedLibraryMaterials.value = [...selectionInfo.materials];
            materialNames.value = selectionInfo.materials.map((_: any, i: number) => `素材 ${i + 1}`);
          }
        } else {
          // 没有选择素材，清空素材数组
          selectedLibraryMaterials.value = [];
          materialNames.value = [];
        }
        
        // 提示成功
        const folderCount = selectionInfo.folders?.length || 0;
        const materialCount = selectionInfo.materials?.length || 0;
        
        if (folderCount > 0 && materialCount > 0) {
          showStatusMessage(`已选择 ${folderCount} 个文件夹和 ${materialCount} 个素材`, 'success');
        } else if (folderCount > 0) {
          showStatusMessage(`已选择 ${folderCount} 个文件夹`, 'success');
        } else if (materialCount > 0) {
          showStatusMessage(`已选择 ${materialCount} 个素材`, 'success');
        }
      } catch (e) {
        console.error('解析选择信息失败:', e);
        showStatusMessage('处理选择信息失败，请重试', 'error');
      }
    } else {
      // 如果没有选择信息，使用默认逻辑
      // 简单地记录所有选择项，但不处理显示
      showStatusMessage(`选择了 ${selectedItems.length} 个项目`, 'success');
    }
  } catch (error) {
    console.error('素材库选择处理失败:', error);
    handleError(error);
  }
}

// 提交表单，生成笔记
async function submitForm() {
  // 表单验证
  if (!productForm.value.brandProduct) {
    showStatusMessage('请输入品牌产品名称', 'error');
    return;
  }
  
  if (productForm.value.titles.length === 0) {
    showStatusMessage('请至少添加一个选题', 'error');
    return;
  }
  
  // 如果既没有上传素材，也没有选择素材库文件夹，也没有选择文件夹，则提示错误
  if (productForm.value.materials.length === 0 && selectedLibraryMaterials.value.length === 0 && folderIds.value.length === 0) {
    showStatusMessage('请上传至少一张素材图或从素材库选择', 'error');
    return;
  }
  
  // 如果已经在提交中，防止重复提交
  if (submitting.value) {
    showStatusMessage('正在处理中，请稍候...', 'info');
    return;
  }
  
  try {
    submitting.value = true;
    console.log('开始提交表单，选题数量:', productForm.value.titles.length);
    
    // 处理批量生成
    const batchCount = parseInt(productForm.value.batchCount) || 1;
    const batchId = batchCount > 1 ? generateRandomId('batch') : undefined;
    
    // 记录日志
    console.log(`批量设置: ${batchCount}，批次ID: ${batchId || '无'}`);
    
    // 打印日志显示素材库选中的素材
    console.log('选中的素材库素材:', selectedLibraryMaterials.value);
    console.log('选中的文件夹:', folderIds.value);
    console.log('选中的模板ID:', productForm.value.templateIds);
    console.log('选中的模板数量:', productForm.value.templateIds?.length || 0);

    try {
      let result;
      
      // 当选择了多个选题时，创建一个批量任务
      if (productForm.value.titles.length > 1) {
        console.log('使用批量API提交多个选题');
        // 使用第一个选题作为默认标题
        result = await generateProductAPI({
          brandProduct: productForm.value.brandProduct, 
          title: productForm.value.titles[0],
          titleList: productForm.value.titles,  // 传递所有选题
          activityId: productForm.value.activityId,
          fileIds: productForm.value.materials,
          folderIds: folderIds.value,  // 添加选择的文件夹ID
          materialIds: selectedLibraryMaterials.value, // 添加选择的素材ID
          batchCount: batchCount,
          templateIds: productForm.value.templateIds?.map(id => id.toString()), // 确保templateIds是字符串数组
          information: productForm.value.information // 添加补充信息
        });
      } else {
        // 只有一个选题时，使用单选题模式
        if (batchCount > 1) {
          // 单选题多次生成，也使用批量API
          result = await generateProductAPI({
            brandProduct: productForm.value.brandProduct, 
            title: productForm.value.titles[0],
            activityId: productForm.value.activityId,
            fileIds: productForm.value.materials,
            folderIds: folderIds.value,  // 添加选择的文件夹ID
            materialIds: selectedLibraryMaterials.value, // 添加选择的素材ID
            batchCount: batchCount,
            templateIds: productForm.value.templateIds?.map(id => id.toString()), // 确保templateIds是字符串数组
            information: productForm.value.information // 添加补充信息
          });
        } else {
          // 单选题单次生成
          result = await generateProductAPI({
            brandProduct: productForm.value.brandProduct, 
            title: productForm.value.titles[0],
            activityId: productForm.value.activityId,
            fileIds: productForm.value.materials,
            folderIds: folderIds.value,  // 添加选择的文件夹ID
            materialIds: selectedLibraryMaterials.value, // 添加选择的素材ID
            templateIds: productForm.value.templateIds?.map(id => id.toString()), // 确保templateIds是字符串数组
            information: productForm.value.information // 添加补充信息
          });
        }
      }
      
      console.log('生成API响应:', result);
      
      // 检查是否是积分不足错误
      const insufficientBalanceError = checkInsufficientBalanceError(result);
      if (insufficientBalanceError) {
        showStatusMessage(insufficientBalanceError, 'error');
        return;
      }
      
      // 检查其他错误
      if (!result.success) {
        showStatusMessage(result.message || '生成失败，请稍后重试', 'error');
        return;
      }
      
      // 刷新任务列表
      if (taskListRef.value) {
        // 延迟一下再刷新，确保后端已处理完请求
        setTimeout(() => {
          console.log('执行提交后的任务刷新');
          taskListRef.value?.refreshTasks();
        }, 1000);
      }
      
      // 显示成功消息但不清除表单，使用后端返回的详细消息
      showStatusMessage(result.message || `已成功提交笔记生成任务！`, 'success');
    } catch (error: any) {
      console.error('提交表单失败:', error);
      
      // 检查是否是积分不足错误
      const insufficientBalanceError = checkInsufficientBalanceError(error);
      if (insufficientBalanceError) {
        showStatusMessage(insufficientBalanceError, 'error');
        return;
      }
      
      handleError(error);
    }
  } finally {
    submitting.value = false;
  }
}

// 重置表单
function resetForm() {
  // 重置表单状态
  productForm.value = {
    brandProduct: '',
    title: '',
    titles: [],
    activityId: productForm.value.activityId, // 保留当前选择的活动ID
    materials: [],
    batchCount: '1',
    templateIds: [], // 重置模板ID字段
    information: '' // 重置补充信息字段
  };
  
  // 重置文件上传状态
  uploadedFiles.value = [];
  
  // 重置素材库选择状态
  selectedLibraryMaterials.value = [];
  selectedFolderNames.value = [];
  materialNames.value = []; // 重置素材名称
  
  // 重置文件夹选择状态
  folderIds.value = [];
  folderNames.value = [];
  
  // 清除素材库选择状态标记
  sessionStorage.removeItem('materialLibrarySelectionType');
  sessionStorage.removeItem('materialLibraryFolderSelection');
  sessionStorage.removeItem('materialLibraryMaterialSelection');
  sessionStorage.removeItem('materialSelectionInfo');
  
  // 强制刷新组件状态
  nextTick(() => {
    console.log('表单已重置，状态已清除');
  });
  
  // 清除其他状态
  showStatusMessage('表单已重置', 'info');
}

// 处理查看笔记详情
function handleViewNoteDetail(task: Task) {
  if (!task || !task.noteId) {
    showStatusMessage('无法查看笔记详情，缺少笔记ID', 'error');
    return;
  }
  
  // 设置加载状态
  noteDetailLoading.value = true;
  noteDetailError.value = '';
    showNoteDetailModal.value = true;
  currentNoteDetail.value = {}; // 清空之前的详情
  
  // 保存原始noteId以备需要
  currentNoteId.value = task.noteId;
  
  // 获取笔记详情
  fetchNoteDetail(task.noteId);
}

// 获取笔记详情
async function fetchNoteDetail(noteId: string) {
  try {
    const response = await fetch(`/api/xhs-auto/notes/${noteId}`);
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`获取笔记详情失败: ${response.status} ${response.statusText}`);
    }
    
    // 处理返回数据
    const noteData = result.data || result;
    
    // 更新笔记详情
    currentNoteDetail.value = noteData;
    noteDetailLoading.value = false;
    
    console.log('获取到笔记详情:', noteData);
  } catch (error: any) {
    console.error('获取笔记详情失败:', error);
    noteDetailError.value = error.message || '获取笔记详情失败';
    noteDetailLoading.value = false;
  }
}

// 格式化日期
function formatDate(dateString: string) {
  if (!dateString) return '未知时间';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return dateString;
  }
}

// 打开分享页面
function openAnalysisPage(note: any) {
  if (!note || (!note.noteId && !note.id)) {
    showStatusMessage('无法打开分享页面，缺少笔记ID', 'error');
    return;
  }
  
  try {
    // 获取笔记ID
    const noteId = note.noteId || note.id;
    
    // 构建分享页面URL
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = `${origin}/chat#/xhs-auto-api?id=${noteId}`;
    
    console.log('打开分享页面:', shareUrl);
    
    // 检测设备类型
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobileDevice) {
      // 在移动设备上直接打开
      window.open(shareUrl, '_blank');
      showStatusMessage('已打开分享页面', 'success');
  } else {
      // 在电脑端显示二维码
      console.log('在电脑端显示二维码，noteId:', noteId, '分享URL:', shareUrl);
      showQRCodeForShare(noteId, shareUrl);
    }
  } catch (error: any) {
    console.error('打开分享页面失败:', error);
    showStatusMessage(`打开分享页面失败: ${error.message || '未知错误'}`, 'error');
  }
}

// 显示分享二维码和提示
function showQRCodeForShare(noteId: string, shareUrl: string) {
  console.log('showQRCodeForShare 方法被调用，noteId:', noteId, '分享URL:', shareUrl);
  
  // 创建二维码URL
  const encodedShareLink = encodeURIComponent(shareUrl);
  const qrCodeUrl = `https://xhs.aivip1.top/api/html-render/qrcode?data=${encodedShareLink}`;
  console.log('生成的二维码URL:', qrCodeUrl);
  
  // 创建模拟任务对象用于显示二维码
  currentQrTask.value = {
    id: `share_${noteId}`,
    brandProduct: '分享页面二维码',
    title: '扫码在手机端查看分享页面',
    status: 'completed' as 'pending' | 'running' | 'completed' | 'failed',
    createTime: new Date().toISOString(),
    updateTime: new Date().toISOString(),
    result: {
      qrCode: qrCodeUrl,
      isShareLink: true,
      mobileOnly: true // 添加标记，表示这是仅限手机的链接
    },
    error: '',
    executeId: undefined,
    noteId: noteId,
    batchId: undefined,
    batchCount: undefined,
    batchIndex: undefined
  };
  
  // 添加二维码类型标记
  // @ts-ignore - 动态添加属性
  currentQrTask.value.qrCodeType = 'share';
  
  // 设置当前二维码URL
  currentQrUrl.value = qrCodeUrl;
  
  // 如果模态框引用可用，先刷新二维码
  if (modalDialogsRef.value && typeof modalDialogsRef.value.refreshQrImage === 'function') {
    console.log('使用 modalDialogsRef.refreshQrImage 刷新二维码');
    try {
      // 延迟一下执行刷新，确保数据已更新
      setTimeout(() => {
        modalDialogsRef.value?.refreshQrImage?.();
      }, 50);
    } catch (e) {
      console.error('刷新二维码失败:', e);
    }
  }
  
  // 显示二维码弹窗 - 使用原有的二维码弹窗
  console.log('设置 showQrModal.value = true');
  showQrModal.value = true;
  
  // 显示提示消息
  showStatusMessage('请使用手机扫描二维码查看分享页面', 'info');
}

// 弃用笔记
async function discardNote(note: any) {
  if (!note || (!note.noteId && !note.id)) {
    showStatusMessage('无法弃用笔记，缺少笔记ID', 'error');
    return;
  }
  
  // 确认弃用
  if (!confirm('确定要弃用这篇笔记吗？弃用后将不再显示在可用笔记列表中。')) {
    return;
  }
  
  try {
    // 调用弃用API
    const noteId = note.noteId || note.id;
    const response = await fetch(`/api/xhs-auto/notes/${noteId}/discard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`弃用笔记失败: ${response.status} ${response.statusText}`);
    }
    
    // 更新本地状态
    if (currentNoteDetail.value) {
      currentNoteDetail.value.isDiscarded = true;
    }
    
    // 显示成功消息
    showStatusMessage('笔记已成功弃用', 'success');
    
    // 刷新任务列表
    if (taskListRef.value) {
      taskListRef.value.refreshTasks();
    }
  } catch (error: any) {
    console.error('弃用笔记失败:', error);
    showStatusMessage(`弃用笔记失败: ${error.message || '未知错误'}`, 'error');
  }
}

// 关闭笔记详情弹窗
function closeNoteDetailModal() {
  showNoteDetailModal.value = false;
  currentNoteId.value = '';
  noteDetailError.value = '';
  noteDetailLoading.value = false;
  currentNoteDetail.value = {};
  console.log('关闭笔记详情弹窗');
}

// 处理编辑笔记
function handleEditNote(task: Task | any) {
  console.log('准备编辑笔记:', task);
  
  // 检查是否有noteId或id
  if (task) {
    if (task.noteId) {
      currentEditNoteId.value = task.noteId;
      showEditNoteModal.value = true;
      console.log('编辑笔记, 使用noteId:', currentEditNoteId.value);
    } else if (task.id) {
      // 如果没有noteId但有id，使用id
      currentEditNoteId.value = task.id;
      showEditNoteModal.value = true;
      console.log('编辑笔记, 使用任务id:', currentEditNoteId.value);
    } else {
      showStatusMessage('无法编辑笔记，缺少笔记ID', 'error');
    }
    
    // 如果是从详情页打开编辑，关闭详情页
    if (showNoteDetailModal.value) {
      showNoteDetailModal.value = false;
    }
  } else {
    showStatusMessage('无法编辑笔记，缺少笔记信息', 'error');
  }
}

// 处理笔记编辑成功
function handleEditSuccess(data: any) {
  showStatusMessage('笔记修改成功', 'success');

  // 刷新任务列表以获取最新数据
  if (taskListRef.value) {
    taskListRef.value.refreshTasks();
  }

  // 如果当前正在查看该笔记的详情，刷新详情
  if (showNoteDetailModal.value && currentNoteDetail.value &&
      (currentNoteDetail.value.id === data.id || currentNoteDetail.value.noteId === data.id)) {
    fetchNoteDetail(data.id);
  }
}

// 处理重试任务
async function handleRetryTask(task: Task) {
  console.log('重试任务:', task);

  if (!task || !task.id) {
    showStatusMessage('无法重试任务，缺少任务ID', 'error');
    return;
  }

  // 确认重试
  if (!confirm('确定要重试这个失败的任务吗？')) {
    return;
  }

  try {
    showStatusMessage('正在重新提交任务...', 'info');

    // 调用重试API
    const result = await retryTaskAPI(task.id);

    console.log('重试任务API响应:', result);

    // 检查是否是积分不足错误
    const insufficientBalanceError = checkInsufficientBalanceError(result);
    if (insufficientBalanceError) {
      showStatusMessage(insufficientBalanceError, 'error');
      return;
    }

    // 检查其他错误
    if (!result.success) {
      showStatusMessage(result.message || '重试任务失败，请稍后重试', 'error');
      return;
    }

    // 显示成功消息
    showStatusMessage('任务重试成功，正在重新处理...', 'success');

    // 刷新任务列表
    if (taskListRef.value) {
      // 延迟一下再刷新，确保后端已处理完请求
      setTimeout(() => {
        console.log('执行重试后的任务刷新');
        taskListRef.value?.refreshTasks();
      }, 1000);
    }
  } catch (error: any) {
    console.error('重试任务失败:', error);

    // 检查是否是积分不足错误
    const insufficientBalanceError = checkInsufficientBalanceError(error);
    if (insufficientBalanceError) {
      showStatusMessage(insufficientBalanceError, 'error');
      return;
    }

    handleError(error);
  }
}

// 处理 iframe 加载完成事件
function handleIframeLoaded() {
  console.log('iframe加载完成');
  noteDetailLoading.value = false;
  noteDetailError.value = ''; // 清除任何可能的错误信息
}

// 处理 iframe 加载失败事件
function handleIframeError(e?: Event) {
  console.error('iframe加载失败:', e);
  
  // 如果我们正在使用新的笔记详情展示方式，不需要显示iframe错误
  if (currentNoteDetail.value && Object.keys(currentNoteDetail.value).length > 0) {
    noteDetailLoading.value = false;
    return;
  }
  
  noteDetailLoading.value = false;
  
  // 显示详细的错误信息
  let srcUrl = currentNoteId.value;
  
  if (e) {
    const target = e.target as HTMLIFrameElement;
    if (target && target.src) {
      srcUrl = target.src;
    }
  }
  
  // 如果URL为空或不正确，显示不同的错误信息
  if (!srcUrl || srcUrl === 'undefined' || srcUrl === 'null') {
    noteDetailError.value = '笔记链接无效，请联系管理员';
  } else {
    noteDetailError.value = '笔记内容加载失败，请刷新重试';
  }
  
  // 尝试重新构建链接
  setTimeout(() => {
    if (noteDetailError.value && currentNoteId.value) {
      try {
        // 尝试直接获取笔记详情
        fetchNoteDetail(currentNoteId.value);
      } catch (error) {
        console.error('重建URL失败:', error);
      }
    }
  }, 1500);
}

// 处理查看活动
function handleViewActivity(activityId: string) {
  if (!activityId) {
    showStatusMessage('活动ID不存在', 'error');
    return;
  }
  
  console.log('导航到活动页面, activityId:', activityId);
  
  // 使用appCatStore.showApp而不是router.push
  appCatStore.showApp({
    id: 'xhs-notes',
    name: '小红书笔记',
    type: 'built-in',
    path: 'xhs-notes',
    params: { activityId }
  });
  
  // 保存当前活动ID到localStorage，以便在笔记组件中使用
  localStorage.setItem('currentActivityId', activityId);
  
  // 显示成功消息
  showStatusMessage('正在跳转到活动笔记列表...', 'success');
}

// 处理查看二维码
function handleViewQrCode(task: Task) {
  console.log('收到view-qr-code事件，笔记ID:', task.noteId);
  
  // 设置加载状态
  showStatusMessage('正在生成二维码...', 'info');
  
  // 清除旧的数据和状态
  currentQrTask.value = task;
  currentQrUrl.value = '';
  qrServiceFailed.value = false; // 重置服务状态标记
  
  // 设置默认平台为全平台
  selectedPlatform.value = 'all';
  
  // 设置新的二维码类型标记
  if (currentQrTask.value) {
    // @ts-ignore - 动态添加属性
    currentQrTask.value.qrCodeType = 'note';
    
    // 确保result对象存在且是对象类型
    if (!currentQrTask.value.result) {
      currentQrTask.value.result = {};
    } else if (typeof currentQrTask.value.result === 'string') {
      // 如果result是字符串（URL），将其保存并转换为对象
      const originalUrl = currentQrTask.value.result;
      currentQrTask.value.result = {
        qrCode: originalUrl // 保存原始URL作为qrCode属性
      };
    } else if (typeof currentQrTask.value.result !== 'object') {
      // 处理其他非对象类型
      currentQrTask.value.result = {};
    }
    
    // 设置默认平台
    currentQrTask.value.result.platform = 'all';
  }
  
  // 尝试使用任务中已有的二维码
  if (task.result && task.result.qrCode) {
    const existingQrUrl = task.result.qrCode;
    // 检查现有URL是否包含有效的二维码服务前缀
    if (
      existingQrUrl.startsWith('https://api.qrserver.com/')
    ) {
      console.log('使用任务中保存的二维码URL:', existingQrUrl);
      currentQrUrl.value = existingQrUrl;
    showQrModal.value = true;
      return;
  } else {
      console.log('任务中保存的二维码URL格式不正确，重新生成');
    }
  }
  
  // 如果没有二维码或URL不正确，生成一个新的
    if (task.noteId) {
      try {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
      
      // 使用id参数，确保是笔记二维码
      const shareLink = `${origin}/chat#/xhs-auto-api?id=${task.noteId}`;
      const encodedShareLink = encodeURIComponent(shareLink);
      console.log('生成笔记二维码链接:', shareLink);
      console.log('编码后的链接:', encodedShareLink);
      
      // 确保URL包含完整的二维码服务前缀
      const qrServiceUrl = 'https://xhs.aivip1.top/api/html-render/qrcode?data=';
      const newQrUrl = `${qrServiceUrl}${encodedShareLink}`;
      console.log('完整的二维码URL:', newQrUrl);
      
      // 立即显示弹窗，展示加载状态
        showQrModal.value = true;
      
      // 预加载二维码图片
      const img = new Image();
      img.onload = () => {
        console.log('二维码图片预加载成功');
        currentQrUrl.value = newQrUrl;
        
        // 保存到任务对象中
        if (currentQrTask.value && currentQrTask.value.result) {
          currentQrTask.value.result.qrCode = newQrUrl;
        }
      };
      img.onerror = () => {
        console.error('二维码图片预加载失败，尝试使用备用服务');
        // 尝试使用Google Charts API作为备用
        const backupServiceUrl = 'https://xhs.aivip1.top/api/html-render/qrcode?data=';
        const backupQrUrl = `${backupServiceUrl}${encodedShareLink}`;
        
        // 尝试加载备用服务
        const backupImg = new Image();
        backupImg.onload = () => {
          console.log('备用二维码服务加载成功');
          currentQrUrl.value = backupQrUrl;
          
          // 保存到任务对象中
          if (currentQrTask.value && currentQrTask.value.result) {
            currentQrTask.value.result.qrCode = backupQrUrl;
          }
        };
        backupImg.onerror = () => {
          console.error('所有二维码服务都失败，使用文本链接');
          // 如果备用服务也失败，使用文本链接
          if (modalDialogsRef.value) {
            modalDialogsRef.value.showTextLink(shareLink);
          }
        };
        backupImg.src = backupQrUrl;
      };
      
      // 开始加载主服务的二维码
      img.src = newQrUrl;
      
      // 设置临时URL，确保有内容显示
      currentQrUrl.value = newQrUrl;
      } catch (error) {
        console.error('生成二维码URL失败:', error);
        showStatusMessage('生成二维码失败，请重试', 'error');
      
      // 尝试显示文本链接作为备用方案
      if (task.noteId) {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const shareLink = `${origin}/chat#/xhs-auto-api?id=${task.noteId}`;
        if (modalDialogsRef.value) {
          modalDialogsRef.value.showTextLink(shareLink);
          showQrModal.value = true;
        }
      }
      }
    } else {
      showStatusMessage('此笔记没有可用的二维码', 'error');
  }
}

// 处理查看活动二维码
function handleViewActivityQrCode(activityId: string, event?: Event) {
  // 阻止事件冒泡，避免触发折叠面板
  if (event) {
    event.stopPropagation();
  }
  
  if (!activityId) {
    showStatusMessage('活动ID不存在', 'error');
    return;
  }
  
  console.log('查看活动笔记二维码:', activityId);
  
  // 保存活动ID
  currentActivityIdForQr.value = activityId;
  // 设置默认平台为全平台
  selectedPlatform.value = 'all';
  
  // 直接生成全平台二维码
  generateActivityQrCode('all');
  
  // 不再显示平台选择器，直接显示二维码
  showPlatformSelector.value = false;
  showQrModal.value = true;
}

// 生成指定平台的活动二维码
function generateActivityQrCode(platform: 'all' | 'xhs' | 'douyin') {
  const activityId = currentActivityIdForQr.value;
  if (!activityId) return;
  
  try {
    selectedPlatform.value = platform;
    
    // 构建分享链接，包含活动ID和平台参数
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    // 明确使用identifier参数，确保是活动二维码
    let shareLink = `${origin}/chat#/xhs-auto-api?identifier=${activityId}`;
    
    // 根据选择的平台添加参数
    if (platform === 'xhs') {
      shareLink += '&platform=xhs';
    } else if (platform === 'douyin') {
      shareLink += '&platform=douyin';
    }
    
    // 编码URL
    const encodedShareLink = encodeURIComponent(shareLink);
    
    // 使用QR服务生成二维码
    currentQrUrl.value = `https://xhs.aivip1.top/api/html-render/qrcode?data=${encodedShareLink}`;
    console.log('设置二维码URL:', currentQrUrl.value);
    
    // 设置当前查看的任务（使用模拟Task对象）
    currentQrTask.value = {
      id: 'activity_' + activityId,
      brandProduct: '活动二维码',
      title: platform === 'all' ? '扫码查看全平台笔记' : 
             platform === 'xhs' ? '扫码查看小红书笔记' : 
             '扫码查看抖音笔记',
      status: 'completed' as 'pending' | 'running' | 'completed' | 'failed',
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString(),
      activityId: activityId,
      result: {
        qrCode: currentQrUrl.value, // 将二维码URL也设置到result.qrCode
        platform: platform // 保存选择的平台
      },
      error: '',
      executeId: undefined,
      noteId: undefined,
      batchId: undefined,
      batchCount: undefined,
      batchIndex: undefined
    };
    
    // 添加二维码类型标记
    // @ts-ignore - 动态添加属性
    currentQrTask.value.qrCodeType = 'activity';
    
    // 关闭平台选择器并显示二维码弹窗
    showPlatformSelector.value = false;
    showQrModal.value = true;
  } catch (error) {
    console.error('生成二维码失败:', error);
    showStatusMessage('生成二维码失败，请重试', 'error');
    showPlatformSelector.value = false;
  }
}

// 处理表单更新
function handleProductFormUpdate(updatedForm: ProductForm) {
  productForm.value = updatedForm;
}

// 处理二维码加载失败
function handleQrLoadError(task: Task) {
  console.error('二维码加载失败:', currentQrUrl.value);
  
  // 标记服务失败
  qrServiceFailed.value = true;
  
  // 判断URL格式是否正确
  if (currentQrUrl.value) {
    // 如果URL没有正确的前缀，需要先修复
    if (!currentQrUrl.value.startsWith('http')) {
      console.error('URL格式不正确，需要添加前缀');
      
      // 判断是否是分享链接而不是二维码URL
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      if (currentQrUrl.value.includes('/chat#/xhs-auto-api') || 
          currentQrUrl.value.includes(`${origin}/chat`)) {
        
        // 这是一个分享链接，非二维码URL，需要重新构建
        const shareLink = currentQrUrl.value;
        const encodedLink = encodeURIComponent(shareLink);
        
        // 使用正确的二维码服务URL
        const qrServicePrefix = 'https://xhs.aivip1.top/api/html-render/qrcode?data=';
        const fixedQrUrl = `${qrServicePrefix}${encodedLink}`;
        
        console.log('重新构建的二维码URL:', fixedQrUrl);
        showStatusMessage('正在修复二维码格式...', 'info');
        
        // 使用修复后的URL
        currentQrUrl.value = fixedQrUrl;
        
        // 更新任务对象
        if (currentQrTask.value && currentQrTask.value.result) {
          currentQrTask.value.result.qrCode = fixedQrUrl;
        }
        
        // 尝试加载修复后的URL
        const img = new Image();
        img.onload = () => {
          console.log('修复后的二维码加载成功');
          qrServiceFailed.value = false;
          
          // 强制更新二维码
          setTimeout(() => {
            if (modalDialogsRef.value) {
              modalDialogsRef.value.refreshQrImage();
            }
          }, 200);
        };
        img.onerror = () => {
          console.error('修复后的二维码仍然加载失败，切换到备用服务');
          tryBackupQrService();
        };
        img.src = fixedQrUrl;
        
        return;
      }
    }
  }
  
  // 尝试使用备用二维码服务
  tryBackupQrService();
}

// 尝试使用备用二维码服务
function tryBackupQrService() {
  if (currentQrUrl.value && currentQrUrl.value.includes('api.qrserver.com')) {
    // 如果当前使用的是api.qrserver.com服务，切换到备用服务
    try {
      // 尝试从URL中提取分享数据
      const dataMatch = currentQrUrl.value.match(/data=([^&]+)/);
      if (dataMatch && dataMatch[1]) {
        const shareData = dataMatch[1];
        
        // 显示状态消息
        showStatusMessage('正在切换备用二维码服务...', 'info');
        
        // 使用Google Charts API作为备用
        const backupQrUrl = `https://xhs.aivip1.top/api/html-render/qrcode?data=${shareData}`;
        console.log('切换到备用QR服务:', backupQrUrl);
        
        // 预加载备用服务的图片
        const img = new Image();
        img.onload = () => {
          console.log('备用二维码加载成功');
          currentQrUrl.value = backupQrUrl;
        
        // 更新任务对象中的QR码URL
        if (currentQrTask.value && currentQrTask.value.result) {
            currentQrTask.value.result.qrCode = backupQrUrl;
          }
          
          // 重置服务状态
          qrServiceFailed.value = false;
          
          // 强制刷新二维码
          setTimeout(() => {
            if (modalDialogsRef.value) {
              modalDialogsRef.value.refreshQrImage();
        }
          }, 200);
        };
                  img.onerror = () => {
            console.error('备用二维码服务也失败，使用文本链接');
            // 如果备用服务也失败，创建文本型二维码
            createTextBasedQrCode();
          };
          img.src = backupQrUrl;
        
        return; // 返回，因为我们已经设置了备用服务
      }
    } catch (e) {
      console.error('解析QR URL失败:', e);
    }
  }
  
  // 如果上面的备用方案失败，或者不是api.qrserver.com服务
  // 创建一个文本型二维码替代方案
  createTextBasedQrCode();
}

// 创建文本型二维码替代方案，避免404错误
function createTextBasedQrCode() {
  if (!currentQrTask.value) return;
  
  try {
    // 获取当前窗口的origin
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    
    // 根据任务类型创建直接访问链接
    let shareLink = '';
    
    // 查看任务属性，判断是笔记还是活动
    // 首先检查是否有特定标注
    const qrCodeType = (currentQrTask.value as any).qrCodeType;
    
    // 如果是笔记
    if (qrCodeType === 'note' || (!qrCodeType && currentQrTask.value.noteId && !currentQrTask.value.id.startsWith('activity_'))) {
      // 笔记二维码 - 必须使用id
      shareLink = `${origin}/chat#/xhs-auto-api?id=${currentQrTask.value.noteId}`;
      console.log('生成笔记二维码链接：', shareLink);
    } 
    // 如果是活动
    else if (qrCodeType === 'activity' || 
       currentQrTask.value.id?.startsWith('activity_') || 
       (!currentQrTask.value.noteId && currentQrTask.value.activityId)) {
      // 活动二维码 - 使用identifier
      let platform = '';
      
      // u6d3bu52a8u4e8cu7ef4u7801 - u4f7fu7528identifier
      if (!currentQrTask.value.result) {
        // resultu4e0du5b58u5728uff0cu4f7fu7528u9ed8u8ba4u5e73u53f0
        platform = '';
      } else if (typeof currentQrTask.value.result === 'string') {
        // u5982u679cresultu662fu5b57u7b26u4e32uff0cu5148u4fddu5b58u7136u540eu521bu5efau5bf9u8c61
        const originalResultUrl = currentQrTask.value.result;
        currentQrTask.value.result = { qrCode: originalResultUrl };
        platform = '';
      } else if (typeof currentQrTask.value.result === 'object') {
        // resultu662fu5bf9u8c61uff0cu68c0u67e5platformu5c5eu6027
        if (currentQrTask.value.result.platform === 'xhs') {
          platform = '&platform=xhs';
        } else if (currentQrTask.value.result.platform === 'douyin') {
          platform = '&platform=douyin';
        }
      } else {
        // u5176u4ed6u7c7bu578buff0cu521bu5efau7a7au5bf9u8c61
        currentQrTask.value.result = {};
        platform = '';
      }
      
      // 确定活动ID
      let activityId = currentQrTask.value.activityId;
      if (!activityId && currentQrTask.value.id?.startsWith('activity_')) {
        activityId = currentQrTask.value.id.replace('activity_', '');
      }
      
      // 生成活动链接 - 使用identifier
      if (activityId) {
        shareLink = `${origin}/chat#/xhs-auto-api?identifier=${activityId}${platform}`;
        console.log('生成活动二维码链接：', shareLink);
      } else {
        shareLink = `${origin}/chat#/xhs-auto-api`;
        console.log('未能确定活动ID，使用默认链接');
      }
    } 
    // 其他情况
    else {
      // 如果不确定
      if (currentQrTask.value.noteId) {
        // 优先使用笔记ID
      shareLink = `${origin}/chat#/xhs-auto-api?id=${currentQrTask.value.noteId}`;
        console.log('不确定类型，使用笔记ID生成链接:', shareLink);
      } else if (currentQrTask.value.activityId) {
        // 如果没有笔记ID但有活动ID则使用活动ID
        shareLink = `${origin}/chat#/xhs-auto-api?identifier=${currentQrTask.value.activityId}`;
        console.log('不确定类型，使用活动ID生成链接:', shareLink);
    } else {
        // 最后的默认情况
      shareLink = `${origin}/chat#/xhs-auto-api`;
        console.log('无效的任务，使用默认链接');
      }
    }
    
    // 存储创建的链接到任务对象中
    // @ts-ignore - 动态添加属性
    currentQrTask.value.textShareLink = shareLink;
    
    // 设置标志，表示QR码加载失败，应该显示文本链接
    // @ts-ignore - 动态添加属性
    currentQrTask.value.qrLoadFailed = true;
    
    // 通知模态框显示文本链接
    if (modalDialogsRef.value) {
      modalDialogsRef.value.showTextLink(shareLink);
    } else {
      // 如果模态框引用不可用，创建一个普通弹窗
      showStatusMessage('二维码加载失败，请使用链接访问', 'info');
      
      // 显示带有链接的警告
      setTimeout(() => {
        alert(`二维码加载失败，请使用以下链接访问：\n${shareLink}`);
      }, 100);
    }
    
    console.log('已创建文本型二维码替代链接:', shareLink);
  } catch (error) {
    console.error('创建文本型二维码失败:', error);
    showStatusMessage('无法生成二维码，请稍后重试', 'error');
  }
}

// 更新处理登录二维码错误的函数，添加类型
function handleLoginQrError(error: any) {
  console.error('登录二维码加载失败:', error);
  
  // 显示错误消息，但不跳转
  showStatusMessage('登录二维码加载失败，请刷新页面重试', 'error');
  
  // 提供一个备用方案，显示手动登录提示
  const loginUrl = `${window.location.origin}/login?redirect=${encodeURIComponent(window.location.pathname)}`;
  
  setTimeout(() => {
    if (confirm('无法加载登录二维码，是否跳转到登录页面？')) {
      window.location.href = loginUrl;
    }
  }, 1000);
  
  // 阻止默认的错误处理，避免跳转到404页面
  if (error && error.preventDefault) {
    error.preventDefault();
  }
  
  return false; // 返回false阻止事件冒泡
}

// 添加一个阻止404跳转的函数
function prevent404Redirect() {
  console.log('添加404跳转拦截...');
  
  // 保存原始的pushState和replaceState方法
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  
  // 拦截pushState和replaceState
  history.pushState = function(state, title, url) {
    // 检查是否要跳转到404
    if (url && typeof url === 'string' && (url.includes('/404') || url.includes('/not-found'))) {
      console.warn('检测到跳转到404，已阻止:', url);
      
      // 显示错误消息
      showStatusMessage('检测到错误，已阻止页面跳转', 'error');
      
      // 不执行实际跳转
      return;
    }
    // 执行原始方法
    return originalPushState.apply(this, [state, title, url]);
  };
  
  history.replaceState = function(state, title, url) {
    // 检查是否要跳转到404
    if (url && typeof url === 'string' && (url.includes('/404') || url.includes('/not-found'))) {
      console.warn('检测到跳转到404，已阻止:', url);
      
      // 显示错误消息
      showStatusMessage('检测到错误，已阻止页面跳转', 'error');
      
      // 不执行实际跳转
      return;
    }
    // 执行原始方法
    return originalReplaceState.apply(this, [state, title, url]);
  };
  
  // 拦截全局错误
  window.addEventListener('error', function(event) {
    // 检查错误是否与getQRCode相关
    if (event?.error?.message?.includes('getQRCode') || 
        event?.error?.stack?.includes('getQRCode') ||
        event?.message?.includes('getQRCode')) {
      console.warn('捕获到二维码相关错误，阻止默认行为:', event);
      
      // 阻止错误冒泡
      event.preventDefault();
      event.stopPropagation();
      
      // 显示错误消息
      showStatusMessage('登录二维码加载失败，请刷新页面重试', 'error');
      
      return false;
    }
  }, true);
  
  // 拦截beforeunload事件，防止在特定情况下跳转
  window.addEventListener('beforeunload', function(event) {
    // 检查当前URL是否包含某些关键词，表明可能是因为错误而要跳转
    const currentUrl = window.location.href;
    const referrer = document.referrer;
    
    // 如果是从正常页面要跳转到错误页面，则阻止
    if ((currentUrl.includes('getQRCode') || referrer.includes('getQRCode')) && 
        !currentUrl.includes('/404') && !currentUrl.includes('/login')) {
      // 记录防止跳转的情况
      console.warn('防止可能的错误跳转:', { currentUrl, referrer });
      
      // 在这里不能阻止跳转，但可以记录信息
    }
  });
  
  // 拦截页面导航
  const navObserver = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        // 检查是否加载了404页面相关元素
        const notFoundElements = document.querySelectorAll('.not-found, .error-404, [data-error="404"], .page-404');
        if (notFoundElements.length > 0) {
          console.warn('检测到404页面元素，尝试恢复:', notFoundElements);
          
          // 显示错误消息
          showStatusMessage('页面出错，正在恢复...', 'error');
          
          // 尝试返回上一页
          setTimeout(() => {
            try {
              window.history.back();
            } catch (e) {
              console.error('无法返回上一页:', e);
            }
          }, 500);
          
          break;
        }
      }
    }
  });
  
  // 开始观察页面变化
  navObserver.observe(document.body, { childList: true, subtree: true });
  
  // 重写原有的fetch函数实现，更全面处理404错误
  const originalFetch = window.fetch;
  window.fetch = async function(input, init) {
    try {
      // 检查是否是QR码相关请求
      const isQrRequest = typeof input === 'string' && 
                          (input.includes('/getQRCode') || 
                           input.includes('/qrcode') ||
                           input.includes('/api/official/'));
      
      if (isQrRequest) {
        console.log('拦截到二维码相关请求:', input);
        
        try {
          const response = await originalFetch(input, init);
          
          // 检查是否是错误响应
          if (!response.ok) {
            console.warn('二维码请求返回错误状态:', response.status);
            
            // 复制响应
            const clonedResponse = response.clone();
            let errorData = {};
            
            try {
              // 尝试解析响应
              errorData = await clonedResponse.json();
            } catch (parseError) {
              console.error('解析响应失败:', parseError);
            }
            
            // 处理常见错误
            if (response.status === 400 || response.status === 401) {
              console.warn('返回认证错误:', errorData);
              
              // 创建一个成功的响应替代原始错误响应
              return new Response(JSON.stringify({
                code: 200,
                success: true,
                message: '已被拦截的请求，避免404跳转',
                data: {
                  url: null,
                  qrUrl: null,
                  errMsg: (errorData as Record<string, any>).message || '认证错误',
                  fromIntercept: true
                }
              }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
              });
            }
          }
          
          return response;
        } catch (fetchError: any) {
          // 现在这里有了完整的错误处理
          console.error('二维码请求发生网络错误:', fetchError);
          
          // 返回一个伪造的成功响应
          return new Response(JSON.stringify({
            code: 200,
            success: true,
            message: '网络错误已被拦截，避免404跳转',
            data: {
              url: null,
              qrUrl: null,
              errMsg: fetchError.message || '网络请求失败',
              fromIntercept: true
            }
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
      
      // 检查是否包含access_token相关错误
      const isAccessTokenRequest = typeof input === 'string' && 
                                  (input.includes('access_token') || 
                                   input.includes('/api/official/') ||
                                   input.includes('/api/wechat/'));
      
      if (isAccessTokenRequest) {
        try {
          const response = await originalFetch(input, init);
          
          // 如果响应不成功，检查是否是access_token缺失错误
          if (!response.ok) {
            const clonedResponse = response.clone();
            let errorData = {};
            
            try {
              errorData = await clonedResponse.json();
            } catch (e) {
              console.error('解析access_token响应失败:', e);
            }
            
            // 检查是否包含access_token missing错误
            const errorMessage = (errorData as any)?.message || '';
            const isAccessTokenError = 
                errorMessage.includes('access_token') || 
                errorMessage.includes('token') || 
                errorMessage.includes('授权');
                
            if (isAccessTokenError) {
              console.warn('拦截到access_token错误:', errorMessage);
              
              // 显示一条友好的消息
              showStatusMessage('授权已过期，请刷新页面重试', 'info');
              
              // 返回成功响应避免404
              return new Response(JSON.stringify({
                code: 200,
                success: true,
                message: 'access_token错误已被拦截，避免404跳转',
                data: {
                  errMsg: errorMessage || 'access_token错误',
                  fromIntercept: true
                }
              }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
              });
            }
          }
          
          return response;
        } catch (error: any) {
          console.error('access_token请求错误:', error);
          
          // 返回成功响应避免404
          return new Response(JSON.stringify({
            code: 200,
            success: true,
            message: 'access_token请求错误已被拦截',
            data: {
              errMsg: error.message || '网络请求失败',
              fromIntercept: true
            }
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
      
      // 非二维码或access_token请求，正常处理
      return originalFetch(input, init);
    } catch (error: any) {
      console.error('fetch拦截器捕获到错误:', error);
      
      // 处理错误
      handleLoginQrError(error);
      
      // 返回一个模拟的成功响应
      return new Response(JSON.stringify({
        code: 200,
        success: true,
        message: '错误已被拦截，避免404跳转',
        data: { message: error?.message || 'Unknown error' }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  };
  
  console.log('404跳转拦截已添加');
}

// 获取活动列表
async function fetchActivities() {
  try {
    console.log('获取活动列表...');
    const response = await fetchXhsActivitiesStatsAPI();
    if (response && Array.isArray(response)) {
      activities.value = response;
      console.log('获取到活动列表:', activities.value);
    } else {
      console.warn('活动列表返回格式不正确:', response);
      activities.value = [];
    }
  } catch (error: any) {
    console.error('获取活动列表失败:', error);
    activities.value = [];
  }
}

// 在组件挂载生命周期中添加验证和拦截
onMounted(async () => {
  // 首先添加404跳转拦截
  prevent404Redirect();
  
  // 添加Vue Router级别的拦截
  setupRouterGuards();
  
  // 检查认证状态
  const authStatus = checkAuthStatus();
  if (!authStatus.isLoggedIn) {
    console.warn('图文矩阵页面加载，用户未登录');
    showStatusMessage('请先登录后再使用图文矩阵功能', 'error');
    
    // 如果未登录，可以重定向到登录页
    setTimeout(() => {
      if (!isLogin.value) {
        router.push('/login');
      }
    }, 2000);
    return;
  }
  
  // 其他初始化操作
  console.log('图文矩阵页面已初始化，用户已登录');
  
  // 加载活动数据
  try {
    await fetchActivities();
  } catch (error) {
    handleError(error);
  }
  
  // 检查是否有从模板市场传递过来的模板数据
  checkAndApplyTemplateData();
});

// 添加Vue Router导航守卫设置
function setupRouterGuards() {
  console.log('设置Vue Router导航守卫...');
  
  // 获取router实例
  const router = useRouter();
  
  // 记录当前路由路径，用于检测变化
  let currentRoutePath = router.currentRoute.value.path;
  console.log('当前路由路径:', currentRoutePath);
  
  // 设置全局前置守卫
  const removeBeforeEach = router.beforeEach((to, from, next) => {
    console.log(`路由导航: ${from.path} -> ${to.path}`);
    
    // 检查是否导航到404页面
    if (to.name === 'error-404' || to.name === '404' || to.path.includes('/404') || to.path.includes('/not-found')) {
      console.warn('拦截到404路由导航:', to.path);
      
      // 显示错误提示
      showStatusMessage('检测到页面错误，已阻止跳转', 'error');
      
      // 判断是否是登录相关错误
      const isAuthError = from.path.includes('login') || 
                         (localStorage.getItem('lastAuthError') === 'true');
      
      if (isAuthError) {
        console.log('检测到认证相关错误，跳转到登录页');
        localStorage.removeItem('lastAuthError');
        
        // 延迟执行，确保当前导航完成
        setTimeout(() => {
          router.push('/login');
        }, 100);
        
        // 允许导航到登录页而不是404
        next('/login');
        return;
      }
      
      // 阻止导航到404，保持在当前页面
      next(false);
      return;
    }
    
    // 更新当前路径
    currentRoutePath = to.path;
    
    // 允许其他导航
    next();
  });
  
  // 监听路由错误
  const handleRouteError = (err: any) => {
    console.error('路由导航错误:', err);
    
    // 标记为认证错误，以便下次跳转时正确处理
    if (err.message && (
        err.message.includes('authentication') || 
        err.message.includes('authorize') || 
        err.message.includes('access_token') || 
        err.message.includes('login') ||
        err.message.includes('401') ||
        err.message.includes('权限') ||
        err.message.includes('认证')
    )) {
      localStorage.setItem('lastAuthError', 'true');
    }
    
    // 尝试阻止导航到错误页
    try {
      // 如果当前路径不是404，尝试恢复到当前路径
      if (!currentRoutePath.includes('/404') && !currentRoutePath.includes('/error')) {
        console.log('尝试重定向回:', currentRoutePath);
        router.replace(currentRoutePath);
      } else {
        // 如果当前已在错误页，尝试返回上一页或主页
        router.replace('/');
      }
    } catch (navError) {
      console.error('尝试重定向失败:', navError);
    }
    
    // 显示错误消息
    showStatusMessage('导航出错，请刷新页面重试', 'error');
  };
  
  // 添加路由错误监听
  router.onError(handleRouteError);
  
  // 观察路由变化，检测404页面内容
  watch(() => router.currentRoute.value, (newRoute) => {
    console.log('路由变化:', newRoute.path);
    
    // 检查路由是否有错误状态或404标记
    if (newRoute.name === 'error-404' || 
        newRoute.name === '404' || 
        newRoute.path.includes('/404') || 
        newRoute.path.includes('/not-found') ||
        newRoute.meta.error === true) {
      
      console.warn('路由变为错误状态，尝试恢复');
      
      // 延迟处理，确保DOM已更新
      setTimeout(() => {
        // 检查页面是否包含404内容
        const notFoundElements = document.querySelectorAll('.not-found, .error-404, [data-error="404"], .page-404');
        
        if (notFoundElements.length > 0) {
          console.warn('检测到404页面内容，尝试恢复');
          
          // 显示错误提示
          showStatusMessage('页面出错，正在尝试恢复...', 'error');
          
          // 先尝试返回上一页
          try {
            window.history.back();
          } catch (e) {
            console.error('无法返回上一页:', e);
            
            // 如果返回失败，尝试跳转到主页
            try {
              router.replace('/');
            } catch (navError) {
              console.error('跳转到主页失败:', navError);
            }
          }
        }
      }, 300);
    }
  }, { immediate: true });
  
  // 在组件销毁时清理导航守卫
onUnmounted(() => {
    // 移除前置守卫
    if (typeof removeBeforeEach === 'function') {
      removeBeforeEach();
    }
    
    // 无法直接移除错误处理器，但可以重置为空函数
    try {
      // @ts-ignore - 尝试重置错误处理器
      router.onError(() => {});
    } catch (e) {
      console.warn('无法重置路由错误处理器');
    }
  });
  
  console.log('Vue Router导航守卫设置完成');
  
  return removeBeforeEach;
}

// 修改拦截页面内容的方法，处理Vue组件级别的404
function interceptErrorContent() {
  // 监视DOM变化，查找并移除404内容
  const removeErrorContent = () => {
    // 查找可能的错误页面元素
    const errorElements = document.querySelectorAll(
      '.not-found, .error-404, [data-error="404"], .page-404, ' +
      '.error-page, .page-error, [data-page="error"], ' +
      '[data-test="error-page"], [data-testid="error-page"]'
    );
    
    if (errorElements.length > 0) {
      console.warn('找到并移除错误页面元素:', errorElements.length);
      
      // 显示友好提示
      showStatusMessage('检测到页面错误，正在恢复...', 'error');
      
      // 尝试隐藏而不是删除元素
      errorElements.forEach(el => {
        try {
          // 先尝试隐藏
          (el as HTMLElement).style.display = 'none';
        } catch (e) {
          console.error('隐藏错误元素失败:', e);
        }
      });
      
      // 尝试恢复内容
      try {
        // 找到主容器并恢复显示
        const mainContainer = document.querySelector('.main-container, .page-container, #app, #root');
        if (mainContainer) {
          (mainContainer as HTMLElement).style.display = 'block';
        }
      } catch (e) {
        console.error('恢复主容器失败:', e);
      }
      
      return true;
    }
    
    return false;
  };
  
  // 立即执行一次
  const hasError = removeErrorContent();
  
  // 设置定期检查
  const checkInterval = setInterval(() => {
    const found = removeErrorContent();
    
    // 如果发现错误页面，尝试更积极的恢复
    if (found) {
      try {
        // 尝试刷新组件内容而不刷新页面
        const router = useRouter();
        const currentRoute = router.currentRoute.value;
        
        // 如果当前路径不是预期的，尝试恢复
        if (currentRoute.path.includes('/404') || currentRoute.path.includes('/error')) {
          // 尝试重定向到应用主页
          router.replace('/');
        } else {
          // 触发组件重新渲染
          nextTick(() => {
            console.log('尝试刷新组件内容');
          });
        }
      } catch (e) {
        console.error('尝试恢复失败:', e);
      }
    }
  }, 1000);
  
  // 清理功能
  const cleanup = () => {
    clearInterval(checkInterval);
  };
  
  // 添加到组件卸载清理
  onUnmounted(cleanup);
  
  return cleanup;
}

// 处理平台切换
function handlePlatformChange(platform: 'all' | 'xhs' | 'douyin') {
  console.log('平台切换为:', platform);
  selectedPlatform.value = platform;
  
  // 如果当前没有活动，直接返回
  if (!currentQrTask.value) return;
  
  // 更新当前任务对象中的平台信息
  if (currentQrTask.value) {
    // 检查result对象的类型并处理
    if (!currentQrTask.value.result) {
      currentQrTask.value.result = {};
    } else if (typeof currentQrTask.value.result === 'string') {
      // 如果result是字符串（URL），将其保存并转换为对象
      const originalUrl = currentQrTask.value.result;
      currentQrTask.value.result = {
        qrCode: originalUrl
      };
    } else if (typeof currentQrTask.value.result !== 'object') {
      // 处理其他非对象类型
      currentQrTask.value.result = {};
    }
    
    // 设置平台信息
    currentQrTask.value.result.platform = platform;
  }
  
  // 判断二维码类型
  const qrCodeType = (currentQrTask.value as any).qrCodeType || 
                    (currentQrTask.value.noteId && !currentQrTask.value.id?.startsWith('activity_') ? 'note' : 'activity');
  
  // 更新任务标题
  if (qrCodeType === 'note') {
    currentQrTask.value.title = platform === 'all' ? '扫码查看全平台笔记' : 
                         platform === 'xhs' ? '扫码查看小红书笔记' : 
                         '扫码查看抖音笔记';
  } else {
    currentQrTask.value.title = platform === 'all' ? '扫码查看全平台笔记' : 
                         platform === 'xhs' ? '扫码查看小红书笔记' : 
                         '扫码查看抖音笔记';
  }
  
  try {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    let shareLink = '';
    
    // 根据二维码类型和ID生成链接
    if (qrCodeType === 'note' && currentQrTask.value.noteId) {
      // 笔记二维码 - 使用ID参数
      shareLink = `${origin}/chat#/xhs-auto-api?id=${currentQrTask.value.noteId}`;
      // 添加平台参数
      if (platform !== 'all') {
        shareLink += `&platform=${platform}`;
      }
    } else if (currentQrTask.value.activityId) {
      // 活动二维码 - 使用identifier参数
      shareLink = `${origin}/chat#/xhs-auto-api?identifier=${currentQrTask.value.activityId}`;
      // 添加平台参数
      if (platform !== 'all') {
        shareLink += `&platform=${platform}`;
      }
    } else if (currentQrTask.value.id?.startsWith('activity_')) {
      // 特殊情况 - 活动ID存储在task.id中
      const activityId = currentQrTask.value.id.replace('activity_', '');
      shareLink = `${origin}/chat#/xhs-auto-api?identifier=${activityId}`;
      if (platform !== 'all') {
        shareLink += `&platform=${platform}`;
      }
    }
    
    // 生成新的二维码URL
    if (shareLink) {
      const encodedShareLink = encodeURIComponent(shareLink);
      currentQrUrl.value = `https://xhs.aivip1.top/api/html-render/qrcode?data=${encodedShareLink}`;
      console.log('生成新的二维码URL:', currentQrUrl.value);
      
      // 更新任务对象中的二维码URL
      if (currentQrTask.value.result) {
        currentQrTask.value.result.qrCode = currentQrUrl.value;
      }
    }
  } catch (error) {
    console.error('生成二维码失败:', error);
    showStatusMessage(`生成${platform}平台二维码失败`, 'error');
  }
}

// 关闭二维码弹窗
function closeQrModal() {
  showQrModal.value = false;
  currentQrUrl.value = '';
  currentQrTask.value = null;
}

// declare global window interface to include xhs SDK
declare global {
  interface Window {
    xhs: {
      share: (options: {
        shareInfo: {
          type: 'normal' | 'video';
          title: string;
          content: string;
          images: string[];
        },
        verifyConfig: {
          appKey: string;
          nonce: string;
          timestamp: string;
          signature: string;
        },
        success?: () => void;
        fail?: (error: { message?: string }) => void;
      }) => void;
    };
  }
}

// 添加小红书分享SDK引入
const loadXhsShareSDK = () => {
  return new Promise<void>((resolve, reject) => {
    if (window.xhs) {
      console.log('小红书分享SDK已加载');
      resolve();
      return;
    }

    try {
      const script = document.createElement('script');
      script.src = 'https://fe-static.xiaohongshu.com/official-site/js/share-sdk.js';
      script.async = true;
      script.onload = () => {
        console.log('小红书分享SDK加载成功');
        resolve();
      };
      script.onerror = (error) => {
        console.error('小红书分享SDK加载失败:', error);
        reject(new Error('小红书分享SDK加载失败'));
      };
      document.body.appendChild(script);
    } catch (error: unknown) {
      console.error('添加小红书SDK脚本失败:', error);
      reject(error);
    }
  });
};

// 分享到小红书
async function shareToXhs(task: Task) {
  try {
    // 先加载SDK
    await loadXhsShareSDK();
    
    // 确保SDK已加载
    if (!window.xhs) {
      showStatusMessage('小红书分享SDK加载失败，请刷新后重试', 'error');
      showErrorDialog('小红书分享SDK加载失败，请刷新后重试');
      return;
    }
    
    // 获取URL查询参数
    const queryParams = new URLSearchParams(window.location.search);
    const debugMode = queryParams.get('debug') === '1';
    
    // 获取分享签名
    const signatureData = await getXhsSignatureAPI();
    if (!signatureData || !signatureData.signature) {
      showStatusMessage('获取分享签名失败', 'error');
      showErrorDialog('获取分享签名失败，请稍后重试');
      return;
    }
    
    console.log('分享签名获取成功:', signatureData);

    // 获取分享内容
    let title = '';
    let content = '';
    let images: string[] = [];
    
    if (task.result) {
      title = task.title || '';
      content = task.result.content || '';
      images = task.result.images || [];
    }
    
    if (!images.length && task.noteId) {
      try {
        // 如果没有图片但有笔记ID，尝试获取详情
        const result = await getTaskResultAPI(task.id);
        if (result && result.images && result.images.length) {
          images = result.images;
        }
      } catch (err) {
        console.error('获取笔记图片失败:', err);
      }
    }
    
    // 确保至少有一张图片
    if (!images.length) {
      showStatusMessage('笔记没有图片，无法分享到小红书', 'error');
      showErrorDialog('笔记没有图片，无法分享到小红书');
      return;
    }
    
    // 调用分享API
    window.xhs.share({
      shareInfo: {
        type: 'normal',  // 或 'video'
        title: title, // 分享标题
        content: content, // 分享内容
        images: images  // 图片地址（必须是服务器地址）
      },
      verifyConfig: {
        appKey: signatureData.appKey,
        nonce: signatureData.nonce,
        timestamp: signatureData.timestamp,
        signature: signatureData.signature
      },
      success: () => {
        console.log('分享成功');
        showStatusMessage('已成功分享到小红书', 'success');
        
        // 只在非调试模式下更新笔记状态
        if (!debugMode && task.id) {
          console.log('正在更新笔记状态...');
          
          // 使用fetch API更新笔记状态
          fetch(`/api/xhs-auto/notes/${task.id}/used`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          })
          .then(response => response.json())
          .then(data => {
            console.log('笔记状态已更新:', data);
          })
          .catch(error => {
            console.error('更新笔记状态失败:', error);
          });
        } else if (debugMode) {
          console.log('调试模式：分享成功，但不更新笔记状态');
        }
      },
      fail: (error) => {
        console.error('分享失败', error);
        showStatusMessage(`分享失败: ${error.message || '未知错误'}`, 'error');
        showErrorDialog(`分享失败: ${error.message || '未知错误'}`);
      }
    });
  } catch (error: unknown) {
    console.error('分享到小红书失败:', error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    showStatusMessage(`分享失败: ${errorMessage}`, 'error');
    showErrorDialog(`分享失败: ${errorMessage}`);
  }
}

// 显示错误弹窗
function showErrorDialog(message: string): void {
  // 创建弹窗元素
  const dialogContainer = document.createElement('div');
  dialogContainer.className = 'error-dialog-container';
  dialogContainer.style.position = 'fixed';
  dialogContainer.style.top = '0';
  dialogContainer.style.left = '0';
  dialogContainer.style.width = '100%';
  dialogContainer.style.height = '100%';
  dialogContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  dialogContainer.style.display = 'flex';
  dialogContainer.style.justifyContent = 'center';
  dialogContainer.style.alignItems = 'center';
  dialogContainer.style.zIndex = '9999';
  
  const dialogContent = document.createElement('div');
  dialogContent.className = 'error-dialog-content';
  dialogContent.style.backgroundColor = 'white';
  dialogContent.style.borderRadius = '8px';
  dialogContent.style.padding = '20px';
  dialogContent.style.maxWidth = '80%';
  dialogContent.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
  dialogContent.style.display = 'flex';
  dialogContent.style.flexDirection = 'column';
  dialogContent.style.alignItems = 'center';
  
  const errorIcon = document.createElement('div');
  errorIcon.className = 'error-icon';
  errorIcon.style.width = '50px';
  errorIcon.style.height = '50px';
  errorIcon.style.borderRadius = '50%';
  errorIcon.style.backgroundColor = '#ff3333';
  errorIcon.style.display = 'flex';
  errorIcon.style.justifyContent = 'center';
  errorIcon.style.alignItems = 'center';
  errorIcon.style.marginBottom = '15px';
  errorIcon.style.color = 'white';
  errorIcon.style.fontSize = '32px';
  errorIcon.style.fontWeight = 'bold';
  errorIcon.innerHTML = '!';
  
  const errorTitle = document.createElement('h3');
  errorTitle.className = 'error-title';
  errorTitle.style.margin = '0 0 10px';
  errorTitle.style.fontSize = '18px';
  errorTitle.style.color = '#333';
  errorTitle.textContent = '错误提示';
  
  const errorMessage = document.createElement('p');
  errorMessage.className = 'error-message';
  errorMessage.style.margin = '0 0 20px';
  errorMessage.style.fontSize = '16px';
  errorMessage.style.color = '#666';
  errorMessage.style.textAlign = 'center';
  errorMessage.textContent = message;
  
  const closeButton = document.createElement('button');
  closeButton.className = 'error-close-button';
  closeButton.style.padding = '8px 16px';
  closeButton.style.backgroundColor = '#f5f5f5';
  closeButton.style.border = '1px solid #ddd';
  closeButton.style.borderRadius = '4px';
  closeButton.style.color = '#333';
  closeButton.style.fontSize = '14px';
  closeButton.style.cursor = 'pointer';
  closeButton.textContent = '知道了';
  
  closeButton.addEventListener('click', () => {
    document.body.removeChild(dialogContainer);
  });
  
  dialogContent.appendChild(errorIcon);
  dialogContent.appendChild(errorTitle);
  dialogContent.appendChild(errorMessage);
  dialogContent.appendChild(closeButton);
  dialogContainer.appendChild(dialogContent);
  
  document.body.appendChild(dialogContainer);
  
  // 点击背景也可关闭弹窗
  dialogContainer.addEventListener('click', (e) => {
    if (e.target === dialogContainer) {
      document.body.removeChild(dialogContainer);
    }
  });
}

// 仅保留一个defineExpose，包含所有需要导出的方法
defineExpose({
  handleQrLoadError,
  shareToXhs
});

// 打开模板市场页面
function openTemplateMarket() {
  console.log('打开笔记模板市场');
  
  // 显示模板市场弹窗
  showTemplateMarket.value = true;
  
  // 显示成功消息
  showStatusMessage('正在加载模板市场...', 'info');
}

// 处理模板选择
function handleTemplateSelection(templates: Template[]) {
  console.log('选择了模板:', templates);
  
  // 清空之前的选择
  selectedTemplates.value = [];
  
  // 添加新选择的模板
  selectedTemplates.value = templates;
  
  // 更新模板ID到表单
  productForm.value.templateIds = templates.map(template => template.id.toString());
  
  // 显示成功消息
  showStatusMessage(`已选择${templates.length}个模板`, 'success');
}

// 从模板市场导入模板
function importTemplateFromMarket(templateData: any) {
  console.log('从模板市场导入模板:', templateData);
  
  try {
    if (!templateData || !templateData.title || !templateData.content) {
      showStatusMessage('模板数据不完整，无法导入', 'error');
      return false;
    }
    
    // 创建新的模板对象
    const newTemplate: Template = {
      id: templateData.id,
      title: templateData.title,
      content: templateData.content,
      coverImage: templateData.coverImage,
      source: 'template_market'
    };
    
    // 检查是否已存在相同ID的模板
    const existingIndex = selectedTemplates.value.findIndex(t => t.id === newTemplate.id);
    
    if (existingIndex >= 0) {
      // 如果已存在，则更新
      selectedTemplates.value[existingIndex] = newTemplate;
      showStatusMessage(`已更新模板: ${newTemplate.title}`, 'success');
    } else {
      // 如果不存在，则添加到数组
      selectedTemplates.value.push(newTemplate);
      showStatusMessage(`已添加模板: ${newTemplate.title}`, 'success');
    }
    
    return true;
  } catch (error) {
    console.error('导入模板失败:', error);
    showStatusMessage('导入模板失败，请重试', 'error');
    return false;
  }
}

// 检查并应用从模板市场传递过来的模板数据
function checkAndApplyTemplateData() {
  try {
    // 从localStorage获取模板数据
    const templateDataJson = localStorage.getItem('template_data');
    if (!templateDataJson) {
      console.log('未检测到模板数据');
      return;
    }
    
    console.log('检测到模板数据:', templateDataJson);
    
    // 解析JSON数据
    const templateData = JSON.parse(templateDataJson);
    
    // 验证数据有效性（检查时间戳，确保数据是最近添加的）
    const now = new Date().getTime();
    const dataTime = templateData.timestamp || 0;
    const isValid = now - dataTime < 300000; // 5分钟内的数据视为有效
    
    if (!isValid) {
      console.log('模板数据已过期，不应用');
      localStorage.removeItem('template_data');
      return;
    }
    
    // 检查是否是新格式（模板数组）
    if (templateData.templates && Array.isArray(templateData.templates)) {
      // 处理模板数组
      const newTemplates = templateData.templates.map((template: any) => ({
        id: template.id || Date.now(),
        title: template.title || '未命名模板',
        content: template.content || '',
        coverImage: template.coverImage || '',
        source: template.source || 'template_market'
      }));
      
      // 添加到已选择模板列表
      selectedTemplates.value = [...selectedTemplates.value, ...newTemplates];
      
      console.log(`成功应用${newTemplates.length}个模板`);
    } else {
      // 兼容旧格式（单个模板）
      const newTemplate: Template = {
        id: templateData.id || Date.now(),
        title: templateData.title || '未命名模板',
        content: templateData.content || '',
        coverImage: templateData.coverImage || '',
        source: templateData.source || 'template_market'
      };
      
      // 添加到已选择模板列表
      selectedTemplates.value.push(newTemplate);
      
      console.log('成功应用单个模板');
    }
    
    // 应用成功后清除localStorage中的数据，避免重复应用
    localStorage.removeItem('template_data');
    
    // 显示成功通知
    const count = templateData.templates?.length || 1;
    showStatusMessage(`已导入${count}个模板`, 'success');
    
    // 滚动到表单顶部，使用户能看到导入的模板
    setTimeout(() => {
      const formElement = document.querySelector('form');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 300);
  } catch (error) {
    console.error('检查模板数据时出错:', error);
    localStorage.removeItem('template_data');
  }
}

// 添加模板到选题列表
function addTemplatesToTitles() {
  if (selectedTemplates.value.length === 0) return;
  
  let addedCount = 0;
  
  // 遍历所有选中的模板
  selectedTemplates.value.forEach(template => {
    // 如果选题列表中不存在此标题，则添加到选题列表
    if (!productForm.value.titles.includes(template.title)) {
      productForm.value.titles.push(template.title);
      addedCount++;
    }
  });
  
  if (addedCount > 0) {
    showStatusMessage(`已成功添加${addedCount}个模板标题到选题列表`, 'success');
  } else {
    showStatusMessage('所有模板标题已存在于选题列表中', 'info');
  }
}

// 使用选中的模板
function useSelectedTemplates() {
  if (selectedTemplates.value.length === 0) return;
  
  // 如果只选择了一个模板，直接使用它
  if (selectedTemplates.value.length === 1) {
    productForm.value.title = selectedTemplates.value[0].title;
    showStatusMessage(`已应用模板: ${selectedTemplates.value[0].title}`, 'success');
  } 
  // 如果选择了多个模板，使用第一个并提示
  else {
    productForm.value.title = selectedTemplates.value[0].title;
    showStatusMessage(`已应用第一个模板: ${selectedTemplates.value[0].title}，共选择了${selectedTemplates.value.length}个模板`, 'success');
  }
  
  // 关闭模板显示
  selectedTemplates.value = [];
}

// 删除单个模板
function removeTemplate(index: number) {
  if (index >= 0 && index < selectedTemplates.value.length) {
    const templateTitle = selectedTemplates.value[index].title;
    const removedTemplateId = selectedTemplates.value[index].id.toString();
    
    // 从数组中删除模板
    selectedTemplates.value.splice(index, 1);
    
    // 更新表单中的模板ID
    productForm.value.templateIds = productForm.value.templateIds?.map(id => id.toString()).filter(id => id !== removedTemplateId) || [];
    
    showStatusMessage(`已移除模板: ${templateTitle}`, 'success');
  }
}

// 在组件的data部分添加以下变量
const showImagePreviewModal = ref(false);
const previewImageUrl = ref('');

// 添加图片预览方法
function showImagePreview(imageUrl: string) {
  previewImageUrl.value = imageUrl;
  showImagePreviewModal.value = true;
}

function closeImagePreview() {
  showImagePreviewModal.value = false;
}
</script>

<style scoped>
/* 动画效果 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 小红书风格弹窗 - 通用样式 */
.modal-container {
  background-color: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
}

.modal-content {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.1);
  max-width: 600px;
}

/* 笔记详情弹窗专用样式 */
.notes-modal-container {
  background-color: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(4px);
}

.notes-modal-content {
  background: #1a1a1a;
  color: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  width: 100%;
  max-width: 600px;
  padding: 4px; /* 减小内边距 */
}

.h-90vh {
  height: 90vh;
}

/* iframe容器样式 */
.note-detail-iframe {
  width: 100%;
  height: 100%;
  border: none;
  border-radius: 8px;
  background-color: #1a1a1a; /* 确保iframe背景也是黑色 */
}
</style> 