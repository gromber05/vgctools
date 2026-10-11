import { baseName } from '@/lib/utils';

export interface PasteMon {
  species: string;
  nickname: string;
  item: string;
  ability: string;
  nature: string;
  evs: string;
  moves: string[];
}

export function parsePaste(text: string): PasteMon[] {
  return text
    .replace(/\r/g, '')
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = block.split('\n').map((l) => l.trim());
      const [headRaw, item = ''] = lines[0].split(' @ ');
      const head = headRaw.replace(/\((M|F)\)\s*$/, '').trim();
      const paren = head.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
      const field = (prefix: string) =>
        lines
          .find((l) => l.startsWith(prefix))
          ?.slice(prefix.length)
          .trim() ?? '';
      return {
        species: baseName(paren ? paren[2] : head),
        nickname: paren ? paren[1] : '',
        item: item.trim(),
        ability: field('Ability:'),
        nature: lines.find((l) => / Nature$/.test(l))?.replace(/ Nature$/, '') ?? '',
        evs: field('EVs:'),
        moves: lines.filter((l) => l.startsWith('-')).map((l) => l.slice(1).trim()),
      };
    })
    .filter((m) => m.species);
}

export function exportPaste(team: PasteMon[]): string {
  return team
    .filter((m) => m.species)
    .map((m) => {
      const head = (m.nickname ? `${m.nickname} (${m.species})` : m.species) + (m.item ? ` @ ${m.item}` : '');
      const lines = [head];
      if (m.ability) lines.push(`Ability: ${m.ability}`);
      lines.push('Level: 50');
      if (m.evs) lines.push(`EVs: ${m.evs}`);
      if (m.nature) lines.push(`${m.nature} Nature`);
      lines.push(...m.moves.filter(Boolean).map((mv) => `- ${mv}`));
      return lines.join('\n');
    })
    .join('\n\n');
}

export async function fetchPaste(url: string): Promise<{ text: string; title: string; team: PasteMon[] }> {
  const m = url.trim().match(/pokepast\.es\/([a-z0-9]+)/i);
  if (!m) throw new Error('El enlace no es de pokepast.es.');
  const res = await fetch(`https://pokepast.es/${m[1]}/json`);
  if (!res.ok) throw new Error(`pokepast.es respondió ${res.status}.`);
  const data = (await res.json()) as { paste: string; title?: string };
  const team = parsePaste(data.paste);
  if (!team.length) throw new Error('El pokepaste está vacío.');
  return { text: data.paste, title: data.title ?? '', team };
}
