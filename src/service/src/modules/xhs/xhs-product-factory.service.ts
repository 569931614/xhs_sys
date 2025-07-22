import { Injectable, Logger, HttpException, HttpStatus, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { XhsActivity } from './xhs-activity.entity';
import { XhsProductFactory } from './xhs-product-factory.entity';
import { ConfigService } from '@nestjs/config';
import { CozeService } from '../coze/coze.service';
import { Cron } from '@nestjs/schedule';
import { UserBalanceService } from '../userBalance/userBalance.service';
import { PointConsumptionRuleService } from '../pointConsumptionRule/pointConsumptionRule.service';
import { MaterialService } from '../material/material.service';
import { Note } from '../xiaohongshu/note.entity';
import { NoteTemplate } from '../xiaohongshu/notetemplate.entity';
import { NoteTemplateRelation } from '../xiaohongshu/note-template-relation.entity';
import { HtmlTemplateEntity } from '../htmllib/htmllib.entity';
import { HtmlRenderService } from '../htmllib/html-render.service';
import { TextReplacementItem } from '../htmllib/dto/htmllib-render.dto';

@Injectable()
export class XhsProductFactoryService {
  private readonly logger = new Logger(XhsProductFactoryService.name);

  constructor(
    @InjectRepository(XhsActivity)
    private readonly xhsActivityRepository: Repository<XhsActivity>,
    @InjectRepository(XhsProductFactory)
    private readonly xhsProductFactoryRepository: Repository<XhsProductFactory>,
    @InjectRepository(Note)
    private readonly noteRepository: Repository<Note>,
    @InjectRepository(NoteTemplate)
    private readonly noteTemplateRepository: Repository<NoteTemplate>,
    @InjectRepository(NoteTemplateRelation)
    private readonly noteTemplateRelationRepository: Repository<NoteTemplateRelation>,
    @InjectRepository(HtmlTemplateEntity)
    private readonly htmlTemplateRepository: Repository<HtmlTemplateEntity>,
    private readonly configService: ConfigService,
    private readonly cozeService: CozeService,
    private readonly userBalanceService: UserBalanceService,
    private readonly pointConsumptionRuleService: PointConsumptionRuleService,
    private readonly materialService: MaterialService,
    private readonly htmlRenderService: HtmlRenderService
  ) {}

  /**
   * 获取用户的活动列表
   * @param userId 用户ID
   * @returns 活动列表
   */
  async getUserActivities(userId: string) {
    try {
      // 获取用户可见的活动列表
      const activities = await this.xhsActivityRepository.find({
        where: { status: 'active' }, // active表示活动可用
        select: ['id', 'name', 'type'],
        order: { createTime: 'DESC' },
      });

      return activities.map(activity => ({
        id: activity.id,
        name: activity.name,
        type: activity.type
      }));
    } catch (error) {
      this.logger.error(`获取用户活动列表失败: ${error.message}`, error.stack);
      throw new Error('获取活动列表失败');
    }
  }

  /**
   * 生成产品内容
   * @param userId 用户ID
   * @param brandProduct 品牌产品
   * @param title 标题
   * @param activityId 活动ID
   * @param fileIds 文件ID数组
   * @param req 请求对象
   * @param batchCount 批次数量
   * @param titleList 选题列表
   * @param useMaterialLibrary 是否使用素材库
   * @param materialIds 素材ID列表
   * @param materialCount 每次使用素材数量
   * @param useFolders 是否使用文件夹
   * @param folderIds 文件夹ID列表
   * @param folderMaterialCount 每个文件夹使用素材数量
   * @param templateIds 选择的笔记模板ID列表
   * @param information 补充信息
   * @returns 生成的任务ID
   */
  async generateProduct(
    userId: string,
    brandProduct: string,
    title: string,
    activityId: string,
    fileIds: string[],
    req: any,
    batchCount: number = 1,
    titleList?: string[],
    useMaterialLibrary?: boolean,
    materialIds?: string[],
    materialCount?: number,
    useFolders?: boolean,
    folderIds?: string[],
    folderMaterialCount?: number,
    templateIds?: string[],
    information?: string
  ) {
    try {
      // 记录简要的参数日志，删除详细输出
      this.logger.log(`[generateProduct] 开始生成产品内容: userId=${userId}, brandProduct=${brandProduct}, 批次=${batchCount}`);
      
      // 确保batchCount是数字类型
      if (typeof batchCount === 'string') {
        batchCount = parseInt(batchCount);
      }

      // 验证活动是否存在
      const activity = await this.xhsActivityRepository.findOne({
        where: { id: activityId, status: 'active' },
      });

      if (!activity) {
        throw new Error('活动不存在或已结束');
      }

      // 准备选题列表
      let finalTitleList: string[] = [];
      if (titleList && titleList.length > 0) {
        // 如果提供了选题列表，使用它
        finalTitleList = [...titleList];
      } else {
        // 否则只使用单个title
        finalTitleList = [title];
      }

      // 如果选题数量小于批次数量，则循环使用选题列表
      while (finalTitleList.length < batchCount) {
        finalTitleList = [...finalTitleList, ...finalTitleList];
      }
      
      // 截取需要的选题数量
      finalTitleList = finalTitleList.slice(0, batchCount);

      // 清理所有选题中的批量标识内容
      finalTitleList = finalTitleList.map(title => {
        // 清理选题中的批量标识内容
        let cleanTitle = title;
        // 仅移除可能的批次标识，如"[1/5]"、"(1/5)"、"【1/5】"等括号类格式
        cleanTitle = cleanTitle.replace(/[\[\(（【]\s*\d+\s*\/\s*\d+\s*[\]\)）】]/g, '').trim();
        return cleanTitle;
      });
      
      // 积分验证和扣除相关变量
      const functionId = 'xhs_note'; // 功能ID，用于查找消耗规则
      const userId_num = parseInt(userId);
      let pointValidated = false;
      let pointDeducted = false;
      
      // 生成批次ID - 用于批量生成任务的关联（当有多个任务时）
      const batchId = actualTaskCount > 1 ? `batch_${Date.now()}_${userId.substring(0, 5)}` : null;
      
      // 实际任务数就是用户指定的生成数量（batchCount），不需要乘以模板数
      const effectiveTemplateCount = templateIds && templateIds.length > 0 ? templateIds.length : 1;
      const actualTaskCount = batchCount; // 用户指定要生成多少篇，就创建多少个任务

      this.logger.log(`[积分计算] 要生成篇数: ${batchCount}, 可用模板数: ${effectiveTemplateCount}, 实际任务数: ${actualTaskCount}`);

      // 根据实际任务数量计算所需积分
      let totalConsumeValue = 0;

      // 先验证用户是否有足够积分 - 传入实际任务数量
      const pointValidation = await this.userBalanceService.validateUserPointForFunction(userId_num, functionId, actualTaskCount);

      if (!pointValidation.success) {
        this.logger.error(`[积分验证] 用户积分验证失败: ${pointValidation.message}`);
        return {
          success: false,
          message: pointValidation.message || '积分不足，请充值后再试',
          error: pointValidation.error || '积分不足'
        };
      }

      // 计算批量生成的总积分消耗 - validateUserPointForFunction中已经包含了任务数计算
      totalConsumeValue = pointValidation.consumeValue;

      // 再次验证用户是否有足够积分进行批量生成
      if (actualTaskCount > 1) {
        const baseBalance = pointValidation.availableBalance || 0;
        if (baseBalance < totalConsumeValue) {
          this.logger.error(`[批量积分验证] 用户积分不足以进行${actualTaskCount}个任务生成，需要${totalConsumeValue}，当前仅有${baseBalance}`);
          return {
            success: false,
            message: `生成${actualTaskCount}个任务需要${totalConsumeValue}积分，当前仅有${baseBalance}积分`,
            error: '积分不足以进行批量生成'
          };
        }
      }

      this.logger.log(`[积分验证] 用户ID: ${userId} 积分验证通过，类型: ${pointValidation.deductType}, 消耗值: ${totalConsumeValue}, 实际任务数: ${actualTaskCount}`);
      pointValidated = true;

      // 处理素材和文件夹 - 增加新的素材处理逻辑
      // 为每个批次准备独立的素材列表
      const batchMaterialsMap: { [batchIndex: number]: string[] } = {};
      
      try {
        // 1. 获取和处理文件夹素材
        let availableFolderMaterials: string[] = [];
        if (folderIds && folderIds.length > 0) {
          this.logger.log(`[素材处理] 开始处理文件夹素材, 文件夹数量: ${folderIds.length}`);
          
          for (const folderId of folderIds) {
            try {
              // 获取文件夹中的所有素材，并检查是否过期
              const folderMaterials = await this.getMaterialsWithValidation(folderId, userId);
              if (folderMaterials && folderMaterials.length > 0) {
                this.logger.log(`[素材处理] 文件夹 ${folderId} 中获取到 ${folderMaterials.length} 个有效素材`);
                availableFolderMaterials = [...availableFolderMaterials, ...folderMaterials];
              }
            } catch (error) {
              this.logger.error(`[素材处理] 处理文件夹 ${folderId} 素材失败: ${error.message}`);
            }
          }
          
          this.logger.log(`[素材处理] 所有文件夹共获取到 ${availableFolderMaterials.length} 个有效素材`);
        }
        
        // 2. 获取和处理素材库中选择的素材
        let availableMaterials: string[] = [];
        if (materialIds && materialIds.length > 0) {
          this.logger.log(`[素材处理] 开始处理素材库素材, 素材数量: ${materialIds.length}`);
          
          for (const materialId of materialIds) {
            try {
              // 验证素材ID是否有效
              const validMaterial = await this.validateMaterial(materialId, userId);
              if (validMaterial) {
                availableMaterials.push(validMaterial);
                this.logger.log(`[素材处理] 素材 ${materialId} 有效，已添加`);
              }
            } catch (error) {
              this.logger.error(`[素材处理] 处理素材 ${materialId} 失败: ${error.message}`);
            }
          }
          
          this.logger.log(`[素材处理] 素材库共获取到 ${availableMaterials.length} 个有效素材`);
        }
        
        // 3. 合并所有素材
        const allMaterials = [
          ...availableFolderMaterials, 
          ...availableMaterials,
          ...(fileIds || [])
        ];
        
        // 对合并后的素材进行ID去重
        let uniqueMaterials = [...new Set(allMaterials)];
        
        // // 根据素材名称进行去重
        // // try {
        // //   if (uniqueMaterials.length > 0) {
        // //     // 使用SQL直接获取去重后的素材
        // //     const materialIds = uniqueMaterials;
        // //     this.logger.log(`[素材处理] 开始进行基于名称的素材去重，原始素材数量: ${materialIds.length}`);
            
        // //     // 使用原生SQL查询实现素材名称去重
        // //     const queryRunner = this.materialService.materialRepository.manager.connection.createQueryRunner();
        // //     await queryRunner.connect();
            
        // //     try {
        // //       // 构建SQL查询 - 针对每个名称只保留创建时间最早的记录
        // //       const sql = `
        // //         SELECT m.coze_file_id
        // //         FROM materials m
        // //         WHERE m.coze_file_id IN (${materialIds.map(id => `'${id}'`).join(',')})
        // //         AND m.coze_file_id IN (
        // //           SELECT MIN(m2.coze_file_id)
        // //           FROM materials m2
        // //           WHERE m2.coze_file_id IN (${materialIds.map(id => `'${id}'`).join(',')})
        // //           GROUP BY m2.name
        // //         )
        // //       `;
        // //       this.logger.log(`[素材处理] SQL查询: ${sql}`);
        // //       // 执行查询
        // //       const result = await queryRunner.query(sql);
        // //       const uniqueIds = result.map(row => row.coze_file_id);
              
        // //       this.logger.log(`[素材处理] SQL去重后的素材数量: ${uniqueIds.length}`);
        // //       uniqueMaterials = uniqueIds;
        // //     } finally {
        // //       // 释放查询连接
        // //       await queryRunner.release();
        // //     }
        // //   }
        // // } catch (error) {
        // //   this.logger.error(`[素材处理] 进行素材名称去重时出错: ${error.message}`);
        // //   // 发生错误时继续使用ID去重的结果
        // // }
        
        // // this.logger.log(`[素材处理] 合并后总共有 ${allMaterials.length} 个素材，去重后剩余 ${uniqueMaterials.length} 个有效素材`);

        if (uniqueMaterials.length === 0) {
          this.logger.warn(`[素材处理] 警告: 未找到任何有效素材，将使用原始fileIds`);
        } else if (uniqueMaterials.length > 0) {
          // 4. 为每个批次随机选择素材
          const requiredCount = Math.min(4, uniqueMaterials.length); // 每个任务最多使用4个素材
          
          for (let i = 0; i < batchCount; i++) {
            // 为每个批次任务随机选择素材
            const selectedMaterials = this.getRandomMaterials(uniqueMaterials, requiredCount);
            batchMaterialsMap[i] = selectedMaterials;
            this.logger.log(`[素材处理] 批次 ${i+1} 随机选择了 ${selectedMaterials.length} 个素材`);
          }
        }
      } catch (error) {
        this.logger.error(`[素材处理] 处理素材时出错: ${error.message}`);
        // 如果素材处理失败，使用原始fileIds继续
        this.logger.warn(`[素材处理] 由于出错，将使用原始fileIds继续`);
      }
      
      // 在工作流启动成功后扣除积分
      if (pointValidated && !pointDeducted) {
        try {
          // 使用通用方法扣除积分
          const deductResult = await this.userBalanceService.deductFromBalance(
            userId_num,
            pointValidation.deductType,
            totalConsumeValue,
            0, // UseAmount参数
            functionId
          );
          
          pointDeducted = true;
          this.logger.log(`[积分扣除] 用户ID: ${userId} 积分扣除成功，共消耗: ${totalConsumeValue}`);
        } catch (error) {
          this.logger.error(`[积分扣除] 扣除积分失败: ${error.message}, 无法创建任务`);
          return {
            success: false,
            message: '积分扣除失败，请稍后再试',
            error: error.message
          };
        }
      }
      
      // 根据积分规则中的最大并发任务数，限制首次启动的任务数量
      const maxConcurrentTasks = pointValidation.maxConcurrentTasks || 1;
      this.logger.log(`[generateProduct] 最大可同时执行的任务数: ${maxConcurrentTasks}`);

      // 存储任务ID列表
      const taskIds = [];

      // 准备模板ID列表，如果没有模板则使用空数组
      const effectiveTemplateIds = templateIds && templateIds.length > 0 ? templateIds : [];
      const totalTasksToCreate = batchCount; // 用户指定要生成多少篇，就创建多少个任务

      this.logger.log(`[任务创建] 将创建 ${totalTasksToCreate} 个任务，可用模板数: ${effectiveTemplateIds.length}`);

      // 创建指定数量的任务
      for (let i = 0; i < totalTasksToCreate; i++) {
        try {
          // 使用对应索引的选题（循环使用选题）
          const currentTitle = finalTitleList[i % finalTitleList.length];

          // 使用为当前批次随机选择的素材，如果有的话
          const taskFileIds = batchMaterialsMap[i] || fileIds;

          // 循环使用模板ID：如果有模板，按顺序循环使用；如果没有模板，使用空数组
          let currentTemplateId = null;
          if (effectiveTemplateIds.length > 0) {
            currentTemplateId = effectiveTemplateIds[i % effectiveTemplateIds.length];
          }

          this.logger.log(`[任务创建] 第 ${i+1}/${totalTasksToCreate} 个任务, 选题: "${currentTitle}", 模板ID: ${currentTemplateId || '默认'}, 素材数: ${taskFileIds.length}`);

          // 创建任务记录
          const productTask = this.xhsProductFactoryRepository.create({
            userId,
            brandProduct,
            title: currentTitle, // 使用当前选题
            activityId,
            fileIds: taskFileIds, // 使用为当前任务准备的素材
            templateIds: currentTemplateId ? [currentTemplateId] : [], // 每个任务只使用一个模板ID
            information: information, // 添加补充信息
            status: 'pending',
            // 存储批量相关信息
            batchId: batchId,
            batchCount: totalTasksToCreate,
            batchIndex: i + 1,
            // 存储验证结果，便于后续扣除或退款
            deductType: pointValidation.deductType,
            deductAmount: pointValidation.consumeValue / totalTasksToCreate, // 按实际任务数分摊消耗值
            // 初始化API调用失败计数
            apiFailCount: 0
          });

          // 保存任务记录前的日志
          this.logger.log(`[任务创建] 准备保存第 ${i+1}/${totalTasksToCreate} 个任务，标题="${currentTitle}", 模板ID="${currentTemplateId || '默认'}", batchId=${productTask.batchId}`);

          // 保存任务记录
          await this.xhsProductFactoryRepository.save(productTask);
          taskIds.push(productTask.id);

          // 保存任务记录后的日志
          this.logger.log(`[任务创建] 成功保存第 ${i+1}/${totalTasksToCreate} 个任务，ID=${productTask.id}, 标题="${currentTitle}", 模板ID="${currentTemplateId || '默认'}"`);

          // 根据maxConcurrentTasks决定启动多少任务
          if (i < maxConcurrentTasks) {
            await this.startProductTaskWorkflow(productTask);
            this.logger.log(`[任务启动] 启动第 ${i+1}/${maxConcurrentTasks} 个并发任务, ID=${productTask.id}`);
          }
        } catch (error) {
          this.logger.error(`创建第 ${i+1}/${totalTasksToCreate} 个任务失败: ${error.message}`, error.stack);
          // 继续创建其他任务
        }
      }

      // 如果全部失败
      if (taskIds.length === 0) {
        this.logger.error(`所有 ${totalTasksToCreate} 个任务创建失败`);
        return {
          success: false,
          message: '创建任务失败，请稍后再试',
          error: '批量任务创建失败'
        };
      }

      // 返回结果前的最后日志
      this.logger.log(`[任务创建] 任务创建完成，共创建 ${taskIds.length}/${totalTasksToCreate} 个任务，批次ID=${batchId}`);

      // 构建返回消息
      let message = '';
      if (totalTasksToCreate > 1) {
        if (effectiveTemplateCount > 1) {
          message = `已成功创建 ${taskIds.length}/${totalTasksToCreate} 个任务（使用${effectiveTemplateCount}个模板循环生成），正在生成中`;
        } else {
          message = `已成功创建 ${taskIds.length}/${totalTasksToCreate} 个任务，正在生成中`;
        }
      } else {
        message = '任务已提交，正在生成中';
      }

      // 返回成功信息，包含第一个任务的ID
      return {
        success: true,
        message: message,
        data: {
          taskId: taskIds[0],
          totalTasks: taskIds.length,
          batchId: batchId,
          allTaskIds: taskIds,
          requestedCount: batchCount, // 用户请求生成的数量
          templateCount: effectiveTemplateCount
        }
      };
    } catch (error) {
      this.logger.error(`生成产品内容失败: ${error.message}`, error.stack);
      return {
        success: false,
        message: error.message || '生成产品内容失败',
        error: error.message
      };
    }
  }

  /**
   * 获取文件夹中的素材并验证有效性
   * @param folderId 文件夹ID
   * @param userId 用户ID (可选)
   * @returns 有效的素材ID数组
   */
  private async getMaterialsWithValidation(folderId: string, userId?: string): Promise<string[]> {
    try {
      this.logger.log(`[getMaterialsWithValidation] 获取文件夹 ${folderId} 中的素材, 用户ID: ${userId || '未提供'}`);
      
      // 调用素材服务获取文件夹中的所有素材，传递用户ID
      const materials = await this.materialService.getMaterialsByFolder(folderId, userId);
      
      if (!materials || !Array.isArray(materials) || materials.length === 0) {
        this.logger.warn(`[getMaterialsWithValidation] 文件夹 ${folderId} 中没有找到素材`);
        return [];
      }
      
      // 仅记录素材总数，不输出详细日志
      this.logger.log(`[getMaterialsWithValidation] 文件夹 ${folderId} 中找到 ${materials.length} 个素材`);
      
      // 仅检查素材文件的过期时间并更新，不检查有效性
      const validMaterials: string[] = [];
      
      for (const material of materials) {
        try {
          // 检查素材是否有cozeFileId
          if (!material.cozeFileId) {
            this.logger.warn(`[getMaterialsWithValidation] 素材 ${material.id} 没有cozeFileId，尝试更新`);
            // 尝试更新cozeFileId
            const updatedMaterial = await this.materialService.updateMaterialCozeId(material.id);
            
            if (updatedMaterial && updatedMaterial.cozeFileId) {
              validMaterials.push(updatedMaterial.cozeFileId);
            }
            continue;
          }
          
          // 检查素材过期时间
          const now = new Date();
          const expireTime = material.expiryTime ? new Date(material.expiryTime) : null;
          
          // 简化日志，只在调试时输出
          if (!expireTime || now > expireTime) {
            // 素材已过期或没有过期时间，需要更新
            this.logger.warn(`[getMaterialsWithValidation] 素材 ${material.id} 已过期或没有过期时间，尝试更新`);
            const updatedMaterial = await this.materialService.updateMaterialCozeId(material.id);
            
            if (updatedMaterial && updatedMaterial.cozeFileId) {
              validMaterials.push(updatedMaterial.cozeFileId);
            }
          } else {
            // 素材未过期，直接添加到结果列表
            validMaterials.push(material.cozeFileId);
          }
        } catch (error) {
          this.logger.error(`[getMaterialsWithValidation] 处理素材 ${material.id} 失败: ${error.message}`);
          // 继续处理下一个素材
        }
      }
      
      this.logger.log(`[getMaterialsWithValidation] 文件夹 ${folderId} 中找到 ${validMaterials.length} 个有效素材`);
      return validMaterials;
    } catch (error) {
      this.logger.error(`[getMaterialsWithValidation] 获取文件夹素材失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 验证单个素材是否有效，如果无效则更新
   * @param materialId 素材ID
   * @param userId 用户ID（可选）
   * @returns 有效的coze_file_id
   */
  private async validateMaterial(materialId: string, userId?: string): Promise<string | null> {
    try {
      this.logger.log(`[validateMaterial] 验证素材 ${materialId}, 用户ID: ${userId || '未提供'}`);
      
      // 获取素材详情
      const material = await this.materialService.getMaterialById(materialId);
      
      if (!material) {
        this.logger.warn(`[validateMaterial] 素材 ${materialId} 不存在`);
        return null;
      }
      
      if (!material.cozeFileId) {
        this.logger.warn(`[validateMaterial] 素材 ${materialId} 没有cozeFileId`);
        
        // 尝试更新素材
        const updatedMaterial = await this.materialService.updateMaterialCozeId(materialId);
        if (updatedMaterial && updatedMaterial.cozeFileId) {
          this.logger.log(`[validateMaterial] 素材 ${materialId} 更新成功，新cozeFileId: ${updatedMaterial.cozeFileId}`);
          return updatedMaterial.cozeFileId;
        }
        
        return null;
      }
      
      // 检查素材过期时间
      const now = new Date();
      const expireTime = material.expiryTime ? new Date(material.expiryTime) : null;
      
      // 简化日志，只在调试时输出
      if (!expireTime || now > expireTime) {
        // 素材已过期或没有过期时间，需要更新
        this.logger.warn(`[validateMaterial] 素材 ${materialId} 已过期或没有过期时间，尝试更新`);
        const updatedMaterial = await this.materialService.updateMaterialCozeId(materialId);
        
        if (updatedMaterial && updatedMaterial.cozeFileId) {
          this.logger.log(`[validateMaterial] 素材 ${materialId} 更新成功，新cozeFileId: ${updatedMaterial.cozeFileId}`);
          return updatedMaterial.cozeFileId;
        }
      } else {
        // 素材未过期，直接返回
        this.logger.log(`[validateMaterial] 素材 ${materialId} 未过期，cozeFileId: ${material.cozeFileId}`);
        return material.cozeFileId;
      }
      
      return null;
    } catch (error) {
      this.logger.error(`[validateMaterial] 验证素材失败: ${error.message}`);
      return null;
    }
  }

  /**
   * 从素材数组中随机选择指定数量的素材
   * @param materials 素材数组
   * @param count 需要选择的数量
   * @returns 随机选择的素材数组
   */
  private getRandomMaterials(materials: string[], count: number): string[] {
    if (!materials || materials.length === 0) {
      return [];
    }
    
    // 如果素材数量小于等于需要的数量，直接返回所有素材
    if (materials.length <= count) {
      return [...materials];
    }
    
    // 随机选择素材
    const shuffled = [...materials];
    
    // Fisher-Yates随机算法
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    // 返回需要数量的素材
    return shuffled.slice(0, count);
  }

  /**
   * 启动产品任务的工作流
   * @param productTask 产品任务对象
   * @returns 成功或失败
   */
  private async startProductTaskWorkflow(productTask: XhsProductFactory) {
    try {
      // 拆分品牌产品字段
      const brandNameParts = productTask.brandProduct.split(' ');
      const brandName = brandNameParts.length > 0 ? brandNameParts[0] : productTask.brandProduct;

      // 获取模板ID（现在每个任务只有一个模板ID）
      let selectedTemplateId = null;
      let paramsType = 'normal'; // 默认参数类型
      let workflowId = "7494168094760665115"; // 默认工作流ID

      if (productTask.templateIds && productTask.templateIds.length > 0) {
        // 直接使用第一个（也是唯一的）模板ID
        selectedTemplateId = productTask.templateIds[0];

        this.logger.log(`使用指定的模板ID: ${selectedTemplateId}`);
        
        // 根据模板ID获取paramsType
        try {

          
          // 根据模板ID获取workflowId (实际是botId)
          try {
            // 从xiaohongshu_note表中查询模板以获取botId
            const noteTemplate = await this.noteRepository.findOne({ 
              where: { id: selectedTemplateId}
            });
            
            if (!noteTemplate) {
              this.logger.warn(`未找到ID为${selectedTemplateId}的笔记模板，使用默认参数`);
            } else {
              // 从找到的笔记模板中获取paramsType
              paramsType = noteTemplate.paramsType || 'normal';
              this.logger.log(`根据模板ID确定的paramsType: ${paramsType}`);

              if (noteTemplate.botId) {
                workflowId = noteTemplate.botId;
                this.logger.log(`从笔记模板中获取到botId作为workflowId: ${workflowId}`);
                
                // 验证workflowId是否存在于coze表中
                try {
                  const cozeEntity = await this.cozeService.findByWorkflowId(workflowId);
                  if (cozeEntity) {
                    this.logger.log(`验证workflowId成功: ${workflowId}`);
                  }
                } catch (verifyError) {
                  this.logger.warn(`验证workflowId失败，但仍将继续使用: ${verifyError.message}`);
                }
              } else {
                // 如果没有找到botId，使用默认workflowId
                this.logger.warn(`未找到模板的botId，使用默认workflowId: ${workflowId}`);
              }
            }
          } catch (workflowError) {
            this.logger.error(`获取workflowId失败: ${workflowError.message}，使用默认workflowId: ${workflowId}`);
          }
        } catch (error) {
          this.logger.error(`获取模板详情失败: ${error.message}，使用默认paramsType: ${paramsType}`);
        }
      } else {
        this.logger.log(`任务没有指定模板ID，使用默认paramsType: ${paramsType}和默认workflowId: ${workflowId}`);
      }

      // 准备调用Coze工作流的参数（按照指定格式）
      const workflowParams = {
        workflow_id: "7494168094760665115", // 使用根据模板ID获取的workflowId
        title: productTask.title,
        brand_name: brandName,
        identifier: productTask.activityId,
        file_pic_urls: productTask.fileIds, // 文件ID数组
        params_type: paramsType, // 根据模板ID确定的参数类型
        user_id: productTask.userId,
        xhs_user_id: productTask.userId,
        template_id: selectedTemplateId, // 添加模板ID参数
        task_id: productTask.id, // 添加任务ID参数
        information: productTask.information, // 添加补充信息
        is_async: true // 确保异步执行
      };

      // 直接调用Coze服务
      const response = await this.cozeService.runWorkflow(workflowParams);
      
      // 增加日志输出，记录完整响应
      this.logger.log(`工作流响应: ${JSON.stringify(response)}`);
      
      // 检查响应格式
      if (!response || !response.execute_id) {
        // 更新任务状态为失败
        productTask.status = 'failed';
        productTask.error = '工作流启动失败: 无法获取execute_id';
        await this.xhsProductFactoryRepository.save(productTask);
        
        return false;
      }

      // 更新任务记录
      productTask.executeId = response.execute_id;
      productTask.workflowId = workflowId; // 保存使用的workflowId
      productTask.status = 'running';
      productTask.selectedTemplateId = selectedTemplateId; // 保存选择的模板ID
      productTask.paramsType = paramsType; // 保存参数类型
      await this.xhsProductFactoryRepository.save(productTask);
      
      this.logger.log(`工作流已启动，executeId=${response.execute_id}, taskId=${productTask.id}, 使用模板ID=${selectedTemplateId}, 参数类型=${paramsType}, 工作流ID=${workflowId}`);

      // 立即启动一次状态检查，但不等待结果（异步执行）
      this.checkTaskStatus(productTask.id).then(updated => {
        if (updated) {
          this.logger.log(`初始任务状态检查成功: [taskId=${productTask.id}]`);
        }
      }).catch(err => {
        this.logger.error(`初始任务状态检查失败: ${err.message}`, err.stack);
      });

      return true;
    } catch (error) {
      // 记录错误详情
      this.logger.error(`启动工作流失败: ${error.message}`, error.stack);
      
      // 更新任务状态为失败
      productTask.status = 'failed';
      productTask.error = error.message || '工作流启动失败';
      await this.xhsProductFactoryRepository.save(productTask);
      
      return false;
    }
  }

  /**
   * 获取生成结果
   * @param userId 用户ID
   * @param taskId 任务ID
   * @returns 生成结果
   */
  async getGenerationResult(userId: string, taskId: string) {
    try {
      // 查询任务记录
      const productTask = await this.xhsProductFactoryRepository.findOne({
        where: { id: taskId, userId }
      });

      if (!productTask) {
        throw new Error('任务不存在或无权限查看');
      }

      // 记录当前任务状态
      this.logger.log(`获取任务结果 [${taskId}], 当前状态: ${productTask.status}`);

      // 如果任务已完成或失败，直接返回结果
      if (productTask.status === 'completed') {
        let resultData = null;
        try {
          resultData = productTask.result ? JSON.parse(productTask.result) : {};
        } catch (e) {
          // 如果解析失败，直接使用原始字符串
          resultData = productTask.result;
        }
        
        return {
          success: true,
          message: '任务已完成',
          status: 'completed',
          data: resultData,
          templateIds: productTask.templateIds || [], // 添加模板ID列表
          selectedTemplateId: productTask.selectedTemplateId || null, // 添加选中的模板ID
          paramsType: productTask.paramsType || 'normal', // 添加参数类型
          information: productTask.information // 添加补充信息
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

      // 如果任务是pending或running状态，自动触发一次状态检查（非阻塞）
      if (productTask.status === 'pending' || productTask.status === 'running') {
        // 立即异步检查任务状态
        this.checkTaskStatus(productTask.id).then(updated => {
          if (updated) {
            this.logger.log(`成功更新任务[${productTask.id}]状态`);
          }
        }).catch(err => {
          this.logger.error(`触发任务状态检查失败: ${err.message}`, err.stack);
        });
        
        // 不等待检查结果，立即返回当前状态
        return {
          success: true,
          message: '任务正在处理中，请稍后查询',
          status: productTask.status,
          progress: 0 // 进度信息可以根据实际情况设置
        };
      }

      // 默认返回
      return {
        success: true,
        message: '任务状态未知',
        status: productTask.status || 'unknown'
      };
    } catch (error) {
      this.logger.error(`获取生成结果失败: ${error.message}`, error.stack);
      return {
        success: false,
        message: '获取生成结果失败',
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * 定时任务：每1分钟检查运行中的任务状态并更新
   * 使用@nestjs/schedule的Cron装饰器实现定时执行
   */
  @Cron('0 */1 * * * *') // 每1分钟执行一次
  async scheduledTaskCheck() {
    try {
      this.logger.log('定时任务：开始检查运行中的任务状态');
      const result = await this.checkRunningTasks();
      
      // 新版API返回的是不同的字段
      const startedTasks = result.startedTasks || 0;
      const startedBatches = result.startedBatches || 0;
      const runningCount = result.runningCount || 0;
      
      if (result.success) {
        this.logger.log(`定时任务执行完成，启动了${startedTasks}个新任务(其中批量任务${startedBatches}批)，当前运行中共${runningCount}个任务`);
      } else {
        this.logger.warn(`定时任务执行完成，但遇到问题：${result.message}`);
      }
    } catch (error) {
      this.logger.error(`定时任务执行失败: ${error.message}`, error.stack);
    }
  }

  /**
   * 检查单个任务的状态并更新数据库
   * @param taskId 任务ID
   */
  async checkTaskStatus(taskId: string) {
    try {
      // 获取任务记录
      const task = await this.xhsProductFactoryRepository.findOne({ 
        where: { id: taskId } 
      });

      if (!task) {
        this.logger.warn(`任务[${taskId}]不存在`);
        return false;
      }

      // 验证任务状态是否为 pending 或 running
      if (task.status !== 'pending' && task.status !== 'running') {
        this.logger.warn(`任务[${taskId}]状态[${task.status}]不需要检查`);
        return false;
      }

      // 如果没有执行ID，无法检查状态
      if (!task.executeId) {
        this.logger.warn(`任务[${taskId}]没有执行ID`);
        return false;
      }

      // 更新任务状态为 running
      if (task.status === 'pending') {
        task.status = 'running';
        await this.xhsProductFactoryRepository.save(task);
        this.logger.log(`更新任务[${taskId}]状态: pending -> running`);
      }

      // 调用 Coze 服务检查任务状态
      try {
        this.logger.debug(`获取任务[${taskId}]执行状态，executeId: ${task.executeId}`);
        
        // 获取工作流执行结果，增加resultField参数
        const resultFieldName = 'raw_workflow_result';
        const workflowResults = await this.cozeService.getWorkflowResult(
          "7494168094760665115",
          task.executeId,
          'data',
          resultFieldName
        );
        this.logger.debug(`任务[${taskId}]返回状态: ${JSON.stringify(workflowResults)}`);
        
        // 如果API调用成功，重置失败计数
        if (task.apiFailCount > 0) {
          task.apiFailCount = 0;
          this.logger.log(`重置任务[${taskId}]的API调用失败计数`);
        }
        
        // 提取状态和数据
        const workflowStatus = workflowResults?.status || '';
        let workflowData = workflowResults?.data || null;
        
        // 根据工作流状态更新任务状态
        if (workflowStatus === 'FAILED' || workflowStatus.includes('failed') || workflowStatus.includes('FAIL') || workflowStatus === 'Fail') {
          this.logger.warn(`工作流[${task.executeId}]执行失败，状态: ${workflowStatus}`);
          
          // 记录错误信息
          let errorMsg = '执行失败';
          
          // 检查原始结果中的error_message字段
          if (workflowResults?.result && Array.isArray(workflowResults.result)) {
            const firstResult = workflowResults.result[0];
            if (firstResult && firstResult.error_message) {
              errorMsg = firstResult.error_message;
              this.logger.log(`从原始结果中提取错误信息: ${errorMsg}`);
            }
          }
          
          if (workflowResults?.data?.error) {
            errorMsg = workflowResults.data.error;
          } else if (typeof workflowData === 'string') {
            // 尝试判断如果workflowData字符串看起来像错误消息，则用作错误消息
            if (workflowData.toLowerCase().includes('error') || 
                workflowData.toLowerCase().includes('fail') || 
                workflowData.toLowerCase().includes('exception')) {
              errorMsg = workflowData;
            }
          }
          
          // 更新任务状态和错误信息
          task.status = 'failed';
          task.error = errorMsg;
          
          // 保存失败时的原始工作流结果，改用resultField字段
          task.rawResult = typeof workflowResults[resultFieldName] === 'string' 
            ? workflowResults[resultFieldName] 
            : JSON.stringify(workflowResults[resultFieldName]);
          this.logger.log(`保存失败任务[${taskId}]原始工作流结果，长度: ${task.rawResult.length}`);
          
          // 任务失败时，如果已扣除积分，则退还积分
          if (task.deductType && task.deductAmount && !task.refunded) {
            try {
              const userId_num = parseInt(task.userId);
              this.logger.log(`[积分退还] 任务失败，开始退还积分, 用户ID: ${userId_num}, 类型: ${task.deductType}, 数量: ${task.deductAmount}`);
              
              // 使用通用的退款方法
              const refundResult = await this.userBalanceService.refundFunctionPoints(
                userId_num,
                'xhs_note',
                task.deductType,
                task.deductAmount
              );
              
              if (refundResult.success) {
                this.logger.log(`[积分退还] 用户ID: ${userId_num} 积分退还成功`);
                // 标记已退款
                task.refunded = true;
              } else {
                this.logger.error(`[积分退还] 退还积分失败: ${refundResult.message}`);
              }
            } catch (error) {
              this.logger.error(`[积分退还] 退还积分失败: ${error.message}`);
              // 这里可以添加监控告警，提醒管理员手动处理退款
            }
          }
          
          const saveResult = await this.xhsProductFactoryRepository.save(task);
          this.logger.log(`任务[${taskId}]状态已更新为failed, 保存结果: ${!!saveResult}`);
          
          // 如果是批量任务，尝试启动下一个任务
          if (task.batchId && task.batchCount > 1) {
            await this.tryStartNextBatchTask(task);
          }
          
          return true;
        } else if (workflowStatus.includes('RUNNING') || workflowStatus.includes('running')) {
          this.logger.log(`任务[${taskId}]状态已更新为running`);
          // 运行中状态不保存原始结果
          return true;
        } else if (workflowStatus.includes('SUCCEEDED') || workflowStatus.includes('completed') || 
                   workflowStatus.includes('success') || workflowData) {
          this.logger.log(`更新任务[${taskId}]状态: ${task.status} -> completed, 数据长度: ${workflowData ? JSON.stringify(workflowData).length : 0}`);
          
          // 保存成功时的原始工作流结果，改用resultField字段
          task.rawResult = typeof workflowResults[resultFieldName] === 'string' 
            ? workflowResults[resultFieldName] 
            : JSON.stringify(workflowResults[resultFieldName]);
          this.logger.log(`保存成功任务[${taskId}]原始工作流结果，长度: ${task.rawResult.length}`);
          
          // 处理后的结果数据
          let cleanedResult = workflowData;
          
          // 如果是字符串类型，可能需要清理双引号
          if (typeof workflowData === 'string') {
            // 记录原始结果
            this.logger.log(`任务[${taskId}]原始字符串结果: "${workflowData}"`);
            
            try {
              // 尝试解析JSON
              const parsed = JSON.parse(workflowData);
              cleanedResult = parsed;
              this.logger.log(`任务[${taskId}]JSON解析成功`);
            } catch (e) {
              // 如果解析失败，说明不是合法的JSON，进行字符串清理
              this.logger.log(`任务[${taskId}]JSON解析失败: ${e.message}`);
              
              // 清理字符串开头和结尾的引号，处理多重引号的情况
              let cleanString = workflowData;
              // 循环处理，直到不再有变化
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
          
          // 处理HTML模板替换逻辑
          cleanedResult = await this.processHtmlTemplate(cleanedResult, taskId, task.selectedTemplateId);
          
          // 尝试从结果中提取笔记ID
          try {
            // 如果结果是对象，尝试获取noteId字段
            if (typeof cleanedResult === 'object' && cleanedResult !== null) {
              if (cleanedResult.noteId) {
                task.noteId = cleanedResult.noteId;
                this.logger.log(`从对象结果中提取到笔记ID: ${task.noteId}`);
              } else if (typeof cleanedResult.result === 'object' && cleanedResult.result?.noteId) {
                task.noteId = cleanedResult.result.noteId;
                this.logger.log(`从嵌套result对象中提取到笔记ID: ${task.noteId}`);
              }
            } 
            // 如果结果是字符串，检查是否包含分享链接并提取笔记ID
            else if (typeof cleanedResult === 'string') {
              // 尝试从链接中提取ID
              const shareUrlMatch = cleanedResult.match(/\/xhs-auto-api\?id=([^&\s"']+)/);
              if (shareUrlMatch && shareUrlMatch[1]) {
                task.noteId = shareUrlMatch[1];
                this.logger.log(`从分享链接中提取到笔记ID: ${task.noteId}`);
              }
            }
          } catch (error) {
            this.logger.warn(`提取笔记ID失败: ${error.message}`);
          }
          
          // 更新任务状态
          task.status = 'completed';
          
          // 存储处理后的结果
          if (typeof cleanedResult === 'string') {
            task.result = cleanedResult;
          } else {
            task.result = JSON.stringify(cleanedResult);
          }
          
          const saveResult = await this.xhsProductFactoryRepository.save(task);
          this.logger.log(`任务[${taskId}]状态已更新为completed, 保存结果: ${!!saveResult}`);
          return true;
        }

        this.logger.warn(`任务[${taskId}]状态未更新: 无法确定工作流状态`);
        // 不保存原始结果
        return false;
      } catch (error) {
        // 增加失败计数
        task.apiFailCount = (task.apiFailCount || 0) + 1;
        this.logger.warn(`任务[${taskId}]API调用失败，当前失败次数: ${task.apiFailCount}/5`);
        
        // 记录错误详情
        this.logger.error(`检查任务状态失败 [taskId=${taskId}]: ${error.message}`, error.stack);
        
        // 当失败次数达到5次时，将任务标记为失败
        if (task.apiFailCount >= 5) {
          this.logger.error(`任务[${taskId}]API调用连续失败达到5次，将任务标记为失败`);
          
          // 更新任务状态为失败
          task.status = 'failed';
          task.error = `API调用连续失败5次: ${error.message || 'Coze API连接失败'}`;
          
          // 任务失败时，如果已扣除积分，则退还积分
          if (task.deductType && task.deductAmount && !task.refunded) {
            try {
              const userId_num = parseInt(task.userId);
              this.logger.log(`[积分退还] API调用失败任务，开始退还积分, 用户ID: ${userId_num}, 类型: ${task.deductType}, 数量: ${task.deductAmount}`);
              
              // 使用通用的退款方法
              const refundResult = await this.userBalanceService.refundFunctionPoints(
                userId_num,
                'xhs_note',
                task.deductType,
                task.deductAmount
              );
              
              if (refundResult.success) {
                this.logger.log(`[积分退还] 用户ID: ${userId_num} 积分退还成功`);
                // 标记已退款
                task.refunded = true;
              } else {
                this.logger.error(`[积分退还] 退还积分失败: ${refundResult.message}`);
              }
            } catch (error) {
              this.logger.error(`[积分退还] 退还积分失败: ${error.message}`);
            }
          }
          
          // 如果是批量任务，尝试启动下一个任务
          if (task.batchId && task.batchCount > 1) {
            await this.tryStartNextBatchTask(task);
          }
        }
        
        // 保存任务更新
        await this.xhsProductFactoryRepository.save(task);
        
        return task.apiFailCount >= 5; // 如果已将任务标记为失败，则返回true表示状态已更新
      }
    } catch (error) {
      this.logger.error(`检查任务状态失败 [taskId=${taskId}]: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * 检查所有运行中或等待中的任务
   * @returns 处理结果
   */
  async checkRunningTasks() {
    try {
      // 查找所有状态为pending和running的任务
      const tasks = await this.xhsProductFactoryRepository.find({
        where: [
          { status: 'pending' },
          { status: 'running' }
        ],
        order: {
          createTime: 'ASC' // 优先处理早创建的任务
        }
      });

      if (tasks.length === 0) {
        this.logger.log('没有找到运行中或等待中的任务');
        return { success: true, message: '没有找到运行中或等待中的任务' };
      }

      this.logger.log(`找到 ${tasks.length} 个运行中或等待中的任务`);
      
      // 分组任务：按批次ID和运行状态分组
      const pendingBatchTasks = {}; // 等待中的批量任务
      const pendingSingleTasks = []; // 等待中的单个任务
      const runningTasks = []; // 运行中的任务
      
      tasks.forEach(task => {
        if (task.status === 'pending') {
          // 如果是批量任务的一部分
          if (task.batchId) {
            if (!pendingBatchTasks[task.batchId]) {
              pendingBatchTasks[task.batchId] = [];
            }
            pendingBatchTasks[task.batchId].push(task);
          } else {
            pendingSingleTasks.push(task);
          }
        } else if (task.status === 'running') {
          runningTasks.push(task);
        }
      });
      
      this.logger.log(`待处理分析: ${Object.keys(pendingBatchTasks).length} 批次任务, ${pendingSingleTasks.length} 个单任务, ${runningTasks.length} 个运行中任务`);

      // 默认最大同时运行的任务数
      const defaultMaxTasks = 3;
      let startedTasks = 0;
      let startedBatches = 0;
      
      // 优先检查所有运行中的任务
      for (const task of runningTasks) {
        try {
          await this.checkTaskStatus(task.id);
        } catch (error) {
          this.logger.error(`检查任务 ${task.id} 状态失败: ${error.message}`, error.stack);
        }
      }
      
      // 处理批量任务：根据每个批次的maxConcurrentTasks决定可以同时运行多少任务
      for (const batchId in pendingBatchTasks) {
        const batchTasks = pendingBatchTasks[batchId];
        if (batchTasks.length === 0) continue;
        
        // 按照batchIndex排序
        batchTasks.sort((a, b) => a.batchIndex - b.batchIndex);
        
        // 获取第一个任务的用户ID，用于查询其maxConcurrentTasks
        const firstTask = batchTasks[0];
        const userId = parseInt(firstTask.userId);
        
        try {
          // 获取该批次可以同时运行的任务数量
          // 注意：需要使用尝试提取functionId，这里假设为'xhs_note'
          const functionId = 'xhs_note';
          const pointValidation = await this.userBalanceService.validateUserPointForFunction(userId, functionId);
          const batchMaxConcurrentTasks = pointValidation.maxConcurrentTasks || defaultMaxTasks;
          
          this.logger.log(`批次 ${batchId} 允许的最大并发任务数: ${batchMaxConcurrentTasks}`);
          
          // 获取当前批次中已经运行的任务数量
          const batchRunningCount = await this.xhsProductFactoryRepository.count({
            where: { 
              batchId: batchId,
              status: 'running'
            }
          });
          
          // 计算还可以启动的任务数量
          const availableBatchSlots = Math.max(0, batchMaxConcurrentTasks - batchRunningCount);
          
          if (availableBatchSlots > 0) {
            this.logger.log(`批次 ${batchId} 当前运行 ${batchRunningCount}/${batchMaxConcurrentTasks} 个任务，可启动 ${availableBatchSlots} 个新任务`);
            
            // 获取当前批次可启动的任务
            const tasksToStart = batchTasks.slice(0, availableBatchSlots);
            
            // 启动可用的任务
            for (const task of tasksToStart) {
              try {
                const started = await this.startProductTaskWorkflow(task);
                if (started) {
                  startedTasks++;
                  this.logger.log(`成功启动批次任务 ${task.id} [${task.batchIndex}/${task.batchCount}]`);
                }
              } catch (error) {
                this.logger.error(`启动批次任务 ${task.id} 失败: ${error.message}`, error.stack);
              }
            }
            
            if (tasksToStart.length > 0) {
              startedBatches++;
            }
          } else {
            this.logger.log(`批次 ${batchId} 已达到最大并发任务数 ${batchMaxConcurrentTasks}，无法启动新任务`);
          }
        } catch (error) {
          this.logger.error(`获取批次 ${batchId} 的最大并发数失败: ${error.message}`);
          // 如果获取失败，使用默认值
          const batchRunningCount = await this.xhsProductFactoryRepository.count({
            where: { 
              batchId: batchId,
              status: 'running'
            }
          });
          
          // 如果该批次没有运行中的任务，则启动一个
          if (batchRunningCount === 0 && batchTasks.length > 0) {
            try {
              const started = await this.startProductTaskWorkflow(batchTasks[0]);
              if (started) {
                startedTasks++;
                startedBatches++;
                this.logger.log(`使用默认并发数1，成功启动批次任务 ${batchTasks[0].id}`);
              }
            } catch (err) {
              this.logger.error(`启动批次任务 ${batchTasks[0].id} 失败: ${err.message}`);
            }
          }
        }
      }
      
      // 处理单个任务，使用系统默认最大任务数
      // 计算当前运行中的单个任务数量
      const singleTaskRunningCount = await this.xhsProductFactoryRepository.count({
        where: { 
          batchId: null,
          status: 'running'
        }
      });
      
      // 可启动的单个任务槽位
      const availableSingleSlots = Math.max(0, defaultMaxTasks - singleTaskRunningCount);
      
      if (availableSingleSlots > 0 && pendingSingleTasks.length > 0) {
        this.logger.log(`单个任务: 当前运行 ${singleTaskRunningCount}/${defaultMaxTasks}，可启动 ${availableSingleSlots} 个新任务`);
        
        // 获取可启动的单个任务
        const singleTasksToStart = pendingSingleTasks.slice(0, availableSingleSlots);
        
        // 启动可用的单个任务
        for (const task of singleTasksToStart) {
          try {
            const started = await this.startProductTaskWorkflow(task);
            if (started) {
              startedTasks++;
              this.logger.log(`成功启动单个任务 ${task.id}`);
            }
          } catch (error) {
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
    } catch (error) {
      this.logger.error(`检查运行中任务失败: ${error.message}`, error.stack);
      return { success: false, message: `检查任务失败: ${error.message}` };
    }
  }

  /**
   * 获取用户的所有任务
   * @param userId 用户ID
   * @param status 可选的任务状态过滤
   * @returns 任务列表
   */
  async getUserTasks(userId: string, status?: string) {
    try {
      // 构建查询条件
      const where: any = { userId };
      if (status) {
        where.status = status;
      }

      // 查询任务列表
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
        result: task.status === 'completed' ? task.result: null,
        error: task.error,
        templateIds: task.templateIds || [], // 添加模板ID列表
        selectedTemplateId: task.selectedTemplateId || null, // 添加选中的模板ID
        paramsType: task.paramsType || 'normal', // 添加参数类型
        // 添加批量任务相关字段
        batchId: task.batchId,
        batchCount: task.batchCount,
        batchIndex: task.batchIndex
      }));
    } catch (error) {
      this.logger.error(`获取用户任务列表失败: ${error.message}`, error.stack);
      return {
        success: false,
        message: '获取任务列表失败',
        error: error.message
      };
    }
  }

  /**
   * 当批次中的任务失败时，尝试启动同批次中的下一个任务
   * @param task 当前失败的任务
   * @returns 是否成功启动下一个任务
   */
  private async tryStartNextBatchTask(task: XhsProductFactory): Promise<boolean> {
    if (!task.batchId || task.batchCount <= 1) {
      return false;
    }
    
    this.logger.log(`任务[${task.id}]失败，尝试启动批次[${task.batchId}]中的下一个任务`);
    
    try {
      // 查找同一批次中下一个待处理的任务
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
        
        // 启动下一个任务
        const started = await this.startProductTaskWorkflow(nextTask);
        
        if (started) {
          this.logger.log(`成功启动批次[${task.batchId}]中的下一个任务[${nextTask.batchIndex}/${nextTask.batchCount}]`);
          return true;
        } else {
          this.logger.error(`启动批次[${task.batchId}]中的下一个任务[${nextTask.batchIndex}/${nextTask.batchCount}]失败`);
          return false;
        }
      } else {
        this.logger.log(`批次[${task.batchId}]中没有更多待处理的任务`);
        return false;
      }
    } catch (error) {
      this.logger.error(`尝试启动批次中下一个任务时出错: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * 处理HTML模板替换逻辑
   * @param cleanedResult 清理后的工作流结果
   * @param taskId 任务ID
   * @param templateId 模板ID
   * @returns 处理后的结果对象
   */
  private async processHtmlTemplate(cleanedResult: any, taskId: string, templateId?: string): Promise<any> {
    try {
      // 处理字符串类型的结果，如果不是以http开头，尝试解析为JSON
      if (typeof cleanedResult === 'string') {
        // 如果是http开头的URL，不做处理直接返回
        if (cleanedResult.trim().toLowerCase().startsWith('http')) {
          this.logger.log(`检测到HTTP链接，跳过HTML模板处理 [taskId=${taskId}]`);
          return cleanedResult;
        }
        
        // 尝试将字符串解析为JSON
        try {
          this.logger.log(`尝试将字符串结果解析为JSON [taskId=${taskId}]`);
          cleanedResult = JSON.parse(cleanedResult);
        } catch (error) {
          this.logger.warn(`字符串结果不是有效的JSON，跳过HTML模板处理 [taskId=${taskId}]`);
          return cleanedResult;
        }
      }
      
      // 确保结果是对象类型或数组类型
      if ((typeof cleanedResult !== 'object' && !Array.isArray(cleanedResult)) || cleanedResult === null) {
        this.logger.warn(`结果不是对象或数组类型，跳过HTML模板处理 [taskId=${taskId}]`);
        return cleanedResult;
      }

      // 获取模板笔记ID - 注意这里的templateId实际上是笔记ID
      let noteId = null;
      if (templateId) {
        try {
          noteId = Number(templateId);
          this.logger.log(`获取到笔记ID: ${noteId} [taskId=${taskId}]`);
        } catch (error) {
          this.logger.warn(`无法将templateId转换为数字: ${templateId} [taskId=${taskId}]`);
        }
      }

      if (!noteId) {
        this.logger.warn(`HTML模板替换: 未找到有效的笔记ID，跳过处理 [taskId=${taskId}]`);
        return cleanedResult;
      }

      // 日志记录详细的参数信息
      this.logger.log(`HTML模板替换: 尝试获取笔记(ID=${noteId})关联的HTML模板 [taskId=${taskId}]`);

      // 查询与笔记关联的模板关系
      const relations = await this.noteTemplateRelationRepository.find({
        where: { noteId: noteId }
      });
      
      this.logger.log(`HTML模板替换: 笔记(ID=${noteId})关联的模板关系数量: ${relations.length} [taskId=${taskId}]`);
      
      if (!relations || relations.length === 0) {
        this.logger.warn(`HTML模板替换: 笔记ID=${noteId}没有关联的模板，跳过处理 [taskId=${taskId}]`);
        return cleanedResult;
      }
      
      // 获取HTML模板详情
      const templateIds = relations.map(relation => relation.templateId);
      this.logger.log(`HTML模板替换: 找到关联的模板ID: ${templateIds.join(', ')} [taskId=${taskId}]`);
      
      const htmlTemplates = await this.htmlTemplateRepository.find({
        where: { id: In(templateIds), status: 1 } // 只获取状态为启用的模板
      });
      
      this.logger.log(`HTML模板替换: 有效HTML模板数量=${htmlTemplates.length} [taskId=${taskId}]`);
      
      if (htmlTemplates.length === 0) {
        this.logger.warn(`HTML模板替换: 未找到有效的HTML模板内容，跳过处理 [taskId=${taskId}]`);
        return cleanedResult;
      }
      
      // 使用第一个有效模板进行替换
      const selectedTemplate = htmlTemplates[0];
      this.logger.log(`HTML模板替换: 选择HTML模板ID=${selectedTemplate.id}, 名称=${selectedTemplate.name} [taskId=${taskId}]`);
      
      // 检查模板是否有有效的HTML代码
      if (!selectedTemplate.htmlCode) {
        this.logger.warn(`HTML模板替换: 模板ID=${selectedTemplate.id}没有有效的HTML代码，跳过处理 [taskId=${taskId}]`);
        return cleanedResult;
      }
      
      // 处理数组类型的结果 - 使用HtmlRenderService处理每个数组项
      if (Array.isArray(cleanedResult)) {
        this.logger.log(`检测到数组类型结果，长度: ${cleanedResult.length}，开始处理HTML模板 [taskId=${taskId}]`);
        
        // 处理数组中的每个对象
        const processedArray = await Promise.all(cleanedResult.map(async (item, index) => {
          if (typeof item !== 'object' || item === null) {
            this.logger.warn(`数组项 #${index} 不是对象类型，跳过处理`);
            return item;
          }
          
          this.logger.log(`处理数组项 #${index}, 包含 ${Object.keys(item).length} 个键值对`);
          
          // 收集替换项
          const textReplacements: TextReplacementItem[] = [];
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
          
          // 收集图片URL
          const imageUrls: string[] = [];
          if (item.images && Array.isArray(item.images)) {
            imageUrls.push(...item.images);
          } else if (item.coverImage && typeof item.coverImage === 'string') {
            imageUrls.push(item.coverImage);
          }
          
          // 使用renderTemplateToHtml方法处理模板
          try {
            const result = await this.htmlRenderService.renderTemplateToHtml(
              selectedTemplate.name,
              imageUrls,
              textReplacements,
              false, // 不包装HTML
              false, // 不使用AI生成内容
              '' // 不提供额外内容
            );
            
            // 获取生成的图片
            try {
              const imageResult = await this.htmlRenderService.htmlToImage(result.html, {
                uploadToSuperbed: true, // 上传到图床
                useAutoWidth: true // 使用自适应宽度
              });
              
              // 返回带图床链接的数组项
              return {
                ...item,
                htmlTemplateProcessed: true,
                htmlTemplateUrl: imageResult.superImageUrl || imageResult.url,
                htmlTemplateLocalUrl: imageResult.url,
                htmlTemplateContent: result.html
              };
            } catch (imgError) {
              this.logger.error(`HTML转图片失败: ${imgError.message}`);
              return {
                ...item,
                htmlTemplateProcessed: true,
                htmlTemplateContent: result.html,
                htmlTemplateError: `HTML转图片失败: ${imgError.message}`
              };
            }
          } catch (renderError) {
            this.logger.error(`渲染HTML模板失败: ${renderError.message}`);
            return {
              ...item,
              htmlTemplateProcessed: false,
              htmlTemplateError: `渲染失败: ${renderError.message}`
            };
          }
        }));
        
        this.logger.log(`HTML模板替换完成，共处理 ${processedArray.length} 个数组项`);
        return processedArray;
      }
      
      // 处理单个对象 - 使用HtmlRenderService处理
      this.logger.log(`检测到对象类型结果，包含 ${Object.keys(cleanedResult).length} 个键值对，开始处理HTML模板 [taskId=${taskId}]`);
      
      // 检查cleanedResult是否有键值对
      if (Object.keys(cleanedResult).length === 0) {
        this.logger.warn(`HTML模板替换: 数据对象为空，跳过处理 [taskId=${taskId}]`);
        return cleanedResult;
      }
      
      // 收集替换项
      const textReplacements: TextReplacementItem[] = [];
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
      
      // 收集图片URL
      const imageUrls: string[] = [];
      if (cleanedResult.images && Array.isArray(cleanedResult.images)) {
        imageUrls.push(...cleanedResult.images);
      } else if (cleanedResult.coverImage && typeof cleanedResult.coverImage === 'string') {
        imageUrls.push(cleanedResult.coverImage);
      }
      
      // 使用renderTemplateToHtml方法处理模板
      try {
        const result = await this.htmlRenderService.renderTemplateToHtml(
          selectedTemplate.name,
          imageUrls,
          textReplacements,
          false, // 不包装HTML
          false, // 不使用AI生成内容
          '' // 不提供额外内容
        );
        
        // 获取生成的图片
        try {
          const imageResult = await this.htmlRenderService.htmlToImage(result.html, {
            uploadToSuperbed: true, // 上传到图床
            useAutoWidth: true // 使用自适应宽度
          });
          
          // 返回带图床链接的结果
          return {
            ...cleanedResult,
            htmlTemplateProcessed: true,
            htmlTemplateUrl: imageResult.superImageUrl || imageResult.url,
            htmlTemplateLocalUrl: imageResult.url,
            htmlTemplateContent: result.html
          };
        } catch (imgError) {
          this.logger.error(`HTML转图片失败: ${imgError.message}`);
          return {
            ...cleanedResult,
            htmlTemplateProcessed: true,
            htmlTemplateContent: result.html,
            htmlTemplateError: `HTML转图片失败: ${imgError.message}`
          };
        }
      } catch (renderError) {
        this.logger.error(`渲染HTML模板失败: ${renderError.message}`);
        return {
          ...cleanedResult,
          htmlTemplateProcessed: false,
          htmlTemplateError: `渲染失败: ${renderError.message}`
        };
      }
    } catch (error) {
      this.logger.error(`HTML模板替换失败: ${error.message}`, error.stack);
      // 在结果中添加错误信息，但不影响任务完成状态
      if (Array.isArray(cleanedResult)) {
        return cleanedResult.map(item => ({
          ...item,
          htmlTemplateError: error.message,
          htmlTemplateProcessed: false
        }));
      } else {
        const errorResult = {
          ...cleanedResult,
          htmlTemplateError: error.message,
          htmlTemplateProcessed: false
        };
        return errorResult;
      }
    }
  }

  /**
   * 重试失败的任务
   * @param userId 用户ID
   * @param taskId 任务ID
   * @returns 重试结果
   */
  async retryTask(userId: string, taskId: string) {
    try {
      this.logger.log(`[retryTask] 用户 ${userId} 重试任务 ${taskId}`);

      // 查找任务
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

      // 检查任务状态，只有失败的任务才能重试
      if (task.status !== 'failed') {
        return {
          success: false,
          message: '只有失败的任务才能重试',
          error: 'INVALID_TASK_STATUS'
        };
      }

      // 验证活动是否仍然有效
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

      // 积分验证 - 重试任务需要重新扣除积分
      const functionId = 'xhs_note';
      const userId_num = parseInt(userId);

      // 验证用户是否有足够积分
      const pointValidation = await this.userBalanceService.validateUserPointForFunction(userId_num, functionId, 1);

      if (!pointValidation.success) {
        this.logger.error(`[retryTask] 用户积分验证失败: ${pointValidation.message}`);
        return {
          success: false,
          message: pointValidation.message || '积分不足，请充值后再试',
          error: pointValidation.error || 'INSUFFICIENT_BALANCE'
        };
      }

      // 扣除积分
      try {
        const deductResult = await this.userBalanceService.deductFromBalance(
          userId_num,
          pointValidation.deductType,
          pointValidation.consumeValue,
          0,
          functionId
        );

        this.logger.log(`[retryTask] 用户ID: ${userId} 积分扣除成功，消耗: ${pointValidation.consumeValue}`);
      } catch (error) {
        this.logger.error(`[retryTask] 扣除积分失败: ${error.message}`);
        return {
          success: false,
          message: '积分扣除失败，请稍后再试',
          error: error.message
        };
      }

      // 重置任务状态
      task.status = 'pending';
      task.error = null;
      task.result = null;
      task.executeId = null;
      task.noteId = null;
      task.apiFailCount = 0;
      task.updateTime = new Date();

      // 保存任务
      await this.xhsProductFactoryRepository.save(task);

      // 重新启动工作流
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
    } catch (error) {
      this.logger.error(`[retryTask] 重试任务失败: ${error.message}`, error.stack);
      return {
        success: false,
        message: error.message || '重试任务失败',
        error: error.message
      };
    }
  }

}