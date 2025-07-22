import { JwtAuthGuard } from '@/common/auth/jwtAuth.guard';
import { Public } from '@/common/decorators/public.decorator';
import { formatUrl } from '@/common/utils';
import {
  Body,
  Controller,
  Get,
  Logger,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { GetQrCodeDto } from './dto/getQrCode.dto';
import { OfficialService } from './official.service';

@ApiTags('official')
@Controller('official')
export class OfficialController {
  private readonly logger = new Logger(OfficialController.name);
  private requestLimiter = {}; // 用于跟踪客户端请求频率
  
  constructor(private readonly officialService: OfficialService) {}

  @Public()
  @Get('notify')
  @ApiOperation({ summary: '公众号通知接口GET' })
  async notify(@Req() req, @Query() query, @Body() body) {
    this.logger.log(`GET notify 请求开始处理 - IP: ${req.ip}, 查询参数: ${JSON.stringify(query)}`);
    try {
      console.log('get 通知>>>', query, body);
      this.logger.log(`验证参数: signature=${query.signature}, nonce=${query.nonce}, timestamp=${query.timestamp}`);
      
      const result = await this.officialService.verify(
        query.signature,
        query.nonce,
        query.timestamp
      );
      
      this.logger.log(`验证结果: ${result ? '成功' : '失败'}, 返回: ${result ? query.echostr : ''}`);
      return result ? query.echostr : '';
    } catch (error) {
      this.logger.error(`GET notify 处理异常: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Public()
  @Post('notify')
  @ApiOperation({ summary: '公众号通知接口POST' })
  async notifyPost(@Req() req, @Query() query, @Body() xmlData, @Res() res) {
    this.logger.log(`POST notify 请求开始处理 - IP: ${req.ip}, 查询参数: ${JSON.stringify(query)}`);
    try {
      const { xml } = xmlData;
      console.log('xml: ', xml);
      this.logger.log(`接收到XML数据: ${JSON.stringify(xml || {})}`);
      
      if (!xml) {
        this.logger.error('接收到的XML数据为空或格式错误');
        return res.status(400).send('Invalid XML format');
      }
      
      /* 扫码 */
      if (xml.msgtype && xml.msgtype[0] == 'event') {
        this.logger.log(`处理事件类型消息: ${xml.event ? xml.event[0] : '未知'}`);
        
        if (xml.event && (xml.event[0] == 'VIEW' || xml.event[0] == 'CLICK')) {
          this.logger.log('VIEW或CLICK事件，直接返回空响应');
          return res.status(200).send('');
        }
        
        /* 扫码 */
        if (xml.event && xml.event[0] == 'SCAN') {
          console.log('扫码');
          this.logger.log(`处理SCAN事件, FromUser: ${xml.fromusername ? xml.fromusername[0] : '未知'}`);
          
          const sceneStr = xml.eventkey ? xml.eventkey[0] : '';
          this.logger.log(`场景值: ${sceneStr}`);
          
          /* 绑定微信以/区分 */
          if (sceneStr && sceneStr.includes('/')) {
            this.logger.log(`处理绑定微信场景`);
            this.officialService.scanBindWx(xml.fromusername[0], sceneStr);
            const xmlMsg = await this.officialService.genXmlMsgByConfig(
              xml,
              'officialBindAccountText'
            );
            this.logger.log(`返回绑定账号消息`);
            return res.status(200).send(xmlMsg);
          }
          
          this.logger.log(`处理普通扫码场景`);
          this.officialService.scan(xml.fromusername[0], sceneStr);
          const xmlMsg = await this.officialService.genXmlMsgByConfig(
            xml,
            'officialScanLoginText'
          );
          this.logger.log(`返回扫码登录消息`);
          return res.status(200).send(xmlMsg);
        }

        /* 订阅 */
        if (xml.event && xml.event[0] == 'subscribe') {
          console.log('订阅', xml.eventkey ? xml.eventkey[0] : '无EventKey');
          this.logger.log(`处理订阅事件, EventKey: ${xml.eventkey ? xml.eventkey[0] : '无EventKey'}`);
          
          let sceneStr = '';
          if (xml.eventkey && xml.eventkey[0]) {
            sceneStr = xml.eventkey[0].split('qrscene_')[1];
          }
          
          console.log('sceneStr: ', sceneStr);
          this.logger.log(`提取场景值: ${sceneStr || '无场景值'}`);
          
          /* 没有场景str则是单纯关注了直接返回 */
          if (!sceneStr) {
            this.logger.log(`无场景值，返回订阅欢迎消息`);
            const xmlMsg = await this.officialService.genXmlMsgByConfig(
              xml,
              'officialSubscribeText'
            );
            return res.status(200).send(xmlMsg);
          }
          
          /* 绑定微信以/区分 */
          if (sceneStr.includes('/')) {
            this.logger.log(`绑定微信场景`);
            this.officialService.scanBindWx(xml.fromusername[0], sceneStr);
            const xmlMsg = await this.officialService.genXmlMsgByConfig(
              xml,
              'officialBindAccountText'
            );
            this.logger.log(`返回绑定账号消息`);
            return res.status(200).send(xmlMsg);
          }
          
          this.logger.log(`普通扫码订阅场景`);
          this.officialService.scan(xml.fromusername[0], sceneStr);
          const xmlMsg = await this.officialService.genXmlMsgByConfig(
            xml,
            'officialSubscribeText'
          );
          this.logger.log(`返回订阅欢迎消息`);
          return res.status(200).send(xmlMsg);
        }

        /* 取消订阅 */
        if (xml.event && xml.event[0] == 'unsubscribe') {
          this.logger.log(`处理取消订阅事件, FromUser: ${xml.fromusername ? xml.fromusername[0] : '未知'}`);
          return res.status(200).send('');
        }
      }

      /* 客户端发送了文字消息 */
      if (xml.msgtype && xml.msgtype[0] == 'text') {
        this.logger.log(`处理文本消息, 内容: ${xml.content ? xml.content[0] : '未知'}`);
        try {
          const aotoPlayMsg = await this.officialService.aotoPlay(xml.content[0]);
          this.logger.log(`自动回复内容: ${aotoPlayMsg}`);
          const xmlMsg = await this.officialService.genXmlMsg(xml, aotoPlayMsg);
          this.logger.log(`返回XML消息`);
          return res.status(200).send(xmlMsg);
        } catch (error) {
          this.logger.error(`处理文本消息异常: ${error.message}`, error.stack);
          // 出错时返回默认消息
          const defaultMsg = '抱歉，系统暂时无法处理您的消息';
          const xmlMsg = await this.officialService.genXmlMsg(xml, defaultMsg);
          return res.status(200).send(xmlMsg);
        }
      }
      
      this.logger.log(`未匹配任何消息类型，返回默认成功响应`);
      return res.status(200).send('success');
    } catch (error) {
      this.logger.error(`POST notify 处理异常: ${error.message}`, error.stack);
      // 即使出错也要返回成功以符合微信接口规范
      return res.status(200).send('success');
    }
  }

  @Public()
  @Get('debug-logs')
  @ApiOperation({ summary: '【仅开发环境】查看官方接口日志' })
  async getDebugLogs(@Res() res) {
    // 检查是否开发环境
    if (process.env.ISDEV !== 'TRUE') {
      return res.status(403).send({ message: '此接口仅在开发环境可用' });
    }
    
    try {
      const logDir = path.join(process.cwd(), 'logs');
      const officialLogPath = path.join(logDir, 'official.log');
      const errorLogPath = path.join(logDir, 'error.log');
      
      let officialLogs = '暂无日志';
      let errorLogs = '暂无错误日志';
      
      // 读取官方日志
      if (fs.existsSync(officialLogPath)) {
        const stats = fs.statSync(officialLogPath);
        // 如果文件太大，只读取最后的100KB
        const position = stats.size > 100 * 1024 ? stats.size - 100 * 1024 : 0;
        const buffer = Buffer.alloc(stats.size - position);
        const fd = fs.openSync(officialLogPath, 'r');
        fs.readSync(fd, buffer, 0, buffer.length, position);
        fs.closeSync(fd);
        officialLogs = buffer.toString('utf8');
      }
      
      // 读取错误日志
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
    } catch (error) {
      this.logger.error(`获取日志文件失败: ${error.message}`, error.stack);
      return res.status(500).send({ message: '获取日志文件失败', error: error.message });
    }
  }

  @Post('getQRSceneStr')
  @ApiOperation({ summary: '获取登录二维码sceneStr' })
  async getQRSceneStr() {
    return this.officialService.getQRSceneStr();
  }

  @Post('getQRSceneStrByBind')
  @ApiOperation({ summary: '获取绑定二维码的sceneStr' })
  @UseGuards(JwtAuthGuard)
  async getQRSceneStrByBind(@Req() req: Request) {
    return this.officialService.getQRSceneStrByBind(req);
  }

  @Public()
  @Get('getQRCode')
  @ApiOperation({ summary: '获取二维码' })
  async getQRCode(@Query() query: GetQrCodeDto) {
    if (process.env.ISDEV === 'TRUE') return '';
    
    if (!query.sceneStr) {
      this.logger.error('获取二维码失败: sceneStr参数缺失');
      throw new HttpException('sceneStr参数缺失', HttpStatus.BAD_REQUEST);
    }
    
    try {
    const ticket = await this.officialService.getQRCodeTicket(query.sceneStr);
      
      // 如果没有ticket则抛出错误
      if (!ticket) {
        this.logger.error('获取二维码失败: 无效的ticket');
        throw new HttpException('无效的ticket', HttpStatus.BAD_REQUEST);
      }
      
    const Url = formatUrl(
      process.env.weChatMpUrl || 'https://mp.weixin.qq.com'
    );
    return `${Url}/cgi-bin/showqrcode?ticket=${encodeURIComponent(ticket)}`;
    } catch (error) {
      // 记录错误
      this.logger.error(`获取二维码失败: ${error.message}`, error.stack);
      
      // 如果是已经包装的HttpException则直接抛出
      if (error instanceof HttpException) {
        throw error;
      }
      
      // 否则包装为BadRequest异常
      throw new HttpException(
        error.message || '获取二维码失败',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post('loginBySceneStr')
  @ApiOperation({ summary: '扫码登录轮询查询' })
  async loginBySceneStr(@Req() req: Request, @Body() body: any) {
    const clientIp = req.ip || 'unknown';
    const { sceneStr } = body;
    
    // 如果没有 sceneStr，直接拒绝请求
    if (!sceneStr) {
      throw new HttpException('缺少必要参数', HttpStatus.BAD_REQUEST);
    }
    
    // 初始化 IP 的限制记录
    if (!this.requestLimiter[clientIp]) {
      this.requestLimiter[clientIp] = {};
    }
    
    // 初始化特定 sceneStr 的限制记录
    const limiterKey = `${clientIp}_${sceneStr}`;
    if (!this.requestLimiter[clientIp][sceneStr]) {
      this.requestLimiter[clientIp][sceneStr] = {
        lastRequest: 0,
        count: 0,
        resetTime: Date.now() + 60000 // 1分钟后重置
      };
    }
    
    const now = Date.now();
    const limiter = this.requestLimiter[clientIp][sceneStr];
    
    // 检查是否需要重置计数器
    if (now > limiter.resetTime) {
      limiter.count = 0;
      limiter.resetTime = now + 60000; // 重置时间再延长1分钟
    }
    
    // 检查请求频率 - 每秒不超过1次，每分钟不超过30次
    const timeSinceLastRequest = now - limiter.lastRequest;
    
    if (timeSinceLastRequest < 1000) { // 1秒内重复请求
      throw new HttpException('请求过于频繁，请稍候再试', HttpStatus.TOO_MANY_REQUESTS);
    }
    
    if (limiter.count >= 30) { // 1分钟内超过30次
      throw new HttpException('请求次数超限，请稍候再试', HttpStatus.TOO_MANY_REQUESTS);
    }
    
    // 更新请求记录
    limiter.lastRequest = now;
    limiter.count++;
    
    // 定期清理过期的记录
    if (Math.random() < 0.1) { // 约10%的请求会触发清理操作
      this.cleanupRequestLimiter();
    }
    
    // 请求服务
    return this.officialService.loginBySceneStr(req, body);
  }
  
  // 清理过期的请求限制记录
  private cleanupRequestLimiter() {
    const now = Date.now();
    
    for (const ip in this.requestLimiter) {
      for (const sceneStr in this.requestLimiter[ip]) {
        const limiter = this.requestLimiter[ip][sceneStr];
        
        // 如果超过5分钟没有请求，则删除记录
        if (now - limiter.lastRequest > 300000) {
          delete this.requestLimiter[ip][sceneStr];
        }
      }
      
      // 如果IP下没有任何sceneStr记录，则删除IP记录
      if (Object.keys(this.requestLimiter[ip]).length === 0) {
        delete this.requestLimiter[ip];
      }
    }
  }

  @Post('bindWxBySceneStr')
  @ApiOperation({ summary: '扫码绑定轮询查询' })
  @UseGuards(JwtAuthGuard)
  async bindWxBySceneStr(@Req() req: Request, @Body() body: GetQrCodeDto) {
    return this.officialService.bindWxBySceneStr(req, body.sceneStr);
  }

  @Public()
  @Post('getRedirectUrl')
  @ApiOperation({ summary: '获取登录跳转地址' })
  async getRedirectUrl(@Body() body: { url: string }) {
    return this.officialService.getRedirectUrl(body.url);
  }

  @Public()
  @Post('getJsapiTicket')
  @ApiOperation({ summary: '获取注册配置' })
  async getJsapiTicket(@Body() body: { url: string }) {
    return this.officialService.getJsapiTicket(body.url);
  }

  @Public()
  @Post('loginByCode')
  @ApiOperation({ summary: '公众号静默登录' })
  async loginByCode(@Req() req: Request, @Body() body: { code: string }) {
    return this.officialService.loginByCode(req, body.code);
  }
}
