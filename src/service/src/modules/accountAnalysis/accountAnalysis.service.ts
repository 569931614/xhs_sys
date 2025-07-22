import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { DataSource, Repository } from 'typeorm';
import { CreateTaskDto, PlatformType } from './dto/create-task.dto';
import { Result } from '@/common/result';
import { InjectRepository } from '@nestjs/typeorm';
import { FxTask } from './entities/fx-task.entity';
import { OpenAIChatService } from '../ai/openaiChat.service';
import { GlobalConfigService } from '../globalConfig/globalConfig.service';
import { AppEntity } from '../app/app.entity';
import { MoreThanOrEqual } from 'typeorm';
import { AiApiService } from '../ai/ai_api.service';

// 任务轮询管理器，用于跟踪正在更新的任务
interface TaskPollingInfo {
  count: number;       // 已轮询次数
  timerId: NodeJS.Timeout; // 定时器ID
}

// AI生成内容的配置接口
interface AIGenerationConfig {
  appName: string;
  prompt: string;
  defaultSystemPrompt?: string;
  defaultModel?: string;
  defaultTemperature?: number;
  chatId?: string;
  timeout?: number;
}

@Injectable()
export class AccountAnalysisService {
  private readonly logger = new Logger(AccountAnalysisService.name);
  private readonly MAX_POLLING_COUNT = 10; // 最大轮询次数
  private readonly POLLING_INTERVAL = 2 * 60 * 1000; // 轮询间隔(2分钟)
  private taskPollingMap: Map<string, TaskPollingInfo> = new Map(); // 任务轮询状态映射
  
  constructor(
    private dataSource: DataSource,
    @InjectRepository(FxTask)
    private fxTaskRepository: Repository<FxTask>,
    private readonly openAIChatService: OpenAIChatService,
    private readonly globalConfigService: GlobalConfigService,
    @InjectRepository(AppEntity)
    private appEntity: Repository<AppEntity>,
    private readonly aiApiService: AiApiService
  ) {
    // 检查数据库连接
    this.logger.log(`数据库连接状态: ${this.dataSource.isInitialized ? '已连接' : '未连接'}`);
    this.logger.log(`FxTask仓库: ${this.fxTaskRepository ? '已注入' : '未注入'}`);
    
    // 获取FxTask元数据
    try {
      const metadata = this.dataSource.getMetadata(FxTask);
      this.logger.log(`FxTask元数据: 表名=${metadata.tableName}, 列数=${metadata.columns.length}`);
    } catch (error) {
      this.logger.error(`获取FxTask元数据失败: ${error.message}`);
    }
  }
  
  /**
   * 获取不含参数的干净URL
   * @param url 原始URL
   * @returns 不含参数的URL
   */
  private getCleanUrl(url: string): string {
    try {
      // 处理空或非法URL
      if (!url) return '';
      
      // 尝试使用URL对象进行解析
      try {
        const urlObj = new URL(url);
        return `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`;
      } catch (parseError) {
        // 如果URL解析失败，使用简单的字符串处理方式
        this.logger.warn(`URL解析失败: ${parseError.message}, 使用备用处理方法`);
        
        // 移除URL中的查询参数部分
        const questionMarkIndex = url.indexOf('?');
        if (questionMarkIndex !== -1) {
          return url.substring(0, questionMarkIndex);
        }
        
        // 如果没有参数，返回原URL
        return url;
      }
    } catch (error) {
      this.logger.error(`处理URL出错: ${error.message}`);
      return url; // 出错时返回原URL
    }
  }
  
  /**
   * 根据链接域名判断平台类型
   * @param link 账号链接
   * @returns 平台类型：PlatformType.DOUYIN 或 PlatformType.XIAOHONGSHU，无法判断时返回null
   */
  private detectPlatformFromLink(link: string): PlatformType | null {
    try {
      if (!link) return null;
      
      // 尝试解析URL
      let urlObj: URL;
      try {
        urlObj = new URL(link);
      } catch (parseError) {
        // 如果不是有效URL，尝试添加协议前缀再解析
        if (!link.startsWith('http://') && !link.startsWith('https://')) {
          try {
            urlObj = new URL(`https://${link}`);
          } catch (e) {
            this.logger.warn(`无法解析链接: ${link}`);
            return null;
          }
        } else {
          this.logger.warn(`无法解析链接: ${link}`);
          return null;
        }
      }
      
      // 获取域名
      const hostname = urlObj.hostname.toLowerCase();
      
      // 判断平台类型
      if (hostname.includes('douyin.com') || hostname.includes('iesdouyin.com') || 
          hostname.includes('douyinvod.com') || hostname.includes('awemeurlb.com') ||
          hostname.includes('toutiao.com') || hostname.includes('snssdk.com')) {
        return PlatformType.DOUYIN;
      } else if (hostname.includes('xiaohongshu.com') || hostname.includes('xhscdn.com') || 
                hostname.includes('xhsstatic.com') || hostname.includes('xhslink.com') ||
                hostname.includes('xiaohongshu.') || hostname.includes('xhs.')) {
        return PlatformType.XIAOHONGSHU;
      }
      
      // 无法确定平台类型
      return null;
    } catch (error) {
      this.logger.error(`检测平台类型出错: ${error.message}`);
      return null;
    }
  }
  
  /**
   * 创建账号分析任务
   * @param dto 创建任务参数
   */
  async createTask(dto: CreateTaskDto): Promise<Result<any>> {
    try {
      const { platform, type_name, user_id, link, mode } = dto;
      
      if (!link || !user_id) {
        return Result.fail(400, '链接和用户ID不能为空');
      }
      
      // 根据链接自动检测平台类型
      const detectedPlatform = this.detectPlatformFromLink(link);
      
      // 如果提供了平台类型，验证与检测到的平台是否一致
      let finalPlatform = platform;
      let finalTypeName = type_name;
      
      if (detectedPlatform) {
        if (!platform) {
          // 用户未指定平台，使用检测到的平台
          finalPlatform = detectedPlatform;
          finalTypeName = detectedPlatform === PlatformType.DOUYIN ? '抖音' : '小红书';
          this.logger.log(`未指定平台，根据链接自动检测为: ${finalPlatform}`);
        } else if (platform !== detectedPlatform) {
          // 用户指定的平台与检测到的不一致，使用检测到的平台但记录警告
          this.logger.warn(`指定的平台(${platform})与链接检测到的平台(${detectedPlatform})不一致，使用检测到的平台`);
          finalPlatform = detectedPlatform;
          finalTypeName = detectedPlatform === PlatformType.DOUYIN ? '抖音' : '小红书';
        }
      } else if (!platform) {
        // 无法检测且用户未指定平台
        return Result.fail(400, '无法从链接检测平台类型，请明确指定平台');
      }
      
      // 参数验证
      if (!finalPlatform || !finalTypeName) {
        return Result.fail(400, '参数不完整，无法确定平台类型');
      }
      
      // 记录用户ID，用于调试
      this.logger.log(`创建分析任务: 用户ID=${user_id}, 平台=${finalPlatform}, 链接=${link}`);
      
      // 处理链接，移除查询参数
      const cleanLink = this.getCleanUrl(link);
      this.logger.log(`处理后的干净链接: ${cleanLink}`);
      
      // 检查今天是否有相同链接的任务
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // 查询今天创建的所有任务
      const todayTasks = await this.fxTaskRepository.find({
        where: {
          create_time: MoreThanOrEqual(today)
        },
        order: { create_time: 'DESC' }
      });
      
      // 在内存中过滤出相同基础URL的任务
      const existingTask = todayTasks.find(task => this.getCleanUrl(task.fx_url) === cleanLink);
      
      // 如果存在当天相同链接的任务，则复制其内容
      if (existingTask) {
        this.logger.log(`发现当天相同链接的任务: ID=${existingTask.id}, 状态=${existingTask.status}`);
        
        // 创建新任务，但复制已有任务的数据
        const newTask = new FxTask();
        // 为复制的任务生成新的基于原任务ID的唯一ID
        const newTaskId = `copy_${existingTask.task_id}_${Date.now()}`;
        newTask.task_id = newTaskId;
        // 尝试将task_id转为数字作为ID
        newTask.id = parseInt(newTaskId.replace(/\D/g, '')) || Date.now();
        
        newTask.user_id = user_id;
        newTask.type_name = finalTypeName;  // 使用最终确定的平台名称
        newTask.fx_url = link;
        newTask.timeout = existingTask.timeout || 1;
        newTask.status = existingTask.status;
        newTask.create_time = new Date();
        newTask.account_name = existingTask.account_name;
        newTask.followers_count = existingTask.followers_count;
        newTask.likes_count = existingTask.likes_count;
        
        // 如果原任务已完成，则复制内容
        if (existingTask.status === '已完成') {
          newTask.fx_content = existingTask.fx_content;
          newTask.fx_content_jj = existingTask.fx_content_jj;
          newTask.ip_content = existingTask.ip_content;
          newTask.ip_html_content = existingTask.ip_html_content;
          newTask.update_time = new Date();
        }
        
        // 保存新任务
        const savedTask = await this.fxTaskRepository.save(newTask);
        this.logger.log(`复制任务保存成功: ID=${savedTask.id}, 任务ID=${savedTask.task_id}`);
        
        return Result.success({
          id: savedTask.id,
          task_id: savedTask.task_id,
          timeout: savedTask.timeout
        }, '创建分析任务成功（使用今日相同链接的数据）');
      }
      
      // 如果不存在当天相同链接的任务，则正常创建
      let apiUrl = 'https://dy.aivip1.top/pc/api/create_fx_task.php';
      let apiData;
      
      if (finalPlatform === PlatformType.DOUYIN) {
        apiData = {
          user_id: "1", // 固定为1
          douyinLink: link,
          selectedMode: mode || '10'
        };
      } else if (finalPlatform === PlatformType.XIAOHONGSHU) {
        apiData = {
          type_name: '小红书',
          user_id: "1", // 固定为1
          douyinLink: link,
          selectedMode: mode || '1'
        };
      } else {
        return Result.fail(400, '不支持的平台类型');
      }
      
      this.logger.log(`发送分析请求: ${apiUrl}, 数据: ${JSON.stringify(apiData)}`);
      
      // 发送请求到分析API
      const apiResponse = await axios.post(apiUrl, apiData, {
        headers: {
          'accept': 'application/json, text/plain, */*',
          'accept-language': 'zh-CN,zh;q=0.9',
          'content-type': 'application/json',
          'origin': 'https://dy.aivip1.top',
          'referer': 'https://dy.aivip1.top/pc/home',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36'
        }
      });
      
      if (!apiResponse.data.success) {
        this.logger.log("创建分析任务失败:",JSON.stringify(apiResponse.data));
        return Result.fail(400, apiResponse.data.message || '创建分析任务失败');
      }
      
      const taskData = apiResponse.data.data;
      
      try {
        // 创建任务实体并保存
        const fxTask = new FxTask();
        // 不使用API返回的task_id作为实体的id，让数据库自动生成ID
        fxTask.user_id = user_id;
        fxTask.type_name = finalTypeName;
        fxTask.task_id = taskData.task_id;
        fxTask.fx_url = link;
        fxTask.timeout = taskData.timeout || 1;
        fxTask.status = '进行中';
        fxTask.create_time = new Date();
        
        // 如果外部API返回了id，保存到external_id字段
        if (taskData.id) {
          this.logger.log(`外部API返回的任务ID: ${taskData.id}`);
          fxTask.external_id = parseInt(taskData.id);
        }
        
        // 添加详细日志
        this.logger.log(`准备保存任务到数据库: ${JSON.stringify({
          id: fxTask.id,
          user_id: fxTask.user_id,
          type_name: fxTask.type_name,
          task_id: fxTask.task_id,
          external_id: fxTask.external_id,
          status: fxTask.status
        })}`);
        
        const savedTask = await this.fxTaskRepository.save(fxTask);
        this.logger.log(`任务保存成功: ID=${savedTask.id}, 任务ID=${savedTask.task_id}`);
        
        // 立即获取一次任务详情
        await this.fetchTaskDetailAndSave(savedTask.id, taskData.task_id);
        
        // 启动异步轮询更新任务
        this.startTaskPolling(savedTask.id, taskData.task_id);
        
        return Result.success({
          id: savedTask.id,
          ...taskData
        }, '创建分析任务成功');
      } catch (error) {
        this.logger.error(`保存分析任务出错: ${error.message}`);
        this.logger.error(`保存分析任务出错详情: ${error.stack}`);
        return Result.fail(500, '保存分析任务出错: ' + error.message);
      }
    } catch (error) {
      this.logger.error(`创建分析任务出错: ${error.message}`);
      return Result.fail(500, '创建分析任务出错: ' + error.message);
    }
  }
  
  /**
   * 获取用户的分析任务列表
   * @param userId 用户ID
   */
  async getTasks(userId: number): Promise<Result<any>> {
    try {
      if (!userId) {
        return Result.fail(400, '用户ID不能为空');
      }
      
      // 使用Repository查询
      const tasks = await this.fxTaskRepository.find({
        where: { user_id: userId },
        order: { create_time: 'DESC' }
      });
      
      return Result.success(tasks, '获取分析任务列表成功');
    } catch (error) {
      this.logger.error(`获取分析任务列表出错: ${error.message}`);
      return Result.fail(500, '获取分析任务列表出错: ' + error.message);
    }
  }
  
  /**
   * 获取用户的分析任务列表（排除长文本内容）
   * @param userId 用户ID
   */
  async getTasksWithoutContent(userId: number): Promise<Result<any>> {
    try {
      if (!userId) {
        return Result.fail(400, '用户ID不能为空');
      }
      
      // 使用Repository查询，但排除长文本字段
      const tasks = await this.fxTaskRepository.find({
        select: ['id', 'user_id', 'task_id', 'type_name', 'fx_url', 'timeout', 'status', 'create_time', 'update_time', 'account_name', 'followers_count', 'likes_count'],
        where: { user_id: userId },
        order: { create_time: 'DESC' }
      });
      
      return Result.success(tasks, '获取分析任务列表成功');
    } catch (error) {
      this.logger.error(`获取分析任务列表出错: ${error.message}`);
      return Result.fail(500, '获取分析任务列表出错: ' + error.message);
    }
  }
  
  /**
   * 获取分析任务结果
   * @param taskId 任务ID
   * @param id 任务记录ID
   */
  async getTaskResult(taskId: string, id?: number){
    try {
      if (!taskId) {
        return Result.fail(400, '任务ID不能为空');
      }
      
      // 使用Repository查询，如果提供了id则使用id查询，否则使用taskId查询
      const whereCondition = id ? { id } : { task_id: taskId };
      
      // 使用Repository查询
      const task = await this.fxTaskRepository.findOne({
        where: whereCondition
      });
      
      if (!task) {
        return Result.fail(404, '未找到该分析任务');
      }
      
      // 检查任务是否已完成
      if (task.status !== '已完成' && task.status !== '失败') {
        try {
          // 更新任务状态
          await this.fetchTaskDetailAndSave(task.id, task.task_id);
          
          // 重新获取更新后的任务
          const updatedTask = await this.fxTaskRepository.findOne({
            where: { id: task.id }
          });
          
          if (updatedTask) {
            return Result.success(updatedTask, '获取分析任务结果成功');
          }
        } catch (error) {
          this.logger.error(`更新分析任务状态出错: ${error.message}`);
          // 即使更新失败，也尝试返回现有的任务信息
        }
      }
      
      return task;
    } catch (error) {
      this.logger.error(`获取分析任务结果出错: ${error.message}`);
      return Result.fail(500, '获取分析任务结果出错: ' + error.message);
    }
  }
  
  /**
   * 从外部API获取任务详情并保存到数据库
   * @param id 数据库中的任务ID
   * @param taskId 任务唯一标识
   */
  private async fetchTaskDetailAndSave(id: number, taskId: string): Promise<boolean> {
    try {
      // 先获取任务信息，用于获取external_id
      const task = await this.fxTaskRepository.findOne({
        where: { id }
      });
      
      if (!task) {
        this.logger.warn(`未找到任务: ID=${id}`);
        return false;
      }
      
      // 优先使用external_id，如果没有则使用taskId
      const externalId = task.external_id ? task.external_id : id;
      
      // 固定使用user_id=1请求详情
      const apiUrl = `https://dy.aivip1.top/pc/api/get_user_task.php?user_id=1&task_id=${taskId}&id=${externalId}`;
      
      this.logger.log(`获取任务详情: ${apiUrl}`);
      
      const apiResponse = await axios.get(apiUrl, {
        headers: {
          'accept': 'application/json, text/plain, */*',
          'accept-language': 'zh-CN,zh;q=0.9',
          'origin': 'https://dy.aivip1.top',
          'referer': 'https://dy.aivip1.top/pc/home',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36'
        }
      });
      
      // 检查API响应是否包含任务数据
      if (apiResponse.data && apiResponse.data.task) {
        const taskDetail = apiResponse.data.task;
        
        // 已经在上面获取了任务，不需要再次查询
        if (task) {
          // 尝试解析fx_content内容（如果有的话）
          if (taskDetail.fx_content && typeof taskDetail.fx_content === 'string') {
            try {
              // 尝试解析JSON以验证数据格式
              const fxContentData = JSON.parse(taskDetail.fx_content);
              this.logger.log(`任务${id}的fx_content是有效的JSON`);
              
              // 提取账号名、粉丝数和点赞数
              if (fxContentData.user_data) {
                const userData = fxContentData.user_data;
                task.account_name = userData.nickname || null;
                task.followers_count = userData.followers_count || null;
                task.likes_count = userData.likes_count || null;
                
                this.logger.log(`从fx_content提取数据: 账号名=${task.account_name}, 粉丝数=${task.followers_count}, 点赞数=${task.likes_count}`);
              }
            } catch (error) {
              this.logger.warn(`任务${id}的fx_content不是有效的JSON: ${error.message}`);
            }
          }
          
          // 更新任务信息
          task.status = taskDetail.status || task.status;
          task.fx_content = taskDetail.fx_content || task.fx_content;
          task.fx_content_jj = taskDetail.fx_content_jj || task.fx_content_jj;
          task.ip_content = taskDetail.ip_content || task.ip_content;
          task.update_time = new Date();
          
          // 当任务状态为已完成且没有ip_content内容时，尝试使用AI生成分析结果
          if (task.status === '已完成' && (!task.ip_html_content || !task.ip_content)) {
            try {
              this.logger.log(`任务${id}已完成但缺少分析内容，尝试使用AI生成分析`);
              
              // 生成AI分析内容
              const aiAnalysisResult = await this.generateAIAnalysis(task);
              if (aiAnalysisResult) {
                // 提取HTML内容
                const htmlMatch = aiAnalysisResult.match(/```html([\s\S]*?)```/);
                if (htmlMatch && htmlMatch[1]) {
                  task.ip_html_content = htmlMatch[1].trim();
                  this.logger.log(`已提取HTML内容，字符数: ${task.ip_html_content.length}`);
                } else {
                  this.logger.warn(`无法从AI回复中提取HTML内容`);
                }
                
                task.ip_content = aiAnalysisResult;
                this.logger.log(`已生成AI分析内容，字符数: ${aiAnalysisResult.length}`);
              }
            } catch (aiError) {
              this.logger.error(`使用AI生成分析内容失败: ${aiError.message}`);
            }
          }
          
          await this.fxTaskRepository.save(task);
          
          this.logger.log(`更新任务详情成功: 任务ID=${taskId}, 状态=${task.status}`);
          
          // 如果任务已完成，返回true
          return task.status === '已完成';
        } else {
          this.logger.warn(`未找到要更新的任务: 任务ID=${taskId}`);
        }
      } else {
        this.logger.warn(`API未返回任务详情: 任务ID=${taskId}`);
      }
      
      return false;
    } catch (error) {
      this.logger.error(`获取任务详情出错: ${error.message}`);
      return false;
    }
  }
  
  /**
   * 使用AI生成账号分析内容
   * @param task 任务信息
   * @returns AI生成的分析内容
   */
  private async generateAIAnalysis(task: FxTask): Promise<string> {
    try {
      // 确保任务有fx_content内容
      if (!task.fx_content) {
        this.logger.warn(`任务${task.id}没有fx_content数据，无法生成AI分析`);
        return null;
      }
      
      // 构建提示词
      let prompt = `需要分析的IP博主视频信息如下：${task.fx_content}，IP博主信息如下：${task.ip_content}`;
      
      return await this.aiApiService.generateAIContent({
        appName: "IP分析",
        prompt: prompt,
        chatId: `account-analysis-${task.id}`,
      });
    } catch (error) {
      this.logger.error(`生成AI分析内容出错: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * 启动任务轮询更新
   * @param id 数据库中的任务ID
   * @param taskId 任务唯一标识
   */
  private startTaskPolling(id: number, taskId: string): void {
    // 确保不重复启动轮询
    if (this.taskPollingMap.has(taskId)) {
      this.logger.warn(`任务已在轮询中: ${taskId}`);
      return;
    }
    
    this.logger.log(`启动任务轮询更新: 任务ID=${taskId}`);
    
    // 创建轮询任务
    const timerId = setInterval(async () => {
      try {
        // 获取当前轮询信息
        const pollingInfo = this.taskPollingMap.get(taskId);
        
        if (!pollingInfo) {
          this.logger.error(`轮询信息不存在: ${taskId}`);
          return;
        }
        
        // 更新轮询次数
        pollingInfo.count++;
        this.logger.log(`轮询更新任务[${pollingInfo.count}/${this.MAX_POLLING_COUNT}]: 任务ID=${taskId}`);
        
        // 获取任务详情
        const isCompleted = await this.fetchTaskDetailAndSave(id, taskId);
        
        // 如果任务已完成或者达到最大轮询次数，停止轮询
        if (isCompleted || pollingInfo.count >= this.MAX_POLLING_COUNT) {
          if (isCompleted) {
            this.logger.log(`任务已完成，停止轮询: 任务ID=${taskId}`);
          } else {
            this.logger.warn(`达到最大轮询次数，任务未完成: 任务ID=${taskId}`);
            
            // 将任务状态设置为失败
            const task = await this.fxTaskRepository.findOne({
              where: { id }
            });
            
            if (task && task.status !== '已完成') {
              task.status = '失败';
              task.update_time = new Date();
              await this.fxTaskRepository.save(task);
              this.logger.warn(`将任务状态设置为失败: 任务ID=${taskId}`);
            }
          }
          
          // 停止轮询
          this.stopTaskPolling(taskId);
        }
      } catch (error) {
        this.logger.error(`轮询更新任务出错: ${error.message}`);
      }
    }, this.POLLING_INTERVAL);
    
    // 保存轮询信息
    this.taskPollingMap.set(taskId, {
      count: 0,
      timerId
    });
  }
  
  /**
   * 停止任务轮询
   * @param taskId 任务唯一标识
   */
  private stopTaskPolling(taskId: string): void {
    const pollingInfo = this.taskPollingMap.get(taskId);
    
    if (pollingInfo) {
      clearInterval(pollingInfo.timerId);
      this.taskPollingMap.delete(taskId);
      this.logger.log(`停止任务轮询: 任务ID=${taskId}`);
    }
  }
  
  /**
   * 手动刷新任务状态
   * @param id 任务记录ID
   * @param taskId 任务ID
   * @param userId 用户ID
   */
  async refreshTask(id: number, taskId: string, userId: number): Promise<Result<any>> {
    try {
      if (!id || !taskId) {
        return Result.fail(400, '参数不完整');
      }
      
      // 检查任务是否存在且属于该用户
      const task = await this.fxTaskRepository.findOne({
        where: { id, task_id: taskId, user_id: userId }
      });
      
      if (!task) {
        return Result.fail(404, '未找到该分析任务或无权访问');
      }
      
      // 如果任务已完成或失败，则不需要刷新
      if (task.status === '已完成' || task.status === '失败') {
        return Result.success(task, '任务已完成或失败，无需刷新');
      }
      
      // 异步处理刷新操作，不阻塞用户界面
      this.asyncRefreshTask(id, taskId);
      
      // 立即返回任务状态（进行中）
      return Result.success(task, '任务刷新请求已发送，正在后台更新');
    } catch (error) {
      this.logger.error(`刷新任务状态出错: ${error.message}`);
      return Result.fail(500, '刷新任务状态出错: ' + error.message);
    }
  }
  
  /**
   * 异步刷新任务状态
   * @param id 任务记录ID
   * @param taskId 任务ID
   */
  private async asyncRefreshTask(id: number, taskId: string): Promise<void> {
    try {
      this.logger.log(`开始异步刷新任务: ID=${id}, 任务ID=${taskId}`);
      
      // 更新任务状态
      const updated = await this.fetchTaskDetailAndSave(id, taskId);
      
      if (updated) {
        this.logger.log(`异步刷新任务成功: ID=${id}, 任务ID=${taskId}`);
      } else {
        this.logger.warn(`异步刷新任务未成功完成: ID=${id}, 任务ID=${taskId}`);
      }
    } catch (error) {
      this.logger.error(`异步刷新任务出错: ID=${id}, 任务ID=${taskId}, 错误=${error.message}`);
    }
  }
} 