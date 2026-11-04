# GE Amizade

Website institucional e portal de membros do **Grupo Escoteiro Amizade 66/SP**.

O sistema reúne o site público, o portal autenticado para a administração e as
áreas de chefes, membros e responsáveis legais. O conteúdo da interface, os
comentários e os identificadores do projeto são mantidos em português.

## Funcionalidades

- Site institucional, blog e páginas de transparência.
- Autenticação por credenciais com NextAuth e controle de acesso por função.
- Áreas específicas para `ADMIN`, `DEVELOPER`, `FINANCEIRO`, `CHEFE`,
  `RESPONSAVEL` e `MEMBER`.
- Gestão de usuários, tropas, patrulhas, calendário, finanças e patrimônio.
- Notificações com regras hierárquicas, auditoria e cópias para responsáveis.
- RSVP de eventos com decisão do responsável legal prevalecendo sobre a do jovem.
- Documentos pessoais e documentos públicos ou restritos de transparência.
- Uploads via Vercel Blob, com stores público e privado separados.
- Proteções para rotas sensíveis, uploads, downloads e URLs suspeitas.

## Stack

- [Next.js 16](https://nextjs.org/) com App Router e React Server Components.
- [React 19](https://react.dev/) e [TypeScript](https://www.typescriptlang.org/).
- [Tailwind CSS v4](https://tailwindcss.com/).
- [Prisma](https://www.prisma.io/) com PostgreSQL.
- [NextAuth](https://next-auth.js.org/) para autenticação.
- [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) para arquivos.
- Vitest para testes automatizados.
- Lucide React, Recharts, Framer Motion e bibliotecas auxiliares.

## Requisitos

- Node.js 20 ou superior.
- PostgreSQL acessível pelo Prisma.
- Tokens configurados para os stores do Vercel Blob.

## Instalação

```bash
npm install
npx prisma generate
```

Crie um arquivo `.env` local. Nunca versione esse arquivo nem compartilhe seus
valores:

```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"

BLOB_READ_WRITE_TOKEN="token-do-store-publico"
PRIVATE_STORE_ID="id-do-store-privado"
PRIVATE_READ_WRITE_TOKEN="token-do-store-privado"

NEXT_PUBLIC_RECAPTCHA_SITE_KEY="..."
RECAPTCHA_SECRET_KEY="..."
CRON_SECRET="..."
```

`BLOB_READ_WRITE_TOKEN` deve existir uma única vez no arquivo e representar o
store público. `PRIVATE_STORE_ID` identifica o store privado e
`PRIVATE_READ_WRITE_TOKEN` é o token usado para acessá-lo. Os valores acima são
apenas ilustrativos.

## Desenvolvimento

```bash
npm run dev
```

A aplicação fica disponível em <http://localhost:3000>.

## Comandos

```bash
npm run dev       # desenvolvimento com Turbopack
npm run build     # build de produção
npm run start     # inicia o build de produção
npm run lint      # ESLint
npm test          # testes Vitest
npm run test:watch
```

## Prisma

```bash
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npx prisma studio
```

O seed cria um usuário administrativo para desenvolvimento. Altere as
credenciais conforme necessário e nunca use credenciais de desenvolvimento em
produção.

## Arquivos e Blob

O sistema usa dois stores independentes:

- **Store público:** documentos marcados como públicos e imagens públicas do
  site, blog e parceiros.
- **Store privado:** fotos de perfil, documentos pessoais e documentos de
  transparência marcados como restritos.

Documentos privados são entregues por rotas autenticadas, e as imagens de
usuários são exibidas através de uma rota autorizada. A coluna `isPublic` do
banco não protege sozinha um arquivo Blob; a proteção depende do store privado
e da autorização da aplicação.

Depois de configurar os tokens, a migração de arquivos existentes deve ser
executada primeiro em modo de simulação:

```bash
npm run blob:migrate
```

Após conferir a lista, execute a aplicação:

```bash
node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/migrate-blob-access.ts --apply
```

O script copia e valida o arquivo, atualiza o banco e só então tenta remover o
original. Em caso de erro, o original é preservado.

## Estrutura principal

```text
src/app/(main)                 Site público
src/app/(dashboard)/admin      Administração
src/app/(dashboard)/chefe      Área de chefes
src/app/(dashboard)/membro     Área de membros
src/app/(dashboard)/responsavel Área de responsáveis
src/app/api                    Uploads, downloads e autenticação
src/components/dashboard       Componentes compartilhados do portal
src/lib                         Regras de negócio e ações do servidor
prisma/schema.prisma            Modelo de dados
scripts                         Scripts operacionais
```

As regras de autorização devem ser verificadas novamente em cada Server Action
ou rota. O proxy apenas confirma a existência de uma sessão; ele não substitui
as verificações de função, escopo ou relacionamento familiar.

## Jobs agendados

Os jobs da Vercel são declarados em `vercel.json`. O cron de lembretes de RSVP
usa `CRON_SECRET` e foi implementado para ser idempotente, pois a Vercel pode
repetir uma chamada ou não executar uma chamada. Os horários do cron são UTC.

## Segurança e produção

- Nunca commite `.env`, tokens, senhas ou URLs de conexão.
- Configure as variáveis em **Production** e **Preview** na Vercel.
- Use rate limiting e regras de firewall principalmente em login, upload e
  rotas sensíveis.
- Faça backup antes de migrações de arquivos ou alterações de schema.
- Verifique documentos públicos e restritos após cada deploy.
- O Blob privado precisa estar provisionado antes de habilitar uploads privados.

## Licença

Este projeto é proprietário. Consulte [LICENSE](./LICENSE) para os termos de
uso, cópia, modificação e redistribuição.

## Desenvolvimento

Desenvolvimento de software e sistemas web:
[LEVBRANDS](https://levbrands.com.br/).
