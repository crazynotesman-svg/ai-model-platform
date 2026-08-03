/**
 * 通用 RSS 2.0 / Atom 解析器（基于 fast-xml-parser）。
 * 兼容各源差异：RSS item / Atom entry、CDATA 标题、链接属性等。
 */
import { XMLParser } from 'fast-xml-parser';

export interface FeedItem {
  title: string;
  description: string; // 原始 HTML（由 collector 做摘要）
  link: string;
  pubDate: string; // 原始字符串（可能为空）
}

/** 兼容 CDATA/嵌套对象的字段提取 */
function toText(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'object') {
    const v = value as Record<string, unknown>;
    return toText(v['#text'] ?? v['_'] ?? '');
  }
  return '';
}

/** 解析 RSS 或 Atom XML → 统一 FeedItem[] */
export function parseFeed(xml: string): FeedItem[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    cdataPropName: '#text',
  });
  const doc = parser.parse(xml) as Record<string, any>;

  // RSS 2.0：rss.channel.item[]
  const channel = doc?.rss?.channel;
  if (channel) {
    const items = Array.isArray(channel.item) ? channel.item : channel.item ? [channel.item] : [];
    return items.map((item: Record<string, unknown>) => ({
      title: toText(item.title).trim(),
      description: toText(item.description ?? item['content:encoded'] ?? ''),
      link: toText(item.link ?? item.guid).trim(),
      pubDate: toText(item.pubDate ?? item['dc:date'] ?? '').trim(),
    }));
  }

  // Atom：feed.entry[]
  const feed = doc?.feed;
  if (feed) {
    const entries = Array.isArray(feed.entry) ? feed.entry : feed.entry ? [feed.entry] : [];
    return entries.map((entry: Record<string, unknown>) => {
      const linkObj = entry.link;
      const asRecord = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' ? (v as Record<string, unknown>) : {});
      const link =
        typeof linkObj === 'string'
          ? linkObj
          : Array.isArray(linkObj)
            ? (linkObj.find((l) => toText(asRecord(l)['@_rel'] ?? '') === 'alternate')?.['@_href'] as string) ?? ''
            : toText(asRecord(linkObj)['@_href'] ?? '');
      return {
        title: toText(entry.title).trim(),
        description: toText(entry.summary ?? entry.content ?? ''),
        link: link.trim(),
        pubDate: toText(entry.published ?? entry.updated ?? '').trim(),
      };
    });
  }

  return [];
}
