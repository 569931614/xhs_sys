import { Injectable, Logger } from '@nestjs/common';
import { UserBalanceService } from '../userBalance/userBalance.service';

/**
 * 通用积分验证助手类
 * 提供统一的积分验证、扣除和退款功能
 */
@Injectable()
export class PointValidationHelper {
  private readonly logger = new Logger(PointValidationHelper.name);

  constructor(private readonly userBalanceService: UserBalanceService) {}

  /**
   * 验证用户积分是否足够
   * @param userId 用户ID
   * @param functionId 功能ID
   * @param requestType 请求类型
   * @returns 验证结果
   */
  async validatePoint(
    userId: number,
    functionId: string,
    requestType?: number,
  ): Promise<{ success: boolean; validationResult: any; message: string }> {
    try {
      this.logger.log(`开始验证积分 [用户:${userId}, 功能:${functionId}]`);
      
      // 调用UserBalanceService的validateBalance方法验证积分
      const validationResult = await this.userBalanceService.validateBalance(
        userId,
        functionId,
        requestType,
      );

      // 根据validateBalance的返回类型调整判断
      if (validationResult === false) {
        this.logger.warn(
          `积分验证失败 [用户:${userId}, 功能:${functionId}]`,
        );
        return {
          success: false,
          validationResult,
          message: '积分不足',
        };
      }

      this.logger.log(
        `积分验证成功 [用户:${userId}, 功能:${functionId}]`,
      );
      return {
        success: true,
        validationResult,
        message: '积分验证通过',
      };
    } catch (error) {
      this.logger.error(
        `积分验证过程出错 [用户:${userId}, 功能:${functionId}]: ${error.message}`,
        error.stack,
      );
      return {
        success: false,
        validationResult: null,
        message: `验证过程出错: ${error.message}`,
      };
    }
  }

  /**
   * 扣除用户积分
   * @param userId 用户ID
   * @param functionId 功能ID
   * @param deductInfo 扣除信息对象
   * @returns 扣除结果
   */
  async deductPoint(
    userId: number,
    functionId: string,
    deductInfo: {
      deductType: number;
      amount: number;
      requestType?: number;
    },
  ): Promise<{ success: boolean; deducted: boolean; message: string; deductResult?: any }> {
    try {
      const { deductType, amount, requestType = 0 } = deductInfo;
      
      this.logger.log(
        `开始扣除积分 [用户:${userId}, 功能:${functionId}, 类型:${deductType}, 数量:${amount}]`,
      );
      
      // 调用UserBalanceService的deductFromBalance方法扣除积分
      const deductResult = await this.userBalanceService.deductFromBalance(
        userId,
        deductType,
        amount,
        requestType,
        functionId,
      );

      // 处理可能的错误情况，根据deductFromBalance的实际返回值调整
      if (!deductResult) {
        this.logger.warn(
          `积分扣除失败 [用户:${userId}, 功能:${functionId}]: 未返回有效结果`,
        );
        return {
          success: false,
          deducted: false,
          message: '积分扣除失败：系统返回无效结果',
          deductResult,
        };
      }

      this.logger.log(
        `积分扣除成功 [用户:${userId}, 功能:${functionId}, 类型:${deductType}, 数量:${amount}]`,
      );
      return {
        success: true,
        deducted: true,
        message: '积分扣除成功',
        deductResult,
      };
    } catch (error) {
      this.logger.error(
        `积分扣除过程出错 [用户:${userId}, 功能:${functionId}]: ${error.message}`,
        error.stack,
      );
      return {
        success: false,
        deducted: false,
        message: `扣除过程出错: ${error.message}`,
      };
    }
  }

  /**
   * 退还用户积分
   * @param userId 用户ID
   * @param functionId 功能ID
   * @param refundInfo 退款信息对象
   * @returns 退款结果
   */
  async refundPoint(
    userId: number,
    functionId: string,
    refundInfo: {
      deductType: number;
      amount: number;
    },
  ): Promise<{ success: boolean; refunded: boolean; message: string }> {
    try {
      const { deductType, amount } = refundInfo;
      
      this.logger.log(
        `开始退还积分 [用户:${userId}, 功能:${functionId}, 类型:${deductType}, 数量:${amount}]`,
      );
      
      // 调用UserBalanceService的refundFunctionPoints方法退还积分
      const refundResult = await this.userBalanceService.refundFunctionPoints(
        userId,
        functionId,
        deductType,
        amount,
      );

      // 处理refundFunctionPoints的返回结果
      if (!refundResult || !refundResult.success) {
        this.logger.warn(
          `积分退还失败 [用户:${userId}, 功能:${functionId}]: ${refundResult?.message || '未知错误'}`,
        );
        return {
          success: false,
          refunded: false,
          message: refundResult?.message || '积分退还失败',
        };
      }

      this.logger.log(
        `积分退还成功 [用户:${userId}, 功能:${functionId}, 类型:${deductType}, 数量:${amount}]`,
      );
      return {
        success: true,
        refunded: true,
        message: '积分退还成功',
      };
    } catch (error) {
      this.logger.error(
        `积分退还过程出错 [用户:${userId}, 功能:${functionId}]: ${error.message}`,
        error.stack,
      );
      return {
        success: false,
        refunded: false,
        message: `退还过程出错: ${error.message}`,
      };
    }
  }

  /**
   * 执行带积分验证的任务
   * 先验证积分，验证通过后执行任务，任务执行成功后扣除积分，任务执行失败则不扣除积分
   * @param userId 用户ID
   * @param functionId 功能ID
   * @param deductInfo 扣除信息对象
   * @param task 要执行的任务函数
   * @returns 任务执行结果
   */
  async executeWithPointValidation<T>(
    userId: number,
    functionId: string,
    deductInfo: {
      deductType: number;
      amount: number;
      requestType?: number;
    },
    task: () => Promise<T>,
  ): Promise<{ success: boolean; data?: T; message: string }> {
    try {
      // 1. 验证积分
      const validateResult = await this.validatePoint(
        userId,
        functionId,
        deductInfo.requestType,
      );

      if (!validateResult.success) {
        return {
          success: false,
          message: validateResult.message,
        };
      }

      try {
        // 2. 执行任务
        this.logger.log(`开始执行任务 [用户:${userId}, 功能:${functionId}]`);
        const taskResult = await task();

        // 3. 扣除积分
        const deductResult = await this.deductPoint(userId, functionId, deductInfo);

        if (!deductResult.success) {
          this.logger.warn(
            `任务成功但积分扣除失败 [用户:${userId}, 功能:${functionId}]: ${deductResult.message}`,
          );
          // 任务已经执行成功，即使积分扣除失败也返回成功结果，但记录警告日志
          return {
            success: true,
            data: taskResult,
            message: '操作成功，但积分扣除失败',
          };
        }

        return {
          success: true,
          data: taskResult,
          message: '操作成功',
        };
      } catch (taskError) {
        // 任务执行失败，不扣除积分
        this.logger.error(
          `任务执行失败 [用户:${userId}, 功能:${functionId}]: ${taskError.message}`,
          taskError.stack,
        );
        return {
          success: false,
          message: `操作失败: ${taskError.message}`,
        };
      }
    } catch (error) {
      this.logger.error(
        `带积分验证的任务执行过程出错 [用户:${userId}, 功能:${functionId}]: ${error.message}`,
        error.stack,
      );
      return {
        success: false,
        message: `执行过程出错: ${error.message}`,
      };
    }
  }
} 