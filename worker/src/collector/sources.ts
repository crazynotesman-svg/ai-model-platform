/**
 * 新闻聚合来源配置（5 大 AI 机构官方 RSS/Feed）。
 * 原则：仅抓取标题/摘要/链接/发布时间，不复制全文。
 *
 * 说明：
 * - Anthropic 未提供公开 RSS（2026-08 实测 404），暂置 enabled=false；
 *   接入自建 RSSHub（路由 /anthropic/news）后改回 feedUrl 并启用。
 * - Meta AI / Hugging Face：本机网络可能不可达，但 Cloudflare Worker 边缘可正常抓取；
 *   本地调试时 collector 会记录错误并跳过（不影响其他源）。
 */

export interface NewsSource {
  /** 内部标识 */
  id: string;
  /** ���示名（写入 news.source） */
  name: string;
  /** RSS/Atom Feed 地址 */
  feedUrl: string;
  /** 官网/新闻主页（link 缺失时的兜底） */
  homepage: string;
  /** 是否启用（false 时 collector 跳过） */
  enabled?: boolean;
}

export const NEWS_SOURCES: NewsSource[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    feedUrl: 'https://openai.com/news/rss.xml',
    homepage: 'https://openai.com/news',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    feedUrl: 'https://www.anthropic.com/rss.xml', // 官方未提供 RSS；接入自建 RSSHub 后替换
    homepage: 'https://www.anthropic.com/news',
    enabled: false,
  },
  {
    id: 'google-ai',
    name: 'Google AI',
    feedUrl: 'https://blog.google/technology/ai/rss/',
    homepage: 'https://blog.google/technology/ai/',
  },
  {
    id: 'meta-ai',
    name: 'Meta AI',
    feedUrl: 'https://ai.meta.com/blog/rss/',
    homepage: 'https://ai.meta.com/blog/',
  },
  {
    id: 'huggingface',
    name: 'Hugging Face',
    feedUrl: 'https://huggingface.co/blog/feed.xml',
    homepage: 'https://huggingface.co/blog',
  },
];
