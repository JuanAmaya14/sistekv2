import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// Crear carpeta si no existe al iniciar
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// El MIME lo envía el cliente y se puede falsificar, por eso además se exige
// que la extensión corresponda a ese MIME. Así no se puede guardar un .html
// declarándolo como image/png.
const ALLOWED_TYPES: Record<string, string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
};

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (_req, file, cb) => {
    // La extensión se toma de la lista permitida para el MIME, nunca del
    // nombre original: evita rutas (../) y extensiones ejecutables.
    const allowedExts = ALLOWED_TYPES[file.mimetype] ?? [];
    const originalExt = path.extname(file.originalname).toLowerCase();
    const ext = allowedExts.includes(originalExt) ? originalExt : allowedExts[0] ?? '';

    const unique = `${Date.now()}-${crypto.randomBytes(12).toString('hex')}`;
    cb(null, `${unique}${ext}`);
  },
});

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const allowedExts = ALLOWED_TYPES[file.mimetype];

  if (!allowedExts) {
    return cb(new Error('Formato no permitido. Solo se aceptan JPG, PNG, PDF y DOCX.'));
  }

  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowedExts.includes(ext)) {
    return cb(new Error('La extensión del archivo no coincide con su tipo declarado.'));
  }

  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
    files: 1,
    fields: 10,
  },
});

export { UPLOAD_DIR, ALLOWED_TYPES };
