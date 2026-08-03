/**
 * CostComparison：多模型成本对比表（按输入成本升序）。
 * 移动端：表格容器横向滚动；价格缺失时显示 —。
 */
export interface CostComparisonRow {
  slug: string;
  name: string;
  tokens: number | null; // 该模型对应 tokenizer 的 token 数
  isExact: boolean;
  inputCost: number | null; // USD
  outputCost: number | null;
}

export interface CostComparisonUi {
  costTitle: string;
  costModel: string;
  costTokens: string;
  costInput: string;
  costOutput: string;
  costNote: string;
  priceUnavailable: string;
  costLoading: string;
  error: string;
  retry: string;
  exactNote: string;
  estimationNote: string;
}

interface Props {
  ui: CostComparisonUi;
  rows: CostComparisonRow[];
  loading: boolean;
  priceError: boolean;
  onRetry: () => void;
}

const fmtMoney = (n: number | null): string =>
  n == null ? '—' : `$${n.toFixed(4)}`;

const fmtTokens = (n: number | null): string =>
  n == null ? '…' : n.toLocaleString('en-US');

export default function CostComparison({ ui, rows, loading, priceError, onRetry }: Props) {
  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
        {ui.costTitle}
      </h2>

      {priceError ? (
        <div className="mt-3 rounded-xl border border-red-900/50 bg-red-950/30 p-5 text-center text-sm text-red-300">
          <p>{ui.error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 rounded-full bg-sky-500 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-sky-400"
          >
            {ui.retry}
          </button>
        </div>
      ) : loading ? (
        <p className="mt-3 rounded-xl border border-slate-800 bg-slate-900/60 p-5 text-sm text-slate-400">
          {ui.costLoading}
        </p>
      ) : (
        <>
          <div className="mt-3 overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80 text-xs uppercase tracking-wide text-slate-500">
                  <th scope="col" className="px-4 py-3 font-medium">{ui.costModel}</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">{ui.costTokens}</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">{ui.costInput}</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">{ui.costOutput}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.slug} className="border-b border-slate-800/60 last:border-b-0">
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-100">{r.name}</span>
                      <span className="ml-2 rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-500">
                        {r.isExact ? ui.exactNote : ui.estimationNote}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-200">
                      {fmtTokens(r.tokens)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-200">
                      {fmtMoney(r.inputCost)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-200">
                      {fmtMoney(r.outputCost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[11px] text-slate-600">{ui.costNote}</p>
        </>
      )}
    </section>
  );
}
