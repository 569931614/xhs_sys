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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageGeneratorService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const axios_1 = require("axios");
const image_generator_entity_1 = require("./image-generator.entity");
const image_download_url_entity_1 = require("./image-download-url.entity");
const redisCache_service_1 = require("../redisCache/redisCache.service");
const image_upload_service_1 = require("../ai/image-upload.service");
let ImageGeneratorService = class ImageGeneratorService {
    constructor(imageTaskRepository, imageDownloadUrlRepository, redisCacheService, imageUploadService) {
        this.imageTaskRepository = imageTaskRepository;
        this.imageDownloadUrlRepository = imageDownloadUrlRepository;
        this.redisCacheService = redisCacheService;
        this.imageUploadService = imageUploadService;
        this.ckUserId = "24209700";
    }
    async getAuthToken() {
        return await this.redisCacheService.getCreativeAuthToken();
    }
    filterValidImageUrls(urls) {
        if (!urls || !Array.isArray(urls))
            return [];
        return urls.filter(url => {
            return url && typeof url === 'string' && !url.includes('null');
        });
    }
    extractImageUrls(imageData) {
        if (!imageData || !Array.isArray(imageData))
            return [];
        const rawUrls = imageData.map(image => {
            if (!image || !image.thumbUrl)
                return null;
            return `https:${image.thumbUrl}`;
        });
        return this.filterValidImageUrls(rawUrls);
    }
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    getReplaceIdByIntellectId(intellectId) {
        switch (intellectId) {
            case 280:
                return "7532";
            case 231:
                return "7620";
            case 374:
                return "7860";
            case 148:
                return "5554";
            case 147:
                return "5558";
            case 130:
                return "5487";
            case 267:
            default:
                return "7398";
        }
    }
    getUserInputJsonByIntellectId(intellectId, title, additionalFields) {
        switch (intellectId) {
            case 280:
                return JSON.stringify([{
                        "markName": "主标题",
                        "markType": 1,
                        "value": title,
                        "replaceType": 6,
                        "replaceId": "7532"
                    }]);
            case 231:
                return JSON.stringify([
                    {
                        "markName": "主标题",
                        "markType": 1,
                        "value": title,
                        "replaceType": 6,
                        "replaceId": "6867"
                    },
                    {
                        "markName": "副标题",
                        "markType": 1,
                        "value": (additionalFields === null || additionalFields === void 0 ? void 0 : additionalFields.subtitle) || "副标题示例",
                        "replaceType": 6,
                        "replaceId": "6869"
                    },
                    {
                        "markName": "段落标题1",
                        "markType": 1,
                        "value": (additionalFields === null || additionalFields === void 0 ? void 0 : additionalFields.paragraph1Title) || "段落标题1示例",
                        "replaceType": 6,
                        "replaceId": "6861"
                    },
                    {
                        "markName": "段落正文1",
                        "markType": 1,
                        "value": (additionalFields === null || additionalFields === void 0 ? void 0 : additionalFields.paragraph1Content) || "段落正文1示例内容",
                        "replaceType": 6,
                        "replaceId": "6862"
                    },
                    {
                        "markName": "段落标题2",
                        "markType": 1,
                        "value": (additionalFields === null || additionalFields === void 0 ? void 0 : additionalFields.paragraph2Title) || "段落标题2示例",
                        "replaceType": 6,
                        "replaceId": "6863"
                    },
                    {
                        "markName": "段落正文2",
                        "markType": 1,
                        "value": (additionalFields === null || additionalFields === void 0 ? void 0 : additionalFields.paragraph2Content) || "段落正文2示例内容",
                        "replaceType": 6,
                        "replaceId": "6864"
                    },
                    {
                        "markName": "段落标题3",
                        "markType": 1,
                        "value": (additionalFields === null || additionalFields === void 0 ? void 0 : additionalFields.paragraph3Title) || "段落标题3示例",
                        "replaceType": 6,
                        "replaceId": "6865"
                    },
                    {
                        "markName": "段落正文3",
                        "markType": 1,
                        "value": (additionalFields === null || additionalFields === void 0 ? void 0 : additionalFields.paragraph3Content) || "段落正文3示例内容",
                        "replaceType": 6,
                        "replaceId": "6866"
                    }
                ]);
            case 374:
                return JSON.stringify([
                    {
                        "markName": "主标题",
                        "markType": 1,
                        "value": title,
                        "replaceType": 6,
                        "replaceId": "7860"
                    },
                    {
                        "markName": "段落标题1",
                        "markType": 1,
                        "value": (additionalFields === null || additionalFields === void 0 ? void 0 : additionalFields.paragraph1Title) || "段落标题1示例",
                        "replaceType": 6,
                        "replaceId": "7875"
                    },
                    {
                        "markName": "段落正文1",
                        "markType": 1,
                        "value": (additionalFields === null || additionalFields === void 0 ? void 0 : additionalFields.paragraph1Content) || "段落正文1示例内容",
                        "replaceType": 6,
                        "replaceId": "7876"
                    }
                ]);
            case 148:
                return JSON.stringify([
                    {
                        "markName": "主标题",
                        "markType": 1,
                        "value": title,
                        "replaceType": 6,
                        "replaceId": "5554"
                    },
                    {
                        "markName": "副标题",
                        "markType": 1,
                        "value": (additionalFields === null || additionalFields === void 0 ? void 0 : additionalFields.subtitle) || "副标题示例",
                        "replaceType": 6,
                        "replaceId": "5555"
                    },
                    {
                        "markName": "图1",
                        "markType": 2,
                        "value": parseInt((additionalFields === null || additionalFields === void 0 ? void 0 : additionalFields.image1) || "0"),
                        "replaceType": 9,
                        "source": 23,
                        "replaceId": "5556"
                    },
                    {
                        "markName": "图2",
                        "markType": 2,
                        "value": parseInt((additionalFields === null || additionalFields === void 0 ? void 0 : additionalFields.image2) || "0"),
                        "replaceType": 9,
                        "source": 23,
                        "replaceId": "5557"
                    }
                ]);
            case 147:
                return JSON.stringify([
                    {
                        "markName": "主标题",
                        "markType": 1,
                        "value": title,
                        "replaceType": 6,
                        "replaceId": "5558"
                    },
                    {
                        "markName": "副标题",
                        "markType": 1,
                        "value": (additionalFields === null || additionalFields === void 0 ? void 0 : additionalFields.subtitle) || "副标题示例",
                        "replaceType": 6,
                        "replaceId": "5559"
                    },
                    {
                        "markName": "图1",
                        "markType": 2,
                        "value": parseInt((additionalFields === null || additionalFields === void 0 ? void 0 : additionalFields.image1) || "0"),
                        "replaceType": 9,
                        "source": 23,
                        "replaceId": "5560"
                    },
                    {
                        "markName": "图2",
                        "markType": 2,
                        "value": parseInt((additionalFields === null || additionalFields === void 0 ? void 0 : additionalFields.image2) || "0"),
                        "replaceType": 9,
                        "source": 23,
                        "replaceId": "5561"
                    },
                    {
                        "markName": "图3",
                        "markType": 2,
                        "value": parseInt((additionalFields === null || additionalFields === void 0 ? void 0 : additionalFields.image3) || "0"),
                        "replaceType": 9,
                        "source": 23,
                        "replaceId": "5562"
                    }
                ]);
            case 130:
                return JSON.stringify([
                    {
                        "markName": "主标题",
                        "markType": 1,
                        "value": title,
                        "replaceType": 6,
                        "replaceId": "5487"
                    },
                    {
                        "markName": "副标题",
                        "markType": 1,
                        "value": (additionalFields === null || additionalFields === void 0 ? void 0 : additionalFields.subtitle) || "副标题示例",
                        "replaceType": 6,
                        "replaceId": "5488"
                    },
                    {
                        "markName": "图1",
                        "markType": 2,
                        "value": parseInt((additionalFields === null || additionalFields === void 0 ? void 0 : additionalFields.image1) || "0"),
                        "replaceType": 9,
                        "source": 23,
                        "replaceId": "5484"
                    },
                    {
                        "markName": "图2",
                        "markType": 2,
                        "value": parseInt((additionalFields === null || additionalFields === void 0 ? void 0 : additionalFields.image2) || "0"),
                        "replaceType": 9,
                        "source": 23,
                        "replaceId": "5485"
                    },
                    {
                        "markName": "图3",
                        "markType": 2,
                        "value": parseInt((additionalFields === null || additionalFields === void 0 ? void 0 : additionalFields.image3) || "0"),
                        "replaceType": 9,
                        "source": 23,
                        "replaceId": "5486"
                    },
                    {
                        "markName": "图4",
                        "markType": 2,
                        "value": parseInt((additionalFields === null || additionalFields === void 0 ? void 0 : additionalFields.image4) || "0"),
                        "replaceType": 9,
                        "source": 23,
                        "replaceId": "5493"
                    }
                ]);
            case 267:
            default:
                return JSON.stringify([{
                        "markName": "主标题",
                        "markType": 1,
                        "value": title,
                        "replaceType": 6,
                        "replaceId": "7398"
                    }]);
        }
    }
    async getTaskImages(taskIds, retryCount = 3, retryDelay = 1000) {
        var _a, _b, _c, _d;
        let attempt = 0;
        let lastResponse = null;
        let bestImageUrls = [];
        console.log(`开始获取图片，任务数量: ${taskIds.length}，最大重试次数: ${retryCount}，重试间隔: ${retryDelay}ms`);
        while (attempt < retryCount) {
            attempt++;
            try {
                const authToken = await this.getAuthToken();
                const taskIdsParam = taskIds.join(',');
                const imageResponse = await axios_1.default.get(`https://gw.chuangkit.com/imagehub/task/mark/replace/result?_dataType=json&client_type=0&taskIds=${taskIdsParam}`, {
                    headers: {
                        'Accept': 'application/json, text/plain, */*',
                        'Accept-Language': 'zh-CN,zh;q=0.9',
                        'Authorization': `Bearer ${authToken}`,
                        'Connection': 'keep-alive',
                        'Content-Type': 'application/json',
                        'Origin': 'https://www.chuangkit.com',
                        'Referer': 'https://www.chuangkit.com/',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36'
                    }
                });
                lastResponse = imageResponse;
                if (((_b = (_a = imageResponse.data) === null || _a === void 0 ? void 0 : _a.body) === null || _b === void 0 ? void 0 : _b.code) !== 200) {
                    console.error(`API响应错误，尝试 ${attempt}/${retryCount}:`, imageResponse.data);
                    if (attempt < retryCount) {
                        console.log(`等待${retryDelay}ms后重试...`);
                        await this.delay(retryDelay);
                        continue;
                    }
                    return {
                        imageUrls: bestImageUrls.length > 0 ? bestImageUrls : [],
                        success: bestImageUrls.length > 0,
                        errorMsg: '获取图片链接失败'
                    };
                }
                const imageData = imageResponse.data.body.data;
                if (!imageData || imageData.length === 0) {
                    console.error(`未获取到图片数据，尝试 ${attempt}/${retryCount}`);
                    if (attempt < retryCount) {
                        console.log(`等待${retryDelay}ms后重试...`);
                        await this.delay(retryDelay);
                        continue;
                    }
                    return {
                        imageUrls: bestImageUrls.length > 0 ? bestImageUrls : [],
                        success: bestImageUrls.length > 0,
                        errorMsg: '没有获取到图片数据'
                    };
                }
                const imageUrls = this.extractImageUrls(imageData);
                console.log(`尝试 ${attempt}/${retryCount}: 获取到 ${imageUrls.length}/${taskIds.length} 张有效图片`);
                if (imageUrls.length > bestImageUrls.length) {
                    bestImageUrls = [...imageUrls];
                    console.log(`更新最佳图片集合，当前有 ${bestImageUrls.length} 张有效图片`);
                }
                if (imageUrls.length < taskIds.length) {
                    console.log(`获取到的有效图片数量(${imageUrls.length})少于任务数量(${taskIds.length})，尝试 ${attempt}/${retryCount}`);
                    if (attempt < retryCount) {
                        console.log(`等待${retryDelay}ms后重试...`);
                        await this.delay(retryDelay);
                        continue;
                    }
                    if (bestImageUrls.length > 0) {
                        console.log(`已达到最大重试次数，返回最佳图片集合 (${bestImageUrls.length}/${taskIds.length})`);
                        return { imageUrls: bestImageUrls, success: true };
                    }
                    return { imageUrls, success: true };
                }
                console.log(`获取到完整的图片数量 (${imageUrls.length}/${taskIds.length})`);
                return { imageUrls, success: true };
            }
            catch (error) {
                console.error(`获取图片数据失败 (尝试 ${attempt}/${retryCount}):`, error);
                if (attempt < retryCount) {
                    console.log(`等待${retryDelay}ms后重试...`);
                    await this.delay(retryDelay);
                    continue;
                }
                if (bestImageUrls.length > 0) {
                    console.log(`虽然出错，但返回之前获取的最佳图片集合 (${bestImageUrls.length}/${taskIds.length})`);
                    return { imageUrls: bestImageUrls, success: true };
                }
                return {
                    imageUrls: [],
                    success: false,
                    errorMsg: error.message || '获取图片数据失败'
                };
            }
        }
        if (lastResponse && ((_d = (_c = lastResponse.data) === null || _c === void 0 ? void 0 : _c.body) === null || _d === void 0 ? void 0 : _d.data)) {
            const imageData = lastResponse.data.body.data;
            const imageUrls = this.extractImageUrls(imageData);
            if (imageUrls.length > bestImageUrls.length) {
                bestImageUrls = [...imageUrls];
            }
            if (bestImageUrls.length > 0) {
                console.log(`经过${retryCount}次尝试，成功获取到${bestImageUrls.length}张有效图片`);
                return { imageUrls: bestImageUrls, success: true };
            }
        }
        return {
            imageUrls: [],
            success: false,
            errorMsg: '获取图片失败，已达到最大重试次数'
        };
    }
    async generateImage(createImageDto, userId) {
        var _a, _b;
        try {
            console.log('接收到生成图片请求:', JSON.stringify(createImageDto, null, 2));
            const pageNo = createImageDto.pageNo || 1;
            console.log(`当前生成页码: ${pageNo}`);
            let imageTask;
            if (pageNo > 1 && createImageDto.previousTaskId) {
                imageTask = await this.imageTaskRepository.findOne({
                    where: { id: createImageDto.previousTaskId, userId }
                });
                if (!imageTask) {
                    return {
                        code: 400,
                        data: null,
                        message: '未找到原始任务记录，无法继续生成'
                    };
                }
                imageTask.status = 'processing';
                await this.imageTaskRepository.save(imageTask);
            }
            else {
                imageTask = this.imageTaskRepository.create({
                    userId,
                    prompt: createImageDto.title,
                    status: 'pending',
                });
                await this.imageTaskRepository.save(imageTask);
            }
            const authToken = await this.getAuthToken();
            const intellectId = createImageDto.intellectId || 267;
            const replaceId = this.getReplaceIdByIntellectId(intellectId);
            const randomNum = Math.floor(Math.random() * 9000000000) + 1000000000;
            const requestId = this.ckUserId + `_${intellectId}_${randomNum}`;
            const userInputJson = this.getUserInputJsonByIntellectId(intellectId, createImageDto.title, createImageDto.additionalFields);
            const reportInfo = JSON.stringify({
                "versions_type": "经典版",
                "business_lines": "企业线",
                "business_id": 23900253,
                "user_vip": "付费用户",
                "user_id": this.ckUserId
            });
            console.log('======== 图片生成请求参数 ========');
            console.log(`请求模式ID: ${intellectId}, 模式名称: ${this.getIntellectIdName(intellectId)}`);
            console.log(`请求ID: ${requestId}`);
            console.log(`标题: ${createImageDto.title}`);
            console.log(`页码: ${pageNo}`);
            console.log('用户输入JSON:');
            console.log(userInputJson);
            console.log('额外字段:');
            console.log(JSON.stringify(createImageDto.additionalFields || {}, null, 2));
            console.log('完整请求体:');
            const requestBody = {
                pageNo: pageNo,
                pageSize: 10,
                intellectId,
                userInputJson,
                requestId,
                reportInfo
            };
            console.log(JSON.stringify(requestBody, null, 2));
            console.log('====================================');
            const taskResponse = await axios_1.default.post('https://gw.chuangkit.com/tools/task/mark/group/replace?_dataType=json&client_type=0', requestBody, {
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Accept-Language': 'zh-CN,zh;q=0.9',
                    'Authorization': `Bearer ${authToken}`,
                    'Connection': 'keep-alive',
                    'Content-Type': 'application/json',
                    'Origin': 'https://www.chuangkit.com',
                    'Referer': 'https://www.chuangkit.com/',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36'
                }
            });
            console.log('======== 图片生成响应 ========');
            console.log(`响应状态码: ${taskResponse.status}`);
            console.log(`响应数据: ${JSON.stringify(taskResponse.data, null, 2)}`);
            console.log('================================');
            if (((_b = (_a = taskResponse.data) === null || _a === void 0 ? void 0 : _a.body) === null || _b === void 0 ? void 0 : _b.code) !== 200) {
                imageTask.status = 'failed';
                imageTask.errorMessage = '获取任务ID失败';
                await this.imageTaskRepository.save(imageTask);
                return {
                    code: 400,
                    data: null,
                    message: '获取任务ID失败'
                };
            }
            const taskDtoList = taskResponse.data.body.data.taskDtoList;
            if (!taskDtoList || taskDtoList.length === 0) {
                imageTask.status = 'failed';
                imageTask.errorMessage = '没有获取到任务ID';
                await this.imageTaskRepository.save(imageTask);
                return {
                    code: 400,
                    data: null,
                    message: '没有获取到任务ID'
                };
            }
            const taskIds = taskDtoList.map(task => task.taskId);
            let existingTaskIds = [];
            if (pageNo > 1 && imageTask.taskIds) {
                try {
                    existingTaskIds = JSON.parse(imageTask.taskIds);
                    if (!Array.isArray(existingTaskIds)) {
                        existingTaskIds = [existingTaskIds];
                    }
                }
                catch (e) {
                    console.error('解析现有任务ID失败，使用空数组:', e);
                }
            }
            const allTaskIds = [...existingTaskIds, ...taskIds];
            const taskIdsStr = JSON.stringify(allTaskIds);
            imageTask.taskIds = taskIdsStr;
            imageTask.status = 'processing';
            await this.imageTaskRepository.save(imageTask);
            const { imageUrls, success, errorMsg } = await this.getTaskImages(taskIds, 5, 1500);
            if (!success || imageUrls.length === 0) {
                imageTask.status = 'failed';
                imageTask.errorMessage = errorMsg || '获取图片失败';
                await this.imageTaskRepository.save(imageTask);
                return {
                    code: 400,
                    data: null,
                    message: errorMsg || '获取图片失败'
                };
            }
            const firstImageUrl = imageUrls[0];
            let allImageUrls = [];
            if (pageNo > 1 && imageTask.allImageUrls) {
                try {
                    const existingUrls = JSON.parse(imageTask.allImageUrls);
                    if (Array.isArray(existingUrls)) {
                        allImageUrls = [...existingUrls];
                    }
                }
                catch (e) {
                    console.error('解析现有图片URL失败，使用空数组:', e);
                }
            }
            allImageUrls = [...allImageUrls, ...imageUrls];
            imageTask.imageUrl = pageNo === 1 ? firstImageUrl : (imageTask.imageUrl || firstImageUrl);
            imageTask.status = 'completed';
            imageTask.allImageUrls = JSON.stringify(allImageUrls);
            await this.imageTaskRepository.save(imageTask);
            return {
                code: 200,
                data: {
                    taskId: imageTask.id,
                    keyword: createImageDto.title,
                    type: "theme",
                    currentPage: pageNo,
                    images: imageUrls.map((url, index) => ({
                        url,
                        taskId: taskIds[index] || taskIds[0],
                        imageId: `img_${imageTask.id}_${allImageUrls.length - imageUrls.length + index}`
                    }))
                },
                message: "创建AI封面成功"
            };
        }
        catch (error) {
            console.error('======== 图片生成失败 ========');
            console.error(`错误消息: ${error.message}`);
            if (error.response) {
                console.error(`响应状态码: ${error.response.status}`);
                console.error(`响应数据: ${JSON.stringify(error.response.data, null, 2)}`);
            }
            console.error('================================');
            try {
                const imageTask = await this.imageTaskRepository.findOne({
                    where: { userId, prompt: createImageDto.title },
                    order: { createTime: 'DESC' }
                });
                if (imageTask) {
                    imageTask.status = 'failed';
                    imageTask.errorMessage = error.message || '生成图片失败';
                    await this.imageTaskRepository.save(imageTask);
                }
            }
            catch (dbError) {
                console.error('更新任务状态失败:', dbError);
            }
            return {
                code: 500,
                data: null,
                message: error.message || '生成图片失败'
            };
        }
    }
    getIntellectIdName(intellectId) {
        switch (intellectId) {
            case 267:
                return "大字报模式";
            case 280:
                return "表情封面模式";
            case 231:
                return "文案配图模式";
            case 374:
                return "备忘录内页模式";
            case 148:
                return "二宫格拼图模式";
            case 147:
                return "三宫格拼图模式";
            case 130:
                return "四宫格拼图模式";
            default:
                return `未知模式(${intellectId})`;
        }
    }
    async getUserImageTasks(userId, page = 1, limit = 10) {
        try {
            const [tasks, total] = await this.imageTaskRepository.findAndCount({
                where: { userId },
                order: { createTime: 'DESC' },
                skip: (page - 1) * limit,
                take: limit,
            });
            const processedTasks = tasks.map(task => {
                let allUrls = [];
                if (task.allImageUrls) {
                    try {
                        allUrls = JSON.parse(task.allImageUrls);
                    }
                    catch (e) {
                        console.error('解析图片URL列表失败:', e);
                    }
                }
                let taskIdList = [];
                if (task.taskIds) {
                    try {
                        taskIdList = JSON.parse(task.taskIds);
                    }
                    catch (e) {
                        console.error('解析任务ID列表失败:', e);
                        try {
                            taskIdList = task.taskIds.split(',');
                        }
                        catch (e2) {
                            console.error('分割任务ID字符串失败:', e2);
                            taskIdList = [task.taskIds];
                        }
                    }
                }
                return Object.assign(Object.assign({}, task), { imageUrls: allUrls, taskIdList });
            });
            return {
                code: 200,
                data: {
                    tasks: processedTasks,
                    total,
                    page,
                    limit,
                },
                message: '获取任务列表成功'
            };
        }
        catch (error) {
            return {
                code: 500,
                data: null,
                message: error.message || '获取图片任务列表失败'
            };
        }
    }
    async cleanupOldRecords(days = 1) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);
            const result = await this.imageTaskRepository
                .createQueryBuilder()
                .delete()
                .from(image_generator_entity_1.ImageGeneratorTask)
                .where('createTime < :cutoffDate', { cutoffDate })
                .execute();
            const deletedCount = result.affected || 0;
            if (deletedCount > 0) {
                console.log(`已清理${deletedCount}条${days}天前的历史记录`);
            }
            return deletedCount;
        }
        catch (error) {
            console.error('清理历史记录失败:', error);
            return 0;
        }
    }
    async getUserHistoryTasks(userId, page = 1, limit = 20) {
        try {
            await this.cleanupOldRecords(1);
            const [tasks, total] = await this.imageTaskRepository.findAndCount({
                where: {
                    userId,
                    status: 'completed'
                },
                order: { createTime: 'DESC' },
                skip: (page - 1) * limit,
                take: limit,
            });
            const historyTasks = tasks.map(task => {
                let imageUrls = [];
                let taskIdList = [];
                if (task.allImageUrls) {
                    try {
                        const parsedUrls = JSON.parse(task.allImageUrls);
                        imageUrls = this.filterValidImageUrls(parsedUrls);
                    }
                    catch (e) {
                        console.error('解析图片URL列表失败:', e);
                    }
                }
                if (task.taskIds) {
                    try {
                        taskIdList = JSON.parse(task.taskIds);
                    }
                    catch (e) {
                        try {
                            taskIdList = task.taskIds.split(',');
                        }
                        catch (e2) {
                            taskIdList = [task.taskIds];
                        }
                    }
                }
                const images = [];
                for (let i = 0; i < imageUrls.length; i++) {
                    const url = imageUrls[i];
                    const taskId = i < taskIdList.length ? taskIdList[i] : (taskIdList.length > 0 ? taskIdList[taskIdList.length - 1] : '');
                    images.push({
                        url,
                        taskId,
                        imageId: `img_${task.id}_${i}`
                    });
                }
                const mainImageUrl = task.imageUrl && !task.imageUrl.includes('null')
                    ? task.imageUrl
                    : (imageUrls.length > 0 ? imageUrls[0] : '');
                return {
                    id: task.id,
                    prompt: task.prompt,
                    createTime: task.createTime,
                    mainImageUrl: mainImageUrl,
                    imageCount: images.length,
                    images: images
                };
            });
            return {
                code: 200,
                data: {
                    history: historyTasks,
                    total,
                    page,
                    limit,
                },
                message: '获取历史生成记录成功'
            };
        }
        catch (error) {
            return {
                code: 500,
                data: null,
                message: error.message || '获取历史生成记录失败'
            };
        }
    }
    async getTaskDetail(taskId, userId) {
        try {
            const task = await this.imageTaskRepository.findOne({
                where: { id: taskId, userId }
            });
            if (!task) {
                return {
                    code: 404,
                    data: null,
                    message: '任务不存在'
                };
            }
            let imageUrls = [];
            if (task.allImageUrls) {
                try {
                    const parsedUrls = JSON.parse(task.allImageUrls);
                    imageUrls = this.filterValidImageUrls(parsedUrls);
                    console.log(`解析到${imageUrls.length}张有效图片URL`);
                }
                catch (e) {
                    console.error('解析图片URL列表失败:', e);
                }
            }
            let taskIdList = [];
            if (task.taskIds) {
                try {
                    taskIdList = JSON.parse(task.taskIds);
                }
                catch (e) {
                    try {
                        taskIdList = task.taskIds.split(',');
                    }
                    catch (e2) {
                        taskIdList = [task.taskIds];
                    }
                }
            }
            if (taskIdList.length > 0 && imageUrls.length === 0 && task.status === 'completed') {
                console.log('没有有效的图片URL，尝试重新获取...');
                const { imageUrls: newUrls, success } = await this.getTaskImages(taskIdList, 3, 1000);
                if (success && newUrls.length > 0) {
                    console.log(`成功获取到${newUrls.length}张有效图片`);
                    imageUrls = newUrls;
                    task.allImageUrls = JSON.stringify(newUrls);
                    task.imageUrl = newUrls[0];
                    await this.imageTaskRepository.save(task);
                }
            }
            const images = [];
            for (let i = 0; i < imageUrls.length; i++) {
                const url = imageUrls[i];
                const taskId = i < taskIdList.length ? taskIdList[i] : (taskIdList.length > 0 ? taskIdList[taskIdList.length - 1] : '');
                images.push({
                    url,
                    taskId,
                    imageId: `img_${task.id}_${i}`
                });
            }
            const responseData = Object.assign(Object.assign({}, task), { images, imageCount: images.length });
            return {
                code: 200,
                data: responseData,
                message: '获取任务详情成功'
            };
        }
        catch (error) {
            return {
                code: 500,
                data: null,
                message: error.message || '获取任务详情失败'
            };
        }
    }
    async downloadImage(taskId) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x;
        try {
            console.log(`开始处理图片下载请求，任务ID: ${taskId}`);
            const existingDownload = await this.imageDownloadUrlRepository.findOne({
                where: { taskId }
            });
            if (existingDownload && existingDownload.downloadUrl) {
                console.log('数据库中已有下载链接，直接返回:', existingDownload.downloadUrl);
                return {
                    code: 200,
                    data: {
                        fileName: existingDownload.fileName || `image_${taskId}.jpg`,
                        downloadUrl: existingDownload.downloadUrl
                    },
                    message: '从数据库获取下载链接成功'
                };
            }
            const authToken = await this.getAuthToken();
            console.log(`使用授权令牌: ${authToken.substring(0, 10)}...${authToken.substring(authToken.length - 10)}`);
            console.log(`步骤1: 请求设计ID，任务ID: ${taskId}`);
            const designIdResponse = await axios_1.default.post('https://gw.chuangkit.com/imagehub/design/intellect/save?_dataType=json&client_type=0', {
                taskId: taskId,
                intellectType: 0,
                reportInfo: JSON.stringify({
                    request_platform: 0,
                    task_id: taskId,
                    versions_type: "^经^典^版",
                    business_lines: "^企^业^线",
                    business_id: 22928258,
                    user_vip: "^付^费^用^户",
                    user_id: this.ckUserId
                })
            }, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('设计ID响应状态码:', designIdResponse.status);
            console.log('设计ID响应:', designIdResponse.data);
            if (((_b = (_a = designIdResponse.data) === null || _a === void 0 ? void 0 : _a.body) === null || _b === void 0 ? void 0 : _b.code) !== 200 || !((_d = (_c = designIdResponse.data) === null || _c === void 0 ? void 0 : _c.body) === null || _d === void 0 ? void 0 : _d.data)) {
                console.error('获取设计ID失败:', designIdResponse.data);
                return {
                    code: 400,
                    data: null,
                    message: `获取设计ID失败: ${((_f = (_e = designIdResponse.data) === null || _e === void 0 ? void 0 : _e.body) === null || _f === void 0 ? void 0 : _f.msg) || '未知错误'}`
                };
            }
            const designId = designIdResponse.data.body.data;
            console.log(`获取到设计ID: ${designId}`);
            console.log(`步骤2: 创建下载任务，设计ID: ${designId}`);
            const downloadTaskParams = new URLSearchParams({
                'render_type': '102',
                'use_type': '1',
                'watermark': '0',
                'watermark_type': '0',
                'design_id': designId,
                'package_type': '5',
                'range': ''
            });
            console.log('下载任务请求参数:', downloadTaskParams.toString());
            const downloadTaskResponse = await axios_1.default.post('https://gw.chuangkit.com/team/task/addAsyncDownloadTask.do?_dataType=json&client_type=0', downloadTaskParams, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
            console.log('下载任务响应状态码:', downloadTaskResponse.status);
            console.log('下载任务响应:', downloadTaskResponse.data);
            if (((_h = (_g = downloadTaskResponse.data) === null || _g === void 0 ? void 0 : _g.body) === null || _h === void 0 ? void 0 : _h.code) !== 200 || !((_l = (_k = (_j = downloadTaskResponse.data) === null || _j === void 0 ? void 0 : _j.body) === null || _k === void 0 ? void 0 : _k.data) === null || _l === void 0 ? void 0 : _l.requestId)) {
                console.error('创建下载任务失败:', downloadTaskResponse.data);
                return {
                    code: 400,
                    data: null,
                    message: `创建下载任务失败: ${((_o = (_m = downloadTaskResponse.data) === null || _m === void 0 ? void 0 : _m.body) === null || _o === void 0 ? void 0 : _o.msg) || '未知错误'}`
                };
            }
            const requestId = downloadTaskResponse.data.body.data.requestId;
            console.log(`获取到下载任务ID: ${requestId}`);
            let downloadUrl = null;
            let attempts = 0;
            const maxAttempts = 10;
            const retryDelay = 2000;
            console.log(`步骤3: 获取下载链接，最多尝试${maxAttempts}次，每次间隔${retryDelay}毫秒`);
            while (attempts < maxAttempts && !downloadUrl) {
                attempts++;
                console.log(`尝试获取下载链接 (${attempts}/${maxAttempts})...`);
                try {
                    const params = new URLSearchParams({
                        'request_id': requestId,
                        'design_id': designId
                    });
                    console.log('下载链接请求参数:', params.toString());
                    const downloadLinkResponse = await axios_1.default.post('https://gw.chuangkit.com/team/task/getAsyncDownloadTaskState.do?_dataType=json&client_type=0', params, {
                        headers: {
                            'Authorization': `Bearer ${authToken}`,
                            'Content-Type': 'application/x-www-form-urlencoded'
                        }
                    });
                    console.log('下载链接响应状态码:', downloadLinkResponse.status);
                    console.log('下载链接响应:', JSON.stringify(downloadLinkResponse.data, null, 2));
                    const responseCode = (_q = (_p = downloadLinkResponse.data) === null || _p === void 0 ? void 0 : _p.body) === null || _q === void 0 ? void 0 : _q.code;
                    console.log(`响应状态码: ${responseCode}, 消息: ${((_s = (_r = downloadLinkResponse.data) === null || _r === void 0 ? void 0 : _r.body) === null || _s === void 0 ? void 0 : _s.msg) || '无消息'}`);
                    if (responseCode === 20 &&
                        ((_v = (_u = (_t = downloadLinkResponse.data) === null || _t === void 0 ? void 0 : _t.body) === null || _u === void 0 ? void 0 : _u.data) === null || _v === void 0 ? void 0 : _v.downloadUrls) &&
                        downloadLinkResponse.data.body.data.downloadUrls.length > 0) {
                        downloadUrl = downloadLinkResponse.data.body.data.downloadUrls[0];
                        console.log('获取到原始下载链接:', downloadUrl);
                        if (downloadUrl && downloadUrl.startsWith('//')) {
                            downloadUrl = `https:${downloadUrl}`;
                            console.log('转换为完整URL:', downloadUrl);
                        }
                        break;
                    }
                    else if (responseCode === 10 || responseCode === 30) {
                        console.log(`任务处理中 (状态码: ${responseCode})，等待${retryDelay}ms后重试...`);
                        await this.delay(retryDelay);
                        continue;
                    }
                    else {
                        console.error(`未预期的状态码: ${responseCode}，响应:`, downloadLinkResponse.data);
                        if (attempts >= maxAttempts) {
                            return {
                                code: 400,
                                data: null,
                                message: `获取下载链接失败: ${((_x = (_w = downloadLinkResponse.data) === null || _w === void 0 ? void 0 : _w.body) === null || _x === void 0 ? void 0 : _x.msg) || '未知错误'}`
                            };
                        }
                        await this.delay(retryDelay);
                        continue;
                    }
                }
                catch (error) {
                    console.error('获取下载链接出错:', error);
                    console.error('错误详情:', error.message);
                    if (error.response) {
                        console.error('响应状态:', error.response.status);
                        console.error('响应头:', JSON.stringify(error.response.headers));
                        console.error('响应数据:', JSON.stringify(error.response.data));
                    }
                    if (attempts >= maxAttempts) {
                        return {
                            code: 500,
                            data: null,
                            message: `获取下载链接失败: ${error.message || '未知错误'}`
                        };
                    }
                    await this.delay(retryDelay);
                }
            }
            if (!downloadUrl) {
                console.error(`达到最大尝试次数(${maxAttempts})，仍未获取到下载链接`);
                return {
                    code: 400,
                    data: null,
                    message: '获取下载链接失败，请稍后重试'
                };
            }
            console.log(`成功获取到下载链接: ${downloadUrl}`);
            try {
                const task = await this.imageTaskRepository.findOne({
                    where: { taskIds: (0, typeorm_2.Like)(`%${taskId}%`) }
                });
                const fileName = `image_${taskId}.jpg`;
                const downloadRecord = this.imageDownloadUrlRepository.create({
                    taskId,
                    downloadUrl,
                    fileName
                });
                await this.imageDownloadUrlRepository.save(downloadRecord);
                console.log('已将下载链接保存到数据库');
            }
            catch (saveError) {
                console.error('保存下载链接到数据库失败:', saveError);
            }
            return {
                code: 200,
                data: {
                    fileName: `image_${taskId}.jpg`,
                    downloadUrl: downloadUrl
                },
                message: '获取图片下载链接成功'
            };
        }
        catch (error) {
            console.error('下载图片失败:', error);
            if (error.response) {
                console.error('响应状态:', error.response.status);
                console.error('响应头:', JSON.stringify(error.response.headers));
                console.error('响应数据:', JSON.stringify(error.response.data));
            }
            return {
                code: 500,
                data: null,
                message: error.message || '下载图片失败'
            };
        }
    }
    async uploadImage(file, fileName, contentType) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        try {
            console.log(`准备上传图片: ${fileName}, 类型: ${contentType}, 大小: ${file.length} 字节`);
            const authToken = await this.getAuthToken();
            const randomMd5 = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            let fileMd5 = randomMd5;
            try {
                const crypto = require('crypto');
                fileMd5 = crypto.createHash('md5').update(file).digest('hex');
                console.log(`计算的文件MD5: ${fileMd5}`);
            }
            catch (error) {
                console.warn('计算文件MD5失败，使用随机MD5:', error.message);
            }
            const FormData = require('form-data');
            const form = new FormData();
            form.append('file', file, {
                filename: 'blob',
                contentType: contentType
            });
            form.append('md5', fileMd5);
            form.append('fileName', fileName);
            form.append('contentType', contentType);
            form.append('sourceType', '1');
            form.append('autoConfirm', '1');
            form.append('hide', 'true');
            console.log('向创客贴发送预上传请求...');
            const preUploadResponse = await axios_1.default.post('https://gw.chuangkit.com/dam/store/resource/preUpload.do?_dataType=json&client_type=0', form, {
                headers: Object.assign(Object.assign({}, form.getHeaders()), { 'Accept': '*/*', 'Accept-Language': 'zh-CN,zh;q=0.9', 'Authorization': `Bearer ${authToken}`, 'Connection': 'keep-alive', 'Origin': 'https://www.chuangkit.com', 'Referer': 'https://www.chuangkit.com/', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36' })
            });
            console.log('预上传响应:', JSON.stringify(preUploadResponse.data, null, 2));
            if (((_b = (_a = preUploadResponse.data) === null || _a === void 0 ? void 0 : _a.body) === null || _b === void 0 ? void 0 : _b.code) === 200) {
                console.log('需要执行后续上传步骤...');
                const responseData = (_d = (_c = preUploadResponse.data) === null || _c === void 0 ? void 0 : _c.body) === null || _d === void 0 ? void 0 : _d.data;
                if (!responseData) {
                    console.error('预上传响应数据无效:', preUploadResponse.data);
                    return {
                        code: 400,
                        data: null,
                        message: '预上传响应数据无效'
                    };
                }
                let ossParams = null;
                let ossUrl = null;
                let fileKey = null;
                if (responseData.data) {
                    ossParams = responseData.data.paramMap || {};
                    ossUrl = responseData.data.url;
                    fileKey = responseData.data.fileKey || ossParams.key;
                }
                else {
                    ossParams = responseData.paramMap || {};
                    ossUrl = responseData.url;
                    fileKey = responseData.fileKey || ossParams.key;
                }
                if (!ossUrl || !fileKey) {
                    console.error('无法获取上传必要参数:', responseData);
                    console.log('预上传响应的完整结构:', JSON.stringify(preUploadResponse.data, null, 2));
                    return {
                        code: 400,
                        data: null,
                        message: '无法获取上传必要参数'
                    };
                }
                console.log(`获取到上传参数: URL=${ossUrl}, fileKey=${fileKey}`);
                console.log('开始上传文件到OSS...');
                const ossForm = new FormData();
                if (ossParams) {
                    for (const [key, value] of Object.entries(ossParams)) {
                        if (key && value) {
                            ossForm.append(key, value);
                        }
                    }
                }
                ossForm.append('file', file, {
                    filename: fileName,
                    contentType: contentType
                });
                if (fileMd5) {
                    ossForm.append('Content-MD5', fileMd5);
                }
                try {
                    const ossUploadResponse = await axios_1.default.post(ossUrl, ossForm, {
                        headers: Object.assign(Object.assign({}, ossForm.getHeaders()), { 'Accept': '*/*', 'Accept-Language': 'zh-CN,zh;q=0.9', 'Connection': 'keep-alive', 'Origin': 'https://www.chuangkit.com', 'Referer': 'https://www.chuangkit.com/' }),
                        maxContentLength: Infinity,
                        maxBodyLength: Infinity
                    });
                    console.log('OSS上传响应状态:', ossUploadResponse.status);
                    console.log('OSS上传响应头:', JSON.stringify(ossUploadResponse.headers, null, 2));
                    return this.finalizeUpload(fileKey, fileMd5, fileName, contentType, authToken, file);
                }
                catch (ossError) {
                    console.error('OSS上传失败:', ossError);
                    console.log('尝试继续执行reportUpload步骤...');
                    return this.finalizeUpload(fileKey, fileMd5, fileName, contentType, authToken, file);
                }
            }
            else if (((_f = (_e = preUploadResponse.data) === null || _e === void 0 ? void 0 : _e.body) === null || _f === void 0 ? void 0 : _f.code) === 10003) {
                const imageId = preUploadResponse.data.body.data;
                console.log(`图片已存在，图片ID: ${imageId}`);
                return this.uploadToImageBed(imageId, file, contentType);
            }
            else {
                console.error('图片上传失败:', preUploadResponse.data);
                return {
                    code: ((_h = (_g = preUploadResponse.data) === null || _g === void 0 ? void 0 : _g.body) === null || _h === void 0 ? void 0 : _h.code) || 500,
                    data: null,
                    message: ((_k = (_j = preUploadResponse.data) === null || _j === void 0 ? void 0 : _j.body) === null || _k === void 0 ? void 0 : _k.msg) || '图片上传失败'
                };
            }
        }
        catch (error) {
            console.error('图片上传出错:', error);
            return {
                code: 500,
                data: null,
                message: error.message || '图片上传失败'
            };
        }
    }
    async finalizeUpload(fileKey, md5, fileName, contentType, authToken, originalFile) {
        var _a, _b, _c, _d, _e, _f;
        let width = 800;
        let height = 800;
        let type = contentType.split('/')[1] || 'jpeg';
        let format = type.toUpperCase();
        console.log('使用默认图片尺寸:', width, 'x', height);
        const reportParams = new URLSearchParams({
            'md5': md5,
            'fileKey': fileKey,
            'fileName': fileName,
            'contentType': contentType,
            'width': width.toString(),
            'height': height.toString(),
            'type': type,
            'format': format,
            'autoConfirm': '1',
            'hide': 'true'
        });
        console.log('向创客贴发送reportUpload请求...');
        console.log('reportUpload参数:', reportParams.toString());
        try {
            const reportUploadResponse = await axios_1.default.post('https://gw.chuangkit.com/dam/store/resource/reportUpload.do?_dataType=json&client_type=0', reportParams, {
                headers: {
                    'Accept': '*/*',
                    'Accept-Language': 'zh-CN,zh;q=0.9',
                    'Authorization': `Bearer ${authToken}`,
                    'Connection': 'keep-alive',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Origin': 'https://www.chuangkit.com',
                    'Referer': 'https://www.chuangkit.com/',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36'
                }
            });
            console.log('reportUpload响应:', JSON.stringify(reportUploadResponse.data, null, 2));
            if (((_b = (_a = reportUploadResponse.data) === null || _a === void 0 ? void 0 : _a.body) === null || _b === void 0 ? void 0 : _b.code) === 200) {
                const imageId = reportUploadResponse.data.body.data;
                console.log(`图片上传成功，图片ID: ${imageId}`);
                const imageUrl = `https://pri-cdn-oss.chuangkit.com/svg_build/render_result/${imageId}?x-oss-process=image/resize,w_1000`;
                return this.uploadToImageBed(imageId, originalFile, contentType);
            }
            else {
                console.error('reportUpload失败:', reportUploadResponse.data);
                return {
                    code: ((_d = (_c = reportUploadResponse.data) === null || _c === void 0 ? void 0 : _c.body) === null || _d === void 0 ? void 0 : _d.code) || 500,
                    data: null,
                    message: ((_f = (_e = reportUploadResponse.data) === null || _e === void 0 ? void 0 : _e.body) === null || _f === void 0 ? void 0 : _f.msg) || 'reportUpload失败'
                };
            }
        }
        catch (error) {
            console.error('finalizeUpload失败:', error);
            return {
                code: 500,
                data: null,
                message: error.message || 'finalizeUpload失败'
            };
        }
    }
    async uploadToImageBed(imageId, originalFile, contentType) {
        try {
            console.log('开始上传图片到图床...');
            const uploadResult = await this.imageUploadService.uploadFile({
                buffer: originalFile,
                mimetype: contentType
            });
            if (uploadResult) {
                console.log('图床上传成功，URL:', uploadResult);
                return {
                    code: 200,
                    data: {
                        imageId: imageId,
                        url: uploadResult,
                    },
                    message: '图片上传成功'
                };
            }
            else {
                console.error('上传到图床失败，返回创客贴URL');
                const ckitUrl = `https://pri-cdn-oss.chuangkit.com/svg_build/render_result/${imageId}?x-oss-process=image/resize,w_1000`;
                return {
                    code: 200,
                    data: {
                        imageId: imageId,
                        url: ckitUrl,
                    },
                    message: '图片上传成功，但上传到图床失败'
                };
            }
        }
        catch (superError) {
            console.error('上传到图床失败:', superError);
            const ckitUrl = `https://pri-cdn-oss.chuangkit.com/svg_build/render_result/${imageId}?x-oss-process=image/resize,w_1000`;
            return {
                code: 200,
                data: {
                    imageId: imageId,
                    url: ckitUrl,
                },
                message: '图片上传成功，但上传到图床失败'
            };
        }
    }
};
ImageGeneratorService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(image_generator_entity_1.ImageGeneratorTask)),
    __param(1, (0, typeorm_1.InjectRepository)(image_download_url_entity_1.ImageDownloadUrl)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        redisCache_service_1.RedisCacheService,
        image_upload_service_1.ImageUploadService])
], ImageGeneratorService);
exports.ImageGeneratorService = ImageGeneratorService;
