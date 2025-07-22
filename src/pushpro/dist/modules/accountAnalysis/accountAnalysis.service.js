"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AccountAnalysisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountAnalysisService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("axios");
const typeorm_1 = require("typeorm");
const create_task_dto_1 = require("./dto/create-task.dto");
const result_1 = require("../../common/result");
const typeorm_2 = require("@nestjs/typeorm");
const fx_task_entity_1 = require("./entities/fx-task.entity");
const openaiChat_service_1 = require("../ai/openaiChat.service");
const globalConfig_service_1 = require("../globalConfig/globalConfig.service");
const app_entity_1 = require("../app/app.entity");
const typeorm_3 = require("typeorm");
const ai_api_service_1 = require("../ai/ai_api.service");
let AccountAnalysisService = AccountAnalysisService_1 = class AccountAnalysisService {
    constructor(dataSource, fxTaskRepository, openAIChatService, globalConfigService, appEntity, aiApiService) {
        this.dataSource = dataSource;
        this.fxTaskRepository = fxTaskRepository;
        this.openAIChatService = openAIChatService;
        this.globalConfigService = globalConfigService;
        this.appEntity = appEntity;
        this.aiApiService = aiApiService;
        this.logger = new common_1.Logger(AccountAnalysisService_1.name);
        this.MAX_POLLING_COUNT = 10;
        this.POLLING_INTERVAL = 2 * 60 * 1000;
        this.taskPollingMap = new Map();
        this.logger.log(`数据库连接状态: ${this.dataSource.isInitialized ? '已连接' : '未连接'}`);
        this.logger.log(`FxTask仓库: ${this.fxTaskRepository ? '已注入' : '未注入'}`);
        try {
            const metadata = this.dataSource.getMetadata(fx_task_entity_1.FxTask);
            this.logger.log(`FxTask元数据: 表名=${metadata.tableName}, 列数=${metadata.columns.length}`);
        }
        catch (error) {
            this.logger.error(`获取FxTask元数据失败: ${error.message}`);
        }
    }
    getCleanUrl(url) {
        try {
            if (!url)
                return '';
            try {
                const urlObj = new URL(url);
                return `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`;
            }
            catch (parseError) {
                this.logger.warn(`URL解析失败: ${parseError.message}, 使用备用处理方法`);
                const questionMarkIndex = url.indexOf('?');
                if (questionMarkIndex !== -1) {
                    return url.substring(0, questionMarkIndex);
                }
                return url;
            }
        }
        catch (error) {
            this.logger.error(`处理URL出错: ${error.message}`);
            return url;
        }
    }
    detectPlatformFromLink(link) {
        try {
            if (!link)
                return null;
            let urlObj;
            try {
                urlObj = new URL(link);
            }
            catch (parseError) {
                if (!link.startsWith('http://') && !link.startsWith('https://')) {
                    try {
                        urlObj = new URL(`https://${link}`);
                    }
                    catch (e) {
                        this.logger.warn(`无法解析链接: ${link}`);
                        return null;
                    }
                }
                else {
                    this.logger.warn(`无法解析链接: ${link}`);
                    return null;
                }
            }
            const hostname = urlObj.hostname.toLowerCase();
            if (hostname.includes('douyin.com') || hostname.includes('iesdouyin.com') ||
                hostname.includes('douyinvod.com') || hostname.includes('awemeurlb.com') ||
                hostname.includes('toutiao.com') || hostname.includes('snssdk.com')) {
                return create_task_dto_1.PlatformType.DOUYIN;
            }
            else if (hostname.includes('xiaohongshu.com') || hostname.includes('xhscdn.com') ||
                hostname.includes('xhsstatic.com') || hostname.includes('xhslink.com') ||
                hostname.includes('xiaohongshu.') || hostname.includes('xhs.')) {
                return create_task_dto_1.PlatformType.XIAOHONGSHU;
            }
            return null;
        }
        catch (error) {
            this.logger.error(`检测平台类型出错: ${error.message}`);
            return null;
        }
    }
    async createTask(dto) {
        try {
            const { platform, type_name, user_id, link, mode } = dto;
            if (!link || !user_id) {
                return result_1.Result.fail(400, '链接和用户ID不能为空');
            }
            const detectedPlatform = this.detectPlatformFromLink(link);
            let finalPlatform = platform;
            let finalTypeName = type_name;
            if (detectedPlatform) {
                if (!platform) {
                    finalPlatform = detectedPlatform;
                    finalTypeName = detectedPlatform === create_task_dto_1.PlatformType.DOUYIN ? '抖音' : '小红书';
                    this.logger.log(`未指定平台，根据链接自动检测为: ${finalPlatform}`);
                }
                else if (platform !== detectedPlatform) {
                    this.logger.warn(`指定的平台(${platform})与链接检测到的平台(${detectedPlatform})不一致，使用检测到的平台`);
                    finalPlatform = detectedPlatform;
                    finalTypeName = detectedPlatform === create_task_dto_1.PlatformType.DOUYIN ? '抖音' : '小红书';
                }
            }
            else if (!platform) {
                return result_1.Result.fail(400, '无法从链接检测平台类型，请明确指定平台');
            }
            if (!finalPlatform || !finalTypeName) {
                return result_1.Result.fail(400, '参数不完整，无法确定平台类型');
            }
            this.logger.log(`创建分析任务: 用户ID=${user_id}, 平台=${finalPlatform}, 链接=${link}`);
            const cleanLink = this.getCleanUrl(link);
            this.logger.log(`处理后的干净链接: ${cleanLink}`);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayTasks = await this.fxTaskRepository.find({
                where: {
                    create_time: (0, typeorm_3.MoreThanOrEqual)(today)
                },
                order: { create_time: 'DESC' }
            });
            const existingTask = todayTasks.find(task => this.getCleanUrl(task.fx_url) === cleanLink);
            if (existingTask) {
                this.logger.log(`发现当天相同链接的任务: ID=${existingTask.id}, 状态=${existingTask.status}`);
                const newTask = new fx_task_entity_1.FxTask();
                const newTaskId = `copy_${existingTask.task_id}_${Date.now()}`;
                newTask.task_id = newTaskId;
                newTask.id = parseInt(newTaskId.replace(/\D/g, '')) || Date.now();
                newTask.user_id = user_id;
                newTask.type_name = finalTypeName;
                newTask.fx_url = link;
                newTask.timeout = existingTask.timeout || 1;
                newTask.status = existingTask.status;
                newTask.create_time = new Date();
                newTask.account_name = existingTask.account_name;
                newTask.followers_count = existingTask.followers_count;
                newTask.likes_count = existingTask.likes_count;
                if (existingTask.status === '已完成') {
                    newTask.fx_content = existingTask.fx_content;
                    newTask.fx_content_jj = existingTask.fx_content_jj;
                    newTask.ip_content = existingTask.ip_content;
                    newTask.ip_html_content = existingTask.ip_html_content;
                    newTask.update_time = new Date();
                }
                const savedTask = await this.fxTaskRepository.save(newTask);
                this.logger.log(`复制任务保存成功: ID=${savedTask.id}, 任务ID=${savedTask.task_id}`);
                return result_1.Result.success({
                    id: savedTask.id,
                    task_id: savedTask.task_id,
                    timeout: savedTask.timeout
                }, '创建分析任务成功（使用今日相同链接的数据）');
            }
            let apiUrl = 'https://dy.aivip1.top/pc/api/create_fx_task.php';
            let apiData;
            if (finalPlatform === create_task_dto_1.PlatformType.DOUYIN) {
                apiData = {
                    user_id: "1",
                    douyinLink: link,
                    selectedMode: mode || '10'
                };
            }
            else if (finalPlatform === create_task_dto_1.PlatformType.XIAOHONGSHU) {
                apiData = {
                    type_name: '小红书',
                    user_id: "1",
                    douyinLink: link,
                    selectedMode: mode || '1'
                };
            }
            else {
                return result_1.Result.fail(400, '不支持的平台类型');
            }
            this.logger.log(`发送分析请求: ${apiUrl}, 数据: ${JSON.stringify(apiData)}`);
            const apiResponse = await axios_1.default.post(apiUrl, apiData, {
                headers: {
                    'accept': 'application/json, text/plain, */*',
                    'accept-language': 'zh-CN,zh;q=0.9',
                    'content-type': 'application/json',
                    'origin': 'https://dy.aivip1.top',
                    'referer': 'https://dy.aivip1.top/pc/home',
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36'
                }
            });
            if (!apiResponse.data.success) {
                this.logger.log("创建分析任务失败:", JSON.stringify(apiResponse.data));
                return result_1.Result.fail(400, apiResponse.data.message || '创建分析任务失败');
            }
            const taskData = apiResponse.data.data;
            try {
                const fxTask = new fx_task_entity_1.FxTask();
                fxTask.user_id = user_id;
                fxTask.type_name = finalTypeName;
                fxTask.task_id = taskData.task_id;
                fxTask.fx_url = link;
                fxTask.timeout = taskData.timeout || 1;
                fxTask.status = '进行中';
                fxTask.create_time = new Date();
                if (taskData.id) {
                    this.logger.log(`外部API返回的任务ID: ${taskData.id}`);
                    fxTask.external_id = parseInt(taskData.id);
                }
                this.logger.log(`准备保存任务到数据库: ${JSON.stringify({
                    id: fxTask.id,
                    user_id: fxTask.user_id,
                    type_name: fxTask.type_name,
                    task_id: fxTask.task_id,
                    external_id: fxTask.external_id,
                    status: fxTask.status
                })}`);
                const savedTask = await this.fxTaskRepository.save(fxTask);
                this.logger.log(`任务保存成功: ID=${savedTask.id}, 任务ID=${savedTask.task_id}`);
                await this.fetchTaskDetailAndSave(savedTask.id, taskData.task_id);
                this.startTaskPolling(savedTask.id, taskData.task_id);
                return result_1.Result.success(Object.assign({ id: savedTask.id }, taskData), '创建分析任务成功');
            }
            catch (error) {
                this.logger.error(`保存分析任务出错: ${error.message}`);
                this.logger.error(`保存分析任务出错详情: ${error.stack}`);
                return result_1.Result.fail(500, '保存分析任务出错: ' + error.message);
            }
        }
        catch (error) {
            this.logger.error(`创建分析任务出错: ${error.message}`);
            return result_1.Result.fail(500, '创建分析任务出错: ' + error.message);
        }
    }
    async getTasks(userId) {
        try {
            if (!userId) {
                return result_1.Result.fail(400, '用户ID不能为空');
            }
            const tasks = await this.fxTaskRepository.find({
                where: { user_id: userId },
                order: { create_time: 'DESC' }
            });
            return result_1.Result.success(tasks, '获取分析任务列表成功');
        }
        catch (error) {
            this.logger.error(`获取分析任务列表出错: ${error.message}`);
            return result_1.Result.fail(500, '获取分析任务列表出错: ' + error.message);
        }
    }
    async getTasksWithoutContent(userId) {
        try {
            if (!userId) {
                return result_1.Result.fail(400, '用户ID不能为空');
            }
            const tasks = await this.fxTaskRepository.find({
                select: ['id', 'user_id', 'task_id', 'type_name', 'fx_url', 'timeout', 'status', 'create_time', 'update_time', 'account_name', 'followers_count', 'likes_count'],
                where: { user_id: userId },
                order: { create_time: 'DESC' }
            });
            return result_1.Result.success(tasks, '获取分析任务列表成功');
        }
        catch (error) {
            this.logger.error(`获取分析任务列表出错: ${error.message}`);
            return result_1.Result.fail(500, '获取分析任务列表出错: ' + error.message);
        }
    }
    async getTaskResult(taskId, id) {
        try {
            if (!taskId) {
                return result_1.Result.fail(400, '任务ID不能为空');
            }
            const whereCondition = id ? { id } : { task_id: taskId };
            const task = await this.fxTaskRepository.findOne({
                where: whereCondition
            });
            if (!task) {
                return result_1.Result.fail(404, '未找到该分析任务');
            }
            if (task.status !== '已完成' && task.status !== '失败') {
                try {
                    await this.fetchTaskDetailAndSave(task.id, task.task_id);
                    const updatedTask = await this.fxTaskRepository.findOne({
                        where: { id: task.id }
                    });
                    if (updatedTask) {
                        return result_1.Result.success(updatedTask, '获取分析任务结果成功');
                    }
                }
                catch (error) {
                    this.logger.error(`更新分析任务状态出错: ${error.message}`);
                }
            }
            return task;
        }
        catch (error) {
            this.logger.error(`获取分析任务结果出错: ${error.message}`);
            return result_1.Result.fail(500, '获取分析任务结果出错: ' + error.message);
        }
    }
    async fetchTaskDetailAndSave(id, taskId) {
        try {
            const task = await this.fxTaskRepository.findOne({
                where: { id }
            });
            if (!task) {
                this.logger.warn(`未找到任务: ID=${id}`);
                return false;
            }
            const externalId = task.external_id ? task.external_id : id;
            const apiUrl = `https://dy.aivip1.top/pc/api/get_user_task.php?user_id=1&task_id=${taskId}&id=${externalId}`;
            this.logger.log(`获取任务详情: ${apiUrl}`);
            const apiResponse = await axios_1.default.get(apiUrl, {
                headers: {
                    'accept': 'application/json, text/plain, */*',
                    'accept-language': 'zh-CN,zh;q=0.9',
                    'origin': 'https://dy.aivip1.top',
                    'referer': 'https://dy.aivip1.top/pc/home',
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36'
                }
            });
            if (apiResponse.data && apiResponse.data.task) {
                const taskDetail = apiResponse.data.task;
                if (task) {
                    if (taskDetail.fx_content && typeof taskDetail.fx_content === 'string') {
                        try {
                            const fxContentData = JSON.parse(taskDetail.fx_content);
                            this.logger.log(`任务${id}的fx_content是有效的JSON`);
                            if (fxContentData.user_data) {
                                const userData = fxContentData.user_data;
                                task.account_name = userData.nickname || null;
                                task.followers_count = userData.followers_count || null;
                                task.likes_count = userData.likes_count || null;
                                this.logger.log(`从fx_content提取数据: 账号名=${task.account_name}, 粉丝数=${task.followers_count}, 点赞数=${task.likes_count}`);
                            }
                        }
                        catch (error) {
                            this.logger.warn(`任务${id}的fx_content不是有效的JSON: ${error.message}`);
                        }
                    }
                    task.status = taskDetail.status || task.status;
                    task.fx_content = taskDetail.fx_content || task.fx_content;
                    task.fx_content_jj = taskDetail.fx_content_jj || task.fx_content_jj;
                    task.ip_content = taskDetail.ip_content || task.ip_content;
                    task.update_time = new Date();
                    if (task.status === '已完成' && (!task.ip_html_content || !task.ip_content)) {
                        try {
                            this.logger.log(`任务${id}已完成但缺少分析内容，尝试使用AI生成分析`);
                            const aiAnalysisResult = await this.generateAIAnalysis(task);
                            if (aiAnalysisResult) {
                                const htmlMatch = aiAnalysisResult.match(/```html([\s\S]*?)```/);
                                if (htmlMatch && htmlMatch[1]) {
                                    task.ip_html_content = htmlMatch[1].trim();
                                    this.logger.log(`已提取HTML内容，字符数: ${task.ip_html_content.length}`);
                                }
                                else {
                                    this.logger.warn(`无法从AI回复中提取HTML内容`);
                                }
                                task.ip_content = aiAnalysisResult;
                                this.logger.log(`已生成AI分析内容，字符数: ${aiAnalysisResult.length}`);
                            }
                        }
                        catch (aiError) {
                            this.logger.error(`使用AI生成分析内容失败: ${aiError.message}`);
                        }
                    }
                    await this.fxTaskRepository.save(task);
                    this.logger.log(`更新任务详情成功: 任务ID=${taskId}, 状态=${task.status}`);
                    return task.status === '已完成';
                }
                else {
                    this.logger.warn(`未找到要更新的任务: 任务ID=${taskId}`);
                }
            }
            else {
                this.logger.warn(`API未返回任务详情: 任务ID=${taskId}`);
            }
            return false;
        }
        catch (error) {
            this.logger.error(`获取任务详情出错: ${error.message}`);
            return false;
        }
    }
    async generateAIAnalysis(task) {
        try {
            if (!task.fx_content) {
                this.logger.warn(`任务${task.id}没有fx_content数据，无法生成AI分析`);
                return null;
            }
            let prompt = `需要分析的IP博主视频信息如下：${task.fx_content}，IP博主信息如下：${task.ip_content}`;
            return await this.aiApiService.generateAIContent({
                appName: "IP分析",
                prompt: prompt,
                chatId: `account-analysis-${task.id}`,
            });
        }
        catch (error) {
            this.logger.error(`生成AI分析内容出错: ${error.message}`);
            throw error;
        }
    }
    startTaskPolling(id, taskId) {
        if (this.taskPollingMap.has(taskId)) {
            this.logger.warn(`任务已在轮询中: ${taskId}`);
            return;
        }
        this.logger.log(`启动任务轮询更新: 任务ID=${taskId}`);
        const timerId = setInterval(async () => {
            try {
                const pollingInfo = this.taskPollingMap.get(taskId);
                if (!pollingInfo) {
                    this.logger.error(`轮询信息不存在: ${taskId}`);
                    return;
                }
                pollingInfo.count++;
                this.logger.log(`轮询更新任务[${pollingInfo.count}/${this.MAX_POLLING_COUNT}]: 任务ID=${taskId}`);
                const isCompleted = await this.fetchTaskDetailAndSave(id, taskId);
                if (isCompleted || pollingInfo.count >= this.MAX_POLLING_COUNT) {
                    if (isCompleted) {
                        this.logger.log(`任务已完成，停止轮询: 任务ID=${taskId}`);
                    }
                    else {
                        this.logger.warn(`达到最大轮询次数，任务未完成: 任务ID=${taskId}`);
                        const task = await this.fxTaskRepository.findOne({
                            where: { id }
                        });
                        if (task && task.status !== '已完成') {
                            task.status = '失败';
                            task.update_time = new Date();
                            await this.fxTaskRepository.save(task);
                            this.logger.warn(`将任务状态设置为失败: 任务ID=${taskId}`);
                        }
                    }
                    this.stopTaskPolling(taskId);
                }
            }
            catch (error) {
                this.logger.error(`轮询更新任务出错: ${error.message}`);
            }
        }, this.POLLING_INTERVAL);
        this.taskPollingMap.set(taskId, {
            count: 0,
            timerId
        });
    }
    stopTaskPolling(taskId) {
        const pollingInfo = this.taskPollingMap.get(taskId);
        if (pollingInfo) {
            clearInterval(pollingInfo.timerId);
            this.taskPollingMap.delete(taskId);
            this.logger.log(`停止任务轮询: 任务ID=${taskId}`);
        }
    }
    async refreshTask(id, taskId, userId) {
        try {
            if (!id || !taskId) {
                return result_1.Result.fail(400, '参数不完整');
            }
            const task = await this.fxTaskRepository.findOne({
                where: { id, task_id: taskId, user_id: userId }
            });
            if (!task) {
                return result_1.Result.fail(404, '未找到该分析任务或无权访问');
            }
            if (task.status === '已完成' || task.status === '失败') {
                return result_1.Result.success(task, '任务已完成或失败，无需刷新');
            }
            this.asyncRefreshTask(id, taskId);
            return result_1.Result.success(task, '任务刷新请求已发送，正在后台更新');
        }
        catch (error) {
            this.logger.error(`刷新任务状态出错: ${error.message}`);
            return result_1.Result.fail(500, '刷新任务状态出错: ' + error.message);
        }
    }
    async asyncRefreshTask(id, taskId) {
        try {
            this.logger.log(`开始异步刷新任务: ID=${id}, 任务ID=${taskId}`);
            const updated = await this.fetchTaskDetailAndSave(id, taskId);
            if (updated) {
                this.logger.log(`异步刷新任务成功: ID=${id}, 任务ID=${taskId}`);
            }
            else {
                this.logger.warn(`异步刷新任务未成功完成: ID=${id}, 任务ID=${taskId}`);
            }
        }
        catch (error) {
            this.logger.error(`异步刷新任务出错: ID=${id}, 任务ID=${taskId}, 错误=${error.message}`);
        }
    }
};
AccountAnalysisService = AccountAnalysisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_2.InjectRepository)(fx_task_entity_1.FxTask)),
    __param(4, (0, typeorm_2.InjectRepository)(app_entity_1.AppEntity)),
    __metadata("design:paramtypes", [typeorm_1.DataSource,
        typeorm_1.Repository,
        openaiChat_service_1.OpenAIChatService,
        globalConfig_service_1.GlobalConfigService,
        typeorm_1.Repository,
        ai_api_service_1.AiApiService])
], AccountAnalysisService);
exports.AccountAnalysisService = AccountAnalysisService;
