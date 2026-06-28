SPEC_09_CHAR_PERICIAS.md

Nexus do Mestre — Aba: Perícias (Redesign)
1. Regras de Ordem Paranormal — Referência Rápida
Atributos e Dados
Atributo	Dado	Descrição
Força (FOR)	d4 – d20	Poder físico bruto
Agilidade (AGI)	d4 – d20	Velocidade, precisão
Intelecto (INT)	d4 – d20	Raciocínio, memória
Presença (PRE)	d4 – d20	Carisma, força de vontade
Vigor (VIG)	d4 – d20	Resiliência, saúde
Como funciona o teste
Rolagem: dado do atributo + bônus total
Treinamento na perícia concede +5 ao teste
Especialização (se houver) concede +5 adicional
Cada dois pontos de bônus em perícias específicas somam ao teste
Lista oficial de Perícias por Atributo
Atributo	Perícias
Força	Atletismo, Luta
Agilidade	Acrobacia, Furtividade, Pilotagem, Pontaria, Reflexos
Intelecto	Atualidades, Ciências, Crimes, Investigação, Medicina, Ocultismo, Percepção, Tecnologia
Presença	Artes, Diplomacia, Enganação, Intuição, Liderança, Persuasão
Vigor	Fortitude
2. Banco de Dados — Atualizações
Tabela CharacterSkill — ATUALIZADA
id, characterId
name *
attribute *: 'forca' | 'agilidade' | 'intelecto' | 'presenca' | 'vigor'
isTrained: Boolean (default false)    -- treinamento (+5)
hasSpecialization: Boolean (default false) -- especialização (+5 adicional)
specializationName: String?           -- nome da especialização (ex: "Armas de Fogo")
bonusModifier: Int (default 0)        -- bônus/penalidade adicional
isOfficial: Boolean (default true)    -- true = perícia oficial do sistema
Cálculo do total para exibição
total = (isTrained ? 5 : 0) + (hasSpecialization ? 5 : 0) + bonusModifier
3. UI — Layout da Aba Perícias
3.1 Visão Geral
O layout é dividido em 5 colunas — uma por atributo — dispostas em grid responsivo:

Desktop (≥1280px): 5 colunas lado a lado
Tablet (768–1279px): 3 + 2 colunas
Mobile (<768px): 1 coluna em accordion
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   FORÇA      │ │  AGILIDADE   │ │  INTELECTO   │ │  PRESENÇA    │ │   VIGOR      │
│              │ │              │ │              │ │              │ │              │
│   [d8]  ●    │ │   [d6]  ○    │ │   [d12] ●   │ │   [d8]  ○    │ │   [d4]  ○    │
│              │ │              │ │              │ │              │ │              │
│ Perícias...  │ │ Perícias...  │ │ Perícias...  │ │ Perícias...  │ │ Perícias...  │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
3.2 Header de Coluna de Atributo
┌──────────────────────────────┐
│                              │
│       ⬡  d12                 │
│    INTELECTO                 │
│                              │
│   Bônus do atributo: +0      │
│                              │
│   [🎲 Rolar atributo puro]   │
└──────────────────────────────┘
O hexágono com o dado é o DiceDisplay visual grande (destaque da coluna)
Cor do header varia por atributo:
Força: vermelho #7f1d1d
Agilidade: verde #14532d
Intelecto: azul #1e3a8a
Presença: roxo #4c1d95
Vigor: laranja #78350f
4. Card de Perícia — Design Detalhado
┌──────────────────────────────────────────────┐
│  ● Investigação                   Total: +8  │
│                                              │
│  🏅 Treinado (+5)  ✨ Esp: "Cenas de Crime" │
│                                              │
│  Bônus extra:  [+3 ▾]                        │
│                                              │
│  [🎲 Rolar: d12 +8]                          │
└──────────────────────────────────────────────┘
Estados visuais do card
Não treinado, sem bônus:

┌──────────────────────────────────────────────┐
│  ○ Percepção                      Total: +0  │
│                                              │
│  Sem treinamento                             │
│  [🎲 Rolar: d12 +0]        [+ Treinar] [admin]│
└──────────────────────────────────────────────┘
Treinado, sem especialização:

┌──────────────────────────────────────────────┐
│  ● Ocultismo                      Total: +5  │
│                                              │
│  🏅 Treinado (+5)                            │
│  [🎲 Rolar: d12 +5]   [+ Especializar] [admin]│
└──────────────────────────────────────────────┘
Treinado com especialização:

┌──────────────────────────────────────────────┐
│  ◉ Crimes                        Total: +10  │
│                                              │
│  🏅 Treinado (+5)  ✨ Esp: "Investigação"    │
│  [🎲 Rolar: d12 +10]                         │
└──────────────────────────────────────────────┘
Com penalidade:

┌──────────────────────────────────────────────┐
│  ● Furtividade               Total: +5 − 2  │
│                              ⚠️ Total: +3    │
│  🏅 Treinado (+5)                            │
│  ⚠️ Penalidade armadura: −2                  │
│  [🎲 Rolar: d6 +3]                           │
└──────────────────────────────────────────────┘
Ícones de estado da perícia
○ = Não treinada (sem preenchimento)
● = Treinada
◉ = Treinada + Especialização
5. Interações de Edição [admin]
Treinar / Destreinar
Clique no ícone ○ / ● alterna o treinamento diretamente (sem modal)
Registra AuditLog
Adicionar/Remover Especialização
Clique em "[+ Especializar]" abre inline um input pequeno:
  Especialização em: [________________]  [✓] [✕]
Nome da especialização aparece no badge do card
Clique no badge da especialização abre o mesmo input para editar
Bônus Extra
Campo numérico inline no card (seta para cima/baixo ou digitar diretamente)
Aceita negativos (penalidades)
Tooltip explica: "Bônus ou penalidade adicional de equipamentos, condições, etc."
Botão de Rolar
Abre o DiceRoller pré-preenchido com {dado do atributo} + {total}
Exemplo: d12+8
O resultado aparece com breakdown: [d12 = 5] + [Treinamento +5] + [Extra +3] = 13
6. Footer da Aba — Painel de Adição [admin]
Abaixo de todas as colunas, um painel expandível:

[▼ Adicionar Perícia Personalizada]
Ao expandir:

┌────────────────────────────────────────────────────────────────┐
│  Nome da Perícia: [_____________________]                      │
│  Atributo:        [Intelecto ▾]                                │
│  Treinado:        [toggle]                                     │
│                                                                │
│  (Perícias oficiais do sistema são adicionadas automaticamente │
│   quando o personagem é criado. Use este campo para perícias   │
│   customizadas ou específicas de campanha.)                    │
│                                                                │
│  [Adicionar]                                                   │
└────────────────────────────────────────────────────────────────┘
Observação: As 19 perícias oficiais do sistema devem ser pré-populadas automaticamente na criação do personagem, todas com isTrained: false e bonusModifier: 0.

7. Tooltip de Rolagem (hover no botão 🎲)
Ao passar o mouse no botão de rolar de qualquer perícia:

┌──────────────────────────────────┐
│  🎲 Rolar Investigação           │
│                                  │
│  Intelecto:      d12             │
│  Treinado:       +5              │
│  Especialização: +5 (Crimes)     │
│  Bônus extra:    +3              │
│  ─────────────────────           │
│  Total:          d12 + 13        │
└──────────────────────────────────┘
8. Responsividade Mobile (Accordion)
Em telas pequenas, cada atributo vira um accordion:

[▼ INTELECTO — d12]
  ● Investigação .............. +10  [🎲]
  ● Ocultismo ................. +5   [🎲]
  ○ Percepção ................. +0   [🎲]
  ○ Medicina .................. +0   [🎲]
  ...

[▶ PRESENÇA — d8]
[▶ FORÇA — d4]
...
9. Pré-população Automática
Ao criar um novo personagem, o sistema deve criar automaticamente as 19 perícias oficiais:

typescript
const PERICIAS_OFICIAIS = [
  { name: 'Atletismo',   attribute: 'forca' },
  { name: 'Luta',        attribute: 'forca' },
  { name: 'Acrobacia',   attribute: 'agilidade' },
  { name: 'Furtividade', attribute: 'agilidade' },
  { name: 'Pilotagem',   attribute: 'agilidade' },
  { name: 'Pontaria',    attribute: 'agilidade' },
  { name: 'Reflexos',    attribute: 'agilidade' },
  { name: 'Atualidades', attribute: 'intelecto' },
  { name: 'Ciências',    attribute: 'intelecto' },
  { name: 'Crimes',      attribute: 'intelecto' },
  { name: 'Investigação',attribute: 'intelecto' },
  { name: 'Medicina',    attribute: 'intelecto' },
  { name: 'Ocultismo',   attribute: 'intelecto' },
  { name: 'Percepção',   attribute: 'intelecto' },
  { name: 'Tecnologia',  attribute: 'intelecto' },
  { name: 'Artes',       attribute: 'presenca' },
  { name: 'Diplomacia',  attribute: 'presenca' },
  { name: 'Enganação',   attribute: 'presenca' },
  { name: 'Intuição',    attribute: 'presenca' },
  { name: 'Liderança',   attribute: 'presenca' },
  { name: 'Persuasão',   attribute: 'presenca' },
  { name: 'Fortitude',   attribute: 'vigor' },
]

