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

## 📌 Status Atual do Projeto

- [x] Definição de regras e sistema de pontuação
- [x] Protótipo UI mobile-first criado e validado
- [x] Modelagem do banco de dados relacional concluída (tabelas de usuários, times, partidas e palpites)
- [x] Configuração do Supabase e trigger automático de usuários
- [x] Setup inicial do frontend com Vite e roteamento
- [ ] Conexão das páginas principais (Início, Jogos, Especiais, Ranking) com o banco
- [ ] Lógica de triggers/functions para cálculo automático de pontuação
