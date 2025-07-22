<template>
  <div class="image-generator-container h-full w-full relative overflow-hidden flex flex-col bg-white dark:bg-gray-900 min-h-screen">
    <!-- 状态通知 -->
    <div v-if="statusMessage" class="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 p-4 rounded-lg shadow-lg" :class="{
      'bg-green-100 text-green-800': statusType === 'success',
      'bg-red-100 text-red-800': statusType === 'error',
      'bg-blue-100 text-blue-800': statusType === 'info'
    }">
      {{ statusMessage }}
    </div>
    
    <!-- 图片查看器弹窗 - 使用高z-index确保显示在最上层 -->
    <div 
      v-if="showImageViewer" 
      class="fixed inset-0 bg-black bg-opacity-75 z-[9999] flex items-center justify-center" 
      style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; touch-action: none; backdrop-filter: blur(2px);"
      @click="closeImageViewer"
      @touchend="closeImageViewer"
    >
      <div 
        class="relative max-w-4xl max-h-screen flex flex-col items-center" 
        @click.stop
        @touchend.stop
      >
        <!-- 关闭按钮 - 移到图片上方 -->
        <div class="w-full flex justify-end mb-2">
          <button 
            @click.stop="closeImageViewer" 
            @touchend.stop="closeImageViewer"
            class="bg-white rounded-full p-2 hover:bg-gray-100 transition-colors shadow-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <!-- 图片容器 -->
        <div class="relative bg-gray-800 rounded-lg overflow-hidden">
          <img 
            :src="currentImageItem?.superUrl || currentViewingImage" 
            alt="预览图片" 
            class="max-h-[80vh] max-w-full object-contain bg-gray-100 dark:bg-gray-800 rounded" 
            @error="handleImageError"
          />
          <!-- 过期提示 -->
          <div class="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded shadow-md flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>1天后自动清理</span>
          </div>
        </div>
        
        <!-- 下载按钮 - 保持不变 -->
        <div class="mt-4 flex justify-center">
          <button 
            @click.stop="downloadImage(currentImageItem, currentImageIndex, currentImagePrompt)" 
            @touchend.stop="downloadImage(currentImageItem, currentImageIndex, currentImagePrompt)"
            class="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-md shadow-lg flex items-center transition-colors duration-200 font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            下载高清图片
          </button>
        </div>
      </div>
    </div>
    
    <!-- 主页面内容 -->
    <div class="flex-1 overflow-auto p-4 sm:p-6 md:p-8 flex flex-col min-h-0 bg-white dark:bg-gray-900">
      <div class="max-w-5xl mx-auto w-full flex-1 flex flex-col">
        <!-- 页面标题 -->
        <div class="mb-8 text-center">
          <h1 class="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-200 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            AI智能生图，一键生成高质量图片
          </h1>
          <p class="mt-2 text-gray-600 dark:text-gray-400">输入主题快速生成精美封面</p>
        </div>
        
        <!-- 智能模式选择 -->
        <div class="mb-8">
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-2">
            <!-- 主题图文模式 -->
            <div 
              class="relative p-6 border rounded-lg cursor-pointer transition-all duration-200 flex flex-col items-center"
              :class="activeMode === 'theme' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'"
              @click="selectMode('theme')"
            >
              <div class="w-16 h-16 bg-blue-100 dark:bg-blue-800 rounded-lg flex items-center justify-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 class="font-semibold text-gray-800 dark:text-gray-200">主题图文模式</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400 text-center mt-1">生成精美的主题图文封面</p>
              <div v-if="activeMode === 'theme'" class="absolute top-2 right-2">
                <div class="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>
            
            <!-- 表情封面模式 -->
            <div 
              class="relative p-6 border rounded-lg cursor-pointer transition-all duration-200 flex flex-col items-center"
              :class="activeMode === 'poster' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'"
              @click="selectMode('poster')"
            >
              <div class="w-16 h-16 bg-pink-100 dark:bg-pink-800 rounded-lg flex items-center justify-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 class="font-semibold text-gray-800 dark:text-gray-200">表情封面模式</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400 text-center mt-1">生成醒目的表情风格封面</p>
              <div v-if="activeMode === 'poster'" class="absolute top-2 right-2">
                <div class="w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>
            
            <!-- 文案配图模式 -->
            <div 
              class="relative p-6 border rounded-lg cursor-pointer transition-all duration-200 flex flex-col items-center"
              :class="activeMode === 'model' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'"
              @click="selectMode('model')"
            >
              <div class="w-16 h-16 bg-green-100 dark:bg-green-800 rounded-lg flex items-center justify-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <h3 class="font-semibold text-gray-800 dark:text-gray-200">文案配图模式</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400 text-center mt-1">智能文案和图片匹配效果</p>
              <div v-if="activeMode === 'model'" class="absolute top-2 right-2">
                <div class="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>
            
            <!-- 备忘录内页模式 -->
            <div 
              class="relative p-6 border rounded-lg cursor-pointer transition-all duration-200 flex flex-col items-center"
              :class="activeMode === 'memo' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'"
              @click="selectMode('memo')"
            >
              <div class="w-16 h-16 bg-yellow-100 dark:bg-yellow-800 rounded-lg flex items-center justify-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 class="font-semibold text-gray-800 dark:text-gray-200">备忘录内页</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400 text-center mt-1">生成专业备忘录内页样式</p>
              <div v-if="activeMode === 'memo'" class="absolute top-2 right-2">
                <div class="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>
            
            <!-- 拼图模式 -->
            <div 
              class="relative p-6 border rounded-lg cursor-pointer transition-all duration-200 flex flex-col items-center"
              :class="activeMode === 'grid' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'"
              @click="selectMode('grid')"
            >
              <div class="w-16 h-16 bg-purple-100 dark:bg-purple-800 rounded-lg flex items-center justify-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
              <h3 class="font-semibold text-gray-800 dark:text-gray-200">图片拼图</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400 text-center mt-1">上传多张图片制作拼图</p>
              <div v-if="activeMode === 'grid'" class="absolute top-2 right-2">
                <div class="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 当前选择的模式说明 -->
          <div class="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div class="flex items-center text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span class="text-gray-700 dark:text-gray-300">
                <span class="font-medium">当前模式：</span>
                <template v-if="activeMode === 'theme'">主题图文模式 - 适合正式场景，生成带有主题的图文封面</template>
                <template v-else-if="activeMode === 'poster'">表情封面模式 - 适合活泼场景，生成带有表情元素的封面</template>
                <template v-else-if="activeMode === 'model'">文案配图模式 - 智能匹配文案和图片，效果更加精美</template>
                <template v-else-if="activeMode === 'memo'">备忘录内页模式 - 生成专业的备忘录内页样式，适合记录和分享笔记</template>
                <template v-else-if="activeMode === 'grid'">图片拼图模式 - {{ getGridModeDescription() }}</template>
              </span>
            </div>
          </div>
        </div>
        
        <!-- 生成表单 -->
        <form @submit.prevent="submitForm" class="mb-8">
          <!-- 主题输入 -->
          <div class="mb-6">
            <label for="keyword" class="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">主题</label>
            <div class="relative">
              <input 
                type="text" 
                id="keyword" 
                v-model="form.keyword" 
                class="w-full px-5 py-3 border-2 border-blue-200 dark:border-blue-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm transition-all duration-200"
                placeholder="请输入图片主题，例如：'山茶油'、'春天的森林'"
                required
              />
            </div>
            <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">输入越详细的描述，生成的图片效果越好</p>
          </div>
          
          <!-- 额外字段输入 - 根据当前模式显示不同的输入框 -->
          <div v-if="modeFieldsConfig[activeMode] && modeFieldsConfig[activeMode].length > 0" class="mb-6 space-y-4">
            <div v-for="field in modeFieldsConfig[activeMode]" :key="field.key" class="mb-4">
              <label :for="field.key" class="block text-md font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ field.label }}
              </label>
              <div class="relative">
                <!-- 多图片上传控件 -->
                <div v-if="field.type === 'multi-image'" class="w-full">
                  <!-- 已上传图片预览 -->
                  <div v-if="Object.keys(uploadedImages).filter(key => typeof key === 'string' && !key.includes('_url')).length > 0" class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    <div 
                      v-for="key in Object.keys(uploadedImages).filter(k => typeof k === 'string' && !k.includes('_url')).sort()" 
                      :key="key" 
                      class="relative group"
                    >
                      <div class="rounded-lg overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 aspect-square bg-gray-50 dark:bg-gray-800 flex items-center justify-center relative">
                        <img 
                          :src="uploadedImages[`${key}_url`] || `https://pri-cdn-oss.chuangkit.com/svg_build/render_result/${uploadedImages[key]}?x-oss-process=image/resize,w_300`" 
                          :alt="`图片 ${String(key).replace('image', '')}`" 
                          class="w-full h-full object-cover"
                        />
                        <div class="absolute inset-0 bg-black opacity-0 group-hover:opacity-40 transition-opacity duration-200"></div>
                        <!-- 在图片上显示序号标签 -->
                        <div class="absolute bottom-1 left-1 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-md">
                          {{ String(key).replace('image', '') }}
                        </div>
                      </div>
                      <button 
                        @click.stop.prevent="removeUploadedImage(String(key))"
                        class="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors duration-200 z-10 opacity-0 group-hover:opacity-100"
                        type="button"
                        aria-label="移除图片"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <!-- 图片上传按钮 -->
                  <div v-if="Object.keys(uploadedImages).filter(key => typeof key === 'string' && !key.includes('_url')).length < 4" class="flex justify-center">
                    <label 
                      for="file-upload-multi" 
                      class="cursor-pointer bg-white dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 flex flex-col items-center justify-center w-full h-36 relative transition-all duration-200 hover:border-blue-400 dark:hover:border-blue-500"
                      :class="{'opacity-80 bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700': uploadingImage}"
                    >
                      <!-- 上传中状态 -->
                      <div v-if="uploadingImage" class="absolute inset-0 flex flex-col items-center justify-center z-10">
                        <div class="w-10 h-10 mb-2">
                          <svg class="animate-spin w-full h-full text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </div>
                        <span class="text-blue-600 font-medium dark:text-blue-400 animate-pulse">正在上传图片...</span>
                      </div>
                      
                      <!-- 普通状态 -->
                      <div v-else class="flex flex-col items-center justify-center w-full h-full">
                        <div class="w-12 h-12 mb-2 text-gray-300 dark:text-gray-600">
                          <svg xmlns="http://www.w3.org/2000/svg" class="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <span class="text-gray-600 dark:text-gray-400 text-sm mb-1">点击或拖放图片到此处</span>
                        <span class="text-gray-500 dark:text-gray-500 text-xs">
                          支持多选，已上传 {{ Object.keys(uploadedImages).filter(key => typeof key === 'string' && !key.includes('_url')).length }}/4 张图片
                        </span>
                      </div>
                    </label>
                    <input 
                      id="file-upload-multi" 
                      type="file" 
                      class="hidden" 
                      accept="image/*"
                      @change="uploadMultiImage"
                      :disabled="uploadingImage"
                      multiple
                    />
                  </div>
                  
                  <!-- 已上传图片数量提示 -->
                  <div class="mt-2 text-sm text-gray-500 dark:text-gray-400 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>
                      {{ getImageCountText() }}
                    </span>
                  </div>
                </div>
                
                <!-- 使用textarea替代input用于段落内容字段 -->
                <textarea 
                  v-else-if="field.key.includes('Content')"
                  :id="field.key" 
                  v-model="form.additionalFields[field.key]" 
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-y"
                  :placeholder="field.placeholder"
                  rows="4"
                ></textarea>
                <!-- 普通输入框用于标题等短文本 -->
                <input 
                  v-else
                  type="text" 
                  :id="field.key" 
                  v-model="form.additionalFields[field.key]" 
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  :placeholder="field.placeholder"
                />
              </div>
            </div>
          </div>
          
          <!-- 生成按钮 -->
          <div class="flex justify-center mt-8">
            <button
              type="submit"
              class="px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all duration-300 focus:outline-none flex items-center justify-center shadow-md hover:shadow-lg font-medium"
              :disabled="submitting"
            >
              <svg xmlns="http://www.w3.org/2000/svg" v-if="!submitting" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <svg v-else class="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ submitting ? '生成中...' : '生成封面' }}
            </button>
            <button
              type="button"
              @click="resetForm"
              class="ml-4 px-6 py-4 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 focus:outline-none"
            >
              重置
            </button>
          </div>
        </form>
        
        <!-- 生成结果 -->
        <div v-if="generatedImages.length > 0" class="mb-12">
          <h2 class="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">生成结果</h2>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            <div 
              v-for="(image, index) in generatedImages" 
              :key="index" 
              class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden group relative flex flex-col"
            >
              <!-- 图片容器 -->
              <div 
                class="aspect-square cursor-pointer relative overflow-hidden"
                @click.stop="handleImageClick(image, index, form.keyword)"
                title="点击放大查看"
              >
                <img 
                  :src="image.superUrl || image.url" 
                  :alt="`生成图片 ${index + 1}`" 
                  class="w-full h-full object-contain bg-gray-50 dark:bg-gray-800" 
                />
                <!-- 过期提示标记 -->
                <div class="absolute top-2 right-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-sm shadow-sm opacity-70 hover:opacity-100 transition-opacity">
                  1天后过期
                </div>
                <!-- 点击放大提示 -->
                <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div class="text-white flex items-center bg-black bg-opacity-60 px-3 py-1.5 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                    <span class="text-sm">点击放大</span>
                  </div>
                </div>
              </div>
              
              <!-- 下载按钮 -->
              <div class="p-2 flex justify-center bg-gray-50 dark:bg-gray-800">
                <button 
                  @click.stop="downloadImage(image, index, form.keyword)" 
                  class="flex items-center justify-center w-full px-3 py-2 text-gray-100 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 rounded-md shadow transition-colors duration-200 font-medium"
                  title="下载图片"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  下载图片
                </button>
              </div>
            </div>
          </div>

          <!-- 继续生成按钮 -->
          <div class="flex justify-center mt-6">
            <button
              type="button"
              @click="continueGenerating"
              class="px-8 py-4 border-2 border-blue-500 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-300 focus:outline-none flex items-center justify-center shadow-sm hover:shadow-md font-medium"
              :disabled="continuingGeneration"
            >
              <svg v-if="!continuingGeneration" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <svg v-else class="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ continuingGeneration ? '生成中...' : '继续生成更多' }}
            </button>
          </div>
        </div>
        
        <!-- 生成中等待界面 -->
        <div v-else-if="submitting" class="mb-12 border border-gray-200 dark:border-gray-700 rounded-lg p-8">
          <div class="flex flex-col items-center justify-center text-center">
            <div class="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
            <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">AI正在为您生成精美封面...</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">请稍候，这可能需要几秒钟时间</p>
          </div>
        </div>
        
        <!-- 历史记录 -->
        <div class="flex-1 flex flex-col pb-8 min-h-[300px]">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold text-gray-800 dark:text-gray-200">历史记录</h2>
            <div class="flex items-center space-x-4">
              <!-- 展开/折叠所有按钮 -->
              <button v-if="historyTasks.length > 0" @click="toggleAllTasks" class="text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 flex items-center text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path v-if="isAllExpanded" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 11l7-7 7 7M5 19l7-7 7 7" />
                  <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 13l-7 7-7-7M19 5l-7 7-7-7" />
                </svg>
                {{ isAllExpanded ? '全部折叠' : '全部展开' }}
              </button>
              <!-- 刷新历史按钮 -->
              <button @click="refreshHistory" class="text-blue-500 flex items-center" :disabled="loadingHistory">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {{ loadingHistory ? '加载中...' : '刷新历史' }}
              </button>
            </div>
          </div>

          <!-- 数据自动清理提示 -->
          <div class="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div class="flex items-center text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span class="text-gray-700 dark:text-gray-300">
                系统会自动清理1天前的历史记录数据，请及时下载需要保存的图片。
              </span>
            </div>
          </div>

          <!-- 历史记录搜索框 -->
          <div class="mb-4">
            <div class="relative">
              <input 
                type="text" 
                v-model="historySearchQuery" 
                class="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="搜索历史主题..."
                @input="searchHistory"
              />
              <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <button 
                v-if="historySearchQuery" 
                @click="clearHistorySearch" 
                class="absolute inset-y-0 right-0 flex items-center pr-3"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400 hover:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          <!-- 加载中 -->
          <div v-if="loadingHistory" class="text-center py-8">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <p class="mt-2 text-gray-500 dark:text-gray-400">加载历史记录中...</p>
          </div>
          
          <!-- 无历史记录 -->
          <div v-else-if="filteredHistoryTasks.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
            {{ historySearchQuery ? '没有找到匹配的历史记录' : (historyError ? historyError : '暂无历史记录') }}
          </div>
          
          <!-- 历史记录列表但无有效图片 -->
          <div v-else-if="allFilteredTasksHaveNoImages" class="text-center py-8 text-gray-500 dark:text-gray-400">
            已找到历史记录，但没有有效的图片可以显示
          </div>
          
          <!-- 历史记录列表（按任务分组） -->
          <div v-else class="space-y-4">
            <!-- 遍历每个任务 -->
            <div v-for="task in filteredHistoryTasks" :key="task.id" class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <!-- 任务标题和信息（可点击折叠/展开） -->
              <div 
                @click="toggleTask(task.id)" 
                class="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
              >
                <div>
                  <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200">{{ task.prompt }}</h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{ formatDate(task.createTime) }} · {{ task.images.length || 0 }}张图片
                  </p>
                </div>
                <div class="flex items-center">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    class="h-5 w-5 text-gray-500 transition-transform duration-300" 
                    :class="expandedTasks.includes(task.id) ? 'transform rotate-180' : ''"
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                  </svg>
                </div>
              </div>
              
              <!-- 任务内容（可折叠） -->
              <transition name="expand">
                <div 
                  v-if="expandedTasks.includes(task.id)" 
                  class="border-t border-gray-200 dark:border-gray-700 p-4"
                  @click.stop
                >
                  <!-- 没有图片 -->
                  <div v-if="!task.images || task.images.length === 0" class="text-center py-4 text-gray-500 dark:text-gray-400">
                    该任务没有可显示的图片
                  </div>
                  
                  <!-- 图片网格 -->
                  <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    <div 
                      v-for="(image, index) in task.images" 
                      :key="index" 
                      class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden group relative flex flex-col"
                    >
                      <!-- 图片容器 -->
                      <div 
                        class="aspect-square cursor-pointer relative overflow-hidden"
                        @click.stop="handleImageClick(image, index, task.prompt)"
                        title="点击放大查看"
                      >
                        <img 
                          :src="image.superUrl || image.url" 
                          :alt="`${task.prompt} ${index + 1}`" 
                          class="w-full h-full object-contain bg-gray-50 dark:bg-gray-800" 
                        />
                        <!-- 过期提示标记 -->
                        <div class="absolute top-2 right-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-sm shadow-sm opacity-70 hover:opacity-100 transition-opacity">
                          1天后过期
                        </div>
                        <!-- 点击放大提示 -->
                        <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <div class="text-white flex items-center bg-black bg-opacity-60 px-3 py-1.5 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                            </svg>
                            <span class="text-sm">点击放大</span>
                          </div>
                        </div>
                      </div>
                      
                      <!-- 下载按钮 -->
                      <div class="p-2 flex justify-center bg-gray-50 dark:bg-gray-800">
                        <button 
                          @click.stop="downloadImage(image, index, task.prompt)" 
                          class="flex items-center justify-center w-full px-3 py-2 text-gray-100 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 rounded-md shadow transition-colors duration-200 font-medium"
                          title="下载图片"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          下载图片
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </transition>
            </div>
            
            <!-- 加载更多按钮 -->
            <div v-if="hasMorePages" class="flex justify-center mt-6">
              <button 
                @click="loadMoreHistory" 
                class="px-6 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md transition-all duration-200 focus:outline-none flex items-center"
                :disabled="loadingMore"
              >
                <svg v-if="loadingMore" class="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {{ loadingMore ? '加载中...' : '加载更多' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 底部填充区域，确保页面铺满 -->
    <div class="h-16 bg-white dark:bg-gray-900"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue';
import { generateImageAPI, getUserHistoryTasksAPI, getImageDownloadUrlAPI, uploadImageAPI } from '@/api/imageGenerator';
import { useAuthStore } from '@/store';
import axios from 'axios';

// 定义图片项接口
interface ImageItem {
  url: string;
  imageId: string;
  taskId: string;
  superUrl?: string;
  originalBuffer?: any;
}

// 定义历史任务项的接口
interface HistoryTask {
  id: number;
  prompt: string;
  createTime: Date | string;
  mainImageUrl: string;
  imageCount: number;
  taskId: string;
  images: ImageItem[];
  [key: string]: any;
}

// 定义字段配置接口
interface FieldConfig {
  key: string;
  label: string;
  placeholder: string;
  type?: string;
}

// 表单数据
const form = ref({
  keyword: '',
  count: 4,  // 保留默认值，但不再显示控制组件
  additionalFields: {} as Record<string, string>
});

// 状态变量
const submitting = ref(false);
const generatedImages = ref<ImageItem[]>([]);
const historyTasks = ref<HistoryTask[]>([]);
const statusMessage = ref('');
const statusType = ref<'success' | 'error' | 'info' | ''>('');
const loadingHistory = ref(false);
const historyError = ref('');
const loadingMore = ref(false);
const historyPage = ref(1);
const historyLimit = 10;
const activeMode = ref<'theme' | 'poster' | 'model' | 'memo' | 'grid'>('theme');
const hasMorePages = ref(true);
const expandedTasks = ref<number[]>([]);

// 添加继续生成相关的状态变量
const continuingGeneration = ref(false);
const currentTaskId = ref<number | null>(null);
const currentPage = ref(1);

// 不同模式的输入字段配置
const modeFieldsConfig: Record<string, FieldConfig[]> = {
  theme: [], // 主题图文模式只需要主标题
  poster: [], // 表情封面模式只需要主标题
  model: [
    { key: 'subtitle', label: '副标题', placeholder: '请输入副标题' },
    { key: 'paragraph1Title', label: '小标题1', placeholder: '请输入小标题1' },
    { key: 'paragraph1Content', label: '正文1内容', placeholder: '请输入正文1内容' },
    { key: 'paragraph2Title', label: '小标题2', placeholder: '请输入小标题2' },
    { key: 'paragraph2Content', label: '正文2内容', placeholder: '请输入正文2内容' },
    { key: 'paragraph3Title', label: '小标题3', placeholder: '请输入小标题3' },
    { key: 'paragraph3Content', label: '正文3内容', placeholder: '请输入正文3内容' }
  ],
  memo: [
    { key: 'paragraph1Title', label: '段落标题', placeholder: '请输入段落标题' },
    { key: 'paragraph1Content', label: '段落内容', placeholder: '请输入段落内容，可以详细描述' }
  ],
  grid: [
    { key: 'subtitle', label: '副标题', placeholder: '请输入副标题' },
    { key: 'images', label: '图片上传', placeholder: '请上传图片（最多4张）', type: 'multi-image' }
  ]
};

// 不同模式对应的intellectId
const modeIntellectIdMap: Record<'theme' | 'poster' | 'model' | 'memo' | 'grid', number> = {
  theme: 267,  // 大字报模式
  poster: 280, // 表情封面模式
  model: 231,  // 文案配图模式
  memo: 374,   // 备忘录内页模式
  grid: 147    // 拼图模式，实际intellectId会根据图片数量动态选择
};

// 不同模式对应的replaceId配置
const modeReplaceIdMap = {
  theme: { title: "7398" },
  poster: { title: "7532" },
  model: { 
    title: "6867", 
    subtitle: "6869",
    paragraph1Title: "6861",
    paragraph1Content: "6862",
    paragraph2Title: "6863",
    paragraph2Content: "6864",
    paragraph3Title: "6865",
    paragraph3Content: "6866"
  },
  memo: {
    title: "7860",
    paragraph1Title: "7875",
    paragraph1Content: "7876"
  },
  grid: {
    title: "5487",
    subtitle: "5488",
    image1: "5484", // 更新为正确的四宫格replaceId
    image2: "5485", // 更新为正确的四宫格replaceId
    image3: "5486", // 更新为正确的四宫格replaceId
    image4: "5493"  // 更新为正确的四宫格replaceId
  }
};

// 图片上传相关状态
const uploadingImage = ref(false);
const uploadedImages = ref<{[key: string]: string}>({});

const isAllExpanded = computed(() => {
  if (historyTasks.value.length === 0) return false;
  return historyTasks.value.every(task => expandedTasks.value.includes(task.id));
});
const allTasksHaveNoImages = computed(() => {
  // 检查是否所有任务都没有有效图片
  if (historyTasks.value.length === 0) return false;
  return historyTasks.value.every(task => 
    !task.images || task.images.length === 0
  );
});

// 历史记录搜索
const historySearchQuery = ref('');
const filteredHistoryTasks = computed(() => {
  if (!historySearchQuery.value.trim()) return historyTasks.value;
  
  const query = historySearchQuery.value.toLowerCase().trim();
  return historyTasks.value.filter(task => 
    task.prompt.toLowerCase().includes(query)
  );
});

// 检查是否所有过滤后的任务都没有图片
const allFilteredTasksHaveNoImages = computed(() => {
  // 检查是否所有任务都没有有效图片
  if (filteredHistoryTasks.value.length === 0) return false;
  return filteredHistoryTasks.value.every(task => 
    !task.images || task.images.length === 0
  );
});

// 图片查看器状态
const showImageViewer = ref(false);
const currentViewingImage = ref('');
const currentImageIndex = ref(0);
const currentImagePrompt = ref('');
const currentImageItem = ref<ImageItem | null>(null);

// 获取用户信息
const authStore = useAuthStore();
const isLogin = computed(() => authStore.isLogin);

// 生命周期钩子
onMounted(async () => {
  if (isLogin.value) {
    // 显示加载提示
    showStatusMessage('正在加载历史记录，同时清理1天前的数据...', 'info');
    
    await loadHistoryTasks();
    
    // 加载完成后，显示清理完成提示
    if (historyTasks.value.length > 0) {
      showStatusMessage('历史记录加载完成，1天前的数据已被清理', 'success');
    }
  }
});

// 选择生成模式
function selectMode(mode: 'theme' | 'poster' | 'model' | 'memo' | 'grid') {
  activeMode.value = mode;
  // 切换模式时清空额外字段
  form.value.additionalFields = {};
  
  // 如果切换到非拼图模式，清空已上传的图片
  if (mode !== 'grid') {
    uploadedImages.value = {};
  }
  
  console.log(`已选择模式: ${mode}`);
}

// 加载历史任务
async function loadHistoryTasks() {
  loadingHistory.value = true;
  historyError.value = '';
  
  try {
    console.log('开始加载历史任务，参数：', { page: historyPage.value, limit: historyLimit });
    
    const response = await getUserHistoryTasksAPI({
      page: historyPage.value,
      limit: historyLimit
    });
    
    console.log('历史任务API响应：', response);
    
    // 处理响应结构
    if (response.code === 200) {
      // 处理可能的多层嵌套数据
      let responseData = response.data;
      
      // 如果存在多层嵌套，提取最内层的数据
      if (responseData && (responseData as any).data) {
        responseData = (responseData as any).data;
      }
      
      console.log('处理后的历史任务数据:', responseData);
      
      let historyList = null;
      
      // 提取历史记录列表
      if (responseData && responseData.history && Array.isArray(responseData.history)) {
        historyList = responseData.history;
      } else if (responseData && responseData.data && responseData.data.history && Array.isArray(responseData.data.history)) {
        historyList = responseData.data.history;
      }
      
      if (historyList && historyList.length > 0) {
        console.log('获取到历史任务数量：', historyList.length);
        
        // 处理每个历史记录项
        const validHistoryTasks = historyList.map((task: HistoryTask) => {
          // 过滤无效图片
          if (task.images && Array.isArray(task.images)) {
            task.images = task.images.filter(img => img && img.url && !img.url.includes('null'));
          } else {
            task.images = [];
          }
          
          // 设置主图片URL
          if (!task.mainImageUrl || task.mainImageUrl.includes('null')) {
            task.mainImageUrl = (task.images && task.images.length > 0) ? task.images[0].url : '';
          }
          
          return task;
        });
        
        const newTasks = historyPage.value === 1 ? 
          validHistoryTasks : 
          [...historyTasks.value, ...validHistoryTasks];
        
        historyTasks.value = newTasks;
        console.log('处理后的历史任务数量：', historyTasks.value.length);
      } else {
        console.log('暂无历史记录数据');
      }
    } else {
      console.warn('历史任务API返回错误:', response);
      historyError.value = response.message || '未知错误';
      showStatusMessage(historyError.value, 'error');
    }
  } catch (error: any) {
    console.error('获取历史记录失败:', error);
    // 检查是否为身份验证错误
    if (error.response?.status === 401) {
      historyError.value = '请先登录后再查看历史记录';
    } else {
      historyError.value = error.message || '未知错误';
    }
    showStatusMessage(historyError.value, 'error');
  } finally {
    loadingHistory.value = false;
  }
}

// 加载更多历史记录
async function loadMoreHistory() {
  if (loadingMore.value) return;
  
  loadingMore.value = true;
  historyPage.value += 1;
  
  try {
    console.log('加载更多历史记录，页码：', historyPage.value);
    await loadHistoryTasks();
    
    // 判断是否还有更多页
    if (historyTasks.value.length % historyLimit !== 0) {
      hasMorePages.value = false;
      console.log('没有更多历史记录了');
    }
  } catch (error) {
    console.error('加载更多历史记录失败:', error);
  } finally {
    loadingMore.value = false;
  }
}

// 刷新历史记录
async function refreshHistory() {
  console.log('开始刷新历史记录');
  historyPage.value = 1;
  historyTasks.value = [];
  hasMorePages.value = true;
  
  // 显示包含清理提示的加载信息
  showStatusMessage('正在刷新历史记录，同时清理1天前的数据...', 'info');
  
  await loadHistoryTasks();
  console.log('历史记录刷新完成，任务数量:', historyTasks.value.length);
  
  // 更新状态消息
  showStatusMessage('历史记录已更新，1天前的数据已被清理', 'success');
}

// 提交表单
async function submitForm() {
  if (!form.value.keyword) {
    showStatusMessage('请输入关键词', 'error');
    return;
  }
  
  // 检查是否为拼图模式且需要上传图片
  const imageKeys = Object.keys(uploadedImages.value).filter(key => typeof key === 'string' && !key.includes('_url'));
  const imageCount = imageKeys.length;
  if (activeMode.value === 'grid' && imageCount < 2) {
    showStatusMessage('请至少上传2张图片', 'error');
    return;
  }
  
  submitting.value = true;
  generatedImages.value = [];
  
  // 重置继续生成相关状态
  currentTaskId.value = null;
  currentPage.value = 1;
  
  // 获取当前选择的模式和对应的intellectId
  const mode = activeMode.value;
  let intellectId = modeIntellectIdMap[mode];
  
  // 如果是拼图模式，根据图片数量选择不同的intellectId
  if (mode === 'grid') {
    if (imageCount === 2) {
      intellectId = 148; // 2张图片用二宫格(148)
    } else if (imageCount === 3) {
      intellectId = 147; // 3张图片用三宫格(147)
    } else if (imageCount === 4) {
      intellectId = 130; // 4张图片用四宫格(130)
    }
  }
  
  // 准备完整的请求参数
  const requestParams = {
    title: form.value.keyword,
    type: 'theme',
    count: form.value.count,
    intellectId,
    additionalFields: form.value.additionalFields,
    pageNo: 1 // 初次生成使用页码1
  };
  
  // 打印详细的请求参数
  console.log('======== 前端生成图片请求参数 ========');
  console.log(`模式: ${mode}, 模式ID: ${intellectId}, 图片数量: ${imageCount}`);
  console.log(`标题: ${form.value.keyword}`);
  console.log('完整请求参数:');
  console.log(JSON.stringify(requestParams, null, 2));
  
  // 如果是拼图模式，打印上传的图片信息
  if (mode === 'grid') {
    console.log('上传的图片信息:');
    imageKeys.forEach(key => {
      console.log(`${key}: ${uploadedImages.value[key]} (${uploadedImages.value[`${key}_url`] || '无URL'})`);
    });
  }
  console.log('=======================================');
  
  try {
    // 发送API请求
    console.log(`开始发送生成图片请求...`);
    
    const response = await generateImageAPI(requestParams);
    
    console.log('======== 生成图片响应 ========');
    console.log(JSON.stringify(response, null, 2));
    console.log('===============================');
    
    // 检查响应结构 - 处理多层嵌套的数据
    if (response.code === 200) {
      // 获取真正的数据，可能在response.data.data中
      const responseData = response.data && (response.data as any).data ? (response.data as any).data : response.data;
      
      console.log('处理后的响应数据:', responseData);
      
      // 保存任务ID和页码
      if (responseData.taskId) {
        currentTaskId.value = typeof responseData.taskId === 'number' ? 
          responseData.taskId : parseInt(responseData.taskId);
        console.log('保存当前任务ID:', currentTaskId.value);
      }
      
      if (responseData.currentPage) {
        currentPage.value = responseData.currentPage;
      } else {
        currentPage.value = 1;
      }
      
      // 提取任务ID和图片数据
      if (responseData && responseData.images && Array.isArray(responseData.images)) {
        const images = responseData.images.filter((img: ImageItem) => img && img.url && !img.url.includes('null'));
        
        if (images.length > 0) {
          generatedImages.value = images;
          showStatusMessage('图片生成成功', 'success');
          
          // 重新加载历史记录
          console.log('生成成功，准备刷新历史记录');
          await refreshHistory();
          console.log('历史记录刷新完成');
          
          // 清空上传的图片记录
          uploadedImages.value = {};
          // 清空图片相关的additionalFields
          for (let i = 1; i <= 4; i++) {
            delete form.value.additionalFields[`image${i}`];
          }
        } else {
          console.error('没有找到有效的图片:', responseData);
          showStatusMessage('未能获取有效图片', 'error');
        }
      } else {
        console.error('响应数据格式不正确:', responseData);
        showStatusMessage('获取图片数据失败', 'error');
      }
    } else {
      showStatusMessage(response.message || '图片生成失败', 'error');
      console.error('生成图片失败:', response);
    }
  } catch (error: any) {
    console.error('======== 生成图片请求失败 ========');
    console.error(`错误消息: ${error.message || '未知错误'}`);
    if (error.response) {
      console.error(`响应状态码: ${error.response.status}`);
      console.error(`响应数据:`, error.response.data);
    }
    console.error('===================================');
    showStatusMessage(error.message || '生成图片失败，请稍后重试', 'error');
  } finally {
    submitting.value = false;
  }
}

// 重置表单
function resetForm() {
  form.value = {
    keyword: '',
    count: 4,
    additionalFields: {}
  };
  generatedImages.value = [];
}

// 定义下载API返回数据类型
interface DownloadResponse {
  downloadUrl?: string;
  fileName?: string;
  data?: {
    downloadUrl?: string;
    fileName?: string;
  };
}

// 修改下载图片函数，处理嵌套的响应结构
async function downloadImage(image: ImageItem | null, index: number, prompt: string = '') {
  if (!image || !image.url) {
    console.error('无效的图片数据');
    showStatusMessage('无法下载图片，无效的图片数据', 'error');
    return;
  }

  // 如果没有任务ID，则无法下载高质量图片
  if (!image.taskId) {
    console.error('缺少任务ID，无法获取高质量下载链接');
    showStatusMessage('无法下载图片，缺少任务ID', 'error');
    return;
  }

  // 显示下载中提示
  showStatusMessage('正在获取下载链接...', 'info');
  
  try {
    console.log('通过任务ID下载图片:', image.taskId);
    
    const response = await getImageDownloadUrlAPI(image.taskId);
    console.log('下载图片API响应:', response);
    
    // 设置文件名
    const fileName = prompt 
      ? `${prompt}_${index + 1}.jpg` 
      : `图片_${form.value.keyword || 'image'}_${index + 1}.jpg`;
    
    // 检查响应并提取downloadUrl (处理嵌套的响应结构)
    if (response.code === 200 && response.data) {
      // 处理可能的多层嵌套数据
      let downloadUrl = null;
      const responseData = response.data as any;
      
      // 处理嵌套结构 - API返回的格式可能是多层嵌套的
      if (responseData.data && responseData.data.downloadUrl) {
        // 嵌套结构: response.data.data.downloadUrl
        downloadUrl = responseData.data.downloadUrl;
        console.log('从嵌套结构中获取到下载链接');
      } else if (responseData.downloadUrl) {
        // 单层结构: response.data.downloadUrl
        downloadUrl = responseData.downloadUrl;
        console.log('从单层结构中获取到下载链接');
      } else if (typeof responseData === 'string') {
        // 直接返回URL作为字符串
        downloadUrl = responseData;
        console.log('获取到直接返回的URL字符串');
      }
      
      // 如果成功获取到下载链接
      if (downloadUrl) {
        console.log('获取到下载链接，开始下载:', downloadUrl);
        
        try {
          // 创建一个隐藏的iframe来处理下载，避免页面跳转
          const downloadFrame = document.createElement('iframe');
          downloadFrame.style.display = 'none';
          document.body.appendChild(downloadFrame);
          
          // 创建下载链接
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = fileName;
          a.target = '_blank'; // 在新窗口打开但不跳转
          a.style.display = 'none';
          
          // 添加到DOM并点击
          document.body.appendChild(a);
          a.click();
          
          // 清理
          setTimeout(() => {
            document.body.removeChild(a);
            document.body.removeChild(downloadFrame);
          }, 100);
          
          showStatusMessage('图片下载已开始', 'success');
          return;
        } catch (downloadError) {
          console.error('下载图片失败:', downloadError);
          
          // 如果上面的方式失败，尝试直接在新窗口打开链接
          window.open(downloadUrl, '_blank');
          showStatusMessage('已打开下载链接', 'success');
          return;
        }
      }
      
      // 找不到下载链接，尝试直接使用图片URL
      console.log('未找到下载链接，尝试使用原图URL');
      if (image.url) {
        const a = document.createElement('a');
        a.href = image.url;
        a.download = fileName;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
          document.body.removeChild(a);
        }, 100);
        
        showStatusMessage('使用原图URL下载', 'success');
        return;
      }
      
      // 找不到下载方式
      showStatusMessage('无法获取图片下载链接，请稍后重试', 'error');
    } else {
      showStatusMessage(response.message || '获取图片数据失败，请稍后重试', 'error');
    }
  } catch (error: any) {
    console.error('下载图片失败:', error);
    showStatusMessage(error.message || '下载图片失败，请稍后重试', 'error');
  }
}

// 显示状态消息
function showStatusMessage(message: string, type: 'success' | 'error' | 'info' = 'info') {
  statusMessage.value = message;
  statusType.value = type;
  
  // 自动清除
  setTimeout(() => {
    statusMessage.value = '';
    statusType.value = '';
  }, 3000);
}

// 格式化日期
function formatDate(dateString: string | Date) {
  if (!dateString) return '未知时间';
  
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return typeof dateString === 'string' ? dateString : '未知时间';
  }
}

// 获取状态文本
function getStatusText(status: string) {
  switch (status) {
    case 'completed':
      return '已完成';
    case 'processing':
      return '处理中';
    case 'failed':
      return '失败';
    default:
      return '未知';
  }
}

// 搜索历史记录
function searchHistory() {
  // 搜索逻辑已通过计算属性实现
  console.log('搜索历史记录:', historySearchQuery.value);
}

// 清除历史搜索
function clearHistorySearch() {
  historySearchQuery.value = '';
}

// 处理图片加载错误
function handleImageError() {
  console.error('图片加载失败:', currentViewingImage.value);
  showStatusMessage('图片加载失败', 'error');
  closeImageViewer();
}

// 专门处理图片点击事件
function handleImageClick(image: ImageItem | null, index: number, prompt: string = '') {
  console.log('图片被点击:', { image, index, prompt });
  
  // 阻止任何可能的事件冒泡
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  
  // 确保图片有效
  if (!image || (!image.url && !image.superUrl) || (image.url && image.url.includes('null') && !image.superUrl)) {
    console.error('无效的图片URL:', image?.url, image?.superUrl);
    showStatusMessage('无法打开图片预览，图片链接无效', 'error');
    return;
  }
  
  // 更新图片查看器状态
  currentViewingImage.value = image.url;
  currentImageIndex.value = index;
  currentImagePrompt.value = prompt || '';
  currentImageItem.value = image;
  
  // 显示查看器
  nextTick(() => {
    showImageViewer.value = true;
    console.log('图片查看器已打开, 状态:', { 
      showImageViewer: showImageViewer.value,
      currentViewingImage: currentViewingImage.value,
      currentImageSuperUrl: image.superUrl 
    });
  });
}

// 切换所有任务的展开/折叠状态
function toggleAllTasks() {
  if (isAllExpanded.value) {
    // 如果所有任务都已展开，则折叠所有任务
    expandedTasks.value = [];
  } else {
    // 如果不是所有任务都已展开，则展开所有任务
    expandedTasks.value = historyTasks.value.map(task => task.id);
  }
}

// 切换任务的展开/折叠状态
function toggleTask(taskId: number) {
  const index = expandedTasks.value.indexOf(taskId);
  if (index === -1) {
    // 如果任务不在展开列表中，添加它
    expandedTasks.value.push(taskId);
  } else {
    // 如果任务已经在展开列表中，移除它
    expandedTasks.value.splice(index, 1);
  }
}

// 关闭图片查看器
function closeImageViewer() {
  console.log('关闭图片查看器');
  
  // 阻止可能的事件冒泡
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  
  showImageViewer.value = false;
}

// 上传图片
async function uploadImage(event: Event, fieldKey: string) {
  const target = event.target as HTMLInputElement;
  if (!target.files || target.files.length === 0) return;
  
  const file = target.files[0];
  uploadingImage.value = true; 
  
  try {
    // 创建FormData对象
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileName', file.name);
    formData.append('contentType', file.type);
    formData.append('sourceType', '1');
    formData.append('autoConfirm', '1');
    formData.append('hide', 'true');
    
    // 调用后端API上传图片
    const response = await uploadImageAPI(formData);
    console.log('图片上传结果:', response);
    
    if (response.code === 200 && response.data) {
      // 保存图片ID - 正确访问数据结构
      let imageId: string;
      if (response.data && typeof response.data === 'object' && 'data' in response.data && response.data.data && typeof response.data.data === 'object' && 'imageId' in response.data.data) {
        imageId = response.data.data.imageId as string;
      } else if (response.data && typeof response.data === 'object' && 'imageId' in response.data) {
        imageId = response.data.imageId as string;
      } else if (response.data && typeof response.data === 'string') {
        // 直接返回字符串作为imageId
        imageId = response.data;
      } else {
        console.error('无法获取图片ID，响应结构:', response);
        showStatusMessage('图片上传成功，但无法获取图片ID', 'error');
        return;
      }
      
      uploadedImages.value[fieldKey] = imageId;
      form.value.additionalFields[fieldKey] = imageId;
      showStatusMessage('图片上传成功', 'success');
    } else {
      showStatusMessage('图片上传失败: ' + (response.message || '未知错误'), 'error');
    }
  } catch (error: any) {
    console.error('图片上传失败:', error);
    showStatusMessage('图片上传失败: ' + (error.message || '未知错误'), 'error');
  } finally {
    uploadingImage.value = false;
    // 清空input，允许重新选择同一文件
    target.value = '';
  }
}

// 移除已上传的图片
function removeUploadedImage(fieldKey: string) {
  if (uploadedImages.value[fieldKey]) {
    delete uploadedImages.value[fieldKey];
    delete uploadedImages.value[`${fieldKey}_url`]; // 同时删除URL
    delete form.value.additionalFields[fieldKey];
    
    // 重新排序剩余的图片键
    const remainingImageKeys = Object.keys(uploadedImages.value)
      .filter(key => typeof key === 'string' && !key.includes('_url'))
      .sort();
    
    // 如果需要重新排序图片键
    if (remainingImageKeys.length > 0) {
      const tempImages: Record<string, any> = {};
      const tempFields: Record<string, string> = {};
      
      // 创建新的排序后的对象
      remainingImageKeys.forEach((oldKey, index) => {
        const newKey = `image${index + 1}`;
        tempImages[newKey] = uploadedImages.value[oldKey];
        tempImages[`${newKey}_url`] = uploadedImages.value[`${oldKey}_url`];
        tempFields[newKey] = form.value.additionalFields[oldKey];
      });
      
      // 替换原对象
      uploadedImages.value = tempImages;
      form.value.additionalFields = tempFields;
    }
    
    // 更新模式
    const imageCount = Object.keys(uploadedImages.value)
      .filter(key => typeof key === 'string' && !key.includes('_url'))
      .length;
      
    if (imageCount === 0) {
      // 如果没有图片了，切换回主题图文模式
      activeMode.value = 'theme';
    } else if (imageCount === 2) {
      // 如果剩下2张图片，切换到二宫格模式
      activeMode.value = 'grid';
    } else if (imageCount >= 3) {
      // 如果剩下3张或更多图片，切换到三宫格模式
      activeMode.value = 'grid';
    }
  }
}

// 上传多图片
async function uploadMultiImage(event: Event) {
  const target = event.target as HTMLInputElement;
  if (!target.files || target.files.length === 0) return;
  
  const files = Array.from(target.files);
  uploadingImage.value = true;
  
  try {
    // 计算当前图片数量和可上传数量
    const currentImageKeys = Object.keys(uploadedImages.value).filter(k => typeof k === 'string' && !k.includes('_url'));
    const currentCount = currentImageKeys.length;
    const maxNewImages = 4 - currentCount;
    
    // 如果选择的图片超过可上传的数量，进行截断并提示用户
    const filesToUpload = files.slice(0, maxNewImages);
    if (files.length > maxNewImages) {
      showStatusMessage(`最多只能上传4张图片，已选择前${maxNewImages}张`, 'info');
    }
    
    if (filesToUpload.length === 0) {
      uploadingImage.value = false;
      return;
    }
    
    // 显示上传开始的提示
    showStatusMessage(`正在上传${filesToUpload.length}张图片...`, 'info');
    
    // 使用Promise.all并行上传多张图片
    const uploadPromises = filesToUpload.map(async (file, index) => {
      try {
        // 创建FormData对象
        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileName', file.name);
        formData.append('contentType', file.type);
        formData.append('sourceType', '1');
        formData.append('autoConfirm', '1');
        formData.append('hide', 'true');
        
        // 调用后端API上传图片
        const response = await uploadImageAPI(formData);
        console.log(`图片${index+1}上传结果:`, response);
        
        if (response.code === 200 && response.data) {
          // 计算下一个图片索引 - 仅计算实际图片数量，不包括URL键
          const nextIndex = currentCount + index + 1;
          const imageKey = `image${nextIndex}`;
          
          // 保存图片ID和URL
          let imageId: string = '';
          let imageUrl: string = '';
          
          // 解析返回的数据结构，处理不同情况
          if (response.data && typeof response.data === 'object') {
            if ('data' in response.data && response.data.data && typeof response.data.data === 'object') {
              // 深层嵌套结构
              const nestedData = response.data.data as any;
              if ('imageId' in nestedData) {
                imageId = nestedData.imageId;
              }
              if ('url' in nestedData) {
                imageUrl = nestedData.url;
              }
            } else {
              // 单层结构
              const data = response.data as any;
              if ('imageId' in data) {
                imageId = data.imageId;
              }
              if ('url' in data) {
                imageUrl = data.url;
              }
            }
          } else if (response.data && typeof response.data === 'string') {
            // 直接返回字符串作为imageId
            imageId = response.data;
            imageUrl = `https://pri-cdn-oss.chuangkit.com/svg_build/render_result/${imageId}?x-oss-process=image/resize,w_300`;
          }
          
          if (!imageId) {
            console.error(`图片${index+1}上传失败，无法获取图片ID，响应结构:`, response);
            return null;
          }
          
          return { imageKey, imageId, imageUrl };
        } else {
          console.error(`图片${index+1}上传失败:`, response.message || '未知错误');
          return null;
        }
      } catch (error) {
        console.error(`图片${index+1}上传失败:`, error);
        return null;
      }
    });
    
    // 等待所有上传完成
    const results = await Promise.all(uploadPromises);
    
    // 过滤掉失败的上传，处理成功的上传
    const successfulUploads = results.filter(result => result !== null) as Array<{imageKey: string, imageId: string, imageUrl: string}>;
    
    if (successfulUploads.length > 0) {
      // 将成功上传的图片添加到状态中
      successfulUploads.forEach(({ imageKey, imageId, imageUrl }) => {
        uploadedImages.value[imageKey] = imageId;
        form.value.additionalFields[imageKey] = imageId;
        uploadedImages.value[`${imageKey}_url`] = imageUrl;
      });
      
      // 根据上传的图片数量自动选择模式
      updateModeBasedOnImageCount();
      
      showStatusMessage(`成功上传${successfulUploads.length}张图片`, 'success');
    } else {
      showStatusMessage('所有图片上传失败', 'error');
    }
  } catch (error: any) {
    console.error('批量上传图片失败:', error);
    showStatusMessage('批量上传图片失败: ' + (error.message || '未知错误'), 'error');
  } finally {
    uploadingImage.value = false;
    // 清空input，允许重新选择同一文件
    target.value = '';
  }
}

// 更新模式的计数逻辑
function updateModeBasedOnImageCount() {
  const imageKeys = Object.keys(uploadedImages.value).filter(k => typeof k === 'string' && !k.includes('_url'));
  const imageCount = imageKeys.length;
  
  if (imageCount >= 2) {
    // 只要有2张及以上图片，就选择拼图模式
    activeMode.value = 'grid';
  }
  
  console.log(`已上传${imageCount}张图片，当前模式: ${activeMode.value}`);
}

// 获取图片数量的方法更新
function getImageCountText() {
  const imageKeys = Object.keys(uploadedImages.value).filter(k => typeof k === 'string' && !k.includes('_url'));
  const imageCount = imageKeys.length;
  
  if (imageCount === 0) {
    return '请上传图片，最多可上传4张';
  } else if (imageCount === 1) {
    return '已上传1张图片，至少需要2张图片才能生成拼图';
  } else if (imageCount === 2) {
    return '已上传2张图片，将生成二宫格拼图';
  } else if (imageCount === 3) {
    return '已上传3张图片，将生成三宫格拼图';
  } else {
    return '已上传4张图片，达到最大上传数量';
  }
}

// 获取拼图模式描述方法更新
function getGridModeDescription() {
  const imageKeys = Object.keys(uploadedImages.value).filter(k => typeof k === 'string' && !k.includes('_url'));
  const imageCount = imageKeys.length;
  
  if (imageCount === 0) {
    return "请上传2-4张图片制作拼图";
  } else if (imageCount === 1) {
    return "已上传1张图片，至少需要2张图片";
  } else if (imageCount === 2) {
    return "二宫格拼图模式，已上传2张图片";
  } else if (imageCount === 3) {
    return "三宫格拼图模式，已上传3张图片";
  } else {
    return "四宫格拼图模式，已上传4张图片";
  }
}

// 添加继续生成的方法
async function continueGenerating() {
  if (continuingGeneration.value || !currentTaskId.value) return;
  
  continuingGeneration.value = true;
  
  try {
    // 构建继续生成的请求参数
    const continueParams = {
      title: form.value.keyword, // 修正参数名
      type: 'theme',
      pageNo: currentPage.value + 1,
      previousTaskId: currentTaskId.value,
      intellectId: modeIntellectIdMap[activeMode.value],
      additionalFields: form.value.additionalFields
    };
    
    console.log('继续生成请求参数:', continueParams);
    
    // 发送请求
    const response = await generateImageAPI(continueParams);
    
    console.log('继续生成响应:', response);
    
    if (response.code === 200) {
      // 尝试处理嵌套的数据结构 - 通过类型检查确定实际结构
      let responseData: any = response.data;
      
      // 检查是否有嵌套结构
      if (responseData && typeof responseData === 'object' && 'data' in responseData) {
        responseData = responseData.data;
        console.log('已处理嵌套数据结构:', responseData);
      }
      
      // 确保有数据
      if (responseData) {
        // 处理响应数据
        const newImages = responseData.images || [];
        console.log(`获取到${newImages.length}张新图片`);
        
        if (newImages.length > 0) {
          // 将新生成的图片添加到列表，同时处理taskId可能为undefined的情况
          const processedNewImages = newImages.map((img: { imageId?: string; url?: string; taskId?: string }) => ({
            ...img,
            taskId: img.taskId || '', // 确保taskId不为undefined
            url: img.url || '' // 确保url不为undefined
          }));
          
          console.log('处理后的新图片:', processedNewImages);
          
          // 将新生成的图片添加到列表
          generatedImages.value = [...generatedImages.value, ...processedNewImages];
          
          // 更新任务ID和页码
          if (responseData.taskId) {
            currentTaskId.value = typeof responseData.taskId === 'number' ? 
              responseData.taskId : parseInt(responseData.taskId);
            console.log('更新任务ID:', currentTaskId.value);
          }
          
          if (responseData.currentPage) {
            currentPage.value = responseData.currentPage;
          } else {
            currentPage.value++;
          }
          console.log('更新当前页码:', currentPage.value);
          
          showStatusMessage('生成更多图片成功', 'success');
          
          // 刷新历史记录
          setTimeout(async () => {
            await refreshHistory();
          }, 1000);
          
          // 平滑滚动到新图片
          setTimeout(() => {
            const lastImage = document.querySelector('.grid > div:last-child');
            if (lastImage) {
              lastImage.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 100);
        } else {
          console.error('响应中没有找到新图片:', responseData);
          showStatusMessage('未能获取更多图片', 'error');
        }
      } else {
        console.error('响应数据格式不正确:', response);
        showStatusMessage('返回数据格式不正确', 'error');
      }
    } else {
      showStatusMessage(response.message || '继续生成图片失败', 'error');
    }
  } catch (error: any) {
    console.error('继续生成失败:', error);
    showStatusMessage(error.message || '继续生成图片失败，请稍后重试', 'error');
  } finally {
    continuingGeneration.value = false;
  }
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

/* 展开/折叠动画 */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  max-height: 1000px;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
}

/* 上传按钮的悬停效果 */
.upload-button-hover {
  transition: all 0.2s ease;
}

.upload-button-hover:hover:not(.uploading) {
  transform: scale(1.02);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* 上传加载动画 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.upload-loading {
  animation: fadeIn 0.3s ease;
}

/* 上传加载动画遮罩 */
.upload-mask {
  backdrop-filter: blur(2px);
  animation: fadeIn 0.3s ease;
}
</style>

<style>
/* 确保整个组件容器填满屏幕 */
.image-generator-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 修复vue-router视图高度问题 */
html, body, #app, .router-view {
  height: 100%;
  min-height: 100vh;
  margin: 0;
  padding: 0;
}
</style> 