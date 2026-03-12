import Parser from 'rss-parser';
import { readFileSync } from 'fs';
import { join } from 'path';
import { parse as parseYaml } from 'yaml';

export interface FeedSource {
  id: string;
  name: string;
  url: string;
  rss: string;
  description: string;
  tags: string[];
  subsection: string;
}

export interface FeedItem {
  title: string;
  url: string;
  source: string;
  sourceId: string;
  sourceUrl: string;
  date: string;
  summary?: string;
  tags: string[];
  subsection: string;
}

const parser = new Parser({ timeout: 8000 });

export function loadSources(file: string): FeedSource[] {
  const path = join(process.cwd(), 'src/content/feeds', file);
  const raw = readFileSync(path, 'utf-8');
  return parseYaml(raw) as FeedSource[];
}

export async function fetchFeed(source: FeedSource, limit = 5): Promise<FeedItem[]> {
  try {
    const feed = await parser.parseURL(source.rss);
    return (feed.items ?? []).slice(0, limit).map(item => ({
      title: item.title ?? '(no title)',
      url: item.link ?? source.url,
      source: source.name,
      sourceId: source.id,
      sourceUrl: source.url,
      date: item.pubDate ?? item.isoDate ?? '',
      summary: item.contentSnippet?.slice(0, 200),
      tags: source.tags,
      subsection: source.subsection ?? 'Independent',
    }));
  } catch (err) {
    console.warn(`[feeds] Failed to fetch ${source.name}: ${(err as Error).message}`);
    return [];
  }
}

export async function fetchAllFeeds(sources: FeedSource[], itemsPerFeed = 5): Promise<FeedItem[]> {
  const results = await Promise.allSettled(sources.map(s => fetchFeed(s, itemsPerFeed)));
  const items: FeedItem[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') items.push(...result.value);
  }
  return items.sort((a, b) => {
    const da = a.date ? new Date(a.date).getTime() : 0;
    const db = b.date ? new Date(b.date).getTime() : 0;
    return db - da;
  });
}
