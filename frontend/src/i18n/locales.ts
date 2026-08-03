/**
 * 语言与站点本地化配置 —— 单一事实来源 (single source of truth)
 *
 * 被 astro.config.ts 与 src/i18n/ui.ts 共同引用，保证路由配置与 UI 字典口径一致。
 * 后续新增语言时只需在 LOCALES / LOCALE_LABELS / FALLBACK_LOCALE 三处扩展。
 */
export const LOCALES = ['en', 'zh-CN', 'ja', 'ko', 'es', 'de', 'fr'] as const;

/** 语言代码联合类型，例如 'en' | 'zh-CN' */
export type Locale = (typeof LOCALES)[number];

/** 默认语言：English */
export const DEFAULT_LOCALE: Locale = 'en';

/** 语言 → 本地化名称（用于语言切换器展示） */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  'zh-CN': '简体中文',
  ja: '日本語',
  ko: '한국어',
  es: 'Español',
  de: 'Deutsch',
  fr: 'Français',
};

/**
 * fallback 映射：当某语言缺少对应页面时回退到指定语言（默认回退英文）。
 * 保证 7 个语言前缀 URL 在内容补齐前均可访问，且内容增量上线时无缝切换。
 *
 * 使用 satisfies 保留字面量类型，与 Astro 7 的 fallback 类型
 * `{ [K in Locale]?: Exclude<Locale, K> }` 精确匹配。
 */
export const FALLBACK_LOCALE = {
  'zh-CN': DEFAULT_LOCALE,
  ja: DEFAULT_LOCALE,
  ko: DEFAULT_LOCALE,
  es: DEFAULT_LOCALE,
  de: DEFAULT_LOCALE,
  fr: DEFAULT_LOCALE,
} satisfies Record<Exclude<Locale, typeof DEFAULT_LOCALE>, Locale>;
