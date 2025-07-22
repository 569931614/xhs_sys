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
var XhsProductFactoryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.XhsProductFactoryService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const xhs_activity_entity_1 = require("./xhs-activity.entity");
const xhs_product_factory_entity_1 = require("./xhs-product-factory.entity");
const config_1 = require("@nestjs/config");
const coze_service_1 = require("../coze/coze.service");
const schedule_1 = require("@nestjs/schedule");
const userBalance_service_1 = require("../userBalance/userBalance.service");
const pointConsumptionRule_service_1 = require("../pointConsumptionRule/pointConsumptionRule.service");
const material_service_1 = require("../material/material.service");
const note_entity_1 = require("../xiaohongshu/note.entity");
const notetemplate_entity_1 = require("../xiaohongshu/notetemplate.entity");
const note_template_relation_entity_1 = require("../xiaohongshu/note-template-relation.entity");
const htmllib_entity_1 = require("../htmllib/htmllib.entity");
const html_render_service_1 = require("../htmllib/html-render.service");
let XhsProductFactoryService = XhsProductFactoryService_1 = class XhsProductFactoryService {
    constructor(xhsActivityRepository, xhsProductFactoryRepository, noteRepository, noteTemplateRepository, noteTemplateRelationRepository, htmlTemplateRepository, configService, cozeService, userBalanceService, pointConsumptionRuleService, materialService, htmlRenderService) {
        this.xhsActivityRepository = xhsActivityRepository;
        this.xhsProductFactoryRepository = xhsProductFactoryRepository;
        this.noteRepository = noteRepository;
        this.noteTemplateRepository = noteTemplateRepository;
        this.noteTemplateRelationRepository = noteTemplateRelationRepository;
        this.htmlTemplateRepository = htmlTemplateRepository;
        this.configService = configService;
        this.cozeService = cozeService;
        this.userBalanceService = userBalanceService;
        this.pointConsumptionRuleService = pointConsumptionRuleService;
        this.materialService = materialService;
        this.htmlRenderService = htmlRenderService;
        this.logger = new common_1.Logger(XhsProductFactoryService_1.name);
    }
    async getUserActivities(userId) {
        try {
            const activities = await this.xhsActivityRepository.find({
                where: { status: 'active' },
                select: ['id', 'name', 'type'],
                order: { createTime: 'DESC' },
            });
            return activities.map(activity => ({
                id: activity.id,
                name: activity.name,
                type: activity.type
            }));
        }
        catch (error) {
            this.logger.error(`获取用户活动列表失败: ${error.message}`, error.stack);
            throw new Error('获取活动列表失败');
        }
    }
    async generateProduct(userId, brandProduct, title, activityId, fileIds, req, batchCount = 1, titleList, useMaterialLibrary, materialIds, materialCount, useFolders, folderIds, folderMaterialCount, templateIds, information) {
        try {
            this.logger.log(`[generateProduct] 开始生成产品内容: userId=${userId}, brandProduct=${brandProduct}, 批次=${batchCount}`);
            if (typeof batchCount === 'string') {
                batchCount = parseInt(batchCount);
            }
            const activity = await this.xhsActivityRepository.findOne({
                where: { id: activityId, status: 'active' },
            });
            if (!activity) {
                throw new Error('活动不存在或已结束');
            }
            let finalTitleList = [];
            if (titleList && titleList.length > 0) {
                finalTitleList = [...titleList];
            }
            else {
                finalTitleList = [title];
            }
            while (finalTitleList.length < batchCount) {
                finalTitleList = [...finalTitleList, ...finalTitleList];
            }
            finalTitleList = finalTitleList.slice(0, batchCount);
            finalTitleList = finalTitleList.map(title => {
                let cleanTitle = title;
                cleanTitle = cleanTitle.replace(/[\[\(（【]\s*\d+\s*\/\s*\d+\s*[\]\)）】]/g, '').trim();
                return cleanTitle;
            });
            const functionId = 'xhs_note';
            const userId_num = parseInt(userId);
            let pointValidated = false;
            let pointDeducted = false;
            const batchId = batchCount > 1 ? `batch_${Date.now()}_${userId.substring(0, 5)}` : null;
            let totalConsumeValue = 0;
            const pointValidation = await this.userBalanceService.validateUserPointForFunction(userId_num, functionId, batchCount);
            if (!pointValidation.success) {
                this.logger.error(`[积分验证] 用户积分验证失败: ${pointValidation.message}`);
                return {
                    success: false,
                    message: pointValidation.message || '积分不足，请充值后再试',
                    error: pointValidation.error || '积分不足'
                };
            }
            totalConsumeValue = pointValidation.consumeValue;
            if (batchCount > 1) {
                const baseBalance = pointValidation.availableBalance || 0;
                if (baseBalance < totalConsumeValue) {
                    this.logger.error(`[批量积分验证] 用户积分不足以进行${batchCount}次生成，需要${totalConsumeValue}，当前仅有${baseBalance}`);
                    return {
                        success: false,
                        message: `批量生成需要${totalConsumeValue}积分，当前仅有${baseBalance}积分`,
                        error: '积分不足以进行批量生成'
                    };
                }
            }
            this.logger.log(`[积分验证] 用户ID: ${userId} 积分验证通过，类型: ${pointValidation.deductType}, 消耗值: ${totalConsumeValue}`);
            pointValidated = true;
            const batchMaterialsMap = {};
            try {
                let availableFolderMaterials = [];
                if (folderIds && folderIds.length > 0) {
                    this.logger.log(`[素材处理] 开始处理文件夹素材, 文件夹数量: ${folderIds.length}`);
                    for (const folderId of folderIds) {
                        try {
                            const folderMaterials = await this.getMaterialsWithValidation(folderId, userId);
                            if (folderMaterials && folderMaterials.length > 0) {
                                this.logger.log(`[素材处理] 文件夹 ${folderId} 中获取到 ${folderMaterials.length} 个有效素材`);
                                availableFolderMaterials = [...availableFolderMaterials, ...folderMaterials];
                            }
                        }
                        catch (error) {
                            this.logger.error(`[素材处理] 处理文件夹 ${folderId} 素材失败: ${error.message}`);
                        }
                    }
                    this.logger.log(`[素材处理] 所有文件夹共获取到 ${availableFolderMaterials.length} 个有效素材`);
                }
                let availableMaterials = [];
                if (materialIds && materialIds.length > 0) {
                    this.logger.log(`[素材处理] 开始处理素材库素材, 素材数量: ${materialIds.length}`);
                    for (const materialId of materialIds) {
                        try {
                            const validMaterial = await this.validateMaterial(materialId, userId);
                            if (validMaterial) {
                                availableMaterials.push(validMaterial);
                                this.logger.log(`[素材处理] 素材 ${materialId} 有效，已添加`);
                            }
                        }
                        catch (error) {
                            this.logger.error(`[素材处理] 处理素材 ${materialId} 失败: ${error.message}`);
                        }
                    }
                    this.logger.log(`[素材处理] 素材库共获取到 ${availableMaterials.length} 个有效素材`);
                }
                const allMaterials = [
                    ...availableFolderMaterials,
                    ...availableMaterials,
                    ...(fileIds || [])
                ];
                let uniqueMaterials = [...new Set(allMaterials)];
                if (uniqueMaterials.length === 0) {
                    this.logger.warn(`[素材处理] 警告: 未找到任何有效素材，将使用原始fileIds`);
                }
                else if (uniqueMaterials.length > 0) {
                    const requiredCount = Math.min(4, uniqueMaterials.length);
                    for (let i = 0; i < batchCount; i++) {
                        const selectedMaterials = this.getRandomMaterials(uniqueMaterials, requiredCount);
                        batchMaterialsMap[i] = selectedMaterials;
                        this.logger.log(`[素材处理] 批次 ${i + 1} 随机选择了 ${selectedMaterials.length} 个素材`);
                    }
                }
            }
            catch (error) {
                this.logger.error(`[素材处理] 处理素材时出错: ${error.message}`);
                this.logger.warn(`[素材处理] 由于出错，将使用原始fileIds继续`);
            }
            if (pointValidated && !pointDeducted) {
                try {
                    const deductResult = await this.userBalanceService.deductFromBalance(userId_num, pointValidation.deductType, totalConsumeValue, 0, functionId);
                    pointDeducted = true;
                    this.logger.log(`[积分扣除] 用户ID: ${userId} 积分扣除成功，共消耗: ${totalConsumeValue}`);
                }
                catch (error) {
                    this.logger.error(`[积分扣除] 扣除积分失败: ${error.message}, 无法创建任务`);
                    return {
                        success: false,
                        message: '积分扣除失败，请稍后再试',
                        error: error.message
                    };
                }
            }
            const maxConcurrentTasks = pointValidation.maxConcurrentTasks || 1;
            this.logger.log(`[generateProduct] 最大可同时执行的任务数: ${maxConcurrentTasks}`);
            const taskIds = [];
            for (let i = 0; i < batchCount; i++) {
                try {
                    const currentTitle = finalTitleList[i];
                    const taskFileIds = batchMaterialsMap[i] || fileIds;
                    this.logger.log(`[任务创建] 批次 ${i + 1} 使用 ${taskFileIds.length} 个素材`);
                    const productTask = this.xhsProductFactoryRepository.create({
                        userId,
                        brandProduct,
                        title: currentTitle,
                        activityId,
                        fileIds: taskFileIds,
                        templateIds: templateIds || [],
                        information: information,
                        status: 'pending',
                        batchId: batchId,
                        batchCount: batchCount,
                        batchIndex: i + 1,
                        deductType: pointValidation.deductType,
                        deductAmount: pointValidation.consumeValue / batchCount,
                        apiFailCount: 0
                    });
                    this.logger.log(`[任务创建] 准备保存第 ${i + 1}/${batchCount} 个任务，标题="${currentTitle}", batchId=${productTask.batchId}, batchCount=${productTask.batchCount}`);
                    await this.xhsProductFactoryRepository.save(productTask);
                    taskIds.push(productTask.id);
                    this.logger.log(`[任务创建] 成功保存第 ${i + 1}/${batchCount} 个任务，ID=${productTask.id}, 标题="${currentTitle}", batchId=${productTask.batchId}`);
                    if (i < maxConcurrentTasks) {
                        await this.startProductTaskWorkflow(productTask);
                        this.logger.log(`[任务启动] 启动第 ${i + 1}/${maxConcurrentTasks} 个并发任务, ID=${productTask.id}`);
                    }
                }
                catch (error) {
                    this.logger.error(`创建第 ${i + 1}/${batchCount} 个任务失败: ${error.message}`, error.stack);
                }
            }
            if (taskIds.length === 0) {
                this.logger.error(`所有 ${batchCount} 个任务创建失败`);
                return {
                    success: false,
                    message: '创建任务失败，请稍后再试',
                    error: '批量任务创建失败'
                };
            }
            this.logger.log(`[任务创建] 任务创建完成，共创建 ${taskIds.length}/${batchCount} 个任务，批次ID=${batchId}`);
            return {
                success: true,
                message: batchCount > 1
                    ? `已成功创建 ${taskIds.length}/${batchCount} 个任务，正在生成中`
                    : '任务已提交，正在生成中',
                data: {
                    taskId: taskIds[0],
                    totalTasks: taskIds.length,
                    batchId: batchId,
                    allTaskIds: taskIds
                }
            };
        }
        catch (error) {
            this.logger.error(`生成产品内容失败: ${error.message}`, error.stack);
            return {
                success: false,
                message: error.message || '生成产品内容失败',
                error: error.message
            };
        }
    }
    async getMaterialsWithValidation(folderId, userId) {
        try {
            this.logger.log(`[getMaterialsWithValidation] 获取文件夹 ${folderId} 中的素材, 用户ID: ${userId || '未提供'}`);
            const materials = await this.materialService.getMaterialsByFolder(folderId, userId);
            if (!materials || !Array.isArray(materials) || materials.length === 0) {
                this.logger.warn(`[getMaterialsWithValidation] 文件夹 ${folderId} 中没有找到素材`);
                return [];
            }
            this.logger.log(`[getMaterialsWithValidation] 文件夹 ${folderId} 中找到 ${materials.length} 个素材`);
            const validMaterials = [];
            for (const material of materials) {
                try {
                    if (!material.cozeFileId) {
                        this.logger.warn(`[getMaterialsWithValidation] 素材 ${material.id} 没有cozeFileId，尝试更新`);
                        const updatedMaterial = await this.materialService.updateMaterialCozeId(material.id);
                        if (updatedMaterial && updatedMaterial.cozeFileId) {
                            validMaterials.push(updatedMaterial.cozeFileId);
                        }
                        continue;
                    }
                    const now = new Date();
                    const expireTime = material.expiryTime ? new Date(material.expiryTime) : null;
                    if (!expireTime || now > expireTime) {
                        this.logger.warn(`[getMaterialsWithValidation] 素材 ${material.id} 已过期或没有过期时间，尝试更新`);
                        const updatedMaterial = await this.materialService.updateMaterialCozeId(material.id);
                        if (updatedMaterial && updatedMaterial.cozeFileId) {
                            validMaterials.push(updatedMaterial.cozeFileId);
                        }
                    }
                    else {
                        validMaterials.push(material.cozeFileId);
                    }
                }
                catch (error) {
                    this.logger.error(`[getMaterialsWithValidation] 处理素材 ${material.id} 失败: ${error.message}`);
                }
            }
            this.logger.log(`[getMaterialsWithValidation] 文件夹 ${folderId} 中找到 ${validMaterials.length} 个有效素材`);
            return validMaterials;
        }
        catch (error) {
            this.logger.error(`[getMaterialsWithValidation] 获取文件夹素材失败: ${error.message}`);
            throw error;
        }
    }
    async validateMaterial(materialId, userId) {
        try {
            this.logger.log(`[validateMaterial] 验证素材 ${materialId}, 用户ID: ${userId || '未提供'}`);
            const material = await this.materialService.getMaterialById(materialId);
            if (!material) {
                this.logger.warn(`[validateMaterial] 素材 ${materialId} 不存在`);
                return null;
            }
            if (!material.cozeFileId) {
                this.logger.warn(`[validateMaterial] 素材 ${materialId} 没有cozeFileId`);
                const updatedMaterial = await this.materialService.updateMaterialCozeId(materialId);
                if (updatedMaterial && updatedMaterial.cozeFileId) {
                    this.logger.log(`[validateMaterial] 素材 ${materialId} 更新成功，新cozeFileId: ${updatedMaterial.cozeFileId}`);
                    return updatedMaterial.cozeFileId;
                }
                return null;
            }
            const now = new Date();
            const expireTime = material.expiryTime ? new Date(material.expiryTime) : null;
            if (!expireTime || now > expireTime) {
                this.logger.warn(`[validateMaterial] 素材 ${materialId} 已过期或没有过期时间，尝试更新`);
                const updatedMaterial = await this.materialService.updateMaterialCozeId(materialId);
                if (updatedMaterial && updatedMaterial.cozeFileId) {
                    this.logger.log(`[validateMaterial] 素材 ${materialId} 更新成功，新cozeFileId: ${updatedMaterial.cozeFileId}`);
                    return updatedMaterial.cozeFileId;
                }
            }
            else {
                this.logger.log(`[validateMaterial] 素材 ${materialId} 未过期，cozeFileId: ${material.cozeFileId}`);
                return material.cozeFileId;
            }
            return null;
        }
        catch (error) {
            this.logger.error(`[validateMaterial] 验证素材失败: ${error.message}`);
            return null;
        }
    }
    getRandomMaterials(materials, count) {
        if (!materials || materials.length === 0) {
            return [];
        }
        if (materials.length <= count) {
            return [...materials];
        }
        const shuffled = [...materials];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled.slice(0, count);
    }
    async startProductTaskWorkflow(productTask) {
        try {
            const brandNameParts = productTask.brandProduct.split(' ');
            const brandName = brandNameParts.length > 0 ? brandNameParts[0] : productTask.brandProduct;
            let selectedTemplateId = null;
            let paramsType = 'normal';
            let workflowId = "7494168094760665115";
            if (productTask.templateIds && productTask.templateIds.length > 0) {
                const randomIndex = Math.floor(Math.random() * productTask.templateIds.length);
                selectedTemplateId = productTask.templateIds[randomIndex];
                this.logger.log(`从${productTask.templateIds.length}个模板中随机选择了模板ID: ${selectedTemplateId}`);
                try {
                    try {
                        const noteTemplate = await this.noteRepository.findOne({
                            where: { id: selectedTemplateId }
                        });
                        if (!noteTemplate) {
                            this.logger.warn(`未找到ID为${selectedTemplateId}的笔记模板，使用默认参数`);
                        }
                        else {
                            paramsType = noteTemplate.paramsType || 'normal';
                            this.logger.log(`根据模板ID确定的paramsType: ${paramsType}`);
                            if (noteTemplate.botId) {
                                workflowId = noteTemplate.botId;
                                this.logger.log(`从笔记模板中获取到botId作为workflowId: ${workflowId}`);
                                try {
                                    const cozeEntity = await this.cozeService.findByWorkflowId(workflowId);
                                    if (cozeEntity) {
                                        this.logger.log(`验证workflowId成功: ${workflowId}`);
                                    }
                                }
                                catch (verifyError) {
                                    this.logger.warn(`验证workflowId失败，但仍将继续使用: ${verifyError.message}`);
                                }
                            }
                            else {
                                this.logger.warn(`未找到模板的botId，使用默认workflowId: ${workflowId}`);
                            }
                        }
                    }
                    catch (workflowError) {
                        this.logger.error(`获取workflowId失败: ${workflowError.message}，使用默认workflowId: ${workflowId}`);
                    }
                }
                catch (error) {
                    this.logger.error(`获取模板详情失败: ${error.message}，使用默认paramsType: ${paramsType}`);
                }
            }
            else {
                this.logger.log(`任务没有指定模板ID，使用默认paramsType: ${paramsType}和默认workflowId: ${workflowId}`);
            }
            const workflowParams = {
                workflow_id: "7494168094760665115",
                title: productTask.title,
                brand_name: brandName,
                identifier: productTask.activityId,
                file_pic_urls: productTask.fileIds,
                params_type: paramsType,
                user_id: productTask.userId,
                xhs_user_id: productTask.userId,
                template_id: selectedTemplateId,
                task_id: productTask.id,
                information: productTask.information,
                is_async: true
            };
            const response = await this.cozeService.runWorkflow(workflowParams);
            this.logger.log(`工作流响应: ${JSON.stringify(response)}`);
            if (!response || !response.execute_id) {
                productTask.status = 'failed';
                productTask.error = '工作流启动失败: 无法获取execute_id';
                await this.xhsProductFactoryRepository.save(productTask);
                return false;
            }
            productTask.executeId = response.execute_id;
            productTask.workflowId = workflowId;
            productTask.status = 'running';
            productTask.selectedTemplateId = selectedTemplateId;
            productTask.paramsType = paramsType;
            await this.xhsProductFactoryRepository.save(productTask);
            this.logger.log(`工作流已启动，executeId=${response.execute_id}, taskId=${productTask.id}, 使用模板ID=${selectedTemplateId}, 参数类型=${paramsType}, 工作流ID=${workflowId}`);
            this.checkTaskStatus(productTask.id).then(updated => {
                if (updated) {
                    this.logger.log(`初始任务状态检查成功: [taskId=${productTask.id}]`);
                }
            }).catch(err => {
                this.logger.error(`初始任务状态检查失败: ${err.message}`, err.stack);
            });
            return true;
        }
        catch (error) {
            this.logger.error(`启动工作流失败: ${error.message}`, error.stack);
            productTask.status = 'failed';
            productTask.error = error.message || '工作流启动失败';
            await this.xhsProductFactoryRepository.save(productTask);
            return false;
        }
    }
    async getGenerationResult(userId, taskId) {
        try {
            const productTask = await this.xhsProductFactoryRepository.findOne({
                where: { id: taskId, userId }
            });
            if (!productTask) {
                throw new Error('任务不存在或无权限查看');
            }
            this.logger.log(`获取任务结果 [${taskId}], 当前状态: ${productTask.status}`);
            if (productTask.status === 'completed') {
                let resultData = null;
                try {
                    resultData = productTask.result ? JSON.parse(productTask.result) : {};
                }
                catch (e) {
                    resultData = productTask.result;
                }
                return {
                    success: true,
                    message: '任务已完成',
                    status: 'completed',
                    data: resultData,
                    templateIds: productTask.templateIds || [],
                    selectedTemplateId: productTask.selectedTemplateId || null,
                    paramsType: productTask.paramsType || 'normal',
                    information: productTask.information
                };
            }
            if (productTask.status === 'failed') {
                return {
                    success: false,
                    message: '任务执行失败',
                    status: 'failed',
                    error: productTask.error || '未知错误'
                };
            }
            if (productTask.status === 'pending' || productTask.status === 'running') {
                this.checkTaskStatus(productTask.id).then(updated => {
                    if (updated) {
                        this.logger.log(`成功更新任务[${productTask.id}]状态`);
                    }
                }).catch(err => {
                    this.logger.error(`触发任务状态检查失败: ${err.message}`, err.stack);
                });
                return {
                    success: true,
                    message: '任务正在处理中，请稍后查询',
                    status: productTask.status,
                    progress: 0
                };
            }
            return {
                success: true,
                message: '任务状态未知',
                status: productTask.status || 'unknown'
            };
        }
        catch (error) {
            this.logger.error(`获取生成结果失败: ${error.message}`, error.stack);
            return {
                success: false,
                message: '获取生成结果失败',
                status: 'error',
                error: error.message
            };
        }
    }
    async scheduledTaskCheck() {
        try {
            this.logger.log('定时任务：开始检查运行中的任务状态');
            const result = await this.checkRunningTasks();
            const startedTasks = result.startedTasks || 0;
            const startedBatches = result.startedBatches || 0;
            const runningCount = result.runningCount || 0;
            if (result.success) {
                this.logger.log(`定时任务执行完成，启动了${startedTasks}个新任务(其中批量任务${startedBatches}批)，当前运行中共${runningCount}个任务`);
            }
            else {
                this.logger.warn(`定时任务执行完成，但遇到问题：${result.message}`);
            }
        }
        catch (error) {
            this.logger.error(`定时任务执行失败: ${error.message}`, error.stack);
        }
    }
    async checkTaskStatus(taskId) {
        var _a, _b;
        try {
            const task = await this.xhsProductFactoryRepository.findOne({
                where: { id: taskId }
            });
            if (!task) {
                this.logger.warn(`任务[${taskId}]不存在`);
                return false;
            }
            if (task.status !== 'pending' && task.status !== 'running') {
                this.logger.warn(`任务[${taskId}]状态[${task.status}]不需要检查`);
                return false;
            }
            if (!task.executeId) {
                this.logger.warn(`任务[${taskId}]没有执行ID`);
                return false;
            }
            if (task.status === 'pending') {
                task.status = 'running';
                await this.xhsProductFactoryRepository.save(task);
                this.logger.log(`更新任务[${taskId}]状态: pending -> running`);
            }
            try {
                this.logger.debug(`获取任务[${taskId}]执行状态，executeId: ${task.executeId}`);
                const resultFieldName = 'raw_workflow_result';
                const workflowResults = await this.cozeService.getWorkflowResult("7494168094760665115", task.executeId, 'data', resultFieldName);
                this.logger.debug(`任务[${taskId}]返回状态: ${JSON.stringify(workflowResults)}`);
                if (task.apiFailCount > 0) {
                    task.apiFailCount = 0;
                    this.logger.log(`重置任务[${taskId}]的API调用失败计数`);
                }
                const workflowStatus = (workflowResults === null || workflowResults === void 0 ? void 0 : workflowResults.status) || '';
                let workflowData = (workflowResults === null || workflowResults === void 0 ? void 0 : workflowResults.data) || null;
                if (workflowStatus === 'FAILED' || workflowStatus.includes('failed') || workflowStatus.includes('FAIL') || workflowStatus === 'Fail') {
                    this.logger.warn(`工作流[${task.executeId}]执行失败，状态: ${workflowStatus}`);
                    let errorMsg = '执行失败';
                    if ((workflowResults === null || workflowResults === void 0 ? void 0 : workflowResults.result) && Array.isArray(workflowResults.result)) {
                        const firstResult = workflowResults.result[0];
                        if (firstResult && firstResult.error_message) {
                            errorMsg = firstResult.error_message;
                            this.logger.log(`从原始结果中提取错误信息: ${errorMsg}`);
                        }
                    }
                    if ((_a = workflowResults === null || workflowResults === void 0 ? void 0 : workflowResults.data) === null || _a === void 0 ? void 0 : _a.error) {
                        errorMsg = workflowResults.data.error;
                    }
                    else if (typeof workflowData === 'string') {
                        if (workflowData.toLowerCase().includes('error') ||
                            workflowData.toLowerCase().includes('fail') ||
                            workflowData.toLowerCase().includes('exception')) {
                            errorMsg = workflowData;
                        }
                    }
                    task.status = 'failed';
                    task.error = errorMsg;
                    task.rawResult = typeof workflowResults[resultFieldName] === 'string'
                        ? workflowResults[resultFieldName]
                        : JSON.stringify(workflowResults[resultFieldName]);
                    this.logger.log(`保存失败任务[${taskId}]原始工作流结果，长度: ${task.rawResult.length}`);
                    if (task.deductType && task.deductAmount && !task.refunded) {
                        try {
                            const userId_num = parseInt(task.userId);
                            this.logger.log(`[积分退还] 任务失败，开始退还积分, 用户ID: ${userId_num}, 类型: ${task.deductType}, 数量: ${task.deductAmount}`);
                            const refundResult = await this.userBalanceService.refundFunctionPoints(userId_num, 'xhs_note', task.deductType, task.deductAmount);
                            if (refundResult.success) {
                                this.logger.log(`[积分退还] 用户ID: ${userId_num} 积分退还成功`);
                                task.refunded = true;
                            }
                            else {
                                this.logger.error(`[积分退还] 退还积分失败: ${refundResult.message}`);
                            }
                        }
                        catch (error) {
                            this.logger.error(`[积分退还] 退还积分失败: ${error.message}`);
                        }
                    }
                    const saveResult = await this.xhsProductFactoryRepository.save(task);
                    this.logger.log(`任务[${taskId}]状态已更新为failed, 保存结果: ${!!saveResult}`);
                    if (task.batchId && task.batchCount > 1) {
                        await this.tryStartNextBatchTask(task);
                    }
                    return true;
                }
                else if (workflowStatus.includes('RUNNING') || workflowStatus.includes('running')) {
                    this.logger.log(`任务[${taskId}]状态已更新为running`);
                    return true;
                }
                else if (workflowStatus.includes('SUCCEEDED') || workflowStatus.includes('completed') ||
                    workflowStatus.includes('success') || workflowData) {
                    this.logger.log(`更新任务[${taskId}]状态: ${task.status} -> completed, 数据长度: ${workflowData ? JSON.stringify(workflowData).length : 0}`);
                    task.rawResult = typeof workflowResults[resultFieldName] === 'string'
                        ? workflowResults[resultFieldName]
                        : JSON.stringify(workflowResults[resultFieldName]);
                    this.logger.log(`保存成功任务[${taskId}]原始工作流结果，长度: ${task.rawResult.length}`);
                    let cleanedResult = workflowData;
                    if (typeof workflowData === 'string') {
                        this.logger.log(`任务[${taskId}]原始字符串结果: "${workflowData}"`);
                        try {
                            const parsed = JSON.parse(workflowData);
                            cleanedResult = parsed;
                            this.logger.log(`任务[${taskId}]JSON解析成功`);
                        }
                        catch (e) {
                            this.logger.log(`任务[${taskId}]JSON解析失败: ${e.message}`);
                            let cleanString = workflowData;
                            let previousString;
                            do {
                                previousString = cleanString;
                                cleanString = cleanString.replace(/^["']+|["']+$/g, '');
                            } while (previousString !== cleanString);
                            cleanedResult = cleanString;
                            this.logger.log(`任务[${taskId}]清理后的字符串结果: "${cleanedResult}"`);
                        }
                    }
                    this.logger.log(`处理后的结果数据: ${JSON.stringify(cleanedResult)}`);
                    cleanedResult = await this.processHtmlTemplate(cleanedResult, taskId, task.selectedTemplateId);
                    try {
                        if (typeof cleanedResult === 'object' && cleanedResult !== null) {
                            if (cleanedResult.noteId) {
                                task.noteId = cleanedResult.noteId;
                                this.logger.log(`从对象结果中提取到笔记ID: ${task.noteId}`);
                            }
                            else if (typeof cleanedResult.result === 'object' && ((_b = cleanedResult.result) === null || _b === void 0 ? void 0 : _b.noteId)) {
                                task.noteId = cleanedResult.result.noteId;
                                this.logger.log(`从嵌套result对象中提取到笔记ID: ${task.noteId}`);
                            }
                        }
                        else if (typeof cleanedResult === 'string') {
                            const shareUrlMatch = cleanedResult.match(/\/xhs-auto-api\?id=([^&\s"']+)/);
                            if (shareUrlMatch && shareUrlMatch[1]) {
                                task.noteId = shareUrlMatch[1];
                                this.logger.log(`从分享链接中提取到笔记ID: ${task.noteId}`);
                            }
                        }
                    }
                    catch (error) {
                        this.logger.warn(`提取笔记ID失败: ${error.message}`);
                    }
                    task.status = 'completed';
                    if (typeof cleanedResult === 'string') {
                        task.result = cleanedResult;
                    }
                    else {
                        task.result = JSON.stringify(cleanedResult);
                    }
                    const saveResult = await this.xhsProductFactoryRepository.save(task);
                    this.logger.log(`任务[${taskId}]状态已更新为completed, 保存结果: ${!!saveResult}`);
                    return true;
                }
                this.logger.warn(`任务[${taskId}]状态未更新: 无法确定工作流状态`);
                return false;
            }
            catch (error) {
                task.apiFailCount = (task.apiFailCount || 0) + 1;
                this.logger.warn(`任务[${taskId}]API调用失败，当前失败次数: ${task.apiFailCount}/5`);
                this.logger.error(`检查任务状态失败 [taskId=${taskId}]: ${error.message}`, error.stack);
                if (task.apiFailCount >= 5) {
                    this.logger.error(`任务[${taskId}]API调用连续失败达到5次，将任务标记为失败`);
                    task.status = 'failed';
                    task.error = `API调用连续失败5次: ${error.message || 'Coze API连接失败'}`;
                    if (task.deductType && task.deductAmount && !task.refunded) {
                        try {
                            const userId_num = parseInt(task.userId);
                            this.logger.log(`[积分退还] API调用失败任务，开始退还积分, 用户ID: ${userId_num}, 类型: ${task.deductType}, 数量: ${task.deductAmount}`);
                            const refundResult = await this.userBalanceService.refundFunctionPoints(userId_num, 'xhs_note', task.deductType, task.deductAmount);
                            if (refundResult.success) {
                                this.logger.log(`[积分退还] 用户ID: ${userId_num} 积分退还成功`);
                                task.refunded = true;
                            }
                            else {
                                this.logger.error(`[积分退还] 退还积分失败: ${refundResult.message}`);
                            }
                        }
                        catch (error) {
                            this.logger.error(`[积分退还] 退还积分失败: ${error.message}`);
                        }
                    }
                    if (task.batchId && task.batchCount > 1) {
                        await this.tryStartNextBatchTask(task);
                    }
                }
                await this.xhsProductFactoryRepository.save(task);
                return task.apiFailCount >= 5;
            }
        }
        catch (error) {
            this.logger.error(`检查任务状态失败 [taskId=${taskId}]: ${error.message}`, error.stack);
            return false;
        }
    }
    async checkRunningTasks() {
        try {
            const tasks = await this.xhsProductFactoryRepository.find({
                where: [
                    { status: 'pending' },
                    { status: 'running' }
                ],
                order: {
                    createTime: 'ASC'
                }
            });
            if (tasks.length === 0) {
                this.logger.log('没有找到运行中或等待中的任务');
                return { success: true, message: '没有找到运行中或等待中的任务' };
            }
            this.logger.log(`找到 ${tasks.length} 个运行中或等待中的任务`);
            const pendingBatchTasks = {};
            const pendingSingleTasks = [];
            const runningTasks = [];
            tasks.forEach(task => {
                if (task.status === 'pending') {
                    if (task.batchId) {
                        if (!pendingBatchTasks[task.batchId]) {
                            pendingBatchTasks[task.batchId] = [];
                        }
                        pendingBatchTasks[task.batchId].push(task);
                    }
                    else {
                        pendingSingleTasks.push(task);
                    }
                }
                else if (task.status === 'running') {
                    runningTasks.push(task);
                }
            });
            this.logger.log(`待处理分析: ${Object.keys(pendingBatchTasks).length} 批次任务, ${pendingSingleTasks.length} 个单任务, ${runningTasks.length} 个运行中任务`);
            const defaultMaxTasks = 3;
            let startedTasks = 0;
            let startedBatches = 0;
            for (const task of runningTasks) {
                try {
                    await this.checkTaskStatus(task.id);
                }
                catch (error) {
                    this.logger.error(`检查任务 ${task.id} 状态失败: ${error.message}`, error.stack);
                }
            }
            for (const batchId in pendingBatchTasks) {
                const batchTasks = pendingBatchTasks[batchId];
                if (batchTasks.length === 0)
                    continue;
                batchTasks.sort((a, b) => a.batchIndex - b.batchIndex);
                const firstTask = batchTasks[0];
                const userId = parseInt(firstTask.userId);
                try {
                    const functionId = 'xhs_note';
                    const pointValidation = await this.userBalanceService.validateUserPointForFunction(userId, functionId);
                    const batchMaxConcurrentTasks = pointValidation.maxConcurrentTasks || defaultMaxTasks;
                    this.logger.log(`批次 ${batchId} 允许的最大并发任务数: ${batchMaxConcurrentTasks}`);
                    const batchRunningCount = await this.xhsProductFactoryRepository.count({
                        where: {
                            batchId: batchId,
                            status: 'running'
                        }
                    });
                    const availableBatchSlots = Math.max(0, batchMaxConcurrentTasks - batchRunningCount);
                    if (availableBatchSlots > 0) {
                        this.logger.log(`批次 ${batchId} 当前运行 ${batchRunningCount}/${batchMaxConcurrentTasks} 个任务，可启动 ${availableBatchSlots} 个新任务`);
                        const tasksToStart = batchTasks.slice(0, availableBatchSlots);
                        for (const task of tasksToStart) {
                            try {
                                const started = await this.startProductTaskWorkflow(task);
                                if (started) {
                                    startedTasks++;
                                    this.logger.log(`成功启动批次任务 ${task.id} [${task.batchIndex}/${task.batchCount}]`);
                                }
                            }
                            catch (error) {
                                this.logger.error(`启动批次任务 ${task.id} 失败: ${error.message}`, error.stack);
                            }
                        }
                        if (tasksToStart.length > 0) {
                            startedBatches++;
                        }
                    }
                    else {
                        this.logger.log(`批次 ${batchId} 已达到最大并发任务数 ${batchMaxConcurrentTasks}，无法启动新任务`);
                    }
                }
                catch (error) {
                    this.logger.error(`获取批次 ${batchId} 的最大并发数失败: ${error.message}`);
                    const batchRunningCount = await this.xhsProductFactoryRepository.count({
                        where: {
                            batchId: batchId,
                            status: 'running'
                        }
                    });
                    if (batchRunningCount === 0 && batchTasks.length > 0) {
                        try {
                            const started = await this.startProductTaskWorkflow(batchTasks[0]);
                            if (started) {
                                startedTasks++;
                                startedBatches++;
                                this.logger.log(`使用默认并发数1，成功启动批次任务 ${batchTasks[0].id}`);
                            }
                        }
                        catch (err) {
                            this.logger.error(`启动批次任务 ${batchTasks[0].id} 失败: ${err.message}`);
                        }
                    }
                }
            }
            const singleTaskRunningCount = await this.xhsProductFactoryRepository.count({
                where: {
                    batchId: null,
                    status: 'running'
                }
            });
            const availableSingleSlots = Math.max(0, defaultMaxTasks - singleTaskRunningCount);
            if (availableSingleSlots > 0 && pendingSingleTasks.length > 0) {
                this.logger.log(`单个任务: 当前运行 ${singleTaskRunningCount}/${defaultMaxTasks}，可启动 ${availableSingleSlots} 个新任务`);
                const singleTasksToStart = pendingSingleTasks.slice(0, availableSingleSlots);
                for (const task of singleTasksToStart) {
                    try {
                        const started = await this.startProductTaskWorkflow(task);
                        if (started) {
                            startedTasks++;
                            this.logger.log(`成功启动单个任务 ${task.id}`);
                        }
                    }
                    catch (error) {
                        this.logger.error(`启动单个任务 ${task.id} 失败: ${error.message}`);
                    }
                }
            }
            return {
                success: true,
                message: `成功检查所有任务，启动了 ${startedTasks} 个新任务 (其中批量任务 ${startedBatches} 批)`,
                startedTasks,
                startedBatches,
                runningCount: runningTasks.length + startedTasks
            };
        }
        catch (error) {
            this.logger.error(`检查运行中任务失败: ${error.message}`, error.stack);
            return { success: false, message: `检查任务失败: ${error.message}` };
        }
    }
    async getUserTasks(userId, status) {
        try {
            const where = { userId };
            if (status) {
                where.status = status;
            }
            const tasks = await this.xhsProductFactoryRepository.find({
                where,
                order: { createTime: 'DESC' },
            });
            return tasks.map(task => ({
                id: task.id,
                brandProduct: task.brandProduct,
                title: task.title,
                status: task.status,
                createTime: task.createTime,
                updateTime: task.updateTime,
                executeId: task.executeId,
                activityId: task.activityId,
                noteId: task.noteId,
                result: task.status === 'completed' ? task.result : null,
                error: task.error,
                templateIds: task.templateIds || [],
                selectedTemplateId: task.selectedTemplateId || null,
                paramsType: task.paramsType || 'normal',
                batchId: task.batchId,
                batchCount: task.batchCount,
                batchIndex: task.batchIndex
            }));
        }
        catch (error) {
            this.logger.error(`获取用户任务列表失败: ${error.message}`, error.stack);
            return {
                success: false,
                message: '获取任务列表失败',
                error: error.message
            };
        }
    }
    async tryStartNextBatchTask(task) {
        if (!task.batchId || task.batchCount <= 1) {
            return false;
        }
        this.logger.log(`任务[${task.id}]失败，尝试启动批次[${task.batchId}]中的下一个任务`);
        try {
            const nextTask = await this.xhsProductFactoryRepository.findOne({
                where: {
                    batchId: task.batchId,
                    status: 'pending',
                },
                order: {
                    batchIndex: 'ASC'
                }
            });
            if (nextTask) {
                this.logger.log(`找到批次[${task.batchId}]中的下一个待处理任务[${nextTask.batchIndex}/${nextTask.batchCount}]，准备启动`);
                const started = await this.startProductTaskWorkflow(nextTask);
                if (started) {
                    this.logger.log(`成功启动批次[${task.batchId}]中的下一个任务[${nextTask.batchIndex}/${nextTask.batchCount}]`);
                    return true;
                }
                else {
                    this.logger.error(`启动批次[${task.batchId}]中的下一个任务[${nextTask.batchIndex}/${nextTask.batchCount}]失败`);
                    return false;
                }
            }
            else {
                this.logger.log(`批次[${task.batchId}]中没有更多待处理的任务`);
                return false;
            }
        }
        catch (error) {
            this.logger.error(`尝试启动批次中下一个任务时出错: ${error.message}`, error.stack);
            return false;
        }
    }
    async processHtmlTemplate(cleanedResult, taskId, templateId) {
        try {
            if (typeof cleanedResult === 'string') {
                if (cleanedResult.trim().toLowerCase().startsWith('http')) {
                    this.logger.log(`检测到HTTP链接，跳过HTML模板处理 [taskId=${taskId}]`);
                    return cleanedResult;
                }
                try {
                    this.logger.log(`尝试将字符串结果解析为JSON [taskId=${taskId}]`);
                    cleanedResult = JSON.parse(cleanedResult);
                }
                catch (error) {
                    this.logger.warn(`字符串结果不是有效的JSON，跳过HTML模板处理 [taskId=${taskId}]`);
                    return cleanedResult;
                }
            }
            if ((typeof cleanedResult !== 'object' && !Array.isArray(cleanedResult)) || cleanedResult === null) {
                this.logger.warn(`结果不是对象或数组类型，跳过HTML模板处理 [taskId=${taskId}]`);
                return cleanedResult;
            }
            let noteId = null;
            if (templateId) {
                try {
                    noteId = Number(templateId);
                    this.logger.log(`获取到笔记ID: ${noteId} [taskId=${taskId}]`);
                }
                catch (error) {
                    this.logger.warn(`无法将templateId转换为数字: ${templateId} [taskId=${taskId}]`);
                }
            }
            if (!noteId) {
                this.logger.warn(`HTML模板替换: 未找到有效的笔记ID，跳过处理 [taskId=${taskId}]`);
                return cleanedResult;
            }
            this.logger.log(`HTML模板替换: 尝试获取笔记(ID=${noteId})关联的HTML模板 [taskId=${taskId}]`);
            const relations = await this.noteTemplateRelationRepository.find({
                where: { noteId: noteId }
            });
            this.logger.log(`HTML模板替换: 笔记(ID=${noteId})关联的模板关系数量: ${relations.length} [taskId=${taskId}]`);
            if (!relations || relations.length === 0) {
                this.logger.warn(`HTML模板替换: 笔记ID=${noteId}没有关联的模板，跳过处理 [taskId=${taskId}]`);
                return cleanedResult;
            }
            const templateIds = relations.map(relation => relation.templateId);
            this.logger.log(`HTML模板替换: 找到关联的模板ID: ${templateIds.join(', ')} [taskId=${taskId}]`);
            const htmlTemplates = await this.htmlTemplateRepository.find({
                where: { id: (0, typeorm_2.In)(templateIds), status: 1 }
            });
            this.logger.log(`HTML模板替换: 有效HTML模板数量=${htmlTemplates.length} [taskId=${taskId}]`);
            if (htmlTemplates.length === 0) {
                this.logger.warn(`HTML模板替换: 未找到有效的HTML模板内容，跳过处理 [taskId=${taskId}]`);
                return cleanedResult;
            }
            const selectedTemplate = htmlTemplates[0];
            this.logger.log(`HTML模板替换: 选择HTML模板ID=${selectedTemplate.id}, 名称=${selectedTemplate.name} [taskId=${taskId}]`);
            if (!selectedTemplate.htmlCode) {
                this.logger.warn(`HTML模板替换: 模板ID=${selectedTemplate.id}没有有效的HTML代码，跳过处理 [taskId=${taskId}]`);
                return cleanedResult;
            }
            if (Array.isArray(cleanedResult)) {
                this.logger.log(`检测到数组类型结果，长度: ${cleanedResult.length}，开始处理HTML模板 [taskId=${taskId}]`);
                const processedArray = await Promise.all(cleanedResult.map(async (item, index) => {
                    if (typeof item !== 'object' || item === null) {
                        this.logger.warn(`数组项 #${index} 不是对象类型，跳过处理`);
                        return item;
                    }
                    this.logger.log(`处理数组项 #${index}, 包含 ${Object.keys(item).length} 个键值对`);
                    const textReplacements = [];
                    for (const [key, value] of Object.entries(item)) {
                        if (typeof value === 'string' && value.trim() !== '' &&
                            !['id', 'templateNoteId', 'isHtmlTemplate', 'htmlTemplateProcessed'].includes(key)) {
                            textReplacements.push({
                                placeholder: `id="${key}">[^<]*<`,
                                replaceWith: `id="${key}">${value}<`,
                                useRegex: true
                            });
                            this.logger.log(`添加替换项: id="${key}" -> ${value}`);
                        }
                    }
                    const imageUrls = [];
                    if (item.images && Array.isArray(item.images)) {
                        imageUrls.push(...item.images);
                    }
                    else if (item.coverImage && typeof item.coverImage === 'string') {
                        imageUrls.push(item.coverImage);
                    }
                    try {
                        const result = await this.htmlRenderService.renderTemplateToHtml(selectedTemplate.name, imageUrls, textReplacements, false, false, '');
                        try {
                            const imageResult = await this.htmlRenderService.htmlToImage(result.html, {
                                uploadToSuperbed: true,
                                useAutoWidth: true
                            });
                            return Object.assign(Object.assign({}, item), { htmlTemplateProcessed: true, htmlTemplateUrl: imageResult.superImageUrl || imageResult.url, htmlTemplateLocalUrl: imageResult.url, htmlTemplateContent: result.html });
                        }
                        catch (imgError) {
                            this.logger.error(`HTML转图片失败: ${imgError.message}`);
                            return Object.assign(Object.assign({}, item), { htmlTemplateProcessed: true, htmlTemplateContent: result.html, htmlTemplateError: `HTML转图片失败: ${imgError.message}` });
                        }
                    }
                    catch (renderError) {
                        this.logger.error(`渲染HTML模板失败: ${renderError.message}`);
                        return Object.assign(Object.assign({}, item), { htmlTemplateProcessed: false, htmlTemplateError: `渲染失败: ${renderError.message}` });
                    }
                }));
                this.logger.log(`HTML模板替换完成，共处理 ${processedArray.length} 个数组项`);
                return processedArray;
            }
            this.logger.log(`检测到对象类型结果，包含 ${Object.keys(cleanedResult).length} 个键值对，开始处理HTML模板 [taskId=${taskId}]`);
            if (Object.keys(cleanedResult).length === 0) {
                this.logger.warn(`HTML模板替换: 数据对象为空，跳过处理 [taskId=${taskId}]`);
                return cleanedResult;
            }
            const textReplacements = [];
            for (const [key, value] of Object.entries(cleanedResult)) {
                if (typeof value === 'string' && value.trim() !== '' &&
                    !['id', 'templateNoteId', 'isHtmlTemplate', 'htmlTemplateProcessed'].includes(key)) {
                    textReplacements.push({
                        placeholder: `id="${key}">[^<]*<`,
                        replaceWith: `id="${key}">${value}<`,
                        useRegex: true
                    });
                    this.logger.log(`添加替换项: id="${key}" -> ${value}`);
                }
            }
            const imageUrls = [];
            if (cleanedResult.images && Array.isArray(cleanedResult.images)) {
                imageUrls.push(...cleanedResult.images);
            }
            else if (cleanedResult.coverImage && typeof cleanedResult.coverImage === 'string') {
                imageUrls.push(cleanedResult.coverImage);
            }
            try {
                const result = await this.htmlRenderService.renderTemplateToHtml(selectedTemplate.name, imageUrls, textReplacements, false, false, '');
                try {
                    const imageResult = await this.htmlRenderService.htmlToImage(result.html, {
                        uploadToSuperbed: true,
                        useAutoWidth: true
                    });
                    return Object.assign(Object.assign({}, cleanedResult), { htmlTemplateProcessed: true, htmlTemplateUrl: imageResult.superImageUrl || imageResult.url, htmlTemplateLocalUrl: imageResult.url, htmlTemplateContent: result.html });
                }
                catch (imgError) {
                    this.logger.error(`HTML转图片失败: ${imgError.message}`);
                    return Object.assign(Object.assign({}, cleanedResult), { htmlTemplateProcessed: true, htmlTemplateContent: result.html, htmlTemplateError: `HTML转图片失败: ${imgError.message}` });
                }
            }
            catch (renderError) {
                this.logger.error(`渲染HTML模板失败: ${renderError.message}`);
                return Object.assign(Object.assign({}, cleanedResult), { htmlTemplateProcessed: false, htmlTemplateError: `渲染失败: ${renderError.message}` });
            }
        }
        catch (error) {
            this.logger.error(`HTML模板替换失败: ${error.message}`, error.stack);
            if (Array.isArray(cleanedResult)) {
                return cleanedResult.map(item => (Object.assign(Object.assign({}, item), { htmlTemplateError: error.message, htmlTemplateProcessed: false })));
            }
            else {
                const errorResult = Object.assign(Object.assign({}, cleanedResult), { htmlTemplateError: error.message, htmlTemplateProcessed: false });
                return errorResult;
            }
        }
    }
    async retryTask(userId, taskId) {
        try {
            this.logger.log(`[retryTask] 用户 ${userId} 重试任务 ${taskId}`);
            const task = await this.xhsProductFactoryRepository.findOne({
                where: { id: taskId, userId }
            });
            if (!task) {
                return {
                    success: false,
                    message: '任务不存在或无权访问',
                    error: 'TASK_NOT_FOUND'
                };
            }
            if (task.status !== 'failed') {
                return {
                    success: false,
                    message: '只有失败的任务才能重试',
                    error: 'INVALID_TASK_STATUS'
                };
            }
            const activity = await this.xhsActivityRepository.findOne({
                where: { id: task.activityId, status: 'active' },
            });
            if (!activity) {
                return {
                    success: false,
                    message: '关联的活动不存在或已结束',
                    error: 'ACTIVITY_NOT_FOUND'
                };
            }
            const functionId = 'xhs_note';
            const userId_num = parseInt(userId);
            const pointValidation = await this.userBalanceService.validateUserPointForFunction(userId_num, functionId, 1);
            if (!pointValidation.success) {
                this.logger.error(`[retryTask] 用户积分验证失败: ${pointValidation.message}`);
                return {
                    success: false,
                    message: pointValidation.message || '积分不足，请充值后再试',
                    error: pointValidation.error || 'INSUFFICIENT_BALANCE'
                };
            }
            try {
                const deductResult = await this.userBalanceService.deductFromBalance(userId_num, pointValidation.deductType, pointValidation.consumeValue, 0, functionId);
                this.logger.log(`[retryTask] 用户ID: ${userId} 积分扣除成功，消耗: ${pointValidation.consumeValue}`);
            }
            catch (error) {
                this.logger.error(`[retryTask] 扣除积分失败: ${error.message}`);
                return {
                    success: false,
                    message: '积分扣除失败，请稍后再试',
                    error: error.message
                };
            }
            task.status = 'pending';
            task.error = null;
            task.result = null;
            task.executeId = null;
            task.noteId = null;
            task.apiFailCount = 0;
            task.updateTime = new Date();
            await this.xhsProductFactoryRepository.save(task);
            await this.startProductTaskWorkflow(task);
            this.logger.log(`[retryTask] 任务 ${taskId} 重试成功，已重新启动工作流`);
            return {
                success: true,
                message: '任务重试成功，正在重新处理',
                data: {
                    taskId: task.id,
                    status: task.status
                }
            };
        }
        catch (error) {
            this.logger.error(`[retryTask] 重试任务失败: ${error.message}`, error.stack);
            return {
                success: false,
                message: error.message || '重试任务失败',
                error: error.message
            };
        }
    }
};
__decorate([
    (0, schedule_1.Cron)('0 */1 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], XhsProductFactoryService.prototype, "scheduledTaskCheck", null);
XhsProductFactoryService = XhsProductFactoryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(xhs_activity_entity_1.XhsActivity)),
    __param(1, (0, typeorm_1.InjectRepository)(xhs_product_factory_entity_1.XhsProductFactory)),
    __param(2, (0, typeorm_1.InjectRepository)(note_entity_1.Note)),
    __param(3, (0, typeorm_1.InjectRepository)(notetemplate_entity_1.NoteTemplate)),
    __param(4, (0, typeorm_1.InjectRepository)(note_template_relation_entity_1.NoteTemplateRelation)),
    __param(5, (0, typeorm_1.InjectRepository)(htmllib_entity_1.HtmlTemplateEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        config_1.ConfigService,
        coze_service_1.CozeService,
        userBalance_service_1.UserBalanceService,
        pointConsumptionRule_service_1.PointConsumptionRuleService,
        material_service_1.MaterialService,
        html_render_service_1.HtmlRenderService])
], XhsProductFactoryService);
exports.XhsProductFactoryService = XhsProductFactoryService;
