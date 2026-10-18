import { baseName, toID } from '@/lib/utils';

export type Side = 'p1' | 'p2';

export interface Game {
  id: string;
  format: string;
  time: number;
  me: string;
  opp: string;
  result: 'W' | 'L' | 'T';
  myTeam: string[];
  oppTeam: string[];
  myPicks: string[];
  oppPicks: string[];
  myLeads: string[];
  oppLeads: string[];
  myMega: string | null;
  oppMega: string | null;
  ots: boolean;
  myElo: number | null;
  myEloAfter: number | null;
  oppElo: number | null;
  series: string | null;
  gameNo: number | null;
  turns: number;
  myMoves: Record<string, Record<string, number>>;
  // Campos añadidos después: las partidas leídas antes no los tienen.
  oppMoves?: Record<string, Record<string, number>>;
  kos?: KO[];
  oppSets?: RevealedSet[];
  duration?: number;
}

export interface KO {
  turn: number;
  mine: boolean;
  mon: string;
  by: string | null;
}

export interface RevealedSet {
  species: string;
  item: string;
  ability: string;
  moves: string[];
}

export interface ReplayJSON {
  id: string;
  format: string;
  players: string[];
  log: string;
  uploadtime: number;
}

export function replayIdFromUrl(url: string): string | null {
  const m = url.trim().match(/(?:replay\.pokemonshowdown\.com\/)?([a-z0-9]+-\d+(?:-[a-z0-9]+pw)?)/i);
  return m ? m[1].toLowerCase() : null;
}

export async function fetchReplay(url: string): Promise<ReplayJSON> {
  const id = replayIdFromUrl(url);
  if (!id) throw new Error('El enlace no parece una repetición de Showdown.');
  const res = await fetch(`https://replay.pokemonshowdown.com/${id}.json`);
  if (res.status === 404) throw new Error('Showdown no encuentra esta repetición.');
  if (!res.ok) throw new Error(`Showdown respondió ${res.status}.`);
  return res.json();
}

export function parseReplay(replay: ReplayJSON, myNames: string[]): Game {
  const names: Partial<Record<Side, string>> = {};
  const ratings: Partial<Record<Side, number>> = {};
  const preview: Record<Side, string[]> = { p1: [], p2: [] };
  const picks: Record<Side, string[]> = { p1: [], p2: [] };
  const leads: Record<Side, string[]> = { p1: [], p2: [] };
  const mega: Record<Side, string | null> = { p1: null, p2: null };
  const nick: Record<Side, Record<string, string>> = { p1: {}, p2: {} };
  const moves: Record<Side, Record<string, Record<string, number>>> = { p1: {}, p2: {} };
  const after: Record<string, number> = {};
  const sets: Record<Side, RevealedSet[]> = { p1: [], p2: [] };
  const faints: { side: Side; mon: string; turn: number; by: string | null }[] = [];
  const cause: Record<string, string | null> = {};
  let lastMover: { side: Side; species: string } | null = null;
  let t = 0;
  let tStart = 0;
  let winner: string | null = null;
  let tie = false;
  let ots = false;
  let turns = 0;
  let series: string | null = null;
  let gameNo: number | null = null;

  const sideOf = (ident: string) => ident.slice(0, 2) as Side;
  const nickOf = (ident: string) => ident.slice(ident.indexOf(':') + 1).trim();

  for (const line of replay.log.split('\n')) {
    const p = line.split('|');
    switch (p[1]) {
      case 'player':
        if (p[3] && !names[p[2] as Side]) {
          names[p[2] as Side] = p[3];
          if (p[5]) ratings[p[2] as Side] = +p[5];
        }
        break;
      case 'poke':
        preview[p[2] as Side].push(p[3].split(',')[0]);
        break;
      case 'showteam':
        ots = true;
        sets[p[2] as Side] = p
          .slice(3)
          .join('|')
          .split(']')
          .map((packed) => {
            const f = packed.split('|');
            return { species: f[1] || f[0], item: f[2] ?? '', ability: f[3] ?? '', moves: (f[4] ?? '').split(',').filter(Boolean) };
          });
        break;
      case 't:':
        t = +p[2];
        break;
      case 'start':
        tStart = t;
        break;
      case 'switch':
      case 'drag':
      case 'replace': {
        const side = sideOf(p[2]);
        const species = baseName(p[3].split(',')[0]);
        nick[side][nickOf(p[2])] = species;
        if (!picks[side].includes(species)) picks[side].push(species);
        if (turns === 0 && leads[side].length < 2 && !leads[side].includes(species)) leads[side].push(species);
        break;
      }
      case '-mega':
        mega[sideOf(p[2])] = baseName(p[3]);
        break;
      case 'move': {
        const side = sideOf(p[2]);
        const species = nick[side][nickOf(p[2])];
        if (species) lastMover = { side, species };
        if (line.includes('[from]') || !species) break;
        const bucket = (moves[side][species] ??= {});
        bucket[p[3]] = (bucket[p[3]] ?? 0) + 1;
        break;
      }
      case '-damage':
        if (p[3]?.includes('fnt')) {
          const from = p.find((x) => x.startsWith('[from]'));
          const side = sideOf(p[2]);
          cause[p[2]] = from ? from.slice(6).replace(/^\s*(item|ability|move):\s*/, '').trim() : lastMover && lastMover.side !== side ? lastMover.species : null;
        }
        break;
      case 'faint': {
        const side = sideOf(p[2]);
        faints.push({ side, mon: nick[side][nickOf(p[2])] ?? nickOf(p[2]), turn: turns, by: cause[p[2]] ?? null });
        break;
      }
      case 'turn':
        turns = +p[2];
        break;
      case 'win':
        winner = p[2];
        break;
      case 'tie':
        tie = true;
        break;
      case 'raw': {
        const m = p[2]?.match(/^(.+?)'s rating: \d+ &rarr; <strong>(\d+)<\/strong>/);
        if (m) after[toID(m[1])] = +m[2];
        break;
      }
      case 'uhtml': {
        const m = line.match(/Game (\d+)<\/strong> of <a href="\/game-bestof\d+-([^"]+)"/);
        if (m) {
          gameNo = +m[1];
          series = m[2];
        }
        break;
      }
    }
  }

  const wanted = myNames.map(toID).filter(Boolean);
  const me: Side | null = (['p1', 'p2'] as Side[]).find((s) => wanted.includes(toID(names[s]))) ?? null;
  if (!me) {
    throw new Error(`No encuentro tu nombre de Showdown en la repetición (jugadores: ${names.p1 ?? '?'} y ${names.p2 ?? '?'}).`);
  }
  const op: Side = me === 'p1' ? 'p2' : 'p1';

  const resolve = (side: Side) =>
    preview[side].map((s) => {
      if (!s.endsWith('-*')) return s;
      const base = s.slice(0, -2);
      return picks[side].find((x) => x.startsWith(base)) ?? base;
    });

  const myName = names[me]!;
  return {
    id: replay.id,
    format: replay.format,
    time: replay.uploadtime,
    me: myName,
    opp: names[op] ?? '?',
    result: tie ? 'T' : toID(winner) === toID(myName) ? 'W' : 'L',
    myTeam: resolve(me),
    oppTeam: resolve(op),
    myPicks: picks[me],
    oppPicks: picks[op],
    myLeads: leads[me],
    oppLeads: leads[op],
    myMega: mega[me],
    oppMega: mega[op],
    ots,
    myElo: ratings[me] ?? null,
    myEloAfter: after[toID(myName)] ?? null,
    oppElo: ratings[op] ?? null,
    series,
    gameNo,
    turns,
    myMoves: moves[me],
    oppMoves: moves[op],
    kos: faints.map(({ side, ...k }) => ({ ...k, mine: side === me })),
    oppSets: sets[op],
    duration: tStart && t > tStart ? t - tStart : 0,
  };
}
