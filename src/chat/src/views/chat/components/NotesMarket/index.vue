<template>
  <div class="h-full w-full relative overflow-hidden flex flex-col bg-white dark:bg-gray-900 min-h-screen">
    <!-- 状态通知 -->
    <div v-if="statusMessage" :class="['fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-md shadow-lg text-white transition-all', 
      statusType === 'success' ? 'bg-green-500' : 
      statusType === 'error' ? 'bg-red-500' : 
      'bg-blue-500']">
      {{ statusMessage }}
    </div>
    
    <!-- 主页面内容 -->
    <div class="flex-1 overflow-auto p-2 sm:p-4 md:p-6 min-h-[calc(100vh-60px)] bg-white dark:bg-gray-900">
      <div class="max-w-7xl mx-auto pb-8">
        <!-- 页面标题 -->
        <div class="mb-4 text-center">
          <div class="flex items-center justify-center">
            <h1 class="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-200 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mr-2 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              笔记模板市场
            </h1>
            <button 
              class="ml-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              @click="fetchNotes(1)"
              title="刷新"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
          <p class="text-gray-600 dark:text-gray-400 mt-1">浏览、搜索和导入优质小红书笔记模板</p>
        </div>

        <!-- 搜索和筛选区域 -->
        <div class="mb-4">
          <div class="flex flex-col sm:flex-row gap-3">
            <div class="flex-1">
              <div class="relative">
                <input 
                  v-model="searchQuery" 
                  type="text" 
                  placeholder="搜索笔记模板..." 
                  class="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                  @keyup.enter="fetchNotes(1)"
                />
                <button 
                  class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-pink-500"
                  @click="fetchNotes(1)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>
            <!-- 添加收藏筛选按钮 -->
            <div class="sm:w-48">
              <button 
                @click="toggleFavoriteFilter"
                class="w-full px-4 py-2 border rounded-md flex items-center justify-center gap-2 transition-colors"
                :class="showFavoritesOnly ? 'bg-pink-500 text-white border-pink-500' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700'"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" :fill="showFavoritesOnly ? 'currentColor' : 'none'" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                <span>{{ showFavoritesOnly ? '我的收藏' : '我的收藏' }}</span>
              </button>
            </div>
            <div class="sm:w-48">
              <select 
                v-model="sortBy" 
                class="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                @change="fetchNotes(1)"
              >
                <option value="createTime">最新优先</option>
                <option value="likesCount">热门优先</option>
                <option value="viewsCount">多人查看</option>
                <option value="title">标题排序</option>
              </select>
            </div>
            <div class="sm:w-48">
              <select 
                v-model="sortOrder" 
                class="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                @change="fetchNotes(1)"
              >
                <option value="DESC">降序</option>
                <option value="ASC">升序</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 恢复笔记类型导航条 -->
        <!-- 添加收藏筛选状态显示 -->
        <div v-if="notes.length > 0" class="mb-2 p-2 border rounded bg-gray-50 dark:bg-gray-800 text-xs overflow-auto">
          <div class="flex justify-between items-center">
            <p>已加载 {{ notes.length }} 条笔记数据 (总计 {{ total }} 条)</p>
            <div v-if="showFavoritesOnly" class="flex items-center gap-2 text-pink-500">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              <span>仅显示我的收藏</span>
            </div>
          </div>
        </div>

        <!-- 添加笔记类型导航条 -->
        <div class="mb-4">
          <div class="text-sm text-gray-500 dark:text-gray-400 mb-2 flex justify-between items-center">
            <span>{{ selectedTypeId === null ? '显示全部笔记类型' : `当前分类: ${getSelectedTypeName()}` }}</span>
            <span v-if="noteTypes.length > 0" class="text-xs">共 {{ noteTypes.length }} 个分类</span>
          </div>
          <div class="overflow-x-auto pb-2 custom-scrollbar">
            <div class="flex space-x-3 min-w-max">
              <button 
                class="px-5 py-2 rounded-md transition-colors text-sm font-medium shadow-sm flex-shrink-0 flex items-center"
                :class="selectedTypeId === null ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'"
                @click="selectType(null)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                全部
              </button>
              <button 
                v-for="type in noteTypes" 
                :key="type.id"
                class="px-5 py-2 rounded-md transition-colors text-sm font-medium shadow-sm flex-shrink-0 flex items-center"
                :class="selectedTypeId === type.id ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'"
                @click="selectType(type.id)"
              >
                <!-- 预留图标位置 -->
                <svg v-if="type.icon" :class="['h-5 w-5 mr-1.5', selectedTypeId === type.id ? 'text-white' : 'text-gray-500 dark:text-gray-400']" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path :d="type.icon" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" />
                </svg>
                <span v-else class="w-5 h-5 mr-1.5 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs">
                  {{ type.name.substring(0, 1) }}
                </span>
                {{ type.name }}
              </button>
            </div>
          </div>
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" class="flex justify-center my-12">
          <div class="spinner"></div>
        </div>

        <!-- 笔记列表 -->
        <div v-else-if="notes.length > 0" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          <div 
            v-for="note in notes" 
            :key="note.id" 
            class="border rounded-lg overflow-hidden shadow hover:shadow-lg transition-all duration-300 bg-white dark:bg-gray-800 dark:border-gray-700 cursor-pointer flex flex-col h-full hover:scale-[1.02] hover:-translate-y-1"
            @click="previewNote(note)"
          >
            <div class="aspect-w-3 aspect-h-4 bg-gray-100 dark:bg-gray-700 relative">
              <img 
                v-if="note.coverImage" 
                :src="note.coverImage" 
                :alt="note.title" 
                class="object-cover w-full h-full"
                @error="handleImageError($event, note)"
              />
              <div v-else class="w-full h-full flex items-center justify-center text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <!-- 收藏按钮 - 将按钮移到div外部，确保它不受图片容器的影响 -->
              <button 
                @click.stop="toggleFavorite(note, $event)"
                class="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-black bg-opacity-40 hover:bg-opacity-60 transition-all transform hover:scale-105 shadow-lg z-20"
                :class="{ 'text-yellow-400': noteFavoriteStatus[note.id], 'text-gray-200': !noteFavoriteStatus[note.id] }"
                title="收藏"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" :fill="noteFavoriteStatus[note.id] ? 'currentColor' : 'none'" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </button>
            </div>
            <div class="p-4 flex-1 flex flex-col">
              <h3 class="font-semibold text-gray-800 dark:text-gray-200 mb-2 line-clamp-1 text-base" :title="note.title">{{ note.title }}</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-3" :title="note.content">{{ note.content }}</p>
              
              <!-- 统一底部操作区 -->
              <div class="flex flex-col space-y-2 mt-auto pt-2 border-t border-gray-100 dark:border-gray-700">
                <!-- 信息展示行 -->
                <div class="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                  <span class="flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span class="text-sm">{{ note.viewsCount || 0 }}</span>
                  </span>
                  
                  <div class="flex items-center gap-2">
                    <button 
                      @click.stop="toggleLike(note, $event)"
                      class="flex items-center gap-1 py-1 px-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      :class="{ 'text-red-500': noteLikeStatus[note.id] }"
                      title="点赞"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" :fill="noteLikeStatus[note.id] ? 'currentColor' : 'none'" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <span class="text-sm">{{ note.likesCount || 0 }}</span>
                    </button>
                  </div>
                </div>
                
                <!-- 按钮操作行 -->
                <div class="grid grid-cols-2 gap-2">
                  <button 
                    class="px-3 py-2 bg-pink-500 text-white text-sm font-medium rounded hover:bg-pink-600 transition-colors w-full flex items-center justify-center"
                    @click.stop="previewNote(note)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    查看
                  </button>
                  <button 
                    v-if="note.noteId"
                    class="px-3 py-2 bg-blue-500 text-white text-sm font-medium rounded hover:bg-blue-600 transition-colors w-full flex items-center justify-center"
                    @click.stop="useTemplate(note)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                    </svg>
                    使用模板
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else class="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p class="mt-4 text-gray-600 dark:text-gray-400">暂无笔记模板</p>
          <button 
            class="mt-4 px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition-colors"
            @click="fetchNotes(1)"
          >
            刷新
          </button>
        </div>

        <!-- 分页 -->
        <div v-if="totalPages > 1" class="mt-8 flex justify-center">
          <div class="flex space-x-2">
            <button 
              class="px-3 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:text-gray-400"
              :disabled="currentPage === 1"
              @click="fetchNotes(currentPage - 1)"
            >
              上一页
            </button>
            <div class="flex space-x-1">
              <button 
                v-for="page in displayedPages" 
                :key="page"
                :class="[
                  'px-3 py-1 border rounded-md dark:border-gray-700',
                  currentPage === page 
                    ? 'bg-pink-500 text-white border-pink-500' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                ]"
                @click="fetchNotes(page)"
              >
                {{ page }}
              </button>
            </div>
            <button 
              class="px-3 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:text-gray-400"
              :disabled="currentPage === totalPages"
              @click="fetchNotes(currentPage + 1)"
            >
              下一页
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 笔记预览弹窗 -->
    <div v-if="previewVisible" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div class="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden border dark:border-gray-700">
        <div class="border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
          <h3 class="font-semibold text-lg text-gray-800 dark:text-gray-200">笔记模板预览</h3>
          <button 
            class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            @click="closePreview"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="p-6 overflow-y-auto max-h-[70vh] bg-white dark:bg-gray-900">
          <div v-if="selectedNote">
            <div class="flex justify-between items-center mb-4">
              <div class="flex items-center">
                <h2 class="text-xl font-bold text-gray-800 dark:text-gray-200">{{ selectedNote.title }}</h2>
                <span class="flex items-center gap-1 text-gray-500 dark:text-gray-400 ml-3">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>{{ selectedNote.viewsCount || 0 }}</span>
                </span>
              </div>
              <div class="flex space-x-2">
                <button 
                  @click="toggleLike(selectedNote)" 
                  v-if="selectedNote"
                  class="p-2 rounded-full hover:bg-gray-700 transition-colors"
                  :class="[noteLikeStatus[selectedNote.id] ? 'text-red-500' : 'text-gray-400']"
                  title="点赞"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" :fill="noteLikeStatus[selectedNote.id] ? 'currentColor' : 'none'" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
                <button 
                  @click="closeNoteDetail" 
                  class="p-2 text-white hover:text-gray-300 transition-colors rounded-full hover:bg-gray-700"
                  title="关闭"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div v-if="selectedNote.coverImage" class="mb-4 rounded-lg overflow-hidden relative">
              <img 
                :src="selectedNote.coverImage" 
                :alt="selectedNote.title" 
                class="w-full h-auto"
                @error="handleImageError($event, selectedNote)"
              />
            </div>
            <!-- 收藏按钮 - 将按钮移到div外部 -->
            <button 
              v-if="selectedNote.coverImage"
              @click="toggleFavorite(selectedNote, $event)"
              class="absolute top-[72px] right-6 w-8 h-8 flex items-center justify-center rounded-full bg-black bg-opacity-40 hover:bg-opacity-60 transition-all transform hover:scale-105 shadow-lg z-20"
              :class="{ 'text-yellow-400': noteFavoriteStatus[selectedNote.id], 'text-gray-200': !noteFavoriteStatus[selectedNote.id] }"
              title="收藏"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" :fill="noteFavoriteStatus[selectedNote.id] ? 'currentColor' : 'none'" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </button>
            <div class="prose dark:prose-invert max-w-none">
              <div class="whitespace-pre-wrap text-gray-700 dark:text-gray-300 border-t border-b border-gray-100 dark:border-gray-700 py-4 my-4">{{ selectedNote.content }}</div>
            </div>
            <div class="mt-6 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
              <p>创建时间: {{ formatDate(selectedNote.createTime) }}</p>
              <p>更新时间: {{ formatDate(selectedNote.updateTime) }}</p>
              <p v-if="selectedNote.type">分类: {{ selectedNote.type.name || selectedNote.typeName || '未分类' }}</p>
            </div>
          </div>
        </div>
        <div class="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-end bg-gray-50 dark:bg-gray-800">
          <button 
            class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors mr-2 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            @click="closePreview"
          >
            关闭
          </button>
          <button 
            v-if="selectedNote"
            class="px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition-colors mr-2 flex items-center"
            @click="viewNoteDetail(selectedNote)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            查看示例
          </button>
          <button 
            v-if="selectedNote && selectedNote.noteId"
            class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            @click="useTemplate(selectedNote)"
          >
            使用模板
          </button>
        </div>
      </div>
    </div>

    <!-- 笔记详情弹窗 -->
    <div v-if="noteDetailVisible" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
      <div class="w-[700px] h-[800px] max-w-[90vw] max-h-[90vh] flex flex-col bg-gray-900 rounded-lg overflow-hidden">
        <!-- 头部栏 -->
        <div class="flex justify-between items-center p-4 bg-gray-800 bg-opacity-80 backdrop-blur-sm border-b border-gray-700">
          <h3 class="text-lg font-bold text-white flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span class="truncate max-w-[500px]">
              {{ selectedNote ? selectedNote.title : '笔记详情' }}
            </span>
          </h3>
          <div class="flex space-x-2">
            <button 
              @click="toggleLike(selectedNote)" 
              v-if="selectedNote"
              class="p-2 rounded-full hover:bg-gray-700 transition-colors"
              :class="[noteLikeStatus[selectedNote.id] ? 'text-red-500' : 'text-gray-400']"
              title="点赞"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" :fill="noteLikeStatus[selectedNote.id] ? 'currentColor' : 'none'" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
            <button 
              @click="toggleFavorite(selectedNote)" 
              v-if="selectedNote"
              class="p-2 rounded-full hover:bg-gray-700 transition-colors w-8 h-8 flex items-center justify-center"
              :class="{ 'text-yellow-400': noteFavoriteStatus[selectedNote.id], 'text-gray-200': !noteFavoriteStatus[selectedNote.id] }"
              title="收藏"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" :fill="noteFavoriteStatus[selectedNote.id] ? 'currentColor' : 'none'" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </button>
            <button 
              @click="closeNoteDetail" 
              class="p-2 text-white hover:text-gray-300 transition-colors rounded-full hover:bg-gray-700"
              title="关闭"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <!-- 内容区域 -->
        <div class="flex-grow relative overflow-hidden">
          <!-- 加载状态 -->
          <div v-if="noteDetailLoading" class="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-70 z-10">
            <div class="flex flex-col items-center">
              <div class="h-10 w-10 border-4 border-t-pink-500 rounded-full animate-spin mb-4"></div>
              <p class="text-white">笔记加载中...</p>
            </div>
          </div>
          
          <!-- 错误状态 -->
          <div v-else-if="noteDetailError" class="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-70 z-10">
            <div class="text-center p-4 rounded-lg bg-gray-800 max-w-md">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p class="text-white mb-4">{{ noteDetailError }}</p>
              <button 
                @click="closeNoteDetail" 
                class="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-all duration-200"
              >
                关闭
              </button>
            </div>
          </div>
          
          <!-- iframe内容 -->
          <iframe 
            v-if="currentNoteId" 
            :src="currentNoteId" 
            class="w-full h-full border-none" 
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            allow="clipboard-write"
            referrerpolicy="no-referrer"
            @load="handleIframeLoaded"
            @error="handleIframeError"
          ></iframe>
        </div>
        
        <!-- 底部按钮区 -->
        <div class="flex justify-between items-center p-4 bg-gray-800 border-t border-gray-700">
          <button 
            @click="closeNoteDetail" 
            class="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-all duration-200"
          >
            关闭
          </button>
          <button 
            v-if="!noteDetailLoading && !noteDetailError"
            @click="useCurrentTemplate"
            class="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-md hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform active:scale-95 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
            </svg>
            使用模板
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, reactive } from 'vue';
import service from '@/utils/request/axios';
import { message } from '@/utils/message';
import { useAppCatStore } from '@/store';

// 状态通知
const statusMessage = ref('');
const statusType = ref('info'); // 'success', 'error', 'info'

// 笔记详情弹窗相关
const noteDetailVisible = ref(false);
const noteDetailLoading = ref(false);
const noteDetailError = ref('');
const currentNoteId = ref('');
const currentNoteDetail = ref<any>(null);

// 笔记数据
interface Note {
  id: number;
  title: string;
  content: string;
  coverImage?: string;
  createTime: string;
  updateTime: string;
  likesCount: number;
  viewsCount: number;
  userStatus?: {
    liked: boolean;
    favorited: boolean;
  };
  isLiked?: boolean;
  isFavorited?: boolean;
  [key: string]: any;
}

const notes = ref<Note[]>([]);
const loading = ref(false);
const searchQuery = ref('');
const sortBy = ref('likesCount'); // 默认按热门排序
const sortOrder = ref('DESC');
const currentPage = ref(1);
const pageSize = ref(12); // 调整每页显示数量
const total = ref(0);
const totalPages = computed(() => Math.ceil(total.value / pageSize.value));

// 用户对每个笔记的点赞状态
const noteLikeStatus = reactive<Record<number, boolean>>({});

// 用户对每个笔记的收藏状态
const noteFavoriteStatus = reactive<Record<number, boolean>>({});

// 分页显示逻辑
const displayedPages = computed(() => {
  const result = [];
  const maxDisplayed = 5;
  
  if (totalPages.value <= maxDisplayed) {
    for (let i = 1; i <= totalPages.value; i++) {
      result.push(i);
    }
  } else {
    let start = Math.max(1, currentPage.value - Math.floor(maxDisplayed / 2));
    let end = Math.min(totalPages.value, start + maxDisplayed - 1);
    
    if (end - start + 1 < maxDisplayed) {
      start = Math.max(1, end - maxDisplayed + 1);
    }
    
    for (let i = start; i <= end; i++) {
      result.push(i);
    }
  }
  
  return result;
});

// 预览相关
const previewVisible = ref(false);
const selectedNote = ref<Note | null>(null);

// 笔记类型相关
interface NoteType {
  id: number;
  name: string;
  description?: string;
  sort?: number;
  status?: boolean;
  createTime?: string;
  updateTime?: string;
  icon?: string;
}

const noteTypes = ref<NoteType[]>([]);
const selectedTypeId = ref<number | null>(null);

// 获取笔记类型列表
async function fetchNoteTypes() {
  try {
    const response = await service.get('/xiaohongshu/notetype/list');
    console.log('获取笔记类型列表响应:', response.data);
    
    // 处理可能的多层嵌套
    let processedData = response.data;
    if (
      processedData.code === 200 && 
      processedData.data && 
      typeof processedData.data === 'object' &&
      processedData.data.code !== undefined
    ) {
      console.log('类型列表响应有多层包装，进行解包');
      processedData = processedData.data;
    }
    
    if (processedData && (processedData.code === 0 || processedData.code === 200)) {
      // 获取数据
      const data = processedData.data;
      
      // 检查数据结构
      if (data.items) {
        noteTypes.value = data.items;
      } else if (Array.isArray(data)) {
        noteTypes.value = data;
      } else {
        console.error('无法解析笔记类型数据');
        noteTypes.value = [];
      }
      
      // 只保留状态为启用的类型
      noteTypes.value = noteTypes.value.filter(type => type.status !== false);
      
      // 按排序字段排序
      noteTypes.value.sort((a, b) => {
        const sortA = a.sort || 0;
        const sortB = b.sort || 0;
        return sortA - sortB;
      });
      
      // 为每个类型添加图标
      noteTypes.value.forEach(type => {
        type.icon = getTypeIcon(type.name);
      });
      
      console.log('处理后的笔记类型列表:', noteTypes.value);
    } else {
      console.error('获取笔记类型列表失败:', processedData?.message);
      noteTypes.value = [];
    }
  } catch (error) {
    console.error('获取笔记类型列表出错:', error);
    noteTypes.value = [];
  }
}

// 根据类型名称获取图标
function getTypeIcon(typeName: string): string {
  const iconMap: Record<string, string> = {
    // 常用类型图标路径
    '日常': 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', // 日历图标
    '美食': 'M3 3h18v18H3V3z M15 3v18 M9 3v18 M3 9h18 M3 15h18', // 餐盘图标
    '旅行': 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9', // 地球图标
    '穿搭': 'M6.115 5.19l.319 1.913A6 6 0 008.11 10.36L9.75 12l-.387.775c-.217.433-.132.956.21 1.298l1.348 1.348c.21.21.329.497.329.795v1.089c0 .426.24.815.622 1.006l.153.076c.433.217.956.132 1.298-.21l.723-.723a8.7 8.7 0 002.288-4.042 1.087 1.087 0 00-.358-1.099l-1.33-1.108c-.251-.21-.582-.299-.905-.245l-1.17.195a1.125 1.125 0 01-.98-.314l-.295-.295a1.125 1.125 0 010-1.591l.13-.132a1.125 1.125 0 011.3-.21l.603.302a.809.809 0 001.086-1.086L14.25 7.5l1.256-.837a4.5 4.5 0 001.528-1.732l.146-.292', // 衣服图标
    '护肤': 'M4.5 12.75l7.5-7.5 7.5 7.5m-15 6l7.5-7.5 7.5 7.5', // 护肤图标
    '健身': 'M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3', // 健身图标
    '学习': 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25', // 书本图标
    '职场': 'M20 12V8.5c0-1.933-1.567-3.5-3.5-3.5S13 6.567 13 8.5V12h1.5V8.5c0-1.105.895-2 2-2s2 .895 2 2V12H20zm-12 0V8.5c0-1.933-1.567-3.5-3.5-3.5S1 6.567 1 8.5V12h1.5V8.5c0-1.105.895-2 2-2s2 .895 2 2V12H8z', // 公文包图标
    '情感': 'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z', // 心形图标
    '生活': 'M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25', // 家图标
    '摄影': 'M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z', // 相机图标
    '家居': 'M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819', // 家居图标
    '通用': 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z', // 应用图标
  };
  
  // 默认图标
  const defaultIcon = 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10';
  
  if (!typeName) return defaultIcon;
  
  // 查找完全匹配
  if (iconMap[typeName]) {
    return iconMap[typeName];
  }
  
  // 查找包含关键词的匹配
  for (const key in iconMap) {
    if (typeName.includes(key)) {
      return iconMap[key];
    }
  }
  
  return defaultIcon;
}

// 选择笔记类型
function selectType(typeId: number | null) {
  selectedTypeId.value = typeId;
  fetchNotes(1); // 重新获取笔记
}

// 获取笔记数据
async function fetchNotes(page: number) {
  loading.value = true;
  currentPage.value = page;
  
  try {
    const params: Record<string, any> = {
      page: currentPage.value,
      pageSize: pageSize.value,
      title: searchQuery.value || undefined,
      withUserStatus: true // 添加参数，请求时包含用户收藏和点赞状态
    };
    
    // 添加收藏筛选
    if (showFavoritesOnly.value) {
      params.favoriteOnly = true;
    }
    
    // 添加类型筛选
    if (selectedTypeId.value !== null) {
      params.typeId = selectedTypeId.value;
    }
    
    // 添加排序参数
    if (sortBy.value) {
      params.orderBy = sortBy.value;
      params.orderDirection = sortOrder.value;
    }
    
    console.log('请求参数:', params);
    
    // 定义可能的API路径及其优先级
    const possibleApiPaths = [
      '/xiaohongshu/note-template-market/list',
      '/xiaohongshu/note/list'
    ];
    
    // 不再使用单独的/favorites端点
    // 而是在标准list接口上使用favoriteOnly参数
    
    let responseData = null;
    let apiPath = '';
    let error = null;
    
    // 依次尝试每个API路径
    for (const path of possibleApiPaths) {
      try {
        console.log('尝试API路径:', path);
        const response = await service.get(path, { params });
        console.log('原始响应数据:', response.data);
        
        // 处理多层嵌套的响应
        let processedData = response.data;
        
        // 检查是否存在额外的数据包装
        if (
          processedData.code === 200 && 
          processedData.data && 
          typeof processedData.data === 'object' &&
          processedData.data.code !== undefined
        ) {
          console.log('检测到数据多包装一层，进行解包');
          processedData = processedData.data;
        }
        
        if (processedData && (processedData.code === 0 || processedData.code === 200)) {
          responseData = processedData;
          apiPath = path;
          console.log('成功获取数据，使用API路径:', path);
          console.log('处理后的响应数据:', responseData);
          break;
        }
      } catch (e) {
        console.warn(`API ${path} 请求失败:`, e);
        error = e;
      }
    }
    
    if (!responseData) {
      console.warn('所有API路径均请求失败，使用测试数据');
      // 如果用户启用了测试数据选项或所有API请求都失败，则使用测试数据
      const testNotes = generateTestData(pageSize.value);
      notes.value = testNotes;
      total.value = 30; // 假设总共有30条测试数据
      
      // 显示提示消息
      showStatus('无法连接到服务器，显示测试数据', 'info');
      loading.value = false;
      return;
    }
    
    console.log('获取笔记模板列表响应:', responseData);
    
    // 处理数据
    const data = responseData.data;
    console.log('响应数据结构:', data);
    
    // 检查items字段是否存在，不存在则尝试其他可能的字段名
    if (data.items) {
      notes.value = data.items;
    } else if (data.list) {
      notes.value = data.list;
    } else if (Array.isArray(data)) {
      notes.value = data;
    } else {
      notes.value = [];
      console.error('无法找到笔记列表数据');
    }
    
    // 同样检查total字段
    if (data.total !== undefined) {
      total.value = data.total;
    } else if (data.count !== undefined) {
      total.value = data.count;
    } else {
      total.value = notes.value.length;
    }
    
    console.log('解析后的笔记列表:', notes.value);
    console.log('总数:', total.value);
    
    // 修复日期问题 - 预处理所有日期
    notes.value.forEach(note => {
      if (note.createTime && typeof note.createTime === 'string') {
        try {
          const createDate = new Date(note.createTime);
          if (createDate.getFullYear() > new Date().getFullYear() + 1) {
            console.log(`修复笔记 ${note.id} 的创建日期`, note.createTime);
            note.createTime = new Date().toISOString();
          }
        } catch (e) {
          console.warn(`处理笔记 ${note.id} 的创建日期出错`, e);
        }
      }
      
      if (note.updateTime && typeof note.updateTime === 'string') {
        try {
          const updateDate = new Date(note.updateTime);
          if (updateDate.getFullYear() > new Date().getFullYear() + 1) {
            console.log(`修复笔记 ${note.id} 的更新日期`, note.updateTime);
            note.updateTime = new Date().toISOString();
          }
        } catch (e) {
          console.warn(`处理笔记 ${note.id} 的更新日期出错`, e);
        }
      }
      
      // 设置收藏和点赞状态
      if (note.userStatus) {
        // 如果API返回了用户状态，直接使用
        noteLikeStatus[note.id] = !!note.userStatus.liked;
        noteFavoriteStatus[note.id] = !!note.userStatus.favorited;
      } else {
        // 兼容旧版API，使用单独的字段
        noteLikeStatus[note.id] = !!note.isLiked;
        noteFavoriteStatus[note.id] = !!note.isFavorited;
      }
    });
    
    if (notes.value.length === 0 && total.value > 0 && currentPage.value > 1) {
      // 如果当前页没有数据但总数大于0，尝试获取第一页
      fetchNotes(1);
    }
  } catch (error: any) {
    console.error('获取笔记模板列表出错:', error);
    showStatus('获取笔记模板列表出错: ' + (error.message || '未知错误'), 'error');
    
    // 在错误情况下使用测试数据
    const testNotes = generateTestData(pageSize.value);
    notes.value = testNotes;
    total.value = 30; // 假设总共有30条测试数据
  } finally {
    loading.value = false;
  }
}

// 预览笔记
async function previewNote(note: Note) {
  selectedNote.value = note;
  previewVisible.value = true;
  
  try {
    // 我们不需要单独调用view API，因为获取详情时会自动记录预览
    // 这里使用获取详情的API替代
    const viewApiUrl = `/xiaohongshu/note-template-market/${note.id}`;
    console.log('预览API:', viewApiUrl);
    const viewResponse = await service.get(viewApiUrl, {
      params: { withUserStatus: true } // 添加参数，请求时包含用户收藏和点赞状态
    }).catch(e => {
      console.warn('记录预览请求失败，这可能是正常现象:', e);
      return { data: { code: 1 } };
    });
    
    console.log('预览原始响应:', viewResponse.data);
    
    // 处理可能的多层嵌套
    let processedData = viewResponse.data;
    if (
      processedData.code === 200 && 
      processedData.data && 
      typeof processedData.data === 'object' &&
      processedData.data.code !== undefined
    ) {
      console.log('预览响应有多层包装，进行解包');
      processedData = processedData.data;
    }
    
    if (processedData && (processedData.code === 0 || processedData.code === 200) && 
        processedData.data) {
      // 获取详情API会返回完整的笔记信息，包括更新后的预览数
      if (processedData.data.viewsCount !== undefined) {
        note.viewsCount = processedData.data.viewsCount;
      }
      
      // 更新收藏和点赞状态
      const noteData = processedData.data;
      if (noteData.userStatus) {
        noteLikeStatus[note.id] = !!noteData.userStatus.liked;
        noteFavoriteStatus[note.id] = !!noteData.userStatus.favorited;
      } else {
        // 兼容旧版API，使用单独的字段
        if (noteData.isLiked !== undefined) noteLikeStatus[note.id] = !!noteData.isLiked;
        if (noteData.isFavorited !== undefined) noteFavoriteStatus[note.id] = !!noteData.isFavorited;
      }
    }
  } catch (e) {
    console.warn('记录预览过程出错:', e);
  }
}

// 关闭预览
function closePreview() {
  previewVisible.value = false;
  setTimeout(() => {
    selectedNote.value = null;
  }, 300);
}

// 点赞/取消点赞
async function toggleLike(note: Note, event?: Event) {
  // 阻止事件冒泡，防止触发卡片点击事件
  if (event) {
    event.stopPropagation();
  }
  
  try {
    const isLiked = noteLikeStatus[note.id];
    const action = isLiked ? 'unlike' : 'like';
    const apiUrl = `/xiaohongshu/note-template-market/${note.id}/${action}`;
    
    console.log(`${action}操作API:`, apiUrl);
    const response = await service.post(apiUrl);
    console.log(`${action}原始响应:`, response.data);
    
    // 处理可能的多层嵌套
    let processedData = response.data;
    if (
      processedData.code === 200 && 
      processedData.data && 
      typeof processedData.data === 'object' &&
      processedData.data.code !== undefined
    ) {
      console.log(`${action}响应有多层包装，进行解包`);
      processedData = processedData.data;
    }
    
    if (processedData.code === 0 || processedData.code === 200) {
      // 更新点赞状态和计数
      noteLikeStatus[note.id] = !isLiked;
      note.likesCount = processedData.data.likesCount;
      
      message.success(isLiked ? '已取消点赞' : '点赞成功');
    } else {
      message.error(processedData.message || '操作失败');
    }
  } catch (error: any) {
    console.error('点赞操作出错:', error);
    message.error((error.message || '点赞操作失败'));
  }
}

// 收藏/取消收藏
async function toggleFavorite(note: Note, event?: Event) {
  // 阻止事件冒泡，防止触发卡片点击事件
  if (event) {
    event.stopPropagation();
  }
  
  try {
    const isFavorited = noteFavoriteStatus[note.id];
    const action = isFavorited ? 'unfavorite' : 'favorite';
    const apiUrl = `/xiaohongshu/note-template-market/${note.id}/${action}`;
    
    console.log(`${action}操作API:`, apiUrl);
    const response = await service.post(apiUrl);
    console.log(`${action}原始响应:`, response.data);
    
    // 处理可能的多层嵌套
    let processedData = response.data;
    if (
      processedData.code === 200 && 
      processedData.data && 
      typeof processedData.data === 'object' &&
      processedData.data.code !== undefined
    ) {
      console.log(`${action}响应有多层包装，进行解包`);
      processedData = processedData.data;
    }
    
    if (processedData.code === 0 || processedData.code === 200) {
      // 更新收藏状态
      noteFavoriteStatus[note.id] = !isFavorited;
      
      message.success(isFavorited ? '已取消收藏' : '收藏成功');
    } else {
      message.error(processedData.message || '操作失败');
    }
  } catch (error: any) {
    console.error('收藏操作出错:', error);
    message.error((error.message || '收藏操作失败'));
  }
}

// 查看笔记详情
async function viewNoteDetail(note: Note) {
  try {
    if (!note || !note.noteId) {
      showStatus('无法查看笔记详情，缺少笔记ID', 'error');
      return;
    }
    
    console.log('准备查看笔记详情:', note.noteId);
    
    // 设置加载状态
    noteDetailLoading.value = true;
    noteDetailError.value = '';
    noteDetailVisible.value = true;
    
    // 构建完整的笔记详情URL，添加isPreview=1参数
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    currentNoteId.value = `${origin}/chat#/xhs-auto-api?id=${note.noteId}&isPreview=1`;
    
    console.log('查看笔记详情, URL:', currentNoteId.value);
    
    // 为iframe加载添加超时处理，如果15秒后仍未加载完成，提示可能出现问题
    setTimeout(() => {
      if (noteDetailLoading.value) {
        noteDetailLoading.value = false;
        noteDetailError.value = '加载时间过长，请检查网络连接或刷新重试';
      }
    }, 15000);
  } catch (error: any) {
    console.error('查看笔记详情出错:', error);
    noteDetailError.value = error.message || '查看笔记详情出错';
    noteDetailLoading.value = false;
  }
}

// 关闭笔记详情弹窗
function closeNoteDetail() {
  noteDetailVisible.value = false;
  currentNoteId.value = '';
  noteDetailError.value = '';
  noteDetailLoading.value = false;
  currentNoteDetail.value = null;
  console.log('关闭笔记详情弹窗');
}

// 处理iframe加载完成事件
function handleIframeLoaded() {
  console.log('iframe加载完成');
  noteDetailLoading.value = false;
  noteDetailError.value = ''; // 清除任何可能的错误信息
}

// 处理iframe加载失败事件
function handleIframeError(e?: Event) {
  console.error('iframe加载失败:', e);
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
}

// 处理图片加载错误
function handleImageError(event: Event, note: Note) {
  const target = event.target as HTMLImageElement;
  target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24"%3E%3Cpath fill="%23cccccc" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"%3E%3C/path%3E%3C/svg%3E';
}

// 格式化日期
function formatDate(dateString?: string) {
  if (!dateString) return '未知时间';
  
  try {
    // 解析日期字符串
    const date = new Date(dateString);
    
    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      console.warn('无效的日期:', dateString);
      return '未知时间';
    }
    
    // 检查是否为未来日期，如果是，则返回当前日期
    const now = new Date();
    if (date.getFullYear() > now.getFullYear() + 1) {
      console.warn('检测到未来日期:', dateString, '使用当前日期替代');
      return now.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    // 正常格式化日期
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    console.error('格式化日期出错:', e, dateString);
    return dateString || '未知时间';
  }
}

// 显示状态消息
function showStatus(message: string, type: 'success' | 'error' | 'info' = 'info') {
  statusMessage.value = message;
  statusType.value = type;
  
  setTimeout(() => {
    statusMessage.value = '';
  }, 3000);
}

// 生成测试数据
function generateTestData(count = 10) {
  const testNotes: Note[] = [];
  
  // 如果有类型筛选，只生成对应类型的测试数据
  const filteredTypes = selectedTypeId.value === null 
    ? [1, 2, 3] 
    : [selectedTypeId.value];
  
  for (let i = 0; i < count; i++) {
    const typeIndex = i % filteredTypes.length;
    const typeId = filteredTypes[typeIndex];
    
    testNotes.push({
      id: 1000 + i,
      title: `测试笔记模板 ${i + 1}`,
      content: `这是一个测试笔记模板的内容，用于在API无法连接时显示界面效果。\n这个模板包含了一些常见的内容格式和布局，可以作为参考。\n\n如果你看到这条消息，说明当前API可能存在连接问题，但你仍然可以查看界面效果。`,
      coverImage: i % 3 === 0 ? undefined : `https://picsum.photos/seed/${i + 1}/400/300`,
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString(),
      likesCount: Math.floor(Math.random() * 100),
      viewsCount: Math.floor(Math.random() * 500),
      typeId: typeId,
      type: {
        id: typeId,
        name: ['日常', '美食', '旅行'][typeId % 3]
      }
    });
  }
  return testNotes;
}

// 获取当前选中类型名称
function getSelectedTypeName(): string {
  if (selectedTypeId === null) return '全部';
  const selectedType = noteTypes.value.find(type => type.id === selectedTypeId.value);
  return selectedType?.name || '未知类型';
}

// 使用模板
function useTemplate(note: Note) {
  try {
    console.log('准备使用模板, 笔记:', note);
    
    // 显示状态消息
    showStatus('正在导入模板...', 'info');
    
    // 直接导航到笔记工厂
    navigateToXhsProductFactory(note);
    
    // 显示成功消息
    showStatus('正在跳转到笔记工厂...', 'success');
  } catch (error: any) {
    console.error('使用模板失败:', error);
    showStatus('使用模板失败: ' + (error?.message || '未知错误'), 'error');
  }
}

// 跳转到笔记工厂
function navigateToXhsProductFactory(note: Note) {
  try {
    // 创建一个模板数组，将当前模板作为第一个元素
    const templates = [{
      id: note.id,
      title: note.title,
      content: note.content,
      coverImage: note.coverImage,
      source: 'template_market',
      isFavorited: noteFavoriteStatus[note.id] || false, // 添加收藏状态
      isLiked: noteLikeStatus[note.id] || false // 添加点赞状态
    }];
    
    // 将模板数组数据存储到localStorage中，以便在笔记工厂中使用
    localStorage.setItem('template_data', JSON.stringify({
      templates: templates,
      timestamp: new Date().getTime() // 添加时间戳用于验证数据有效性
    }));
    
    // 使用应用目录跳转到笔记工厂
    const appCatStore = useAppCatStore();
    appCatStore.showApp({
      id: 'xhs-product-factory',
      name: '小红书笔记工厂',
      type: 'built-in',
      path: 'xhs-product-factory',
      params: { 
        fromTemplate: 'true', // 改为字符串，避免某些环境下的类型转换问题
        withFavoriteStatus: 'true' // 标记携带了收藏状态
      }
    });
    
    console.log('已跳转到笔记工厂，模板数据已传递');
  } catch (error) {
    console.error('跳转到笔记工厂失败:', error);
    showStatus('跳转失败，请重试', 'error');
  }
}

// 从URL中提取笔记ID
function extractNoteIdFromUrl(url: string): string | null {
  try {
    // 检查是否是完整URL
    if (url.includes('?id=')) {
      const match = url.match(/[\?&]id=([^&]+)/);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    // 尝试其他可能的格式
    const urlObj = new URL(url);
    const params = new URLSearchParams(urlObj.search);
    const id = params.get('id');
    if (id) {
      return id;
    }
    
    // 如果是路径格式
    const pathParts = url.split('/');
    const lastPart = pathParts[pathParts.length - 1];
    if (lastPart && !lastPart.includes('?')) {
      return lastPart;
    }
    
    return null;
  } catch (e) {
    console.error('解析URL出错:', e);
    return null;
  }
}

// 使用当前模板
async function useCurrentTemplate() {
  try {
    if (!currentNoteId.value) {
      showStatus('无法获取当前笔记信息', 'error');
      return;
    }
    
    // 从URL中提取笔记ID
    const noteId = extractNoteIdFromUrl(currentNoteId.value);
    if (!noteId) {
      showStatus('无法解析笔记ID', 'error');
      return;
    }
    
    console.log('准备使用模板，笔记ID:', noteId);
    
    // 显示加载状态
    showStatus('正在获取笔记信息...', 'info');
    
    // 获取笔记详情
    const response = await service.get(`/xiaohongshu/note-template-market/${noteId}`, {
      params: { withUserStatus: true } // 添加参数，请求时包含用户收藏和点赞状态
    });
    console.log('获取笔记详情响应:', response.data);
    
    // 处理可能的多层嵌套
    let processedData = response.data;
    if (
      processedData.code === 200 && 
      processedData.data && 
      typeof processedData.data === 'object' &&
      processedData.data.code !== undefined
    ) {
      processedData = processedData.data;
    }
    
    if (processedData && (processedData.code === 0 || processedData.code === 200)) {
      const noteData = processedData.data;
      
      if (!noteData) {
        showStatus('未找到笔记数据', 'error');
        return;
      }
      
      // 更新收藏和点赞状态
      if (noteData.userStatus) {
        noteLikeStatus[noteData.id] = !!noteData.userStatus.liked;
        noteFavoriteStatus[noteData.id] = !!noteData.userStatus.favorited;
      } else {
        // 兼容旧版API，使用单独的字段
        if (noteData.isLiked !== undefined) noteLikeStatus[noteData.id] = !!noteData.isLiked;
        if (noteData.isFavorited !== undefined) noteFavoriteStatus[noteData.id] = !!noteData.isFavorited;
      }
      
      // 创建要导入的笔记对象
      const noteToImport: Note = {
        id: noteData.id,
        title: noteData.title || '',
        content: noteData.content || '',
        coverImage: noteData.coverImage,
        typeId: noteData.typeId || noteData.type?.id || 1,
        type: noteData.type || { id: 1, name: '未分类' },
        createTime: noteData.createTime || new Date().toISOString(),
        updateTime: noteData.updateTime || new Date().toISOString(),
        likesCount: noteData.likesCount || 0,
        viewsCount: noteData.viewsCount || 0
      };
      
      // 跳转到笔记工厂并带上模板数据
      navigateToXhsProductFactory(noteToImport);
      
      // 关闭详情弹窗
      closeNoteDetail();
      
      // 显示成功消息
      showStatus('正在跳转到笔记工厂...', 'success');
    } else {
      showStatus('获取笔记详情失败: ' + (processedData?.message || '未知错误'), 'error');
    }
  } catch (error: any) {
    console.error('使用模板出错:', error);
    showStatus('使用模板失败: ' + (error.message || '未知错误'), 'error');
  }
}

// 组件挂载时获取数据
onMounted(() => {
  fetchNoteTypes();
  fetchNotes(1);
});

// 添加收藏筛选状态
const showFavoritesOnly = ref(false);

// 切换收藏筛选
function toggleFavoriteFilter() {
  showFavoritesOnly.value = !showFavoritesOnly.value;
  fetchNotes(1); // 重新获取笔记
}
</script>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border-left-color: #ec4899;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.aspect-w-3 {
  position: relative;
  padding-bottom: 133.33%; /* 3:4比例 */
}

.aspect-w-3 > * {
  position: absolute;
}

.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #ec4899 transparent;
}

.custom-scrollbar::-webkit-scrollbar {
  height: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: #1f1f1f;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #ec4899;
  border-radius: 20px;
}

:deep(.dark) {
  .spinner {
    border-left-color: #ec4899;
  }
  
  .custom-scrollbar {
    scrollbar-color: #ec4899 #1f1f1f;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: #ec4899;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #1f1f1f;
  }
}

/* 笔记详情弹窗专用样式 */
.note-detail-iframe {
  width: 100%;
  height: 100%;
  border: none;
  border-radius: 8px;
  background-color: #1a1a1a; /* 确保iframe背景也是黑色 */
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.fade-in {
  animation: fade-in 0.3s ease-in-out;
}
</style>