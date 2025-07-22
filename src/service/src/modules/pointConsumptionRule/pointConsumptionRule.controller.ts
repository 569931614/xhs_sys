import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { PointConsumptionRuleService } from './pointConsumptionRule.service';
import { PointConsumptionRuleEntity } from './pointConsumptionRule.entity';
import { JwtAuthGuard } from '../../common/auth/jwtAuth.guard';
import { RoleGuard } from '../../common/auth/role.guard';
import { RequiresRoles } from '../../common/decorator/role.decorator';

@ApiTags('积分消耗规则')
@Controller('point-consumption-rule')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PointConsumptionRuleController {
  constructor(private readonly pointConsumptionRuleService: PointConsumptionRuleService) {}

  @Get('list')
  @ApiOperation({ summary: '获取所有积分消耗规则' })
  @UseGuards(RoleGuard)
  @RequiresRoles(['admin', 'super'])
  async getAllRules() {
    const rules = await this.pointConsumptionRuleService.getAllRules();
    return {
      success: true,
      message: '获取积分消耗规则成功',
      data: rules
    };
  }

  @Get(':id')
  @ApiOperation({ summary: '根据ID获取规则' })
  @ApiParam({ name: 'id', type: 'number', description: '规则ID' })
  @UseGuards(RoleGuard)
  @RequiresRoles(['admin', 'super'])
  async getRuleById(@Param('id') id: number) {
    const rule = await this.pointConsumptionRuleService.getRule(null, null, id);
    return {
      success: !!rule,
      message: rule ? '获取规则成功' : '规则不存在',
      data: rule
    };
  }

  @Get('query')
  @ApiOperation({ summary: '根据套餐ID和功能ID查询规则' })
  @ApiQuery({ name: 'packageId', type: 'number', description: '套餐ID' })
  @ApiQuery({ name: 'functionId', type: 'string', description: '功能ID' })
  async getRuleByQuery(
    @Query('packageId') packageId: number,
    @Query('functionId') functionId: string
  ) {
    const rule = await this.pointConsumptionRuleService.getRule(packageId, functionId);
    return {
      success: true,
      message: '查询规则成功',
      data: rule
    };
  }

  @Post()
  @ApiOperation({ summary: '创建积分消耗规则' })
  @UseGuards(RoleGuard)
  @RequiresRoles(['admin', 'super'])
  async createRule(@Body() ruleData: Partial<PointConsumptionRuleEntity>) {
    const rule = await this.pointConsumptionRuleService.saveRule(ruleData);
    return {
      success: true,
      message: '创建规则成功',
      data: rule
    };
  }

  @Put(':id')
  @ApiOperation({ summary: '更新积分消耗规则' })
  @ApiParam({ name: 'id', type: 'number', description: '规则ID' })
  @UseGuards(RoleGuard)
  @RequiresRoles(['admin', 'super'])
  async updateRule(
    @Param('id') id: number,
    @Body() ruleData: Partial<PointConsumptionRuleEntity>
  ) {
    try {
      // 确保ID保持一致
      ruleData.id = id;
      
      // 直接调用service的saveRule方法，它会处理所有逻辑
      const rule = await this.pointConsumptionRuleService.saveRule(ruleData);
      
      return {
        success: true,
        message: '更新规则成功',
        data: rule
      };
    } catch (error) {
      // 捕获并返回友好的错误信息
      return {
        success: false,
        message: '更新规则失败: ' + error.message,
        error: error.message
      };
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除积分消耗规则' })
  @ApiParam({ name: 'id', type: 'number', description: '规则ID' })
  @UseGuards(RoleGuard)
  @RequiresRoles(['admin', 'super'])
  async deleteRule(@Param('id') id: number) {
    try {
      // 实际上只是将状态设置为0（禁用）
      const ruleData = { id, status: 0 };
      await this.pointConsumptionRuleService.saveRule(ruleData);
      return {
        success: true,
        message: '删除规则成功'
      };
    } catch (error) {
      return {
        success: false,
        message: '删除规则失败',
        error: error.message
      };
    }
  }
} 