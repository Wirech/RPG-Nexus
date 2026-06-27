import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { createId } from '@paralleldrive/cuid2';
import { Request } from 'express';

const UPLOADS_DIR = process.env.UPLOADS_DIR || './uploads';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

// Garante que as pastas existam
function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Factory para criar storage por subpasta
function createStorage(subfolder: string) {
  const uploadPath = path.join(UPLOADS_DIR, subfolder);
  ensureDir(uploadPath);

  return multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, uploadPath);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const filename = `${createId()}${ext}`;
      cb(null, filename);
    },
  });
}

// Filtro de arquivos
function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não permitido. Use: JPEG, PNG, WebP ou GIF'));
  }
}

// Uploads de tokens (avatares de personagens/monstros)
export const uploadToken = multer({
  storage: createStorage('tokens'),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
}).single('token');

// Uploads de documentos
export const uploadDocument = multer({
  storage: createStorage('documents'),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
}).single('image');

// Uploads de imagens de ambiente
export const uploadEnvironmentImage = multer({
  storage: createStorage('environments'),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
}).single('image');

// Múltiplas imagens (para galeria)
export const uploadMultipleImages = (subfolder: string, fieldName: string, maxCount: number = 10) => {
  return multer({
    storage: createStorage(subfolder),
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter,
  }).array(fieldName, maxCount);
};

// Utilitário para deletar arquivo
export function deleteFile(filePath: string): void {
  const fullPath = path.join(UPLOADS_DIR, filePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
}

// Utilitário para obter caminho relativo
export function getRelativePath(subfolder: string, filename: string): string {
  return `${subfolder}/${filename}`;
}
