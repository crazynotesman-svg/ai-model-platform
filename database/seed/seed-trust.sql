-- ============================================================================
-- Seed：Data Trust 数据可信体系（Phase 11.5A）
--
-- 1. 注册 data_sources（幂等 INSERT OR IGNORE）
-- 2. 更新 benchmark_results / pricing_history / models / model_capabilities 的
--    来源关联 + confidence（基于真实来源映射；demo 数据诚实标注为 Internal Demo）
--
-- 幂等：INSERT OR IGNORE（UNIQUE name）+ UPDATE 可重复执行
-- ============================================================================

-- 1. 数据来源注册表（trust_level：100 官方 / 90 公开权威 / 70 社区 / 40 人工）
-- ---------------------------------------------------------------------------
INSERT OR IGNORE INTO data_sources (name, type, url, description, trust_level) VALUES
  ('OpenAI Pricing', 'official', 'https://openai.com/api/pricing/', 'OpenAI 官方 API 定价', 100),
  ('Anthropic Pricing', 'official', 'https://www.anthropic.com/pricing', 'Anthropic 官方定价', 100),
  ('Google Gemini Pricing', 'official', 'https://ai.google.dev/pricing', 'Google Gemini 官方定价', 100),
  ('OpenAI Model Docs', 'official', 'https://platform.openai.com/docs/models', 'OpenAI 模型文档（能力/上下文/元数据）', 100),
  ('Anthropic Model Docs', 'official', 'https://docs.anthropic.com/en/docs/about-claude/models', 'Anthropic 模型文档', 100),
  ('Google Gemini Docs', 'official', 'https://ai.google.dev/gemini-api/docs/models', 'Google Gemini 模型文档', 100),
  ('Meta Llama Docs', 'official', 'https://www.llama.com/docs/models-overview/', 'Meta Llama 模型文档', 100),
  ('HumanEval', 'benchmark', 'https://github.com/openai/human-eval', 'OpenAI HumanEval 代码生成基准（公开权威）', 90),
  ('MMLU', 'benchmark', 'https://doi.org/10.48550/arXiv.2009.03300', 'MMLU 多任务语言理解基准（论文）', 90),
  ('GPQA', 'benchmark', 'https://doi.org/10.48550/arXiv.2311.12022', 'GPQA 研究生级问答基准', 90),
  ('AIME', 'benchmark', 'https://artofproblemsolving.com/community/c13_contests', 'AIME 美国数学邀请赛（公开题目）', 90),
  ('SWE-bench', 'benchmark', 'https://www.swebench.com/', 'SWE-bench 软件工程基准', 90),
  ('LMSYS Chatbot Arena', 'benchmark', 'https://chat.lmsys.org/', 'LMSYS 真实用户偏好评测（Elo，含 methodology 记录）', 90),
  ('MMMU', 'benchmark', 'https://mmmu-benchmark.github.io/', 'MMMU 多模态多学科理解基准', 90),
  ('HuggingFace Open LLM Leaderboard', 'community', 'https://huggingface.co/spaces/open-llm-leaderboard/open_llm_leaderboard', 'HuggingFace 社区开源模型排行榜', 70),
  ('Internal Demo', 'manual', NULL, '人工录入演示数据（未核验，Experimental）', 40);

-- 1b. Phase 11.9：扩展外部来源（category / update_frequency / api_available / license_type）
-- ---------------------------------------------------------------------------
INSERT OR IGNORE INTO data_sources (name, type, url, description, trust_level, category, update_frequency, api_available, license_type) VALUES
  ('OpenAI Release Notes', 'official', 'https://platform.openai.com/docs/changelog', 'OpenAI 官方发布说明（Release Tracking）', 100, 'official_docs', 'weekly', 0, 'open'),
  ('Anthropic Release Notes', 'official', 'https://docs.anthropic.com/en/release-notes', 'Anthropic 官方发布说明', 100, 'official_docs', 'weekly', 0, 'open'),
  ('Google Gemini Technical Reports', 'official', 'https://ai.google.dev/research', 'Google DeepMind 技术报告（模型能力依据）', 100, 'research_paper', 'monthly', 0, 'open'),
  ('Meta Llama Papers', 'official', 'https://arxiv.org/list/cs.CL/recent', 'Meta Llama 研究论文（arXiv）', 100, 'research_paper', 'monthly', 0, 'open'),
  ('Papers with Code', 'benchmark', 'https://paperswithcode.com/llms', 'Papers with Code 论文-指标-分数数据库', 90, 'research_paper', 'weekly', 1, 'open'),
  ('MLCommons MLPerf', 'benchmark', 'https://mlcommons.org/benchmarks/inference-datacenter/', 'MLPerf 数据中心推理基准（官方榜单）', 90, 'benchmark', 'monthly', 1, 'open'),
  ('SWE-bench Verified', 'benchmark', 'https://www.swebench.com/verified', 'SWE-bench Verified（官方人工核验子集）', 90, 'benchmark', 'monthly', 0, 'open'),
  ('OpenAI Technical Report', 'official', 'https://openai.com/research/', 'OpenAI 技术报告（模型能力/评测方法）', 100, 'research_paper', 'monthly', 0, 'open');

-- 1c. 为既有官方来源补充扩展字段（category 等）
-- ---------------------------------------------------------------------------
UPDATE data_sources SET category = 'pricing',    update_frequency = 'weekly', api_available = 0, license_type = 'open'       WHERE name IN ('OpenAI Pricing', 'Anthropic Pricing', 'Google Gemini Pricing');
UPDATE data_sources SET category = 'official_docs', update_frequency = 'weekly', api_available = 0, license_type = 'open'   WHERE name IN ('OpenAI Model Docs', 'Anthropic Model Docs', 'Google Gemini Docs', 'Meta Llama Docs');
UPDATE data_sources SET category = 'benchmark',   update_frequency = 'monthly', api_available = 0, license_type = 'open'    WHERE name IN ('HumanEval', 'MMLU', 'GPQA', 'AIME', 'SWE-bench', 'MMMU');
UPDATE data_sources SET category = 'leaderboard', update_frequency = 'weekly', api_available = 1, license_type = 'open'     WHERE name = 'LMSYS Chatbot Arena';
UPDATE data_sources SET category = 'leaderboard', update_frequency = 'weekly', api_available = 1, license_type = 'open'     WHERE name = 'HuggingFace Open LLM Leaderboard';
UPDATE data_sources SET category = 'community',   update_frequency = 'monthly', api_available = 0, license_type = 'unknown' WHERE name = 'Internal Demo';

-- 2. benchmark_results：demo 数据诚实标注 Internal Demo（Experimental）
-- ---------------------------------------------------------------------------
UPDATE benchmark_results
SET source_id = (SELECT id FROM data_sources WHERE name = 'Internal Demo'),
    confidence = 40,
    verification_status = 'unverified'
WHERE source_id IS NULL AND (dataset = 'internal-demo' OR source = 'manual');

-- 3. pricing_history：按厂商映射到官方定价源（数据来源为官方定价文档）
-- ---------------------------------------------------------------------------
UPDATE pricing_history SET source_id = (SELECT id FROM data_sources WHERE name = 'OpenAI Pricing'), confidence = 95
WHERE source_id IS NULL AND model_id IN (SELECT m.id FROM models m JOIN providers p ON m.provider = p.id WHERE p.name = 'OpenAI');
UPDATE pricing_history SET source_id = (SELECT id FROM data_sources WHERE name = 'Anthropic Pricing'), confidence = 95
WHERE source_id IS NULL AND model_id IN (SELECT m.id FROM models m JOIN providers p ON m.provider = p.id WHERE p.name = 'Anthropic');
UPDATE pricing_history SET source_id = (SELECT id FROM data_sources WHERE name = 'Google Gemini Pricing'), confidence = 95
WHERE source_id IS NULL AND model_id IN (SELECT m.id FROM models m JOIN providers p ON m.provider = p.id WHERE p.name = 'Google');
-- 其他厂商（demo）：保留官方映射不可得时标注 Internal Demo
UPDATE pricing_history SET source_id = (SELECT id FROM data_sources WHERE name = 'Internal Demo'), confidence = 40
WHERE source_id IS NULL AND source = 'manual';

-- 4. models：官方文档核验状态（来源=官方模型文档；demo 其余厂商置信度保守）
-- ---------------------------------------------------------------------------
UPDATE models SET verified_status = 'verified', confidence_score = 95
WHERE provider IN (SELECT id FROM providers WHERE name IN ('OpenAI', 'Anthropic', 'Google', 'Meta'));
UPDATE models SET verified_status = 'unverified', confidence_score = 50
WHERE verified_status = 'unverified' AND provider NOT IN (SELECT id FROM providers WHERE name IN ('OpenAI', 'Anthropic', 'Google', 'Meta'));

-- 5. model_capabilities：按厂商映射官方文档来源 + 置信度
-- ---------------------------------------------------------------------------
UPDATE model_capabilities SET source_id = (SELECT id FROM data_sources WHERE name = 'OpenAI Model Docs'), confidence = 95
WHERE source_id IS NULL AND model_id IN (SELECT m.id FROM models m JOIN providers p ON m.provider = p.id WHERE p.name = 'OpenAI');
UPDATE model_capabilities SET source_id = (SELECT id FROM data_sources WHERE name = 'Anthropic Model Docs'), confidence = 95
WHERE source_id IS NULL AND model_id IN (SELECT m.id FROM models m JOIN providers p ON m.provider = p.id WHERE p.name = 'Anthropic');
UPDATE model_capabilities SET source_id = (SELECT id FROM data_sources WHERE name = 'Google Gemini Docs'), confidence = 95
WHERE source_id IS NULL AND model_id IN (SELECT m.id FROM models m JOIN providers p ON m.provider = p.id WHERE p.name = 'Google');
UPDATE model_capabilities SET source_id = (SELECT id FROM data_sources WHERE name = 'Meta Llama Docs'), confidence = 90
WHERE source_id IS NULL AND model_id IN (SELECT m.id FROM models m JOIN providers p ON m.provider = p.id WHERE p.name = 'Meta');
UPDATE model_capabilities SET source_id = (SELECT id FROM data_sources WHERE name = 'Internal Demo'), confidence = 40
WHERE source_id IS NULL;
