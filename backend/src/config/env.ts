import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

// Secretos que nunca deben quedarse con el valor de ejemplo
const INSECURE_SECRETS = new Set([
  'your-secret-key',
  'your_secret_key_change_this_in_production',
  'tu_clave_secreta_aqui',
  'secret',
  'changeme',
]);

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error(
    'JWT_SECRET no está configurado. Genera uno con:\n' +
    '  node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"\n' +
    'y agrégalo a backend/.env'
  );
}

if (INSECURE_SECRETS.has(jwtSecret) || jwtSecret.length < 32) {
  throw new Error(
    'JWT_SECRET es inseguro (valor de ejemplo o menor a 32 caracteres). ' +
    'Genera uno nuevo con: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"'
  );
}

// A partir de aquí TypeScript sabe que es un string válido
export const JWT_SECRET: string = jwtSecret;

export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '2h';

// Orígenes permitidos para CORS (separados por coma en .env)
export const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS ||
  'http://localhost:5173,http://localhost:3000')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

// Dominios de correo permitidos para registrarse.
// Vacío = se acepta cualquier dominio con formato válido.
export const ALLOWED_EMAIL_DOMAINS = (process.env.ALLOWED_EMAIL_DOMAINS || '')
  .split(',')
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean);

export const IS_PRODUCTION = isProduction;
