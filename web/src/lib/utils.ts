export const toID = (s: unknown) => ('' + (s ?? '')).toLowerCase().replace(/[^a-z0-9]/g, '');

export const baseName = (species: string) => species.replace(/-Mega(-[A-Z])?$/, '');

export const formatDate = (seconds: number) => new Date(seconds * 1000).toLocaleDateString('es-ES');

export const pct = (wins: number, games: number) => (games ? `${Math.round((wins / games) * 1000) / 10}%` : '–');
