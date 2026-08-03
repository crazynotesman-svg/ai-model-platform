-- ============================================================================
-- Seed 数据：供应商 / 模型 / 本地化 / 定价 / 资讯
-- 应用方式：npx wrangler d1 execute ai-model-platform-db --local --file=database/seed/seed.sql
-- 幂等性：全部使用 INSERT OR IGNORE（依赖唯一约束），可重复执行。
--
-- ⚠️ 数据透明声明：本文件为演示/启动数据。模型参数（context_window、release_date）
-- 与价格（input/output_price）为示例值，正式上线前须逐一核对官方来源，
-- 并补充 source_url 来源追踪（见 docs/database-design.md 数据透明原则）。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. 供应商（4 家）
-- ---------------------------------------------------------------------------
INSERT OR IGNORE INTO providers (name, website) VALUES
  ('OpenAI',    'https://openai.com'),
  ('Anthropic', 'https://www.anthropic.com'),
  ('Google',    'https://ai.google.dev'),
  ('DeepSeek',  'https://www.deepseek.com');

-- ---------------------------------------------------------------------------
-- 2. 模型（11 个，≥10）
-- slug 格式：{provider_lower}/{model}，全局唯一
-- model_type: chat（通用对话）/ reasoning（推理） / embedding（向量）...
-- ---------------------------------------------------------------------------
INSERT OR IGNORE INTO models (slug, provider, model_type, context_window, release_date) VALUES
  ('openai/gpt-4o',          (SELECT id FROM providers WHERE name = 'OpenAI'),    'chat',      128000,  '2024-05-13'),
  ('openai/gpt-4o-mini',     (SELECT id FROM providers WHERE name = 'OpenAI'),    'chat',      128000,  '2024-07-18'),
  ('openai/gpt-4.1',         (SELECT id FROM providers WHERE name = 'OpenAI'),    'chat',     1047576,  '2025-04-14'),
  ('openai/o3',              (SELECT id FROM providers WHERE name = 'OpenAI'),    'reasoning', 200000,  '2025-04-16'),
  ('anthropic/claude-sonnet-4',   (SELECT id FROM providers WHERE name = 'Anthropic'), 'chat', 200000,  '2025-05-21'),
  ('anthropic/claude-opus-4',     (SELECT id FROM providers WHERE name = 'Anthropic'), 'chat', 200000,  '2025-05-21'),
  ('anthropic/claude-haiku-3.5',  (SELECT id FROM providers WHERE name = 'Anthropic'), 'chat', 200000,  '2024-11-04'),
  ('google/gemini-2.5-pro',   (SELECT id FROM providers WHERE name = 'Google'), 'chat',     1048576,  '2025-03-25'),
  ('google/gemini-2.5-flash', (SELECT id FROM providers WHERE name = 'Google'), 'chat',     1048576,  '2025-06-17'),
  ('deepseek/deepseek-chat',     (SELECT id FROM providers WHERE name = 'DeepSeek'), 'chat',  65536,  '2025-05-21'),
  ('deepseek/deepseek-reasoner', (SELECT id FROM providers WHERE name = 'DeepSeek'), 'reasoning', 65536, '2025-03-24');

-- ---------------------------------------------------------------------------
-- 3. 模型本地化（en + zh-CN；use_cases 为 JSON 数组字符串）
-- ---------------------------------------------------------------------------
INSERT OR IGNORE INTO model_translations (model_id, language, name, description, use_cases) VALUES
  ((SELECT id FROM models WHERE slug = 'openai/gpt-4o'), 'en',
   'GPT-4o', 'OpenAI''s flagship multimodal model, fast and capable across text, vision, and audio.',
   '["chatbot","content creation","vision analysis","voice assistant"]'),
  ((SELECT id FROM models WHERE slug = 'openai/gpt-4o'), 'zh-CN',
   'GPT-4o', 'OpenAI 旗舰多模态模型，支持文本、视觉与音频，响应快、能力强。',
   '["对话机器人","内容创作","图像理解","语音助手"]'),

  ((SELECT id FROM models WHERE slug = 'openai/gpt-4o-mini'), 'en',
   'GPT-4o mini', 'Cost-efficient small model with strong performance for high-volume tasks.',
   '["classification","extraction","lightweight chat","batch jobs"]'),
  ((SELECT id FROM models WHERE slug = 'openai/gpt-4o-mini'), 'zh-CN',
   'GPT-4o mini', '高性价比小模型，性能强劲，适合高并发批量任务。',
   '["分类","信息抽取","轻量对话","批量任务"]'),

  ((SELECT id FROM models WHERE slug = 'openai/gpt-4.1'), 'en',
   'GPT-4.1', 'Latest GPT-4 generation with large context window and improved coding ability.',
   '["coding","long-context analysis","agent workflows","complex reasoning"]'),
  ((SELECT id FROM models WHERE slug = 'openai/gpt-4.1'), 'zh-CN',
   'GPT-4.1', '新一代 GPT-4 系列，超长上下文，编程与复杂推理能力显著提升。',
   '["编程","长文档分析","智能体工作流","复杂推理"]'),

  ((SELECT id FROM models WHERE slug = 'openai/o3'), 'en',
   'o3', 'OpenAI reasoning model that thinks before answering, strongest on STEM and logic.',
   '["mathematics","coding","scientific reasoning","complex planning"]'),
  ((SELECT id FROM models WHERE slug = 'openai/o3'), 'zh-CN',
   'o3', 'OpenAI 推理模型，回答前先进行思考，数学与逻辑推理能力突出。',
   '["数学","编程","科学推理","复杂规划"]'),

  ((SELECT id FROM models WHERE slug = 'anthropic/claude-sonnet-4'), 'en',
   'Claude Sonnet 4', 'Anthropic''s balanced frontier model: strong reasoning with great cost-efficiency.',
   '["reasoning","coding","analysis","tool use"]'),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-sonnet-4'), 'zh-CN',
   'Claude Sonnet 4', 'Anthropic 均衡型旗舰模型：推理能力强且成本效益出色。',
   '["推理","编程","分析","工具调用"]'),

  ((SELECT id FROM models WHERE slug = 'anthropic/claude-opus-4'), 'en',
   'Claude Opus 4', 'Anthropic''s most powerful model for complex tasks requiring deep reasoning.',
   '["complex reasoning","research","long documents","expert systems"]'),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-opus-4'), 'zh-CN',
   'Claude Opus 4', 'Anthropic 最强模型，面向需要深度推理的复杂任务。',
   '["复杂推理","研究","长文档","专家系统"]'),

  ((SELECT id FROM models WHERE slug = 'anthropic/claude-haiku-3.5'), 'en',
   'Claude Haiku 3.5', 'Fast, affordable model for high-throughput and latency-sensitive tasks.',
   '["high-volume tasks","classification","moderation","fast responses"]'),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-haiku-3.5'), 'zh-CN',
   'Claude Haiku 3.5', '快速、低价的模型，适合高吞吐与低延迟场景。',
   '["高并发任务","分类","内容审核","快速响应"]'),

  ((SELECT id FROM models WHERE slug = 'google/gemini-2.5-pro'), 'en',
   'Gemini 2.5 Pro', 'Google''s advanced reasoning model with 1M context and multimodal input.',
   '["multimodal","long context","research","reasoning"]'),
  ((SELECT id FROM models WHERE slug = 'google/gemini-2.5-pro'), 'zh-CN',
   'Gemini 2.5 Pro', 'Google 高级推理模型，百万级上下文，支持多模态输入。',
   '["多模态","长上下文","研究","推理"]'),

  ((SELECT id FROM models WHERE slug = 'google/gemini-2.5-flash'), 'en',
   'Gemini 2.5 Flash', 'Fast, cost-effective Gemini model with strong multimodal capabilities.',
   '["fast inference","multimodal","high volume","edge tasks"]'),
  ((SELECT id FROM models WHERE slug = 'google/gemini-2.5-flash'), 'zh-CN',
   'Gemini 2.5 Flash', '快速低成本的 Gemini 模型，多模态能力出色。',
   '["快速推理","多模态","高并发","边缘任务"]'),

  ((SELECT id FROM models WHERE slug = 'deepseek/deepseek-chat'), 'en',
   'DeepSeek Chat', 'DeepSeek''s general chat model (V3 series), open-source friendly and cheap.',
   '["general chat","coding","cost-sensitive apps","Chinese content"]'),
  ((SELECT id FROM models WHERE slug = 'deepseek/deepseek-chat'), 'zh-CN',
   'DeepSeek Chat', '深度求索通用对话模型（V3 系列），开源友好、价格低廉。',
   '["通用对话","编程","成本敏感应用","中文内容"]'),

  ((SELECT id FROM models WHERE slug = 'deepseek/deepseek-reasoner'), 'en',
   'DeepSeek Reasoner', 'DeepSeek''s reasoning model (R1 series) with strong math and logic.',
   '["mathematics","logic","coding","complex QA"]'),
  ((SELECT id FROM models WHERE slug = 'deepseek/deepseek-reasoner'), 'zh-CN',
   'DeepSeek Reasoner', '深度求索推理模型（R1 系列），数学与逻辑推理能力强。',
   '["数学","逻辑","编程","复杂问答"]');

-- ---------------------------------------------------------------------------
-- 4. 定价（USD / 每 1M tokens；演示值，正式上线前须核对官方价格页）
-- ---------------------------------------------------------------------------
INSERT OR IGNORE INTO pricing (model_id, input_price, output_price, currency, unit) VALUES
  ((SELECT id FROM models WHERE slug = 'openai/gpt-4o'),                2.50, 10.00, 'USD', 'per_1M_tokens'),
  ((SELECT id FROM models WHERE slug = 'openai/gpt-4o-mini'),            0.15,  0.60, 'USD', 'per_1M_tokens'),
  ((SELECT id FROM models WHERE slug = 'openai/gpt-4.1'),                2.00,  8.00, 'USD', 'per_1M_tokens'),
  ((SELECT id FROM models WHERE slug = 'openai/o3'),                     2.00,  8.00, 'USD', 'per_1M_tokens'),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-sonnet-4'),     3.00, 15.00, 'USD', 'per_1M_tokens'),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-opus-4'),      15.00, 75.00, 'USD', 'per_1M_tokens'),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-haiku-3.5'),    0.80,  4.00, 'USD', 'per_1M_tokens'),
  ((SELECT id FROM models WHERE slug = 'google/gemini-2.5-pro'),         1.25, 10.00, 'USD', 'per_1M_tokens'),
  ((SELECT id FROM models WHERE slug = 'google/gemini-2.5-flash'),       0.30,  2.50, 'USD', 'per_1M_tokens'),
  ((SELECT id FROM models WHERE slug = 'deepseek/deepseek-chat'),        0.27,  1.10, 'USD', 'per_1M_tokens'),
  ((SELECT id FROM models WHERE slug = 'deepseek/deepseek-reasoner'),    0.55,  2.19, 'USD', 'per_1M_tokens');

-- ---------------------------------------------------------------------------
-- 5. 资讯（示例 4 条，en/zh-CN 各 2；category/link 自 Phase 7 起）
-- ---------------------------------------------------------------------------
INSERT OR IGNORE INTO news (id, title, content, language, source, link, category, published_at) VALUES
  (1,
   'OpenAI announces GPT-4.1 with 1M-token context window',
   'GPT-4.1 expands context to 1M tokens and improves coding and agent performance, now available in preview.',
   'en', 'OpenAI', 'https://openai.com/index/gpt-4-1/', 'model-release', '2025-04-14'),
  (2,
   'Anthropic launches Claude Opus 4 and Sonnet 4',
   'The new frontier models bring stronger reasoning and tool use, with Opus 4 as the flagship.',
   'en', 'Anthropic', 'https://www.anthropic.com/news/claude-4', 'model-release', '2025-05-21'),
  (3,
   '深度求索发布 DeepSeek V3.1，推理成本大幅下降',
   'DeepSeek V3.1 在保持开源的同时进一步降低了 API 调用成本，推理场景性价比突出。',
   'zh-CN', 'DeepSeek 官方', 'https://api-docs.deepseek.com/', 'model-release', '2025-05-21'),
  (4,
   'Google 更新 Gemini 2.5 系列，Flash 版主打低成本高吞吐',
   'Gemini 2.5 Flash 提供百万上下文与多模态能力，价格仅为主流旗舰模型的零头。',
   'zh-CN', 'Google AI', 'https://blog.google/technology/ai/google-gemini-update-june-2025/', 'product', '2025-06-17');
