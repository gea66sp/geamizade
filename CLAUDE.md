# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

GE Amizade — institutional website and members' portal for Grupo Escoteiro Amizade 66/SP (a Brazilian scouting group). Next.js 16 (App Router) + React 19 + TypeScript, Prisma/PostgreSQL, NextAuth for authentication, Tailwind CSS v4. UI copy, comments, and identifiers are in Portuguese — match that when adding code.

## Commands

```bash
npm run dev      # start dev server (Next.js 16, Turbopack is the default bundler)
npm run build    # production build (runs `prisma generate` first via postinstall)
npm run start    # start production server
npm run lint       # eslint . (eslint.config.mjs, flat config)
npm test           # vitest run
npm run test:watch # vitest (modo interativo)
```

**Lint is at zero errors — keep it there.** The `next lint` script was removed in Next.js 16 and replaced with `eslint .`; that fix exposed ~150 pre-existing errors which have since all been cleared. `no-explicit-any` is the rule that regresses most easily: prefer the shared shapes in `src/types/dashboard.ts` and the helpers in `src/lib/errors.ts` (`getErrorMessage`, `getPrismaErrorCode`, `isNextRedirectError`) over reaching for `any`. 39 warnings remain (mostly `@next/next/no-img-element`) and are not blocking.

**Tests** (Vitest, `src/lib/*.test.ts`) cover the rules that are expensive to break silently: the notification hierarchy and guardian-copy fan-out, the RSVP guardian lock, the cron job's idempotency, and `sanitizeRichHtml` (the blog's XSS surface, since members can submit HTML). **They mock Prisma deliberately** — the project has a single production Supabase database, so a suite that touched it would be dangerous and slow. `src/lib/__mocks__/prismaMock.ts` holds the shared mock. Test the *rules* here; verify data plumbing against the real database with a throwaway script instead.

Prisma:
```bash
npx prisma generate        # regenerate client after schema.prisma changes
npx prisma migrate dev     # create/apply a migration in development
npx prisma db seed         # run prisma/seed.ts (creates an ADMIN user, admin@geamizade.org.br)
npx prisma studio          # inspect the database
```

Requires a `DATABASE_URL` (PostgreSQL) and, for auth/uploads/captcha, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `BLOB_READ_WRITE_TOKEN`, `RECAPTCHA_SECRET_KEY`, `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`. The scheduled job additionally needs `CRON_SECRET` (see below).

`DATABASE_URL` points at Supabase's **transaction-mode pooler** (port 6543, `pgbouncer=true`) while `DIRECT_URL` points at the **session-mode pooler** (port 5432). The datasource block declares both — `directUrl` is mandatory here because pgbouncer in transaction mode doesn't support the advisory locks Prisma's schema commands need.

## Architecture

**Path alias**: `tsconfig.json` maps `@/*` to the repo root (`./*`), not to `src/`. Imports therefore look like `@/src/lib/prisma` and `@/src/components/...`, not `@/lib/...`. Match this exactly — importing `@/lib/prisma` will fail.

**Route groups** under `src/app/`:
- `(main)` — public site: home, `blog`, `institucional`, `portal-da-transparencia` (public transparency/document portal), `tropas`, `privacidade`. Uses `src/components/main/*` (Navbar, Footer, etc.).
- `(dashboard)` — authenticated portal, split into one area **per `Role`**: `admin/`, `chefe/`, `membro/`, `responsavel/`. There is no shared `(dashboard)/layout.tsx`; each area has its own `layout.tsx` that (a) calls `getDashboardSessionState()`, (b) renders `<SessionKeeper />` instead of the page when the "remember me" barrier trips, and (c) `redirect(getHomeRouteForRole(userRole))` when the logged-in user's role doesn't match that area. Role → area:
  - `admin/` — `ADMIN`, `DEVELOPER`, `FINANCEIRO`. The fully built-out area: `usuarios`, `financeiro` (+ `relatorio`), `tropas` (+ `[id]`), `blog`, `patrimonio`, `calendario`, `transparencia`, `personalizar`, `perfil`.
  - `chefe/` — `CHEFE` only. Sections `tropa`, `calendario`, `financeiro`, `patrimonio`, `notificacoes` and `blog` (+ `perfil`), all scoped to troops where `managerId === user.id`; the layout shows an empty state when the chefe manages no troop.
  - `membro/` — `MEMBER` only. `calendario`, `notificacoes`, `blog` (submit posts for review — requires the member to have a `troopId`) + `perfil`.
  - `responsavel/` — `RESPONSAVEL` only. `dependentes` (+ `[id]`: each dependent's finances and documents), `calendario` (authorize each dependent's attendance), `notificacoes` (includes the guardian copies) + `perfil`.
- `login` — credentials login page.
- `api/auth/[...nextauth]` — NextAuth route handler; `api/upload` — Vercel Blob client-upload handler (requires an authenticated session; see allowed content types/size there).

**`src/proxy.ts` only checks that a token exists** (`authorized: ({ token }) => !!token`) for `/admin`, `/chefe`, `/membro`, `/responsavel`, `/perfil`. All role enforcement happens in the area `layout.tsx` files and, independently, in every server action. The file uses Next.js 16's `proxy` convention (which replaced `middleware`); its `next-auth/middleware` import is the NextAuth package path and is unrelated to the renamed file convention.

**Dashboard session + routing helpers**:
- `src/lib/dashboardAccess.ts` → `getDashboardSessionState()` centralizes what each area layout needs: it validates the session, applies the "remember me" barrier (`rememberMe === false` + missing `scout_active_session` cookie → `needsSessionKeeper`), and re-fetches `name`/`role`/`image` **fresh from the database** so a stale JWT can't show an old role/avatar.
- `src/lib/roleRouting.ts` → `getHomeRouteForRole(role)` is a **pure** function (no server imports) mapping a role to its home route (`/admin`, `/chefe`, `/membro`, `/responsavel`, or `/` fallback). Used both server-side (layout redirects) and client-side (`LoginClient` post-login redirect). `dashboardAccess.ts` re-exports it.
- `src/lib/auth.ts` → `getAuthUser()` returns the full `User` row looked up by session email (fresh data), for use in dashboard pages/actions that need more than name/role/image.

**Server Actions, not a REST API layer**: business logic lives in `actions.ts`/`actions.tsx` files colocated with each section (e.g. `admin/usuarios/actions.ts`, `admin/financeiro/actions.ts`, `admin/tropas/actions.ts`, `admin/blog/actions.ts`, `membro/blog/actions.ts`, `admin/patrimonio/actions.tsx`, `admin/calendario/actions.tsx`, `admin/transparencia/actions.ts`, `admin/personalizar/actions.ts`, `admin/perfil/actions.ts`). These are `"use server"` functions called directly from client components — there is no separate API route layer for CRUD. **Every action independently re-checks the session (`getServerSession(authOptions)` or `getAuthUser()`) and the caller's `Role` before touching the database** — follow this pattern rather than relying on proxy/layout gating. A `"use server"` file may only export async functions, so shared **synchronous** helpers live elsewhere (see `src/lib/blogPost.ts`).

**Blog review workflow**: `BlogPost.status` is a `PostStatus` enum (`DRAFT`, `PENDING_REVIEW`, `PUBLISHED`, `REJECTED`) — it replaced an old `published` boolean. Members create posts via `membro/blog/actions.ts` (`submitMemberPost` → `PENDING_REVIEW`, and may edit/delete only while `PENDING_REVIEW`/`REJECTED`); chefes and admins approve/reject via `admin/blog/actions.ts` (`approveBlogPost`, `rejectBlogPost`, `setBlogPostStatus`), which stamp `reviewedById`/`reviewedAt`/`rejectionReason`. Only `PUBLISHED` posts render on the public site. Shared slug/sanitize/strip helpers are in `src/lib/blogPost.ts` (imported by both admin and membro blog actions). Actions call `revalidatePath` for every affected surface (`/membro/blog`, `/chefe/blog`, `/admin/blog`, `/`, `/blog`, `/blog/[slug]`).

**Dashboard shells** (`src/components/dashboard/*`): `admin/AdminShell` and `chefe/ChefeShell` are sidebar layouts with many nav items; `SimpleShell` is a parametrized top-nav shell (`title`, `homeHref`, `navItems`) shared by the `membro` and `responsavel` areas. All four mount `NotificationBell` in both their desktop nav and their mobile header.

**Notifications module** — the one piece of cross-cutting logic that is *not* colocated with a route, because all four areas use it:
- `src/lib/notificationAccess.ts` — pure (client+server) permission predicates and label/style maps. `isGlobalNotifier(user)` defines the "Diretoria" tier: role `ADMIN`/`DEVELOPER`/`FINANCEIRO` **or** `branch === "DIRETORIA"`.
- `src/lib/notifications.ts` — server module (no `"use server"`, so it can export types and sync helpers). `getViewerContext()` resolves the caller into a `NotifierKind` by precedence — `GLOBAL` > `CHEFE` (manages ≥1 troop) > `MONITOR` (leads ≥1 patrol) > `NONE` — plus `managedTroopIds`/`ledPatrolIds`. **`resolveAudience()` is the hierarchy gate**: it re-derives and validates recipients server-side and throws if the sender reaches outside their scope; never trust the audience the client submitted. **`dispatchNotifications()` is the only writer**: it fans out one row per recipient and, for every `MEMBER`, an extra **copy row per guardian** (`FamilyTie`) whose title is prefixed `Notificação para {nome}:` and which carries `forDependentId`. It swallows its own errors so an automatic trigger can never break the financial/inventory write that called it.
- `src/lib/notifications.actions.ts` — `"use server"` wrappers callable from client components; each re-checks the session via `getViewerContext()`.
- `NotificationRequest` is the audit/outbox record behind every manual send. Admin/Chefe sends are born `APPROVED` and dispatch immediately; `MONITOR` sends are born `PENDING_APPROVAL`, notify the managing chefe, and only dispatch on approval (which **re-resolves** the audience, since patrol membership may have changed).
- Panel scoping: `GLOBAL` sees/deletes everything; `CHEFE` is filtered to `troopId ∈ managedTroopIds` — `Notification.troopId` is denormalized at send time precisely so this filter is a single indexed column.
- **Automatic triggers** live in the existing actions: `admin/financeiro/actions.ts` (create/update/delete of a transaction with a `userId`) and `admin/patrimonio/actions.tsx` (`assignedUserId` → the member; `troopId` → the troop's manager; `patrolId` → manager + leader + subLeader; `checkoutItem` → the borrower). They compare against the previous row so an unrelated edit doesn't re-notify. Creating a calendar event also notifies its audience (see below).

**Calendar & RSVP module** — mirrors the notifications layout and deliberately **reuses `getViewerContext()`** rather than defining a second permission mechanism:
- `src/lib/eventAccess.ts` — pure helpers: `isRsvpOpen` (deadline is `rsvpDeadline ?? startDate`), `canEditEvent` (GLOBAL anything; CHEFE only non-global events of a managed troop), `canViewAttendance` (CHEFE also sees global events, filtered to their own section).
- `src/lib/events.ts` — `getVisibleEvents(ctx)` builds the per-role visibility filter; the **`RESPONSAVEL` case is the special one**: they have no troop of their own and see events through their dependents' troops/patrols via `FamilyTie`. `setRsvp()` holds the hierarchy rule (below). `saveEvent`/`deleteEvent` live here, not in a route folder.
- **RSVP hierarchy**: a youth records intent; the guardian's decision **overrides and locks**. `EventRSVP.isGuardianDecision` is that lock — once true, the youth's own call is refused, but the guardian can still change it. Answering for someone else requires a `FamilyTie`. "Hasn't answered" is the **absence of the row**, not a third status value.
- Shared UI in `src/components/dashboard/calendar/`: `CalendarGrid` (presentational month grid + mobile agenda), `EventDetailModal` (RSVP panel, one row per dependent for guardians), `AttendanceList`, `EventFormModal`, composed by `CalendarClient`. All four areas render `CalendarClient`; only the props (`canCreate`, `allowGlobal`, `troops`) differ.

**Scheduled jobs (Vercel Cron)**: `vercel.json` declares the project's cron jobs; `src/app/api/cron/lembretes/route.ts` is the first one — a daily RSVP reminder. Four things to know before touching or adding one:
- **Schedules are UTC.** `0 11 * * *` is **08:00 in Brasília** (UTC-3, no DST). Getting this wrong is the classic bug here.
- **On the Hobby plan a cron may run at most once per day, and a more frequent expression fails the deployment** — not a warning, the build breaks. Hobby also fires anywhere within the given hour; paid plans fire within the minute.
- **Delivery is best-effort with no retries**: Vercel may skip a run *or invoke the same one twice*. Every job here must therefore be **idempotent and reconciliation-based**. `sendRsvpReminders()` in `src/lib/events.ts` is the reference implementation: it scans a 48h window (so a missed run catches up the next day) and claims each event with an atomic compare-and-set on `Event.rsvpReminderSentAt` (`updateMany` with `rsvpReminderSentAt: null` in the `where`) *before* dispatching, so two concurrent invocations cannot both notify.
- **Auth**: Vercel sends `CRON_SECRET` as an `Authorization: Bearer …` header. The route checks `!process.env.CRON_SECRET` too, so a missing secret **fails closed** (401) rather than leaving an endpoint that can notify the whole group. Set `CRON_SECRET` in the Vercel dashboard (≥16 random chars); without it the reminder silently never sends.

Cron isn't executed by `next dev` — test by calling the route directly with the Bearer header against `npm run start`. The route must return 200; a 3xx is treated as final and the job ends.

**Out of scope — progression and medical records**: the client removed both; a national system owns them. They are handled here as **uploaded documents** (`Document` with `ownerId`), not structured fields. The `Progression` model was dropped from the schema. Do not reintroduce either as a feature.

**Auth** (`src/lib/auth.ts`): NextAuth with `CredentialsProvider` only (email/password via bcrypt), Prisma adapter, JWT session strategy (`maxAge` 30 days). `authorize()` also verifies a Google reCAPTCHA token before checking the password. A `rememberMe` flag flows login form → `authorize()` → JWT → session; combined with a `scout_active_session` cookie (set client-side, checked via `getDashboardSessionState`) it forces logout on browser close when the user didn't opt into "remember me". Session/User/JWT types are augmented in `src/types/next-auth.d.ts` to carry `id`, `role` (`Role` enum), and `branch`.

**Data model** (`prisma/schema.prisma`): centers on `User` with a `Role` enum (`ADMIN`, `DEVELOPER`, `FINANCEIRO`, `CHEFE`, `RESPONSAVEL`, `MEMBER`) and a `Branch` enum (`LOBINHO`, `ESCOTEIRO`, `SENIOR`, `PIONEIRO`, `DIRETORIA`) representing the scouting age sections. Key relations:
- `Troop` (tropa) → `Patrol` (patrulha) → `User` members, each with adult (`manager`) and youth (`leader`/`subLeader`) leadership fields.
- `FamilyTie` links a `RESPONSAVEL` (guardian) to a `MEMBER` (dependent/youth), many-to-many via join fields (`guardianId`/`dependentId`).
- Financial (`FinancialTransaction`) and inventory (`InventoryItem`/`ItemLoan`) records can be scoped to a `User`, `Troop`, or `Patrol` independently — check which foreign key(s) are set to determine the cost-center/owner.
- CMS/transparency module (`Folder`/`Document`) supports nested folders and per-item public/restricted visibility with explicit `allowedViewers`/`allowedEditors` user lists, separate from the `Role`-based checks used elsewhere.
- `Notification` has **four** relations to `User` — `user` (recipient, `"UserNotifications"`), `sender`, `forDependent` (the youth a guardian copy is about), plus `troop` — so every one of them must be named. `NotificationRequest` holds the manual-send audit trail. `InventoryItem.assignedUserId` is the individual-custody link that drives the personal patrimony trigger.
- `InstitutionalPage`, `HomePageSettings`, `Faq` are largely singleton-style content tables editable from `admin/personalizar` and rendered on the public site.

**File uploads**: go through Vercel Blob's client-upload flow (`@vercel/blob/client`, `api/upload/route.ts`), not a local filesystem — server actions that handle documents/images typically call `del()` from `@vercel/blob` to clean up the old blob when a record is replaced or removed (see `usuarios/actions.ts` for the pattern).

**Blob privacy — READ THIS BEFORE TOUCHING UPLOADS.** `Document.isPublic` is *only a database flag*; it does not protect the file. A blob stored with `access: "public"` is readable by anyone holding the URL, with no session, forever — that includes medical forms and restricted transparency documents.

**The project's Blob store is currently configured as PUBLIC, and a public store rejects `access: "private"` outright** (`Cannot use private access on a public store`). So this cannot be fixed in code alone. `src/lib/blobAccess.ts` holds the seam:
- `BLOB_ACCESS` resolves to `"private"` only when **`NEXT_PUBLIC_BLOB_PRIVATE="true"`** is set; every upload uses it. The `NEXT_PUBLIC_` prefix is **required, not cosmetic**: the transparency portal uploads from the *browser* (Vercel client upload), and the browser only receives prefixed variables. A non-prefixed name would read as `undefined` there and that upload would silently stay public even after the store was switched. One variable for both sides also prevents the server writing private while the client writes public.
- `readBlob(url)` detects public vs private **from the URL itself**, so both coexist during a migration.

**To actually close the hole**: provision a private Blob store in the Vercel dashboard, set the new `BLOB_READ_WRITE_TOKEN` plus `NEXT_PUBLIC_BLOB_PRIVATE="true"`, then **redeploy** (the flag is inlined into the client bundle at build time) and migrate existing files (`copy` to private → update `Document.fileUrl` → verify → `del` the old one, in that order, so a failure leaves the original intact). Do **not** flip the flag before the store exists — uploads fail with `Cannot use private access on a public store`.

Until then, the download routes still enforce authorization for anything reached through the UI:
- `src/app/api/documentos/[id]/route.ts` — authenticated. Personal docs: owner, guardian via `FamilyTie`, or management. Portal docs: `isPublic` (any logged-in user) or the explicit `allowedViewers`/`allowedEditors` lists. Returns **404, never 403** — a 403 would confirm the document exists.
- `src/app/(main)/portal-da-transparencia/arquivo/[id]/route.ts` — public, no session, serves **only** `isPublic` documents.

Profile photos stay public deliberately: they render in `<img>` across the whole UI and are not sensitive.

**Password policy** (`src/lib/passwordPolicy.ts`): one pure module — 8+ chars with upper, lower, digit and symbol — feeding both the live checklist in `PasswordFields` and `assertPasswordPolicy` in every server path that writes a password. **All five write points enforce it** (admin create/update, chefe registering a youth, own profile change, forced change, Diretoria reset); a policy that misses one path is decided by that path. Letter classes use `\p{Lu}`/`\p{Ll}` rather than `[A-Z]`, so "Ângela" counts as having an uppercase letter; whitespace deliberately does *not* count as a symbol.

**Password reset by Diretoria** (`resetUserPassword` in `admin/usuarios/actions.ts`): restricted to `ADMIN`/`DEVELOPER` or `branch === "DIRETORIA"` — deliberately *not* `ALLOWED_MANAGERS`, which includes `FINANCEIRO`. It sets `mustChangePassword: true`, so whoever resets hands over a provisional password and never learns the real one, and it notifies the account owner that their password changed. The optional password field was **removed from the edit-user modal**: two paths with different rules (one forcing a change, one not) would be an inconsistency.

**Granting roles — allow-list, never deny-list** (`src/lib/userAccess.ts`): `grantableRoles(actorRole)` returns what each role may *create*. It replaced a deny-list (`restrictedRoles`) that had a structural flaw: a new `Role` added to the enum was implicitly grantable by everyone. That flaw is why `FINANCEIRO` can still create `CHEFE` (preserved deliberately, worth revisiting), and it would have let a chefe create another chefe the moment they got access to registration. **Keep it an allow-list** — a new role should be grantable by nobody until someone decides otherwise. A test walks the whole actor × target matrix.

**Chefe registering youths** (`src/lib/troopMembers.ts`): deliberately separate from `admin/usuarios/actions.ts`, whose `updateUser` rewrites role, branch and family ties. Here the **role is not a parameter** — `createTroopMember` hardcodes `MEMBER`, so there is no field to tamper with and no validation to forget. `updateTroopMemberBasics` accepts only name/email/phone for the same reason. Accounts created this way get `mustChangePassword: true`.

**Forced password change**: `getDashboardSessionState()` reads `mustChangePassword` fresh from the database each request and returns `needsPasswordChange`; all four area layouts render `<ForcePasswordChange />` **instead of** the page — the same barrier pattern as `SessionKeeper`. It is not a route on purpose: there is no URL to bypass, and the check runs on the server before any page content exists.

**Section finance & assets** (`src/lib/finance.ts`): `canManageTransaction(ctx, scope)` decides by **scope, not by role alone**. A transaction with no troop and no patrol is the group's **caixa geral** and belongs to the Diretoria — a `CHEFE` is refused. The function is async on purpose: a `patrolId` must be resolved up to its troop before comparing, because trusting the client's `troopId` would let someone submit another troop's patrol alongside their own troop id. `updateTransaction` checks **both ends** — the transaction as it is *and* as it will be — otherwise a chefe could pull a caixa-geral entry into their troop, or push one out. Same idea as `saveEvent`. For assets the chefe only lends and receives back (`canLendItem` + `canLendToUser`, which also requires the borrower to be in that section); create/edit/discharge stay with the Almoxarifado.

**Profile pages** are one shared `src/components/dashboard/perfil/ProfilePageContent.tsx`; each area's `page.tsx` is an 11-line wrapper. The profile components and their server actions live in `src/components/dashboard/perfil/` and `src/lib/profile.actions.ts` — no longer under `admin/`, which the other three areas used to import across.

**Guardian area** (`src/lib/guardian.ts` + `guardian.actions.ts`): `assertIsGuardianOf(ctx, dependentId)` is the single gate — every read and write calls it first, and it checks `FamilyTie` in the `guardianId → dependentId` direction (reversing it would let a youth read their guardian's data). `getDependentsSummary` aggregates with two `groupBy` calls regardless of how many dependents there are; **multiple dependents is the normal case here** (a guardian with 3 children exists in the data, and a youth can have 2 guardians), so build for N, not for one. A document uploaded by a guardian gets `ownerId` = the *youth*, with the sender recorded in `description`.

**Notable libraries**: `recharts` (admin dashboard/report charts), `jspdf` + `jspdf-autotable` (client-side PDF reports, e.g. `financeiro/relatorio`), `framer-motion` (animations), `mermaid` (diagram rendering), `lucide-react` + Font Awesome classes for icons.
