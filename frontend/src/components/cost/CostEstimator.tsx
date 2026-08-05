/**
 * CostEstimator：独立成本估算器（/calculator/cost/）。
 * - 模型下拉（数据来自 Worker /api/models → D1 定价）
 * - 输入/输出 token 数量 → 实时估算成本（USD，按每 1M tokens 单价）
 * - 价格未收录时显示"价格待更新"；加载/错误均有 UI 状态。
 */
import { useEffect, useMemo, useState } from 'react';
import { fetchModels, type ModelRecord } from '../../lib/api';
import { estimateCost } from '../../lib/tokenizer/registry';

export interface CostEstimatorUi {
  modelLabel: string;
  inputTokensLabel: string;
  outputTokensLabel: string;
  tokensPlaceholder: string;
  resultTitle: string;
  inputCostLabel: string;
  outputCostLabel: string;
  totalCostLabel: string;
  priceUnavailable: string;
  costNote: string;
  costLoading: string;
  error: string;
  retry: string;
  emptyHint: string;
  currency: string;
  perMillion: string;
}

interface Props {
  lang: string;
  ui: CostEstimatorUi;
}

const fmtCost = (v: number | null): string => (v == null ? '—' : `$${v.toFixed(4)}`);
const fmtTokens = (n: number): string => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n.toLocaleString());

export default function CostEstimator({ ui }: Props) {
  const [models, setModels] = useState<ModelRecord[]>([]);
  const [slug, setSlug] = useState('');
  const [inputTokens, setInputTokens] = useState('1000');
  const [outputTokens, setOutputTokens] = useState('1000');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    fetchModels({ lang: 'en', signal: controller.signal })
      .then((list) => {
        setModels(list);
        if (!slug && list.length > 0) setSlug(list[0].slug);
        setLoading(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setError(true);
          setLoading(false);
        }
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  const model = useMemo(() => models.find((m) => m.slug === slug) ?? null, [models, slug]);
  const inTokens = Math.max(0, Number(inputTokens) || 0);
  const outTokens = Math.max(0, Number(outputTokens) || 0);
  const inCost = estimateCost(inTokens, model?.inputPrice ?? null);
  const outCost = estimateCost(outTokens, model?.outputPrice ?? null);

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-xl border border-red-800 bg-red-950/40 p-5 text-center">
          <p className="text-sm text-red-300">{ui.error}</p>
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className="mt-3 rounded-lg bg-red-800/60 px-4 py-1.5 text-sm text-red-100 transition-colors hover:bg-red-700/60"
          >
            {ui.retry}
          </button>
        </div>
      ) : loading ? (
        <p className="rounded-xl border border-dashed border-slate-700 bg-slate-900/60 p-5 text-center text-sm text-slate-500">
          {ui.costLoading}
        </p>
      ) : (
        <>
          {/* 模型选择 */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <label htmlFor="cost-model" className="mb-2 block text-sm font-medium text-slate-300">
              {ui.modelLabel}
            </label>
            <select
              id="cost-model"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-sky-500"
            >
              {models.map((m) => (
                <option key={m.slug} value={m.slug}>
                  {m.name} — {m.slug}
                </option>
              ))}
            </select>
            {model && (
              <p className="mt-2 text-xs text-slate-500">
                {ui.perMillion}: ${model.inputPrice ?? '—'} / ${model.outputPrice ?? '—'} ({ui.currency})
              </p>
            )}
          </div>

          {/* Token 数量输入 */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
              <label htmlFor="cost-in" className="mb-2 block text-sm font-medium text-slate-300">
                {ui.inputTokensLabel}
              </label>
              <input
                id="cost-in"
                type="number"
                min="0"
                step="100"
                value={inputTokens}
                onChange={(e) => setInputTokens(e.target.value)}
                placeholder={ui.tokensPlaceholder}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-sky-500"
              />
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
              <label htmlFor="cost-out" className="mb-2 block text-sm font-medium text-slate-300">
                {ui.outputTokensLabel}
              </label>
              <input
                id="cost-out"
                type="number"
                min="0"
                step="100"
                value={outputTokens}
                onChange={(e) => setOutputTokens(e.target.value)}
                placeholder={ui.tokensPlaceholder}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-sky-500"
              />
            </div>
          </div>

          {/* 结果 */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
              {ui.resultTitle}
            </h2>
            {model ? (
              <dl className="grid gap-3 text-sm sm:grid-cols-3">
                <div className="rounded-lg bg-slate-800/60 p-3">
                  <dt className="text-xs text-slate-500">{ui.inputCostLabel} ({fmtTokens(inTokens)})</dt>
                  <dd className="mt-1 text-lg font-semibold text-sky-300">{fmtCost(inCost)}</dd>
                </div>
                <div className="rounded-lg bg-slate-800/60 p-3">
                  <dt className="text-xs text-slate-500">{ui.outputCostLabel} ({fmtTokens(outTokens)})</dt>
                  <dd className="mt-1 text-lg font-semibold text-sky-300">{fmtCost(outCost)}</dd>
                </div>
                <div className="rounded-lg bg-sky-500/10 p-3 ring-1 ring-sky-500/30">
                  <dt className="text-xs text-slate-400">{ui.totalCostLabel}</dt>
                  <dd className="mt-1 text-lg font-bold text-white">
                    {fmtCost(inCost == null || outCost == null ? null : inCost + outCost)}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-slate-500">{ui.priceUnavailable}</p>
            )}
            <p className="mt-4 text-xs text-slate-600">{ui.costNote}</p>
          </div>
        </>
      )}
    </div>
  );
}
