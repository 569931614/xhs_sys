import { JwtAuthGuard } from '@/common/auth/jwtAuth.guard';
import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { UserBalanceService } from '../userBalance/userBalance.service';
import { PointConsumptionRuleService } from '../pointConsumptionRule/pointConsumptionRule.service';

@ApiTags('user-function')
@Controller('user-function')
export class UserFunctionController {
  constructor(
    private userBalanceService: UserBalanceService,
    private pointConsumptionRuleService: PointConsumptionRuleService,
  ) {}

  @Get('check-access')
  @ApiOperation({ summary: '检查用户是否有权限使用某个功能' })
  @ApiQuery({ name: 'functionId', description: '功能ID', required: true })
  @ApiQuery({ name: 'amount', description: '使用次数', required: false, type: Number })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async checkFunctionAccess(
    @Req() req: Request,
    @Query('functionId') functionId: string,
    @Query('amount') amount: number = 1,
  ) {
    try {
      const userId = req.user.id;
      
      // 获取用户的包ID和功能规则
      const rule = await this.pointConsumptionRuleService.getRule(null, functionId, null);
      
      if (!rule) {
        return {
          success: false,
          isAvailable: false,
          message: '该功能规则不存在',
        };
      }
      
      // 检查isAvailable字段
      if (rule.isAvailable !== 1) {
        return {
          success: true,
          isAvailable: false,
          message: '该功能当前不可用，请升级套餐',
        };
      }
      
      return {
        success: true,
        isAvailable: true,
        rule,
        message: '该功能可用',
      };
    } catch (error) {
      console.error('检查功能权限失败:', error);
      return {
        success: false,
        isAvailable: false,
        message: error.message || '检查功能权限失败',
      };
    }
  }

  @Get('check-point')
  @ApiOperation({ summary: '检查用户对某功能的积分是否足够' })
  @ApiQuery({ name: 'functionId', description: '功能ID', required: true })
  @ApiQuery({ name: 'amount', description: '使用次数', required: false, type: Number })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async checkFunctionPoint(
    @Req() req: Request,
    @Query('functionId') functionId: string,
    @Query('amount') amount: number = 1,
  ) {
    try {
      const userId = req.user.id;
      
      // 检查用户对该功能的积分是否足够
      const result = await this.userBalanceService.validateUserPointForFunction(userId, functionId, amount);
      
      return {
        success: true,
        hasEnoughPoint: result.success,
        pointInfo: result,
        message: result.message,
      };
    } catch (error) {
      console.error('检查功能积分失败:', error);
      return {
        success: false,
        hasEnoughPoint: false,
        message: error.message || '检查功能积分失败',
      };
    }
  }
} 