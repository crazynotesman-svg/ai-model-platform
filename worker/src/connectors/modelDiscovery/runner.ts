/**
 * modelDiscovery/runner.ts —— Model Discovery 调度（Phase 12.1 Part J）
 * 每日 cron 0 4 * * *：检查新模型/新版本/deprecated/price changes → MODEL_DISCOVERED（pending）。
 * 只发现，不自动发布（approve 后才进 production）。
 */
import type { D1Database } from '@cloudflare/workers-types';
import { openaiDiscovery } from './openai';
import { insertEvents } from '../../services/eventProcessor';

export const ALL_DISCOVERY = [openaiDiscovery];

export async function runModelDiscovery(db: D1Database): Promise<{ connectors: number; events: number; errors: string[] }> {
  const errors: string[] = [];
  let events = 0;
  for (const c of ALL_DISCOVERY) {
    try {
      const raw = await c.fetch();
      if (raw == null) continue;
      const rows = c.validate(await c.normalize(raw));
      if (rows.length > 0) {
        events += await insertEvents(db, rows.map((r) => c.createEvent(r)));
      }
    } catch (err) {
      errors.push(`${c.name}: ${(err as Error).message}`);
    }
  }
  return { connectors: ALL_DISCOVERY.length, events, errors };
}
