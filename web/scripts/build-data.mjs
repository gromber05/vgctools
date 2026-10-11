import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'src', 'data', 'champions.json');
const cache = fs.mkdtempSync(path.join(os.tmpdir(), 'vgc-tools-data-'));

const RAW = 'https://raw.githubusercontent.com/smogon/pokemon-showdown/master/data/mods/champions/';
const PLAY = 'https://play.pokemonshowdown.com/data/';
const sources = {
  'formats-data.ts': RAW + 'formats-data.ts',
  'items.ts': RAW + 'items.ts',
  'moves.ts': RAW + 'moves.ts',
  'learnsets.ts': RAW + 'learnsets.ts',
  'pokedex.json': PLAY + 'pokedex.json',
  'moves.json': PLAY + 'moves.json',
  'items.js': PLAY + 'items.js',
};

for (const [file, url] of Object.entries(sources)) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No se pudo descargar ${url}: ${res.status}`);
  fs.writeFileSync(path.join(cache, file), await res.text());
}

const imp = async (f) => import(pathToFileURL(path.join(cache, f)).href);
const formatsData = (await imp('formats-data.ts')).FormatsData;
const champItems = (await imp('items.ts')).Items;
const champMoves = (await imp('moves.ts')).Moves;
const learnsets = (await imp('learnsets.ts')).Learnsets;
const read = (f) => fs.readFileSync(path.join(cache, f), 'utf8');
const dex = JSON.parse(read('pokedex.json'));
const moves = JSON.parse(read('moves.json'));
const ctx = { exports: {} };
vm.createContext(ctx);
vm.runInContext(read('items.js'), ctx);
const items = ctx.exports.BattleItems;
fs.rmSync(cache, { recursive: true, force: true });

const toID = (s) => ('' + s).toLowerCase().replace(/[^a-z0-9]/g, '');
const BANNED_TAGS = ['Mythical', 'Restricted Legendary'];

function learn(id, sp) {
  let l = learnsets[id]?.learnset;
  if (!l && sp.changesFrom) l = learnsets[toID(sp.changesFrom)]?.learnset;
  if (!l && sp.baseSpecies) l = learnsets[toID(sp.baseSpecies)]?.learnset;
  return l ? Object.keys(l) : [];
}

const species = {};
const usedMoves = new Set();
for (const [id, f] of Object.entries(formatsData)) {
  if (f.tier === 'Illegal' || f.isNonstandard) continue;
  const sp = dex[id];
  if (!sp || (sp.tags || []).some((t) => BANNED_TAGS.includes(t))) continue;
  const isMega = /Mega/.test(sp.forme || '');
  if (sp.battleOnly && !isMega) continue;
  const baseId = isMega ? toID(sp.baseSpecies) : id;
  const b = sp.baseStats;
  const entry = {
    name: sp.name,
    types: sp.types,
    stats: [b.hp, b.atk, b.def, b.spa, b.spd, b.spe],
    abilities: Object.values(sp.abilities),
  };
  if (isMega) {
    Object.assign(entry, { mega: true, base: baseId, stone: sp.requiredItem });
  } else {
    entry.learnset = learn(baseId, sp);
    entry.learnset.forEach((m) => usedMoves.add(m));
  }
  species[id] = entry;
}

const moveData = {};
for (const m of usedMoves) {
  const d = moves[m];
  if (!d) continue;
  const o = champMoves[m] || {};
  if (o.isNonstandard ?? d.isNonstandard) continue;
  const acc = o.accuracy ?? d.accuracy;
  moveData[m] = {
    name: d.name,
    type: d.type,
    category: d.category,
    power: o.basePower ?? d.basePower,
    accuracy: acc === true ? 0 : acc,
    priority: d.priority,
    target: d.target,
    desc: d.shortDesc || '',
  };
}
for (const s of Object.values(species)) if (s.learnset) s.learnset = s.learnset.filter((x) => moveData[x]).sort();

const itemData = {};
for (const [id, d] of Object.entries(items)) {
  const ns = id in champItems ? champItems[id].isNonstandard : d.isNonstandard;
  if (ns || d.isPokeball || d.isGem || /^t[mr]\d/.test(id)) continue;
  itemData[id] = { name: d.name, ...(d.megaStone && { megaStone: d.megaStone }) };
}

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify({ generated: new Date().toISOString().slice(0, 10), species, moves: moveData, items: itemData }));
const megas = Object.values(species).filter((s) => s.mega).length;
console.log(
  `OK: ${Object.keys(species).length - megas} Pokémon, ${megas} Megas, ${Object.keys(moveData).length} movimientos, ${Object.keys(itemData).length} objetos → ${path.relative(root, out)}`,
);
