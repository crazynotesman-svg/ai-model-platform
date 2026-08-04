/**
 * 站点 RSS feed：/rss.xml —— 聚合最新新闻（来自 D1，仅标题/摘要/链接/时间）。
 */
import type { D1Database } from '@cloudflare/workers-types';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** 生成新闻 RSS 2.0 XML（最多 50 条，按发布时间倒序） */
export async function buildNewsRss(db: D1Database, origin: string): Promise<string> {
  const { results } = await db
    .prepare(
      `SELECT title, content, link, source, published_at
       FROM news
       WHERE link IS NOT NULL
       ORDER BY published_at DESC
       LIMIT 50`,
    )
    .all();

  const items = (results ?? [])
    .map((row) => {
      const title = escapeXml((row.title as string) ?? '');
      const description = escapeXml((row.content as string) ?? '');
      const link = escapeXml((row.link as string) ?? '');
      const source = escapeXml((row.source as string) ?? '');
      const pubDateRaw = (row.published_at as string) ?? '';
      const pubDate = Number.isNaN(Date.parse(pubDateRaw))
        ? new Date().toUTCString()
        : new Date(pubDateRaw).toUTCString();
      return [
        '<item>',
        `<title>${title}</title>`,
        `<link>${link}</link>`,
        `<description>${description}</description>`,
        `<source>${source}</source>`,
        `<pubDate>${pubDate}</pubDate>`,
        '</item>',
      ].join('');
    })
    .join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '<channel>',
    '<title>AI Model Intelligence Platform — News</title>',
    `<link>${origin}/news/</link>`,
    '<description>Aggregated AI industry news from OpenAI, Anthropic, Google AI, Meta AI and Hugging Face.</description>',
    `<atom:link href="${origin}/rss.xml" rel="self" type="application/rss+xml"/>`,
    items,
    '</channel>',
    '</rss>',
  ].join('\n');
}
