/**
 * 新闻查询服务（D1）——列表（按语言/分类筛选，倒序）。
 */
import type { D1Database } from '@cloudflare/workers-types';

export interface NewsRecord {
  id: number;
  title: string;
  content: string | null;
  language: string;
  source: string;
  link: string | null;
  category: string;
  publishedAt: string | null;
  createdAt: string | null;
}

export interface ListNewsParams {
  lang?: string | null;
  category?: string | null;
}

/** 新闻列表（语言/分类可空筛选，发布时间倒序，最多 100 条） */
export async function listNews(db: D1Database, { lang, category }: ListNewsParams): Promise<NewsRecord[]> {
  const sql = `
    SELECT id, title, content, language, source, link, category, published_at, created_at
    FROM news
    WHERE (? IS NULL OR language = ?)
      AND (? IS NULL OR category = ?)
    ORDER BY published_at DESC
    LIMIT 100
  `;
  const { results } = await db
    .prepare(sql)
    .bind(lang ?? null, lang ?? null, category ?? null, category ?? null)
    .all();
  return (results ?? []).map((row) => ({
    id: row.id as number,
    title: row.title as string,
    content: (row.content as string | null) ?? null,
    language: row.language as string,
    source: row.source as string,
    link: (row.link as string | null) ?? null,
    category: row.category as string,
    publishedAt: (row.published_at as string | null) ?? null,
    createdAt: (row.created_at as string | null) ?? null,
  }));
}
