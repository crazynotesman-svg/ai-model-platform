/**
 * TokenResult：当前系列的 Token 数 + 字符数（大数字卡片）。
 * tokens 为空（计算中/无输入）时显示占位。
 */
export interface TokenResultUi {
  tokens: string;
  characters: string;
  estimationNote: string;
  exactNote: string;
}

interface Props {
  ui: TokenResultUi;
  tokens: number | null; // null = 计算中或未输入
  characters: number;
  isExact: boolean; // tiktoken 精确 vs estimate 估算
  busy: boolean;
}

const format = (n: number) => n.toLocaleString('en-US');

export default function TokenResult({ ui, tokens, characters, isExact, busy }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{ui.tokens}</p>
        <p className="mt-1 text-2xl font-bold text-white tabular-nums sm:text-3xl">
          {tokens == null ? (busy ? '…' : '—') : format(tokens)}
        </p>
        <p className="mt-1 text-[11px] text-slate-500">{isExact ? ui.exactNote : ui.estimationNote}</p>
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{ui.characters}</p>
        <p className="mt-1 text-2xl font-bold text-white tabular-nums sm:text-3xl">
          {format(characters)}
        </p>
        <p className="mt-1 text-[11px] text-slate-500">&nbsp;</p>
      </div>
    </div>
  );
}
