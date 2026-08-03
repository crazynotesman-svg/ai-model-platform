/**
 * TokenInput：文本输入 + 模型系列选择（移动端 2 列网格，桌面 4 列）。
 */
import type { ModelFamily } from '../../lib/tokenizer/registry';
import { FAMILY_MODEL_SLUGS } from '../../lib/tokenizer/registry';

export interface TokenInputUi {
  inputLabel: string;
  inputPlaceholder: string;
  familyLabel: string;
  familyGpt: string;
  familyClaude: string;
  familyGemini: string;
  familyDeepSeek: string;
  clear: string;
}

interface Props {
  ui: TokenInputUi;
  value: string;
  family: ModelFamily;
  onValueChange: (text: string) => void;
  onFamilyChange: (family: ModelFamily) => void;
}

const FAMILIES: { value: ModelFamily; labelKey: keyof TokenInputUi }[] = [
  { value: 'gpt', labelKey: 'familyGpt' },
  { value: 'claude', labelKey: 'familyClaude' },
  { value: 'gemini', labelKey: 'familyGemini' },
  { value: 'deepseek', labelKey: 'familyDeepSeek' },
];

export default function TokenInput({ ui, value, family, onValueChange, onFamilyChange }: Props) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label htmlFor="token-input" className="text-sm font-medium text-slate-300">
          {ui.inputLabel}
        </label>
        <button
          type="button"
          onClick={() => onValueChange('')}
          disabled={!value}
          className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400 transition-colors hover:border-slate-500 hover:text-slate-200 disabled:opacity-40"
        >
          {ui.clear}
        </button>
      </div>
      <textarea
        id="token-input"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={ui.inputPlaceholder}
        spellCheck={false}
        className="mt-2 min-h-44 w-full resize-y rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
      />

      <fieldset className="mt-4">
        <legend className="text-sm font-medium text-slate-300">{ui.familyLabel}</legend>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {FAMILIES.map((f) => {
            const active = f.value === family;
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => onFamilyChange(f.value)}
                aria-pressed={active}
                className={
                  'rounded-xl border px-3 py-2 text-xs font-medium transition-colors ' +
                  (active
                    ? 'border-sky-500 bg-sky-500/15 text-sky-300'
                    : 'border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-500 hover:text-slate-200')
                }
              >
                {ui[f.labelKey]}
              </button>
            );
          })}
        </div>
      </fieldset>
      <p className="mt-2 text-[11px] text-slate-600">
        {FAMILY_MODEL_SLUGS[family]}
      </p>
    </div>
  );
}
