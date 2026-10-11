import { Card } from '@/components/ui';
import { Sprite } from '@/components/pokemon/Sprite';
import { TypeChip } from '@/components/pokemon/TypeChip';
import { battleForm, findMove } from '@/lib/champions/data';
import { effectiveness, TYPES } from '@/lib/champions/typechart';
import type { PasteMon } from '@/lib/showdown/paste';

const LABEL: Record<number, string> = { 0: '0', 0.25: '¼', 0.5: '½', 2: '×2', 4: '×4' };

function cellClass(m: number) {
  if (m === 0) return 'eff eff-0';
  if (m < 1) return m <= 0.25 ? 'eff eff-quarter' : 'eff eff-half';
  if (m > 1) return m >= 4 ? 'eff eff-4' : 'eff eff-2';
  return 'eff';
}

export function TeamTypeAnalysis({ mons }: { mons: PasteMon[] }) {
  const members = mons
    .map((m) => ({ mon: m, form: battleForm(m.species, m.item) }))
    .filter((x): x is { mon: PasteMon; form: NonNullable<typeof x.form> } => !!x.form);
  if (!members.length) return null;

  const ability = (x: (typeof members)[number]) => (x.form.mega ? x.form.species.abilities[0] : x.mon.ability);
  const rows = TYPES.map((type) => {
    const mults = members.map((x) => effectiveness(type, x.form.species.types, ability(x)));
    return { type, mults, weak: mults.filter((m) => m > 1).length, resist: mults.filter((m) => m < 1).length };
  });

  const attackTypes = [
    ...new Set(
      members.flatMap((x) =>
        x.mon.moves
          .map(findMove)
          .filter((m) => m && m.category !== 'Status')
          .map((m) => m!.type),
      ),
    ),
  ];
  const coverage = TYPES.map((type) => ({
    type,
    best: attackTypes.length ? Math.max(...attackTypes.map((a) => effectiveness(a, [type]))) : 0,
  }));

  return (
    <div className="two">
      <Card title="Debilidades del equipo">
        <p className="muted small">
          Daño que recibe cada uno según el tipo del ataque, con la forma Mega si lleva su piedra y habilidades como Levitación. En rojo,
          tipos a los que 3 o más son débiles sin nadie que resista.
        </p>
        <div className="table-scroll">
          <table className="eff-table">
            <thead>
              <tr>
                <th>Ataque</th>
                {members.map((x, i) => (
                  <th key={i} title={x.form.species.name}>
                    <Sprite name={x.form.species.name} size={32} />
                  </th>
                ))}
                <th>Débiles</th>
                <th>Resisten</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.type} className={r.weak >= 3 && r.resist === 0 ? 'is-hole' : ''}>
                  <td>
                    <TypeChip type={r.type} small />
                  </td>
                  {r.mults.map((m, i) => (
                    <td key={i} className={cellClass(m)}>
                      {LABEL[m] ?? ''}
                    </td>
                  ))}
                  <td className={r.weak >= 3 ? 'num is-bad' : 'num'}>{r.weak}</td>
                  <td className="num">{r.resist}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card title="Cobertura ofensiva">
        <p className="muted small">El mejor multiplicador que consiguen tus movimientos de ataque contra cada tipo.</p>
        {attackTypes.length ? (
          <div className="coverage">
            {coverage.map((c) => (
              <div key={c.type} className={c.best > 1 ? 'cov is-good' : c.best < 1 ? 'cov is-bad' : 'cov'}>
                <TypeChip type={c.type} small />
                <span>{c.best === 0 ? '0' : (LABEL[c.best] ?? '×1')}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted small">Añade movimientos de ataque para ver la cobertura.</p>
        )}
      </Card>
    </div>
  );
}
