/**
 * dataDiscovery.ts —— Data Discovery 调度（Phase 11.6）
 *
 * 每 6 小时（cron：每天 4 次，UTC 0/6/12/18 点）运行全部 connectors：
 *   fetch → normalize → validate → insertEvents（status=pending）
 * 只发现，不自动发布（pending 等待 approve）。
 */import { runConnector } from './connectors/types';
import { openaiConnector } from './connectors/openai';
import { anthropicConnector } from './connectors/anthropic';
import { googleConnector } from './connectors/google';
import { huggingfaceConnector } from './connectors/huggingface';
import { lmsysConnector } from './connectors/lmsys';
import { insertEvents } from './eventProcessor';

export const ALL_CONNECTORS = [
  openaiConnector,
  anthropicConnector,
  googleConnector,
  huggingfaceConnector,
  lmsysConnector,
];

export async function runDataDiscovery(db: D1Database): Promise<{
  connectors: number;
  eventsInserted: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let eventsInserted = 0;
  for (const c of ALL_CONNECTORS) {
    const result = await runConnector(c);
    if (result.errors.length > 0) errors.push(...result.errors);
    if (result.events.length > 0) {
      eventsInserted += await insertEvents(db, result.events);
    }
  }
  return { connectors: ALL_CONNECTORS.length, eventsInserted, errors };
}
