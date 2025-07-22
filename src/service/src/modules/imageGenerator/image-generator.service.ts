import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import axios from 'axios';
import { ImageGeneratorTask } from './image-generator.entity';
import { ImageDownloadUrl } from './image-download-url.entity';
import { CreateImageDto } from './dto/create-image.dto';
import { RedisCacheService } from '../redisCache/redisCache.service';
import { ImageUploadService } from '../ai/image-upload.service';

@Injectable()
export class ImageGeneratorService {
  constructor(
    @InjectRepository(ImageGeneratorTask)
    private imageTaskRepository: Repository<ImageGeneratorTask>,
    @InjectRepository(ImageDownloadUrl)
    private imageDownloadUrlRepository: Repository<ImageDownloadUrl>,
    private redisCacheService: RedisCacheService,
    private imageUploadService: ImageUploadService,
  ) {}

  /**
   * 获取授权令牌
   * @returns 授权令牌
   */
  private async getAuthToken(): Promise<string> {
    return await this.redisCacheService.getCreativeAuthToken();
  }

  /**
   * 处理图片URL列表，过滤掉无效的URL
   * @param urls 图片URL列表
   * @returns 过滤后的URL列表
   */
  private filterValidImageUrls(urls: string[]): string[] {
    if (!urls || !Array.isArray(urls)) return [];
    
    // 过滤掉包含null的URL和空字符串
    return urls.filter(url => {
      // 检查URL是否为有效字符串且不包含null
      return url && typeof url === 'string' && !url.includes('null');
    });
  }

  /**
   * 提取图片URL并过滤无效URL
   * @param imageData API返回的图片数据
   * @returns 处理后的URL列表
   */
  private extractImageUrls(imageData: any[]): string[] {
    if (!imageData || !Array.isArray(imageData)) return [];
    
    const rawUrls = imageData.map(image => {
      if (!image || !image.thumbUrl) return null;
      return `https:${image.thumbUrl}`;
    });
    
    return this.filterValidImageUrls(rawUrls);
  }

  /**
   * 等待一段时间
   * @param ms 等待的毫秒数
   */
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private ckUserId = "24209700";

  /**
   * 获取对应模式的replaceId
   * @param intellectId 模式ID
   * @returns 对应的replaceId
   */
  private getReplaceIdByIntellectId(intellectId: number): string {
    // 根据不同的intellectId返回对应的replaceId
    switch (intellectId) {
      case 280: // 表情封面模式
        return "7532";
      case 231: // 文案配图模式
        return "7620";
      case 374: // 备忘录内页模式
        return "7860"; // 主标题的replaceId
      case 148: // 二宫格拼图模式
        return "5554"; // 主标题的replaceId
      case 147: // 三宫格拼图模式
        return "5558"; // 主标题的replaceId
      case 130: // 四宫格拼图模式
        return "5487"; // 主标题的replaceId
      case 267: // 大字报模式
      default:  // 默认使用大字报模式的replaceId
        return "7398";
    }
  }

  /**
   * 获取对应模式的userInputJson模板
   * @param intellectId 模式ID
   * @param title 用户输入的标题内容
   * @param additionalFields 额外的输入字段
   * @returns 对应模式的userInputJson
   */
  private getUserInputJsonByIntellectId(intellectId: number, title: string, additionalFields?: Record<string, string>): string {
    // 根据不同的intellectId返回对应的userInputJson
    switch (intellectId) {
      case 280: // 表情封面模式
        return JSON.stringify([{
          "markName": "主标题",
          "markType": 1,
          "value": title,
          "replaceType": 6,
          "replaceId": "7532"
        }]);
        
      case 231: // 文案配图模式 - 多个输入框
        return JSON.stringify([
          {
            "markName": "主标题",
            "markType": 1,
            "value": title,
            "replaceType": 6,
            "replaceId": "6867"
          },
          {
            "markName": "副标题",
            "markType": 1,
            "value": additionalFields?.subtitle || "副标题示例",
            "replaceType": 6,
            "replaceId": "6869"
          },
          {
            "markName": "段落标题1",
            "markType": 1,
            "value": additionalFields?.paragraph1Title || "段落标题1示例",
            "replaceType": 6,
            "replaceId": "6861"
          },
          {
            "markName": "段落正文1",
            "markType": 1,
            "value": additionalFields?.paragraph1Content || "段落正文1示例内容",
            "replaceType": 6,
            "replaceId": "6862"
          },
          {
            "markName": "段落标题2",
            "markType": 1,
            "value": additionalFields?.paragraph2Title || "段落标题2示例",
            "replaceType": 6,
            "replaceId": "6863"
          },
          {
            "markName": "段落正文2",
            "markType": 1,
            "value": additionalFields?.paragraph2Content || "段落正文2示例内容",
            "replaceType": 6,
            "replaceId": "6864"
          },
          {
            "markName": "段落标题3",
            "markType": 1,
            "value": additionalFields?.paragraph3Title || "段落标题3示例",
            "replaceType": 6,
            "replaceId": "6865"
          },
          {
            "markName": "段落正文3",
            "markType": 1,
            "value": additionalFields?.paragraph3Content || "段落正文3示例内容",
            "replaceType": 6,
            "replaceId": "6866"
          }
        ]);
      
      case 374: // 备忘录内页模式
        return JSON.stringify([
          {
            "markName": "主标题",
            "markType": 1,
            "value": title,
            "replaceType": 6,
            "replaceId": "7860"
          },
          {
            "markName": "段落标题1",
            "markType": 1,
            "value": additionalFields?.paragraph1Title || "段落标题1示例",
            "replaceType": 6,
            "replaceId": "7875"
          },
          {
            "markName": "段落正文1",
            "markType": 1,
            "value": additionalFields?.paragraph1Content || "段落正文1示例内容",
            "replaceType": 6,
            "replaceId": "7876"
          }
        ]);
        
      case 148: // 二宫格拼图模式
        return JSON.stringify([
          {
            "markName": "主标题",
            "markType": 1,
            "value": title,
            "replaceType": 6,
            "replaceId": "5554"
          },
          {
            "markName": "副标题",
            "markType": 1,
            "value": additionalFields?.subtitle || "副标题示例",
            "replaceType": 6,
            "replaceId": "5555"
          },
          {
            "markName": "图1",
            "markType": 2,
            "value": parseInt(additionalFields?.image1 || "0"),
            "replaceType": 9,
            "source": 23,
            "replaceId": "5556"
          },
          {
            "markName": "图2",
            "markType": 2,
            "value": parseInt(additionalFields?.image2 || "0"),
            "replaceType": 9,
            "source": 23,
            "replaceId": "5557"
          }
        ]);
        
      case 147: // 三宫格拼图模式
        return JSON.stringify([
          {
            "markName": "主标题",
            "markType": 1,
            "value": title,
            "replaceType": 6,
            "replaceId": "5558"
          },
          {
            "markName": "副标题",
            "markType": 1,
            "value": additionalFields?.subtitle || "副标题示例",
            "replaceType": 6,
            "replaceId": "5559"
          },
          {
            "markName": "图1",
            "markType": 2,
            "value": parseInt(additionalFields?.image1 || "0"),
            "replaceType": 9,
            "source": 23,
            "replaceId": "5560"
          },
          {
            "markName": "图2",
            "markType": 2,
            "value": parseInt(additionalFields?.image2 || "0"),
            "replaceType": 9,
            "source": 23,
            "replaceId": "5561"
          },
          {
            "markName": "图3",
            "markType": 2,
            "value": parseInt(additionalFields?.image3 || "0"),
            "replaceType": 9,
            "source": 23,
            "replaceId": "5562"
          }
        ]);
        
      case 130: // 四宫格拼图模式
        return JSON.stringify([
          {
            "markName": "主标题",
            "markType": 1,
            "value": title,
            "replaceType": 6,
            "replaceId": "5487"
          },
          {
            "markName": "副标题",
            "markType": 1,
            "value": additionalFields?.subtitle || "副标题示例",
            "replaceType": 6,
            "replaceId": "5488"
          },
          {
            "markName": "图1",
            "markType": 2,
            "value": parseInt(additionalFields?.image1 || "0"),
            "replaceType": 9,
            "source": 23,
            "replaceId": "5484"
          },
          {
            "markName": "图2",
            "markType": 2,
            "value": parseInt(additionalFields?.image2 || "0"),
            "replaceType": 9,
            "source": 23,
            "replaceId": "5485"
          },
          {
            "markName": "图3",
            "markType": 2,
            "value": parseInt(additionalFields?.image3 || "0"),
            "replaceType": 9,
            "source": 23,
            "replaceId": "5486"
          },
          {
            "markName": "图4",
            "markType": 2,
            "value": parseInt(additionalFields?.image4 || "0"),
            "replaceType": 9,
            "source": 23,
            "replaceId": "5493"
          }
        ]);
        
      case 267: // 大字报模式
      default:
        return JSON.stringify([{
          "markName": "主标题",
          "markType": 1,
          "value": title,
          "replaceType": 6,
          "replaceId": "7398"
        }]);
    }
  }

  /**
   * 获取任务生成的图片URL，支持重试
   * @param taskIds 任务ID列表
   * @param retryCount 重试次数
   * @param retryDelay 重试延迟(毫秒)
   * @returns 图片URL和任务状态
   */
  private async getTaskImages(
    taskIds: string[], 
    retryCount: number = 3, 
    retryDelay: number = 1000
  ): Promise<{ imageUrls: string[], success: boolean, errorMsg?: string }> {
    let attempt = 0;
    let lastResponse = null;
    let bestImageUrls: string[] = []; // 保存到目前为止最佳的图片URL集合
    
    console.log(`开始获取图片，任务数量: ${taskIds.length}，最大重试次数: ${retryCount}，重试间隔: ${retryDelay}ms`);
    
    while (attempt < retryCount) {
      attempt++;
      
      try {
        // 获取授权令牌
        const authToken = await this.getAuthToken();
        
        // 调用API获取生成的图片链接
        const taskIdsParam = taskIds.join(',');
        const imageResponse = await axios.get(
          `https://gw.chuangkit.com/imagehub/task/mark/replace/result?_dataType=json&client_type=0&taskIds=${taskIdsParam}`,
          {
            headers: {
              'Accept': 'application/json, text/plain, */*',
              'Accept-Language': 'zh-CN,zh;q=0.9',
              'Authorization': `Bearer ${authToken}`,
              'Connection': 'keep-alive',
              'Content-Type': 'application/json',
              'Origin': 'https://www.chuangkit.com',
              'Referer': 'https://www.chuangkit.com/',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36'
            }
          }
        );
        
        lastResponse = imageResponse;
        
        // 检查响应
        if (imageResponse.data?.body?.code !== 200) {
          console.error(`API响应错误，尝试 ${attempt}/${retryCount}:`, imageResponse.data);
          if (attempt < retryCount) {
            console.log(`等待${retryDelay}ms后重试...`);
            await this.delay(retryDelay);
            continue;
          }
          return { 
            imageUrls: bestImageUrls.length > 0 ? bestImageUrls : [], 
            success: bestImageUrls.length > 0,
            errorMsg: '获取图片链接失败' 
          };
        }
        
        // 获取图片数据
        const imageData = imageResponse.data.body.data;
        if (!imageData || imageData.length === 0) {
          console.error(`未获取到图片数据，尝试 ${attempt}/${retryCount}`);
          if (attempt < retryCount) {
            console.log(`等待${retryDelay}ms后重试...`);
            await this.delay(retryDelay);
            continue;
          }
          return { 
            imageUrls: bestImageUrls.length > 0 ? bestImageUrls : [], 
            success: bestImageUrls.length > 0,
            errorMsg: '没有获取到图片数据' 
          };
        }
        
        // 提取并过滤图片URL列表
        const imageUrls = this.extractImageUrls(imageData);
        console.log(`尝试 ${attempt}/${retryCount}: 获取到 ${imageUrls.length}/${taskIds.length} 张有效图片`);
        
        // 更新最佳图片集合
        if (imageUrls.length > bestImageUrls.length) {
          bestImageUrls = [...imageUrls];
          console.log(`更新最佳图片集合，当前有 ${bestImageUrls.length} 张有效图片`);
        }
        
        // 检查是否所有图片都生成完成 - 过滤后的URL数量是否和任务数量一致
        if (imageUrls.length < taskIds.length) {
          console.log(`获取到的有效图片数量(${imageUrls.length})少于任务数量(${taskIds.length})，尝试 ${attempt}/${retryCount}`);
          
          // 确保即使图片数量不足，也完成所有重试次数
          if (attempt < retryCount) {
            console.log(`等待${retryDelay}ms后重试...`);
            await this.delay(retryDelay);
            continue;
          }
          
          // 如果已经达到最大重试次数，但有最佳图片集合，则返回最佳集合
          if (bestImageUrls.length > 0) {
            console.log(`已达到最大重试次数，返回最佳图片集合 (${bestImageUrls.length}/${taskIds.length})`);
            return { imageUrls: bestImageUrls, success: true };
          }
          
          // 如果没有最佳集合，返回当前获取的图片集合
          return { imageUrls, success: true };
        }
        
        // 如果图片数量完整，直接返回
        console.log(`获取到完整的图片数量 (${imageUrls.length}/${taskIds.length})`);
        return { imageUrls, success: true };
      } catch (error) {
        console.error(`获取图片数据失败 (尝试 ${attempt}/${retryCount}):`, error);
        
        if (attempt < retryCount) {
          console.log(`等待${retryDelay}ms后重试...`);
          await this.delay(retryDelay);
          continue;
        }
        
        // 如果所有重试都失败，但有最佳图片集合，则返回最佳集合
        if (bestImageUrls.length > 0) {
          console.log(`虽然出错，但返回之前获取的最佳图片集合 (${bestImageUrls.length}/${taskIds.length})`);
          return { imageUrls: bestImageUrls, success: true };
        }
        
        return { 
          imageUrls: [], 
          success: false, 
          errorMsg: error.message || '获取图片数据失败' 
        };
      }
    }
    
    // 如果所有重试都失败，但有最后一次响应，尝试从中提取有效的URL
    if (lastResponse && lastResponse.data?.body?.data) {
      const imageData = lastResponse.data.body.data;
      const imageUrls = this.extractImageUrls(imageData);
      
      // 更新最佳图片集合
      if (imageUrls.length > bestImageUrls.length) {
        bestImageUrls = [...imageUrls];
      }
      
      if (bestImageUrls.length > 0) {
        console.log(`经过${retryCount}次尝试，成功获取到${bestImageUrls.length}张有效图片`);
        return { imageUrls: bestImageUrls, success: true };
      }
    }
    
    return { 
      imageUrls: [], 
      success: false, 
      errorMsg: '获取图片失败，已达到最大重试次数' 
    };
  }

  /**
   * 生成图片
   * @param createImageDto 图片生成参数
   * @param userId 用户ID
   */
  async generateImage(createImageDto: CreateImageDto, userId: string): Promise<any> {
    try {
      console.log('接收到生成图片请求:', JSON.stringify(createImageDto, null, 2));
      
      // 获取pageNo参数，默认为1
      const pageNo = createImageDto.pageNo || 1;
      console.log(`当前生成页码: ${pageNo}`);
      
      // 如果是继续生成（pageNo > 1），需要查找之前的任务记录
      let imageTask: ImageGeneratorTask;
      
      if (pageNo > 1 && createImageDto.previousTaskId) {
        // 尝试查找之前的任务记录
        imageTask = await this.imageTaskRepository.findOne({
          where: { id: createImageDto.previousTaskId, userId }
        });
        
        if (!imageTask) {
          return {
            code: 400,
            data: null,
            message: '未找到原始任务记录，无法继续生成'
          };
        }
        
        // 更新任务状态
        imageTask.status = 'processing';
        await this.imageTaskRepository.save(imageTask);
      } else {
        // 如果是新任务，创建任务记录
        imageTask = this.imageTaskRepository.create({
          userId,
          prompt: createImageDto.title,
          status: 'pending',
        });
        await this.imageTaskRepository.save(imageTask);
      }

      // 获取授权令牌
      const authToken = await this.getAuthToken();

      // 根据不同模式选择不同的intellectId
      const intellectId = createImageDto.intellectId || 267; // 默认使用大字报模式的ID
      
      // 获取对应的replaceId
      const replaceId = this.getReplaceIdByIntellectId(intellectId);
      
      // 生成10位随机数字
      const randomNum = Math.floor(Math.random() * 9000000000) + 1000000000;
      
      // 按照规定格式创建requestId: user_id+"_"+intellectId+"_"+10位纯数字随机数
      // 注意：这里的userId是实际用户的ID，用于区分不同用户的请求
      const requestId = this.ckUserId+`_${intellectId}_${randomNum}`;
      
      // 生成userInputJson
      const userInputJson = this.getUserInputJsonByIntellectId(intellectId, createImageDto.title, createImageDto.additionalFields);
      
      // 在reportInfo中使用固定的user_id(24209700)，与请求ID中使用的实际用户ID无关
      const reportInfo = JSON.stringify({
        "versions_type": "经典版",
        "business_lines": "企业线",
        "business_id": 23900253,
        "user_vip": "付费用户",
        "user_id": this.ckUserId  // 固定user_id值
      });

      // 打印详细请求参数
      console.log('======== 图片生成请求参数 ========');
      console.log(`请求模式ID: ${intellectId}, 模式名称: ${this.getIntellectIdName(intellectId)}`);
      console.log(`请求ID: ${requestId}`);
      console.log(`标题: ${createImageDto.title}`);
      console.log(`页码: ${pageNo}`);
      console.log('用户输入JSON:');
      console.log(userInputJson);
      console.log('额外字段:');
      console.log(JSON.stringify(createImageDto.additionalFields || {}, null, 2));
      console.log('完整请求体:');
      const requestBody = {
        pageNo: pageNo,
        pageSize: 10,
        intellectId,
        userInputJson,
        requestId,
        reportInfo
      };
      console.log(JSON.stringify(requestBody, null, 2));
      console.log('====================================');

      // 调用API获取任务ID列表
      const taskResponse = await axios.post(
        'https://gw.chuangkit.com/tools/task/mark/group/replace?_dataType=json&client_type=0',
        requestBody,
        {
          headers: {
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'zh-CN,zh;q=0.9',
            'Authorization': `Bearer ${authToken}`,
            'Connection': 'keep-alive',
            'Content-Type': 'application/json',
            'Origin': 'https://www.chuangkit.com',
            'Referer': 'https://www.chuangkit.com/',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36'
          }
        }
      );

      // 记录API响应
      console.log('======== 图片生成响应 ========');
      console.log(`响应状态码: ${taskResponse.status}`);
      console.log(`响应数据: ${JSON.stringify(taskResponse.data, null, 2)}`);
      console.log('================================');

      // 检查响应
      if (taskResponse.data?.body?.code !== 200) {
        // 更新任务状态为失败
        imageTask.status = 'failed';
        imageTask.errorMessage = '获取任务ID失败';
        await this.imageTaskRepository.save(imageTask);
        
        return {
          code: 400,
          data: null,
          message: '获取任务ID失败'
        };
      }

      // 获取任务ID列表
      const taskDtoList = taskResponse.data.body.data.taskDtoList;
      if (!taskDtoList || taskDtoList.length === 0) {
        // 更新任务状态为失败
        imageTask.status = 'failed';
        imageTask.errorMessage = '没有获取到任务ID';
        await this.imageTaskRepository.save(imageTask);
        
        return {
          code: 400,
          data: null,
          message: '没有获取到任务ID'
        };
      }

      // 提取所有任务ID并序列化为JSON字符串
      const taskIds = taskDtoList.map(task => task.taskId);
      let existingTaskIds = [];
      
      // 如果是继续生成，合并原有的任务ID列表
      if (pageNo > 1 && imageTask.taskIds) {
        try {
          existingTaskIds = JSON.parse(imageTask.taskIds);
          if (!Array.isArray(existingTaskIds)) {
            existingTaskIds = [existingTaskIds]; // 处理非数组情况
          }
        } catch (e) {
          console.error('解析现有任务ID失败，使用空数组:', e);
        }
      }
      
      // 合并任务ID列表
      const allTaskIds = [...existingTaskIds, ...taskIds];
      const taskIdsStr = JSON.stringify(allTaskIds);

      // 更新任务记录
      imageTask.taskIds = taskIdsStr; // 保存为JSON字符串
      imageTask.status = 'processing';
      await this.imageTaskRepository.save(imageTask);

      // 等待并获取图片URL，支持重试
      const { imageUrls, success, errorMsg } = await this.getTaskImages(taskIds, 5, 1500);
      
      if (!success || imageUrls.length === 0) {
        // 更新任务状态为失败
        imageTask.status = 'failed';
        imageTask.errorMessage = errorMsg || '获取图片失败';
        await this.imageTaskRepository.save(imageTask);
        
        return {
          code: 400,
          data: null,
          message: errorMsg || '获取图片失败'
        };
      }

      // 找到第一个有效的图片URL
      const firstImageUrl = imageUrls[0];
      
      // 如果是继续生成，需要合并原有的图片URL列表
      let allImageUrls = [];
      if (pageNo > 1 && imageTask.allImageUrls) {
        try {
          const existingUrls = JSON.parse(imageTask.allImageUrls);
          if (Array.isArray(existingUrls)) {
            allImageUrls = [...existingUrls];
          }
        } catch (e) {
          console.error('解析现有图片URL失败，使用空数组:', e);
        }
      }
      
      // 合并图片URL列表
      allImageUrls = [...allImageUrls, ...imageUrls];
      
      // 更新任务记录
      imageTask.imageUrl = pageNo === 1 ? firstImageUrl : (imageTask.imageUrl || firstImageUrl);
      imageTask.status = 'completed';
      
      // 保存所有有效的图片URL到数据库
      imageTask.allImageUrls = JSON.stringify(allImageUrls);
      
      await this.imageTaskRepository.save(imageTask);

      // 返回符合要求的格式
      return {
        code: 200,
        data: {
          taskId: imageTask.id, // 返回数据库中的任务ID，用于继续生成
          keyword: createImageDto.title,
          type: "theme",
          currentPage: pageNo,
          images: imageUrls.map((url, index) => ({
            url,
            taskId: taskIds[index] || taskIds[0],  // 使用对应的任务ID，如果没有则使用第一个
            imageId: `img_${imageTask.id}_${allImageUrls.length - imageUrls.length + index}`  // 创建唯一图片ID
          }))
        },
        message: "创建AI封面成功"
      };
    } catch (error) {
      // 记录错误详情
      console.error('======== 图片生成失败 ========');
      console.error(`错误消息: ${error.message}`);
      if (error.response) {
        console.error(`响应状态码: ${error.response.status}`);
        console.error(`响应数据: ${JSON.stringify(error.response.data, null, 2)}`);
      }
      console.error('================================');
      
      try {
        // 尝试更新任务状态为失败
        const imageTask = await this.imageTaskRepository.findOne({
          where: { userId, prompt: createImageDto.title },
          order: { createTime: 'DESC' }
        });
        
        if (imageTask) {
          imageTask.status = 'failed';
          imageTask.errorMessage = error.message || '生成图片失败';
          await this.imageTaskRepository.save(imageTask);
        }
      } catch (dbError) {
        console.error('更新任务状态失败:', dbError);
      }
      
      // 返回统一格式的错误响应
      return {
        code: 500,
        data: null,
        message: error.message || '生成图片失败'
      };
    }
  }

  /**
   * 获取模式名称
   * @param intellectId 模式ID
   * @returns 模式名称
   */
  private getIntellectIdName(intellectId: number): string {
    switch (intellectId) {
      case 267:
        return "大字报模式";
      case 280:
        return "表情封面模式";
      case 231:
        return "文案配图模式";
      case 374:
        return "备忘录内页模式";
      case 148:
        return "二宫格拼图模式";
      case 147:
        return "三宫格拼图模式";
      case 130:
        return "四宫格拼图模式";
      default:
        return `未知模式(${intellectId})`;
    }
  }

  /**
   * 获取用户的图片生成任务列表
   * @param userId 用户ID
   * @param page 页码
   * @param limit 每页数量
   */
  async getUserImageTasks(userId: string, page = 1, limit = 10): Promise<any> {
    try {
      const [tasks, total] = await this.imageTaskRepository.findAndCount({
        where: { userId },
        order: { createTime: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });

      // 处理任务列表，解析所有图片URL和任务ID
      const processedTasks = tasks.map(task => {
        let allUrls = [];
        if (task.allImageUrls) {
          try {
            allUrls = JSON.parse(task.allImageUrls);
          } catch (e) {
            console.error('解析图片URL列表失败:', e);
          }
        }
        
        // 解析任务ID列表
        let taskIdList = [];
        if (task.taskIds) {
          try {
            // 尝试解析JSON
            taskIdList = JSON.parse(task.taskIds);
          } catch (e) {
            // 如果解析失败，可能是旧的逗号分隔字符串
            console.error('解析任务ID列表失败:', e);
            try {
              taskIdList = task.taskIds.split(',');
            } catch (e2) {
              console.error('分割任务ID字符串失败:', e2);
              taskIdList = [task.taskIds]; // 作为单个ID处理
            }
          }
        }
        
        return {
          ...task,
          imageUrls: allUrls,
          taskIdList // 添加解析后的任务ID列表
        };
      });

      return {
        code: 200,
        data: {
          tasks: processedTasks,
          total,
          page,
          limit,
        },
        message: '获取任务列表成功'
      };
    } catch (error) {
      return {
        code: 500,
        data: null,
        message: error.message || '获取图片任务列表失败'
      };
    }
  }

  /**
   * 清理指定天数前的历史记录
   * @param days 天数，默认为1天
   * @returns 删除的记录数
   */
  private async cleanupOldRecords(days: number = 1): Promise<number> {
    try {
      // 计算截止日期
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      // 执行删除操作
      const result = await this.imageTaskRepository
        .createQueryBuilder()
        .delete()
        .from(ImageGeneratorTask)
        .where('createTime < :cutoffDate', { cutoffDate })
        .execute();
      
      const deletedCount = result.affected || 0;
      if (deletedCount > 0) {
        console.log(`已清理${deletedCount}条${days}天前的历史记录`);
      }
      
      return deletedCount;
    } catch (error) {
      console.error('清理历史记录失败:', error);
      return 0;
    }
  }

  /**
   * 获取用户的历史生成记录
   * @param userId 用户ID
   * @param page 页码
   * @param limit 每页数量
   */
  async getUserHistoryTasks(userId: string, page = 1, limit = 20): Promise<any> {
    try {
      // 清理1天前的历史记录
      await this.cleanupOldRecords(1);
      
      // 只查询已完成的任务
      const [tasks, total] = await this.imageTaskRepository.findAndCount({
        where: { 
          userId,
          status: 'completed' 
        },
        order: { createTime: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });

      // 处理任务列表，提取关键信息
      const historyTasks = tasks.map(task => {
        let imageUrls = [];
        let taskIdList = [];
        
        // 解析图片URL列表
        if (task.allImageUrls) {
          try {
            const parsedUrls = JSON.parse(task.allImageUrls);
            // 过滤掉无效的URL
            imageUrls = this.filterValidImageUrls(parsedUrls);
          } catch (e) {
            console.error('解析图片URL列表失败:', e);
          }
        }
        
        // 解析任务ID列表
        if (task.taskIds) {
          try {
            // 尝试解析JSON
            taskIdList = JSON.parse(task.taskIds);
          } catch (e) {
            // 如果解析失败，可能是旧的逗号分隔字符串
            try {
              taskIdList = task.taskIds.split(',');
            } catch (e2) {
              taskIdList = [task.taskIds]; // 作为单个ID处理
            }
          }
        }
        
        // 创建图片对象数组，结合URL和ID
        const images = [];
        
        // 尝试为每个URL分配一个taskId
        for (let i = 0; i < imageUrls.length; i++) {
          const url = imageUrls[i];
          // 尝试找到对应的taskId，如果索引超出范围则使用最后一个taskId
          const taskId = i < taskIdList.length ? taskIdList[i] : (taskIdList.length > 0 ? taskIdList[taskIdList.length - 1] : '');
          
          images.push({
            url,
            taskId,
            imageId: `img_${task.id}_${i}`  // 创建唯一图片ID
          });
        }
        
        // 确保mainImageUrl不为null
        const mainImageUrl = task.imageUrl && !task.imageUrl.includes('null') 
          ? task.imageUrl 
          : (imageUrls.length > 0 ? imageUrls[0] : '');
        
        // 返回简化的历史记录信息
        return {
          id: task.id,
          prompt: task.prompt,
          createTime: task.createTime,
          mainImageUrl: mainImageUrl,
          imageCount: images.length,
          images: images  // 返回整合后的图片对象数组
        };
      });

      return {
        code: 200,
        data: {
          history: historyTasks,
          total,
          page,
          limit,
        },
        message: '获取历史生成记录成功'
      };
    } catch (error) {
      return {
        code: 500,
        data: null,
        message: error.message || '获取历史生成记录失败'
      };
    }
  }

  /**
   * 获取任务详情
   * @param taskId 任务ID
   * @param userId 用户ID
   */
  async getTaskDetail(taskId: number, userId: string): Promise<any> {
    try {
      const task = await this.imageTaskRepository.findOne({
        where: { id: taskId, userId }
      });

      if (!task) {
        return {
          code: 404,
          data: null,
          message: '任务不存在'
        };
      }

      // 解析所有图片URL并过滤无效URL
      let imageUrls = [];
      if (task.allImageUrls) {
        try {
          const parsedUrls = JSON.parse(task.allImageUrls);
          imageUrls = this.filterValidImageUrls(parsedUrls);
          console.log(`解析到${imageUrls.length}张有效图片URL`);
        } catch (e) {
          console.error('解析图片URL列表失败:', e);
        }
      }
      
      // 解析任务ID列表
      let taskIdList = [];
      if (task.taskIds) {
        try {
          // 尝试解析JSON
          taskIdList = JSON.parse(task.taskIds);
        } catch (e) {
          // 如果解析失败，可能是旧的逗号分隔字符串
          try {
            taskIdList = task.taskIds.split(',');
          } catch (e2) {
            taskIdList = [task.taskIds]; // 作为单个ID处理
          }
        }
      }
      
      // 如果有任务ID，但没有有效的图片URL，尝试重新获取
      if (taskIdList.length > 0 && imageUrls.length === 0 && task.status === 'completed') {
        console.log('没有有效的图片URL，尝试重新获取...');
        const { imageUrls: newUrls, success } = await this.getTaskImages(taskIdList, 3, 1000);
        
        if (success && newUrls.length > 0) {
          console.log(`成功获取到${newUrls.length}张有效图片`);
          imageUrls = newUrls;
          
          // 更新数据库中的URL
          task.allImageUrls = JSON.stringify(newUrls);
          task.imageUrl = newUrls[0];
          await this.imageTaskRepository.save(task);
        }
      }

      // 创建图片对象数组，结合URL和ID
      const images = [];
      
      // 尝试为每个URL分配一个taskId
      for (let i = 0; i < imageUrls.length; i++) {
        const url = imageUrls[i];
        // 尝试找到对应的taskId，如果索引超出范围则使用最后一个taskId
        const taskId = i < taskIdList.length ? taskIdList[i] : (taskIdList.length > 0 ? taskIdList[taskIdList.length - 1] : '');
        
        images.push({
          url,
          taskId,
          imageId: `img_${task.id}_${i}`  // 创建唯一图片ID
        });
      }

      // 构建响应数据
      const responseData = {
        ...task,
        images,       // 整合后的图片对象数组
        imageCount: images.length
      };

      return {
        code: 200,
        data: responseData,
        message: '获取任务详情成功'
      };
    } catch (error) {
      return {
        code: 500,
        data: null,
        message: error.message || '获取任务详情失败'
      };
    }
  }

  /**
   * 下载图片 - 获取高质量下载链接或原始图片数据
   * @param taskId 任务ID
   * @returns 下载链接和状态
   */
  async downloadImage(taskId: string): Promise<any> {
    try {
      console.log(`开始处理图片下载请求，任务ID: ${taskId}`);
      
      // 首先尝试从下载链接映射表中查找是否已有下载链接记录
      const existingDownload = await this.imageDownloadUrlRepository.findOne({
        where: { taskId }
      });

      // 如果找到下载链接记录，直接返回
      if (existingDownload && existingDownload.downloadUrl) {
        console.log('数据库中已有下载链接，直接返回:', existingDownload.downloadUrl);
        return {
          code: 200,
          data: {
            fileName: existingDownload.fileName || `image_${taskId}.jpg`,
            downloadUrl: existingDownload.downloadUrl
          },
          message: '从数据库获取下载链接成功'
        };
      }
      
      // 如果没有找到下载链接，则继续使用创客贴的下载流程
      // 获取授权令牌
      const authToken = await this.getAuthToken();
      console.log(`使用授权令牌: ${authToken.substring(0, 10)}...${authToken.substring(authToken.length - 10)}`);
      
      // 步骤1: 根据taskId获取保存的设计ID
      console.log(`步骤1: 请求设计ID，任务ID: ${taskId}`);
      const designIdResponse = await axios.post(
        'https://gw.chuangkit.com/imagehub/design/intellect/save?_dataType=json&client_type=0',
        {
          taskId: taskId,
          intellectType: 0,
          reportInfo: JSON.stringify({
            request_platform: 0,
            task_id: taskId,
            versions_type: "^经^典^版",
            business_lines: "^企^业^线",
            business_id: 22928258,
            user_vip: "^付^费^用^户",
            user_id: this.ckUserId
          })
        },
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('设计ID响应状态码:', designIdResponse.status);
      console.log('设计ID响应:', designIdResponse.data);

      if (designIdResponse.data?.body?.code !== 200 || !designIdResponse.data?.body?.data) {
        console.error('获取设计ID失败:', designIdResponse.data);
        return {
          code: 400,
          data: null,
          message: `获取设计ID失败: ${designIdResponse.data?.body?.msg || '未知错误'}`
        };
      }

      const designId = designIdResponse.data.body.data;
      console.log(`获取到设计ID: ${designId}`);

      // 步骤2: 请求下载任务
      console.log(`步骤2: 创建下载任务，设计ID: ${designId}`);
      const downloadTaskParams = new URLSearchParams({
        'render_type': '102',
        'use_type': '1',
        'watermark': '0',
        'watermark_type': '0',
        'design_id': designId,
        'package_type': '5',
        'range': ''
      });
      console.log('下载任务请求参数:', downloadTaskParams.toString());
      
      const downloadTaskResponse = await axios.post(
        'https://gw.chuangkit.com/team/task/addAsyncDownloadTask.do?_dataType=json&client_type=0',
        downloadTaskParams,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      console.log('下载任务响应状态码:', downloadTaskResponse.status);
      console.log('下载任务响应:', downloadTaskResponse.data);

      if (downloadTaskResponse.data?.body?.code !== 200 || !downloadTaskResponse.data?.body?.data?.requestId) {
        console.error('创建下载任务失败:', downloadTaskResponse.data);
        return {
          code: 400,
          data: null,
          message: `创建下载任务失败: ${downloadTaskResponse.data?.body?.msg || '未知错误'}`
        };
      }

      const requestId = downloadTaskResponse.data.body.data.requestId;
      console.log(`获取到下载任务ID: ${requestId}`);

      // 步骤3: 获取下载链接 (可能需要多次尝试，因为渲染可能需要时间)
      let downloadUrl = null;
      let attempts = 0;
      const maxAttempts = 10; // 增加尝试次数
      const retryDelay = 2000; // 增加重试间隔到2秒
      
      console.log(`步骤3: 获取下载链接，最多尝试${maxAttempts}次，每次间隔${retryDelay}毫秒`);
      
      while (attempts < maxAttempts && !downloadUrl) {
        attempts++;
        console.log(`尝试获取下载链接 (${attempts}/${maxAttempts})...`);
        
        try {
          const params = new URLSearchParams({
            'request_id': requestId,
            'design_id': designId
          });
          console.log('下载链接请求参数:', params.toString());
          
          const downloadLinkResponse = await axios.post(
            'https://gw.chuangkit.com/team/task/getAsyncDownloadTaskState.do?_dataType=json&client_type=0',
            params,
            {
              headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/x-www-form-urlencoded'
              }
            }
          );
          
          console.log('下载链接响应状态码:', downloadLinkResponse.status);
          console.log('下载链接响应:', JSON.stringify(downloadLinkResponse.data, null, 2));
          
          const responseCode = downloadLinkResponse.data?.body?.code;
          console.log(`响应状态码: ${responseCode}, 消息: ${downloadLinkResponse.data?.body?.msg || '无消息'}`);
          
          // 检查状态，20表示渲染成功
          if (responseCode === 20 && 
              downloadLinkResponse.data?.body?.data?.downloadUrls && 
              downloadLinkResponse.data.body.data.downloadUrls.length > 0) {
            
            // 获取第一个下载链接
            downloadUrl = downloadLinkResponse.data.body.data.downloadUrls[0];
            console.log('获取到原始下载链接:', downloadUrl);
            
            // 确保URL是完整的
            if (downloadUrl && downloadUrl.startsWith('//')) {
              downloadUrl = `https:${downloadUrl}`;
              console.log('转换为完整URL:', downloadUrl);
            }
            
            break;
          } else if (responseCode === 10 || responseCode === 30) {
            // 状态10和30表示正在处理中，等待后重试
            console.log(`任务处理中 (状态码: ${responseCode})，等待${retryDelay}ms后重试...`);
            await this.delay(retryDelay);
            continue;
          } else {
            // 其他状态码可能表示失败
            console.error(`未预期的状态码: ${responseCode}，响应:`, downloadLinkResponse.data);
            if (attempts >= maxAttempts) {
              return {
                code: 400,
                data: null,
                message: `获取下载链接失败: ${downloadLinkResponse.data?.body?.msg || '未知错误'}`
              };
            }
            await this.delay(retryDelay);
            continue;
          }
        } catch (error) {
          console.error('获取下载链接出错:', error);
          console.error('错误详情:', error.message);
          
          if (error.response) {
            console.error('响应状态:', error.response.status);
            console.error('响应头:', JSON.stringify(error.response.headers));
            console.error('响应数据:', JSON.stringify(error.response.data));
          }
          
          if (attempts >= maxAttempts) {
            return {
              code: 500,
              data: null,
              message: `获取下载链接失败: ${error.message || '未知错误'}`
            };
          }
          
          await this.delay(retryDelay);
        }
      }
      
      if (!downloadUrl) {
        console.error(`达到最大尝试次数(${maxAttempts})，仍未获取到下载链接`);
        return {
          code: 400,
          data: null,
          message: '获取下载链接失败，请稍后重试'
        };
      }
      
      console.log(`成功获取到下载链接: ${downloadUrl}`);
      
      // 将下载链接保存到数据库中
      try {
        // 查找任务记录，获取可能的文件名信息
        const task = await this.imageTaskRepository.findOne({
          where: { taskIds: Like(`%${taskId}%`) }
        });
        
        // 创建文件名
        const fileName = `image_${taskId}.jpg`;
        
        // 保存下载链接到数据库
        const downloadRecord = this.imageDownloadUrlRepository.create({
          taskId,
          downloadUrl,
          fileName
        });
        
        await this.imageDownloadUrlRepository.save(downloadRecord);
        console.log('已将下载链接保存到数据库');
      } catch (saveError) {
        console.error('保存下载链接到数据库失败:', saveError);
        // 保存失败不影响返回结果，继续处理
      }
      
      // 返回下载链接
      return {
        code: 200,
        data: {
          fileName: `image_${taskId}.jpg`,
          downloadUrl: downloadUrl
        },
        message: '获取图片下载链接成功'
      };
    } catch (error) {
      console.error('下载图片失败:', error);
      if (error.response) {
        console.error('响应状态:', error.response.status);
        console.error('响应头:', JSON.stringify(error.response.headers));
        console.error('响应数据:', JSON.stringify(error.response.data));
      }
      return {
        code: 500,
        data: null,
        message: error.message || '下载图片失败'
      };
    }
  }

  /**
   * 上传图片到创客贴服务
   * @param file 图片文件
   * @param fileName 文件名
   * @param contentType 文件类型
   * @returns 上传结果
   */
  async uploadImage(file: Buffer, fileName: string, contentType: string): Promise<any> {
    try {
      console.log(`准备上传图片: ${fileName}, 类型: ${contentType}, 大小: ${file.length} 字节`);
      
      // 获取授权令牌
      const authToken = await this.getAuthToken();
      
      // 创建随机MD5值
      const randomMd5 = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      // 如果有文件内容，尝试计算真实MD5值
      let fileMd5 = randomMd5;
      try {
        const crypto = require('crypto');
        fileMd5 = crypto.createHash('md5').update(file).digest('hex');
        console.log(`计算的文件MD5: ${fileMd5}`);
      } catch (error) {
        console.warn('计算文件MD5失败，使用随机MD5:', error.message);
      }
      
      // 使用FormData库创建multipart/form-data请求
      const FormData = require('form-data');
      const form = new FormData();
      
      // 添加文件和其他字段
      form.append('file', file, {
        filename: 'blob',
        contentType: contentType
      });
      form.append('md5', fileMd5);
      form.append('fileName', fileName);
      form.append('contentType', contentType);
      form.append('sourceType', '1');
      form.append('autoConfirm', '1');
      form.append('hide', 'true');
      
      console.log('向创客贴发送预上传请求...');
      
      // 第一步：发送预上传请求
      const preUploadResponse = await axios.post(
        'https://gw.chuangkit.com/dam/store/resource/preUpload.do?_dataType=json&client_type=0',
        form,
        {
          headers: {
            ...form.getHeaders(),
            'Accept': '*/*',
            'Accept-Language': 'zh-CN,zh;q=0.9',
            'Authorization': `Bearer ${authToken}`,
            'Connection': 'keep-alive',
            'Origin': 'https://www.chuangkit.com',
            'Referer': 'https://www.chuangkit.com/',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36'
          }
        }
      );
      
      // 使用JSON.stringify格式化展示完整响应数据
      console.log('预上传响应:', JSON.stringify(preUploadResponse.data, null, 2));
      
      // 检查响应
      if (preUploadResponse.data?.body?.code === 200) {
        // 如果返回code=200，需要执行第二步和第三步上传
        console.log('需要执行后续上传步骤...');
        
        // 提取上传所需的所有参数
        const responseData = preUploadResponse.data?.body?.data;
        
        // 确保有响应数据
        if (!responseData) {
          console.error('预上传响应数据无效:', preUploadResponse.data);
          return {
            code: 400,
            data: null,
            message: '预上传响应数据无效'
          };
        }
        
        // 从响应中获取上传所需的参数
        let ossParams = null;
        let ossUrl = null;
        let fileKey = null;
        
        // 处理不同格式的响应
        if (responseData.data) {
          // 标准格式
          ossParams = responseData.data.paramMap || {};
          ossUrl = responseData.data.url;
          fileKey = responseData.data.fileKey || ossParams.key;
        } else {
          // 直接参数格式
          ossParams = responseData.paramMap || {};
          ossUrl = responseData.url;
          fileKey = responseData.fileKey || ossParams.key;
        }
        
        // 确认必要参数存在
        if (!ossUrl || !fileKey) {
          console.error('无法获取上传必要参数:', responseData);
          
          // 打印完整的响应结构，帮助调试
          console.log('预上传响应的完整结构:', JSON.stringify(preUploadResponse.data, null, 2));
          
          return {
            code: 400,
            data: null,
            message: '无法获取上传必要参数'
          };
        }
        
        console.log(`获取到上传参数: URL=${ossUrl}, fileKey=${fileKey}`);
        
        // 第二步：直接上传文件到OSS
        console.log('开始上传文件到OSS...');
        
        // 创建OSS上传表单
        const ossForm = new FormData();
        
        // 添加OSS参数
        if (ossParams) {
          for (const [key, value] of Object.entries(ossParams)) {
            if (key && value) {
              ossForm.append(key, value as string);
            }
          }
        }
        
        // 添加文件和MD5
        ossForm.append('file', file, {
          filename: fileName,
          contentType: contentType
        });
        
        // 添加Content-MD5头
        if (fileMd5) {
          ossForm.append('Content-MD5', fileMd5);
        }
        
        try {
          // 发送文件到OSS
          const ossUploadResponse = await axios.post(
            ossUrl,
            ossForm,
            {
              headers: {
                ...ossForm.getHeaders(),
                'Accept': '*/*',
                'Accept-Language': 'zh-CN,zh;q=0.9',
                'Connection': 'keep-alive',
                'Origin': 'https://www.chuangkit.com',
                'Referer': 'https://www.chuangkit.com/'
              },
              maxContentLength: Infinity,
              maxBodyLength: Infinity
            }
          );
          
          console.log('OSS上传响应状态:', ossUploadResponse.status);
          console.log('OSS上传响应头:', JSON.stringify(ossUploadResponse.headers, null, 2));
          
          // 第三步：发送reportUpload请求
          return this.finalizeUpload(fileKey, fileMd5, fileName, contentType, authToken, file);
        } catch (ossError) {
          console.error('OSS上传失败:', ossError);
          
          // 尝试继续执行第三步，有时OSS上传可能成功但返回错误
          console.log('尝试继续执行reportUpload步骤...');
          return this.finalizeUpload(fileKey, fileMd5, fileName, contentType, authToken, file);
        }
      } else if (preUploadResponse.data?.body?.code === 10003) {
        // 如果返回code=10003，文件已存在，直接使用返回的imageId
        const imageId = preUploadResponse.data.body.data;
        console.log(`图片已存在，图片ID: ${imageId}`);
        
        // 即使图片已存在，也上传到图床
        return this.uploadToImageBed(imageId, file, contentType);
      } else {
        console.error('图片上传失败:', preUploadResponse.data);
        return {
          code: preUploadResponse.data?.body?.code || 500,
          data: null,
          message: preUploadResponse.data?.body?.msg || '图片上传失败'
        };
      }
    } catch (error) {
      console.error('图片上传出错:', error);
      return {
        code: 500,
        data: null,
        message: error.message || '图片上传失败'
      };
    }
  }
  
  /**
   * 完成上传流程，发送reportUpload请求
   * @param fileKey 文件Key
   * @param md5 MD5值
   * @param fileName 文件名
   * @param contentType 内容类型
   * @param authToken 授权令牌
   * @param originalFile 原始文件
   */
  private async finalizeUpload(fileKey: string, md5: string, fileName: string, contentType: string, authToken: string, originalFile: Buffer): Promise<any> {
    // 获取图片尺寸（如果无法获取，使用默认值）
    let width = 800;
    let height = 800;
    let type = contentType.split('/')[1] || 'jpeg';
    let format = type.toUpperCase();
    
    // 使用默认尺寸值
    console.log('使用默认图片尺寸:', width, 'x', height);
    
    // 构建reportUpload请求的参数
    const reportParams = new URLSearchParams({
      'md5': md5,
      'fileKey': fileKey,
      'fileName': fileName,
      'contentType': contentType,
      'width': width.toString(),
      'height': height.toString(),
      'type': type,
      'format': format,
      'autoConfirm': '1',
      'hide': 'true'
    });
    
    console.log('向创客贴发送reportUpload请求...');
    console.log('reportUpload参数:', reportParams.toString());
    
    try {
      // 发送reportUpload请求
      const reportUploadResponse = await axios.post(
        'https://gw.chuangkit.com/dam/store/resource/reportUpload.do?_dataType=json&client_type=0',
        reportParams,
        {
          headers: {
            'Accept': '*/*',
            'Accept-Language': 'zh-CN,zh;q=0.9',
            'Authorization': `Bearer ${authToken}`,
            'Connection': 'keep-alive',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Origin': 'https://www.chuangkit.com',
            'Referer': 'https://www.chuangkit.com/',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36'
          }
        }
      );
      
      console.log('reportUpload响应:', JSON.stringify(reportUploadResponse.data, null, 2));
      
      // 检查reportUpload响应
      if (reportUploadResponse.data?.body?.code === 200) {
        const imageId = reportUploadResponse.data.body.data;
        console.log(`图片上传成功，图片ID: ${imageId}`);
        
        // 构造创客贴图片URL
        const imageUrl = `https://pri-cdn-oss.chuangkit.com/svg_build/render_result/${imageId}?x-oss-process=image/resize,w_1000`;
        
        // 上传到图床并返回结果
        return this.uploadToImageBed(imageId, originalFile, contentType);
      } else {
        console.error('reportUpload失败:', reportUploadResponse.data);
        return {
          code: reportUploadResponse.data?.body?.code || 500,
          data: null,
          message: reportUploadResponse.data?.body?.msg || 'reportUpload失败'
        };
      }
    } catch (error) {
      console.error('finalizeUpload失败:', error);
      return {
        code: 500,
        data: null,
        message: error.message || 'finalizeUpload失败'
      };
    }
  }

  /**
   * 将图片上传到图床
   * @param imageId 创客贴的图片ID
   * @param originalFile 原始文件
   * @param contentType 内容类型
   * @returns 上传结果
   */
  private async uploadToImageBed(imageId: string, originalFile: Buffer, contentType: string): Promise<any> {
    try {
      console.log('开始上传图片到图床...');
      const uploadResult = await this.imageUploadService.uploadFile({
        buffer: originalFile,
        mimetype: contentType
      });
      
      if (uploadResult) {
        console.log('图床上传成功，URL:', uploadResult);
        
        return {
          code: 200,
          data: {
            imageId: imageId,
            url: uploadResult, // 直接使用图床URL作为主URL
          },
          message: '图片上传成功'
        };
      } else {
        console.error('上传到图床失败，返回创客贴URL');
        // 如果图床上传失败，使用创客贴URL作为备用
        const ckitUrl = `https://pri-cdn-oss.chuangkit.com/svg_build/render_result/${imageId}?x-oss-process=image/resize,w_1000`;
        return {
          code: 200,
          data: {
            imageId: imageId,
            url: ckitUrl,
          },
          message: '图片上传成功，但上传到图床失败'
        };
      }
    } catch (superError) {
      console.error('上传到图床失败:', superError);
      // 即使图床上传失败，也返回创客贴URL
      const ckitUrl = `https://pri-cdn-oss.chuangkit.com/svg_build/render_result/${imageId}?x-oss-process=image/resize,w_1000`;
      return {
        code: 200,
        data: {
          imageId: imageId,
          url: ckitUrl,
        },
        message: '图片上传成功，但上传到图床失败'
      };
    }
  }
}