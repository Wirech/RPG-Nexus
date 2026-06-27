Text
SPEC_O1_VISAO_GERAL.md
Nexus do Mestre
Especificação Geral do
Projeto
1. Visão Geral
Nome do projeto: Nexus do Mestre Tipo: Web Application (SPA
REST API
WebSocket)
Propósito: Ferramenta de apoio para Mestres do sistema de RPG brasileiro Ordem Paranormal,
permitindo gerenciar personagens
monstros
ambientes , documentos de investigação
combates
notas de sessa0
com sistema de acesso multiusuário controlado pelo Mestre (Admin).
2. Stack Tecnológica
Frontend
Framework: React 18
TypeScript
Build tool: Vite
Estilização: Tailwind CSS
shadcnlui
Estado global: Zustand
Roteamento: React Router v6
Cliente HTTP: Axios
WebSocket: socket.io-client
Editor de texto rico: TipTap
Icones: Lucide React
Notificaçoes: react-hot-toast
Backend
Runtime: Node js 20+
Framework: Express js
TypeScript
ORM: Prisma
Banco de dados: SQLite
Autenticação: JWT (jsonwebtoken)
bcryptjs
WebSocket: socketio
Upload de arquivos: mnulter
Validação: zod
Logs: winston
3. Estrutura de Pastas do Projeto
nexus
do-mestre/
backend/
srci
controllers/
auth.contro
ler.ts
character.controller.ts
monster
controller.ts
environment.controller.ts
ocument
controller.ts
combat.controller.ts
session
controller
ts
user
controller.ts
auditlog
controller.ts
midd
ewares/
auth.middleware
1s
role.middleware
ts
audit.middleware
ts
4. Sistema de RPG
Ordem Paranormal (Contexto de Dados)
sistema Ordem Paranormal
usa Os
seguintes conceitos que devem estar presentes nas fichas:
Atributos (com valores em dado: d4, d6, d8, d12, d20)
Força
Agilidade
Intelecto
Presença
Vigor
NEX -
Nível de Exposição a Paranormal
Valores:
5%, 15%, 25%, 35%,45%, 55%, 65%, 75%, 85%, 95%, 99%
Trilhas (Classes)
Agente
Combatente
Especialista
Ocultista
Recursos Vitais
PV
Pontos de Vida): pv
atual
Pv_max
SAN (Sanidade): san_atua
san_max
PE (Pontos de Esforço): pe_atual
pe_max
Condiçoes
Abalado, Apavorado
Sangrando, Cego
Surdo
Imobilizado, Inconsciente
Morto
Tipos de Habilidades
Habilidades de Trilha (passivas ou ativas)
Rituais (custam PE, possuem elemento: Morte, Sangue Energia
Conhecimento
Medo)
5. Roles do Sistema
Role
Descrição
admin
Acesso total
todos 05 recUrSOs
Acesso a0 próprio personagem
recursos revelados
player
admin
spectator Acesso somente leitura
recursos revelados
pending
Aguardando aprovação do admin
6. Variáveis de Ambiente ( env do backend)
DATABASE_URL="file:./dev
db'
JNT_SECRET=
sua
chave_
secreta_aqui'
JWT_EXPIRES_IN="Jd"
PORT-3001
UPLOADS_
DIR=
/uploads
ADMIN_USERNAME="admin"
ADMIN PASSWORD
senha_inicial_admin'
FRONTEND_URL="http: /localhost:5173
pelo
env

