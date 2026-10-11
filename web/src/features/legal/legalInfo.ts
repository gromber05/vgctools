export const LEGAL = {
  owner: '[NOMBRE Y APELLIDOS DEL TITULAR]',
  ownerId: '[NIF, solo si la web tiene actividad económica]',
  email: '[CORREO DE CONTACTO]',
  hosting: '[PROVEEDOR DE ALOJAMIENTO Y PAÍS]',
  backupDays: 30,
  updated: '11 de octubre de 2026',
  minAge: 14,
};

export const isLegalInfoComplete = () => !Object.values(LEGAL).some((v) => typeof v === 'string' && v.startsWith('['));
