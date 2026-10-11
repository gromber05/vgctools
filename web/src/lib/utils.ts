export const toID = (s: unknown) => ('' + (s ?? '')).toLowerCase().replace(/[^a-z0-9]/g, '');

/** "Garchomp-Mega-Z" → "Garchomp". Las Megas cuentan como su forma base en las estadísticas. */
export const baseName = (species: string) => species.replace(/-Mega(-[A-Z])?$/, '');

/** Fecha corta a partir de segundos desde epoch (el formato de Showdown). */
export const formatDate = (seconds: number) => new Date(seconds * 1000).toLocaleDateString('es-ES');

export const pct = (wins: number, games: number) => (games ? `${Math.round((wins / games) * 1000) / 10}%` : '–');
