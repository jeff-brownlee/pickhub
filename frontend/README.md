# Pickhub UI Kit (MUI)
Minimal component bundle + sample JSON data for Picks and Leaderboard pages.

## Quick start
1. Copy `public/data/*` into your app's public folder.
2. Copy `src/*` into your project (or import components individually).
3. Render `<PicksPage />` or `<LeaderboardPage />` in your router.

## Data contracts
- `/public/data/personas.json` → Persona[]
- `/public/data/games_week{N}.json` → Game[]
- `/public/data/picks_{personaId}_week{N}.json` → Record<gameId, Pick>
- `/public/data/leaderboard_week{N}.json` → Array<{ personaId, metrics: PersonaMetrics }>

## Notes
- Dark theme, no league marks/logos—colors only.
- Uses MUI v6 Grid prop: `size={{ xs: 12, sm: 6 }}`.
- You can replace JSON fetches with your API endpoints without changing component props.

## Router wiring
- Uses react-router-dom v6.
- Entry: `src/main.tsx` → `src/App.tsx`.
- Routes: `/picks`, `/leaderboard`.


## Full quick start (fresh folder)
1. Unzip this bundle into an empty folder.
2. `npm install`
3. `npm run dev`
4. Open the browser if it doesn't open automatically: http://localhost:5173

Routes:
- /picks — Picks page demo using JSON under /public/data
- /leaderboard — Leaderboard page demo

You can replace the JSON files with your real API and keep the same component props.
