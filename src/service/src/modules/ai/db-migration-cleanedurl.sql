-- 首先删除现有的索引（如果存在）
DROP INDEX IDX_ai_image_url_mappings_cleanedUrl ON ai_image_url_mappings;

-- 修改ai_image_url_mappings表中的cleanedUrl字段类型
ALTER TABLE ai_image_url_mappings MODIFY COLUMN cleanedUrl TEXT;

-- 为TEXT类型的cleanedUrl列创建前缀索引
-- 使用前191个字符作为索引（这是utf8mb4编码下的最大索引长度）
CREATE INDEX IDX_ai_image_url_mappings_cleanedUrl ON ai_image_url_mappings(cleanedUrl(191));

-- 注意：如果您的数据库使用其他字符集，可能需要调整索引长度
-- UTF8: 最大可以使用255个字符
-- UTF8MB4: 最大可以使用191个字符 