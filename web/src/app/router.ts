import { useEffect, useState } from 'react';

export const SECTIONS = ['resumen', 'constructor', 'partidas', 'pokemon', 'rivales', 'sets'] as const;
export type Section = (typeof SECTIONS)[number];

export type Route =
  | { page: 'teams' }
  | { page: 'team'; teamId: string; section: Section }
  | { page: 'calc' }
  | { page: 'user' }
  | { page: 'privacy' }
  | { page: 'terms' };

function parse(hash: string): Route {
  const [, kind, id, section] = hash.replace(/^#/, '').split('/');
  if (kind === 'equipo' && id) {
    return { page: 'team', teamId: id, section: (SECTIONS as readonly string[]).includes(section) ? (section as Section) : 'resumen' };
  }
  if (kind === 'calculadora') return { page: 'calc' };
  if (kind === 'usuario') return { page: 'user' };
  if (kind === 'privacidad') return { page: 'privacy' };
  if (kind === 'terminos') return { page: 'terms' };
  return { page: 'teams' };
}

export function href(r: Route): string {
  switch (r.page) {
    case 'team':
      return `#/equipo/${r.teamId}/${r.section}`;
    case 'calc':
      return '#/calculadora';
    case 'user':
      return '#/usuario';
    case 'privacy':
      return '#/privacidad';
    case 'terms':
      return '#/terminos';
    default:
      return '#/';
  }
}

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
