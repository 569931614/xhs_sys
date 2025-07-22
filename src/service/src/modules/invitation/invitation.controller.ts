import { Controller, Get, Post, Body, UseGuards, Req, HttpException, HttpStatus, Query, Request, Logger } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwtAuth.guard';
import { InvitationService } from './invitation.service';
import { AcceptInvitationDto } from './dto/acceptInvitation.dto';
import { AuthGuard } from '@nestjs/passport';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { GlobalConfigService } from '../globalConfig/globalConfig.service';

@ApiTags('邀请系统')
@Controller('invitation')
export class InvitationController {
  private readonly logger = new Logger(InvitationController.name);
  
  constructor(
    private readonly invitationService: InvitationService,
    private readonly globalConfigService: GlobalConfigService
  ) {}

  @ApiOperation({ summary: '获取邀请链接' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('link')
  async getInviteLink(@Req() req) {
    try {
      const userId = req.user.id;
      const inviteCode = await this.invitationService.getInviteLink(userId);
      
      // 从全局配置获取域名
      const configDomain = await this.globalConfigService.getConfigs(['siteUrl']);
      this.logger.log(`从全局配置获取域名: ${configDomain}`);
      
      const domain = configDomain || req.headers.origin || 'http://localhost:9002';
      this.logger.log(`最终使用域名: ${domain}`);
      
      const inviteLink = `${domain}/chat#/chat?invite=${inviteCode.split('invite=')[1]}`;
      
      return inviteLink
    } catch (error) {
      this.logger.error(`获取邀请链接失败: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || '获取邀请链接失败',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @ApiOperation({ summary: '获取邀请列表' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('list')
  async getInviteList(@Req() req) {
    try {
      const userId = req.user.id;
      console.log(`正在获取用户ID ${userId} 的邀请列表`);
      
      const list = await this.invitationService.getInviteList(userId);
      console.log(`用户ID ${userId} 的邀请列表:`, JSON.stringify(list));
      
      // 确保返回的数据是数组格式
      let responseData = [];
      
      if (Array.isArray(list)) {
        responseData = list;
      } else if (list && typeof list === 'object') {
        responseData = [list]; // 如果是单个对象，转为数组
      }
      
      // 确保返回的数据包含正确的结构
      return {
        code: 200,
        message: '获取成功',
        data: responseData,
        success: true,
      };
    } catch (error) {
      console.error(`获取邀请列表错误: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || '获取邀请列表失败',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @ApiOperation({ summary: '获取邀请统计信息' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('stats')
  async getInviteStats(@Req() req) {
    try {
      const userId = req.user.id;
      const stats = await this.invitationService.getInviteStats(userId);
      return {
        code: 200,
        message: '获取成功',
        data: stats,
        success: true,
      };
    } catch (error) {
      throw new HttpException(
        error.message || '获取邀请统计失败',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @ApiOperation({ summary: '接受邀请' })
  @Post('accept')
  async acceptInvitation(@Body() acceptDto: AcceptInvitationDto) {
    try {
      const { inviteCode, userId } = acceptDto;
      const result = await this.invitationService.acceptInvitation(inviteCode, userId);
      return {
        code: 200,
        message: '接受邀请成功',
        data: result,
        success: true,
      };
    } catch (error) {
      throw new HttpException(
        error.message || '接受邀请失败',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get('direct-invitees')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取直接邀请的用户列表' })
  @ApiResponse({ status: 200, description: '成功获取邀请列表' })
  async getDirectInvitees(@Req() req) {
    const userId = req.user.id;
    return await this.invitationService.getDirectInvitees(userId);
  }

  @Get('inviter')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取我的邀请人' })
  @ApiResponse({ status: 200, description: '成功获取邀请人信息' })
  async getInviter(@Req() req) {
    const userId = req.user.id;
    return await this.invitationService.getInviter(userId);
  }

  @Get('count')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取我邀请的总人数' })
  @ApiResponse({ status: 200, description: '成功获取邀请总人数' })
  async getTotalInvitees(@Req() req) {
    const userId = req.user.id;
    const directCount = await this.invitationService.getDirectInvitees(userId).then(invitees => invitees.length);
    return { 
      directCount,
      totalCount: await this.invitationService.countTotalInvitees(userId)
    };
  }

  @Get('my-invitations')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '获取我的邀请记录' })
  @ApiResponse({ status: 200, description: '成功获取邀请记录' })
  async getMyInvitations(@Request() req, @Query() paginationDto: PaginationDto) {
    const userId = req.user.id;
    return this.invitationService.getUserInvitations(userId, paginationDto);
  }

  @Get('count')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '获取我的邀请总人数' })
  @ApiResponse({ status: 200, description: '成功获取邀请总人数' })
  async getInvitationCount(@Request() req) {
    const userId = req.user.id;
    const count = await this.invitationService.getUserInvitationCount(userId);
    return { count };
  }

  @Get('my-inviter')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '获取我的邀请人' })
  @ApiResponse({ status: 200, description: '成功获取邀请人信息' })
  async getMyInviter(@Request() req) {
    const userId = req.user.id;
    return this.invitationService.getUserInviter(userId);
  }
} 