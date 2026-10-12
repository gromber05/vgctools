export const LEGAL = {
  owner: 'Gonzalo Romero Bernal',
  email: 'contacto@gromber05.dev',
  hosting: 'Name.com (Estados Unidos)',
  backupDays: 30,
  updated: '11 de octubre de 2026',
  minAge: 14,
};

export const isLegalInfoComplete = () => !Object.values(LEGAL).some((v) => typeof v === 'string' && v.startsWith('['));
