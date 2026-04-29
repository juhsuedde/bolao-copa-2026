# ⚽ Bolão Copa 2026

Aplicação web (PWA) para bolão entre amigos durante a Copa do Mundo de 2026 — versão demo interativa para portfolio.

> 🔗 **Live Demo**: [bolao-copa-2026-ten.vercel.app](https://bolao-copa-2026-ten.vercel.app)

---

## 🚀 Sobre o Projeto

O Bolão Copa 2026 é uma aplicação completa de palpites esportivos desenvolvida para demonstrar habilidades full-stack com stack moderna. A versão atual é uma **demo estática interativa** — todos os dados são mockados localmente, permitindo que visitantes explorem 100% da interface, fluxos de palpites, ranking e painel admin sem necessidade de autenticação ou backend ativo.

A arquitetura original foi construída com Supabase (PostgreSQL + Auth + Realtime), e a migração para modo demo preserva toda a estrutura de tipos, hooks e componentes, demonstrando capacidade de abstração e manutenibilidade de código.

---

## 🛠️ Tecnologias Utilizadas

| Camada                      | Tecnologia                                              |
| --------------------------- | ------------------------------------------------------- |
| **Frontend**                | React 18 + TypeScript                                   |
| **Build Tool**              | Vite                                                    |
| **Estilização**             | Tailwind CSS                                            |
| **Gerenciamento de Estado** | React Query (TanStack Query)                            |
| **Backend Original**        | Supabase (PostgreSQL + Auth + Realtime)                 |
| **Arquitetura Demo**        | Mock layer com flag de ambiente (`VITE_USE_MOCK`)       |
| **Plataforma**              | PWA (Progressive Web App) — instalável em iOS e Android |
| **Cache**                   | Service Worker + estratégia stale-while-revalidate      |

---

## ✨ Funcionalidades

- ✅ **Autenticação simulada** — usuário demo logado automaticamente, sem redirecionamentos OAuth
- ✅ **Palpites em jogos da fase de grupos** — interface completa com datas, horários e grupos
- ✅ **Palpites no mata-mata** — suporte a prorrogação e pênaltis
- ✅ **Palpites especiais** — campeão, vice-campeão e artilheiro
- ✅ **Ranking em tempo real** — tabela de classificação com pontuação automática
- ✅ **Painel Admin** — gestão de jogos e resultados (visualização demo)
- ✅ **PWA instalável** — funciona offline, otimizado para mobile
- ✅ **Design mobile-first** — experiência nativa em iOS/Safari e Android

---

## 🎯 Sistema de Pontuação

| Acerto                  | Pontos |
| ----------------------- | ------ |
| Placar exato            | 10 pts |
| Vencedor correto        | 3 pts  |
| Prorrogação (mata-mata) | 2 pts  |
| Pênaltis (mata-mata)    | 2 pts  |

---

## 🚀 Como Executar

```bash
# Clone o repositório
git clone https://github.com/juhsuedde/bolao-copa-2026.git
cd bolao-copa-2026

# Instale as dependências
npm install

# Execute em modo demo (dados mockados, sem Supabase)
npm run dev
```

> O modo demo está ativo por padrão via `VITE_USE_MOCK=true`.

---

## 🔧 Variáveis de Ambiente

```env
# Modo demo (padrão)
VITE_USE_MOCK=true

# Para reativar o backend Supabase (modo produção):
# VITE_USE_MOCK=false
# VITE_SUPABASE_URL=sua_url_supabase
# VITE_SUPABASE_ANON_KEY=sua_chave_anon
```

---

## 📸 Screenshots

_(Adicione aqui screenshots das principais telas: Home, Jogos, Ranking, Palpites)_

---

## 📝 Notas Técnicas

- **TypeScript strict**: 100% dos componentes e hooks tipados
- **React Query**: cache, loading states e error handling padronizados
- **Tailwind CSS**: design system consistente, sem CSS modules
- **Mobile-first**: breakpoints otimizados para smartphones
- **Acessibilidade**: contrastes validados, navegação por teclado

---

## 📄 Licença

MIT — sinta-se livre para usar como referência ou inspirar seus próprios projetos.

---

> 💡 **Quer ver a versão com backend real?** A arquitetura com Supabase (Auth OAuth, PostgreSQL com triggers de pontuação automática e Realtime) está preservada no histórico de commits e pode ser reativada alterando `VITE_USE_MOCK`.
