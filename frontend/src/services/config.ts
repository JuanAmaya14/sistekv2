// URL base del backend. Vite la incrusta al construir (npm run build), así que
// en producción se define VITE_BACKEND_URL antes del build; en desarrollo, si
// no está definida, se usa el backend local.
const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:4000').replace(/\/$/, '');

export const API_URL = `${BACKEND_URL}/api`;
export const FILE_URL = `${BACKEND_URL}/uploads`;
