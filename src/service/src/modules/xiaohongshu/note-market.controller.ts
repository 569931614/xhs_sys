import { Controller, Get, Query, Param, ParseIntPipe, UseGuards, Req, Logger, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NoteService } from './note.service';
import { NoteQueryDto } from './dto/note.dto';
import { JwtAuthGuard } from '../../common/auth/jwtAuth.guard';
import { Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NoteLike } from './note-like.entity';
import { NoteView } from './note-view.entity';
import { Note } from './note.entity';
import { NoteFavorite } from './note-favorite.entity';
import { In } from 'typeorm';

@ApiTags('笔记模板市场')
@Controller('xiaohongshu/note-template-market')
export class NoteTemplateMarketController {
  private readonly logger = new Logger(NoteTemplateMarketController.name);

  constructor(
    private readonly noteService: NoteService,
    @InjectRepository(NoteLike)
    private readonly noteLikeRepository: Repository<NoteLike>,
    @InjectRepository(NoteView)
    private readonly noteViewRepository: Repository<NoteView>,
    @InjectRepository(Note)
    private readonly noteRepository: Repository<Note>,
    @InjectRepository(NoteFavorite)
    private readonly noteFavoriteRepository: Repository<NoteFavorite>,
  ) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('list')
  @ApiOperation({ summary: '获取笔记模板市场列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAll(@Query() query: NoteQueryDto, @Req() req: Request) {
    const userId = req.user?.id;
    this.logger.log(`用户 ${userId} 请求笔记模板市场列表，参数: ${JSON.stringify(query)}`);
    
    try {
      // 处理收藏筛选
      if (query.favoriteOnly && userId) {
        this.logger.log(`用户 ${userId} 请求查看收藏的笔记`);
        
        // 查询用户收藏的笔记ID列表
        const userFavorites = await this.noteFavoriteRepository.find({
          where: { userId: userId.toString() }
        });
        
        // 如果用户没有收藏任何笔记，直接返回空列表
        if (!userFavorites || userFavorites.length === 0) {
          this.logger.log(`用户 ${userId} 没有收藏任何笔记，返回空列表`);
          return {
            code: 0,
            message: '获取成功',
            data: {
              items: [],
              total: 0,
              page: query.page || 1,
              pageSize: query.pageSize || 10
            }
          };
        }
        
        // 提取收藏的笔记ID
        const favoriteNoteIds = userFavorites.map(favorite => favorite.noteId);
        this.logger.log(`用户 ${userId} 收藏的笔记ID: ${favoriteNoteIds.join(', ')}`);
        
        // 确保只返回状态为启用的笔记
        const marketQuery = {
          ...query,
          status: true,
          noteIds: favoriteNoteIds // 添加笔记ID筛选
        };
        
        // 设置默认排序为最新（创建时间降序）
        if (!marketQuery.orderBy) {
          marketQuery.orderBy = 'createTime';
          marketQuery.orderDirection = 'DESC';
        }
        
        // 移除可能导致问题的字段
        if (marketQuery.botId === '') {
          delete marketQuery.botId;
          this.logger.log('移除空的botId参数');
        }
        
        this.logger.log(`处理后的查询参数: ${JSON.stringify(marketQuery)}`);
        const result = await this.noteService.findAllByIds(marketQuery, favoriteNoteIds);
        
        // 如果请求包含withUserStatus参数，则查询用户的收藏和点赞状态
        if (query.withUserStatus && result && result.items && result.items.length > 0) {
          this.logger.log(`查询用户 ${userId} 对 ${result.items.length} 个笔记的收藏和点赞状态`);
          
          // 获取所有笔记ID
          const noteIds = result.items.map((note: any) => note.id);
          
          // 批量查询用户的点赞状态
          const userLikes = await this.noteLikeRepository.find({
            where: { 
              noteId: In(noteIds),
              userId: userId.toString() 
            }
          });
          
          // 创建点赞和收藏状态的映射
          const likeMap = new Map(userLikes.map(like => [like.noteId, true]));
          // 收藏状态已经确定为true
          
          // 为每个笔记添加用户状态
          result.items.forEach((note: any) => {
            note.userStatus = {
              liked: likeMap.has(note.id),
              favorited: true // 因为是收藏筛选，所以所有返回的笔记都是已收藏的
            };
          });
          
          this.logger.log(`已添加用户状态信息到笔记列表`);
        }
        
        this.logger.log(`返回 ${result?.items?.length || 0} 个收藏的笔记`);
        
        return {
          code: 0,
          message: '获取成功',
          data: result
        };
      }
      
      // 正常查询逻辑（非收藏筛选）
      // 确保只返回状态为启用的笔记
      const marketQuery = {
        ...query,
        status: true,
      };
      
      // 设置默认排序为最新（创建时间降序）
      if (!marketQuery.orderBy) {
        marketQuery.orderBy = 'createTime';
        marketQuery.orderDirection = 'DESC';
      }
      
      // 移除可能导致问题的字段
      if (marketQuery.botId === '') {
        delete marketQuery.botId;
        this.logger.log('移除空的botId参数');
      }
      
      this.logger.log(`处理后的查询参数: ${JSON.stringify(marketQuery)}`);
      const result = await this.noteService.findAll(marketQuery);
      
      // 检查是否正确返回了HTML模板信息
      let templateCount = 0;
      if (result && result.items) {
        result.items.forEach((item: any) => {
          templateCount += item.htmlTemplates?.length || 0;
        });
      }
      
      // 如果请求包含withUserStatus参数，则查询用户的收藏和点赞状态
      if (query.withUserStatus && result && result.items && result.items.length > 0 && userId) {
        this.logger.log(`查询用户 ${userId} 对 ${result.items.length} 个笔记的收藏和点赞状态`);
        
        // 获取所有笔记ID
        const noteIds = result.items.map((note: any) => note.id);
        
        // 批量查询用户的点赞状态
        const userLikes = await this.noteLikeRepository.find({
          where: { 
            noteId: In(noteIds),
            userId: userId.toString() 
          }
        });
        
        // 批量查询用户的收藏状态
        const userFavorites = await this.noteFavoriteRepository.find({
          where: { 
            noteId: In(noteIds),
            userId: userId.toString() 
          }
        });
        
        // 创建点赞和收藏状态的映射
        const likeMap = new Map(userLikes.map(like => [like.noteId, true]));
        const favoriteMap = new Map(userFavorites.map(favorite => [favorite.noteId, true]));
        
        // 为每个笔记添加用户状态
        result.items.forEach((note: any) => {
          note.userStatus = {
            liked: likeMap.has(note.id),
            favorited: favoriteMap.has(note.id)
          };
        });
        
        this.logger.log(`已添加用户状态信息到笔记列表`);
      }
      
      this.logger.log(`返回 ${result?.items?.length || 0} 个笔记，共包含 ${templateCount} 个HTML模板引用`);
      
      return {
        code: 0,
        message: '获取成功',
        data: result
      };
    } catch (error) {
      this.logger.error(`获取笔记模板市场列表失败: ${error.message}`, error.stack);
      // 返回友好的错误信息，而不是500错误
      return {
        code: 1,
        message: '获取模板列表失败，请稍后重试',
        data: {
          items: [],
          total: 0,
          page: query.page || 1,
          pageSize: query.pageSize || 10
        }
      };
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(':id')
  @ApiOperation({ summary: '获取笔记模板详情' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req: Request, @Query() query: any) {
    const userId = req.user?.id;
    this.logger.log(`用户 ${userId} 请求笔记ID: ${id} 的详情`);
    
    try {
      // 查询笔记详情，包含模板信息
      const note = await this.noteService.findOne(id);
      
      // 检查笔记是否为公开状态
      if (!note.status) {
        return {
          code: 1,
          message: '笔记不存在或已下架',
          data: null,
        };
      }
      
      // 记录预览操作
      await this.recordView(id, userId.toString());
      
      // 如果请求包含withUserStatus参数，则查询用户的收藏和点赞状态
      if (query.withUserStatus && userId) {
        this.logger.log(`查询用户 ${userId} 对笔记 ${id} 的收藏和点赞状态`);
        
        // 查询用户的点赞状态
        const existingLike = await this.noteLikeRepository.findOne({
          where: { noteId: id, userId: userId.toString() }
        });
        
        // 查询用户的收藏状态
        const existingFavorite = await this.noteFavoriteRepository.findOne({
          where: { noteId: id, userId: userId.toString() }
        });
        
        // 添加用户状态到笔记对象
        note.userStatus = {
          liked: !!existingLike,
          favorited: !!existingFavorite
        };
        
        this.logger.log(`已添加用户状态信息到笔记详情`);
      }
      
      // 确保返回的数据包含模板信息
      this.logger.log(`返回笔记详情，包含${note.htmlTemplates?.length || 0}个HTML模板`);
      
      return {
        code: 0,
        message: '获取成功',
        data: note,
      };
    } catch (error) {
      this.logger.error(`获取笔记详情失败: ${error.message}`, error.stack);
      return {
        code: 1,
        message: '获取笔记详情失败',
        data: null,
      };
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(':id/like')
  @ApiOperation({ summary: '点赞笔记模板' })
  @ApiResponse({ status: 200, description: '点赞成功' })
  async likeNote(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const userId = req.user?.id;
    this.logger.log(`用户 ${userId} 点赞笔记ID: ${id}`);
    
    try {
      // 查询笔记是否存在
      const note = await this.noteRepository.findOne({ where: { id, status: true } });
      if (!note) {
        return {
          code: 1,
          message: '笔记不存在或已下架',
          data: null,
        };
      }
      
      // 检查用户是否已点赞过此笔记
      const existingLike = await this.noteLikeRepository.findOne({
        where: { noteId: id, userId: userId.toString() }
      });
      
      if (existingLike) {
        return {
          code: 0,
          message: '您已经点赞过此笔记',
          data: { likesCount: note.likesCount },
        };
      }
      
      // 创建点赞记录
      await this.noteLikeRepository.save({
        noteId: id,
        userId: userId.toString(),
      });
      
      // 更新笔记点赞次数
      note.likesCount += 1;
      await this.noteRepository.save(note);
      
      return {
        code: 0,
        message: '点赞成功',
        data: { likesCount: note.likesCount },
      };
    } catch (error) {
      this.logger.error(`点赞笔记出错: ${error.message}`, error.stack);
      return {
        code: 1,
        message: '点赞失败',
        data: null,
      };
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(':id/unlike')
  @ApiOperation({ summary: '取消点赞笔记模板' })
  @ApiResponse({ status: 200, description: '取消点赞成功' })
  async unlikeNote(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const userId = req.user?.id;
    this.logger.log(`用户 ${userId} 取消点赞笔记ID: ${id}`);
    
    try {
      // 查询笔记是否存在
      const note = await this.noteRepository.findOne({ where: { id, status: true } });
      if (!note) {
        return {
          code: 1,
          message: '笔记不存在或已下架',
          data: null,
        };
      }
      
      // 检查用户是否已点赞过此笔记
      const existingLike = await this.noteLikeRepository.findOne({
        where: { noteId: id, userId: userId.toString() }
      });
      
      if (!existingLike) {
        return {
          code: 0,
          message: '您尚未点赞此笔记',
          data: { likesCount: note.likesCount },
        };
      }
      
      // 删除点赞记录
      await this.noteLikeRepository.remove(existingLike);
      
      // 更新笔记点赞次数
      note.likesCount = Math.max(0, note.likesCount - 1); // 确保不会出现负数
      await this.noteRepository.save(note);
      
      return {
        code: 0,
        message: '取消点赞成功',
        data: { likesCount: note.likesCount },
      };
    } catch (error) {
      this.logger.error(`取消点赞笔记出错: ${error.message}`, error.stack);
      return {
        code: 1,
        message: '取消点赞失败',
        data: null,
      };
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(':id/like-status')
  @ApiOperation({ summary: '获取用户对笔记模板的点赞状态' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getLikeStatus(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const userId = req.user?.id;
    
    try {
      // 检查用户是否已点赞过此笔记
      const existingLike = await this.noteLikeRepository.findOne({
        where: { noteId: id, userId: userId.toString() }
      });
      
      return {
        code: 0,
        message: '获取成功',
        data: { 
          liked: !!existingLike 
        },
      };
    } catch (error) {
      this.logger.error(`获取点赞状态出错: ${error.message}`, error.stack);
      return {
        code: 1,
        message: '获取点赞状态失败',
        data: null,
      };
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(':id/favorite-status')
  @ApiOperation({ summary: '获取用户对笔记模板的收藏状态' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getFavoriteStatus(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const userId = req.user?.id;
    this.logger.log(`用户 ${userId} 获取笔记ID: ${id} 的收藏状态`);
    
    try {
      // 检查用户是否已收藏过此笔记
      const existingFavorite = await this.noteFavoriteRepository.findOne({
        where: { noteId: id, userId: userId.toString() }
      });
      
      return {
        code: 0,
        message: '获取收藏状态成功',
        data: { favorited: !!existingFavorite }
      };
    } catch (error) {
      this.logger.error(`获取收藏状态出错: ${error.message}`, error.stack);
      return {
        code: 1,
        message: '获取收藏状态失败',
        data: { favorited: false }
      };
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(':id/favorite')
  @ApiOperation({ summary: '收藏笔记模板' })
  @ApiResponse({ status: 200, description: '收藏成功' })
  async favoriteNote(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const userId = req.user?.id;
    this.logger.log(`用户 ${userId} 收藏笔记ID: ${id}`);
    
    try {
      // 查询笔记是否存在
      const note = await this.noteRepository.findOne({ where: { id, status: true } });
      if (!note) {
        return {
          code: 1,
          message: '笔记不存在或已下架',
          data: null,
        };
      }
      
      // 检查用户是否已收藏过此笔记
      const existingFavorite = await this.noteFavoriteRepository.findOne({
        where: { noteId: id, userId: userId.toString() }
      });
      
      if (existingFavorite) {
        return {
          code: 0,
          message: '您已经收藏过此笔记',
          data: { favorited: true }
        };
      }
      
      // 创建收藏记录
      await this.noteFavoriteRepository.save({
        noteId: id,
        userId: userId.toString(),
      });
      
      return {
        code: 0,
        message: '收藏成功',
        data: { favorited: true }
      };
    } catch (error) {
      this.logger.error(`收藏笔记出错: ${error.message}`, error.stack);
      return {
        code: 1,
        message: '收藏失败',
        data: null
      };
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(':id/unfavorite')
  @ApiOperation({ summary: '取消收藏笔记模板' })
  @ApiResponse({ status: 200, description: '取消收藏成功' })
  async unfavoriteNote(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const userId = req.user?.id;
    this.logger.log(`用户 ${userId} 取消收藏笔记ID: ${id}`);
    
    try {
      // 检查用户是否已收藏过此笔记
      const existingFavorite = await this.noteFavoriteRepository.findOne({
        where: { noteId: id, userId: userId.toString() }
      });
      
      if (!existingFavorite) {
        return {
          code: 0,
          message: '您尚未收藏此笔记',
          data: { favorited: false }
        };
      }
      
      // 删除收藏记录
      await this.noteFavoriteRepository.remove(existingFavorite);
      
      return {
        code: 0,
        message: '取消收藏成功',
        data: { favorited: false }
      };
    } catch (error) {
      this.logger.error(`取消收藏笔记出错: ${error.message}`, error.stack);
      return {
        code: 1,
        message: '取消收藏失败',
        data: null
      };
    }
  }

  // 记录预览操作
  private async recordView(noteId: number, userId: string) {
    try {
      // 记录预览记录
      await this.noteViewRepository.save({
        noteId,
        userId,
      });
      
      // 更新笔记预览次数
      const note = await this.noteRepository.findOne({ where: { id: noteId } });
      if (note) {
        note.viewsCount += 1;
        await this.noteRepository.save(note);
      }
    } catch (error) {
      this.logger.error(`记录预览操作失败: ${error.message}`, error.stack);
    }
  }
} 