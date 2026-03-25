# ⚽ Bolão Copa 2026

Aplicação web (PWA) para bolão entre amigos durante a Copa do Mundo de 2026.

## 🚀 Objetivo

Permitir que usuários:

- Façam palpites em jogos da fase de grupos e mata-mata (com suporte a prorrogação e pênaltis)
- Realizem palpites especiais (campeão, finalistas e artilheiro)
- Acompanhem o ranking em tempo real
- Participem de um sistema de pontuação automatizado

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend / BaaS**: Supabase (PostgreSQL + Auth + Realtime)
- **Autenticação**: Google OAuth
- **Plataforma**: PWA (Progressive Web App) otimizada para visualização mobile (iOS/Safari e Android)
- **Cache/Dados**: React Query + Service Worker

## 📌 Status Atual do Projeto

- [x] Definição de regras e sistema de pontuação
- [x] Protótipo UI mobile-first criado e validado
- [x] Modelagem do banco de dados relacional concluída (tabelas de usuários, times, partidas e palpites)
- [x] Configuração do Supabase e trigger automático de usuários
- [x] Setup inicial do frontend com Vite e roteamento
- [x] Conexão das páginas principais (Início, Jogos, Especiais, Ranking) com o banco
- [x] Lógica de triggers/functions para cálculo automático de pontuação

## 🏗️ Estrutura do Projeto

```
src/
├── components/       # Componentes React (MatchCard, ModalPalpite, etc.)
├── hooks/           # Hooks personalizados (useMatches, useAuth, useToast)
├── pages/           # Páginas principais (Home, Jogos, Especiais, Ranking, Admin)
├── types/           # Definições de tipos TypeScript
├── utils/           # Funções utilitárias (matchUtils)
└── lib/             # Configurações (Supabase)
```

## 🎯 Sistema de Pontuação

- **Placar exato**: 10 pontos
- **Vencedor correto**: 3 pontos
- **Prorrogação**: 2 pontos (mata-mata)
- **Pênaltis**: 2 pontos (mata-mata)

## 🔧 Configuração

### 1. Variáveis de Ambiente

Crie `.env.local` com:

```env
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anon
```

### 2. Banco de Dados

Execute o schema em `supabase/schema.sql` no SQL Editor do Supabase.

### 3. Execute o projeto

```bash
npm install
npm run dev
```

### 4. Execute testes

```bash
npm test
```

## 📱 PWA

A aplicação é instalável como PWA:
- Funciona offline (cache via Service Worker)
- Instalável no iOS e Android
- Theme color: verde #16a34a

## 🔐 Funcionalidades

- Autenticação Google OAuth
- Palpites em tempo real (travados 10min antes do jogo)
- Palpites especiais (campeão, vice, artilheiro)
- Ranking em tempo real
- Painel admin para gestão
