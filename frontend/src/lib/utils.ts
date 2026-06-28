import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Detecta a URL base para uploads dinamicamente
function getUploadsBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL;
  
  if (envUrl && !envUrl.includes('localhost')) {
    if (typeof window !== 'undefined') {
      const currentHost = window.location.hostname;
      try {
        const envHost = new URL(envUrl).hostname;
        if (currentHost !== envHost && currentHost !== 'localhost') {
          return `http://${currentHost}:3001`;
        }
      } catch {
        // Se falhar ao parsear a URL, usa o host atual
      }
    }
    return envUrl.replace('/api/v1', '');
  }
  
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return `http://${window.location.hostname}:3001`;
  }
  
  return 'http://localhost:3001';
}

const UPLOADS_BASE_URL = getUploadsBaseUrl();

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Constrói a URL completa para um arquivo de upload
 * @param path Caminho relativo do arquivo (ex: "tokens/abc123.png")
 * @returns URL completa ou null se path for vazio
 */
export function getUploadUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  // Se já for uma URL completa, retorna como está
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return `${UPLOADS_BASE_URL}/uploads/${path}`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function vitalColor(current: number, max: number): 'green' | 'yellow' | 'red' {
  if (max === 0) return 'green'
  const percentage = (current / max) * 100
  if (percentage > 50) return 'green'
  if (percentage > 25) return 'yellow'
  return 'red'
}

export function rollDice(notation: string): { result: number; rolls: number[]; notation: string } {
  const match = notation.match(/^(\d+)?d(\d+)([+-]\d+)?$/i)
  if (!match) {
    return { result: 0, rolls: [], notation }
  }

  const count = parseInt(match[1] || '1', 10)
  const sides = parseInt(match[2], 10)
  const modifier = parseInt(match[3] || '0', 10)

  const rolls: number[] = []
  for (let i = 0; i < count; i++) {
    rolls.push(Math.floor(Math.random() * sides) + 1)
  }

  const total = rolls.reduce((sum, roll) => sum + roll, 0) + modifier
  return { result: total, rolls, notation }
}
