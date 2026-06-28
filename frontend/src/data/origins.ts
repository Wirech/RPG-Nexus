// Origem - Sistema de Ordem Paranormal RPG
// Cada origem concede 2 perícias treinadas + 1 poder de origem exclusivo

export interface Origin {
  name: string;
  skills: [string, string] | [string, 'escolha'] | ['escolha', 'escolha'];
  power: {
    name: string;
    description: string;
  };
  source: 'livro-basico' | 'sobrevivendo-ao-horror' | 'extras';
}

export const ORIGINS: Origin[] = [
  // ==================== LIVRO BÁSICO (26 origens) ====================
  {
    name: 'Acadêmico',
    skills: ['Ciências', 'Investigação'],
    power: {
      name: 'Saber é Poder',
      description: 'Ao fazer um teste usando Intelecto, pode gastar 2 PE para receber +5 nesse teste.',
    },
    source: 'livro-basico',
  },
  {
    name: 'Agente de Saúde',
    skills: ['Intuição', 'Medicina'],
    power: {
      name: 'Técnica Medicinal',
      description: 'Sempre que cura um personagem, adiciona seu Intelecto no total de PV curados.',
    },
    source: 'livro-basico',
  },
  {
    name: 'Amnésico',
    skills: ['escolha', 'escolha'],
    power: {
      name: 'Vislumbres do Passado',
      description: 'Uma vez por sessão, faz um teste de Intelecto puro (DT 10) para reconhecer algo do passado. Se passar, recebe 1d4 PE temporários e uma informação útil do mestre.',
    },
    source: 'livro-basico',
  },
  {
    name: 'Artista',
    skills: ['Artes', 'Enganação'],
    power: {
      name: 'Magnum Opus',
      description: 'Uma vez por missão, pode determinar que um NPC o reconheça como famoso. Recebe +5 em testes de Presença e perícias de Presença contra aquele personagem.',
    },
    source: 'livro-basico',
  },
  {
    name: 'Atleta',
    skills: ['Acrobacia', 'Atletismo'],
    power: {
      name: '110%',
      description: 'Ao fazer teste de perícia usando Força ou Agilidade (exceto Luta e Pontaria), pode gastar 2 PE para receber +5 nesse teste.',
    },
    source: 'livro-basico',
  },
  {
    name: 'Chef',
    skills: ['Fortitude', 'Profissão'],
    power: {
      name: 'Ingrediente Secreto',
      description: 'Em interlúdio, gasta uma ação para cozinhar. Cada aliado (incluindo você) que gastar uma ação para se alimentar recebe o benefício de dois pratos (efeitos acumulam).',
    },
    source: 'livro-basico',
  },
  {
    name: 'Criminoso',
    skills: ['Crime', 'Furtividade'],
    power: {
      name: 'O Crime Compensa',
      description: 'No final de uma missão, escolha um item encontrado. Na próxima missão, pode incluí-lo no inventário sem contar no limite de itens por patente.',
    },
    source: 'livro-basico',
  },
  {
    name: 'Cultista Arrependido',
    skills: ['Ocultismo', 'Religião'],
    power: {
      name: 'Traços do Outro Lado',
      description: 'Possui um poder paranormal à sua escolha. Porém, começa com metade da Sanidade normal para sua classe.',
    },
    source: 'livro-basico',
  },
  {
    name: 'Desgarrado',
    skills: ['Fortitude', 'Sobrevivência'],
    power: {
      name: 'Calejado',
      description: 'Recebe +1 PV para cada 5% de NEX.',
    },
    source: 'livro-basico',
  },
  {
    name: 'Engenheiro',
    skills: ['Profissão', 'Tecnologia'],
    power: {
      name: 'Ferramentas Favoritas',
      description: 'Um item à escolha (exceto armas) conta como uma categoria abaixo para você (ex: Cat. II → Cat. I).',
    },
    source: 'livro-basico',
  },
  {
    name: 'Executivo',
    skills: ['Diplomacia', 'Profissão'],
    power: {
      name: 'Processo Otimizado',
      description: 'Ao fazer testes em testes estendidos ou revisar documentos, pode gastar 2 PE para receber +5 nesse teste.',
    },
    source: 'livro-basico',
  },
  {
    name: 'Investigador',
    skills: ['Investigação', 'Percepção'],
    power: {
      name: 'Faro para Pistas',
      description: 'Uma vez por cena, ao procurar pistas, pode gastar 1 PE para receber +5 nesse teste.',
    },
    source: 'livro-basico',
  },
  {
    name: 'Lutador',
    skills: ['Luta', 'Reflexos'],
    power: {
      name: 'Mão Pesada',
      description: 'Recebe +2 em rolagens de dano corpo a corpo.',
    },
    source: 'livro-basico',
  },
  {
    name: 'Magnata',
    skills: ['Diplomacia', 'Pilotagem'],
    power: {
      name: 'Patrocinador da Ordem',
      description: 'Seu limite de crédito é sempre considerado um acima do atual.',
    },
    source: 'livro-basico',
  },
  {
    name: 'Mercenário',
    skills: ['Iniciativa', 'Intimidação'],
    power: {
      name: 'Posição de Combate',
      description: 'No primeiro turno de cada cena de ação, pode gastar 2 PE para receber uma ação de movimento adicional.',
    },
    source: 'livro-basico',
  },
  {
    name: 'Militar',
    skills: ['Pontaria', 'Tática'],
    power: {
      name: 'Para Bellum',
      description: 'Recebe +2 em rolagens de dano com armas de fogo.',
    },
    source: 'livro-basico',
  },
  {
    name: 'Operário',
    skills: ['Fortitude', 'Profissão'],
    power: {
      name: 'Ferramenta de Trabalho',
      description: 'Escolha uma arma simples/tática usável como ferramenta profissional. Recebe +1 em testes de ataque, dano e margem de ameaça com ela.',
    },
    source: 'livro-basico',
  },
  {
    name: 'Policial',
    skills: ['Percepção', 'Pontaria'],
    power: {
      name: 'Patrulha',
      description: 'Recebe +2 na Defesa.',
    },
    source: 'livro-basico',
  },
  {
    name: 'Religioso',
    skills: ['Religião', 'Vontade'],
    power: {
      name: 'Acalentar',
      description: 'Recebe +5 em Religião para acalmar. Ao acalmar alguém, essa pessoa recupera 1d6 + Presença pontos de Sanidade.',
    },
    source: 'livro-basico',
  },
  {
    name: 'Servidor Público',
    skills: ['Intuição', 'Vontade'],
    power: {
      name: 'Espírito Cívico',
      description: 'Ao fazer testes para ajudar, pode gastar 1 PE para aumentar o bônus concedido em +2.',
    },
    source: 'livro-basico',
  },
  {
    name: 'Teórico da Conspiração',
    skills: ['Investigação', 'Ocultismo'],
    power: {
      name: 'Eu Já Sabia',
      description: 'Recebe resistência a dano mental igual ao seu Intelecto.',
    },
    source: 'livro-basico',
  },
  {
    name: 'T.I.',
    skills: ['Investigação', 'Tecnologia'],
    power: {
      name: 'Motor de Busca',
      description: 'Com acesso à internet, pode gastar 2 PE para substituir qualquer teste de perícia por um teste de Tecnologia.',
    },
    source: 'livro-basico',
  },
  {
    name: 'Trabalhador Rural',
    skills: ['Adestramento', 'Sobrevivência'],
    power: {
      name: 'Desbravador',
      description: 'Não sofre penalidade de deslocamento e Sobrevivência por clima ruim ou terreno difícil natural.',
    },
    source: 'livro-basico',
  },
  {
    name: 'Trambiqueiro',
    skills: ['Crime', 'Enganação'],
    power: {
      name: 'Impostor',
      description: 'Uma vez por cena, pode gastar 2 PE para substituir qualquer teste de perícia por um teste de Enganação.',
    },
    source: 'livro-basico',
  },
  {
    name: 'Universitário',
    skills: ['Atualidades', 'Investigação'],
    power: {
      name: 'Dedicação',
      description: 'Recebe +1 PE, e mais +1 PE a cada NEX ímpar (15%, 25%...). O limite de PE por turno também aumenta em +1.',
    },
    source: 'livro-basico',
  },
  {
    name: 'Vítima',
    skills: ['Reflexos', 'Vontade'],
    power: {
      name: 'Cicatrizes Psicológicas',
      description: 'Recebe +1 Sanidade para cada 5% de NEX.',
    },
    source: 'livro-basico',
  },

  // ==================== SOBREVIVENDO AO HORROR (20 origens) ====================
  {
    name: 'Amigo dos Animais',
    skills: ['Adestramento', 'Percepção'],
    power: {
      name: 'Companheiro Animal',
      description: 'Possui um animal de estimação que auxilia em tarefas e investigações.',
    },
    source: 'sobrevivendo-ao-horror',
  },
  {
    name: 'Astronauta',
    skills: ['Ciências', 'Fortitude'],
    power: {
      name: 'Acostumado ao Extremo',
      description: 'Recebe +2 em Fortitude e pode prender o fôlego pelo dobro do tempo normal.',
    },
    source: 'sobrevivendo-ao-horror',
  },
  {
    name: 'Chef do Outro Lado',
    skills: ['Ocultismo', 'Profissão'],
    power: {
      name: 'Fome do Outro Lado',
      description: 'Pode preparar pratos com partes de criaturas paranormais para conceder bônus específicos ao grupo.',
    },
    source: 'sobrevivendo-ao-horror',
  },
  {
    name: 'Colegial',
    skills: ['Atualidades', 'Tecnologia'],
    power: {
      name: 'Poder da Amizade',
      description: 'Concede bônus quando você e seus aliados estão próximos e lutando juntos.',
    },
    source: 'sobrevivendo-ao-horror',
  },
  {
    name: 'Cosplayer',
    skills: ['Artes', 'Vontade'],
    power: {
      name: 'Não é Fantasia, é Cosplay',
      description: 'Pode usar fantasias para emular habilidades ou características de personagens fictícios.',
    },
    source: 'sobrevivendo-ao-horror',
  },
  {
    name: 'Diplomata',
    skills: ['Atualidades', 'Diplomacia'],
    power: {
      name: 'Conexões',
      description: 'Facilidade para conseguir contatos, favores e aliados durante missões.',
    },
    source: 'sobrevivendo-ao-horror',
  },
  {
    name: 'Explorador',
    skills: ['Fortitude', 'Sobrevivência'],
    power: {
      name: 'Manual do Sobrevivente',
      description: 'Bônus para navegar por ambientes perigosos e evitar armadilhas.',
    },
    source: 'sobrevivendo-ao-horror',
  },
  {
    name: 'Experimento',
    skills: ['Atletismo', 'Fortitude'],
    power: {
      name: 'Mutação',
      description: 'Foi alvo de experimentos, ganhando uma alteração física benéfica — mas com custo social.',
    },
    source: 'sobrevivendo-ao-horror',
  },
  {
    name: 'Fanático por Criaturas',
    skills: ['Investigação', 'Ocultismo'],
    power: {
      name: 'Conhecimento Oculto',
      description: 'Bônus para identificar e lidar com criaturas específicas.',
    },
    source: 'sobrevivendo-ao-horror',
  },
  {
    name: 'Fotógrafo',
    skills: ['Artes', 'Percepção'],
    power: {
      name: 'Através da Lente',
      description: 'Registra pistas visuais com precisão e analisa cenas de crime através de fotos.',
    },
    source: 'sobrevivendo-ao-horror',
  },
  {
    name: 'Inventor Paranormal',
    skills: ['Profissão', 'Vontade'],
    power: {
      name: 'Invenção Paranormal',
      description: 'Pode criar dispositivos improvisados que utilizam propriedades do Outro Lado.',
    },
    source: 'sobrevivendo-ao-horror',
  },
  {
    name: 'Jovem Místico',
    skills: ['Ocultismo', 'Religião'],
    power: {
      name: 'A Culpa é das Estrelas',
      description: 'Confia em astrologia e superstições, o que ocasionalmente altera sua sorte em testes.',
    },
    source: 'sobrevivendo-ao-horror',
  },
  {
    name: 'Legista do Turno da Noite',
    skills: ['Ciências', 'Medicina'],
    power: {
      name: 'Luto Habitual',
      description: 'Resistência maior a choques psicológicos ao ver cadáveres e cenas de morte.',
    },
    source: 'sobrevivendo-ao-horror',
  },
  {
    name: 'Mateiro',
    skills: ['Percepção', 'Sobrevivência'],
    power: {
      name: 'Mapa Celestial',
      description: 'Excelente senso de direção; capaz de guiar o grupo por florestas e locais isolados.',
    },
    source: 'sobrevivendo-ao-horror',
  },
  {
    name: 'Mergulhador',
    skills: ['Atletismo', 'Fortitude'],
    power: {
      name: 'Fôlego de Nadador',
      description: 'Bônus em testes físicos debaixo d\'água e maior mobilidade aquática.',
    },
    source: 'sobrevivendo-ao-horror',
  },
  {
    name: 'Motorista',
    skills: ['Pilotagem', 'Reflexos'],
    power: {
      name: 'Mãos no Volante',
      description: 'Bônus significativos ao pilotar veículos e em cenas de perseguição.',
    },
    source: 'sobrevivendo-ao-horror',
  },
  {
    name: 'Nerd Entusiasta',
    skills: ['Ciências', 'Tecnologia'],
    power: {
      name: 'O Inteligentão',
      description: 'Acumula conhecimentos de cultura pop e ciência, aplicando-os em testes variados.',
    },
    source: 'sobrevivendo-ao-horror',
  },
  {
    name: 'Profetizado',
    skills: ['Vontade', 'escolha'],
    power: {
      name: 'Luta ou Fuga',
      description: 'Sente que tem um destino a cumprir; recebe bônus em situações de vida ou morte.',
    },
    source: 'sobrevivendo-ao-horror',
  },
  {
    name: 'Psicólogo',
    skills: ['Intuição', 'Profissão'],
    power: {
      name: 'Terapia',
      description: 'Realiza sessões para ajudar aliados a recuperar Sanidade durante interlúdios.',
    },
    source: 'sobrevivendo-ao-horror',
  },
  {
    name: 'Repórter Investigativo',
    skills: ['Atualidades', 'Investigação'],
    power: {
      name: 'Encontrar a Verdade',
      description: 'Facilidade para extrair depoimentos e encontrar furos em histórias falsas.',
    },
    source: 'sobrevivendo-ao-horror',
  },

  // ==================== MATERIAIS EXTRAS (11 origens) ====================
  {
    name: 'Cientista Forense',
    skills: ['Ciências', 'Investigação'],
    power: {
      name: 'Investigação Científica',
      description: 'Bônus para analisar vestígios físicos e biológicos em cenas de crime.',
    },
    source: 'extras',
  },
  {
    name: 'Dublê',
    skills: ['Pilotagem', 'Reflexos'],
    power: {
      name: 'Destemido',
      description: 'Pode ignorar parcialmente danos de queda ou colisões por treinamento físico.',
    },
    source: 'extras',
  },
  {
    name: 'Escritor',
    skills: ['Artes', 'Atualidades'],
    power: {
      name: 'Bagagem de Leitura',
      description: 'Bônus em testes de conhecimento pela vasta quantidade de livros lidos.',
    },
    source: 'extras',
  },
  {
    name: 'Gaudério Abutre',
    skills: ['Luta', 'Pilotagem'],
    power: {
      name: 'Fraternidade Gaudéria',
      description: 'Bônus ao lutar ao lado de membros de sua gangue ou aliados próximos.',
    },
    source: 'extras',
  },
  {
    name: 'Ginasta',
    skills: ['Acrobacia', 'Reflexos'],
    power: {
      name: 'Mobilidade Acrobática',
      description: 'Aumenta sua Defesa e seu deslocamento em metros.',
    },
    source: 'extras',
  },
  {
    name: 'Jornalista',
    skills: ['Atualidades', 'Investigação'],
    power: {
      name: 'Fontes Confiáveis',
      description: 'Facilidade para obter informações sigilosas de contatos de imprensa.',
    },
    source: 'extras',
  },
  {
    name: 'Professor',
    skills: ['Ciências', 'Intuição'],
    power: {
      name: 'Aula de Campo',
      description: 'Instrui aliados para que recebam bônus temporários em perícias que você domina.',
    },
    source: 'extras',
  },
  {
    name: 'Revoltado',
    skills: ['Fortitude', 'Intimidação'],
    power: {
      name: 'Insatisfeito com os Padrões',
      description: 'Bônus em resistências físicas e mentais ao confrontar figuras de autoridade.',
    },
    source: 'extras',
  },
  {
    name: 'Body Builder',
    skills: ['Atletismo', 'Fortitude'],
    power: {
      name: 'Saindo da Jaula',
      description: 'Bônus em testes de força bruta e intimidação física.',
    },
    source: 'extras',
  },
  {
    name: 'Personal Trainer',
    skills: ['Atletismo', 'Ciências'],
    power: {
      name: 'Todo Mundo Pagando 10',
      description: 'Motiva aliados a superarem seus limites físicos temporariamente.',
    },
    source: 'extras',
  },
  {
    name: 'Blaster',
    skills: ['Ciências', 'Profissão'],
    power: {
      name: 'Plantando Explosivos',
      description: 'Facilidade para manusear, fabricar e programar explosivos em campo.',
    },
    source: 'extras',
  },
];

// Tipo do atributo de skill
export type SkillAttribute = 'forca' | 'agilidade' | 'intelecto' | 'presenca' | 'vigor';

// Mapeamento de perícia para atributo
export const SKILL_TO_ATTRIBUTE: Record<string, SkillAttribute> = {
  // Força
  'Atletismo': 'forca',
  'Luta': 'forca',
  
  // Agilidade
  'Acrobacia': 'agilidade',
  'Crime': 'agilidade',
  'Furtividade': 'agilidade',
  'Iniciativa': 'agilidade',
  'Pilotagem': 'agilidade',
  'Pontaria': 'agilidade',
  'Reflexos': 'agilidade',
  
  // Intelecto
  'Atualidades': 'intelecto',
  'Ciências': 'intelecto',
  'Investigação': 'intelecto',
  'Medicina': 'intelecto',
  'Ocultismo': 'intelecto',
  'Profissão': 'intelecto',
  'Sobrevivência': 'intelecto',
  'Tática': 'intelecto',
  'Tecnologia': 'intelecto',
  
  // Presença
  'Adestramento': 'presenca',
  'Artes': 'presenca',
  'Diplomacia': 'presenca',
  'Enganação': 'presenca',
  'Intimidação': 'presenca',
  'Intuição': 'presenca',
  'Percepção': 'presenca',
  'Religião': 'presenca',
  
  // Vigor
  'Fortitude': 'vigor',
  'Vontade': 'vigor',
};

// Lista de todas as perícias disponíveis
export const ALL_SKILLS = Object.keys(SKILL_TO_ATTRIBUTE);

// Helper para obter origem por nome
export function getOriginByName(name: string): Origin | undefined {
  return ORIGINS.find(o => o.name === name);
}

// Helper para verificar se uma perícia é "escolha"
export function isChoiceSkill(skill: string): boolean {
  return skill === 'escolha';
}

// Helper para contar quantas escolhas uma origem tem
export function countChoices(origin: Origin): number {
  return origin.skills.filter(s => s === 'escolha').length;
}
