/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL base de la API. Por defecto "/api" (en desarrollo, Vite la redirige al backend). */
  readonly VITE_API_URL?: string;
}
