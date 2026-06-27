SPEC_04_FRONTEND.md

Nexus do Mestre — Especificação do Frontend
1. Configuração Base
Framework:     React 18 + TypeScript
Build:         Vite
Estilo:        Tailwind CSS + shadcn/ui
Roteamento:    React Router v6
Estado global: Zustand
HTTP:          Axios (instância configurada com baseURL e interceptor de JWT)
WebSocket:     socket.io-client
Editor:        TipTap (histórico e texto rico)
Notificações:  react-hot-toast
Tema:          Dark mode obrigatório (tema sombrio, inspirado em horror investigativo)
Paleta de cores sugerida:

Background:    #0f0f13
Surface:       #1a1a24
Border:        #2a2a3a
Accent:        #7c3aed (roxo paranormal)
Danger:        #dc2626
Warning:       #d97706
Success:       #16a34a
Text:          #e2e8f0
Muted:         #64748b
2. Estrutura de Rotas (React Router)
/login                    → <LoginPage />
/request-access           → <AccessRequestPage />
/pending                  → <PendingApprovalPage /> (aguardando aprovação)

/                         → <DashboardPage />        [auth]
/characters               → <CharactersPage />       [auth]
/characters/:id           → <CharacterSheetPage />   [auth]
/monsters                 → <MonstersPage />          [admin]
/monsters/:id             → <MonsterSheetPage />      [admin]
/environments             → <EnvironmentsPage />      [auth]
/environments/:id         → <EnvironmentPage />       [auth]
/documents                → <DocumentsPage />         [auth]
/documents/:id            → <DocumentPage />          [auth]
/combat                   → <CombatListPage />        [admin]
/combat/:id               → <CombatTrackerPage />     [auth]
/sessions                 → <SessionNotesPage />      [admin]
/sessions/:id             → <SessionNoteDetailPage /> [admin]
/audit                    → <AuditLogPage />           [admin]
/users                    → <UserManagementPage />     [admin]
3. Stores Zustand
authStore.ts
typescript
interface AuthStore {
  user: { id, username, role, linkedCharacterId } | null
  token: string | null
  isAuthenticated: boolean
  login: (username, password) => Promise<void>
  logout: () => void
  setUser: (user) => void
}
// Persiste token no localStorage
// Interceptor do Axios lê o token daqui e injeta no header
notificationStore.ts
typescript
interface NotificationStore {
  pendingRequests: AccessRequest[]
  addPendingRequest: (req: AccessRequest) => void
  removePendingRequest: (userId: string) => void
}
// Alimentado pelos eventos WebSocket
combatStore.ts
typescript
interface CombatStore {
  activeCombat: CombatSession | null
  participants: CombatParticipant[]
  events: CombatEvent[]
  setActiveCombat: (combat) => void
  updateParticipant: (participantId, changes) => void
  addEvent: (event) => void
  setRound: (round) => void
}
4. Hook useSocket.ts
typescript
// Conecta ao socket.io com o token JWT
// Identifica o socket via evento 'auth:identify'
// Escuta e despacha eventos relevantes:
//   - 'access:new_request' → notificationStore.addPendingRequest + toast
//   - 'access:approved'    → authStore.setUser (atualiza role)
//   - 'access:rejected'    → redireciona para /pending com mensagem
//   - 'combat:updated'     → combatStore.updateParticipant
//   - 'combat:event'       → combatStore.addEvent
//   - 'combat:round_change'→ combatStore.setRound
// Exporta função joinCombat(combatId) e leaveCombat(combatId)
5. Layout Principal
Layout.tsx
┌─────────────────────────────────────────────────────────┐
│ TopBar: Logo | Breadcrumb | 🔔 Notificações | 👤 User  │
├──────────────┬──────────────────────────────────────────┤
│              │                                          │
│   Sidebar    │         <Outlet /> (conteúdo)           │
│              │                                          │
│  🏠 Dashboard│                                          │
│  👥 Personagens                                         │
│  👹 Bestiário│                                          │
│  🌍 Ambientes│                                          │
│  📄 Documentos                                          │
│  ⚔️ Combate  │                                          │
│  📓 Sessões  │                                          │
│  ─────────── │                                          │
│  📜 Log      │  (admin only)                           │
│  👥 Usuários │  (admin only)                           │
└──────────────┴──────────────────────────────────────────┘
Sidebar recolhível (ícone apenas ou expandida)
Itens admin-only ocultos para players
NotificationBell no TopBar mostra badge com contagem de pedidos pendentes (admin)
Ao clicar no sino, abre dropdown com os pedidos e botões Aceitar/Recusar inline
6. Páginas e Componentes Principais
LoginPage.tsx
Formulário: username + password
Link para /request-access
Ao logar com status pending, redireciona para /pending
AccessRequestPage.tsx
Formulário: username + password
Exibe: "Sua solicitação será analisada pelo Mestre"
Após submit bem-sucedido, redireciona para /pending
PendingApprovalPage.tsx
Tela de espera animada
Mensagem: "Aguardando aprovação do Mestre..."
Conecta ao socket e escuta 'access:approved' e 'access:rejected'
Se aprovado: faz login automático e redireciona para /
Se rejeitado: exibe mensagem de recusa
DashboardPage.tsx
Componentes:
- <StatusPanel />     → Cards com PV/SAN/PE de todos os personagens jogadores (admin)
- <ActiveCombats />   → Lista combates ativos com botão de entrar
- <RecentSessions />  → Últimas 3 notas de sessão
- <QuickAccess />     → Atalhos para módulos
CharactersPage.tsx
Layout:
- Sidebar esquerda: lista de grupos (CharacterGroup) com badge de contagem
- Área principal: grid de cards de personagens do grupo selecionado
- Botão "Novo Personagem" [admin]
- Botão "Novo Grupo" [admin]

CharacterCard:
- Token image (avatar circular se não tiver token)
- Nome, Trilha, NEX
- Barras mini de PV / SAN / PE com cores (verde/amarelo/vermelho)
- Condições ativas como badges
- Clique → navega para /characters/:id
CharacterSheetPage.tsx
Layout de abas:
├── 📋 Visão Geral
│   - Token grande (lado esquerdo)
│   - Nome, Trilha, NEX
│   - Barras de PV / SAN / PE com botões +/- rápidos
│   - Condições ativas (badges clicáveis para remover [admin])
│   - Atributos em grid (d4/d6/d8/d12/d20 visualmente)
│   - Descrição curta
│
├── 📖 História
│   - historySummary (resumo)
│   - historyFull (editor TipTap, somente leitura para player)
│
├── 🎒 Inventário
│   - Tabela: item, categoria, qtd, descrição
│   - Botões adicionar/editar/remover
│
├── ⚡ Habilidades & Rituais
│   - Seção "Habilidades de Trilha"
│   - Seção "Rituais" (com elemento e custo em PE)
│   - Cada card com nome, descrição, badge de tipo/elemento
│
├── 📊 Perícias
│   - Agrupadas por atributo
│   - Badge de treinada/não treinada
│   - Valor de bonus
│
└── 📜 Histórico
    - Lista de AuditLog específico deste personagem
    - Mostra: timestamp, campo alterado, valor anterior → novo valor
MonstersPage.tsx (admin)
- Grid de cards de monstros
- Filtro por threatLevel
- Busca por nome
- Botão "Novo Monstro"
- MonsterCard: token, nome, ameaça, PV max, resistências
MonsterSheetPage.tsx (admin)
Abas:
├── Visão Geral: token, stats, atributos, resistências, imunidades
├── Ataques: lista com dano, tipo, alcance
├── Habilidades: lista de habilidades/rituais
└── Lore: texto livre sobre o monstro
CombatTrackerPage.tsx
Layout:
- Header: nome do combate | Rodada X | [Próxima Rodada] [Encerrar]
- Lista vertical de participantes ordenados por iniciativa:
  ┌─────────────────────────────────────────────────┐
  │ 🟢 [token] Nome           [ATIVO / INCONSCIENTE] │
  │    PV: ████████░░ 18/25  [-] [+]                │
  │    SAN: ███████░░░ 14/20 [-] [+]                │
  │    PE:  █████░░░░░ 10/20 [-] [+]                │
  │    Condições: [Sangrando ×] [Abalado ×]          │
  └─────────────────────────────────────────────────┘
- Painel lateral: log de eventos da sessão de combate
- Modal para adicionar/remover participantes [admin]
- Modal para aplicar dano/cura com descrição e origem [admin]
- Botão de adicionar condição rápida [admin]
UserManagementPage.tsx (admin)
Tabs:
├── Pendentes: lista de solicitações com Aceitar/Recusar + select de role e personagem
└── Ativos: tabela de usuários com role, status, personagem vinculado, ações

Componente AccessRequestCard:
- Avatar inicial, username, data da solicitação
- Select: Papel (Jogador / Espectador)
- Select: Personagem vinculado (opcional)
- Botões: ✅ Aceitar | ❌ Recusar
AuditLogPage.tsx (admin)
- Filtros: tipo de entidade, ID da entidade, usuário, intervalo de datas
- Tabela paginada:
  timestamp | entidade | ação | campo | antes → depois | usuário
- Clique na linha expande detalhes
7. Componentes Compartilhados
VitalBar.tsx
typescript
// Props: label, current, max, color
// Exibe barra de progresso colorida com valor numérico
// Muda cor automaticamente:
//   > 50%: verde | 25-50%: amarelo | < 25%: vermelho
// Usado em: CharacterCard, CharacterSheet, CombatTracker
ConditionBadge.tsx
typescript
// Props: condition, onRemove?
// Exibe badge colorido com nome da condição
// Condições críticas (Inconsciente, Morto) em vermelho
// onRemove: exibe botão × para remover [admin only]
TokenAvatar.tsx
typescript
// Props: src?, name, size: 'sm'|'md'|'lg'
// Exibe imagem do token se src existir
// Fallback: iniciais do nome em círculo colorido
DiceDisplay.tsx
typescript
// Props: value: 'd4'|'d6'|'d8'|'d12'|'d20'
// Exibe ícone visual do dado com o valor
// Usado nos atributos da ficha
RichTextEditor.tsx
typescript
// Props: content, onChange?, readOnly?
// Wrapper do TipTap com toolbar básica
// (negrito, itálico, listas, títulos)
// readOnly=true: apenas visualização sem toolbar
ConfirmDialog.tsx
typescript
// Props: title, description, onConfirm, onCancel
// Modal de confirmação para ações destrutivas
// Usado antes de deletar qualquer recurso
8. Axios — services/api.ts
typescript
// Cria instância com baseURL = import.meta.env.VITE_API_URL
// Interceptor de request: injeta 'Authorization: Bearer <token>' de authStore
// Interceptor de response:
//   - 401: limpa authStore e redireciona para /login
//   - 403 ACCOUNT_PENDING: redireciona para /pending
//   - 403 ACCOUNT_BLOCKED: exibe toast de erro e faz logout
// Exporta funções tipadas para cada recurso:
//   characterApi, monsterApi, combatApi, etc.
9. Variáveis de Ambiente (.env do frontend)
env
VITE_API_URL=http://localhost:3001/api/v1
VITE_SOCKET_URL=http://localhost:3001
