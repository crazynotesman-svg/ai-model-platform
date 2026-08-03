// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { LOCALES, DEFAULT_LOCALE, FALLBACK_LOCALE } from './src/i18n/locales';

/**
 * 站点根 URL（占位）。正式域名确定后更新，用于 canonical / sitemap / OG 等 SEO 能力。
 */
const SITE_URL = 'https://ai-model-platform.example.com';

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,

  integrations: [
    // React islands：交互组件（Token 计数、成本估算等）按需客户端渲染
    react(),
  ],

  i18n: {
    defaultLocale: DEFAULT_LOCALE,
    // Astro 7 的 Locales 类型为可变数组，需展开 readonly 常量
    locales: [...LOCALES],
    routing: {
      // 强制默认语言也带 URL 前缀：/en/ /zh-CN/ ...
      prefixDefaultLocale: true,
    },
    // 语言页面缺失时回退英文，保证所有语言前缀可访问
    fallback: FALLBACK_LOCALE,
  },

  redirects: {
    // 根路径 301 到默认语言
    '/': '/en',
  },

  vite: {
    plugins: [
      // Tailwind CSS v4（Vite 插件方式，无需 tailwind.config.js）
      tailwindcss(),
    ],
  },
});
