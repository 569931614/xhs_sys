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
exports.XhsAutoService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("axios");
const crypto = require("crypto-js");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const xhs_signature_entity_1 = require("./xhs-signature.entity");
const redisCache_service_1 = require("../redisCache/redisCache.service");
const schedule_1 = require("@nestjs/schedule");
const typeorm_3 = require("typeorm");
let XhsAutoService = class XhsAutoService {
    get REDIS_XHS_TOKEN_KEY() {
        return `${this.ENV_PREFIX}:xhs:access_token`;
    }
    get REDIS_XHS_TOKEN_EXPIRES_KEY() {
        return `${this.ENV_PREFIX}:xhs:access_token:expires_at`;
    }
    get REDIS_DOUYIN_AUTH_KEY() {
        return `${this.ENV_PREFIX}:douyin:auth_params`;
    }
    get REDIS_DOUYIN_AUTH_EXPIRES_KEY() {
        return `${this.ENV_PREFIX}:douyin:auth_params:expires_at`;
    }
    constructor(signatureRepository, redisCacheService) {
        this.signatureRepository = signatureRepository;
        this.redisCacheService = redisCacheService;
        this.appKey = 'red.PLR6uhfocuZ0kRFs';
        this.appSecret = '6dc7b301dfde6e16b8b9ddd1d02afe98';
        this.ENV_PREFIX = 'dev';
        console.log(`小红书服务初始化，环境: ${this.ENV_PREFIX}`);
    }
    async onModuleInit() {
        console.log('小红书自动服务模块初始化');
        await this.checkAndRefreshTokenIfNeeded();
    }
    async checkTokenStatus() {
        console.log('定期检查小红书access_token状态');
        await this.checkAndRefreshTokenIfNeeded();
    }
    async checkAndRefreshTokenIfNeeded() {
        try {
            const expiresAtFromRedis = await this.redisCacheService.get({
                key: this.REDIS_XHS_TOKEN_EXPIRES_KEY
            });
            const shouldRefresh = !expiresAtFromRedis ||
                Date.now() >= parseInt(expiresAtFromRedis);
            if (shouldRefresh) {
                console.log('定期检查发现token已过期，开始刷新');
                const { nonce, timestamp } = this.generateNonceAndTimestamp();
                await this.refreshAccessToken(nonce, timestamp);
            }
            else {
                console.log('定期检查：token状态正常，无需刷新');
            }
        }
        catch (error) {
            console.error('检查token状态时出错:', error);
        }
    }
    generateNonceAndTimestamp() {
        const nonce = Math.random().toString(36).substring(2);
        const timestamp = Date.now().toString();
        return { nonce, timestamp };
    }
    generateSignature(appKey, nonce, timestamp, secretKey) {
        const params = {
            appKey,
            nonce,
            timeStamp: timestamp,
        };
        const sortedParams = Object.keys(params)
            .sort()
            .map(key => `${key}=${params[key]}`)
            .join('&');
        console.log("sortedParams:" + sortedParams);
        const stringToSign = sortedParams + secretKey;
        console.log("stringToSign:" + stringToSign);
        return crypto.SHA256(stringToSign).toString();
    }
    async getAccessToken() {
        try {
            const tokenFromRedis = await this.redisCacheService.get({
                key: this.REDIS_XHS_TOKEN_KEY
            });
            const expiresAtFromRedis = await this.redisCacheService.get({
                key: this.REDIS_XHS_TOKEN_EXPIRES_KEY
            });
            if (tokenFromRedis && expiresAtFromRedis) {
                if (Date.now() < parseInt(expiresAtFromRedis)) {
                    console.log(`使用Redis缓存的有效token，环境: ${this.ENV_PREFIX}`);
                    return tokenFromRedis;
                }
                else {
                    console.log(`Redis中的token已过期，需要刷新，环境: ${this.ENV_PREFIX}`);
                }
            }
            else {
                console.log(`Redis中未找到有效token，环境: ${this.ENV_PREFIX}`);
            }
            console.log(`需要刷新token，环境: ${this.ENV_PREFIX}`);
            const { nonce, timestamp } = this.generateNonceAndTimestamp();
            const token = await this.refreshAccessToken(nonce, timestamp);
            console.log(`成功刷新token，环境: ${this.ENV_PREFIX}`);
            return token;
        }
        catch (error) {
            console.error(`获取小红书access_token失败，环境: ${this.ENV_PREFIX}:`, error);
            try {
                const tokenFromRedis = await this.redisCacheService.get({
                    key: this.REDIS_XHS_TOKEN_KEY
                });
                if (tokenFromRedis) {
                    console.log(`获取失败，但有Redis缓存的token，使用旧token，环境: ${this.ENV_PREFIX}`);
                    return tokenFromRedis;
                }
            }
            catch (_) {
            }
            throw error;
        }
    }
    async saveTokenToRedis(token, expiresAt) {
        try {
            await this.redisCacheService.set({
                key: this.REDIS_XHS_TOKEN_KEY,
                val: token
            });
            const ttlInSeconds = Math.floor((expiresAt - Date.now()) / 1000);
            await this.redisCacheService.set({
                key: this.REDIS_XHS_TOKEN_EXPIRES_KEY,
                val: expiresAt.toString()
            }, ttlInSeconds > 0 ? ttlInSeconds : undefined);
            console.log(`小红书access_token已保存到Redis，环境: ${this.ENV_PREFIX}，TTL: ${ttlInSeconds}秒`);
        }
        catch (error) {
            console.error(`保存小红书access_token到Redis失败，环境: ${this.ENV_PREFIX}:`, error);
        }
    }
    async refreshAccessToken(nonce, timestamp) {
        const maxRetries = 3;
        const retryDelay = 1000;
        let retryCount = 0;
        while (true) {
            try {
                const signature = this.generateSignature(this.appKey, nonce, timestamp, this.appSecret);
                console.log("请求access_token参数：", {
                    app_key: this.appKey,
                    nonce: nonce,
                    timestamp: timestamp,
                    signature: signature
                });
                const response = await axios_1.default.post('https://edith.xiaohongshu.com/api/sns/v1/ext/access/token', {
                    app_key: this.appKey,
                    nonce: nonce,
                    timestamp: timestamp,
                    signature: signature
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                if (!response.data.success) {
                    throw new Error(`获取access_token失败: ${response.data.msg}, 代码: ${response.data.code}`);
                }
                const { access_token, expires_in } = response.data.data;
                let newExpiresAt = 0;
                if (expires_in) {
                    if (expires_in > Date.now()) {
                        newExpiresAt = expires_in;
                    }
                    else {
                        newExpiresAt = Date.now() + (expires_in * 1000);
                    }
                }
                await this.saveTokenToRedis(access_token, newExpiresAt);
                return access_token;
            }
            catch (error) {
                retryCount++;
                if (retryCount >= maxRetries) {
                    console.error(`刷新token失败，已重试${maxRetries}次，放弃重试:`, error);
                    throw error;
                }
                console.warn(`刷新token失败，${retryCount}/${maxRetries}次，将在${retryDelay / 1000}秒后重试:`, error.message);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                console.log(`开始第${retryCount + 1}次重试获取access_token`);
            }
        }
    }
    async getXhsSignature() {
        console.log('获取小红书分享签名');
        try {
            console.log('生成新的签名');
            try {
                const { nonce, timestamp } = this.generateNonceAndTimestamp();
                const accessToken = await this.getAccessToken();
                console.log('accessToken:' + accessToken);
                const signature = this.generateSignature(this.appKey, nonce, timestamp, accessToken);
                const signatureData = {
                    appKey: this.appKey,
                    nonce: nonce,
                    timestamp: timestamp,
                    signature: signature,
                };
                return signatureData;
            }
            catch (error) {
                console.error('生成新签名失败:', error);
                console.log('生成失败，尝试从数据库获取最新签名');
                const latestSignature = await this.getLatestSignatureFromDB();
                if (latestSignature) {
                    console.log('使用数据库中的签名，创建时间:', latestSignature.createTime);
                    return {
                        appKey: latestSignature.appKey,
                        signature: latestSignature.signature,
                        timestamp: latestSignature.timestamp,
                        nonce: latestSignature.nonce
                    };
                }
                console.log('数据库中无有效签名，尝试从外部API获取签名');
                const apiSignature = await this.getSignatureFromExternalAPI();
                if (apiSignature) {
                    return apiSignature;
                }
                throw error;
            }
        }
        catch (error) {
            console.error('获取小红书分享签名失败:', error);
            throw error;
        }
    }
    async getSignatureFromExternalAPI() {
        try {
            const response = await axios_1.default.post('https://red-sever-pnfbxjccci.cn-hangzhou.fcapp.run/signature', {}, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            console.log('外部API签名响应:', response.data);
            if (response.data) {
                const signatureData = {
                    appKey: response.data.appKey || response.data.app_key,
                    signature: response.data.signature,
                    timestamp: response.data.timestamp,
                    nonce: response.data.nonce
                };
                await this.saveSignatureToDB(signatureData);
                return signatureData;
            }
            return null;
        }
        catch (error) {
            console.error('从外部API获取签名失败:', error);
            return null;
        }
    }
    async getLatestSignatureFromDB() {
        try {
            const ninetyMinutesAgo = new Date();
            ninetyMinutesAgo.setMinutes(ninetyMinutesAgo.getMinutes() - 90);
            const signature = await this.signatureRepository.findOne({
                where: {
                    createTime: (0, typeorm_3.MoreThanOrEqual)(ninetyMinutesAgo)
                },
                order: { createTime: 'DESC' }
            });
            return signature;
        }
        catch (error) {
            console.error('从数据库获取签名失败:', error);
            return null;
        }
    }
    async saveSignatureToDB(signatureData) {
        try {
            const newSignature = new xhs_signature_entity_1.XhsSignature();
            newSignature.appKey = signatureData.appKey;
            newSignature.signature = signatureData.signature;
            newSignature.timestamp = signatureData.timestamp;
            newSignature.nonce = signatureData.nonce;
            newSignature.createTime = new Date();
            await this.signatureRepository.save(newSignature);
            console.log('签名已保存到数据库');
        }
        catch (error) {
            console.error('保存签名到数据库失败:', error);
        }
    }
    async getDouyinAuthParams(userId = '1', activityId = '421312321') {
        try {
            const paramsFromRedis = await this.redisCacheService.get({
                key: this.REDIS_DOUYIN_AUTH_KEY
            });
            const expiresAtFromRedis = await this.redisCacheService.get({
                key: this.REDIS_DOUYIN_AUTH_EXPIRES_KEY
            });
            if (paramsFromRedis && expiresAtFromRedis && Date.now() < parseInt(expiresAtFromRedis)) {
                console.log('使用Redis缓存的抖音认证参数');
                return JSON.parse(paramsFromRedis);
            }
            try {
                console.log('从第一个API获取抖音认证参数');
                const apiUrl = `https://pyp.jzguai.com/shop/api/get_douyin_schema.php?user_id=${userId}&activity_id=${activityId}`;
                const response = await axios_1.default.get(apiUrl);
                if (response.data && response.data.schema_url) {
                    const authParams = this.extractParamsFromSchemaUrl(response.data.schema_url);
                    if (this.validateAuthParams(authParams)) {
                        await this.saveDouyinAuthParamsToRedis(authParams);
                        return authParams;
                    }
                }
            }
            catch (error) {
                console.error('从第一个API获取抖音认证参数失败:', error);
            }
            console.log('从第二个API获取抖音认证参数');
            const secondApiUrl = 'https://nfc.yunmaitui.com/client/touch/douyinPublishNew?uuid=0f53c719-659b-538a-2b09-df869591&id=225683&open_id=null';
            const secondResponse = await axios_1.default.get(secondApiUrl);
            if (!secondResponse.data || !secondResponse.data.data || !secondResponse.data.data.douyin_publish_scheme) {
                throw new Error('从第二个API获取抖音scheme失败');
            }
            const schemaUrl = secondResponse.data.data.douyin_publish_scheme;
            const authParams = this.extractParamsFromSchemaUrl(schemaUrl);
            if (!this.validateAuthParams(authParams)) {
                throw new Error('从第二个API获取的认证参数不完整');
            }
            await this.saveDouyinAuthParamsToRedis(authParams);
            return authParams;
        }
        catch (error) {
            console.error('获取抖音认证参数失败:', error);
            throw error;
        }
    }
    async saveDouyinAuthParamsToRedis(params) {
        try {
            const expiresAt = Date.now() + 1 * 60 * 60 * 1000;
            await this.redisCacheService.set({
                key: this.REDIS_DOUYIN_AUTH_KEY,
                val: JSON.stringify(params)
            });
            const ttlInSeconds = Math.floor((expiresAt - Date.now()) / 1000);
            await this.redisCacheService.set({
                key: this.REDIS_DOUYIN_AUTH_EXPIRES_KEY,
                val: expiresAt.toString()
            }, ttlInSeconds > 0 ? ttlInSeconds : undefined);
            console.log('已保存抖音认证参数到Redis，过期时间:', new Date(expiresAt).toLocaleString());
        }
        catch (error) {
            console.error('保存抖音认证参数到Redis失败:', error);
        }
    }
    extractParamsFromSchemaUrl(schemaUrl) {
        const cleanUrl = schemaUrl.replace(/\\\//g, '/');
        const paramsMatch = cleanUrl.match(/\?(.+)$/);
        if (!paramsMatch) {
            throw new Error('无法解析schema_url参数');
        }
        const urlParams = new URLSearchParams(paramsMatch[1]);
        return {
            client_key: urlParams.get('client_key') || '',
            nonce_str: urlParams.get('nonce_str') || '',
            timestamp: urlParams.get('timestamp') || '',
            signature: urlParams.get('signature') || ''
        };
    }
    validateAuthParams(params) {
        return !!(params.client_key && params.nonce_str && params.timestamp && params.signature);
    }
    async getDouyinSchema(id, userId = '1', activityId = '421312321') {
        try {
            const noteId = parseInt(id, 10);
            const noteRepository = this.signatureRepository.manager.getRepository('xhs_posts');
            const note = await noteRepository.findOne({ where: { id: noteId } });
            if (!note) {
                throw new Error('笔记不存在');
            }
            const authParams = await this.getDouyinAuthParams(userId, activityId);
            try {
                const baseSchema = "snssdk1128://openplatform/share";
                const params = new URLSearchParams();
                params.append('share_type', 'h5');
                params.append('client_key', authParams.client_key);
                params.append('nonce_str', authParams.nonce_str);
                params.append('timestamp', authParams.timestamp);
                params.append('signature', authParams.signature);
                if (note.type === 'video' && note.video) {
                    params.append('video_path', note.video);
                }
                else if (note.images && note.images.length > 0) {
                    if (note.images.length === 1) {
                        params.append('image_path', note.images[0]);
                    }
                    else {
                        params.append('image_list_path', JSON.stringify(note.images));
                    }
                    params.append('feature', 'note');
                }
                let content = note.content || '';
                let title = note.title || '';
                const hashtagRegex = /#([^\s#]+)/g;
                const matches = content.match(hashtagRegex) || [];
                const extractedHashtags = matches.map(tag => tag.substring(1));
                const finalHashtags = [...new Set(extractedHashtags)];
                if (extractedHashtags.length > 0 && content) {
                    const lastHashtagIndex = content.lastIndexOf('#');
                    if (lastHashtagIndex > 0) {
                        let startTrimIndex = lastHashtagIndex;
                        let currentIndex = lastHashtagIndex;
                        while (currentIndex > 0) {
                            const prevHashtagIndex = content.lastIndexOf('#', currentIndex - 1);
                            if (prevHashtagIndex < 0)
                                break;
                            const textBetween = content.substring(prevHashtagIndex, currentIndex).trim();
                            if (textBetween.startsWith('#') && !textBetween.includes('\n\n')) {
                                startTrimIndex = prevHashtagIndex;
                                currentIndex = prevHashtagIndex;
                            }
                            else {
                                break;
                            }
                        }
                        content = content.substring(0, startTrimIndex).trim();
                    }
                }
                if (content) {
                    params.append('title', content);
                }
                if (note.title) {
                    params.append('short_title', note.title);
                }
                if (finalHashtags.length > 0) {
                    params.append('hashtag_list', JSON.stringify(finalHashtags));
                }
                params.append('share_to_publish', '1');
                params.append('share_to_type', '0');
                params.append('state', noteId.toString());
                const finalSchemaUrl = `${baseSchema}?${params.toString()}`;
                console.log('生成的抖音schema:', {
                    title,
                    content_preview: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
                    hashtags: finalHashtags,
                    schema_url_preview: finalSchemaUrl.substring(0, 100) + '...'
                });
                return finalSchemaUrl;
            }
            catch (parseError) {
                console.error('构建抖音schema失败:', parseError);
                throw parseError;
            }
        }
        catch (error) {
            console.error('获取抖音跳转链接失败:', error);
            throw error;
        }
    }
};
__decorate([
    (0, schedule_1.Cron)('0 0 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], XhsAutoService.prototype, "checkTokenStatus", null);
XhsAutoService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(xhs_signature_entity_1.XhsSignature)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        redisCache_service_1.RedisCacheService])
], XhsAutoService);
exports.XhsAutoService = XhsAutoService;
