# Nexus do Mestre

Ferramenta de apoio para Mestres do sistema de RPG brasileiro **Ordem Paranormal**, permitindo gerenciar personagens, monstros, ambientes, documentos de investigação, combates e notas de sessão, com sistema de acesso multiusuário controlado pelo Mestre (Admin).

## 🚀 Stack Tecnológica

### Backend
- **Runtime:** Node.js 20+
- **Framework:** Express.js + TypeScript
- **ORM:** Prisma
- **Banco de dados:** SQLite
- **Autenticação:** JWT + bcryptjs
- **WebSocket:** socket.io
- **Validação:** zod

### Frontend
- **Framework:** React 18 + TypeScript
- **Build:** Vite
- **Estilização:** Tailwind CSS + shadcn/ui
- **Estado global:** Zustand
- **Roteamento:** React Router v6
- **WebSocket:** socket.io-client
- **Editor:** TipTap

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

## ⚙️ Instalação

### Pré-requisitos
- Node.js 20 ou superior
- npm ou yarn

### Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run seed
```

### Frontend

```bash
cd frontend
npm install
```

## 🔧 Configuração

### Backend (.env)

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="sua_chave_secreta_aqui"
JWT_EXPIRES_IN="7d"
PORT=3001
UPLOADS_DIR="./uploads"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="senha_inicial_admin"
FRONTEND_URL="http://localhost:5173"
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3001/api/v1
VITE_SOCKET_URL=http://localhost:3001
```

## 🚀 Execução

### Desenvolvimento

Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

O frontend estará disponível em: http://localhost:5173
O backend estará disponível em: http://localhost:3001

### Produção

```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
npm run preview
```

## 👥 Roles do Sistema

| Role       | Descrição                                        |
|------------|--------------------------------------------------|
| admin      | Acesso total a todos os recursos                 |
| player     | Acesso ao próprio personagem + recursos revelados |
| spectator  | Acesso somente leitura a recursos revelados      |
| pending    | Aguardando aprovação do admin                    |

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
