# Control de Readaptació

Aplicació web (PWA, instal·lable al mòbil) per al seguiment i la readaptació de jugadors lesionats.
**Només hi té accés l'equip de readaptació**: els jugadors són fitxes de dades, no usuaris.

## Funcionalitats

| Mòdul | Què inclou |
|---|---|
| **Panell** | Jugadors en readaptació amb semàfor del wellness d'avui, setmana de recuperació (post-lesió o post-IQ), sessions fetes, càrrega setmanal (sRPE) vs setmana anterior i pitjor LSI. Comptadors de jugadors sense wellness i d'alertes. |
| **Fitxa del jugador** | Nom, edat, posició, cama dominant, historial previ de lesions. Pestanyes: Resum · Wellness · Sessions · Tests · Lesions. Arxivar / eliminar. |
| **Lesions** | Diagnòstic, categoria, zona, costat, data de lesió, data d'intervenció (opcional), data d'alta. Setmana de tractament calculada automàticament. |
| **Wellness diari** | Qualitat i hores de son, fatiga, estrès, ànim, recuperació (1–5, 5 = millor), dolor EVA 0–10 + zones del cos. Puntuació 5–25 i semàfor. Un registre per dia (es pot editar). |
| **Sessions** | Exercicis amb vídeo (YouTube/Vimeo incrustat), sèries, reps, temps, càrrega, descans i RPE. RPE i durada de sessió → sRPE. Reordenar, duplicar una sessió per avui, marcar com a feta. |
| **Fatiga acumulada** | ACWR (aguda 7 d ÷ crònica 28 d) amb zones de risc, monotonia i strain de Foster, gràfic de càrrega diària amb mitjanes mòbils i evolució de l'ACWR, tendència del wellness (7 vs 28 dies) i registre diari de RPE, sRPE i wellness. L'ACWR en risc compta com a alerta al panell. |
| **Tractament a camilla** | Data, durada, tècniques aplicades (manuals, invasives, electroteràpia, vendatges…), zones tractades, dolor EVA abans i després, observacions. Resum de tractaments, minuts i canvi de dolor mitjà. |
| **Carrera i camp** | Minuts, distància, velocitat màx./mitjana, esprints, acceleracions, desacceleracions, canvis de direcció, tipus de treball. Gràfic de distància setmanal. |
| **Tests físics** | Força, mobilitat, CMJ, hop, isomètrics i específics. Baseline (pre-lesió o primer valor), % de millora/dèficit, LSI entre costats, tests "menys és millor" (temps). Gràfic d'evolució amb línia de baseline. |
| **Biblioteca d'exercicis** | Exercicis reutilitzables amb vídeo i indicacions. |

### Criteris de càlcul

- **Setmana de tractament**: des de la data de cirurgia si n'hi ha, si no des de la lesió. El dia 0 és la setmana 1.
- **Semàfor wellness**: 🟥 Alerta si dolor ≥ 5, algun ítem a 1 o total ≤ 12 · 🟨 Atenció si dolor ≥ 3, algun ítem a 2 o total ≤ 17 · 🟩 Bé la resta.
- **sRPE** = RPE de sessió × minuts (només sessions marcades com a fetes). Setmanes de dilluns a diumenge.
- **ACWR** = sRPE dels últims 7 dies ÷ mitjana setmanal dels últims 28 (òptim 0,8–1,3; risc > 1,5). **Monotonia** = mitjana diària ÷ desviació estàndard (7 dies); **strain** = càrrega setmanal × monotonia.
- **% vs baseline**: positiu = millora (té en compte si el test és de temps).
- **LSI** = costat lesionat / costat sa del mateix dia (objectiu habitual ≥ 90 %).
- Les dates es calculen en hora de Madrid (`src/lib/calc.ts`, `TIMEZONE`).

## Stack

- **Next.js 16** (App Router, Server Actions) + TypeScript + Tailwind CSS 4
- **Supabase**: Postgres + Auth. La seguretat es fa amb *Row Level Security*: cada readaptador només veu i modifica les seves dades.
- **Recharts** per als gràfics · **Vitest** per als tests dels càlculs

## Posada en marxa

### 1. Crear el projecte de Supabase

1. Crea un projecte a [supabase.com](https://supabase.com) (recomanat: regió **EU**, perquè són dades de salut).
2. A **SQL Editor**, executa en ordre els fitxers de `supabase/migrations/` (`20261007000000_esquema_inicial.sql` i després `20261008000000_tractaments.sql`).
   (O bé, amb la CLI de Supabase: `supabase link` + `supabase db push`.)
3. **Desactiva el registre públic** perquè ningú més pugui crear-se un compte:
   *Authentication → Sign In / Providers → desactiva "Allow new users to sign up"*.
4. Crea els usuaris readaptadors a *Authentication → Users → Add user* (correu + contrasenya, marcant "Auto Confirm User").

### 2. Configurar i executar l'app

```bash
cp .env.example .env.local   # i omple URL i clau publicable (Project Settings → API)
npm install
npm run dev                  # http://localhost:3000
```

### 3. Publicar (Vercel)

Importa el repositori a [vercel.com](https://vercel.com), afegeix les dues variables d'entorn de `.env.example` i desplega.
Des del mòbil, obre l'URL i fes *Afegeix a la pantalla d'inici* per tenir-la com una app.

## Scripts

| Ordre | Descripció |
|---|---|
| `npm run dev` | Servidor de desenvolupament |
| `npm run build` / `npm start` | Build i servidor de producció |
| `npm test` | Tests unitaris dels càlculs (setmanes, semàfor, càrrega, baseline, LSI…) |
| `npm run lint` · `npm run typecheck` | Qualitat de codi |

## Estructura

```
supabase/migrations/      Esquema SQL + polítiques RLS
src/proxy.ts              Protegeix totes les rutes (cal sessió) i refresca la sessió
src/lib/calc.ts           Càlculs purs (amb tests a calc.test.ts)
src/lib/actions.ts        Server Actions (totes les escriptures, cada una reverifica la sessió)
src/lib/data.ts           Lectures de dades
src/app/(app)/            Pantalles: panell, jugadors, sessions, tests, exercicis
src/components/           UI, formularis i gràfics
```

## Possibles millores

- Mode fora de línia (service worker + cua de sincronització) per a camps sense cobertura.
- Pujar vídeos propis a Supabase Storage (ara s'hi enganxen enllaços).
- Exportació a PDF/CSV per al cos mèdic.
- Equips compartits entre diversos readaptadors (ara cada readaptador té les seves dades).
