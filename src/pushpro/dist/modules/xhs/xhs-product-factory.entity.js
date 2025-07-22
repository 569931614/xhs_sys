"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.XhsProductFactory = void 0;
const typeorm_1 = require("typeorm");
let XhsProductFactory = class XhsProductFactory {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], XhsProductFactory.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '用户ID' }),
    __metadata("design:type", String)
], XhsProductFactory.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '品牌产品', length: 100 }),
    __metadata("design:type", String)
], XhsProductFactory.prototype, "brandProduct", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '标题', length: 100 }),
    __metadata("design:type", String)
], XhsProductFactory.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '活动ID', length: 50 }),
    __metadata("design:type", String)
], XhsProductFactory.prototype, "activityId", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '文件ID列表', type: 'simple-array', nullable: true }),
    __metadata("design:type", Array)
], XhsProductFactory.prototype, "fileIds", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '模板ID列表', type: 'simple-array', nullable: true }),
    __metadata("design:type", Array)
], XhsProductFactory.prototype, "templateIds", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '补充信息', type: 'text', nullable: true }),
    __metadata("design:type", String)
], XhsProductFactory.prototype, "information", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '选中的模板ID', length: 100, nullable: true }),
    __metadata("design:type", String)
], XhsProductFactory.prototype, "selectedTemplateId", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '参数类型', length: 50, nullable: true, default: 'normal' }),
    __metadata("design:type", String)
], XhsProductFactory.prototype, "paramsType", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: 'Coze执行ID', length: 100, nullable: true }),
    __metadata("design:type", String)
], XhsProductFactory.prototype, "executeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '工作流ID', length: 100, default: 'xhs_product_factory' }),
    __metadata("design:type", String)
], XhsProductFactory.prototype, "workflowId", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '状态', default: 'pending' }),
    __metadata("design:type", String)
], XhsProductFactory.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '生成结果', type: 'text', nullable: true }),
    __metadata("design:type", String)
], XhsProductFactory.prototype, "result", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '原始工作流完整结果', type: 'text', nullable: true }),
    __metadata("design:type", String)
], XhsProductFactory.prototype, "rawResult", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '错误信息', length: 255, nullable: true }),
    __metadata("design:type", String)
], XhsProductFactory.prototype, "error", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '笔记ID', length: 50, nullable: true }),
    __metadata("design:type", String)
], XhsProductFactory.prototype, "noteId", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '积分扣除类型', nullable: true }),
    __metadata("design:type", Number)
], XhsProductFactory.prototype, "deductType", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '积分扣除数量', nullable: true }),
    __metadata("design:type", Number)
], XhsProductFactory.prototype, "deductAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '是否已退款', default: false }),
    __metadata("design:type", Boolean)
], XhsProductFactory.prototype, "refunded", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '批次ID', length: 50, nullable: true }),
    __metadata("design:type", String)
], XhsProductFactory.prototype, "batchId", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '批次总数量', nullable: true, default: 1 }),
    __metadata("design:type", Number)
], XhsProductFactory.prototype, "batchCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '批次当前索引', nullable: true, default: 1 }),
    __metadata("design:type", Number)
], XhsProductFactory.prototype, "batchIndex", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: 'API调用失败计数', nullable: true, default: 0 }),
    __metadata("design:type", Number)
], XhsProductFactory.prototype, "apiFailCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '是否已弃用', default: false }),
    __metadata("design:type", Boolean)
], XhsProductFactory.prototype, "isDiscarded", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '创建时间', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], XhsProductFactory.prototype, "createTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ comment: '更新时间', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], XhsProductFactory.prototype, "updateTime", void 0);
XhsProductFactory = __decorate([
    (0, typeorm_1.Entity)('xhs_product_factory')
], XhsProductFactory);
exports.XhsProductFactory = XhsProductFactory;
