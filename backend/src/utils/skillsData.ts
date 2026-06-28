// Dados oficiais de perícias e locais de inventário para seed

export interface SkillData {
  name: string;
  attribute: 'forca' | 'agilidade' | 'intelecto' | 'presenca' | 'vigor';
}

export interface LocationData {
  name: string;
  icon: string;
  color: string;
}

// As 22 perícias oficiais do Ordem Paranormal
export const PERICIAS_OFICIAIS: SkillData[] = [
  // FORÇA (3)
  { name: 'Atletismo', attribute: 'forca' },
  { name: 'Luta', attribute: 'forca' },
  { name: 'Intimidação', attribute: 'forca' },
  
  // AGILIDADE (5)
  { name: 'Acrobacia', attribute: 'agilidade' },
  { name: 'Furtividade', attribute: 'agilidade' },
  { name: 'Pilotagem', attribute: 'agilidade' },
  { name: 'Pontaria', attribute: 'agilidade' },
  { name: 'Reflexos', attribute: 'agilidade' },
  
  // INTELECTO (8)
  { name: 'Atualidades', attribute: 'intelecto' },
  { name: 'Ciências', attribute: 'intelecto' },
  { name: 'Crimes', attribute: 'intelecto' },
  { name: 'Investigação', attribute: 'intelecto' },
  { name: 'Medicina', attribute: 'intelecto' },
  { name: 'Ocultismo', attribute: 'intelecto' },
  { name: 'Percepção', attribute: 'intelecto' },
  { name: 'Tecnologia', attribute: 'intelecto' },
  
  // PRESENÇA (6)
  { name: 'Artes', attribute: 'presenca' },
  { name: 'Diplomacia', attribute: 'presenca' },
  { name: 'Enganação', attribute: 'presenca' },
  { name: 'Intuição', attribute: 'presenca' },
  { name: 'Liderança', attribute: 'presenca' },
  { name: 'Persuasão', attribute: 'presenca' },
  
  // VIGOR (1)
  { name: 'Fortitude', attribute: 'vigor' },
];

// Os 4 locais de inventário padrão
export const LOCAIS_PADRAO: LocationData[] = [
  { name: 'Equipado', icon: '🎒', color: '#22c55e' },
  { name: 'Mochila', icon: '💼', color: '#3b82f6' },
  { name: 'Veículo', icon: '🚗', color: '#f97316' },
  { name: 'Esconderijo', icon: '📦', color: '#8b5cf6' },
];

// Dados para seed do compêndio de habilidades
export const HABILIDADES_SEED = [
  // COMBATENTE
  {
    name: 'Especialista em Combate',
    description: 'Você é treinado em diversas formas de combate. Você recebe +2 em testes de ataque.',
    trilha: 'Combatente',
    nex: '5%',
    actionType: 'passiva',
    peCost: 0,
  },
  {
    name: 'Ataque Brutal',
    description: 'Quando você acerta um ataque corpo a corpo, pode gastar 1 PE para causar +1d6 de dano.',
    trilha: 'Combatente',
    nex: '15%',
    actionType: 'acao_padrao',
    peCost: 1,
  },
  {
    name: 'Rajada',
    description: 'Você pode realizar dois ataques com uma ação padrão, sofrendo -1 em cada teste. Limite de 3 usos por cena.',
    trilha: 'Combatente',
    nex: '25%',
    actionType: 'acao_padrao',
    peCost: 2,
    usesPerScene: 3,
  },
  {
    name: 'Golpe Poderoso',
    description: 'Ao acertar um ataque, você pode gastar 2 PE para dobrar seu dado de dano.',
    trilha: 'Combatente',
    nex: '40%',
    actionType: 'acao_padrao',
    peCost: 2,
  },
  
  // ESPECIALISTA
  {
    name: 'Perito',
    description: 'Escolha duas perícias. Você recebe +5 em testes dessas perícias.',
    trilha: 'Especialista',
    nex: '5%',
    actionType: 'passiva',
    peCost: 0,
  },
  {
    name: 'Eclético',
    description: 'Você pode fazer testes de qualquer perícia mesmo sem treinamento, sem sofrer o penalidade de -5.',
    trilha: 'Especialista',
    nex: '15%',
    actionType: 'passiva',
    peCost: 0,
  },
  {
    name: 'Adaptável',
    description: 'Uma vez por cena, você pode refazer um teste de perícia recém realizado.',
    trilha: 'Especialista',
    nex: '25%',
    actionType: 'reacao',
    peCost: 2,
    usesPerScene: 1,
  },
  
  // OCULTISTA
  {
    name: 'Afinidade Paranormal',
    description: 'Você aprende dois rituais de 1º círculo à sua escolha.',
    trilha: 'Ocultista',
    nex: '5%',
    actionType: 'passiva',
    peCost: 0,
  },
  {
    name: 'Resistência Paranormal',
    description: 'Você recebe +2 em testes de resistência contra efeitos paranormais.',
    trilha: 'Ocultista',
    nex: '15%',
    actionType: 'passiva',
    peCost: 0,
  },
  {
    name: 'Canalização Eficiente',
    description: 'Uma vez por cena, você pode conjurar um ritual sem gastar PE.',
    trilha: 'Ocultista',
    nex: '25%',
    actionType: 'acao_padrao',
    peCost: 0,
    usesPerScene: 1,
  },
];

// Dados para seed do compêndio de rituais
export const RITUAIS_SEED = [
  // SANGUE
  {
    name: 'Cicatrização',
    description: 'Um ritual básico de cura usando sangue.',
    effectDescription: 'Você canaliza energia vital para curar ferimentos. O alvo recupera 1d6 pontos de vida.',
    element: 'Sangue',
    circle: 1,
    executionTime: 'padrao',
    range: 'toque',
    duration: 'imediato',
    resistance: 'nenhuma',
    peCost: 2,
    nex: '15%',
    components: '["Gota de sangue"]',
  },
  {
    name: 'Drenar Vitalidade',
    description: 'Drena a vida de um alvo para si mesmo.',
    effectDescription: 'Você drena a força vital do alvo. Causa 2d6 de dano e você recupera metade do dano causado como PV.',
    element: 'Sangue',
    circle: 2,
    executionTime: 'padrao',
    range: 'curto',
    duration: 'imediato',
    resistance: 'fortitude',
    peCost: 5,
    nex: '50%',
    components: '["Sangue fresco", "Símbolo de sangue"]',
  },
  
  // MORTE
  {
    name: 'Despedaçar',
    description: 'Projeta energia necrótica que destrói tecido vivo.',
    effectDescription: 'Uma onda de energia negra atinge o alvo, causando 2d6 de dano de morte.',
    element: 'Morte',
    circle: 1,
    executionTime: 'padrao',
    range: 'medio',
    duration: 'imediato',
    resistance: 'fortitude',
    peCost: 2,
    nex: '15%',
    components: '["Osso humano"]',
  },
  {
    name: 'Toque da Morte',
    description: 'Seu toque carrega a frieza do além.',
    effectDescription: 'Ao tocar um alvo, você canaliza energia da morte. Causa 3d8 de dano necrótico e o alvo fica debilitado por 1 rodada.',
    element: 'Morte',
    circle: 2,
    executionTime: 'padrao',
    range: 'toque',
    duration: 'imediato',
    resistance: 'fortitude',
    peCost: 6,
    nex: '50%',
    components: '["Cinzas de morto", "Símbolo mortuário"]',
  },
  
  // ENERGIA
  {
    name: 'Choque',
    description: 'Dispara um arco de eletricidade.',
    effectDescription: 'Um raio de eletricidade atinge o alvo, causando 1d8 de dano elétrico.',
    element: 'Energia',
    circle: 1,
    executionTime: 'padrao',
    range: 'curto',
    duration: 'imediato',
    resistance: 'reflexos',
    peCost: 1,
    nex: '15%',
    components: '[]',
  },
  {
    name: 'Relâmpago',
    description: 'Convoca um poderoso raio dos céus.',
    effectDescription: 'Um relâmpago cai sobre o alvo, causando 4d6 de dano elétrico. Pode atingir alvos em área de 3m.',
    element: 'Energia',
    circle: 2,
    executionTime: 'padrao',
    range: 'longo',
    duration: 'imediato',
    resistance: 'reflexos',
    peCost: 5,
    nex: '50%',
    components: '["Fragmento de metal"]',
  },
  
  // CONHECIMENTO
  {
    name: 'Visão do Oculto',
    description: 'Permite enxergar através de ilusões e invisibilidade.',
    effectDescription: 'Seus olhos brilham levemente. Por uma cena, você pode ver criaturas e objetos invisíveis e perceber ilusões automaticamente.',
    element: 'Conhecimento',
    circle: 1,
    executionTime: 'padrao',
    range: 'pessoal',
    duration: 'cena',
    resistance: 'nenhuma',
    peCost: 2,
    nex: '15%',
    components: '["Lente de cristal"]',
  },
  {
    name: 'Leitura Mental',
    description: 'Lê os pensamentos superficiais de um alvo.',
    effectDescription: 'Você consegue ler os pensamentos superficiais do alvo por até 1 minuto. O alvo não percebe a intrusão a menos que passe em Vontade.',
    element: 'Conhecimento',
    circle: 2,
    executionTime: 'completa',
    range: 'curto',
    duration: 'sustentado',
    resistance: 'vontade',
    peCost: 4,
    nex: '50%',
    components: '["Incenso aromático"]',
  },
  
  // MEDO
  {
    name: 'Sussurros Perturbadores',
    description: 'Vozes sussurram horrores na mente do alvo.',
    effectDescription: 'O alvo ouve sussurros aterrorizantes. Sofre -2 em todos os testes pela próxima rodada.',
    element: 'Medo',
    circle: 1,
    executionTime: 'padrao',
    range: 'curto',
    duration: 'imediato',
    resistance: 'vontade',
    peCost: 1,
    nex: '15%',
    components: '[]',
  },
  {
    name: 'Terror Absoluto',
    description: 'Invoca o medo mais profundo do alvo.',
    effectDescription: 'O alvo é confrontado com seu pior pesadelo. Fica apavorado por 1d4 rodadas e sofre 1d6 de dano de sanidade.',
    element: 'Medo',
    circle: 2,
    executionTime: 'padrao',
    range: 'medio',
    duration: 'imediato',
    resistance: 'vontade',
    peCost: 5,
    nex: '50%',
    components: '["Fragmento de espelho quebrado"]',
  },
];
