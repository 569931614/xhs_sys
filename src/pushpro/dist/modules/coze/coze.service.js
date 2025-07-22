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
var CozeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CozeService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const coze_entity_1 = require("./coze.entity");
const api_1 = require("@coze/api");
const axios_1 = require("@nestjs/axios");
const axios_2 = require("axios");
let CozeService = CozeService_1 = class CozeService {
    constructor(cozeRepository, httpService) {
        this.cozeRepository = cozeRepository;
        this.httpService = httpService;
        this.logger = new common_1.Logger(CozeService_1.name);
        this.accessToken = null;
        this.defaultConfig = {
            coze_api_base: "https://api.coze.cn",
            coze_client_id: "1123962302922",
            coze_public_key_id: "fxkr4uRho76_yAqNKA_1wV7on2AwjQIk3tjkzsnk-Z4",
            coze_private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCttH3mlTJKKhQT\ny8RJBVIZDXKBdJSx9Y2VSFkmEK6ASMvE5W4VW7qX41PMg5VtGlajQCWxhugJwV1H\npEKvKqU0RsIZ14CTgTuVekRiruCnf0DN6KM6WuEJNsQxCTICchFC4sOt7kyjtCHU\nYUlF4faAFqhyMLzjJpdss+QQngSEjH1s+alr+RySBSA5puEF0VFMpRMEjFwi4Jno\n0yPNFCOiYvz+tRIK6OhSdtfhMKAmmt+62/Op3v9O2GAhFVJO1JNl0Odxlf/rs3nB\nv+37ds6pz+7LDOzGSufAAoigMDRRn1a93AT2Q4tlz9kYe5RncKhnA6xPgomNZfIf\nVMwjOGF1AgMBAAECggEAARbfr0GCRjrLU3B0s6yH3kZaUHuFrzQGBkik3ns+TOmn\n9X0m2pVvryIq1V6B4mRG5NEzK1DYRa9jwV5DWMvgq1pCP109ni8yS3av1RqZqBNB\nOclatLP7M06XnmMbYC6M8ylu5rlW27P2fll51ylanWUG+2hY1ufYDUN3i68iAh7I\nwsMIPdf1+TYGi8IdHg2hHpBEMecMU/bhRaDXM3DOIMWYZ8l6k7uxrsDKv7Uhov+n\nZIfv+AjWqz7N+yvIR6GM0HqG+iv4B+JAkrcYPbchl44IPbbo4HKRjEY2+LkOl/5I\nwM46pO6eAuUNXhXdw0y3WRqOdc/o+c7PD/JeZWTgpQKBgQDyu7hsKWapbpeZ5Kqm\nBxr+yec0/xcfXxkhcc9Ehdd8+v/QGKza8vRkCUp9elpccMpMW5rLdPVZpP2UovXF\nrSjDKl9m2H2OKzzBRO8uT/a//XSzywlQjcmSaYmu0stBhf7tSoDjlUjFqvYjdxDO\n1u2cqZiymVyC3R/bQv1RPm08zwKBgQC3MvDjBWeV6YBcu/iSF8jmokSOz71YyUFn\n9CReKzQzEDO6DVhWulsIDlPne3dfqI2vST+ZljNUo1S8jxaMX8C2rTdKmIGVWOQP\ntbQftdtti5QJ83Z5HhE4KSZ6irq1GY/AmL1DiU2mRHch7KOMKDGrTps1Rwv/Y8t2\n72Ha9q+2ewKBgQC88JwELVHJDtmYo6Kla6B6tSRwXyNbewWvv8wLVXc/xIy9KYfb\nQgQznfvKoiOWEwGU4DUkq5yTM9djDFnsjfXNvLzX7CoHMOawtfzLetjh5uMhVCii\n+Erv2ZCfcVtfXHLrt/ONstUbcBD52CNQLYJ1UJoYY0HcZ0z1ujY+OC6FhwKBgCpx\n0v3GMsm439SceGrgt9s3nUq5NtVrS4waNJLcz6tFBbcFgIIXix/Csg3fvTichLcn\n8WRUOHBTpz5IqKC9TpkEaNsPmnZPsgcxwhnWuJAY1qO3lKtbHAI3BoM9wSRUV8n3\nmWIcXbE4C6IAgaPnbBqUi8E8RLtXE7zqmXFx1iQhAoGAS0OlIv/Nr7K0cWdQouAT\nO7ohkipKJBKgD6rdU3e2lOtl3vheW7hxipe7id5hMwibeplbxEco1voxrn2qHiIv\n+g/WoSEOUkukzG7hyrlHL26L5Lpr3pTiTLpw3G3edyZqgR+mOIweEmQtQxIyOuyP\nepWwT2VHi5YaRSYwKgklrPk=\n-----END PRIVATE KEY-----",
            default_bot_id: "7483341266928468008",
            space_id: "7477025304549294118"
        };
        this.logger.log('CozeService初始化中...');
        try {
            this.initCozeClient();
            this.logger.log('CozeService初始化完成');
        }
        catch (error) {
            this.logger.error(`CozeService初始化失败: ${error.message}`, error.stack);
        }
    }
    initCozeClient() {
        try {
            this.logger.log('开始初始化CozeAPI客户端');
            const getToken = async () => {
                try {
                    this.logger.log('尝试获取JWT Token');
                    const token = await (0, api_1.getJWTToken)({
                        baseURL: api_1.COZE_CN_BASE_URL,
                        appId: this.defaultConfig.coze_client_id,
                        aud: 'api.coze.cn',
                        keyid: this.defaultConfig.coze_public_key_id,
                        privateKey: this.defaultConfig.coze_private_key,
                    });
                    if (token && token.access_token) {
                        this.logger.log(`JWT Token获取成功: ${token.access_token.substring(0, 10)}...`);
                        this.accessToken = token.access_token;
                        return token.access_token;
                    }
                    else {
                        this.logger.error('JWT Token获取失败: 返回结果为空或无效');
                        throw new Error('Invalid token response');
                    }
                }
                catch (tokenError) {
                    this.logger.error(`JWT Token获取失败: ${tokenError.message}`, tokenError.stack);
                    throw tokenError;
                }
            };
            this.logger.log('验证Token获取功能');
            getToken().then(token => {
                this.logger.log('Token验证成功，继续初始化');
            }).catch(error => {
                this.logger.error(`Token验证失败，但将继续尝试初始化: ${error.message}`);
            });
            this.logger.log('初始化CozeAPI实例...');
            this.client = new api_1.CozeAPI({
                token: getToken,
                baseURL: api_1.COZE_CN_BASE_URL,
            });
            if (this.client) {
                this.logger.log('CozeAPI客户端创建成功');
                const clientAny = this.client;
                this.logger.log(`客户端信息: workflows=${!!clientAny.workflows}, runs=${!!clientAny.runs}`);
                if (clientAny.workflows) {
                    this.logger.log(`可用的workflows方法: ${Object.keys(clientAny.workflows).join(', ')}`);
                }
            }
            else {
                this.logger.warn('CozeAPI客户端创建可能不完整');
            }
            this.logger.log('CozeAPI客户端初始化成功');
        }
        catch (error) {
            this.logger.error(`CozeAPI客户端初始化失败: ${error.message}`);
            this.logger.error(`初始化失败详情: ${error.stack}`);
            throw error;
        }
    }
    async create(cozeCreateDto) {
        try {
            const exists = await this.cozeRepository.findOne({
                where: { workflowId: cozeCreateDto.workflowId },
            });
            if (exists) {
                throw new common_1.HttpException('Workflow ID已存在', common_1.HttpStatus.BAD_REQUEST);
            }
            const coze = this.cozeRepository.create(cozeCreateDto);
            return await this.cozeRepository.save(coze);
        }
        catch (error) {
            this.logger.error(`创建Coze配置失败: ${error.message}`, error.stack);
            throw new common_1.HttpException(error.message || '创建Coze配置失败', error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async update(id, cozeUpdateDto) {
        try {
            const coze = await this.cozeRepository.findOne({ where: { id } });
            if (!coze) {
                throw new common_1.HttpException('Coze配置不存在', common_1.HttpStatus.NOT_FOUND);
            }
            if (cozeUpdateDto.workflowId && cozeUpdateDto.workflowId !== coze.workflowId) {
                const exists = await this.cozeRepository.findOne({
                    where: { workflowId: cozeUpdateDto.workflowId },
                });
                if (exists && exists.id !== id) {
                    throw new common_1.HttpException('Workflow ID已被其他配置使用', common_1.HttpStatus.BAD_REQUEST);
                }
            }
            const updatedCoze = Object.assign(coze, cozeUpdateDto);
            return await this.cozeRepository.save(updatedCoze);
        }
        catch (error) {
            this.logger.error(`更新Coze配置失败: ${error.message}`, error.stack);
            throw new common_1.HttpException(error.message || '更新Coze配置失败', error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async delete(id) {
        try {
            const coze = await this.cozeRepository.findOne({ where: { id } });
            if (!coze) {
                throw new common_1.HttpException('Coze配置不存在', common_1.HttpStatus.NOT_FOUND);
            }
            await this.cozeRepository.softDelete(id);
            return { success: true };
        }
        catch (error) {
            this.logger.error(`删除Coze配置失败: ${error.message}`, error.stack);
            throw new common_1.HttpException(error.message || '删除Coze配置失败', error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async findAll(query) {
        try {
            this.logger.log(`Getting Coze list with query: ${JSON.stringify(query)}`);
            const page = query.page || 1;
            const size = query.size || 10;
            const [items, total] = await this.cozeRepository.findAndCount({
                skip: (page - 1) * size,
                take: size,
                order: { createdAt: 'DESC' },
            });
            const result = {
                items,
                total,
                page,
                size,
            };
            this.logger.log(`Found ${total} Coze configs`);
            return result;
        }
        catch (error) {
            this.logger.error(`获取Coze配置列表失败: ${error.message}`, error.stack);
            throw new common_1.HttpException(error.message || '获取Coze配置列表失败', error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async findOne(id) {
        try {
            const coze = await this.cozeRepository.findOne({ where: { id } });
            if (!coze) {
                throw new common_1.HttpException('Coze配置不存在', common_1.HttpStatus.NOT_FOUND);
            }
            return coze;
        }
        catch (error) {
            this.logger.error(`获取Coze配置失败: ${error.message}`, error.stack);
            throw new common_1.HttpException(error.message || '获取Coze配置失败', error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async findByWorkflowId(workflowId) {
        try {
            this.logger.log(`查找workflowId为 ${workflowId} 的Coze配置`);
            const coze = await this.cozeRepository.findOne({
                where: { workflowId, status: 1 }
            });
            if (!coze) {
                this.logger.warn(`未找到workflowId为 ${workflowId} 的Coze配置`);
                throw new common_1.HttpException('Coze Workflow不存在或未启用', common_1.HttpStatus.NOT_FOUND);
            }
            this.logger.log(`找到workflowId为 ${workflowId} 的Coze配置: ${coze.name}`);
            return coze;
        }
        catch (error) {
            this.logger.error(`获取Coze Workflow配置失败: ${error.message}`, error.stack);
            throw new common_1.HttpException(error.message || '获取Coze Workflow配置失败', error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getBotList() {
        var _a;
        try {
            this.logger.log('获取机器人列表');
            if (!this.client) {
                throw new Error('CozeAPI客户端未初始化');
            }
            const api = this.client;
            if (api.bots && typeof api.bots.list === 'function') {
                const response = await api.bots.list({
                    space_id: this.defaultConfig.space_id,
                });
                this.logger.log(`获取机器人列表成功, 共${((_a = response.bots) === null || _a === void 0 ? void 0 : _a.length) || 0}个机器人`);
                return response;
            }
            else {
                throw new Error('SDK中没有可用的机器人列表获取方法');
            }
        }
        catch (error) {
            this.logger.error(`获取机器人列表失败: ${error.message}`);
            this.logger.error(`错误堆栈: ${error.stack}`);
            throw new common_1.HttpException(error.message || '获取机器人列表失败', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async chat(chatDto) {
        var _a, _b;
        try {
            let workflowId = chatDto.workflowId;
            if (!workflowId) {
                workflowId = this.defaultConfig.default_bot_id;
                this.logger.log(`未指定workflowId，使用默认workflowId: ${workflowId}`);
            }
            this.logger.log(`开始聊天请求, workflowId=${workflowId}, message=${chatDto.message}`);
            const result = await this.client.chat.createAndPoll({
                bot_id: workflowId,
                additional_messages: [{
                        role: api_1.RoleType.User,
                        content: chatDto.message,
                        content_type: 'text',
                    }],
                user_id: chatDto.sessionId || 'default_user_id',
            });
            this.logger.log(`聊天请求完成, 状态: ${(_a = result.chat) === null || _a === void 0 ? void 0 : _a.status}`);
            if (((_b = result.chat) === null || _b === void 0 ? void 0 : _b.status) === api_1.ChatStatus.COMPLETED) {
                const assistantMessages = result.messages.filter(msg => msg.role === 'assistant' && msg.content_type === 'text');
                if (assistantMessages.length > 0) {
                    const latestMessage = assistantMessages[assistantMessages.length - 1];
                    return {
                        content: latestMessage.content,
                        conversation_id: result.chat.id || null,
                    };
                }
            }
            throw new common_1.HttpException('未获取到有效回复', common_1.HttpStatus.BAD_REQUEST);
        }
        catch (error) {
            this.logger.error(`聊天请求失败: ${error.message}`);
            if (error.response) {
                this.logger.error(`错误响应: ${JSON.stringify(error.response.data || {})}`);
            }
            throw new common_1.HttpException(error.message || '聊天请求失败', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async streamChat(chatDto) {
        try {
            let workflowId = chatDto.workflowId;
            if (!workflowId) {
                workflowId = this.defaultConfig.default_bot_id;
                this.logger.log(`未指定workflowId，使用默认workflowId: ${workflowId}`);
            }
            this.logger.log(`开始流式聊天请求, workflowId=${workflowId}, message=${chatDto.message}`);
            return this.client.chat.stream({
                bot_id: workflowId,
                additional_messages: [{
                        role: api_1.RoleType.User,
                        content: chatDto.message,
                        content_type: 'text',
                    }],
                user_id: chatDto.sessionId || 'default_user_id',
            });
        }
        catch (error) {
            this.logger.error(`流式聊天请求失败: ${error.message}`);
            throw new common_1.HttpException(error.message || '流式聊天请求失败', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getWorkflowList(spaceId) {
        var _a, _b;
        try {
            this.logger.log('获取工作流列表');
            if (!this.client || !this.client.workflows) {
                throw new Error('CozeAPI客户端未初始化或workflows不可用');
            }
            const targetSpaceId = spaceId || this.defaultConfig.space_id;
            this.logger.log(`工作流列表使用的spaceId: ${targetSpaceId}`);
            const api = this.client;
            this.logger.log(`客户端信息: ${JSON.stringify({
                hasWorkflows: !!api.workflows,
                workflowsType: api.workflows ? typeof api.workflows : 'undefined',
                methods: api.workflows ? Object.keys(api.workflows).join(',') : 'none'
            })}`);
            try {
                this.logger.log('尝试刷新token');
                const dynamicClient = this.client;
                if (typeof dynamicClient.token === 'function') {
                    await dynamicClient.token();
                    this.logger.log('成功获取token');
                }
                else {
                    this.logger.log('token方法不可用');
                }
            }
            catch (tokenError) {
                this.logger.warn(`获取token失败: ${tokenError.message}`);
            }
            this.logger.log('尝试使用listPublished方法');
            try {
                const response = await api.workflows.listPublished({
                    space_id: targetSpaceId
                });
                this.logger.log(`获取工作流列表成功, 共${((_a = response.workflows) === null || _a === void 0 ? void 0 : _a.length) || 0}个工作流`);
                return response;
            }
            catch (methodError) {
                this.logger.warn(`listPublished方法调用失败: ${methodError.message}`);
                this.logger.log('尝试使用替代方法');
                if (api.workflows.published && typeof api.workflows.published.list === 'function') {
                    this.logger.log('发现published.list方法，尝试调用');
                    const response = await api.workflows.published.list({
                        space_id: targetSpaceId
                    });
                    this.logger.log(`获取工作流列表成功, 共${((_b = response.workflows) === null || _b === void 0 ? void 0 : _b.length) || 0}个工作流`);
                    return response;
                }
                else {
                    throw new Error('未找到可用的SDK工作流列表获取方法');
                }
            }
        }
        catch (error) {
            this.logger.error(`获取工作流列表失败: ${error.message}`);
            this.logger.error(`错误堆栈: ${error.stack}`);
            throw new common_1.HttpException(error.message || '获取工作流列表失败', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    processWorkflowParameters(parameters) {
        const processedParameters = {};
        if (!parameters) {
            return processedParameters;
        }
        for (const [key, value] of Object.entries(parameters)) {
            if (key.startsWith('file_') || key.includes('_file_')) {
                if (Array.isArray(value)) {
                    this.logger.log(`处理多文件参数元数据 ${key}: ${Array.isArray(value)}`);
                    const fileObjects = value.map(fileId => ({ file_id: fileId }));
                    processedParameters[key] = JSON.stringify(fileObjects);
                    this.logger.log(`处理多文件参数 ${key}: ${processedParameters[key]}`);
                }
                else {
                    processedParameters[key] = JSON.stringify({ file_id: value });
                    this.logger.log(`处理单文件参数 ${key}: ${processedParameters[key]}`);
                }
            }
            else {
                processedParameters[key] = value;
            }
        }
        this.logger.log(`工作流参数处理完成: ${JSON.stringify(processedParameters)}`);
        return processedParameters;
    }
    async runWorkflow(parameters) {
        try {
            const workflowId = parameters.workflow_id;
            if (!workflowId) {
                throw new common_1.HttpException('缺少必要的工作流ID', common_1.HttpStatus.BAD_REQUEST);
            }
            this.logger.log(`触发工作流, workflowId=${workflowId}` +
                (parameters.user_id ? `, userId=${parameters.user_id}` : ''));
            const processedParams = this.processWorkflowParameters(parameters);
            const api = this.client;
            const response = await api.workflows.runs.create({
                workflow_id: workflowId,
                is_async: parameters.is_async,
                parameters: processedParams,
                user_id: parameters.user_id || 'default_user_id',
            });
            this.logger.log(`工作流触发成功, is_async=${parameters.is_async}`);
            this.logger.log(`工作流触发成功, response=${JSON.stringify(response)}`);
            this.logger.log(`工作流触发成功, executeId=${response.execute_id}`);
            return response;
        }
        catch (error) {
            this.logger.error(`触发工作流失败: ${error.message}`);
            this.logger.error(`错误堆栈: ${error.stack}`);
            throw new common_1.HttpException(error.message || '触发工作流失败', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async streamWorkflow(parameters) {
        try {
            const processedParams = this.processWorkflowParameters(parameters);
            const workflowId = parameters.workflow_id;
            if (!workflowId) {
                throw new common_1.HttpException('缺少必要的工作流ID', common_1.HttpStatus.BAD_REQUEST);
            }
            this.logger.log(`流式触发工作流, workflowId=${workflowId}`);
            const api = this.client;
            const result = await api.workflows.runs.stream({
                workflow_id: workflowId,
                parameters: processedParams,
                user_id: parameters.user_id || 'default_user_id',
            });
            return result;
        }
        catch (error) {
            this.logger.error(`流式触发工作流失败: ${error.message}`);
            throw new common_1.HttpException(error.message || '流式触发工作流失败', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getWorkflowHistory(workflowId, executeId) {
        try {
            this.logger.log(`获取工作流历史, workflowId=${workflowId}, executeId=${executeId}`);
            const history = await this.client.workflows.runs.history(workflowId, executeId);
            this.logger.log(`获取工作流历史成功`);
            return history;
        }
        catch (error) {
            this.logger.error(`获取工作流历史失败: ${error.message}`);
            this.logger.error(`错误堆栈: ${error.stack}`);
            throw new common_1.HttpException(error.message || '获取工作流历史失败', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getWorkflowHistoryByStatus(workflowId, status, page = 1, pageSize = 10) {
        try {
            this.logger.log(`获取工作流执行历史, workflowId=${workflowId}, status=${status || '全部'}, page=${page}, pageSize=${pageSize}`);
            if (!this.client || !this.client.workflows) {
                throw new Error('CozeAPI客户端未初始化或workflows不可用');
            }
            const requestParams = {
                workflow_id: workflowId,
                page,
                page_size: pageSize
            };
            if (status) {
                requestParams.status = status;
            }
            const api = this.client;
            let result;
            if (api.workflows.runs && typeof api.workflows.runs.listHistory === 'function') {
                this.logger.log('使用runs.listHistory方法获取工作流执行历史');
                result = await api.workflows.runs.listHistory(requestParams);
            }
            else {
                throw new Error('SDK中没有可用的工作流历史查询方法');
            }
            this.logger.log(`获取工作流执行历史成功, 共${result.total || 0}条记录`);
            return result;
        }
        catch (error) {
            this.logger.error(`获取工作流执行历史失败: ${error.message}`);
            this.logger.error(`错误堆栈: ${error.stack}`);
            throw new common_1.HttpException(error.message || '获取工作流执行历史失败', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async uploadFile(file, filename, mimeType = 'application/pdf') {
        try {
            this.logger.log(`上传文件, filename=${filename}, mimeType=${mimeType}, 文件大小=${file.length} bytes`);
            if (!file || file.length === 0) {
                throw new Error('文件内容为空');
            }
            if (!this.client) {
                throw new Error('CozeAPI客户端未初始化');
            }
            try {
                const dynamicClient = this.client;
                if (typeof dynamicClient.token === 'function') {
                    this.logger.log('获取token...');
                    await dynamicClient.token();
                    this.logger.log('token获取成功');
                }
            }
            catch (tokenError) {
                this.logger.warn(`token获取失败: ${tokenError.message}`);
            }
            this.logger.log('开始使用直接API方式上传文件...');
            const FormData = require('form-data');
            const formData = new FormData();
            formData.append('file', file, {
                filename: filename,
                contentType: mimeType,
            });
            let token = this.accessToken;
            if (!token) {
                this.logger.log('重新获取token');
                const tokenResult = await (0, api_1.getJWTToken)({
                    baseURL: api_1.COZE_CN_BASE_URL,
                    appId: this.defaultConfig.coze_client_id,
                    aud: 'api.coze.cn',
                    keyid: this.defaultConfig.coze_public_key_id,
                    privateKey: this.defaultConfig.coze_private_key,
                });
                token = tokenResult.access_token;
                this.accessToken = token;
            }
            this.logger.log('发送文件上传请求');
            const fileUploadUrl = `${api_1.COZE_CN_BASE_URL}/v1/files/upload`;
            this.logger.log('fileUploadUrl：' + fileUploadUrl);
            this.logger.log('token：' + token);
            const response = await axios_2.default.post(fileUploadUrl, formData, {
                headers: Object.assign({ 'Authorization': `Bearer ${token}` }, formData.getHeaders())
            });
            this.logger.log(`文件上传响应: ${JSON.stringify(response.data)}`);
            if (response.data && response.data.code === 0 && response.data.data) {
                const fileId = response.data.data.id;
                if (fileId) {
                    this.logger.log(`文件上传成功, 返回的fileId=${fileId}`);
                    return { file_id: fileId };
                }
            }
            if (response.data && (response.data.file_id || response.data.id)) {
                const fileId = response.data.file_id || response.data.id;
                this.logger.log(`文件上传成功, 返回的fileId=${fileId}`);
                return { file_id: fileId };
            }
            this.logger.error(`文件上传响应异常: ${JSON.stringify(response.data)}`);
            throw new Error('文件上传响应没有返回文件ID');
        }
        catch (error) {
            this.logger.error(`上传文件失败: ${error.message}`);
            this.logger.error(`错误堆栈: ${error.stack}`);
            if (error.response) {
                this.logger.error(`错误响应: ${JSON.stringify(error.response.data || {})}`);
            }
            throw new common_1.HttpException(error.message || '上传文件失败', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getWorkflowResult(workflowId, executeId, extractField, resultField = 'result_data') {
        try {
            this.logger.log(`查询工作流执行结果, workflowId=${workflowId}, executeId=${executeId}`);
            if (!this.client || !this.client.workflows) {
                throw new Error('CozeAPI客户端未初始化或workflows不可用');
            }
            const api = this.client;
            let result;
            if (api.workflows.runs && typeof api.workflows.runs.get === 'function') {
                this.logger.log('使用runs.get方法获取工作流执行结果');
                result = await api.workflows.runs.get(workflowId, executeId);
            }
            else if (api.workflows.runs && typeof api.workflows.runs.getResult === 'function') {
                this.logger.log('使用runs.getResult方法获取工作流执行结果');
                result = await api.workflows.runs.getResult(workflowId, executeId);
            }
            else if (api.workflows.runs && typeof api.workflows.runs.result === 'function') {
                this.logger.log('使用runs.result方法获取工作流执行结果');
                result = await api.workflows.runs.result(workflowId, executeId);
            }
            else {
                this.logger.log('使用history方法获取工作流执行结果');
                result = await this.getWorkflowHistory(workflowId, executeId);
            }
            this.logger.log(`获取工作流执行结果成功: ${JSON.stringify(result)}`);
            const responseObj = {};
            let isSuccess = false;
            let statusText = '';
            if (extractField) {
                responseObj[extractField] = '';
            }
            responseObj[resultField] = result;
            if (Array.isArray(result) && result.length > 0) {
                const item = result[0];
                if (item.execute_status === 'Success' || item.error_code === '0') {
                    isSuccess = true;
                    statusText = 'Success';
                }
                else {
                    statusText = item.execute_status || item.error_message || 'Unknown';
                }
                responseObj.status = statusText;
                responseObj.success = isSuccess;
                if (isSuccess && extractField && item.output) {
                    try {
                        const outputObj = JSON.parse(item.output);
                        if (outputObj.Output) {
                            const outputData = JSON.parse(outputObj.Output);
                            if (extractField === 'data' && outputData.data) {
                                responseObj.data = outputData.data;
                            }
                            else if (extractField === 'data') {
                                responseObj.data = '';
                            }
                            else if (outputData[extractField]) {
                                responseObj[extractField] = outputData[extractField];
                            }
                        }
                        if (outputObj[extractField]) {
                            responseObj[extractField] = outputObj[extractField];
                        }
                    }
                    catch (parseError) {
                        this.logger.error(`解析输出字段失败: ${parseError.message}`);
                        responseObj.parse_error = parseError.message;
                    }
                }
            }
            else if (result.status) {
                let status = result.status;
                if (typeof status === 'number') {
                    switch (status) {
                        case 0:
                            statusText = 'QUEUED';
                            break;
                        case 1:
                            statusText = 'RUNNING';
                            break;
                        case 2:
                            statusText = 'SUCCEEDED';
                            isSuccess = true;
                            break;
                        case 3:
                            statusText = 'FAILED';
                            break;
                        case 4:
                            statusText = 'TIMED_OUT';
                            break;
                        default:
                            statusText = `UNKNOWN(${status})`;
                    }
                }
                else {
                    statusText = status;
                    isSuccess = (status === 'SUCCEEDED');
                }
                responseObj.status = statusText;
                responseObj.success = isSuccess;
                if (isSuccess && extractField && result.output) {
                    try {
                        const outputData = JSON.parse(result.output);
                        if (extractField === 'data' && outputData.data) {
                            responseObj.data = outputData.data;
                        }
                        else if (extractField === 'data') {
                            responseObj.data = '';
                        }
                        else if (outputData[extractField]) {
                            responseObj[extractField] = outputData[extractField];
                        }
                    }
                    catch (parseError) {
                        this.logger.error(`解析输出字段失败: ${parseError.message}`);
                        responseObj.parse_error = parseError.message;
                    }
                }
            }
            if (extractField && !responseObj[extractField]) {
                responseObj[extractField] = '';
            }
            return responseObj;
        }
        catch (error) {
            this.logger.error(`获取工作流执行结果失败: ${error.message}`);
            this.logger.error(`错误堆栈: ${error.stack}`);
            throw new common_1.HttpException(error.message || '获取工作流执行结果失败', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getAccessToken() {
        if (this.accessToken) {
            return this.accessToken;
        }
        try {
            this.logger.log('尝试获取JWT Token');
            const token = await (0, api_1.getJWTToken)({
                baseURL: api_1.COZE_CN_BASE_URL,
                appId: this.defaultConfig.coze_client_id,
                aud: 'api.coze.cn',
                keyid: this.defaultConfig.coze_public_key_id,
                privateKey: this.defaultConfig.coze_private_key,
            });
            if (token && token.access_token) {
                this.logger.log(`JWT Token获取成功: ${token.access_token.substring(0, 10)}...`);
                this.accessToken = token.access_token;
                return token.access_token;
            }
            else {
                this.logger.error('JWT Token获取失败: 返回结果为空或无效');
                throw new Error('Invalid token response');
            }
        }
        catch (tokenError) {
            this.logger.error(`JWT Token获取失败: ${tokenError.message}`, tokenError.stack);
            throw tokenError;
        }
    }
};
CozeService = CozeService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(coze_entity_1.CozeEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        axios_1.HttpService])
], CozeService);
exports.CozeService = CozeService;
