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
var OfficialController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfficialController = void 0;
const jwtAuth_guard_1 = require("../../common/auth/jwtAuth.guard");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const utils_1 = require("../../common/utils");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const fs = require("fs");
const path = require("path");
const getQrCode_dto_1 = require("./dto/getQrCode.dto");
const official_service_1 = require("./official.service");
let OfficialController = OfficialController_1 = class OfficialController {
    constructor(officialService) {
        this.officialService = officialService;
        this.logger = new common_1.Logger(OfficialController_1.name);
        this.requestLimiter = {};
    }
    async notify(req, query, body) {
        this.logger.log(`GET notify 请求开始处理 - IP: ${req.ip}, 查询参数: ${JSON.stringify(query)}`);
        try {
            console.log('get 通知>>>', query, body);
            this.logger.log(`验证参数: signature=${query.signature}, nonce=${query.nonce}, timestamp=${query.timestamp}`);
            const result = await this.officialService.verify(query.signature, query.nonce, query.timestamp);
            this.logger.log(`验证结果: ${result ? '成功' : '失败'}, 返回: ${result ? query.echostr : ''}`);
            return result ? query.echostr : '';
        }
        catch (error) {
            this.logger.error(`GET notify 处理异常: ${error.message}`, error.stack);
            throw error;
        }
    }
    async notifyPost(req, query, xmlData, res) {
        this.logger.log(`POST notify 请求开始处理 - IP: ${req.ip}, 查询参数: ${JSON.stringify(query)}`);
        try {
            const { xml } = xmlData;
            console.log('xml: ', xml);
            this.logger.log(`接收到XML数据: ${JSON.stringify(xml || {})}`);
            if (!xml) {
                this.logger.error('接收到的XML数据为空或格式错误');
                return res.status(400).send('Invalid XML format');
            }
            if (xml.msgtype && xml.msgtype[0] == 'event') {
                this.logger.log(`处理事件类型消息: ${xml.event ? xml.event[0] : '未知'}`);
                if (xml.event && (xml.event[0] == 'VIEW' || xml.event[0] == 'CLICK')) {
                    this.logger.log('VIEW或CLICK事件，直接返回空响应');
                    return res.status(200).send('');
                }
                if (xml.event && xml.event[0] == 'SCAN') {
                    console.log('扫码');
                    this.logger.log(`处理SCAN事件, FromUser: ${xml.fromusername ? xml.fromusername[0] : '未知'}`);
                    const sceneStr = xml.eventkey ? xml.eventkey[0] : '';
                    this.logger.log(`场景值: ${sceneStr}`);
                    if (sceneStr && sceneStr.includes('/')) {
                        this.logger.log(`处理绑定微信场景`);
                        this.officialService.scanBindWx(xml.fromusername[0], sceneStr);
                        const xmlMsg = await this.officialService.genXmlMsgByConfig(xml, 'officialBindAccountText');
                        this.logger.log(`返回绑定账号消息`);
                        return res.status(200).send(xmlMsg);
                    }
                    this.logger.log(`处理普通扫码场景`);
                    this.officialService.scan(xml.fromusername[0], sceneStr);
                    const xmlMsg = await this.officialService.genXmlMsgByConfig(xml, 'officialScanLoginText');
                    this.logger.log(`返回扫码登录消息`);
                    return res.status(200).send(xmlMsg);
                }
                if (xml.event && xml.event[0] == 'subscribe') {
                    console.log('订阅', xml.eventkey ? xml.eventkey[0] : '无EventKey');
                    this.logger.log(`处理订阅事件, EventKey: ${xml.eventkey ? xml.eventkey[0] : '无EventKey'}`);
                    let sceneStr = '';
                    if (xml.eventkey && xml.eventkey[0]) {
                        sceneStr = xml.eventkey[0].split('qrscene_')[1];
                    }
                    console.log('sceneStr: ', sceneStr);
                    this.logger.log(`提取场景值: ${sceneStr || '无场景值'}`);
                    if (!sceneStr) {
                        this.logger.log(`无场景值，返回订阅欢迎消息`);
                        const xmlMsg = await this.officialService.genXmlMsgByConfig(xml, 'officialSubscribeText');
                        return res.status(200).send(xmlMsg);
                    }
                    if (sceneStr.includes('/')) {
                        this.logger.log(`绑定微信场景`);
                        this.officialService.scanBindWx(xml.fromusername[0], sceneStr);
                        const xmlMsg = await this.officialService.genXmlMsgByConfig(xml, 'officialBindAccountText');
                        this.logger.log(`返回绑定账号消息`);
                        return res.status(200).send(xmlMsg);
                    }
                    this.logger.log(`普通扫码订阅场景`);
                    this.officialService.scan(xml.fromusername[0], sceneStr);
                    const xmlMsg = await this.officialService.genXmlMsgByConfig(xml, 'officialSubscribeText');
                    this.logger.log(`返回订阅欢迎消息`);
                    return res.status(200).send(xmlMsg);
                }
                if (xml.event && xml.event[0] == 'unsubscribe') {
                    this.logger.log(`处理取消订阅事件, FromUser: ${xml.fromusername ? xml.fromusername[0] : '未知'}`);
                    return res.status(200).send('');
                }
            }
            if (xml.msgtype && xml.msgtype[0] == 'text') {
                this.logger.log(`处理文本消息, 内容: ${xml.content ? xml.content[0] : '未知'}`);
                try {
                    const aotoPlayMsg = await this.officialService.aotoPlay(xml.content[0]);
                    this.logger.log(`自动回复内容: ${aotoPlayMsg}`);
                    const xmlMsg = await this.officialService.genXmlMsg(xml, aotoPlayMsg);
                    this.logger.log(`返回XML消息`);
                    return res.status(200).send(xmlMsg);
                }
                catch (error) {
                    this.logger.error(`处理文本消息异常: ${error.message}`, error.stack);
                    const defaultMsg = '抱歉，系统暂时无法处理您的消息';
                    const xmlMsg = await this.officialService.genXmlMsg(xml, defaultMsg);
                    return res.status(200).send(xmlMsg);
                }
            }
            this.logger.log(`未匹配任何消息类型，返回默认成功响应`);
            return res.status(200).send('success');
        }
        catch (error) {
            this.logger.error(`POST notify 处理异常: ${error.message}`, error.stack);
            return res.status(200).send('success');
        }
    }
    async getDebugLogs(res) {
        if (process.env.ISDEV !== 'TRUE') {
            return res.status(403).send({ message: '此接口仅在开发环境可用' });
        }
        try {
            const logDir = path.join(process.cwd(), 'logs');
            const officialLogPath = path.join(logDir, 'official.log');
            const errorLogPath = path.join(logDir, 'error.log');
            let officialLogs = '暂无日志';
            let errorLogs = '暂无错误日志';
            if (fs.existsSync(officialLogPath)) {
                const stats = fs.statSync(officialLogPath);
                const position = stats.size > 100 * 1024 ? stats.size - 100 * 1024 : 0;
                const buffer = Buffer.alloc(stats.size - position);
                const fd = fs.openSync(officialLogPath, 'r');
                fs.readSync(fd, buffer, 0, buffer.length, position);
                fs.closeSync(fd);
                officialLogs = buffer.toString('utf8');
            }
            if (fs.existsSync(errorLogPath)) {
                const stats = fs.statSync(errorLogPath);
                const position = stats.size > 100 * 1024 ? stats.size - 100 * 1024 : 0;
                const buffer = Buffer.alloc(stats.size - position);
                const fd = fs.openSync(errorLogPath, 'r');
                fs.readSync(fd, buffer, 0, buffer.length, position);
                fs.closeSync(fd);
                errorLogs = buffer.toString('utf8');
            }
            return res.send({
                official: officialLogs,
                error: errorLogs
            });
        }
        catch (error) {
            this.logger.error(`获取日志文件失败: ${error.message}`, error.stack);
            return res.status(500).send({ message: '获取日志文件失败', error: error.message });
        }
    }
    async getQRSceneStr() {
        return this.officialService.getQRSceneStr();
    }
    async getQRSceneStrByBind(req) {
        return this.officialService.getQRSceneStrByBind(req);
    }
    async getQRCode(query) {
        if (process.env.ISDEV === 'TRUE')
            return '';
        if (!query.sceneStr) {
            this.logger.error('获取二维码失败: sceneStr参数缺失');
            throw new common_1.HttpException('sceneStr参数缺失', common_1.HttpStatus.BAD_REQUEST);
        }
        try {
            const ticket = await this.officialService.getQRCodeTicket(query.sceneStr);
            if (!ticket) {
                this.logger.error('获取二维码失败: 无效的ticket');
                throw new common_1.HttpException('无效的ticket', common_1.HttpStatus.BAD_REQUEST);
            }
            const Url = (0, utils_1.formatUrl)(process.env.weChatMpUrl || 'https://mp.weixin.qq.com');
            return `${Url}/cgi-bin/showqrcode?ticket=${encodeURIComponent(ticket)}`;
        }
        catch (error) {
            this.logger.error(`获取二维码失败: ${error.message}`, error.stack);
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException(error.message || '获取二维码失败', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async loginBySceneStr(req, body) {
        const clientIp = req.ip || 'unknown';
        const { sceneStr } = body;
        if (!sceneStr) {
            throw new common_1.HttpException('缺少必要参数', common_1.HttpStatus.BAD_REQUEST);
        }
        if (!this.requestLimiter[clientIp]) {
            this.requestLimiter[clientIp] = {};
        }
        const limiterKey = `${clientIp}_${sceneStr}`;
        if (!this.requestLimiter[clientIp][sceneStr]) {
            this.requestLimiter[clientIp][sceneStr] = {
                lastRequest: 0,
                count: 0,
                resetTime: Date.now() + 60000
            };
        }
        const now = Date.now();
        const limiter = this.requestLimiter[clientIp][sceneStr];
        if (now > limiter.resetTime) {
            limiter.count = 0;
            limiter.resetTime = now + 60000;
        }
        const timeSinceLastRequest = now - limiter.lastRequest;
        if (timeSinceLastRequest < 1000) {
            throw new common_1.HttpException('请求过于频繁，请稍候再试', common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        if (limiter.count >= 30) {
            throw new common_1.HttpException('请求次数超限，请稍候再试', common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        limiter.lastRequest = now;
        limiter.count++;
        if (Math.random() < 0.1) {
            this.cleanupRequestLimiter();
        }
        return this.officialService.loginBySceneStr(req, body);
    }
    cleanupRequestLimiter() {
        const now = Date.now();
        for (const ip in this.requestLimiter) {
            for (const sceneStr in this.requestLimiter[ip]) {
                const limiter = this.requestLimiter[ip][sceneStr];
                if (now - limiter.lastRequest > 300000) {
                    delete this.requestLimiter[ip][sceneStr];
                }
            }
            if (Object.keys(this.requestLimiter[ip]).length === 0) {
                delete this.requestLimiter[ip];
            }
        }
    }
    async bindWxBySceneStr(req, body) {
        return this.officialService.bindWxBySceneStr(req, body.sceneStr);
    }
    async getRedirectUrl(body) {
        return this.officialService.getRedirectUrl(body.url);
    }
    async getJsapiTicket(body) {
        return this.officialService.getJsapiTicket(body.url);
    }
    async loginByCode(req, body) {
        return this.officialService.loginByCode(req, body.code);
    }
};
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('notify'),
    (0, swagger_1.ApiOperation)({ summary: '公众号通知接口GET' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], OfficialController.prototype, "notify", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('notify'),
    (0, swagger_1.ApiOperation)({ summary: '公众号通知接口POST' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], OfficialController.prototype, "notifyPost", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('debug-logs'),
    (0, swagger_1.ApiOperation)({ summary: '【仅开发环境】查看官方接口日志' }),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OfficialController.prototype, "getDebugLogs", null);
__decorate([
    (0, common_1.Post)('getQRSceneStr'),
    (0, swagger_1.ApiOperation)({ summary: '获取登录二维码sceneStr' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], OfficialController.prototype, "getQRSceneStr", null);
__decorate([
    (0, common_1.Post)('getQRSceneStrByBind'),
    (0, swagger_1.ApiOperation)({ summary: '获取绑定二维码的sceneStr' }),
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OfficialController.prototype, "getQRSceneStrByBind", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('getQRCode'),
    (0, swagger_1.ApiOperation)({ summary: '获取二维码' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [getQrCode_dto_1.GetQrCodeDto]),
    __metadata("design:returntype", Promise)
], OfficialController.prototype, "getQRCode", null);
__decorate([
    (0, common_1.Post)('loginBySceneStr'),
    (0, swagger_1.ApiOperation)({ summary: '扫码登录轮询查询' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], OfficialController.prototype, "loginBySceneStr", null);
__decorate([
    (0, common_1.Post)('bindWxBySceneStr'),
    (0, swagger_1.ApiOperation)({ summary: '扫码绑定轮询查询' }),
    (0, common_1.UseGuards)(jwtAuth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, getQrCode_dto_1.GetQrCodeDto]),
    __metadata("design:returntype", Promise)
], OfficialController.prototype, "bindWxBySceneStr", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('getRedirectUrl'),
    (0, swagger_1.ApiOperation)({ summary: '获取登录跳转地址' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OfficialController.prototype, "getRedirectUrl", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('getJsapiTicket'),
    (0, swagger_1.ApiOperation)({ summary: '获取注册配置' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OfficialController.prototype, "getJsapiTicket", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('loginByCode'),
    (0, swagger_1.ApiOperation)({ summary: '公众号静默登录' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], OfficialController.prototype, "loginByCode", null);
OfficialController = OfficialController_1 = __decorate([
    (0, swagger_1.ApiTags)('official'),
    (0, common_1.Controller)('official'),
    __metadata("design:paramtypes", [official_service_1.OfficialService])
], OfficialController);
exports.OfficialController = OfficialController;
