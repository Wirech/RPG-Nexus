import type { ConditionType } from '@/types';

export interface ConditionInfo {
  name: ConditionType;
  category: 'medo' | 'mental' | 'paralisia' | 'sentidos' | 'fadiga' | 'geral';
  emoji: string;
  color: string;
  description: string;
}

export const CONDITIONS_DATA: ConditionInfo[] = [
  // 🔴 Condições de Medo
  {
    name: 'Abalado',
    category: 'medo',
    emoji: '🔴',
    color: 'bg-red-500/20 text-red-400 border-red-500/50',
    description: 'Sofre –1d20 em todos os testes de perícia. Se ficar abalado novamente, torna-se Apavorado.',
  },
  {
    name: 'Apavorado',
    category: 'medo',
    emoji: '🔴',
    color: 'bg-red-500/20 text-red-400 border-red-500/50',
    description: 'Sofre –2d20 em todos os testes de perícia e é obrigado a fugir da fonte do medo da maneira mais rápida possível. Se não puder fugir, pode agir normalmente, mas nunca pode se aproximar voluntariamente da fonte do medo.',
  },

  // 🟠 Condições Mentais
  {
    name: 'Alquebrado',
    category: 'mental',
    emoji: '🟠',
    color: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
    description: 'O custo em Pontos de Esforço (PE) de todas as habilidades e rituais do personagem aumenta em +1.',
  },
  {
    name: 'Atordoado',
    category: 'mental',
    emoji: '🟠',
    color: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
    description: 'O personagem fica Desprevenido e não pode realizar nenhuma ação, nem mesmo ações livres.',
  },
  {
    name: 'Confuso',
    category: 'mental',
    emoji: '🟠',
    color: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
    description: 'Age de modo aleatório. No início de cada turno, role 1d6: 1 – Move-se em direção aleatória; 2–3 – Fica balbuciando, sem agir; 4–5 – Ataca o ser mais próximo (ou a si mesmo); 6 – Condição encerra.',
  },
  {
    name: 'Esmorecido',
    category: 'mental',
    emoji: '🟠',
    color: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
    description: 'Sofre –2d20 em testes de Intelecto e Presença.',
  },
  {
    name: 'Fascinado',
    category: 'mental',
    emoji: '🟠',
    color: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
    description: 'Atenção completamente presa em algo. Sofre –2d20 em Percepção e não pode realizar ações, apenas observar. Um ataque hostil ou ação de aliado encerra a condição.',
  },
  {
    name: 'Frustrado',
    category: 'mental',
    emoji: '🟠',
    color: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
    description: 'Sofre –1d20 em testes de Intelecto e Presença. Se ficar frustrado novamente, torna-se Esmorecido.',
  },
  {
    name: 'Pasmo',
    category: 'mental',
    emoji: '🟠',
    color: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
    description: 'O personagem não pode realizar ações, mas ainda pode realizar reações.',
  },

  // 🔵 Condições de Paralisia / Movimento
  {
    name: 'Agarrado',
    category: 'paralisia',
    emoji: '🔵',
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
    description: 'Fica Desprevenido e Imóvel, sofre –1d20 em testes de ataque e só pode usar armas leves. Ataques à distância contra alvos agarrados têm 50% de chance de acertar a pessoa errada.',
  },
  {
    name: 'Enredado',
    category: 'paralisia',
    emoji: '🔵',
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
    description: 'O personagem fica Lento, Vulnerável e sofre –1d20 em testes de ataque.',
  },
  {
    name: 'Imóvel',
    category: 'paralisia',
    emoji: '🔵',
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
    description: 'Todas as formas de deslocamento são reduzidas a 0 metros.',
  },
  {
    name: 'Lento',
    category: 'paralisia',
    emoji: '🔵',
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
    description: 'Deslocamento reduzido à metade (arredondado para baixo). Não pode correr nem realizar investidas.',
  },
  {
    name: 'Paralisado',
    category: 'paralisia',
    emoji: '🔵',
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
    description: 'O personagem fica Imóvel e Indefeso. Só pode realizar ações puramente mentais.',
  },

  // 🟡 Condições de Sentidos
  {
    name: 'Cego',
    category: 'sentidos',
    emoji: '🟡',
    color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
    description: 'Fica Desprevenido e Lento. Não pode fazer testes de Percepção para observar, sofre –2d20 em testes baseados em Agilidade ou Força. Todos os alvos têm camuflagem total contra ele.',
  },
  {
    name: 'Ofuscado',
    category: 'sentidos',
    emoji: '🟡',
    color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
    description: 'Sofre –1d20 em testes de ataque e de Percepção.',
  },
  {
    name: 'Surdo',
    category: 'sentidos',
    emoji: '🟡',
    color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
    description: 'Falha automaticamente em testes de Percepção para ouvir. Sofre –2d20 em Iniciativa e tem dificuldade adicional ao conjurar rituais.',
  },

  // 🟢 Condições Físicas / Fadiga
  {
    name: 'Debilitado',
    category: 'fadiga',
    emoji: '🟢',
    color: 'bg-green-500/20 text-green-400 border-green-500/50',
    description: 'Sofre –2d20 em testes de Agilidade, Força e Vigor. Se ficar debilitado novamente, torna-se Inconsciente.',
  },
  {
    name: 'Exausto',
    category: 'fadiga',
    emoji: '🟢',
    color: 'bg-green-500/20 text-green-400 border-green-500/50',
    description: 'O personagem fica Debilitado, Lento e Vulnerável. Se ficar exausto novamente, cai Inconsciente.',
  },
  {
    name: 'Fatigado',
    category: 'fadiga',
    emoji: '🟢',
    color: 'bg-green-500/20 text-green-400 border-green-500/50',
    description: 'O personagem fica Fraco e Vulnerável. Se ficar fatigado novamente, torna-se Exausto.',
  },
  {
    name: 'Fraco',
    category: 'fadiga',
    emoji: '🟢',
    color: 'bg-green-500/20 text-green-400 border-green-500/50',
    description: 'Sofre –1d20 em testes de Agilidade, Força e Vigor. Se ficar fraco novamente, torna-se Debilitado.',
  },

  // ⚪ Condições de Estado Geral
  {
    name: 'Asfixiado',
    category: 'geral',
    emoji: '⚪',
    color: 'bg-gray-500/20 text-gray-300 border-gray-500/50',
    description: 'Não pode respirar. Pode prender o fôlego por rodadas igual ao seu Vigor. Depois disso, faz teste de Fortitude (DT 5, +5 por teste anterior). Se falhar, cai Inconsciente e perde 1d6 PV por rodada.',
  },
  {
    name: 'Caído',
    category: 'geral',
    emoji: '⚪',
    color: 'bg-gray-500/20 text-gray-300 border-gray-500/50',
    description: 'Está deitado no chão. Sofre –2d20 em ataques corpo a corpo e deslocamento reduzido a 1,5m. Sofre –5 na Defesa contra ataques corpo a corpo, mas +5 na Defesa contra ataques à distância.',
  },
  {
    name: 'Desprevenido',
    category: 'geral',
    emoji: '⚪',
    color: 'bg-gray-500/20 text-gray-300 border-gray-500/50',
    description: 'Sofre –5 na Defesa e –1d20 em Reflexos. Sempre ocorre contra inimigos que o personagem não possa perceber.',
  },
  {
    name: 'Doente',
    category: 'geral',
    emoji: '⚪',
    color: 'bg-gray-500/20 text-gray-300 border-gray-500/50',
    description: 'O personagem está sob efeito de uma doença. Os efeitos específicos dependem da patologia descrita pelo Narrador.',
  },
  {
    name: 'Em Chamas',
    category: 'geral',
    emoji: '🔥',
    color: 'bg-orange-600/20 text-orange-400 border-orange-600/50',
    description: 'No início de cada turno, sofre 1d6 de dano de fogo. Pode gastar uma ação padrão para apagar as chamas com as mãos ou mergulhando em água.',
  },
  {
    name: 'Enjoado',
    category: 'geral',
    emoji: '⚪',
    color: 'bg-gray-500/20 text-gray-300 border-gray-500/50',
    description: 'Pode realizar apenas uma ação padrão OU uma ação de movimento por rodada (não as duas).',
  },
  {
    name: 'Envenenado',
    category: 'geral',
    emoji: '☠️',
    color: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
    description: 'Efeito varia conforme o veneno. Pode causar dano recorrente (ex: 1d12 de dano por rodada) ou aplicar outras condições como Fraco ou Enjoado.',
  },
  {
    name: 'Indefeso',
    category: 'geral',
    emoji: '⚪',
    color: 'bg-gray-500/20 text-gray-300 border-gray-500/50',
    description: 'Considerado Desprevenido, mas com –10 na Defesa, falha automaticamente em Reflexos e pode sofrer Golpes de Misericórdia.',
  },
  {
    name: 'Inconsciente',
    category: 'geral',
    emoji: '💤',
    color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50',
    description: 'O personagem fica Indefeso e não pode realizar nenhuma ação ou reação. Um aliado pode gastar uma ação padrão para acordá-lo.',
  },
  {
    name: 'Morto',
    category: 'geral',
    emoji: '💀',
    color: 'bg-black text-white border-gray-700',
    description: 'O personagem está morto. Não pode realizar nenhuma ação.',
  },
  {
    name: 'Morrendo',
    category: 'geral',
    emoji: '🩸',
    color: 'bg-red-700/30 text-red-400 border-red-700/50',
    description: 'Ocorre ao atingir 0 PV. O personagem fica Inconsciente. Após 3 rodadas nesse estado na mesma cena, ele morre. A condição termina ao recuperar ao menos 1 PV.',
  },
  {
    name: 'Petrificado',
    category: 'geral',
    emoji: '🪨',
    color: 'bg-stone-500/20 text-stone-400 border-stone-500/50',
    description: 'O personagem fica Inconsciente e recebe Resistência a Dano 10 (RD 10).',
  },
  {
    name: 'Pressionado',
    category: 'geral',
    emoji: '⚪',
    color: 'bg-gray-500/20 text-gray-300 border-gray-500/50',
    description: 'Sofre –1d20 em testes de perícia até o fim da cena.',
  },
  {
    name: 'Sangrando',
    category: 'geral',
    emoji: '🩸',
    color: 'bg-red-600/20 text-red-400 border-red-600/50',
    description: 'No início de cada turno, faz teste de Vigor (DT 20). Se passar, estabiliza e remove a condição. Se falhar, perde 1d6 PV e continua sangrando.',
  },
  {
    name: 'Surpreendido',
    category: 'geral',
    emoji: '❗',
    color: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/50',
    description: 'Ocorre no início do combate quando o personagem não sabe da presença dos inimigos. Fica Desprevenido e não pode agir na primeira rodada.',
  },
  {
    name: 'Vulnerável',
    category: 'geral',
    emoji: '🛡️',
    color: 'bg-gray-500/20 text-gray-300 border-gray-500/50',
    description: 'O personagem sofre –5 na Defesa.',
  },
];

// Lista simples de nomes de condições (para compatibilidade)
export const CONDITIONS: ConditionType[] = CONDITIONS_DATA.map(c => c.name);

// Mapa rápido para buscar condição por nome
export const CONDITIONS_MAP: Record<ConditionType, ConditionInfo> = CONDITIONS_DATA.reduce(
  (acc, condition) => {
    acc[condition.name] = condition;
    return acc;
  },
  {} as Record<ConditionType, ConditionInfo>
);

// Categorias de condições
export const CONDITION_CATEGORIES = {
  medo: { name: 'Medo', emoji: '🔴', color: 'text-red-400' },
  mental: { name: 'Mentais', emoji: '🟠', color: 'text-orange-400' },
  paralisia: { name: 'Paralisia/Movimento', emoji: '🔵', color: 'text-blue-400' },
  sentidos: { name: 'Sentidos', emoji: '🟡', color: 'text-yellow-400' },
  fadiga: { name: 'Fadiga', emoji: '🟢', color: 'text-green-400' },
  geral: { name: 'Estado Geral', emoji: '⚪', color: 'text-gray-400' },
} as const;
