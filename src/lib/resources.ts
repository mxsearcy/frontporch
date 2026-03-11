import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { parse as parseYaml } from 'yaml';

export interface Resource {
  title: string;
  url: string;
  description: string;
  category: string;
  type: 'article' | 'book' | 'guide' | 'tool' | 'video' | 'course' | 'archive';
  tags: string[];
}

export function loadResources(dir: string): Resource[] {
  const dirPath = join(process.cwd(), 'src/content', dir);
  const files = readdirSync(dirPath).filter(f => f.endsWith('.yaml'));
  const all: Resource[] = [];
  for (const file of files) {
    const raw = readFileSync(join(dirPath, file), 'utf-8');
    const items = parseYaml(raw) as Resource[];
    all.push(...items);
  }
  return all;
}

export function groupByCategory(resources: Resource[]): Record<string, Resource[]> {
  return resources.reduce((acc, r) => {
    if (!acc[r.category]) acc[r.category] = [];
    acc[r.category].push(r);
    return acc;
  }, {} as Record<string, Resource[]>);
}
