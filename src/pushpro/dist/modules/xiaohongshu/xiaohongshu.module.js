"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.XiaohongshuModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const template_entity_1 = require("./template.entity");
const template_controller_1 = require("./template.controller");
const template_service_1 = require("./template.service");
const notetype_entity_1 = require("./notetype.entity");
const note_entity_1 = require("./note.entity");
const notetemplate_entity_1 = require("./notetemplate.entity");
const note_template_relation_entity_1 = require("./note-template-relation.entity");
const note_like_entity_1 = require("./note-like.entity");
const note_view_entity_1 = require("./note-view.entity");
const note_favorite_entity_1 = require("./note-favorite.entity");
const notetype_controller_1 = require("./notetype.controller");
const note_controller_1 = require("./note.controller");
const note_market_controller_1 = require("./note-market.controller");
const notetemplate_controller_1 = require("./notetemplate.controller");
const notetype_service_1 = require("./notetype.service");
const note_service_1 = require("./note.service");
const notetemplate_service_1 = require("./notetemplate.service");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const crypto = require("crypto");
const fs = require("fs");
const xhs_module_1 = require("../xhs/xhs.module");
const htmllib_module_1 = require("../htmllib/htmllib.module");
const htmllib_entity_1 = require("../htmllib/htmllib.entity");
const uploadDir = (0, path_1.join)(process.cwd(), 'uploads', 'templates');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
let XiaohongshuModule = class XiaohongshuModule {
};
XiaohongshuModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                template_entity_1.XhsTemplateEntity,
                notetype_entity_1.NoteType,
                note_entity_1.Note,
                notetemplate_entity_1.NoteTemplate,
                note_template_relation_entity_1.NoteTemplateRelation,
                note_like_entity_1.NoteLike,
                note_view_entity_1.NoteView,
                note_favorite_entity_1.NoteFavorite,
                htmllib_entity_1.HtmlTemplateEntity,
            ]),
            platform_express_1.MulterModule.register({
                storage: (0, multer_1.diskStorage)({
                    destination: uploadDir,
                    filename: (req, file, callback) => {
                        const ext = (0, path_1.extname)(file.originalname);
                        const basename = file.originalname.replace(ext, '');
                        const timestamp = Date.now();
                        const hash = crypto.createHash('md5').update(`${basename}${timestamp}`).digest('hex').substring(0, 8);
                        const filename = `${basename}-${hash}${ext}`;
                        callback(null, filename);
                    },
                }),
            }),
            (0, common_1.forwardRef)(() => xhs_module_1.XhsModule),
            htmllib_module_1.HtmlLibModule,
        ],
        controllers: [
            template_controller_1.XhsTemplateController,
            notetype_controller_1.NoteTypeController,
            note_controller_1.NoteController,
            notetemplate_controller_1.NoteTemplateController,
            note_market_controller_1.NoteTemplateMarketController,
        ],
        providers: [
            template_service_1.XhsTemplateService,
            notetype_service_1.NoteTypeService,
            note_service_1.NoteService,
            notetemplate_service_1.NoteTemplateService,
        ],
        exports: [
            template_service_1.XhsTemplateService,
            notetype_service_1.NoteTypeService,
            note_service_1.NoteService,
            notetemplate_service_1.NoteTemplateService,
            typeorm_1.TypeOrmModule.forFeature([
                notetemplate_entity_1.NoteTemplate,
                note_template_relation_entity_1.NoteTemplateRelation,
                note_entity_1.Note,
                notetype_entity_1.NoteType,
                note_like_entity_1.NoteLike,
                note_view_entity_1.NoteView,
                note_favorite_entity_1.NoteFavorite,
                htmllib_entity_1.HtmlTemplateEntity
            ])
        ],
    })
], XiaohongshuModule);
exports.XiaohongshuModule = XiaohongshuModule;
