/**
 * 比较页 URL 编码工具（isomorphic：服务端 getStaticPaths / 客户端选择跳转共用）。
 *
 * URL 规范：/{lang}/compare/{a}-vs-{b}/
 * 模型 slug 含 "/"（如 openai/gpt-4o），URL 段中不能出现，故以 "_" 替换：
 *   openai/gpt-4o → openai_gpt-4o
 * 两个模型按 slug 字典序排列（a < b），保证同一对模型只有一种规范 URL（避免 SEO 重复）。
 */

/** slug → URL 段编码（/ → _） */
export function encodeModelSlug(slug: string): string {
  return slug.replaceAll('/', '_');
}

/** URL 段编码 → slug（_ → /） */
export function decodeModelSlug(encoded: string): string {
  return encoded.replaceAll('_', '/');
}

/** 比较对 → 规范 URL key（a、b 排序后拼接） */
export function comparePairKey(a: string, b: string): string {
  const [x, y] = [encodeModelSlug(a), encodeModelSlug(b)].sort();
  return `${x}-vs-${y}`;
}

/** 解析比较 URL key → 两个模型 slug；非法返回 null */
export function parseComparePair(pair: string): { a: string; b: string } | null {
  const parts = pair.split('-vs-');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  return { a: decodeModelSlug(parts[0]), b: decodeModelSlug(parts[1]) };
}

/**
 * 生成全部模型两两比较对的 URL key（C(n,2)，排序去重）。
 * 供 getStaticPaths 使用：传入模型 slug 列表。
 */
export function allComparePairs(slugs: readonly string[]): string[] {
  const pairs: string[] = [];
  for (let i = 0; i < slugs.length; i++) {
    for (let j = i + 1; j < slugs.length; j++) {
      pairs.push(comparePairKey(slugs[i], slugs[j]));
    }
  }
  return pairs;
}

// ---- 能力矩阵定义（Phase 9.3）----
// 数据能力名（model_capabilities.capability）→ 展示标签字典键
// 注意：数据库为 function_calling，展示名映射为 "Tools"。
export interface CapabilityRow {
  capability: string; // D1 能力名
  labelKey: 'vision' | 'reasoning' | 'coding' | 'audio' | 'tools' | 'longContext';
}

/** 能力矩阵行（UI 展示顺序）：vision / reasoning / coding / audio / tools(function_calling) / long_context */
export const CAPABILITY_ROWS: CapabilityRow[] = [
  { capability: 'vision', labelKey: 'vision' },
  { capability: 'reasoning', labelKey: 'reasoning' },
  { capability: 'coding', labelKey: 'coding' },
  { capability: 'audio', labelKey: 'audio' },
  { capability: 'function_calling', labelKey: 'tools' }, // function_calling → Tools
  { capability: 'long_context', labelKey: 'longContext' },
];

/** 能力支持状态：capabilities[] → Map(capability → supported) */
export function capabilityMap(caps: { capability: string; supported: boolean }[]): Map<string, boolean> {
  return new Map(caps.map((c) => [c.capability, c.supported]));
}
