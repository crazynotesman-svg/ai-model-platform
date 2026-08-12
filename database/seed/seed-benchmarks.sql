-- ============================================================================
-- Seed：官方公开基准（Phase 11.9/12.1 补充——Benchmark Trust v4 数据源）
--
-- 来源：厂商官方技术报告 / 权威论文（公开真实分数，非编造）：
--   HumanEval（OpenAI 论文 arXiv:2108.01290）、MMLU（arXiv:2009.03300）、
--   GPQA（arXiv:2311.12022）、AIME、MMMU（mmmu-benchmark.github.io）
-- 每行：dataset（真实基准名）+ version + tested_at + source_id（data_sources 映射）
--       + verification_status='verified' + confidence=90 + paper_url + trust_score
-- 幂等：先清理该模型的 internal-demo 占位行，再 INSERT（无 UNIQUE 约束）。
-- 原则：只填官方/论文公开的高置信值；新版本（2026）无公开数据则不填（诚实）。
-- ============================================================================

-- 0a. benchmark_categories 注册（生产 seed 不含 demo categories；幂等）
INSERT OR IGNORE INTO benchmark_categories (slug, name, description) VALUES
  ('coding', 'Coding', 'Code generation and programming tasks'),
  ('reasoning', 'Reasoning', 'Logical and multi-step reasoning tasks'),
  ('math', 'Math', 'Mathematical problem solving'),
  ('vision', 'Vision', 'Multimodal image understanding tasks');

-- 0. 清理 demo 占位（被真实数据替代）
DELETE FROM benchmark_results
WHERE dataset = 'internal-demo'
  AND model_id IN (
    SELECT id FROM models WHERE slug IN (
      'openai/gpt-4o','openai/gpt-4o-mini','anthropic/claude-3.5-sonnet','anthropic/claude-3-opus',
      'anthropic/claude-3-haiku','google/gemini-1.5-pro','google/gemini-1.5-flash','meta/llama-3.1-405b',
      'meta/llama-3.3-70b','deepseek/deepseek-v3','deepseek/deepseek-r1','alibaba/qwen2.5-72b',
      'mistral/mistral-large-2','zhipu/glm-4'
    )
  );

-- 1. 官方公开基准（逐条 INSERT，SELECT-INSERT 模板避免硬编码 id）
-- ---------------------------------------------------------------------------

-- OpenAI GPT-4o（OpenAI 技术报告 2024-05：HumanEval 90.2 / GPQA 53.6 / MMLU 88.7 / MMMU 69.1）
INSERT OR IGNORE INTO benchmark_results (model_id, category_id, score, rank, dataset, version, source, tested_at, source_id, verification_status, confidence, paper_url, source_url, dataset_version, evaluation_method, trust_score)
SELECT m.id, c.id, 90.2, NULL, 'humaneval', 'official-2024', 'official', '2024-05-13',
  (SELECT id FROM data_sources WHERE name = 'HumanEval'), 'verified', 90, 'https://doi.org/10.48550/arXiv.2108.01290', 'https://openai.com/research/', 'v1', 'pass@1', 90
FROM models m JOIN benchmark_categories c ON c.slug = 'coding' WHERE m.slug = 'openai/gpt-4o';
INSERT OR IGNORE INTO benchmark_results (model_id, category_id, score, rank, dataset, version, source, tested_at, source_id, verification_status, confidence, paper_url, source_url, dataset_version, evaluation_method, trust_score)
SELECT m.id, c.id, 53.6, NULL, 'gpqa', 'official-2024', 'official', '2024-05-13',
  (SELECT id FROM data_sources WHERE name = 'GPQA'), 'verified', 90, 'https://doi.org/10.48550/arXiv.2311.12022', 'https://openai.com/research/', 'main', 'accuracy', 90
FROM models m JOIN benchmark_categories c ON c.slug = 'reasoning' WHERE m.slug = 'openai/gpt-4o';
INSERT OR IGNORE INTO benchmark_results (model_id, category_id, score, rank, dataset, version, source, tested_at, source_id, verification_status, confidence, paper_url, source_url, dataset_version, evaluation_method, trust_score)
SELECT m.id, c.id, 88.7, NULL, 'mmlu', 'official-2024', 'official', '2024-05-13',
  (SELECT id FROM data_sources WHERE name = 'MMLU'), 'verified', 90, 'https://doi.org/10.48550/arXiv.2009.03300', 'https://openai.com/research/', 'v1', '5-shot', 90
FROM models m JOIN benchmark_categories c ON c.slug = 'math' WHERE m.slug = 'openai/gpt-4o';
INSERT OR IGNORE INTO benchmark_results (model_id, category_id, score, rank, dataset, version, source, tested_at, source_id, verification_status, confidence, paper_url, source_url, dataset_version, evaluation_method, trust_score)
SELECT m.id, c.id, 69.1, NULL, 'mmmu', 'official-2024', 'official', '2024-05-13',
  (SELECT id FROM data_sources WHERE name = 'MMMU'), 'verified', 90, 'https://mmmu-benchmark.github.io/', 'https://openai.com/research/', 'v1', '0-shot', 90
FROM models m JOIN benchmark_categories c ON c.slug = 'vision' WHERE m.slug = 'openai/gpt-4o';

-- OpenAI GPT-4o-mini（官方：HumanEval 87.0 / GPQA 40.2 / MMLU 82.0）
INSERT OR IGNORE INTO benchmark_results (model_id, category_id, score, rank, dataset, version, source, tested_at, source_id, verification_status, confidence, paper_url, source_url, dataset_version, evaluation_method, trust_score)
SELECT m.id, c.id, 87.0, NULL, 'humaneval', 'official-2024', 'official', '2024-07-18',
  (SELECT id FROM data_sources WHERE name = 'HumanEval'), 'verified', 90, 'https://doi.org/10.48550/arXiv.2108.01290', 'https://openai.com/research/', 'v1', 'pass@1', 90
FROM models m JOIN benchmark_categories c ON c.slug = 'coding' WHERE m.slug = 'openai/gpt-4o-mini';
INSERT OR IGNORE INTO benchmark_results (model_id, category_id, score, rank, dataset, version, source, tested_at, source_id, verification_status, confidence, paper_url, source_url, dataset_version, evaluation_method, trust_score)
SELECT m.id, c.id, 40.2, NULL, 'gpqa', 'official-2024', 'official', '2024-07-18',
  (SELECT id FROM data_sources WHERE name = 'GPQA'), 'verified', 90, 'https://doi.org/10.48550/arXiv.2311.12022', 'https://openai.com/research/', 'main', 'accuracy', 90
FROM models m JOIN benchmark_categories c ON c.slug = 'reasoning' WHERE m.slug = 'openai/gpt-4o-mini';
INSERT OR IGNORE INTO benchmark_results (model_id, category_id, score, rank, dataset, version, source, tested_at, source_id, verification_status, confidence, paper_url, source_url, dataset_version, evaluation_method, trust_score)
SELECT m.id, c.id, 82.0, NULL, 'mmlu', 'official-2024', 'official', '2024-07-18',
  (SELECT id FROM data_sources WHERE name = 'MMLU'), 'verified', 90, 'https://doi.org/10.48550/arXiv.2009.03300', 'https://openai.com/research/', 'v1', '5-shot', 90
FROM models m JOIN benchmark_categories c ON c.slug = 'math' WHERE m.slug = 'openai/gpt-4o-mini';

-- Anthropic Claude 3.5 Sonnet（官方 2024-06：HumanEval 92.0 / GPQA 59.4 / MMLU 88.7）
INSERT OR IGNORE INTO benchmark_results (model_id, category_id, score, rank, dataset, version, source, tested_at, source_id, verification_status, confidence, paper_url, source_url, dataset_version, evaluation_method, trust_score)
SELECT m.id, c.id, 92.0, NULL, 'humaneval', 'official-2024', 'official', '2024-06-20',
  (SELECT id FROM data_sources WHERE name = 'HumanEval'), 'verified', 90, 'https://doi.org/10.48550/arXiv.2108.01290', 'https://www.anthropic.com/research', 'v1', 'pass@1', 90
FROM models m JOIN benchmark_categories c ON c.slug = 'coding' WHERE m.slug = 'anthropic/claude-3.5-sonnet';
INSERT OR IGNORE INTO benchmark_results (model_id, category_id, score, rank, dataset, version, source, tested_at, source_id, verification_status, confidence, paper_url, source_url, dataset_version, evaluation_method, trust_score)
SELECT m.id, c.id, 59.4, NULL, 'gpqa', 'official-2024', 'official', '2024-06-20',
  (SELECT id FROM data_sources WHERE name = 'GPQA'), 'verified', 90, 'https://doi.org/10.48550/arXiv.2311.12022', 'https://www.anthropic.com/research', 'main', 'accuracy', 90
FROM models m JOIN benchmark_categories c ON c.slug = 'reasoning' WHERE m.slug = 'anthropic/claude-3.5-sonnet';
INSERT OR IGNORE INTO benchmark_results (model_id, category_id, score, rank, dataset, version, source, tested_at, source_id, verification_status, confidence, paper_url, source_url, dataset_version, evaluation_method, trust_score)
SELECT m.id, c.id, 88.7, NULL, 'mmlu', 'official-2024', 'official', '2024-06-20',
  (SELECT id FROM data_sources WHERE name = 'MMLU'), 'verified', 90, 'https://doi.org/10.48550/arXiv.2009.03300', 'https://www.anthropic.com/research', 'v1', '5-shot', 90
FROM models m JOIN benchmark_categories c ON c.slug = 'math' WHERE m.slug = 'anthropic/claude-3.5-sonnet';

-- Anthropic Claude 3 Opus（官方 2024-03：HumanEval 84.9 / GPQA 50.4 / MMLU 86.8）
INSERT OR IGNORE INTO benchmark_results (model_id, category_id, score, rank, dataset, version, source, tested_at, source_id, verification_status, confidence, paper_url, source_url, dataset_version, evaluation_method, trust_score)
SELECT m.id, c.id, 84.9, NULL, 'humaneval', 'official-2024', 'official', '2024-03-04',
  (SELECT id FROM data_sources WHERE name = 'HumanEval'), 'verified', 90, 'https://doi.org/10.48550/arXiv.2108.01290', 'https://www.anthropic.com/research', 'v1', 'pass@1', 90
FROM models m JOIN benchmark_categories c ON c.slug = 'coding' WHERE m.slug = 'anthropic/claude-3-opus';
INSERT OR IGNORE INTO benchmark_results (model_id, category_id, score, rank, dataset, version, source, tested_at, source_id, verification_status, confidence, paper_url, source_url, dataset_version, evaluation_method, trust_score)
SELECT m.id, c.id, 50.4, NULL, 'gpqa', 'official-2024', 'official', '2024-03-04',
  (SELECT id FROM data_sources WHERE name = 'GPQA'), 'verified', 90, 'https://doi.org/10.48550/arXiv.2311.12022', 'https://www.anthropic.com/research', 'main', 'accuracy', 90
FROM models m JOIN benchmark_categories c ON c.slug = 'reasoning' WHERE m.slug = 'anthropic/claude-3-opus';
INSERT OR IGNORE INTO benchmark_results (model_id, category_id, score, rank, dataset, version, source, tested_at, source_id, verification_status, confidence, paper_url, source_url, dataset_version, evaluation_method, trust_score)
SELECT m.id, c.id, 86.8, NULL, 'mmlu', 'official-2024', 'official', '2024-03-04',
  (SELECT id FROM data_sources WHERE name = 'MMLU'), 'verified', 90, 'https://doi.org/10.48550/arXiv.2009.03300', 'https://www.anthropic.com/research', 'v1', '5-shot', 90
FROM models m JOIN benchmark_categories c ON c.slug = 'math' WHERE m.slug = 'anthropic/claude-3-opus';

-- Anthropic Claude 3 Haiku（官方 2024-03：HumanEval 75.9 / GPQA 33.3 / MMLU 75.1）
INSERT OR IGNORE INTO benchmark_results (model_id, category_id, score, rank, dataset, version, source, tested_at, source_id, verification_status, confidence, paper_url, source_url, dataset_version, evaluation_method, trust_score)
SELECT m.id, c.id, 75.9, NULL, 'humaneval', 'official-2024', 'official', '2024-03-04',
  (SELECT id FROM data_sources WHERE name = 'HumanEval'), 'verified', 90, 'https://doi.org/10.48550/arXiv.2108.01290', 'https://www.anthropic.com/research', 'v1', 'pass@1', 90
FROM models m JOIN benchmark_categories c ON c.slug = 'coding' WHERE m.slug = 'anthropic/claude-3-haiku';
INSERT OR IGNORE INTO benchmark_results (model_id, category_id, score, rank, dataset, version, source, tested_at, source_id, verification_status, confidence, paper_url, source_url, dataset_version, evaluation_method, trust_score)
SELECT m.id, c.id, 33.3, NULL, 'gpqa', 'official-2024', 'official', '2024-03-04',
  (SELECT id FROM data_sources WHERE name = 'GPQA'), 'verified', 90, 'https://doi.org/10.48550/arXiv.2311.12022', 'https://www.anthropic.com/research', 'main', 'accuracy', 90
FROM models m JOIN benchmark_categories c ON c.slug = 'reasoning' WHERE m.slug = 'anthropic/claude-3-haiku';
INSERT OR IGNORE INTO benchmark_results (model_id, category_id, score, rank, dataset, version, source, tested_at, source_id, verification_status, confidence, paper_url, source_url, dataset_version, evaluation_method, trust_score)
SELECT m.id, c.id, 75.1, NULL, 'mmlu', 'official-2024', 'official', '2024-03-04',
  (SELECT id FROM data_sources WHERE name = 'MMLU'), 'verified', 90, 'https://doi.org/10.48550/arXiv.2009.03300', 'https://www.anthropic.com/research', 'v1', '5-shot', 90
FROM models m JOIN benchmark_categories c ON c.slug = 'math' WHERE m.slug = 'anthropic/claude-3-haiku';

-- Google Gemini 1.5 Pro（技术报告 2024-05：HumanEval 84.1 / GPQA 46.5 / MMLU 81.9）
INSERT OR IGNORE INTO benchmark_results (model_id, category_id, score, rank, dataset, version, source, tested_at, source_id, verification_status, confidence, paper_url, source_url, dataset_version, evaluation_method, trust_score)
SELECT m.id, c.id, 84.1, NULL, 'humaneval', 'techreport-2024', 'official', '2024-05-14',
  (SELECT id FROM data_sources WHERE name = 'HumanEval'), 'verified', 90, 'https://doi.org/10.48550/arXiv.2403.05530', 'https://ai.google.dev/research', 'v1', 'pass@1', 90
FROM models m JOIN benchmark_categories c ON c.slug = 'coding' WHERE m.slug = 'google/gemini-1.5-pro';
INSERT OR IGNORE INTO benchmark_results (model_id, category_id, score, rank, dataset, version, source, tested_at, source_id, verification_status, confidence, paper_url, source_url, dataset_version, evaluation_method, trust_score)
SELECT m.id, c.id, 46.5, NULL, 'gpqa', 'techreport-2024', 'official', '2024-05-14',
  (SELECT id FROM data_sources WHERE name = 'GPQA'), 'verified', 90, 'https://doi.org/10.48550/arXiv.2311.12022', 'https://ai.google.dev/research', 'main', 'accuracy', 90
FROM models m JOIN benchmark_categories c ON c.slug = 'reasoning' WHERE m.slug = 'google/gemini-1.5-pro';
INSERT OR IGNORE INTO benchmark_results (model_id, category_id, score, rank, dataset, version, source, tested_at, source_id, verification_status, confidence, paper_url, source_url, dataset_version, evaluation_method, trust_score)
SELECT m.id, c.id, 81.9, NULL, 'mmlu', 'techreport-2024', 'official', '2024-05-14',
  (SELECT id FROM data_sources WHERE name = 'MMLU'), 'verified', 90, 'https://doi.org/10.48550/arXiv.2009.03300', 'https://ai.google.dev/research', 'v1', '5-shot', 90
FROM models m JOIN benchmark_categories c ON c.slug = 'math' WHERE m.slug = 'google/gemini-1.5-pro';

-- Google Gemini 1.5 Flash（技术报告：MMLU 78.9 / HumanEval 71.7）
INSERT OR IGNORE INTO benchmark_results (model_id, category_id, score, rank, dataset, version, source, tested_at, source_id, verification_status, confidence, paper_url, source_url, dataset_version, evaluation_method, trust_score)
SELECT m.id, c.id, 71.7, NULL, 'humaneval', 'techreport-2024', 'official', '2024-05-14',
  (SELECT id FROM data_sources WHERE name = 'HumanEval'), 'verified', 90, 'https://doi.org/10.48550/arXiv.2403.05530', 'https://ai.google.dev/research', 'v1', 'pass@1', 90
FROM models m JOIN benchmark_categories c ON c.slug = 'coding' WHERE m.slug = 'google/gemini-1.5-flash';
INSERT OR IGNORE INTO benchmark_results (model_id, category_id, score, rank, dataset, version, source, tested_at, source_id, verification_status, confidence, paper_url, source_url, dataset_version, evaluation_method, trust_score)
SELECT m.id, c.id, 78.9, NULL, 'mmlu', 'techreport-2024', 'official', '2024-05-14',
  (SELECT id FROM data_sources WHERE name = 'MMLU'), 'verified', 90, 'https://doi.org/10.48550/arXiv.2009.03300', 'https://ai.google.dev/research', 'v1', '5-shot', 90
FROM models m JOIN benchmark_categories c ON c.slug = 'math' WHERE m.slug = 'google/gemini-1.5-flash';

-- Meta Llama 3.1 405B（官方 2024-07：HumanEval 89.0 / GPQA 51.1 / MMLU 88.6）
INSERT OR IGNORE INTO benchmark_results (model_id, category_id, score, rank, dataset, version, source, tested_at, source_id, verification_status, confidence, paper_url, source_url, dataset_version, evaluation_method, trust_score)
SELECT m.id, c.id, 89.0, NULL, 'humaneval', 'official-2024', 'official', '2024-07-23',
  (SELECT id FROM data_sources WHERE name = 'HumanEval'), 'verified', 90, 'https://doi.org/10.48550/arXiv.2108.01290', 'https://www.llama.com/docs/models-overview/', 'v1', 'pass@1', 90
FROM models m JOIN benchmark_categories c ON c.slug = 'coding' WHERE m.slug = 'meta/llama-3.1-405b';
INSERT OR IGNORE INTO benchmark_results (model_id, category_id, score, rank, dataset, version, source, tested_at, source_id, verification_status, confidence, paper_url, source_url, dataset_version, evaluation_method, trust_score)
SELECT m.id, c.id, 51.1, NULL, 'gpqa', 'official-2024', 'official', '2024-07-23',
  (SELECT id FROM data_sources WHERE name = 'GPQA'), 'verified', 90, 'https://doi.org/10.48550/arXiv.2311.12022', 'https://www.llama.com/docs/models-overview/', 'main', 'accuracy', 90
FROM models m JOIN benchmark_categories c ON c.slug = 'reasoning' WHERE m.slug = 'meta/llama-3.1-405b';
INSERT OR IGNORE INTO benchmark_results (model_id, category_id, score, rank, dataset, version, source, tested_at, source_id, verification_status, confidence, paper_url, source_url, dataset_version, evaluation_method, trust_score)
SELECT m.id, c.id, 88.6, NULL, 'mmlu', 'official-2024', 'official', '2024-07-23',
  (SELECT id FROM data_sources WHERE name = 'MMLU'), 'verified', 90, 'https://doi.org/10.48550/arXiv.2009.03300', 'https://www.llama.com/docs/models-overview/', 'v1', '5-shot', 90
FROM models m JOIN benchmark_categories c ON c.slug = 'math' WHERE m.slug = 'meta/llama-3.1-405b';

-- Meta Llama 3.3 70B（官方 2024-12：HumanEval 88.4 / MMLU 86.0）
INSERT OR IGNORE INTO benchmark_results (model_id, category_id, score, rank, dataset, version, source, tested_at, source_id, verification_status, confidence, paper_url, source_url, dataset_version, evaluation_method, trust_score)
SELECT m.id, c.id, 88.4, NULL, 'humaneval', 'official-2024', 'official', '2024-12-06',
  (SELECT id FROM data_sources WHERE name = 'HumanEval'), 'verified', 90, 'https://doi.org/10.48550/arXiv.2108.01290', 'https://www.llama.com/docs/models-overview/', 'v1', 'pass@1', 90
FROM models m JOIN benchmark_categories c ON c.slug = 'coding' WHERE m.slug = 'meta/llama-3.3-70b';
INSERT OR IGNORE INTO benchmark_results (model_id, category_id, score, rank, dataset, version, source, tested_at, source_id, verification_status, confidence, paper_url, source_url, dataset_version, evaluation_method, trust_score)
SELECT m.id, c.id, 86.0, NULL, 'mmlu', 'official-2024', 'official', '2024-12-06',
  (SELECT id FROM data_sources WHERE name = 'MMLU'), 'verified', 90, 'https://doi.org/10.48550/arXiv.2009.03300', 'https://www.llama.com/docs/models-overview/', 'v1', '5-shot', 90
FROM models m JOIN benchmark_categories c ON c.slug = 'math' WHERE m.slug = 'meta/llama-3.3-70b';

-- DeepSeek V3（论文 2024-12：HumanEval 82.6 / MMLU 88.5）
INSERT OR IGNORE INTO benchmark_results (model_id, category_id, score, rank, dataset, version, source, tested_at, source_id, verification_status, confidence, paper_url, source_url, dataset_version, evaluation_method, trust_score)
SELECT m.id, c.id, 82.6, NULL, 'humaneval', 'paper-2024', 'official', '2024-12-26',
  (SELECT id FROM data_sources WHERE name = 'HumanEval'), 'verified', 90, 'https://doi.org/10.48550/arXiv.2108.01290', 'https://arxiv.org/abs/2412.19437', 'v1', 'pass@1', 90
FROM models m JOIN benchmark_categories c ON c.slug = 'coding' WHERE m.slug = 'deepseek/deepseek-v3';
INSERT OR IGNORE INTO benchmark_results (model_id, category_id, score, rank, dataset, version, source, tested_at, source_id, verification_status, confidence, paper_url, source_url, dataset_version, evaluation_method, trust_score)
SELECT m.id, c.id, 88.5, NULL, 'mmlu', 'paper-2024', 'official', '2024-12-26',
  (SELECT id FROM data_sources WHERE name = 'MMLU'), 'verified', 90, 'https://doi.org/10.48550/arXiv.2009.03300', 'https://arxiv.org/abs/2412.19437', 'v1', '5-shot', 90
FROM models m JOIN benchmark_categories c ON c.slug = 'math' WHERE m.slug = 'deepseek/deepseek-v3';

-- DeepSeek R1（论文 2025-01：AIME 79.8 / GPQA 71.5）
INSERT OR IGNORE INTO benchmark_results (model_id, category_id, score, rank, dataset, version, source, tested_at, source_id, verification_status, confidence, paper_url, source_url, dataset_version, evaluation_method, trust_score)
SELECT m.id, c.id, 79.8, NULL, 'aime', 'paper-2025', 'official', '2025-01-20',
  (SELECT id FROM data_sources WHERE name = 'AIME'), 'verified', 90, 'https://artofproblemsolving.com/community/c13_contests', 'https://arxiv.org/abs/2501.12948', '2024', 'accuracy', 90
FROM models m JOIN benchmark_categories c ON c.slug = 'math' WHERE m.slug = 'deepseek/deepseek-r1';
INSERT OR IGNORE INTO benchmark_results (model_id, category_id, score, rank, dataset, version, source, tested_at, source_id, verification_status, confidence, paper_url, source_url, dataset_version, evaluation_method, trust_score)
SELECT m.id, c.id, 71.5, NULL, 'gpqa', 'paper-2025', 'official', '2025-01-20',
  (SELECT id FROM data_sources WHERE name = 'GPQA'), 'verified', 90, 'https://doi.org/10.48550/arXiv.2311.12022', 'https://arxiv.org/abs/2501.12948', 'main', 'accuracy', 90
FROM models m JOIN benchmark_categories c ON c.slug = 'reasoning' WHERE m.slug = 'deepseek/deepseek-r1';

-- Alibaba Qwen2.5 72B（官方 2024-09：HumanEval 85.9 / MMLU 86.1）
INSERT OR IGNORE INTO benchmark_results (model_id, category_id, score, rank, dataset, version, source, tested_at, source_id, verification_status, confidence, paper_url, source_url, dataset_version, evaluation_method, trust_score)
SELECT m.id, c.id, 85.9, NULL, 'humaneval', 'official-2024', 'official', '2024-09-19',
  (SELECT id FROM data_sources WHERE name = 'HumanEval'), 'verified', 90, 'https://doi.org/10.48550/arXiv.2108.01290', 'https://qwenlm.github.io/blog/qwen2.5/', 'v1', 'pass@1', 90
FROM models m JOIN benchmark_categories c ON c.slug = 'coding' WHERE m.slug = 'alibaba/qwen2.5-72b';
INSERT OR IGNORE INTO benchmark_results (model_id, category_id, score, rank, dataset, version, source, tested_at, source_id, verification_status, confidence, paper_url, source_url, dataset_version, evaluation_method, trust_score)
SELECT m.id, c.id, 86.1, NULL, 'mmlu', 'official-2024', 'official', '2024-09-19',
  (SELECT id FROM data_sources WHERE name = 'MMLU'), 'verified', 90, 'https://doi.org/10.48550/arXiv.2009.03300', 'https://qwenlm.github.io/blog/qwen2.5/', 'v1', '5-shot', 90
FROM models m JOIN benchmark_categories c ON c.slug = 'math' WHERE m.slug = 'alibaba/qwen2.5-72b';

-- Mistral Large 2（官方 2024-07：HumanEval 92.0 / MMLU 84.0）
INSERT OR IGNORE INTO benchmark_results (model_id, category_id, score, rank, dataset, version, source, tested_at, source_id, verification_status, confidence, paper_url, source_url, dataset_version, evaluation_method, trust_score)
SELECT m.id, c.id, 92.0, NULL, 'humaneval', 'official-2024', 'official', '2024-07-24',
  (SELECT id FROM data_sources WHERE name = 'HumanEval'), 'verified', 90, 'https://doi.org/10.48550/arXiv.2108.01290', 'https://mistral.ai/news/mistral-large-2407/', 'v1', 'pass@1', 90
FROM models m JOIN benchmark_categories c ON c.slug = 'coding' WHERE m.slug = 'mistral/mistral-large-2';
INSERT OR IGNORE INTO benchmark_results (model_id, category_id, score, rank, dataset, version, source, tested_at, source_id, verification_status, confidence, paper_url, source_url, dataset_version, evaluation_method, trust_score)
SELECT m.id, c.id, 84.0, NULL, 'mmlu', 'official-2024', 'official', '2024-07-24',
  (SELECT id FROM data_sources WHERE name = 'MMLU'), 'verified', 90, 'https://doi.org/10.48550/arXiv.2009.03300', 'https://mistral.ai/news/mistral-large-2407/', 'v1', '5-shot', 90
FROM models m JOIN benchmark_categories c ON c.slug = 'math' WHERE m.slug = 'mistral/mistral-large-2';

-- Zhipu GLM-4（智谱官方 2024-01：HumanEval 80.1 / MMLU 81.5）
INSERT OR IGNORE INTO benchmark_results (model_id, category_id, score, rank, dataset, version, source, tested_at, source_id, verification_status, confidence, paper_url, source_url, dataset_version, evaluation_method, trust_score)
SELECT m.id, c.id, 80.1, NULL, 'humaneval', 'official-2024', 'official', '2024-01-16',
  (SELECT id FROM data_sources WHERE name = 'HumanEval'), 'verified', 90, 'https://doi.org/10.48550/arXiv.2108.01290', 'https://docs.bigmodel.cn/cn/guide/models', 'v1', 'pass@1', 90
FROM models m JOIN benchmark_categories c ON c.slug = 'coding' WHERE m.slug = 'zhipu/glm-4';
INSERT OR IGNORE INTO benchmark_results (model_id, category_id, score, rank, dataset, version, source, tested_at, source_id, verification_status, confidence, paper_url, source_url, dataset_version, evaluation_method, trust_score)
SELECT m.id, c.id, 81.5, NULL, 'mmlu', 'official-2024', 'official', '2024-01-16',
  (SELECT id FROM data_sources WHERE name = 'MMLU'), 'verified', 90, 'https://doi.org/10.48550/arXiv.2009.03300', 'https://docs.bigmodel.cn/cn/guide/models', 'v1', '5-shot', 90
FROM models m JOIN benchmark_categories c ON c.slug = 'math' WHERE m.slug = 'zhipu/glm-4';
