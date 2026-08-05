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
  ('DeepSeek',  'https://www.deepseek.com'),
  ('Meta', 'https://ai.meta.com'),
  ('Mistral', 'https://mistral.ai'),
  ('Alibaba', 'https://www.alibabacloud.com/en/product/modelstudio'),
  ('Zhipu', 'https://www.zhipuai.cn'),
  ('Moonshot', 'https://www.moonshot.cn');

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
  ('deepseek/deepseek-chat',     (SELECT id FROM providers WHERE name = 'DeepSeek'), 'chat',  128000,  '2025-05-21'),
  ('deepseek/deepseek-reasoner', (SELECT id FROM providers WHERE name = 'DeepSeek'), 'reasoning', 128000, '2025-03-24'),
  ('openai/gpt-4.1-mini', (SELECT id FROM providers WHERE name = 'OpenAI'), 'chat', 1047576, '2025-04-14'),
  ('anthropic/claude-3.7-sonnet', (SELECT id FROM providers WHERE name = 'Anthropic'), 'chat', 200000, '2025-02-24'),
  ('anthropic/claude-3.5-sonnet', (SELECT id FROM providers WHERE name = 'Anthropic'), 'chat', 200000, '2024-06-20'),
  ('google/gemini-1.5-pro', (SELECT id FROM providers WHERE name = 'Google'), 'chat', 2000000, '2024-02-15'),
  ('google/gemini-2.0-flash', (SELECT id FROM providers WHERE name = 'Google'), 'chat', 1048576, '2025-02-05'),
  ('meta/llama-4-maverick', (SELECT id FROM providers WHERE name = 'Meta'), 'chat', 1000000, '2025-04-05'),
  ('mistral/mistral-large-2', (SELECT id FROM providers WHERE name = 'Mistral'), 'chat', 128000, '2024-07-24'),
  ('alibaba/qwen3-235b', (SELECT id FROM providers WHERE name = 'Alibaba'), 'chat', 131072, '2025-04-29'),
  ('zhipu/glm-4.5', (SELECT id FROM providers WHERE name = 'Zhipu'), 'chat', 128000, '2025-03-26'),
  ('moonshot/kimi-k2', (SELECT id FROM providers WHERE name = 'Moonshot'), 'chat', 131072, '2025-07-10'),
  ('openai/gpt-4.1-nano', (SELECT id FROM providers WHERE name = 'OpenAI'), 'chat', 1047576, '2025-07-15'),
  ('openai/o4-mini', (SELECT id FROM providers WHERE name = 'OpenAI'), 'reasoning', 200000, '2025-04-16'),
  ('anthropic/claude-opus-5', (SELECT id FROM providers WHERE name = 'Anthropic'), 'chat', 200000, NULL),
  ('anthropic/claude-sonnet-5', (SELECT id FROM providers WHERE name = 'Anthropic'), 'chat', 200000, NULL),
  ('anthropic/claude-haiku-4.5', (SELECT id FROM providers WHERE name = 'Anthropic'), 'chat', 200000, NULL),
  ('google/gemini-2.5-flash-lite', (SELECT id FROM providers WHERE name = 'Google'), 'chat', 1048576, '2025-07-17'),
  ('google/gemini-3-flash', (SELECT id FROM providers WHERE name = 'Google'), 'chat', 1048576, NULL),
  ('deepseek/deepseek-v4-flash', (SELECT id FROM providers WHERE name = 'DeepSeek'), 'chat', 1048576, NULL),
  ('deepseek/deepseek-v4-pro', (SELECT id FROM providers WHERE name = 'DeepSeek'), 'chat', 1048576, NULL),
  ('meta/llama-4-scout', (SELECT id FROM providers WHERE name = 'Meta'), 'chat', 10000000, '2025-04-05'),
  ('mistral/mistral-large-3', (SELECT id FROM providers WHERE name = 'Mistral'), 'chat', 128000, NULL),
  ('alibaba/qwen3-coder-480b', (SELECT id FROM providers WHERE name = 'Alibaba'), 'chat', 262144, NULL),
  ('moonshot/kimi-k2.5', (SELECT id FROM providers WHERE name = 'Moonshot'), 'chat', 262144, NULL),
  ('zhipu/glm-4.6', (SELECT id FROM providers WHERE name = 'Zhipu'), 'chat', 204800, NULL);

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
   '["数学","逻辑","编程","复杂问答"]'),
  ((SELECT id FROM models WHERE slug = 'openai/gpt-4.1-mini'), 'en', 'GPT-4.1 mini', 'OpenAI''s cost-efficient mini model with a 1M token context window, balancing performance and speed.', '["chatbot","content creation","coding assistant","long-document analysis"]'),
  ((SELECT id FROM models WHERE slug = 'openai/gpt-4.1-mini'), 'zh-CN', 'GPT-4.1 mini', 'OpenAI 的高性价比小型模型，拥有 1M token 上下文，兼顾性能与速度。', '["chatbot","content creation","coding assistant","long-document analysis"]'),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-3.7-sonnet'), 'en', 'Claude 3.7 Sonnet', 'Anthropic''s hybrid reasoning model, combining instant responses with extended thinking.', '["chatbot","coding","complex reasoning","agentic workflows"]'),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-3.7-sonnet'), 'zh-CN', 'Claude 3.7 Sonnet', 'Anthropic 的混合推理模型，同时支持即时响应与扩展思考。', '["chatbot","coding","complex reasoning","agentic workflows"]'),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-3.5-sonnet'), 'en', 'Claude 3.5 Sonnet', 'Anthropic''s flagship model known for strong coding and nuanced writing.', '["coding","writing","chatbot","analysis"]'),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-3.5-sonnet'), 'zh-CN', 'Claude 3.5 Sonnet', 'Anthropic 旗舰模型，以强大的编程与细腻写作著称。', '["coding","writing","chatbot","analysis"]'),
  ((SELECT id FROM models WHERE slug = 'google/gemini-1.5-pro'), 'en', 'Gemini 1.5 Pro', 'Google''s long-context multimodal model supporting up to 2M tokens.', '["multimodal","long-context analysis","chatbot","document processing"]'),
  ((SELECT id FROM models WHERE slug = 'google/gemini-1.5-pro'), 'zh-CN', 'Gemini 1.5 Pro', 'Google 的长上下文多模态模型，支持最高 200 万 token。', '["multimodal","long-context analysis","chatbot","document processing"]'),
  ((SELECT id FROM models WHERE slug = 'google/gemini-2.0-flash'), 'en', 'Gemini 2.0 Flash', 'Google''s fast, low-latency model for high-volume tasks with multimodal input.', '["chatbot","real-time assistant","multimodal","high-volume tasks"]'),
  ((SELECT id FROM models WHERE slug = 'google/gemini-2.0-flash'), 'zh-CN', 'Gemini 2.0 Flash', 'Google 的快速低延迟模型，适合高吞吐任务，支持多模态输入。', '["chatbot","real-time assistant","multimodal","high-volume tasks"]'),
  ((SELECT id FROM models WHERE slug = 'meta/llama-4-maverick'), 'en', 'Llama 4 Maverick', 'Meta''s open-weight multimodal model with a 1M context window, optimized for agentic use.', '["chatbot","agentic workflows","multimodal","long-context"]'),
  ((SELECT id FROM models WHERE slug = 'meta/llama-4-maverick'), 'zh-CN', 'Llama 4 Maverick', 'Meta 的开源权重多模态模型，100 万上下文，为智能体场景优化。', '["chatbot","agentic workflows","multimodal","long-context"]'),
  ((SELECT id FROM models WHERE slug = 'mistral/mistral-large-2'), 'en', 'Mistral Large 2', 'Mistral''s flagship model with strong reasoning and code generation in multiple languages.', '["coding","reasoning","chatbot","multilingual"]'),
  ((SELECT id FROM models WHERE slug = 'mistral/mistral-large-2'), 'zh-CN', 'Mistral Large 2', 'Mistral 旗舰模型，多语言推理与代码生成能力出色。', '["coding","reasoning","chatbot","multilingual"]'),
  ((SELECT id FROM models WHERE slug = 'alibaba/qwen3-235b'), 'en', 'Qwen3 235B', 'Alibaba''s powerful MoE model with strong reasoning, coding and multilingual support.', '["coding","reasoning","chatbot","multilingual"]'),
  ((SELECT id FROM models WHERE slug = 'alibaba/qwen3-235b'), 'zh-CN', 'Qwen3 235B', '阿里的高性能 MoE 模型，推理、编程与多语言能力出色。', '["coding","reasoning","chatbot","multilingual"]'),
  ((SELECT id FROM models WHERE slug = 'zhipu/glm-4.5'), 'en', 'GLM-4.5', 'Zhipu AI''s flagship model with vision, reasoning and agentic capabilities.', '["chatbot","vision","reasoning","agentic workflows"]'),
  ((SELECT id FROM models WHERE slug = 'zhipu/glm-4.5'), 'zh-CN', 'GLM-4.5', '智谱 AI 旗舰模型，具备视觉、推理与智能体能力。', '["chatbot","vision","reasoning","agentic workflows"]'),
  ((SELECT id FROM models WHERE slug = 'moonshot/kimi-k2'), 'en', 'Kimi K2', 'Moonshot AI''s open-weight reasoning model built for agentic coding and tool use.', '["coding","reasoning","tool use","agentic workflows"]'),
  ((SELECT id FROM models WHERE slug = 'moonshot/kimi-k2'), 'zh-CN', 'Kimi K2', '月之暗面的开源权重推理模型，面向智能体编程与工具调用。', '["coding","reasoning","tool use","agentic workflows"]'),
  ((SELECT id FROM models WHERE slug = 'openai/gpt-4.1-nano'), 'en', 'GPT-4.1 nano', 'OpenAI''s smallest and most affordable GPT-4.1 model with a 1M context window.', '["lightweight chat","classification","extraction","high-volume tasks"]'),
  ((SELECT id FROM models WHERE slug = 'openai/gpt-4.1-nano'), 'zh-CN', 'GPT-4.1 nano', 'OpenAI 最小最实惠的 GPT-4.1 模型，拥有 1M 上下文窗口。', '["lightweight chat","classification","extraction","high-volume tasks"]'),
  ((SELECT id FROM models WHERE slug = 'openai/o4-mini'), 'en', 'o4-mini', 'OpenAI''s compact reasoning model for complex STEM and coding at low cost.', '["mathematics","coding","reasoning","agent workflows"]'),
  ((SELECT id FROM models WHERE slug = 'openai/o4-mini'), 'zh-CN', 'o4-mini', 'OpenAI 的轻量推理模型，以低成本处理复杂 STEM 与编程任务。', '["mathematics","coding","reasoning","agent workflows"]'),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-opus-5'), 'en', 'Claude Opus 5', 'Anthropic''s most powerful model for complex agentic coding and enterprise workloads.', '["complex reasoning","agentic coding","enterprise","research"]'),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-opus-5'), 'zh-CN', 'Claude Opus 5', 'Anthropic 最强模型，面向复杂智能体编程与企业级任务。', '["complex reasoning","agentic coding","enterprise","research"]'),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-sonnet-5'), 'en', 'Claude Sonnet 5', 'Anthropic''s high-performance model for coding and agentic tasks with balanced cost.', '["coding","agents","analysis","chatbot"]'),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-sonnet-5'), 'zh-CN', 'Claude Sonnet 5', 'Anthropic 高性能模型，兼顾成本与编码/智能体能力。', '["coding","agents","analysis","chatbot"]'),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-haiku-4.5'), 'en', 'Claude Haiku 4.5', 'Anthropic''s fastest and most cost-efficient model for high-volume workloads.', '["high-volume tasks","classification","moderation","fast responses"]'),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-haiku-4.5'), 'zh-CN', 'Claude Haiku 4.5', 'Anthropic 最快最高效的模型，适合高并发场景。', '["high-volume tasks","classification","moderation","fast responses"]'),
  ((SELECT id FROM models WHERE slug = 'google/gemini-2.5-flash-lite'), 'en', 'Gemini 2.5 Flash-Lite', 'Google''s most cost-efficient 2.5-series model for high-volume low-latency tasks.', '["high-volume","low-latency","classification","edge tasks"]'),
  ((SELECT id FROM models WHERE slug = 'google/gemini-2.5-flash-lite'), 'zh-CN', 'Gemini 2.5 Flash-Lite', 'Google 2.5 系列最具性价比的模型，适合高吞吐低延迟任务。', '["high-volume","low-latency","classification","edge tasks"]'),
  ((SELECT id FROM models WHERE slug = 'google/gemini-3-flash'), 'en', 'Gemini 3 Flash', 'Google''s latest Flash model with strong capabilities at fast speed and low cost (preview).', '["fast inference","multimodal","high-volume","chatbot"]'),
  ((SELECT id FROM models WHERE slug = 'google/gemini-3-flash'), 'zh-CN', 'Gemini 3 Flash', 'Google 最新 Flash 模型，速度快、成本低、能力强劲（预览版）。', '["fast inference","multimodal","high-volume","chatbot"]'),
  ((SELECT id FROM models WHERE slug = 'deepseek/deepseek-v4-flash'), 'en', 'DeepSeek V4-Flash', 'DeepSeek''s fast and ultra-cheap general model with a 1M context window.', '["general chat","coding","cost-sensitive apps","long context"]'),
  ((SELECT id FROM models WHERE slug = 'deepseek/deepseek-v4-flash'), 'zh-CN', 'DeepSeek V4-Flash', 'DeepSeek 的快速超低价通用模型，1M 上下文。', '["general chat","coding","cost-sensitive apps","long context"]'),
  ((SELECT id FROM models WHERE slug = 'deepseek/deepseek-v4-pro'), 'en', 'DeepSeek V4-Pro', 'DeepSeek''s flagship high-performance model for complex reasoning and coding.', '["reasoning","coding","complex tasks","analysis"]'),
  ((SELECT id FROM models WHERE slug = 'deepseek/deepseek-v4-pro'), 'zh-CN', 'DeepSeek V4-Pro', 'DeepSeek 旗舰高性能模型，面向复杂推理与编程。', '["reasoning","coding","complex tasks","analysis"]'),
  ((SELECT id FROM models WHERE slug = 'meta/llama-4-scout'), 'en', 'Llama 4 Scout', 'Meta''s efficient open-weight model with a massive 10M context window.', '["long-context","summarization","agentic","chatbot"]'),
  ((SELECT id FROM models WHERE slug = 'meta/llama-4-scout'), 'zh-CN', 'Llama 4 Scout', 'Meta 的高效开源权重模型，拥有 1000 万超长上下文。', '["long-context","summarization","agentic","chatbot"]'),
  ((SELECT id FROM models WHERE slug = 'mistral/mistral-large-3'), 'en', 'Mistral Large 3', 'Mistral''s newest flagship model with strong reasoning and multilingual capabilities.', '["reasoning","coding","multilingual","chatbot"]'),
  ((SELECT id FROM models WHERE slug = 'mistral/mistral-large-3'), 'zh-CN', 'Mistral Large 3', 'Mistral 最新旗舰模型，推理与多语言能力强。', '["reasoning","coding","multilingual","chatbot"]'),
  ((SELECT id FROM models WHERE slug = 'alibaba/qwen3-coder-480b'), 'en', 'Qwen3 Coder 480B', 'Alibaba''s code-specialized MoE model with a 256K context window.', '["coding","code review","debugging","software engineering"]'),
  ((SELECT id FROM models WHERE slug = 'alibaba/qwen3-coder-480b'), 'zh-CN', 'Qwen3 Coder 480B', '阿里的代码专用 MoE 模型，256K 上下文。', '["coding","code review","debugging","software engineering"]'),
  ((SELECT id FROM models WHERE slug = 'moonshot/kimi-k2.5'), 'en', 'Kimi K2.5', 'Moonshot AI''s latest open-weight reasoning model for agentic coding and tool use.', '["coding","reasoning","tool use","agentic workflows"]'),
  ((SELECT id FROM models WHERE slug = 'moonshot/kimi-k2.5'), 'zh-CN', 'Kimi K2.5', '月之暗面最新开源权重推理模型，面向智能体编程与工具调用。', '["coding","reasoning","tool use","agentic workflows"]'),
  ((SELECT id FROM models WHERE slug = 'zhipu/glm-4.6'), 'en', 'GLM-4.6', 'Zhipu AI''s upgraded flagship model with enhanced vision and agentic capabilities.', '["chatbot","vision","reasoning","agentic workflows"]'),
  ((SELECT id FROM models WHERE slug = 'zhipu/glm-4.6'), 'zh-CN', 'GLM-4.6', '智谱 AI 升级版旗舰模型，视觉与智能体能力增强。', '["chatbot","vision","reasoning","agentic workflows"]');

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
  ((SELECT id FROM models WHERE slug = 'deepseek/deepseek-reasoner'),    0.55,  2.19, 'USD', 'per_1M_tokens'),
  ((SELECT id FROM models WHERE slug = 'openai/gpt-4.1-mini'), 0.4, 1.6, 'USD', 'per_1M_tokens'),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-3.7-sonnet'), 3.0, 15.0, 'USD', 'per_1M_tokens'),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-3.5-sonnet'), 3.0, 15.0, 'USD', 'per_1M_tokens'),
  ((SELECT id FROM models WHERE slug = 'google/gemini-1.5-pro'), 1.25, 5.0, 'USD', 'per_1M_tokens'),
  ((SELECT id FROM models WHERE slug = 'google/gemini-2.0-flash'), 0.1, 0.4, 'USD', 'per_1M_tokens'),
  ((SELECT id FROM models WHERE slug = 'meta/llama-4-maverick'), 0.25, 0.75, 'USD', 'per_1M_tokens'),
  ((SELECT id FROM models WHERE slug = 'mistral/mistral-large-2'), 2.0, 6.0, 'USD', 'per_1M_tokens'),
  ((SELECT id FROM models WHERE slug = 'alibaba/qwen3-235b'), 0.2, 0.6, 'USD', 'per_1M_tokens'),
  ((SELECT id FROM models WHERE slug = 'zhipu/glm-4.5'), 0.6, 2.2, 'USD', 'per_1M_tokens'),
  ((SELECT id FROM models WHERE slug = 'moonshot/kimi-k2'), 0.6, 2.5, 'USD', 'per_1M_tokens'),
  ((SELECT id FROM models WHERE slug = 'openai/gpt-4.1-nano'), 0.2, 0.8, 'USD', 'per_1M_tokens'),
  ((SELECT id FROM models WHERE slug = 'openai/o4-mini'), 1.1, 4.4, 'USD', 'per_1M_tokens'),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-opus-5'), 5.0, 25.0, 'USD', 'per_1M_tokens'),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-sonnet-5'), 2.0, 10.0, 'USD', 'per_1M_tokens'),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-haiku-4.5'), 1.0, 5.0, 'USD', 'per_1M_tokens'),
  ((SELECT id FROM models WHERE slug = 'google/gemini-2.5-flash-lite'), 0.1, 0.4, 'USD', 'per_1M_tokens'),
  ((SELECT id FROM models WHERE slug = 'google/gemini-3-flash'), 0.5, 3.0, 'USD', 'per_1M_tokens'),
  ((SELECT id FROM models WHERE slug = 'deepseek/deepseek-v4-flash'), 0.14, 0.28, 'USD', 'per_1M_tokens'),
  ((SELECT id FROM models WHERE slug = 'deepseek/deepseek-v4-pro'), 0.43, 0.87, 'USD', 'per_1M_tokens'),
  ((SELECT id FROM models WHERE slug = 'meta/llama-4-scout'), 0.1, 0.5, 'USD', 'per_1M_tokens'),
  ((SELECT id FROM models WHERE slug = 'mistral/mistral-large-3'), 0.5, 1.5, 'USD', 'per_1M_tokens'),
  ((SELECT id FROM models WHERE slug = 'alibaba/qwen3-coder-480b'), 0.3, 1.0, 'USD', 'per_1M_tokens'),
  ((SELECT id FROM models WHERE slug = 'moonshot/kimi-k2.5'), 0.5, 2.8, 'USD', 'per_1M_tokens'),
  ((SELECT id FROM models WHERE slug = 'zhipu/glm-4.6'), 0.6, 2.2, 'USD', 'per_1M_tokens');

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

-- ---------------------------------------------------------------------------
-- 6. 模型能力（9 模型 × 7 能力 = 63 条，Phase 9.1）
-- capability 取值：vision / reasoning / coding / audio / function_calling / multimodal / long_context
-- 判定口径（演示数据，上线前须核对官方文档）：
--   long_context  = context_window >= 200K tokens；
--   audio         = 音频输入能力（语音）；o3/deepseek 系列为纯文本模型。
-- INSERT OR IGNORE + UNIQUE(model_id, capability) 保证幂等。
-- ---------------------------------------------------------------------------
INSERT OR IGNORE INTO model_capabilities (model_id, capability, supported) VALUES
  -- OpenAI
  ((SELECT id FROM models WHERE slug = 'openai/gpt-4o'), 'vision', 1),
  ((SELECT id FROM models WHERE slug = 'openai/gpt-4o'), 'reasoning', 1),
  ((SELECT id FROM models WHERE slug = 'openai/gpt-4o'), 'coding', 1),
  ((SELECT id FROM models WHERE slug = 'openai/gpt-4o'), 'audio', 1),
  ((SELECT id FROM models WHERE slug = 'openai/gpt-4o'), 'function_calling', 1),
  ((SELECT id FROM models WHERE slug = 'openai/gpt-4o'), 'multimodal', 1),
  ((SELECT id FROM models WHERE slug = 'openai/gpt-4o'), 'long_context', 0),

  ((SELECT id FROM models WHERE slug = 'openai/gpt-4.1'), 'vision', 1),
  ((SELECT id FROM models WHERE slug = 'openai/gpt-4.1'), 'reasoning', 1),
  ((SELECT id FROM models WHERE slug = 'openai/gpt-4.1'), 'coding', 1),
  ((SELECT id FROM models WHERE slug = 'openai/gpt-4.1'), 'audio', 0),
  ((SELECT id FROM models WHERE slug = 'openai/gpt-4.1'), 'function_calling', 1),
  ((SELECT id FROM models WHERE slug = 'openai/gpt-4.1'), 'multimodal', 1),
  ((SELECT id FROM models WHERE slug = 'openai/gpt-4.1'), 'long_context', 1),

  ((SELECT id FROM models WHERE slug = 'openai/o3'), 'vision', 0),
  ((SELECT id FROM models WHERE slug = 'openai/o3'), 'reasoning', 1),
  ((SELECT id FROM models WHERE slug = 'openai/o3'), 'coding', 1),
  ((SELECT id FROM models WHERE slug = 'openai/o3'), 'audio', 0),
  ((SELECT id FROM models WHERE slug = 'openai/o3'), 'function_calling', 1),
  ((SELECT id FROM models WHERE slug = 'openai/o3'), 'multimodal', 0),
  ((SELECT id FROM models WHERE slug = 'openai/o3'), 'long_context', 1),

  -- Anthropic
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-sonnet-4'), 'vision', 1),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-sonnet-4'), 'reasoning', 1),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-sonnet-4'), 'coding', 1),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-sonnet-4'), 'audio', 0),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-sonnet-4'), 'function_calling', 1),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-sonnet-4'), 'multimodal', 1),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-sonnet-4'), 'long_context', 1),

  ((SELECT id FROM models WHERE slug = 'anthropic/claude-opus-4'), 'vision', 1),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-opus-4'), 'reasoning', 1),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-opus-4'), 'coding', 1),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-opus-4'), 'audio', 0),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-opus-4'), 'function_calling', 1),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-opus-4'), 'multimodal', 1),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-opus-4'), 'long_context', 1),

  -- Google
  ((SELECT id FROM models WHERE slug = 'google/gemini-2.5-pro'), 'vision', 1),
  ((SELECT id FROM models WHERE slug = 'google/gemini-2.5-pro'), 'reasoning', 1),
  ((SELECT id FROM models WHERE slug = 'google/gemini-2.5-pro'), 'coding', 1),
  ((SELECT id FROM models WHERE slug = 'google/gemini-2.5-pro'), 'audio', 1),
  ((SELECT id FROM models WHERE slug = 'google/gemini-2.5-pro'), 'function_calling', 1),
  ((SELECT id FROM models WHERE slug = 'google/gemini-2.5-pro'), 'multimodal', 1),
  ((SELECT id FROM models WHERE slug = 'google/gemini-2.5-pro'), 'long_context', 1),

  ((SELECT id FROM models WHERE slug = 'google/gemini-2.5-flash'), 'vision', 1),
  ((SELECT id FROM models WHERE slug = 'google/gemini-2.5-flash'), 'reasoning', 1),
  ((SELECT id FROM models WHERE slug = 'google/gemini-2.5-flash'), 'coding', 1),
  ((SELECT id FROM models WHERE slug = 'google/gemini-2.5-flash'), 'audio', 1),
  ((SELECT id FROM models WHERE slug = 'google/gemini-2.5-flash'), 'function_calling', 1),
  ((SELECT id FROM models WHERE slug = 'google/gemini-2.5-flash'), 'multimodal', 1),
  ((SELECT id FROM models WHERE slug = 'google/gemini-2.5-flash'), 'long_context', 1),

  -- DeepSeek
  ((SELECT id FROM models WHERE slug = 'deepseek/deepseek-chat'), 'vision', 0),
  ((SELECT id FROM models WHERE slug = 'deepseek/deepseek-chat'), 'reasoning', 1),
  ((SELECT id FROM models WHERE slug = 'deepseek/deepseek-chat'), 'coding', 1),
  ((SELECT id FROM models WHERE slug = 'deepseek/deepseek-chat'), 'audio', 0),
  ((SELECT id FROM models WHERE slug = 'deepseek/deepseek-chat'), 'function_calling', 1),
  ((SELECT id FROM models WHERE slug = 'deepseek/deepseek-chat'), 'multimodal', 0),
  ((SELECT id FROM models WHERE slug = 'deepseek/deepseek-chat'), 'long_context', 0),

  ((SELECT id FROM models WHERE slug = 'deepseek/deepseek-reasoner'), 'vision', 0),
  ((SELECT id FROM models WHERE slug = 'deepseek/deepseek-reasoner'), 'reasoning', 1),
  ((SELECT id FROM models WHERE slug = 'deepseek/deepseek-reasoner'), 'coding', 1),
  ((SELECT id FROM models WHERE slug = 'deepseek/deepseek-reasoner'), 'audio', 0),
  ((SELECT id FROM models WHERE slug = 'deepseek/deepseek-reasoner'), 'function_calling', 1),
  ((SELECT id FROM models WHERE slug = 'deepseek/deepseek-reasoner'), 'multimodal', 0),
  ((SELECT id FROM models WHERE slug = 'deepseek/deepseek-reasoner'), 'long_context', 0),
  ((SELECT id FROM models WHERE slug = 'openai/gpt-4.1-mini'), 'vision', 1),
  ((SELECT id FROM models WHERE slug = 'openai/gpt-4.1-mini'), 'reasoning', 1),
  ((SELECT id FROM models WHERE slug = 'openai/gpt-4.1-mini'), 'coding', 1),
  ((SELECT id FROM models WHERE slug = 'openai/gpt-4.1-mini'), 'audio', 0),
  ((SELECT id FROM models WHERE slug = 'openai/gpt-4.1-mini'), 'function_calling', 1),
  ((SELECT id FROM models WHERE slug = 'openai/gpt-4.1-mini'), 'multimodal', 1),
  ((SELECT id FROM models WHERE slug = 'openai/gpt-4.1-mini'), 'long_context', 1),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-3.7-sonnet'), 'vision', 1),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-3.7-sonnet'), 'reasoning', 1),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-3.7-sonnet'), 'coding', 1),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-3.7-sonnet'), 'audio', 0),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-3.7-sonnet'), 'function_calling', 1),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-3.7-sonnet'), 'multimodal', 1),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-3.7-sonnet'), 'long_context', 1),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-3.5-sonnet'), 'vision', 1),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-3.5-sonnet'), 'reasoning', 1),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-3.5-sonnet'), 'coding', 1),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-3.5-sonnet'), 'audio', 0),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-3.5-sonnet'), 'function_calling', 1),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-3.5-sonnet'), 'multimodal', 1),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-3.5-sonnet'), 'long_context', 1),
  ((SELECT id FROM models WHERE slug = 'google/gemini-1.5-pro'), 'vision', 1),
  ((SELECT id FROM models WHERE slug = 'google/gemini-1.5-pro'), 'reasoning', 1),
  ((SELECT id FROM models WHERE slug = 'google/gemini-1.5-pro'), 'coding', 1),
  ((SELECT id FROM models WHERE slug = 'google/gemini-1.5-pro'), 'audio', 1),
  ((SELECT id FROM models WHERE slug = 'google/gemini-1.5-pro'), 'function_calling', 1),
  ((SELECT id FROM models WHERE slug = 'google/gemini-1.5-pro'), 'multimodal', 1),
  ((SELECT id FROM models WHERE slug = 'google/gemini-1.5-pro'), 'long_context', 1),
  ((SELECT id FROM models WHERE slug = 'google/gemini-2.0-flash'), 'vision', 1),
  ((SELECT id FROM models WHERE slug = 'google/gemini-2.0-flash'), 'reasoning', 1),
  ((SELECT id FROM models WHERE slug = 'google/gemini-2.0-flash'), 'coding', 1),
  ((SELECT id FROM models WHERE slug = 'google/gemini-2.0-flash'), 'audio', 1),
  ((SELECT id FROM models WHERE slug = 'google/gemini-2.0-flash'), 'function_calling', 1),
  ((SELECT id FROM models WHERE slug = 'google/gemini-2.0-flash'), 'multimodal', 1),
  ((SELECT id FROM models WHERE slug = 'google/gemini-2.0-flash'), 'long_context', 1),
  ((SELECT id FROM models WHERE slug = 'meta/llama-4-maverick'), 'vision', 1),
  ((SELECT id FROM models WHERE slug = 'meta/llama-4-maverick'), 'reasoning', 1),
  ((SELECT id FROM models WHERE slug = 'meta/llama-4-maverick'), 'coding', 1),
  ((SELECT id FROM models WHERE slug = 'meta/llama-4-maverick'), 'audio', 0),
  ((SELECT id FROM models WHERE slug = 'meta/llama-4-maverick'), 'function_calling', 1),
  ((SELECT id FROM models WHERE slug = 'meta/llama-4-maverick'), 'multimodal', 1),
  ((SELECT id FROM models WHERE slug = 'meta/llama-4-maverick'), 'long_context', 1),
  ((SELECT id FROM models WHERE slug = 'mistral/mistral-large-2'), 'vision', 0),
  ((SELECT id FROM models WHERE slug = 'mistral/mistral-large-2'), 'reasoning', 1),
  ((SELECT id FROM models WHERE slug = 'mistral/mistral-large-2'), 'coding', 1),
  ((SELECT id FROM models WHERE slug = 'mistral/mistral-large-2'), 'audio', 0),
  ((SELECT id FROM models WHERE slug = 'mistral/mistral-large-2'), 'function_calling', 1),
  ((SELECT id FROM models WHERE slug = 'mistral/mistral-large-2'), 'multimodal', 0),
  ((SELECT id FROM models WHERE slug = 'mistral/mistral-large-2'), 'long_context', 1),
  ((SELECT id FROM models WHERE slug = 'alibaba/qwen3-235b'), 'vision', 0),
  ((SELECT id FROM models WHERE slug = 'alibaba/qwen3-235b'), 'reasoning', 1),
  ((SELECT id FROM models WHERE slug = 'alibaba/qwen3-235b'), 'coding', 1),
  ((SELECT id FROM models WHERE slug = 'alibaba/qwen3-235b'), 'audio', 0),
  ((SELECT id FROM models WHERE slug = 'alibaba/qwen3-235b'), 'function_calling', 1),
  ((SELECT id FROM models WHERE slug = 'alibaba/qwen3-235b'), 'multimodal', 0),
  ((SELECT id FROM models WHERE slug = 'alibaba/qwen3-235b'), 'long_context', 1),
  ((SELECT id FROM models WHERE slug = 'zhipu/glm-4.5'), 'vision', 1),
  ((SELECT id FROM models WHERE slug = 'zhipu/glm-4.5'), 'reasoning', 1),
  ((SELECT id FROM models WHERE slug = 'zhipu/glm-4.5'), 'coding', 1),
  ((SELECT id FROM models WHERE slug = 'zhipu/glm-4.5'), 'audio', 0),
  ((SELECT id FROM models WHERE slug = 'zhipu/glm-4.5'), 'function_calling', 1),
  ((SELECT id FROM models WHERE slug = 'zhipu/glm-4.5'), 'multimodal', 0),
  ((SELECT id FROM models WHERE slug = 'zhipu/glm-4.5'), 'long_context', 1),
  ((SELECT id FROM models WHERE slug = 'moonshot/kimi-k2'), 'vision', 0),
  ((SELECT id FROM models WHERE slug = 'moonshot/kimi-k2'), 'reasoning', 1),
  ((SELECT id FROM models WHERE slug = 'moonshot/kimi-k2'), 'coding', 1),
  ((SELECT id FROM models WHERE slug = 'moonshot/kimi-k2'), 'audio', 0),
  ((SELECT id FROM models WHERE slug = 'moonshot/kimi-k2'), 'function_calling', 1),
  ((SELECT id FROM models WHERE slug = 'moonshot/kimi-k2'), 'multimodal', 0),
  ((SELECT id FROM models WHERE slug = 'moonshot/kimi-k2'), 'long_context', 1),
  ((SELECT id FROM models WHERE slug = 'openai/gpt-4.1-nano'), 'vision', 1),
  ((SELECT id FROM models WHERE slug = 'openai/gpt-4.1-nano'), 'reasoning', 1),
  ((SELECT id FROM models WHERE slug = 'openai/gpt-4.1-nano'), 'coding', 1),
  ((SELECT id FROM models WHERE slug = 'openai/gpt-4.1-nano'), 'audio', 0),
  ((SELECT id FROM models WHERE slug = 'openai/gpt-4.1-nano'), 'function_calling', 1),
  ((SELECT id FROM models WHERE slug = 'openai/gpt-4.1-nano'), 'multimodal', 1),
  ((SELECT id FROM models WHERE slug = 'openai/gpt-4.1-nano'), 'long_context', 1),
  ((SELECT id FROM models WHERE slug = 'openai/o4-mini'), 'vision', 0),
  ((SELECT id FROM models WHERE slug = 'openai/o4-mini'), 'reasoning', 1),
  ((SELECT id FROM models WHERE slug = 'openai/o4-mini'), 'coding', 1),
  ((SELECT id FROM models WHERE slug = 'openai/o4-mini'), 'audio', 0),
  ((SELECT id FROM models WHERE slug = 'openai/o4-mini'), 'function_calling', 1),
  ((SELECT id FROM models WHERE slug = 'openai/o4-mini'), 'multimodal', 0),
  ((SELECT id FROM models WHERE slug = 'openai/o4-mini'), 'long_context', 1),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-opus-5'), 'vision', 1),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-opus-5'), 'reasoning', 1),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-opus-5'), 'coding', 1),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-opus-5'), 'audio', 0),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-opus-5'), 'function_calling', 1),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-opus-5'), 'multimodal', 1),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-opus-5'), 'long_context', 1),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-sonnet-5'), 'vision', 1),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-sonnet-5'), 'reasoning', 1),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-sonnet-5'), 'coding', 1),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-sonnet-5'), 'audio', 0),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-sonnet-5'), 'function_calling', 1),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-sonnet-5'), 'multimodal', 1),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-sonnet-5'), 'long_context', 1),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-haiku-4.5'), 'vision', 1),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-haiku-4.5'), 'reasoning', 1),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-haiku-4.5'), 'coding', 1),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-haiku-4.5'), 'audio', 0),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-haiku-4.5'), 'function_calling', 1),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-haiku-4.5'), 'multimodal', 1),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-haiku-4.5'), 'long_context', 1),
  ((SELECT id FROM models WHERE slug = 'google/gemini-2.5-flash-lite'), 'vision', 1),
  ((SELECT id FROM models WHERE slug = 'google/gemini-2.5-flash-lite'), 'reasoning', 0),
  ((SELECT id FROM models WHERE slug = 'google/gemini-2.5-flash-lite'), 'coding', 1),
  ((SELECT id FROM models WHERE slug = 'google/gemini-2.5-flash-lite'), 'audio', 1),
  ((SELECT id FROM models WHERE slug = 'google/gemini-2.5-flash-lite'), 'function_calling', 1),
  ((SELECT id FROM models WHERE slug = 'google/gemini-2.5-flash-lite'), 'multimodal', 1),
  ((SELECT id FROM models WHERE slug = 'google/gemini-2.5-flash-lite'), 'long_context', 1),
  ((SELECT id FROM models WHERE slug = 'google/gemini-3-flash'), 'vision', 1),
  ((SELECT id FROM models WHERE slug = 'google/gemini-3-flash'), 'reasoning', 1),
  ((SELECT id FROM models WHERE slug = 'google/gemini-3-flash'), 'coding', 1),
  ((SELECT id FROM models WHERE slug = 'google/gemini-3-flash'), 'audio', 1),
  ((SELECT id FROM models WHERE slug = 'google/gemini-3-flash'), 'function_calling', 1),
  ((SELECT id FROM models WHERE slug = 'google/gemini-3-flash'), 'multimodal', 1),
  ((SELECT id FROM models WHERE slug = 'google/gemini-3-flash'), 'long_context', 1),
  ((SELECT id FROM models WHERE slug = 'deepseek/deepseek-v4-flash'), 'vision', 0),
  ((SELECT id FROM models WHERE slug = 'deepseek/deepseek-v4-flash'), 'reasoning', 1),
  ((SELECT id FROM models WHERE slug = 'deepseek/deepseek-v4-flash'), 'coding', 1),
  ((SELECT id FROM models WHERE slug = 'deepseek/deepseek-v4-flash'), 'audio', 0),
  ((SELECT id FROM models WHERE slug = 'deepseek/deepseek-v4-flash'), 'function_calling', 1),
  ((SELECT id FROM models WHERE slug = 'deepseek/deepseek-v4-flash'), 'multimodal', 0),
  ((SELECT id FROM models WHERE slug = 'deepseek/deepseek-v4-flash'), 'long_context', 1),
  ((SELECT id FROM models WHERE slug = 'deepseek/deepseek-v4-pro'), 'vision', 0),
  ((SELECT id FROM models WHERE slug = 'deepseek/deepseek-v4-pro'), 'reasoning', 1),
  ((SELECT id FROM models WHERE slug = 'deepseek/deepseek-v4-pro'), 'coding', 1),
  ((SELECT id FROM models WHERE slug = 'deepseek/deepseek-v4-pro'), 'audio', 0),
  ((SELECT id FROM models WHERE slug = 'deepseek/deepseek-v4-pro'), 'function_calling', 1),
  ((SELECT id FROM models WHERE slug = 'deepseek/deepseek-v4-pro'), 'multimodal', 0),
  ((SELECT id FROM models WHERE slug = 'deepseek/deepseek-v4-pro'), 'long_context', 1),
  ((SELECT id FROM models WHERE slug = 'meta/llama-4-scout'), 'vision', 1),
  ((SELECT id FROM models WHERE slug = 'meta/llama-4-scout'), 'reasoning', 1),
  ((SELECT id FROM models WHERE slug = 'meta/llama-4-scout'), 'coding', 1),
  ((SELECT id FROM models WHERE slug = 'meta/llama-4-scout'), 'audio', 0),
  ((SELECT id FROM models WHERE slug = 'meta/llama-4-scout'), 'function_calling', 1),
  ((SELECT id FROM models WHERE slug = 'meta/llama-4-scout'), 'multimodal', 1),
  ((SELECT id FROM models WHERE slug = 'meta/llama-4-scout'), 'long_context', 1),
  ((SELECT id FROM models WHERE slug = 'mistral/mistral-large-3'), 'vision', 0),
  ((SELECT id FROM models WHERE slug = 'mistral/mistral-large-3'), 'reasoning', 1),
  ((SELECT id FROM models WHERE slug = 'mistral/mistral-large-3'), 'coding', 1),
  ((SELECT id FROM models WHERE slug = 'mistral/mistral-large-3'), 'audio', 0),
  ((SELECT id FROM models WHERE slug = 'mistral/mistral-large-3'), 'function_calling', 1),
  ((SELECT id FROM models WHERE slug = 'mistral/mistral-large-3'), 'multimodal', 0),
  ((SELECT id FROM models WHERE slug = 'mistral/mistral-large-3'), 'long_context', 1),
  ((SELECT id FROM models WHERE slug = 'alibaba/qwen3-coder-480b'), 'vision', 0),
  ((SELECT id FROM models WHERE slug = 'alibaba/qwen3-coder-480b'), 'reasoning', 1),
  ((SELECT id FROM models WHERE slug = 'alibaba/qwen3-coder-480b'), 'coding', 1),
  ((SELECT id FROM models WHERE slug = 'alibaba/qwen3-coder-480b'), 'audio', 0),
  ((SELECT id FROM models WHERE slug = 'alibaba/qwen3-coder-480b'), 'function_calling', 1),
  ((SELECT id FROM models WHERE slug = 'alibaba/qwen3-coder-480b'), 'multimodal', 0),
  ((SELECT id FROM models WHERE slug = 'alibaba/qwen3-coder-480b'), 'long_context', 1),
  ((SELECT id FROM models WHERE slug = 'moonshot/kimi-k2.5'), 'vision', 0),
  ((SELECT id FROM models WHERE slug = 'moonshot/kimi-k2.5'), 'reasoning', 1),
  ((SELECT id FROM models WHERE slug = 'moonshot/kimi-k2.5'), 'coding', 1),
  ((SELECT id FROM models WHERE slug = 'moonshot/kimi-k2.5'), 'audio', 0),
  ((SELECT id FROM models WHERE slug = 'moonshot/kimi-k2.5'), 'function_calling', 1),
  ((SELECT id FROM models WHERE slug = 'moonshot/kimi-k2.5'), 'multimodal', 0),
  ((SELECT id FROM models WHERE slug = 'moonshot/kimi-k2.5'), 'long_context', 1),
  ((SELECT id FROM models WHERE slug = 'zhipu/glm-4.6'), 'vision', 1),
  ((SELECT id FROM models WHERE slug = 'zhipu/glm-4.6'), 'reasoning', 1),
  ((SELECT id FROM models WHERE slug = 'zhipu/glm-4.6'), 'coding', 1),
  ((SELECT id FROM models WHERE slug = 'zhipu/glm-4.6'), 'audio', 0),
  ((SELECT id FROM models WHERE slug = 'zhipu/glm-4.6'), 'function_calling', 1),
  ((SELECT id FROM models WHERE slug = 'zhipu/glm-4.6'), 'multimodal', 1),
  ((SELECT id FROM models WHERE slug = 'zhipu/glm-4.6'), 'long_context', 1);

-- ---------------------------------------------------------------------------
-- 7. 价格历史初始导入（Phase 9.2）：pricing → pricing_history
-- 规则：每个模型一条首条历史；effective_date 取 pricing.updated_at 的日期部分
--       （pricing 无 created_at，updated_at 为入库时固定时间戳，视为创建时间），
--       为空则回退当前 UTC 日期；source = 'initial_import'。
-- 幂等：INSERT OR IGNORE + UNIQUE(model_id, effective_date, currency, unit)。
-- ---------------------------------------------------------------------------
INSERT OR IGNORE INTO pricing_history
  (model_id, input_price, output_price, currency, unit, effective_date, source)
SELECT
  pr.model_id,
  pr.input_price,
  pr.output_price,
  pr.currency,
  pr.unit,
  COALESCE(date(pr.updated_at), date('now')),
  'initial_import'
FROM pricing pr;

-- ---------------------------------------------------------------------------
-- 8. Benchmark 数据（Phase 9.4a）
-- ⚠️ 数据透明声明：以下 benchmark 分数为【示例/人工录入数据】（source='manual'、
--    dataset='internal-demo'、version='v1'，0-100 口径），仅用于演示数据链路；
--    正式上线前须以官方基准（如 HumanEval、MMLU、MMMU 等）实测数据替换。
-- 幂等：INSERT OR IGNORE + UNIQUE(model_id, category_id, dataset, version)。
-- ---------------------------------------------------------------------------
INSERT OR IGNORE INTO benchmark_categories (slug, name, description) VALUES
  ('coding', 'Coding', 'Code generation and programming tasks'),
  ('reasoning', 'Reasoning', 'Logical and multi-step reasoning tasks'),
  ('math', 'Math', 'Mathematical problem solving'),
  ('vision', 'Vision', 'Multimodal image understanding tasks');

INSERT OR IGNORE INTO benchmark_results
  (model_id, category_id, score, rank, dataset, version, source, tested_at) VALUES
  -- OpenAI
  ((SELECT id FROM models WHERE slug = 'openai/gpt-4o'),
   (SELECT id FROM benchmark_categories WHERE slug = 'coding'), 88, NULL, 'internal-demo', 'v1', 'manual', '2026-07-01'),
  ((SELECT id FROM models WHERE slug = 'openai/gpt-4o'),
   (SELECT id FROM benchmark_categories WHERE slug = 'reasoning'), 90, NULL, 'internal-demo', 'v1', 'manual', '2026-07-01'),
  ((SELECT id FROM models WHERE slug = 'openai/gpt-4o'),
   (SELECT id FROM benchmark_categories WHERE slug = 'vision'), 92, NULL, 'internal-demo', 'v1', 'manual', '2026-07-01'),

  ((SELECT id FROM models WHERE slug = 'openai/gpt-4.1'),
   (SELECT id FROM benchmark_categories WHERE slug = 'coding'), 92, NULL, 'internal-demo', 'v1', 'manual', '2026-07-01'),
  ((SELECT id FROM models WHERE slug = 'openai/gpt-4.1'),
   (SELECT id FROM benchmark_categories WHERE slug = 'reasoning'), 91, NULL, 'internal-demo', 'v1', 'manual', '2026-07-01'),
  ((SELECT id FROM models WHERE slug = 'openai/gpt-4.1'),
   (SELECT id FROM benchmark_categories WHERE slug = 'math'), 89, NULL, 'internal-demo', 'v1', 'manual', '2026-07-01'),

  ((SELECT id FROM models WHERE slug = 'openai/o3'),
   (SELECT id FROM benchmark_categories WHERE slug = 'coding'), 89, NULL, 'internal-demo', 'v1', 'manual', '2026-07-01'),
  ((SELECT id FROM models WHERE slug = 'openai/o3'),
   (SELECT id FROM benchmark_categories WHERE slug = 'reasoning'), 96, NULL, 'internal-demo', 'v1', 'manual', '2026-07-01'),
  ((SELECT id FROM models WHERE slug = 'openai/o3'),
   (SELECT id FROM benchmark_categories WHERE slug = 'math'), 94, NULL, 'internal-demo', 'v1', 'manual', '2026-07-01'),

  -- Anthropic
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-sonnet-4'),
   (SELECT id FROM benchmark_categories WHERE slug = 'coding'), 90, NULL, 'internal-demo', 'v1', 'manual', '2026-07-01'),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-sonnet-4'),
   (SELECT id FROM benchmark_categories WHERE slug = 'reasoning'), 92, NULL, 'internal-demo', 'v1', 'manual', '2026-07-01'),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-sonnet-4'),
   (SELECT id FROM benchmark_categories WHERE slug = 'vision'), 88, NULL, 'internal-demo', 'v1', 'manual', '2026-07-01'),

  ((SELECT id FROM models WHERE slug = 'anthropic/claude-opus-4'),
   (SELECT id FROM benchmark_categories WHERE slug = 'coding'), 93, NULL, 'internal-demo', 'v1', 'manual', '2026-07-01'),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-opus-4'),
   (SELECT id FROM benchmark_categories WHERE slug = 'reasoning'), 95, NULL, 'internal-demo', 'v1', 'manual', '2026-07-01'),
  ((SELECT id FROM models WHERE slug = 'anthropic/claude-opus-4'),
   (SELECT id FROM benchmark_categories WHERE slug = 'math'), 91, NULL, 'internal-demo', 'v1', 'manual', '2026-07-01'),

  -- Google
  ((SELECT id FROM models WHERE slug = 'google/gemini-2.5-pro'),
   (SELECT id FROM benchmark_categories WHERE slug = 'coding'), 90, NULL, 'internal-demo', 'v1', 'manual', '2026-07-01'),
  ((SELECT id FROM models WHERE slug = 'google/gemini-2.5-pro'),
   (SELECT id FROM benchmark_categories WHERE slug = 'reasoning'), 93, NULL, 'internal-demo', 'v1', 'manual', '2026-07-01'),
  ((SELECT id FROM models WHERE slug = 'google/gemini-2.5-pro'),
   (SELECT id FROM benchmark_categories WHERE slug = 'math'), 92, NULL, 'internal-demo', 'v1', 'manual', '2026-07-01'),
  ((SELECT id FROM models WHERE slug = 'google/gemini-2.5-pro'),
   (SELECT id FROM benchmark_categories WHERE slug = 'vision'), 94, NULL, 'internal-demo', 'v1', 'manual', '2026-07-01'),

  ((SELECT id FROM models WHERE slug = 'google/gemini-2.5-flash'),
   (SELECT id FROM benchmark_categories WHERE slug = 'coding'), 84, NULL, 'internal-demo', 'v1', 'manual', '2026-07-01'),
  ((SELECT id FROM models WHERE slug = 'google/gemini-2.5-flash'),
   (SELECT id FROM benchmark_categories WHERE slug = 'reasoning'), 86, NULL, 'internal-demo', 'v1', 'manual', '2026-07-01'),
  ((SELECT id FROM models WHERE slug = 'google/gemini-2.5-flash'),
   (SELECT id FROM benchmark_categories WHERE slug = 'vision'), 90, NULL, 'internal-demo', 'v1', 'manual', '2026-07-01'),

  -- DeepSeek
  ((SELECT id FROM models WHERE slug = 'deepseek/deepseek-chat'),
   (SELECT id FROM benchmark_categories WHERE slug = 'coding'), 87, NULL, 'internal-demo', 'v1', 'manual', '2026-07-01'),
  ((SELECT id FROM models WHERE slug = 'deepseek/deepseek-chat'),
   (SELECT id FROM benchmark_categories WHERE slug = 'reasoning'), 85, NULL, 'internal-demo', 'v1', 'manual', '2026-07-01'),
  ((SELECT id FROM models WHERE slug = 'deepseek/deepseek-chat'),
   (SELECT id FROM benchmark_categories WHERE slug = 'math'), 83, NULL, 'internal-demo', 'v1', 'manual', '2026-07-01'),

  ((SELECT id FROM models WHERE slug = 'deepseek/deepseek-reasoner'),
   (SELECT id FROM benchmark_categories WHERE slug = 'coding'), 85, NULL, 'internal-demo', 'v1', 'manual', '2026-07-01'),
  ((SELECT id FROM models WHERE slug = 'deepseek/deepseek-reasoner'),
   (SELECT id FROM benchmark_categories WHERE slug = 'reasoning'), 93, NULL, 'internal-demo', 'v1', 'manual', '2026-07-01'),
  ((SELECT id FROM models WHERE slug = 'deepseek/deepseek-reasoner'),
   (SELECT id FROM benchmark_categories WHERE slug = 'math'), 90, NULL, 'internal-demo', 'v1', 'manual', '2026-07-01');

-- Phase 9.7：internal-demo 数据标记来源类型（幂等；source_url 保持 NULL，verification_status 默认 'unverified'）
UPDATE benchmark_results SET source_type = 'internal'
WHERE source = 'manual' AND source_type IS NULL;

-- ---------------------------------------------------------------------------
-- 9. 数据核验修正（2026-08-05，依据 docs/pricing-verification.md）
-- ① 上下文修正：DeepSeek 官方上下文 128K
UPDATE models SET context_window = 128000
WHERE slug IN ('deepseek/deepseek-chat', 'deepseek/deepseek-reasoner');

-- ② 价格修正：Qwen3-235B / GLM-4.5（官方渠道参考价）
UPDATE pricing SET input_price = 0.2, output_price = 0.6
WHERE model_id = (SELECT id FROM models WHERE slug = 'alibaba/qwen3-235b');
UPDATE pricing SET input_price = 0.6, output_price = 2.2
WHERE model_id = (SELECT id FROM models WHERE slug = 'zhipu/glm-4.5');

-- ③ 状态标记：官方已 retired/deprecated 的旧模型
UPDATE models SET data_status = 'deprecated'
WHERE slug IN ('anthropic/claude-opus-4', 'anthropic/claude-sonnet-4',
               'anthropic/claude-3.5-sonnet', 'anthropic/claude-3.7-sonnet',
               'anthropic/claude-haiku-3.5', 'google/gemini-1.5-pro',
               'google/gemini-2.0-flash');

-- ④ 价格核验标记：与官方一致的模型补 source_url + verified（其余保持 unverified）
UPDATE pricing_history
SET verification_status = 'verified',
    source_url = (CASE model_id
      WHEN (SELECT id FROM models WHERE slug = 'openai/gpt-4o')          THEN 'https://openai.com/api/pricing/'
      WHEN (SELECT id FROM models WHERE slug = 'openai/gpt-4o-mini')     THEN 'https://developers.openai.com/api/docs/models/gpt-4o'
      WHEN (SELECT id FROM models WHERE slug = 'openai/gpt-4.1')         THEN 'https://platform.openai.com/docs/models/gpt-4.1'
      WHEN (SELECT id FROM models WHERE slug = 'anthropic/claude-opus-4') THEN 'https://docs.anthropic.com/en/docs/about-claude/pricing'
      WHEN (SELECT id FROM models WHERE slug = 'anthropic/claude-sonnet-4') THEN 'https://docs.anthropic.com/en/docs/about-claude/pricing'
      WHEN (SELECT id FROM models WHERE slug = 'anthropic/claude-3.7-sonnet') THEN 'https://docs.anthropic.com/en/docs/about-claude/pricing'
      WHEN (SELECT id FROM models WHERE slug = 'anthropic/claude-3.5-sonnet') THEN 'https://docs.anthropic.com/en/docs/about-claude/pricing'
      WHEN (SELECT id FROM models WHERE slug = 'anthropic/claude-haiku-3.5') THEN 'https://docs.anthropic.com/en/docs/about-claude/pricing'
      WHEN (SELECT id FROM models WHERE slug = 'google/gemini-2.5-pro')  THEN 'https://ai.google.dev/gemini-api/docs/pricing'
      WHEN (SELECT id FROM models WHERE slug = 'google/gemini-2.5-flash') THEN 'https://ai.google.dev/gemini-api/docs/pricing'
      WHEN (SELECT id FROM models WHERE slug = 'google/gemini-2.0-flash') THEN 'https://ai.google.dev/gemini-api/docs/pricing'
      WHEN (SELECT id FROM models WHERE slug = 'google/gemini-1.5-pro')  THEN 'https://ai.google.dev/gemini-api/docs/pricing'
      WHEN (SELECT id FROM models WHERE slug = 'mistral/mistral-large-2') THEN 'https://mistral.ai/pricing'
      WHEN (SELECT id FROM models WHERE slug = 'moonshot/kimi-k2')       THEN 'https://platform.moonshot.cn/docs/pricing'
      WHEN (SELECT id FROM models WHERE slug = 'deepseek/deepseek-chat') THEN 'https://api-docs.deepseek.com/'
      WHEN (SELECT id FROM models WHERE slug = 'deepseek/deepseek-reasoner') THEN 'https://api-docs.deepseek.com/'
      WHEN (SELECT id FROM models WHERE slug = 'alibaba/qwen3-235b')     THEN 'https://www.alibabacloud.com/en/product/modelstudio'
      WHEN (SELECT id FROM models WHERE slug = 'zhipu/glm-4.5')          THEN 'https://open.bigmodel.cn/pricing'
      ELSE source_url
    END)
WHERE source = 'initial_import'
  AND model_id IN (SELECT id FROM models WHERE slug IN
    ('openai/gpt-4o', 'openai/gpt-4o-mini', 'openai/gpt-4.1',
     'anthropic/claude-opus-4', 'anthropic/claude-sonnet-4', 'anthropic/claude-3.7-sonnet',
     'anthropic/claude-3.5-sonnet', 'anthropic/claude-haiku-3.5',
     'google/gemini-2.5-pro', 'google/gemini-2.5-flash', 'google/gemini-2.0-flash',
     'google/gemini-1.5-pro', 'mistral/mistral-large-2', 'moonshot/kimi-k2',
     'deepseek/deepseek-chat', 'deepseek/deepseek-reasoner',
     'alibaba/qwen3-235b', 'zhipu/glm-4.5'));

-- ---------------------------------------------------------------------------
