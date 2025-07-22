import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { XhsTemplateEntity } from './template.entity';
import { XhsTemplateController } from './template.controller';
import { XhsTemplateService } from './template.service';
import { NoteType } from './notetype.entity';
import { Note } from './note.entity';
import { NoteTemplate } from './notetemplate.entity';
import { NoteTemplateRelation } from './note-template-relation.entity';
import { NoteLike } from './note-like.entity';
import { NoteView } from './note-view.entity';
import { NoteFavorite } from './note-favorite.entity';
import { NoteTypeController } from './notetype.controller';
import { NoteController } from './note.controller';
import { NoteTemplateMarketController } from './note-market.controller';
import { NoteTemplateController } from './notetemplate.controller';
import { NoteTypeService } from './notetype.service';
import { NoteService } from './note.service';
import { NoteTemplateService } from './notetemplate.service';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as crypto from 'crypto';
import * as fs from 'fs';
import { XhsModule } from '../xhs/xhs.module';
import { HtmlLibModule } from '../htmllib/htmllib.module';
import { HtmlTemplateEntity } from '../htmllib/htmllib.entity';

// 确保上传目录存在
const uploadDir = join(process.cwd(), 'uploads', 'templates');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

@Module({
  imports: [
    TypeOrmModule.forFeature([
      XhsTemplateEntity,
      NoteType,
      Note,
      NoteTemplate,
      NoteTemplateRelation,
      NoteLike,
      NoteView,
      NoteFavorite,
      HtmlTemplateEntity,
    ]),
    MulterModule.register({
      storage: diskStorage({
        destination: uploadDir,
        filename: (req, file, callback) => {
          // 生成唯一文件名
          const ext = extname(file.originalname);
          const basename = file.originalname.replace(ext, '');
          const timestamp = Date.now();
          const hash = crypto.createHash('md5').update(`${basename}${timestamp}`).digest('hex').substring(0, 8);
          const filename = `${basename}-${hash}${ext}`;
          callback(null, filename);
        },
      }),
    }),
    forwardRef(() => XhsModule), // 使用forwardRef解决循环依赖
    HtmlLibModule, // 添加HTML模板模块以解决依赖问题
  ],
  controllers: [
    XhsTemplateController,
    NoteTypeController,
    NoteController,
    NoteTemplateController,
    NoteTemplateMarketController,
  ],
  providers: [
    XhsTemplateService,
    NoteTypeService,
    NoteService,
    NoteTemplateService,
  ],
  exports: [
    XhsTemplateService,
    NoteTypeService,
    NoteService,
    NoteTemplateService,
    // 导出TypeOrmModule，使其他模块可以访问实体
    TypeOrmModule.forFeature([
      NoteTemplate,
      NoteTemplateRelation,
      Note,
      NoteType,
      NoteLike,
      NoteView,
      NoteFavorite,
      HtmlTemplateEntity
    ])
  ],
})
export class XiaohongshuModule {} 