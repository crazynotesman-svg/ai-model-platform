/**
 * connectors/benchmarkConnector.ts —— Benchmark Data Connector v2（Phase 11.7）
 *
 * Tier A 权威基准：LMSYS Arena / SWE-bench / MMLU / MMLU-Pro / GPQA / AIME / HumanEval / MMMU。
 * 每条结果必须包含：benchmark / dataset / version / score / model_version / source / date / confidence。
 * 缺少 dataset/version/source 的数据禁止进入生产（validate 丢弃）。
 * 本阶段：结构校验 + adapter；实际数据解析（Elo 榜单/论文表）待人工核验映射。
 */
import type { DataConnector, DataEventInput } from './types';

export const TIER_A_BENCHMARKS = [
  'LMSYS Chatbot Arena',
  'SWE-bench',
  'MMLU',
  'MMLU-Pro',
  'GPQA',
  'AIME',
  'HumanEval',
  'MMMU',
] as const;

export interface BenchmarkRow {
  modelKey: string;       // 模型别名（走 model_aliases 解析）
  benchmark: string;      // Tier A 名称
  dataset: string;        // 数据集名（如 humaneval）
  version: string;        // 版本（如 v1.0）
  score: number;          // 0-100（或 Elo，记录口径）
  modelVersion: string;   // 模型版本（如 gpt-4o-2024-05-13）
  source: string;         // 数据源名（data_sources.name）
  date: string;           // 测试日期 YYYY-MM-DD
  confidence: number;     // 0-100
}

const NAME = 'Benchmark Data';

async function fetchBenchmarks(): Promise<unknown> {
  return {}; // 数据解析接入点（LMSYS/HF/SWE-bench 榜单；待人工核验映射）
}

/** 强制字段校验：缺 benchmark/dataset/version/source 的数据禁止进入生产 */
function validateRow(r: BenchmarkRow): string | null {
  if (!r.benchmark || !r.dataset || !r.version || !r.source) return 'missing benchmark/dataset/version/source';
  if (typeof r.score !== 'number' || r.score < 0) return 'invalid score';
  if (!r.date) return 'missing date';
  if (!r.modelVersion) return 'missing model_version';
  if (r.confidence < 0 || r.confidence > 100) return 'confidence out of range';
  if (!(TIER_A_BENCHMARKS as readonly string[]).includes(r.benchmark)) return `unsupported benchmark: ${r.benchmark}`;
  return null;
}

async function normalize(raw: unknown): Promise<DataEventInput[]> {
  return []; // 榜单解析待人工核验后启用
}

function validate(events: DataEventInput[]): DataEventInput[] {
  return events.filter((e) => {
    const p = e.payload as Record<string, unknown>;
    return Boolean(p.benchmark && p.dataset && p.version && p.source);
  });
}

export const benchmarkConnector: DataConnector = {
  name: NAME,
  fetch: fetchBenchmarks,
  normalize,
  validate,
};

/** 供解析层调用的行校验（导出供单测） */
export function validateBenchmarkRow(r: BenchmarkRow): string | null {
  return validateRow(r);
}
