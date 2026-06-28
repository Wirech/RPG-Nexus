SPEC_08_CHAR_INVENTARIO.md

Nexus do Mestre — Aba: Inventário (Redesign)
1. Visão Geral
O inventário passa a ter:

Sistema de tipos de item com campos específicos por tipo
Sistema de locais — onde cada item está fisicamente
View por local e view por tipo alternáveis
2. Banco de Dados
Tabela InventoryItem — ATUALIZADA
id, characterId
name *
itemType *: 'arma' | 'protecao' | 'equipamento' | 'consumivel' | 'municao' | 'outros'
quantity: Int (default 1)
description: String?
weight: Float?
location: String (default 'equipado')
locationCustomName: String? (nome livre para locais customizados)
isEquipped: Boolean (default false)
notes: String?

-- ARMA:
wDamage: String?          -- ex: "2d6+2"
wDamageType: String?      -- 'corte'|'impacto'|'perfuracao'|'balistico'|'fogo'|'eletrico'|'paranormal'
wRange: String?           -- 'corpo_a_corpo'|'curto'|'medio'|'longo'|'extremo'
wCritical: String?        -- ex: "20/×2"
wProperties: JSON?        -- ex: ["Leve", "Versátil", "Munição"]
wCurrentAmmo: Int?
wMaxAmmo: Int?
wAmmoType: String?        -- referência ao tipo de munição usada
wTestAttribute: String?   -- 'forca' | 'agilidade' (para rolar o teste)
wTestSkill: String?       -- ex: 'luta' | 'pontaria'
wExtraDamageOnCrit: String? -- dano extra no crítico, ex: "+1d6"

-- PROTEÇÃO:
pArmorType: String?       -- 'leve'|'pesada'|'escudo'|'improviso'
pDefenseBonus: Int?       -- bônus de Defesa
pAgilityPenalty: Int?     -- penalidade de AGI (negativo)
pDiscreetPenalty: Int?    -- penalidade em Furtividade
pProperties: JSON?        -- ex: ["Silenciosa", "Resistente"]

-- CONSUMÍVEL:
cEffect: String?          -- efeito ao usar (ex: "Recupera 1d6 PV")
cDiceNotation: String?    -- para rolar o efeito (ex: "1d6")
cUsesPerItem: Int?        -- usos por unidade (ex: Kit Médico = 3 usos)
cCurrentUses: Int?

-- MUNIÇÃO:
aAmmoType: String?        -- 'bala_9mm'|'bala_12'|'flecha'|'dardo'|'customizado'
aQuantity: Int?

createdAt, updatedAt
Tabela InventoryLocation (locais personalizados por personagem)
id, characterId
name *         -- ex: "Apartamento", "Carro", "Cofre da Ordo"
icon: String?  -- emoji ou nome de ícone
color: String? -- cor hex
order: Int
3. Locais Padrão
Locais fixos (não podem ser deletados, apenas o nome do personagem pode variar):

ID	Nome Padrão	Ícone	Cor
equipado	Equipado	⚔️	verde
mochila	Mochila / Carregando	🎒	azul
seguro	Local Seguro	🏠	cinza
emprestado	Emprestado	🤝	amarelo
Além desses, o admin pode criar locais customizados por personagem (ex: "Porta-malas do carro", "Cofre da Ordo Realitas").

4. UI — Layout Principal
4.1 Header com controles
┌──────────────────────────────────────────────────────────────────┐
│  🎒 Inventário                                [+ Adicionar Item] │
│                                                                  │
│  Visualizar por:  [● Por Local]  [○ Por Tipo]  [○ Lista Simples] │
│                                                                  │
│  Carga: ██████████░░░░░ 12.4 / 20.0 kg    [Editar carga máx.]   │
└──────────────────────────────────────────────────────────────────┘
4.2 View "Por Local" (padrão)
⚔️ EQUIPADO  ────────────────────────────────── (3 itens)
  [card arma] [card arma] [card proteção]

🎒 MOCHILA / CARREGANDO  ───────────────────────(5 itens)
  [card item] [card consumivel] [card consumivel] ...

🏠 LOCAL SEGURO  ────────────────────────────── (2 itens)
  [card equipamento] [card municao]

📦 COFRE DA ORDO  ──────────── (local custom)── (1 item)
  [card item]

[+ Novo Local]  [admin]
4.3 View "Por Tipo"
Mesma estrutura, mas agrupado por tipo (Armas, Proteções, Consumíveis, etc.)

5. Cards de Item por Tipo
5.1 Card — Arma
┌─────────────────────────────────────────────────────┐
│  🗡️ ARMA · Corpo a Corpo           [Equipado ✓]     │
│                                                     │
│  Faca de Combate                         [⋮ menu]  │
│  ────────────────────────────────────────────────   │
│  Dano: 1d4+2   Tipo: Perfuração   Crít: 19-20/×2   │
│  Propriedades: Leve, Arremessável                   │
│                                                     │
│  [🎲 Rolar Ataque: AGI + Luta]  [🎲 Rolar Dano: 1d4+2] │
└─────────────────────────────────────────────────────┘
Para armas com munição:

│  Munição: ████████░░ 8/15    [-] [+]   [Recarregar]  │
5.2 Card — Proteção
┌─────────────────────────────────────────────────────┐
│  🛡️ PROTEÇÃO · Pesada              [Equipado ✓]     │
│                                                     │
│  Colete Balístico                        [⋮ menu]  │
│  ────────────────────────────────────────────────   │
│  Defesa: +4    Penalidade AGI: -1                   │
│  Penalidade Furtividade: -2                         │
│  Propriedades: Resistente a Balístico               │
└─────────────────────────────────────────────────────┘
5.3 Card — Consumível
┌─────────────────────────────────────────────────────┐
│  💊 CONSUMÍVEL                    Qtd: 3  [−] [+]   │
│                                                     │
│  Kit de Primeiros Socorros               [⋮ menu]  │
│  ────────────────────────────────────────────────   │
│  Efeito: Recupera 1d6+2 PV                          │
│  Usos por kit: ●●○  2/3                             │
│                                                     │
│  [🎲 Usar: 1d6+2 PV]                                │
└─────────────────────────────────────────────────────┘
Botão "Usar": rola o dado, exibe resultado, e decrementa usos/quantidade. Pergunta se deve aplicar ao PV do personagem.

5.4 Card — Munição
┌─────────────────────────────────────────────────────┐
│  🔫 MUNIÇÃO                                         │
│                                                     │
│  Balas 9mm                               [⋮ menu]  │
│  ────────────────────────────────────────────────   │
│  Tipo: Bala 9mm     Quantidade: 47  [−] [+]         │
└─────────────────────────────────────────────────────┘
5.5 Card — Equipamento / Outros
┌─────────────────────────────────────────────────────┐
│  🔦 EQUIPAMENTO                   0.5 kg            │
│                                                     │
│  Lanterna Tática                         [⋮ menu]  │
│  ────────────────────────────────────────────────   │
│  Qtd: 1                                             │
│  Ilumina até 10 metros.                             │
└─────────────────────────────────────────────────────┘
6. Menu de Contexto do Item (⋮)
• Editar item
• Mover para → [submenu com todos os locais]
• Equipar / Desequipar
• Duplicar item
• ─────────────
• Remover do inventário  (com ConfirmDialog)
"Mover para" é a forma principal de mudar o local de um item.

7. Modal de Adição/Edição de Item
Passo 1 — Escolher tipo
┌────────────────────────────────────────────────────────┐
│  Que tipo de item você quer adicionar?                 │
│                                                        │
│   🗡️ Arma      🛡️ Proteção    💊 Consumível           │
│   🔫 Munição   🔧 Equipamento  📦 Outros               │
└────────────────────────────────────────────────────────┘
Passo 2 — Formulário específico por tipo
Formulário de Arma:

Nome *
Descrição
Local inicial: select (Equipado / Mochila / ...)

── Estatísticas ─────────────────────────────────────────
Dano *:           [1d4+2      ]  ex: 2d6, 1d8+3
Tipo de Dano *:   [Perfuração ▾]
Alcance *:        [Corpo a Corpo ▾]
Crítico:          [20/×2      ]  ex: 19-20/×2
Atributo de teste:[Agilidade  ▾]
Perícia de teste: [Pontaria   ▾]

── Munição ──────────────────────────────────────────────
Usa munição? [toggle]
  Tipo de munição: [Bala 9mm ▾]
  Munição atual:   [15]
  Capacidade:      [15]

── Propriedades ─────────────────────────────────────────
[+ Adicionar propriedade]  ex: Leve, Versátil, Semi-auto
(chips editáveis)

── Extra ─────────────────────────────────────────────────
Dano extra no crítico: [        ]  ex: +1d6
Peso (kg):             [0.8     ]
Notas:                 [        ]
Formulário de Proteção:

Nome *
Descrição
Local inicial: select

── Estatísticas ─────────────────────────────────────────
Tipo de Proteção *: [Leve ▾] / [Pesada ▾] / [Escudo ▾]
Bônus de Defesa *:  [+2]
Penalidade AGI:     [-1]     (0 se nenhuma)
Penalidade Furtividade: [-2] (0 se nenhuma)

── Propriedades ─────────────────────────────────────────
[+ Adicionar propriedade]

Peso (kg): [5.0]
Notas:     [   ]
Formulário de Consumível:

Nome *
Descrição
Local inicial: select
Quantidade: [1]

── Efeito ────────────────────────────────────────────────
Efeito ao usar:    [Recupera 1d6+2 PV    ]
Notação de dado:   [1d6+2               ]  (para rolar)
Usos por unidade:  [1] (1 = item se esgota ao usar)
Usos atuais:       [1]

Peso (kg): [0.2]
8. Sistema de Rolagem de Ataque (Armas)
Ao clicar em "🎲 Rolar Ataque" em um card de arma:

┌──────────────────────────────────────────┐
│  🎲 Teste de Ataque — Faca de Combate    │
│  ──────────────────────────────────────  │
│  Atributo: Agilidade (d8)                │
│  Perícia:  Luta (+3)                     │
│                                          │
│  Modificador adicional: [+0]             │
│  Oponente em cobertura: [toggle]         │
│  Ataque furtivo:        [toggle]         │
│                                          │
│  [🎲 Rolar!]                             │
│                                          │
│  Resultado: [d8=6] + [Luta +3] = 9      │
│             ✅ Sucesso se CD ≤ 9         │
│                                          │
│  [🎲 Rolar Dano: 1d4+2]                 │
└──────────────────────────────────────────┘
Ao rolar o dano, o resultado é exibido com destaque e pergunta se deve ser aplicado a alguém (lista de participantes do combate ativo, se houver).

9. Barra de Carga
Calculada automaticamente com a soma de weight × quantity de todos os itens "equipados" + "mochila"
Itens em "local seguro" e "emprestado" não contam na carga
Carga máxima: configurável no personagem (padrão: Vigor × 5 kg)
Visual:
0–50%: verde
50–80%: amarelo
80–100%: laranja
100%: vermelho + ícone ⚠️ "Sobrecarregado"

