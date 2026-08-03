/**
 * 自动语言识别（isomorphic 模块）。
 *
 * - 服务端（构建期）：`buildAutoLocaleScript` 生成内联 IIFE 字符串，注入页面 <head>，
 *   避免客户端加载延迟造成的语言闪烁（FOUC）。
 * - 客户端：IIFE 按优先级识别：手动偏好(localStorage) > navigator.languages 自动匹配。
 *
 * 规则：
 *   1. 用户手动切换过语言（localStorage[storageKey]）→ 尊重选择，不自动跳转；
 *   2. 自动识别仅在当前标签页首次访问时执行一次（sessionStorage 防循环）；
 *   3. 识别到非默认语言且与当前页面语言不同 → 软重定向（location.replace）。
 */
import { DEFAULT_LOCALE, LOCALES, type Locale } from './locales';

export const LANG_STORAGE_KEY = 'amp:lang'; // 手动偏好
export const SESSION_REDIRECT_KEY = 'amp:auto-redirect-done'; // 会话级防循环

/** 将浏览器语言（'zh-CN' / 'en-US' / 'zh' ...）匹配为受支持语言；不支持返回 null */
export function matchLocale(browserLang: string): Locale | null {
  const exact = browserLang.toLowerCase();
  const base = exact.split('-')[0];
  // 中文统一映射到简体（zh → zh-CN）
  if (base === 'zh') return 'zh-CN';
  const hit = LOCALES.find((l) => l.toLowerCase() === exact);
  if (hit) return hit;
  // 基语言匹配（如 de-DE → de）；en 会匹配到默认语言
  return (LOCALES as readonly string[]).includes(base) ? (base as Locale) : null;
}

/** 按浏览器语言优先级列表识别目标语言；仅返回非默认语言（默认语言无需重定向） */
export function detectLocale(languages: readonly string[]): Locale | null {
  for (const lang of languages) {
    const matched = matchLocale(lang);
    if (matched && matched !== DEFAULT_LOCALE) return matched;
  }
  return null;
}

/** 将当前路径翻译为目标语言（保留子路径与查询串） */
export function translatePath(pathname: string, targetLang: Locale): string {
  const [, lang] = pathname.split('/');
  const hasLangPrefix = Boolean(lang && (LOCALES as readonly string[]).includes(lang));
  const rest = hasLangPrefix ? pathname.slice(`/${lang}`.length) : pathname;
  return `/${targetLang}${rest.startsWith('/') ? rest : `/${rest}`}`;
}

/** 生成内联自动识别脚本（构建期调用，注入 <head>） */
export function buildAutoLocaleScript(): string {
  const locales = JSON.stringify(LOCALES);
  const storageKey = LANG_STORAGE_KEY;
  const sessionKey = SESSION_REDIRECT_KEY;
  const defaultLocale = DEFAULT_LOCALE;
  return `(function () {
  'use strict';
  var LOCALES = ${locales};
  var DEFAULT_LOCALE = ${JSON.stringify(defaultLocale)};
  var STORAGE_KEY = ${JSON.stringify(storageKey)};
  var SESSION_KEY = ${JSON.stringify(sessionKey)};

  function matchLocale(browserLang) {
    var exact = browserLang.toLowerCase();
    var base = exact.split('-')[0];
    if (base === 'zh') return 'zh-CN';
    var hit = LOCALES.filter(function (l) { return l.toLowerCase() === exact; })[0];
    if (hit) return hit;
    return LOCALES.indexOf(base) !== -1 ? base : null;
  }

  function detect(languages) {
    for (var i = 0; i < languages.length; i++) {
      var m = matchLocale(languages[i]);
      if (m && m !== DEFAULT_LOCALE) return m;
    }
    return null;
  }

  try {
    // 用户手动选择过语言则尊重选择
    if (localStorage.getItem(STORAGE_KEY)) return;
    // 本会话已自动跳转过则跳过（防循环）
    if (sessionStorage.getItem(SESSION_KEY)) return;

    var target = detect(navigator.languages || [navigator.language || '']);
    if (!target) return;

    var parts = location.pathname.split('/');
    var current = parts[1] ? parts[1].toLowerCase() : '';
    var isSupported = LOCALES.some(function (l) { return l.toLowerCase() === current; });
    if (isSupported) return; // 已处于语言前缀页面，不重复跳转

    sessionStorage.setItem(SESSION_KEY, '1');
    location.replace('/' + target + location.pathname + location.search);
  } catch (e) { /* 隐私模式等异常场景静默降级 */ }
})();`;
}
