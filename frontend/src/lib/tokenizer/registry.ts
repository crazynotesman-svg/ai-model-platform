/**
 * Tokenizer 注册表（可插拔）——模型系列 → tokenizer 方案。
 *
 * 方案说明：
 * - GPT 系列（gpt-4o / gpt-4.1 / o3 等）：使用 OpenAI 官方 tokenizer
 *   （@dqbd/tiktoken，o200k_base / cl100k_base），动态导入懒加载（WASM + 数据）；
 * - Claude / Gemini / DeepSeek 系列：尚无浏览器端官方 tokenizer，
 *   使用启发式估算模块（estimateTokens），结果标注"估算"。
 *
 * 未来接入新 tokenizer 时：新增 kind 并在 countTokens 分支实现即可。
 */
import type { Tiktoken } from '@dqbd/tiktoken';

/** tokenizer 策略类型 */
export type TokenizerKind = 'tiktoken-o200k' | 'tiktoken-cl100k' | 'estimate';

/** 模型系列（用户选择器粒度） */
export type ModelFamily = 'gpt' | 'claude' | 'gemini' | 'deepseek';

/** 系列 → 代表模型 slug（成本对比与价格查询用，来自 D1 pricing） */
export const FAMILY_MODEL_SLUGS: Record<ModelFamily, string> = {
  gpt: 'openai/gpt-4o',
  claude: 'anthropic/claude-sonnet-4',
  gemini: 'google/gemini-2.5-pro',
  deepseek: 'deepseek/deepseek-chat',
};

/** 系列 → tokenizer 方案 */
export function tokenizerKindForFamily(family: ModelFamily): TokenizerKind {
  switch (family) {
    case 'gpt':
      return 'tiktoken-o200k';
    case 'claude':
    case 'gemini':
    case 'deepseek':
      return 'estimate';
  }
}

// ---- tiktoken 实例缓存（创建开销较大，只创建一次）----
let o200k: Tiktoken | null = null;
let cl100k: Tiktoken | null = null;

/** 按方案计算 token 数（tiktoken 真实 / estimate 估算） */
export async function countTokens(text: string, kind: TokenizerKind): Promise<number> {
  if (!text) return 0;
  switch (kind) {
    case 'tiktoken-o200k': {
      const mod = await import('@dqbd/tiktoken');
      o200k ??= mod.get_encoding('o200k_base');
      return o200k.encode(text).length;
    }
    case 'tiktoken-cl100k': {
      const mod = await import('@dqbd/tiktoken');
      cl100k ??= mod.get_encoding('cl100k_base');
      return cl100k.encode(text).length;
    }
    default:
      return estimateTokens(text);
  }
}

// ---- 启发式估算（无官方 tokenizer 时的合理近似）----
const CJK_RANGES: [number, number][] = [
  [0x3400, 0x4dbf], // CJK 扩展 A / 统一表意
  [0x4e00, 0x9fff], // CJK 统一表意
  [0xf900, 0xfaff], // CJK 兼容
  [0x20000, 0x2a6df], // CJK 扩展 B
  [0x3040, 0x30ff], // 日文假名
  [0xac00, 0xd7af], // 韩文音节
];

/** 是否 CJK（中日韩）字符：估算时按更低的 字符/token 密度 */
function isCjkChar(cp: number): boolean {
  return CJK_RANGES.some(([lo, hi]) => cp >= lo && cp <= hi);
}

/**
 * 估算 token 数（BPE 近似启发式）：
 * - CJK 字符：约 1.6 字符 / token（即 1 个汉字 ≈ 0.6 token）；
 * - 其他字符（英文/数字/符号）：约 4 字符 / token（含空格）。
 * 说明：这是无官方 tokenizer 场景下的合理近似，展示时标注"估算"。
 */
export function estimateTokens(text: string): number {
  let cjk = 0;
  let other = 0;
  for (const ch of text) {
    if (isCjkChar(ch.codePointAt(0) ?? 0)) cjk++;
    else other++;
  }
  if (cjk + other === 0) return 0;
  return Math.max(1, Math.ceil(cjk / 1.6 + other / 4));
}

/** 字符数（按 Unicode 码点统计，emoji 等代理对计 1） */
export function countCharacters(text: string): number {
  return [...text].length;
}

/**
 * 估算成本（USD）：tokens × 单价 / 1,000,000。
 * 价格为空（未收录）时返回 null。
 */
export function estimateCost(tokens: number, pricePerMillion: number | null): number | null {
  if (pricePerMillion == null) return null;
  return (tokens / 1_000_000) * pricePerMillion;
}
