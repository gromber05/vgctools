import { useEffect, useState } from 'react';

export const SECTIONS = ['resumen', 'partidas', 'pokemon', 'rivales', 'sets'] as const;
export type Section = (typeof SECTIONS)[number];

export type Route = { page: 'teams' } | { page: 'team'; teamId: string; section: Section };

function parse(hash: string): Route {
  const [, kind, id, section] = hash.replace(/^#/, '').split('/');
  if (kind === 'equipo' && id) {
    return { page: 'team', teamId: id, section: (SECTIONS as readonly string[]).includes(section) ? (section as Section) : 'resumen' };
  }
  return { page: 'teams' };
}

export const href = (r: Route) => (r.page === 'teams' ? '#/' : `#/equipo/${r.teamId}/${r.section}`);

/** Navegación con el hash de la URL, para que recargar la página no te saque de donde estabas. */
export function useRoute(): [Route, (r: Route) => void] {
  const [route, setRoute] = useState(() => parse(location.hash));
  useEffect(() => {
    const on = () => setRoute(parse(location.hash));
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return [
    route,
    (r) => {
      location.hash = href(r);
    },
  ];
}
