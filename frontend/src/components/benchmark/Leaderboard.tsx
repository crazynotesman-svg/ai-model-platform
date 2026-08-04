/**
 * Leaderboard：AI 模型排行榜（React Island，客户端排序）。
 *
 * - 数据：构建期从 D1 导出的 model-catalog.json（经 Astro props 传入，无运行时请求）；
 * - 模式：Overall（平均分）或按 benchmark 分类（?benchmark=coding）排序；
 * - 表格列：Rank / Model / Provider / Coding / Reasoning / Math / Vision；
 * - 移动端：横向滚动 + sticky 表头 + 卡片模式（sm 以下）。
 */
import { useEffect, useMemo, useState } from 'react';
import type { Locale } from '../../i18n/locales';
import type { BenchmarkRecord } from '../../lib/benchmark';
import { BENCHMARK_CATEGORIES, getBenchmarkByCategory, overallScore } from '../../lib/benchmark';

export interface LeaderboardUi {
  overall: string;
  rank: string;
  model: string;
  provider: string;
  noData: string;
  empty: string;
  coding: string;
  reasoning: string;
  math: string;
  vision: string;
}

export interface LeaderboardModel {
  slug: string;
  name: string;
  providerName: string;
  benchmarks: BenchmarkRecord[];
}

interface Props {
  lang: Locale;
  ui: LeaderboardUi;
  models: LeaderboardModel[];
}

type Mode = 'overall' | string; // 'overall' 或 category slug

const fmtScore = (n: number | null, ui: LeaderboardUi): string => (n == null ? ui.noData : String(n));

export default function Leaderboard({ lang, ui, models }: Props) {
  const [mode, setMode] = useState<Mode>('overall');

  // 初始化：从 URL query ?benchmark= 读取排序模式
  useEffect(() => {
    const b = new URLSearchParams(window.location.search).get('benchmark');
    if (b) setMode(b);
  }, []);

  const switchMode = (next: Mode) => {
    setMode(next);
    const url = next === 'overall' ? window.location.pathname : `${window.location.pathname}?benchmark=${next}`;
    window.history.replaceState(null, '', url);
  };

  // 排序：overall=平均分；分类=该分类最高分（缺失排末尾）
  const rows = useMemo(() => {
    const withScore = models.map((m) => {
      const score =
        mode === 'overall'
          ? overallScore(m.benchmarks)
          : (getBenchmarkByCategory(m.benchmarks, mode)[0]?.score ?? null);
      return { ...m, score };
    });
    return withScore
      .sort((a, b) => (b.score ?? Number.NEGATIVE_INFINITY) - (a.score ?? Number.NEGATIVE_INFINITY))
      .map((r, i) => ({ ...r, rank: i + 1 }));
  }, [models, mode]);

  const scoreOf = (model: LeaderboardModel, category: string): number | null =>
    getBenchmarkByCategory(model.benchmarks, category)[0]?.score ?? null;

  const activeLabel =
    mode === 'overall' ? ui.overall : (BENCHMARK_CATEGORIES.find((c) => c.slug === mode)?.labelKey
      ? ui[mode as keyof LeaderboardUi]
      : ui.overall);

  if (rows.length === 0) {
    return <p className="rounded-xl border border-dashed border-slate-700 bg-slate-900/60 p-6 text-sm text-slate-400">{ui.empty}</p>;
  }

  return (
    <section>
      {/* 模式切换：Overall + 各 benchmark */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {(['overall', ...BENCHMARK_CATEGORIES.map((c) => c.slug)] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => switchMode(m)}
            aria-pressed={mode === m}
            className={
              'rounded-full border px-3 py-1 text-xs font-medium transition-colors ' +
              (mode === m
                ? 'border-sky-500 bg-sky-500/15 text-sky-300'
                : 'border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-500 hover:text-slate-200')
            }
          >
            {m === 'overall' ? ui.overall : ui[m as keyof LeaderboardUi]}
          </button>
        ))}
      </div>

      {/* 表格模式（sm 及以上） */}
      <div className="hidden overflow-x-auto rounded-xl border border-slate-800 md:block">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-slate-800 bg-slate-900 text-[11px] uppercase tracking-wide text-slate-500">
              <th scope="col" className="px-4 py-3 font-medium">{ui.rank}</th>
              <th scope="col" className="px-4 py-3 font-medium">{ui.model}</th>
              <th scope="col" className="px-4 py-3 font-medium">{ui.provider}</th>
              {BENCHMARK_CATEGORIES.map((c) => (
                <th key={c.slug} scope="col" className="px-4 py-3 text-right font-medium">
                  {ui[c.labelKey.replace('benchmark.', '') as keyof LeaderboardUi]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.slug} className="border-b border-slate-800/60 last:border-b-0">
                <td className="px-4 py-3 tabular-nums text-slate-400">{r.rank}</td>
                <td className="px-4 py-3">
                  <a href={`/${lang}/models/${r.slug}/`} className="font-medium text-slate-100 hover:text-sky-300">
                    {r.name}
                  </a>
                </td>
                <td className="px-4 py-3 text-slate-400">{r.providerName}</td>
                {BENCHMARK_CATEGORIES.map((c) => (
                  <td key={c.slug} className="px-4 py-3 text-right tabular-nums text-slate-200">
                    {fmtScore(scoreOf(r, c.slug), ui)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 卡片模式（移动端） */}
      <ul className="space-y-3 md:hidden">
        {rows.map((r) => (
          <li key={r.slug} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-baseline justify-between gap-3">
              <a href={`/${lang}/models/${r.slug}/`} className="font-semibold text-white hover:text-sky-300">
                {r.name}
              </a>
              <span className="text-xs text-slate-500">#{r.rank}</span>
            </div>
            <p className="text-xs text-sky-400">{r.providerName}</p>
            <dl className="mt-3 grid grid-cols-2 gap-2">
              {BENCHMARK_CATEGORIES.map((c) => (
                <div key={c.slug} className="flex items-center justify-between rounded-lg bg-slate-950 px-2.5 py-1.5">
                  <dt className="text-[11px] text-slate-500">{ui[c.labelKey.replace('benchmark.', '') as keyof LeaderboardUi]}</dt>
                  <dd className="text-xs font-medium tabular-nums text-slate-200">{fmtScore(scoreOf(r, c.slug), ui)}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </section>
  );
}
