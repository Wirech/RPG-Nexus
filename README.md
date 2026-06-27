# Nexus do Mestre

Ferramenta de apoio para Mestres do sistema de RPG brasileiro **Ordem Paranormal**, permitindo gerenciar personagens, monstros, ambientes, documentos de investigação, combates e notas de sessão, com sistema de acesso multiusuário controlado pelo Mestre (Admin).

## 🚀 Stack Tecnológica

### Backend
- **Runtime:** Node.js 20+
- **Framework:** Express.js 5.x + TypeScript 5.8
- **ORM:** Prisma 6.x
- **Banco de dados:** SQLite
- **Autenticação:** JWT + bcryptjs
- **WebSocket:** socket.io 4.8
- **Validação:** zod

### Frontend
- **Framework:** React 18.3 + TypeScript 5.8
- **Build:** Vite 6.x
- **Estilização:** Tailwind CSS 3.4
- **Estado global:** Zustand 5.x
- **Roteamento:** React Router v7
- **WebSocket:** socket.io-client
- **Editor:** TipTap
- **UI Components:** Radix UI

## 📋 Pré-requisitos

- **Node.js** 20.x ou superior
- **npm** 10.x ou superior
- **Git** (para clonar o repositório)

## 📁 Estrutura do Projeto

```
nexus-do-mestre/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── socket/
│   │   ├── prisma/
│   │   ├── utils/
│   │   ├── app.ts
│   │   └── server.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── uploads/
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── stores/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   ├── lib/
│   │   └── App.tsx
│   └── package.json
│
├── Specs/
│   ├── SPEC_01_VISAO_GERAL.md
│   ├── SPEC_02_DATABASE.md
│   ├── SPEC_03_BACKEND.md
│   ├── SPEC_04_FRONTEND.md
│   ├── SPEC_05_PROMPTS.md
│   └── SPEC_06_FEATURES.md
│
└── README.md
```

## ⚙️ Instalação Local

### 1. Clone o repositório

```bash
git clone <repository-url>
cd RPG-Nexus
```

### 2. Configure o Backend

```bash
# Acesse o diretório
cd backend

# Instale as dependências
npm install

# Copie o arquivo de ambiente
cp .env.example .env

# Edite o .env com suas configurações
# (especialmente JWT_SECRET e credenciais do admin)

# Gere o Prisma Client e crie o banco de dados
npx prisma generate
npx prisma db push

# Execute o seed para criar o admin inicial
npm run seed
```

### 3. Configure o Frontend

```bash
# Volte para a raiz e acesse o frontend
cd ../frontend

# Instale as dependências
npm install

# Copie o arquivo de ambiente (se existir)
# As configurações padrão já funcionam para desenvolvimento local
```

### 4. Execute em modo de desenvolvimento

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Acesse:** http://localhost:5173

## 🐳 Execução com Docker

### Requisitos
- Docker e Docker Compose instalados

### Iniciar a aplicação

```bash
# Na raiz do projeto
docker-compose up --build
```

Isso irá:
- Construir as imagens do backend e frontend
- Iniciar os containers
- O frontend estará disponível em: http://localhost
- O backend estará disponível em: http://localhost:3001

### Comandos úteis

```bash
# Iniciar em background
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar containers
docker-compose down

# Reconstruir imagens
docker-compose up --build --force-recreate

# Executar seed no container
docker-compose exec backend npm run seed
```

### Volumes persistentes
- `./backend/uploads` → Arquivos enviados (tokens, imagens)
- `./backend/prisma/dev.db` → Banco de dados SQLite

## 🌐 Acesso em Rede Local (Tailscale)

Para permitir que jogadores acessem de outras máquinas na mesma rede:

### 1. Instale o Tailscale
- Baixe em: https://tailscale.com/download
- Instale em todas as máquinas que precisam de acesso

### 2. Configure o Backend
Edite o arquivo `backend/.env`:
```env
FRONTEND_URL=http://<seu-ip-tailscale>:5173
```

### 3. Configure o Frontend
Edite o arquivo `frontend/.env`:
```env
VITE_API_URL=http://<seu-ip-tailscale>:3001/api/v1
VITE_SOCKET_URL=http://<seu-ip-tailscale>:3001
```

### 4. Inicie com binding em todas as interfaces
```bash
# Frontend (vite.config.ts já configurado para host: true)
cd frontend && npm run dev

# Backend (ouve em 0.0.0.0 por padrão)
cd backend && npm run dev
```

### 5. Compartilhe o IP
Compartilhe seu IP do Tailscale (ex: `100.x.x.x`) com os jogadores.
Eles acessam: `http://100.x.x.x:5173`

## 🔧 Configuração

### Backend (.env)

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="sua_chave_secreta_aqui_min_32_caracteres"
JWT_EXPIRES_IN="7d"
PORT=3001
UPLOADS_DIR="./uploads"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="senha_inicial_admin"
FRONTEND_URL="http://localhost:5173"
```

> ⚠️ **IMPORTANTE:** Altere `JWT_SECRET` para uma string aleatória longa (mínimo 32 caracteres) antes de usar em produção!

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3001/api/v1
VITE_SOCKET_URL=http://localhost:3001
```

## 🔐 Credenciais Padrão

| Campo    | Valor Padrão          |
|----------|-----------------------|
| Usuário  | `admin`               |
| Senha    | `senha_inicial_admin` |

> ⚠️ **ATENÇÃO:** Troque a senha imediatamente após o primeiro login! 
> Acesse o painel de usuários para atualizar suas credenciais.

##  Roles do Sistema

| Role       | Descrição                                        |
|------------|--------------------------------------------------|
| admin      | Acesso total a todos os recursos (Mestre)        |
| player     | Acesso ao próprio personagem + recursos revelados|
| spectator  | Acesso somente leitura a recursos revelados      |
| pending    | Aguardando aprovação do admin                    |

## 📊 Módulos Disponíveis por Role

| Módulo              | Admin | Player | Spectator |
|---------------------|:-----:|:------:|:---------:|
| Dashboard           | ✅    | ✅     | ✅        |
| Personagens (lista) | ✅    | 🔓     | 🔓        |
| Ficha própria       | ✅    | ✅     | ❌        |
| Editar vitais       | ✅    | 🔒     | ❌        |
| Bestiário           | ✅    | ❌     | ❌        |
| Ambientes           | ✅    | 🔓     | 🔓        |
| Documentos          | ✅    | 🔓     | 🔓        |
| Combat Tracker      | ✅    | ✅     | ✅        |
| Criar/Encerrar      | ✅    | ❌     | ❌        |
| Notas de Sessão     | ✅    | ❌     | ❌        |
| Gerenciar Usuários  | ✅    | ❌     | ❌        |
| Log de Auditoria    | ✅    | ❌     | ❌        |
| Busca Global (⌘K)   | ✅    | 🔓     | 🔓        |
| Rolador de Dados    | ✅    | ✅     | ✅        |

**Legenda:**
- ✅ Acesso total
- 🔓 Apenas recursos revelados pelo admin
- 🔒 Apenas seu próprio personagem
- ❌ Sem acesso

## 📖 Conceitos do Sistema Ordem Paranormal

### Atributos (d4, d6, d8, d12, d20)
- Força, Agilidade, Intelecto, Presença, Vigor

### NEX (Nível de Exposição)
- 5%, 15%, 25%, 35%, 45%, 55%, 65%, 75%, 85%, 95%, 99%

### Trilhas
- Agente, Combatente, Especialista, Ocultista

### Recursos Vitais
- PV (Pontos de Vida)
- SAN (Sanidade)
- PE (Pontos de Esforço)

### Condições
- Abalado, Apavorado, Sangrando, Cego, Surdo, Imobilizado, Inconsciente, Morto

## 📝 Licença

Este projeto é para uso pessoal e educacional.

---

Desenvolvido com 💜 para a comunidade de Ordem Paranormal.
