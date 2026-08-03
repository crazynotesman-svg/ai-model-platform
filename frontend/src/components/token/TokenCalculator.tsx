/**
 * TokenCalculator：容器组件 —— 状态管理 + 计算编排。
 *
 * 数据流：
 *   文本（防抖 300ms）→ 并行计算 4 个模型系列的 token 数
 *     （GPT=tiktoken 精确，Claude/Gemini/DeepSeek=estimate 估算）
 *   价格：从 Worker /api/models（D1）加载，用于成本对比
 * 空文本 / 计算中 / 价格错误均有对应 UI 状态。
 */
import { useEffect, useState } from 'react';
import type { Locale } from '../../i18n/locales';
import {
  countCharacters,
  countTokens,
  estimateCost,
  FAMILY_MODEL_SLUGS,
  tokenizerKindForFamily,
  type ModelFamily,
} from '../../lib/tokenizer/registry';
import { fetchModels, type ModelRecord } from '../../lib/api';
import TokenInput, { type TokenInputUi } from './TokenInput';
import TokenResult, { type TokenResultUi } from './TokenResult';
import CostComparison, { type CostComparisonUi } from './CostComparison';

export interface TokenCalculatorUi extends TokenInputUi, TokenResultUi, CostComparisonUi {
  emptyHint: string;
}

interface Props {
  lang: Locale;
  ui: TokenCalculatorUi;
}

const FAMILIES: ModelFamily[] = ['gpt', 'claude', 'gemini', 'deepseek'];

type TokenCounts = Record<ModelFamily, { tokens: number; isExact: boolean } | null>;

const EMPTY_COUNTS: TokenCounts = { gpt: null, claude: null, gemini: null, deepseek: null };

export default function TokenCalculator({ lang, ui }: Props) {
  const [text, setText] = useState('');
  const [family, setFamily] = useState<ModelFamily>('gpt');
  const [debounced, setDebounced] = useState('');
  const [tokenCounts, setTokenCounts] = useState<TokenCounts>(EMPTY_COUNTS);
  const [busy, setBusy] = useState(false);
  const [prices, setPrices] = useState<Record<string, ModelRecord> | null>(null);
  const [priceLoading, setPriceLoading] = useState(true);
  const [priceError, setPriceError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // 输入防抖（300ms）
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(text), 300);
    return () => window.clearTimeout(timer);
  }, [text]);

  // 价格：一次性从 API 加载（数据源 D1）
  useEffect(() => {
    const controller = new AbortController();
    setPriceLoading(true);
    setPriceError(false);
    fetchModels({ lang, signal: controller.signal })
      .then((models) => {
        setPrices(Object.fromEntries(models.map((m) => [m.slug, m])));
        setPriceLoading(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setPriceError(true);
          setPriceLoading(false);
        }
      });
    return () => controller.abort();
  }, [lang, reloadKey]);

  // 并行计算 4 个系列的 token 数（tiktoken 首次动态加载较慢，之后走缓存）
  useEffect(() => {
    if (!debounced) {
      setTokenCounts(EMPTY_COUNTS);
      setBusy(false);
      return;
    }
    let cancelled = false;
    setBusy(true);
    Promise.all(
      FAMILIES.map(async (f) => {
        const kind = tokenizerKindForFamily(f);
        const tokens = await countTokens(debounced, kind);
        return { f, tokens, isExact: kind !== 'estimate' };
      }),
    )
      .then((results) => {
        if (cancelled) return;
        const next: TokenCounts = { ...EMPTY_COUNTS };
        for (const r of results) next[r.f] = { tokens: r.tokens, isExact: r.isExact };
        setTokenCounts(next);
        setBusy(false);
      })
      .catch(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  const characters = countCharacters(text);
  const current = tokenCounts[family];

  // 成本对比行（按输入成本升序）
  const rows = FAMILIES.map((f) => {
    const entry = tokenCounts[f];
    const price = prices?.[FAMILY_MODEL_SLUGS[f]];
    return {
      slug: FAMILY_MODEL_SLUGS[f],
      name: price?.name ?? FAMILY_MODEL_SLUGS[f].split('/')[1],
      tokens: entry?.tokens ?? null,
      isExact: entry?.isExact ?? false,
      inputCost: entry ? estimateCost(entry.tokens, price?.inputPrice ?? null) : null,
      outputCost: entry ? estimateCost(entry.tokens, price?.outputPrice ?? null) : null,
    };
  }).sort((a, b) => (a.inputCost ?? Number.POSITIVE_INFINITY) - (b.inputCost ?? Number.POSITIVE_INFINITY));

  return (
    <div className="space-y-6">
      <TokenInput
        ui={ui}
        value={text}
        family={family}
        onValueChange={setText}
        onFamilyChange={setFamily}
      />

      {!text ? (
        <p className="rounded-xl border border-dashed border-slate-700 bg-slate-900/60 p-5 text-center text-sm text-slate-500">
          {ui.emptyHint}
        </p>
      ) : (
        <TokenResult
          ui={ui}
          tokens={current?.tokens ?? null}
          characters={characters}
          isExact={current?.isExact ?? false}
          busy={busy}
        />
      )}

      <CostComparison
        ui={ui}
        rows={rows}
        loading={priceLoading}
        priceError={priceError}
        onRetry={() => setReloadKey((k) => k + 1)}
      />
    </div>
  );
}
