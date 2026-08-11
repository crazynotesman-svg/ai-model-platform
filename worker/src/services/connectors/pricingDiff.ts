/**
 * pricingDiff.ts —— 价格变化检测（Phase 11.6）
 *
 * 旧价格 vs 新价格 → 检测 input/output price change → PRICE_CHANGED 事件数据。
 * 纯函数：不访问 DB，便于单测。
 *
 * 示例：GPT-4o old $5/M → new $2.5/M → event { type: PRICE_CHANGED, confidence: 100 }
 */

export interface PricePoint {
  inputPrice: number;
  outputPrice: number;
}

export interface PriceDiff {
  changed: boolean;
  inputChanged: boolean;
  outputChanged: boolean;
  oldInput: number | null;
  newInput: number | null;
  oldOutput: number | null;
  newOutput: number | null;
  pctInputChange: number | null; // 百分比（负=降价）
  pctOutputChange: number | null;
}

export function diffPrices(oldP: PricePoint | null, newP: PricePoint | null): PriceDiff {
  if (!newP) {
    return { changed: false, inputChanged: false, outputChanged: false, oldInput: null, newInput: null, oldOutput: null, newOutput: null, pctInputChange: null, pctOutputChange: null };
  }
  const inputChanged = oldP != null && oldP.inputPrice !== newP.inputPrice;
  const outputChanged = oldP != null && oldP.outputPrice !== newP.outputPrice;
  const pct = (o: number | null, n: number): number | null => (o != null && o !== 0 ? Math.round(((n - o) / o) * 1000) / 10 : null);
  return {
    changed: oldP != null && (inputChanged || outputChanged),
    inputChanged,
    outputChanged,
    oldInput: oldP?.inputPrice ?? null,
    newInput: newP.inputPrice,
    oldOutput: oldP?.outputPrice ?? null,
    newOutput: newP.outputPrice,
    pctInputChange: pct(oldP?.inputPrice ?? null, newP.inputPrice),
    pctOutputChange: pct(oldP?.outputPrice ?? null, newP.outputPrice),
  };
}

/** 官方来源价格变化 → confidence 100（来源可信，见 data-trust-design Tier A） */
export function priceChangeConfidence(sourceTrustLevel: number): number {
  return sourceTrustLevel >= 90 ? 100 : Math.min(100, sourceTrustLevel + 10);
}
