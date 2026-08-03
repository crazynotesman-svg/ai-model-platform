-- ============================================================================
-- Migration 0002：news 表扩展（分类 + 原文链接）
-- 说明：
--   * category：新闻分类（model-release / product / research / open-source / business / general），
--     由 collector 按标题关键词规则打标，缺省 'general'；
--   * link：原文链接（"不要复制全文"原则：仅保存标题/摘要/链接/时间）。
--   * 去重策略：collector 插入前按 (source, link) 查重（SQLite 不支持 ALTER 加唯一约束，
--     如需数据库级约束可后续重建表）。
-- ============================================================================

ALTER TABLE news ADD COLUMN category TEXT NOT NULL DEFAULT 'general';
ALTER TABLE news ADD COLUMN link TEXT;
