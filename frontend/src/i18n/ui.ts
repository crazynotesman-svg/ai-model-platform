/**
 * UI 文案字典加载层（7 语言）。
 *
 * 数据源：./translations/*.json —— 所有 UI 文字必须来自语言文件。
 * 约束：通过 `satisfies Record<Locale, typeof en>` 在编译期强制所有语言键与 en 完全一致。
 *
 * 约定：键按模块/页面分组命名（site.* / nav.* / home.* / footer.* / lang.*），
 * 后续业务模块按相同约定扩展。支持 {placeholder} 插值（见 formatMessage）。
 */
import { DEFAULT_LOCALE, LOCALES, type Locale } from './locales';
import en from './translations/en.json';
import zhCN from './translations/zh-CN.json';
import ja from './translations/ja.json';
import ko from './translations/ko.json';
import es from './translations/es.json';
import de from './translations/de.json';
import fr from './translations/fr.json';

const ui = {
  en,
  'zh-CN': zhCN,
  ja,
  ko,
  es,
  de,
  fr,
} satisfies Record<Locale, typeof en>;

/** 翻译键类型（以 en 为准，其他语言缺失会编译报错） */
export type UiKey = keyof typeof en;

/** 从 URL 解析语言代码；无法识别时回退默认语言 */
export function getLangFromUrl(url: URL | string): Locale {
  const pathname = typeof url === 'string' ? url : url.pathname;
  const [, lang] = pathname.split('/');
  if (lang && (LOCALES as readonly string[]).includes(lang)) {
    return lang as Locale;
  }
  return DEFAULT_LOCALE;
}

/** 返回指定语言的翻译函数；缺失键回退默认语言 */
export function useTranslations(lang: Locale) {
  return (key: UiKey): string => ui[lang][key] ?? ui[DEFAULT_LOCALE][key];
}

/** 消息插值：`formatMessage("当前语言：{lang}", { lang: "简体中文" })` */
export function formatMessage(template: string, params: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => params[key] ?? `{${key}}`);
}

/** 返回指定语言的翻译函数，支持 {placeholder} 插值 */
export function useI18n(lang: Locale) {
  const t = useTranslations(lang);
  return (key: UiKey, params?: Record<string, string>): string =>
    params ? formatMessage(t(key), params) : t(key);
}

/**
 * 将任意 URL 翻译为指定语言版本（保留子路径与查询串）。
 * 例如 /en/models/gpt-4o → /zh-CN/models/gpt-4o；语言切换器依赖此函数。
 */
export function translateUrl(url: URL, targetLang: Locale): string {
  const [, lang] = url.pathname.split('/');
  const hasLangPrefix = Boolean(lang && (LOCALES as readonly string[]).includes(lang));
  const pathname = hasLangPrefix ? url.pathname.slice(`/${lang}`.length) : url.pathname;
  const rest = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `/${targetLang}${rest === '/' ? '/' : rest}${url.search}`;
}
