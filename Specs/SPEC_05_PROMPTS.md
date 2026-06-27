SPEC_05_PROMPTS_AGENTE.md

Nexus do Mestre — Prompts Sequenciais para Agente VS Code
Instruções de uso: Cole cada prompt abaixo em sequência no seu agente (GitHub Copilot, Cursor, Cline, etc.). Aguarde a geração completa de cada etapa antes de prosseguir para a próxima. Mantenha os arquivos SPEC_01 a SPEC_06 abertos no workspace como contexto.

PROMPT 1 — Setup Inicial do Projeto
Leia os arquivos SPEC_01_VISAO_GERAL.md e SPEC_06_FEATURES.md do workspace.

Crie a estrutura completa de um monorepo com dois diretórios raiz: `backend/` e `frontend/`.

Para o BACKEND, inicialize um projeto Node.js + TypeScript com as seguintes dependências:
- Produção: express, @prisma/client, prisma, bcryptjs, jsonwebtoken, multer, zod,
  socket.io, cors, winston, dotenv, cuid2
- Dev: typescript, ts-node, nodemon, @types/express, @types/bcryptjs,
  @types/jsonwebtoken, @types/multer, @types/cors, @types/node

Configure:
- tsconfig.json: target ES2020, module commonjs, outDir ./dist, rootDir ./src, strict true
- nodemon.json: watch src/ com extensão ts
- Scripts no package.json: dev (nodemon), build (tsc), start (node dist/server.js),
  seed (ts-node prisma/seed.ts)
- .env com: DATABASE_URL, JWT_SECRET, JWT_EXPIRES_IN=7d, PORT=3001,
  UPLOADS_DIR=./uploads, ADMIN_USERNAME, ADMIN_PASSWORD, FRONTEND_URL
- Crie as pastas: uploads/tokens/, uploads/documents/, uploads/environments/
- .gitignore: node_modules, dist, .env, uploads/*.db

Para o FRONTEND, inicialize com Vite + React + TypeScript e instale:
- Produção: react-router-dom, axios, zustand, socket.io-client,
  @tiptap/react, @tiptap/starter-kit, @tiptap/extension-placeholder,
  react-hot-toast, lucide-react, @radix-ui/react-dialog,
  @radix-ui/react-select, @radix-ui/react-tabs, @radix-ui/react-tooltip,
  @radix-ui/react-dropdown-menu, class-variance-authority, clsx, tailwind-merge
- Dev: tailwindcss, postcss, autoprefixer, @types/react, @types/react-dom

Configure:
- tailwind.config.ts: darkMode: 'class', content src/**
- Adicione as variáveis CSS de paleta (background #0f0f13, surface #1a1a24,
  border #2a2a3a, accent #7c3aed, danger #dc2626, warning #d97706,
  success #16a34a) no index.css
- .env: VITE_API_URL=http://localhost:3001/api/v1, VITE_SOCKET_URL=http://localhost:3001
- vite.config.ts padrão

Crie README.md na raiz com instruções de instalação e execução.
PROMPT 2 — Schema Prisma e Seed
Leia o arquivo SPEC_02_DATABASE.md do workspace.

No diretório backend/, crie:

1. `prisma/schema.prisma` — Schema completo com todos os models:
   User, AccessRequest, ResourcePermission, CharacterGroup, Character,
   CharacterSkill, CharacterAbility, InventoryItem, Monster, MonsterAttack,
   MonsterAbility, Environment, EnvironmentImage, EnvironmentPoint,
   Document, DocumentImage, CombatSession, CombatParticipant, CombatEvent,
   SessionNote, AuditLog

2. `prisma/seed.ts`:
   - Verifica se admin já existe antes de criar
   - Cria admin com ADMIN_USERNAME e ADMIN_PASSWORD do process.env
   - role='admin', status='active', sem AccessRequest vinculada
   - Cria grupo padrão "Agentes" se não existir
   - Loga confirmações no console

3. `src/prisma/client.ts` — Singleton do PrismaClient

Adicione ao package.json do backend:
"prisma": { "seed": "ts-node prisma/seed.ts" }
PROMPT 3 — Backend: Utils, Middlewares e App
Leia os arquivos SPEC_03_BACKEND.md e SPEC_06_FEATURES.md do workspace.

No diretório backend/src/, crie:

1. `utils/jwt.ts`
   - signToken(payload: object): string — usa JWT_SECRET e JWT_EXPIRES_IN
   - verifyToken(token: string): object | null

2. `utils/logger.ts`
   - Winston com Console (dev) e File (logs/error.log, logs/combined.log)

3. `utils/auditLogger.ts`
   - createAuditLog({ userId?, entityType, entityId, entityName?,
     action, fieldChanged?, oldValue?, newValue?, context? })
   - Salva via prisma na tabela AuditLog

4. `middlewares/auth.middleware.ts`
   - Extrai Bearer token, verifica, busca User no banco
   - Injeta req.user = { id, username, role, status, linkedCharacterId }
   - 401 se token inválido ou ausente
   - 403 ACCOUNT_PENDING se status='pending'
   - 403 ACCOUNT_BLOCKED se status='blocked'

5. `middlewares/role.middleware.ts`
   - requireRole(...roles: string[]): middleware
   - 403 FORBIDDEN se role não está na lista

6. `middlewares/upload.middleware.ts`
   - multer com diskStorage em uploads/{subpasta}/
   - Filename: ${createId()}.${ext}
   - Filter: image/jpeg, image/png, image/webp, image/gif
   - Limite: 5MB
   - Exporta: uploadToken, uploadDocument, uploadEnvironmentImage

7. `app.ts`
   - Express + cors + json
   - Serve /uploads como estático
   - Registra todas as rotas /api/v1/{recurso}
   - Cria httpServer e io (socket.io com cors)
   - Chama initSocket(io)
   - GET /api/v1/health retorna { status: 'ok', timestamp }
   - Exporta httpServer e io

8. `server.ts`
   - Importa httpServer, ouve na PORT do .env, loga URL
PROMPT 4 — Backend: Socket.io e Auth Routes
Leia SPEC_03_BACKEND.md e SPEC_06_FEATURES.md (seção F01).

1. `socket/events.ts` — Constantes de todos os nomes de eventos

2. `socket/index.ts` — initSocket(io: Server):
   - Map<userId, socketId> para associar sockets a usuários
   - 'auth:identify' { token }: verifica JWT, associa socket ao userId
   - Admin entra na sala 'admins' automaticamente
   - 'combat:join' { combatId }: socket.join(`combat:${combatId}`)
   - 'combat:leave' { combatId }: socket.leave(`combat:${combatId}`)
   - Exporta: emitToUser(userId, event, data)
   - Exporta: emitToAdmins(event, data)
   - Exporta: emitToCombat(combatId, event, data)
   - Ao desconectar: remove do Map

3. `controllers/auth.controller.ts` + `routes/auth.routes.ts`:

   POST /register:
   - Zod: { username: min(3).max(30).regex(/^\S+$/), password: min(6) }
   - Verifica username único (409 CONFLICT)
   - Rejeita username 'admin' (409)
   - bcrypt hash saltRounds=12
   - Cria User role='pending' status='pending' + AccessRequest
   - Emite socket ACCESS_NEW_REQUEST para sala 'admins'
   - Retorna 201 { message: 'Solicitação enviada. Aguarde aprovação do Mestre.' }

   POST /login:
   - Busca user por username
   - Retorna 401 INVALID_CREDENTIALS se não existe ou senha errada
   - Retorna 403 ACCOUNT_PENDING se status='pending'
   - Retorna 403 ACCOUNT_BLOCKED se status='blocked'
   - Gera JWT, retorna { token, user: { id, username, role, status, linkedCharacterId } }

   GET /me (authMiddleware):
   - Retorna req.user sem passwordHash
PROMPT 5 — Backend: Users e Characters
Leia SPEC_03_BACKEND.md e SPEC_06_FEATURES.md (seções F01.3, F01.4, F02).

1. `controllers/user.controller.ts` + `routes/user.routes.ts` [admin]:
   - GET /: lista todos com linkedCharacter (sem passwordHash)
   - GET /pending: AccessRequests pending com User
   - POST /approve/:id: { role, linkedCharacterId? }
     * Atualiza User role/status='active', AccessRequest status='approved'
     * Emite ACCESS_APPROVED para o userId
     * createAuditLog action='access_granted'
   - POST /reject/:id: { reason? }
     * AccessRequest status='rejected'
     * Emite ACCESS_REJECTED para o userId
   - PUT /:id: atualiza role ou linkedCharacterId, createAuditLog action='update'
   - DELETE /:id: não permite deletar próprio admin (403)
   - POST /:id/block: status='blocked', emite NOTIFICATION_GENERAL para userId
   - POST /:id/unblock: status='active'

2. `controllers/character.controller.ts` + `routes/character.routes.ts`:

   Implemente TODAS as rotas da seção Personagens do SPEC_03, incluindo:
   - GET / com lógica admin vs player (revelados + próprio)
   - CRUD de CharacterGroups (admin)
   - GET /:id com verificação de permissão:
     * Admin: sempre
     * Player: isRevealed=true OU linkedCharacterId === id
     * Retorna com skills, abilities, inventory; condições parseadas de JSON
   - POST /, PUT /:id (admin) com createAuditLog
   - PATCH /:id/vitals:
     * Admin sempre | Player só se linkedCharacterId === params.id
     * Clampeia entre 0 e max
     * createAuditLog com fieldChanged, oldValue, newValue
   - PATCH /:id/conditions (admin): serializa como JSON
   - CRUD skills, abilities, inventory com createAuditLog
   - POST /:id/token (admin): uploadToken, deleta arquivo antigo se existir
   - PATCH /:id/reveal (admin): createAuditLog
PROMPT 6 — Backend: Monsters, Environments, Documents
Leia SPEC_03_BACKEND.md e SPEC_06_FEATURES.md (seções F03, F04, F05).

1. `controllers/monster.controller.ts` + `routes/monster.routes.ts` [admin]:
   - GET /: com query search? e threatLevel?
   - GET /:id: retorna com attacks e abilities, desserializa resistances e immunities
   - POST /, PUT /:id: serializa resistances e immunities como JSON
   - DELETE /:id: com createAuditLog
   - CRUD de attacks (MonsterAttack) com createAuditLog
   - CRUD de abilities (MonsterAbility) com createAuditLog
   - POST /:id/token: uploadToken, deleta antigo

2. `controllers/environment.controller.ts` + `routes/environment.routes.ts`:
   - GET /: admin=todos, player=isRevealed=true; query search?
   - GET /:id: verifica permissão igual ao GET /
   - POST /, PUT /:id, DELETE /:id [admin] com createAuditLog
   - POST /:id/images [admin]: uploadEnvironmentImage, campo caption opcional
   - DELETE /:id/images/:imageId [admin]: deleta do banco E fs.unlink do filesystem
   - PATCH /:id/reveal [admin]: createAuditLog

3. `controllers/document.controller.ts` + `routes/document.routes.ts`:
   - Mesma lógica de permissão de ambientes
   - Serializa/desserializa tags como JSON
   - POST /, PUT /:id, DELETE /:id [admin] com createAuditLog
   - POST /:id/images [admin]: uploadDocument, caption opcional
   - DELETE /:id/images/:imageId [admin]: deleta banco + filesystem
   - PATCH /:id/reveal [admin]: createAuditLog

Para todos os controllers: try/catch retornando formato de erro padrão do SPEC_03.
PROMPT 7 — Backend: Combat, Sessions e Audit
Leia SPEC_03_BACKEND.md e SPEC_06_FEATURES.md (seções F06, F07, F08).

1. `controllers/combat.controller.ts` + `routes/combat.routes.ts`:

   POST / [admin]:
   - Cria CombatSession
   - Para cada participante em body.participants:
     * Busca Character ou Monster pelo entityId
     * Copia pvMax, sanMax, peMax; pvCurrent=pvMax, sanCurrent=sanMax, peCurrent=peMax
     * Se mesmo monstro adicionado N vezes: customName = `${nome} ${n}`
   - Ordena por initiative decrescente (define campo order)
   - createAuditLog action='create'

   PATCH /:id/participants/:participantId/vitals:
   - Admin sempre | Player se entityType='character' e characterId = linkedCharacterId
   - Aplica delta: newVal = Math.max(0, Math.min(max, current + value))
   - Cria CombatEvent { action: field === 'pv' ? 'damage'|'heal', field, value, ... }
   - emitToCombat(id, COMBAT_UPDATED, { participantId, field, oldVal, newVal })
   - emitToCombat(id, COMBAT_EVENT, { event })

   PATCH /:id/participants/:participantId/conditions:
   - Compara antigas e novas condições
   - Cria CombatEvent para cada adição (action='condition_add') e remoção (action='condition_remove')
   - emitToCombat COMBAT_UPDATED

   POST /:id/next-round [admin]:
   - roundCurrent++
   - Cria CombatEvent { action:'custom', description: `Nova rodada: ${round}` }
   - emitToCombat COMBAT_ROUND_CHANGE { combatId, round }

   POST /:id/finish [admin]:
   - status='finished', finishedAt=now()
   - createAuditLog action='update'

   Demais rotas conforme SPEC_03.

2. `controllers/session.controller.ts` + `routes/session.routes.ts` [admin]:
   - CRUD completo de SessionNote
   - Serializa/desserializa tags como JSON
   - GET /: ordenado por sessionDate desc; query search?, tags?

3. `controllers/auditlog.controller.ts` + `routes/auditlog.routes.ts` [admin]:
   - GET /: filtros entityType, entityId, userId, from, to, page=1, limit=50 (max 200)
   - Paginação: skip=(page-1)*limit, take=limit
   - Retorna { data, total, page, totalPages }
   - GET /entity/:type/:id: logs por entidade, desc por timestamp
PROMPT 8 — Frontend: Setup, Types, API e Stores
Leia SPEC_04_FRONTEND.md e SPEC_06_FEATURES.md do workspace.

No diretório frontend/src/, crie:

1. `types/index.ts` — Interfaces TypeScript para TODAS as entidades do projeto:
   User, AccessRequest, CharacterGroup, Character, CharacterSkill,
   CharacterAbility, InventoryItem, Monster, MonsterAttack, MonsterAbility,
   Environment, EnvironmentImage, EnvironmentPoint, Document, DocumentImage,
   CombatSession, CombatParticipant, CombatEvent, SessionNote, AuditLog
   Inclua tipos auxiliares: VitalField, ConditionType, ThreatLevel, CharacterRole,
   SocketEvents, ApiResponse<T>, PaginatedResponse<T>

2. `services/api.ts`:
   - Instância Axios com baseURL = VITE_API_URL
   - Interceptor request: injeta Authorization Bearer do authStore
   - Interceptor response:
     * 401: limpa authStore, redirect /login, toast "Sessão expirada"
     * 403 ACCOUNT_PENDING: redirect /pending
     * 403 ACCOUNT_BLOCKED: toast erro + logout
   - Objetos exportados com funções tipadas para cada recurso:
     authApi, userApi, characterApi, monsterApi,
     environmentApi, documentApi, combatApi, sessionApi, auditApi

3. `stores/authStore.ts` — Zustand + persist (localStorage):
   { user, token, isAuthenticated, login, logout, setUser }

4. `stores/notificationStore.ts` — Zustand:
   { pendingRequests, addPendingRequest, removePendingRequest }

5. `stores/combatStore.ts` — Zustand:
   { activeCombat, participants, events, currentRound,
     setActiveCombat, updateParticipant, addEvent, setRound, reset }

6. `hooks/useSocket.ts`:
   - Conecta ao VITE_SOCKET_URL com auth { token }
   - Envia 'auth:identify' com token após conexão
   - Escuta e despacha todos os eventos conforme SPEC_04
   - Exporta joinCombat(id) e leaveCombat(id)
   - Limpa listeners no cleanup

7. `hooks/useAuth.ts`:
   - Retorna: user, isAuthenticated, isAdmin, isPlayer, isSpectator

8. `lib/utils.ts`:
   - cn(...classes): string (clsx + tailwind-merge)
   - formatDate(date): string (dd/MM/yyyy HH:mm)
   - vitalColor(current, max): 'green'|'yellow'|'red'
   - rollDice(notation: string): { result: number, rolls: number[], notation }
PROMPT 9 — Frontend: Layout e Componentes Base
Leia SPEC_04_FRONTEND.md e SPEC_06_FEATURES.md (F10).

1. Componentes base (src/components/shared/):

   VitalBar.tsx:
   - Props: label, current, max, color?, showNumbers?, onMinus?, onPlus?, onEdit? [admin]
   - Barra de progresso animada com mudança de cor automática por %
   - Botões − e + para [admin], clique no valor abre input numérico inline
   - Flash animado ao mudar valor (outline colorido temporário)

   ConditionBadge.tsx:
   - Props: condition, onRemove?
   - Cores por condição: Morto=cinza, Inconsciente=preto, Sangrando=vermelho,
     Abalado/Apavorado=amarelo, demais=roxo escuro

   TokenAvatar.tsx:
   - Props: src?, name, size: 'xs'|'sm'|'md'|'lg'|'xl'
   - Imagem ou iniciais em círculo colorido (cor derivada do nome via hash)

   DiceDisplay.tsx:
   - Props: value: 'd4'|'d6'|'d8'|'d12'|'d20', label?
   - Ícone SVG do dado com valor; hover exibe tooltip com nome do atributo

   RichTextEditor.tsx:
   - TipTap com extensões: StarterKit, Placeholder
   - Toolbar: negrito, itálico, listas, títulos H2/H3, separador
   - readOnly=true: sem toolbar, apenas texto renderizado
   - Props: content, onChange?, readOnly?, placeholder?

   ConfirmDialog.tsx:
   - Radix Dialog: título, descrição com nome do recurso em destaque
   - Botão confirmar em vermelho, cancelar em ghost

   DiceRoller.tsx (F10.6):
   - Painel deslizante (drawer) no canto inferior direito
   - Input com notação (ex: 2d6+3), botão rolar
   - Resultado animado em destaque
   - Histórico das últimas 10 rolagens na sessão (não persiste)
   - Atalho: ícone 🎲 flutuante sempre visível

2. `components/layout/Sidebar.tsx`:
   - Recolhível: 240px expandido, 64px recolhido (ícones)
   - Estado persistido no localStorage
   - Itens admin-only ocultos para player/spectator
   - Indicador de rota ativa

3. `components/layout/TopBar.tsx`:
   - Logo, breadcrumb dinâmico, NotificationBell [admin], menu do usuário

4. `components/layout/NotificationBell.tsx`:
   - Badge com contagem do notificationStore
   - Dropdown com AccessRequestCards compactos
   - Aprovar/Recusar inline com select de papel e personagem

5. `components/layout/Layout.tsx`:
   - Sidebar + TopBar + Outlet
   - Instancia useSocket() aqui para toda a app

6. `App.tsx`:
   - BrowserRouter com todas as rotas do SPEC_04
   - ProtectedRoute: verifica isAuthenticated + role mínima
   - Toaster do react-hot-toast (dark theme, posição top-right)
   - Integra DiceRoller flutuante em todas as páginas autenticadas

7. `pages/Login.tsx`, `pages/AccessRequest.tsx`, `pages/PendingApproval.tsx`
   conforme comportamento descrito no SPEC_06 F01.
PROMPT 10 — Frontend: Dashboard e Characters
Leia SPEC_04_FRONTEND.md e SPEC_06_FEATURES.md (seções F02, F09).

1. `pages/Dashboard.tsx`:
   - StatusPanel [admin]: busca personagens de players ativos, exibe VitalBar
     Personagens < 25% PV ou SAN: borda vermelha pulsante (animate-pulse)
   - ActiveCombats [admin]: lista combates ativos com nome, rodada, participantes, botão Entrar
   - RecentSessions [admin]: últimas 3 notas com título e data
   - QuickAccessGrid: 6 cards (Personagens, Bestiário, Ambientes, Documentos, Combate, Sessões)
     Cada card mostra contagem de itens buscada da API

2. `pages/Characters.tsx`:
   - Sidebar esquerda: lista de CharacterGroups com badge de contagem + opção "Todos"
     [admin] botões criar grupo, editar nome/cor, reordenar
   - Grid de CharacterCards (responsivo: 2-4 colunas)
   - Busca por nome inline no header
   - [admin] Botão "Novo Personagem" abre CreateCharacterDialog

3. `components/characters/CharacterCard.tsx`:
   Conforme SPEC_06 F02.2 — token, nome, trilha, NEX, mini VitalBars, condições,
   badge "Oculto" [admin], hover elevação.

4. `pages/CharacterSheet.tsx` com Tabs (Radix Tabs):

   Aba "Visão Geral":
   - Layout 2 colunas: esquerda token+upload, direita atributos+vitais
   - Token clicável [admin] com hover câmera
   - Nome editável inline [admin]
   - DiceDisplay para cada atributo; clique abre select [admin]
   - VitalBars com botões −/+ e edição inline conforme F02.3
   - ConditionBadges com + e × [admin]

   Aba "História": conforme F02.4 com auto-save

   Aba "Inventário": conforme F02.5
   - Tabela com colunas Nome, Categoria, Qtd, Descrição, Ações
   - Edição inline por célula
   - Dialog de adição com todos os campos

   Aba "Habilidades & Rituais": conforme F02.6
   - Seções separadas com cards
   - Cores por elemento do ritual

   Aba "Perícias": conforme F02.7
   - Agrupadas por atributo, perícias padrão OP sugeridas

   Aba "Histórico": conforme F02.8
   - AuditLog do personagem paginado
PROMPT 11 — Frontend: Monsters, Environments, Documents
Leia SPEC_04_FRONTEND.md e SPEC_06_FEATURES.md (seções F03, F04, F05).

1. `pages/Monsters.tsx` [admin]:
   - Grid de MonsterCards: token, nome, badge de ameaça colorido, PV max
   - Filtros: busca por nome, select de threatLevel
   - Botão "Novo Monstro" → CreateMonsterDialog

2. `pages/MonsterSheet.tsx` [admin]:
   Tabs:
   - Visão Geral: token+upload, atributos com DiceDisplay, PV/SAN max,
     badges de resistências e imunidades
   - Ataques: tabela CRUD com nome, dano, tipo, alcance, descrição
   - Habilidades: cards CRUD com tipo (Habilidade/Ritual/Passiva)
   - Lore: RichTextEditor livre

3. `pages/Environments.tsx`:
   - Grid de cards: primeira imagem (ou placeholder escuro), nome, trecho da descrição
   - Badge "Revelado"/"Oculto" [admin]
   - Busca por nome
   - Botão "Novo Ambiente" [admin]

4. `pages/EnvironmentPage.tsx`:
   - Carrossel de imagens com upload [admin] e deleção individual
   - RichTextEditor para descrição (readOnly para player)
   - Lista de Pontos de Interesse expansível, CRUD [admin]
   - Campo NPC vinculado [admin] com link para ficha
   - Notas internas [admin] (campo oculto para players)
   - Toggle revelar/ocultar [admin] com confirmação conforme F04.2

5. `pages/Documents.tsx`:
   - Grid com ícone de categoria, título, tags, trecho do conteúdo
   - Filtros: categoria (select múltiplo), tags (chips de filtro), busca
   - Badge por categoria com ícone conforme F05.1
   - Botão "Novo Documento" [admin]

6. `pages/DocumentPage.tsx`:
   - Título editável inline [admin]
   - Badge de categoria com ícone
   - Tags editáveis como chips [admin]
   - RichTextEditor para conteúdo
   - Galeria de imagens com upload [admin]
   - Toggle revelar/ocultar com tooltip conforme F05.2
   - Link para sessão vinculada [admin]
PROMPT 12 — Frontend: Combat Tracker
Leia SPEC_04_FRONTEND.md e SPEC_06_FEATURES.md (seção F06) com atenção total.

1. `pages/CombatList.tsx` [admin]:
   - Tabs: "Combates Ativos" e "Histórico"
   - Card de combate: nome, rodada, contagem de participantes, status, botão Entrar/Ver
   - Botão "Novo Combate" abre CreateCombatDialog

2. `components/combat/CreateCombatDialog.tsx`:
   - Campo nome do combate
   - Busca combinada de personagens E monstros (uma barra de busca)
   - Lista de participantes adicionados com:
     * TokenAvatar + nome + input de iniciativa
     * Botão de rolar d20+bonus automaticamente
     * Botão remover
   - Para monstros repetidos: sufixo numérico automático mostrado
   - Botão Iniciar Combate

3. `pages/CombatTracker.tsx`:
   - Conecta socket via useSocket, chama joinCombat no mount, leaveCombat no unmount
   - Lê combatStore (atualizado em tempo real via socket)
   - Header: nome | Rodada X | [Próxima Rodada] [+ Participante] [Encerrar] [admin]
   - Lista vertical de CombatParticipantCards ordenada por order
   - Painel lateral de CombatEventLog (fixo em desktop, aba em mobile)

4. `components/combat/CombatParticipantCard.tsx`:
   Conforme F06.2:
   - TokenAvatar, nome (customName ou entityName), badge tipo
   - VitalBars PV/SAN/PE com botões [admin], flash animado ao mudar
   - ConditionBadges com × [admin] e botão "+ Condição"
   - Indicador de turno atual: borda roxa pulsante + ícone ⚔️
   - PV=0: borda vermelha, badge "Inconsciente"
   - Condição Morto: opacidade 40%

5. `components/combat/ApplyDamageDialog.tsx`:
   Conforme F06.2:
   - Select alvo, select tipo de ação (dano PV/SAN, cura, gastar/recuperar PE)
   - Input valor, input descrição, select origem
   - Submit chama PATCH vitals e fecha o dialog

6. `components/combat/CombatEventLog.tsx`:
   Conforme F06.3:
   - Lista cronológica com formatação legível
   - Cores por tipo de evento
   - Auto-scroll para último evento
   - Botão copiar log como texto [admin]

7. `components/combat/FinishCombatDialog.tsx`:
   Conforme F06.4:
   - Resumo do combate
   - Toggle "Atualizar vitais dos personagens" (checked por padrão)
   - Botão "Criar nota de sessão com este log"
   - Botão confirmar encerramento
PROMPT 13 — Frontend: Sessions, Users e Audit
Leia SPEC_04_FRONTEND.md e SPEC_06_FEATURES.md (seções F07, F08, F01.3, F01.4).

1. `pages/SessionNotes.tsx` [admin]:
   - Lista ordenada por data, busca por título e tags
   - Card: título, número da sessão, data formatada (dd/MM/yyyy), tags, trecho
   - Botão "Nova Sessão" abre dialog de criação (título, número, data, tags)

2. `pages/SessionNoteDetail.tsx` [admin]:
   - Campos de metadados editáveis: título, número, data, tags
   - RichTextEditor TipTap completo com toolbar
   - Auto-save debounce 3s: indicador "Salvando..." / "✓ Salvo"
   - Botão salvar manual
   - Botão "Exportar PDF" via window.print() com CSS de impressão adequado
   - Botão deletar sessão com ConfirmDialog

3. `pages/UserManagement.tsx` [admin]:
   - Tabs: "Pendentes" e "Usuários Ativos"
   - Tab Pendentes:
     * Busca access requests da API
     * Cards com username, data, select papel, select personagem
     * Botões Aceitar / Recusar com toast de feedback
     * Ao aprovar/recusar: remove do notificationStore também
   - Tab Ativos:
     * Tabela: username, papel, personagem vinculado, status, ações
     * Ações: Editar papel (dialog), Trocar personagem, Bloquear/Desbloquear, Deletar
     * Não exibe o próprio admin logado na lista de ações destrutivas

4. `pages/AuditLog.tsx` [admin]:
   Conforme F08.1:
   - Filtros: tipo entidade (select múltiplo), intervalo datas, usuário
   - Tabela paginada 50/página com colunas formatadas
   - Clique na linha → row expande com detalhes completos
   - Botão exportar CSV da página atual

5. `components/layout/SearchModal.tsx` (F10.3):
   - Atalho Ctrl+K / Cmd+K abre modal
   - Busca simultânea em personagens, monstros, ambientes, documentos, notas
   - Resultados agrupados por tipo com ícone e link
   - Player vê apenas recursos revelados
PROMPT 14 — Finalização, Integração e Docker
Leia todos os SPEC_*.md do workspace. Realize as verificações e tarefas finais:

BACKEND — Verificações:
1. Confirme que TODOS os controllers têm try/catch retornando formato de erro padrão
2. Confirme que createAuditLog está sendo chamado em todas as mutações relevantes
3. Garanta que uploads/ cria subpastas automaticamente no startup (mkdirSync recursive)
4. Confirme que GET /api/v1/health responde corretamente
5. Verifique que socket emite corretamente para salas e usuários específicos

FRONTEND — Verificações:
6. ProtectedRoute redireciona por role corretamente para todas as rotas
7. useSocket instanciado em Layout.tsx (não em cada página)
8. DiceRoller flutuante visível em todas as páginas autenticadas
9. Skeleton loaders em todas as páginas com fetch assíncrono
10. Estados vazios com ícone e mensagem em todo grid/lista
11. Sidebar estado expandido/recolhido persistido no localStorage
12. Paleta dark theme aplicada consistentemente

DOCKER:
13. `backend/Dockerfile`:
    - FROM node:20-alpine
    - WORKDIR /app, COPY, npm ci, npm run build
    - Cria pasta uploads/ na imagem
    - CMD node dist/server.js

14. `frontend/Dockerfile`:
    - Build stage: node:20-alpine, npm run build
    - Serve stage: nginx:alpine servindo dist/

15. `docker-compose.yml` na raiz:
    - Serviço backend: build backend/, porta 3001:3001
      volumes: ./backend/uploads:/app/uploads, ./backend/dev.db:/app/dev.db
      env_file: backend/.env
    - Serviço frontend: build frontend/, porta 80:80
      depends_on: backend

README — Atualize com:
16. Pré-requisitos (Node 20+, npm 10+)
17. Instalação local passo a passo (clone → npm install → migrate → seed → dev)
18. Como rodar com Docker (docker-compose up --build)
19. Configuração do Tailscale para acesso em rede local
20. Credenciais padrão do admin e aviso para trocar a senha imediatamente
21. Tabela de módulos disponíveis por role (admin/player/spectator)