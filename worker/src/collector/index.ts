/**
 * News Collector：从 5 大 AI 机构 RSS 抓取 → 摘要（不复制全文）→ 分类 → 去重写入 D1。
 *
 * 触发方式：
 *   - Cloudflare Cron（wrangler.toml [triggers] crons，默认每天 01:00 UTC）
 *   - 手动：GET /api/news/refresh（本地调试）
 *
 * 容错：单个源失败不影响其他源，错误汇总返回。
 */
import { NEWS_SOURCES } from './sources';
import { parseFeed } from './rss';
import type { Env } from '../index';

/** 摘要最大长度（字符）：仅保存摘要，不复制全文 */
const MAX_SUMMARY_LENGTH = 240;

/** 解析结果汇总 */
export interface CollectResult {
  added: number;
  sourcesOk: number;
  errors: string[];
}

/** 去除 HTML 标签与常见实体，压缩空白 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#\d+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** 生成摘要：去 HTML + 截断（不复制全文） */
function summarize(html: string): string {
  const text = stripHtml(html);
  if (text.length <= MAX_SUMMARY_LENGTH) return text;
  return `${text.slice(0, MAX_SUMMARY_LENGTH).trimEnd()}…`;
}

/** 标题关键词规则 → 分类（缺省 general） */
function categorize(title: string): string {
  const t = title.toLowerCase();
  if (/(release|launch|announces?|introduces?|available|beta|preview|model)/.test(t)) return 'model-release';
  if (/(open[ -]?source|weights|license|gemma|llama|hugging ?face)/.test(t)) return 'open-source';
  if (/(research|paper|study|benchmark|technique|alignment)/.test(t)) return 'research';
  if (/(funding|acquisition|partnership|revenue|invest|lawsuit)/.test(t)) return 'business';
  if (/(update|feature|product|app|tool|api|sdk)/.test(t)) return 'product';
  return 'general';
}

/** 时间归一化：可解析 → ISO 8601；否则原样返回 */
function normalizeDate(raw: string): string {
  const time = Date.parse(raw);
  return Number.isNaN(time) ? raw : new Date(time).toISOString();
}

/**
 * 抓取全部来源并写入 D1（按 source+link 去重）。
 */
export async function collectNews(env: Env): Promise<CollectResult> {
  const errors: string[] = [];
  let added = 0;
  let sourcesOk = 0;

  for (const src of NEWS_SOURCES) {
    if (src.enabled === false) continue; // 未启用的源（如 Anthropic 无官方 RSS）跳过
    try {
      const res = await fetch(src.feedUrl, {
        headers: { 'User-Agent': 'ai-model-platform-news-collector/1.0' },
      });
      if (!res.ok) {
        errors.push(`${src.id}: HTTP ${res.status}`);
        continue;
      }
      const xml = await res.text();
      const items = parseFeed(xml);
      let addedSrc = 0;
      for (const item of items) {
        if (!item.title || !item.link) continue;
        // 去重：同来源同链接只入库一次
        const exists = await env.DB.prepare(
          'SELECT 1 FROM news WHERE source = ? AND link = ? LIMIT 1',
        )
          .bind(src.name, item.link)
          .first();
        if (exists) continue;

        const category = categorize(item.title);
        const summary = summarize(item.description);
        const publishedAt = normalizeDate(item.pubDate);
        await env.DB.prepare(
          `INSERT INTO news (title, content, language, source, link, category, published_at)
           VALUES (?, ?, 'en', ?, ?, ?, ?)`,
        )
          .bind(item.title, summary, src.name, item.link, category, publishedAt)
          .run();
        addedSrc++;
      }
      added += addedSrc;
      sourcesOk++;
    } catch (err) {
      errors.push(`${src.id}: ${(err as Error).message}`);
    }
  }

  return { added, sourcesOk, errors };
}
