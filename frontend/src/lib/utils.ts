import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
