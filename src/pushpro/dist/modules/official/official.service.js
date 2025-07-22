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
var OfficialService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfficialService = void 0;
const utils_1 = require("../../common/utils");
const common_1 = require("@nestjs/common");
const axios_1 = require("axios");
const crypto = require("crypto");
const chat_service_1 = require("../chat/chat.service");
const auth_service_1 = require("./../auth/auth.service");
const autoreply_service_1 = require("./../autoreply/autoreply.service");
const globalConfig_service_1 = require("./../globalConfig/globalConfig.service");
const user_service_1 = require("./../user/user.service");
let OfficialService = OfficialService_1 = class OfficialService {
    constructor(autoreplyService, userService, authService, globalConfigService, chatgptService) {
        this.autoreplyService = autoreplyService;
        this.userService = userService;
        this.authService = authService;
        this.globalConfigService = globalConfigService;
        this.chatgptService = chatgptService;
        this.logger = new common_1.Logger(OfficialService_1.name);
        this.sceneStrMap = {};
        this.scanedSceneStrMap = {};
        this.loginResultCache = {};
    }
    async onModuleInit() {
        this.logger.log('初始化OfficialService，获取微信访问令牌');
        try {
            await this.globalConfigService.getWechatAccessToken(true);
            this.logger.log('成功获取微信访问令牌');
        }
        catch (error) {
            this.logger.error(`获取微信访问令牌失败: ${error.message}`, error.stack);
        }
    }
    async getQRSceneStr() {
        let sceneStr = (0, utils_1.createRandomNonceStr)(32);
        this.sceneStrMap[sceneStr] = true;
        return sceneStr;
    }
    async getQRSceneStrByBind(req) {
        const { id } = req.user;
        const sceneStr = `${(0, utils_1.createRandomNonceStr)(32)}/${id}`;
        this.sceneStrMap[sceneStr] = true;
        return sceneStr;
    }
    async getQRCodeTicket(sceneStr) {
        return this.fetchQRCodeTicket(sceneStr);
    }
    async getRedirectUrl(url) {
        const appId = await this.globalConfigService.getConfigs([
            'wechatOfficialAppId',
        ]);
        const Url = (0, utils_1.formatUrl)(process.env.weChatOpenUrl || 'https://open.weixin.qq.com');
        const res = `${Url}/connect/oauth2/authorize?appid=${appId}&redirect_uri=${encodeURIComponent(url)}&response_type=code&scope=snsapi_base&state=weChatLogin#wechat_redirect`;
        console.log('回跳跳转地址: ', res);
        return res;
    }
    async getJsapiTicket(url) {
        const nonceStr = (0, utils_1.createRandomNonceStr)(32);
        const timestamp = (Date.now() / 1000).toFixed(0);
        const jsapiTicket = await this.globalConfigService.getConfigs([
            'wechatJsapiTicket',
        ]);
        console.log('jsapiTicket: ', jsapiTicket);
        const appId = await this.globalConfigService.getConfigs([
            'wechatOfficialAppId',
        ]);
        console.log('appId: ', appId);
        const str = `jsapi_ticket=${jsapiTicket}&noncestr=${nonceStr}&timestamp=${timestamp}&url=${url}`;
        console.log('str: ', str);
        const signature = this.sha1(str);
        return { appId, nonceStr, timestamp, signature };
    }
    async fetchQRCodeTicket(sceneStr) {
        const accessToken = await this.globalConfigService.getConfigs([
            'wechatAccessToken',
        ]);
        if (!accessToken || typeof accessToken !== 'string' || accessToken.trim() === '') {
            this.logger.error('获取微信二维码失败: access_token missing');
            throw new common_1.HttpException('access_token missing', common_1.HttpStatus.BAD_REQUEST);
        }
        const Url = (0, utils_1.formatUrl)(process.env.weChatApiUrl || 'https://api.weixin.qq.com');
        const params = {
            action_name: 'QR_STR_SCENE',
            action_info: { scene: { scene_str: sceneStr } },
        };
        try {
            const res = await axios_1.default.post(`${Url}/cgi-bin/qrcode/create?access_token=${accessToken}`, params);
            const { data: { errmsg, ticket }, } = res;
            if (errmsg) {
                this.logger.error(`获取微信二维码失败: ${errmsg}`);
                throw new common_1.HttpException(errmsg, common_1.HttpStatus.BAD_REQUEST);
            }
            return ticket;
        }
        catch (error) {
            this.logger.error(`获取微信二维码失败: ${error.message || '未知错误'}`);
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            else {
                throw new common_1.HttpException(error.message || '获取微信二维码失败', common_1.HttpStatus.BAD_REQUEST);
            }
        }
    }
    async loginByCode(req, code) {
        const appId = await this.globalConfigService.getConfigs([
            'wechatOfficialAppId',
        ]);
        const secret = await this.globalConfigService.getConfigs([
            'wechatOfficialAppSecret',
        ]);
        const Url = (0, utils_1.formatUrl)(process.env.weChatApiUrl || 'https://api.weixin.qq.com');
        const res = await axios_1.default.get(`${Url}/sns/oauth2/access_token?appid=${appId}&secret=${secret}&code=${code}&grant_type=authorization_code`);
        const { data: { errmsg, openid }, } = res;
        if (errmsg)
            throw new common_1.HttpException(errmsg, common_1.HttpStatus.BAD_REQUEST);
        let user;
        user = await this.userService.getUserOpenId(openid);
        if (!user) {
            user = await this.userService.getUserFromOpenId(openid);
        }
        return this.authService.loginByOpenId(user, req);
    }
    async scan(openID, sceneStr) {
        this.logger.log(`处理普通扫码 - OpenID: ${openID}, SceneStr: ${sceneStr}`);
        try {
            if (!this.sceneStrMap[sceneStr]) {
                this.logger.error(`非法参数: 未找到的 sceneStr ${sceneStr}`);
                throw new common_1.HttpException('非法参数', common_1.HttpStatus.BAD_REQUEST);
            }
            const user = await this.userService.getUserFromOpenId(openID, sceneStr);
            this.logger.log(`User found: ${user ? user.id : 'No user found'}`, 'OfficialService');
            this.scanedSceneStrMap[sceneStr] = user.id;
            this.logger.log(`已将扫码信息保存到scanedSceneStrMap, 当前map大小: ${Object.keys(this.scanedSceneStrMap).length}`);
        }
        catch (error) {
            this.logger.error('Error in scan method:', error.message);
            this.logger.error('Stack trace:', error.stack);
            throw new common_1.HttpException('处理扫码事件时发生错误', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async loginBySceneStr(req, body) {
        const { sceneStr } = body;
        if (!this.sceneStrMap[sceneStr])
            return;
        const userId = this.scanedSceneStrMap[sceneStr];
        if (!userId)
            return '';
        if (!this.loginResultCache) {
            this.loginResultCache = {};
        }
        const cacheKey = `${sceneStr}_${userId}`;
        const now = Date.now();
        if (this.loginResultCache[cacheKey] && now - this.loginResultCache[cacheKey].timestamp < 30000) {
            return this.loginResultCache[cacheKey].result;
        }
        this.logger.log(`查询用户信息 - 用户ID: ${userId}, SceneStr: ${sceneStr}`);
        const user = await this.userService.getUserById(userId);
        delete this.scanedSceneStrMap[sceneStr];
        const result = await this.authService.loginByOpenId(user, req);
        this.loginResultCache[cacheKey] = {
            timestamp: now,
            result: result
        };
        setTimeout(() => {
            delete this.loginResultCache[cacheKey];
        }, 30000);
        return result;
    }
    async scanBindWx(openId, sceneStr) {
        this.logger.log(`处理绑定微信扫码 - OpenID: ${openId}, SceneStr: ${sceneStr}`);
        try {
            if (!this.sceneStrMap[sceneStr])
                throw new common_1.HttpException('非法参数', common_1.HttpStatus.BAD_REQUEST);
            const userId = sceneStr.split('/')[1];
            const bindRes = await this.userService.bindWx(openId, userId);
            this.scanedSceneStrMap[sceneStr] = bindRes;
            this.logger.log(`已将绑定状态保存到scanedSceneStrMap, 当前map大小: ${Object.keys(this.scanedSceneStrMap).length}`);
        }
        catch (error) {
            this.logger.error(`处理绑定微信扫码时出错: ${error.message}`, error.stack);
        }
    }
    async bindWxBySceneStr(req, sceneStr) {
        if (!this.sceneStrMap[sceneStr])
            throw new common_1.HttpException('非法参数', common_1.HttpStatus.BAD_REQUEST);
        const { id } = req.user;
        const res = this.scanedSceneStrMap[sceneStr];
        if (!res)
            return '';
        delete this.scanedSceneStrMap[sceneStr];
        return res;
    }
    async verify(signature, nonce, timestamp) {
        this.logger.log(`验证微信签名 - signature: ${signature}, nonce: ${nonce}, timestamp: ${timestamp}`);
        try {
            const token = await this.globalConfigService.getConfigs(['wechatOfficialToken']);
            if (!token) {
                this.logger.warn('未找到wechatOfficialToken配置');
                return false;
            }
            this.logger.log(`获取到token: ${token.substring(0, 2)}...${token.slice(-2)}`);
            const str = [token, nonce, timestamp].sort().join('');
            this.logger.log(`排序后的字符串: ${str.substring(0, 10)}...`);
            const calculatedSignature = await this.sha1(str);
            this.logger.log(`计算的签名: ${calculatedSignature}`);
            const isValid = calculatedSignature === signature;
            this.logger.log(`签名验证结果: ${isValid ? '有效' : '无效'}`);
            return isValid;
        }
        catch (error) {
            this.logger.error(`验证签名时出错: ${error.message}`, error.stack);
            return false;
        }
    }
    sha1(data) {
        this.logger.debug(`计算SHA1哈希值 - 数据长度: ${data.length}`);
        return crypto.createHash('sha1').update(data).digest('hex');
    }
    async genXmlMsgByConfig(xmlData, msgKey) {
        this.logger.log(`生成XML消息，使用配置键: ${msgKey}`);
        try {
            const msg = await this.globalConfigService.getConfigs([msgKey]);
            this.logger.log(`获取到消息配置: ${msgKey} = ${msg ? (msg.length > 30 ? msg.substring(0, 30) + '...' : msg) : '未找到'}`);
            return this.genXmlMsg(xmlData, msg);
        }
        catch (error) {
            this.logger.error(`生成XML消息配置时出错: ${error.message}`, error.stack);
            return this.genXmlMsg(xmlData, '系统繁忙，请稍后再试');
        }
    }
    async genXmlMsg(xmlData, msg) {
        this.logger.log(`生成回复XML消息 - 目标用户: ${xmlData.fromusername ? xmlData.fromusername[0] : '未知'}`);
        const xmlTemplate = `
    <xml>
        <ToUserName><![CDATA[${xmlData.fromusername[0]}]]></ToUserName>
        <FromUserName><![CDATA[${xmlData.tousername[0]}]]></FromUserName>
        <CreateTime>${new Date().getTime()}</CreateTime>
        <MsgType><![CDATA[text]]></MsgType>
        <Content><![CDATA[${msg}]]></Content>
    </xml>`;
        this.logger.debug(`生成的XML消息: ${xmlTemplate.length > 100 ? xmlTemplate.substring(0, 100) + '...' : xmlTemplate}`);
        return xmlTemplate;
    }
    async aotoPlay(msg) {
        this.logger.log(`处理自动回复请求 - 消息内容: ${msg}`);
        const timeoutPromise = new Promise((resolve, reject) => {
            setTimeout(() => {
                this.logger.warn('自动回复请求超时');
                reject(new Error('请求超时'));
            }, 4800);
        });
        try {
            this.logger.log('获取officialAutoReplyText配置');
            const configValue = await this.globalConfigService.getConfigs(['officialAutoReplyText']);
            if (!configValue) {
                this.logger.warn('未找到officialAutoReplyText配置，使用默认回复文本');
            }
            let question = configValue ||
                '由于公众号的回复限制、过长的问题我们可能无法回复、您可以前往我们的官方站点享受更加完善的服务、如果您有更多问题、欢迎像我提问！';
            this.logger.log(`返回自动回复: ${question.length > 30 ? question.substring(0, 30) + '...' : question}`);
            return question;
        }
        catch (error) {
            this.logger.error(`自动回复处理出错: ${error.message}`, error.stack);
            return '系统繁忙，请稍后再试';
        }
    }
};
OfficialService = OfficialService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [autoreply_service_1.AutoreplyService,
        user_service_1.UserService,
        auth_service_1.AuthService,
        globalConfig_service_1.GlobalConfigService,
        chat_service_1.ChatService])
], OfficialService);
exports.OfficialService = OfficialService;
