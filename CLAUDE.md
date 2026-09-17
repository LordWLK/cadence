# Cadence

PWA personnelle en français (installée sur iPhone) : planning hebdo d'activités avec récurrences et partage entre proches, check-in quotidien humeur/énergie avec stats, séances cinéma UGC (scraping), matchs sportifs (TheSportsDB), mode offline.

**Stack** : Next.js 16 (App Router, build webpack) · React 19 (React Compiler actif via eslint) · Supabase (auth OTP email + Postgres RLS) · Tailwind v4 (tokens dans `globals.css`) · Serwist (service worker) · pnpm.

## Commandes

```bash
pnpm install
pnpm dev                      # dev server port 3000 (cf. .claude/launch.json pour la preview)
npx tsc --noEmit              # typecheck — doit rester à 0 erreur
npx eslint src                # lint — doit rester à 0 problème
npx next build --webpack      # build de prod — la vraie validation
```

Déploiement : push sur `master` → Vercel auto-déploie. Sur iPhone, recharger l'app 2× pour que le service worker prenne la nouvelle version.

## Convention nº1 — Design system « Gazette × Brut »

Règle absolue : **ce qui se lit est éditorial, ce qui se touche est Brut.**

- **Éditorial (lecture)** : papier `#FBFAF5` / encre `#16150F`, serif display **Fraunces** (`--font-display`, `.font-display`, appliqué à `h1`–`h3`), labels de sections en classe **`.rubrique`** (petites capitales vermillon `#D33A24`), filets fins, cards plates coins quasi carrés (`Card.tsx`).
- **Brut (interaction)** : aplat jaune `--color-action` `#FFC61A`, bordure encre 2px, ombre dure `2-4px 0 var(--color-ink)`, enfoncement au tap via `.brut-press`. Encapsulé dans `Button.tsx` et les chips.
- **Rôles des couleurs** : vermillon `--color-primary` = information (rubriques, badges, liens) ; jaune `--color-action` = action uniquement ; encre bleue `--color-accent` `#274690` = le soir/la nuit/l'énergie. Ne JAMAIS mettre du jaune/ombre dure sur un élément non cliquable (seule exception validée : le StreakBadge, rendu cliquable exprès).
- Mode sombre = « encre inversée » (`[data-theme="dark"]` dans `globals.css`) ; jaune et vermillon inchangés.
- Tout est piloté par les tokens `@theme` de `src/app/globals.css` (y compris l'échelle `--radius-*` resserrée). Modifier les tokens, pas les composants, pour ajuster la teinte globale.

## Convention nº2 — Dates en HEURE LOCALE

Les clés de jour `yyyy-MM-dd` sont **locales**, jamais UTC. Interdits : `new Date().toISOString().split('T')[0]` (date UTC) et `new Date('yyyy-MM-dd')` (parse UTC → décalage d'un jour). À la place : `getTodayISO()` / `formatDateISO()` de `src/lib/utils/dates.ts`, et `parseISO()` de date-fns pour relire une date. Les timestamps TheSportsDB sont UTC : `useSportFeed` ajoute `Z` si le fuseau manque. Cette classe de bug a déjà causé plusieurs incidents — vigilance en revue.

## Supabase

- **Source de vérité du schéma : `src/lib/supabase/types.ts`** — les `.sql` à la racine sont partiels/historiques (le schéma live a divergé).
- `supabase-audit-fixes-migration.sql` : migration corrective idempotente (contraintes, colonnes, RLS durcie, triggers anti-escalade) — **appliquée** sur le projet live (juillet 2026).
- `supabase-profiles-restrict-migration.sql` : optionnelle, anti-moissonnage d'emails (restreint la lecture des profils à soi + contacts ; la recherche passe par la RPC `search_profile_by_email` que le client préfère déjà avec repli). Statut d'application : à vérifier auprès du propriétaire avant d'en dépendre.
- Pas de `.env` commité : config Supabase via `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` (Vercel) ou saisie in-app (localStorage, cf. `ConfigProvider`). Aucune migration ne peut être appliquée depuis le code — passer par le SQL Editor du dashboard Supabase.

## Architecture — repères

- `src/lib/hooks/` : toute la couche données (un hook par domaine ; erreurs remontées en booléens/null, jamais avalées silencieusement).
- `src/providers/` : Config → Supabase → Auth (l'objet `user` est stabilisé sur son id — ne pas casser, sinon refetch storm à chaque refresh de token).
- `useBacklog.autoPopulateRecurring` : cœur des récurrences (respecte `recurrence_freq` weekly/biweekly/monthly, anti-doublons par `backlog_id__planned_date` + skips dans `backlog_skip_dates`). Zone historiquement fragile — tester après toute modif.
- `src/app/api/cinema/showtimes/route.ts` : scraping UGC via cheerio — l'UGC change parfois ses classes CSS ; un parse vide sur page non-vide renvoie 502 et n'est pas mis en cache.
- Offline : `src/lib/utils/offlineQueue.ts` (IndexedDB) + `src/app/sw.ts` (Serwist ; l'ordre des matchers compte : le premier qui matche gagne).
- Les patterns `setState`-dans-effet légitimes portent des `eslint-disable` justifiés — ne pas les « nettoyer ».

## Qualité

Avant tout commit : `tsc` 0 erreur, `eslint` 0 problème, `next build` OK. Flux git : branche → merge fast-forward sur `master` → push (déclenche la prod). Messages de commit en français, préfixes `feat:`/`fix:`/`chore:`.
