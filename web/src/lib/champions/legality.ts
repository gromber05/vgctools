import type { PasteMon } from '@/lib/showdown/paste';
import { toID } from '@/lib/utils';
import { baseSpecies, canLearn, findItem, findMove } from './data';
import { parseSp, SP_MAX, SP_TOTAL, spTotal } from './rules';

export function setWarnings(mon: PasteMon, team: PasteMon[]): string[] {
  if (!mon.species) return [];
  const species = baseSpecies(mon.species);
  if (!species) return [`${mon.species} no es legal en esta regulación.`];

  const warnings: string[] = [];
  const sp = parseSp(mon.evs);
  const total = spTotal(sp);
  if (total > SP_TOTAL) warnings.push(`Has repartido ${total} Stat Points; el máximo es ${SP_TOTAL}.`);
  if (sp.some((v) => v > SP_MAX)) warnings.push(`Máximo ${SP_MAX} Stat Points por estadística.`);

  if (mon.ability && !species.abilities.includes(mon.ability)) warnings.push(`${species.name} no puede tener ${mon.ability}.`);

  if (mon.item) {
    const item = findItem(mon.item);
    if (!item) warnings.push(`${mon.item} no está disponible en Champions.`);
    else {
      if (item.megaStone && !item.megaStone[species.name]) warnings.push(`${item.name} no sirve para ${species.name}.`);
      const repeated = team.filter((m) => m !== mon && toID(m.item) === toID(mon.item)).length;
      if (repeated) warnings.push(`Cláusula de objeto: ${item.name} está repetido.`);
    }
  }

  const ids = mon.moves.filter(Boolean).map(toID);
  for (const move of mon.moves.filter(Boolean)) {
    if (!findMove(move)) warnings.push(`Movimiento desconocido: ${move}.`);
    else if (!canLearn(species.name, move)) warnings.push(`${species.name} no aprende ${move}.`);
  }
  if (new Set(ids).size !== ids.length) warnings.push('Hay un movimiento repetido.');

  const sameSpecies = team.filter((m) => m !== mon && baseSpecies(m.species)?.name === species.name).length;
  if (sameSpecies) warnings.push(`Cláusula de especie: ${species.name} está repetido.`);
  return warnings;
}
